/* D7 — ngưỡng điểm cao nguong.diem_cao (mặc định 90) thay hằng số 90. node test-nguong.js <thư mục js>
 * Chạy trên engine + store THẬT với dữ liệu MẪU (DEMO), không đụng dữ liệu vận hành. */
const vm = require('vm'), fs = require('fs'), path = require('path');
const JS = process.argv[2]; let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
function may() {
  const ls = {}, ss = {};
  const sb = { localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } },
    sessionStorage: { getItem: (k) => (k in ss ? ss[k] : null), setItem: (k, v) => { ss[k] = String(v); }, removeItem: (k) => { delete ss[k]; } },
    document: { hidden: false, getElementById: () => null, addEventListener() {} }, console, crypto: require('crypto').webcrypto, TextEncoder, btoa, atob, setTimeout, clearTimeout, setInterval: () => 0 };
  sb.window = sb; vm.createContext(sb);
  ['config.js', 'cong-thuc.js', 'engine.js', 'ui.js', 'store.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8'), sb, { filename: f }));
  sb.STORE.load(); return sb;
}
const copy = (o) => JSON.parse(JSON.stringify(o));
const A = may(), S = A.STORE, E = A.KPI_ENGINE, nam = S.state.settings.nam;
const nguong = (diem) => { const n = { dat: 1, kha: 0.8, cct: 0.7 }; if (diem !== undefined) n.diem_cao = diem; return n; };
const dat = (diem) => { const d = copy(S.state); d.settings.nguong = nguong(diem); S.replaceAll(d); return S.model(); };
const snap = (M, t) => JSON.stringify(M.ranking(nam, t).map((c) => [c.ma, c.hang, c.quy_doi, c.ht_chung, c.so_dat, c.so_kha, c.so_cct, c.so_chua, c.so_thieu, c.rows.map((r) => [r.ma, r.kh, r.th, r.ht, r.diem, r.mat, r.tt])]).concat([['CN', JSON.stringify(M.card('CN', nam, t))]]));

console.log('1. Giá trị mặc định = 90 (bảo toàn hành vi cũ)');
ok(A.KPI_CFG.mac_dinh().settings.nguong.diem_cao === 90, 'cấu hình mặc định có nguong.diem_cao = 90');
ok(S.model().ng.diem_cao === 90, 'dữ liệu mẫu mới: Model.ng.diem_cao = 90');
ok(S.model().ng.dat === 1 && S.model().ng.kha === 0.8 && S.model().ng.cct === 0.7, 'ngưỡng Đạt/Khá/CCT không đổi');
let M = dat(undefined); ok(M.ng.diem_cao === 90, 'dữ liệu CŨ chưa có khoá diem_cao → tự nhận 90 (normalize)');
for (const bad of ['', 'abc', 0, -5, null]) { M = dat(bad); ok(M.ng.diem_cao === 90, 'giá trị không hợp lệ ' + JSON.stringify(bad) + ' → 90'); }

console.log('2. Biên: bằng / cao hơn / thấp hơn ngưỡng');
ok(E.demDiemCao([{ quy_doi: 89.99 }], 90) === 0, 'thấp hơn (89,99): không đếm');
ok(E.demDiemCao([{ quy_doi: 90 }], 90) === 1, 'bằng (90): đếm');
ok(E.demDiemCao([{ quy_doi: 90.01 }], 90) === 1, 'cao hơn (90,01): đếm');
ok(E.demDiemCao([{ quy_doi: 89.99 }, { quy_doi: 90 }, { quy_doi: 90.01 }], 90) === 2, 'cả ba → 2');
ok(E.demDiemCao([{ quy_doi: null }, {}, null, { quy_doi: NaN }], 90) === 0, 'thiếu điểm / null / NaN không bị đếm');
ok(E.demDiemCao([{ quy_doi: 89.99 }, { quy_doi: 90 }, { quy_doi: 90.01 }], 85) === 3 && E.demDiemCao([{ quy_doi: 89.99 }, { quy_doi: 90 }, { quy_doi: 90.01 }], 95) === 0, 'đổi ngưỡng 85 → 3; 95 → 0');

console.log('3. Thay đổi cấu hình được mọi nơi đọc chung một nguồn');
M = dat(85); ok(M.ng.diem_cao === 85, 'đặt 85 → Model.ng.diem_cao = 85');
S.setSettings({ nguong: { dat: 1, kha: 0.8, cct: 0.7, diem_cao: 92 } }); ok(S.model().ng.diem_cao === 92, 'setSettings (đường lưu của màn Cài đặt) → 92');
ok(S.state.settings.nguong.diem_cao === 92, 'giá trị được lưu trong state.settings.nguong');
const ex = JSON.parse(S.exportJSON()); ok(ex.settings.nguong.diem_cao === 92, 'có trong tệp sao lưu JSON');

console.log('4. Bảo toàn: nguong = 90 cho kết quả TRƯỚC/SAU giống hệt ở mọi kỳ của dữ liệu mẫu');
const M90 = dat(90), M85 = dat(85); let kyN = 0, khac = 0, dem90khop = 0;
M90.periods.filter((p) => p.nam === nam).forEach((p) => {
  kyN++;
  const rk = M90.ranking(nam, p.thang), cu = rk.filter((c) => c.quy_doi >= 90).length;   // QUY TẮC CŨ (hằng số 90)
  if (E.demDiemCao(rk, M90.ng.diem_cao) === cu) dem90khop++;
  if (snap(M90, p.thang) !== snap(M85, p.thang)) khac++;
});
ok(kyN >= 10, 'dữ liệu mẫu có ≥ 10 kỳ để đối chiếu (' + kyN + ')');
ok(dem90khop === kyN, 'số đơn vị ≥ 90 điểm: trùng khít quy tắc cũ ở ' + dem90khop + '/' + kyN + ' kỳ');
ok(khac === 0, 'điểm, hạng, mức, %HT KHÔNG đổi khi đổi diem_cao (85 so với 90) ở mọi kỳ — công thức không bị ảnh hưởng');

console.log('5. Màn hình dùng chung một nguồn');
const src = fs.readFileSync(path.join(JS, 'views-theo-doi.js'), 'utf8');
ok(!/>=\s*90\b/.test(src) && !/'Đơn vị ≥ 90 điểm'/.test(src), 'views-theo-doi.js không còn hằng số 90 cho ngưỡng điểm');
ok(/KPI_ENGINE\.demDiemCao\(rk,\s*g\.diem_cao\)/.test(src), 'Tổng quan (cũ) gọi KPI_ENGINE.demDiemCao với g.diem_cao');
const mo = path.join(JS, '..', 'ui-moi', 'moi-data.js');
if (fs.existsSync(mo)) { const t = fs.readFileSync(mo, 'utf8'); ok(!/>=\s*90\b/.test(t) && /demDiemCao/.test(t), 'giao diện mới (moi-data.js) cũng dùng KPI_ENGINE.demDiemCao, không có hằng số 90'); }

console.log(fail ? '\nCÓ ' + fail + ' LỖI' : '\nTẤT CẢ ĐẠT'); process.exit(fail ? 1 : 0);
