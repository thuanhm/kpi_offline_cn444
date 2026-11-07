/* Kiểm thử js/sao-luu-may.js. Chạy: node test-saoluu.js <thư mục js> */
const vm = require('vm'), fs = require('fs'), path = require('path'), { webcrypto } = require('crypto');
const JS = process.argv[2];
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SL0 = require(path.join(JS, 'sao-luu-may.js'));

/* ---------- 1. Lịch giữ ---------- */
console.log('1. Lịch giữ (chonXoa)');
{
  const now = new Date(2026, 10, 7, 15, 0).getTime();   // 07/11/2026 15:00
  const n = (y, m, d, h, mi, u) => `${y}-${String(m).padStart(2, '0')}/KPI444_${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}_${String(h).padStart(2, '0')}h${String(mi).padStart(2, '0')}_${u || 'admin'}.json`;
  const ds = [
    n(2026, 11, 7, 8, 0), n(2026, 11, 7, 9, 30), n(2026, 11, 7, 14, 0),       // hôm nay: khung 1 (2 bản), khung 3
    n(2026, 11, 5, 9, 0), n(2026, 11, 5, 17, 0), n(2026, 11, 5, 18, 0),        // tháng này, 5/11: giữ bản muộn nhất
    n(2026, 10, 1, 9, 0), n(2026, 10, 14, 9, 0), n(2026, 10, 15, 9, 0), n(2026, 10, 15, 17, 0), n(2026, 10, 20, 9, 0), n(2026, 10, 30, 9, 0), n(2026, 10, 31, 17, 0),   // tháng 10 đã qua
    n(2025, 12, 31, 10, 0), n(2025, 12, 3, 10, 0),                              // năm trước
    'ghi_chu_cua_toi.txt', 'KPI_MOI_NHAT.json', '2026-10/anh-chup.png'          // tệp lạ — không được đụng
  ];
  const r = SL0.chonXoa(ds, now), giu = new Set(r.giu), xoa = new Set(r.xoa);
  ok(giu.has(n(2026, 11, 7, 9, 30)) && xoa.has(n(2026, 11, 7, 8, 0)), 'hôm nay: mỗi khung giờ giữ bản cuối (9h30 giữ, 8h00 xoá)');
  ok(giu.has(n(2026, 11, 7, 14, 0)), 'hôm nay: khung khác vẫn giữ');
  ok(giu.has(n(2026, 11, 5, 18, 0)) && xoa.has(n(2026, 11, 5, 9, 0)) && xoa.has(n(2026, 11, 5, 17, 0)), 'tháng này: mỗi ngày chỉ giữ bản muộn nhất (18h00)');
  ok(giu.has(n(2026, 10, 15, 17, 0)) && giu.has(n(2026, 10, 31, 17, 0)), 'tháng đã qua: giữ bản ngày 15 (muộn nhất) và cuối tháng');
  ok(xoa.has(n(2026, 10, 1, 9, 0)) && xoa.has(n(2026, 10, 14, 9, 0)) && xoa.has(n(2026, 10, 20, 9, 0)) && xoa.has(n(2026, 10, 30, 9, 0)) && xoa.has(n(2026, 10, 15, 9, 0)), 'tháng đã qua: các bản khác bị xoá');
  ok(giu.has(n(2025, 12, 31, 10, 0)) && giu.has(n(2025, 12, 3, 10, 0)), 'năm trước: 12/2025 giữ cuối tháng + bản đầu (không có bản ≤15 khác ngoài 3/12)');
  ok(!xoa.has('ghi_chu_cua_toi.txt') && !xoa.has('KPI_MOI_NHAT.json') && !xoa.has('2026-10/anh-chup.png') && !giu.has('KPI_MOI_NHAT.json'), 'tệp lạ tên không bị xoá');
}

/* ---------- Thư mục giả có thư mục con ---------- */
function fakeDir(name, perm) {
  const d = { kind: 'directory', name, files: {}, dirs: {}, perm: perm || { v: 'granted' }, writes: 0 };
  d.queryPermission = async () => d.perm.v;
  d.requestPermission = async () => { if (d.perm.v === 'prompt') d.perm.v = 'granted'; return d.perm.v; };
  d.getDirectoryHandle = async (n, o) => { if (!d.dirs[n]) { if (!(o && o.create)) { const e = new Error('nf'); e.name = 'NotFoundError'; throw e; } d.dirs[n] = fakeDir(n, d.perm); } return d.dirs[n]; };
  d.getFileHandle = async (n, o) => {
    if (!(n in d.files)) { if (!(o && o.create)) { const e = new Error('nf'); e.name = 'NotFoundError'; throw e; } d.files[n] = ''; }
    return { kind: 'file', name: n, async createWritable() { let b = ''; return { async write(s) { b += s; }, async close() { d.files[n] = b; d.writes++; } }; } };
  };
  d.removeEntry = async (n) => { delete d.files[n]; delete d.dirs[n]; };
  d.values = () => { const items = Object.keys(d.files).map((n) => ({ kind: 'file', name: n })).concat(Object.keys(d.dirs).map((n) => d.dirs[n])); let i = 0; return { next: async () => (i < items.length ? { done: false, value: items[i++] } : { done: true }) }; };
  return d;
}
const readAll = (dir, pre) => { let o = {}; Object.keys(dir.files).forEach((n) => (o[(pre || '') + n] = dir.files[n])); Object.keys(dir.dirs).forEach((n) => Object.assign(o, readAll(dir.dirs[n], (pre || '') + n + '/'))); return o; };

