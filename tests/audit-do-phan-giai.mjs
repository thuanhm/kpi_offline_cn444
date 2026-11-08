// KIỂM TRA ĐA ĐỘ PHÂN GIẢI: mở MỌI màn hình ở nhiều kích thước, ở giao diện cũ và/hoặc mới, đo lỗi bố cục.
//   node tests/audit-do-phan-giai.mjs [moi|cu|ca-hai] [nhanh]   → in tổng hợp, ghi tests/out/do-phan-giai.json
// Tiêu chí: (1) không tràn ngang trang; (2) không phần tử nào vượt mép phải khung nhìn (trừ vùng cuộn có chủ đích);
// (3) không chồng lấn thẻ; (4) không lỗi console; (5) văn bản không bị cắt trong nút/chip.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = path.join(ROOT, 'tests', 'out');
const APPURL = pathToFileURL(path.join(ROOT, 'App', 'index.html')).href, KEY = 'KPI_CN444.giao_dien';
const which = process.argv[2] || 'moi', quick = process.argv[3] === 'nhanh';
const SIZES = quick ? [[1024, 768], [1366, 768], [1920, 1080]] : [[3840, 2160], [2560, 1440], [1920, 1080], [1680, 1050], [1600, 900], [1536, 864], [1440, 900], [1366, 768], [1280, 720], [1024, 768], [768, 1024], [390, 844]];
const ROUTES = ['tong-quan', 'dieu-hanh', 'xep-hang', 'ma-tran', 'phong', 'the-diem-bgd', 'chi-tieu', 'so-ngay', 'du-bao', 'canh-bao', 'hanh-dong', 'bao-cao-giao-ban', 'nhap-so', 'kiem-tra', 'diem-kpi', 'danh-muc', 'du-lieu', 'huong-dan'];
const b = await launch(9441); const bad = []; let total = 0;
const probe = `(() => { const vw = innerWidth, o = [];
  const sw = document.documentElement.scrollWidth; if (sw > vw + 1) o.push('hscroll:' + sw + '>' + vw);
  const scrollers = (e) => { for (; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (/(auto|scroll|hidden)/.test(s.overflowX) && e.scrollWidth >= e.clientWidth) return true; } return false; };
  const seen = new Set(); document.querySelectorAll('#view *, #topbar *, #sidebar *').forEach((e) => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return; if (r.right > vw + 2 && !scrollers(e.parentElement)) { const k = e.tagName + '.' + String(e.className).slice(0, 30); if (!seen.has(k) && seen.size < 4) { seen.add(k); o.push('beyond:' + k + ' +' + Math.round(r.right - vw)); } } });
  const cards = [...document.querySelectorAll('#view .moi-card, #view .card')].filter((c) => c.getBoundingClientRect().height > 8); const R = cards.map((c) => c.getBoundingClientRect());
  for (let i = 0; i < R.length && o.length < 8; i++) for (let j = i + 1; j < R.length; j++) { const a = R[i], c = R[j]; if (cards[i].contains(cards[j]) || cards[j].contains(cards[i])) continue; if (a.left < c.right - 2 && c.left < a.right - 2 && a.top < c.bottom - 2 && c.top < a.bottom - 2) { o.push('overlap:' + String(cards[i].className).slice(0, 24) + '×' + String(cards[j].className).slice(0, 24)); break; } }
  const clip = [...document.querySelectorAll('#view .moi-btn, #view .vtb-chip, #view .btn, #topbar button, #topbar select')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible'; }).length; if (clip) o.push('clip:' + clip);
  return o; })()`;
for (const mode of (which === 'ca-hai' ? ['moi', 'cu'] : [which])) {
  for (const [w, h] of SIZES) {
    const p = await b.newPage(); await p.viewport(w, h, w < 800);
    await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000);
    await p.eval(`localStorage.setItem('${KEY}', '${mode}')`); await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000); await p.sleep(250);
    for (const r of ROUTES) {
      total++; let res = [];
      try { await p.eval(`location.hash='#/${r}'; APP.render()`); await p.sleep(350); res = await p.eval(probe); } catch (e) { res = ['loi:' + e.message.slice(0, 60)]; }
      const logs = p.logs.splice(0).filter((l) => /error|exception/.test(l.type)).length; if (logs) res.push('console:' + logs);
      if (res.length) bad.push({ mode, size: w + 'x' + h, route: r, issues: res });
    }
    await p.close();
  }
}
await b.close();
const by = {}; bad.forEach((x) => { const k = x.mode + ' ' + x.size; (by[k] = by[k] || []).push(x.route + ' ⇒ ' + x.issues.join('; ')); });
Object.keys(by).forEach((k) => { console.log('\n== ' + k + ' (' + by[k].length + ' màn lỗi)'); by[k].slice(0, 14).forEach((l) => console.log('  ' + l)); });
fs.writeFileSync(path.join(OUT, 'do-phan-giai.json'), JSON.stringify({ when: new Date().toISOString(), total, loi: bad.length, bad }, null, 2));
console.log(`\n${total - bad.length}/${total} lượt mở sạch lỗi`);
