// Chụp ảnh các màn hình ở 1440×900 và 1920×1080.   node tools/shots.mjs [tên-lọc]
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL0 = pathToFileURL(path.join(ROOT, 'standalone', 'index.html')).href;
const SHOTS = [
  ['tong-quan_1440x900', 1440, 900, '', false], ['tong-quan_1440x900_toan-trang', 1440, 900, '', true],
  ['dieu-hanh-bgd_1440x900', 1440, 900, '#man=dieu-hanh', false], ['dieu-hanh-bgd_1440x900_toan-trang', 1440, 900, '#man=dieu-hanh', true],
  ['tong-quan_1920x1080', 1920, 1080, '', false],
  ['trinh-chieu_tong-quan_1920x1080', 1920, 1080, '#tc=1', false], ['trinh-chieu_dieu-hanh-bgd_1920x1080', 1920, 1080, '#man=dieu-hanh&tc=1', false],
  ['chi-tiet-don-vi_1440x900', 1440, 900, '#dv=DV12&ct=NPL', false],
  ['responsive_tong-quan_768x1024', 768, 1024, '', false], ['responsive_dieu-hanh_390x844', 390, 844, '#man=dieu-hanh', false],
];
const only = process.argv[2];
const b = await launch();
try {
  for (const [name, w, h, hash, full] of SHOTS) {
    if (only && !name.includes(only)) continue;
    const p = await b.newPage(); await p.viewport(w, h);
    await p.goto(URL0 + hash); if (hash.includes('dv=')) await p.eval('document.getElementById("tq-bullets")?.scrollIntoView()');
    await p.shot(path.join(ROOT, 'screenshots', name + '.png'), { full });
    console.log('✓', name, p.logs.length ? p.logs.length + ' log lỗi/cảnh báo' : '');
    p.logs.forEach((l) => console.log('   ', l.type, l.text.slice(0, 200)));
    await p.close();
  }
} finally { await b.close(); }
