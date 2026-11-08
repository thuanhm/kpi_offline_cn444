# DESIGN SYSTEM — Giao diện mới (VietinBank KPI)

Áp dụng cho **giao diện mới** (`App/ui-moi/`). Giao diện cũ giữ nguyên bảng màu và CSS cũ.
Nguồn thiết kế và bản xem trước từng thành phần: `designs/kpi-executive-proto/design-system/` (có `tokens.json`, `README.md`, 16 thành phần và cover). Các tệp trong `App/ui-moi/` là bản đã đưa vào ứng dụng:

| Tệp | Vai trò |
|---|---|
| `ui-moi/moi-tokens.css` | Token màu, khoảng cách, bo góc, bóng — phạm vi `body.ui-moi` |
| `ui-moi/moi-components.css` + `ui-moi/vtb.js` | Thành phần `vtb-*` (HTML/SVG thuần, trả chuỗi HTML đã escape) |
| `ui-moi/moi-layout.css` | Khung ứng dụng, lưới, trình chiếu, in A4, bảng màu mới cho màn cũ đặt trong vỏ mới |
| `ui-moi/moi.css` | Điểm vào (`@import` ba tệp trên) |

## 1. Màu

| Nhóm | Token | Giá trị | Ghi chú |
|---|---|---|---|
| Thương hiệu | `brand-blue` | `#005993` | Nút chính, liên kết, tiêu đề nhấn, chuỗi dữ liệu 1 |
| | `brand-blue-dark` / `brand-blue-tint` | `#004573` / `#e6f1f8` | Hover / nền nhẹ |
| | `brand-red` | `#d71249` | **Chỉ nhận diện** (huy hiệu thông báo); không dùng cho dữ liệu/trạng thái |
| Nền | `surface-page` / `surface-card` / `surface-sunken` | `#f4f6fa` / `#ffffff` / `#eaeff6` | |
| Đường kẻ | `line` / `line-strong` | `#e3e9f2` / `#7d8aa0` | `line-strong` ≥ 3:1 (viền ô nhập) |
| Chữ | `ink` / `ink-2` / `ink-muted` | `#15233b` / `#4a5a72` / `#5a6881` | ≥ 4,5:1 trên các nền nêu trong token |
| Chuỗi biểu đồ | `series-1`…`series-4`, `series-neutral` | `#005993 #eb6834 #1baf7a #6250d6`, `#7d8aa0` | Tối đa 4 chuỗi; xám trung tính cho bình quân/kế hoạch |
| Một tông | `seq-100`…`seq-700` | `#cde2fb` → `#0d366b` | Độ lớn thuần túy (điểm mất) |

## 2. Hệ trạng thái KPI — PA-A (D1)

Một hệ duy nhất cho mọi thành phần: thẻ KPI, thanh, ô ma trận, chip, cảnh báo, bảng.

| Mức | Màu đổ | Chữ trên nền nhạt | Biểu tượng (khác hình) |
|---|---|---|---|
| Đạt | `#1c5cab` | `tier-dat-ink` | vòng đặc + ✓ |
| Khá | `#6da7ec` | `tier-kha-ink` | vòng rỗng + ✓ |
| Cần cải thiện | `#ec835a` | `tier-cct-ink` | tam giác cảnh báo |
| Chưa đạt | `#b02a2a` | `tier-chua-ink` | vòng đặc + ✕ |
| GAP (thiếu số) | `#8996ab` | `tier-gap-ink` | vòng nét đứt + gạch |

Quy tắc: luôn kèm **biểu tượng + nhãn chữ** (không chỉ màu). Ba màu đổ dưới 3:1 trên nền trắng (Khá, CCT, GAP) bắt buộc có nhãn — đã gắn sẵn trong `TierChip`, `TierBar`, `RankBars`, `BulletRow`, ma trận. Ngưỡng từng mức lấy từ `settings.nguong` (qua engine), không viết cứng trong giao diện. Ánh xạ từ chuỗi trạng thái engine sang mức: `MOI_DATA.tierTT`.

Kiểm tra tương phản WCAG: 52 cặp màu đều đạt ngưỡng bắt buộc (xem `designs/kpi-executive-proto/reports/BAO_CAO_KIEM_TRA.md`); validator màu: 4 mức PA-A đạt cả bốn kiểm tra cứng (CVD ΔE ≥ 20, mắt thường ΔE ≥ 22).

## 3. Typography

Plus Jakarta Sans (đã nhúng sẵn `assets/fonts/pjs`, có tiếng Việt), độ đậm 400/500/600/700.

