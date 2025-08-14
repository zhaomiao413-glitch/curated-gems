# 课次四｜v4 多标签 + 上线与自动更新（RSSHub → Actions）

## 学习目标
- 多条件筛选（搜索 + 来源 + 标签 + 排序 + 随机）
- GitHub Pages 发布
- GitHub Actions 定时拉取 RSS（RSSHub）→ 生成 data.json

## 核心概念/技能
- Set/多选筛选、组合过滤
- Actions workflow；Python feedparser

## 教学步骤
1. **在控件区渲染所有标签；支持点选（甚至多选）**
2. **打开 Github Pages（一次配置，多期通用）**
3. **新增 sources.json → Actions 自动生成 data.json**

## 课堂活动
每人各加 2–3 个 RSSHub 源到 sources.json，触发工作流

## 课后延伸
标签归一化映射表（AI 生成）；按标签配色

## 所需素材
- sources.json 模板
- scripts/fetch_feeds.py
- .github/workflows/fetch.yml

## AI 融入点
- 让 AI 批量"标签归一化"（旧→新映射）；生成 README 字段规范
- 让 AI 帮你审阅工作流与 Python 脚本的健壮性（重试/去重/排序）

### AI 协作提示词
```md
这是我的 data.json。请扫描所有 tags，给出归一化建议（合并同义、统一大小写、去除重复），并输出一个映射表（旧→新）。同时写一段 README 说明"字段规范"。
```
