// KIỂM THỬ CÔNG CỤ THƯ VIỆN TRÊN GIAO DIỆN MỚI: nút tải ảnh PNG (snapdom) + sắp xếp bảng bấm tiêu đề cột.
//   node tests/browser-cong-cu.mjs   → ghi tests/out/cong-cu-results.json
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = path.join(ROOT, 'tests', 'out');
const APPURL = pathToFileURL(path.join(ROOT, 'App', 'index.html')).href, KEY = 'KPI_CN444.giao_dien';
fs.mkdirSync(OUT, { recursive: true });
const R = []; let fail = 0; const rec = (g, n, ok, d = '') => { R.push({ g, n, ok: !!ok, d: String(d).slice(0, 300) }); if (!ok) fail++; console.log((ok ? '✓' : '✗') + ' [' + g + '] ' + n + (d && !ok ? ' — ' + d : '')); };
const b = await launch(9461);
async function open(mode, route) {
  const p = await b.newPage(); await p.viewport(1440, 900); await p.goto(APPURL, { ready: false });
  await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000);
  await p.eval(`localStorage.setItem('${KEY}', '${mode}')`); await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000);
  await p.eval(`location.hash='#/${route}'; APP.render()`); await p.sleep(900); return p;
}
try {
  let p = await open('moi', 'tong-quan');
  const n = await p.eval(`({ cards: document.querySelectorAll('.moi-tq .moi-card').length, png: document.querySelectorAll('.moi-tq .moi-card > .moi-head .moi-png').length, dup: [...document.querySelectorAll('.moi-card > .moi-head')].some((h) => h.querySelectorAll('.moi-png').length > 1) })`);
  rec('PNG', 'Mỗi thẻ có tiêu đề đều có đúng 1 nút 📷 tải ảnh', n.png >= 5 && !n.dup, JSON.stringify(n));
  rec('PNG', 'Nút có tooltip và aria-label tiếng Việt', await p.eval(`[...document.querySelectorAll('.moi-png')].every((b) => /Tải ảnh PNG/.test(b.title) && /Tải ảnh PNG/.test(b.getAttribute('aria-label')))`));
  rec('PNG', 'Tiêu đề thẻ vẫn ở bên trái, nút lọc/ảnh dồn bên phải, không chồng lấn', await p.eval(`[...document.querySelectorAll('.moi-card > .moi-head')].filter((h) => h.querySelector('.moi-png')).every((h) => { const t = h.querySelector('h2').getBoundingClientRect(), g = h.querySelector('.moi-png').getBoundingClientRect(); return t.right <= g.left + 1 || t.bottom <= g.top + 1; })`));
  const dl = await p.eval(`(async () => { const b = document.querySelector('.a-trend .moi-png'); b.click(); for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 250)); if (document.querySelector('#toasts .toast, .toast')) break; } const t = [...document.querySelectorAll('.toast')].map((x) => x.textContent.trim()).join('|'); return t; })()`);
  rec('PNG', 'Bấm 📷: snapdom nạp được và có thông báo kết quả (không lỗi)', /Đã tải ảnh PNG/.test(dl), dl);
  rec('PNG', 'Không lỗi console khi tải ảnh', p.logs.filter((l) => /error|exception/.test(l.type)).length === 0, JSON.stringify(p.logs.slice(0, 2)));
  /* sắp xếp bảng: chuyển thẻ Xếp hạng sang chế độ Bảng */
  await p.eval(`document.querySelector('.a-rank .moi-seg button[data-view="table"]').click()`); await p.sleep(300);
  const col = await p.eval(`(() => { const t = document.querySelector('.a-rank table.vtb-table'), ths = [...t.tHead.rows[0].cells]; return { n: t.tBodies[0].rows.length, sort: ths.filter((h) => h.classList.contains('moi-sortable')).length, idx: ths.findIndex((h) => /Điểm KPI/.test(h.textContent)) }; })()`);
  rec('Sắp xếp', 'Bảng Xếp hạng có tiêu đề cột bấm được', col.sort >= 4 && col.idx > 0, JSON.stringify(col));
  const vals = () => p.eval(`[...document.querySelectorAll('.a-rank table.vtb-table tbody tr')].map((r) => r.cells[${col.idx}].textContent.trim())`);
  const goc = await vals();
  await p.eval(`document.querySelectorAll('.a-rank table.vtb-table thead th')[${col.idx}].click()`); const asc = await vals();
  await p.eval(`document.querySelectorAll('.a-rank table.vtb-table thead th')[${col.idx}].click()`); const desc = await vals();
  await p.eval(`document.querySelectorAll('.a-rank table.vtb-table thead th')[${col.idx}].click()`); const ve = await vals();
  const num = (a) => a.map((t) => parseFloat(t.replace(/\./g, '').replace(',', '.').replace('−', '-')));
  rec('Sắp xếp', 'Bấm lần 1: tăng dần theo số (so sánh số thật, không so chuỗi)', num(asc).every((x, i, a) => !i || a[i - 1] <= x), asc.join(','));
  rec('Sắp xếp', 'Bấm lần 2: giảm dần', num(desc).every((x, i, a) => !i || a[i - 1] >= x), desc.join(','));
  rec('Sắp xếp', 'Bấm lần 3: về đúng thứ tự gốc (hạng chính thức của engine)', JSON.stringify(ve) === JSON.stringify(goc));
  rec('Sắp xếp', 'Sắp xếp chỉ đổi thứ tự hiển thị: tập giá trị không đổi', JSON.stringify([...asc].sort()) === JSON.stringify([...goc].sort()));
  await p.eval(`document.querySelectorAll('.a-rank table.vtb-table thead th')[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`);
  rec('Sắp xếp', 'Phím Enter trên tiêu đề cột cũng sắp xếp (bàn phím)', await p.eval(`document.querySelectorAll('.a-rank table.vtb-table thead th')[1].getAttribute('aria-sort') === 'ascending'`));
  await p.close();
  /* màn cũ trong vỏ mới: không gắn trùng công cụ (đã có Tabulator/snapdom của chính nó) */
  p = await open('moi', 'du-bao');
  rec('Màn cũ', 'Màn cũ trong vỏ mới không có nút 📷 của giao diện mới (tránh trùng với png-btn có sẵn)', await p.eval(`document.querySelectorAll('.moi-legacy .moi-png').length === 0`));
  await p.close();
  /* khung quản trị không cần ảnh: Người dùng quản trị + Nhật ký thay đổi (cả hai giao diện) */
  for (const mode of ['cu', 'moi']) {
    p = await open(mode, 'tong-quan');
    await p.eval(`(async () => { await STORE.login('admin', '1111'); })()`); await p.eval(`location.hash='#/du-lieu'; APP.render()`); await p.sleep(1200);
    const q = await p.eval(`(() => { const cards = [...document.querySelectorAll('#view .card')]; const f = (t) => cards.find((c) => c.textContent.indexOf(t) >= 0 && c.querySelector('h3') && c.querySelector('h3').textContent.trim() === t); const nd = f('Người dùng quản trị'), nk = f('Nhật ký thay đổi'); return { nd: !!nd, nk: !!nk, ndPng: nd ? nd.querySelectorAll('.png-btn, .moi-png').length : -1, nkPng: nk ? nk.querySelectorAll('.png-btn, .moi-png').length : -1, other: document.querySelectorAll('#view .png-btn, #view .moi-png').length }; })()`);
    rec('Không ảnh', `Giao diện ${mode === 'cu' ? 'cũ' : 'mới'}: "Người dùng quản trị" và "Nhật ký thay đổi" không có nút tải PNG`, q.nd && q.nk && q.ndPng === 0 && q.nkPng === 0, JSON.stringify(q));
    await p.close();
  }
  /* giao diện cũ không đổi */
  p = await open('cu', 'tong-quan');
  rec('Legacy', 'Giao diện cũ không nhận nút/kiểu của giao diện mới', await p.eval(`document.querySelectorAll('.moi-png, .moi-sortable').length === 0 && !document.body.classList.contains('ui-moi')`));
  await p.close();
} catch (e) { rec('Lỗi', 'Ngoại lệ khi chạy', false, e.stack || e.message); }
finally { await b.close(); }
fs.writeFileSync(path.join(OUT, 'cong-cu-results.json'), JSON.stringify({ when: new Date().toISOString(), total: R.length, fail, results: R }, null, 2));
console.log(`\n${R.length - fail}/${R.length} đạt` + (fail ? ` — ${fail} LỖI` : '')); process.exit(fail ? 1 : 0);