function makeMachine(user, pickerDir) {
  const ls = {}, ss = {}, idb = {}, sb = {
    localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } },
    sessionStorage: { getItem: (k) => (k in ss ? ss[k] : null), setItem: (k, v) => { ss[k] = String(v); }, removeItem: (k) => { delete ss[k]; } },
    document: { hidden: false, getElementById: () => null }, UI: { toast() {} }, console, crypto: webcrypto, TextEncoder, btoa, atob,
    setTimeout, clearTimeout, setInterval: () => 0, Date, Math, JSON, Promise,
    showDirectoryPicker: async () => pickerDir,
    indexedDB: { open() { const req = {}; setTimeout(() => { req.result = { createObjectStore() {}, transaction() { const tx = {}; const os = { get(k) { const q = {}; setTimeout(() => { q.result = idb[k]; q.onsuccess && q.onsuccess(); }); return q; }, put(v, k) { idb[k] = v; setTimeout(() => tx.oncomplete && tx.oncomplete()); }, delete(k) { delete idb[k]; setTimeout(() => tx.oncomplete && tx.oncomplete()); } }; tx.objectStore = () => os; return tx; } }; req.onupgradeneeded && req.onupgradeneeded(); req.onsuccess && req.onsuccess(); }); return req; } }
  };
  sb.window = sb; vm.createContext(sb);
  if (user) { ss['KPI_CN444.admin'] = '1'; ss['KPI_CN444.user_ss'] = user; ss['KPI_CN444.ten_ss'] = user; }
  ls['KPI_CN444.may'] = 'M_TEST';
  ['config.js', 'cong-thuc.js', 'engine.js', 'store.js', 'sao-luu-may.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8'), sb, { filename: f }));
  sb.STORE.load();
  sb.STORE.state.du_lieu_mau = false;
  return { sb, S: sb.STORE, SL: sb.SAO_LUU_MAY, ls, ss };
}
const setCell = (S, v) => S.setMany([{ k: 'a', ct: 'TEST_1', dv: '44405', nam: 2026, thang: 1, v }], 'nhap');

