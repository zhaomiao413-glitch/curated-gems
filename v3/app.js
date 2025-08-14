// v3/app.js (extra-robust)
// 搜索 + 来源筛选 + 排序 + 随机推荐（防连续重复）
// 任何情况下都保证 #controls / #sources 存在，避免 innerHTML on null

let raw = [];
let view = [];
let activeSource = 'all';

let searchEl, sortEl, randomBtn;

const $ = (sel) => document.querySelector(sel);

document.addEventListener('DOMContentLoaded', init);

async function init () {
  // 1) 确保基础挂载点存在
  const listEl  = ensureList();   // #list
  const emptyEl = ensureEmpty();  // #empty
  ensureControlsContainer();      // #controls

  // 2) 注入本期控件
  mountControls();

  // 3) 拉数据
  try {
    const res = await fetch('./data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('load failed');
    raw = await res.json();
  } catch (e) {
    listEl.innerHTML = '';
    emptyEl.textContent = '数据加载失败，请稍后再试。';
    emptyEl.classList.remove('hidden');
    return;
  }

  // 4) 渲染来源标签 + 绑定事件 + 首渲
  renderSources(['all', ...new Set(raw.map(x => x.source))]);
  bindEvents();
  applyAndRender();
}

// ---------- DOM 保底 ----------

function ensureList () {
  let el = $('#list');
  if (!el) {
    el = document.createElement('div');
    el.id = 'list';
    el.className = 'grid';
    document.body.appendChild(el);
  }
  return el;
}

function ensureEmpty () {
  let el = $('#empty');
  if (!el) {
    el = document.createElement('p');
    el.id = 'empty';
    el.className = 'hidden';
    el.textContent = '加载中…';
    document.body.appendChild(el);
  }
  return el;
}

function ensureControlsContainer () {
  let el = $('#controls');
  if (!el) {
    el = document.createElement('div');
    el.id = 'controls';
    // 尽量插在 main 容器里，如果没有就插到 body 顶部
    const main = document.querySelector('main.container') || document.body;
    main.insertBefore(el, main.firstChild);
  }
  return el;
}

// ---------- 挂控件/事件 ----------

function mountControls () {
  const controlsEl = ensureControlsContainer();
  controlsEl.innerHTML = `
    <div class="controls">
      <input id="search" placeholder="搜索标题/摘要/标签…" />
      <div id="sources" class="tags"></div>
      <select id="sort" aria-label="排序">
        <option value="date-desc">按时间 ↓</option>
        <option value="date-asc">按时间 ↑</option>
        <option value="title-asc">标题 A→Z</option>
        <option value="title-desc">标题 Z→A</option>
      </select>
      <button id="random" type="button" title="随机推荐一篇">今日一篇</button>
    </div>
  `;
  searchEl  = $('#search');
  sortEl    = $('#sort');
  randomBtn = $('#random');
}

function bindEvents () {
  searchEl?.addEventListener('input', applyAndRender);

  const sourcesEl = $('#sources');
  sourcesEl?.addEventListener('click', (e) => {
    const t = e.target.closest('.tag');
    if (!t) return;
    [...sourcesEl.children].forEach(n => n.classList.remove('active'));
    t.classList.add('active');
    activeSource = t.dataset.source;
    applyAndRender();
  });

  sortEl?.addEventListener('change', applyAndRender);
  randomBtn?.addEventListener('click', recommendOne);
}

// ---------- 渲染/逻辑 ----------

function applyAndRender () {
  const listEl  = $('#list');
  const emptyEl = $('#empty');

  const q = (searchEl?.value || '').trim().toLowerCase();

  // 过滤：关键词（title/desc/tags）+ 来源
  view = raw.filter(x => {
    const inTitle = x.title?.toLowerCase().includes(q);
    const inDesc  = x.desc?.toLowerCase().includes(q);
    const inTags  = (x.tags || []).some(t => (t || '').toLowerCase().includes(q));
    const matchQ  = !q || inTitle || inDesc || inTags;
    const matchS  = activeSource === 'all' || x.source === activeSource;
    return matchQ && matchS;
  });

  // 排序
  const [key, order] = (sortEl?.value || 'date-desc').split('-');
  view.sort((a, b) => {
    let va = a[key] ?? '';
    let vb = b[key] ?? '';
    if (key === 'date') { va = Date.parse(va || 0); vb = Date.parse(vb || 0); }
    return order === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  // 渲染
  if (!view.length) {
    listEl.innerHTML = '';
    emptyEl.textContent = '没有匹配的结果，试试换个关键词或来源。';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  listEl.innerHTML = view.map(card).join('');
}

function renderSources (list) {
  // 兜底：若没有 #sources，现场创建一个并挂到 #controls 末尾
  let sourcesEl = $('#sources');
  if (!sourcesEl) {
    const controlsEl = ensureControlsContainer();
    const wrapper = controlsEl.querySelector('.controls') || controlsEl;
    const div = document.createElement('div');
    div.id = 'sources';
    div.className = 'tags';
    wrapper.appendChild(div);
    sourcesEl = div;
  }
  sourcesEl.innerHTML = list.map(s => `
    <span class="tag ${s === 'all' ? 'active' : ''}" data-source="${s}">${esc(s)}</span>
  `).join('');
}

function recommendOne () {
  if (!view.length) return;
  const last = localStorage.getItem('lastPickId');
  let pick = view[Math.floor(Math.random() * view.length)];
  if (view.length > 1 && String(pick.id || pick.title) === last) {
    pick = view[(view.indexOf(pick) + 1) % view.length];
  }
  localStorage.setItem('lastPickId', String(pick.id || pick.title));
  window.open(pick.link, '_blank', 'noopener');
}

function card (item) {
  const tags = (item.tags || []).join(', ');
  return `
    <article class="card">
      <h3><a href="${item.link}" target="_blank" rel="noopener">${esc(item.title)}</a></h3>
      <p>${esc(item.desc || '')}</p>
      <div class="meta">${esc(item.source)} · ${esc(tags)} · ${esc(item.date || '')}</div>
    </article>
  `;
}

function esc (s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  }[m]));
}
