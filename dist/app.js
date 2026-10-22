(function () {
  'use strict';
  const C = globalThis.StudyCore;
  const $ = (selector) => document.querySelector(selector);
  const KEY = 'studyharbor.library.v1';
  const iconPaths = {
    library: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    todo: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    learning: '<path d="M3 5c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2V5Z"/><path d="M12 7v14"/>',
    done: '<circle cx="12" cy="12" r="9"/><path d="m7.5 12 3 3 6-6"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    course: '<path d="m2 8 10-5 10 5-10 5L2 8Z"/><path d="M6 10v7c4 3 8 3 12 0v-7M22 8v8"/>',
    article: '<path d="M6 3h9l4 4v14H6V3Z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>',
    video: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 8 6 4-6 4V8Z"/>',
    download: '<path d="M6 3h9l4 4v14H6V3ZM14 3v5h5M12 10v7m-3-3 3 3 3-3"/>',
    practice: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    backup: '<path d="M12 3v12m-4-4 4 4 4-4M4 14v6h16v-6"/>',
    edit: '<path d="m14 5 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 15v5Z"/>',
    delete: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
    open: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
    folder: '<path d="M3 6h7l2 3h9v11H3V6Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.article}</svg>`; }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  const uuid = () => crypto.randomUUID();
  let resources = [], baseRaw = null, locked = false, startupError = '', editingId = null, editBaseRaw = null, confirmAction = null, toastTimer;
  const state = { view: 'all', topic: '', type: '', query: '', sort: 'updated' };
  const colors = ['#a2b787', '#d2b890', '#9dbcb1', '#a8aec8', '#c6a6b4', '#a9bfb5'];
  function demoResources() {
    const root = 'https://ocw.mit.edu/courses/15-053-optimization-methods-in-management-science-spring-2013/';
    const rows = [
      { title: 'MIT 15.053 · 管理科学中的优化方法', url: root, topic: '运筹学入门', type: 'course', status: 'learning', notes: 'MIT 公开课程入口，集中查找课程说明、讲义与作业。', checkpoint: '示例：下次从课程大纲继续', tags: ['公开课', '系统学习'], favorite: true },
      { title: '线性规划与单纯形法 · 课程讲义', url: root + 'resources/lecture-notes/', topic: '线性规划', type: 'download', status: 'todo', notes: 'MIT 课程讲义目录，可按章节寻找需要下载的 PDF。', tags: ['PDF', '单纯形法'] },
      { title: '整数规划 · OR-Tools 官方指南', url: 'https://developers.google.com/optimization/mip', topic: '整数规划', type: 'article', status: 'todo', notes: '从整数变量与混合整数规划的基本概念开始。', tags: ['建模', '官方文档'], favorite: true },
      { title: '用 Python 开始第一个优化模型', url: 'https://developers.google.com/optimization/introduction/python', topic: '运筹学入门', type: 'practice', status: 'learning', notes: 'Google OR-Tools 的 Python 入门示例，适合边读边实践。', checkpoint: '示例：运行完示例后，尝试修改约束', tags: ['Python', '实操'] },
      { title: '网络流 · 最大流与最小费用流', url: 'https://developers.google.com/optimization/flow', topic: '图论与网络优化', type: 'article', status: 'todo', notes: '把运输、分配等问题画成网络，理解节点、边和容量。', tags: ['网络流', '图模型'] },
      { title: '给运筹学学习排一个顺序 · 课程大纲', url: root + 'pages/syllabus/', topic: '运筹学入门', type: 'article', status: 'done', notes: '通过 MIT 课程大纲了解各主题的学习顺序，再建立自己的资料库。', tags: ['课程大纲', '学习路线'] }
    ];
    return rows.map((r, i) => C.validateResource({ ...r, id: `demo-${i + 1}`, isDemo: true, createdAt: new Date(Date.now() - i * 86400000).toISOString() }));
  }
  function deserialize(raw) { return C.parseBackup(raw); }
  function serialize(rows) { return JSON.stringify({ app: 'studyharbor', version: 1, resources: rows }); }
  function initialize() {
    try {
      baseRaw = localStorage.getItem(KEY);
      if (baseRaw === null) {
        const initial = demoResources();
        const raw = serialize(initial);
        localStorage.setItem(KEY, raw);
        resources = initial; baseRaw = raw;
      } else { resources = deserialize(baseRaw); }
    } catch (e) {
      locked = true;
      startupError = `此浏览器中的资料暂时无法读取或保存。为保护已有记录，编辑已暂停。${e.message}`;
    }
    $('#search-icon').innerHTML = icon('search');
    $('#backup-icon').innerHTML = icon('backup');
    bindEvents(); render();
    if (startupError) showStorageError();
  }
  function persist(next) {
    if (locked) throw new Error('当前浏览器无法保存资料，请先处理页面上的存储提示。');
    const current = localStorage.getItem(KEY);
    if (current !== baseRaw) {
      resources = current === null ? [] : deserialize(current);
      baseRaw = current; render();
      throw new Error('资料库已在其他窗口更新，请检查最新内容后重新操作。');
    }
    const raw = serialize(next);
    try { localStorage.setItem(KEY, raw); }
    catch { throw new Error('保存失败，浏览器空间可能不足或禁止存储。已有记录未被覆盖，请先导出备份。'); }
    resources = next; baseRaw = raw; render();
  }
  function change(operation) {
    try { operation(); } catch (e) { toast(e.message, true); }
  }
  function toast(message, error = false) {
    clearTimeout(toastTimer); const box = $('#toast'); box.textContent = message;
    box.className = `toast${error ? ' error' : ''}`; box.hidden = false;
    toastTimer = setTimeout(() => { box.hidden = true; }, error ? 8000 : 4000);
  }
  function showStorageError() {
    const banner = document.createElement('div');
    banner.className = 'demo-banner'; banner.setAttribute('role', 'alert');
    const text = document.createElement('span'); text.textContent = startupError;
    const button = document.createElement('button'); button.className = 'text-button'; button.type = 'button'; button.textContent = '保存原始数据';
    button.addEventListener('click', () => download(baseRaw ?? '{}', 'studyharbor-recovery.json', 'application/json'));
    banner.append(text, button); $('#main').prepend(banner);
    document.querySelectorAll('.local-status,.privacy-chip').forEach(e => { e.textContent = '存储异常 · 请先备份'; });
  }
  function viewTitle() { return state.topic || ({ all: '全部资料', todo: '待学习', learning: '学习中', done: '已完成', favorite: '重点收藏' }[state.view]); }
  function renderNavigation() {
    const nav = [ ['all', 'library', '全部资料', resources.length], ['todo', 'todo', '待学习', resources.filter(r => r.status === 'todo').length], ['learning', 'learning', '学习中', resources.filter(r => r.status === 'learning').length], ['done', 'done', '已完成', resources.filter(r => r.status === 'done').length], ['favorite', 'star', '重点收藏', resources.filter(r => r.favorite).length] ];
    $('#main-nav').innerHTML = nav.map(([view, glyph, label, count]) => `<button type="button" class="nav-item${state.view === view && !state.topic ? ' active' : ''}" data-view="${view}" ${state.view === view && !state.topic ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span><span class="nav-count">${count}</span></button>`).join('');
    const topics = [...new Set(resources.map(r => r.topic))].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
    $('#topic-count').textContent = topics.length;
    $('#topics-nav').innerHTML = topics.map((topic, i) => `<button type="button" class="nav-item topic-item${state.topic === topic ? ' active' : ''}" data-topic="${esc(topic)}" title="${esc(topic)}" ${state.topic === topic ? 'aria-current="page"' : ''}><span class="topic-dot" style="background:${colors[i % colors.length]}"></span><span class="topic-name">${esc(topic)}</span><span class="nav-count">${resources.filter(r => r.topic === topic).length}</span></button>`).join('');
    $('#topic-options').innerHTML = topics.map(t => `<option value="${esc(t)}"></option>`).join('');
  }
  function card(r) {
    const source = new URL(r.url).hostname.replace(/^www\./, '');
    return `<article class="resource-card" data-id="${esc(r.id)}"><div class="card-top"><span class="type-marker ${r.type}" title="${C.TYPES[r.type]}">${icon(r.type)}</span><div class="card-top-right"><span class="status-badge ${r.status}">${C.STATUSES[r.status]}</span><button class="favorite-button${r.favorite ? ' is-favorite' : ''}" type="button" data-action="favorite" aria-label="${r.favorite ? '取消' : '标为'}重点：${esc(r.title)}" aria-pressed="${r.favorite}">${icon('star')}</button></div></div><h3><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a></h3><p class="card-source"><span class="source-domain" title="${esc(source)}">${esc(source)}</span><span>· ${C.TYPES[r.type]}</span>${r.isDemo ? '<span class="demo-mini">· 示例</span>' : ''}</p><p class="card-description">${esc(r.notes || '留下一点收藏理由，让下次学习更有方向。')}</p>${r.checkpoint ? `<div class="card-checkpoint"><span>继续于</span><span>${esc(r.checkpoint)}</span></div>` : ''}${r.location ? `<button class="card-location" type="button" data-action="location" title="复制本地位置：${esc(r.location)}">${icon('folder')}<span>${esc(r.location)}</span></button>` : ''}<div class="card-tags"><button class="card-tag topic" type="button" data-topic="${esc(r.topic)}">${esc(r.topic)}</button>${r.tags.slice(0, 3).map(t => `<button type="button" class="card-tag" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div><div class="card-footer"><select class="status-select" data-action="status" aria-label="学习状态：${esc(r.title)}">${Object.entries(C.STATUSES).map(([key, label]) => `<option value="${key}" ${r.status === key ? 'selected' : ''}>${label}</option>`).join('')}</select><div class="card-actions"><button type="button" class="card-action" data-action="edit" aria-label="编辑：${esc(r.title)}">${icon('edit')}<span>编辑</span></button><button type="button" class="card-action delete" data-action="delete" aria-label="删除：${esc(r.title)}">${icon('delete')}</button><a class="card-action" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" aria-label="打开：${esc(r.title)}">${icon('open')}<span>打开</span></a></div></div></article>`;
  }
  function render() {
    renderNavigation();
    $('#total-count').textContent = resources.length;
    $('#demo-banner').hidden = !resources.some(r => r.isDemo);
    $('#page-title').textContent = state.topic || '我的学习资料';
    $('#page-subtitle').textContent = state.topic ? `把「${state.topic}」的好资料集中起来，慢慢学，随时回看。` : '把散落的好资料，放回有条理的学习里。';
    $('#type-filters').innerHTML = [['', '全部类型'], ...Object.entries(C.TYPES)].map(([key, label]) => `<button type="button" class="type-filter${state.type === key ? ' active' : ''}" data-type="${key}" aria-pressed="${state.type === key}">${label}</button>`).join('');
    const filtered = C.filterResources(resources, { ...state, status: ['todo', 'learning', 'done'].includes(state.view) ? state.view : '', favorite: state.view === 'favorite' });
    $('#list-title').textContent = viewTitle();
    $('#result-count').textContent = `${filtered.length} 份`;
    $('#footer-count').textContent = `显示 ${filtered.length} / ${resources.length} 份资料`;
    const active = state.topic || state.view !== 'all' || state.type || state.query;
    $('#active-filters').hidden = !active;
    $('#filter-description').textContent = [state.topic, state.view !== 'all' ? viewTitle() : '', C.TYPES[state.type], state.query ? `搜索「${state.query}」` : ''].filter(Boolean).join(' · ');
    if (filtered.length) $('#resource-grid').innerHTML = filtered.map(card).join('');
    else {
      const empty = resources.length === 0;
      $('#resource-grid').innerHTML = `<div class="empty-state"><div class="empty-icon">${icon(empty ? 'library' : 'search')}</div><h3>${empty ? '你的第一份好资料，从这里开始' : '这里还没有匹配的资料'}</h3><p>${empty ? '粘贴一个课程、文章或视频链接，写下标题。把值得回看的内容，慢慢收进自己的学习空间。' : '试试更短的关键词，或者清除筛选，看看其他主题里的收藏。'}</p><div class="empty-actions"><button class="button button-primary" data-empty="${empty ? 'add' : 'reset'}" type="button">${empty ? '＋ 收藏第一份资料' : '清除所有筛选'}</button>${empty ? '<button type="button" class="button button-secondary" data-empty="demo">载入运筹学示例</button>' : ''}</div></div>`;
    }
  }
  function resetFilters() { Object.assign(state, { view: 'all', topic: '', type: '', query: '' }); $('#search').value = ''; render(); }
  function selectView(view) { state.view = view; state.topic = ''; render(); }
  function openEditor(id = null, blankTopic = false) {
    if (locked) { toast('当前存储异常，请先保存原始数据并检查浏览器设置。', true); return; }
    const r = id ? resources.find(row => row.id === id) : null;
    if (id && !r) { toast('这份资料已不存在，请刷新列表。', true); return; }
    editingId = id; editBaseRaw = baseRaw;
    const form = $('#resource-form'); form.reset(); $('#form-error').hidden = true;
    $('#dialog-title').textContent = r ? '编辑这份资料' : '收藏一份好资料';
    ['url', 'title', 'topic', 'type', 'status', 'checkpoint', 'notes', 'location'].forEach(name => {
      if (r) form.elements[name].value = r[name];
    });
    if (r) { form.elements.tags.value = r.tags.join(', '); form.elements.favorite.checked = r.favorite; }
    else { form.elements.topic.value = blankTopic ? '' : state.topic; }
    $('#extra-fields').open = !!(r && (r.notes || r.location));
    $('#resource-dialog').showModal();
    if (blankTopic) form.elements.topic.focus(); else form.elements.url.focus();
  }
  function saveForm(event) {
    event.preventDefault();
    try {
      if (editBaseRaw !== baseRaw) throw new Error('资料库已在其他窗口更新，请关闭并重新编辑，避免覆盖新记录。');
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const prior = resources.find(r => r.id === editingId);
      const row = C.validateResource({ ...values, id: editingId || uuid(), favorite: values.favorite === 'on', createdAt: prior?.createdAt, updatedAt: new Date().toISOString(), isDemo: false });
      const duplicate = resources.find(r => r.id !== row.id && C.urlKey(r.url) === C.urlKey(row.url));
      if (duplicate) throw new Error(`这个链接已经收藏为「${duplicate.title}」，请编辑已有资料。`);
      if (!editingId && resources.length >= 5000) throw new Error('资料库已达到 5000 条上限，请先整理并导出备份。');
      const next = prior ? resources.map(r => r.id === row.id ? row : r) : [row, ...resources];
      persist(next); $('#resource-dialog').close(); toast(prior ? '已保存修改。' : '收藏好了，下次学习就从这里开始。');
    } catch (e) { const box = $('#form-error'); box.textContent = e.message; box.hidden = false; box.scrollIntoView({ block: 'nearest' }); }
  }
  function confirm(title, message, operation) {
    $('#confirm-title').textContent = title; $('#confirm-message').textContent = message; confirmAction = operation; $('#confirm-dialog').showModal(); $('#confirm-cancel').focus();
  }
  function download(text, name, mime) {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = name; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
  function exportJson() {
    download(JSON.stringify({ app: 'studyharbor', version: 1, exportedAt: new Date().toISOString(), resources }, null, 2), `studyharbor-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    toast('备份已生成，请在浏览器下载列表确认保存。');
  }
  function exportMarkdown() {
    const md = value => String(value).replace(/[\\`*_{}\[\]<>#|!]/g, '\\$&').replace(/\r?\n/g, ' ');
    const topics = [...new Set(resources.map(r => r.topic))];
    const lines = ['# 我的学习资料库', '', `导出时间：${new Date().toISOString()}`, '', '> 阅读清单仅供阅读与分享，恢复资料请使用 JSON 备份。', ''];
    for (const topic of topics) {
      lines.push(`## ${md(topic)}`, '');
      for (const r of resources.filter(row => row.topic === topic)) {
        const safeUrl = r.url.replace(/[()]/g, c => c === '(' ? '%28' : '%29');
        lines.push(`- [${r.status === 'done' ? 'x' : ' '}] [${md(r.title)}](${safeUrl})${r.isDemo ? '（示例）' : ''}`, `  - 类型：${C.TYPES[r.type]}；状态：${C.STATUSES[r.status]}`);
        if (r.checkpoint) lines.push(`  - 学习位置：${md(r.checkpoint)}`);
        if (r.notes) lines.push(`  - 笔记：${md(r.notes)}`);
        if (r.location) lines.push(`  - 本地位置：${md(r.location)}`);
      }
      lines.push('');
    }
    download(lines.join('\n'), `studyharbor-reading-list-${new Date().toISOString().slice(0, 10)}.md`, 'text/markdown'); toast('阅读清单已生成。');
  }
  async function importJson(file) {
    if (!file) return;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error('备份文件超过 20 MB，请使用较小的 JSON 备份。');
      const incoming = C.parseBackup(await file.text());
      const merged = C.mergeResources(resources, incoming, uuid);
      persist(merged.resources);
      toast(`已导入 ${merged.added} 份资料，跳过 ${merged.skipped} 份重复链接。已有记录保留。`);
    } catch (e) { toast(`导入未完成：${e.message}`, true); }
    finally { $('#import-file').value = ''; }
  }
  async function copyLocation(row) {
    try { await navigator.clipboard.writeText(row.location); toast('本地位置已复制，粘贴到文件管理器中打开。'); }
    catch { openEditor(row.id); $('#extra-fields').open = true; const input = $('#resource-form').elements.location; input.focus(); input.select(); toast('请在“本地文件位置”中手动复制。'); }
  }
  function bindEvents() {
    $('#add-btn').addEventListener('click', () => openEditor());
    $('#new-topic').addEventListener('click', () => openEditor(null, true));
    $('#continue-btn').addEventListener('click', () => { state.type = ''; state.query = ''; $('#search').value = ''; selectView('learning'); $('.library-section').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
    $('#main-nav').addEventListener('click', event => { const b = event.target.closest('[data-view]'); if (b) selectView(b.dataset.view); });
    $('#topics-nav').addEventListener('click', event => { const b = event.target.closest('[data-topic]'); if (b) { state.topic = b.dataset.topic; state.view = 'all'; render(); } });
    $('#type-filters').addEventListener('click', event => { const b = event.target.closest('[data-type]'); if (b) { state.type = b.dataset.type; render(); } });
    $('#search').addEventListener('input', event => { state.query = event.target.value; render(); });
    $('#sort').addEventListener('change', event => { state.sort = event.target.value; render(); });
    $('#reset-filters').addEventListener('click', resetFilters);
    $('#resource-form').addEventListener('submit', saveForm);
    document.querySelectorAll('.close-dialog').forEach(b => b.addEventListener('click', () => $('#resource-dialog').close()));
    ['#help-btn', '#help-top'].forEach(selector => $(selector).addEventListener('click', () => $('#help-dialog').showModal()));
    ['#help-close', '#help-done'].forEach(selector => $(selector).addEventListener('click', () => $('#help-dialog').close()));
    ['#confirm-close', '#confirm-cancel'].forEach(selector => $(selector).addEventListener('click', () => { confirmAction = null; $('#confirm-dialog').close(); }));
    $('#confirm-dialog').addEventListener('cancel', () => { confirmAction = null; });
    $('#confirm-accept').addEventListener('click', () => { const operation = confirmAction; confirmAction = null; $('#confirm-dialog').close(); if (operation) change(operation); });
    $('#clear-demo').addEventListener('click', () => confirm('移除运筹学示例？', '只移除仍标记为“示例”的资料；你添加或编辑保存的资料会保留。', () => { persist(resources.filter(r => !r.isDemo)); toast('示例已移除，可以开始建立自己的资料库。'); }));
    $('#resource-grid').addEventListener('click', event => {
      const empty = event.target.closest('[data-empty]');
      if (empty) { if (empty.dataset.empty === 'add') openEditor(); else if (empty.dataset.empty === 'reset') resetFilters(); else change(() => { persist(C.mergeResources(resources, demoResources(), uuid).resources); resetFilters(); toast('已载入运筹学示例，学习进度仅用于演示。'); }); return; }
      const topic = event.target.closest('[data-topic]');
      if (topic) { state.topic = topic.dataset.topic; state.view = 'all'; render(); return; }
      const tag = event.target.closest('[data-tag]');
      if (tag) { state.query = tag.dataset.tag; $('#search').value = state.query; render(); return; }
      const button = event.target.closest('button[data-action]'), card = event.target.closest('[data-id]');
      if (!button || !card) return;
      const row = resources.find(r => r.id === card.dataset.id); if (!row) return;
      if (button.dataset.action === 'edit') openEditor(row.id);
      else if (button.dataset.action === 'favorite') change(() => { persist(resources.map(r => r.id === row.id ? { ...r, favorite: !r.favorite, updatedAt: new Date().toISOString() } : r)); toast(row.favorite ? '已取消重点标记。' : '已标为重点资料。'); });
      else if (button.dataset.action === 'location') copyLocation(row);
      else if (button.dataset.action === 'delete') confirm('移除这份资料？', `「${row.title}」将从资料库移除。此操作不会删除电脑里的文件。`, () => { persist(resources.filter(r => r.id !== row.id)); toast('已移除这份资料。'); });
    });
    $('#resource-grid').addEventListener('change', event => {
      if (event.target.dataset.action !== 'status') return;
      const id = event.target.closest('[data-id]').dataset.id;
      change(() => { const status = event.target.value; if (!Object.hasOwn(C.STATUSES, status)) throw new Error('学习状态无效。'); persist(resources.map(r => r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r)); toast(`已标记为${C.STATUSES[status]}。`); });
    });
    $('#export-btn').addEventListener('click', () => { $('.backup-menu').open = false; exportJson(); });
    $('#markdown-btn').addEventListener('click', () => { $('.backup-menu').open = false; exportMarkdown(); });
    $('#import-btn').addEventListener('click', () => { $('.backup-menu').open = false; if (locked) { toast('存储异常时无法导入，请先保存原始数据。', true); return; } $('#import-file').click(); });
    $('#import-file').addEventListener('change', event => importJson(event.target.files[0]));
    document.addEventListener('click', event => { if (!event.target.closest('.backup-menu')) $('.backup-menu').open = false; });
    document.addEventListener('keydown', event => { if (event.key === '/' && !event.ctrlKey && !event.metaKey && !document.querySelector('dialog[open]') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { event.preventDefault(); $('#search').focus(); } });
    window.addEventListener('storage', event => {
      if (event.key !== KEY && event.key !== null) return;
      try { const raw = localStorage.getItem(KEY); resources = raw === null ? [] : deserialize(raw); baseRaw = raw; render(); toast('已同步当前浏览器其他窗口的修改。'); }
      catch { toast('其他窗口中的数据无法读取，请先备份并刷新页面。', true); }
    });
  }
  initialize();
})();
