# 第4节课任务卡 – 自动化更新（RSS + Workflow）

目标：让平台自动获取最新数据  
文件位置：`scripts/source.json`, `.github/workflows/rss.yml`

---

## 任务 4.1：添加 RSS 来源
- 打开 `source.json`
- 添加一个 RSS 链接（例如 `https://rsshub.app/paulgraham/articles`）

## 任务 4.2：手动运行工作流
- 打开 GitHub 仓库的 `Actions`
- 找到 `RSS Content Analyzer`
- 点击 **Run workflow**，等待更新完成后刷新页面

## 任务 4.3：添加定时任务
- 编辑 `.github/workflows/update.yml`
- 在 `on:` 下添加：
  ```yaml
  schedule:
    - cron: "0 0 * * *"
- 表示每天凌晨更新

---
✅ **成果**：每个人有一个自己名字的“精选页面”，能访问、能展示自己的数据。

