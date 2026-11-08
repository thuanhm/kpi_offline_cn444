Hệ thống thiết kế cho dashboard KPI điều hành của VietinBank Chi nhánh Bắc Nghệ An: một hệ màu trạng thái duy nhất, số liệu đọc nhanh, chạy offline, hai màn hình (Tổng quan chi nhánh, Điều hành Ban giám đốc) và chế độ trình chiếu 16:9.

## Nguyên tắc nội dung

- Viết tiếng Việt, câu ngắn, chủ động. Số theo định dạng vi-VN: dấu chấm hàng nghìn, dấu phẩy thập phân (`1.234,5`); phần trăm `96%`; thay đổi có dấu và tên kỳ (`▲ 0,1 so T9/2026`).
- Dùng đúng thuật ngữ: **Đạt**, **Khá**, **Cần cải thiện**, **Chưa đạt**, **GAP** (chưa có số). “Dự kiến” viết hoa **DỰ KIẾN** mỗi khi là số chưa xảy ra.
- Nhãn trạng thái luôn là chữ + biểu tượng. Không dùng emoji.
- Câu mẫu thật: “Điểm KPI 93,8 (▲0,1 so T9/2026), mức Khá; 7/20 chỉ tiêu đạt.”, “Chưa có dữ liệu dự kiến cho kỳ này.”

## Nền tảng thị giác

**Màu thương hiệu.** `brand-blue` (#005993) cho nút, liên kết, tiêu đề nhấn và chuỗi dữ liệu chính. `brand-red` (#d71249) **chỉ** cho nhận diện (dải trên cùng, logo); không bao giờ dùng cho dữ liệu hoặc trạng thái vì dễ nhầm với `tier-chua`.

**Nền và chữ.** Trang `surface-page`, thẻ `surface-card`, rãnh/tiêu đề bảng `surface-sunken`, đường kẻ `line` (nét liền, mảnh). Chữ chính `ink`; chữ phụ `ink-2`; nhãn/trục `ink-muted`. Mọi chữ đạt ≥4,5:1 trên các nền nêu trong ghi chú token.

**Hệ trạng thái KPI (PA-A).** Một hệ duy nhất cho Đạt/Khá/Cần cải thiện/Chưa đạt/GAP, dùng ở mọi nơi:

| Mức | Màu đổ | Chữ trên nền nhạt | Biểu tượng |
|---|---|---|---|
| Đạt | `tier-dat` #1c5cab | `tier-dat-ink` | vòng đặc + dấu ✓ |
| Khá | `tier-kha` #6da7ec | `tier-kha-ink` | vòng rỗng + dấu ✓ |
| Cần cải thiện | `tier-cct` #ec835a | `tier-cct-ink` | tam giác cảnh báo |
| Chưa đạt | `tier-chua` #b02a2a | `tier-chua-ink` | vòng đặc + dấu ✕ |
| GAP | `tier-gap` #8996ab | `tier-gap-ink` | vòng nét đứt + gạch |

Chữ đặt trực tiếp lên màu đổ dùng `on-tier-*`. Màu đổ `tier-kha`, `tier-cct`, `tier-gap` dưới 3:1 trên `surface-card` nên **bắt buộc** kèm nhãn chữ + biểu tượng (đã gắn sẵn trong `TierChip`, `TierBar`, `RankBars`, `BulletRow`). Ngưỡng của từng mức lấy từ cấu hình `nguong`, không viết cứng trong thành phần.

**Danh mục và độ lớn.** Chuỗi so sánh dùng `series-1`…`series-4` (tối đa 4; chuỗi bình quân/kế hoạch/tham chiếu dùng `series-neutral` — xám đủ sáng để tách khỏi xanh thương hiệu). Độ lớn thuần túy (điểm mất, hạng) dùng thang một tông `seq-100`…`seq-700`. Không dùng thang cầu vồng.

**Chữ.** Plus Jakarta Sans (400/500/600/700, có tiếng Việt), kể cả số lớn; không dùng chữ có chân. Bậc: `caption` 12, `body` 14, `title-sm` 16, `title` 20, `display` 28, `hero` 52; trình chiếu dùng `present-*`. `tabular-nums` chỉ cho cột bảng; số lớn dùng số tỷ lệ.

**Khoảng cách, bo góc, nổi.** Lưới 4px: `space-1`…`space-12`. Bo góc `radius-sm` (chip, nút), `radius-md` (thẻ), `radius-pill` (thanh). Bóng chỉ hai mức: `shadow-card` rất nhẹ, `shadow-pop` cho tooltip. Không gradient, không hiệu ứng 3D, không animation.

**Biểu đồ.** SVG phẳng; đường 2–2,5px; lưới `chart-grid` nét liền; ngưỡng `chart-ref` nét liền mảnh kèm nhãn; **nét đứt dành riêng cho số DỰ KIẾN** (`forecast`) kèm nhãn và chú giải. Nhãn trực tiếp ở cuối đường và đầu thanh; không đặt số lên mọi điểm. Mỗi biểu đồ có bản bảng (`DataTable`) và `aria-label`; điểm dữ liệu truy cập được bằng bàn phím.

**Bố cục.** Lưới 12 cột, tối đa `layout-max`, căn giữa. Chế độ trình chiếu dùng khung `stage-w`×`stage-h` (1920×1080) và co giãn theo cửa sổ; nội dung phụ ẩn. Vùng bấm tối thiểu `tap-min`.

## Tiếp cận

Chữ ≥4,5:1; viền/biểu tượng mang nghĩa ≥3:1; vòng focus 2px `focus-ring`; mọi hàng/thẻ bấm được là `role="button"` có `tabindex="0"` và nhận Enter/Space; không chỉ dựa vào màu; tooltip chỉ bổ trợ.

## Biểu tượng

Biểu tượng trạng thái là hình học đơn giản (vòng, tam giác, dấu ✓ ✕, nét đứt) được viết trong `VTB.svgIcon`, mỗi mức một hình khác nhau. Logo VietinBank xem nhóm tài sản **Logos**: sao chép nguyên bản, không vẽ lại.

## Cách dùng

Nạp `tokens.css`, `components/bundle.css`, `components/bundle.js`; đặt thành phần trong phần tử `class="vtb-scope"`. Thêm `is-stage` vào phần tử gốc để dùng bậc chữ trình chiếu.
