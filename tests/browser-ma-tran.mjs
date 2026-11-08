// KIỂM THỬ NGHIỆM THU MA TRẬN CHỈ TIÊU (giao diện mới) trên ỨNG DỤNG THẬT, Edge/Chrome headless (CDP).
//   node tests/browser-ma-tran.mjs   → in kết quả, ghi tests/out/ma-tran-results.json
// Hồ sơ trình duyệt sạch ⇒ dữ liệu MẪU; không đọc/ghi Data/ hay dữ liệu vận hành. Đánh số theo mục XII của yêu cầu.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = path.join(ROOT, 'tests', 'out');
const APPURL = pathToFileURL(path.join(ROOT, 'App', 'index.html')).href, KEY = 'KPI_CN444.giao_dien';
fs.mkdirSync(path.join(OUT, 'mx'), { recursive: true });
const R = []; let fail = 0;
const rec = (g, n, ok, d = '') => { R.push({ g, n, ok: !!ok, d: String(d).slice(0, 300) }); if (!ok) fail++; console.log((ok ? '✓' : '✗') + ' [' + g + '] ' + n + (d && !ok ? ' — ' + d : '')); };
const TIERS = ['dat', 'kha', 'cct', 'chua', 'gap'];
const EXP = { dat: ['rgb(99, 190, 123)', 'rgb(23, 77, 43)'], kha: ['rgb(255, 235, 132)', 'rgb(102, 80, 0)'], cct: ['rgb(244, 162, 97)', 'rgb(113, 56, 0)'], chua: ['rgb(231, 107, 112)', 'rgb(118, 29, 37)'], gap: ['rgb(233, 237, 242)', 'rgb(100, 116, 139)'] };
const DIM = 'rgb(243, 245, 249)';
const b = await launch(9362);
async function moi(w = 1440, h = 900) {
  const p = await b.newPage(); await p.viewport(w, h);
  await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000);
  await p.eval(`localStorage.setItem('${KEY}', 'moi')`); await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .moi-page')`, 20000);
  await p.sleep(400); await p.eval(`location.hash = '#/ma-tran'`); await p.waitFor(`!!document.querySelector('.moi-mx table')`, 10000); await p.sleep(300); return p;
}
const lum = (c) => { const v = c.match(/\d+/g).slice(0, 3).map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const cr = (a, c) => { const x = lum(a), y = lum(c); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const dom = (p) => p.eval(`(() => { const o = {}; ${JSON.stringify(TIERS)}.forEach((t) => { o[t] = document.querySelectorAll('.moi-mx tbody td.vtb-cell[data-tier="' + t + '"]:not(.vtb-mx-cn)').length; }); const ch = {}; document.querySelectorAll('.moi-mx [data-mxf]').forEach((x) => { ch[x.getAttribute('data-mxf')] = +x.getAttribute('data-n'); }); return { o, ch }; })()`);
/* đếm ĐỘC LẬP trong trang bằng engine (không qua MOI_DATA / DOM) theo bộ lọc hiện hành */
const recount = (p, f) => p.eval(`(() => { const M = STORE.model(), k = APP.ky, T = KPI_CFG.TRANG_THAI, f = ${JSON.stringify(f)}, c = { dat: 0, kha: 0, cct: 0, chua: 0, gap: 0 };
  const m = (tt) => tt === T.DAT ? 'dat' : tt === T.KHA ? 'kha' : tt === T.CCT ? 'cct' : tt === T.CHUA_DAT ? 'chua' : 'gap';
  M.ranking(k.nam, k.thang).filter((u) => (!f.khoi || u.khoi === f.khoi) && (!f.dv || u.ma === f.dv)).forEach((u) => u.rows.concat(u.ref).filter((r) => !f.nhom || r.ind.nhom === f.nhom).forEach((r) => { c[m(r.tt)]++; })); return c; })()`);
const setSel = (p, id, v) => p.eval(`(() => { const s = document.getElementById('${id}'); s.value = ${JSON.stringify(v)}; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const opts = (p, id) => p.eval(`[...document.getElementById('${id}').options].map((o) => o.value)`);
const same = (a, b2) => JSON.stringify(a) === JSON.stringify(b2);
const layout = (p) => p.eval(`(() => { const t = document.querySelector('.moi-mx table'), r = t.getBoundingClientRect(); return JSON.stringify([Math.round(r.width), Math.round(r.height), [...t.tHead.rows[0].cells].map((c) => c.textContent), [...t.tBodies[0].querySelectorAll('td.vtb-cell')].map((c) => c.textContent)]); })()`);

try {
  let p = await moi();
  const kpiBefore = await p.eval(`JSON.stringify(STORE.model().ranking(APP.ky.nam, APP.ky.thang).map((c) => [c.ma, c.hang, c.quy_doi, c.so_dat, c.so_kha, c.so_cct, c.so_chua]))`);

  /* 1–3. Màu, biểu tượng, phân biệt */
  const sty = await p.eval(`(() => { const o = {}, g = (s) => (s.match(/\\d+/g) || []).slice(0, 3).map(Number); ['dat', 'kha', 'cct', 'chua', 'gap'].forEach((t) => { const es = [...document.querySelectorAll('.moi-mx tbody td.vtb-cell[data-tier="' + t + '"]:not(.vtb-mx-cn)')]; if (!es.length) { o[t] = null; return; } const cs = es.map((e) => getComputedStyle(e)); o[t] = { n: es.length, bg: cs.map((s) => s.backgroundColor), ink: cs.map((s) => s.color), mean: cs.reduce((a, s) => a + (g(s.backgroundColor)[1] - g(s.backgroundColor)[0]), 0) / es.length, svg: es.filter((e) => e.querySelector('svg')).length }; }); return o; })()`);
  const rgb = (s) => (s.match(/\d+/g) || []).slice(0, 3).map(Number);
  rec('1. Màu', 'Cả 5 trạng thái đều có ô trong ma trận mẫu', TIERS.every((t) => sty[t]), TIERS.filter((t) => !sty[t]).join(','));
  const allBg = new Set(['dat', 'kha', 'cct', 'chua'].flatMap((t) => sty[t].bg));
  rec('Heatmap', 'Nền ô là thang màu LIÊN TỤC (nhiều sắc độ khác nhau, không chỉ vài màu rời rạc)', allBg.size >= 8, 'số màu khác nhau = ' + allBg.size);
  rec('Heatmap', 'Màu đi đúng chiều theo mức: Chưa đạt (đỏ) < Cần cải thiện < Khá < Đạt (xanh) — mức xanh (G−R) tăng dần', sty.chua.mean < sty.cct.mean && sty.cct.mean < sty.kha.mean && sty.kha.mean < sty.dat.mean, ['chua', 'cct', 'kha', 'dat'].map((t) => t + '=' + sty[t].mean.toFixed(0)).join(' '));
  rec('Heatmap', 'Chưa đạt luôn thiên đỏ/cam (R ≥ G), Đạt luôn thiên xanh (G ≥ R)', sty.chua.bg.every((x) => rgb(x)[0] >= rgb(x)[1]) && sty.dat.bg.every((x) => rgb(x)[1] >= rgb(x)[0]));
  rec('1. Màu', 'Tương phản chữ/nền ≥ 4,5:1 (WCAG AA) cho MỌI ô Heatmap (4 mức có số)', ['dat', 'kha', 'cct', 'chua'].every((t) => sty[t].bg.every((b, i) => cr(b, sty[t].ink[i]) >= 4.5)), 'min=' + Math.min(...['dat', 'kha', 'cct', 'chua'].flatMap((t) => sty[t].bg.map((b, i) => cr(b, sty[t].ink[i])))).toFixed(2));
  rec('1. Màu', 'Ô Thiếu số: nền #E9EDF2 đúng quy chuẩn; chữ đậm hơn quy chuẩn (#475569 = --status-gap-text-strong, tương phản ≥ 6:1) để đọc rõ trong Ma trận', sty.gap.bg.every((b, i) => b === EXP.gap[0] && sty.gap.ink[i] === 'rgb(71, 85, 105)' && cr(b, sty.gap.ink[i]) >= 6));
  rec('1. Màu', 'GAP là nền xám trung tính, không thuộc thang đỏ–xanh', sty.gap.bg.every((x) => x === EXP.gap[0]));
  rec('Heatmap', 'Ô Heatmap không dùng biểu tượng; số liệu là nội dung chính', ['dat', 'kha', 'cct', 'chua'].every((t) => sty[t].svg === 0));
  rec('1. Màu', 'Không dùng gradient CSS trong từng ô (mỗi ô một màu đặc)', await p.eval(`[...document.querySelectorAll('.moi-mx td.vtb-cell')].every((e) => getComputedStyle(e).backgroundImage === 'none')`));
  rec('Legend', 'Có thanh chú giải Heatmap liên tục, mốc lấy từ ngưỡng cấu hình', await p.eval(`(() => { const l = document.querySelector('.moi-hm'), g = l && l.querySelector('.moi-hm-grad'), ng = STORE.model().ng, t = [...l.querySelectorAll('.moi-hm-tk b')].map((b) => b.textContent); return !!g && /linear-gradient/.test(getComputedStyle(g).backgroundImage) && t.includes(Math.round(ng.cct * 100) + '%') && t.includes(Math.round(ng.kha * 100) + '%') && t.includes(Math.round(ng.dat * 100) + '%'); })()`));
  rec('2. Đạt/Khá', 'Đạt và Khá khác nhau rõ về màu nền', sty.dat.bg.every((x) => !sty.kha.bg.includes(x)));
  rec('3. CCT/Chưa đạt', 'Cần cải thiện và Chưa đạt khác nhau rõ về màu nền', sty.cct.bg.every((x) => !sty.chua.bg.includes(x)));
  rec('1. Màu', 'Ô thiếu số (chữ "Thiếu số" + nền xám) khác ô "không áp dụng" ("·", không nền)', await p.eval(`(() => { const g = document.querySelector('.moi-mx td.vtb-cell[data-tier="gap"]'), n = document.querySelector('.moi-mx td.vtb-na'); return !!g && !!n && g.textContent.trim() === 'Thiếu số' && n.textContent.trim() === '·' && getComputedStyle(n).backgroundColor !== getComputedStyle(g).backgroundColor && !n.hasAttribute('data-tier'); })()`));
  rec('Legend', 'Chip lọc mang màu Heatmap của mức (4 tông khác nhau)', await p.eval(`(() => { const bg = new Set(); ['dat', 'kha', 'cct', 'chua'].forEach((t) => bg.add(getComputedStyle(document.querySelector('.moi-mx [data-mxf="' + t + '"]')).backgroundColor)); return bg.size === 4; })()`));
  rec('Legend', 'Chip có tooltip giải thích ngưỡng trạng thái (lấy từ cấu hình)', await p.eval(`[...document.querySelectorAll('.moi-mx [data-mxf]:not([data-mxf="all"])')].every((e) => /%/.test(e.getAttribute('data-tip')) || /Thiếu số/.test(e.getAttribute('data-tip')))`));
  rec('Ngôn ngữ', 'Không có ký tự lỗi mã hóa (U+FFFD, "Ã", "Ä") trong vùng Ma trận', await p.eval(`!/[\\uFFFD]|Ã.|Ä./.test(document.querySelector('.moi-mx').innerText)`));

  /* 10. Bộ đếm */
  let d = await dom(p), rc = await recount(p, {});
  rec('10. Bộ đếm', 'Bộ đếm từng trạng thái = số ô thực tế trong bảng (không tính cột Toàn chi nhánh)', same(d.o, { dat: d.ch.dat, kha: d.ch.kha, cct: d.ch.cct, chua: d.ch.chua, gap: d.ch.gap }), JSON.stringify(d));
  rec('10. Bộ đếm', '"Tất cả" = tổng 5 trạng thái = số ô đơn vị trong bảng', d.ch.all === TIERS.reduce((a, t) => a + d.o[t], 0));
  rec('10. Bộ đếm', 'Bộ đếm = đếm độc lập từ thẻ điểm của engine', same(d.o, rc), JSON.stringify(rc));
  rec('10. Bộ đếm', 'Tỷ lệ Chưa đạt = Chưa đạt ÷ (Đạt+Khá+CCT+Chưa đạt)', await p.eval(`(() => { const t = document.querySelector('.moi-mx-rate').innerText, c = ${JSON.stringify(d.o)}, dg = c.dat + c.kha + c.cct + c.chua, e = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(c.chua / dg * 100) + '%'; return t.includes(e); })()`));

  /* 4–9. Bộ lọc trạng thái */
  const lay0 = await layout(p);
  rec('4. Lọc Tất cả', 'Mặc định chọn "Tất cả": không ô nào bị làm mờ', await p.eval(`document.querySelector('.moi-mx').getAttribute('data-f') === 'all' && document.querySelector('[data-mxf="all"]').getAttribute('aria-pressed') === 'true'`) && (await p.eval(`[...document.querySelectorAll('.moi-mx tbody td.vtb-cell[data-tier]')].every((e) => getComputedStyle(e).backgroundColor !== '${DIM}')`)));
  const names = { dat: '5. Lọc Đạt', kha: '6. Lọc Khá', cct: '7. Lọc CCT', chua: '8. Lọc Chưa đạt', gap: '9. Lọc GAP' };
  for (const t of TIERS) {
    p.logs.length = 0; await p.click(`.moi-mx [data-mxf="${t}"]`); await p.sleep(150);
    const r = await p.eval(`(() => { const all = [...document.querySelectorAll('.moi-mx tbody td.vtb-cell[data-tier]')], dim = '${DIM}', m = all.filter((e) => e.getAttribute('data-tier') === '${t}' && !e.classList.contains('vtb-mx-cn')), o = all.filter((e) => e.getAttribute('data-tier') !== '${t}');
      const cs = (e) => getComputedStyle(e); return { f: document.querySelector('.moi-mx').getAttribute('data-f'), pressed: document.querySelector('[data-mxf="${t}"]').getAttribute('aria-pressed'), nm: m.length, matchKeep: m.every((e) => cs(e).backgroundColor !== dim) && all.filter((e) => e.getAttribute('data-tier') === '${t}').every((e) => cs(e).backgroundColor !== dim), otherDim: o.every((e) => cs(e).backgroundColor === dim),
        dimRead: o.length ? o.map((e) => [cs(e).backgroundColor, cs(e).color]) .slice(0, 1) : [], live: document.getElementById('mx-live').textContent, chip: +document.querySelector('[data-mxf="${t}"]').getAttribute('data-n') }; })()`);
    const lay = await layout(p);
    rec(names[t], 'Chỉ làm nổi bật ô ' + t + ': ô khớp giữ màu, ô khác làm mờ nền trung tính', r.f === t && r.pressed === 'true' && r.matchKeep && r.otherDim && r.nm === r.chip, JSON.stringify(r));
    rec(names[t], 'Chữ ô bị làm mờ vẫn đọc được (tương phản ≥ 4,5:1) và bảng không đổi vị trí/cột/số liệu/hạng', r.dimRead.length > 0 && cr(r.dimRead[0][0], r.dimRead[0][1]) >= 4.5 && lay === lay0, 'cr=' + (r.dimRead[0] ? cr(r.dimRead[0][0], r.dimRead[0][1]).toFixed(2) : '-'));
    rec(names[t], 'Thông báo trạng thái (aria-live) nêu số ô đang nổi bật; không lỗi console', new RegExp('Đang làm nổi bật ' + r.nm + ' ô').test(r.live) && p.logs.length === 0, r.live);
  }
  await p.click('.moi-mx [data-mxf="all"]'); await p.sleep(100);

  /* 11. Kết hợp nhiều điều kiện */
  const khoiV = (await opts(p, 'mx-khoi'))[1], nhomV = (await opts(p, 'mx-nhom'))[2];
  await setSel(p, 'mx-khoi', khoiV); await p.sleep(400); await setSel(p, 'mx-nhom', nhomV); await p.sleep(400);
  d = await dom(p); rc = await recount(p, { khoi: khoiV, nhom: nhomV });
  rec('11. Kết hợp lọc', 'Khối + Nhóm chỉ tiêu: bộ đếm = số ô trong bảng = đếm độc lập engine', same(d.o, rc) && same(d.o, { dat: d.ch.dat, kha: d.ch.kha, cct: d.ch.cct, chua: d.ch.chua, gap: d.ch.gap }), JSON.stringify([d, rc]));
  await p.click('.moi-mx [data-mxf="cct"]'); await p.sleep(100);
  const comb = await p.eval(`({ applied: document.getElementById('mx-applied').innerText, f: document.querySelector('.moi-mx').getAttribute('data-f'), rows: document.querySelectorAll('.moi-mx tbody tr:not(.moi-mx-grp)').length, groups: [...document.querySelectorAll('.moi-mx .moi-mx-grp')].map((g) => g.textContent), colUnits: [...document.querySelector('.moi-mx table').tHead.rows[0].cells].length - 2, unitSelected: document.getElementById('mx-khoi').value })`);
  rec('11. Kết hợp lọc', 'Hiển thị rõ điều kiện đang áp dụng (khối, nhóm, trạng thái); chỉ còn nhóm được chọn', /Khối:/.test(comb.applied) && /Nhóm:/.test(comb.applied) && /Trạng thái: Cần cải thiện/.test(comb.applied) && comb.groups.length === 1 && comb.groups[0].trim() === nhomV, JSON.stringify(comb));
  rec('11. Kết hợp lọc', 'Trạng thái lọc giữ nguyên khi đổi khối (không bị đặt lại ngoài ý muốn)', comb.f === 'cct');
  await p.click('.moi-mx-arow [data-mx-clear]'); await p.sleep(400);
  const cl = await p.eval(`({ f: document.querySelector('.moi-mx').getAttribute('data-f'), k: document.getElementById('mx-khoi').value, n: document.getElementById('mx-nhom').value, ap: document.getElementById('mx-applied').innerText, dis: document.querySelector('.moi-mx-arow [data-mx-clear]').disabled })`);
  d = await dom(p);
  rec('11. Kết hợp lọc', 'Nút "Xóa bộ lọc" đưa mọi điều kiện về Tất cả và đếm lại đúng', cl.f === 'all' && cl.k === '' && cl.n === '' && /tất cả/i.test(cl.ap) && cl.dis && same(d.o, await recount(p, {})), JSON.stringify(cl));

  /* 13. Đổi đơn vị */
  const dvs = await opts(p, 'mx-dv'); await setSel(p, 'mx-dv', dvs[2]); await p.sleep(400);
  const one = await p.eval(`({ cols: [...document.querySelector('.moi-mx table').tHead.rows[0].cells].length, name: document.querySelector('.moi-mx table').tHead.rows[0].cells[2].innerText })`); d = await dom(p);
  rec('13. Đổi đơn vị', 'Chọn một đơn vị: bảng chỉ còn cột Chỉ tiêu + Toàn chi nhánh + đơn vị đó; đếm khớp engine', one.cols === 3 && same(d.o, await recount(p, { dv: dvs[2] })), JSON.stringify(one));
  const hang1 = await p.eval(`document.querySelector('.moi-mx table').tHead.rows[0].cells[2].querySelector('small').innerText`);
  rec('13. Đổi đơn vị', 'Hạng hiển thị vẫn là hạng chính thức trong toàn bộ đơn vị', await p.eval(`(() => { const u = STORE.model().ranking(APP.ky.nam, APP.ky.thang).filter((c) => c.ma === '${dvs[2]}')[0]; return '${hang1}' === 'Hạng ' + u.hang; })()`));
  await p.click('.moi-mx-arow [data-mx-clear]'); await p.sleep(300);

  /* 12. Đổi kỳ */
  const before = (await dom(p)).o; await p.click('.moi-mx [data-mxf="chua"]');
  await p.eval(`APP.ky = { nam: APP.ky.nam, thang: 5, chon: true }; APP.render()`); await p.sleep(500);
  d = await dom(p); const kyOk = await p.eval(`APP.ky.thang`);
  rec('12. Đổi kỳ', 'Sang T5: bộ đếm tự cập nhật, khớp bảng và engine; bộ lọc "Chưa đạt" được giữ', kyOk === 5 && same(d.o, await recount(p, {})) && same(d.o, { dat: d.ch.dat, kha: d.ch.kha, cct: d.ch.cct, chua: d.ch.chua, gap: d.ch.gap }) && (await p.eval(`document.querySelector('.moi-mx').getAttribute('data-f')`)) === 'chua', JSON.stringify(d));
  rec('12. Đổi kỳ', 'Số đếm T5 khác T10 (dữ liệu thay đổi thật, không hardcode)', !same(d.o, before), JSON.stringify([d.o, before]));
  await p.eval(`APP.ky = { nam: APP.ky.nam, thang: 10, chon: true }; APP.mt_tier = 'all'; APP.render()`); await p.sleep(400);

  /* 14. Chế độ hiển thị */
  const modes = ['ht', 'hang', 'kh_nam', 'diem', 'mat']; p.logs.length = 0; let allModesOk = true, det = [];
  await p.click('.moi-mx [data-mxf="chua"]');
  for (const m of modes) {
    await p.eval(`document.querySelector('.moi-pill[data-mode="${m}"]').click()`); await p.sleep(350);
    const r = await p.eval(`(() => { const x = document.querySelector('.moi-mx'), cells = [...x.querySelectorAll('tbody td.vtb-cell')]; return { mode: x.getAttribute('data-mode'), n: cells.length, filter: !!document.querySelector('.moi-mx [data-mxf]'), f: x.getAttribute('data-f'), status: cells.filter((c) => /vtb-t-/.test(c.className)).length, txt: cells.slice(1, 4).map((c) => c.innerText.trim()), live: !!document.getElementById('mx-live') }; })()`);
    const exp = m === 'hang' || m === 'mat' ? { filter: false, status: 0, f: 'all' } : { filter: true };
    const ok = r.mode === m && r.n >= 100 && r.filter === exp.filter && (exp.status === undefined || r.status === exp.status) && (exp.f === undefined || r.f === exp.f); if (!ok) allModesOk = false; det.push(m + ':' + JSON.stringify(r));
  }
  rec('14. Chế độ', '5 chế độ đều hiển thị; bộ lọc trạng thái chỉ có ở chế độ có phân loại (ht, kh_nam, diem), ẩn ở Thứ hạng/Điểm bị mất', allModesOk && p.logs.length === 0, det.join(' | '));
  await p.eval(`document.querySelector('.moi-pill[data-mode="ht"]').click()`); await p.sleep(350);
  rec('14. Chế độ', 'Quay về chế độ có phân loại: bộ lọc "Chưa đạt" vẫn được giữ', (await p.eval(`document.querySelector('.moi-mx').getAttribute('data-f')`)) === 'chua' && (await p.eval(`document.querySelector('[data-mxf="chua"]').getAttribute('aria-pressed')`)) === 'true');
  await p.click('.moi-mx [data-mxf="all"]');
  await p.eval(`document.querySelector('.moi-pill[data-mode="hang"]').click()`); await p.sleep(350);
  rec('14. Chế độ', 'Thứ hạng: hiển thị "hạng/n" khớp engine, thang một tông tím (không dùng màu trạng thái), hạng 1 có viền nổi, cột CN là "–"', await p.eval(`(() => { const M = STORE.model(), RI = M.rankInd(APP.ky.nam, APP.ky.thang); const td = document.querySelector('.moi-mx tbody td.vtb-cell:not(.vtb-mx-cn)[data-dv]'); const dv = td.getAttribute('data-dv'); const row = td.parentNode.querySelector('th a').getAttribute('href').split('/').pop(); const ri = RI.ct[row], h = ri.hang[dv]; return td.innerText.trim() === h + '/' + ri.n && !/vtb-t-/.test(td.className) && !!document.querySelector('.moi-mx .vtb-rk-1') && document.querySelector('.moi-mx tbody td.vtb-mx-cn.vtb-cell').innerText.trim() === '–'; })()`));
  await p.eval(`document.querySelector('.moi-pill[data-mode="mat"]').click()`); await p.sleep(350);
  rec('14. Chế độ', 'Điểm bị mất: số = −mất điểm của engine, ✓ khi không mất, ô mất nhiều nhất có viền nổi, có dòng tổng điểm mất', await p.eval(`(() => { const M = STORE.model(), c = M.card(APP.ky.nam ? document.querySelector('.moi-mx tbody td.vtb-cell:not(.vtb-mx-cn)').getAttribute('data-dv') : '', APP.ky.nam, APP.ky.thang); let ok = 0, bad = 0; document.querySelectorAll('.moi-mx tbody td.vtb-cell:not(.vtb-mx-cn)').forEach((td) => { const dv = td.getAttribute('data-dv'), ma = td.parentNode.querySelector('th a').getAttribute('href').split('/').pop(), cd = M.card(dv, APP.ky.nam, APP.ky.thang), r = cd.rows.filter((x) => x.ma === ma)[0]; if (!r || typeof r.mat !== 'number') return; const exp = r.mat > 0.005 ? '−' + new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(r.mat) : '✓'; td.innerText.trim() === exp ? ok++ : bad++; }); return ok > 50 && bad === 0 && !!document.querySelector('.moi-mx .vtb-ls-3') && /Tổng điểm mất/.test(document.querySelector('.moi-mx tfoot').innerText); })()`));
  await p.eval(`document.querySelector('.moi-pill[data-mode="kh_nam"]').click()`); await p.sleep(350);
  rec('14. Chế độ', '% KH năm: số = thực hiện ÷ KH năm của engine; màu giữ theo mức hoàn thành KH lũy kế (không tự suy ngưỡng)', await p.eval(`(() => { const M = STORE.model(); let ok = 0, bad = 0; document.querySelectorAll('.moi-mx tbody td.vtb-cell:not(.vtb-mx-cn)').forEach((td) => { const dv = td.getAttribute('data-dv'), ma = td.parentNode.querySelector('th a').getAttribute('href').split('/').pop(), r = M.card(dv, APP.ky.nam, APP.ky.thang).rows.concat(M.card(dv, APP.ky.nam, APP.ky.thang).ref).filter((x) => x.ma === ma)[0]; if (!r) return; const exp = typeof r.ht_nam === 'number' ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(r.ht_nam * 100) + '%' : '–'; td.innerText.trim() === exp ? ok++ : bad++; }); return ok > 100 && bad === 0 && /ngưỡng riêng cho % KH năm/.test(document.querySelector('.moi-mx-note').innerText); })()`));
  await p.eval(`document.querySelector('.moi-pill[data-mode="diem"]').click()`); await p.sleep(350);
  rec('14. Chế độ', 'Điểm đạt: số = điểm đạt / trọng số của engine', await p.eval(`(() => { const M = STORE.model(); let ok = 0, bad = 0; document.querySelectorAll('.moi-mx tbody td.vtb-cell:not(.vtb-mx-cn)').forEach((td) => { const dv = td.getAttribute('data-dv'), ma = td.parentNode.querySelector('th a').getAttribute('href').split('/').pop(), r = M.card(dv, APP.ky.nam, APP.ky.thang).rows.filter((x) => x.ma === ma)[0]; if (!r || typeof r.diem !== 'number') return; const exp = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(r.diem) + '/' + r.ts; td.innerText.trim() === exp ? ok++ : bad++; }); return ok > 50 && bad === 0; })()`));
  await p.eval(`document.querySelector('.moi-pill[data-mode="ht"]').click()`); await p.sleep(350);
  rec('20. KPI không đổi', 'Ở chế độ % hoàn thành: số và mức của MỌI ô = engine (tính lại độc lập trong trang)', await p.eval(`(() => { const M = STORE.model(), T = KPI_CFG.TRANG_THAI, m = (tt) => tt === T.DAT ? 'dat' : tt === T.KHA ? 'kha' : tt === T.CCT ? 'cct' : tt === T.CHUA_DAT ? 'chua' : 'gap', f = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }); let ok = 0, bad = 0; document.querySelectorAll('.moi-mx tbody td.vtb-cell').forEach((td) => { const dv = td.getAttribute('data-dv'), ma = td.parentNode.querySelector('th a').getAttribute('href').split('/').pop(), cd = M.card(dv, APP.ky.nam, APP.ky.thang), r = cd.rows.concat(cd.ref).filter((x) => x.ma === ma)[0]; if (!r) { bad++; return; } const exp = typeof r.ht === 'number' ? f.format(r.ht * 100) + '%' : 'Thiếu số'; (td.innerText.trim() === exp && td.getAttribute('data-tier') === m(r.tt)) ? ok++ : bad++; }); return ok >= 150 && bad === 0; })()`));

  /* 15. Click ô mở thẻ điểm */
  p.logs.length = 0; const dvHref = await p.eval(`document.querySelector('.moi-mx tbody td.vtb-cell:not(.vtb-mx-cn)').getAttribute('data-dv')`);
  await p.click('.moi-mx tbody td.vtb-cell:not(.vtb-mx-cn) .vtb-cb'); await p.sleep(900);
  rec('15. Click ô', 'Bấm một ô mở thẻ điểm đơn vị tương ứng (#/phong/<đơn vị>)', (await p.eval(`location.hash`)) === '#/phong/' + dvHref && (await p.eval(`!!document.querySelector('[data-route="phong"]')`)) && p.logs.length === 0);
  await p.eval(`location.hash = '#/ma-tran'`); await p.sleep(800);
  await p.eval(`document.querySelector('.moi-mx tbody td.vtb-cell:not(.vtb-mx-cn) .vtb-cb').focus()`); await p.key('Enter'); await p.sleep(900);
  rec('15. Click ô', 'Phím Enter trên ô đang focus cũng mở thẻ điểm', /^#\/phong\//.test(await p.eval(`location.hash`)));
  await p.eval(`location.hash = '#/ma-tran'`); await p.sleep(800);
  await p.click('.moi-mx tbody td.vtb-cell.vtb-mx-cn .vtb-cb'); await p.sleep(800);
  rec('15. Click ô', 'Bấm ô cột Toàn chi nhánh mở thẻ điểm toàn chi nhánh', (await p.eval(`location.hash`)) === '#/phong/CN');
  await p.eval(`location.hash = '#/ma-tran'`); await p.sleep(800);

  /* 16. Hover & focus */
  const pos = await p.eval(`(() => { const e = document.querySelector('.moi-mx tbody td.vtb-cell[data-tier="dat"]:not(.vtb-mx-cn) .vtb-cb'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await p.S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pos.x, y: pos.y }); await p.sleep(250);
  const hov = await p.eval(`(() => { const t = document.querySelector('.vtb-tip'); return { tip: !!t && !t.hidden, txt: t ? t.textContent : '', shadow: getComputedStyle(document.elementFromPoint(${pos.x}, ${pos.y}).closest('.vtb-cb')).boxShadow }; })()`);
  rec('16. Hover', 'Di chuột: có hiệu ứng viền nhẹ và tooltip (đơn vị · chỉ tiêu · KH · TH · % · mức)', hov.shadow !== 'none' && hov.tip && /Đạt/.test(hov.txt) && /KH/.test(hov.txt) && /TH/.test(hov.txt), JSON.stringify(hov));
  await p.S('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
  await p.key('Tab'); await p.eval(`(() => { const c = document.querySelectorAll('.moi-mx .vtb-cb[tabindex="0"]'); window.__c0 = c.length; c[0].focus(); })()`); await p.sleep(200);
  const foc = await p.eval(`(() => { const e = document.activeElement, s = getComputedStyle(e); return { fv: e.matches(':focus-visible'), ow: parseFloat(s.outlineWidth), os: s.outlineStyle, roving: window.__c0, tip: !!document.querySelector('.vtb-tip') && !document.querySelector('.vtb-tip').hidden }; })()`);
  rec('16. Focus', 'Focus bàn phím có đường viền rõ (≥ 2px), chỉ một ô nằm trong thứ tự Tab (roving tabindex), tooltip hiện theo focus', foc.fv && foc.ow >= 2 && foc.os !== 'none' && foc.roving === 1 && foc.tip, JSON.stringify(foc));
  const nav = await p.eval(`document.activeElement.closest('td').cellIndex`); await p.key('ArrowRight'); await p.sleep(100);
  const nav2 = await p.eval(`document.activeElement.closest('td').cellIndex`); await p.key('ArrowDown'); await p.sleep(100);
  const nav3 = await p.eval(`(() => { const td = document.activeElement.closest('td'); return [td.cellIndex, td.parentNode.rowIndex]; })()`);
  rec('16. Focus', 'Phím mũi tên di chuyển giữa các ô (phải, xuống)', nav2 === nav + 1 && nav3[0] === nav2);

  /* 17. Responsive */
  for (const [w, h] of [[1920, 1080], [1440, 900], [1366, 768]]) {
    const q = await moi(w, h); const r = await q.eval(`(() => { const x = document.querySelector('.moi-mx'), ov = document.documentElement.scrollWidth > innerWidth + 1, clip = [...x.querySelectorAll('.vtb-cb')].filter((e) => e.scrollWidth > e.clientWidth + 1).length, ths = [...x.querySelectorAll('thead th')].map((e) => e.getBoundingClientRect()), overlap = ths.some((a, i) => ths.some((c, j) => j > i && a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1)), chips = x.querySelector('.moi-mx-strip').getBoundingClientRect().height, wrap = x.querySelector('.moi-mx-wrap'), fl = x.querySelector('.moi-mx-bar').getBoundingClientRect().height; return { ov, clip, overlap, chips: Math.round(chips), bar: Math.round(fl), wrapTop: Math.round(wrap.getBoundingClientRect().top), vh: innerHeight, sticky: getComputedStyle(x.querySelector('thead th')).position + '/' + getComputedStyle(x.querySelector('tbody th.vtb-sticky')).position }; })()`);
    rec('17. Responsive', `${w}×${h}: không tràn ngang trang, chữ trong ô không bị cắt, tiêu đề cột không chồng lấn, header/cột chỉ tiêu cố định`, !r.ov && r.clip === 0 && !r.overlap && r.sticky === 'sticky/sticky', JSON.stringify(r));
    rec('17. Responsive', `${w}×${h}: bộ lọc + dải đếm không chiếm quá nhiều diện tích (bảng bắt đầu trong 80% chiều cao màn hình)`, r.wrapTop < r.vh * 0.8, JSON.stringify(r));
    await q.shot(path.join(OUT, 'mx', `kt_${w}x${h}.png`)); await q.close();
  }

  /* 18. Presentation Mode */
  for (const [w, h] of [[1920, 1080], [1440, 900], [1366, 768]]) {
    const q = await moi(w, h); await q.eval(`APP.mt_tier = 'all'; APP.render()`); await q.sleep(300); await q.click('[data-act="stage"]'); await q.sleep(900);
    const r = await q.eval(`(() => { const wr = document.querySelector('.moi-stage .moi-mx-wrap'), st = document.querySelector('.moi-stage'), sr = st.getBoundingClientRect(); return { man: APP.moi_stage_man, fit: !!wr && wr.scrollHeight <= wr.clientHeight + 1 && wr.scrollWidth <= wr.clientWidth + 1, filter: document.querySelectorAll('.moi-stage [data-mxf]').length, inView: sr.left >= -1 && sr.top >= -1 && sr.right <= innerWidth + 1 && sr.bottom <= innerHeight + 1, rowsAll: document.querySelectorAll('.moi-stage .moi-mx tbody th.vtb-sticky').length, rowsEng: STORE.model().inds.length }; })()`);
    rec('18. Presentation', `${w}×${h}: Ma trận có trong chế độ trình chiếu, vừa khung (không cuộn), đủ ${r.rowsAll} dòng, có 6 nút lọc`, r.man === 'ma-tran' && r.fit && r.filter === 6 && r.inView, JSON.stringify(r));
    if (w === 1920) {
      await q.click('.moi-stage [data-mxf="chua"]'); await q.sleep(200);
      const s = await q.eval(`(() => { const x = document.querySelector('.moi-stage .moi-mx'), cs = [...x.querySelectorAll('tbody td.vtb-cell[data-tier]')]; return { f: x.getAttribute('data-f'), n: cs.filter((c) => getComputedStyle(c).backgroundColor !== '${DIM}').length, h: document.querySelector('.moi-stage [data-mxf="chua"]').getBoundingClientRect().height }; })()`);
      rec('18. Presentation', 'Trình chiếu: lọc Chưa đạt thao tác được, nút lọc đủ lớn (≥ 40px)', s.f === 'chua' && s.n >= 1 && s.h >= 40, JSON.stringify(s));
      await q.click('.moi-stage [data-mxf="all"]');
      const emph = await q.eval(`(() => { const a = document.querySelector('.moi-stage .moi-mx tbody td.vtb-cell[data-tier="chua"]'), c = document.querySelector('.moi-stage .moi-mx tbody td.vtb-cell[data-tier="cct"]'); return [getComputedStyle(a).boxShadow, getComputedStyle(c).boxShadow]; })()`);
      rec('18. Presentation', 'Trình chiếu: ô Chưa đạt và Cần cải thiện có viền đậm nổi bật', /2px/.test(emph[0]) && /2px/.test(emph[1]), JSON.stringify(emph));
      await q.eval(`document.querySelector('.moi-stage tbody td.vtb-cell:not(.vtb-mx-cn) .vtb-cb').click()`); await q.sleep(800);
      rec('18. Presentation', 'Trình chiếu: bấm ô thoát trình chiếu và mở thẻ điểm đơn vị', /^#\/phong\//.test(await q.eval(`location.hash`)) && !(await q.eval(`!!document.getElementById('moi-stage-root')`)));
      await q.eval(`location.hash = '#/ma-tran'`); await q.sleep(600); await q.click('[data-act="stage"]'); await q.sleep(700); await q.key('Escape'); await q.sleep(500);
      rec('18. Presentation', 'Esc thoát trình chiếu', !(await q.eval(`!!document.getElementById('moi-stage-root')`)));
      await q.click('[data-act="stage"]'); await q.sleep(700); await q.shot(path.join(OUT, 'mx', 'kt_stage.png'));
    }
    await q.close();
  }

  /* 19. Legacy & màn khác không bị ảnh hưởng */
  p = await moi(); const other = {};
  await p.eval(`location.hash = '#/xep-hang'`); await p.sleep(800);
  other.chip = await p.eval(`(() => { const e = document.querySelector('.moi-page .vtb-chip.vtb-t-dat'); return e ? getComputedStyle(e).color + '|' + getComputedStyle(e).backgroundColor : null; })()`);
  rec('19. Màn khác', 'Màn Xếp hạng dùng CÙNG token trạng thái với Ma trận: chip Đạt chữ #174D2B trên nền #63BE7B (đồng bộ toàn New UI)', other.chip === EXP.dat[1] + '|' + EXP.dat[0], other.chip);
  await p.eval(`location.hash = '#/tong-quan'`); await p.sleep(800);
  rec('19. Màn khác', 'Tổng quan vẫn không chứa lớp .moi-mx và hiển thị bình thường', await p.eval(`!document.querySelector('.moi-mx') && !!document.querySelector('.moi-page[data-route="tong-quan"]')`));
  await p.eval(`UI_SWITCH.dat('cu')`); await p.sleep(900); await p.eval(`location.hash = '#/ma-tran'`); await p.sleep(900);
  rec('19. Legacy', 'Giao diện cũ: màn Ma trận cũ mở được, không có lớp moi-*/vtb-*, không lỗi', await p.eval(`!document.body.classList.contains('ui-moi') && !document.querySelector('.moi-mx, .moi-page, [class*="vtb-"]') && !/Lỗi hiển thị/.test(document.getElementById('view').innerText) && document.getElementById('view').innerText.length > 100`) && p.logs.length === 0);
  await p.eval(`UI_SWITCH.dat('moi')`); await p.sleep(900);
  const kpiAfter = await p.eval(`JSON.stringify(STORE.model().ranking(APP.ky.nam, APP.ky.thang).map((c) => [c.ma, c.hang, c.quy_doi, c.so_dat, c.so_kha, c.so_cct, c.so_chua]))`);
  rec('20. KPI không đổi', 'Điểm, hạng và số chỉ tiêu theo mức của mọi đơn vị trước/sau toàn bộ thao tác lọc/đổi chế độ/trình chiếu: GIỐNG HỆT', kpiBefore === kpiAfter);
  rec('Console', 'Không lỗi console ở phiên cuối', p.logs.length === 0, p.logs.map((l) => l.text).join(' | '));
  await p.close();
} finally { await b.close(); }
fs.writeFileSync(path.join(OUT, 'ma-tran-results.json'), JSON.stringify({ at: new Date().toISOString(), fail, total: R.length, results: R }, null, 1));
console.log(`\n${R.length - fail}/${R.length} đạt` + (fail ? ` — ${fail} LỖI` : ''));
process.exit(fail ? 1 : 0);
