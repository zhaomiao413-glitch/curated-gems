import os
import json
import time
import requests
import feedparser
from datetime import datetime
from bs4 import BeautifulSoup
import re
import json

# ========== 基本配置 ==========
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in environment variables.")

# 模型名兜底（不要在 YAML 里用 || 拼接）
MODEL = os.getenv("OPENROUTER_MODEL") or "openai/gpt-3.5-turbo-0613"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

PROCESSED_LINKS_FILE = "scripts/processed_links.json"
OUTPUT_FILE = "data.json"
SOURCE_FILE = "scripts/source.json"

# 产出与调用控制
MAX_NEW_ITEMS = 5         # 本次最多成功产出条数（你要的最多5条）
MAX_API_CALLS = 8         # 本次最多调用模型次数（失败也计入）
MAX_PER_SOURCE = 5        # 每个源最多采样候选条数（仅候选，不代表最终成功数）
HTTP_TIMEOUT = 20         # 抓网页/调模型的超时秒数
REQUEST_SLEEP = 0.2       # 轻微休眠，降低被限流概率

# 抽取正文的 CSS 选择器列表（可按需扩充/调整）
CONTENT_SELECTORS = [
    'div.post-content', 'div.entry-content', 'div.article-content',
    'div[itemprop="articleBody"]', 'article', 'main', 'div#main-content',
]

MAX_CONTENT_CHARS = 6000  # 送模型前的最大正文截断长度（字符数）

# ========== 初始化读写文件 ==========
# 读取已处理链接
try:
    with open(PROCESSED_LINKS_FILE, 'r', encoding='utf-8') as f:
        processed_links = set(json.load(f))
except (FileNotFoundError, json.JSONDecodeError):
    processed_links = set()
print(f"已加载 {len(processed_links)} 个已处理链接。")

# 确保 data.json 存在并为合法 JSON 数组
if not os.path.exists(OUTPUT_FILE) or os.path.getsize(OUTPUT_FILE) == 0:
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('[]')

# 计算下一个 ID
with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
    try:
        results = json.load(f)
        counter = (results[-1]['id'] + 1) if results else 1
    except (json.JSONDecodeError, IndexError, KeyError, TypeError):
        counter = 1
print(f"下一个新条目的 ID 将从 {counter} 开始。")

# 读取 sources
with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
    sources = json.load(f)

# ========== 工具函数 ==========
def entry_pubdate(entry):
    """获取 entry 的发布时间（datetime）。若无则返回 datetime.min 以便排序到后面。"""
    pp = entry.get('published_parsed')
    if pp:
        return datetime.fromtimestamp(time.mktime(pp))
    return datetime.min

def extract_full_content(link, rss_content_html):
    """抽取网页正文；若 RSS 已含较长内容，直接使用；否则抓取网页并抽正文。"""
    # 先用 RSS 的 content（有些源 content 很完整）
    content_from_rss = ""
    if isinstance(rss_content_html, list) and rss_content_html:
        content_from_rss = rss_content_html[0].get('value', '') or ''
    elif isinstance(rss_content_html, str):
        content_from_rss = rss_content_html

    if len(content_from_rss) > 1000:
        return content_from_rss, "内容已从RSS Feed中完整获取。"

    # RSS 内容短，尝试抓取网页
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        resp = requests.get(link, headers=headers, timeout=HTTP_TIMEOUT)
        resp.raise_for_status()
    except Exception as e:
        return content_from_rss, f"RSS内容为摘要，抓取网页失败：{e}，回退用RSS摘要。"

    soup = BeautifulSoup(resp.text, 'html.parser')

    # 优先使用常见正文容器
    article_body = None
    for selector in CONTENT_SELECTORS:
        node = soup.select_one(selector)
        if node:
            article_body = node
            break

    # 退而求其次：去掉 body 中的导航/页脚/侧栏
    if not article_body:
        body = soup.find('body')
        if body:
            for tag in body.find_all(['nav', 'footer', 'header', 'aside']):
                tag.decompose()
            article_body = body

    if article_body:
        text = article_body.get_text(separator='\n', strip=True)
        return text, "内容提取成功！"
    else:
        return content_from_rss, "警告：未能提取正文内容，将使用RSS摘要。"


