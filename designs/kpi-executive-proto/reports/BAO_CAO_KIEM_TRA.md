# Báo cáo kiểm tra giao diện và màu sắc — prototype Dashboard KPI VietinBank Bắc Nghệ An

Tạo bởi `node tools/make-report.mjs` từ kết quả các bộ test. Thời điểm kiểm thử trình duyệt: 2026-11-08T04:51:27.122Z. **Toàn bộ số liệu là dữ liệu giả lập.**

## 1. Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Kiểm thử trình duyệt (Edge headless, 101 kiểm tra) | **101/101 đạt** |
| Test D7 + phân loại mức (Node) | 25 đạt, 0 lỗi |
| Tương phản WCAG (52 cặp màu) | 52/52 đạt ngưỡng bắt buộc; 4 cặp màu đổ < 3:1 được bù bằng nhãn + biểu tượng |
| Design System — `check` của skill claude-design-system | 0 vấn đề |
| Design System — preview thành phần chạy được | 17/17 |
| Dashboard — `check` của skill claude-dashboard | 0 vấn đề, 2 cảnh báo có chủ đích (mục 7) |

## 2. Kiểm tra bảng màu bằng validator (skill dataviz)

Chạy `validate_palette.js`, chế độ sáng, nền `#ffffff`:

```
### A. Màu trạng thái PA-A — 4 mức có thứ tự (Đạt, Khá, Cần cải thiện, Chưa đạt)
  [PASS] Lightness band         all 4 inside L 0.43–0.77
  [PASS] Chroma floor           all 4 >= 0.1
  [PASS] CVD separation         worst adjacent #ec835a↔#6da7ec ΔE 20.5 (protan) · tritan 20.9
  [PASS] Normal-vision floor    worst adjacent #b02a2a↔#ec835a ΔE 22.3 (normal)
  [WARN] Contrast vs surface    below 3:1 — relief required (visible labels or table view): [["#6da7ec",2.5],["#ec835a",2.64]]

  → ALL CHECKS PASS  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)

### B. PA-A + GAP — 5 màu đổ (GAP là xám trung tính có chủ đích: 'chroma floor' không áp dụng cho nghĩa 'không có số')
  [PASS] Lightness band         all 5 inside L 0.43–0.77
  [FAIL] Chroma floor           below floor (reads gray): [["#8996ab",0.035]]
  [PASS] CVD separation         worst adjacent #8996ab↔#b02a2a ΔE 19.5 (deutan) · tritan 20.9
  [PASS] Normal-vision floor    worst adjacent #b02a2a↔#ec835a ΔE 22.3 (normal)
  [WARN] Contrast vs surface    below 3:1 — relief required (visible labels or table view): [["#6da7ec",2.5],["#ec835a",2.64],["#8996ab",2.99]]

  → FAILED — fix the marked checks  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)

### C. Chuỗi danh mục (series-1..4)
  [PASS] Lightness band         all 4 inside L 0.43–0.77
  [PASS] Chroma floor           all 4 >= 0.1
  [PASS] CVD separation         worst adjacent #1baf7a↔#eb6834 ΔE 9.2 (deutan) · tritan 18.0
  [PASS] Normal-vision floor    worst adjacent #1baf7a↔#eb6834 ΔE 27.6 (normal)
  [WARN] Contrast vs surface    below 3:1 — relief required (visible labels or table view): [["#1baf7a",2.82]]

  → ALL CHECKS PASS  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)

### D. Chuỗi xu hướng: xanh thương hiệu + xám trung tính (series-neutral = line-strong)
  [PASS] Lightness band         all 2 inside L 0.43–0.77
  [FAIL] Chroma floor           below floor (reads gray): [["#7d8aa0",0.036]]
  [PASS] CVD separation         worst adjacent #7d8aa0↔#005993 ΔE 17.2 (protan) · tritan 16.8
  [PASS] Normal-vision floor    worst adjacent #7d8aa0↔#005993 ΔE 19.8 (normal)
  [PASS] Contrast vs surface    all 2 >= 3:1

  → FAILED — fix the marked checks  (CVD in the 6–8 floor band is legal ONLY with secondary encoding: direct labels, gaps, or texture)
```

Diễn giải:
- **A (4 mức PA-A)**: đạt toàn bộ kiểm tra cứng. Cảnh báo tương phản < 3:1 của `#6da7ec` (Khá) và `#ec835a` (CCT) được xử lý bằng **nhãn chữ + biểu tượng khác hình** trên mọi chip, ô, hàng (đã kiểm chứng bằng test trình duyệt).
- **B (thêm GAP)**: “Chroma floor” báo `#8996ab` “đọc như màu xám” — **đúng chủ đích** (GAP = không có số, phải trung tính); GAP còn được tách khỏi các mức khác bằng biểu tượng vòng nét đứt, viền nét đứt trên thanh, và chữ “GAP”. Mọi kiểm tra còn lại đạt.
- **C (series-1..4)**: đạt; chỉ dùng tối đa 4 chuỗi.
- **D (xu hướng)**: lần đầu dùng xám `#5a6881` cạnh xanh thương hiệu cho ΔE 10,0 (< 15, **không đạt**); đã đổi sang `series-neutral = #7d8aa0` → ΔE 19,8, CVD 17,2, tương phản 3,1:1 (đạt). “Chroma floor” của xám là chủ đích (dạng nhấn một màu + xám).

