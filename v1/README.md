# 课次一｜v1 数据变网页：渲染卡片列表

## 学习目标
- 读 data.json → 渲染卡片
- 理解"信息策展"的四步：选源→选条目→写摘要→打标签

## 核心概念/技能
- HTML/CSS/JS 分工
- fetch JSON
- 模板字符串
- tags 数组

## 教学步骤
1. **破冰+演示成品**
2. **打开仓库（Fork），本地预览**
   ```bash
   python3 -m http.server 8000
   ```
3. **讲结构**：根 index.html / style.css / data.json；v1/app.js
4. **渲染 10 条卡片**，讨论摘要&标签写法

## 课堂活动
每人改 3 条 data.json：补 20–40 字中文摘要与 2–3 个标签

## 课后延伸
完成到 10–20 条，固定 6–10 个通用标签（便于后续筛选）

## 所需素材
- Starter 代码（见后文）
- 示例数据（Hidden Brain、Paul Graham 各若干）

## AI 融入点
- 用 AI 批量生成摘要/标签
- 用 AI 给出"标签词表"和释义

### AI 协作提示词
```md
你是信息编辑。根据标题和链接，生成 20–40 字中文摘要，并从 ["psychology","behavioral","productivity","startups","writing","decision","career","creativity"] 中选 1–3 个标签，返回 JSON：{desc, tags}。
标题：<title>
链接：<url>
```


