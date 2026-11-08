// NGUỒN DUY NHẤT của token thiết kế. Sinh ra:
//   design-system/project/tokens.json   (định dạng skill claude-design-system)
//   design-system/project/tokens.css    (biên dịch từ tokens.json)
//   dashboard/src/tokens.css            (bản dùng cho trang dashboard, không @font-face)
//   reports/contrast.json               (kết quả kiểm tra WCAG — dùng cho báo cáo)
// Thoát mã 1 nếu có cặp chữ/nền không đạt ngưỡng bắt buộc.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrast, mix, inkFor } from './lib/color.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = '#ffffff';

// ---------- Thương hiệu & trung tính (giá trị do chủ dự án chốt / lấy từ App/css/app.css) ----------
const BRAND_BLUE = '#005993', BRAND_RED = '#d71249';
const INK = '#15233b', INK2 = '#4a5a72', INK_MUTED = '#5a6881';
const PAGE = '#f4f6fa', CARD = W, SUNKEN = '#eaeff6', LINE = '#e3e9f2';

// ---------- Trạng thái KPI — PA-A (D1) ----------
const TIER = {
  dat: { fill: '#1c5cab', label: 'Đạt' },
  kha: { fill: '#6da7ec', label: 'Khá' },
  cct: { fill: '#ec835a', label: 'Cần cải thiện' },
  chua: { fill: '#b02a2a', label: 'Chưa đạt' },
  gap: { fill: '#8996ab', label: 'GAP (thiếu số)' },
};
const color = [];
const add = (name, value, usage) => color.push({ name, value, usage });

add('brand-blue', BRAND_BLUE, 'Xanh thương hiệu VietinBank. Nút chính, liên kết, tiêu đề nhấn, chuỗi dữ liệu số 1. Chữ trắng trên nền này 7,4:1; dùng làm chữ trên `surface-card`.');
add('brand-blue-dark', '#004573', 'Nền thanh tiêu đề / hover nút chính. Chữ `on-brand` đọc được trên nền này.');
add('brand-blue-tint', '#e6f1f8', 'Nền nhẹ cho mục đang chọn, chip trung tính. Chữ `brand-blue` hoặc `ink` đọc được trên nền này.');
add('brand-red', BRAND_RED, 'Đỏ thương hiệu — CHỈ cho nhận diện (dải thương hiệu, logo). Không dùng cho dữ liệu, trạng thái hay chuỗi biểu đồ; dễ nhầm với `tier-chua`.');
add('surface-page', PAGE, 'Nền trang. Chữ `ink`, `ink-2`, `ink-muted` đạt 4,5:1 trở lên trên nền này.');
add('surface-card', CARD, 'Nền thẻ, bảng, biểu đồ.');
add('surface-sunken', SUNKEN, 'Nền lõm: thanh tiến độ (rãnh), hàng tiêu đề bảng.');
add('line', LINE, 'Đường kẻ mảnh trang trí giữa các khối và hàng bảng (nét liền, 1px).');
add('line-strong', inkFor('#8996ab', [CARD], 3.0), 'Viền ô nhập, nút bấm — viền mang nghĩa nên đạt 3:1 trên `surface-card`.');
add('ink', INK, 'Chữ chính trên `surface-page`, `surface-card`, `surface-sunken` và các nền nhạt của trạng thái.');
add('ink-2', INK2, 'Chữ phụ trên `surface-card`, `surface-page`.');
add('ink-muted', INK_MUTED, 'Nhãn trục, chú thích, đơn vị tính trên `surface-card`, `surface-page`, `surface-sunken` (≥4,5:1).');
add('on-brand', '#ffffff', 'Chữ trên `brand-blue` và `brand-blue-dark`.');
add('focus-ring', '{brand-blue}', 'Vòng focus bàn phím 2px, cách 2px; ≥3:1 trên `surface-card` và `surface-page`.');

