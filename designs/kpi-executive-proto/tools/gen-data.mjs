// SINH DỮ LIỆU GIẢ LẬP (seed cố định). KHÔNG đọc bất kỳ dữ liệu thật nào.
// Quy tắc tính điểm dưới đây chỉ là QUY TẮC MINH HOẠ cho prototype, KHÔNG phải công thức production.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dashboard', 'src', 'data');
fs.mkdirSync(OUT, { recursive: true });

const SEED = 20261108;
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(SEED);
const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const r1 = (x) => Math.round(x * 10) / 10, r2 = (x) => Math.round(x * 100) / 100, r4 = (x) => Math.round(x * 10000) / 10000;

const NAM = 2026, KY_MOI_NHAT = 10;
// ---------- Danh mục ----------
const UNITS = [
  ['DV01', 'P.KHDN-1', 'Phòng Khách hàng DN số 1', 'KHDN', 0.14, +0.13, +0.004], ['DV02', 'P.KHDN-2', 'Phòng Khách hàng DN số 2', 'KHDN', 0.10, +0.08, +0.003],
  ['DV03', 'P.KHDN-3', 'Phòng Khách hàng DN số 3', 'KHDN', 0.08, +0.03, +0.002], ['DV04', 'P.KHCN-1', 'Phòng Khách hàng cá nhân số 1', 'KHCN', 0.12, +0.06, +0.004],
  ['DV05', 'P.KHCN-2', 'Phòng Khách hàng cá nhân số 2', 'KHCN', 0.09, +0.01, -0.001], ['DV06', 'PGD-1', 'Phòng giao dịch số 1', 'PGD', 0.09, +0.04, +0.003],
  ['DV07', 'PGD-2', 'Phòng giao dịch số 2', 'PGD', 0.07, -0.01, +0.001], ['DV08', 'PGD-3', 'Phòng giao dịch số 3', 'PGD', 0.07, -0.04, -0.002],
  ['DV09', 'PGD-4', 'Phòng giao dịch số 4', 'PGD', 0.06, -0.08, -0.004], ['DV10', 'PGD-5', 'Phòng giao dịch số 5', 'PGD', 0.05, -0.12, +0.002],
  ['DV11', 'P.HT-1', 'Phòng hỗ trợ nghiệp vụ số 1', 'HT', 0.07, -0.16, -0.006], ['DV12', 'P.HT-2', 'Phòng hỗ trợ nghiệp vụ số 2', 'HT', 0.06, -0.25, -0.008],
].map(([ma, ten_ngan, ten, khoi, size, off, trend]) => ({ ma, ten_ngan, ten, khoi, size: size * (0.92 + 0.16 * rnd()), off, trend }));
const KHOI_NAME = { KHDN: 'Khối khách hàng doanh nghiệp', KHCN: 'Khối khách hàng cá nhân', PGD: 'Phòng giao dịch', HT: 'Khối hỗ trợ' };

