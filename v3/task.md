# 第3节课任务 – 多标签版

目标：学习优化多标签筛选的用户体验
难度：⭐⭐⭐☆☆

---

## 🎯 本节课要完成的功能
- 为标签添加emoji图标
- 优化标签选择的提示文本
- 调整空筛选结果的显示
- 美化标签的显示效果

---

## 📝 任务1：添加标签状态管理

**文件位置**：`v3/app.js`
**要修改的地方**：文件顶部，在 `let raw = [];` 附近

**找到这些变量定义**：
```javascript
let raw = [];
let filtered = [];
```

**在下面添加**：
```javascript
let activeTags = []; // 存储当前选中的标签
```

---

## 📝 任务2：创建标签显示功能

**文件位置**：`v3/app.js`
**要修改的地方**：在文件中找个空地方添加新函数

**添加这个新函数**：
```javascript
function renderTags() {
  const tagsContainer = $('#tags');
  if (!tagsContainer) return;
  
  // 收集所有标签
  const allTags = new Set();
  raw.forEach(item => {
    if (item.tags) {
      item.tags.forEach(tag => allTags.add(tag));
    }
  });
  
  // 生成标签HTML
  const tagsArray = Array.from(allTags).sort();
  tagsContainer.innerHTML = tagsArray.map(tag => {
    const isActive = activeTags.includes(tag);
    return `<span class="tag ${isActive ? 'active' : ''}" data-tag="${tag}">${tag}</span>`;
  }).join('');
}
```

---

## 📝 任务3：添加标签点击事件

**文件位置**：`v3/app.js`
**要修改的地方**：`bind` 函数

**在 `bind` 函数的最后添加**：
```javascript
// 绑定标签点击事件
const tagsContainer = $('#tags');
if (tagsContainer) {
  tagsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
      const tag = e.target.dataset.tag;
      
      // 切换标签状态
      if (activeTags.includes(tag)) {
        // 移除标签
        activeTags = activeTags.filter(t => t !== tag);
      } else {
        // 添加标签
        activeTags.push(tag);
      }
      
      // 重新渲染
      renderTags();
      applyAndRender();
    }
  });
}
```

---

## 📝 任务4：修改筛选逻辑

**文件位置**：`v3/app.js`
**要修改的地方**：`applyAndRender` 函数

**找到现有的筛选逻辑**，在搜索筛选后面添加标签筛选：
```javascript
function applyAndRender() {
  let result = raw;
  
  // 搜索筛选（如果有的话）
  const searchTerm = $('#search') ? $('#search').value.toLowerCase().trim() : '';
  if (searchTerm) {
    result = result.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      item.summary.toLowerCase().includes(searchTerm) ||
      item.source.toLowerCase().includes(searchTerm)
    );
  }
  
  // 标签筛选
  if (activeTags.length > 0) {
    result = result.filter(item => {
      if (!item.tags) return false;
      // 检查文章是否包含任意一个选中的标签
      return activeTags.some(tag => item.tags.includes(tag));
    });
  }
  
  filtered = result;
  render();
}
```

---

## 📝 任务5：在初始化时渲染标签

**文件位置**：`v3/app.js`
**要修改的地方**：`init` 函数

**找到 `init` 函数中的这段代码**：
```javascript
renderSources();
bind();
applyAndRender();
```

**改成这样**：
```javascript
renderSources();
renderTags(); // 添加这一行
bind();
applyAndRender();
```

---

## 📝 任务6：显示选中标签状态

**文件位置**：`v3/app.js`
**要修改的地方**：`render` 函数

**在 `render` 函数开头添加**：
```javascript
function render() {
  // 显示当前筛选状态
  const searchTerm = $('#search') ? $('#search').value.trim() : '';
  let statusText = '';
  
  if (activeTags.length > 0) {
    statusText += `标签: ${activeTags.join(', ')}`;
  }
  
  if (searchTerm) {
    if (statusText) statusText += ' | ';
    statusText += `搜索: ${searchTerm}`;
  }
  
  if (statusText) {
    statusText += ` | 共 ${filtered.length} 条结果`;
  }
  
  // 其余原有代码...
  const list = $('#list');
  // ...
}
```

---

## 🧪 测试步骤

1. 保存文件后，打开 `http://localhost:8000/?v=3`
2. 检查页面是否显示标签列表
3. 点击一个标签，看是否只显示包含该标签的文章
4. 再点击另一个标签，看是否显示包含任意一个标签的文章
5. 点击已选中的标签，看是否取消选择
6. 结合搜索功能测试，看标签和搜索是否能同时工作

---

## ✅ 完成标准

- [ ] 页面显示所有可用标签
- [ ] 点击标签能筛选相关文章
- [ ] 可以同时选择多个标签
- [ ] 选中的标签有视觉反馈（不同颜色）
- [ ] 点击已选标签能取消选择
- [ ] 标签筛选和搜索功能能同时使用

---

## 📝 任务7：添加标签emoji图标

**文件位置**：`v3/app.js`
**要修改的地方**：`renderTags` 函数

**找到这段代码**：
```javascript
return `<span class="tag ${isActive ? 'active' : ''}" data-tag="${tag}">${tag}</span>`;
```

**改成这样**：
```javascript
const tagEmojis = {
  '前端': '💻',
  '后端': '⚙️',
  '设计': '🎨',
  '工具': '🔧',
  '教程': '📚',
  '新闻': '📰',
  '开源': '🌟',
  '框架': '🏗️'
};
const emoji = tagEmojis[tag] || '🏷️';
return `<span class="tag ${isActive ? 'active' : ''}" data-tag="${tag}">${emoji} ${tag}</span>`;
```

---

## 📝 任务8：优化空结果提示

**文件位置**：`v3/app.js`
**要修改的地方**：`render` 函数中的空结果处理

**找到类似这样的代码**：
```javascript
if (filtered.length === 0) {
  list.innerHTML = '<div class="empty">没有找到相关内容</div>';
  return;
}
```

**改成这样**：
```javascript
if (filtered.length === 0) {
  let emptyMessage = '🤔 没有找到相关内容';
  if (activeTags.length > 0) {
    emptyMessage += `<br><small>当前筛选标签：${activeTags.join(', ')}</small>`;
  }
  list.innerHTML = `<div class="empty">${emptyMessage}</div>`;
  return;
}
```

---

## 🧪 测试步骤

1. 保存文件后，打开 `http://localhost:8000/?v=3`
2. 检查页面是否显示标签列表，每个标签前是否有emoji图标
3. 点击一个标签，看是否只显示包含该标签的文章
4. 再点击另一个标签，看是否显示包含任意一个标签的文章
5. 点击已选中的标签，看是否取消选择
6. 尝试筛选出空结果，检查提示信息是否友好
7. 结合搜索功能测试，看标签和搜索是否能同时工作

---

## ✅ 完成标准

- [ ] 页面显示所有可用标签，带有emoji图标
- [ ] 点击标签能筛选相关文章
- [ ] 可以同时选择多个标签
- [ ] 选中的标签有视觉反馈（不同颜色）
- [ ] 点击已选标签能取消选择
- [ ] 标签筛选和搜索功能能同时使用
- [ ] 空筛选结果有友好的提示信息
- [ ] 标签显示美观，用户体验良好

---

## 💡 小贴士

- 标签筛选是"或"的关系，选择多个标签会显示包含任意一个标签的文章
- 确保HTML中有 `<div id="tags"></div>` 容器
- 选中的标签会有 `active` 类名，可以用CSS设置不同样式
- 如果标签不显示，检查数据中是否有 `tags` 字段
- 可以根据实际标签内容调整emoji映射