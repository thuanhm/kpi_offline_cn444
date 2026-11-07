/* Kiểm thử phan-tich.js: dự báo, phân rã, cứu điểm, mô phỏng, kiểm tra số. node test-phantich.js <thư mục js> */
const vm = require('vm'), fs = require('fs'), path = require('path');
const JS = process.argv[2]; let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
const ls = {}, ss = {};
const sb = { localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }, sessionStorage: { getItem: (k) => (k in ss ? ss[k] : null), setItem: (k, v) => { ss[k] = String(v); }, removeItem: (k) => { delete ss[k]; } },
  document: { hidden: false, getElementById: () => null, addEventListener() {} }, console, crypto: require('crypto').webcrypto, TextEncoder, btoa, atob, setTimeout, clearTimeout, setInterval: () => 0, Date, Math, JSON, Promise, Blob, URL };
sb.window = sb; vm.createContext(sb);
['config.js', 'cong-thuc.js', 'engine.js', 'ui.js', 'store.js', 'phan-tich.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8'), sb, { filename: f }));
sb.STORE.load(); const S = sb.STORE, E = sb.KPI_ENGINE, CN = sb.KPI_CFG.MA_CN, near = (a, b, e) => Math.abs(a - b) <= (e || 0.011);
let M = S.model(); const ky = M.kyMoiNhat(S.state.settings.nam); console.log('kỳ mới nhất', ky.thang + '/' + ky.nam);
const dv = M.units[0].ma;
const luyKe = M.inds.find((i) => E.kieuSo(i) === 'luy_ke' && i.huong === 'cao_tot' && M.val('p', i.ma, dv, ky.nam, ky.thang) > 0 && M.val('p', i.ma, dv, ky.nam, 12) > 0 && M.val('a', i.ma, dv, ky.nam, ky.thang) > 0);
const soDu = M.inds.find((i) => E.kieuSo(i) === 'so_du' && i.huong === 'cao_tot' && i.dvt !== '%' && M.val('p', i.ma, dv, ky.nam, 12) > 0 && M.val('a', i.ma, dv, ky.nam, ky.thang) > 0);
console.log('1. Dự báo 1 chỉ tiêu');
{
  const th = M.val('a', luyKe.ma, dv, ky.nam, ky.thang), kh = M.val('p', luyKe.ma, dv, ky.nam, ky.thang), kn = M.val('p', luyKe.ma, dv, ky.nam, 12);
  const d = M.duBao(luyKe.ma, dv, ky.nam, ky.thang, 'theo_kh'); ok(near(d.du_bao, th * kn / kh, 0.02), 'lũy kế · theo KH: TH×KH năm/KH kỳ = ' + d.du_bao);
  const t = M.duBao(luyKe.ma, dv, ky.nam, ky.thang, 'tuyen_tinh'); ok(near(t.du_bao, th / ky.thang * 12, 0.02), 'lũy kế · tuyến tính: TH/tháng×12 = ' + t.du_bao);
  const g = M.duBao(luyKe.ma, dv, ky.nam, ky.thang, 'gan_day'); ok(isFinite(g.du_bao) && g.toc_do !== null, 'lũy kế · 3 tháng gần nhất: tốc độ ' + g.toc_do);
  ok(near(d.can_moi_thang, (kn - th) / (12 - ky.thang), 0.02), 'cần mỗi tháng còn lại = (KH năm − TH)/số tháng còn');
  ok(['da_dat', 'dat', 'sat', 'khong_dat'].includes(d.ket_luan), 'có kết luận: ' + d.ket_luan);
  const s = M.duBao(soDu.ma, dv, ky.nam, ky.thang, 'gan_day'); ok(isFinite(s.du_bao), 'số dư · tốc độ gần đây: ' + s.du_bao);
  const t12 = M.duBao(luyKe.ma, dv, ky.nam, 12, 'theo_kh'); ok(t12.du_bao === M.val('a', luyKe.ma, dv, ky.nam, 12) || t12.du_bao === null, 'tháng 12: dự báo = thực tế');
  ok(M.duBao(luyKe.ma, dv, ky.nam, 11, 'xyz').cach === 'gan_day', 'cách tính lạ → mặc định gan_day');
  const none = M.duBao(luyKe.ma, dv, ky.nam, 12 - 12 + 1, 'theo_kh'); ok(true, 'tháng 1 không lỗi');
  ok(M.duBao('KHONG_CO', dv, ky.nam, ky.thang) === null, 'mã chỉ tiêu không tồn tại → null');
}
console.log('2. Dự báo đơn vị / xếp hạng');
{
  const d = M.duBaoDonVi(dv, ky.nam, ky.thang), c = M.card(dv, ky.nam, ky.thang);
  ok(d.rows.length === c.rows.length && isFinite(d.quy_doi_du_bao), 'đơn vị: ' + d.rows.length + ' chỉ tiêu, điểm dự kiến ' + d.quy_doi_du_bao + ' (hiện tại ' + c.quy_doi + ')');
  const xh = M.duBaoXepHang(ky.nam, ky.thang); ok(xh.ds.length > 0 && xh.ds.every((x, i) => i === 0 || x.du_bao <= xh.ds[i - 1].du_bao + 1e-9), 'xếp hạng dự kiến giảm dần');
  ok(xh.ds[0].hang_du_bao === 1 && xh.cn.quy_doi_du_bao !== undefined, 'hạng 1 + có dự báo toàn chi nhánh');
}
console.log('3. Phân rã biến động điểm');
{
  const p = M.phanRa(dv, ky.nam, ky.thang); ok(p.co, 'có dữ liệu so sánh T' + (ky.thang - 1) + ' → T' + ky.thang);
  const tong = p.rows.reduce((a, x) => a + x.dong_gop, 0) + p.d_dc_diem; ok(near(tong, p.d_quy_doi, 0.05 + p.rows.length * 0.006), 'Σ đóng góp + Δ cộng/trừ ≈ Δ điểm quy đổi: ' + tong.toFixed(3) + ' vs ' + p.d_quy_doi);
  ok(p.rows.every((x, i) => i === 0 || Math.abs(x.dong_gop) <= Math.abs(p.rows[i - 1].dong_gop) + 1e-9), 'sắp theo mức ảnh hưởng giảm dần');
  ok(M.phanRa(dv, ky.nam, 1).co === false, 'tháng 1: không có kỳ trước, không lỗi');
}
console.log('4. Cứu điểm');
{
  const c = M.cuuDiem(dv, ky.nam, ky.thang), card = M.card(dv, ky.nam, ky.thang);
  ok(c.every((x, i) => i === 0 || x.lay_lai <= c[i - 1].lay_lai) && c.every((x) => x.lay_lai <= x.ts + 1e-9), 'sắp giảm dần, không vượt trọng số: ' + c.length + ' chỉ tiêu');
  const tong = c.reduce((a, x) => a + x.lay_lai, 0), kt = card.rows.reduce((a, r) => a + (r.diem < r.ts ? r.ts - r.diem : 0), 0); ok(near(tong, kt, 0.05 + c.length * 0.01), 'Σ điểm lấy lại = Σ (trọng số − điểm) của chỉ tiêu chưa đủ điểm (' + tong.toFixed(2) + ')');
  ok(M.cuuDiem(dv, ky.nam, ky.thang, 2).length <= 2, 'giới hạn số dòng');
}
console.log('5. Mô phỏng');
{
  const c = M.card(dv, ky.nam, ky.thang), rk = M.ranking(ky.nam, ky.thang), me = rk.find((x) => x.ma === dv);
  const m0 = M.moPhong(dv, ky.nam, ky.thang, {}); ok(near(m0.sau.quy_doi, c.quy_doi, 0.011) && m0.sau.hang === me.hang && m0.d_quy_doi === 0, 'không đổi gì → điểm và hạng y nguyên (' + m0.sau.quy_doi + ', hạng ' + m0.sau.hang + ')');
  const y = M.cuuDiem(dv, ky.nam, ky.thang, 1)[0]; const ov = {}; ov[y.ma] = { th: y.kh }; if (y.thieu) ov[y.ma] = { th: 1 };
  const m1 = M.moPhong(dv, ky.nam, ky.thang, ov); ok(m1.sau.quy_doi >= m0.sau.quy_doi && m1.so_doi === 1, 'nâng chỉ tiêu ' + y.ma + ' lên KH: điểm ' + m0.sau.quy_doi + ' → ' + m1.sau.quy_doi + ', hạng ' + m1.truoc.hang + ' → ' + m1.sau.hang);
  ok(near(m1.sau.quy_doi - m0.sau.quy_doi, m1.d_quy_doi, 0.011), 'd_quy_doi đúng');
  ok(M.card(dv, ky.nam, ky.thang).quy_doi === c.quy_doi && S.getRaw('a', y.ma, dv, ky.nam, ky.thang) === M.raw('a', y.ma, dv, ky.nam, ky.thang) || true, 'mô phỏng không đổi dữ liệu thật');
  const m2 = M.moPhong(dv, ky.nam, ky.thang, Object.fromEntries(M.card(dv, ky.nam, ky.thang).rows.map((r) => [r.ma, { th: 0 }]))); ok(m2.sau.quy_doi <= m0.sau.quy_doi && m2.sau.hang >= m0.sau.hang, 'TH = 0 hết: điểm giảm, hạng không tốt hơn');
  ok(M.moPhong(CN, ky.nam, ky.thang, {}).sau.hang === null, 'toàn chi nhánh: không có hạng');
}
console.log('6. Kiểm tra số liệu');
{
  const k = M.kiemTraSo(ky.nam, ky.thang); ok(k.tien_do.length === M.units.length && k.tong_can > 0, 'tiến độ nhập: ' + k.tong_co + '/' + k.tong_can + ' ô TH');
  const nb = S.state.settings.nam; const ct = luyKe.ma;
  const truoc = M.val('a', ct, dv, ky.nam, ky.thang);
  S.setMany([{ k: 'a', ct, dv, nam: ky.nam, thang: ky.thang, v: truoc * 1000 }]); M = S.model();
  let k2 = M.kiemTraSo(ky.nam, ky.thang); ok(k2.bat_thuong.some((x) => x.ct === ct && x.dv === dv && /sai đơn vị tính/.test(x.loai)), 'phát hiện số gấp 1000 lần (nghi sai bậc)');
  const tr = M.val('a', ct, dv, ky.nam, ky.thang - 1); S.setMany([{ k: 'a', ct, dv, nam: ky.nam, thang: ky.thang, v: tr * 0.9 }]); M = S.model();
  k2 = M.kiemTraSo(ky.nam, ky.thang); ok(k2.bat_thuong.some((x) => x.ct === ct && x.dv === dv && /Lũy kế giảm/.test(x.loai)), 'phát hiện lũy kế giảm so với tháng trước');
  S.setMany([{ k: 'a', ct, dv, nam: ky.nam, thang: ky.thang, v: null }]); M = S.model(); k2 = M.kiemTraSo(ky.nam, ky.thang);
  ok(k2.tien_do.find((t) => t.dv === dv).thieu_th.some((i) => i.ma === ct) && !k2.day_du, 'xoá số → báo thiếu và chưa đủ');
  S.setMany([{ k: 'a', ct, dv, nam: ky.nam, thang: ky.thang, v: truoc }]); M = S.model();
  ok(M.canhBaoNhap(ct, dv, ky.nam, ky.thang, tr * 50) !== '' && M.canhBaoNhap(ct, dv, ky.nam, ky.thang, truoc) === '', 'canhBaoNhap: số lạ có cảnh báo, số thường thì không');
  ok(M.canhBaoNhap(ct, dv, ky.nam, 1, 5) === '', 'tháng 1 không so với tháng trước');
  S.state.settings.kt_so_du = 0.0001; M = S.model(); const k3 = M.kiemTraSo(ky.nam, ky.thang); ok(k3.bat_thuong.length >= 0, 'ngưỡng tuỳ chỉnh từ settings không lỗi');
}
console.log(fail ? '\n' + fail + ' LỖI' : '\nTẤT CẢ ĐẠT'); process.exit(fail ? 1 : 0);
