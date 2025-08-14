# 第1集 — [课程标题]

## 课前准备
1. 注册并验证 **GitHub** 账号
2. Fork 本项目到自己的账号
3. 数据文件位于根目录 [`data.json`](../data.json)，可提前查看和添加条目
4. 预览方式：
   - **方式 1（推荐）**：开启 GitHub Pages
   - **方式 2**：本地运行 HTTP 服务（需要安装 Python）

**本地运行 HTTP 服务**
```bash
# 确认已安装 Python 3
python3 --version

# 进入项目根目录
cd curated-gems

# 启动 HTTP 服务（Python 3）
python3 -m http.server 8000

# 或 Python 2
# python -m SimpleHTTPServer 8000

# 浏览器打开
http://localhost:8000/?v=X
```

## 跟AI协作
- AI 任务：为每条链接生成 20–40 字中文摘要 + 2–3 个标签（写入 data.json 的 desc 和 tags）。
- 提示次：
```md
你是信息编辑。根据标题和链接，生成 20–40 字中文摘要，并从 ["psychology","behavioral","productivity","startups","writing","decision","career","creativity"] 中选 1–3 个标签，返回 JSON：{desc, tags}。
标题：<title>
链接：<url>
```


