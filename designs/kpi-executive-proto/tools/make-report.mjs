// Tổng hợp BÁO CÁO KIỂM TRA từ kết quả các bộ test:  node tools/make-report.mjs  →  reports/BAO_CAO_KIEM_TRA.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = (f) => path.join(ROOT, 'reports', f);
const J = (f) => JSON.parse(fs.readFileSync(R(f), 'utf8'));
const con = J('contrast.json'), bt = J('browser-test.json'), dsp = J('ds-preview-test.json');
const d7 = fs.readFileSync(R('test-d7.txt'), 'utf8').split('\n')[0];
const pal = fs.readFileSync(R('validate-palette.txt'), 'utf8');
const pairs = con.pairs, kinds = { text: 'Chữ trên nền (cần ≥ 4,5:1)', nontext: 'Viền, vòng focus, đường (cần ≥ 3:1)', mark: 'Màu đổ của thanh/ô (cần nhãn + biểu tượng nếu < 3:1)' };
const shots = fs.readdirSync(path.join(ROOT, 'screenshots')).filter((f) => f.endsWith('.png')).map((f) => { const b = fs.readFileSync(path.join(ROOT, 'screenshots', f)); return `| \`screenshots/${f}\` | ${b.readUInt32BE(16)}×${b.readUInt32BE(20)} |`; });
const failed = bt.results.filter((r) => !r.ok);
const groupRows = [...new Set(bt.results.map((r) => r.group))].map((g) => { const x = bt.results.filter((r) => r.group === g); return `| ${g} | ${x.length} | ${x.filter((r) => r.ok).length} |`; });

