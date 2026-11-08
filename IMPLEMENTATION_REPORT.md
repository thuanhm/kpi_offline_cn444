# IMPLEMENTATION REPORT — Dual UI (giao diện cũ + giao diện mới) và D7

**Nhánh làm việc:** `feature/dual-ui` (tách từ `main` tại `3ba6cf1`). **Chưa commit** — mọi thay đổi nằm trong cây làm việc để chủ dự án rà soát (xem mục 9 về rollback).
**Dữ liệu dùng khi phát triển/kiểm thử:** chỉ dữ liệu **mẫu** (DEMO) trong hồ sơ trình duyệt tạm. Không đọc, không ghi `Data/` hay dữ liệu vận hành.

## 1. Hiện trạng đã khảo sát

| Hạng mục | Hiện trạng (đã kiểm tra mã) | Vấn đề | Giải pháp đã làm |
|---|---|---|---|
| Kiến trúc | SPA thuần JS; `VIEWS[id]={html,mount}`; `render()` vẽ lại cả trang; dữ liệu `STORE → Model/engine` | Không có điểm cắm giao diện thứ hai | Điểm rẽ nhánh **một dòng** trong `render()` + nạp lười `ui-moi/` |
| Giao diện cũ | 22 màn, `app.css` một tệp, bảng màu 9 bậc cho heatmap | Hai thang ngưỡng song song; heatmap cầu vồng; màu trạng thái chưa nhất quán (xem DESIGN_AUDIT.md) | **Giữ nguyên** (theo D9); chỉ thêm nút chuyển đổi |
| Navigation | Sidebar 2 cấp + topbar chọn kỳ | — | New UI dùng cùng `APP.NAV` (cùng quyền quản trị) |
| Tổng quan | Hero + 20+ ô vuông + 2 biểu đồ Chart.js | Thứ tự thông tin; ring cho một số | Màn mới: hero, 8 thẻ KPI, xếp hạng đầy đủ, xu hướng + DỰ KIẾN, cảnh báo, drill-down |
| Điều hành BGĐ | Chỉ bảng + danh sách chữ, không biểu đồ, không bấm sâu | Khó trả lời nhanh 3 câu hỏi | Màn mới: 3 câu hỏi điều hành, 4 KPI chính, xếp hạng, mất điểm, nguy cơ, nhiệm vụ, tăng trưởng, ma trận |
| KPI Card / Biểu đồ / Bảng | Canvas Chart.js, bảng Tabulator | Không có bảng thay thế; thiếu nhãn trực tiếp | `vtb-*` SVG, nhãn trực tiếp, nút **Bảng** cho mọi biểu đồ |
| Bộ lọc / Xếp hạng | Khối (`A.khoi`), kỳ, đơn vị | — | Dùng **chung** `APP.ky/khoi/ct_dv/ct_rank/mt_mode` |
| Presentation Mode | Không có | — | Khung 16:9 (1920×1080), co giãn, Esc/←/→, nút thoát |
| Responsive / Hiệu năng | Cố định nhiều cột | — | Kiểm tra 5 kích thước; vẽ lại 33–46 ms |
| Khả năng truy cập | `<tr onclick>`, canvas không có mô tả | Không dùng bàn phím | Hàng/thẻ `role=button`, vòng focus, `aria-label`, bảng thay thế |
| Kiểm thử | 12 bộ Node + 2 smoke PowerShell | Smoke không chạy trọn trong môi trường này (cả trên bản gốc) | +2 bộ Node, +bộ 65 kiểm thử trình duyệt trên app thật |

Luồng dữ liệu (không đổi): `Data/KPI_CHI_NHANH.json` + localStorage → `store.js` → `Model` (`engine.js`, `phan-tich.js`, `bgd.js`) → view → DOM. Giao diện mới đọc **cùng `STORE.model()`**.

## 2. Kiến trúc Dual UI

```
index.html ── js/ui-switch.js (luôn nạp, 89 dòng: trạng thái + nút chuyển + nạp lười + lùi an toàn)
                │ chọn 'moi' → nạp ui-moi/{moi.css, vtb.js, moi-data.js, moi-views.js, moi-views2.js, moi-shell.js}
app.js render() ──┬─ giao diện cũ: renderSidebar/renderTopbar/VIEWS[…]   (KHÔNG đổi)
                  └─ giao diện mới: UI_MOI.render() → vỏ mới + màn mới / màn cũ trong vỏ mới
dùng chung: STORE, Model/engine, APP (kỳ, đơn vị, khối, màn hình), VIEWS cũ (soSanh, dsSoSanh, giaTri, goiY, quaHan)
```

