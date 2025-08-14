# 第 4 期｜多标签 + 上线与自动更新（RSSHub → Actions）

## 课前准备
- 完成 v3 功能
- 注册 GitHub 并能使用 Actions

## 课堂目标
- **技术**：多条件筛选（来源 + 标签）
- **发布**：部署到 GitHub Pages
- **自动化**：用 Actions 定时抓取 RSS（RSSHub）→ 生成 `data.json`
- **AI 融入**：
  - 用 AI 批量生成标签归一化映射表
  - 用 AI 审查 Python 脚本健壮性

## 教学步骤
1. 回顾 v3
2. 添加标签筛选：渲染所有标签，多选过滤
3. 部署 GitHub Pages（Settings → Pages）
4. 新增 `sources.json`，填入 RSSHub 源（name/url/tags）
5. 添加 `scripts/fetch_feeds.py` + `.github/workflows/fetch.yml`
6. 手动触发 Actions，查看 `data.json` 自动更新
7. 全班作品展示

## 拓展挑战
- 按标签配色
- 增加“最新更新”模块（显示最近 5 条）