const pairs = []; // {fg, bg, kind, note}
const hexOf = Object.create(null);
for (const k of Object.keys(TIER)) {
  const f = TIER[k].fill, tint = mix(f, W, 0.12);
  const ink = inkFor(f, [tint, W], 4.5);
  const on = contrast('#ffffff', f) >= contrast(INK, f) ? '#ffffff' : INK;
  TIER[k].tint = tint; TIER[k].ink = ink; TIER[k].on = on;
  add(`tier-${k}`, f, `Màu đổ (fill) trạng thái "${TIER[k].label}": thanh, ô, chấm. Luôn kèm biểu tượng + nhãn chữ; chữ trên nền này dùng \`on-tier-${k}\`.`);
  add(`tier-${k}-tint`, tint, `Nền nhạt chip/ô trạng thái "${TIER[k].label}" (12% của màu đổ trên trắng). Chữ dùng \`tier-${k}-ink\`.`);
  add(`tier-${k}-ink`, ink, `Chữ/biểu tượng trạng thái "${TIER[k].label}" trên \`tier-${k}-tint\` và \`surface-card\` (≥4,5:1).`);
  add(`on-tier-${k}`, on, `Chữ đặt trực tiếp trên \`tier-${k}\`.`);
}
['#005993', '#eb6834', '#1baf7a', '#6250d6'].forEach((c, i) => add(`series-${i + 1}`, c,
  ['Chuỗi dữ liệu 1 (nhấn): xanh thương hiệu — chuỗi "Toàn chi nhánh", thực hiện.', 'Chuỗi 2: cam — dùng cho phần âm / suy giảm trong biểu đồ phân kỳ.', 'Chuỗi 3: xanh ngọc.', 'Chuỗi 4: tím. Tối đa 4 chuỗi; từ chuỗi 4 trở lên bắt buộc nhãn trực tiếp.'][i]));
add('series-neutral', '{line-strong}', 'Chuỗi trung tính (bình quân, kế hoạch, tham chiếu) đi cùng `series-1`: sáng hơn đủ để tách khỏi xanh thương hiệu (ΔE ≥ 15 với mắt thường) và ≥3:1 trên `surface-card`; luôn có nhãn trực tiếp.');
[['100', '#cde2fb'], ['250', '#86b6ef'], ['400', '#3987e5'], ['550', '#1c5cab'], ['700', '#0d366b']].forEach(([s, c]) => add(`seq-${s}`, c, 'Thang một tông xanh nhạt→đậm cho độ lớn thuần túy (hạng, điểm mất). Không dùng cho trạng thái.'));
add('chart-grid', LINE, 'Đường lưới biểu đồ: nét liền, mảnh, một nấc khác nền.');
add('chart-axis', '#b9c3d3', 'Đường trục / đường nền biểu đồ.');
add('chart-ref', '{ink-2}', 'Đường ngưỡng tham chiếu (Đạt/Khá): nét liền mảnh kèm nhãn. Nét đứt dành riêng cho số liệu DỰ KIẾN.');
add('forecast', '{brand-blue}', 'Đường và nhãn DỰ KIẾN (D8): luôn nét đứt, điểm đầu rỗng, có chú giải; không dùng cho số thực tế.');
add('delta-up', '{tier-dat-ink}', 'Chữ thay đổi theo hướng tốt.');
add('delta-down', '{tier-chua-ink}', 'Chữ thay đổi theo hướng xấu.');

// Giá trị đã giải alias (để kiểm tra tương phản)
const resolve = (n) => { const t = color.find((x) => x.name === n); return t.value.startsWith('{') ? resolve(t.value.slice(1, -1)) : t.value; };
color.forEach((t) => { hexOf[t.name] = resolve(t.name); });

