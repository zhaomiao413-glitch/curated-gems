let raw = [], view = [], activeSources = new Set(['all']), activeTags = new Set(['all']);
let searchEl, sortEl;
const $ = sel => document.querySelector(sel);

// Store data globally for language switching
window.currentData = null;
window.renderWithLanguage = renderWithLanguage;

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  mountControls();

  try {
    raw = await loadData();                 // ✅ 统一的安全加载
    window.currentData = raw;
    renderSources(['all', ...new Set(raw.map(x => x.source))]);
    renderTags(['all', ...new Set(raw.flatMap(x => x.tags || []))]);
    bind();
    applyAndRender();
  } catch (e) {
    console.error('Data loading failed:', e);
    const listEl = $('#list'), emptyEl = $('#empty');
    if (listEl && emptyEl) {
      listEl.innerHTML = '';
      const lang = window.currentLang || 'zh';
      const errorTexts = {
        zh: '数据加载失败: ',
        en: 'Data loading failed: '
      };
      emptyEl.textContent = errorTexts[lang] + e.message;
      emptyEl.classList.remove('hidden');
    }
  }
}

// 以“页面 URL”为基准解析 data.json；加入时间戳避免缓存；若拿到 HTML（如 404 页面）则报错
async function loadData() {
  const url = new URL('data.json', window.location.href);
  url.searchParams.set('_', Date.now());
  const urlStr = url.toString();

  console.log('Fetching:', urlStr);
  const res = await fetch(urlStr, { cache: 'no-store' });
  console.log('HTTP status:', res.status, res.ok);

  const text = await res.text();
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
  const lang = window.currentLang || 'zh';
  const texts = {
    zh: {
      placeholder: '搜索标题/摘要/标签…',
      sortDateDesc: '按时间 ↓',
      sortDateAsc: '按时间 ↑',
      sortTitleAsc: '标题 A→Z',
      sortTitleDesc: '标题 Z→A'
    },
    en: {
      placeholder: 'Search title/summary/tags...',
      sortDateDesc: 'By Date ↓',
      sortDateAsc: 'By Date ↑',
      sortTitleAsc: 'Title A→Z',
      sortTitleDesc: 'Title Z→A'
    }
  };

  $('#controls').innerHTML = `
    <div class="controls">
      <input id="search" placeholder="${texts[lang].placeholder}"/>
      <div id="sources" class="tags"></div>
      <div id="tags" class="tags"></div>
      <select id="sort">
        <option value="date-desc">${texts[lang].sortDateDesc}</option>
        <option value="date-asc">${texts[lang].sortDateAsc}</option>
        <option value="title-asc">${texts[lang].sortTitleAsc}</option>
        <option value="title-desc">${texts[lang].sortTitleDesc}</option>
      </select>
    </div>`;
  searchEl = $('#search'); 
  sortEl   = $('#sort');
}

function bind() {
  searchEl.addEventListener('input', applyAndRender);
  $('#sources').addEventListener('click', e => toggleMulti(e, 'source'));
  $('#tags').addEventListener('click',   e => toggleMulti(e, 'tag'));
  sortEl.addEventListener('change', applyAndRender);
}

function toggleMulti(e, type) {
  const t = e.target.closest('.tag'); 
  if (!t) return;

  const val = (type === 'source') ? t.dataset.source : t.dataset.tag;
  const set = (type === 'source') ? activeSources   : activeTags;

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
    
    const inQ = !q
      || titleField?.toLowerCase().includes(q)
      || x[summaryField]?.toLowerCase().includes(q)
      || x[quoteField]?.toLowerCase().includes(q)
      || (x.tags || []).some(t => (t || '').toLowerCase().includes(q));
    const inS = activeSources.has('all') || activeSources.has(x.source);
    const inT = activeTags.has('all') || (x.tags || []).some(t => activeTags.has(t));
    return inQ && inS && inT;
  });

  const [key, order] = (sortEl.value || 'date-desc').split('-');
  view.sort((a, b) => {
    let va = a[key] ?? '', vb = b[key] ?? '';
    if (key === 'date') { va = Date.parse(va || 0); vb = Date.parse(vb || 0); }
    return order === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  render(view);
}

function renderSources(list) {
  $('#sources').innerHTML = list.map(s =>
    `<span class="tag ${s === 'all' ? 'active' : ''}" data-source="${s}">${esc(s)}</span>`
  ).join('');
}

function renderTags(list) {
  $('#tags').innerHTML = list.map(t =>
    `<span class="tag ${t === 'all' ? 'active' : ''}" data-tag="${t}">${esc(t)}</span>`
  ).join('');
}

function render(items) {
  const listEl = $('#list'), emptyEl = $('#empty');
  const lang = window.currentLang || 'zh';
  
  if (!items.length) {
    listEl.innerHTML = '';
    const emptyTexts = {
      zh: '没有匹配的结果',
      en: 'No matching results'
    };
    emptyEl.textContent = emptyTexts[lang];
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  listEl.innerHTML = items.map(item => card(item, lang)).join('');
}

function card(item, lang = 'zh') {
  const tags  = (item.tags || []).join(', ');
  const title = lang === 'zh' ? (item.title_zh || item.title) : item.title;
  const summaryField = lang === 'zh' ? 'summary_zh' : 'summary_en';
  const quoteField = lang === 'zh' ? 'best_quote_zh' : 'best_quote_en';
  const desc  = item[summaryField] || '';
  const quote = item[quoteField] || '';
  const quoteSymbols = lang === 'zh' ? ['「', '」'] : ['"', '"'];
  
  return `
    <article class="card">
      <h3><a href="${item.link}" target="_blank" rel="noopener">${esc(title)}</a></h3>
      <p>${esc(desc)}</p>
      ${quote ? `<blockquote>${quoteSymbols[0]}${esc(quote)}${quoteSymbols[1]}</blockquote>` : ''}
      <div class="meta">${esc(item.source)} · ${esc(tags)} · ${esc(item.date || '')}</div>
    </article>
  `;
}

function renderWithLanguage() {
  if (window.currentData) {
    raw = window.currentData;
    mountControls();
    renderSources(['all', ...new Set(raw.map(x => x.source))]);
    renderTags(['all', ...new Set(raw.flatMap(x => x.tags || []))]);
    applyAndRender();
  }
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  }[m]));
}
