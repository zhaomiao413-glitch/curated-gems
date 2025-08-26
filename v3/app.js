// 第3课优化版：信息筛选与分类管理
// 主要改进：优化标签分类体系、改善用户体验、增强代码可维护性
let raw = [], view = [], activeSource = 'all', activeTags = new Set(['all']);
let searchEl, sortEl, randomBtn;

const $ = sel => document.querySelector(sel);

// Store data globally for language switching
window.currentData = null;
window.renderWithLanguage = renderWithLanguage;

// Get current language from URL params or default to 'zh'
const urlParams = new URLSearchParams(location.search);
window.currentLang = urlParams.get('lang') || 'zh';

// 由于脚本是动态加载的，DOM 可能已经准备好了
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  console.log('Init started');

  // 检查必要的 DOM 元素
  const listEl = $('#list');
  const emptyEl = $('#empty');
  const controlsEl = $('#controls');

  console.log('DOM elements:', { listEl, emptyEl, controlsEl });

  if (!listEl || !emptyEl || !controlsEl) {
    console.error('Missing required DOM elements');
    return;
  }

  mountControls();

  try {
    console.log('Fetching data...');
    raw = await loadData();
    window.currentData = raw;
    console.log('Data loaded:', raw.length, 'items');
    console.log('First item:', raw[0]);
  } catch (e) {
    console.error('Data loading failed:', e);
    $('#list').innerHTML = '';
    const lang = window.currentLang || 'zh';
    const errorTexts = {
      zh: '数据加载失败: ',
      en: 'Data loading failed: '
    };
    $('#empty').innerHTML = `<p>${errorTexts[lang]}${e.message}</p>`;
    return;
  }

  // 初始化渲染
  applyAndRender();
  bind();
}

async function loadData() {
  try {
    const response = await fetch('../data.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format: expected array');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to load data:', error);
    throw error;
  }
}

function mountControls() {
  const lang = window.currentLang || 'zh';
  const texts = {
    zh: {
      search: '搜索文章标题、摘要...',
      sort: '排序方式',
      random: '随机推荐',
      newest: '最新',
      oldest: '最旧',
      clearFilters: '清除所有筛选',
      sources: '数据源',
      tags: '标签'
    },
    en: {
      search: 'Search articles, summaries...',
      sort: 'Sort by',
      random: 'Random',
      newest: 'Newest',
      oldest: 'Oldest',
      clearFilters: 'Clear all filters',
      sources: 'Sources',
      tags: 'Tags'
    }
  };

  // 创建简化的控件结构
  $('#controls').innerHTML = `
    <div class="controls">
      <div class="search-section">
        <input id="search" placeholder="${texts[lang].search}" type="text" />
        <button id="random" class="random-btn">${texts[lang].random}</button>
        <button id="clear-filters" class="clear-btn">${texts[lang].clearFilters}</button>
        <select id="sort">
          <option value="newest">${texts[lang].newest}</option>
          <option value="oldest">${texts[lang].oldest}</option>
        </select>
      </div>
      <div class="filter-section">
        <div class="filter-group">
          <span class="filter-label">${texts[lang].sources}:</span>
          <div id="sources" class="tags"></div>
        </div>
        <div class="filter-group">
          <span class="filter-label">${texts[lang].tags}:</span>
          <div id="tags" class="tags"></div>
        </div>
      </div>
    </div>
  `;

  // 获取元素引用
  searchEl = $('#search');
  sortEl = $('#sort');
  randomBtn = $('#random');
}

function bind() {
  // 搜索功能
  if (searchEl) {
    searchEl.addEventListener('input', applyAndRender);
  }

  // 排序功能
  if (sortEl) {
    sortEl.addEventListener('change', applyAndRender);
  }

  // 随机推荐
  if (randomBtn) {
    randomBtn.addEventListener('click', recommendOne);
  }

  // 清除所有筛选
  const clearBtn = $('#clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllFilters);
  }

  // 标签点击事件（事件委托）
  const tagsContainer = $('#tags');
  if (tagsContainer) {
    tagsContainer.addEventListener('click', (e) => {
      if (e.target.closest('.tag')) {
        toggleMulti(e, 'tag');
      }
    });
  }

  // 数据源点击事件（事件委托）
  const sourcesContainer = $('#sources');
  if (sourcesContainer) {
    sourcesContainer.addEventListener('click', (e) => {
      if (e.target.closest('.filter-item')) {
        toggleMulti(e, 'source');
      }
    });
  }
}