Thang heatmap cầu vồng cũ (D6) không còn dùng; ma trận trạng thái mới dùng 4 mức rời + biểu tượng + số.

## 3. Tương phản WCAG đã tính

Tính bằng công thức WCAG 2.x trên giá trị token (`tools/build-tokens.mjs`; build **dừng** nếu có cặp chữ < 4,5:1).


### Chữ trên nền (cần ≥ 4,5:1)

| Màu trước | Màu nền | Tỷ lệ | Đạt |
|---|---|---|---|
| `ink` #15233b | `surface-page` #f4f6fa | 14,53:1 | ✓ |
| `ink-2` #4a5a72 | `surface-page` #f4f6fa | 6,48:1 | ✓ |
| `ink-muted` #5a6881 | `surface-page` #f4f6fa | 5,2:1 | ✓ |
| `ink` #15233b | `surface-card` #ffffff | 15,73:1 | ✓ |
| `ink-2` #4a5a72 | `surface-card` #ffffff | 7,01:1 | ✓ |
| `ink-muted` #5a6881 | `surface-card` #ffffff | 5,63:1 | ✓ |
| `ink` #15233b | `surface-sunken` #eaeff6 | 13,61:1 | ✓ |
| `ink-2` #4a5a72 | `surface-sunken` #eaeff6 | 6,07:1 | ✓ |
| `ink-muted` #5a6881 | `surface-sunken` #eaeff6 | 4,87:1 | ✓ |
| `on-brand` #ffffff | `brand-blue` #005993 | 7,37:1 | ✓ |
| `on-brand` #ffffff | `brand-blue-dark` #004573 | 10,01:1 | ✓ |
| `brand-blue` #005993 | `surface-card` #ffffff | 7,37:1 | ✓ |
| `brand-blue` #005993 | `surface-page` #f4f6fa | 6,81:1 | ✓ |
| `brand-blue` #005993 | `brand-blue-tint` #e6f1f8 | 6,42:1 | ✓ |
| `ink` #15233b | `brand-blue-tint` #e6f1f8 | 13,7:1 | ✓ |
| `brand-red` #d71249 | `surface-card` #ffffff | 5,16:1 | ✓ |
| `delta-up` #1c5cab | `surface-card` #ffffff | 6,63:1 | ✓ |
| `delta-down` #b02a2a | `surface-card` #ffffff | 6,54:1 | ✓ |
| `tier-dat-ink` #1c5cab | `tier-dat-tint` #e4ebf5 | 5,52:1 | ✓ |
| `tier-dat-ink` #1c5cab | `surface-card` #ffffff | 6,63:1 | ✓ |
| `tier-dat-ink` #1c5cab | `surface-page` #f4f6fa | 6,13:1 | ✓ |
| `on-tier-dat` #ffffff | `tier-dat` #1c5cab | 6,63:1 | ✓ |
| `tier-kha-ink` #1b6dce | `tier-kha-tint` #edf4fd | 4,6:1 | ✓ |
| `tier-kha-ink` #1b6dce | `surface-card` #ffffff | 5,09:1 | ✓ |
| `tier-kha-ink` #1b6dce | `surface-page` #f4f6fa | 4,7:1 | ✓ |
| `on-tier-kha` #15233b | `tier-kha` #6da7ec | 6,28:1 | ✓ |
| `tier-cct-ink` #c04616 | `tier-cct-tint` #fdf0eb | 4,56:1 | ✓ |
| `tier-cct-ink` #c04616 | `surface-card` #ffffff | 5,09:1 | ✓ |
| `tier-cct-ink` #c04616 | `surface-page` #f4f6fa | 4,7:1 | ✓ |
| `on-tier-cct` #15233b | `tier-cct` #ec835a | 5,96:1 | ✓ |
| `tier-chua-ink` #b02a2a | `tier-chua-tint` #f6e5e5 | 5,38:1 | ✓ |
| `tier-chua-ink` #b02a2a | `surface-card` #ffffff | 6,54:1 | ✓ |
| `tier-chua-ink` #b02a2a | `surface-page` #f4f6fa | 6,05:1 | ✓ |
| `on-tier-chua` #ffffff | `tier-chua` #b02a2a | 6,54:1 | ✓ |
| `tier-gap-ink` #606f87 | `tier-gap-tint` #f1f2f5 | 4,55:1 | ✓ |
| `tier-gap-ink` #606f87 | `surface-card` #ffffff | 5,1:1 | ✓ |
| `tier-gap-ink` #606f87 | `surface-page` #f4f6fa | 4,71:1 | ✓ |
| `on-tier-gap` #15233b | `tier-gap` #8996ab | 5,25:1 | ✓ |

### Viền, vòng focus, đường (cần ≥ 3:1)

