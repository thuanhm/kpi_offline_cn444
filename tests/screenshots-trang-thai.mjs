// Chụp ảnh các màn hình chính của giao diện mới (ứng dụng thật, dữ liệu MẪU, hồ sơ trình duyệt sạch) để so sánh trước/sau đồng bộ màu trạng thái.
//   node tests/screenshots-trang-thai.mjs <truoc|sau>   → docs/screenshots/trang-thai/<truoc|sau>/<route>_<WxH>.png
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
const phase = process.argv[2] === 'truoc' ? 'truoc' : 'sau';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SHOT = path.join(ROOT, 'docs', 'screenshots', 'trang-thai', phase);
const APPURL = pathToFileURL(path.join(ROOT, 'App', 'index.html')).href, KEY = 'KPI_CN444.giao_dien';
const ROUTES = ['tong-quan', 'dieu-hanh', 'xep-hang', 'ma-tran', 'phong', 'the-diem-bgd', 'chi-tieu', 'so-ngay', 'du-bao', 'canh-bao', 'hanh-dong', 'diem-kpi'];
fs.mkdirSync(SHOT, { recursive: true });
const b = await launch(9371);
try {
  for (const [w, h] of (phase === 'truoc' ? [[1440, 900], [1920, 1080]] : [[1440, 900], [1920, 1080], [1366, 768]])) {
    const p = await b.newPage(); await p.viewport(w, h); await p.goto(APPURL, { ready: false });
    await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000);
    await p.eval(`localStorage.setItem('${KEY}', 'moi')`); await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .moi-page')`, 20000); await p.sleep(400);
    for (const r of ROUTES) {
      await p.eval(`location.hash='#/${r}'; APP.render()`); await p.sleep(1100);
      await p.shot(path.join(SHOT, `${r}_${w}x${h}.png`)); console.log('ok', r, w, h);
    }
    await p.close();
  }
} finally { await b.close(); }
