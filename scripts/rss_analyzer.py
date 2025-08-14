import os
import json
import requests
import feedparser
import time
from datetime import datetime
from bs4 import BeautifulSoup

# 从环境变量中获取 OpenRouter API Key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in environment variables.")

# 设置 OpenRouter API 的端点和模型
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-3.5-turbo-0613")

# 结果列表，用于存储所有处理后的 JSON 对象
newly_processed_items = []
PROCESSED_LINKS_FILE = "scripts/processed_links.json"
OUTPUT_FILE = "output.json"
MAX_NEW_ITEMS = 5

# --- 更新的逻辑：只读取历史数据，不加载到内存 ---
try:
    with open(PROCESSED_LINKS_FILE, 'r', encoding='utf-8') as f:
        processed_links = set(json.load(f))
except (FileNotFoundError, json.JSONDecodeError):
    processed_links = set()
print(f"已加载 {len(processed_links)} 个已处理链接。")

# 检查 output.json 是否存在，如果不存在则创建
if not os.path.exists(OUTPUT_FILE) or os.path.getsize(OUTPUT_FILE) == 0:
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('[]')

# 获取下一个 ID
with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
    try:
        results = json.load(f)
        if results:
            counter = results[-1]['id'] + 1
        else:
            counter = 1
    except (json.JSONDecodeError, IndexError):
        counter = 1
print(f"下一个新条目的 ID 将从 {counter} 开始。")
# --- 读取逻辑结束 ---

# 读取 scripts/source.json 文件
with open('scripts/source.json', 'r', encoding='utf-8') as f:
    sources = json.load(f)

new_items_count = 0
for source in sources:
    if new_items_count >= MAX_NEW_ITEMS:
        break

    source_name = source['name']
    rss_url = source['url']

    print(f"--- 正在处理: {source_name} ---")

    try:
        feed = feedparser.parse(rss_url)
        if not feed.entries:
            print("  未找到任何内容。")
            continue

        for latest_entry in feed.entries:
            if new_items_count >= MAX_NEW_ITEMS:
                break

            title = latest_entry.get('title', '无标题')
            link = latest_entry.get('link', '无链接')

            if not link:
                continue

            try:
                if link in processed_links:
                    print(f"  已跳过（已处理）：{title}")
                    continue

                published_parsed = latest_entry.get('published_parsed')
                if published_parsed:
                    dt_object = datetime.fromtimestamp(time.mktime(published_parsed))
                    date_str = dt_object.strftime('%Y-%m-%d')
                else:
                    date_str = datetime.now().strftime('%Y-%m-%d')

                print(f"  正在处理新条目：{title}")
                print(f"  链接: {link}")

                content_from_rss = latest_entry.get('content', [{'value': ''}])[0]['value']

                if len(content_from_rss) > 1000:
                    full_content = content_from_rss
                    print("  内容已从RSS Feed中完整获取。")
                else:
                    print("  RSS内容为摘要，正在从网页提取完整内容...")
                    headers = {'User-Agent': 'Mozilla/5.0'}
                    page_response = requests.get(link, headers=headers, timeout=15)
                    page_response.raise_for_status()

                    soup = BeautifulSoup(page_response.text, 'html.parser')

                    selectors = [
                        'div.post-content', 'div.entry-content', 'div.article-content',
                        'div[itemprop="articleBody"]', 'article', 'main', 'div#main-content',
                    ]
                    article_body = None
                    for selector in selectors:
                        article_body = soup.select_one(selector)
                        if article_body:
                            break

                    if not article_body:
                        body_content = soup.find('body')
                        if body_content:
                            for tag in body_content.find_all(['nav', 'footer', 'header', 'aside']):
                                tag.decompose()
                            article_body = body_content

                    if article_body:
                        full_content = article_body.get_text(separator='\n', strip=True)
                        print("  内容提取成功！")
                    else:
                        full_content = content_from_rss
                        print("  警告：未能提取正文内容，将使用RSS摘要。")

                max_content_length = 6000
                if len(full_content) > max_content_length:
                    print(f"  内容过长 ({len(full_content)})，已截取到 {max_content_length} 个字符。")
                    full_content = full_content[:max_content_length]

                prompt_content = f"""
                请分析以下文章内容，并以一个JSON对象的形式返回分析结果。
                
                JSON对象需要包含以下键（key）：
                - "summary_en": 英文总结，不超过100字。
                - "summary_zh": 中文总结，不超过100字。
                - "best_quote_en": 提取文章中最有洞察力的一句英文金句。
                - "best_quote_zh": 提取文章中最有洞察力的一句中文金句。
                - "tags": 3到5个与文章内容相关的关键词标签，以列表（array）形式返回，全部使用小写英文字符。

                文章标题：{title}
                文章内容：
                {full_content}
                """

                headers = {
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                }
                data = {
                    "model": MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "你是一位专业的AI助手，擅长内容分析和总结。请严格按照用户的指令，**仅返回一个有效的、符合要求的JSON对象**，不要包含任何额外文字。"
                        },
                        {
                            "role": "user",
                            "content": prompt_content
                        }
                    ]
                }
                
                response = requests.post(OPENROUTER_URL, headers=headers, json=data)
                print("LLM Model:", MODEL.title)
                print("Status code:", response.status_code)
                print("Response text:", response.text)
                response.raise_for_status()
                
                api_response = response.json()
                model_output_json_str = api_response['choices'][0]['message']['content']
                
                try:
                    analysis_data = json.loads(model_output_json_str)
                    final_item = {
                        "id": counter,
                        "title": title,
                        "source": source_name,
                        "desc": latest_entry.get('summary', ''),
                        "link": link,
                        "tags": analysis_data.get('tags', []),
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
                    print("  内容分析成功，已添加到结果列表。")
                except json.JSONDecodeError as e:
                    # 如果模型返回的不是有效的 JSON，我们捕获这个错误
                    print(f"  警告：模型返回的不是有效的 JSON 格式。错误: {e}")
                    print("  模型原始输出:")
                    print(model_output_json_str)
            
            except Exception as e:
                print(f"  警告：处理条目 '{title}' 时发生错误: {e}")
            finally:
                print("-" * 20)
    
    except Exception as e:
        print(f"  处理整个RSS源 '{source_name}' 时发生错误: {e}")
    
    print("-" * 50)

# --- 更新的写入逻辑：增量式写入 output.json ---
if newly_processed_items:
    print(f"正在以增量方式写入 {len(newly_processed_items)} 条新记录到 {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'rb+') as f:
        # 移动到文件倒数第二个字符，即 `]` 之前
        f.seek(-1, os.SEEK_END)
        
        # 如果文件不为空，添加一个逗号
        if f.tell() > 1:
            f.write(b',')
        
        # 写入新数据
        new_data_string = json.dumps(newly_processed_items, indent=2, ensure_ascii=False)
        # 移除新数据开头的 '[' 和结尾的 ']'
        new_data_string = new_data_string[1:-1].strip()
        f.write(new_data_string.encode('utf-8'))
        
        # 重新添加 `]`
        f.write(b']')
        
    print("增量式写入完成。")

# processed_links.json 仍然使用替换式写入，因为它通常不会太大
with open(PROCESSED_LINKS_FILE, 'w', encoding='utf-8') as f:
    json.dump(list(processed_links), f, indent=2, ensure_ascii=False)

print(f"所有 RSS 源处理完毕，结果已保存到 {OUTPUT_FILE} 和 {PROCESSED_LINKS_FILE} 文件中。")