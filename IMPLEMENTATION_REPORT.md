# BÁO CÁO TRIỂN KHAI — HEATMAP LIÊN TỤC + NHẬN DIỆN THƯƠNG HIỆU VIETINBANK (NEW UI)

Phạm vi: giao diện mới (`App/ui-moi/`). Không sửa `App/js/` (Legacy + engine), công thức, trọng số, ngưỡng, xếp hạng, GAP, dữ liệu. Kiểm thử trên dữ liệu MẪU; không đọc `Data/`.

## 1. File đã sửa / thêm
| File | Thay đổi |
|---|---|
| `App/ui-moi/moi-tokens.css` | `#005993`→`#00538E`; thêm `--brand-red-dark`, `--brand-sky(-tint)`, `--series-sky/accent`; bí danh token chuẩn hóa (nền/chữ/viền/tương tác/ngữ nghĩa) |
| `App/ui-moi/moi-brand.css` (mới, nạp cuối) | Header, Sidebar, nút, focus, tiêu đề thẻ, thẻ KPI, màu liên kết — chỉ dùng token |
| `App/ui-moi/moi-layout.css` | Bí danh `--primary/--accent` dùng token thay vì mã cứng |
| `App/ui-moi/moi-views2.js`, `moi-matrix.css` | Heatmap liên tục (`heatColor`), chú giải liên tục, chip theo thang, lưới liền ô không bo góc |
| `tests/browser-brand.mjs` (mới), `browser-ma-tran.mjs`, `browser-dual-ui.mjs` | Test thương hiệu; cập nhật test màu cho Heatmap |
| `DESIGN_SYSTEM.md` (mục 8), `TEST_REPORT.md` (mục 10), `SKILLS_AND_AGENTS_REPORT.md`, `docs/screenshots/**` | Tài liệu và ảnh |

## 2. Mã màu thay đổi
`#005993`→`#00538E` (Brand Primary, `--brand-blue`, `--series-1`, `--primary`); `#004573`→`#003E6C` (hover); `#E6F1F8`→`#E4EFF7` (nền chọn). `#D71249` giữ nguyên nhưng nay chỉ dùng cho nhấn. Thêm `#80D1F2`. Màu trạng thái KPI (`--tier-*`) **không đổi**.

## 3. Màn hình / component đã cập nhật
Mọi màn hình trong thanh điều hướng NEW UI nhận cùng khung (Header, Sidebar, token); kiểm tra tự động trên mọi mục điều hướng. Component: nút chính/nhấn/phụ/disabled, pill/segmented, select, focus ring (xanh da trời + viền xanh), liên kết, thẻ, thẻ KPI, Heatmap, chip lọc.

## 4. Quyết định cần lưu ý
1. Header giữ nền trắng (chứa nhiều điều khiển), nhận diện bằng dải xanh 4px phía trên, tiêu đề xanh và vệt đỏ nhỏ — không tô cả header xanh đậm để tránh phải làm lại toàn bộ điều khiển bên trong.
2. Màu Đạt (`--tier-dat` ≈ `#1C5CAB`) tiếp tục là xanh dương nghiệp vụ, gần màu thương hiệu; phân biệt bằng chữ/biểu tượng "Đạt". Nếu muốn tách hẳn có thể đổi sang xanh lá — cần chủ dự án quyết định, chưa tự đổi vì ảnh hưởng nhiều màn.
3. Chuỗi phụ trong biểu đồ hiện dùng xám trung tính (dữ liệu nền); `#80D1F2` có sẵn token `--series-sky` cho chuỗi phụ cần nhấn nhưng chưa có biểu đồ nào đổi sang vì đường mảnh xanh nhạt có tương phản < 3:1 trên nền trắng.
4. Tuyến "Không có dữ liệu" của Heatmap = GAP của engine (gộp Thiếu dữ liệu/Không áp dụng/Thiếu cấu hình) — giữ nguyên logic, chưa tách trạng thái riêng.
5. Chiều đánh giá ngược (nợ xấu) dựa hoàn toàn vào `%HT` của engine (đã tính KH/TH); không có ngưỡng tối ưu hai phía trong hệ thống nên không áp dụng.

## 5. Còn tồn tại
Chưa có ảnh riêng cho modal/drawer/thông báo; chưa kiểm dữ liệu thật, Firefox/Safari, in A4; Presentation Mode vẫn dùng khung riêng (đã kế thừa token nên đổi màu theo, đã chụp ảnh).
