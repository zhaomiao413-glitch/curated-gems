import os
import json
import time
import requests
import feedparser
from datetime import datetime
from bs4 import BeautifulSoup
import re
import json
from tag_manager import standardize_tags, update_prompt_with_predefined_tags

# ========== Basic Configuration ==========
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in environment variables.")

# Model name fallback (don't use || concatenation in YAML)
MODEL = os.getenv("OPENROUTER_MODEL") or "openai/gpt-3.5-turbo-0613"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

PROCESSED_LINKS_FILE = "scripts/processed_links.json"
OUTPUT_FILE = "data.json"
SOURCE_FILE = "scripts/source.json"

# Output and API call control
MAX_NEW_ITEMS = 5         # Maximum successful output items for this run (max 5 items you want)
MAX_API_CALLS = 8         # Maximum model API calls for this run (failures also count)
MAX_PER_SOURCE = 5        # Maximum candidate items sampled per source (candidates only, not final success count)
HTTP_TIMEOUT = 20         # Timeout seconds for web scraping/model calls
REQUEST_SLEEP = 0.2       # Light sleep to reduce rate limiting probability

# CSS selector list for extracting main content (can be expanded/adjusted as needed)
CONTENT_SELECTORS = [
    'div.post-content', 'div.entry-content', 'div.article-content',
    'div[itemprop="articleBody"]', 'article', 'main', 'div#main-content',
]

MAX_CONTENT_CHARS = 8000  # Maximum content truncation length before sending to model (character count)

# ========== Initialize File Read/Write ==========
# Load processed links
try:
    with open(PROCESSED_LINKS_FILE, 'r', encoding='utf-8') as f:
        processed_links = set(json.load(f))
except (FileNotFoundError, json.JSONDecodeError):
    processed_links = set()
print(f"Loaded {len(processed_links)} processed links.")

# Ensure data.json exists and is a valid JSON array
if not os.path.exists(OUTPUT_FILE) or os.path.getsize(OUTPUT_FILE) == 0:
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('[]')

# Calculate next ID
with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
    try:
        results = json.load(f)
        counter = (results[-1]['id'] + 1) if results else 1
    except (json.JSONDecodeError, IndexError, KeyError, TypeError):
        counter = 1
print(f"Next new entry ID will start from {counter}.")

# Load sources
with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
    sources = json.load(f)

# ========== Utility Functions ==========
def entry_pubdate(entry):
    """Get the publication time (datetime) of an entry. Return datetime.min if none exists for sorting to the end."""
    pp = entry.get('published_parsed')
    if pp:
        return datetime.fromtimestamp(time.mktime(pp))
    return datetime.min

def extract_full_content(link, rss_content_html):
    """Extract webpage content; if RSS already contains long content, use it directly; otherwise scrape webpage and extract content."""
    # First try RSS content (some sources have complete content)
    content_from_rss = ""
    if isinstance(rss_content_html, list) and rss_content_html:
        content_from_rss = rss_content_html[0].get('value', '') or ''
    elif isinstance(rss_content_html, str):
        content_from_rss = rss_content_html

    if len(content_from_rss) > 1000:
        return content_from_rss, "Content fully retrieved from RSS Feed."

    # RSS content is short, try to scrape webpage
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        resp = requests.get(link, headers=headers, timeout=HTTP_TIMEOUT)
        resp.raise_for_status()
    except Exception as e:
        return content_from_rss, f"RSS content is summary, webpage scraping failed: {e}, fallback to RSS summary."

    soup = BeautifulSoup(resp.text, 'html.parser')

    # Prioritize common content containers
    article_body = None
    for selector in CONTENT_SELECTORS:
        node = soup.select_one(selector)
        if node:
            article_body = node
            break

    # Fallback: remove navigation/footer/sidebar from body
    if not article_body:
        body = soup.find('body')
        if body:
            for tag in body.find_all(['nav', 'footer', 'header', 'aside']):
                tag.decompose()
            article_body = body

    if article_body:
        text = article_body.get_text(separator='\n', strip=True)
        return text, "Content extraction successful!"
    else:
        return content_from_rss, "Warning: Failed to extract main content, will use RSS summary."


