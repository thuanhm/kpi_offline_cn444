// Test D7 + quy tắc phân loại. Chạy: node tools/test-d7.mjs   (không cần cài thư viện)
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CALCS = createRequire(import.meta.url)(path.join(ROOT, 'dashboard', 'src', 'calcs.cjs'));
const DATA = path.join(ROOT, 'dashboard', 'src', 'data');

function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; } else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const h = rows.shift(); return rows.filter((r) => r.length === h.length).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
export function runCalcs(datasets, overrideRows = {}) {
  const res = { ...datasets, ...overrideRows };
  for (const c of CALCS) res[c.id] = c.fn(...c.inputs.map((i) => res[i]));
  return res;
}
const load = () => Object.fromEntries(fs.readdirSync(DATA).filter((f) => f.endsWith('.csv')).map((f) => [f.replace('.csv', ''), parseCsv(fs.readFileSync(path.join(DATA, f), 'utf8'))]));

let pass = 0; const log = [];
function t(name, fn) { try { fn(); pass++; log.push('✓ ' + name); } catch (e) { log.push('✗ ' + name + '\n    ' + e.message.split('\n').join('\n    ')); process.exitCode = 1; } }

const ds = load();
const cfgRows = (diem) => ds.cau_hinh.filter((r) => r.key !== 'nguong.diem_cao').concat(diem === undefined ? [] : [{ key: 'nguong.diem_cao', value: String(diem), mo_ta: '' }]);
const cfgOf = (diem) => CALCS.find((c) => c.id === 'cfg').fn(cfgRows(diem));

// ----- D7: mặc định 90 -----
t('D7: thiếu khoá nguong.diem_cao → mặc định 90 (bảo toàn hành vi cũ)', () => assert.equal(cfgOf(undefined).diem_cao, 90));
t('D7: khoá rỗng hoặc không phải số → mặc định 90', () => { assert.equal(CALCS[0].fn([{ key: 'nguong.diem_cao', value: '' }]).diem_cao, 90); assert.equal(CALCS[0].fn([{ key: 'nguong.diem_cao', value: 'abc' }]).diem_cao, 90); });
t('D7: dataset mẫu có nguong.diem_cao = 90', () => assert.equal(cfgOf(ds.cau_hinh.find((r) => r.key === 'nguong.diem_cao').value).diem_cao, 90));

// ----- D7: biên bằng / cao hơn / thấp hơn ngưỡng (dùng chính calc tong_cn) -----
const tongCn = (scores, diem) => {
  const diem_dv = scores.map((q, i) => ({ dv: 'DV' + (i + 1), thang: 1, quy_doi: q, so_dat: 0, so_kha: 0, so_cct: 0, so_chua: 0, so_gap: 0, n: 1 })).concat([{ dv: 'CN', thang: 1, quy_doi: 95, so_dat: 0, so_kha: 0, so_cct: 0, so_chua: 0, so_gap: 0, n: 1 }]);
  const don_vi = scores.map((_, i) => ({ ma: 'DV' + (i + 1), ten_ngan: 'D' + i, ten: 'D' + i, khoi: 'PGD', thu_tu: i + 1 }));
  const cfg = cfgOf(diem), xh = CALCS.find((c) => c.id === 'xep_hang').fn(diem_dv, don_vi, cfg);
  return CALCS.find((c) => c.id === 'tong_cn').fn(diem_dv, xh, cfg, [])[0];
};
t('D7: điểm THẤP hơn ngưỡng (89,99) không được tính', () => assert.equal(tongCn([89.99], 90).dv_cao, 0));
t('D7: điểm BẰNG ngưỡng (90) được tính (>=)', () => assert.equal(tongCn([90], 90).dv_cao, 1));
t('D7: điểm CAO hơn ngưỡng (90,01) được tính', () => assert.equal(tongCn([90.01], 90).dv_cao, 1));
t('D7: ba trường hợp cùng lúc → đếm đúng 2 (90 và 90,01)', () => assert.equal(tongCn([89.99, 90, 90.01], 90).dv_cao, 2));
t('D7: đổi nguong = 85 → 89,99 giờ được tính (đọc từ cấu hình, không hằng số)', () => assert.equal(tongCn([89.99, 90, 90.01], 85).dv_cao, 3));
t('D7: đổi nguong = 95 → không đơn vị nào đạt', () => assert.equal(tongCn([89.99, 90, 90.01], 95).dv_cao, 0));
t('D7: nhãn hiển thị lấy từ cùng nguồn (diem_cao trong kết quả)', () => assert.equal(tongCn([95], 88).diem_cao, 88));