// 清除所有筛选条件
function clearAllFilters() {
  // 重置搜索框
  if (searchEl) {
    searchEl.value = '';
  }
  
  // 重置排序
  if (sortEl) {
    sortEl.value = 'newest';
  }
  
  // 重置标签筛选
  activeTags.clear();
  activeTags.add('all');
  
  // 重置来源筛选
  activeSource = 'all';
  
  // 重新渲染
  applyAndRender();
}

function toggleMulti(e, type) {
  e.preventDefault();
  const target = e.target.closest('[data-value], [data-tag]');
  if (!target) return;

  const value = target.dataset.value || target.dataset.tag;
  console.log(`Toggle ${type}:`, value);

  if (type === 'tag') {
    if (value === 'all') {
      // 点击"全部"时，清除其他选择
      activeTags.clear();
      activeTags.add('all');
    } else {
      // 点击具体标签时
      if (activeTags.has(value)) {
        // 如果已选中，则取消选择
        activeTags.delete(value);
        // 如果没有选中任何标签，自动选择"全部"
        if (activeTags.size === 0) {
          activeTags.add('all');
        }
      } else {
        // 如果未选中，则添加选择，并移除"全部"
        activeTags.delete('all');
        activeTags.add(value);
      }
    }
  } else if (type === 'source') {
    activeSource = value;
  }

  console.log('Active tags:', Array.from(activeTags));
  console.log('Active source:', activeSource);

  applyAndRender();
}