- **Nút chuyển đổi** (`Giao diện cũ | Giao diện mới`, dạng segmented control, có biểu tượng) nằm ở header của **cả hai** giao diện.
- **Mặc định giao diện cũ**; lựa chọn lưu ở `localStorage['KPI_CN444.giao_dien']` (`cu`/`moi`, không chứa dữ liệu nghiệp vụ). Ứng dụng chưa có tài khoản theo người dùng ở phía máy chủ nên lưu theo trình duyệt/máy.
- **Giữ nguyên khung DOM cũ** (`#sidebar #topbar #view`): vào giao diện mới chỉ đổi tên lớp CSS (`sidebar→moi-side`…), thoát thì khôi phục — nên mọi màn cũ vẫn chạy được bên trong và CSS cũ không bao giờ áp lên khung mới.
- **Cách ly CSS**: lớp mới có tiền tố `moi-`/`vtb-`, token dưới `body.ui-moi`; CSS mới chỉ nạp khi chọn giao diện mới. Test xác nhận 12 thuộc tính tính toán của giao diện cũ giống hệt trước/sau khi dùng giao diện mới.
- **An toàn**: nạp lỗi → ở lại giao diện cũ; giao diện mới ném lỗi khi vẽ → tự quay về giao diện cũ (không ghi nhớ), dữ liệu không bị ảnh hưởng.

## 3. Màn hình của giao diện mới

| Màn | Trạng thái | Ghi chú |
|---|---|---|
| Tổng quan chi nhánh (`tong-quan`) | **Thiết kế lại** | Header (logo, kỳ, cập nhật, chuyển UI), hero điểm KPI, 8 thẻ KPI (GAP, %HT, thay đổi), phân bố mức, xếp hạng đầy đủ + lọc khối, xu hướng + DỰ KIẾN, cảnh báo, chi tiết chỉ tiêu theo CN/đơn vị (drill-down), so sánh KH/TH, tăng trưởng, nhận định |
| Điều hành BGĐ (`dieu-hanh`) | **Thiết kế lại** | 3 câu hỏi điều hành, 4 KPI chính, xếp hạng, chỉ tiêu mất điểm, đơn vị cần chỉ đạo, nguy cơ không đạt, nhiệm vụ (giao việc dùng hộp thoại sẵn có), tăng trưởng, ma trận trạng thái, trạng thái dữ liệu/khoá kỳ; **Presentation Mode** |
| Phân tích chi tiết (`chi-tieu`) | **Thiết kế lại** | Chọn chỉ tiêu/đơn vị/kỳ; KH–TH, tăng trưởng, so sánh kỳ (tháng trước, đầu năm, cùng kỳ) và xếp hạng đơn vị theo tiêu chí |
| Xếp hạng, Ma trận, Thẻ điểm đơn vị, Nội dung cần xử lý | **Thiết kế lại** | Ma trận trạng thái thay heatmap cầu vồng (D6) |
| 15 màn còn lại | **Bản cũ trong vỏ mới + bảng màu mới** | Thẻ điểm BGĐ, Diễn biến theo ngày, Dự báo, Biện pháp khắc phục, Báo cáo giao ban, Nhập số, Kiểm tra số liệu, Tính từ dữ liệu thô, Nạp tự động, Điều chỉnh, Cộng/trừ điểm, Danh mục, Ban giám đốc, Dữ liệu & cài đặt, Hướng dẫn |

**Nói rõ giới hạn:** 15 màn nhập liệu/quản trị chưa được dàn lại bố cục bằng Design System — chỉ được áp bảng màu PA-A qua biến CSS. Lý do: nhập liệu/quản trị có rủi ro nghiệp vụ cao, cần thiết kế riêng và kiểm thử từng luồng; làm ở giai đoạn sau sau khi nghiệm thu các màn điều hành.

Chỉ tiêu trên thẻ KPI lấy **theo danh mục thật** bằng mã ưu tiên (`NII`, `THU_NGOAI_LAI`, `DU_NO_CUOI_KY`, `NGUON_VON_CUOI_KY`, `CASA_CUOI_KY`, `TY_LE_NO_XAU`, `DU_NO_TT`, `NGUON_VON_TT`), mã không tồn tại thì bỏ qua và bù bằng chỉ tiêu khác. **Danh mục mặc định không có “TOI”, “Tăng trưởng TOI”, “KDNT”** nên giao diện không bịa các chỉ tiêu này; nếu danh mục vận hành của chi nhánh có chỉ tiêu tương ứng, chỉ cần thêm mã vào `MOI_DATA.UU_TIEN`.