| Màu trước | Màu nền | Tỷ lệ | Đạt |
|---|---|---|---|
| `focus-ring` #005993 | `surface-card` #ffffff | 7,37:1 | ✓ |
| `focus-ring` #005993 | `surface-page` #f4f6fa | 6,81:1 | ✓ |
| `line-strong` #8693a9 | `surface-card` #ffffff | 3,11:1 | ✓ |
| `forecast` #005993 | `surface-card` #ffffff | 7,37:1 | ✓ |
| `series-neutral` #8693a9 | `surface-card` #ffffff | 3,11:1 | ✓ |

### Màu đổ của thanh/ô (cần nhãn + biểu tượng nếu < 3:1)

| Màu trước | Màu nền | Tỷ lệ | Đạt |
|---|---|---|---|
| `tier-dat` #1c5cab | `surface-card` #ffffff | 6,63:1 | ✓ |
| `tier-kha` #6da7ec | `surface-card` #ffffff | 2,5:1 | cần nhãn |
| `tier-cct` #ec835a | `surface-card` #ffffff | 2,64:1 | cần nhãn |
| `tier-chua` #b02a2a | `surface-card` #ffffff | 6,54:1 | ✓ |
| `tier-gap` #8996ab | `surface-card` #ffffff | 2,99:1 | cần nhãn |
| `series-1` #005993 | `surface-card` #ffffff | 7,37:1 | ✓ |
| `series-2` #eb6834 | `surface-card` #ffffff | 3,2:1 | ✓ |
| `series-3` #1baf7a | `surface-card` #ffffff | 2,82:1 | cần nhãn |
| `series-4` #6250d6 | `surface-card` #ffffff | 5,77:1 | ✓ |

## 4. Test D7 (xem chi tiết ở `reports/D7_BAO_CAO.md` và `reports/test-d7.txt`)

Kết quả test D7 + phân loại: 25 đạt, 0 lỗi. Gồm biên bằng / cao hơn / thấp hơn ngưỡng, giá trị mặc định 90, so sánh với quy tắc `>= 90` cũ ở mọi kỳ, đổi ngưỡng không làm đổi điểm/hạng, và phân loại mức tại các biên.

## 5. Kiểm thử trên trình duyệt

| Nhóm | Số kiểm tra | Đạt |
|---|---|---|
| Kích thước | 24 | 24 |
| Console | 12 | 12 |
| Trình chiếu | 32 | 32 |
| Tương tác | 11 | 11 |
| D8 | 2 | 2 |
| Truy cập | 5 | 5 |
| Màu | 3 | 3 |
| Thiết kế | 4 | 4 |
| Typography | 2 | 2 |
| Bàn phím | 4 | 4 |
| D7 | 1 | 1 |
| In ấn | 1 | 1 |

Chi tiết từng kiểm tra: `reports/browser-test.md`. Không có mục nào không đạt.

Phạm vi kiểm thử: 6 kích thước cửa sổ (1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 390×844) × 2 màn hình; trình chiếu 16:9 ở 1920×1080, 1440×900, 1280×720, 1000×700; chuyển màn hình, chọn kỳ, lọc khối, drill-down đơn vị → chỉ tiêu, trình chiếu (nút, Esc, phím mũi tên); bàn phím (Tab, vòng focus, Enter); bảng thay thế; đường dự kiến; nhất quán màu; không gradient/3D/animation; in A4 ngang.

## 6. Ảnh chụp giao diện

| Tệp | Kích thước |
|---|---|
| `screenshots/chi-tiet-don-vi_1440x900.png` | 1440×900 |
| `screenshots/dieu-hanh-bgd_1440x900.png` | 1440×900 |
| `screenshots/dieu-hanh-bgd_1440x900_toan-trang.png` | 1440×3402 |
| `screenshots/responsive_dieu-hanh_390x844.png` | 390×844 |
| `screenshots/responsive_tong-quan_768x1024.png` | 768×1024 |
| `screenshots/tong-quan_1440x900.png` | 1440×900 |
| `screenshots/tong-quan_1440x900_toan-trang.png` | 1440×3680 |
| `screenshots/tong-quan_1920x1080.png` | 1920×1080 |
| `screenshots/trinh-chieu_dieu-hanh-bgd_1920x1080.png` | 1920×1080 |
| `screenshots/trinh-chieu_tong-quan_1920x1080.png` | 1920×1080 |

Ảnh các thành phần Design System: `screenshots/design-system/*.png`.

## 7. Cảnh báo của skill claude-dashboard (có chủ đích)

1. *“only the light set is used … Fill both sets”* — theo **D5** không làm chế độ tối ở V1; người đọc dùng giao diện tối của hệ điều hành sẽ thấy màu mặc định của dashboard bao quanh trang, còn nội dung trang vẫn dùng bảng màu sáng riêng.
2. *“uses innerHTML”* — mọi giá trị từ dữ liệu đều đi qua hàm `esc()` (escape HTML) trước khi chèn.

## 8. Vấn đề còn tồn tại và giới hạn

Xem mục “Vấn đề còn tồn tại” trong `README.md` (đồng bộ với báo cáo này).
