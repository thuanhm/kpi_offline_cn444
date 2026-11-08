# Prototype Dashboard KPI điều hành — VietinBank Chi nhánh Bắc Nghệ An (V1.0)

> **Trạng thái: chờ nghiệm thu.** Đây là prototype độc lập, **chưa tích hợp** vào ứng dụng chính. Không có tệp nào trong `App/`, `Data/`, `.claude/` bị sửa. **Toàn bộ số liệu là dữ liệu GIẢ LẬP** sinh bằng seed cố định; không có dữ liệu thật của chi nhánh và không có mã nào đọc `Data/`, `store.js` hay `engine.js`.

## 1. Chạy prototype

### Cách 1 — Bản độc lập (không cần cài gì)

Mở **`standalone/index.html`** bằng Chrome hoặc Edge (nhấp đúp). Một tệp duy nhất ~0,6 MB, chạy offline (phông Plus Jakarta Sans, logo, dữ liệu đều nhúng sẵn). Trạng thái được lưu trong phần `#…` của địa chỉ, nên có thể gửi đường dẫn đúng màn hình/kỳ/đơn vị:

| Tham số | Giá trị | Ví dụ |
|---|---|---|
| `man` | `tong-quan` (mặc định) · `dieu-hanh` | `#man=dieu-hanh` |
| `tc` | `1` = trình chiếu · `0` | `#man=dieu-hanh&tc=1` |
| `ky` | tháng 1–10 (mặc định 10) | `#ky=5` |
| `dv` | `DV01`…`DV12` (đơn vị) | `#dv=DV12` |
| `ct` | mã chỉ tiêu, ví dụ `TOI`, `NPL`, `CASA` | `#dv=DV12&ct=THE` |
| `khoi` | `KHDN` · `KHCN` · `PGD` · `HT` | `#khoi=PGD` |

### Cách 2 — Dashboard theo chuẩn skill `claude-dashboard` (Node 22+)

```bash
node .claude/skills/claude-dashboard/scripts/artifact.mjs open designs/kpi-executive-proto/dashboard
# in ra địa chỉ dạng http://127.0.0.1:4740/dashboard/<id>/ — mở bằng trình duyệt
node .claude/skills/claude-dashboard/scripts/artifact.mjs stop designs/kpi-executive-proto/dashboard   # dừng
```
Cùng một trang giao diện nhưng chạy trên API `dash` thật của skill (có mục **Nguồn** cho biết từng con số đến từ dataset/phép tính nào). Lệnh `open` cần quyền mạng nội bộ (127.0.0.1).

### Xem Design System

```bash
node .claude/skills/claude-design-system/scripts/artifact.mjs open designs/kpi-executive-proto/design-system
```

## 2. Sử dụng

- **Chuyển màn hình:** hai tab “Tổng quan chi nhánh” / “Điều hành Ban giám đốc”.
- **Chọn kỳ báo cáo** (T1–T10/2026) và **lọc đơn vị** ở thanh trên; bảng xếp hạng có lọc theo khối.
- **Drill-down:** bấm một phòng/PGD trong xếp hạng → xuống từng chỉ tiêu của đơn vị đó → bấm một chỉ tiêu (hoặc một thẻ KPI) → biểu đồ *thực hiện so với kế hoạch* và *xu hướng tăng trưởng* đổi theo. Nút “Về toàn chi nhánh” quay lại. Từ màn Điều hành, bấm một đơn vị/chỉ tiêu sẽ chuyển sang màn Tổng quan ở đúng vị trí.
- **Mỗi biểu đồ có nút “Bảng”** để xem dạng bảng số (thay thế cho người dùng trình đọc màn hình hoặc cần số chính xác).
- **Trình chiếu (16:9, khung 1920×1080):** nút “Trình chiếu” → phủ toàn cửa sổ, co giãn đúng tỷ lệ, chỉ giữ nội dung chính; **←/→** chuyển hai màn hình; **Esc** hoặc nút “Thoát trình chiếu” để thoát. Muốn toàn màn hình thật, bấm F11.
- **In A4 ngang:** vào Trình chiếu ở màn Điều hành rồi in (Ctrl+P); kiểm tra tự động xác nhận ra đúng 1 trang.
- Bàn phím: Tab đi qua mọi điều khiển; thẻ KPI, hàng xếp hạng, hàng chỉ tiêu, dòng cảnh báo nhận Enter/Space.

