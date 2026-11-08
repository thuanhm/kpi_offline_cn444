// Ghi dashboard vào store của skill claude-dashboard: tải CSV (upload) rồi write-db một lô.
//   node tools/publish-dashboard.mjs        (chạy sau tools/build.mjs)
// Chỉ ghi trong designs/kpi-executive-proto/dashboard/. Không chạm App/ hay Data/.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(ROOT, '..', '..');
const A = path.join(REPO, '.claude', 'skills', 'claude-dashboard', 'scripts', 'artifact.mjs');
const DASH = path.join(ROOT, 'dashboard');
const node = (args, opts = {}) => JSON.parse(execFileSync(process.execPath, [A, ...args], { cwd: DASH, encoding: 'utf8', ...opts }));
const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const edit = { via: 'claude', at: now };

const META = {
  cau_hinh: ['Sample · Cấu hình ngưỡng', 'Ngưỡng Đạt/Khá/CCT và nguong.diem_cao = 90 (D7).'],
  ket_qua: ['Sample · Kết quả theo tháng', 'Kế hoạch, thực hiện, %HT, điểm, mất điểm theo đơn vị × chỉ tiêu × tháng (T1–T10/2026).'],
  don_vi: ['Sample · Danh sách đơn vị', '12 phòng/PGD giả lập và dòng Toàn CN.'],
  chi_tieu: ['Sample · Danh mục chỉ tiêu', '20 chỉ tiêu giả lập: nhóm, hướng, đơn vị tính.'],
  ky: ['Sample · Kỳ báo cáo', 'Các kỳ T1–T10/2026, ngày lập, thời điểm cập nhật, trạng thái khoá kỳ.'],
  du_bao: ['Sample · Dữ liệu dự kiến', 'Dữ liệu DỰ KIẾN đầu vào (chỉ có cho T10/2026). Không phải số thực tế.'],
  moc_cn: ['Sample · Mốc tăng trưởng CN', 'Mốc cùng kỳ năm trước và đầu năm của chi nhánh (giả lập).'],
  canh_bao: ['Sample · Cảnh báo kỳ 10', 'Cảnh báo điều hành giả lập, sinh từ số liệu mẫu.'],
  hanh_dong: ['Sample · Nhiệm vụ đề xuất', 'Vấn đề, đề xuất hành động, đơn vị, người phụ trách (vai trò giả), hạn.'],
  bat_thuong: ['Sample · Số liệu bất thường', 'Số liệu bất thường giả lập của kỳ 10.'],
};
const SOURCE_NOTE = ' Dữ liệu GIẢ LẬP, sinh bằng tools/gen-data.mjs (seed 20261108); không phải số liệu thật của chi nhánh.';

const writes = [];
for (const id of Object.keys(META)) {
  const file = path.join(DASH, 'src', 'data', id + '.csv');
  const up = node(['upload', DASH, file]);
  writes.push({ op: 'set', path: `datasets/${id}`, data: { title: META[id][0], description: META[id][1] + SOURCE_NOTE, source: { kind: 'file', url: up.url, name: id + '.csv', format: 'csv' }, updated: { at: now, by: 'Claude Code' }, fixed: true, edit } });
}
writes.push({ op: 'set', path: 'dash/meta', data: { title: 'Dashboard KPI điều hành VietinBank Bắc Nghệ An (dữ liệu giả lập)' } });
writes.push({ op: 'set', path: 'dash/params', data: { ky: '10', dv: '', ct: 'TOI', khoi: '', man: 'tong-quan', tc: '0' } });
writes.push({ op: 'set', path: 'dash/look', data: {
  system: { name: 'VietinBank KPI', url: 'designs/kpi-executive-proto/design-system' },
  light: { ground: '#f4f6fa', card: '#ffffff', text: '#15233b', muted: '#5a6881', border: '#e3e9f2', good: '#1c5cab', warning: '#c04616', bad: '#b02a2a', charts: ['#005993', '#eb6834', '#1baf7a', '#6250d6'] },
  corners: '10px', sizes: { caption: '12px', body: '14px', heading: '16px', title: '20px' },
  fonts: { text: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif", display: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif" },
} });
for (const f of ['index.html', 'tokens.css', 'fonts.css', 'bundle.css', 'styles.css', 'vtb.js', 'calcs.js', 'app.js']) {
  writes.push({ op: 'set', path: `files/${f}`, data: { text: { $file: `src/${f}` }, edit } });
}
fs.writeFileSync(path.join(DASH, 'src', 'batch.json'), JSON.stringify(writes, null, 1));
console.log(JSON.stringify(node(['write-db', DASH, 'src/batch.json']), null, 1).slice(0, 600));
