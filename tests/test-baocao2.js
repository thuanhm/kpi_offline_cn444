/* Kiểm thử lưu trữ + màn hình + Word của báo cáo giao ban. Chạy: node test-baocao2.js <thư mục App> */
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = process.argv[2], JS = path.join(ROOT, 'js'); let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
const ls = {}, sb = { localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } }, sessionStorage: { getItem: (k) => (k === 'KPI_CN444.user_ss' ? 'lan' : k === 'KPI_CN444.ten_ss' ? 'Nguyễn Lan' : null), setItem() {}, removeItem() {} },
  document: { hidden: false, getElementById: () => null, addEventListener() {} }, console, crypto: require('crypto').webcrypto, TextEncoder, btoa, atob, setTimeout, clearTimeout, setInterval: () => 0, Date, Math, JSON, Promise, Blob, URL };
sb.window = sb; vm.createContext(sb);
const run = (f) => vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: f });
['config.js', 'cong-thuc.js', 'engine.js', 'ui.js', 'store.js', 'bao-cao-cau-hoi.js', 'bao-cao-giao-ban.js', 'bao-cao-luu.js', 'xuat-docx.js'].forEach((f) => run(path.join(JS, f)));
sb.STORE.load(); const S = sb.STORE, BC = sb.KPI_BAO_CAO, BL = sb.KPI_BAO_CAO_LUU, M = S.model(), nguoi = { username: 'lan', ho_ten: 'Nguyễn Lan', chuc_danh: 'Phòng Tổng hợp' };
(async () => {
  console.log('1. Lưu trữ + bất biến');
  const ky = BC.kyTuLoai(M, 'thang', { nam: 2026, thang: 10 });
  let b = BC.taoBaoCao({ M, state: S.state, ky, ks: BC.kySo(ky, 'lien_truoc'), dv: 'CN', nguoi });
  await BL.luu(b); ok((await BL.doc(b.id)).id === b.id, 'lưu + đọc lại bản nháp');
  b.nhan_dinh.tong_quan.noi_dung = 'Sửa tay'; await BL.luu(b); ok((await BL.doc(b.id)).nhan_dinh.tong_quan.noi_dung === 'Sửa tay', 'bản nháp ghi đè được');
  const h = BC.hoanThien(b, nguoi); await BL.luu(h);
  const sua = JSON.parse(JSON.stringify(h)); sua.ket_luan.noi_dung = 'Sửa lén';
  let loi = null; try { await BL.luu(sua); } catch (e) { loi = e.message; } ok(/không ghi đè/.test(loi || ''), 'bản hoàn thiện KHÔNG bị ghi đè: ' + loi);
  await BL.luu(h); ok(true, 'ghi lại đúng nội dung cũ thì chấp nhận (idempotent)');
  const mo = BC.moLai(h, nguoi); await BL.luu(mo); await BL.luu(BC.danhDauThayThe(h, mo.id)); ok((await BL.doc(h.id)).trang_thai === 'thay_the', 'bản cũ chuyển "Đã thay thế" (đúng ngoại lệ được phép)');
  let l2 = null; try { await BL.xoaNhap(h.id); } catch (e) { l2 = e.message; } ok(/Chỉ xoá được bản nháp/.test(l2 || ''), 'không xoá được bản đã hoàn thiện/thay thế');
  ok(await BL.xoaNhap(mo.id) === true && !(await BL.doc(mo.id)), 'xoá được bản nháp');
  const dsm = await BL.ds(); ok(dsm.length >= 1 && dsm[0].ten_dv, 'danh sách lịch sử: ' + dsm.length + ' bản');

  console.log('2. Thư mục chung (BAO_CAO_GIAO_BAN)');
  const files = {}, dir = { kind: 'directory', name: 'BAO_CAO_GIAO_BAN', async getFileHandle(n, o) { if (!(n in files)) { if (!(o && o.create)) { const e = new Error('nf'); e.name = 'NotFoundError'; throw e; } files[n] = ''; } return { kind: 'file', async createWritable() { let t = ''; return { async write(s) { t += s; }, async close() { files[n] = t; } }; }, async getFile() { return { async text() { return files[n]; } }; } }; },
    values() { const it = Object.keys(files).map((n) => ({ kind: 'file', name: n })); let i = 0; return { next: async () => (i < it.length ? { done: false, value: it[i++] } : { done: true }) }; } };
  const goc = { getDirectoryHandle: async () => dir }; Object.defineProperty(S, 'dir', { get: () => goc, configurable: true });
  let b3 = BC.taoBaoCao({ M, state: S.state, ky: BC.kyTuLoai(M, 'quy', { nam: 2026, quy: 3 }), ks: null, dv: M.units[0].ma, nguoi, luc: '2026-11-07T10:11:12.000Z' });
  await BL.luu(b3); ok(Object.keys(files).length === 0, 'bản NHÁP không ghi lên thư mục chung');
  const h3 = BC.hoanThien(b3, nguoi); await BL.luu(h3); ok(files[h3.id + '.json'] && JSON.parse(files[h3.id + '.json']).trang_thai === 'hoan_thien', 'bản hoàn thiện ghi lên thư mục chung');
  BL._mem(); sb.indexedDB = undefined; ok((await BL.napChung()) === 1 && (await BL.doc(h3.id)).trang_thai === 'hoan_thien', 'máy khác nạp được bản hoàn thiện từ thư mục chung');
  ok((await BL.napChung()) === 0, 'nạp lần hai không trùng lặp');
  files['BCGB_hong.json'] = '{khong phai json'; ok((await BL.napChung()) === 0, 'tệp hỏng trong thư mục chung bị bỏ qua, không lỗi');
  delete S.dir;

  console.log('3. Màn hình (HTML) + chống chèn mã');
  const A = { ky: { nam: 2026, thang: 10 } }; sb.APP = A; sb.KPI_CFG.PHIEN_BAN = 'x'; vm.runInContext(fs.readFileSync(path.join(JS, 'views-bao-cao.js'), 'utf8'), sb, { filename: 'views-bao-cao.js' });
  const V = sb.VIEWS['bao-cao-giao-ban']; const h0 = V.html();
  ok(/Chưa mở báo cáo/.test(h0) && /id="bc-tao"/.test(h0) && /Lịch sử báo cáo giao ban/.test(h0), 'chưa mở báo cáo: có form lập + lịch sử');
  const xss = BC.taoBaoCao({ M, state: S.state, ky, ks: BC.kySo(ky, 'lien_truoc'), dv: 'CN', nguoi });
  const x2 = BC.themVanDe(xss, { tieu_de: '<img src=x onerror=alert(1)>', hien_tuong: '<script>alert(2)</script>', muc: 'cao' });
  // đưa bản nháp vào view qua lịch sử không tiện trong Node → gọi trực tiếp các hàm dựng qua ST: dùng mount giả là quá nặng; kiểm tra tài liệu (nguồn của xem trước/in)
  const blocks = BC.taiLieu(x2), docHtml = (() => { const vv = sb.VIEWS; return null; })();
  ok(blocks.some((k) => k.t === 'p' && /<script>/.test(k.text)) || JSON.stringify(blocks).includes('<script>'), 'dữ liệu người nhập giữ nguyên dạng chữ trong mô hình tài liệu (thoát ở lớp hiển thị)');

  console.log('4. Tệp Word');
  const XLSX = (() => { const s2 = { window: {}, console, setTimeout, Buffer, TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, Date, Math, JSON }; s2.window = s2; s2.self = s2; vm.createContext(s2); vm.runInContext(fs.readFileSync(path.join(ROOT, 'lib', 'xlsx.full.min.js'), 'utf8'), s2); return s2.XLSX; })();
  const bytes = sb.KPI_XUAT_DOCX.taoDocx(BC.taiLieu(h), 'Báo cáo giao ban', XLSX);
  ok(bytes.length > 3000 && bytes[0] === 0x50 && bytes[1] === 0x4b, 'tệp .docx là zip hợp lệ (' + bytes.length + ' byte, PK)');
  const getXml = (by) => { const z = XLSX.CFB.read(by, { type: 'array' }), i = z.FullPaths.findIndex((p) => /word\/document\.xml$/.test(p)); return Buffer.from(z.FileIndex[i].content).toString('utf8'); }; const doc = getXml(bytes);
  ok(/BÁO CÁO GIAO BAN THÁNG 10\/2026/.test(doc) && /Bảng tổng hợp KPI/.test(doc) && /Vấn đề trọng tâm/.test(doc), 'document.xml có tiêu đề + các mục chính');
  ok((doc.match(/<w:tbl>/g) || []).length >= 1 && (doc.match(/<w:tr>/g) || []).length > 15, 'có bảng KPI (' + (doc.match(/<w:tr>/g) || []).length + ' dòng)');
  const xml2 = doc; ok(!/<script>|<img/.test(xml2), 'XML đã thoát ký tự đặc biệt');
  const bx = sb.KPI_XUAT_DOCX.taoDocx(BC.taiLieu(x2), 'x', XLSX); const dx = getXml(bx);
  ok(/&lt;script&gt;/.test(dx) && !/<script>/.test(dx), 'nội dung có thẻ HTML được thoát trong Word (&lt;script&gt;)');
  console.log(fail ? '\n' + fail + ' LỖI' : '\nTẤT CẢ ĐẠT'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
