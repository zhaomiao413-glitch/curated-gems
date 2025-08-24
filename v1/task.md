# 第1节课任务 – 基础版

> **学习目标**：学习 GitHub 基础操作和项目部署
> **难度等级**：⭐⭐
> **预计时间**：20-30分钟

## 🎯 任务概述

在这个任务中，你将学习完整的 GitHub 工作流程：从 fork 仓库开始，到部署网站，再到添加自己的数据。这是一个实用的技能，让你能够参与开源项目并发布自己的作品。

---

## 📝 任务1：Fork 仓库到自己的账号

**操作步骤**：

1. **访问原仓库**：打开 `https://github.com/sunling/curated-gems`
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
    "id": 1,
    "title": "Superlinear Returns",
    "title_zh": "超线性回报",
    "source": "Paul Graham",
    "link": "http://www.paulgraham.com/superlinear.html",
    "tags": [
      "business",
      "learning",
      "thinking"
    ],
    "tags_zh": [
      "商业",
      "学习",
      "思考"
    ],
    "date": "2025-08-15",
    "summary_en": "The article explains the concept of superlinear returns, where performance yields disproportionately large rewards. It highlights two main causes: exponential growth and thresholds. Exponential growth, like in startups or learning, allows for rapid scaling. Thresholds, such as winning a competition, create winner-take-all scenarios. The key is to seek work that compounds, either directly by building infrastructure or indirectly through learning. Continuous learning is essential for achieving superlinear returns and adapting to an ever-changing world.",
    "summary_zh": "文章解释了超线性回报的概念，即表现会带来不成比例的巨大回报。它强调了两个主要原因：指数增长和阈值。指数增长，如在初创企业或学习中，可以实现快速扩张。阈值，如赢得比赛，会创造赢者通吃的局面。关键是寻找能带来复利效应的工作，可以直接通过建设基础设施，也可以通过间接学习。持续学习对于获得超线性回报和适应不断变化的世界至关重要。",
    "best_quote_en": "You can't understand the world without understanding the concept of superlinear returns. And if you're ambitious you definitely should, because this will be the wave you surf on.",
    "best_quote_zh": "不理解超线性回报的概念，你就无法理解这个世界。如果你有野心，你绝对应该理解它，因为这将是你乘风破浪的浪潮。"
  },
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
    "id": 55,
    "title": "How to Think for Yourself",
    "title_zh": "如何独立思考",
    "source": "Paul Graham",
    "link": "http://www.paulgraham.com/think.html",
    "tags": [
      "thinking",
      "creativity",
      "philosophy"
    ],
    "tags_zh": [
      "思考",
      "创造力",
      "哲学"
    ],
    "date": "2025-08-20",
    "summary_en": "This essay delves into the critical importance of independent thinking, particularly in fields like science, investment, entrepreneurship, and writing, where novelty is essential for success. It contrasts these fields with others where conformity and adherence to established norms are sufficient. The author argues that independent-mindedness is largely innate but can be cultivated by minimizing exposure to conventional beliefs, surrounding oneself with like-minded individuals, and reading broadly to understand diverse perspectives. The core components of independent thinking are identified as fastidiousness about truth, resistance to being told what to think, and curiosity. The essay emphasizes the need for critical evaluation of information, skepticism towards prevailing opinions, and a delight in counterintuitive ideas. It offers practical advice on fostering these qualities, advocating for intellectual curiosity, and finding environments that encourage independent thought. The author speaks to the isolating aspects of independent thought, especially in environments like high school, and encourages the cultivation of a network of independent thinkers. The essay resonates by reminding us to actively question and explore, rather than passively accept. It is a powerful call for intellectual courage and the pursuit of original thought in a world that often values conformity.",
    "summary_zh": "这篇文章深刻探讨了独立思考的重要性，尤其是在科学、投资、创业和写作等领域，在这些领域中，创新是成功的关键。文章将这些领域与那些遵循既定规范就足够的行业进行了对比。作者认为，独立思考在很大程度上是天生的，但可以通过减少对传统观念的接触，与志同道合的人交往，以及广泛阅读以理解不同的观点来培养。独立思考的核心要素被确定为对真理的严谨、对被告知该怎么想的抵制和好奇心。文章强调需要批判性地评估信息，对流行的观点持怀疑态度，并乐于接受违反直觉的想法。它提出了培养这些品质的实用建议，倡导智力上的好奇心，并寻找鼓励独立思考的环境。作者提到了独立思考的孤立性，尤其是在高中这样的环境中，并鼓励建立一个独立思考者的网络。这篇文章引起了我们的共鸣，它提醒我们主动质疑和探索，而不是被动接受。在当今这个常常重视一致性的世界里，这是一篇对智力勇气和追求原创思想的有力呼吁。读完之后，我深感共鸣的是作者对于“求真”的极致追求，以及对于“人云亦云”的深刻警惕，这不仅仅是一种思考方式，更是一种生活态度。我们应该时刻保持好奇心，敢于挑战权威，才能在人生的道路上不断前行，发现属于自己的独特价值。",
    "best_quote_en": "The best place to find undiscovered ideas is where no one else is looking.",
    "best_quote_zh": "发现未被发现的观点的最佳场所，是无人问津之处。"
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
