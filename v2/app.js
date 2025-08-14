let raw = [];
let view = [];
let activeSource = 'all';

// 注意：searchEl / sourcesEl 需要在渲染控件后再赋值，所以用 let
let searchEl, sourcesEl;

const $ = sel => document.querySelector(sel);
const listEl = $('#list');
const emptyEl = $('#empty');
const controlsEl = $('#controls');

init();

async function init() {
    // 1) 先挂载控件（把 #search 和 #sources 放到页面里）
    mountControls();

    // 2) 再去读取数据
    const res = await fetch('./data.json', { cache: 'no-store' });
    raw = await res.json();

    // 3) 渲染来源标签 + 首次渲染列表 + 绑定事件
    renderSources(['all', ...new Set(raw.map(x => x.source))]);
    applyAndRender();
    bindEvents();
}

// 把 v2 所需的控件写入 #controls
function mountControls() {
    controlsEl.innerHTML = `
    <div class="controls">
      <input id="search" placeholder="搜索标题/摘要…" />
      <div id="sources" class="tags"></div>
    </div>
  `;
    searchEl = $('#search');
    sourcesEl = $('#sources');
}

function bindEvents() {
    searchEl.addEventListener('input', applyAndRender);
    sourcesEl.addEventListener('click', e => {
        const t = e.target.closest('.tag'); if (!t) return;
        [...sourcesEl.children].forEach(n => n.classList.remove('active'));
        t.classList.add('active');
        activeSource = t.dataset.source;
        applyAndRender();
    });
}

function applyAndRender() {
    const q = (searchEl.value || '').trim().toLowerCase();
    view = raw.filter(x => {
        const inTitle = x.title?.toLowerCase().includes(q);
        const inDesc = x.desc?.toLowerCase().includes(q);
        const inTags = (x.tags || []).some(t => (t || '').toLowerCase().includes(q));
        const matchQ = !q || inTitle || inDesc || inTags;
        const matchS = activeSource === 'all' || x.source === activeSource;
        return matchQ && matchS;
    });
    render(view);
}

function renderSources(list) {
    sourcesEl.innerHTML = list.map(s => `
    <span class="tag ${s === 'all' ? 'active' : ''}" data-source="${s}">${s}</span>
  `).join('');
}

function render(items) {
    if (!items.length) { listEl.innerHTML = ''; emptyEl.classList.remove('hidden'); return; }
    emptyEl.classList.add('hidden');
    listEl.innerHTML = items.map(card).join('');
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
function esc(s) { return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
