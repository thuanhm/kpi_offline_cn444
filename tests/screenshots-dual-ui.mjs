// Chụp ảnh bàn giao Dual UI + đo hiệu năng (ứng dụng thật, dữ liệu MẪU, hồ sơ trình duyệt sạch).
//   node tests/screenshots-dual-ui.mjs   → docs/screenshots/*.png, tests/out/perf.json
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SHOT = path.join(ROOT, 'docs', 'screenshots'), OUT = path.join(ROOT, 'tests', 'out');
const APPURL = pathToFileURL(path.join(ROOT, 'App', 'index.html')).href, KEY = 'KPI_CN444.giao_dien';
fs.mkdirSync(SHOT, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
const b = await launch(9352), perf = {};
async function page(w, h, pref) {
  const p = await b.newPage(); await p.viewport(w, h); await p.goto(APPURL, { ready: false });
  await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000);
  if (pref) { await p.eval(`localStorage.setItem('${KEY}', '${pref}')`); await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000); }
  await p.sleep(700); return p;
}
const go = async (p, h, ms = 1100) => { await p.eval(`location.hash = '${h}'`); await p.sleep(ms); };
const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
const renderMs = (p, n = 7) => p.eval(`(async () => { const r = []; for (let i = 0; i < ${n}; i++) { r.push(await new Promise((ok) => { const t = performance.now(); APP.render(); requestAnimationFrame(() => requestAnimationFrame(() => ok(performance.now() - t))); })); } return r; })()`);
try {
  for (const [w, h] of [[1440, 900], [1920, 1080]]) {
    const s = `${w}x${h}`;
    let p = await page(w, h, 'cu'); await go(p, '#/tong-quan'); await p.shot(path.join(SHOT, `01_legacy_tong-quan_${s}.png`));
    await go(p, '#/dieu-hanh'); await p.shot(path.join(SHOT, `02_legacy_dieu-hanh_${s}.png`)); await p.close();
    p = await page(w, h, 'moi'); await go(p, '#/tong-quan'); await p.shot(path.join(SHOT, `03_new_tong-quan_${s}.png`));
    await p.shot(path.join(SHOT, `03b_new_tong-quan_toan-trang_${s}.png`), { full: true });
    await go(p, '#/dieu-hanh'); await p.shot(path.join(SHOT, `04_new_dieu-hanh-bgd_${s}.png`)); await p.shot(path.join(SHOT, `04b_new_dieu-hanh-bgd_toan-trang_${s}.png`), { full: true });
    await go(p, '#/chi-tieu/NII'); await p.eval(`APP.ct_dv = 'PGD_DC'; APP.render()`); await p.sleep(900); await p.shot(path.join(SHOT, `05_new_phan-tich-chi-tiet_${s}.png`));
    await go(p, '#/ma-tran'); await p.shot(path.join(SHOT, `06_new_ma-tran-trang-thai_${s}.png`));
    await go(p, '#/xep-hang'); await p.shot(path.join(SHOT, `07_new_xep-hang_${s}.png`));
    await go(p, '#/phong/PGD_DC'); await p.shot(path.join(SHOT, `08_new_the-diem-don-vi_${s}.png`));
    await p.eval(`(() => { sessionStorage.setItem('KPI_CN444.admin','1'); sessionStorage.setItem('KPI_CN444.user_ss','admin'); STORE.state.users.forEach(u => { u.mac_dinh = false; }); APP.render(); })()`); await go(p, '#/danh-muc', 1300); await p.shot(path.join(SHOT, `09_new_man-hinh-cu-trong-vo-moi_danh-muc_${s}.png`));
    await go(p, '#/tong-quan'); await p.click('[data-act="stage"]'); await p.sleep(900); await p.shot(path.join(SHOT, `10_new_presentation_tong-quan_${s}.png`));
    await p.click('[data-st="dieu-hanh"]'); await p.sleep(900); await p.shot(path.join(SHOT, `11_new_presentation_dieu-hanh_${s}.png`)); await p.close();
  }
  /* nút chuyển đổi (cận cảnh) ở cả hai giao diện */
  for (const pref of ['cu', 'moi']) {
    const p = await page(1440, 900, pref); const r = await p.eval(`(() => { const e = document.querySelector('#topbar .ui-sw').getBoundingClientRect(); return { x: e.left - 16, y: Math.max(0, e.top - 12), w: e.width + 32, h: e.height + 24 }; })()`);
    const { data } = await p.S('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 2 } }); fs.writeFileSync(path.join(SHOT, `12_nut-chuyen-doi_${pref === 'cu' ? 'dang-o-giao-dien-cu' : 'dang-o-giao-dien-moi'}.png`), Buffer.from(data, 'base64')); await p.close();
  }
  /* hiệu năng */
  let p = await page(1440, 900, 'cu'); await go(p, '#/tong-quan'); perf.legacy_render_ms = med(await renderMs(p));
  await go(p, '#/dieu-hanh'); perf.legacy_dieu_hanh_render_ms = med(await renderMs(p));
  perf.first_switch_to_new_ms = await p.eval(`new Promise((ok) => { const t = performance.now(); UI_SWITCH.dat('moi').then(() => requestAnimationFrame(() => requestAnimationFrame(() => ok(performance.now() - t)))); })`);
  await go(p, '#/tong-quan'); perf.new_tong_quan_render_ms = med(await renderMs(p));
  await go(p, '#/dieu-hanh'); perf.new_dieu_hanh_render_ms = med(await renderMs(p));
  perf.later_switch_ms = med(await p.eval(`(async () => { const r = []; for (let i = 0; i < 6; i++) { r.push(await new Promise((ok) => { const t = performance.now(); UI_SWITCH.dat(i % 2 ? 'moi' : 'cu').then(() => requestAnimationFrame(() => requestAnimationFrame(() => ok(performance.now() - t)))); })); } return r; })()`));
  perf.new_ui_asset_kb = Math.round(['ui-moi/moi-tokens.css', 'ui-moi/moi-components.css', 'ui-moi/moi-layout.css', 'ui-moi/moi-matrix.css', 'ui-moi/moi.css', 'ui-moi/vtb.js', 'ui-moi/moi-data.js', 'ui-moi/moi-views.js', 'ui-moi/moi-views2.js', 'ui-moi/moi-shell.js', 'js/ui-switch.js'].reduce((a, f) => a + fs.statSync(path.join(ROOT, 'App', f)).size, 0) / 1024);
  await p.close();
  for (const k in perf) perf[k] = Math.round(perf[k] * 10) / 10;
  fs.writeFileSync(path.join(OUT, 'perf.json'), JSON.stringify(perf, null, 1)); console.log(JSON.stringify(perf));
  console.log('ảnh:', fs.readdirSync(SHOT).length, 'tệp trong docs/screenshots');
} finally { await b.close(); }
