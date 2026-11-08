# BÁO CÁO NÂNG CẤP MA TRẬN CHỈ TIÊU KPI — GIAO DIỆN MỚI

Phạm vi: chỉ màn **Ma trận chỉ tiêu** của giao diện mới (và tab của nó trong Presentation Mode). Giao diện cũ, công thức, trọng số, ngưỡng, quy tắc GAP và xếp hạng **không bị sửa**. Mọi kiểm thử chạy trên dữ liệu MẪU (hồ sơ trình duyệt sạch); không đọc/ghi `Data/`.

## 1. File đã sửa / thêm

| File | Thay đổi |
|---|---|
| `App/ui-moi/moi-data.js` | Thêm `MOI_DATA.maTran()` — hàm thuần chỉ chọn/lọc/đếm ô đã có của engine (không tính lại điểm, %HT, hạng, mức) |
| `App/ui-moi/moi-views2.js` | Viết lại màn `ma-tran`: ô KPI, chip lọc + bộ đếm, bộ lọc khối/đơn vị/nhóm, sắp xếp cột, "cần chú ý", 5 chế độ, bàn phím |
| `App/ui-moi/moi-matrix.css` (mới) + `moi.css` | Bảng màu 5 trạng thái, lọc/làm mờ, bố cục, cột Toàn chi nhánh, trình chiếu; mọi quy tắc nằm dưới `.moi-mx` |
| `App/ui-moi/moi-shell.js` | Thêm tab **Ma trận chỉ tiêu** vào Presentation Mode; mũi tên không đổi màn khi đang ở ô ma trận |
| `tests/test-moi-data.js` | +8 kiểm tra (60 tổ hợp kỳ × bộ lọc) |
| `tests/browser-ma-tran.mjs`, `tests/screenshots-ma-tran.mjs` (mới) | 69 kiểm thử trình duyệt; chụp ảnh |
| `tests/screenshots-dual-ui.mjs`, `tests/CHAY_TEST.txt`, `DESIGN_SYSTEM.md`, `TEST_REPORT.md` | Cập nhật danh sách tài nguyên / hướng dẫn / tài liệu |
| `docs/screenshots/ma-tran/` | 26 ảnh |

Không sửa bất kỳ file nào trong `App/js/` (giao diện cũ và engine).

## 2. Chức năng đã bổ sung