def parse_json_safely(text):
    """
    兼容以下返回：
    - 纯 JSON
    - ```json ... ``` 或 ``` ... ``` 包裹
    - 前后有提示语/空行/空格
    - 多段文本里包含一个或多个 {...} JSON 块（取第一个完整块）
    """
    # 1) 直接尝试
    try:
        return json.loads(text)
    except Exception:
        pass

    # 2) 去掉 ```json ... ``` / ``` ... ``` 代码围栏
    fenced = re.search(r"```(?:json)?\s*(.+?)\s*```", text, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        inner = fenced.group(1).strip()
        try:
            return json.loads(inner)
        except Exception:
            text = inner  # 继续后续步骤

    # 3) 从全文中提取首个完整的大括号 JSON 块
    #    用栈匹配，避免正则贪婪带来的误判
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
                        break  # 换一个起点再试
        # 找下一个 '{'
        start = text.find('{', start + 1)

    # 4) 实在不行就抛错，让上层记录原文
    raise json.JSONDecodeError("No valid JSON object found", text, 0)


def call_openrouter(model, title, full_content):
    prompt_content = f"""
请分析以下文章内容，并以一个JSON对象的形式返回分析结果。

JSON对象需要包含以下键（key）：
- "summary_en": 英文总结，不超过100字。
- "summary_zh": 中文总结，不超过100字。
- "best_quote_en": 提取文章中最有洞察力的一句英文金句。
- "best_quote_zh": 提取文章中最有洞察力的一句中文金句。
- "tags": 3到5个与文章内容相关的关键词标签，以列表（array）形式返回，全部使用小写英文字符。

严格要求：仅返回一个有效的 JSON 对象，**不要**包含任何代码块围栏（如```json）、前后提示语或多余文字。
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
                "content": "你是一位专业的AI助手，擅长内容分析和总结。请仅返回一个有效 JSON 对象，不能包含```、说明文字或额外字符。"
            },
            {"role": "user", "content": prompt_content}
        ],
    }

    # 尝试 1：带 response_format（更可能得到纯 JSON）
    for attempt in (1, 2):
        data = dict(base_payload)  # 浅拷贝
        if attempt == 1:
            data["response_format"] = {"type": "json_object"}
            print("[OpenRouter] 尝试使用 response_format=json_object")
        else:
            print("[OpenRouter] 不使用 response_format 进行降级重试")

        try:
            resp = requests.post(OPENROUTER_URL, headers=headers, json=data, timeout=HTTP_TIMEOUT)
            status = resp.status_code
            text = resp.text
            print(f"[OpenRouter] HTTP {status}")
            if status >= 400:
                print(f"[OpenRouter] Body: {text[:1000]}")
                # 某些模型会对 response_format 报 400，这里直接进入下一轮降级
                if attempt == 1:
                    continue
                resp.raise_for_status()
            # 解析
            api_response = resp.json()
            if isinstance(api_response, dict) and api_response.get("error"):
                # 如果是明确的 API 错误且是尝试1，做降级重试
                if attempt == 1:
                    print(f"[OpenRouter] API Error on attempt 1, will retry without response_format: {api_response['error']}")
                    continue
                return None, f"API Error: {api_response['error']}"

            content = api_response['choices'][0]['message']['content']
            try:
                analysis_data = parse_json_safely(content)
                return analysis_data, content
            except json.JSONDecodeError as e:
                # 尝试1失败则降级；尝试2仍失败则返回错误
                if attempt == 1:
                    print(f"[解析失败@attempt1] {e}; 将降级重试。原文前 500 字：{content[:500]}")
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

    # 理论上到不了这里
    return None, "Unknown error"

# ========== 阶段 1：按源分桶收集候选 ==========
candidates_by_source = {}  # { source_name: [entry, entry, ...] }
for source in sources:
    source_name = source.get('name', '')
    rss_url = source.get('url', '')
    if not rss_url:
        continue

    print(f"--- 收集候选：{source_name} ---")
    try:
        feed = feedparser.parse(rss_url)
        if not feed.entries:
            print("  未找到任何内容。")
            continue

        # 该源按时间倒序
        sorted_entries = sorted(feed.entries, key=entry_pubdate, reverse=True)

        # 采样到候选池（未处理过的）
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
            print(f"  候选 {len(bucket)} 条。")
        else:
            print("  无可用新候选（均已处理或无链接）。")

    except Exception as e:
        print(f"[收集候选] 源 '{source_name}' 解析异常：{e}")

source_names = list(candidates_by_source.keys())
print(f"可用源数：{len(source_names)}；各源候选量：{{{', '.join([f'{k}:{len(v)}' for k,v in candidates_by_source.items()])}}}")

# ========== 阶段 2：轮询各源处理候选（保证均匀） ==========
newly_processed_items = []
new_items_count = 0
api_calls = 0

# 轮询指针
idx = 0
while source_names and new_items_count < MAX_NEW_ITEMS and api_calls < MAX_API_CALLS:
    source_name = source_names[idx % len(source_names)]
    bucket = candidates_by_source.get(source_name, [])
    if not bucket:
        # 该源已空，移除并不递增 idx（缩小环）
        candidates_by_source.pop(source_name, None)
        source_names.remove(source_name)
        continue

    # 从该源取一条（队首）
    latest_entry = bucket.pop(0)
    if not bucket:
        # 若该源已取空，下次循环将把它移除
        candidates_by_source[source_name] = []

    title = latest_entry.get('title', '无标题')
    link = latest_entry.get('link', '')
    if not link or link in processed_links:
        # 跳过并继续轮询下一源
        idx += 1
        continue

    # 日期
    published_parsed = latest_entry.get('published_parsed')
    if published_parsed:
        dt_object = datetime.fromtimestamp(time.mktime(published_parsed))
        date_str = dt_object.strftime('%Y-%m-%d')
    else:
        date_str = datetime.now().strftime('%Y-%m-%d')

    print(f"\n处理条目（均匀模式）：{title}")
    print(f"来源：{source_name}")
    print(f"链接：{link}")

    # 抽取正文
    full_content, extract_msg = extract_full_content(
        link, latest_entry.get('content', [{'value': ''}])
    )
    print(f"正文抽取：{extract_msg}")

    # 正文太短则直接跳过（不消耗模型调用）
    if len(full_content.strip()) < 200:
        print("正文过短，跳过该条（不调用模型）。")
        idx += 1
        continue

    # 截断
    if len(full_content) > MAX_CONTENT_CHARS:
        print(f"正文过长（{len(full_content)}），截断到 {MAX_CONTENT_CHARS} 字符。")
        full_content = full_content[:MAX_CONTENT_CHARS]

    # 调模型（失败也计入调用次数）
    api_calls += 1
    time.sleep(REQUEST_SLEEP)
    analysis_data, raw_debug = call_openrouter(MODEL, title, full_content)

    if analysis_data is None:
        print(f"[失败] 模型调用/解析失败：{raw_debug}")
        print(f"[进度] 成功 {new_items_count}/{MAX_NEW_ITEMS}，调用 {api_calls}/{MAX_API_CALLS}")
        # 失败也会推进到下一个源（保持均匀节奏）
        idx += 1
        continue

    # 组装结果
    final_item = {
        "id": counter,
        "title": title,
        "source": source_name,
        "desc": latest_entry.get('summary', '') or '',
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
    print(f"[成功] 已产出 {new_items_count}/{MAX_NEW_ITEMS} 条；累计调用 {api_calls}/{MAX_API_CALLS}")

    # 成功与失败都会轮到下一源
    idx += 1

# ========== 写入结果 ==========
# 增量写入 data.json（在末尾追加新对象）
if newly_processed_items:
    print(f"\n正在以增量方式写入 {len(newly_processed_items)} 条新记录到 {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'rb+') as f:
        f.seek(0, os.SEEK_END)
        size = f.tell()
        if size == 0:
            f.write(b'[]')
            f.flush()
            f.seek(0, os.SEEK_END)

        # 移动到倒数第一个字符，检查是否为 ']'
        f.seek(-1, os.SEEK_END)
        last_char = f.read(1)
        if last_char != b']':
            print("警告：data.json 不是合法的 JSON 数组，将全量覆盖写入。")
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as wf:
                all_items = results + newly_processed_items if 'results' in locals() and isinstance(results, list) else newly_processed_items
                json.dump(all_items, wf, indent=2, ensure_ascii=False)
        else:
            # 判断是否非空数组以决定是否加逗号
            non_empty_array = False
            try:
                with open(OUTPUT_FILE, 'r', encoding='utf-8') as rf:
                    existing = json.load(rf)
                    non_empty_array = len(existing) > 0
            except Exception:
                pass

            # 回到末尾 ']' 之前，准备追加
            f.seek(-1, os.SEEK_END)
            if non_empty_array:
                f.write(b',')
            new_data_string = json.dumps(newly_processed_items, indent=2, ensure_ascii=False)
            new_data_string = new_data_string[1:-1].strip()  # 去掉列表括号
            f.write(new_data_string.encode('utf-8'))
            f.write(b']')
    print("增量式写入完成。")
else:
    print("\n本次没有新的有效记录，无需写入。")

# 覆盖写入 processed_links.json
with open(PROCESSED_LINKS_FILE, 'w', encoding='utf-8') as f:
    json.dump(sorted(list(processed_links)), f, indent=2, ensure_ascii=False)

print(f"\n所有流程结束：成功新增 {new_items_count} 条；模型调用 {api_calls} 次。输出文件：{OUTPUT_FILE}，链接缓存：{PROCESSED_LINKS_FILE}")