def parse_json_safely(text):
    """
    Compatible with the following returns:
    - Pure JSON
    - ```json ... ``` or ``` ... ``` wrapped
    - Leading/trailing prompts/blank lines/spaces
    - Multiple text segments containing one or more {...} JSON blocks (take the first complete block)
    """
    # 1) Direct attempt
    try:
        return json.loads(text)
    except Exception:
        pass

    # 2) Remove ```json ... ``` / ``` ... ``` code fences
    fenced = re.search(r"```(?:json)?\s*(.+?)\s*```", text, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        inner = fenced.group(1).strip()
        try:
            return json.loads(inner)
        except Exception:
            text = inner  # Continue with subsequent steps

    # 3) Extract the first complete brace JSON block from the full text
    #    Use stack matching to avoid misjudgment caused by regex greediness
    start = text.find('{')
    while start != -1:
        stack = 0
        for i in range(start, len(text)):
            if text[i] == '{':
                stack += 1
            elif text[i] == '}':
                stack -= 1
                if stack == 0:
                    candidate = text[start:i+1]
                    try:
                        return json.loads(candidate)
                    except Exception:
                        break  # Try another starting point
        # Find next '{'
        start = text.find('{', start + 1)

    # 4) If all else fails, throw error and let upper layer record original text
    raise json.JSONDecodeError("No valid JSON object found", text, 0)


def call_openrouter(model, title, full_content):
    # Get updated prompt with predefined tags
    tags_instruction = update_prompt_with_predefined_tags()
    
    prompt_content = f"""
Please analyze the following article content and return the analysis results in the form of a JSON object.

The JSON object should contain the following keys:
- "title_zh": Chinese translation of the article title.
- "summary_en": English summary, no more than 100 words.
- "summary_zh": Chinese summary, no more than 100 words.
- "best_quote_en": Extract the most insightful English quote from the article.
- "best_quote_zh": Extract the most insightful Chinese quote from the article.
- {tags_instruction}
- "tags_zh": 3 Chinese keyword tags related to the article content, returned as a list (array).

Strict requirement: Only return a valid JSON object, **do not** include any code block fences (like ```json), leading/trailing prompts, or extra text.
Article title: {title}
Article content:
{full_content}
""".strip()

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    base_payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are a professional AI assistant skilled in content analysis and summarization. Please only return a valid JSON object, without ```, explanatory text, or extra characters."
            },
            {"role": "user", "content": prompt_content}
        ],
    }

    # Attempt 1: with response_format (more likely to get pure JSON)
    for attempt in (1, 2):
        data = dict(base_payload)  # Shallow copy
        if attempt == 1:
            data["response_format"] = {"type": "json_object"}
            print("[OpenRouter] Attempting to use response_format=json_object")
        else:
            print("[OpenRouter] Fallback retry without response_format")

        try:
            resp = requests.post(OPENROUTER_URL, headers=headers, json=data, timeout=HTTP_TIMEOUT)
            status = resp.status_code
            text = resp.text
            print(f"[OpenRouter] HTTP {status}")
            if status >= 400:
                print(f"[OpenRouter] Body: {text[:1000]}")
                # Some models will return 400 for response_format, proceed to next fallback attempt
                if attempt == 1:
                    continue
                resp.raise_for_status()
            # Parse response
            api_response = resp.json()
            if isinstance(api_response, dict) and api_response.get("error"):
                # If it's a clear API error and attempt 1, do fallback retry
                if attempt == 1:
                    print(f"[OpenRouter] API Error on attempt 1, will retry without response_format: {api_response['error']}")
                    continue
                return None, f"API Error: {api_response['error']}"

            content = api_response['choices'][0]['message']['content']
            try:
                analysis_data = parse_json_safely(content)
                return analysis_data, content
            except json.JSONDecodeError as e:
                # Attempt 1 failed, fallback; if attempt 2 still fails, return error
                if attempt == 1:
                    print(f"[Parse failed@attempt1] {e}; will fallback retry. First 500 chars: {content[:500]}")
                    continue
                return None, f"JSONDecodeError(after fallback): {e}; content: {content[:1000]}"

        except requests.HTTPError:
            if attempt == 1:
                continue
            return None, f"HTTPError: {resp.status_code}; body: {resp.text[:1000]}"
        except Exception as e:
            if attempt == 1:
                continue
            return None, f"RequestError: {e}"

    # Should theoretically never reach here
    return None, "Unknown error"

# ========== Stage 1: Collect candidates by source buckets ==========
candidates_by_source = {}  # { source_name: [entry, entry, ...] }
for source in sources:
    source_name = source.get('name', '')
    rss_url = source.get('url', '')
    if not rss_url:
        continue

    print(f"--- Collecting candidates: {source_name} ---")
    try:
        feed = feedparser.parse(rss_url)
        if not feed.entries:
            print("  No content found.")
            continue

        # Sort this source by time in descending order
        sorted_entries = sorted(feed.entries, key=entry_pubdate, reverse=True)

        # Sample to candidate pool (unprocessed only)
        bucket = []
        for e in sorted_entries:
            if len(bucket) >= MAX_PER_SOURCE:
                break
            link = e.get('link') or ''
            if not link or link in processed_links:
                continue
            bucket.append(e)

        if bucket:
            candidates_by_source[source_name] = bucket
            print(f"  {len(bucket)} candidates.")
        else:
            print("  No new candidates available (all processed or no links).")

    except Exception as e:
        print(f"[Collecting candidates] Source '{source_name}' parsing error: {e}")

source_names = list(candidates_by_source.keys())
candidates_info = ', '.join([f'{k}:{len(v)}' for k,v in candidates_by_source.items()])
print(f"Available sources: {len(source_names)}; Candidates per source: {{{candidates_info}}}")

# ========== Stage 2: Round-robin processing of candidates from each source (ensure balance) ==========
newly_processed_items = []
new_items_count = 0
api_calls = 0

# Round-robin pointer
idx = 0
while source_names and new_items_count < MAX_NEW_ITEMS and api_calls < MAX_API_CALLS:
    source_name = source_names[idx % len(source_names)]
    bucket = candidates_by_source.get(source_name, [])
    if not bucket:
        # Source is empty, remove and don't increment idx (shrink the ring)
        candidates_by_source.pop(source_name, None)
        source_names.remove(source_name)
        continue

    # Take one item from this source (head of queue)
    latest_entry = bucket.pop(0)
    if not bucket:
        # If this source is now empty, it will be removed in next loop
        candidates_by_source[source_name] = []

    title = latest_entry.get('title', 'No Title')
    link = latest_entry.get('link', '')
    if not link or link in processed_links:
        # Skip and continue to next source in round-robin
        idx += 1
        continue

    # Date
    published_parsed = latest_entry.get('published_parsed')
    if published_parsed:
        dt_object = datetime.fromtimestamp(time.mktime(published_parsed))
        date_str = dt_object.strftime('%Y-%m-%d')
    else:
        date_str = datetime.now().strftime('%Y-%m-%d')

    print(f"\nProcessing entry (balanced mode): {title}")
    print(f"Source: {source_name}")
    print(f"Link: {link}")

    # Extract content
    full_content, extract_msg = extract_full_content(
        link, latest_entry.get('content', [{'value': ''}])
    )
    print(f"Content extraction: {extract_msg}")

    # Skip if content is too short (don't consume model calls)
    if len(full_content.strip()) < 200:
        print("Content too short, skipping this entry (no model call).")
        idx += 1
        continue

    # Truncate if too long
    if len(full_content) > MAX_CONTENT_CHARS:
        print(f"Content too long ({len(full_content)}), truncating to {MAX_CONTENT_CHARS} characters.")
        full_content = full_content[:MAX_CONTENT_CHARS]

    # Call model (failures also count towards API calls)
    api_calls += 1
    time.sleep(REQUEST_SLEEP)
    analysis_data, raw_debug = call_openrouter(MODEL, title, full_content)

    if analysis_data is None:
        print(f"[Failed] Model call/parsing failed: {raw_debug}")
        print(f"[Progress] Success {new_items_count}/{MAX_NEW_ITEMS}, Calls {api_calls}/{MAX_API_CALLS}")
        # Failures also advance to next source (maintain balanced rhythm)
        idx += 1
        continue

    # Standardize tags before assembling result
    raw_tags = analysis_data.get('tags', [])
    standardized_tags = standardize_tags(raw_tags, max_tags=3)
    
    # Assemble result
    final_item = {
        "id": counter,
        "title": title,
        "source": source_name,
        "link": link,
        "tags": standardized_tags,
        "date": date_str,
        "summary_en": analysis_data.get('summary_en', ''),
        "summary_zh": analysis_data.get('summary_zh', ''),
        "best_quote_en": analysis_data.get('best_quote_en', ''),
        "best_quote_zh": analysis_data.get('best_quote_zh', '')
    }

    newly_processed_items.append(final_item)
    processed_links.add(link)
    counter += 1
    new_items_count += 1
    print(f"[Success] Generated {new_items_count}/{MAX_NEW_ITEMS} items; Total calls {api_calls}/{MAX_API_CALLS}")

    # Both success and failure advance to next source
    idx += 1

# ========== Write Results ==========
# Incremental write to data.json (append new objects at the end)
if newly_processed_items:
    print(f"\nWriting {len(newly_processed_items)} new records to {OUTPUT_FILE} incrementally...")
    with open(OUTPUT_FILE, 'rb+') as f:
        f.seek(0, os.SEEK_END)
        size = f.tell()
        if size == 0:
            f.write(b'[]')
            f.flush()
            f.seek(0, os.SEEK_END)

        # Move to the last character and check if it's ']'
        f.seek(-1, os.SEEK_END)
        last_char = f.read(1)
        if last_char != b']':
            print("Warning: data.json is not a valid JSON array, will overwrite completely.")
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as wf:
                all_items = results + newly_processed_items if 'results' in locals() and isinstance(results, list) else newly_processed_items
                json.dump(all_items, wf, indent=2, ensure_ascii=False)
        else:
            # Check if it's a non-empty array to decide whether to add comma
            non_empty_array = False
            try:
                with open(OUTPUT_FILE, 'r', encoding='utf-8') as rf:
                    existing = json.load(rf)
                    non_empty_array = len(existing) > 0
            except Exception:
                pass

            # Go back before the ending ']', prepare to append
            f.seek(-1, os.SEEK_END)
            if non_empty_array:
                f.write(b',')
            new_data_string = json.dumps(newly_processed_items, indent=2, ensure_ascii=False)
            new_data_string = new_data_string[1:-1].strip()  # Remove list brackets
            f.write(new_data_string.encode('utf-8'))
            f.write(b']')
    print("Incremental write completed.")
else:
    print("\nNo new valid records this time, no write needed.")

# Overwrite processed_links.json
with open(PROCESSED_LINKS_FILE, 'w', encoding='utf-8') as f:
    json.dump(sorted(list(processed_links)), f, indent=2, ensure_ascii=False)

print(f"\nAll processes completed: Successfully added {new_items_count} items; Model called {api_calls} times. Output file: {OUTPUT_FILE}, Link cache: {PROCESSED_LINKS_FILE}")
