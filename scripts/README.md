# RSS Analyzer Scripts

这个目录包含用于分析RSS内容的Python脚本。

## 环境配置

### 本地开发

1. **安装依赖**：
   ```bash
   pip install requests feedparser beautifulsoup4 python-dotenv
   ```

2. **配置环境变量**：
   - 复制 `.env.example` 到 `.env`：
     ```bash
     cp .env.example .env
     ```
   - 编辑 `.env` 文件，填入你的API密钥：
     ```
     OPENROUTER_API_KEY=your_actual_api_key_here
     OPENROUTER_MODEL=mistralai/mistral-small-3.2-24b-instruct:free
     ```

3. **运行脚本**：
   ```bash
   python scripts/rss_analyzer.py
   ```

### GitHub Actions部署

1. **设置Repository Secrets**：
   - 进入GitHub仓库的 Settings → Secrets and variables → Actions
   - 添加以下secrets：
     - `OPENROUTER_API_KEY`: 你的OpenRouter API密钥
     - `OPENROUTER_MODEL`: 要使用的模型（可选）

2. **自动运行**：
   - 脚本会每天UTC时间8点自动运行
   - 也可以在Actions页面手动触发

## 支持的模型

脚本支持多种AI模型，会根据模型自动调整内容长度限制：

- **Mistral模型** (50,000字符):
  - `mistralai/mistral-small-3.2-24b-instruct:free`
  - `mistralai/mistral-small`

- **Google Gemini模型** (200,000字符):
  - `google/gemini-2.5-flash`
  - `google/gemini-2.5-pro`

- **OpenAI模型** (80,000字符):
  - `openai/gpt-4o`
  - `openai/gpt-4o-mini`

- **Anthropic模型** (150,000字符):
  - `anthropic/claude-3.5-sonnet`
  - `anthropic/claude-3-opus`

## 文件说明

- `rss_analyzer.py`: 主要的RSS分析脚本
- `tag_manager.py`: 标签管理和标准化功能
- `source.json`: RSS源配置文件
- `processed_links.json`: 已处理链接的记录
- `.env.example`: 环境变量配置示例

## 安全注意事项

- ⚠️ **永远不要**将 `.env` 文件提交到Git仓库
- ⚠️ **永远不要**在代码中硬编码API密钥
- ✅ 使用 `.env` 文件进行本地开发
- ✅ 使用GitHub Secrets进行生产部署