// ma, ten_ngan, ten, dvt, nhom, huong, kieu, tong_hop, A(năm CN), S0(đầu năm, số dư), ts, toi_da, T(%HT CN kỳ 10), xu hướng/tháng, hien_tq, quý?
const CT = [
  ['TOI', 'TOI', 'Tổng thu nhập hoạt động (TOI)', 'Tỷ đồng', 'Hiệu quả kinh doanh', 'cao_tot', 'luy_ke', 'tong', 520, 0, 8, 1.3, 1.04, 0.004, 1],
  ['TOI_TT', 'Tăng trưởng TOI', 'Tốc độ tăng trưởng TOI so cùng kỳ', '%', 'Hiệu quả kinh doanh', 'cao_tot', 'ty_le_luy_ke', 'tb', 12, 0, 4, 1.3, 0.92, 0.006, 1],
  ['NII', 'NII', 'Thu nhập lãi thuần (NII)', 'Tỷ đồng', 'Hiệu quả kinh doanh', 'cao_tot', 'luy_ke', 'tong', 380, 0, 8, 1.3, 1.06, 0.003, 1],
  ['DV', 'Thu thuần DV', 'Thu thuần từ hoạt động dịch vụ', 'Tỷ đồng', 'Hiệu quả kinh doanh', 'cao_tot', 'luy_ke', 'tong', 55, 0, 6, 1.3, 1.02, 0.002, 1],
  ['LNTT', 'LNTT', 'Lợi nhuận trước thuế', 'Tỷ đồng', 'Hiệu quả kinh doanh', 'cao_tot', 'luy_ke', 'tong', 210, 0, 6, 1.3, 0.68, -0.004, 0],
  ['DUNO_CK', 'Dư nợ', 'Dư nợ tín dụng cuối kỳ', 'Tỷ đồng', 'Tín dụng', 'cao_tot', 'so_du', 'tong', 14500, 12800, 6, 1.3, 1.01, 0.002, 1],
  ['DUNO_BQ', 'Dư nợ BQ', 'Dư nợ tín dụng bình quân', 'Tỷ đồng', 'Tín dụng', 'cao_tot', 'so_du', 'tong', 13700, 12500, 4, 1.3, 0.92, 0.002, 0],
  ['TT_DUNO', 'Tăng trưởng dư nợ', 'Tăng trưởng dư nợ so đầu năm', '%', 'Tín dụng', 'cao_tot', 'ty_le_luy_ke', 'tb', 13.3, 0, 4, 1.3, 0.86, 0.005, 0],
  ['NPL', 'Nợ xấu', 'Tỷ lệ nợ xấu (càng thấp càng tốt)', '%', 'Tín dụng', 'thap_tot', 'ty_le', 'tb', 1.2, 0, 6, 1.3, 0.64, -0.006, 1],
  ['THU_NO', 'Thu nợ đã xử lý', 'Thu hồi nợ đã xử lý rủi ro', 'Tỷ đồng', 'Tín dụng', 'cao_tot', 'luy_ke', 'tong', 95, 0, 4, 1.3, 0.74, -0.003, 0],
  ['HDV_CK', 'Huy động vốn', 'Huy động vốn cuối kỳ', 'Tỷ đồng', 'Huy động vốn', 'cao_tot', 'so_du', 'tong', 14600, 13200, 6, 1.3, 1.03, 0.002, 1],
  ['HDV_BQ', 'HĐV BQ', 'Huy động vốn bình quân', 'Tỷ đồng', 'Huy động vốn', 'cao_tot', 'so_du', 'tong', 14000, 13000, 4, 1.3, 0.94, 0.002, 0],
  ['CASA', 'CASA', 'Số dư tiền gửi không kỳ hạn (CASA)', 'Tỷ đồng', 'Huy động vốn', 'cao_tot', 'so_du', 'tong', 3500, 3100, 6, 1.3, 0.93, 0.004, 1],
  ['CASA_TL', 'Tỷ lệ CASA', 'Tỷ lệ CASA trên tổng huy động', '%', 'Huy động vốn', 'cao_tot', 'ty_le', 'tb', 24, 0, 4, 1.3, 0.88, 0.004, 0],
  ['TG_KHCN', 'Tiền gửi KHCN', 'Tiền gửi khách hàng cá nhân', 'Tỷ đồng', 'Huy động vốn', 'cao_tot', 'so_du', 'tong', 9500, 8600, 4, 1.3, 0.68, -0.004, 0],
  ['THE', 'Thẻ phát hành', 'Số thẻ phát hành mới', 'Nghìn thẻ', 'Dịch vụ & chất lượng', 'cao_tot', 'luy_ke', 'tong', 18, 0, 4, 1.3, 1.15, 0.004, 0],
  ['KH_MOI', 'KH số mới', 'Khách hàng mới sử dụng ngân hàng số', 'Nghìn KH', 'Dịch vụ & chất lượng', 'cao_tot', 'luy_ke', 'tong', 42, 0, 4, 1.3, 1.22, 0.006, 0],
  ['BANCAS', 'Bancassurance', 'Doanh thu bảo hiểm qua ngân hàng', 'Tỷ đồng', 'Dịch vụ & chất lượng', 'cao_tot', 'luy_ke', 'tong', 38, 0, 4, 1.3, 0.72, -0.002, 0],
  ['CX', 'Hài lòng KH (CX)', 'Chỉ số hài lòng khách hàng (khảo sát quý)', '%', 'Dịch vụ & chất lượng', 'cao_tot', 'ty_le', 'tb', 90, 0, 4, 1.0, 0.99, 0.001, 0],
  ['TUAN_THU', 'Tuân thủ quy trình', 'Tỷ lệ tuân thủ quy trình (kiểm tra quý)', '%', 'Dịch vụ & chất lượng', 'cao_tot', 'ty_le', 'tb', 98, 0, 4, 1.0, 0.99, 0.001, 0],
].map(([ma, ten_ngan, ten, dvt, nhom, huong, kieu, tong_hop, A, S0, ts, toi_da, T, trend, hien_tq], i) => ({ ma, ten_ngan, ten, dvt, nhom, huong, kieu, tong_hop, A, S0, ts, toi_da, T, trend, hien_tq, thu_tu: i + 1, quy: ma === 'CX' || ma === 'TUAN_THU' }));

