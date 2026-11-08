# HEATMAP TEST REPORT

Chạy trên ứng dụng thật bằng Edge headless (CDP), hồ sơ trình duyệt sạch với dữ liệu mẫu. Không đọc hoặc ghi dữ liệu vận hành. Ngày chạy: 08/11/2026.

## Kết quả

| Bộ kiểm thử | Kết quả |
|---|---|
| `node tests/browser-heatmap.mjs` (mới, mục XII) | **38/38 đạt** |
| `node tests/browser-ma-tran.mjs` | **75/75 đạt** |
| `node tests/browser-brand.mjs` | **20/20 đạt** |
| `node tests/browser-dual-ui.mjs` (gồm Legacy, cách ly CSS, 22 màn ở cả hai giao diện) | **65/65 đạt** |
| `test-moi-data`, `test-nguong`, `test-bgd`, `test-khoa`, `test-phantich`, `test-dongbo`, `test-icons`, `test-baocao`, `test-baocao2`, `test-so-ngay`, `test-nen`, `test-genie` | **TẤT CẢ ĐẠT** |
| `test-saoluu` | Không chạy được: `MODULE_NOT_FOUND` (thiếu module trong môi trường). Không liên quan đến thay đổi này. |

## Đối chiếu mục XII

| # | Nội dung | Bằng chứng (browser-heatmap) |
|---|---|---|
| 1 | Heatmap trên toàn bộ màn hình | Thang 10 điểm; ≥ 60 sắc độ cho %HT 30–160%; Ma trận ≥ 25 màu khác nhau; Xếp hạng, Thẻ điểm phòng, Điều hành, Theo dõi chỉ tiêu đều có phần tử Heatmap; không dùng màu thương hiệu |
| 2 | Chiều tăng | `E.computeKpi` cao_tot với TH 60 → 125 / KH 100: vị trí tăng đơn điệu |
| 3 | Chiều giảm | `E.computeKpi` thap_tot, KH 1,5%: TH 3% (Chưa đạt, đỏ) → 1,8% → 1,5% → 1,0% (Đạt, xanh); danh mục mẫu có chỉ tiêu thap_tot |
| 4 | Khoảng mục tiêu | Danh mục chỉ có `cao_tot`, `thap_tot`, `nhap_ty_le`; không suy diễn |
| 5 | GAP | Ô GAP không tô Heatmap, nền xám, có chữ "GAP" |
| 6 | Không có dữ liệu | "·" khác GAP; thiếu số không bị tính là Chưa đạt |
| 7 | Bộ lọc | Lọc CCT: ô thuộc mức giữ màu Heatmap, ô khác làm mờ, không xóa hàng |
| 8 | Bộ đếm | Số trên chip = số ô theo trạng thái engine |
| 9 | Legend | Mốc = ngưỡng cấu hình; có trên Ma trận, Tổng quan (xếp hạng và chỉ tiêu), Thẻ điểm phòng |
| 10 | Tooltip | KH, TH, %HT, trạng thái |
| 11 | Click | Ô Heatmap mở thẻ điểm đơn vị |
| 12 | Chế độ | %HT, %KH năm, Điểm đạt dùng Heatmap; Thứ hạng và Điểm bị mất dùng thang riêng |
| 13 | Responsive | 1920×1080, 1440×900, 1366×768: không tràn ngang, chú giải nằm trong khung |
| 14 | Presentation | Ma trận trình chiếu có Heatmap và chú giải, vừa khung ở cả 3 kích thước; màn trình chiếu khác có thẻ/thanh Heatmap |
| 15 | Legacy | Thoát về giao diện cũ: `UI.htColor(1.0)` trả lại `#52c41a`, không còn phần tử Heatmap mới; `browser-dual-ui` A/B đạt |
| 16 | KPI trước/sau | Điểm, %HT, hạng, số chỉ tiêu theo mức của mọi đơn vị giống hệt trước khi vẽ |
| — | Nhất quán | Thẻ KPI NII (Tổng quan) = ô NII · Toàn CN (Ma trận); thanh xếp hạng P.KHCN = ô Điểm quy đổi P.KHCN |
| — | Tương phản | Mọi điểm thang ≥ 4,75:1; mọi ô Heatmap của Ma trận ≥ 4,5:1. Ngoại lệ GAP 4,05:1 (mã quy định) |

## Kiểm tra bằng mắt

So sánh ảnh `docs/screenshots/trang-thai/truoc` và `sau`:

- Tổng quan: chip "Khá" đổi từ xanh dương sang vàng; thẻ KPI có vạch Heatmap; thanh xếp hạng chuyển sắc.
- Ma trận: đổi sang thang mới.
- Thẻ điểm phòng: tỷ lệ nợ xấu 149% (thấp là tốt) hiện xanh đậm.

Kết quả JSON: `tests/out/heatmap-results.json`, `ma-tran-results.json`, `brand-results.json`, `dual-ui-results.json`.
