let raw = [];
let view = [];
let activeSource = 'all';

const $ = sel => document.querySelector(sel);
const listEl = $('#list');
const emptyEl = $('#empty');
const searchEl = $('#search');
const sourcesEl = $('#sources');

init();

async function init(){
  const res = await fetch('./data.json', { cache: 'no-store' });
  raw = await res.json();
  renderSources(['all', ...new Set(raw.map(x=>x.source))]);
  applyAndRender();
  bindEvents();
}

function bindEvents(){
  searchEl.addEventListener('input', applyAndRender);
  sourcesEl.addEventListener('click', e=>{
    const t = e.target.closest('.tag'); if(!t) return;
    [...sourcesEl.children].forEach(n=>n.classList.remove('active'));
    t.classList.add('active');
    activeSource = t.dataset.source;
    applyAndRender();
  });
}

function applyAndRender(){
  const q = searchEl.value.trim().toLowerCase();
  view = raw.filter(x => {
    const matchQ = !q || x.title?.toLowerCase().includes(q) || x.desc?.toLowerCase().includes(q)
      || (x.tags||[]).some(t => t.toLowerCase().includes(q)); // 允许搜标签
    const matchS = activeSource === 'all' || x.source === activeSource;
    return matchQ && matchS;
  });
  render(view);
}

function renderSources(list){
  sourcesEl.innerHTML = list.map(s=>`<span class="tag ${s==='all'?'active':''}" data-source="${s}">${s}</span>`).join('');
}

function render(items){
  if(!items.length){ listEl.innerHTML=''; emptyEl.classList.remove('hidden'); return; }
  emptyEl.classList.add('hidden');
  listEl.innerHTML = items.map(card).join('');
}

function card(item){
  const tags = (item.tags||[]).join(', ');
  return `
    <article class="card">
      <h3><a href="${item.link}" target="_blank" rel="noopener">${esc(item.title)}</a></h3>
      <p>${esc(item.desc||'')}</p>
      <div class="meta">${esc(item.source)} · ${esc(tags)} · ${esc(item.date||'')}</div>
    </article>
  `;
}
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