const APPLY = {
  KHDN: ['TOI', 'TOI_TT', 'NII', 'DV', 'LNTT', 'DUNO_CK', 'DUNO_BQ', 'TT_DUNO', 'NPL', 'THU_NO', 'HDV_CK', 'HDV_BQ', 'CASA', 'BANCAS', 'CX', 'TUAN_THU'],
  KHCN: ['TOI', 'TOI_TT', 'NII', 'DV', 'DUNO_CK', 'DUNO_BQ', 'TT_DUNO', 'NPL', 'THU_NO', 'HDV_CK', 'HDV_BQ', 'CASA', 'CASA_TL', 'TG_KHCN', 'THE', 'KH_MOI', 'BANCAS', 'CX', 'TUAN_THU'],
  PGD: ['TOI', 'TOI_TT', 'NII', 'DV', 'DUNO_CK', 'DUNO_BQ', 'TT_DUNO', 'NPL', 'HDV_CK', 'HDV_BQ', 'CASA', 'CASA_TL', 'TG_KHCN', 'THE', 'KH_MOI', 'BANCAS', 'CX', 'TUAN_THU'],
  HT: ['THU_NO', 'THE', 'KH_MOI', 'BANCAS', 'CX', 'TUAN_THU'],
};
const CUM = [0.07, 0.075, 0.085, 0.08, 0.08, 0.085, 0.085, 0.08, 0.085, 0.09, 0.09, 0.09].reduce((a, w, i) => (a.push((a[i - 1] || 0) + w), a), []);
const khM = (c, m, scale) => { // kế hoạch lũy kế đến tháng m của một đơn vị có tỷ trọng `scale`
  if (c.kieu === 'luy_ke') return c.A * scale * CUM[m - 1];
  if (c.kieu === 'so_du') return (c.S0 + (c.A - c.S0) * m / 12) * scale;
  if (c.kieu === 'ty_le_luy_ke') return c.A * m / 12;
  return c.A;
};
const QUY_THANG = [3, 6, 9];
const GAP_DON_VI = { 'DV07|DUNO_BQ': 1, 'DV03|CASA': 1, 'DV11|THE': 1 };         // thiếu số kỳ 10
const BAT_THUONG = { 'DV09|CASA': 0.55 };                                           // tụt mạnh bất thường kỳ 10

