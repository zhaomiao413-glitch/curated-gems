let raw = [], view = [], activeSource = 'all'; let searchEl, sourcesEl;
const $ = sel => document.querySelector(sel), listEl = $('#list'), emptyEl = $('#empty'), controlsEl = $('#controls');

init();
async function init() {
  mountControls();
  const res = await fetch('./data.json', { cache: 'no-store' }); raw = await res.json();
  renderSources(['all', ...new Set(raw.map(x => x.source))]);
  bind(); applyAndRender();
}
function mountControls() {
  controlsEl.innerHTML = `
    <div class="controls">
      <input id="search" placeholder="搜索标题/摘要/标签…"/>
      <div id="sources" class="tags"></div>
    </div>`;
  searchEl = $('#search'); sourcesEl = $('#sources');
}
function bind() {
  searchEl.addEventListener('input', applyAndRender);
  sourcesEl.addEventListener('click', e => {
    const t = e.target.closest('.tag'); if (!t) return;
    [...sourcesEl.children].forEach(n => n.classList.remove('active'));
    t.classList.add('active'); activeSource = t.dataset.source; applyAndRender();
  });
}
function applyAndRender() {
  const q = (searchEl.value || '').trim().toLowerCase();
  view = raw.filter(x => {
    const inQ = !q || x.title?.toLowerCase().includes(q) || x.desc?.toLowerCase().includes(q) || (x.tags || []).some(t => t.toLowerCase().includes(q));
    const inS = activeSource === 'all' || x.source === activeSource;
    return inQ && inS;
  });
  render(view);
}
function renderSources(list) {
  sourcesEl.innerHTML = list.map(s => `<span class="tag ${s === 'all' ? 'active' : ''}" data-source="${s}">${esc(s)}</span>`).join('');
}
function render(items) {
  if (!items.length) { listEl.innerHTML = ''; emptyEl.classList.remove('hidden'); return; }
  emptyEl.classList.add('hidden'); listEl.innerHTML = items.map(card).join('');
}
function card(i) { const tags = (i.tags || []).join(', '); return `<article class="card"><h3><a href="${i.link}" target="_blank" rel="noopener">${esc(i.title)}</a></h3><p>${esc(i.desc || '')}</p><div class="meta">${esc(i.source)} · ${esc(tags)} · ${esc(i.date || '')}</div></article>`; }
function esc(s) { return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