1. **Bảng màu 5 trạng thái** đúng đề xuất (nền/chữ), kèm biểu tượng khác hình: Đạt = Circle Check đặc, Khá = Circle Check rỗng, CCT = Triangle Alert, Chưa đạt = Circle X, GAP = Circle Minus nét đứt. Không gradient. Chi tiết tương phản ở `DESIGN_SYSTEM.md` mục 7.
2. **Ô KPI**: nền + biểu tượng + số (đậm), căn giữa, hover viền nhẹ, focus viền 3px, tooltip (đơn vị · chỉ tiêu · KH · TH · % · mức), click/Enter mở thẻ điểm đơn vị (`#/phong/<mã>`, cột Toàn chi nhánh mở `#/phong/CN`). Phím mũi tên di chuyển giữa các ô (chỉ một ô nằm trong thứ tự Tab).
3. **Lọc nhanh theo trạng thái** (Tất cả / Đạt / Khá / Cần cải thiện / Chưa đạt / GAP): chip có màu + biểu tượng + số đếm + tooltip ngưỡng (lấy từ cấu hình). Ô không khớp được làm mờ (nền trung tính, chữ vẫn ≥ 4,5:1); ô khớp có viền nổi; **không vẽ lại bảng** — chỉ đổi một thuộc tính, vị trí/cột/số liệu/hạng giữ nguyên. Có vùng `aria-live` đọc số ô đang nổi bật.
4. **Bộ đếm động** tính từ dữ liệu đang hiển thị sau khi áp bộ lọc khác (kỳ, khối, đơn vị, nhóm), không hardcode; cùng **tỷ lệ Chưa đạt** = Chưa đạt ÷ (Đạt+Khá+CCT+Chưa đạt).
5. **Lọc khối / Phòng-PGD / nhóm chỉ tiêu** (dùng giá trị có thật trong dữ liệu), kết hợp được, dòng "Đang áp dụng: …", nút **Xóa bộ lọc**. Trạng thái lọc được giữ khi đổi chế độ hiển thị.
6. **Phát hiện KPI yếu**: huy hiệu ✕n ▲n dưới tên từng đơn vị; danh sách "Đơn vị có nhiều KPI yếu" và "Chỉ tiêu có nhiều đơn vị yếu" (top 5, bấm để mở thẻ điểm / phân tích chỉ tiêu); tùy chọn **Sắp xếp cột: Nhiều KPI yếu nhất trước** (chỉ đổi thứ tự hiển thị, "Hạng n" chính thức giữ nguyên). Đây là số đếm tham khảo, ghi rõ trên giao diện, không phải điểm KPI và không có điểm xếp hạng mới.
7. **5 chế độ hiển thị**: % hoàn thành KH, % KH năm, Điểm đạt (màu/biểu tượng = mức trạng thái, có bộ lọc); **Thứ hạng** (hạng/n, thang một tông tím, hạng 1 có viền) và **Điểm bị mất** (−n / ✓, thang một tông tím theo độ lớn, thêm dòng "Tổng điểm mất") không dùng màu trạng thái nên **không hiển thị bộ lọc trạng thái**.
8. **Bố cục**: tiêu đề cột và cột chỉ tiêu cố định khi cuộn; chân bảng "Điểm quy đổi" cố định; cột **Toàn chi nhánh** có khung xanh + nhãn "Tổng hợp toàn CN" và không bị tính vào bộ đếm; ô "không áp dụng" ("·", không nền) phân biệt với GAP (nền xám + biểu tượng + chữ "GAP").
9. **Presentation Mode**: thêm tab "Ma trận chỉ tiêu" (1920×1080, vừa khung không cuộn, đủ mọi dòng); chip lọc cao ≥ 46px, thao tác được; ô Chưa đạt/CCT viền đậm; bấm ô thoát trình chiếu và mở thẻ điểm.

## 3. Kết quả kiểm thử

| Bộ test | Kết quả |
|---|---|
| 14 bộ Node (12 sẵn có + `test-nguong` + `test-moi-data`) | **Tất cả đạt** (`test-baocao2`, `test-office` chạy với thư mục `App` theo `CHAY_TEST.txt`) |
| `test-moi-data.js` — phần Ma trận | 8/8 đạt: 60 tổ hợp kỳ × (khối, nhóm, đơn vị, sắp xếp) khớp đếm độc lập từ thẻ điểm engine; hạng chính thức không đổi |
| `browser-ma-tran.mjs` | **69/69 đạt** (20 mục của yêu cầu XII đều có kiểm thử) |
| `browser-dual-ui.mjs` (hồi quy Dual UI) | **65/65 đạt** |

Điểm đáng chú ý trong test trình duyệt: bộ đếm = số ô thực trong DOM = đếm độc lập bằng engine ở từng bộ lọc; đổi sang T5 bộ đếm đổi và vẫn khớp; số trong mọi ô của 5 chế độ = giá trị engine; điểm/hạng/số chỉ tiêu của mọi đơn vị **giống hệt** trước và sau toàn bộ thao tác; màn Xếp hạng giữ nguyên màu chip cũ; Legacy UI không có lớp `moi-*`/`vtb-*`.

Hiệu năng (Edge headless, 160 ô, trung vị): vẽ lại cả màn ≈ 44 ms; đổi bộ lọc trạng thái ≈ 33 ms (≈ 2 khung hình, không vẽ lại bảng).

Trong quá trình làm, test phát hiện và đã sửa: màu chữ chip lọc chưa trùng màu ô; nút "Xóa bộ lọc" ẩn bị chọn nhầm; bảng bắt đầu quá thấp ở 1366×768 (đã gọn đầu trang); biểu tượng ở chân bảng "Điểm quy đổi" bị mất (màu không được đứng một mình).