// ---------- Sinh ket_qua theo đơn vị ----------
const rows = []; // {thang, dv, ct, kh, th, ht}
const byKey = {};
for (const u of UNITS) {
  const ap = CT.filter((c) => APPLY[u.khoi].includes(c.ma));
  const scaleBase = (c) => { const tot = UNITS.filter((x) => APPLY[x.khoi].includes(c.ma)).reduce((a, x) => a + x.size, 0); return u.size / tot; };
  for (const c of ap) {
    const sc = c.tong_hop === 'tong' ? scaleBase(c) : 1;
    const ht10 = c.T + u.off + 0.05 * gauss() * (c.ma === 'CX' || c.ma === 'TUAN_THU' ? 0.2 : 1);
    for (let m = 1; m <= KY_MOI_NHAT; m++) {
      const kh = khM(c, m, sc);
      const sd = m <= 4 ? 0.035 : 0.015;
      let ht = ht10 - (c.trend + u.trend) * (KY_MOI_NHAT - m) + sd * gauss();
      if (m === KY_MOI_NHAT && BAT_THUONG[`${u.ma}|${c.ma}`]) ht = BAT_THUONG[`${u.ma}|${c.ma}`];
      ht = Math.max(0.35, Math.min(1.45, ht));
      let co = true;
      if (c.quy && !QUY_THANG.includes(m)) co = false;
      if (m === KY_MOI_NHAT && GAP_DON_VI[`${u.ma}|${c.ma}`]) co = false;
      const th = co ? (c.huong === 'thap_tot' ? kh / ht : kh * ht) : null;
      const row = { thang: m, dv: u.ma, ct: c.ma, kh, th, ht: co ? (c.huong === 'thap_tot' ? kh / th : th / kh) : null };
      rows.push(row); byKey[`${m}|${u.ma}|${c.ma}`] = row;
    }
  }
}
// ---------- Tổng hợp CN từ đơn vị (cùng nền so sánh: chỉ cộng các đơn vị có số) ----------
for (const c of CT) for (let m = 1; m <= KY_MOI_NHAT; m++) {
  const rs = rows.filter((r) => r.thang === m && r.ct === c.ma && r.dv !== 'CN');
  const co = rs.filter((r) => r.th !== null);
  let kh, th;
  if (c.quy && !QUY_THANG.includes(m)) { kh = rs.reduce((a, r) => a + r.kh, 0) / rs.length; th = null; }
  else if (c.tong_hop === 'tong') { kh = co.reduce((a, r) => a + r.kh, 0); th = co.reduce((a, r) => a + r.th, 0); }
  else { kh = co.reduce((a, r) => a + r.kh, 0) / co.length; th = co.reduce((a, r) => a + r.th, 0) / co.length; }
  const row = { thang: m, dv: 'CN', ct: c.ma, kh, th, ht: th === null ? null : c.huong === 'thap_tot' ? kh / th : th / kh };
  rows.push(row); byKey[`${m}|CN|${c.ma}`] = row;
}
// ---------- Trọng số, điểm (quy tắc minh hoạ) ----------
const tsOf = {}; // dv -> ct -> ts (chuẩn hoá 100)
for (const dv of [...UNITS.map((u) => u.ma), 'CN']) {
  const cts = dv === 'CN' ? CT : CT.filter((c) => APPLY[UNITS.find((u) => u.ma === dv).khoi].includes(c.ma));
  const tot = cts.reduce((a, c) => a + c.ts, 0); tsOf[dv] = {};
  cts.forEach((c) => { tsOf[dv][c.ma] = r2((c.ts / tot) * 100); });
}
const ctMap = Object.fromEntries(CT.map((c) => [c.ma, c]));
for (const r of rows) {
  r.ts = tsOf[r.dv][r.ct]; const c = ctMap[r.ct];
  r.diem = r.ht === null ? null : r.ts * Math.min(r.ht, c.toi_da);
  r.mat = r.ht === null ? null : Math.max(0, r.ts - r.diem);
  const prev = byKey[`${r.thang - 1}|${r.dv}|${r.ct}`];
  r.th_truoc = prev && prev.th !== null ? prev.th : null;
}
const diemOf = (dv, m) => { const rs = rows.filter((r) => r.dv === dv && r.thang === m && r.diem !== null); const ts = rs.reduce((a, r) => a + r.ts, 0); return ts ? (rs.reduce((a, r) => a + r.diem, 0) / ts) * 100 : null; };

