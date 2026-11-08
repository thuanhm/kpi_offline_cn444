// KIỂM THỬ NGHIỆM THU CONTINUOUS HEATMAP (giao diện mới) trên ỨNG DỤNG THẬT, Edge/Chrome headless (CDP), hồ sơ sạch ⇒ dữ liệu MẪU.
//   node tests/browser-heatmap.mjs   → in kết quả, ghi tests/out/heatmap-results.json + ảnh tests/out/hm/
// Đánh số theo mục XII của yêu cầu Heatmap. Không đọc/ghi Data/ hay dữ liệu vận hành.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = path.join(ROOT, 'tests', 'out');
const APPURL = pathToFileURL(path.join(ROOT, 'App', 'index.html')).href, KEY = 'KPI_CN444.giao_dien';
fs.mkdirSync(path.join(OUT, 'hm'), { recursive: true });
const R = []; let fail = 0;
const rec = (g, n, ok, d = '') => { R.push({ g, n, ok: !!ok, d: String(d).slice(0, 300) }); if (!ok) fail++; console.log((ok ? '✓' : '✗') + ' [' + g + '] ' + n + (d && !ok ? ' — ' + d : '')); };
const b = await launch(9381);
async function moi(w = 1440, h = 900) {
  const p = await b.newPage(); await p.viewport(w, h); await p.goto(APPURL, { ready: false });
  await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000);
  await p.eval(`localStorage.setItem('${KEY}', 'moi')`); await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .moi-page')`, 20000); await p.sleep(400); return p;
}
const go = async (p, r) => { await p.eval(`location.hash = '#/${r}'; APP.render()`); await p.sleep(900); };
/* trong trang: tương phản WCAG giữa 2 màu rgb()/hex */
const CR = `const _l = (c) => { const a = c.startsWith('#') ? [1, 3, 5].map((i) => parseInt(c.substr(i, 2), 16)) : (c.match(/\\d+(\\.\\d+)?/g) || []).slice(0, 3).map(Number); return a.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce((s, v, j) => s + v * [0.2126, 0.7152, 0.0722][j], 0); }; const cr = (x, y) => { const a = _l(x), b2 = _l(y); return (Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05); };`;
try {
  const p = await moi();
  /* 0. KPI trước khi giao diện mới vẽ bất kỳ màn nào (để so với sau) */
  const kpiTruoc = await p.eval(`JSON.stringify(STORE.model().ranking(APP.ky.nam, APP.ky.thang).map((c) => [c.ma, c.hang, c.quy_doi, c.ht_chung, c.so_dat, c.so_kha, c.so_cct, c.so_chua, c.so_thieu]))`);

  /* 1. Cơ chế dùng chung */
  const u = await p.eval(`(() => { const H = MOI_HEAT, ng = STORE.model().ng, D = MOI_DATA, M = STORE.model(); const xs = []; for (let r = 0.3; r <= 1.6; r += 0.01) xs.push(r);
    const pts = xs.map((r) => { const t = D.tierHt(M, r); return { r, t, p: H.pos(r, t, ng), c: H.color(r, t, ng) }; });
    return { stops: H.STOPS.length, mono: pts.every((x, i) => !i || x.p >= pts[i - 1].p), distinct: new Set(pts.map((x) => x.c)).size,
      bandOk: pts.every((x) => x.p >= H.BAND[x.t][0] - 1e-9 && x.p <= H.BAND[x.t][1] + 1e-9), gap: H.of(null, 'gap', ng) === null && H.of(1.2, 'gap', ng) === null,
      ends: [H.at(0), H.at(1)], minCr: Math.min(...Array.from({ length: 501 }, (_, i) => H.contrast(H.at(i / 500), H.ink(H.at(i / 500))))) }; })()`);
  rec('1. Heatmap', 'Thang 10 điểm màu Đỏ #F04438 → Xanh lá #20A36C, dùng chung (MOI_HEAT)', u.stops === 10 && u.ends[0] === '#F04438' && u.ends[1] === '#20A36C', JSON.stringify(u.ends));
  rec('1. Heatmap', 'Chuyển sắc LIÊN TỤC: %HT 30%→160% cho ≥ 60 màu khác nhau, vị trí tăng đơn điệu theo %HT', u.mono && u.distinct >= 60, 'distinct=' + u.distinct);
  rec('1. Heatmap', 'Màu luôn nằm trong dải của MỨC do engine xếp (không mâu thuẫn trạng thái nghiệp vụ)', u.bandOk);
  rec('1. Heatmap', 'Chữ trên MỌI điểm của thang đạt tương phản ≥ 4,5:1 (WCAG AA)', u.minCr >= 4.5, 'min=' + u.minCr.toFixed(2));

  /* 2–3. Chiều đánh giá: dùng chính E.computeKpi của engine */
  const dir = await p.eval(`(() => { const E = KPI_ENGINE, M = STORE.model(), ng = M.ng, D = MOI_DATA, H = MOI_HEAT;
    const k = (huong, kh, th) => { const o = E.computeKpi({ huong, kh, th, ts: 10, toi_da: 1.2, nguong: ng }); const t = D.tierTT(o.tt); return { ht: o.ht, t, p: H.pos(o.ht, t, ng) }; };
    const tang = [k('cao_tot', 100, 60), k('cao_tot', 100, 85), k('cao_tot', 100, 100), k('cao_tot', 100, 125)];
    const giam = [k('thap_tot', 1.5, 3), k('thap_tot', 1.5, 1.8), k('thap_tot', 1.5, 1.5), k('thap_tot', 1.5, 1.0)];
    const that = M.inds.filter((i) => i.huong === 'thap_tot').map((i) => i.ma);
    return { tang: tang.map((x) => x.p), giam: giam.map((x) => x.p), tgT: tang.map((x) => x.t), tgG: giam.map((x) => x.t), that }; })()`);
  const inc = (a) => a.every((x, i) => !i || x > a[i - 1]);
  rec('2. Chiều tăng', 'Chỉ tiêu "cao là tốt": TH càng cao so KH → vị trí càng về xanh', inc(dir.tang), JSON.stringify(dir.tang));
  rec('3. Chiều giảm', 'Chỉ tiêu "thấp là tốt" (VD nợ xấu KH 1,5%): TH 3% → 1,8% → 1,5% → 1,0% càng xanh dần', inc(dir.giam) && dir.tgG[0] === 'chua' && dir.tgG[3] === 'dat', JSON.stringify(dir));
  rec('3. Chiều giảm', 'Danh mục mẫu có chỉ tiêu "thấp là tốt" và được tô theo %HT = KH ÷ TH do engine tính', dir.that.length > 0, dir.that.join(','));
  rec('4. Khoảng mục tiêu', 'Hệ thống không có metadata "khoảng mục tiêu" (chỉ cao_tot / thap_tot / nhap_ty_le) → không tự suy diễn', await p.eval(`STORE.model().inds.every((i) => !i.huong || ['cao_tot', 'thap_tot', 'nhap_ty_le'].includes(i.huong))`));

  /* Ma trận */
  await go(p, 'ma-tran');
  const mx = await p.eval(`(() => { ${CR} const cells = [...document.querySelectorAll('.moi-mx tbody td.vtb-cell')]; const hm = cells.filter((e) => e.classList.contains('vtb-hm')), gap = cells.filter((e) => e.dataset.tier === 'gap');
    return { n: cells.length, hm: hm.length, distinct: new Set(hm.map((e) => getComputedStyle(e).backgroundColor)).size, gapHm: gap.filter((e) => e.classList.contains('vtb-hm')).length, gapN: gap.length,
      gapTxt: gap.every((e) => /Thiếu số/.test(e.textContent)), na: document.querySelectorAll('.moi-mx td.vtb-na').length,
      minCr: Math.min(...hm.map((e) => { const s = getComputedStyle(e); return cr(s.backgroundColor, s.color); })), chuaCnt: +document.querySelector('.moi-mx [data-mxf="chua"]').dataset.n,
      chuaCells: cells.filter((e) => e.dataset.tier === 'chua' && !e.classList.contains('vtb-mx-cn')).length }; })()`);
  rec('1. Ma trận', 'Mọi ô có số đều tô Heatmap, nhiều sắc độ (≥ 25 màu khác nhau)', mx.hm > 100 && mx.distinct >= 25, JSON.stringify(mx));
  rec('5. GAP', 'Ô GAP không tô Heatmap: nền xám trung tính + chữ "Thiếu số" (không dùng "GAP", vì GAP là số còn phải thực hiện)', mx.gapN > 0 && mx.gapHm === 0 && mx.gapTxt, JSON.stringify({ gapN: mx.gapN, gapHm: mx.gapHm }));
  rec('6. Không có dữ liệu', 'Ô không áp dụng ("·") khác GAP; ô thiếu số không bị coi là 0% hay Chưa đạt (không tô đỏ, không cộng vào Chưa đạt)', mx.na > 0 && mx.chuaCnt === mx.chuaCells);
  rec('XII. Tương phản', 'Ma trận: tương phản chữ/nền mọi ô Heatmap ≥ 4,5:1', mx.minCr >= 4.5, 'min=' + mx.minCr.toFixed(2));
  /* 7–8. Lọc trạng thái + bộ đếm */
  await p.click('.moi-mx [data-mxf="cct"]'); await p.sleep(300);
  const fl = await p.eval(`(() => { const c = [...document.querySelectorAll('.moi-mx tbody td.vtb-cell:not(.vtb-ft)')]; const on = c.filter((e) => e.dataset.tier === 'cct'), off = c.filter((e) => e.dataset.tier !== 'cct');
    return { on: on.length, keep: on.every((e) => getComputedStyle(e).backgroundColor === getComputedStyle(e).getPropertyValue('--hm').trim().replace(/^#(..)(..)(..)$/, (m, r, g, b) => 'rgb(' + parseInt(r, 16) + ', ' + parseInt(g, 16) + ', ' + parseInt(b, 16) + ')')),
      dim: off.every((e) => getComputedStyle(e).backgroundColor === 'rgb(243, 245, 249)'), rows: document.querySelectorAll('.moi-mx tbody th.vtb-sticky').length, n: +document.querySelector('.moi-mx [data-mxf="cct"]').dataset.n }; })()`);
  rec('7. Lọc trạng thái', 'Lọc "Cần cải thiện": ô thuộc mức GIỮ màu Heatmap; ô khác làm mờ; không xóa hàng/cột', fl.on > 0 && fl.keep && fl.dim, JSON.stringify(fl));
  rec('8. Bộ đếm', 'Số trên chip lọc = số ô của mức (đếm theo trạng thái engine, độc lập với màu)', fl.n === fl.on - (await p.eval(`document.querySelectorAll('.moi-mx tbody td.vtb-cell.vtb-mx-cn[data-tier="cct"]').length`)), JSON.stringify(fl));
  await p.click('.moi-mx [data-mxf="all"]'); await p.sleep(300);
  /* 9. Legend */
  const lg = await p.eval(`(() => { const l = document.querySelector('.moi-mx .moi-hm'), ng = STORE.model().ng, t = l ? [...l.querySelectorAll('.moi-hm-tk b')].map((b) => b.textContent) : []; return { ok: !!l, grad: l && /linear-gradient/.test(getComputedStyle(l.querySelector('.moi-hm-grad')).backgroundImage), t, want: [ng.cct, ng.kha, ng.dat].map((v) => Math.round(v * 100) + '%') }; })()`);
  rec('9. Legend', 'Chú giải thang liên tục, mốc = ngưỡng cấu hình (CCT / Khá / Đạt)', lg.ok && lg.grad && JSON.stringify(lg.t) === JSON.stringify(lg.want), JSON.stringify(lg));
  /* 10. Tooltip */
  const tip = await p.eval(`(() => { const e = document.querySelector('.moi-mx tbody td.vtb-cell.vtb-hm:not(.vtb-ft)'); const s = e.getAttribute('data-tip'); return { s, ok: /KH /.test(s) && /TH /.test(s) && /%/.test(s) && /(Đạt|Khá|Cần cải thiện|Chưa đạt)/.test(s) }; })()`);
  rec('10. Tooltip', 'Tooltip ô: KH, TH, % hoàn thành và trạng thái nghiệp vụ', tip.ok, tip.s);
  /* 11. Click xem chi tiết */
  await p.click('.moi-mx tbody td.vtb-cell.vtb-hm:not(.vtb-mx-cn):not(.vtb-ft) .vtb-cb'); await p.sleep(800);
  rec('11. Click', 'Click ô Heatmap mở thẻ điểm đơn vị', await p.eval(`/phong/.test(location.hash) || !!document.querySelector('.moi-page[data-route="phong"]')`), await p.eval('location.hash'));
  /* 12. Chế độ hiển thị */
  const modes = {};
  for (const m of ['ht', 'kh_nam', 'diem', 'hang', 'mat']) { await p.eval(`APP.mt_mode = '${m}'; APP.mt_tier = 'all'; location.hash = '#/ma-tran'; APP.render()`); await p.sleep(500); modes[m] = await p.eval(`document.querySelectorAll('.moi-mx tbody td.vtb-hm').length`); }
  rec('12. Chế độ', 'Heatmap ở các chế độ %HT / %KH năm / Điểm đạt; Thứ hạng và Điểm bị mất dùng thang riêng (không phải mức độ hoàn thành)', modes.ht > 100 && modes.kh_nam > 100 && modes.diem > 100 && modes.hang === 0 && modes.mat === 0, JSON.stringify(modes));
  await p.eval(`APP.mt_mode = 'ht'; APP.render()`); await p.sleep(400);

  /* Nhất quán giữa màn hình: cùng chỉ tiêu × đơn vị → cùng màu */
  const cnCell = await p.eval(`(() => { const e = [...document.querySelectorAll('.moi-mx tbody tr')].map((tr) => [tr.querySelector('th'), tr.querySelector('td.vtb-mx-cn')]).find((x) => x[0] && x[1] && x[1].classList.contains('vtb-hm') && /^NII/.test(x[0].textContent.trim())); return e ? getComputedStyle(e[1]).backgroundColor : null; })()`);
  const ftKHCN = await p.eval(`(() => { const ths = [...document.querySelectorAll('.moi-mx thead th')]; const i = ths.findIndex((t) => /P\\.KHCN/.test(t.textContent)); const td = document.querySelectorAll('.moi-mx tfoot tr:first-child td')[i - 1]; return td ? getComputedStyle(td).backgroundColor : null; })()`);
  await go(p, 'tong-quan');
  const tq = await p.eval(`(() => { ${CR} const k = document.querySelector('.vtb-kpi[data-ct="NII"]'), rk = document.querySelector('.vtb-rk-row[data-dv="KHCN"] .vtb-rk-bar i'), kp = [...document.querySelectorAll('.vtb-kpi.vtb-hm-on')];
    return { kpiTop: k ? getComputedStyle(k).borderTopColor : null, rk: rk ? getComputedStyle(rk).backgroundColor : null, kpiN: kp.length, kpiBg: kp.every((e) => getComputedStyle(e).backgroundColor === 'rgb(255, 255, 255)'),
      bl: document.querySelectorAll('.vtb-bullet .vtb-bl-bar i.vtb-hm').length, legend: document.querySelectorAll('.moi-hm').length }; })()`);
  rec('Nhất quán', 'Tổng quan ↔ Ma trận: thẻ KPI NII (toàn CN) có vạch màu = màu ô NII · Toàn chi nhánh trong Ma trận', !!cnCell && tq.kpiTop === cnCell, cnCell + ' vs ' + tq.kpiTop);
  rec('Nhất quán', 'Bảng xếp hạng ↔ Ma trận: thanh P.KHCN cùng màu ô "Điểm quy đổi" P.KHCN', !!ftKHCN && tq.rk === ftKHCN, ftKHCN + ' vs ' + tq.rk);
  rec('KPI Card', 'Thẻ KPI giữ nền trắng (không tô đậm cả thẻ), chỉ báo bằng vạch màu + chấm màu cạnh %HT', tq.kpiN >= 6 && tq.kpiBg, JSON.stringify(tq));
  rec('Theo dõi tiến độ', 'Thanh % hoàn thành KH (bullet) tô Heatmap; vạch đen = mức kế hoạch 100% (không phải tiến độ thời gian)', tq.bl > 5);
  rec('9. Legend', 'Tổng quan có chú giải Heatmap đi kèm bảng xếp hạng và danh sách chỉ tiêu', tq.legend >= 2, 'n=' + tq.legend);
  /* các màn khác */
  const scr = {};
  for (const r of ['dieu-hanh', 'xep-hang', 'phong', 'chi-tieu', 'canh-bao', 'hanh-dong', 'so-ngay', 'du-bao']) {
    await go(p, r);
    scr[r] = await p.eval(`(() => { ${CR} const hm = [...document.querySelectorAll('#view .vtb-hm, #view .vtb-hm-on')]; const brand = hm.filter((e) => ['rgb(0, 83, 142)', 'rgb(215, 18, 73)', 'rgb(128, 209, 242)'].includes(getComputedStyle(e).backgroundColor)).length;
      const pb = [...document.querySelectorAll('.moi-legacy .pbar:not(.thieu) i')]; const err = /Lỗi hiển thị/.test(document.getElementById('view').innerText);
      return { hm: hm.length, brand, pbar: pb.length, pbarHeat: pb.filter((e) => /rgb/.test(e.style.background) || /#/.test(e.style.background)).length, err, ov: document.documentElement.scrollWidth > innerWidth + 1 }; })()`);
    await p.shot(path.join(OUT, 'hm', `${r}_1440x900.png`));
  }
  rec('Toàn New UI', 'Không màn nào dùng màu thương hiệu (#00538E/#D71249/#80D1F2) cho phần tử Heatmap; không lỗi hiển thị, không tràn ngang', Object.values(scr).every((x) => x.brand === 0 && !x.err && !x.ov), JSON.stringify(scr));
  rec('Toàn New UI', 'Xếp hạng, Bảng điều hành, Theo dõi chỉ tiêu có phần tử Heatmap; Thẻ điểm phòng (bố cục như bản cũ) có thanh % hoàn thành được tô lại bằng Heatmap chung', ['xep-hang', 'dieu-hanh', 'chi-tieu'].every((r) => scr[r].hm > 0) && scr.phong.pbar > 5 && scr.phong.pbarHeat === scr.phong.pbar, JSON.stringify(scr));
  rec('Toàn New UI', 'Màn cũ trong vỏ mới (Dự báo): thanh tiến độ được tô lại bằng Heatmap chung', scr['du-bao'].pbar === 0 || scr['du-bao'].pbarHeat === scr['du-bao'].pbar, JSON.stringify(scr['du-bao']));
  /* thứ hạng chính thức không đổi theo màu */
  await go(p, 'xep-hang');
  rec('Bảng xếp hạng', 'Thứ tự hàng = hạng chính thức của engine (màu không thay giá trị xếp hạng)', await p.eval(`(() => { const a = [...document.querySelectorAll('.vtb-rk-row')].map((e) => e.dataset.dv), b = STORE.model().ranking(APP.ky.nam, APP.ky.thang).map((c) => c.ma); return a.length > 0 && a.every((x, i) => x === b[i]); })()`));
  /* 16. KPI trước/sau */
  const kpiSau = await p.eval(`JSON.stringify(STORE.model().ranking(APP.ky.nam, APP.ky.thang).map((c) => [c.ma, c.hang, c.quy_doi, c.ht_chung, c.so_dat, c.so_kha, c.so_cct, c.so_chua, c.so_thieu]))`);
  rec('16. KPI', 'Điểm, %HT, hạng, số chỉ tiêu theo mức của mọi đơn vị giống hệt trước khi vẽ Heatmap', kpiTruoc === kpiSau);
  /* 15. Legacy */
  await p.eval(`UI_SWITCH.dat('cu')`); await p.sleep(900);
  const lg2 = await p.eval(`({ moi: document.body.classList.contains('ui-moi'), htc: UI.htColor(1.0), heat: String(UI.heatStyleHT).includes('htColor'), hm: document.querySelectorAll('.vtb-hm, .moi-hm').length })`);
  rec('15. Legacy', 'Thoát về giao diện cũ: hàm màu gốc được khôi phục (100% → #52c41a như cũ), không còn phần tử Heatmap mới', !lg2.moi && lg2.htc === '#52c41a' && lg2.heat && lg2.hm === 0, JSON.stringify(lg2));
  await p.close();

  /* 13–14. Responsive + Presentation */
  for (const [w, h] of [[1920, 1080], [1440, 900], [1366, 768]]) {
    const q = await moi(w, h); const res = {};
    for (const r of ['tong-quan', 'ma-tran', 'xep-hang', 'phong']) { await go(q, r); res[r] = await q.eval(`document.documentElement.scrollWidth <= innerWidth + 1 && [...document.querySelectorAll('.moi-hm')].every((l) => l.getBoundingClientRect().width <= innerWidth)`); await q.shot(path.join(OUT, 'hm', `${r}_${w}x${h}.png`)); }
    rec('13. Responsive', `${w}×${h}: không tràn ngang, chú giải nằm trong khung (Tổng quan, Ma trận, Xếp hạng, Thẻ điểm phòng)`, Object.values(res).every(Boolean), JSON.stringify(res));
    await go(q, 'ma-tran'); await q.click('[data-act="stage"]'); await q.sleep(900);
    const st = await q.eval(`(() => { const wr = document.querySelector('.moi-stage .moi-mx-wrap'); return { hm: document.querySelectorAll('.moi-stage td.vtb-hm').length, legend: !!document.querySelector('.moi-stage .moi-mx .moi-hm'), fit: !!wr && wr.scrollHeight <= wr.clientHeight + 1 }; })()`);
    rec('14. Presentation', `${w}×${h}: trình chiếu Ma trận có Heatmap + chú giải, vừa khung`, st.hm > 100 && st.legend && st.fit, JSON.stringify(st));
    await q.shot(path.join(OUT, 'hm', `stage_ma-tran_${w}x${h}.png`));
    await q.key('ArrowLeft'); await q.sleep(700);
    rec('14. Presentation', `${w}×${h}: trình chiếu màn khác vẫn có thẻ KPI/thanh Heatmap`, await q.eval(`document.querySelectorAll('.moi-stage .vtb-hm, .moi-stage .vtb-hm-on').length > 0`));
    await q.close();
  }
} catch (e) { rec('Lỗi', 'Ngoại lệ khi chạy kiểm thử', false, e.stack || e.message); }
finally { await b.close(); }
fs.writeFileSync(path.join(OUT, 'heatmap-results.json'), JSON.stringify({ when: new Date().toISOString(), total: R.length, fail, results: R }, null, 2));
console.log(`\n${R.length - fail}/${R.length} đạt` + (fail ? ` — ${fail} LỖI` : ''));
process.exit(fail ? 1 : 0);
