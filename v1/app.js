const listEl = document.querySelector('#list');
const emptyEl = document.querySelector('#empty');

init();

async function init(){
  try{
    const res = await fetch('./data.json', { cache: 'no-store' });
    if(!res.ok) throw new Error('load failed');
    const items = await res.json();
    render(items);
  }catch(e){
    listEl.innerHTML = '';
    emptyEl.textContent = '数据加载失败，请稍后再试。';
    emptyEl.classList.remove('hidden');
  }
}

function render(items){
  if(!items?.length){ emptyEl.classList.remove('hidden'); return; }
  emptyEl.classList.add('hidden');
  listEl.innerHTML = items.map(card).join('');
}

function card(item){
  const title = esc(item.title||'Untitled');
  const desc = esc(item.desc||'');
  const tags = (item.tags || []).join(', ');
  const meta = `${esc(item.source||'')} · ${esc(tags)} · ${esc(item.date||'')}`;
  return `
    <article class="card">
      <h3><a href="${item.link}" target="_blank" rel="noopener">${title}</a></h3>
      <p>${desc}</p>
      <div class="meta">${meta}</div>
    </article>
  `;
}

function esc(s){return String(s).replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));}