## 3. Cấu trúc thư mục

```
designs/kpi-executive-proto/
├── README.md                      (tệp này)
├── standalone/index.html          Bản chạy độc lập (sinh bởi tools/build.mjs)
├── dashboard/                     Dashboard theo định dạng skill claude-dashboard
│   ├── src/                       Mã nguồn: index.template.html, app.js, styles.css, calcs.cjs, data/*.csv, …
│   ├── db/  _blobs/               Kho của skill (tài liệu, trang, dataset CSV) — sinh bởi tools/publish-dashboard.mjs
├── design-system/                 Design System theo định dạng skill claude-design-system
│   └── project/                   design-system.json, tokens.json, tokens.css, README.md (brand book),
│                                  components/ (16 thành phần + Cover, mỗi cái có README + preview), fonts/, assets/
├── tools/                         Tập lệnh Node (không cần cài thư viện): sinh token, dữ liệu, build, test, chụp ảnh
├── reports/                       Báo cáo kiểm tra, báo cáo D7, kết quả test
└── screenshots/                   Ảnh chụp 1440×900, 1920×1080 và responsive; screenshots/design-system/
```
Thư mục `dashboard/` còn có `.artifact-server.*`, `history/`, `comments.json` do skill tự tạo khi chạy (đã có `.gitignore` do skill sinh).

## 4. Dựng lại và kiểm thử

```bash
node tools/rebuild.mjs            # token → dữ liệu → test D7 → build → Design System → ghi dashboard
node tools/test-d7.mjs            # 25 test D7 + phân loại mức
node tools/browser-test.mjs       # 101 kiểm thử trên Edge/Chrome headless (cần Edge hoặc Chrome; đặt BROWSER_PATH nếu ở chỗ lạ)
node tools/ds-preview-test.mjs    # 17 preview Design System
node tools/shots.mjs              # chụp ảnh vào screenshots/
node tools/make-report.mjs        # tổng hợp reports/BAO_CAO_KIEM_TRA.md
```
Yêu cầu: Node 22 trở lên. Không cần `npm install`; không tải thư viện từ CDN.

## 5. Các quyết định D1–D8 đã thực hiện ở đâu

| # | Quyết định | Thực hiện |
|---|---|---|
| D1 | Màu trạng thái PA-A (`#1c5cab`, `#6da7ec`, `#ec835a`, `#b02a2a`, GAP `#8996ab`) | Token `tier-*` (`tools/build-tokens.mjs`); một hệ duy nhất cho chip, thanh, ô, ma trận; mỗi mức có **biểu tượng khác hình + nhãn chữ**; validator + WCAG ở `reports/` |
| D2 | Tách hai màn hình | `#screen-tong-quan`, `#screen-dieu-hanh` |
| D3 | Chế độ trình chiếu 16:9 | Khung 1920×1080 co giãn; chữ lớn (`present-*`); nội dung phụ ẩn; thoát bằng Esc/nút |
| D4 | Logo | `App/assets/logo-vietinbank.png` **sao chép nguyên bản** (không vẽ lại) |
| D5 | Không dark mode | Chỉ có bảng màu sáng |
| D6 | Bỏ heatmap cầu vồng | Ma trận trạng thái 4 mức rời + biểu tượng + số (`StateMatrix`); thang liên tục chỉ một tông xanh |
| D7 | `nguong` thay hằng số 90 | `nguong.diem_cao = 90` trong dataset cấu hình; 25 test; vị trí trong App được liệt kê, **chưa sửa** — xem `reports/D7_BAO_CAO.md` |
| D8 | Đường dự kiến | Nét **đứt** + nhãn **DỰ KIẾN** + chú giải; thực tế nét liền; **không tự dự báo** — chỉ vẽ khi dataset có số dự kiến (chỉ có ở kỳ T10) |

## 6. Dữ liệu giả lập