## 4. Quyết định cần lưu ý (không tự suy diễn nghiệp vụ)

1. **GAP**: engine gộp "Thiếu dữ liệu", "Không áp dụng", "Thiếu cấu hình" vào một nhóm (logic hiện hành, `MOI_DATA.tierTT`). Giữ nguyên; tooltip hiện chuỗi trạng thái gốc của engine. Ô "·" là đơn vị không có chỉ tiêu đó, không phải GAP.
2. **Chữ GAP** đậm hơn đề xuất (`#5B6B80` thay `#64748B`) vì đề xuất chỉ đạt 4,05:1 < 4,5:1 (WCAG AA). Nền giữ nguyên.
3. **Đạt/Khá**: hai nền gần nhau (1,10:1) theo đề xuất, nên khác biệt được củng cố bằng biểu tượng đặc/rỗng, màu chữ, viền.
4. **Phạm vi bộ đếm**: đếm mọi ô đơn vị đang hiển thị, **gồm cả chỉ tiêu quản trị (không tính điểm)**, **không gồm** cột Toàn chi nhánh và ô "không áp dụng". Vì vậy có thể lệch với số đếm ở màn Tổng quan (chỉ chỉ tiêu có điểm).
5. **Mẫu số tỷ lệ Chưa đạt** không gồm GAP (GAP chưa có số để xếp mức).
6. **% KH năm**: hệ thống không có ngưỡng riêng; màu/biểu tượng giữ theo mức hoàn thành KH lũy kế (logic hiện hành) và có ghi chú trên màn hình.
7. **Chế độ Thứ hạng**: ô cột Toàn chi nhánh nay hiện "–" (trước đây hiện % hoàn thành, gây hiểu nhầm trong chế độ hạng).
8. Chọn thang **tím** (một tông) cho Thứ hạng/Điểm bị mất để không trùng với màu trạng thái xanh/cam/đỏ.

## 5. Vấn đề còn tồn tại / chưa kiểm thử

- Chưa chạy trên dữ liệu thật (không được phép) và chưa thử với số đơn vị/chỉ tiêu lớn hơn mẫu (8 đơn vị × ~20 chỉ tiêu); phần vẽ là O(số ô), bộ lọc là một thay đổi thuộc tính.
- Chưa thử Firefox/Safari, màn cảm ứng, TV/máy chiếu thật, trình đọc màn hình; tiếp cận mới kiểm tra tự động (aria, focus, tương phản).
- **In A4**: có quy tắc ẩn thanh điều khiển khi in nhưng chưa kiểm thử in thật.
- Trong Presentation Mode, khung "Đơn vị và chỉ tiêu cần chú ý" bị ẩn để bảng vừa khung (huy hiệu KPI yếu dưới tên đơn vị vẫn có); dòng chú giải/aria-live cũng ẩn ở chế độ này.
- Smoke PowerShell sẵn có (`smoke-man-hinh.ps1`, `smoke-bang.ps1`) vẫn không chạy trọn trong môi trường này, kể cả trên bản gốc — không liên quan thay đổi này (xem `TEST_REPORT.md`).
- Trường hợp bộ lọc làm bảng không còn ô nào: mã có hiển thị thông báo "Không có chỉ tiêu phù hợp" kèm nút Xóa bộ lọc, nhưng chưa có test tự động và chưa chụp ảnh cho trường hợp này.

## 6. Ảnh bàn giao (`docs/screenshots/ma-tran/`)

`01_tat-ca_*` (1366×768, 1440×900, 1920×1080; `01b` toàn trang) · `02_loc-chua-dat_*` · `03_loc-can-cai-thien_*` · `04_loc-dat` · `05_loc-gap` · `06`–`09` bốn chế độ còn lại · `10_ket-hop-loc-khoi-sap-xep-cct` · `11_hover-tooltip` · `12_focus-ban-phim` · `20`–`22_presentation_*` (tất cả / Chưa đạt / Cần cải thiện, ở 1440×900 và 1920×1080).