// ---------- Kiểm tra phủ trạng thái (dừng nếu không đủ) ----------
const tierOf = (ht) => (ht === null ? 'gap' : ht >= 1 ? 'dat' : ht >= 0.8 ? 'kha' : ht >= 0.7 ? 'cct' : 'chua');
const cnT = { dat: 0, kha: 0, cct: 0, chua: 0, gap: 0 };
CT.forEach((c) => { cnT[tierOf(byKey[`${KY_MOI_NHAT}|CN|${c.ma}`].ht)]++; });
const scores = UNITS.map((u) => ({ dv: u.ma, ten: u.ten_ngan, d: diemOf(u.ma, KY_MOI_NHAT), p: diemOf(u.ma, KY_MOI_NHAT - 1) })).sort((a, b) => b.d - a.d);
const cnD = diemOf('CN', KY_MOI_NHAT), cnP = diemOf('CN', KY_MOI_NHAT - 1);
const unitTier = {}; UNITS.forEach((u) => { unitTier[u.ma] = tierOf(diemOf(u.ma, KY_MOI_NHAT) / 100); });
const cnHt = Object.fromEntries(CT.map((c) => { const h = byKey[`${KY_MOI_NHAT}|CN|${c.ma}`].ht; return [c.ma, h === null ? null : r2(h)]; }));
const summary = { seed: SEED, cn_ht_T10: cnHt, cn_tiers_T10: cnT, cn_score_T10: r2(cnD), cn_score_T9: r2(cnP), units: scores.map((s) => `${s.ten} ${r2(s.d)} (T9 ${r2(s.p)})`), unit_tiers: Object.values(unitTier).reduce((a, t) => (a[t] = (a[t] || 0) + 1, a), {}) };
fs.writeFileSync(path.join(ROOT, 'reports', 'data-summary.json'), JSON.stringify(summary, null, 1));
console.log(JSON.stringify(summary, null, 1));
const want = { dat: 7, kha: 6, cct: 3, chua: 2, gap: 2 };
for (const k in want) if (cnT[k] !== want[k]) { console.error(`✗ Phân bố CN kỳ 10: ${k} = ${cnT[k]}, mong đợi ${want[k]} — chỉnh tham số T.`); process.exitCode = 2; }
if (process.exitCode) process.exit(2);

// ---------- Dự kiến (đầu vào cho D8; chỉ có cho kỳ mới nhất) ----------
const duBao = [];
for (const c of CT) {
  const r = byKey[`${KY_MOI_NHAT}|CN|${c.ma}`]; if (r.ht === null) continue;
  const du = Math.max(0.4, r.ht + c.trend * 2 * 1.8 + (c.trend < 0 ? -0.02 : 0.01));
  const kl = du >= 1 ? 'dat' : du >= 0.9 ? 'nguy_co' : 'khong_dat';
  let can = null;
  const A = c.A;
  if (c.kieu === 'luy_ke') can = Math.max(0, (A - r.th) / 2); else if (c.kieu === 'so_du') can = Math.max(0, (A - r.th) / 2); else can = null;
  duBao.push({ thang: KY_MOI_NHAT, ct: c.ma, ht_du_bao: r4(du), quy_doi_du_bao: '', ket_luan: kl, can_moi_thang: can === null ? '' : r1(can) });
}
duBao.push({ thang: KY_MOI_NHAT, ct: 'DIEM_CN', ht_du_bao: '', quy_doi_du_bao: r1(cnD + 1.6), ket_luan: '', can_moi_thang: '' });

