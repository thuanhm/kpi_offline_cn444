// Nạp dashboard THẬT (máy chủ skill claude-dashboard) bằng trình duyệt headless, ghi lỗi console và chụp ảnh.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = process.argv[2];
const b = await launch(9334);
try {
  const p = await b.newPage(); await p.viewport(1440, 900);
  await p.goto(url, { ready: false }); await p.sleep(6000);
  await p.shot(path.join(ROOT, 'reports', 'real-dash-host.png'));
  const info = await p.eval(`(() => { const f = [...document.querySelectorAll('iframe')]; return { iframes: f.length, title: document.title, text: document.body.innerText.slice(0, 300) }; })()`);
  console.log(JSON.stringify(info)); console.log('log:', p.logs.length); p.logs.slice(0, 15).forEach((l) => console.log(' ', l.type, l.text.slice(0, 220)));
} finally { await b.close(); }
