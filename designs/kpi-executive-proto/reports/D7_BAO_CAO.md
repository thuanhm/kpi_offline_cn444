# D7 — Thay ngưỡng cứng 90 bằng cấu hình `nguong`

**Trạng thái:** đã thực hiện **trong prototype**; **chưa** thay đổi bất kỳ dòng nào của ứng dụng chính (`App/`), theo đúng phạm vi giai đoạn 1.

## 1. Kết quả rà soát hằng số 90 trong ứng dụng chính (chỉ đọc)

Tìm `\b90\b` trong `App/js/`: **5 vị trí**, trong đó **2 vị trí là ngưỡng điểm nghiệp vụ**.

| # | Vị trí | Mã hiện tại | Phân loại | Ngưỡng điểm? |
|---|---|---|---|---|
| 1 | `App/js/views-theo-doi.js:64` | `dat90 = rk.filter(function (c) { return c.quy_doi >= 90; }).length` | Đếm đơn vị có điểm quy đổi ≥ 90 | **Có** |
| 2 | `App/js/views-theo-doi.js:73` | `stat('Đơn vị ≥ 90 điểm', dat90 + '/' + rk.length, …)` | Nhãn hiển thị số 90 ở ô thống kê | **Có** (nhãn) |
| 3 | `App/js/ui.js:57` | `rotate(-90 …)` | Góc xoay vòng tròn điểm (SVG) | Không |
| 4 | `App/js/ui.js:302` | `… ? 50 : 90` | Độ rộng tối thiểu cột bảng (px) | Không |
| 5 | `App/js/ui.js:363` | `if (pct >= 90) return '#faad14'` | Một mốc của thang màu 9 bậc `getCompletionColor` (%HT) | Không phải ngưỡng điểm; thuộc thang màu bị thay ở D6 |

`engine.js`, `config.js`, `store.js` và các `views-*.js` còn lại **không** chứa hằng số 90. Cấu hình hiện có `settings.nguong = { dat: 1.0, kha: 0.8, cct: 0.7 }` là **tỷ lệ hoàn thành** (1,0 = 100%), không phải điểm thang 100.

## 2. Quyết định thiết kế cần chủ dự án xác nhận

“Giá trị mặc định của `nguong` là 90” không thể gán trực tiếp cho `nguong.dat` vì:
- `nguong.dat = 1.0` là ngưỡng **tỷ lệ hoàn thành** của từng chỉ tiêu, dùng để chia mức Đạt/Khá/CCT; nếu đổi thành 90 sẽ **đổi nghiệp vụ xếp loại**.
- Hằng số 90 ở vị trí #1 là ngưỡng **điểm quy đổi thang 100**, một khái niệm khác.

Vì vậy prototype thêm **khoá mới trong cùng nhóm cấu hình `nguong`**: `nguong.diem_cao`, mặc định **90**. Ba khoá cũ (`dat`, `kha`, `cct`) giữ nguyên giá trị và ý nghĩa. Nếu chủ dự án muốn đặt tên khác (ví dụ `nguong.diem_noi_bat`), chỉ đổi tên khoá ở một nơi.

## 3. Những gì đã thay đổi trong prototype

| Tệp | Thay đổi |
|---|---|
| `dashboard/src/data/cau_hinh.csv` (sinh bởi `tools/gen-data.mjs`) | Thêm dòng `nguong.diem_cao,90` — **một nguồn cấu hình duy nhất** cho mọi màn hình |
| `dashboard/src/calcs.cjs` → calc `cfg` | Đọc `nguong.diem_cao`; **nếu thiếu, rỗng hoặc không phải số thì dùng 90** (bảo toàn hành vi cũ) |
| `dashboard/src/calcs.cjs` → calc `tong_cn` | `dv_cao` = số đơn vị có `quy_doi >= cfg.diem_cao` (so sánh **≥**, đúng như `>= 90` cũ); trả thêm `diem_cao` |
| `dashboard/src/app.js` → drawing `tq-stats` | Nhãn “Đơn vị ≥ N điểm” lấy N từ `diem_cao` (không viết chữ 90 cố định) |
| `tools/test-d7.mjs` | 25 test (xem mục 4) chạy trực tiếp trên **chính các hàm calc mà trang dùng** |