function applyAndRender() {
  console.log('Applying filters and rendering...');
  
  if (!raw || raw.length === 0) {
    console.log('No data to filter');
    render([]);
    return;
  }

  let filtered = [...raw];
  const lang = window.currentLang || 'zh';
  const tagsField = lang === 'zh' ? 'tags_zh' : 'tags';

  // 应用搜索筛选
  const searchTerm = searchEl?.value?.toLowerCase().trim();
  if (searchTerm) {
    filtered = filtered.filter(item => {
      const title = (item.title || '').toLowerCase();
      const summary = (item.summary || '').toLowerCase();
      return title.includes(searchTerm) || summary.includes(searchTerm);
    });
  }

  // 应用标签筛选
  if (!activeTags.has('all')) {
    filtered = filtered.filter(item => {
      const itemTags = item[tagsField] || item.tags || [];
      return Array.from(activeTags).some(tag => itemTags.includes(tag));
    });
  }

  // 应用来源筛选
  if (activeSource !== 'all') {
    filtered = filtered.filter(item => item.source === activeSource);
  }

  // 应用排序
  const sortValue = sortEl?.value || 'newest';
  if (sortValue === 'oldest') {
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  view = filtered;
  console.log('Filtered results:', view.length, 'items');
  
  render(view);
  updateFilterStatus();
}

// 更新筛选状态显示
function updateFilterStatus() {
  const lang = window.currentLang || 'zh';
  const statusEl = $('#filter-status');
  if (!statusEl) return;

  const totalCount = raw.length;
  const filteredCount = view.length;
  const activeFiltersCount = (activeTags.size > 1 || !activeTags.has('all')) + 
                           (activeSource !== 'all' ? 1 : 0) + 
                           (searchEl?.value?.trim() ? 1 : 0);

  const texts = {
    zh: `显示 ${filteredCount} / ${totalCount} 篇文章${activeFiltersCount > 0 ? ` (${activeFiltersCount} 个筛选条件)` : ''}`,
    en: `Showing ${filteredCount} / ${totalCount} articles${activeFiltersCount > 0 ? ` (${activeFiltersCount} filters)` : ''}`
  };

  statusEl.textContent = texts[lang];
}

function recommendOne() {
  if (view.length === 0) return;
  
  const randomIndex = Math.floor(Math.random() * view.length);
  const item = view[randomIndex];
  
  // 滚动到推荐的文章
  const articleEl = document.querySelector(`[data-id="${item.id}"]`);
  if (articleEl) {
    articleEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    articleEl.style.animation = 'highlight 2s ease-in-out';
  }
}

function renderSources(list) {
  const sources = [...new Set(list.map(item => item.source))].sort();
  const lang = window.currentLang || 'zh';
  const allText = lang === 'zh' ? '全部来源' : 'All Sources';
  
  const el = $('#sources');
  if (!el) return;
  
  // 计算每个数据源的文章数量
  const sourceCounts = {};
  list.forEach(item => {
    sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
  });
  
  el.innerHTML = `
    <div class="filter-item ${activeSource === 'all' ? 'active' : ''}" data-value="all" onclick="toggleMulti(event, 'source')">
      ${allText} (${list.length})
    </div>
    ${sources.map(source => {
      const count = sourceCounts[source] || 0;
      const statusText = lang === 'zh' ? `${source} - ${count}篇文章` : `${source} - ${count} articles`;
      return `
        <div class="filter-item ${activeSource === source ? 'active' : ''}" data-value="${source}" onclick="toggleMulti(event, 'source')" title="${statusText}">
          ${esc(source)} (${count})
        </div>
      `;
    }).join('')}
  `;
}

// 优化后的标签配置 - 按5大类别重新组织
const TAG_CONFIG = {
  // 🧠 思维认知类 - 紫色系
  '思考': { emoji: '🤔', color: '#9333ea', bgColor: '#f3e8ff', category: 'thinking' },
  '学习': { emoji: '📚', color: '#7c3aed', bgColor: '#ede9fe', category: 'thinking' },
  '心理学': { emoji: '🧠', color: '#8b5cf6', bgColor: '#f3e8ff', category: 'thinking' },
  '哲学': { emoji: '🎭', color: '#a855f7', bgColor: '#f3e8ff', category: 'thinking' },
  'thinking': { emoji: '🤔', color: '#9333ea', bgColor: '#f3e8ff', category: 'thinking' },
  'learning': { emoji: '📚', color: '#7c3aed', bgColor: '#ede9fe', category: 'thinking' },
  'psychology': { emoji: '🧠', color: '#8b5cf6', bgColor: '#f3e8ff', category: 'thinking' },
  'philosophy': { emoji: '🎭', color: '#a855f7', bgColor: '#f3e8ff', category: 'thinking' },

  // 💼 技术商业类 - 蓝色系
  '科技': { emoji: '💻', color: '#2563eb', bgColor: '#dbeafe', category: 'business' },
  '商业': { emoji: '💼', color: '#1d4ed8', bgColor: '#dbeafe', category: 'business' },
  '人工智能': { emoji: '🤖', color: '#3b82f6', bgColor: '#dbeafe', category: 'business' },
  '创业': { emoji: '🚀', color: '#1e40af', bgColor: '#dbeafe', category: 'business' },
  '管理': { emoji: '👔', color: '#1e3a8a', bgColor: '#dbeafe', category: 'business' },
  'technology': { emoji: '💻', color: '#2563eb', bgColor: '#dbeafe', category: 'business' },
  'business': { emoji: '💼', color: '#1d4ed8', bgColor: '#dbeafe', category: 'business' },
  'artificial-intelligence': { emoji: '🤖', color: '#3b82f6', bgColor: '#dbeafe', category: 'business' },
  'entrepreneurship': { emoji: '🚀', color: '#1e40af', bgColor: '#dbeafe', category: 'business' },
  'management': { emoji: '👔', color: '#1e3a8a', bgColor: '#dbeafe', category: 'business' },

  // 🌍 社会文化类 - 绿色系
  '社会': { emoji: '🌍', color: '#059669', bgColor: '#d1fae5', category: 'society' },
  '政治': { emoji: '🏛️', color: '#047857', bgColor: '#d1fae5', category: 'society' },
  '历史': { emoji: '📜', color: '#065f46', bgColor: '#d1fae5', category: 'society' },
  '法律': { emoji: '⚖️', color: '#064e3b', bgColor: '#d1fae5', category: 'society' },
  '伦理': { emoji: '🤲', color: '#10b981', bgColor: '#d1fae5', category: 'society' },
  'society': { emoji: '🌍', color: '#059669', bgColor: '#d1fae5', category: 'society' },
  'politics': { emoji: '🏛️', color: '#047857', bgColor: '#d1fae5', category: 'society' },
  'history': { emoji: '📜', color: '#065f46', bgColor: '#d1fae5', category: 'society' },
  'law': { emoji: '⚖️', color: '#064e3b', bgColor: '#d1fae5', category: 'society' },
  'ethics': { emoji: '🤲', color: '#10b981', bgColor: '#d1fae5', category: 'society' },

  // 🚀 个人发展类 - 橙色系
  '效率': { emoji: '⚡', color: '#ea580c', bgColor: '#fed7aa', category: 'personal' },
  '个人成长': { emoji: '🌱', color: '#dc2626', bgColor: '#fee2e2', category: 'personal' },
  '健康': { emoji: '❤️', color: '#c2410c', bgColor: '#fed7aa', category: 'personal' },
  '沟通': { emoji: '💬', color: '#ea580c', bgColor: '#fed7aa', category: 'personal' },
  '创造力': { emoji: '💡', color: '#f97316', bgColor: '#fed7aa', category: 'personal' },
  'productivity': { emoji: '⚡', color: '#ea580c', bgColor: '#fed7aa', category: 'personal' },
  'personal-growth': { emoji: '🌱', color: '#dc2626', bgColor: '#fee2e2', category: 'personal' },
  'health': { emoji: '❤️', color: '#c2410c', bgColor: '#fed7aa', category: 'personal' },
  'communication': { emoji: '💬', color: '#ea580c', bgColor: '#fed7aa', category: 'personal' },
  'creativity': { emoji: '💡', color: '#f97316', bgColor: '#fed7aa', category: 'personal' },

  // 🔮 其他重要类 - 灰色系
  '未来': { emoji: '🔮', color: '#6b7280', bgColor: '#f3f4f6', category: 'other' },
  '环境': { emoji: '🌿', color: '#6b7280', bgColor: '#f3f4f6', category: 'other' },
  'future': { emoji: '🔮', color: '#6b7280', bgColor: '#f3f4f6', category: 'other' },
  'environment': { emoji: '🌿', color: '#6b7280', bgColor: '#f3f4f6', category: 'other' },

  // 默认样式
  'all': { emoji: '📚', color: '#6b7280', bgColor: '#f3f4f6', category: 'all' }
};

// 获取标签配置（增强版）
function getTagConfig(tag) {
  // 标准化标签名
  const normalizedTag = tag.toLowerCase().trim();
  
  // 直接匹配
  if (TAG_CONFIG[normalizedTag]) {
    return TAG_CONFIG[normalizedTag];
  }
  
  // 中英文映射
  const tagMapping = {
    'ai': '人工智能',
    'tech': '科技',
    'startup': '创业',
    'growth': '个人成长',
    'mindset': '思考',
    'culture': '社会'
  };
  
  if (tagMapping[normalizedTag]) {
    return TAG_CONFIG[tagMapping[normalizedTag]] || getDefaultTagConfig();
  }
  
  // 关键词匹配
  const keywordMap = {
    'ai': 'artificial-intelligence',
    'tech': 'technology',
    'startup': 'entrepreneurship',
    'growth': 'personal-growth',
    'mindset': 'thinking',
    'culture': 'society',
    'wisdom': 'philosophy',
    'life': 'philosophy'
  };
  
  for (const [keyword, mappedTag] of Object.entries(keywordMap)) {
    if (normalizedTag.includes(keyword)) {
      return TAG_CONFIG[mappedTag] || getDefaultTagConfig();
    }
  }
  
  return getDefaultTagConfig();
}

// 获取默认标签配置
function getDefaultTagConfig() {
  return { emoji: '🏷️', color: '#6b7280', bgColor: '#f9fafb', category: 'other' };
}

// 计算标签统计信息（优化版）
function getTagStats(tagList) {
  const stats = {};
  const lang = window.currentLang || 'zh';
  const tagsField = lang === 'zh' ? 'tags_zh' : 'tags';
  
  tagList.forEach(tag => {
    if (tag === 'all') {
      stats[tag] = raw.length;
    } else {
      stats[tag] = raw.filter(item => {
        const itemTags = item[tagsField] || item.tags || [];
        return itemTags.includes(tag);
      }).length;
    }
  });
  
  return stats;
}

// 渲染标签（优化版）
function renderTags(list) {
  const lang = window.currentLang || 'zh';
  const tagsField = lang === 'zh' ? 'tags_zh' : 'tags';
  const allTags = [...new Set(list.flatMap(item => item[tagsField] || item.tags || []))];
  
  // 添加"全部"选项
  const allText = lang === 'zh' ? '全部' : 'All';
  const tags = [allText, ...allTags];
  
  $('#tags').innerHTML = tags.map(t => {
    const isAll = t === allText;
    const tagValue = isAll ? 'all' : t;
    const isActive = activeTags.has(tagValue);
    return `<span class="tag ${isActive ? 'active' : ''}" data-tag="${esc(tagValue)}">${esc(t)}</span>`;
  }).join('');
}

// 清除所有标签筛选
function clearAllTags() {
  activeTags.clear();
  activeTags.add('all');
  applyAndRender();
}

// 导出清除函数供全局使用
window.clearAllTags = clearAllTags;

function render(items) {
  console.log('Rendering items:', items.length);
  
  const lang = window.currentLang || 'zh';
  const listEl = $('#list');
  const emptyEl = $('#empty');
  
  if (!listEl || !emptyEl) {
    console.error('Required DOM elements not found');
    return;
  }
  
  if (items.length === 0) {
    listEl.innerHTML = '';
    const emptyTexts = {
      zh: '没有找到匹配的文章，试试调整筛选条件？',
      en: 'No articles found. Try adjusting your filters?'
    };
    emptyEl.innerHTML = `<p>${emptyTexts[lang]}</p>`;
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
    listEl.innerHTML = items.map(item => card(item, lang)).join('');
  }
  
  // 渲染筛选器
  renderSources(raw);
  renderTags(raw);
}

function renderWithLanguage(items, lang) {
  window.currentLang = lang;
  mountControls(); // 重新挂载控件以更新语言
  render(items);
}

function card(item, lang = 'zh') {
  const tagsArray = lang === 'zh' ? (item.tags_zh || item.tags || []) : (item.tags || []);
  const tags = tagsArray.join(' ');
  const title = lang === 'zh' ? (item.title_zh || item.title) : item.title;
  const summaryField = lang === 'zh' ? 'summary_zh' : 'summary_en';
  const quoteField = lang === 'zh' ? 'best_quote_zh' : 'best_quote_en';
  const desc = item[summaryField] || '';
  const quote = item[quoteField] || '';
  const quoteSymbols = lang === 'zh' ? ['「', '」'] : ['"', '"'];
  const aiSummaryLabel = lang === 'zh' ? 'AI总结：' : 'AI Summary: ';
  
  return `
    <article class="card">
      <h3><a href="${item.link}" target="_blank" rel="noopener">${esc(title)}</a></h3>
      ${desc ? `<p><span class="ai-label">${aiSummaryLabel}</span>${esc(desc)}</p>` : ''}
      ${quote ? `<blockquote>${quoteSymbols[0]}${esc(quote)}${quoteSymbols[1]}</blockquote>` : ''}
      <div class="meta">
        <span class="source">${esc(item.source)}</span>
        <span class="card-tags">${esc(tags)}</span>
        <span class="date">${esc(item.date || '')}</span>
      </div>
    </article>
  `;
}

function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}