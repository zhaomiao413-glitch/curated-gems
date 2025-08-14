import json, time, hashlib
from datetime import datetime
import feedparser

with open('sources.json','r',encoding='utf-8') as f:
    sources = json.load(f)

items = []
for s in sources:
    feed = feedparser.parse(s['url'])
    for e in feed.entries[:20]:
        link = getattr(e,'link',''); title = getattr(e,'title','')
        desc = getattr(e,'summary','') or getattr(e,'description','')
        date = ''
        if getattr(e,'published_parsed', None):
            date = time.strftime('%Y-%m-%d', e.published_parsed)
        hid = hashlib.md5((link or title).encode('utf-8')).hexdigest()[:10]
        items.append({
            "id": hid, "title": title, "source": s["name"],
            "desc": desc, "link": link, "tags": s.get("tags", []),
            "date": date or datetime.utcnow().strftime('%Y-%m-%d')
        })

# 去重（按 link）
seen=set(); dedup=[]
for it in items:
    if it["link"] in seen: continue
    seen.add(it["link"]); dedup.append(it)

# 按日期降序
dedup.sort(key=lambda x: x.get("date",""), reverse=True)

with open('data.json','w',encoding='utf-8') as f:
    json.dump(dedup, f, ensure_ascii=False, indent=2)

print(f"Wrote {len(dedup)} items to data.json")
