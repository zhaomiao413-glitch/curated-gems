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

MAX_CONTENT_CHARS = 15000  # Maximum content truncation length before sending to model (character count)
                            # Increased to handle long-form content like LessWrong articles for deeper analysis

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
你是一位资深的内容分析师和思想家，擅长深度阅读和洞察分析。请仔细阅读以下文章内容，进行深度思考和分析，然后以 JSON 格式返回分析结果。

**深度分析要求：**
1. **深度理解**：不仅要理解文章表面内容，更要挖掘其深层含义、背景逻辑和潜在影响
2. **批判思维**：分析文章的论点是否合理，证据是否充分，逻辑是否严密
3. **联系思考**：将文章内容与当前时代背景、行业趋势、社会现象进行关联思考
4. **价值提炼**：提取文章中最有价值的观点、方法论或启发性思考
5. **情感共鸣**：理解文章想要传达的情感和态度，并在总结中体现出来

**JSON 对象应包含以下字段：**
- "title_zh": 文章标题的中文翻译（如果原文是中文则保持原样）
- "summary_en": 英文深度总结，300-400词。要求：
  * 不仅概括内容，更要体现深度思考
  * 包含对文章核心观点的分析和评价
  * 体现文章的现实意义和启发价值
  * 语言要有感染力，体现真实的思考感悟
- "summary_zh": 中文深度总结，300-400字。要求：
  * 像写一篇有感而发的读后感，有个人思考和感悟
  * 不是简单的内容概括，而是深度的分析和思辨
  * 要有情感温度，体现真实的阅读体验
  * 可以适当加入对现实的思考和对未来的展望
- "best_quote_en": 提取文章中最具洞察力的英文金句（如果原文是中文，请翻译成英文）
- "best_quote_zh": 提取文章中最具洞察力的中文金句（如果原文是英文，请翻译成中文）
- {tags_instruction}
- "tags_zh": 3个与文章内容相关的中文关键词标签，以数组形式返回

**写作风格要求：**
- 总结要有个人色彩，像是一个有思想的人在分享自己的真实感悟
- 语言要生动有力，避免官方化、模板化的表达
- 要体现出对内容的深度思考和情感投入
- 可以适当使用比喻、类比等修辞手法增强表达力

**严格要求：** 只返回有效的 JSON 对象，**不要**包含任何代码块标记（如 ```json）、前导/尾随提示或额外文本。

文章标题：{title}
文章内容：
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
                "content": "你是一位具有深度思考能力的内容分析专家，擅长从多个维度深入理解和分析文章内容。你不仅能准确概括信息，更能进行批判性思考，提供有洞察力的分析和富有感染力的表达。请严格按照要求只返回有效的 JSON 对象，不包含代码块标记、解释文本或额外字符。"
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
        "title_zh": analysis_data.get('title_zh', ''),
        "source": source_name,
        "link": link,
        "tags": standardized_tags,
        "tags_zh": analysis_data.get('tags_zh', []),
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
