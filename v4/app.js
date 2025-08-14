// v3/app.js (with visible logs)
let raw = [];
let view = [];
let activeSource = 'all';

let searchEl, sortEl, randomBtn;

const $ = (sel) => document.querySelector(sel);

document.addEventListener('DOMContentLoaded', init);

async function init() {
    console.log('[v3] init');
    ensureBasics();     // 确保 #controls / #list / #empty 存在
    mountControls();    // 注入搜索/来源/排序/随机控件

    try {
        const res = await fetch('./data.json', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        raw = await res.json();
        console.log('[v3] loaded items:', Array.isArray(raw) ? raw.length : raw);
    } catch (e) {
        console.error('[v3] data load error:', e);
        const listEl = $('#list');
        const emptyEl = $('#empty');
        listEl.innerHTML = '';
        emptyEl.textContent = '数据加载失败，请稍后再试。';
        emptyEl.classList.remove('hidden');
        return;
    }

    renderSources(['all', ...new Set(raw.map(x => x.source))]);
    bindEvents();
    applyAndRender();
}

// -------- ensure DOMs --------
function ensureBasics() {
    if (!$('#controls')) {
        const el = document.createElement('div');
        el.id = 'controls';
        const main = document.querySelector('main.container') || document.body;
        main.insertBefore(el, main.firstChild);
    }
    if (!$('#list')) {
        const el = document.createElement('div');
        el.id = 'list';
        el.className = 'grid';
        const main = document.querySelector('main.container') || document.body;
        main.appendChild(el);
    }
    if (!$('#empty')) {
        const el = document.createElement('p');
        el.id = 'empty';
        el.className = 'hidden';
        el.textContent = '加载中…';
        const main = document.querySelector('main.container') || document.body;
        main.appendChild(el);
    }
}

// -------- controls --------
function mountControls() {
    const controlsEl = $('#controls');
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
    searchEl = $('#search');
    sortEl = $('#sort');
    randomBtn = $('#random');
}

function bindEvents() {
    searchEl.addEventListener('input', applyAndRender);

    const sourcesEl = $('#sources');
    sourcesEl.addEventListener('click', (e) => {
        const t = e.target.closest('.tag');
        if (!t) return;
        [...sourcesEl.children].forEach(n => n.classList.remove('active'));
        t.classList.add('active');
        activeSource = t.dataset.source;
        applyAndRender();
    });

    sortEl.addEventListener('change', applyAndRender);
    randomBtn.addEventListener('click', recommendOne);
}

// -------- logic --------
function applyAndRender() {
    const listEl = $('#list');
    const emptyEl = $('#empty');

    const q = (searchEl.value || '').trim().toLowerCase();

    view = raw.filter(x => {
        const inTitle = x.title?.toLowerCase().includes(q);
        const inDesc = x.desc?.toLowerCase().includes(q);
        const inTags = (x.tags || []).some(t => (t || '').toLowerCase().includes(q));
        const matchQ = !q || inTitle || inDesc || inTags;
        const matchS = activeSource === 'all' || x.source === activeSource;
        return matchQ && matchS;
    });

    const [key, order] = (sortEl.value || 'date-desc').split('-');
    view.sort((a, b) => {
        let va = a[key] ?? '';
        let vb = b[key] ?? '';
        if (key === 'date') { va = Date.parse(va || 0); vb = Date.parse(vb || 0); }
        return order === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

    if (!view.length) {
        listEl.innerHTML = '';
        emptyEl.textContent = '没有匹配的结果，试试换个关键词或来源。';
        emptyEl.classList.remove('hidden');
        console.log('[v3] render: empty');
        return;
    }
    emptyEl.classList.add('hidden');
    listEl.innerHTML = view.map(card).join('');
    console.log('[v3] render: items', view.length);
}

function renderSources(list) {
    let sourcesEl = $('#sources');
    if (!sourcesEl) {
        // 极限兜底：再造一个
        sourcesEl = document.createElement('div');
        sourcesEl.id = 'sources';
        sourcesEl.className = 'tags';
        const wrap = $('#controls').querySelector('.controls') || $('#controls');
        wrap.appendChild(sourcesEl);
    }
    sourcesEl.innerHTML = list.map(s => `
    <span class="tag ${s === 'all' ? 'active' : ''}" data-source="${s}">${esc(s)}</span>
  `).join('');
}

function recommendOne() {
    if (!view.length) return;
    const last = localStorage.getItem('lastPickId');
    let pick = view[Math.floor(Math.random() * view.length)];
    if (view.length > 1 && String(pick.id || pick.title) === last) {
        pick = view[(view.indexOf(pick) + 1) % view.length];
    }
    localStorage.setItem('lastPickId', String(pick.id || pick.title));
    window.open(pick.link, '_blank', 'noopener');
}

function card(item) {
    const tags = (item.tags || []).join(', ');
    return `
    <article class="card">
      <h3><a href="${item.link}" target="_blank" rel="noopener">${esc(item.title)}</a></h3>
      <p>${esc(item.desc || '')}</p>
      <div class="meta">${esc(item.source)} · ${esc(tags)} · ${esc(item.date || '')}</div>
    </article>
  `;
}

function esc(s) {
    return String(s || '').replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
    }[m]));
}