| Bậc | Cỡ / dòng | Dùng cho |
|---|---|---|
| `caption` | 12 / 16 | Nhãn trục, đơn vị, chú thích (không nhỏ hơn 12px) |
| `body` | 14 / 20 | Nội dung, ô bảng |
| `title-sm` / `title` | 16 / 20 | Tiêu đề thẻ / màn hình |
| `display` | 28 | Số trong thẻ KPI |
| `hero` | 52 | MỘT số chính mỗi màn (số tỷ lệ, không `tabular-nums`) |
| `present-*` | 16 / 20 / 26 / 40 / 96 | Chế độ trình chiếu |

`tabular-nums` chỉ dùng cho cột bảng. Số định dạng vi-VN.

## 4. Khoảng cách, bo góc, đổ bóng

| Nhóm | Giá trị |
|---|---|
| Khoảng cách (lưới 4px) | `space-1…space-12`: 4 · 8 · 12 · 16 · 24 · 32 · 48 |
| Bo góc | `radius-sm` 6 (chip, nút) · `radius-md` 10 (thẻ) · `radius-pill` 999 |
| Bóng | `shadow-card` rất nhẹ · `shadow-pop` (tooltip, menu) |
| Bố cục | `layout-max` 1600 · khung trình chiếu 1920×1080 · vùng bấm tối thiểu 32 |

Không gradient, không hiệu ứng 3D, không animation.

## 5. Thành phần (`VTB.*`)

`TierChip` · `DeltaBadge` · `Sparkline` · `TierBar` · `HeroFigure` · `KpiCard` · `StatTile` · `RankBars` · `BulletRow` · `AttentionList` · `TrendLine` (đường thực tế liền, **DỰ KIẾN nét đứt + nhãn + chú giải** — D8) · `ColumnDiverge` · `LossBars` · `DataTable` (bảng thay thế cho mọi biểu đồ) · `DataFreshness`. Ma trận trạng thái (thay heatmap cầu vồng — D6) dựng trong `moi-views*.js` bằng cùng các lớp `vtb-cell`.

Thành phần cấp khung (`moi-shell.js`): sidebar, topbar, **UI Switcher** (`js/ui-switch.js`), Period Selector, bộ lọc, tooltip (`VTB.attachTips`), Presentation Control.

## 6. Quy tắc dùng

1. Một hệ trạng thái; mọi trạng thái có biểu tượng + chữ.
2. `brand-red` chỉ cho nhận diện.
3. Mỗi màn chỉ một `HeroFigure`.
4. Đường nét đứt **chỉ** dành cho số DỰ KIẾN; ngưỡng dùng nét liền mảnh kèm nhãn.
5. Biểu đồ SVG phẳng, đường 2–2,5px, nhãn trực tiếp ở cuối đường; mỗi biểu đồ có nút **Bảng** và `aria-label`.
6. Mọi hàng/thẻ bấm được là `role="button"` có `tabindex="0"`, nhận Enter/Space, vòng focus 2px `focus-ring`.
7. Không dùng Dark Mode ở phiên bản 1 (D5).
8. Màn hình cũ đặt trong vỏ mới chỉ được **đổi bảng màu** qua biến CSS dưới `body.ui-moi` (không đổi bố cục).

## 7. Ma trận chỉ tiêu — bảng màu trạng thái riêng (`ui-moi/moi-matrix.css`)

Chỉ áp dụng dưới `.moi-mx` (màn Ma trận và chế độ trình chiếu của nó); các màn khác giữ token ở mục 2.

| Mức | Nền | Chữ/biểu tượng | Tương phản | Biểu tượng |
|---|---|---|---|---|
| Đạt | `#DCEAF7` | `#07539A` | 6,32:1 | Circle Check đặc |
| Khá | `#EDF3FA` | `#35658F` | 5,51:1 | Circle Check rỗng |
| Cần cải thiện | `#FFF0D9` | `#A95708` | 4,62:1 | Triangle Alert |
| Chưa đạt | `#FCE2E2` | `#B4232D` | 5,32:1 | Circle X đặc |
| GAP | `#E9EDF2` | `#5B6B80` | 4,63:1 | Circle Minus nét đứt |

- Chữ GAP đậm hơn đề xuất `#64748B` (chỉ 4,05:1, dưới AA) để đạt ≥ 4,5:1; nền giữ nguyên.
- Nền Đạt và Khá gần nhau (1,10:1) nên được tách thêm bằng biểu tượng đặc/rỗng, màu chữ và viền 1px; không dựa vào nền.
- Ô bị làm mờ khi lọc: nền `#F3F5F9`, chữ `#5A6881` (5,0:1) — vẫn đọc được.
- Chế độ **Thứ hạng** và **Điểm bị mất** không phải trạng thái: dùng thang một tông tím (`#F7F5FD` → `#BDB1EE`, viền `#6250D6` cho hạng 1 / mất nhiều nhất), không dùng màu trạng thái.
- Cột **Toàn chi nhánh**: khung xanh thương hiệu hai bên, tiêu đề nền `brand-blue-tint` và nhãn "Tổng hợp toàn CN".

