(function (root) {
  'use strict';
  const TYPES = { course: '课程', article: '文章', video: '视频', download: '下载资料', practice: '练习 / 代码' };
  const STATUSES = { todo: '待学习', learning: '学习中', done: '已完成' };
  function normalizeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) throw new Error('请填写资料链接。');
    let url;
    try { url = new URL(raw); } catch { throw new Error('链接格式不正确，请填写以 https:// 或 http:// 开头的完整网址。'); }
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
      throw new Error('请使用不含账号密码的 http:// 或 https:// 网页链接。');
    }
    if (raw.length > 4000) throw new Error('链接太长，请控制在 4000 个字符以内。');
    return url.href;
  }
  function urlKey(value) { const u = new URL(normalizeUrl(value)); u.hash = ''; return u.href; }
  function cleanText(value, name, max, required = false) {
    if (value != null && typeof value !== 'string') throw new Error(`${name}格式不正确。`);
    const text = (value || '').trim();
    if (required && !text) throw new Error(`请填写${name}。`);
    if (text.length > max) throw new Error(`${name}不能超过 ${max} 个字符。`);
    return text;
  }
  function validateResource(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('资料格式不正确。');
    if (!Object.hasOwn(TYPES, input.type)) throw new Error('资料类型不正确。');
    if (!Object.hasOwn(STATUSES, input.status)) throw new Error('学习状态不正确。');
    const rawTags = typeof input.tags === 'string' ? input.tags.split(/[,，]/) : input.tags ?? [];
    if (!Array.isArray(rawTags) || rawTags.length > 8) throw new Error('标签最多填写 8 个，以逗号分隔。');
    const tags = [...new Set(rawTags.map(t => cleanText(t, '标签', 24)).filter(Boolean))];
    const date = new Date(input.createdAt ?? new Date().toISOString());
    if (!Number.isFinite(date.getTime())) throw new Error('资料日期格式不正确。');
    const updated = new Date(input.updatedAt ?? date.toISOString());
    if (!Number.isFinite(updated.getTime())) throw new Error('资料日期格式不正确。');
    return {
      id: cleanText(input.id, '资料编号', 100, true),
      title: cleanText(input.title, '资料标题', 160, true),
      url: normalizeUrl(input.url),
      topic: cleanText(input.topic, '学习主题', 60) || '未分类',
      type: input.type, status: input.status, tags,
      notes: cleanText(input.notes, '笔记', 5000),
      location: cleanText(input.location, '本地位置', 500),
      checkpoint: cleanText(input.checkpoint, '学习位置', 200),
      favorite: input.favorite === true, isDemo: input.isDemo === true,
      createdAt: date.toISOString(), updatedAt: updated.toISOString()
    };
  }
  function parseBackup(text) {
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('文件不是有效的 JSON 备份。'); }
    if (!data || data.app !== 'studyharbor' || data.version !== 1 || !Array.isArray(data.resources)) {
      throw new Error('请选择由学藏导出的第 1 版 JSON 备份文件。');
    }
    if (data.resources.length > 5000) throw new Error('单个备份最多包含 5000 条资料。');
    const ids = new Set();
    return data.resources.map((r, i) => {
      if (r && ids.has(r.id)) throw new Error(`第 ${i + 1} 条资料的编号重复，请使用未修改的备份。`);
      if (r) ids.add(r.id);
      try { return validateResource(r); } catch (e) { throw new Error(`第 ${i + 1} 条资料有误：${e.message}`); }
    });
  }
  function mergeResources(current, incoming, makeId) {
    const result = [...current];
    const urls = new Set(current.map(r => urlKey(r.url)));
    const ids = new Set(current.map(r => r.id));
    let skipped = 0;
    for (const item of incoming) {
      const key = urlKey(item.url);
      if (urls.has(key)) { skipped++; continue; }
      const copy = { ...item, tags: [...item.tags] };
      if (ids.has(copy.id)) copy.id = makeId();
      if (ids.has(copy.id)) throw new Error('资料编号冲突，请重试。');
      ids.add(copy.id); urls.add(key); result.push(copy);
    }
    if (result.length > 5000) throw new Error('资料库最多支持 5000 条，请分库保存。');
    return { resources: result, added: result.length - current.length, skipped };
  }
  function filterResources(resources, options = {}) {
    const terms = (options.query || '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const rows = resources.filter(r => {
      if (options.topic && r.topic !== options.topic) return false;
      if (options.type && r.type !== options.type) return false;
      if (options.status && r.status !== options.status) return false;
      if (options.favorite && !r.favorite) return false;
      const haystack = [r.title, r.url, r.topic, r.notes, r.location, r.checkpoint, ...r.tags].join(' ').toLocaleLowerCase();
      return terms.every(term => haystack.includes(term));
    });
    return rows.sort((a, b) => options.sort === 'title'
      ? a.title.localeCompare(b.title, 'zh-Hans-CN')
      : options.sort === 'oldest'
        ? a.createdAt.localeCompare(b.createdAt)
        : b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title, 'zh-Hans-CN'));
  }
  const api = { TYPES, STATUSES, normalizeUrl, urlKey, validateResource, parseBackup, mergeResources, filterResources };
  root.StudyCore = Object.freeze(api);
})(globalThis);
