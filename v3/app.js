let raw = [], view = [], activeSource = 'all';
let searchEl, sortEl, randomBtn;

const $ = sel => document.querySelector(sel);

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
    console.log('Data loaded:', raw.length, 'items');
    console.log('First item:', raw[0]);
  } catch (e) {
    console.error('Data loading failed:', e);
    $('#list').innerHTML = '';
    $('#empty').textContent = '数据加载失败: ' + e.message;
    $('#empty').classList.remove('hidden');
    return;
  }

  renderSources(['all', ...new Set(raw.map(x => x.source))]);
  bind();
  applyAndRender();
}

async function loadData() {
  // 基于“页面 URL” 生成 data.json 的绝对地址（不受 app.js 所在目录影响）
  // index.html 和 data.json 都在仓库根目录时，最终会请求：
  // https://<username>.github.io/<repo>/data.json
  const url = new URL('data.json', window.location.href);
  // 加入时间戳避免 CDN 旧缓存
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

  controlsEl.innerHTML = `
    <div class="controls">
      <input id="search" placeholder="搜索标题/摘要/标签…"/>
      <div id="sources" class="tags"></div>
      <select id="sort">
        <option value="date-desc">按时间 ↓</option>
        <option value="date-asc">按时间 ↑</option>
        <option value="title-asc">标题 A→Z</option>
        <option value="title-desc">标题 Z→A</option>
      </select>
      <button id="random" type="button">今日一篇</button>
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

  view = raw.filter(x => {
    const inQ = !q ||
      x.title?.toLowerCase().includes(q) ||
      x.desc?.toLowerCase().includes(q) ||
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

  if (!listEl || !emptyEl) {
    console.error('List or empty element not found');
    return;
  }

  if (!items.length) {
    listEl.innerHTML = '';
    emptyEl.textContent = '没有匹配的结果';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  listEl.innerHTML = items.map(card).join('');
}

function card(item) {
  const tags = (item.tags || []).join(', ');
  const desc = item.summary_zh || item.desc || '';
  const quote = item.best_quote_zh || '';
  return `
    <article class="card">
      <h3><a href="${item.link}" target="_blank" rel="noopener">${esc(item.title)}</a></h3>
      <p>${esc(desc)}</p>
      ${quote ? `<blockquote>「${esc(quote)}」</blockquote>` : ''}
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
