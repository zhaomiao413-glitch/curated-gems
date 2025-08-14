let raw = [], view = [], activeSources = new Set(['all']), activeTags = new Set(['all']);
let searchEl, sortEl;
const $ = sel => document.querySelector(sel);

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
    renderSources(['all', ...new Set(raw.map(x => x.source))]);
    renderTags(['all', ...new Set(raw.flatMap(x => x.tags || []))]);
    bind();
    applyAndRender();
  } catch (e) {
    console.error('Data loading failed:', e);
    const listEl = $('#list'), emptyEl = $('#empty');
    if (listEl && emptyEl) {
      listEl.innerHTML = '';
      emptyEl.textContent = '数据加载失败: ' + e.message;
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
  $('#controls').innerHTML = `
    <div class="controls">
      <input id="search" placeholder="搜索标题/摘要/标签…"/>
      <div id="sources" class="tags"></div>
      <div id="tags" class="tags"></div>
      <select id="sort">
        <option value="date-desc">按时间 ↓</option>
        <option value="date-asc">按时间 ↑</option>
        <option value="title-asc">标题 A→Z</option>
        <option value="title-desc">标题 Z→A</option>
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

  view = raw.filter(x => {
    const inQ = !q
      || x.title?.toLowerCase().includes(q)
      || x.desc?.toLowerCase().includes(q)
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
  const tags  = (item.tags || []).join(', ');
  const desc  = item.summary_zh || item.desc || '';
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
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  }[m]));
}
