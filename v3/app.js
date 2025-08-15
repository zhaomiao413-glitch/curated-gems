let raw = [], view = [], activeSource = 'all';
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
    $('#empty').textContent = errorTexts[lang] + e.message;
    $('#empty').classList.remove('hidden');
    return;
  }

  renderSources(['all', ...new Set(raw.map(x => x.source))]);
  bind();
  applyAndRender();
}

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
  const res = await fetch(urlStr, { cache: 'no-store' });
  console.log('HTTP status:', res.status, res.ok);

  const text = await res.text();

  // 如果拿到的是 HTML（如 404 页），提前报错，避免 JSON.parse 抛 '<'
  if (/^\s*<!doctype html>|^\s*<html/i.test(text)) {
    throw new Error(`Got HTML instead of JSON from ${urlStr}. First 120 chars: ${text.slice(0,120)}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Raw response (first 200 chars):', text.slice(0, 200));
    throw e;
  }
}

function mountControls() {
  console.log('Mounting controls');
  const controlsEl = $('#controls');
  if (!controlsEl) {
    console.error('Controls element not found');
    return;
  }

  const lang = window.currentLang || 'zh';
  const texts = {
    zh: {
      placeholder: '搜索标题/摘要/标签…',
      sortDateDesc: '按时间 ↓',
      sortDateAsc: '按时间 ↑',
      sortTitleAsc: '标题 A→Z',
      sortTitleDesc: '标题 Z→A',
      randomBtn: '今日一篇'
    },
    en: {
      placeholder: 'Search title/summary/tags...',
      sortDateDesc: 'By Date ↓',
      sortDateAsc: 'By Date ↑',
      sortTitleAsc: 'Title A→Z',
      sortTitleDesc: 'Title Z→A',
      randomBtn: 'Random Article'
    }
  };

  controlsEl.innerHTML = `
    <div class="controls">
      <input id="search" placeholder="${texts[lang].placeholder}"/>
      <div id="sources" class="tags"></div>
      <select id="sort">
        <option value="date-desc">${texts[lang].sortDateDesc}</option>
        <option value="date-asc">${texts[lang].sortDateAsc}</option>
        <option value="title-asc">${texts[lang].sortTitleAsc}</option>
        <option value="title-desc">${texts[lang].sortTitleDesc}</option>
      </select>
      <button id="random" type="button">${texts[lang].randomBtn}</button>
    </div>`;

  searchEl = $('#search');
  sortEl = $('#sort');
  randomBtn = $('#random');

  console.log('Controls mounted:', { searchEl, sortEl, randomBtn });
}

function bind() {
  console.log('Binding events');

  if (searchEl) {
    searchEl.addEventListener('input', applyAndRender);
  }

  const sourcesEl = $('#sources');
  if (sourcesEl) {
    sourcesEl.addEventListener('click', e => {
      const t = e.target.closest('.tag');
      if (!t) return;
      [...sourcesEl.children].forEach(n => n.classList.remove('active'));
      t.classList.add('active');
      activeSource = t.dataset.source;
      applyAndRender();
    });
  }

  if (sortEl) {
    sortEl.addEventListener('change', applyAndRender);
  }

  if (randomBtn) {
    randomBtn.addEventListener('click', recommendOne);
  }
}

function applyAndRender() {
  console.log('Applying filters and rendering');

  const q = (searchEl?.value || '').trim().toLowerCase();
  const lang = window.currentLang || 'zh';

  view = raw.filter(x => {
    const summaryField = lang === 'zh' ? x.summary_zh : x.summary_en;
    const quoteField = lang === 'zh' ? x.best_quote_zh : x.best_quote_en;
    const titleField = lang === 'zh' ? (x.title_zh || x.title) : x.title;
    const inQ = !q ||
      titleField?.toLowerCase().includes(q) ||
      summaryField?.toLowerCase().includes(q) ||
      quoteField?.toLowerCase().includes(q) ||
      (x.tags || []).some(t => (t || '').toLowerCase().includes(q));
    const inS = activeSource === 'all' || x.source === activeSource;
    return inQ && inS;
  });

  const [key, order] = (sortEl?.value || 'date-desc').split('-');
  view.sort((a, b) => {
    let va = a[key] ?? '', vb = b[key] ?? '';
    if (key === 'date') {
      va = Date.parse(va || 0);
      vb = Date.parse(vb || 0);
    }
    return order === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  console.log('Filtered view:', view.length, 'items');
  render(view);
}

function recommendOne() {
  console.log("随机吧");
  if (!view.length) return;
  const last = localStorage.getItem('lastPickId');
  let pick = view[Math.floor(Math.random() * view.length)];
  if (view.length > 1 && String(pick.id || pick.title) === last) {
    pick = view[(view.indexOf(pick) + 1) % view.length];
  }
  localStorage.setItem('lastPickId', String(pick.id || pick.title));
  window.open(pick.link, '_blank', 'noopener');
}

function renderSources(list) {
  console.log('Rendering sources:', list);

  let el = $('#sources');
  if (!el) {
    console.error('Sources element not found');
    return;
  }

  el.innerHTML = list.map(s =>
    `<span class="tag ${s === 'all' ? 'active' : ''}" data-source="${s}">${esc(s)}</span>`
  ).join('');
}

function render(items) {
  console.log('Rendering items:', items.length);

  const listEl = $('#list');
  const emptyEl = $('#empty');
  const lang = window.currentLang || 'zh';

  if (!listEl || !emptyEl) {
    console.error('List or empty element not found');
    return;
  }

  if (!items.length) {
    listEl.innerHTML = '';
    const emptyTexts = {
      zh: '没有匹配的结果',
      en: 'No matching results found'
    };
    emptyEl.textContent = emptyTexts[lang];
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  listEl.innerHTML = items.map(item => card(item, lang)).join('');
}

function renderWithLanguage(items, lang) {
  // Update current language
  window.currentLang = lang;
  
  // Update controls with new language
  mountControls();
  
  // Re-bind events
  bind();
  
  // Re-apply current filters with new language
  applyAndRender();
}

function card(item, lang = 'zh') {
  const tagsArray = lang === 'zh' ? (item.tags_zh || item.tags || []) : (item.tags || []);
  const tags = tagsArray.join(', ');
  const title = lang === 'zh' ? (item.title_zh || item.title) : item.title;
  const desc = lang === 'zh' ? (item.summary_zh || '') : (item.summary_en || '');
  const quote = lang === 'zh' ? (item.best_quote_zh || '') : (item.best_quote_en || '');
  const quoteWrapper = lang === 'zh' ? '「」' : '""';
  
  return `
    <article class="card">
      <h3><a href="${item.link}" target="_blank" rel="noopener">${esc(title)}</a></h3>
      <p>${esc(desc)}</p>
      ${quote ? `<blockquote>${quoteWrapper[0]}${esc(quote)}${quoteWrapper[1]}</blockquote>` : ''}
      <div class="meta">${esc(item.source)} · ${esc(tags)} · ${esc(item.date || '')}</div>
    </article>
  `;
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}
