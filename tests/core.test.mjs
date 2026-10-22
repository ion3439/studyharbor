import { test } from 'node:test';
import assert from 'node:assert/strict';
await import('../dist/core.js');
const C = globalThis.StudyCore;
const make = (overrides = {}) => C.validateResource({ id: 'r1', title: '单纯形法讲解', url: 'https://example.org/course', type: 'course', status: 'todo', topic: '线性规划', tags: ['运筹学'], ...overrides });
const backup = rows => JSON.stringify({ app: 'studyharbor', version: 1, resources: rows });

test('链接去重忽略片段，保留可能代表不同课程的查询参数', () => {
  assert.equal(C.urlKey('https://EXAMPLE.org/a#lecture1'), C.urlKey('https://example.org/a#lecture2'));
  assert.notEqual(C.urlKey('https://example.org/?lesson=1'), C.urlKey('https://example.org/?lesson=2'));
});
test('拒绝脚本、文件和带凭据的链接', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///C:/secret', 'https://name:pass@example.org', 'example.org', '']) {
    assert.throws(() => C.normalizeUrl(url));
  }
});
test('标题必填，字段长度和未知类型严格校验', () => {
  assert.throws(() => make({ title: '  ' }), /标题/);
  assert.throws(() => make({ title: 'x'.repeat(161) }), /160/);
  assert.throws(() => make({ type: '__proto__' }), /类型/);
  assert.throws(() => make({ status: 'invalid' }), /状态/);
  assert.throws(() => make({ notes: 123 }), /笔记/);
});
test('中文逗号标签去重并去空白，空主题归为未分类', () => {
  const row = make({ tags: '入门， Python, 入门, ', topic: ' ' });
  assert.deepEqual(row.tags, ['入门', 'Python']);
  assert.equal(row.topic, '未分类');
});
test('拒绝过多标签及不合法日期', () => {
  assert.throws(() => make({ tags: new Array(9).fill('tag') }), /最多/);
  assert.throws(() => make({ createdAt: 'invalid date' }), /日期/);
  assert.throws(() => make({ updatedAt: 'invalid date' }), /日期/);
});
test('完整 JSON 备份恢复时保留笔记、进度、本地位置和重点标记', () => {
  const row = make({ status: 'learning', checkpoint: '第3讲 18:30', notes: '复习对偶问题', location: 'D:\\学习\\讲义.pdf', favorite: true });
  assert.deepEqual(C.parseBackup(backup([row])), [row]);
});
test('拒绝错误版本、陌生格式和非 JSON 文件', () => {
  for (const data of ['bad json', '[]', '{}', '{"app":"studyharbor","version":2,"resources":[]}']) assert.throws(() => C.parseBackup(data));
});
test('一条备份记录无效时拒绝整个导入，标出序号', () => {
  assert.throws(() => C.parseBackup(backup([make(), { ...make({ id: 'r2' }), url: 'javascript:alert(1)' }])), /第 2 条/);
});
test('拒绝备份内部重复的记录编号', () => {
  assert.throws(() => C.parseBackup(backup([make(), make({ url: 'https://example.org/other' })])), /编号重复/);
});
test('合并备份跳过重复网址并保留已有学习记录', () => {
  const existing = make({ notes: '已有笔记', status: 'done' });
  const incoming = make({ id: 'other', url: 'https://example.org/course#section', notes: '旧笔记' });
  const result = C.mergeResources([existing], [incoming], () => 'new');
  assert.equal(result.added, 0); assert.equal(result.skipped, 1);
  assert.deepEqual(result.resources, [existing]);
});
test('不同网址的编号冲突会生成新编号，原数组不变', () => {
  const current = [make()];
  const incoming = [make({ url: 'https://example.org/other' })];
  const result = C.mergeResources(current, incoming, () => 'new-id');
  assert.equal(result.resources[1].id, 'new-id');
  assert.equal(incoming[0].id, 'r1'); assert.equal(current.length, 1);
});
test('搜索能找到笔记、标签和下载位置，支持多个关键词', () => {
  const row = make({ notes: '对偶定理', location: 'D:\\讲义\\运筹学.pdf' });
  assert.equal(C.filterResources([row], { query: '对偶 运筹学' }).length, 1);
  assert.equal(C.filterResources([row], { query: '完全无关' }).length, 0);
});
test('主题、类型、状态和重点筛选可组合且不改变原数据顺序', () => {
  const rows = [make({ id: 'a', favorite: true, status: 'learning' }), make({ id: 'b', url: 'https://example.org/b', type: 'article' })];
  assert.deepEqual(C.filterResources(rows, { topic: '线性规划', type: 'course', status: 'learning', favorite: true }).map(r => r.id), ['a']);
  assert.deepEqual(rows.map(r => r.id), ['a', 'b']);
});
test('最近更新和最早收藏的排序符合记录时间', () => {
  const old = make({ createdAt: '2026-01-01', updatedAt: '2026-02-01' });
  const newer = make({ id: 'b', url: 'https://example.org/b', createdAt: '2026-01-02', updatedAt: '2026-03-01' });
  assert.deepEqual(C.filterResources([old, newer], { sort: 'updated' }).map(r => r.id), ['b', 'r1']);
  assert.deepEqual(C.filterResources([newer, old], { sort: 'oldest' }).map(r => r.id), ['r1', 'b']);
});
