import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.png': 'image/png' };
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT 必须是有效端口。');
const server = createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const target = path.resolve(root, relative);
    if (target !== root && !target.startsWith(root + path.sep) || pathname.includes('\\') || pathname.includes('\0')) {
      res.writeHead(403); return res.end('Forbidden');
    }
    if (!(await stat(target)).isFile()) { res.writeHead(404); return res.end('Not found'); }
    const bytes = await readFile(target);
    res.writeHead(200, {
      'Content-Type': types[path.extname(target)] || 'application/octet-stream',
      'Content-Length': bytes.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
    });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch (e) { res.writeHead(e instanceof URIError ? 400 : 404); res.end('Not found'); }
});
server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `端口 ${port} 已被使用。请关闭已有学藏窗口，或设置 PORT 后重试。` : e.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`学藏 StudyHarbor\nLocal: http://127.0.0.1:${port}\n按 Ctrl+C 停止。收藏保存在浏览器，请定期导出备份。`));
