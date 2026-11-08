// Kiểm tra từng preview của Design System: nạp tokens.css + bundle.css + bundle.js như khung xem trước của skill,
// bắt lỗi console, xác nhận có nội dung, chụp ảnh vào screenshots/design-system/.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DS = path.join(ROOT, 'design-system', 'project'), OUT = path.join(ROOT, 'screenshots', 'design-system');
const u = (p) => pathToFileURL(p).href;
const names = fs.readdirSync(path.join(DS, 'components'), { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(DS, 'components', d.name, 'preview.html'))).map((d) => d.name);
const b = await launch(9337); const rows = []; let bad = 0;
try {
  for (const n of names) {
    let html = fs.readFileSync(path.join(DS, 'components', n, 'preview.html'), 'utf8');
    const m = /height=(\d+)/.exec(html.split('\n')[0]); const h = m ? +m[1] : 160;
    html = html.replace('<head>', `<head><link rel="stylesheet" href="${u(path.join(DS, 'tokens.css'))}"><link rel="stylesheet" href="${u(path.join(DS, 'components', 'bundle.css'))}"><script src="${u(path.join(DS, 'components', 'bundle.js'))}"></script>`).replace('<html lang="vi">', '<html lang="vi" data-theme="light">');
    const tmp = path.join(os.tmpdir(), `ds-prev-${n}.html`); fs.writeFileSync(tmp, html);
    const p = await b.newPage(); await p.viewport(n === 'Cover' ? 960 : 760, h + 24);
    await p.goto(u(tmp), { ready: false }); await p.sleep(500);
    const info = await p.eval(`(() => ({ n: (document.getElementById('r') || document.querySelector('svg')).innerHTML.length, ov: document.documentElement.scrollWidth > innerWidth + 1 }))()`);
    const ok = info.n > 40 && p.logs.length === 0 && !info.ov; if (!ok) bad++;
    rows.push({ name: n, ok, bytes: info.n, overflow: info.ov, logs: p.logs.map((l) => l.text.slice(0, 100)) });
    await p.shot(path.join(OUT, n + '.png')); await p.close(); fs.unlinkSync(tmp);
    console.log(ok ? '✓' : '✗', n, info.n, p.logs.map((l) => l.text.slice(0, 90)).join(' | '));
  }
} finally { await b.close(); }
fs.writeFileSync(path.join(ROOT, 'reports', 'ds-preview-test.json'), JSON.stringify({ total: rows.length, failed: bad, rows }, null, 1));
console.log(`${rows.length - bad}/${rows.length} preview chạy được`); process.exit(bad ? 1 : 0);
