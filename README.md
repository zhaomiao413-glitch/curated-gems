# 精选宝库 (Curated Gems) - Coding + AI + Thinking 渐进式 Workshop

**中文** | [English](README_EN.md)

> 融合编程实践、AI 工具应用与思维训练的渐进式前端开发工作坊，通过四个层次递进的实战任务，培养现代开发者的核心技能。

## 📖 项目简介

精选宝库 (Curated Gems) 是一个个人化精选内容展示平台，专注于训练**信息整合思维**。这个 Workshop 以 **Coding + AI + Thinking** 为核心理念，培养现代信息时代的核心技能：

- 💻 **Coding**: 构建信息处理和展示系统的技术能力
- 🤖 **AI**: 利用 AI 工具进行智能信息分析和自动化处理
- 🧠 **Thinking**: 培养信息整合思维和系统性解决问题的能力

## 🎯 信息整合思维训练体系

### 📊 信息获取与处理
- **主动信息搜集**: 学会配置 RSS 源，自动获取最新信息
- **多源信息整合**: 整合本地精选内容和实时 RSS 数据
- **智能内容分析**: 利用 AI 进行内容理解和价值评估

### 🔍 搜索与筛选技能
- **精准搜索**: 掌握全文搜索、关键词匹配等搜索技巧
- **多维筛选**: 学会使用标签、分类等多重条件进行信息筛选
- **结果优化**: 根据用户需求优化搜索和筛选体验

### 🏷️ 数据归类与标签管理
- **信息分类**: 学会为内容建立合理的分类体系
- **标签设计**: 掌握标签系统的设计原则和最佳实践
- **元数据管理**: 理解结构化数据的重要性和应用方法

### 📱 信息展示与可视化
- **界面设计**: 学会设计清晰、易用的信息展示界面
- **交互优化**: 提升用户获取信息的效率和体验
- **响应式布局**: 适配不同设备的信息展示需求

## ✨ 主要功能

- 📱 **响应式设计** - 支持桌面和移动设备
- 🔍 **智能搜索** - 支持标题、描述、标签的全文搜索
- 🏷️ **多标签筛选** - 灵活的标签组合筛选
- 🌐 **双语支持** - 中英文界面切换
- 📊 **智能数据源** - 支持自动读取 RSS 数据，并通过自定义 LLM 模型进行内容分析
- 🤖 **自动化更新** - GitHub Actions 自动处理 RSS 内容

## 🎯 Workshop 学习目标

### 第一课：信息平台搭建与数据管理
**核心思维**: 建立信息管理的基础框架
- **信息获取**: 学会 fork 优质项目，获取现成的信息处理框架
- **数据录入**: 掌握手动添加和管理结构化数据的方法
- **平台部署**: 建立自己的信息展示平台（GitHub Pages）
- **版本控制**: 培养信息变更的追踪和管理意识

### 第二课：信息检索系统优化
**核心思维**: 提升信息查找和获取效率
- **搜索逻辑**: 理解全文搜索、关键词匹配等检索原理
- **用户体验**: 优化搜索界面，提升信息获取效率
- **结果展示**: 学会设计清晰的搜索结果展示方式
- **性能优化**: 掌握前端搜索的性能优化技巧

### 第三课：信息分类与标签体系
**核心思维**: 建立系统化的信息组织方法
- **分类设计**: 学会为信息建立合理的分类体系
- **标签管理**: 掌握标签系统的设计原则和应用方法
- **筛选逻辑**: 实现多维度、多条件的信息筛选功能
- **数据结构**: 理解标签与内容的关联关系设计

### 第四课：自动化信息采集与处理
**核心思维**: 建立主动获取信息的自动化系统
- **信息源配置**: 学会配置和管理 RSS 数据源
- **自动化流程**: 掌握 GitHub Actions 的自动化处理流程
- **数据整合**: 实现多源信息的自动整合和更新
- **质量控制**: 建立信息质量评估和筛选机制

## 🚀 快速开始

### 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/curated-gems.git
   cd curated-gems
   ```

2. **启动本地服务器**
   ```bash
   python3 -m http.server 8000
   ```

3. **访问不同版本**
   - v1 版本：http://localhost:8000/?v=1
   - v2 版本：http://localhost:8000/?v=2
   - v3 版本：http://localhost:8000/?v=3
   - v4 版本：http://localhost:8000/?v=4

### GitHub Pages 部署

1. Fork 本仓库到你的 GitHub 账户
2. 在仓库设置中启用 GitHub Pages
3. 选择 "Deploy from a branch" 并选择 "main" 分支
4. 访问 `https://your-username.github.io/curated-gems`

## 📁 项目结构