// ---------- Mốc tăng trưởng (so cùng kỳ năm trước) cho CN ----------
const G = { TOI: 0.098, NII: 0.071, DV: 0.14, LNTT: -0.035, DUNO_CK: 0.104, DUNO_BQ: 0.096, HDV_CK: 0.088, HDV_BQ: 0.081, CASA: 0.042, TG_KHCN: 0.021, THU_NO: -0.06, THE: 0.19, KH_MOI: 0.33, BANCAS: -0.012 };
const mocCn = Object.keys(G).map((ct) => { const th = byKey[`${KY_MOI_NHAT}|CN|${ct}`].th; const c = ctMap[ct]; return { thang: KY_MOI_NHAT, ct, th_cung_ky_nam_truoc: r1(th / (1 + G[ct])), moc_dau_nam: c.kieu === 'so_du' ? c.S0 : '' }; });

// ---------- Cảnh báo, nhiệm vụ / đề xuất (đầu vào giả lập, sinh từ số vừa tính) ----------
const low = scores.slice(-3).reverse();
const fmtD = (x) => String(r1(x)).replace('.', ',');
const canhBao = [];
const nplCn = byKey[`${KY_MOI_NHAT}|CN|NPL`];
canhBao.push({ id: 'CB01', thang: KY_MOI_NHAT, muc: 3, loai: 'KPI chưa đạt', text: `Tỷ lệ nợ xấu toàn CN ${String(r2(nplCn.th)).replace('.', ',')}% so trần ${String(r2(nplCn.kh)).replace('.', ',')}% (hoàn thành ${Math.round(nplCn.ht * 100)}%).`, dv: '', ct: 'NPL' });
canhBao.push({ id: 'CB02', thang: KY_MOI_NHAT, muc: 3, loai: 'Đơn vị điểm thấp', text: `${low[0].ten} đạt ${fmtD(low[0].d)} điểm, thấp nhất toàn chi nhánh${low[0].d < low[0].p ? ` (giảm ${fmtD(low[0].p - low[0].d)} điểm so kỳ trước)` : ''}.`, dv: low[0].dv, ct: '' });
canhBao.push({ id: 'CB03', thang: KY_MOI_NHAT, muc: 2, loai: 'Đơn vị điểm thấp', text: `${low[1].ten} đạt ${fmtD(low[1].d)} điểm, dưới mức Khá.`, dv: low[1].dv, ct: '' });
canhBao.push({ id: 'CB04', thang: KY_MOI_NHAT, muc: 2, loai: 'Nguy cơ không đạt KH năm', text: 'Tiền gửi KHCN dự kiến chỉ đạt khoảng ' + Math.round(duBao.find((d) => d.ct === 'TG_KHCN').ht_du_bao * 100) + '% kế hoạch năm theo xu hướng hiện tại.', dv: '', ct: 'TG_KHCN' });
canhBao.push({ id: 'CB05', thang: KY_MOI_NHAT, muc: 2, loai: 'Số liệu bất thường', text: 'PGD-4: số dư CASA giảm mạnh bất thường so với tháng trước — cần rà soát số liệu hoặc nguyên nhân.', dv: 'DV09', ct: 'CASA' });
canhBao.push({ id: 'CB06', thang: KY_MOI_NHAT, muc: 2, loai: 'Thiếu số liệu', text: '3 ô thực hiện chưa nhập: PGD-2 (Dư nợ BQ), P.KHDN-3 (CASA), P.HT-1 (Thẻ phát hành).', dv: '', ct: '' });
canhBao.push({ id: 'CB07', thang: KY_MOI_NHAT, muc: 1, loai: 'Chưa khoá kỳ', text: 'Kỳ T10/2026 chưa khoá số liệu.', dv: '', ct: '' });
canhBao.push({ id: 'CB08', thang: KY_MOI_NHAT, muc: 1, loai: 'Số liệu theo quý', text: 'Hài lòng KH (CX) và Tuân thủ quy trình chỉ có số cuối quý — kỳ này hiển thị GAP.', dv: '', ct: 'CX' });
const hanhDong = [
  ['HD01', 'Nợ xấu vượt trần kế hoạch', 'Rà soát nhóm nợ 2 sắp chuyển nhóm; lập kế hoạch thu hồi từng khoản trên 5 tỷ đồng.', 'DV08', 'NPL', 'Trưởng PGD-3 (mẫu)', '2026-11-05', 'dang_lam', 3],
  ['HD02', 'Tiền gửi KHCN thấp so kế hoạch', 'Chạy chương trình giữ chân tiền gửi tất toán đến hạn trong quý IV; giao chỉ tiêu theo PGD.', 'DV04', 'TG_KHCN', 'Trưởng P.KHCN-1 (mẫu)', '2026-11-20', 'moi', 3],
  ['HD03', 'Số dư CASA tụt bất thường', 'Đối chiếu số liệu CASA kỳ T10 của PGD-4; xác nhận nguyên nhân và cập nhật.', 'DV09', 'CASA', 'Kiểm soát viên (mẫu)', '2026-11-04', 'moi', 2],
  ['HD04', 'Lợi nhuận trước thuế dưới kế hoạch', 'Rà soát chi phí hoạt động và chi phí dự phòng; đề xuất điều chỉnh cuối năm.', '', 'LNTT', 'Phụ trách Kế toán (mẫu)', '2026-11-25', 'moi', 2],
  ['HD05', 'Đơn vị có điểm thấp nhất', 'Họp rà soát kế hoạch hành động với ' + low[0].ten + '; theo dõi tuần.', low[0].dv, '', 'Phó giám đốc phụ trách (mẫu)', '2026-11-15', 'dang_lam', 3],
  ['HD06', 'Bancassurance thấp', 'Tăng cường bán chéo bảo hiểm cho khách hàng vay mới; thi đua theo tuần.', '', 'BANCAS', 'Trưởng P.KHCN-2 (mẫu)', '2026-11-30', 'moi', 1],
  ['HD07', 'Chưa nhập đủ số liệu', 'Bổ sung 3 ô thực hiện còn thiếu để khoá kỳ T10.', '', '', 'Quản trị số liệu (mẫu)', '2026-11-03', 'dang_lam', 1],
  ['HD08', 'Thu hồi nợ đã xử lý', 'Phân công thu hồi các hồ sơ có tài sản bảo đảm; báo cáo hằng tuần.', 'DV01', 'THU_NO', 'Trưởng P.KHDN-1 (mẫu)', '2026-10-28', 'xong', 2],
].map(([id, van_de, de_xuat, dv, ct, nguoi, han, trang_thai, muc]) => ({ id, thang: KY_MOI_NHAT, van_de, de_xuat, dv, ct, nguoi, han, trang_thai, muc }));
const batThuong = [{ id: 'BT01', thang: KY_MOI_NHAT, loai: 'Biến động mạnh', dv: 'DV09', ct: 'CASA', muc: 2, text: 'CASA PGD-4 giảm mạnh so tháng trước' }, { id: 'BT02', thang: KY_MOI_NHAT, loai: 'Thiếu số', dv: 'DV07', ct: 'DUNO_BQ', muc: 2, text: 'Chưa nhập thực hiện' }];