// ---------- Kiểm tra tương phản ----------
const P = (fg, bg, kind, note) => pairs.push({ fg, bg, kind, note });
for (const bg of ['surface-page', 'surface-card', 'surface-sunken']) { P('ink', bg, 'text'); P('ink-2', bg, 'text'); P('ink-muted', bg, 'text'); }
P('on-brand', 'brand-blue', 'text'); P('on-brand', 'brand-blue-dark', 'text');
P('brand-blue', 'surface-card', 'text', 'liên kết'); P('brand-blue', 'surface-page', 'text', 'liên kết'); P('brand-blue', 'brand-blue-tint', 'text');
P('ink', 'brand-blue-tint', 'text');
P('brand-red', 'surface-card', 'text', 'chỉ nhận diện');
P('delta-up', 'surface-card', 'text'); P('delta-down', 'surface-card', 'text');
for (const k of Object.keys(TIER)) {
  P(`tier-${k}-ink`, `tier-${k}-tint`, 'text'); P(`tier-${k}-ink`, 'surface-card', 'text'); P(`tier-${k}-ink`, 'surface-page', 'text');
  P(`on-tier-${k}`, `tier-${k}`, 'text', 'nhãn trên màu đổ');
  P(`tier-${k}`, 'surface-card', 'mark', 'ô/thanh màu — bắt buộc kèm nhãn + biểu tượng nếu < 3:1');
}
P('focus-ring', 'surface-card', 'nontext'); P('focus-ring', 'surface-page', 'nontext'); P('line-strong', 'surface-card', 'nontext');
for (let i = 1; i <= 4; i++) P(`series-${i}`, 'surface-card', 'mark', 'chuỗi biểu đồ');
P('forecast', 'surface-card', 'nontext', 'đường dự kiến'); P('series-neutral', 'surface-card', 'nontext', 'chuỗi trung tính');
const need = { text: 4.5, nontext: 3, mark: 0 };
const report = pairs.map((p) => { const r = contrast(hexOf[p.fg], hexOf[p.bg]); return { ...p, fgHex: hexOf[p.fg], bgHex: hexOf[p.bg], ratio: Math.round(r * 100) / 100, need: need[p.kind], pass: r >= need[p.kind], relief: p.kind === 'mark' && r < 3 }; });
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'contrast.json'), JSON.stringify({ tier: TIER, pairs: report }, null, 1));
const fails = report.filter((r) => !r.pass);
console.log(`Tương phản: ${report.length} cặp, ${fails.length} không đạt, ${report.filter((r) => r.relief).length} cặp "mark" < 3:1 (cần nhãn).`);
fails.forEach((f) => console.log('  ✗', f.fg, f.fgHex, 'trên', f.bg, f.bgHex, f.ratio, '<', f.need));