// ----- D7: bảo toàn hành vi — nguong = 90 cho kết quả giống hằng số `quy_doi >= 90` cũ, mọi kỳ -----
t('D7: với nguong = 90, dv_cao trùng khít quy tắc cũ (>= 90 hằng số) ở mọi kỳ của dữ liệu mẫu', () => {
  const r = runCalcs(ds);
  for (const row of r.tong_cn) {
    const old = r.xep_hang.filter((x) => x.thang === row.thang && x.quy_doi >= 90).length;   // QUY TẮC CŨ (hằng số)
    assert.equal(row.dv_cao, old, `kỳ ${row.thang}`);
  }
  assert.ok(r.tong_cn.length >= 10);
});
t('D7: kết quả xếp hạng / điểm KHÔNG đổi khi chỉ đổi nguong.diem_cao (không ảnh hưởng công thức)', () => {
  const a = runCalcs(ds), b = runCalcs({ ...ds, cau_hinh: cfgRows(75) });
  assert.deepEqual(a.xep_hang, b.xep_hang); assert.deepEqual(a.diem_dv, b.diem_dv); assert.deepEqual(a.kq, b.kq);
});

// ----- Phân loại mức (4 mức + GAP) tại biên -----
const kq = (ht) => CALCS.find((c) => c.id === 'kq').fn([{ thang: '1', dv: 'A', ct: 'X', ts: '5', kh: '10', th: ht === '' ? '' : '10', ht, th_truoc: '', diem: '', mat: '' }], cfgOf(90))[0].tier;
t('Mức: ht = 1,0000 → Đạt (biên bằng)', () => assert.equal(kq('1'), 'dat'));
t('Mức: ht = 0,9999 → Khá', () => assert.equal(kq('0.9999'), 'kha'));
t('Mức: ht = 0,8 → Khá (biên bằng)', () => assert.equal(kq('0.8'), 'kha'));
t('Mức: ht = 0,7999 → Cần cải thiện', () => assert.equal(kq('0.7999'), 'cct'));
t('Mức: ht = 0,7 → Cần cải thiện (biên bằng)', () => assert.equal(kq('0.7'), 'cct'));
t('Mức: ht = 0,6999 → Chưa đạt', () => assert.equal(kq('0.6999'), 'chua'));
t('Mức: ht trống → GAP (không bị coi là 0%)', () => assert.equal(kq(''), 'gap'));

// ----- Phủ dữ liệu & D8 -----
const R = runCalcs(ds);
t('Dữ liệu: 12 đơn vị, 20 chỉ tiêu, 10 kỳ', () => { assert.equal(ds.don_vi.filter((d) => d.ma !== 'CN').length, 12); assert.equal(ds.chi_tieu.length, 20); assert.equal(R.tong_cn.length, 10); });
t('Dữ liệu: kỳ 10 phủ đủ 5 mức ở cấp chi nhánh', () => { const x = R.tong_cn.find((r) => r.thang === 10); assert.deepEqual([x.so_dat, x.so_kha, x.so_cct, x.so_chua, x.so_gap], [7, 6, 3, 2, 2]); });
t('Dữ liệu: có đơn vị điểm cao, trung bình, thấp', () => { const x = R.xep_hang.filter((r) => r.thang === 10).map((r) => r.quy_doi); assert.ok(Math.max(...x) >= 100 && Math.min(...x) < 80); });
t('D8: dự kiến chỉ có ở kỳ có dữ liệu đầu vào (kỳ 10); các kỳ khác = null, không tự tạo', () => { for (const r of R.tong_cn) assert.equal(r.du_bao !== null, r.thang === 10, `kỳ ${r.thang}`); for (const r of R.ct_cn) assert.equal(r.ht_du_bao !== null, r.thang === 10 && r.ht !== null, `${r.ct} kỳ ${r.thang}`); });
t('Xếp hạng: hạng 1..12 liên tục mỗi kỳ, không trùng', () => { for (let m = 1; m <= 10; m++) assert.deepEqual(R.xep_hang.filter((r) => r.thang === m).map((r) => r.hang).sort((a, b) => a - b), Array.from({ length: 12 }, (_, i) => i + 1)); });
t('GAP: dòng thiếu số không bị tính điểm / mất điểm', () => { for (const r of R.kq.filter((x) => x.tier === 'gap')) { assert.equal(r.diem, null); assert.equal(r.mat, null); } });

fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
const out = `Kết quả test D7 + phân loại: ${pass} đạt, ${log.filter((l) => l.startsWith('✗')).length} lỗi\n\n` + log.join('\n') + '\n';
fs.writeFileSync(path.join(ROOT, 'reports', 'test-d7.txt'), out);
console.log(out);