// ---------- Ghi CSV ----------
const esc = (v) => { if (v === null || v === undefined) return ''; const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = (cols, data) => cols.join(',') + '\n' + data.map((r) => cols.map((c) => esc(r[c])).join(',')).join('\n') + '\n';
const write = (name, cols, data) => { fs.writeFileSync(path.join(OUT, name + '.csv'), csv(cols, data)); console.log('  ghi', name + '.csv', data.length, 'dòng'); };

write('don_vi', ['ma', 'ten_ngan', 'ten', 'khoi', 'khoi_ten', 'thu_tu'], [{ ma: 'CN', ten_ngan: 'Toàn CN', ten: 'Toàn chi nhánh', khoi: 'CN', khoi_ten: 'Toàn chi nhánh', thu_tu: 0 }, ...UNITS.map((u, i) => ({ ma: u.ma, ten_ngan: u.ten_ngan, ten: u.ten + ' (mẫu)', khoi: u.khoi, khoi_ten: KHOI_NAME[u.khoi], thu_tu: i + 1 }))]);
write('chi_tieu', ['ma', 'ten_ngan', 'ten', 'dvt', 'nhom', 'huong', 'kieu', 'toi_da', 'ts_goc', 'hien_tq', 'thu_tu'], CT.map((c) => ({ ma: c.ma, ten_ngan: c.ten_ngan, ten: c.ten, dvt: c.dvt, nhom: c.nhom, huong: c.huong, kieu: c.kieu, toi_da: c.toi_da, ts_goc: c.ts, hien_tq: c.hien_tq, thu_tu: c.thu_tu })));
write('ket_qua', ['thang', 'dv', 'ct', 'ts', 'kh', 'th', 'ht', 'th_truoc', 'diem', 'mat'], rows.map((r) => ({ thang: r.thang, dv: r.dv, ct: r.ct, ts: r.ts, kh: r.kh === null ? '' : r2(r.kh), th: r.th === null ? '' : r2(r.th), ht: r.ht === null ? '' : r4(r.ht), th_truoc: r.th_truoc === null ? '' : r2(r.th_truoc), diem: r.diem === null ? '' : r4(r.diem), mat: r.mat === null ? '' : r4(r.mat) })));
write('du_bao', ['thang', 'ct', 'ht_du_bao', 'quy_doi_du_bao', 'ket_luan', 'can_moi_thang'], duBao);
write('moc_cn', ['thang', 'ct', 'th_cung_ky_nam_truoc', 'moc_dau_nam'], mocCn);
write('canh_bao', ['id', 'thang', 'muc', 'loai', 'text', 'dv', 'ct'], canhBao);
write('hanh_dong', ['id', 'thang', 'van_de', 'de_xuat', 'dv', 'ct', 'nguoi', 'han', 'trang_thai', 'muc'], hanhDong);
write('bat_thuong', ['id', 'thang', 'loai', 'dv', 'ct', 'muc', 'text'], batThuong);
write('ky', ['nam', 'thang', 'nhan', 'ngay_lap', 'cap_nhat_luc', 'khoa'], Array.from({ length: KY_MOI_NHAT }, (_, i) => ({ nam: NAM, thang: i + 1, nhan: `T${i + 1}/${NAM}`, ngay_lap: i + 1 === KY_MOI_NHAT ? '2026-11-08' : `2026-${String(i + 2).padStart(2, '0')}-05`, cap_nhat_luc: i + 1 === KY_MOI_NHAT ? '2026-11-08 08:30' : `2026-${String(i + 2).padStart(2, '0')}-05 17:00`, khoa: i + 1 < KY_MOI_NHAT })));
write('cau_hinh', ['key', 'value', 'mo_ta'], [
  { key: 'nguong.dat', value: 1, mo_ta: 'Ngưỡng Đạt (tỷ lệ hoàn thành, 1 = 100%).' },
  { key: 'nguong.kha', value: 0.8, mo_ta: 'Ngưỡng Khá.' },
  { key: 'nguong.cct', value: 0.7, mo_ta: 'Ngưỡng Cần cải thiện; dưới ngưỡng này là Chưa đạt.' },
  { key: 'nguong.diem_cao', value: 90, mo_ta: 'D7: ngưỡng điểm (thang 100) để đếm đơn vị nổi bật — thay hằng số 90. Mặc định 90.' },
  { key: 'chi_nhanh', value: 'VietinBank Chi nhánh Bắc Nghệ An', mo_ta: 'Tên hiển thị.' },
]);
console.log('Hoàn tất. Seed', SEED);
