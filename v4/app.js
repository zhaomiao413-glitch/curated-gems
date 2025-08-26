// 第4课优化版：RSS数据源管理和GitHub Actions自动化
// 改进点：
// 1. 增强的数据源管理功能
// 2. 更好的错误处理和用户反馈
// 3. 数据源状态显示
// 4. 自动刷新机制
// 5. 改进的多语言支持

let raw = [], view = [], activeSources = new Set(['all']), activeTags = new Set(['all']);
let searchEl, sortEl, refreshEl;
const $ = sel => document.querySelector(sel);

// Store data globally for language switching
window.currentData = null;
window.renderWithLanguage = renderWithLanguage;
window.lastUpdateTime = null;
window.dataSourceStatus = {};

// Get current language from URL params or default to 'zh'
const urlParams = new URLSearchParams(location.search);
window.currentLang = urlParams.get('lang') || 'zh';

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  mountControls();

  try {
    await loadDataWithStatus();
    bind();
    applyAndRender();
    
    // 设置自动刷新（每5分钟检查一次）
    setInterval(checkForUpdates, 5 * 60 * 1000);
  } catch (e) {
    console.error('Initialization failed:', e);
    showError(e.message);
  }
}

// 增强的数据加载函数，包含状态管理
async function loadDataWithStatus() {
  try {
    showLoadingStatus(true);
    raw = await loadData();
    window.currentData = raw;
    window.lastUpdateTime = new Date();
    
    // 分析数据源状态
    analyzeDataSources();
    
    renderSources(['all', ...new Set(raw.map(x => x.source))]);
    
    // 根据当前语言选择标签字段
    const lang = window.currentLang || 'zh';
    const tagsField = lang === 'zh' ? 'tags_zh' : 'tags';
    const allTags = raw.flatMap(x => {
      const tags = x[tagsField] || x.tags || [];
      return tags;
    });
    renderTags(['all', ...new Set(allTags)]);
    
    updateLastUpdateTime();
    showLoadingStatus(false);
  } catch (e) {
    showLoadingStatus(false);
    throw e;
  }
}

// 分析数据源状态
function analyzeDataSources() {
  const sources = {};
  const now = new Date();
  
  raw.forEach(item => {
    const source = item.source;
    if (!sources[source]) {
      sources[source] = {
        count: 0,
        latestDate: null,
        oldestDate: null
      };
    }
    
    sources[source].count++;
    const itemDate = new Date(item.date);
    
    if (!sources[source].latestDate || itemDate > sources[source].latestDate) {
      sources[source].latestDate = itemDate;
    }
    if (!sources[source].oldestDate || itemDate < sources[source].oldestDate) {
      sources[source].oldestDate = itemDate;
    }
  });
  
  // 计算数据源活跃度
  Object.keys(sources).forEach(source => {
    const daysSinceLatest = (now - sources[source].latestDate) / (1000 * 60 * 60 * 24);
    sources[source].status = daysSinceLatest < 7 ? 'active' : daysSinceLatest < 30 ? 'moderate' : 'inactive';
  });
  
  window.dataSourceStatus = sources;
}

