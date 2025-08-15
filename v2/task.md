# 第2节课任务 – 搜索版

目标：学习调整搜索功能的用户体验
难度：⭐⭐☆☆☆

---

## 🎯 本节课要完成的功能
- 修改搜索框的提示文本
- 优化搜索结果的显示文本
- 调整空搜索结果的提示
- 个性化来源标签显示

---

## 📝 任务1：修改搜索框提示文本

**文件位置**：`v2/app.js`
**要修改的地方**：第 25-30 行左右的 `mountControls` 函数

**找到这段代码**：
```javascript
const placeholder = lang === 'zh' ? '搜索标题/摘要/标签…' : 'Search title/summary/tags...';
```

**改成这样**：
```javascript
const placeholder = lang === 'zh' ? '🔍 输入关键词搜索精彩内容...' : '🔍 Enter keywords to search amazing content...';
```

---

## 📝 任务2：优化空搜索结果提示

**文件位置**：`v2/app.js`
**要修改的地方**：第 55-65 行左右的 `render` 函数

**找到这段代码**：
```javascript
const emptyTexts = {
  zh: '未找到匹配的内容',
  en: 'No matching content found'
};
```

**改成这样**：
```javascript
const emptyTexts = {
  zh: '😅 没有找到相关内容，换个关键词试试吧',
  en: '😅 No relevant content found, try different keywords'
};
```

---

## 📝 任务3：为来源标签添加emoji图标

**文件位置**：`v2/app.js`
**要修改的地方**：第 50 行左右的 `renderSources` 函数

**找到这段代码**：
```javascript
sourcesEl.innerHTML = list.map(s => `<span class="tag ${s === 'all' ? 'active' : ''}" data-source="${s}">${esc(s)}</span>`).join('');
```

**改成这样**：
```javascript
sourcesEl.innerHTML = list.map(s => {
  const icon = s === 'all' ? '📚' : '📰';
  return `<span class="tag ${s === 'all' ? 'active' : ''}" data-source="${s}">${icon} ${esc(s)}</span>`;
}).join('');
```

---

## 📝 任务4：调整搜索结果数量显示

**文件位置**：`v2/app.js`
**要修改的地方**：第 60-70 行左右的 `render` 函数

**找到这段代码**：
```javascript
const countTexts = {
  zh: `找到 ${items.length} 条结果`,
  en: `Found ${items.length} results`
};
```

**改成这样**：
```javascript
const countTexts = {
  zh: `✨ 为您找到 ${items.length} 条精彩内容`,
  en: `✨ Found ${items.length} amazing articles for you`
};
```

---

## ✅ 测试步骤

1. 打开浏览器，访问 `http://localhost:8000/?v=2`
2. 检查搜索框的提示文本是否显示了🔍图标和新的文案
3. 在搜索框输入关键词，检查空结果提示是否显示了😅图标
4. 查看来源标签是否显示了📚和📰图标
5. 切换语言（在URL后加 `&lang=en`）测试英文版本
6. 检查搜索结果数量显示是否有✨图标

## 🎉 完成标准

- ✅ 搜索框提示文本更加友好，包含🔍图标
- ✅ 空搜索结果提示更加有趣，包含😅图标
- ✅ 来源标签显示了相应的emoji图标
- ✅ 搜索结果数量显示更加生动，包含✨图标
- ✅ 中英文版本都已更新
- ✅ 原有搜索功能正常工作，只是文案更友好

---

## 💡 小贴士

- 搜索是不区分大小写的
- 可以搜索标题、内容摘要或来源
- 防抖功能让搜索更流畅，不会输入一个字就搜索一次
- 如果搜索不工作，检查 `$('#search')` 是否能找到搜索框元素