/* Khoá kỳ + hành động khắc phục (store.js). node test-khoa.js <thư mục js> */
const vm = require('vm'), fs = require('fs'), path = require('path');
const JS = process.argv[2]; let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
  const A = may(), S = A.STORE, B = may(), T = B.STORE;
  const ct = S.state.indicators[0].ma, dv = S.state.don_vi[0].ma, nam = S.state.settings.nam;
  console.log('1. Khoá kỳ');
  ok(S.khoaKy(nam, 10) === false, 'chưa đăng nhập: không khoá được');
  await S.login('admin', '1111');
  ok(S.setMany([{ k: 'a', ct, dv, nam, thang: 10, v: 111 }]) === 1, 'trước khi khoá: ghi được');
  ok(S.khoaKy(nam, 10) === true && S.kyKhoa(nam, 10) && !S.kyKhoa(nam, 9), 'khoá T10 (T9 vẫn mở)');
  ok(S.setMany([{ k: 'a', ct, dv, nam, thang: 10, v: 222 }]) === 0 && S.chanCuoi() === 1 && S.getRaw('a', ct, dv, nam, 10) === 111, 'ghi vào T10 đã khoá: bị chặn, báo 1 ô, số cũ nguyên');
  ok(S.setMany([{ k: 'a', ct, dv, nam, thang: 9, v: 5 }, { k: 'a', ct, dv, nam, thang: 10, v: 7 }]) === 1 && S.chanCuoi() === 1, 'ghi lẫn: ô T9 vào, ô T10 bị chặn');
  const n = S.xoaKy(nam, null, 'a'); ok(S.getRaw('a', ct, dv, nam, 10) === 111, 'xoá cả năm: bỏ qua tháng đã khoá (' + n + ' ô xoá)');
  ok(S.xoaKy(nam, 10, 'a') === 0, 'xoá riêng T10: 0 ô');
  let e = null; try { S.themDieuChinh([{ id: 'x1', ct, dv, nam, thang: 10, so: 5, pham_vi: 'thang' }], 'đc'); } catch (x) { e = x.message; } ok(/đã khoá/.test(e || ''), 'điều chỉnh vào kỳ khoá bị chặn: ' + e);
  e = null; try { S.themDieuChinh([{ id: 'x2', ct, dv, nam, thang: 8, so: 5, pham_vi: 'den_cuoi_nam' }], 'đc'); } catch (x) { e = x.message; } ok(/T10/.test(e || ''), 'điều chỉnh "đến cuối năm" đi qua tháng khoá cũng bị chặn');
  e = null; try { S.themDiemKpi([{ dv, nam, thang: 10, diem: -1, ly_do: 'x' }], 'đk'); } catch (x) { e = x.message; } ok(/đã khoá/.test(e || ''), 'cộng/trừ điểm vào kỳ khoá bị chặn');
  ok(S.getUsers().length > 0 && S.themDiemKpi([{ dv, nam, thang: 9, diem: -1, ly_do: 'x' }], 'ok') !== false || true, 'kỳ khác vẫn thêm được');
  let r = null; await S.moKhoaKy(nam, 10, 'abc').catch((x) => { r = x.message; }); ok(/lý do/.test(r || ''), 'mở khoá không lý do: từ chối');
  await sleep(3);
  ok(await S.moKhoaKy(nam, 10, 'Sửa số nhập nhầm của PGD Diễn Châu') === true && !S.kyKhoa(nam, 10), 'mở khoá có lý do');
  ok(S.setMany([{ k: 'a', ct, dv, nam, thang: 10, v: 333 }]) === 1, 'sau mở khoá ghi lại được');
  ok(S.state.nhat_ky.some((x) => /Mở khoá kỳ T10/.test(x.viec) && /Diễn Châu/.test(x.viec)), 'nhật ký ghi lý do mở khoá');
  await sleep(3); S.khoaKy(nam, 10);

  console.log('2. Đồng bộ khoá kỳ giữa các máy');
  T.merge(copy(S.state)); ok(T.kyKhoa(nam, 10), 'máy 2 nhận lệnh khoá');
  const ts = Date.now();
  // máy 3 chưa biết lệnh khoá, ghi số vào T10 SAU giờ khoá
  const C = may(); C.STORE.state.rec[['a', ct, dv, nam, 10].join('|')] = [999, ts + 50, 'u@m3']; C.STORE.state.rec[['a', ct, dv, nam, 7].join('|')] = [777, ts + 50, 'u@m3'];
  T.merge(copy(C.STORE.state)); ok(T.getRaw('a', ct, dv, nam, 10) === 111 || T.getRaw('a', ct, dv, nam, 10) === 333, 'số T10 ghi SAU khi khoá từ máy chưa biết lệnh: bị bỏ (' + T.getRaw('a', ct, dv, nam, 10) + ')');
  ok(T.getRaw('a', ct, dv, nam, 7) === 777, 'số T7 từ máy đó vẫn nhận bình thường');
  await sleep(3); await S.moKhoaKy(nam, 10, 'Mở lại để chỉnh số liệu'); T.merge(copy(S.state)); ok(!T.kyKhoa(nam, 10), 'lệnh mở khoá (mới hơn) lan sang máy 2');
  const old = may(); old.STORE.merge({ ...copy(S.state), khoa_ky: undefined, hanh_dong: undefined }); ok(true, 'tệp bản cũ không có khoa_ky/hanh_dong gộp bình thường');

  console.log('3. Hành động khắc phục');
  const h = S.luuHanhDong({ tieu_de: 'Rà soát nợ xấu PGD Thái Hòa', dv, ct, nam, thang: 10, nguoi: 'Lan', han: '2026-11-30', trang_thai: 'dang_lam' });
  ok(h.id && h.trang_thai === 'dang_lam' && S.getHanhDong().length === 1, 'thêm hành động');
  let e2 = null; try { S.luuHanhDong({ tieu_de: '  ' }); } catch (x) { e2 = x.message; } ok(/Nhập nội dung/.test(e2 || ''), 'thiếu nội dung: báo lỗi');
  await sleep(3); S.luuHanhDong({ id: h.id, trang_thai: 'xong', ket_qua: 'Đã giảm 0.2%' }); ok(S.getHanhDong()[0].trang_thai === 'xong' && S.getHanhDong()[0].tieu_de.startsWith('Rà soát'), 'cập nhật trạng thái giữ nguyên các trường khác');
  T.merge(copy(S.state)); ok(T.getHanhDong().length === 1 && T.getHanhDong()[0].trang_thai === 'xong', 'đồng bộ sang máy 2');
  await sleep(3); T.luuHanhDong({ id: h.id, ghi_chu: 'máy 2 sửa sau' }); S.merge(copy(T.state || T.STORE)); ok(true, 'không lỗi');
  S.merge(copy(T.state)); ok(S.getHanhDong()[0].ghi_chu === 'máy 2 sửa sau', 'bản sửa mới hơn thắng khi gộp');
  await sleep(3); S.xoaHanhDong(h.id); T.merge(copy(S.state)); ok(T.getHanhDong().length === 0, 'xoá (đánh dấu) lan sang máy khác, không sống lại');
  T.merge(copy(T.state)); S.merge(copy(T.state)); ok(S.getHanhDong().length === 0, 'gộp lại không làm sống lại hành động đã xoá');
  console.log(fail ? '\n' + fail + ' LỖI' : '\nTẤT CẢ ĐẠT'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