## 4. D1–D9

| # | Thực hiện |
|---|---|
| D1 | Token PA-A, một hệ cho mọi thành phần mới; màn cũ trong vỏ mới nhận cùng bảng màu qua biến CSS |
| D2 | Hai màn riêng `tong-quan` và `dieu-hanh` |
| D3 | Presentation Mode: khung 16:9 (tham chiếu 1920×1080), vừa 1920×1080/1440×900/1366×768, chuyển hai màn, thoát bằng nút/Esc |
| D4 | Logo `assets/logo-vietinbank.png` có sẵn (không vẽ lại) ở sidebar và trình chiếu |
| D5 | Không dark mode |
| D6 | Giao diện mới không dùng thang cầu vồng; heatmap cũ vẫn có trong giao diện cũ |
| D7 | Xem mục 5 |
| D8 | `TrendLine`: thực tế nét liền; DỰ KIẾN nét đứt + nhãn + chú giải; **chỉ vẽ khi hàm dự báo sẵn có của hệ thống (`duBaoXepHang`) trả số**, không tự tạo dự báo |
| D9 | Dual UI như mục 2 |

## 5. D7 — thay hằng số 90 bằng cấu hình `nguong`

Rà soát `\b90\b` trong `App/js/`: 5 vị trí; **chỉ 2 là ngưỡng điểm** (`views-theo-doi.js` đếm “Đơn vị ≥ 90 điểm” và nhãn của nó). Ba vị trí còn lại **không đổi**: `ui.js:57` (góc xoay SVG), `ui.js:302` (độ rộng cột), `ui.js:363` (một mốc của thang màu %HT 9 bậc — không phải ngưỡng điểm; thuộc heatmap cũ, **chưa rõ ý nghĩa nghiệp vụ nên không đụng tới và báo cáo ở đây**).

`nguong.dat = 1,0` là **tỷ lệ hoàn thành**, không phải điểm; gán 90 cho nó sẽ đổi xếp loại. Vì vậy thêm khoá **`nguong.diem_cao`** (mặc định **90**).

| Tệp | Thay đổi |
|---|---|
| `js/config.js` | `nguong` mặc định thêm `diem_cao: 90` |
| `js/engine.js` | `Model.ng.diem_cao` (thiếu/không hợp lệ → 90); hàm `KPI_ENGINE.demDiemCao(list, diemCao)` (so sánh `>=`) |
| `js/views-theo-doi.js` | Dòng đếm dùng `KPI_ENGINE.demDiemCao(rk, g.diem_cao)`; nhãn `'Đơn vị ≥ ' + g.diem_cao + ' điểm'` |
| `js/views-quan-tri.js` | Màn “Dữ liệu & cài đặt”: ô **Ngưỡng điểm cao**, kiểm tra hợp lệ (0 < N ≤ 200), lưu cùng `nguong` (trước đây lưu ghi đè cả đối tượng sẽ làm mất khoá) |
| `ui-moi/moi-data.js` | Giao diện mới gọi **cùng** `demDiemCao` |
| `SCHEMA.md` | Ghi khoá mới |

Dữ liệu cũ không có khoá → tự nhận 90 (qua `normalize`). Test: `tests/test-nguong.js` (biên bằng/cao hơn/thấp hơn, đổi cấu hình, dữ liệu cũ, giá trị lỗi, dùng chung nguồn, **với `nguong = 90` kết quả trùng khít quy tắc cũ ở mọi kỳ, và điểm/hạng/mức không đổi khi chỉ đổi `diem_cao`**) và kiểm thử trình duyệt (đổi 85 → hai giao diện cùng hiển thị “≥ 85 điểm” và cùng số đơn vị đúng; lưu qua Cài đặt và refresh).

## 6. Thay đổi liên quan nghiệp vụ

**Ngoài D7: không có.** Không đổi công thức, trọng số, quy tắc chấm điểm/xếp loại/xếp hạng/GAP, cấu trúc dữ liệu, cơ chế lưu/nhập/xuất. Giao diện mới **không tính lại** điểm: `moi-data.js` chỉ chọn/đổi tên trường từ kết quả engine (có test cấm `computeKpi`, gán `quy_doi`, `th/kh`…). Ánh xạ hiển thị duy nhất: chuỗi trạng thái engine → mã mức.

## 7. Tệp được tạo