Sinh bởi `tools/gen-data.mjs` (seed `20261108`): **12 đơn vị** (4 khối) + dòng Toàn CN, **20 chỉ tiêu** (hiệu quả kinh doanh, tín dụng, huy động vốn, dịch vụ & chất lượng; có TOI, tăng trưởng TOI, dư nợ, huy động vốn, CASA, thu thuần dịch vụ, NII), **10 kỳ** (T1–T10/2026), kế hoạch/thực hiện/%HT/GAP/điểm/mất điểm cho từng đơn vị × chỉ tiêu × tháng. Có đủ các tình huống: đơn vị tốt (≈107 điểm), trung bình, thấp (≈71); đủ 5 mức ở cấp chi nhánh kỳ 10 (7 Đạt, 6 Khá, 3 CCT, 2 Chưa đạt, 2 GAP); thiếu số (3 ô + 2 chỉ tiêu theo quý); số bất thường (CASA PGD-4 tụt mạnh); chỉ tiêu có nguy cơ không đạt kế hoạch năm; tăng trưởng và suy giảm; nhiệm vụ quá hạn. Tên đơn vị và người phụ trách là tên giả (“PGD-1”, “Trưởng PGD-3 (mẫu)”). Mỗi dataset trong dashboard có tiêu đề bắt đầu bằng “Sample” và mô tả ghi rõ là giả lập.

**Quy tắc điểm trong dữ liệu mẫu chỉ là minh hoạ** (điểm = trọng số × min(%HT, trần), điểm quy đổi = tổng điểm ÷ tổng trọng số chỉ tiêu có số × 100). Đây **không** phải công thức KPI của hệ thống thật và không thay thế nó.

## 7. Công nghệ

- Trang: HTML + CSS + JavaScript thuần; biểu đồ là **SVG phẳng viết tay** trong thư viện thành phần (`design-system/project/components/bundle.js`). Không dùng Chart.js: skill dashboard không cho nạp script ngoài tệp của nó, và SVG tự viết dễ kiểm soát nhãn trực tiếp, đường dự kiến, bảng thay thế và tiếp cận.
- Phép tính (xếp hạng, tổng hợp, phân loại mức…) là các hàm `dash.calc` trong `dashboard/src/calcs.cjs`; **cùng các hàm đó** được test bằng Node và nhúng vào trang (không có hai bản).
- Bản độc lập dùng lớp mô phỏng API `dash` rất nhỏ (`tools/dash-shim.js`, ~60 dòng) để chạy cùng mã trang.
- Một nguồn duy nhất cho giá trị thiết kế: `tools/build-tokens.mjs` → `tokens.json` + `tokens.css`; lỗi tương phản làm build dừng.

## 8. Vấn đề còn tồn tại và câu hỏi nghiệp vụ chờ xác nhận

**Nghiệp vụ (cần chủ dự án/nghiệp vụ xác nhận trước khi tích hợp):**
1. **Cách xử lý chỉ tiêu GAP khi tính điểm.** Prototype loại chỉ tiêu thiếu số khỏi cả tử và mẫu số; ứng dụng thật có thể tính khác (ví dụ 0 điểm). Chưa kiểm chứng — không tự đổi.
2. **Tên và vị trí khoá D7:** `nguong.diem_cao` là khoá mới (vì `nguong.dat = 1,0` là tỷ lệ, không phải 90 điểm). Cần xác nhận cách đặt tên và chỗ lưu (xem `reports/D7_BAO_CAO.md` mục 2).
3. **Danh sách chỉ tiêu “quan trọng”** (8 thẻ ở Tổng quan; 8 cột ma trận) là tên chỉ tiêu giả lập; cần ánh xạ với danh mục thật (đặc biệt TOI, tăng trưởng TOI, thu thuần dịch vụ).
4. **Khu vực “vấn đề và đề xuất hành động”** hiện chỉ **hiển thị** dữ liệu mẫu, chưa có nhập/lưu; khi tích hợp cần nơi lưu (ứng dụng chính đã có mô-đun hành động khắc phục).
5. **Dữ liệu dự kiến** trong prototype là **đầu vào có sẵn** (chỉ kỳ T10). Nguồn dự kiến thật (ứng dụng chính có `duBaoXepHang`) cần xác nhận trước khi hiển thị.
6. Logo: dùng nguyên bản; chưa có quy chuẩn chính thức về vùng trống/kích thước tối thiểu — cần hỏi bộ phận nhận diện thương hiệu nếu yêu cầu.

