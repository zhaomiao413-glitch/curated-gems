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

function esc(s) { return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