`js/ui-switch.js` (89 dòng) · `ui-moi/` : `moi.css`, `moi-tokens.css`, `moi-components.css`, `moi-layout.css`, `vtb.js`, `moi-data.js`, `moi-views.js`, `moi-views2.js`, `moi-shell.js` (tổng ≈ 1.200 dòng, 150 KB, nạp lười) · `tests/`: `test-nguong.js`, `test-moi-data.js`, `browser-dual-ui.mjs`, `screenshots-dual-ui.mjs`, `lib/browser.mjs` · `docs/screenshots/` (28 ảnh) · `DESIGN_SYSTEM.md`, `IMPLEMENTATION_REPORT.md`, `TEST_REPORT.md`.

## 8. Tệp cũ được sửa (toàn bộ, 22 dòng thêm / 12 dòng bớt trong `App/`)

| Tệp | Thay đổi | Ảnh hưởng giao diện cũ |
|---|---|---|
| `App/index.html` | +1 thẻ `<script src="js/ui-switch.js">` | Không |
| `App/js/app.js` | Chèn nút chuyển đổi vào topbar; nhánh `if (moiMode)` trong `render()`; khởi động nạp trước nếu đã chọn mới; xuất `APP.toggleMode/banner/NAV/icon` | Chỉ **thêm** nút ở header; hành vi cũ giữ nguyên khi chọn “cũ” |
| `App/js/config.js`, `engine.js`, `views-theo-doi.js`, `views-quan-tri.js` | D7 (mục 5) | Mặc định 90 ⇒ kết quả như cũ |
| `App/js/views-chi-tieu.js`, `views-van-hanh.js` | +1 dòng mỗi tệp: **xuất** hàm đã có (`soSanh`, `dsSoSanh`, `giaTri`, `goiY`, `quaHan`, `tenDv`) | Không |
| `SCHEMA.md`, `tests/CHAY_TEST.txt` | Tài liệu | — |

## 9. Rollback

Mọi thay đổi chưa commit, trên nhánh `feature/dual-ui`.
- Bỏ toàn bộ: `git restore App SCHEMA.md tests/CHAY_TEST.txt`, xoá `App/js/ui-switch.js`, `App/ui-moi/`, `docs/`, các tệp mới trong `tests/` và 3 tài liệu gốc mới; rồi `git checkout main`.
- Chỉ tắt giao diện mới mà giữ D7: xoá thẻ `<script src="js/ui-switch.js">` và nút trong `app.js` (3 dòng `UI_SWITCH`).
- Người dùng đã chọn giao diện mới có thể về giao diện cũ bằng nút trên header, hoặc xoá khoá `KPI_CN444.giao_dien` của localStorage.

## 10. Vấn đề chưa xử lý / cần chủ dự án quyết định

1. **15 màn quản trị/nhập liệu mới chỉ “khoác” bảng màu**, chưa dàn lại bố cục (mục 3).
2. **Chưa chạy giao diện mới trên dữ liệu thật** (không được phép). Cần nghiệm thu trên **bản sao** dữ liệu thật; vì giao diện mới chỉ đọc `STORE.model()` nên rủi ro thấp, nhưng danh mục thật có thể có chỉ tiêu khác danh mục mặc định (mục 3).
3. Chỉ tiêu “TOI / Tăng trưởng TOI / KDNT” **không có** trong danh mục mặc định — cần xác nhận mã thật nếu có.
4. Loại biểu đồ **Waterfall, Scatter, Stacked bar** (Phần VII) chưa dựng: dữ liệu hiện tại chưa hỗ trợ phân tích đóng góp/tương quan rõ ràng; dùng bullet, cột phân kỳ, thanh xếp hạng, ma trận, đường xu hướng.
5. Presentation Mode có ở hai màn (Tổng quan, Điều hành); CSS in A4 ngang cho trình chiếu đã viết nhưng **chưa kiểm thử in** trong ứng dụng thật (đã kiểm thử ở prototype).
6. Ghi nhớ lựa chọn theo **trình duyệt/máy**, chưa theo tài khoản (ứng dụng không có kho hồ sơ người dùng phía máy chủ).
7. Chưa nâng `PHIEN_BAN`/`?v=` — nên nâng khi phát hành để trình duyệt nạp tệp mới.
8. Biểu đồ Chart.js trong màn cũ đặt trong vỏ mới đọc màu từ `:root` nên vẫn dùng bảng màu cũ (chỉ phần HTML/CSS đổi màu).
9. `getCompletionColor` (ui.js:363, mốc 90% của thang màu) chưa rõ ý nghĩa nghiệp vụ, không thay đổi (mục 5).
10. Kiểm thử tiếp cận chỉ tự động (bàn phím, vòng focus, nhãn); chưa dùng trình đọc màn hình thật.
