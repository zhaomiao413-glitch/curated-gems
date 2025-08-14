// scripts/enrich_with_openrouter.mjs
import fs from 'fs/promises';
import fetch from 'node-fetch';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL_ID = process.env.OPENROUTER_MODEL || "openrouter/auto"; // 或指定你喜欢的模型ID

// 简单的正文抓取（可替换成更强的 Readability/Boilerpipe）
async function fetchText(url) {
    const res = await fetch(url, { timeout: 20000 });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
    const html = await res.text();
    // 粗暴提取：去掉标签，只保留文本（可替换更好解析器）
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.slice(0, 9000); // 截断，避免超长
}

async function callOpenRouter({ title, url, content }) {
    const system = "You are a precise research assistant. Produce JSON only, no commentary.";
    const user = `Read the article below and return a compact, factual digest for a Chinese audience.

Return a strict JSON object with keys:
- summary_en: 80–120 words
- summary_zh: 80–120 chars Chinese summary (不要逐句直译，写成自然中文)
- best_quote_en: one verbatim sentence (<= 180 chars) copied from the article
- best_quote_zh: faithful Chinese translation of best_quote_en
- tags: 2–4 short Chinese/English tags (e.g., ["psychology","decision"])

Rules:
- If unsure, say "null" for that field.
- Do NOT fabricate quotes; quote must be exact substring of the article.
- Keep JSON valid. Do not wrap in code fences.

Article Title: ${title}
Article URL: ${url}
Article Excerpt (may be truncated):
${content}`;

    const body = {
        model: MODEL_ID,
        messages: [
            { role: "system", content: system },
            { role: "user", content: user }
        ],
        temperature: 0.3,
        max_tokens: 600
    };

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            // 可选：用于目录统计和白名单
            "HTTP-Referer": "https://your-domain-or-github-pages",
            "X-Title": "Curated Gems RSS Summarizer"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
    const data = await res.json();
    const contentStr = data?.choices?.[0]?.message?.content || "{}";
    // 最保险：尝试解析，否则返回空对象
    try { return JSON.parse(contentStr); } catch { return {}; }
}

function dedupByLink(list) {
    const seen = new Set();
    return list.filter(x => {
        if (!x.link) return false;
        if (seen.has(x.link)) return false;
        seen.add(x.link);
        return true;
    });
}

async function main() {
    // 读取现有数据/源
    const [dataRaw, sourcesRaw] = await Promise.all([
        fs.readFile("data.json", "utf-8").catch(() => "[]"),
        fs.readFile("sources.json", "utf-8").catch(() => "[]")
    ]);
    let dataset = [];
    try { dataset = JSON.parse(dataRaw); } catch { dataset = []; }
    let sources = [];
    try { sources = JSON.parse(sourcesRaw); } catch { sources = []; }

    // 简单：只处理 dataset 里最近 N 条（或你也可以先跑RSS收集脚本再 enrich）
    const latest = dataset.slice(0, 20); // 控制成本：每次只 enrich 20 条
    const updated = [];

    for (const item of latest) {
        try {
            const content = await fetchText(item.link);
            const enriched = await callOpenRouter({
                title: item.title, url: item.link, content
            });
            updated.push({
                ...item,
                summary_en: enriched.summary_en ?? item.summary_en ?? null,
                summary_zh: enriched.summary_zh ?? item.summary_zh ?? null,
                best_quote_en: enriched.best_quote_en ?? item.best_quote_en ?? null,
                best_quote_zh: enriched.best_quote_zh ?? item.best_quote_zh ?? null,
                tags: Array.isArray(enriched.tags) && enriched.tags.length
                    ? Array.from(new Set([...(item.tags || []), ...enriched.tags]))
                    : item.tags || []
            });
            // 简单节流：每条之间等待 1s（可调/可并发）
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.error("enrich failed:", item.link, e.message);
            updated.push(item); // 保留原条目
        }
    }

    // 合并回 dataset（这里只替换前 20 条；你也可以按 id 合并）
    const rest = dataset.slice(20);
    const result = dedupByLink([...updated, ...rest]);

    await fs.writeFile("data.json", JSON.stringify(result, null, 2), "utf-8");
    console.log(`Updated data.json with ${updated.length} enriched items.`);
}

main().catch(err => { console.error(err); process.exit(1); });
