let raw = [], view = [], activeSource = 'all';
const $ = sel => document.querySelector(sel);
const listEl = $('#list'), emptyEl = $('#empty'), searchEl = $('#search');
const sourcesEl = $('#sources'), sortEl = $('#sort'), randomBtn = $('#random');

init();

async function init(){
  const res = await fetch('./data.json', { cache: 'no-store' });
  raw = await res.json();
  renderSources(['all', ...new Set(raw.map(x=>x.source))]);
  bindEvents();
  applyAndRender();
}

function bindEvents(){
  searchEl.addEventListener('input', applyAndRender);
  sourcesEl.addEventListener('click', e=>{
    const t = e.target.closest('.tag'); if(!t) return;
    [...sourcesEl.children].forEach(n=>n.classList.remove('active'));
    t.classList.add('active'); activeSource = t.dataset.source; applyAndRender();
  });
  sortEl.addEventListener('change', applyAndRender);
  randomBtn.addEventListener('click', recommendOne);
}

function applyAndRender(){
  const q = searchEl.value.trim().toLowerCase();
  view = raw.filter(x=>{
    const matchQ = !q || x.title?.toLowerCase().includes(q) || x.desc?.toLowerCase().includes(q)
      || (x.tags||[]).some(t => t.toLowerCase().includes(q));
    const matchS = activeSource==='all' || x.source===activeSource;
    return matchQ && matchS;
  });

  const [key, order] = sortEl.value.split('-'); // date-asc/desc 或 title-asc/desc
  view.sort((a,b)=>{
    let va=a[key]??'', vb=b[key]??'';
    if(key==='date'){ va=Date.parse(va||0); vb=Date.parse(vb||0); }
    return order==='asc' ? (va>vb?1:-1) : (va<vb?1:-1);
  });

  render(view);
}

function recommendOne(){
  if(!view.length) return;
  const last = localStorage.getItem('lastPickId');
  let pick = view[Math.floor(Math.random()*view.length)];
  if(view.length > 1 && String(pick.id||pick.title) === last){
    pick = view[(view.indexOf(pick)+1) % view.length];
  }
  localStorage.setItem('lastPickId', String(pick.id||pick.title));
  window.open(pick.link, '_blank', 'noopener');
}

function renderSources(list){ sourcesEl.innerHTML = list.map(s=>`<span class="tag ${s==='all'?'active':''}" data-source="${s}">${s}</span>`).join(''); }
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
