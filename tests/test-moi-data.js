/* Giao diện mới — lớp dữ liệu (ui-moi/moi-data.js) phải lấy NGUYÊN số của engine, không tính lại. node test-moi-data.js <thư mục js>
 * Chạy trên engine + store thật với dữ liệu MẪU; so từng giá trị với STORE.model() ở mọi kỳ. */
const vm = require('vm'), fs = require('fs'), path = require('path');
const JS = process.argv[2], MOI = path.join(JS, '..', 'ui-moi'); let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
const ls = {}, ss = {};
const sb = { localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } },
  sessionStorage: { getItem: (k) => (k in ss ? ss[k] : null), setItem: (k, v) => { ss[k] = String(v); }, removeItem: (k) => { delete ss[k]; } },
  document: { hidden: false, getElementById: () => null, addEventListener() {} }, console, crypto: require('crypto').webcrypto, TextEncoder, btoa, atob, setTimeout, clearTimeout, setInterval: () => 0 };
sb.window = sb; vm.createContext(sb);
[[JS, 'config.js'], [JS, 'cong-thuc.js'], [JS, 'engine.js'], [JS, 'phan-tich.js'], [JS, 'ui.js'], [JS, 'store.js'], [MOI, 'moi-data.js']].forEach(([d, f]) => vm.runInContext(fs.readFileSync(path.join(d, f), 'utf8'), sb, { filename: f }));
sb.STORE.load();
const S = sb.STORE, D = sb.MOI_DATA, E = sb.KPI_ENGINE, M = S.model(), nam = S.state.settings.nam, CN = 'CN';
const isNum = (v) => typeof v === 'number' && isFinite(v);
let ky = 0, bad = { hero: 0, delta: 0, counts: 0, rank: 0, rows: 0, cao: 0, series: 0, kpi: 0, tier: 0 };
M.periods.filter((p) => p.nam === nam).forEach((p) => {
  ky++; const T = D.tongQuan(M, { nam, thang: p.thang }), cn = M.card(CN, nam, p.thang), rk = M.ranking(nam, p.thang);
  if (T.cn !== cn || T.cn.quy_doi !== cn.quy_doi) bad.hero++;
  const prev = p.thang > 1 ? M.card(CN, nam, p.thang - 1) : null, d = prev && isNum(prev.quy_doi) && isNum(cn.quy_doi) ? cn.quy_doi - prev.quy_doi : null;
  if (T.delta !== d) bad.delta++;
  if (T.counts.dat !== cn.so_dat || T.counts.kha !== cn.so_kha || T.counts.cct !== cn.so_cct || T.counts.chua !== cn.so_chua || T.counts.gap !== cn.so_thieu) bad.counts++;
  if (JSON.stringify(T.rk.map((r) => [r.ma, r.hang, r.hang_truoc, r.diem])) !== JSON.stringify(rk.map((c) => [c.ma, c.hang, c.hang_truoc, c.quy_doi]))) bad.rank++;
  if (JSON.stringify(T.rows.map((r) => [r.ma, r.kh, r.th, r.gap, r.ht, r.diem, r.mat])) !== JSON.stringify(cn.rows.concat(cn.ref).map((r) => [r.ma, r.kh, r.th, r.gap, r.ht, r.diem, r.mat]))) bad.rows++;
  if (T.stats.cao !== rk.filter((c) => c.quy_doi >= M.ng.diem_cao).length || T.stats.diem_cao !== M.ng.diem_cao) bad.cao++;
  if (JSON.stringify(T.series_cn) !== JSON.stringify(M.scoreSeries(CN, nam))) bad.series++;
  if (!(T.kpi.length >= 1 && T.kpi.length <= 8 && T.kpi.every((k) => cn.rows.concat(cn.ref).some((r) => r.ma === k.ma && r.th === k.th && r.kh === k.kh && r.ht === k.ht)))) bad.kpi++;
  const tr = { 'Đạt': 'dat', 'Khá': 'kha', 'Cần cải thiện': 'cct', 'Chưa đạt': 'chua' };
  if (!T.rows.every((r) => r.tier === (tr[r.tt] || 'gap'))) bad.tier++;
});
console.log('Đối chiếu ' + ky + ' kỳ');
ok(ky >= 10, 'có ≥ 10 kỳ để đối chiếu');
ok(bad.hero === 0, 'điểm KPI chi nhánh = M.card(CN).quy_doi ở mọi kỳ');
ok(bad.delta === 0, 'chênh lệch so kỳ trước = engine ở mọi kỳ');
ok(bad.counts === 0, 'số chỉ tiêu Đạt/Khá/CCT/Chưa đạt/GAP = engine ở mọi kỳ');
ok(bad.rank === 0, 'xếp hạng (mã, hạng, hạng kỳ trước, điểm) = M.ranking ở mọi kỳ — không xếp lại');
ok(bad.rows === 0, 'từng chỉ tiêu: KH, TH, GAP, %HT, điểm, mất điểm = engine ở mọi kỳ');
ok(bad.cao === 0, 'số đơn vị ≥ ngưỡng điểm cao = KPI_ENGINE.demDiemCao theo cấu hình (D7)');
ok(bad.series === 0, 'chuỗi 12 tháng = M.scoreSeries');
ok(bad.kpi === 0, 'thẻ KPI chỉ lấy từ chỉ tiêu có trong danh mục, số nguyên bản từ engine');
ok(bad.tier === 0, 'mức (dat/kha/cct/chua/gap) khớp chuỗi trạng thái của engine');
const src = fs.readFileSync(path.join(MOI, 'moi-data.js'), 'utf8');
ok(!/>=\s*90\b|\b90\b/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'moi-data.js không chứa hằng số 90');
ok(!/computeKpi|\.quy_doi\s*=|Math\.min\(/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), 'moi-data.js không tự tính điểm / %HT (không gọi computeKpi, không gán quy_doi)');
const nocode = (f) => fs.readFileSync(path.join(MOI, f), 'utf8');
ok(!/QUY_DOI|trong_so\s*\*|th\s*\/\s*kh/.test(nocode('moi-views.js') + nocode('moi-views2.js')), 'các màn hình mới không chứa công thức điểm (th/kh, trọng số × …)');
console.log(fail ? '\nCÓ ' + fail + ' LỖI' : '\nTẤT CẢ ĐẠT'); process.exit(fail ? 1 : 0);