## 8. Nhận diện thương hiệu VietinBank và Heatmap liên tục (cập nhật)

**Bộ màu thương hiệu** (khai báo MỘT lần trong `App/ui-moi/moi-tokens.css`, mọi nơi khác dùng token):

| Token | Mã | Vai trò |
|---|---|---|
| `--brand-blue` | `#00538E` (RGB 0,83,142) | Màu chủ đạo: tiêu đề, điều hướng, nút chính, liên kết, số chỉ tiêu trọng tâm, chuỗi dữ liệu chính (`--series-1`). Trước đây `#005993` → đã chuyển. |
| `--brand-red` | `#D71249` | Nhấn có chọn lọc: vệt dưới tiêu đề, chỉ báo mục điều hướng đang chọn, thẻ KPI đang chọn, huy hiệu thông báo, nút nhấn `.moi-btn.accent`. KHÔNG dùng cho trạng thái KPI. |
| `--brand-sky` | `#80D1F2` | Bổ trợ: đường nhấn trên thẻ KPI, đường viền chân sidebar, vòng focus, chuỗi phụ (`--series-sky`). Không dùng làm màu chữ trên nền trắng. |
| `--brand-blue-dark` / `--brand-red-dark` / `--brand-blue-tint` / `--brand-sky-tint` | dẫn xuất | hover/pressed và nền chọn nhẹ |

Token chuẩn hóa (bí danh, không thêm màu): `--background-main/secondary`, `--surface-primary/secondary/hover/selected`, `--text-primary/secondary/muted/inverse/disabled`, `--border-default/subtle/strong/focus`, `--primary-button(-hover)`, `--accent-button(-hover)`, `--navigation-active/hover`, `--selected-state`, `--focus-ring`, `--success/warning/danger/info/neutral`.

**Ba hệ màu độc lập:** (1) thương hiệu (trên); (2) trạng thái KPI `--tier-*` (Đạt/Khá/CCT/Chưa đạt/GAP, giữ nguyên); (3) Heatmap `--hm` (đỏ→cam→vàng→xanh lá). Có test bảo đảm không ô Heatmap nào mang màu thương hiệu và đỏ thương hiệu ≠ màu Chưa đạt.

**Heatmap (Ma trận chỉ tiêu)** — thay thế bảng pastel rời rạc ở mục 7 cho các chế độ % hoàn thành KH, % KH năm, Điểm đạt:
- Thang 11 điểm `#E85D61 → #F47768 → #F49768 → #F7B66F → #FDD17A → #FFEB84 → #E8E47A → #C8DC7D → #A8D17D → #83C77B → #63BE7B`, nội suy tuyến tính theo % hoàn thành của engine (`r.ht`; chỉ tiêu "thấp là tốt" đã được engine quy về cùng thang).
- Mức (Đạt/Khá/CCT/Chưa đạt) vẫn do engine quyết định; màu luôn nằm trong dải của mức đó (Chưa đạt 0–28% thang, CCT 28–56%, Khá 56–82%, Đạt 82–100%), điểm mốc lấy từ ngưỡng cấu hình `M.ng`. Nội suy bên trong dải chỉ để hiển thị, không là ngưỡng nghiệp vụ.
- GAP: nền xám trung tính `#E9EDF2` + chữ "GAP"; ô "·" = không áp dụng, không nền.
- Chữ `#1B2333` đậm 800; tương phản thấp nhất trên thang 4,62:1 (AA).
- Kiểu lưới: ô liền nhau, không bo góc, không khe trắng, đường kẻ mảnh `rgba(27,35,51,.55)`; cột Toàn chi nhánh phân biệt bằng nền tiêu đề + hai đường kẻ đậm.
- Chú giải liên tục `.moi-hm` (thanh chuyển sắc + mốc % theo ngưỡng cấu hình). Chip lọc mang màu giữa dải của mức.
- Thứ hạng / Điểm bị mất vẫn dùng thang tím một tông (ý nghĩa dữ liệu khác nhau).

**Typography:** Plus Jakarta Sans (đã nhúng offline). **Áp dụng:** header (dải xanh + vệt đỏ), sidebar (nền sáng, icon xanh, mục chọn nền xanh nhạt + chỉ báo đỏ), nút, tiêu đề thẻ, thẻ KPI, biểu đồ (chuỗi chính xanh, phụ xám/xanh da trời; dự kiến nét đứt + nhãn DỰ KIẾN).