// 以"页面 URL"为基准解析 data.json；加入时间戳避免缓存；若拿到 HTML（如 404 页面）则报错
async function loadData() {
  // 构建data.json的URL，确保在GitHub Pages环境下正确工作
  let dataUrl;
  if (window.location.pathname.includes('/curated-gems/')) {
    // GitHub Pages环境
    dataUrl = window.location.origin + '/curated-gems/data.json';
  } else {
    // 本地开发环境
    dataUrl = new URL('data.json', window.location.href).toString();
  }
  
  // 添加时间戳避免缓存
  const url = new URL(dataUrl);
  url.searchParams.set('_', Date.now());
  const urlStr = url.toString();

  console.log('Fetching:', urlStr);
  const res = await fetch(urlStr, { 
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
  console.log('HTTP status:', res.status, res.ok);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const text = await res.text();
  if (/^\s*<!doctype html>|^\s*<html/i.test(text)) {
    throw new Error(`Got HTML instead of JSON from ${urlStr}. This might indicate the data.json file doesn't exist or GitHub Actions hasn't run yet.`);
  }
  
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      throw new Error('Data format error: expected an array');
    }
    return data;
  } catch (e) {
    console.error('Raw response (first 200 chars):', text.slice(0, 200));
    throw new Error(`JSON parsing failed: ${e.message}`);
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
      tags: '标签',
      refresh: '刷新数据',
      lastUpdate: '最后更新',
      loading: '加载中...'
    },
    en: {
      search: 'Search articles, summaries...',
      sort: 'Sort by',
      random: 'Random',
      newest: 'Newest',
      oldest: 'Oldest',
      clearFilters: 'Clear all filters',
      sources: 'Sources',
      tags: 'Tags',
      refresh: 'Refresh Data',
      lastUpdate: 'Last Update',
      loading: 'Loading...'
    }
  };

  // 创建与v3一致的控件结构
  $('#controls').innerHTML = `
    <div class="controls">
      <div class="search-section">
        <input id="search" placeholder="${texts[lang].search}" type="text" />
        <button id="refresh" class="refresh-btn" title="${texts[lang].refresh}">
          <span class="refresh-icon">🔄</span>
          <span class="refresh-text">${texts[lang].refresh}</span>
        </button>
        <button id="clear-filters" class="clear-btn">${texts[lang].clearFilters}</button>
        <select id="sort">
          <option value="newest">${texts[lang].newest}</option>
          <option value="oldest">${texts[lang].oldest}</option>
        </select>
      </div>
      <div class="status-row">
        <div id="last-update" class="last-update"></div>
        <div id="loading-status" class="loading-status hidden">${texts[lang].loading}</div>
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
  
  searchEl = $('#search'); 
  sortEl = $('#sort');
  refreshEl = $('#refresh');
}

function bind() {
  searchEl.addEventListener('input', applyAndRender);
  $('#sources').addEventListener('click', e => toggleMulti(e, 'source'));
  $('#tags').addEventListener('click', e => toggleMulti(e, 'tag'));
  sortEl.addEventListener('change', applyAndRender);
  refreshEl.addEventListener('click', handleRefresh);
  $('#clear-filters').addEventListener('click', clearAllFilters);
}

// 清除所有筛选条件
function clearAllFilters() {
  searchEl.value = '';
  sortEl.value = 'newest';
  activeSources.clear();
  activeSources.add('all');
  activeTags.clear();
  activeTags.add('all');
  applyAndRender();
}

// 手动刷新数据
async function handleRefresh() {
  try {
    refreshEl.disabled = true;
    refreshEl.querySelector('.refresh-icon').style.animation = 'spin 1s linear infinite';
    
    await loadDataWithStatus();
    applyAndRender();
    
    // 显示刷新成功提示
    showNotification('数据刷新成功', 'success');
  } catch (e) {
    console.error('Refresh failed:', e);
    showNotification('数据刷新失败: ' + e.message, 'error');
  } finally {
    refreshEl.disabled = false;
    refreshEl.querySelector('.refresh-icon').style.animation = '';
  }
}

// 检查更新
async function checkForUpdates() {
  try {
    const newData = await loadData();
    if (JSON.stringify(newData) !== JSON.stringify(raw)) {
      showNotification('发现新内容，点击刷新按钮更新', 'info');
    }
  } catch (e) {
    console.log('Background update check failed:', e.message);
  }
}

function toggleMulti(e, type) {
  const t = e.target.closest('.tag'); 
  if (!t) return;

  const val = (type === 'source') ? t.dataset.source : t.dataset.tag;
  const set = (type === 'source') ? activeSources : activeTags;

  if (val === 'all') {
    set.clear(); set.add('all');
  } else {
    if (set.has('all')) set.delete('all');
    set.has(val) ? set.delete(val) : set.add(val);
    if (set.size === 0) set.add('all');
  }

  // 更新 UI
  const parent = type === 'source' ? $('#sources') : $('#tags');
  [...parent.children].forEach(n => {
    const v = (type === 'source') ? n.dataset.source : n.dataset.tag;
    n.classList.toggle('active', set.has('all') ? v === 'all' : set.has(v));
  });

  applyAndRender();
}

function applyAndRender() {
  const q = (searchEl.value || '').trim().toLowerCase();
  const lang = window.currentLang || 'zh';

  view = raw.filter(x => {
    const summaryField = lang === 'zh' ? 'summary_zh' : 'summary_en';
    const quoteField = lang === 'zh' ? 'best_quote_zh' : 'best_quote_en';
    const titleField = lang === 'zh' ? (x.title_zh || x.title) : x.title;
    const tagsField = lang === 'zh' ? 'tags_zh' : 'tags';
    const currentTags = x[tagsField] || x.tags || [];
    
    const inQ = !q
      || titleField?.toLowerCase().includes(q)
      || x[summaryField]?.toLowerCase().includes(q)
      || x[quoteField]?.toLowerCase().includes(q)
      || currentTags.some(t => (t || '').toLowerCase().includes(q));
    const inS = activeSources.has('all') || activeSources.has(x.source);
    const inT = activeTags.has('all') || currentTags.some(t => activeTags.has(t));
    return inQ && inS && inT;
  });

  // 排序逻辑与v3保持一致
  const sortValue = sortEl.value || 'newest';
  view.sort((a, b) => {
    const dateA = Date.parse(a.date || 0);
    const dateB = Date.parse(b.date || 0);
    return sortValue === 'oldest' ? dateA - dateB : dateB - dateA;
  });

  render(view);
}

function renderSources(list) {
  const lang = window.currentLang || 'zh';
  const statusTexts = {
    zh: {
      active: '活跃',
      moderate: '一般',
      inactive: '不活跃',
      articles: '篇文章',
      lastUpdate: '最新更新'
    },
    en: {
      active: 'Active',
      moderate: 'Moderate', 
      inactive: 'Inactive',
      articles: 'articles',
      lastUpdate: 'Last update'
    }
  };
  
  $('#sources').innerHTML = list.map(s => {
    const status = window.dataSourceStatus[s];
    const statusClass = status ? `source-${status.status}` : '';
    const count = status ? ` (${status.count})` : '';
    
    // 构建状态提示信息
    let title = '';
    if (status && s !== 'all') {
      const statusText = statusTexts[lang][status.status];
      const daysAgo = Math.floor((new Date() - status.latestDate) / (1000 * 60 * 60 * 24));
      const timeText = daysAgo === 0 ? (lang === 'zh' ? '今天' : 'today') : 
                      daysAgo === 1 ? (lang === 'zh' ? '昨天' : 'yesterday') :
                      `${daysAgo} ${lang === 'zh' ? '天前' : 'days ago'}`;
      
      title = `${statusText} • ${status.count} ${statusTexts[lang].articles} • ${statusTexts[lang].lastUpdate}: ${timeText}`;
    }
    
    return `<span class="tag ${s === 'all' ? 'active' : ''} ${statusClass}" data-source="${s}" ${title ? `title="${title}"` : ''}>
      ${esc(s)}${count}
    </span>`;
  }).join('');
}



function renderTags(list) {
  const lang = window.currentLang || 'zh';
  const allText = lang === 'zh' ? '全部标签' : 'All Tags';
  
  // 统计每个标签的文章数量
  const tagCounts = {};
  raw.forEach(item => {
    const tagsField = lang === 'zh' ? 'tags_zh' : 'tags';
    const tags = item[tagsField] || item.tags || [];
    tags.forEach(tag => {
      if (tag && tag.trim()) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    });
  });
  
  // 获取所有标签并排序
  const allTags = Object.keys(tagCounts).sort();
  
  $('#tags').innerHTML = `
    <span class="tag ${activeTags.has('all') ? 'active' : ''}" data-tag="all">
      ${allText} (${raw.length})
    </span>
    ${allTags.map(tag => {
      const count = tagCounts[tag] || 0;
      const isActive = activeTags.has(tag) ? 'active' : '';
      const statusText = lang === 'zh' ? `${tag} - ${count}篇文章` : `${tag} - ${count} articles`;
      return `<span class="tag ${isActive}" data-tag="${tag}" title="${statusText}">
        ${esc(tag)} (${count})
      </span>`;
    }).join('')}
  `;
}

function render(items) {
  const listEl = $('#list'), emptyEl = $('#empty');
  const lang = window.currentLang || 'zh';
  
  if (!items.length) {
    listEl.innerHTML = '';
    const emptyTexts = {
      zh: '没有匹配的结果。尝试调整搜索条件或检查数据源是否正常更新。',
      en: 'No matching results. Try adjusting search criteria or check if data sources are updating properly.'
    };
    emptyEl.textContent = emptyTexts[lang];
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  listEl.innerHTML = items.map(item => card(item, lang)).join('');
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
  
  // 添加数据源状态指示
  const sourceStatus = window.dataSourceStatus[item.source];
  const sourceStatusClass = sourceStatus ? `source-${sourceStatus.status}` : '';
  
  return `
    <article class="card">
      <h3><a href="${item.link}" target="_blank" rel="noopener">${esc(title)}</a></h3>
      ${desc ? `<p><span class="ai-label">${aiSummaryLabel}</span>${esc(desc)}</p>` : ''}
      ${quote ? `<blockquote>${quoteSymbols[0]}${esc(quote)}${quoteSymbols[1]}</blockquote>` : ''}
      <div class="meta">
        <span class="source ${sourceStatusClass}">${esc(item.source)}</span>
        <span class="card-tags">${esc(tags)}</span>
        <span class="date">${esc(item.date || '')}</span>
      </div>
    </article>
  `;
}

function renderWithLanguage() {
  if (window.currentData) {
    raw = window.currentData;
    
    // Update current language from URL params
    const urlParams = new URLSearchParams(location.search);
    window.currentLang = urlParams.get('lang') || 'zh';
    
    mountControls();
    renderSources(['all', ...new Set(raw.map(x => x.source))]);
    
    // 根据当前语言选择标签字段
    const lang = window.currentLang || 'zh';
    const tagsField = lang === 'zh' ? 'tags_zh' : 'tags';
    const allTags = raw.flatMap(x => {
      const tags = x[tagsField] || x.tags || [];
      return tags;
    });
    renderTags(['all', ...new Set(allTags)]);
    
    updateLastUpdateTime();
    applyAndRender();
  }
}

// 更新最后更新时间显示
function updateLastUpdateTime() {
  const lang = window.currentLang || 'zh';
  const updateEl = $('#last-update');
  if (!updateEl || !window.lastUpdateTime) return;
  
  const timeStr = window.lastUpdateTime.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US');
  const label = lang === 'zh' ? '最后更新：' : 'Last update: ';
  updateEl.textContent = label + timeStr;
}

// 显示加载状态
function showLoadingStatus(loading) {
  const loadingEl = $('#loading-status');
  if (!loadingEl) return;
  
  if (loading) {
    loadingEl.classList.remove('hidden');
  } else {
    loadingEl.classList.add('hidden');
  }
}

// 显示错误信息
function showError(message) {
  const listEl = $('#list'), emptyEl = $('#empty');
  if (listEl && emptyEl) {
    listEl.innerHTML = '';
    const lang = window.currentLang || 'zh';
    const errorTexts = {
      zh: '数据加载失败: ',
      en: 'Data loading failed: '
    };
    emptyEl.innerHTML = `
      <div class="error-message">
        <h3>${errorTexts[lang]}</h3>
        <p>${esc(message)}</p>
        <button onclick="location.reload()" class="retry-btn">
          ${lang === 'zh' ? '重试' : 'Retry'}
        </button>
      </div>
    `;
    emptyEl.classList.remove('hidden');
  }
}

// 显示通知
function showNotification(message, type = 'info') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 3秒后自动移除
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// 所有样式已迁移到 styles.css 文件中