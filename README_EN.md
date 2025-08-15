# Curated Gems - Coding + AI + Thinking Progressive Workshop

[中文版](README.md) | **English**

## 📖 Project Overview

Curated Gems is a curated content showcase platform focused on training **Information Integration Thinking**. This Workshop is designed with **Coding + AI + Thinking** as core principles to cultivate essential skills for the modern information age:

- 💻 **Coding**: Technical capabilities for building information processing and display systems
- 🤖 **AI**: Utilizing AI tools for intelligent information analysis and automated processing
- 🧠 **Thinking**: Developing information integration thinking and systematic problem-solving abilities

## 🎯 Information Integration Thinking Training System

### 📊 Information Acquisition & Processing
- **Active Information Collection**: Learn to configure RSS sources for automatic latest information retrieval
- **Multi-source Information Integration**: Integrate local curated content with real-time RSS data
- **Intelligent Content Analysis**: Utilize AI for content understanding and value assessment

### 🔍 Search & Filtering Skills
- **Precise Search**: Master full-text search, keyword matching, and other search techniques
- **Multi-dimensional Filtering**: Learn to use tags, categories, and multiple conditions for information filtering
- **Result Optimization**: Optimize search and filtering experience based on user needs

### 🏷️ Data Classification & Tag Management
- **Information Classification**: Learn to establish reasonable classification systems for content
- **Tag Design**: Master tag system design principles and best practices
- **Metadata Management**: Understand the importance and application methods of structured data

### 📱 Information Display & Visualization
- **Interface Design**: Learn to design clear, user-friendly information display interfaces
- **Interaction Optimization**: Improve efficiency and experience of user information acquisition
- **Responsive Layout**: Adapt information display needs for different devices

## ✨ Key Features

- 🔍 **Smart Search** - Full-text search with real-time filtering
- 🏷️ **Multi-tag Filtering** - Flexible tag combination filtering
- 🌐 **Bilingual Support** - Chinese/English interface switching
- 📊 **Intelligent Data Sources** - Automatic RSS data reading with custom LLM model content analysis
- 🤖 **Automated Updates** - GitHub Actions automatic RSS content processing

## 🎯 Workshop Learning Objectives

### Lesson 1: Information Platform Setup & Data Management
**Core Thinking**: Establish foundational framework for information management
- **Information Acquisition**: Learn to fork quality projects and obtain ready-made information processing frameworks
- **Data Entry**: Master methods for manually adding and managing structured data
- **Platform Deployment**: Establish your own information display platform (GitHub Pages)
- **Version Control**: Develop awareness of information change tracking and management

### Lesson 2: Information Retrieval System Optimization
**Core Thinking**: Improve information search and acquisition efficiency
- **Search Logic**: Understand retrieval principles like full-text search and keyword matching
- **User Experience**: Optimize search interfaces to improve information acquisition efficiency
- **Result Display**: Learn to design clear search result presentation methods
- **Performance Optimization**: Master frontend search performance optimization techniques

### Lesson 3: Information Classification & Tag Systems
**Core Thinking**: Establish systematic information organization methods
- **Classification Design**: Learn to establish reasonable classification systems for information
- **Tag Management**: Master tag system design principles and application methods
- **Filtering Logic**: Implement multi-dimensional, multi-condition information filtering functions
- **Data Structure**: Understand the design of relationships between tags and content

### Lesson 4: Automated Information Collection & Processing
**Core Thinking**: Establish automated systems for proactive information acquisition
- **Information Source Configuration**: Learn to configure and manage RSS data sources
- **Automation Workflow**: Master GitHub Actions automated processing workflows
- **Data Integration**: Implement automatic integration and updates of multi-source information
- **Quality Control**: Establish information quality assessment and filtering mechanisms

## 🚀 Quick Start

### Prerequisites
- Basic understanding of HTML/CSS/JavaScript
- GitHub account
- Text editor (VS Code recommended)

### Installation Steps
1. Fork this repository
2. Clone to local machine
3. Open `index.html` in browser
4. Start with Lesson 1 tasks

