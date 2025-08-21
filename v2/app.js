let raw = [], view = [], activeSource = 'all'; let searchEl, sourcesEl;
const $ = sel => document.querySelector(sel), listEl = $('#list'), emptyEl = $('#empty'), controlsEl = $('#controls');

// Store data globally for language switching
window.currentData = null;
window.renderWithLanguage = renderWithLanguage;

// Get current language from URL params or default to 'zh'
const urlParams = new URLSearchParams(location.search);
window.currentLang = urlParams.get('lang') || 'zh';

init();
async function init() {
    mountControls();
    // 构建data.json的URL，确保在GitHub Pages环境下正确工作
    let dataUrl;
    if (window.location.pathname.includes('/curated-gems/')) {
        // GitHub Pages环境
        dataUrl = window.location.origin + '/curated-gems/data.json';
    } else {
        // 本地开发环境
        dataUrl = './data.json';
    }
    const res = await fetch(dataUrl + '?_=' + Date.now(), { cache: 'no-store' }); raw = await res.json();
    window.currentData = raw;
    renderSources(['all', ...new Set(raw.map(x => x.source))]);
    bind(); applyAndRender();
}
function mountControls() {
    const lang = window.currentLang || 'zh';
    const placeholder = lang === 'zh' ? '搜索标题/摘要/标签…' : 'Search title/summary/tags...';
    controlsEl.innerHTML = `
    <div class="controls">
      <input id="search" placeholder="${placeholder}"/>
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
    const lang = window.currentLang || 'zh';
    view = raw.filter(x => {
        const summaryField = lang === 'zh' ? x.summary_zh : x.summary_en;
        const quoteField = lang === 'zh' ? x.best_quote_zh : x.best_quote_en;
        const titleField = lang === 'zh' ? (x.title_zh || x.title) : x.title;
        const inQ = !q || titleField?.toLowerCase().includes(q) || 
                    summaryField?.toLowerCase().includes(q) || 
                    quoteField?.toLowerCase().includes(q) ||
                    (x.tags || []).some(t => t.toLowerCase().includes(q));
        const inS = activeSource === 'all' || x.source === activeSource;
        return inQ && inS;
    });
    render(view);
}
function renderSources(list) {
    sourcesEl.innerHTML = list.map(s => `<span class="tag ${s === 'all' ? 'active' : ''}" data-source="${s}">${esc(s)}</span>`).join('');
}
function render(items) {
    const lang = window.currentLang || 'zh';
    if (!items.length) { 
        listEl.innerHTML = ''; 
        const emptyTexts = {
            zh: '未找到匹配的内容',
            en: 'No matching content found'
        };
        emptyEl.textContent = emptyTexts[lang];
        emptyEl.classList.remove('hidden'); 
        return; 
    }
    emptyEl.classList.add('hidden'); 
    listEl.innerHTML = items.map(item => card(item, lang)).join('');
}

function renderWithLanguage(items, lang) {
    // Update current language
    window.currentLang = lang;
    
    // Update search placeholder
    const placeholder = lang === 'zh' ? '搜索标题/摘要/标签…' : 'Search title/summary/tags...';
    if (searchEl) searchEl.placeholder = placeholder;
    
    // Re-apply current filters with new language
    applyAndRender();
}

function card(item, lang = 'zh') {
    const tagsArray = lang === 'zh' ? (item.tags_zh || item.tags || []) : (item.tags || []);
    const tags = tagsArray.join(', ');
    const title = lang === 'zh' ? (item.title_zh || item.title) : item.title;
    const desc = lang === 'zh' ? (item.summary_zh || '') : (item.summary_en || '');
    const quote = lang === 'zh' ? (item.best_quote_zh || '') : (item.best_quote_en || '');
    const quoteWrapper = lang === 'zh' ? '「」' : '""';
    const aiSummaryLabel = lang === 'zh' ? 'AI总结：' : 'AI Summary: ';
    
    return `
    <article class="card">
      <h3><a href="${item.link}" target="_blank" rel="noopener">${esc(title)}</a></h3>
      ${desc ? `<p><span class="ai-label">${aiSummaryLabel}</span>${esc(desc)}</p>` : ''}
      ${quote ? `<blockquote>${quoteWrapper[0]}${esc(quote)}${quoteWrapper[1]}</blockquote>` : ''}
      <div class="meta">${esc(item.source)} · ${esc(tags)} · ${esc(item.date || '')}</div>
    </article>
  `;
}

function esc(s) { return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
