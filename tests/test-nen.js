/* Bước 1: bỏ backdoor admin/1111, buộc đổi mật khẩu mặc định, dấu vết xoá người dùng + đổi mã. node test-nen.js <thư mục js> */
const vm = require('vm'), fs = require('fs'), path = require('path');
const JS = process.argv[2]; let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
function may() {
  const ls = {}, ss = {};
  const sb = { localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } },
    sessionStorage: { getItem: (k) => (k in ss ? ss[k] : null), setItem: (k, v) => { ss[k] = String(v); }, removeItem: (k) => { delete ss[k]; } },
    document: { hidden: false, getElementById: () => null, addEventListener() {} }, console, crypto: require('crypto').webcrypto, TextEncoder, btoa, atob, setTimeout, clearTimeout, setInterval: () => 0, Date, Math, JSON, Promise, Blob, URL };
  sb.window = sb; vm.createContext(sb);
  ['config.js', 'cong-thuc.js', 'engine.js', 'ui.js', 'store.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8'), sb, { filename: f }));
  sb.STORE.load(); return sb;
}
const copy = (o) => JSON.parse(JSON.stringify(o));
(async () => {
  console.log('1. Đăng nhập');
  let A = may(), S = A.STORE;
  let r = await S.login('admin', '1111'); ok(r.ok && r.user.mac_dinh, 'admin/1111 (tài khoản thật, hash khớp) vẫn vào được và bị đánh dấu mac_dinh');
  S.logout(); S.state.users = []; // danh sách người dùng rỗng (chưa nạp) → không còn lối dự phòng
  r = await S.login('admin', '1111'); ok(!r.ok, 'danh sách người dùng rỗng: admin/1111 KHÔNG còn vào được (hết backdoor)');
  A = may(); S = A.STORE; S.state.users[0].h = ''; S.state.users[0].salt = '';
  r = await S.login('admin', '1111'); ok(!r.ok, 'tài khoản không có mật khẩu băm: không vào bằng 1111');
  A = may(); S = A.STORE; await S.login('admin', '1111');
  let e1 = null; await S.doiMatKhau('admin', '1111').catch((e) => { e1 = e.message; }); ok(/mặc định/.test(e1 || ''), 'không cho đặt lại 1111: ' + e1);
  e1 = null; await S.doiMatKhau('admin', 'abc12').catch((e) => { e1 = e.message; }); ok(/6 ký tự/.test(e1 || ''), 'mật khẩu < 6 ký tự bị từ chối');
  await S.doiMatKhau('admin', 'MatKhau@2026'); ok(S.getUsers()[0].mac_dinh === false, 'đổi mật khẩu xong: hết cờ mac_dinh');
  S.logout(); ok(!(await S.login('admin', '1111')).ok && (await S.login('admin', 'MatKhau@2026')).ok, 'sau khi đổi: 1111 sai, mật khẩu mới đúng');

  console.log('2. Xoá người dùng không bị sống lại');
  const M1 = may(), M2 = may();
  await M1.STORE.login('admin', '1111'); await M1.STORE.themUser('lan', 'lan@2026', 'Lan');
  const sau1 = copy(M1.STORE.state); M2.STORE.merge(copy(sau1));
  ok(M2.STORE.getUsers().some((u) => u.user === 'lan'), 'máy 2 nhận được người dùng lan');
  await new Promise((r) => setTimeout(r, 5));
  await M1.STORE.xoaUser('lan'); ok(!M1.STORE.getUsers().some((u) => u.user === 'lan'), 'máy 1 xoá lan');
  M1.STORE.merge(copy(M2.STORE.state)); ok(!M1.STORE.getUsers().some((u) => u.user === 'lan'), 'máy 1 gộp từ máy 2 (còn lan): lan KHÔNG sống lại');
  M2.STORE.merge(copy(M1.STORE.state)); ok(!M2.STORE.getUsers().some((u) => u.user === 'lan'), 'máy 2 gộp từ máy 1: lan bị xoá theo');
  await new Promise((r) => setTimeout(r, 5));
  await M1.STORE.themUser('lan', 'lan@2027', 'Lan mới'); M2.STORE.merge(copy(M1.STORE.state));
  ok(M2.STORE.getUsers().some((u) => u.user === 'lan' && u.ten === 'Lan mới'), 'tạo lại cùng tên sau khi xoá: lan hợp lệ trở lại');
  const only = may(); only.STORE.merge({ ...copy(M1.STORE.state), users_xoa: { admin: Date.now() + 1000 } });
  ok(only.STORE.getUsers().length >= 1, 'luôn giữ lại ít nhất một tài khoản');

  console.log('3. Đổi mã không để số liệu cũ sống lại');
  const P = may(), Q = may(); const ky = { nam: 2026, thang: 3 };
  const ct = P.STORE.state.indicators[0].ma, dv = P.STORE.state.don_vi[0].ma;
  P.STORE.setVal('a', ct, dv, ky.nam, ky.thang, 111); Q.STORE.merge(copy(P.STORE.state));
  const key = (c, d) => ['a', c, d, ky.nam, ky.thang].join('|');
  ok(Q.STORE.state.rec[key(ct, dv)], 'máy Q có số liệu mã cũ');
  await new Promise((r) => setTimeout(r, 5));
  // P đổi mã chỉ tiêu + cập nhật danh mục như màn Danh mục
  P.STORE.doiMaChiTieu(ct, 'CT_MOI'); P.STORE.state.indicators.find((i) => i.ma === ct).ma = 'CT_MOI';
  P.STORE.setDanhMuc({ indicators: P.STORE.state.indicators }, 'đổi mã');
  P.STORE.merge(copy(Q.STORE.state));  // Q chưa biết gì → còn mã cũ
  ok(!P.STORE.state.rec[key(ct, dv)] && P.STORE.state.rec[key('CT_MOI', dv)] && P.STORE.state.rec[key('CT_MOI', dv)][0] === 111, 'P gộp từ Q (mã cũ): KHÔNG tạo lại ô mã cũ, số ở mã mới giữ nguyên');
  // Q nhập thêm số dưới mã cũ SAU khi P đổi mã (Q chưa nhận danh mục mới)
  await new Promise((r) => setTimeout(r, 5));
  Q.STORE.setVal('a', ct, dv, ky.nam, 4, 222);
  P.STORE.merge(copy(Q.STORE.state));
  ok(P.STORE.state.rec[['a', 'CT_MOI', dv, ky.nam, 4].join('|')] && P.STORE.state.rec[['a', 'CT_MOI', dv, ky.nam, 4].join('|')][0] === 222, 'số Q nhập SAU khi đổi mã được chuyển sang mã mới');
  Q.STORE.merge(copy(P.STORE.state));
  ok(Q.STORE.state.indicators.some((i) => i.ma === 'CT_MOI') && !Q.STORE.state.rec[key(ct, dv)], 'Q nhận danh mục mới, ô mã cũ không còn');
  // đổi dây chuyền A→B→C
  P.STORE.doiMaChiTieu('CT_MOI', 'CT_C'); ok(P.STORE.state.ma_cu['ct:' + ct].moi === 'CT_C' && P.STORE.state.ma_cu['ct:CT_MOI'].moi === 'CT_C', 'đổi dây chuyền A→B→C: dấu vết nối thẳng tới C');
  // đơn vị
  const dv2 = P.STORE.state.don_vi[1].ma; P.STORE.setVal('p', 'CT_C', dv2, ky.nam, 5, 7); const Z = may(); Z.STORE.merge(copy(P.STORE.state));
  await new Promise((r) => setTimeout(r, 5));
  P.STORE.doiMaDonVi(dv2, 'DV_MOI'); P.STORE.state.don_vi.find((u) => u.ma === dv2).ma = 'DV_MOI'; P.STORE.setDanhMuc({ don_vi: P.STORE.state.don_vi }, 'đổi mã dv');
  P.STORE.merge(copy(Z.STORE.state)); ok(!P.STORE.state.rec[['p', 'CT_C', dv2, ky.nam, 5].join('|')] && P.STORE.state.rec[['p', 'CT_C', 'DV_MOI', ky.nam, 5].join('|')], 'đổi mã đơn vị: không sống lại dưới mã cũ');
  ok(S.state.users_xoa && typeof S.state.users_xoa === 'object' && S.state.ma_cu && typeof S.state.ma_cu === 'object', 'dữ liệu mới có users_xoa + ma_cu');
  const old = may(); old.STORE.merge({ ...copy(P.STORE.state), ma_cu: undefined, users_xoa: undefined }); ok(true, 'tệp bản cũ (không có ma_cu/users_xoa) gộp bình thường');
  console.log(fail ? '\n' + fail + ' LỖI' : '\nTẤT CẢ ĐẠT'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
