import os
import json
import requests
import feedparser
from datetime import datetime
from bs4 import BeautifulSoup
import time

# 从环境变量中获取 OpenRouter API Key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in environment variables.")

# 设置 OpenRouter API 的端点和模型
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash-lite") 

# 结果列表，用于存储所有处理后的 JSON 对象
results = []
counter = 1
PROCESSED_LINKS_FILE = "processed_links.json"

# --- 新增的代码块：读取已处理链接 ---
try:
    with open(PROCESSED_LINKS_FILE, 'r', encoding='utf-8') as f:
        processed_links = set(json.load(f))
except (FileNotFoundError, json.JSONDecodeError):
    # 如果文件不存在或内容格式错误，则创建一个空集合
    processed_links = set()
print(f"已加载 {len(processed_links)} 个已处理链接。")
# --- 读取已处理链接的代码块结束 ---

# 读取 sources.json 文件
with open('sources.json', 'r', encoding='utf-8') as f:
    sources = json.load(f)

for source in sources:
    source_name = source['name']
    rss_url = source['url']

    print(f"--- 正在处理: {source_name} ---")
    
    try:
        feed = feedparser.parse(rss_url)
        if not feed.entries:
            print("  未找到任何内容。")
            continue
        
        # 为了高效，只检查最新的10个条目
        for latest_entry in feed.entries[:10]:
            title = latest_entry.get('title', '无标题')
            link = latest_entry.get('link', '无链接')
            
            # --- 新增的代码块：检查链接是否已处理 ---
            if link in processed_links:
                print(f"  已跳过（已处理）：{title}")
                continue
            # --- 检查链接的代码块结束 ---

            published_parsed = latest_entry.get('published_parsed')
            if published_parsed:
                # Convert time.struct_time to datetime object
                dt_object = datetime.fromtimestamp(time.mktime(published_parsed))
                date_str = dt_object.strftime('%Y-%m-%d')
            else:
                date_str = datetime.now().strftime('%Y-%m-%d')            
            print(f"  正在处理新条目：{title}")
            print(f"  链接: {link}")

            # --- （余下的网页抓取和LLM分析逻辑与之前相同） ---
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
                    'div.entry-content', 'div.post-content', 'div.article-content',
                    'article', 'div#main-content', 'main'
                ]
                
                article_body = None
                for selector in selectors:
                    article_body = soup.select_one(selector)
                    if article_body:
                        break
                
                if article_body:
                    full_content = article_body.get_text(separator='\n', strip=True)
                    print("  内容提取成功！")
                else:
                    full_content = content_from_rss
                    print("  警告：未能提取正文内容，将使用RSS摘要。")

            full_content = full_content[:8000] 

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
                    {"role": "system", "content": "你是一位专业的AI助手，擅长内容分析和总结。请严格按照用户的指令，返回一个有效的、符合要求的JSON对象，不要包含任何额外文字。"},
                    {"role": "user", "content": prompt_content}
                ],
                "response_format": {"type": "json_object"}
            }
            
            response = requests.post(OPENROUTER_URL, headers=headers, json=data)
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
                results.append(final_item)
                processed_links.add(link) # 将新链接添加到已处理集合中
                counter += 1
                print("  内容分析成功，已添加到结果列表。")
            except json.JSONDecodeError:
                print("  模型返回的不是有效的 JSON 格式。")
        
    except Exception as e:
        print(f"  处理 {source_name} 时发生错误: {e}")
    
    print("-" * 50)

# 将结果列表写入 output.json 文件
with open('output.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

# --- 新增的代码块：保存已处理链接 ---
with open(PROCESSED_LINKS_FILE, 'w', encoding='utf-8') as f:
    json.dump(list(processed_links), f, indent=2, ensure_ascii=False)
# --- 保存已处理链接的代码块结束 ---

print(f"所有 RSS 源处理完毕，结果已保存到 output.json 和 {PROCESSED_LINKS_FILE} 文件中。")
