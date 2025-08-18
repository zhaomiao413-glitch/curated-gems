# 第4节课任务 – 动态版

> **学习目标**：学习 RSS 数据源管理和 GitHub Actions 自动化
> **难度等级**：⭐⭐⭐⭐
> **预计时间**：25-35分钟

## 🎯 任务概述

在这个任务中，你将学习如何管理 RSS 数据源，并使用 GitHub Actions 自动化处理 RSS 内容。这是一个高级功能，让你的网站能够自动获取和更新最新的内容。

---

## 📝 任务1：了解 RSS 数据源配置

**文件位置**：`scripts/source.json`

**当前配置**：
```json
[
  {
    "name": "Paul Graham",
    "url": "http://www.aaronsw.com/2002/feeds/pgessays.rss"
  },
  {
    "name": "Sam Altman",
    "url": "https://blog.samaltman.com/posts.atom"
  }
]
```

**配置说明**：
- `name`: RSS 源的显示名称
- `url`: RSS 订阅链接

**完成标志**：
- 理解 RSS 数据源的配置格式
- 知道如何添加新的 RSS 源

---

## 📝 任务2：添加你的 RSS 数据源

**操作步骤**：

1. **编辑 source.json 文件**：在仓库中找到 `scripts/source.json` 并点击编辑
2. **添加新的 RSS 源**：在数组中添加你感兴趣的 RSS 源，这个链接里有包括很多播客rss: https://www.reddit.com/r/podcasts/comments/16tqmh2/npr_podcasts_rssxml_feed_list/

**推荐的 RSS 源**：
```json
[
  {
    "name": "Paul Graham",
    "url": "http://www.aaronsw.com/2002/feeds/pgessays.rss"
  },
  {
    "name": "Farnam Street",
    "url": "https://fs.blog/feed"
  },
  {
    "name": "阮一峰的网络日志",
    "url": "http://www.ruanyifeng.com/blog/atom.xml"
  },
  {
    "name": "少数派",
    "url": "https://sspai.com/feed"
  },
  {
    "name": "GitHub Blog",
    "url": "https://github.blog/feed/"
  }
]
```

3. **提交更改**：
   - 提交信息："Add new RSS sources"
   - 点击 "Commit changes"

**完成标志**：
- 成功添加了 3-5 个新的 RSS 数据源
- JSON 格式正确，没有语法错误

---

## 📝 任务3：配置 GitHub Actions 密钥

**操作步骤**：

1. **进入仓库设置**：点击 "Settings" 标签
2. **找到 Secrets 设置**：在左侧菜单中找到 "Secrets and variables" → "Actions"
3. **添加必要的密钥**：
   - 点击 "New repository secret"
   - 添加 `OPENROUTER_API_KEY`（可选，用于 AI 内容分析）
   - 添加 `OPENROUTER_MODEL`（可选，AI 模型名称）

**注意**：
- 如果没有 OpenRouter API Key，工作流仍然可以运行，只是不会进行 AI 分析
- 这些密钥是可选的，主要用于高级内容处理

**完成标志**：
- 了解了 GitHub Secrets 的配置方法
- 知道工作流需要哪些环境变量

---

## 📝 任务4：手动触发 GitHub Actions 工作流

**操作步骤**：

1. **进入 Actions 页面**：在仓库中点击 "Actions" 标签
2. **找到 RSS 工作流**：在左侧列表中找到 "RSS Content Analyzer"
3. **手动触发工作流**：
   - 点击工作流名称
   - 点击 "Run workflow" 按钮
   - 选择 "main" 分支
   - 点击绿色的 "Run workflow" 按钮

**等待执行**：
- 工作流会自动运行，处理你添加的 RSS 源
- 可以点击正在运行的工作流查看实时日志
- 通常需要 2-5 分钟完成

**完成标志**：
- 工作流成功执行完成（绿色勾号）
- 生成了新的 `data.json` 文件
- 网站显示了来自 RSS 的新内容

---

## 📝 任务5：验证自动化结果

**检查步骤**：

1. **查看更新的文件**：
   - 检查 `data.json` 是否有新内容
   - 查看 `scripts/processed_links.json` 记录了处理过的链接

2. **访问网站**：
   - 打开你的 GitHub Pages 网站
   - 检查是否显示了来自 RSS 的新文章
   - 测试搜索和筛选功能

3. **查看工作流日志**：
   - 在 Actions 页面查看详细的执行日志
   - 了解处理了多少 RSS 条目
   - 检查是否有错误或警告

**完成标志**：
- 网站显示了来自多个 RSS 源的内容
- 数据格式正确，包含标题、摘要、链接等
- 工作流日志显示成功处理了 RSS 数据

---

## 📝 任务6：设置定时自动更新

**了解自动化**：

当前工作流配置为每天 UTC 时间 8 点自动运行：
```yaml
schedule:
  - cron: '0 8 * * *'      # 每天 UTC 时间 8 点运行
```

**可选调整**：
如果想修改运行时间，可以编辑 `.github/workflows/rss.yml`：
- `'0 0 * * *'` - 每天午夜运行
- `'0 */6 * * *'` - 每 6 小时运行一次
- `'0 8 * * 1'` - 每周一上午 8 点运行

**完成标志**：
- 理解了 GitHub Actions 的定时任务配置
- 知道如何调整自动运行的频率

---

## ✅ 测试步骤

1. 访问你的 GitHub Pages 网站
2. 检查是否显示了来自多个 RSS 源的内容
3. 测试搜索功能，搜索 RSS 内容
4. 检查文章的来源标签是否正确
5. 查看 Actions 页面确认工作流运行正常
6. 等待下次自动运行（或再次手动触发）

## 🎉 完成标准

- ✅ 成功添加了 3-5 个新的 RSS 数据源
- ✅ 了解了 GitHub Actions 和 Secrets 配置
- ✅ 成功手动触发了 RSS 处理工作流
- ✅ 网站显示了来自 RSS 的新内容
- ✅ 工作流能够定时自动运行
- ✅ 理解了整个 RSS 自动化处理流程

---

---

## 💡 小贴士

- RSS数据获取可能需要几秒钟，请耐心等待
- 如果RSS获取失败，检查网络连接
- 导出的文件会保存到浏览器的下载文件夹
- 数据源切换会重新加载页面
- 这是最复杂的一个版本，如果遇到困难可以参考 `fulltask.md`
- 可以尝试添加更多RSS源到 `RSS_SOURCES` 数组中