## 📁 Project Structure

```
curated-gems/
├── index.html          # Main page
├── styles.css          # Style files
├── data.json          # Data file
├── v1/               # Lesson 1: GitHub Workflow
├── v2/               # Lesson 2: Search Optimization
├── v3/               # Lesson 3: Tag Filtering
├── v4/               # Lesson 4: RSS Automation
└── scripts/          # Automation scripts
    ├── rss_analyzer.py
    └── source.json
```

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Data**: JSON format
- **Automation**: Python, GitHub Actions
- **AI Integration**: OpenRouter API, Multiple LLM Models
- **Deployment**: GitHub Pages

## 📚 Course Usage Guide

### Information Integration Thinking Training Path
1. **Lesson 1**: Establish information management foundation → Learn to acquire and organize information resources
2. **Lesson 2**: Optimize information retrieval capabilities → Improve information search and acquisition efficiency
3. **Lesson 3**: Build classification tag systems → Master systematic information organization methods
4. **Lesson 4**: Implement automated collection → Establish proactive information acquisition capabilities

### Learning Recommendations
- **Progressive Learning**: Complete each lesson and understand information processing logic before proceeding
- **AI-Assisted Thinking**: Use AI tools to analyze information needs and solutions when encountering problems
- **Practice-Oriented**: Focus on understanding information integration thinking methods, not just technical implementation
- **Personalized Extension**: Try adding information sources and classification systems from your areas of interest after completion

## 🤖 RSS Automation Configuration

### Environment Variable Setup
Add the following in GitHub repository Settings > Secrets and variables > Actions:

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-3.5-turbo-0613
```

### 🧠 Custom LLM Model Configuration

The system supports using various LLM models for intelligent content analysis through [OpenRouter](https://openrouter.ai/):

**Supported Model Types**:
- OpenAI Series: `openai/gpt-4`, `openai/gpt-3.5-turbo`
- Anthropic Series: `anthropic/claude-3-sonnet`, `anthropic/claude-3-haiku`
- Google Series: `google/gemini-flash-1.5`, `google/gemini-pro`
- Open Source Models: `meta-llama/llama-2-70b-chat`, `mistralai/mixtral-8x7b-instruct`
- Chinese Models: `qwen/qwen-72b-chat`, `01-ai/yi-34b-chat`

**Intelligent Analysis Features**:
- 📝 **Content Summarization**: Automatically generate Chinese and English summaries
- 🏷️ **Smart Tagging**: Generate relevant tags based on content automatically
- 💎 **Essence Extraction**: Extract the most valuable insights from articles
- 🌐 **Multilingual Processing**: Support intelligent translation and analysis of Chinese and English content

### Adding RSS Data Sources

Edit the `scripts/source.json` file to add RSS sources:

```json
[
  {
    "name": "Example Blog",
    "url": "https://example.com/rss"
  }
]
```

### GitHub Actions Setup

Add the following Secrets in repository settings:
- `OPENROUTER_API_KEY`: OpenRouter API key (for AI content analysis)
- `OPENROUTER_MODEL`: AI model name (e.g., `openai/gpt-4`, `anthropic/claude-3-sonnet`)

### Automation Workflow Features

- 📅 **Scheduled Execution**: Automatically run RSS analysis daily
- 🤖 **Intelligent Processing**: Intelligently analyze new content through LLM models
- 🏷️ **Auto Annotation**: Automatically generate summaries, tags, and key insights
- 📊 **Data Updates**: Automatically update `data.json` file
- 🔄 **Deduplication**: Avoid processing duplicate content

### Manual Workflow Trigger

1. Go to repository's Actions tab
2. Select "RSS Content Analyzer" workflow
3. Click "Run workflow" button
4. Wait for completion and check results

## 🤝 Contributing

Welcome to contribute to this project! You can:

- 🐛 Report bugs or suggest improvements
- 📝 Improve documentation and tutorials
- 🔧 Add new features or optimize existing code
- 🌍 Provide translations or internationalization support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
