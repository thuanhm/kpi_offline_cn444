# TEST REPORT — Dual UI và D7

Môi trường: Windows 10, Node 24, Microsoft Edge (headless, điều khiển bằng Chrome DevTools Protocol — không cài thêm thư viện). Mọi kiểm thử trình duyệt chạy trên `App/index.html` (file://) với **hồ sơ trình duyệt tạm, sạch** ⇒ ứng dụng dùng **dữ liệu MẪU (DEMO)**; không đọc/ghi `Data/` hay dữ liệu vận hành.

## 1. Tổng hợp

| Bộ test | Kết quả |
|---|---|
| 12 bộ Node **sẵn có** (`test-nen, genie, bgd, khoa, phantich, dongbo, saoluu, icons, baocao, baocao2, so-ngay, office`) | **Tất cả đạt**, chạy trước và sau thay đổi |
| `test-nguong.js` (mới — D7) | **25/25 đạt** |
| `test-moi-data.js` (mới — số liệu giao diện mới = engine) | **13/13 đạt** (10 kỳ) |
| `browser-dual-ui.mjs` (mới — nghiệm thu trên ứng dụng thật) | **65/65 đạt** |
| `smoke-man-hinh.ps1`, `smoke-bang.ps1` (sẵn có) | **Không chạy trọn được trong môi trường này** — xem mục 6 |

## 2. Kiểm thử Dual UI (đúng 10 bước của yêu cầu 15.3)

| # | Bước | Bằng chứng (trong `browser-dual-ui.mjs`) | Kết quả |
|---|---|---|---|
| 1 | Mở ứng dụng ở Legacy UI | Mặc định giao diện cũ, khung cũ nguyên vẹn, không lớp `moi-*`, không lỗi console | ✓ |
| 2 | Chuyển sang New UI | `body.ui-moi`, `.moi-page`, nút hiển thị đang ở “mới”, lưu `localStorage = moi` | ✓ |
| 3 | Chuyển lại Legacy UI | Khung cũ được khôi phục, không còn lớp `moi-*`, lưu `cu` | ✓ |
| 4 | Refresh | Vẫn đúng giao diện đã chọn (cả “mới” và “cũ”), dữ liệu mẫu còn nguyên | ✓ |
| 5 | Đóng và mở lại | Lựa chọn được ghi nhớ giữa các lần tải trang (hồ sơ trình duyệt giữ localStorage) | ✓ |
| 6 | Chọn kỳ rồi chuyển | Kỳ T6 giữ nguyên khi chuyển cũ→mới→cũ (topbar mới và cũ cùng hiển thị T6) | ✓ |
| 7 | Chọn đơn vị rồi chuyển | Đơn vị `PGD_DC` và chỉ tiêu `DU_NO_BQ` ở màn Phân tích được giữ | ✓ |
| 8 | Lọc nhiều điều kiện rồi chuyển | Nhóm đơn vị PGD + kỳ + màn hình + chỉ tiêu + đơn vị giữ nguyên hai chiều | ✓ |
| 9 | Đối chiếu KPI hai giao diện | Mục 3 | ✓ |
| 10 | Chuyển đổi liên tục | 20 lần: 0 lỗi console; số phần tử DOM không phình (sai khác < 5%) | ✓ |

Thêm: **cách ly CSS** (12 thuộc tính tính toán của giao diện cũ giống hệt trước/sau khi dùng giao diện mới; sự kiện cũ vẫn đúng sau khi quay lại) và **tự lùi an toàn** (mô phỏng sự cố ở giao diện mới → về giao diện cũ, vẫn làm việc được).

## 3. Đối chiếu nghiệp vụ trước/sau

**Mức Node (`test-moi-data.js`, 10 kỳ):** điểm KPI CN, chênh lệch so kỳ trước, số chỉ tiêu theo mức, xếp hạng (mã, hạng, hạng kỳ trước, điểm), từng chỉ tiêu (KH, TH, GAP, %HT, điểm, mất điểm), chuỗi 12 tháng, mức — đều **bằng nguyên** kết quả `STORE.model()`. Mã nguồn giao diện mới bị kiểm tra không chứa `computeKpi`, gán `quy_doi`, công thức `th/kh`, hằng số 90.

**Mức trình duyệt (T3, T6, T10):** điểm KPI chi nhánh cũ = mới (về giá trị; mới luôn hiện 1 chữ số thập phân, ví dụ cũ “98” · mới “98,0”); giá trị thực hiện của **mọi** thẻ KPI mới = số engine; “Đơn vị ≥ N điểm” giống nhau; thứ tự xếp hạng mới = `M.ranking` và = thứ tự bảng Tabulator cũ.

**D7:** với `nguong.diem_cao = 90` kết quả trùng quy tắc `>= 90` cũ ở 10/10 kỳ; điểm/hạng/mức không đổi khi chỉ đổi ngưỡng; đổi 85 → hai giao diện cùng “≥ 85 điểm” và cùng số đơn vị đúng theo engine.

Không có sai lệch nghiệp vụ nào cần giải thích.

## 4. Kết quả trình duyệt theo nhóm (65 kiểm tra)

| Nhóm | Số kiểm tra |
|---|---|
| A. Giao diện cũ (mở được **22/22** màn ở giao diện cũ, cả màn quản trị) | 6 |
| B. Chuyển đổi, cách ly CSS, an toàn, ổn định | 12 |
| C. Giữ trạng thái khi chuyển | 3 |
| D. Đối chiếu KPI cũ ↔ mới (3 kỳ) và D7 | 14 |
| E. D8, bảng thay thế, bộ lọc, drill-down, bàn phím, màu PA-A, D6, console | 12 |
| F. Mọi màn hình ở giao diện mới (**22/22**: 7 thiết kế lại + 15 màn cũ trong vỏ mới), D7 qua màn Cài đặt | 3 |
| G. Presentation Mode (1920×1080, 1440×900, 1366×768 × 2 màn; phím →, Esc, nút thoát) | 9 |
| H. Kích thước (1920×1080, 1440×900, 1366×768, 1024×768, 768×1024: 7 màn mới không tràn ngang/vỡ bố cục) | 5 |

Ảnh bàn giao: `docs/screenshots/` (28 ảnh): giao diện cũ, Tổng quan, Điều hành BGĐ, Phân tích chi tiết, Ma trận, Xếp hạng, Thẻ điểm đơn vị, màn cũ trong vỏ mới, Presentation Mode (2 màn) ở **1440×900 và 1920×1080**, và cận cảnh nút chuyển đổi ở cả hai giao diện.

## 5. Hiệu năng (`tests/out/perf.json`, Edge headless, trung vị)

| Chỉ số | Giá trị |
|---|---|
| Vẽ lại Tổng quan: cũ / mới | 35 ms / 42 ms |
| Vẽ lại Điều hành: cũ / mới | 33 ms / 37 ms |
| Lần chuyển sang giao diện mới đầu tiên (gồm nạp tài nguyên) | ≈ 70–90 ms |
| Các lần chuyển sau | ≈ 39 ms |
| Tài nguyên giao diện mới (nạp lười, chỉ khi chọn) | 150 KB |

Giao diện cũ không nạp thêm gì ngoài `ui-switch.js` (≈ 4 KB).

## 6. Smoke PowerShell sẵn có

`smoke-man-hinh.ps1` và `smoke-bang.ps1` đều in “THẤT BẠI (0 lỗi, chưa chạy hết)”. Để không dùng nhầm hồ sơ Edge của người dùng (nơi `file://` có thể giữ dữ liệu thật), mình chạy bản sao tạm có `--user-data-dir` sạch. **Chạy cùng kịch bản trên bản gốc (commit `main`) cho kết quả y hệt** ⇒ nguyên nhân là môi trường kiểm thử (kịch bản dựa vào `--virtual-time-budget` của Edge), **không phải do thay đổi này**. Không sửa, không vô hiệu hóa các tệp test. Ý đồ của chúng (duyệt mọi màn hình không có “Lỗi hiển thị”/lỗi JS; Tabulator) được kiểm tra lại bằng bộ trình duyệt mới: duyệt 22 màn × 2 giao diện, và so thứ tự bảng Tabulator với giao diện mới. Đề nghị chạy hai tệp này trên máy của chủ dự án trước khi phát hành.

## 7. Lỗi phát hiện trong quá trình làm và đã khắc phục

| Lỗi | Phát hiện bởi | Xử lý |
|---|---|---|
| Nút **Lưu cài đặt** ghi đè cả `nguong` → mất `diem_cao` sau mỗi lần lưu | Rà mã trước khi sửa D7 | Lưu kèm `diem_cao`; có test qua Cài đặt + refresh |
| Nút “Trình chiếu” ở thanh trên không phản hồi (xử lý sự kiện chỉ gắn vào vùng nội dung) | Chụp thử Presentation Mode | Gắn xử lý cho thanh trên |
| Thẻ KPI chật (chữ so sánh tràn, sparkline đè), nhãn ngưỡng đè nhãn DỰ KIẾN | Xem ảnh chụp | Delta gọn (kỳ so sánh vào tooltip), nhãn ngưỡng đặt bên trái |
| Tiêu đề nhóm chỉ tiêu bị lặp (chỉ tiêu quản trị xen kẽ) | Xem ảnh chụp | Gom theo nhóm thật, ghi chú “quản trị” ngay trên dòng |
| “Đơn vị cần chỉ đạo” liệt kê cả đơn vị đã Đạt (GAP −0,0) | Xem ảnh chụp trình chiếu | Chỉ liệt kê đơn vị dưới mức Đạt |
| Tên đơn vị bị cắt ở cột hẹp (trình chiếu) | Xem ảnh | Chỉnh độ rộng cột |

Lỗi nằm ở **bộ test** (không phải ứng dụng) và đã sửa test cho đúng ý, không nới tiêu chí: so số phần tử DOM giữa hai giao diện khác nhau; regex bắt nhầm chữ liền nhau; so “98” với “98,0” bằng chuỗi; kiểm màu PA-A bằng dữ liệu mẫu chỉ có mức Đạt/Khá (nay kiểm bằng mẫu đủ 5 mức); điểm xuất phát phím Tab.

## 8. Lỗi còn tồn tại / chưa kiểm thử

- Smoke PowerShell sẵn có chưa chạy trọn (mục 6).
- Chưa thử trên Firefox/Safari, màn hình cảm ứng, TV/máy chiếu thật, trình đọc màn hình (NVDA/JAWS); tiếp cận mới kiểm tra tự động.
- Chưa kiểm thử **in A4 ngang** của giao diện mới trong ứng dụng thật.
- Chưa chạy trên dữ liệu thật (không được phép) — cần nghiệm thu trên bản sao.
- 15 màn quản trị/nhập liệu trong vỏ mới chỉ được kiểm tra mở được, không lỗi và không tràn ngang; luồng nhập liệu của chúng không đổi so với giao diện cũ nhưng chưa được kiểm thử lại từng thao tác trong vỏ mới.
- Các chức năng xuất Excel/Word/PowerPoint dùng nguyên mã cũ; chỉ kiểm tra bằng 12 bộ Node sẵn có (không kiểm tra thao tác bấm nút xuất trong vỏ mới).