Không thay đổi: trọng số, công thức điểm, cách xếp hạng, ngưỡng Đạt/Khá/CCT, cấu trúc dữ liệu.

## 4. Test (chạy: `node tools/test-d7.mjs`; kết quả: `reports/test-d7.txt`)

**25/25 đạt.** Các trường hợp theo yêu cầu:

| Trường hợp | Kết quả mong đợi | Đạt |
|---|---|---|
| Điểm **thấp hơn** ngưỡng (89,99; ngưỡng 90) | Không được đếm | ✓ |
| Điểm **bằng** ngưỡng (90; ngưỡng 90) | Được đếm (`>=`) | ✓ |
| Điểm **cao hơn** ngưỡng (90,01; ngưỡng 90) | Được đếm | ✓ |
| Cả ba cùng lúc | Đếm đúng 2 | ✓ |
| Đổi `nguong.diem_cao = 85` | 89,99 giờ được đếm → chứng tỏ giá trị đọc từ cấu hình | ✓ |
| Đổi `nguong.diem_cao = 95` | Không đơn vị nào đạt | ✓ |
| Thiếu khoá / khoá rỗng / giá trị “abc” | Mặc định 90 | ✓ |
| Nhãn hiển thị | Lấy từ cùng nguồn `diem_cao` | ✓ |
| **Bảo toàn hành vi**: với `nguong = 90`, `dv_cao` trùng khít quy tắc cũ `>= 90` (hằng số) ở **mọi kỳ** của dữ liệu mẫu | Giống hệt | ✓ |
| Đổi `diem_cao` **không** làm đổi điểm, xếp hạng, phân loại mức | `xep_hang`, `diem_dv`, `kq` bằng nhau trước/sau | ✓ |
| Phân loại mức tại biên (1,0000 / 0,9999 / 0,8 / 0,7999 / 0,7 / 0,6999 / trống) | Đạt / Khá / Khá / CCT / CCT / Chưa đạt / GAP | ✓ |

## 5. Đề xuất thay đổi khi tích hợp (giai đoạn sau — CHƯA thực hiện)

1. `settings.nguong.diem_cao = 90` thêm vào `CFG.mac_dinh()` và `normalize()` (store.js) — mặc định 90; dữ liệu cũ không có khoá này tự nhận 90.
2. `views-theo-doi.js:64`: `c.quy_doi >= S.nguong.diem_cao` thay cho `>= 90`.
3. `views-theo-doi.js:73`: nhãn `'Đơn vị ≥ ' + num(S.nguong.diem_cao, 0) + ' điểm'`.
4. Giao diện **Dữ liệu & cài đặt** cho phép sửa `nguong.diem_cao` (cùng chỗ đang sửa `dat/kha/cct`).
5. Vị trí #3, #4 không đụng tới. Vị trí #5 xử lý cùng quyết định D6 (bỏ thang màu 9 bậc).

## 6. Kiểm chứng bắt buộc khi tích hợp (theo yêu cầu)

Khi `nguong.diem_cao = 90`, kết quả nghiệp vụ **trước và sau** thay đổi phải **giống hệt**. Quy trình đề xuất:

1. Trên một bản sao dữ liệu **mẫu** (không phải dữ liệu thật), ghi lại số “Đơn vị ≥ 90 điểm” của mọi kỳ trước khi sửa.
2. Sửa theo mục 5; cho `nguong.diem_cao = 90`.
3. So sánh từng kỳ: phải bằng nhau. Thêm vào `tests/` một test bảo vệ hồi quy theo mẫu của `tools/test-d7.mjs` (biên 89,99 / 90 / 90,01).
4. Kiểm tra thêm ít nhất một giá trị khác (ví dụ 85) để chắc chắn mọi màn hình cùng đọc một nguồn.

## 7. Ảnh hưởng dự kiến

- Với `nguong.diem_cao = 90` (mặc định): **không đổi** kết quả hiển thị hay nghiệp vụ.
- Chỉ khi người quản trị chủ động đổi giá trị thì ô “Đơn vị ≥ N điểm” và nhãn đi theo; điểm, hạng, mức không đổi.