// ---------- Typography, khoảng cách, bo góc, bóng ----------
const sans = '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif';
const S = (name, fontSize, lineHeight, fontWeight, usage, sample, letterSpacing) => ({ name, fontSize, lineHeight, fontWeight, usage, sample: sample || 'Điểm KPI toàn chi nhánh 91,4', ...(letterSpacing ? { letterSpacing } : {}) });
const type = {
  fonts: ['400', '500', '600', '700'].flatMap((w) => ['latin-ext', 'vietnamese', 'latin'].map((sub) => ({ family: 'Plus Jakarta Sans', file: `fonts/plus-jakarta-sans-${sub}-${w}-normal.woff2`, weight: w, style: 'normal' }))),
  families: { sans },
  groups: [
    { name: 'Dashboard', family: 'sans', styles: [
      S('caption', '12px', '16px', 500, 'Nhãn trục, đơn vị tính, chú thích. Không nhỏ hơn 12px.'),
      S('label', '12px', '16px', 600, 'Nhãn thẻ KPI, tiêu đề cột bảng (viết hoa chữ đầu).', 'Điểm KPI CN', '0.01em'),
      S('body', '14px', '20px', 400, 'Nội dung, ô bảng.'),
      S('title-sm', '16px', '22px', 600, 'Tiêu đề thẻ/biểu đồ.'),
      S('title', '20px', '28px', 600, 'Tiêu đề màn hình.'),
      S('display', '28px', '34px', 700, 'Số trong thẻ KPI.', '1.234,5'),
      S('hero', '52px', '56px', 700, 'MỘT số chính trên mỗi màn (số tỷ lệ, không tabular).', '91,4'),
    ] },
    { name: 'Trình chiếu 1920×1080', family: 'sans', styles: [
      S('present-caption', '16px', '22px', 500, 'Chú thích, nhãn trục khi trình chiếu.'),
      S('present-body', '20px', '28px', 500, 'Nội dung trong chế độ trình chiếu.'),
      S('present-title', '26px', '34px', 600, 'Tiêu đề khối trong chế độ trình chiếu.'),
      S('present-display', '40px', '46px', 700, 'Số trong thẻ KPI khi trình chiếu.', '1.234,5'),
      S('present-hero', '96px', '100px', 700, 'Số chính khi trình chiếu.', '91,4'),
    ] },
  ],
};
const spacing = { tokens: [['space-1', '4px', 'Khe nhỏ nhất, giữa biểu tượng và chữ.'], ['space-2', '8px', 'Khoảng cách trong chip, hàng bảng gọn.'], ['space-3', '12px', 'Giữa các nhóm nhỏ.'], ['space-4', '16px', 'Padding thẻ; khoảng cách lưới (≥1440).'], ['space-6', '24px', 'Giữa các khối lớn; lề trang.'], ['space-8', '32px', 'Lề trang khi trình chiếu.'], ['space-12', '48px', 'Khoảng trống nghỉ giữa các phần.']].map(([name, value, usage]) => ({ name, value, usage })) };
const radius = { tokens: [['radius-sm', '6px', 'Chip, nút, ô nhập.'], ['radius-md', '10px', 'Thẻ, bảng.'], ['radius-pill', '999px', 'Thanh tiến độ, dải phân bố, chấm.']].map(([name, value, usage]) => ({ name, value, usage })) };
const shadow = { tokens: [['shadow-card', '0 1px 2px rgba(16, 38, 77, 0.06)', 'Thẻ ở trạng thái nghỉ — rất nhẹ.'], ['shadow-pop', '0 8px 24px rgba(16, 38, 77, 0.16)', 'Tooltip, menu nổi.']].map(([name, value, usage]) => ({ name, value, usage })) };
const layout = { note: 'Kích thước bố cục.', tokens: [['layout-max', '1600px', 'Chiều rộng tối đa nội dung (căn giữa).'], ['stage-w', '1920px', 'Khung trình chiếu 16:9 — chiều rộng tham chiếu.'], ['stage-h', '1080px', 'Khung trình chiếu 16:9 — chiều cao tham chiếu.'], ['tap-min', '32px', 'Vùng bấm tối thiểu của hàng/ô tương tác.']].map(([name, value, usage]) => ({ name, value, usage })) };

const tokens = { name: 'VietinBank KPI', version: 1, color: { themes: [{ id: 'light', name: 'Sáng' }], tokens: color }, type, spacing, radius, shadow, layout };
const dsDir = path.join(ROOT, 'design-system', 'project');
fs.mkdirSync(dsDir, { recursive: true });
fs.writeFileSync(path.join(dsDir, 'tokens.json'), JSON.stringify(tokens, null, 2) + '\n');

// ---------- tokens.css biên dịch ----------
const cssVal = (v) => (v.startsWith('{') ? `var(--${v.slice(1, -1)})` : v);
const group = (arr) => arr.map((t) => `  --${t.name}: ${cssVal(t.value)};`).join('\n');
let css = `/* ${tokens.name} — generated from tokens.json */\n:root, [data-theme="light"] {\n${group(color)}\n${group(shadow.tokens)}\n}\n:root {\n${group(spacing.tokens)}\n${group(radius.tokens)}\n${group(layout.tokens)}\n  --font-sans: ${sans};\n}\n`;
for (const g of type.groups) for (const s of g.styles) css += `.${s.name} { font-family: var(--font-sans); font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight};${s.letterSpacing ? ` letter-spacing: ${s.letterSpacing};` : ''} }\n`;
const fontFaces = type.fonts.map((f) => `@font-face { font-family: 'Plus Jakarta Sans'; font-style: normal; font-weight: ${f.weight}; font-display: swap; src: url('${f.file}') format('woff2'); }`).join('\n');
fs.writeFileSync(path.join(dsDir, 'tokens.css'), css + fontFaces + '\n');
fs.mkdirSync(path.join(ROOT, 'dashboard', 'src'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dashboard', 'src', 'tokens.css'), css);
console.log(`Token: ${color.length} màu, ${type.groups.reduce((a, g) => a + g.styles.length, 0)} kiểu chữ. Đã ghi tokens.json, tokens.css (x2).`);
if (fails.length) process.exit(1);