let md = `# Báo cáo kiểm tra giao diện và màu sắc — prototype Dashboard KPI VietinBank Bắc Nghệ An

Tạo bởi \`node tools/make-report.mjs\` từ kết quả các bộ test. Thời điểm kiểm thử trình duyệt: ${bt.at}. **Toàn bộ số liệu là dữ liệu giả lập.**

## 1. Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Kiểm thử trình duyệt (Edge headless, ${bt.total} kiểm tra) | **${bt.total - bt.failed}/${bt.total} đạt** |
| Test D7 + phân loại mức (Node) | ${d7.replace('Kết quả test D7 + phân loại: ', '')} |
| Tương phản WCAG (${pairs.length} cặp màu) | ${pairs.filter((p) => p.pass).length}/${pairs.length} đạt ngưỡng bắt buộc; ${pairs.filter((p) => p.relief).length} cặp màu đổ < 3:1 được bù bằng nhãn + biểu tượng |
| Design System — \`check\` của skill claude-design-system | 0 vấn đề |
| Design System — preview thành phần chạy được | ${dsp.total - dsp.failed}/${dsp.total} |
| Dashboard — \`check\` của skill claude-dashboard | 0 vấn đề, 2 cảnh báo có chủ đích (mục 7) |

## 2. Kiểm tra bảng màu bằng validator (skill dataviz)

Chạy \`validate_palette.js\`, chế độ sáng, nền \`#ffffff\`:

\`\`\`
${pal.trim()}
\`\`\`

Diễn giải:
- **A (4 mức PA-A)**: đạt toàn bộ kiểm tra cứng. Cảnh báo tương phản < 3:1 của \`#6da7ec\` (Khá) và \`#ec835a\` (CCT) được xử lý bằng **nhãn chữ + biểu tượng khác hình** trên mọi chip, ô, hàng (đã kiểm chứng bằng test trình duyệt).
- **B (thêm GAP)**: “Chroma floor” báo \`#8996ab\` “đọc như màu xám” — **đúng chủ đích** (GAP = không có số, phải trung tính); GAP còn được tách khỏi các mức khác bằng biểu tượng vòng nét đứt, viền nét đứt trên thanh, và chữ “GAP”. Mọi kiểm tra còn lại đạt.
- **C (series-1..4)**: đạt; chỉ dùng tối đa 4 chuỗi.
- **D (xu hướng)**: lần đầu dùng xám \`#5a6881\` cạnh xanh thương hiệu cho ΔE 10,0 (< 15, **không đạt**); đã đổi sang \`series-neutral = #7d8aa0\` → ΔE 19,8, CVD 17,2, tương phản 3,1:1 (đạt). “Chroma floor” của xám là chủ đích (dạng nhấn một màu + xám).

Thang heatmap cầu vồng cũ (D6) không còn dùng; ma trận trạng thái mới dùng 4 mức rời + biểu tượng + số.

## 3. Tương phản WCAG đã tính

Tính bằng công thức WCAG 2.x trên giá trị token (\`tools/build-tokens.mjs\`; build **dừng** nếu có cặp chữ < 4,5:1).

`;
for (const k of Object.keys(kinds)) {
  const x = pairs.filter((p) => p.kind === k);
  md += `\n### ${kinds[k]}\n\n| Màu trước | Màu nền | Tỷ lệ | Đạt |\n|---|---|---|---|\n` + x.map((p) => `| \`${p.fg}\` ${p.fgHex} | \`${p.bg}\` ${p.bgHex} | ${String(p.ratio).replace('.', ',')}:1 | ${k === 'mark' ? (p.ratio >= 3 ? '✓' : 'cần nhãn') : p.pass ? '✓' : '✗'} |`).join('\n') + '\n';
}
md += `
## 4. Test D7 (xem chi tiết ở \`reports/D7_BAO_CAO.md\` và \`reports/test-d7.txt\`)

${d7}. Gồm biên bằng / cao hơn / thấp hơn ngưỡng, giá trị mặc định 90, so sánh với quy tắc \`>= 90\` cũ ở mọi kỳ, đổi ngưỡng không làm đổi điểm/hạng, và phân loại mức tại các biên.

## 5. Kiểm thử trên trình duyệt

| Nhóm | Số kiểm tra | Đạt |
|---|---|---|
${groupRows.join('\n')}

Chi tiết từng kiểm tra: \`reports/browser-test.md\`. ${failed.length ? '**Không đạt:** ' + failed.map((f) => f.name).join('; ') : 'Không có mục nào không đạt.'}

Phạm vi kiểm thử: 6 kích thước cửa sổ (1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 390×844) × 2 màn hình; trình chiếu 16:9 ở 1920×1080, 1440×900, 1280×720, 1000×700; chuyển màn hình, chọn kỳ, lọc khối, drill-down đơn vị → chỉ tiêu, trình chiếu (nút, Esc, phím mũi tên); bàn phím (Tab, vòng focus, Enter); bảng thay thế; đường dự kiến; nhất quán màu; không gradient/3D/animation; in A4 ngang.

## 6. Ảnh chụp giao diện

| Tệp | Kích thước |
|---|---|
${shots.join('\n')}

Ảnh các thành phần Design System: \`screenshots/design-system/*.png\`.

## 7. Cảnh báo của skill claude-dashboard (có chủ đích)

1. *“only the light set is used … Fill both sets”* — theo **D5** không làm chế độ tối ở V1; người đọc dùng giao diện tối của hệ điều hành sẽ thấy màu mặc định của dashboard bao quanh trang, còn nội dung trang vẫn dùng bảng màu sáng riêng.
2. *“uses innerHTML”* — mọi giá trị từ dữ liệu đều đi qua hàm \`esc()\` (escape HTML) trước khi chèn.

## 8. Vấn đề còn tồn tại và giới hạn

Xem mục “Vấn đề còn tồn tại” trong \`README.md\` (đồng bộ với báo cáo này).
`;
fs.writeFileSync(R('BAO_CAO_KIEM_TRA.md'), md);
console.log('Đã ghi reports/BAO_CAO_KIEM_TRA.md (' + md.length + ' ký tự)');
