# DESIGN AUDIT — Giao diện KPI VietinBank Chi nhánh Bắc Nghệ An (CN 444)

**Phiên bản ứng dụng được rà soát:** 2.12.0 · **Ngày:** 08/11/2026
**Loại tài liệu:** phân tích + phương án thiết kế. **Chưa thay đổi bất kỳ file mã nguồn nào.**
Viết cho: chủ dự án và người sẽ triển khai giao diện (cần chốt các quyết định ở mục 10 trước khi làm).

---

## 0. Tóm tắt điều hành

1. **Hai màn hình mục tiêu đã xác định rõ.** *Tổng quan chi nhánh* là route `tong-quan` ([views-theo-doi.js:58](App/js/views-theo-doi.js#L58)). *Bảng điều hành BGĐ* là route `dieu-hanh` ([views-van-hanh.js:137](App/js/views-van-hanh.js#L137)). Đừng nhầm với *Thẻ điểm Ban giám đốc* (`the-diem-bgd`, [views-bgd.js:18](App/js/views-bgd.js#L18)), đây là màn hình khác.
2. **Bảng điều hành BGĐ hiện không có biểu đồ nào.** Toàn bộ là 4 ô số, bảng top 3 / bottom 3 và các danh sách chữ. Không có xu hướng, không có đường tới mục tiêu, và không bấm sâu xuống được (danh sách không có liên kết).
3. **Màu trạng thái KPI chưa nhất quán.** Cùng một chỉ tiêu có thể hiện viền ô màu "Khá" (xanh dương) nhưng thanh tiến độ lại màu thang 9 bậc (vàng-xanh). Nguyên nhân: `UI.bar()` ghi đè màu bằng `htColor()` ([ui.js:37](App/js/ui.js#L37)), trong khi ô dùng lớp 4 mức ([app.css:173](App/css/app.css#L173)).
4. **Bảng màu hiện tại không qua kiểm tra khả năng phân biệt.** Validator của skill `dataviz` báo FAIL ở: thang heatmap `kpi` (hai bậc liền kề chỉ cách nhau ΔE 5,5 với mắt thường), biểu đồ cột chồng nhóm chỉ tiêu (cam ↔ lục chỉ cách ΔE 2,8 với người mù màu đỏ), và cặp "Đạt" ↔ "Chưa đạt" (xanh lục / đỏ có tỷ lệ độ sáng chỉ 1,18:1). Chi tiết ở Phụ lục A.
5. **Có nợ kỹ thuật CSS/JS nhỏ nhưng thật.** Biến CSS không tồn tại (`--border`, `--dat`, `--chua`, `--card-hover`), lớp `btn-sm` không được định nghĩa, hai khối CSS bị lặp, hai mã xanh thương hiệu khác nhau (`#005993` trong CSS, `#0E4C92` trong JS). Danh sách ở Phụ lục B.
6. **Phương án đề xuất.** Giữ nguyên engine, công thức, schema và thư viện (Chart.js vẫn dùng; thêm SVG nhẹ). Làm lại *lớp trình bày* theo một Design System VietinBank có token rõ ràng; thiết kế hai màn hình với hai mục đích khác nhau: **Tổng quan** để theo dõi hằng ngày, **Bảng điều hành BGĐ** để ra quyết định trong khoảng 10 giây (một màn hình 16:9 và in A4 ngang).
7. **Có 8 quyết định cần chủ dự án chốt (mục 10)**, quan trọng nhất là bảng màu 4 mức Đạt/Khá/CCT/Chưa đạt.

### Phạm vi và giới hạn của bản rà soát (nói thẳng)

| Đã làm | Chưa làm / hạn chế |
|---|---|
| Đọc toàn bộ: `index.html`, `app.css`, `font.css`, `app.js`, `views-theo-doi.js`, `views-van-hanh.js`, `views-bgd.js`, `ui.js` | **Không chạy ứng dụng, không chụp màn hình.** Mọi nhận xét về hiển thị suy ra từ mã nguồn. |
| `engine.js`: chỉ liệt kê chữ ký hàm công khai ([engine.js:90-258](App/js/engine.js#L90)) | Không đọc thân hàm tính điểm, nên không đánh giá cache hay hiệu năng bên trong engine. |
| `store.js`: đã đọc dòng 1-735 ở lượt rà soát schema trước. `SCHEMA.md` đã đọc ở lượt đó. `README.md` đọc phần đầu. | Không đọc thư mục `Data/` (chỉ thấy tên file trong danh sách git, chưa mở). Không dùng số liệu thật ở bất kỳ đâu. |
| Chạy validator của skill `dataviz` và tính tương phản WCAG bằng script đặt ngoài dự án | Màu, tương phản tính theo giá trị trong CSS, chưa đo trên màn hình thật. |
| Đọc `SKILL.md` + tài liệu tham chiếu của `dataviz`, `claude-design-system`, `claude-dashboard` | Không tạo thư mục design-system / dashboard (đúng nguyên tắc "chỉ đọc"). Token ở mục 9 viết đúng cấu trúc skill yêu cầu để sau này nhập thẳng. |

**Nguyên tắc đã tuân thủ:** không sửa file nào ngoài tạo `DESIGN_AUDIT.md`; không đụng công thức KPI; không đổi cấu trúc dữ liệu; không đọc `Data/`; không dùng dữ liệu thật.

---

## 1. Kiến trúc giao diện hiện tại

### 1.1 Mô hình tổng thể

Ứng dụng một trang (SPA) thuần JavaScript, không framework, không bước build. Giao diện sinh bằng **chuỗi HTML** gán vào `innerHTML`.

```
index.html
 ├─ <aside id="sidebar">   ← renderSidebar()  (app.js:77)
 ├─ <header id="topbar">   ← renderTopbar()   (app.js:110)  chọn kỳ, xuất, đồng bộ, đăng nhập
 └─ <main id="view">       ← VIEWS[route].html(APP) + .mount(view, APP)

Luồng: hashchange / STORE.on(đổi dữ liệu) → render() [rAF] → huỷ biểu đồ cũ
       → vẽ sidebar + topbar → view.innerHTML = banner + .page + fn.html()
       → fn.mount() gắn sự kiện + dựng biểu đồ → KPI_ICONS.decorate → nâng bảng Tabulator → gắn nút PNG
```

| Lớp | File | Vai trò |
|---|---|---|
| Khung & router | [app.js](App/js/app.js) | `NAV` (menu, dòng 25-54), `parseHash`, `render()` (dòng 286-307), kỳ đang chọn `APP.ky` |
| Màn hình | `views-*.js` | Mỗi màn là `VIEWS['id'] = { html(A), mount(v, A), refresh? }`, đăng ký vào biến toàn cục `window.VIEWS` |
| Tiện ích hiển thị | [ui.js](App/js/ui.js) | Định dạng số vi-VN, `chip`, `bar`, `spark`, `ring`, `chart` (Chart.js nạp lười), `bang` (Tabulator), màu heatmap, nút PNG |
| Dữ liệu & tính điểm | `store.js`, `engine.js` | `STORE.model()` trả `Model`, các hàm như `M.card`, `M.ranking`… (mục 4) |
| CSS | [app.css](App/css/app.css) (506 dòng), [font.css](App/css/font.css) | Một file duy nhất, biến `:root` ở dòng 2-11 |
| Thư viện | `lib/` | Chart.js + annotation + datalabels, Tabulator, SheetJS, PptxGenJS, docx, SnapDOM, Sortable, nạp khi cần |

### 1.2 Đặc điểm kiến trúc có ảnh hưởng đến thiết kế mới

| # | Đặc điểm | Hệ quả khi thiết kế lại |
|---|---|---|
| 1 | `render()` vẽ lại **toàn bộ trang** mỗi khi dữ liệu đổi (có hoãn khi đang gõ, [app.js:316-322](App/js/app.js#L316)) | Biểu đồ bị huỷ và dựng lại; không giữ trạng thái hover/lọc cục bộ. Trạng thái giao diện phải nằm trong `APP` (như `A.khoi`, `A.mt_mode`). |
| 2 | HTML sinh bằng nối chuỗi, style nội tuyến lẫn trong JS (`style="width:…"`, `style="color:var(--dat,#16a34a)"`) | Khó áp token; cần gom về lớp CSS trước khi đổi giao diện. |
| 3 | Mỗi màn tự gắn sự kiện trong `mount()` bằng `querySelector(...).onclick` | Đổi cấu trúc DOM sẽ làm mất sự kiện nếu không giữ nguyên ID/thuộc tính `data-*` (mục 5 liệt kê). |
| 4 | Offline, mở bằng file/ổ mạng, không CDN, không build | Mọi tài nguyên mới (font, icon, SVG) phải là file tĩnh trong `App/`. Không thêm thư viện lớn. |
| 5 | Bảng `.tbl` chỉ-xem được **tự nâng cấp sang Tabulator** sau khi vẽ ([ui.js:283-312](App/js/ui.js#L283)), có điều kiện (không có `tfoot`, `colspan`, liên kết…) | Bảng mới phải tuân hoặc tránh điều kiện này, nếu không sẽ bị thay đổi cấu trúc ngầm. |
| 6 | Có sẵn: nút tải PNG tự gắn vào mọi canvas/bảng ([ui.js:231](App/js/ui.js#L231)), in A4 ngang ([app.css:310](App/css/app.css#L310)), xuất Word/PowerPoint dùng chung `KPI_NHAN_DINH` | Thiết kế mới phải giữ các điểm xuất/in này. |
| 7 | Font Plus Jakarta Sans nhúng sẵn (latin, latin-ext, **vietnamese**), có 4 độ đậm 400/500/600/700 | Phù hợp tiếng Việt. Nhưng CSS dùng `650` và `800` ([app.css:27](App/css/app.css#L27), [:452](App/css/app.css#L452)) mà không có file tương ứng nên trình duyệt tự làm tròn. |

---

## 2. Màn hình "Tổng quan chi nhánh"

- **Route / menu:** `#/tong-quan`, nhóm *Theo dõi kết quả*, mục đầu tiên; cũng là trang mặc định và trang rơi về khi route không hợp lệ ([app.js:60-61](App/js/app.js#L60)).
- **Mã:** `VIEWS['tong-quan']` tại [views-theo-doi.js:58-119](App/js/views-theo-doi.js#L58).
- **Trạng thái rỗng:** nếu kỳ chưa có số thực hiện → thẻ `empty()` kèm nút "Nhập số liệu" (chỉ admin).

### Cấu trúc từ trên xuống (đúng thứ tự trong mã)

| # | Khối | Lớp / phần tử | Nội dung |
|---|---|---|---|
| 1 | **Hero** | `section.hero.card` | Vòng tròn điểm (`UI.ring`), tên chi nhánh, "x / TS điểm", chênh lệch so tháng trước, 4–5 chip Đạt/Khá/CCT/Chưa/GAP; lưới 4 `.stat`: Dẫn đầu · Bình quân các đơn vị · Đơn vị ≥ 90 điểm · Cảnh báo nghiêm trọng |
| 2 | **Chỉ tiêu toàn CN** | `.sec-head` + `.legend` + `.tiles` | Mỗi chỉ tiêu một `a.tile` (viền trên theo mức, giá trị TH, KH, thanh tiến độ, %HT, +tháng, %KH năm); bấm → `#/chi-tieu/<mã>` |
| 3 | **Hai biểu đồ** | `.cols-2` | `#c-rank` cột ngang điểm quy đổi các phòng/PGD (bấm cột → thẻ điểm phòng); `#c-trend` đường 12 tháng CN vs bình quân phòng |
| 4 | **Cảnh báo + Nhận định** | `.cols-2` | `ul.alerts` (9 mục đầu, phần còn lại trong `<details>`); đoạn văn tự sinh `#nd` + nút `#btn-copy` |

### Nhận xét cấu trúc
- Số ô chỉ tiêu phụ thuộc danh mục (lọc `hien_tq !== false`, gồm cả chỉ tiêu tham khảo). Với danh mục đầy đủ, khối 2 chiếm gần hết màn hình đầu và **đẩy bảng xếp hạng, xu hướng và cảnh báo xuống dưới**.
- Cảnh báo (hành động được) nằm cuối trang, trong khi số "Cảnh báo nghiêm trọng" ở hero lại không liên kết tới danh sách.
- Ngưỡng **90 điểm** để đếm "Đơn vị ≥ 90 điểm" là hằng số cứng ([views-theo-doi.js:64](App/js/views-theo-doi.js#L64)), không lấy từ `settings.nguong`.

---

## 3. Màn hình "Bảng điều hành BGĐ"

- **Route / menu:** `#/dieu-hanh`, nhãn *Bảng điều hành BGĐ*, nhóm *Theo dõi kết quả*, mục thứ hai ([app.js:28](App/js/app.js#L28)).
- **Mã:** `VIEWS['dieu-hanh']` tại [views-van-hanh.js:137-161](App/js/views-van-hanh.js#L137). Thiết kế cho **in/lưu PDF một trang** (nút `#dh-in` gọi `window.print()`, ghi "Lập ngày … · số liệu đến hết …").
- **Trạng thái rỗng:** kỳ chưa có số thực hiện → "Chưa có số thực hiện. Chọn kỳ khác ở góc trên."

> Lưu ý đặt tên: *Thẻ điểm Ban giám đốc* (`the-diem-bgd`) là thẻ điểm **cá nhân từng thành viên BGĐ** và chỉ hiển thị khi đăng nhập hoặc khi bật `bgd_cong_khai`. Đây không phải màn hình mục tiêu.

### Cấu trúc từ trên xuống

| # | Khối | Phần tử | Nội dung |
|---|---|---|---|
| 0 | Thanh công cụ | `.toolbar.no-print` | Nút `#dh-in` In / Lưu PDF |
| 1 | **Đầu trang + 4 số chính** | `section.card.dh-head`, `.dh-kpis` | Điểm KPI CN (+ chênh), Dự kiến cuối năm, Chỉ tiêu đạt `x/N`, Số liệu `đủ/cần` (+ số bất thường) |
| 2 | **Dẫn đầu / Cuối bảng** | `.cols-2`, `table.tbl` | 3 đơn vị đầu và 3 đơn vị cuối: hạng, tên, điểm, chênh so tháng trước |
| 3 | **Mất điểm / Nguy cơ không đạt** | `.cols-2` | 5 chỉ tiêu mất điểm lớn nhất (toàn hệ thống); 5 chỉ tiêu CN nguy cơ không đạt KH năm |
| 4 | **Cảnh báo / Nhiệm vụ** | `.cols-2`, `ul.cb-list` | 6 cảnh báo mức ≥ 2; 6 nhiệm vụ đang theo dõi |

### Nhận xét cấu trúc
- **Không có biểu đồ nào** (không `<canvas>`, không SVG chart). Người đọc phải tự suy ra xu hướng từ con số.
- **Không điều hướng được:** các `<li>` cảnh báo và nhiệm vụ không có liên kết, dù dữ liệu gốc (`goiY`) có sẵn `href` ([views-van-hanh.js:16-24](App/js/views-van-hanh.js#L16)) và bị bỏ đi ở dòng 156.
- Chỉ hiển thị top 3 / bottom 3 → với 12-14 đơn vị, **phần giữa bảng xếp hạng bị ẩn**, không thấy khoảng cách giữa các đơn vị.

---

## 4. Hàm lấy dữ liệu và render biểu đồ

### 4.1 Lấy dữ liệu (đọc từ `STORE.model()`; **không đổi, giữ nguyên khi thiết kế lại**)

| Hàm | Định nghĩa | Dùng ở | Trả về (trường được màn hình dùng) |
|---|---|---|---|
| `M.card(dv, nam, thang)` | [engine.js:121](App/js/engine.js#L121) | cả 2 màn | `quy_doi`, `diem`, `ts`, `ht_chung`, `co_so`, `so_dat/kha/cct/chua/thieu`, `so_ct`, `rows[]` (mỗi dòng: `ma`, `ind`, `kh`, `th`, `th_truoc`, `ht`, `ht_nam`, `mat`, `ts`, `nguon_cn`…), `ref[]` |
| `M.ranking(nam, thang, khoi?)` | [engine.js:172](App/js/engine.js#L172) | cả 2 màn | danh sách card đơn vị đã xếp hạng (`hang`, `hang_truoc`, `ten_ngan`, `quy_doi`…) |
| `M.alerts(nam, thang)` | [engine.js:258](App/js/engine.js#L258) | cả 2 màn | `{muc 1-3, loai, text, dv?, ct?}` |
| `M.scoreSeries(dv, nam)` | [engine.js:230](App/js/engine.js#L230) | Tổng quan | mảng 12 điểm quy đổi theo tháng |
| `M.duBaoXepHang(nam, thang)` | (gọi ở [views-van-hanh.js:141](App/js/views-van-hanh.js#L141)) | Điều hành | `cn.quy_doi_du_bao`, `cn.rows[].ket_luan/ht_du_bao/can_moi_thang/mat_du_bao`, `ds[].so_khong_dat/du_bao` |
| `M.kiemTraSo(nam, thang)` | (gọi ở [views-van-hanh.js:14](App/js/views-van-hanh.js#L14)) | Điều hành | `tong_co`, `tong_can`, `bat_thuong[]`, `tien_do[]` |
| `STORE.getHanhDong()` | [store.js:201](App/js/store.js#L201) | Điều hành | nhiệm vụ chưa `xoa` |
| `goiY(M, ky)` | [views-van-hanh.js:13](App/js/views-van-hanh.js#L13) | Điều hành | gom cảnh báo + thiếu số + bất thường + dự báo + nhiệm vụ quá hạn + chưa khoá kỳ |
| `nhanDinh(...)` | [views-theo-doi.js:38](App/js/views-theo-doi.js#L38) | Tổng quan | đoạn văn nhận định (cũng dùng xuất Word/PPT) |
| `M.indSeries(ct, dv, nam)` | [engine.js:239](App/js/engine.js#L239) | (chưa dùng ở 2 màn này) | chuỗi theo tháng của một chỉ tiêu, **có sẵn** để làm sparkline từng chỉ tiêu |

Quan sát hiệu năng nhỏ: `kiemTraSo` và `duBaoXepHang` bị gọi **hai lần** trong màn điều hành (một lần ở `html`, một lần trong `goiY`); ở Tổng quan, `scoreSeries` được gọi trong vòng lặp `đơn vị × 12 tháng` ([views-theo-doi.js:109-110](App/js/views-theo-doi.js#L109)). Chưa kiểm tra engine có cache hay không.

### 4.2 Render biểu đồ

| Thành phần | Hàm | Thư viện | Vị trí dùng |
|---|---|---|---|
| Cột ngang điểm đơn vị | `UI.chart` → Chart.js `bar`, `indexAxis:'y'` | Chart.js + annotation | `#c-rank` ([views-theo-doi.js:103-107](App/js/views-theo-doi.js#L103)) — màu từng cột = `UI.htColor(ht_chung)` (thang 9 bậc), đường ngưỡng `UI.nguong(g,'x',false)` |
| Đường 12 tháng | `UI.chart` → `line`, `fill:true`, `tension:.3` | Chart.js + annotation | `#c-trend` ([:111-115](App/js/views-theo-doi.js#L111)) — đường "Bình quân" dùng `--accent` (đỏ thương hiệu), nền 4 dải màu Đạt/Khá/CCT/Chưa |
| Nhãn số trên biểu đồ | plugin `nhanSo` tự viết | Canvas 2D | [ui.js:151-187](App/js/ui.js#L151) — tự bỏ nhãn chạm nhau (tốt) |
| Vòng điểm | `UI.ring(r, label, size)` | SVG thuần | hero |
| Thanh tiến độ | `UI.bar(r, ng, cap)` | HTML/CSS | tile, bảng thẻ điểm |
| Sparkline | `UI.spark(arr)` | SVG thuần | bảng xếp hạng |
| Heatmap | `UI.heatStyle*` / `PALETTE` | HTML table + màu nội suy | màn *Ma trận chỉ tiêu* ([ui.js:329-382](App/js/ui.js#L329)) |
| Cột chồng nhóm chỉ tiêu | `UI.chart` `bar` stacked, bảng màu 8 mã cố định | Chart.js | màn *Xếp hạng* `#c-nhom` ([views-theo-doi.js:164-167](App/js/views-theo-doi.js#L164)) |

---

## 5. DOM ID và event handler

### 5.1 Khung ứng dụng (mọi màn hình)

| Phần tử | Gắn ở | Sự kiện |
|---|---|---|
| `#sidebar` | [app.js:100-107](App/js/app.js#L100) | `onclick` uỷ quyền: `.nav-group` mở/đóng nhóm (accordion, lưu `localStorage KPI_CN444.nav_nhom`) |
| `#topbar` | `renderTopbar` | dựng lại mỗi lần `render()` |
| `#btn-menu` | [app.js:127](App/js/app.js#L127) | bật `body.nav-open` (màn nhỏ) |
| `#sel-thang`, `#sel-nam` | [app.js:124-125](App/js/app.js#L124) | `onchange` → đặt `APP.ky` → `render()` |
| `#btn-mode` | [app.js:126](App/js/app.js#L126) | `toggleMode`: đăng nhập / đăng xuất quản trị |
| `#sync-dot` | `APP.renderSync` | `onclick`: kết nối lại thư mục chung hoặc mở `#/du-lieu` |
| `.nap-btn`, `#nap-badge` | topbar (chỉ admin) | liên kết `#/nap-tu-dong` |
| `#view` (`main.content`, `tabindex=-1`) | [index.html:16](App/index.html#L16) | vùng nội dung |
| `.scrim` | [index.html:19](App/index.html#L19) | `onclick` **nội tuyến** gỡ `nav-open` |
| `#toasts` | `UI.toast` | tạo động |
| `#bn-xoa-mau`, `#bn-ket-noi`, `#bn-saoluu` | banner đầu trang ([app.js:182-189](App/js/app.js#L182)) | `onclick` gắn sau mỗi `render()` |
| `#login-user`, `#login-pass`, `#mk-moi`, `#mk-lai` | hộp thoại đăng nhập / đổi mật khẩu | Enter → bấm nút chính |
| Toàn cục | [app.js:310-329](App/js/app.js#L310) | `hashchange` (cuộn lên đầu + vẽ lại), `pageshow` (tải lại nếu từ bfcache), `STORE.on` (vẽ lại có debounce 60 ms), `focusout`, bắt `click`/`keydown` pha capture để xin lại quyền thư mục |

### 5.2 Tổng quan chi nhánh

| Phần tử | Sự kiện / hành vi |
|---|---|
| `a.tile[href="#/chi-tieu/<mã>"]` | điều hướng hash |
| `#c-rank` (canvas) | `options.onClick` → `APP.go('phong', mã đơn vị)` |
| `#c-trend` (canvas) | chỉ hover/tooltip; không có tương tác khác |
| `.al[data-dv]`, `.al[data-ct]` | `bindAlerts` ([views-theo-doi.js:132](App/js/views-theo-doi.js#L132)): bấm → `#/phong/<dv>` hoặc `#/chi-tieu/<ct>` |
| `#nd`, `#btn-copy` | sao chép nhận định vào clipboard |
| `a.link[href="#/xep-hang"]` | điều hướng |
| nút PNG `.png-btn` | do `UI.nutAnh` gắn tự động vào mỗi `.card` có canvas |

### 5.3 Bảng điều hành BGĐ

| Phần tử | Sự kiện / hành vi |
|---|---|
| `#dh-in` | `window.print()` ([views-van-hanh.js:160](App/js/views-van-hanh.js#L160)) |
| Các `ul.cb-list`, `table.tbl` | **không có** handler hay liên kết |
| Bảng `.tbl` đơn giản | có thể bị Tabulator thay thế sau khi vẽ (xem 1.2 #5) |

**Ràng buộc khi thiết kế lại:** giữ các ID `#view`, `#topbar`, `#sidebar`, `#sel-thang`, `#sel-nam`, `#btn-mode`, `#c-rank`, `#c-trend`, `#nd`, `#btn-copy`, `#dh-in` và các thuộc tính `data-dv`, `data-ct`, hoặc đổi đồng thời với mã gắn sự kiện. Các script kiểm thử khói ([tests/smoke-man-hinh.ps1](tests/smoke-man-hinh.ps1), [tests/smoke-bang.ps1](tests/smoke-bang.ps1)) chưa được đọc, nên cần kiểm tra chúng có phụ thuộc vào ID/lớp nào trước khi đổi.

---

## 6. CSS đang ảnh hưởng đến từng màn hình

Toàn bộ CSS nằm trong [app.css](App/css/app.css) (và `font.css` chỉ khai báo `@font-face`). Không có CSS riêng theo màn hình.

### 6.1 Dùng chung cho cả hai màn

| Nhóm | Dòng | Ghi chú |
|---|---|---|
| Biến `:root` (màu thương hiệu, 5 màu trạng thái + 5 nền nhạt, `--r:14px`, `--shadow`, `--side:248px`) | 2-11 | |
| Nền trang + **dải gradient xanh→đỏ cố định trên cùng** | 14-24 | `body::before`, `z-index:9999` |
| Khung `.app / .sidebar / .main / .topbar / .content / .page` | 35-61 | `.page` có `max-width:1480px`, **căn trái**, không căn giữa |
| `.card`, `.card-head`, `.cols-2` | 64-72 | `.cols-2` chuyển 1 cột ở ≤ 960px |
| `.btn`, `.pills`, `.tabs`, `.toolbar` | 73-90 | |
| `.chip`, `.legend`, `.delta`, `.pbar`, `.stack` | 107-124 | màu trạng thái |
| Hiệu ứng (`pageIn`, hover nâng) / giảm chuyển động | 438-448 | |
| Nút PNG, in | 310-316, 472-477 | `@media print` ẩn sidebar/topbar |
| Responsive | 296-307 | breakpoint 1180 / 960 / 600 |

### 6.2 Riêng Tổng quan chi nhánh

| Khối | Selector | Dòng |
|---|---|---|
| Hero | `.hero`, `.hero::after` (vòng sáng đỏ trang trí), `.hero-txt`, `.hero-stats`, `.stat`, `.ring*`, `.ring-val` | 146-147, 154-167 |
| Ô chỉ tiêu | `.tiles` (lưới `auto-fill minmax(208px,1fr)`), `.tile*`, `.tile-top/-val/-sub/-foot`, `.ic-tile` | 170-180, 436 |
| Biểu đồ | `.chart`, `.h300` | 256-257 |
| Cảnh báo | `.alerts`, `.al` (viền trái 3px theo mức), `.al em` | 260-265 |
| Nhận định | `.nhan-dinh`, `details summary` | 266-267 |
| Responsive | `.hero` thành 2 cột ≤ 1180px, 1 cột + căn giữa ≤ 600px | 296, 307 |

### 6.3 Riêng Bảng điều hành BGĐ

| Khối | Selector | Dòng |
|---|---|---|
| Đầu trang | `.dh-head`, `.dh-head h2` | 458 |
| 4 ô số | `.dh-kpis`, `.dh-kpis > div`, `.dh-kpis small`, `.dh-kpis b` (26px) | 459 |
| Danh sách | `.cb-list` | 454 |
| Bảng | `.tbl`, `.tbl .r`, `.tbl .num` (và `.tb-x` nếu được nâng lên Tabulator) | 183-203, 125-137 |
| Hộp "không có" | `.ok-box` | 106 |
| In | `@media print { .toolbar, .db-hero-r .btn {display:none}; .dh-kpis > div {break-inside:avoid} }` | 460 |

---

## 7. Đánh giá UI/UX hiện tại

Mức: **P0** = ảnh hưởng đúng/sai khi đọc số hoặc quyết định; **P1** = ảnh hưởng đáng kể hiệu quả điều hành; **P2** = cải thiện chất lượng.

### 7.1 Điểm mạnh (nên giữ)
- Định dạng số theo vi-VN nhất quán (`UI.num/pct`), thập phân dấu phẩy.
- Chip trạng thái luôn có **biểu tượng + chữ** (`IC_CHIP`), không chỉ dựa vào màu; heatmap có **số trong ô** (mã hóa kép).
- Plugin `nhanSo` tự bỏ nhãn chạm nhau; cột ngang bắt đầu từ 0; thang điểm có đường ngưỡng.
- Có sẵn: in A4 ngang, xuất PNG/Word/PPT/Excel, `prefers-reduced-motion`.
- Menu 2 cấp nhớ trạng thái; nhóm quản trị ẩn khi chưa đăng nhập.
- Font có bộ ký tự tiếng Việt, chạy offline.

### 7.2 Phát hiện

| # | Mức | Phát hiện | Bằng chứng |
|---|---|---|---|
| U1 | **P0** | **Màu trạng thái mâu thuẫn trong cùng một ô.** Viền trên theo 4 mức (Khá = xanh dương) nhưng thanh tiến độ tô bằng thang 9 bậc (95–99% = vàng-xanh `#7cb305`). Người đọc thấy "Khá" xanh dương và "gần đạt" vàng cùng lúc. | [ui.js:37](App/js/ui.js#L37) (`background:` + `htColor`), [app.css:173](App/css/app.css#L173), ngưỡng 9 bậc [ui.js:357-368](App/js/ui.js#L357) khác ngưỡng 4 mức `nguong.dat/kha/cct` |
| U2 | **P0** | **Hai thang ngưỡng song song.** 4 mức (≥100/≥80/≥70 theo cấu hình) và 9 bậc cố định (≥120,110,100,95,90,80,70,60). Hệ quả: 85% là "Khá" (xanh dương) trên chip nhưng màu cam (`#fa8c16`) trong heatmap. Hai màn hình kể hai câu chuyện khác nhau. | [ui.js:329-376](App/js/ui.js#L329) |
| U3 | **P0** | **"Đạt" và "Chưa đạt" phân biệt bằng xanh lục/đỏ, độ sáng gần như bằng nhau** (tỷ lệ 1,18:1). Người mù màu đỏ-lục (≈ 8% nam) khó phân biệt nếu chỉ nhìn màu. Skill `claude-design-system` yêu cầu hai mức này khác nhau ≥ 3:1 về độ sáng hoặc "Đạt" rời trục đỏ-lục. | Phụ lục A |
| U4 | **P1** | **Bảng điều hành BGĐ không có hình.** Không xu hướng, không so sánh với ngưỡng, không thể nhìn "đang tốt lên hay xấu đi". Một tờ trình lãnh đạo nên trả lời được trong ~10 giây: *đạt bao nhiêu, đang đi lên hay xuống, ai cần chú ý, việc gì phải quyết*. | [views-van-hanh.js:137-161](App/js/views-van-hanh.js#L137) |
| U5 | **P1** | **Điều hành là ngõ cụt:** mọi dòng cảnh báo/nhiệm vụ là chữ thuần, không bấm sâu. | [views-van-hanh.js:156-157](App/js/views-van-hanh.js#L156) |
| U6 | **P1** | **Tổng quan: thứ tự thông tin ngược với mức ưu tiên.** Lưới ô chỉ tiêu (có thể 20+ ô) chiếm màn hình đầu; xếp hạng, xu hướng và cảnh báo phải cuộn xuống. Hero thì to nhưng chỉ chứa 1 số chính. | [views-theo-doi.js:77-98](App/js/views-theo-doi.js#L77) |
| U7 | **P1** | **Vòng tròn (ring) cho một số duy nhất** chiếm 132 px để nói điều mà con số đã nói; thang 0–100 nhưng vòng bị chặn ở 100% nên điểm vượt trần không thể hiện. Skill `dataviz`: một giá trị đơn nên là *stat tile / hero figure*, không phải biểu đồ. | [ui.js:53-59](App/js/ui.js#L53) |
| U8 | **P1** | **Biểu đồ cột chồng "so sánh theo nhóm chỉ tiêu"** dùng 6–8 màu phân loại *chưa qua kiểm tra* (cam ↔ lục ΔE 2,8 với mù màu đỏ); gộp nhiều chỉ tiêu có trọng số khác nhau vào các cột *điểm tuyệt đối* nên không so sánh được mức đạt giữa các nhóm. | [views-theo-doi.js:164-167](App/js/views-theo-doi.js#L164), Phụ lục A |
| U9 | **P1** | **Màu đỏ thương hiệu bị dùng như một chuỗi dữ liệu và như điểm nhấn UI** (đường "Bình quân phòng/PGD", viền mục menu đang chọn, huy hiệu ⚡). `#d71249` rất gần màu "Chưa đạt" `#d6383d` (tỷ lệ 1,10:1) nên người đọc có thể hiểu nhầm là cảnh báo. Skill: màu trạng thái dành riêng, không dùng làm chuỗi. | [views-theo-doi.js:113](App/js/views-theo-doi.js#L113), [app.css:48](App/css/app.css#L48) |
| U10 | **P1** | **Biểu đồ canvas không có thay thế bằng chữ/bảng** (không `aria-label`, không "xem dạng bảng"); tooltip chỉ hiện khi rê chuột, ô heatmap chỉ có thuộc tính `title`. Skill: "tooltip chỉ để tăng cường, không phải cách duy nhất đọc giá trị". | [views-theo-doi.js:103](App/js/views-theo-doi.js#L103), [:200](App/js/views-theo-doi.js#L200) |
| U11 | **P1** | **Tương tác bàn phím.** Hàng bảng bấm được là `<tr onclick>` / `tr[data-dv]`, ô heatmap là `<td data-dv>`: không `tabindex`, không `role`, không bấm được bằng phím. Các nút lọc `.pill`/`.tab` không có `aria-pressed`/`role="tab"`. | [app.css:188](App/css/app.css#L188), [views-theo-doi.js:213](App/js/views-theo-doi.js#L213) |
| U12 | **P2** | **Tương tác chữ nhỏ thấp tương phản.** `--muted #66758c`: 4,68:1 trên nền trắng nhưng chỉ **4,28:1 trên nền trang `#f2f5fa`** (< 4,5 cho chữ nhỏ 11–12,5 px). Chân sidebar (`opacity:.6`) ≈ **3,14:1**. Chip "Đạt" `#12925a` trên nền nhạt 3,51:1; chip "Chưa đạt" 3,93:1; chip "CCT" 4,19:1. Ô heatmap chữ trắng trên `#ff7a45` chỉ 2,59:1. | Phụ lục A (tính WCAG) |
| U13 | **P2** | **Ngưỡng 90 điểm cứng** ở hero Tổng quan, không theo `settings.nguong`. Đổi cấu hình ngưỡng thì số này không đổi theo. | [views-theo-doi.js:64](App/js/views-theo-doi.js#L64) |
| U14 | **P2** | **Bố cục chỉ căn trái, không tận dụng màn rộng.** `.page{max-width:1480px}` không căn giữa → màn 1920 px có khoảng trống bên phải; không có chế độ trình chiếu/TV cho họp giao ban. | [app.css:59](App/css/app.css#L59) |
| U15 | **P2** | **Không có thang kích cỡ chữ/khoảng cách/bo góc.** Có ít nhất 16 cỡ chữ khác nhau (10,5 → 30 px), 7 bán kính bo (6–16 px), khoảng cách tuỳ ý. Khó giữ nhất quán và khó áp một hệ thống thiết kế. | [app.css](App/css/app.css) toàn file |
| U16 | **P2** | **Các mẫu "viền màu một cạnh"** (`.al`, `.tile` viền trên, `.bc-vd`, `.dien-giai`, mục menu đang chọn) và vòng sáng đỏ trang trí trong hero là kiểu đã bị skill `claude-design-system` xếp vào "AI trope" cần tránh. | [app.css:48](App/css/app.css#L48), [:146-147](App/css/app.css#L146), [:171](App/css/app.css#L171), [:261](App/css/app.css#L261) |
| U17 | **P2** | **Thương hiệu thể hiện yếu:** sidebar chỉ hiện chữ tên chi nhánh, không hiển thị logo dù `assets/logo-vietinbank.png` và `logo.svg` có sẵn (CSS `.brand img` tồn tại nhưng `renderSidebar` không xuất thẻ `<img>`). | [app.js:87](App/js/app.js#L87), [app.css:39](App/css/app.css#L39) |
| U18 | **P2** | **Thiếu trạng thái "đang tải / đang làm mới".** Chart.js nạp lười nên ô biểu đồ trống tới khi nạp xong; không có skeleton. Skill: giữ bản cũ mờ đi thay vì nhấp nháy. | [ui.js:188-206](App/js/ui.js#L188) |
| U19 | **P2** | **Heatmap mặc định là cầu vồng 9 bậc đỏ→xanh lục** (không qua kiểm tra). Dataviz: thang liên tục nên một tông màu; chỉ dùng đa màu khi là "nhiệt ngữ nghĩa" kèm thang chú giải. Hai bậc `#52c41a` / `#7cb305` gần như trùng nhau (ΔE 5,5). | [ui.js:330](App/js/ui.js#L330), Phụ lục A |

### 7.3 Đánh giá cách trực quan hoá từng chỉ tiêu KPI (skill `dataviz`)

Quy trình skill: chọn **hình thức** trước → gán **màu theo vai trò** → **chạy validator** → quy cách marks → tương tác → hỗ trợ tiếp cận.

| Dữ liệu / công việc | Hiện tại | Đánh giá | Hình thức đề xuất |
|---|---|---|---|
| Điểm KPI toàn CN (1 số + so kỳ trước) | Vòng tròn 132 px + số + chip | Hơi thừa; trần 100% làm mất thông tin vượt kế hoạch | **Hero figure** (≥ 48 px) + delta có dấu và tên kỳ + sparkline 12 tháng + chip mức |
| Phân bố số chỉ tiêu theo mức | 4–5 chip rời | Đúng nhưng rời rạc | **Một thanh chồng 100%** 4 mức, có khe 2 px, chú giải trực tiếp |
| Xếp hạng điểm các phòng/PGD | Cột ngang, màu từng cột theo 9 bậc | Hình thức đúng (so sánh độ lớn, có thứ tự). Màu cột đang là "trạng thái" hợp lý nhưng sai thang | Giữ **cột ngang đã sắp xếp**, màu theo **4 mức thống nhất**, đường ngưỡng Đạt/Khá, nhãn ở đầu cột, thêm cột chênh so tháng trước và sparkline |
| Xu hướng điểm 12 tháng | Đường + 4 dải nền + đường ngưỡng + đường bình quân đỏ | Đúng loại biểu đồ; 4 dải nền màu **trùng lặp** với màu trạng thái và làm ồn | Đường CN nhấn (1 màu thương hiệu), "Bình quân" màu xám/phụ, **hai đường ngưỡng nét mảnh** (Đạt, Khá), nhãn điểm cuối thay chú giải |
| Đạt KH tháng/năm từng chỉ tiêu | Ô vuông + thanh | Hợp lý nhưng 20+ ô tốn chỗ, khó so sánh | **Hàng bullet**: thanh TH so với vạch kế hoạch, nhóm theo `nhom`, sparkline `indSeries` |
| Đơn vị × chỉ tiêu | Heatmap 9 bậc cầu vồng | Hình thức đúng (lưới), **bảng màu sai** | Heatmap **4 mức rời** (ô nền nhạt + chữ đậm + biểu tượng) cho %HT; **thang một tông xanh** cho "Hạng" và "Điểm mất" |
| Điểm theo nhóm chỉ tiêu mỗi đơn vị | Cột chồng 6–8 màu | Sai hình thức: cộng điểm tuyệt đối, màu phân loại chưa kiểm tra | **Thanh % đạt/trọng số theo nhóm** (nhỏ, một thang chung) hoặc bảng; nếu giữ chồng thì ≤ 4–5 nhóm có chú giải trực tiếp |
| Nguy cơ không đạt KH năm | Bảng chữ ("dự kiến 84%, cần x/tháng") | Thiếu thị giác | **Bullet**: dự kiến vs vạch 100%, nhãn "cần x/tháng" |
| Thiếu / bất thường số liệu | Chữ + chip | Ổn | Thanh tiến độ nhập `tong_co/tong_can` + danh sách nhấp vào được |

**Nguyên tắc màu rút từ skill, áp dụng cho dự án:**
1. *Trạng thái* (Đạt/Khá/CCT/Chưa đạt/GAP) là **một hệ duy nhất, dùng ở mọi nơi** và luôn có biểu tượng + chữ.
2. *Danh mục* (nhóm chỉ tiêu, các chuỗi so sánh) dùng bảng phân loại **đã qua validator**, tối đa 4 màu với biểu đồ "tất cả các cặp", ≤ 8 với cột/đường.
3. *Độ lớn thuần túy* (hạng, điểm mất) dùng **một tông** nhạt→đậm.
4. Màu đỏ thương hiệu **không** xuất hiện trong dữ liệu.
5. Một trục tung duy nhất; **không** có biểu đồ hai trục (hiện chưa có, giữ vậy).

---

## 8. Đề xuất: Executive KPI Dashboard

*(Hướng nghiên cứu bố cục từ skill `claude-dashboard`: **một màn hình phục vụ một quyết định, có câu kết luận một dòng**; bắt đầu từ số gần "kết quả" nhất; số chính kèm thay đổi so với kỳ trước, có dấu, có tên kỳ; mỗi thẻ ghi rõ khung thời gian; chỉ khi **vi phạm mục tiêu** mới dùng màu cảnh báo; nhãn cuối đường thay cho chú giải; trạng thái lỗi/rỗng/làm mới không làm xô bố cục. Mô hình gần nhất là **Scorecard** và **Board** của skill.)*

### 8.1 Mục tiêu thiết kế

| Mục tiêu | Thước đo kiểm chứng |
|---|---|
| Trả lời trong ~10 giây: *đạt bao nhiêu, xu hướng, ai cần chú ý, việc gì cần quyết* | Mọi thông tin trên một màn hình 1440×900 mà không cuộn (Điều hành) |
| Một ngôn ngữ trạng thái duy nhất | Cùng một %HT luôn cho cùng một màu/biểu tượng ở mọi màn |
| Truy ngược được | Mỗi số/dòng chính bấm được tới thẻ điểm hoặc chỉ tiêu tương ứng |
| In/trình chiếu được | A4 ngang không vỡ; chế độ 16:9 đọc được từ xa |
| Không đổi nghiệp vụ | Không sửa `engine.js`, `store.js`, công thức, schema |

### 8.2 Hai màn, hai mục đích

| | **Tổng quan chi nhánh** (`tong-quan`) | **Bảng điều hành BGĐ** (`dieu-hanh`) |
|---|---|---|
| Người dùng | Quản trị/điều hành hằng ngày | Ban giám đốc, họp giao ban |
| Việc cần làm | Theo dõi, tìm vấn đề, đi sâu | Nắm tình hình, **ra quyết định** |
| Hình thức | Cuộn dọc ~1,5 màn, tương tác | **Một trang** 16:9 / A4 ngang, ít tương tác |
| Mật độ | Trung bình–cao | Thấp–trung bình, số lớn |

### 8.3 Lưới chung

- Lưới **12 cột**, khoảng cách 16 px (≥ 1440) / 12 px (< 1440), **nội dung căn giữa, tối đa 1600 px** (khắc phục U14). Có chế độ "Trình chiếu" tăng cỡ chữ 125% cho màn 1920×1080.
- Điểm gãy: ≥ 1440 (đầy đủ) · 1024–1439 (xếp 2 cột) · < 1024 (1 cột, thẻ xếp chồng) · in A4 ngang.
- Mỗi thẻ có **tiêu đề + một dòng chú thích** (khung thời gian, đơn vị tính) theo gợi ý của skill dashboard.

### 8.4 Bố cục "Bảng điều hành BGĐ" (1440×900, minh hoạ, **dữ liệu giả**)

```
┌ Header ──────────────────────────────────────────────────────────────────────────────────┐
│ Bảng điều hành · T11/2026 (lũy kế)      [Số liệu 168/170 ô] [Kỳ: chưa khoá]   [In/PDF]   │
│ KẾT LUẬN 1 DÒNG: "Điểm KPI 91,4 (▲0,8 so T10); 2 phòng dưới ngưỡng Khá; 3 chỉ tiêu có     │
│                   nguy cơ không đạt KH năm."   ← sinh từ số liệu sẵn có, không phải model  │
├ KPI band (4 thẻ, cao ~150) ───────────────────────────────────────────────────────────────┤
│ ① ĐIỂM KPI CN          │ ② DỰ KIẾN CUỐI NĂM     │ ③ CHỈ TIÊU THEO MỨC    │ ④ CẦN QUYẾT      │
│   91,4  ▲0,8 so T10    │   93,0  (3 tháng gần)  │   ████▓▓▒░  12 Đạt     │   5 việc cần xử lý│
│   [chip: Khá]          │   vạch Đạt 100         │   thanh chồng 4 mức    │   2 nghiêm trọng  │
│   ~~~~ sparkline 12th  │   ┈┈┈ ngưỡng           │   12/20 đạt · 3 chưa   │   3 quá hạn       │
├ Hàng 2 ───────────────────────────────────────────────┬───────────────────────────────────┤
│ XẾP HẠNG PHÒNG/PGD (toàn bộ, không chỉ top/bottom 3)  │ DIỄN BIẾN ĐIỂM KPI 12 THÁNG       │
│ ▌A  ████████████████▏ 98,2 ▲1,1   ~~spark             │  đường CN (nhấn) ─────●           │
│ ▌B  ███████████████   95,0 ▼0,4   ~~spark             │  Bình quân phòng ┄┄┄┄            │
│ …  vạch Đạt ┊ vạch Khá ┊                               │  ┈┈ Đạt  ┈┈ Khá  ⋯ dự kiến→T12   │
│ ▌N  ████████▌         71,3 ▼2,0   ~~spark             │  nhãn điểm cuối thay chú giải     │
├ Hàng 3 (3 thẻ) ───────────────────────────────────────────────────────────────────────────┤
│ MẤT ĐIỂM NHIỀU NHẤT        │ NGUY CƠ KHÔNG ĐẠT KH NĂM    │ VIỆC CẦN QUYẾT & NHIỆM VỤ        │
│ bar: Đơn vị·chỉ tiêu −3,2  │ bullet: dự kiến vs vạch 100%│ mức · nội dung · đơn vị · hạn    │
│ (mỗi dòng bấm được)        │ "cần x/tháng"               │ (mỗi dòng bấm được)              │
├ Chân trang ──────────────────────────────────────────────────────────────────────────────┤
│ Lập ngày … · Số liệu đến hết T11/2026 · [Khoá kỳ: …] · Nguồn: thẻ điểm CN                  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**Ánh xạ dữ liệu (đều dùng hàm có sẵn, không công thức mới):**

| Thành phần | Nguồn | Ghi chú |
|---|---|---|
| ① Điểm KPI + chênh | `M.card(CN,…).quy_doi`, `M.card(CN, thang-1)` | giống `dieu-hanh` hiện tại |
| ① Sparkline 12 tháng | `M.scoreSeries(CN, nam)` | |
| ② Dự kiến cuối năm | `M.duBaoXepHang().cn.quy_doi_du_bao` | chỉ **hiển thị**, không tính lại; trên biểu đồ nối hai điểm có sẵn (hiện tại → dự kiến) bằng nét đứt, **gắn nhãn "dự kiến"** |
| ③ Số chỉ tiêu theo mức | `cn.so_dat/kha/cct/chua/thieu`, `cn.so_ct` | |
| ④ Cần quyết | `goiY(...)` (mức ≥ 2) + `STORE.getHanhDong()` | thêm `href` (đã có trong dữ liệu) |
| Xếp hạng | `M.ranking(...)` + `M.scoreSeries(u.ma)` | hiện tất cả đơn vị; có `hang_truoc` để mũi tên |
| Mất điểm | `rk[].rows[].mat` | |
| Nguy cơ không đạt | `X.cn.rows[]` (`ket_luan === 'khong_dat'`, `ht_du_bao`, `can_moi_thang`) | |

Câu **kết luận một dòng** có thể ghép từ cùng các trường trên (giống `nhanDinh`, [views-theo-doi.js:38](App/js/views-theo-doi.js#L38)); không dùng AI/ước lượng mới.

### 8.5 Bố cục "Tổng quan chi nhánh" (đổi thứ tự theo mức ưu tiên)

```
┌ Dải KPI (hero + 3 stat) ─────────────────────────────────────────────────────────────────┐
│ ĐIỂM KPI CN 91,4 ▲0,8 [Khá]  ~sparkline │ Chỉ tiêu theo mức (thanh chồng) │ Dẫn đầu │ Cảnh báo│
├ CẦN CHÚ Ý (5 mục, bấm được) ──────────────────────────────────────────────────────────────┤
├ Xếp hạng phòng/PGD (cột ngang)            │ Diễn biến điểm KPI 12 tháng                   │
├ CHỈ TIÊU TOÀN CN — theo nhóm, dạng hàng bullet (TH vs KH, %HT, sparkline, +tháng, %KH năm) │
├ Nhận định nhanh (đoạn văn) + Sao chép                                                      │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

Thay đổi chính so với hiện tại: (1) **cảnh báo lên trên**; (2) 20+ ô vuông thành **hàng bullet nhóm theo `nhom`** (so sánh dọc dễ hơn, ít cuộn hơn, có `indSeries` làm sparkline); (3) hero chuyển từ vòng tròn sang **hero figure**; (4) số cảnh báo ở hero bấm được; (5) "Đơn vị ≥ 90 điểm" đổi sang dùng `settings.nguong` *(cần chủ dự án chốt, vì đổi ý nghĩa số hiện có — xem D7)*.

### 8.6 Đặc tả thành phần mới

| Thành phần | Mô tả | Ghi chú kỹ thuật |
|---|---|---|
| `HeroFigure` | Số ≥ 48 px, **chữ sans cùng họ, số tỷ lệ (không tabular)**, delta có dấu + tên kỳ, chip mức, sparkline | SVG thuần |
| `TierBar` | Thanh chồng 100% 4 mức + GAP, **khe 2 px giữa các đoạn**, nhãn chỉ khi đủ chỗ | thay `.stack`, `.chip` rời |
| `BulletRow` | Thanh TH, vạch KH/100%, nhãn giá trị, delta, sparkline | thay `.tile`; giữ `a[href="#/chi-tieu/<mã>"]` |
| `RankBars` | Hạng, tên, thanh có vạch Đạt/Khá, điểm, `▲▼` so tháng trước, sparkline | giữ `onClick → APP.go('phong', mã)`; có `tabindex` + Enter |
| `AttentionList` | Dòng: mức (biểu tượng + chữ), nội dung, đơn vị, hạn; **bấm được**, mở bằng phím | dùng `href` từ `goiY` |
| `TrendLine` | Chart.js line, 2 px, nhãn điểm cuối, 2 đường ngưỡng, nét đứt "dự kiến" | tận dụng `UI.chart`, bỏ 4 dải nền |
| `DataFreshness` | Dải "Số liệu đến hết …, đã khoá/chưa, 168/170 ô" | dữ liệu từ `kiemTraSo`, `kyKhoa` |
| `ProvenancePopover` *(tuỳ chọn)* | Bấm vào số chính → "nguồn: thẻ điểm CN; TH/KH; ai nhập, lúc nào" | `STORE.getCellInfo` đã có (`{t, ai}`); mượn ý "Sources" của skill dashboard |
| `ViewAsTable` | Nút "xem dạng bảng" cho mỗi biểu đồ | WCAG; có thể tái dùng Tabulator |

### 8.7 Trạng thái, tiếp cận, in

| Chủ đề | Quy tắc |
|---|---|
| Rỗng | Giữ thẻ `empty()` hiện có, thêm gợi ý hành động; ô biểu đồ giữ `min-height` bằng chiều cao khi có số để bố cục không nhảy |
| Đang tải/làm mới | Giữ bản cũ mờ 50% khi tải lại; skeleton khi lần đầu; không dùng spinner |
| Lỗi nạp thư viện biểu đồ | Một dòng mờ ở giữa thẻ + bảng số thay thế (đã có `catch` trong `UI.chart`) |
| Bàn phím | Mọi hàng/ô bấm được: `tabindex="0"`, `role="link"` hoặc dùng `<a>`, Enter/Space, vòng focus đặc 3:1; nút lọc dùng `aria-pressed` |
| Màu | Không chỉ dựa vào màu: biểu tượng + chữ + số; tuỳ chọn **kết cấu 45°/135°** khi in, `forced-colors` hoặc bật "hỗ trợ mù màu" (chỉ bật theo cài đặt, không mặc định) |
| In | A4 ngang, ≤ 1 trang cho Điều hành; ẩn thao tác; giữ in màu và có bản đen-trắng nhờ biểu tượng + kết cấu |
| Chuyển động | Chỉ trong `prefers-reduced-motion: no-preference`; bỏ hiệu ứng nâng thẻ 2–3 px khi hover (nhiễu với bảng điều hành) |

---

## 9. Design System VietinBank (đề xuất)

*(Viết theo định dạng của skill `claude-design-system`: danh sách token, tên duy nhất, mã màu hex, mỗi token có ghi chú sử dụng; chữ phải ≥ 4,5:1 trên nền được nêu; viền/biểu tượng mang nghĩa ≥ 3:1. Nguồn là mã hiện có: các giá trị lấy từ [app.css:2-11](App/css/app.css#L2). **Chưa tạo thư mục `designs/…`** — chờ phê duyệt.)*

### 9.1 Màu

**Thương hiệu và nền** (giữ `#005993` và `#d71249` từ CSS hiện tại):

| Token | Giá trị | Dùng cho | Tương phản |
|---|---|---|---|
| `brand-blue` | `#005993` | Nút chính, liên kết, tiêu đề nhấn, vạch nhận diện | 7,37:1 trên trắng; chữ trắng trên nền này 7,37:1 |
| `brand-blue-dark` | `#004573` | Sidebar (nền), hover nút chính | |
| `brand-blue-tint` | `#e6f1f8` | Nền chip/hover nhẹ | |
| `brand-red` | `#d71249` | **Chỉ**: dải nhận diện, huy hiệu thông báo, logo. **Không dùng cho dữ liệu, trạng thái hay chuỗi biểu đồ.** | |
| `surface-page` | `#f4f6fa` | Nền trang | |
| `surface-card` | `#ffffff` | Thẻ | |
| `line` / `line-soft` | `#e3e9f2` / `#eef2f7` | Viền, kẻ bảng (nét liền mảnh, không nét đứt) | |
| `ink` | `#15233b` | Chữ chính | 15,73:1 trên trắng |
| `ink-2` | `#4a5a72` | Chữ phụ | 7,01:1 trên trắng |
| `ink-muted` | `#5a6881` | Nhãn, trục, chú thích (thay `#66758c`) | 5,20:1 trên `#f4f6fa` ✓ (cũ 4,28:1 ✗) |

**Trạng thái KPI — hệ duy nhất, 4 mức + thiếu số.** Đây là **quyết định D1**; có hai phương án:

| Mức | Cấu hình ngưỡng (giữ nguyên) | **PA-A (khuyến nghị): xanh dương → cam** | PA-B: đèn giao thông |
|---|---|---|---|
| Đạt | `%HT ≥ nguong.dat` | `#1c5cab` (xanh dương đậm) | `#0ca30c` (lục) |
| Khá | `≥ nguong.kha` | `#6da7ec` (xanh dương nhạt) | `#fab219` (vàng) |
| Cần cải thiện | `≥ nguong.cct` | `#ec835a` (cam) | `#ec835a` (cam) |
| Chưa đạt | còn lại | `#b02a2a` (đỏ sẫm) | `#d03b3b` (đỏ) |
| GAP (thiếu số) | không có số | xám `#8996ab` + **kết cấu sọc** | giống PA-A |

| Tiêu chí (validator) | PA-A | PA-B | Hiện tại |
|---|---|---|---|
| Dải độ sáng | PASS | **FAIL** (vàng `#fab219` quá sáng) | n/a |
| CVD liền kề (mù màu) | PASS, ΔE 20,5 | PASS, 11,3 | **FAIL** cam↔lục 2,8 (nhóm chỉ tiêu) |
| Mắt thường liền kề ≥ 15 | PASS, 22,3 | **FAIL**, 13,6 (vàng↔cam) | **FAIL** 5,5 (thang heatmap) |
| "Đạt" rời trục đỏ-lục (theo skill) | ✓ | ✗ (lục ↔ đỏ) | ✗ |

*Lý do khuyến nghị PA-A:* qua toàn bộ kiểm tra cứng, khớp màu thương hiệu, an toàn cho người mù màu theo quy tắc "xanh dương/cam tốt hơn lục/đỏ" của skill. **Rủi ro cần cân nhắc:** xanh dương cũng là màu "tương tác/thương hiệu" → cần luôn đi kèm **biểu tượng + chữ**, và màu nút/liên kết dùng `brand-blue` đậm hơn nhiều so với màu "Đạt". Nếu người dùng quen "xanh lục = tốt", PA-B là phương án thay thế nhưng phải chấp nhận cặp vàng/cam chỉ dựa vào chữ + biểu tượng. Trong cả hai phương án, **chữ trạng thái dùng màu đậm hơn màu nền (xem bảng dưới)**:

| Mức | Màu đổ (fill) | Chữ trên nền nhạt 14% | Tương phản chữ/nền |
|---|---|---|---|
| Đạt | PA-A `#1c5cab` | `#1c5cab` trên `#e8eef8`* | ≥ 4,5 (cần đo lại với nền chốt) |
| Khá | `#6da7ec` | `#1b4f8f`* | |
| CCT | `#ec835a` | `#9a3d12` trên `#fceee8` | 6,08:1 ✓ |
| Chưa đạt | `#b02a2a` | `#b02a2a` trên `#f8e4e4` | 5,36:1 ✓ |
| GAP | `#8996ab` | `#4a5a72` trên `#eef0f3` | 6,14:1 ✓ |

\* Hai dòng đánh dấu `*` là giá trị đề xuất chưa được đo chính thức; cần chạy lại tính tương phản khi chốt PA-A.

**Danh mục (chuỗi so sánh, nhóm chỉ tiêu)** — 8 ô, đã chạy validator:

| Ô | Màu | Ô | Màu |
|---|---|---|---|
| 1 | `#005993` (xanh thương hiệu) | 5 | `#eda100` |
| 2 | `#eb6834` | 6 | `#e87ba4` |
| 3 | `#1baf7a` | 7 | `#008300` |
| 4 | `#6250d6` | 8 | `#e34948` |

Kết quả: dải độ sáng PASS, độ bão hòa PASS, khoảng cách mắt thường PASS (ΔE tối thiểu 19,6); CVD liền kề **WARN** 7,2 (đỏ ↔ lục ô 7-8) nên **bắt buộc nhãn trực tiếp hoặc bảng thay thế**; tương phản < 3:1 ở ô 3/5/6 nên cũng cần nhãn. Với biểu đồ "mọi cặp" (phân tán) **chỉ dùng 3 ô đầu**. **4 ô đầu** (`#005993, #eb6834, #1baf7a, #6250d6`) qua mọi kiểm tra cứng (CVD 9,2; mắt thường 27,6).

**Quy tắc màu:** màu theo **thực thể** chứ không theo thứ hạng (lọc không làm đổi màu); chuỗi "bình quân/tham chiếu" dùng xám trung tính, không dùng đỏ thương hiệu; thang một tông cho độ lớn thuần túy (dải xanh `#cde2fb → #0d366b`); chữ luôn dùng màu mực, không dùng màu chuỗi.

### 9.2 Chữ

| Token | Giá trị | Dùng cho |
|---|---|---|
| Họ chữ | Plus Jakarta Sans (đã nhúng, có tiếng Việt), dự phòng `"Segoe UI", system-ui, sans-serif` | tất cả, **kể cả số lớn**, không dùng serif |
| Độ đậm | **400 / 500 / 600 / 700 duy nhất** (khớp file có sẵn; bỏ 650 và 800) | |
| `caption` | 12 px / 16 | nhãn, trục, chú thích (không dưới 12) |
| `body` | 14 px / 20 | nội dung, bảng |
| `title-sm` | 16 px / 22, 600 | tiêu đề thẻ |
| `title` | 20 px / 28, 600 | tiêu đề màn |
| `display` | 28 px / 34, 700 | số trong ô KPI |
| `hero` | 48–56 px / 1,1, 700 | **một** số chính / màn |
| Số | `tabular-nums` **chỉ** ở cột bảng/nhãn trục; số lớn dùng số tỷ lệ | |

### 9.3 Khoảng cách, bo góc, nổi

| Nhóm | Giá trị | Ghi chú |
|---|---|---|
| Khoảng cách (lưới 4 px) | 4 · 8 · 12 · 16 · 24 · 32 · 48 | thay các giá trị tuỳ ý hiện có |
| Bo góc | 6 (chip, nút, ô nhập) · 10 (thẻ) · 999 (thanh/tròn) | thay 14/12/10/9/8/7/6 |
| Đổ bóng | 2 mức: thẻ (nhẹ), nổi (menu, popover) | bỏ bóng đổ lớn khi hover |
| Vòng focus | 2 px đặc `brand-blue`, cách 2 px, ≥ 3:1 trên mọi nền | |

### 9.4 Thành phần (danh mục cần xây — nguồn: nhu cầu của hai màn)

`HeroFigure` · `StatTile` · `TierChip` (biểu tượng + chữ) · `TierBar` · `BulletRow` · `RankBars` · `Sparkline` · `DeltaBadge` (▲▼ + chữ + màu theo "tốt/xấu", không theo tăng/giảm) · `AttentionList` · `DataFreshness` · `PeriodPicker` · `EmptyState` · `SkeletonBlock` · `ViewAsTable`. Mỗi thành phần cần: README (khi nào dùng, dữ liệu cần truyền) và bản xem trước chạy được.

### 9.5 Quy tắc dùng (nội dung cho README của hệ thống)

1. Một hệ trạng thái duy nhất cho Đạt/Khá/CCT/Chưa đạt/GAP, dùng ở **mọi** màn; không tự chế thang riêng.
2. Mọi trạng thái đi kèm biểu tượng + chữ.
3. `brand-red` chỉ cho nhận diện; số liệu xấu dùng màu "Chưa đạt".
4. Mỗi màn có tối đa **một** `HeroFigure`; số liệu phụ dùng `display`.
5. Không viền màu một cạnh, không gradient trang trí, không vòng sáng trang trí.
6. Biểu đồ: một trục tung; đường 2 px; cột ≤ 32 px, bo 4 px ở đầu dữ liệu; lưới nét liền mảnh; nhãn chọn lọc (cuối đường, cực trị), không đặt số lên mọi điểm; khe 2 px giữa các đoạn chồng.
7. Mỗi biểu đồ có **dạng bảng** thay thế.
8. Mọi hàng/ô tương tác dùng được bằng phím.

### 9.5b Bảng chuyển đổi từ biến hiện tại (khi triển khai)

| Biến cũ | Thay bằng |
|---|---|
| `--primary / --primary-d / --primary-l` | `brand-blue / brand-blue-dark / brand-blue-tint` |
| `--accent` | `brand-red` (chỉ nhận diện) |
| `--bg / --card / --line / --line-2` | `surface-page / surface-card / line / line-soft` |
| `--text / --muted` | `ink / ink-muted` |
| `--c-dat…--c-thieu`, `--t-dat…--t-thieu` | 5 token trạng thái (fill) + 5 nền nhạt + 5 chữ |
| `--r`, `--shadow` | bo góc 3 mức, đổ bóng 2 mức |
| `--border`, `--dat`, `--chua`, `--card-hover` *(đang dùng nhưng chưa khai báo)* | bỏ; dùng token mới |

---

## 10. Lộ trình, kiểm thử, rủi ro và quyết định cần chốt

### 10.1 Lộ trình đề xuất (chưa thực hiện)

| Giai đoạn | Nội dung | Thay đổi hành vi? |
|---|---|---|
| 0 | Chốt quyết định D1–D8; chốt phạm vi | — |
| 1 | **Prototype độc lập bằng dữ liệu giả** (mục 10.3), duyệt giao diện | Không động vào `App/` |
| 2 | Làm sạch CSS (Phụ lục B) + khai báo token; chưa đổi diện mạo | Không (kiểm tra bằng so sánh ảnh) |
| 3 | `HeroFigure`, `TierBar`, `BulletRow`, `RankBars`… trong `ui.js` | Có, chỉ lớp trình bày |
| 4 | Làm lại `dieu-hanh` (rủi ro thấp: chưa có biểu đồ và sự kiện) | Có |
| 5 | Làm lại `tong-quan`, thống nhất màu `ma-tran`, `xep-hang`, `phong` | Có |
| 6 | Tiếp cận (bàn phím, bảng thay thế), in A4, chế độ trình chiếu | Có |

### 10.2 Kiểm thử

- Chạy lại kiểm thử khói hiện có (`tests/smoke-*.ps1`, `tests/test-baocao.js`) sau mỗi giai đoạn; **chưa đọc chúng, cần xem chúng phụ thuộc ID/lớp nào trước giai đoạn 3.**
- **Hồi quy số liệu:** so sánh bằng chữ các số được hiển thị (điểm, %HT, hạng) giữa bản cũ và mới trên **cùng một bộ dữ liệu giả**; mọi số phải trùng khớp (vì không đổi engine).
- Chạy `validate_palette.js` cho mọi bảng màu trước khi merge.
- Kiểm tra tương phản WCAG tự động cho các cặp chữ/nền; kiểm tra bàn phím; xem thử với bộ lọc mù màu của trình duyệt; in thử A4 ngang.

### 10.3 Kế hoạch prototype không dùng dữ liệu thật

- Đặt ngoài `App/` và **không import `store.js` hay đọc `Data/`**. Ví dụ `designs/kpi-executive-proto/`.
- Số liệu giả sinh từ hạt giống cố định: đơn vị "Đơn vị 01…12", chỉ tiêu "Chỉ tiêu 01…20", điểm ngẫu nhiên có kiểm soát để phủ đủ 4 mức + GAP + trường hợp rỗng/lỗi/số rất lớn/tên rất dài.
- Dùng mẫu **Scorecard/Board** của skill `claude-dashboard` cho bản xem trước, đặt `title`/mô tả file bắt đầu bằng **"Mẫu"** theo quy ước của skill.
- Xuất bản xem trước để duyệt trước khi động vào `App/`.

### 10.4 Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Đổi màu 4 mức làm người dùng quen "xanh lục = đạt" bỡ ngỡ | Chú giải rõ + biểu tượng + chữ; giữ lựa chọn PA-B nếu chủ dự án muốn |
| Đổi DOM làm hỏng sự kiện hoặc test khói | Giữ ID/`data-*` (mục 5); đọc test trước giai đoạn 3 |
| Bảng `.tbl` bị Tabulator nâng cấp ngầm làm lệch thiết kế | Dùng thành phần mới, tránh điều kiện nâng cấp ([ui.js:276-282](App/js/ui.js#L276)) |
| Nhãn "dự kiến" trên biểu đồ bị hiểu là cam kết | Luôn kèm chữ "dự kiến" và nét đứt; chỉ nối hai điểm có sẵn |
| Chart.js vẽ lại toàn bộ mỗi lần dữ liệu đổi | Giữ cơ chế `render()` hiện tại; thành phần SVG nhẹ không ảnh hưởng |
| Số lớn 48–56 px tràn trong ô hẹp | Kiểm tra với số rất lớn trong prototype; `clamp()` cho cỡ chữ |

### 10.5 Quyết định cần chủ dự án chốt

| # | Quyết định | Khuyến nghị |
|---|---|---|
| **D1** | Bảng màu 4 mức: PA-A (xanh dương→cam) hay PA-B (đèn giao thông)? | **PA-A**, vì qua validator và an toàn cho mù màu; PA-B nếu muốn giữ thói quen xanh lục |
| **D2** | Giữ 2 màn riêng (Tổng quan + Điều hành) hay gộp? | **Giữ riêng**, hai mục đích khác nhau |
| **D3** | Thêm chế độ "Trình chiếu" (cỡ chữ lớn, 16:9) cho họp giao ban? | Có |
| **D4** | Hiển thị logo VietinBank ở sidebar (file đã có)? | Có, theo đúng quy chuẩn nhận diện của ngân hàng |
| **D5** | Có làm chế độ tối? | **Không ở v1** (ứng dụng chạy trên PC văn phòng; nếu làm sau, phải chọn từng bước màu và kiểm tra lại bằng validator cho nền tối) |
| **D6** | Heatmap: bỏ thang cầu vồng `kpi` làm mặc định? | Có; giữ làm tuỳ chọn "Cổ điển" một phiên bản rồi bỏ |
| **D7** | "Đơn vị ≥ 90 điểm": bỏ hằng 90, dùng `nguong` cấu hình? | Có, nhưng cần xác nhận vì **đổi ý nghĩa của số hiện có** (không phải công thức KPI) |
| **D8** | Hiển thị đường "dự kiến" trên biểu đồ xu hướng? | Có, nhãn rõ, chỉ nối 2 điểm có sẵn |

**Điều chưa làm, chờ bạn duyệt:** tạo bộ file design-system, tạo prototype, hoặc sửa bất kỳ file nào trong `App/`.

---

## Phụ lục A — Kết quả validator và tính tương phản

Chạy `scripts/validate_palette.js` của skill `dataviz` (`--mode light`, nền `#ffffff`). Script nằm ngoài dự án; không có file nào bị ghi.

| Bảng màu | Kết quả | Chi tiết |
|---|---|---|
| **A. 6 nhóm chỉ tiêu hiện tại** `#0E4C92,#2F80ED,#27AE60,#F2994A,#9B51E0,#EB5757` | **FAIL** | dải độ sáng (`#0E4C92` L 0,421 ngoài dải); CVD liền kề cam↔lục **ΔE 2,8** (protan); tương phản `#27AE60` 2,87, `#F2994A` 2,23 |
| **B. 5 màu trạng thái hiện tại** `#12925a,#2e86de,#e89a12,#d6383d,#a7b1c2` | **FAIL** | độ bão hòa `#a7b1c2` 0,027 (đọc như xám); tương phản `#e89a12` 2,32 |
| **C. 8 mốc heatmap `kpi`** `#cf1322…#237804` | **FAIL** | liền kề `#52c41a`↔`#7cb305` **ΔE 5,5** (mắt thường), 2,3 (deutan); `#faad14` quá sáng |
| **D1. 8 ô danh mục đề xuất** | PASS (WARN CVD 7,2; tương phản ô 3/5/6) | cần nhãn trực tiếp / bảng thay thế |
| **D2. 4 ô đầu đề xuất** | **PASS** | CVD 9,2; mắt thường 27,6 |
| **PA-A** `#1c5cab,#6da7ec,#ec835a,#b02a2a` | **PASS** | CVD 20,5; mắt thường 22,3; WARN tương phản `#6da7ec` 2,5, `#ec835a` 2,64 → cần chữ/biểu tượng |
| **PA-B** `#0ca30c,#fab219,#ec835a,#d03b3b` | **FAIL** | dải độ sáng; mắt thường vàng↔cam 13,6 (< 15) |
| **PA-C** teal/vàng đất/cam/đỏ | **FAIL** | độ bão hòa teal; vàng đất↔cam 5,7 |

*Ghi chú:* validator được thiết kế cho bảng màu **phân loại**; với màu **trạng thái có thứ tự** kết quả mang tính tham chiếu, và quy tắc cuối cùng là "luôn có biểu tượng + chữ".

**Độ tương phản WCAG đã tính (chữ/nền):**

| Cặp | Tỷ lệ | Đạt 4,5:1? |
|---|---|---|
| `--muted #66758c` / trắng | 4,68 | ✓ |
| `--muted #66758c` / nền trang `#f2f5fa` | **4,28** | ✗ |
| Chip Đạt `#12925a` / `#e3f5ec` | **3,51** | ✗ |
| Chip Khá `#1b67b5` / `#e5f0fc` | 4,98 | ✓ |
| Chip CCT `#a46700` / `#fdf2dc` | **4,19** | ✗ |
| Chip Chưa đạt `#d6383d` / `#fde6e6` | **3,93** | ✗ |
| Chữ trắng trên ô heatmap `#ff7a45` | **2,59** | ✗ |
| Chân sidebar (`opacity:.6`) / `#005993` | **3,14** | ✗ |
| Mục nhóm menu (`opacity:.7`) / `#004573` | 4,75 | ✓ |
| `brand-red #d71249` / trắng | 5,16 | ✓ |
| Đạt `#12925a` ↔ Chưa đạt `#d6383d` (tỷ lệ độ sáng) | **1,18** | cần ≥ 3 |
| `#d71249` ↔ `#d6383d` (đỏ thương hiệu vs "Chưa đạt") | **1,10** | dễ nhầm |

## Phụ lục B — Nợ CSS/JS phát hiện khi đọc (không ảnh hưởng số liệu)

| # | Vấn đề | Vị trí |
|---|---|---|
| 1 | Biến CSS dùng nhưng **chưa khai báo**: `--border`, `--dat`, `--chua`, `--card-hover` (đang chạy nhờ giá trị dự phòng trong `var(x, #fallback)`) | [views-theo-doi.js:238-239](App/js/views-theo-doi.js#L238), [:247](App/js/views-theo-doi.js#L247), [:266-267](App/js/views-theo-doi.js#L266) |
| 2 | Lớp `btn-sm` được dùng nhưng CSS chỉ có `.btn.sm` | [views-theo-doi.js:240](App/js/views-theo-doi.js#L240) |
| 3 | Khối CSS **lặp nguyên văn**: "Theo dõi chỉ tiêu" (dòng 394-403 và 405-414); `.ic` khai báo 2 lần (50, 432); `.hc.hang1`, `.hc.ref`, `.heat` khai báo nhiều lần | [app.css](App/css/app.css) |
| 4 | Hai mã xanh khác nhau: CSS `#005993`, JS `#0E4C92` và `rgba(14,76,146,.08)`; vòng focus `rgba(11,79,156,.25)` là mã thứ ba | [views-theo-doi.js:112](App/js/views-theo-doi.js#L112), [:164](App/js/views-theo-doi.js#L164), [app.css:96](App/css/app.css#L96) |
| 5 | Hiệu ứng thanh `barIn` nhắm `.tile .bar i, .bar > i` nhưng thanh thực tế là `.pbar` → **quy tắc không có tác dụng** | [app.css:443](App/css/app.css#L443), [ui.js:37](App/js/ui.js#L37) |
| 6 | Style nội tuyến dài trong chuỗi JS (bảng thẻ điểm, phần "Điểm thi đua") và `onclick` nội tuyến ở `.scrim` | [views-theo-doi.js:238-267](App/js/views-theo-doi.js#L238), [index.html:19](App/index.html#L19) |
| 7 | `font-weight` 650 và 800 không có file tương ứng | [app.css:27](App/css/app.css#L27), [:452](App/css/app.css#L452) |
| 8 | `kiemTraSo`, `duBaoXepHang` gọi hai lần trong màn điều hành; `scoreSeries` gọi trong vòng lặp `đơn vị × 12` ở Tổng quan | [views-van-hanh.js:14](App/js/views-van-hanh.js#L14), [:141](App/js/views-van-hanh.js#L141), [views-theo-doi.js:109](App/js/views-theo-doi.js#L109) |