(async () => {
  console.log('2. Chọn thư mục + ghi bản đầu tiên');
  const D = fakeDir('Backup'), M = makeMachine('lan', D);
  await sleep(50);
  ok(M.SL.tt.state === 'chua_chon', 'ban đầu: chưa chọn thư mục');
  setCell(M.S, 5);
  const r = await M.SL.chon();
  ok(r.ok && r.ten === 'Backup', 'chọn thư mục ok: ' + JSON.stringify(r.loi || r.ten));
  const f1 = readAll(D), ten = Object.keys(f1);
  ok(!!f1['KPI_CN444/KPI_MOI_NHAT.json'] && !!f1['KPI_CN444/THONG_TIN.txt'], 'có KPI_MOI_NHAT.json + THONG_TIN.txt');
  ok(ten.some((n) => /^KPI_CN444\/\d{4}-\d{2}\/KPI444_\d{4}-\d{2}-\d{2}_\d{2}h\d{2}_lan\.json$/.test(n)), 'có bản theo ngày giờ kèm tên người: ' + ten.filter((n) => /KPI444_/.test(n)).join(','));
  const parsed = JSON.parse(f1['KPI_CN444/KPI_MOI_NHAT.json']);
  ok(parsed.rec['a|TEST_1|44405|2026|1'] && parsed.rec['a|TEST_1|44405|2026|1'][0] === 5, 'nội dung sao lưu khôi phục được (có ô vừa nhập)');
  ok(Array.isArray(parsed.users) && parsed.indicators.length > 0 && parsed.don_vi.length > 0, 'đủ danh mục + users (khôi phục trọn vẹn)');

  console.log('3. Chỉ ghi khi số liệu đổi');
  let w0 = D.dirs.KPI_CN444.writes;
  let k = await M.SL.ghi({});
  ok(!k.da_ghi && k.ly_do === 'khong_doi', 'không đổi gì → không ghi (' + k.ly_do + ')');
  M.S.log('Đăng nhập quản trị (lan)');   // chỉ nhật ký thay đổi
  k = await M.SL.ghi({});
  ok(!k.da_ghi && k.ly_do === 'khong_doi', 'chỉ đổi nhật ký/giờ lưu → vẫn không ghi');
  setCell(M.S, 6);
  k = await M.SL.ghi({});
  ok(k.da_ghi, 'đổi 1 ô số → ghi');
  ok(JSON.parse(readAll(D)['KPI_CN444/KPI_MOI_NHAT.json']).rec['a|TEST_1|44405|2026|1'][0] === 6, 'KPI_MOI_NHAT.json đã cập nhật số mới');

  console.log('4. Tắt tự động / không phải quản trị / dữ liệu mẫu');
  M.SL.datBat(false); setCell(M.S, 7);
  k = await M.SL.ghi({}); ok(!k.da_ghi && k.ly_do === 'tat', 'tắt tự động → không ghi');
  k = await M.SL.ghi({ ep: true }); ok(k.da_ghi, '"Ghi ngay" vẫn ghi dù tắt tự động');
  M.SL.datBat(true);
  M.ss['KPI_CN444.admin'] = '0'; setCell(M.S, 8);
  k = await M.SL.ghi({}); ok(!k.da_ghi && k.ly_do === 'khong_quyen', 'không ở chế độ quản trị → không ghi');
  M.ss['KPI_CN444.admin'] = '1'; M.S.state.du_lieu_mau = true; setCell(M.S, 9);
  k = await M.SL.ghi({}); ok(!k.da_ghi && k.ly_do === 'du_lieu_mau', 'đang là dữ liệu mẫu → không sao lưu số giả');
  M.S.state.du_lieu_mau = false;

  console.log('5. Mất quyền → dải thông báo → cấp quyền → ghi bù');
  D.perm.v = 'prompt'; setCell(M.S, 10);
  k = await M.SL.ghi({});
  ok(!k.da_ghi && k.ly_do === 'can_cap_quyen' && M.SL.canQuyen, 'quyền hết hạn → báo can_cap_quyen, không lỗi');
  const q = await M.SL.capQuyen();
  ok(q.ok && q.kq.da_ghi && !M.SL.canQuyen, 'cấp quyền xong tự ghi bản đang chờ');

  console.log('6. Dọn bản cũ theo lịch giữ khi ghi');
  const thangCu = D.dirs.KPI_CN444.dirs;
  const dOld = await D.dirs.KPI_CN444.getDirectoryHandle('2026-10', { create: true });
  for (const n of ['KPI444_2026-10-01_09h00_admin.json', 'KPI444_2026-10-15_17h00_admin.json', 'KPI444_2026-10-20_09h00_admin.json', 'KPI444_2026-10-31_17h00_admin.json', 'ghi_chu.txt']) dOld.files[n] = '{}';
  setCell(M.S, 11);
  k = await M.SL.ghi({});
  const con = Object.keys(dOld.files).sort();
  ok(k.da_ghi && con.join() === ['KPI444_2026-10-15_17h00_admin.json', 'KPI444_2026-10-31_17h00_admin.json', 'ghi_chu.txt'].join(), 'tháng 10 còn lại: ' + con.join(', '));

  console.log('7. Hẹn ghi gộp thay đổi liên tiếp + móc đăng nhập');
  const W = () => D.dirs.KPI_CN444.writes;
  let w1 = W();
  for (let i = 0; i < 5; i++) { setCell(M.S, 20 + i); M.SL.hen(80); }   // 5 thay đổi liên tiếp
  await sleep(500);
  ok(W() - w1 === 2, '5 lần đổi liên tiếp → gộp thành 1 lần ghi (2 tệp ở thư mục gốc: mới nhất + thông tin; nếu không gộp sẽ là 10): ' + (W() - w1));
  setCell(M.S, 99); w1 = W();
  M.SL.khiDangNhap(); await sleep(2400);
  ok(W() > w1 && JSON.parse(readAll(D)['KPI_CN444/KPI_MOI_NHAT.json']).rec['a|TEST_1|44405|2026|1'][0] === 99, 'đăng nhập → tự ghi bản có số mới nhất');

  console.log('8. Bỏ thư mục / máy chưa chọn thì im lặng');
  await M.SL.bo(); w1 = W(); setCell(M.S, 5);
  k = await M.SL.ghi({}); ok(!k.da_ghi && k.ly_do === 'chua_chon' && W() === w1, 'đã bỏ thư mục → không ghi gì');
  const M2 = makeMachine('hoa', fakeDir('X')); await sleep(60);
  k = await M2.SL.ghi({}); ok(!k.da_ghi && k.ly_do === 'chua_chon', 'máy chưa chọn thư mục → bỏ qua, không lỗi');

  console.log(fail ? '\n' + fail + ' LỖI' : '\nTẤT CẢ ĐẠT');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