```
curated-gems/
├── index.html          # 主页面
├── styles.css          # 全局样式
├── data.json          # 主数据文件
├── demo.json          # 演示数据
├── v1/                # 第一节课文件
│   ├── app.js         # v1 版本逻辑
│   └── task.md    # 课程任务说明
├── v2/                # 第二节课文件
│   ├── app.js         # v2 版本逻辑
│   └── task.md    # 课程任务说明
├── v3/                # 第三节课文件
│   ├── app.js         # v3 版本逻辑
│   └── task.md    # 课程任务说明
├── v4/                # 第四节课文件
│   ├── app.js         # v4 版本逻辑
│   └── task.md    # 课程任务说明
├── scripts/           # 自动化脚本
│   ├── rss_analyzer.py    # RSS 内容分析器
│   ├── source.json        # RSS 数据源配置
│   └── processed_links.json # 已处理链接记录
└── .github/
    └── workflows/
        └── rss.yml    # GitHub Actions 工作流
```

## 🛠️ 技术栈

- **前端**: 原生 HTML5 + CSS3 + JavaScript (ES6+)
- **样式**: CSS Grid + Flexbox + CSS 变量
- **自动化**: Python + GitHub Actions
- **部署**: GitHub Pages
- **数据格式**: JSON

## 📚 课程使用指南

### 信息整合思维训练路径
1. **第一课**: 建立信息管理基础 → 学会获取和组织信息资源
2. **第二课**: 优化信息检索能力 → 提升信息查找和获取效率
3. **第三课**: 构建分类标签体系 → 掌握信息的系统化组织方法
4. **第四课**: 实现自动化采集 → 建立主动获取信息的能力

### 学习建议
- **渐进式学习**: 每完成一课，先理解信息处理逻辑再进入下一课
- **AI 辅助思考**: 遇到问题时，使用 AI 工具分析信息需求和解决方案
- **实践导向**: 注重理解信息整合的思维方法，而不仅仅是技术实现
- **个性化扩展**: 完成后可以尝试添加自己关注领域的信息源和分类体系

### 教师指南

1. **课前准备**
   - 确保学生有 GitHub 账户
   - 准备好示例 RSS 源列表
   - 检查网络环境和开发工具

2. **课程进行**
   - 每节课按照对应的 `task.md` 文件进行
   - 鼓励学生实际操作和实验
   - 重点关注学生的理解程度而非完成速度

3. **课后总结**
   - 回顾每节课的核心概念
   - 讨论实际应用场景
   - 为下节课做好铺垫

### 学生指南

1. **学习建议**
   - 按顺序完成 v1-v4 的任务
   - 多实验、多提问
   - 记录学习过程中的问题和心得

2. **常见问题**
   - 如果遇到网络问题，可以先使用本地数据
   - GitHub Actions 可能需要几分钟才能生效
   - 建议使用现代浏览器（Chrome、Firefox、Safari）

## 🔧 RSS 自动化配置

### 🧠 自定义 LLM 模型配置

系统支持通过 [OpenRouter](https://openrouter.ai/) 使用各种 LLM 模型进行智能内容分析：

**支持的模型类型**：
- OpenAI 系列：`openai/gpt-4`, `openai/gpt-3.5-turbo`
- Anthropic 系列：`anthropic/claude-3-sonnet`, `anthropic/claude-3-haiku`
- Google 系列：`google/gemini-flash-1.5`, `google/gemini-pro`
- 开源模型：`meta-llama/llama-2-70b-chat`, `mistralai/mixtral-8x7b-instruct`
- 国产模型：`qwen/qwen-72b-chat`, `01-ai/yi-34b-chat`

**智能分析功能**：
- 📝 **内容摘要**：自动生成中英文摘要
- 🏷️ **智能标签**：基于内容自动生成相关标签
- 💎 **精华提取**：提取文章中最有价值的观点
- 🌐 **多语言处理**：支持中英文内容的智能翻译和分析

### 添加 RSS 数据源

编辑 `scripts/source.json` 文件：

```json
[
  {
    "name": "数据源名称",
    "url": "RSS订阅链接"
  }
]
```

### 配置 GitHub Secrets（可选）

在仓库设置中添加以下 Secrets：
- `OPENROUTER_API_KEY`: OpenRouter API 密钥（用于 AI 内容分析）
- `OPENROUTER_MODEL`: AI 模型名称（如：`openai/gpt-4`, `anthropic/claude-3-sonnet`）

### 自动化流程特性

- 📅 **定时执行**：每天自动运行 RSS 分析
- 🤖 **智能处理**：通过 LLM 模型智能分析新内容
- 🏷️ **自动标注**：自动生成摘要、标签和精华观点
- 📊 **数据更新**：自动更新 `data.json` 文件
- 🔄 **去重机制**：避免重复处理相同内容

### 手动触发工作流

1. 进入仓库的 Actions 页面
2. 选择 "RSS Content Analyzer" 工作流
3. 点击 "Run workflow" 按钮

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**Happy Coding! 🎉**