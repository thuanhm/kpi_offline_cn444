// Chụp ảnh bàn giao Ma trận chỉ tiêu (ứng dụng thật, dữ liệu MẪU, hồ sơ trình duyệt sạch) → docs/screenshots/ma-tran/
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SHOT = path.join(ROOT, 'docs', 'screenshots', 'ma-tran');
const APPURL = pathToFileURL(path.join(ROOT, 'App', 'index.html')).href, KEY = 'KPI_CN444.giao_dien';
fs.mkdirSync(SHOT, { recursive: true });
const b = await launch(9363);
async function page(w, h) {
  const p = await b.newPage(); await p.viewport(w, h); await p.goto(APPURL, { ready: false });
  await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000);
  await p.eval(`localStorage.setItem('${KEY}', 'moi')`); await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .moi-page')`, 20000); await p.sleep(400); return p;
}
const open = async (p, mode = 'ht', tier = 'all') => { await p.eval(`APP.mt_mode='${mode}'; APP.mt_tier='${tier}'; APP.mt_khoi=''; APP.mt_dv=''; APP.mt_nhom=''; APP.mt_sort='hang'; location.hash='#/ma-tran'; APP.render()`); await p.sleep(900); };
const full = (p, f) => p.shot(path.join(SHOT, f), { full: true });
try {
  for (const [w, h] of [[1440, 900], [1920, 1080], [1366, 768]]) {
    const p = await page(w, h), s = `${w}x${h}`;
    await open(p); await p.shot(path.join(SHOT, `01_tat-ca_${s}.png`)); if (w !== 1366) await p.eval(`document.querySelector('.moi-mx-wrap').style.maxHeight='none'`), await p.sleep(200), await full(p, `01b_tat-ca_toan-trang_${s}.png`);
    await open(p, 'ht', 'chua'); await p.shot(path.join(SHOT, `02_loc-chua-dat_${s}.png`));
    await open(p, 'ht', 'cct'); await p.shot(path.join(SHOT, `03_loc-can-cai-thien_${s}.png`));
    if (w === 1440) {
      await open(p, 'ht', 'dat'); await p.shot(path.join(SHOT, `04_loc-dat_${s}.png`));
      await open(p, 'ht', 'gap'); await p.shot(path.join(SHOT, `05_loc-gap_${s}.png`));
      for (const [m, n] of [['hang', '06_che-do-thu-hang'], ['kh_nam', '07_che-do-kh-nam'], ['diem', '08_che-do-diem-dat'], ['mat', '09_che-do-diem-bi-mat']]) { await open(p, m); await p.shot(path.join(SHOT, `${n}_${s}.png`)); }
      await open(p); const k = (await p.eval(`[...document.getElementById('mx-khoi').options].map(o => o.value)`))[1];
      await p.eval(`(() => { const s = document.getElementById('mx-khoi'); s.value = ${JSON.stringify(k)}; s.dispatchEvent(new Event('change', { bubbles: true })); })()`); await p.sleep(500);
      await p.eval(`(() => { const s = document.getElementById('mx-sort'); s.value = 'yeu'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`); await p.sleep(500);
      await p.click('.moi-mx [data-mxf="cct"]'); await p.sleep(200); await p.shot(path.join(SHOT, `10_ket-hop-loc-khoi-sap-xep-cct_${s}.png`));
      await open(p, 'ht', 'all'); await p.eval(`document.querySelector('.moi-mx-ins').open = true`); await p.sleep(200);
      await p.eval(`document.querySelector('.moi-mx tbody td.vtb-cell[data-tier="chua"] .vtb-cb').scrollIntoView({block:'center'})`);
      const r = await p.eval(`(() => { const e = document.querySelector('.moi-mx tbody td.vtb-cell[data-tier="chua"] .vtb-cb'), q = e.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; })()`);
      await p.S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y }); await p.sleep(300); await p.shot(path.join(SHOT, `11_hover-tooltip_${s}.png`));
      await p.S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 3, y: 3 }); await p.key('Tab'); await p.eval(`document.querySelector('.moi-mx tbody td.vtb-cell[data-tier="cct"] .vtb-cb').focus()`); await p.sleep(300); await p.shot(path.join(SHOT, `12_focus-ban-phim_${s}.png`));
    }
    if (w !== 1366) {
      await open(p); await p.click('[data-act="stage"]'); await p.sleep(1000); await p.shot(path.join(SHOT, `20_presentation_tat-ca_${s}.png`));
      await p.click('.moi-stage [data-mxf="chua"]'); await p.sleep(250); await p.shot(path.join(SHOT, `21_presentation_loc-chua-dat_${s}.png`));
      await p.click('.moi-stage [data-mxf="cct"]'); await p.sleep(250); await p.shot(path.join(SHOT, `22_presentation_loc-can-cai-thien_${s}.png`));
    }
    await p.close();
  }
  console.log('ảnh:', fs.readdirSync(SHOT).length, 'tệp trong docs/screenshots/ma-tran');
} finally { await b.close(); }
