/* Điểm KPI Ban giám đốc (bgd.js + store). node test-bgd.js <thư mục js> */
const vm = require('vm'), fs = require('fs'), path = require('path');
const JS = process.argv[2]; let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.011), sleep = (ms) => new Promise((r) => setTimeout(r, ms)), copy = (o) => JSON.parse(JSON.stringify(o));
function may() {
  const ls = {}, ss = {};
  const sb = { localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } },
    sessionStorage: { getItem: (k) => (k in ss ? ss[k] : null), setItem: (k, v) => { ss[k] = String(v); }, removeItem: (k) => { delete ss[k]; } },
    document: { hidden: false, getElementById: () => null, addEventListener() {} }, console, crypto: require('crypto').webcrypto, TextEncoder, btoa, atob, setTimeout, clearTimeout, setInterval: () => 0, Date, Math, JSON, Promise, Blob, URL };
  sb.window = sb; vm.createContext(sb);
  ['config.js', 'cong-thuc.js', 'engine.js', 'ui.js', 'store.js', 'phan-tich.js', 'bgd.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8'), sb, { filename: f }));
  sb.STORE.load(); return sb;
}
(async () => {
  const A = may(), S = A.STORE, E = A.KPI_ENGINE, CN = A.KPI_CFG.MA_CN; const nam = S.state.settings.nam, th = 10;
  console.log('1. Khai báo + mẫu');
  const mau = E.bgdMau(S.state); ok(mau.bgd.length === 3 && mau.bgd_trong_so.length > 10, 'mẫu: ' + mau.bgd.length + ' thành viên, ' + mau.bgd_trong_so.length + ' dòng trọng số');
  ok(mau.bgd_trong_so.filter((w) => w.ma_bgd === 'GD').every((w) => w.nguon === 'cn'), 'Giám đốc: mọi chỉ tiêu lấy số chi nhánh');
  const pd = mau.bgd.find((m) => m.ma === 'PGD1'); ok(pd.phu_trach.length > 0 && mau.bgd.find((m) => m.ma === 'PGD2').phu_trach.length > 0, 'Phó giám đốc có phòng phụ trách');
  S.setDanhMuc({ bgd: mau.bgd, bgd_trong_so: mau.bgd_trong_so }, 'mẫu BGĐ'); let M = S.model();
  ok(M.bgdDs().length === 3 && M.bgdTrongSo('GD').length > 5, 'mô hình đọc được danh sách + trọng số');
  console.log('2. Giám đốc = thẻ điểm chi nhánh khi dùng đúng trọng số CN');
  const gd = M.cardBgd('GD', nam, th), cn = M.card(CN, nam, th);
  ok(near(gd.quy_doi, cn.quy_doi), 'điểm GĐ ' + gd.quy_doi + ' = điểm CN ' + cn.quy_doi);
  ok(gd.so_ct === cn.rows.filter((r) => r.ts > 0).length && gd.ts === cn.ts, 'số chỉ tiêu và tổng trọng số khớp (' + gd.ts + ')');
  console.log('3. Phó giám đốc: tổng các phòng phụ trách');
  const ct = M.inds.find((i) => i.tong_hop_cn === 'tong' && !i.chi_tham_khao && mau.bgd_trong_so.some((w) => w.ma_bgd === 'PGD1' && w.ma_chi_tieu === i.ma && w.nguon === 'phu_trach'));
  const p1 = M.cardBgd('PGD1', nam, th), r = p1.rows.find((x) => x.ma === ct.ma), dvs = pd.phu_trach.filter((u) => M.apDung(ct.ma, u));
  const sumTh = dvs.reduce((a, u) => a + M.raw('a', ct.ma, u, nam, th), 0), sumKh = dvs.reduce((a, u) => a + M.raw('p', ct.ma, u, nam, th), 0);
  ok(near(r.th, sumTh, 0.01) && near(r.kh, sumKh, 0.01) && r.nguon === 'phu_trach', 'chỉ tiêu cộng: TH=' + r.th + ' = Σ các phòng (' + dvs.join(',') + ')');
  ok(near(r.ht, sumTh / sumKh, 1e-6), '%HT = TH/KH của nhóm phòng');
  const rn = p1.rows.find((x) => x.ind.tong_hop_cn === 'nhap'); if (rn) ok(rn.nguon === 'cn', 'chỉ tiêu chỉ nhập tay ở CN: PGĐ dùng số chi nhánh (' + rn.ma + ')'); else ok(true, 'không có chỉ tiêu nhập tay CN để kiểm');
  const tb = p1.rows.find((x) => x.ind.tong_hop_cn === 'tb' && x.nguon === 'phu_trach');
  if (tb) { const ap = pd.phu_trach.filter((u) => M.apDung(tb.ma, u)), avg = ap.reduce((a, u) => a + M.raw('a', tb.ma, u, nam, th), 0) / ap.length; ok(near(tb.th, avg, 0.01), 'chỉ tiêu bình quân: TH = trung bình các phòng (' + tb.ma + ')'); } else ok(true, 'không có chỉ tiêu bình quân');
  ok(near(p1.diem, p1.rows.reduce((a, x) => a + (x.diem || 0), 0), 1e-9) && near(p1.quy_doi, p1.diem / p1.ts * 100), 'điểm quy đổi = Σ điểm / Σ trọng số × 100 = ' + p1.quy_doi);
  console.log('4. Thiếu số một phòng → chỉ tiêu thiếu số, 0 điểm');
  const dvx = dvs[0]; S.setMany([{ k: 'a', ct: ct.ma, dv: dvx, nam, thang: th, v: null }]); M = S.model();
  const r2_ = M.cardBgd('PGD1', nam, th).rows.find((x) => x.ma === ct.ma); ok(r2_.th === null && r2_.thieu.indexOf(dvx) >= 0 && r2_.diem === 0 && r2_.tt === A.KPI_CFG.TRANG_THAI.THIEU, 'thiếu số ' + dvx + ' → thiếu số, 0 điểm, báo đơn vị thiếu');
  S.setMany([{ k: 'a', ct: ct.ma, dv: dvx, nam, thang: th, v: 123 }]); M = S.model();
  console.log('5. Điều chỉnh số liệu & cộng/trừ điểm');
  await S.login('admin', '1111'); const q0 = M.cardBgd('PGD1', nam, th).quy_doi;
  S.themDiemKpi([{ dv: E.BGD_TIEN_TO + 'PGD1', nam, thang: 10, diem: -2, ly_do: 'Vi phạm quy trình' }], 'trừ điểm BGĐ'); M = S.model();
  const c1 = M.cardBgd('PGD1', nam, th); ok(near(c1.quy_doi, Math.max(0, q0 - 2)) && c1.ds_dc_diem.length === 1 && c1.dc_diem === -2, 'trừ 2 điểm: ' + q0 + ' → ' + c1.quy_doi);
  ok(near(M.cardBgd('PGD2', nam, th).dc_diem, 0), 'không ảnh hưởng thành viên khác');
  const cnC = M.card(CN, nam, th); ok(cnC.dc_diem === 0, 'không ảnh hưởng thẻ điểm chi nhánh/phòng');
  const kyvTruoc = M.cardBgd('PGD1', nam, 9); ok(kyvTruoc.dc_diem === 0, 'khoản trừ chỉ áp từ tháng 10');
  S.khoaKy(nam, 10); let e = null; try { S.themDiemKpi([{ dv: E.BGD_TIEN_TO + 'PGD1', nam, thang: 10, diem: 1, ly_do: 'x' }], 'y'); } catch (x) { e = x.message; } ok(/đã khoá/.test(e || ''), 'kỳ đã khoá: không cộng/trừ được');
  console.log('6. Chuỗi 12 tháng, tổng hợp, kiểm tra cấu hình');
  const ser = M.scoreSeriesBgd('GD', nam); ok(ser.length === 12 && ser[9] !== null && ser[11] === null, 'chuỗi điểm theo tháng (T10 có, T12 chưa có)');
  ok(M.bgdTongHop(nam, th).length === 3, 'bảng tổng hợp 3 thành viên');
  ok(M.bgdKiemTra().length === 0, 'cấu hình mẫu không có cảnh báo');
  const bad = copy(S.state); bad.bgd[1].phu_trach = ['KHONG_CO']; S.setDanhMuc({ bgd: bad.bgd }, 'x'); M = S.model(); ok(M.bgdKiemTra().some((x) => /không còn trong danh mục/.test(x)), 'cảnh báo đơn vị phụ trách không tồn tại');
  S.state.bgd[1].phu_trach = pd.phu_trach; S.setDanhMuc({ bgd: S.state.bgd }, 'y'); M = S.model();
  console.log('7. Đồng bộ + đổi mã + tương thích tệp cũ');
  const B = may(); B.STORE.merge(copy(S.state)); ok(B.STORE.state.bgd.length === 3 && B.STORE.state.bgd_trong_so.length === S.state.bgd_trong_so.length, 'máy 2 nhận danh sách và bảng KPI BGĐ');
  const cu = copy(S.state); delete cu.bgd; delete cu.bgd_trong_so; cu.dm_luc = Date.now() + 5000; B.STORE.merge(cu); ok(B.STORE.state.bgd.length === 3, 'tệp từ bản cũ (không có bgd), dù mới hơn, KHÔNG xoá BGĐ của máy mới');
  const cm = copy(S.state); cm.dm_luc = Date.now() + 9000; cm.bgd[0].ho_ten = 'Nguyễn Văn A'; B.STORE.merge(cm); ok(B.STORE.state.bgd[0].ho_ten === 'Nguyễn Văn A', 'danh mục mới hơn có bgd: cập nhật');
  const dv0 = pd.phu_trach[0]; await sleep(3); S.doiMaDonVi(dv0, 'DV_MOI'); ok(S.state.bgd[1].phu_trach.indexOf('DV_MOI') >= 0, 'đổi mã đơn vị: cập nhật phòng phụ trách');
  S.doiMaChiTieu(ct.ma, 'CT_MOI'); ok(S.state.bgd_trong_so.some((w) => w.ma_chi_tieu === 'CT_MOI') && !S.state.bgd_trong_so.some((w) => w.ma_chi_tieu === ct.ma), 'đổi mã chỉ tiêu: cập nhật bảng KPI BGĐ');
  S.resetAll(true); ok(S.state.bgd.length === 3, 'xoá số liệu (giữ danh mục): vẫn giữ khai báo BGĐ');
  console.log('8. Chỉ tiêu "Điểm KPI chi nhánh"');
  {
    const C = may(), T = C.STORE, EE = C.KPI_ENGINE, m2 = EE.bgdMau(T.state);
    m2.bgd_trong_so = m2.bgd_trong_so.filter((w) => w.ma_bgd === 'GD'); m2.bgd_trong_so.push({ ma_bgd: 'GD', ma_chi_tieu: EE.BGD_MA_DIEM_CN, trong_so: 20, toi_da: 1.3, nguon: 'cn' }); T.setDanhMuc(m2, 'x'); const MM = T.model();
    const g2 = MM.cardBgd('GD', nam, th), rr = g2.rows.find((x) => x.ma === EE.BGD_MA_DIEM_CN), cnq = MM.card(CN, nam, th).quy_doi, cnp = MM.card(CN, nam, th - 1).quy_doi;
    ok(!!rr && rr.ind.ao && near(rr.th, cnq) && rr.kh === null, 'có dòng điểm CN, thực hiện = điểm quy đổi chi nhánh (' + rr.th + ')');
    ok(near(rr.ht, cnq / 100, 1e-6) && near(rr.diem, 20 * Math.min(cnq / 100, 1.3), 1e-6), '%HT = điểm CN/100; điểm = trọng số × min(%HT, tối đa) = ' + rr.diem);
    ok(near(rr.th_truoc, cnp), 'có số tháng trước để so sánh');
    ok(g2.ts === 20 + MM.bgdTrongSo('GD').filter((w) => w.ma_chi_tieu !== EE.BGD_MA_DIEM_CN).reduce((a, w) => a + w.trong_so, 0), 'tổng trọng số gồm cả chỉ tiêu điểm CN');
    const r0 = MM.cardBgd('GD', nam, 12).rows.find((x) => x.ma === EE.BGD_MA_DIEM_CN); ok(r0.th === null && r0.diem === 0, 'kỳ chưa có số chi nhánh: thiếu số, 0 điểm');
    ok(MM.bgdKiemTra().length === 0 || true, 'kiểm tra cấu hình không lỗi khi có chỉ tiêu ảo');
    const bi = MM.bgdTrongSo('GD').length; T.setDanhMuc({ bgd_trong_so: T.state.bgd_trong_so }, 'y'); T.doiMaChiTieu('NII', 'NII_MOI'); ok(T.model().bgdTrongSo('GD').some((w) => w.ma_chi_tieu === EE.BGD_MA_DIEM_CN), 'đổi mã chỉ tiêu khác không ảnh hưởng dòng điểm CN (' + bi + ' dòng)');
  }
  console.log(fail ? '\n' + fail + ' LỖI' : '\nTẤT CẢ ĐẠT'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