**Kỹ thuật / kiểm thử:**
7. Chỉ kiểm thử tự động trên **Edge/Chromium headless**; chưa thử Firefox/Safari, màn hình cảm ứng, TV/máy chiếu thật, và **chưa kiểm thử bằng trình đọc màn hình** (NVDA/JAWS). Tiếp cận (nhãn ARIA, bàn phím, vòng focus, bảng thay thế) mới kiểm tra tự động.
8. In A4: kiểm tra tự động xác nhận ra **1 trang**; chưa xem bản in thật (độ rõ chữ ở tỷ lệ thu nhỏ ≈ 0,54).
9. Chế độ trình chiếu dùng lớp phủ toàn cửa sổ, không gọi Fullscreen API (F11 cho toàn màn hình thật).
10. Lựa chọn kỳ/đơn vị không được ghi nhớ giữa các lần mở trong bản dashboard theo skill (skill không cho dùng bộ nhớ trình duyệt); bản độc lập giữ trong địa chỉ `#…`.
11. Bố cục tối ưu từ 1280px; máy tính bảng/điện thoại dùng được nhưng không phải trọng tâm.
12. Hiệu năng chưa đo trên máy cấu hình thấp; dữ liệu mẫu 2.080 dòng được tính ngay trong trình duyệt.
13. `dash/look` của dashboard chỉ khai báo bộ màu sáng (D5), nên skill cảnh báo “Fill both sets”.
14. Khi tích hợp vào ứng dụng chính cần lưu ý cơ chế tự nâng cấp bảng `.tbl` sang Tabulator ở `App/js/ui.js` và các ID/`data-*` mà kiểm thử khói hiện có (`tests/smoke-*.ps1`) có thể phụ thuộc — **chưa đọc các kiểm thử này**.

## 9. Bảng đối chiếu tiêu chí nghiệm thu

| Tiêu chí | Bằng chứng |
|---|---|
| Prototype chạy độc lập | `standalone/index.html`; 101/101 kiểm thử trình duyệt |
| Không ảnh hưởng ứng dụng hiện tại | Không sửa `App/`, `Data/`, `.claude/` (kiểm tra bằng `git status`); không import `store.js`/`engine.js` |
| Không lỗi console nghiêm trọng | Kiểm tra console ở 12 tổ hợp kích thước × màn hình: 0 lỗi/cảnh báo |
| Không vỡ layout ở các kích thước mục tiêu | Không tràn ngang ở 6 kích thước; trình chiếu vừa khung ở 4 kích thước cửa sổ |
| Hai màn hình hoạt động đúng | Test chuyển tab, kỳ, lọc, drill-down |
| Trình chiếu tốt ở 16:9 | Tỷ lệ khung 1,778 ở mọi cửa sổ; không thẻ nào bị cắt; đủ 12 đơn vị |
| Màu trạng thái nhất quán | Test đọc màu thực tế của 5 mức; token duy nhất |
| Đường dự kiến phân biệt với thực tế | Test: nét đứt + nhãn + chú giải; kỳ không có dữ liệu → không vẽ |
| Truy cập bằng bàn phím | Tab/Enter/Esc/mũi tên; vòng focus; vùng bấm ≥ 28px |
| Tương phản WCAG | 52/52 cặp đạt; xem `reports/BAO_CAO_KIEM_TRA.md` |
| Có README và báo cáo kiểm thử | Tệp này; `reports/` |

## 10. Bước tiếp theo

**Dừng tại đây, chờ nghiệm thu.** Chưa thực hiện bất kỳ thay đổi nào với hệ thống đang vận hành. Sau khi được duyệt, giai đoạn tích hợp sẽ cần: xác nhận các câu hỏi mục 8, đọc các kiểm thử khói hiện có, và thực hiện D7 theo `reports/D7_BAO_CAO.md` kèm kiểm chứng “`nguong = 90` cho kết quả trước/sau giống hệt”.
