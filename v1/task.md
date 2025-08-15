# 🚀 Mini Task 1: GitHub 工作流程入门

> **学习目标**：学习 GitHub 基础操作和项目部署
> **难度等级**：⭐⭐
> **预计时间**：20-30分钟

## 🎯 任务概述

在这个任务中，你将学习完整的 GitHub 工作流程：从 fork 仓库开始，到部署网站，再到添加自己的数据。这是一个实用的技能，让你能够参与开源项目并发布自己的作品。

---

## 📝 任务1：Fork 仓库到自己的账号

**操作步骤**：

1. **访问原仓库**：打开 `https://github.com/原作者/curated-gems`
2. **点击 Fork 按钮**：在页面右上角找到 "Fork" 按钮并点击
3. **选择目标账号**：选择你的 GitHub 账号作为 fork 目标
4. **等待 fork 完成**：GitHub 会自动复制仓库到你的账号下

**完成标志**：
- 在你的 GitHub 账号下看到 `你的用户名/curated-gems` 仓库
- 仓库描述下方显示 "forked from 原作者/curated-gems"

---

## 📝 任务2：启用 GitHub Pages 部署

**操作步骤**：

1. **进入仓库设置**：在你 fork 的仓库页面，点击 "Settings" 标签
2. **找到 Pages 设置**：在左侧菜单中找到 "Pages" 选项
3. **配置部署源**：
   - Source: 选择 "Deploy from a branch"
   - Branch: 选择 "main" 分支
   - Folder: 选择 "/ (root)"
4. **保存设置**：点击 "Save" 按钮
5. **等待部署**：GitHub 会自动构建和部署你的网站

**完成标志**：
- Pages 设置页面显示绿色的部署成功信息
- 获得网站访问链接：`https://你的用户名.github.io/curated-gems`

---

## 📝 任务3：准备空白数据文件

**操作步骤**：

1. **编辑 data.json 文件**：在仓库中找到 `data.json` 文件并点击编辑
2. **清空现有数据**：将文件内容替换为空数组：
```json
[]
```
3. **提交更改**：
   - 在页面底部填写提交信息："Initialize empty data.json"
   - 点击 "Commit changes" 按钮

**完成标志**：
- `data.json` 文件只包含空数组 `[]`
- 网站显示空白状态（没有任何卡片）

---

## 📝 任务4：手动添加第一条数据

**操作步骤**：

1. **编辑 data.json 文件**：再次点击编辑 `data.json`
2. **添加你的第一条数据**：
```json
[
  {
    "title": "我的第一个推荐",
    "title_zh": "我的第一个推荐",
    "summary": "这是我添加的第一条内容，用来测试系统功能。",
    "summary_zh": "这是我添加的第一条内容，用来测试系统功能。",
    "link": "https://github.com",
    "source": "GitHub",
    "date": "2024-01-15",
    "tags": ["测试", "GitHub"],
    "tags_zh": ["测试", "GitHub"]
  }
]
```
3. **提交更改**：
   - 提交信息："Add first data entry"
   - 点击 "Commit changes"

**完成标志**：
- 网站显示你添加的第一条数据
- 卡片包含标题、摘要、链接等信息

---

## 📝 任务5：继续添加更多数据

**操作步骤**：

1. **准备更多内容**：想想你想推荐的网站、工具或资源
2. **按照格式添加**：在数组中继续添加更多对象
3. **注意数据格式**：
   - 每个对象用逗号分隔
   - 字符串用双引号包围
   - 数组用方括号包围
   - 日期格式：YYYY-MM-DD

**示例数据**：
```json
[
  {
    "title": "我的第一个推荐",
    "title_zh": "我的第一个推荐",
    "summary": "这是我添加的第一条内容。",
    "summary_zh": "这是我添加的第一条内容。",
    "link": "https://github.com",
    "source": "GitHub",
    "date": "2024-01-15",
    "tags": ["测试", "GitHub"],
    "tags_zh": ["测试", "GitHub"]
  },
  {
    "title": "VS Code",
    "title_zh": "VS Code 编辑器",
    "summary": "Microsoft's free code editor with great extensions.",
    "summary_zh": "微软出品的免费代码编辑器，拥有丰富的扩展生态。",
    "link": "https://code.visualstudio.com",
    "source": "Microsoft",
    "date": "2024-01-16",
    "tags": ["编辑器", "开发工具"],
    "tags_zh": ["编辑器", "开发工具"]
  }
]
```

**完成标志**：
- 网站显示多条数据
- 可以使用搜索和筛选功能
- 数据格式正确，没有语法错误

---

## ✅ 测试步骤

1. 访问你的 GitHub Pages 网站
2. 检查数据是否正确显示
3. 测试搜索功能是否正常工作
4. 测试语言切换功能
5. 检查所有链接是否可以正常跳转

---

## 🎉 完成标准

- ✅ 成功 fork 了仓库到自己的账号
- ✅ 启用了 GitHub Pages 并能访问网站
- ✅ 清空了原有数据并添加了自己的内容
- ✅ 至少添加了 2-3 条有效数据
- ✅ 网站功能正常，数据格式正确

---

## 💡 小贴士

- GitHub Pages 部署可能需要几分钟时间，请耐心等待
- 编辑 JSON 文件时要注意语法格式，特别是逗号和引号
- 可以使用在线 JSON 验证工具检查格式是否正确
- 每次修改后等待 1-2 分钟再刷新网站查看效果