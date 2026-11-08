# HEATMAP IMPLEMENTATION REPORT

Gồm hai yêu cầu, làm liên tiếp trên nhánh `feature/dual-ui`:

1. **Đồng bộ màu trạng thái KPI toàn New UI** theo bảng quy chuẩn, qua token `--status-*`.
2. **Continuous Heatmap toàn New UI**, qua cơ chế dùng chung `MOI_HEAT`.

Không thay đổi engine, công thức, trọng số, ngưỡng, quy tắc xếp hạng/GAP, dữ liệu hay nhập/xuất. Không thay đổi Legacy UI: `App/css/app.css` và các view cũ trong `App/js/` không bị sửa.

## Kiến trúc

```
engine.js (không đổi) ─► MOI_DATA (tier = E.trangThai, ht nguyên của engine)
                               │
moi-heat.js  MOI_HEAT ◄────────┤ pos(ht, tier, ng) → màu → mực chữ
                               │
vtb.js       VTB.heat / hmVars / heatLegend / heatPill ─► kpiCard, rankBars, bulletRow, stateMatrix
moi-views2   Ma trận + Theo dõi chỉ tiêu  ─► MOI_HEAT (không còn thang riêng)
moi-shell    render(): MOI_HEAT.cfg(M.ng); màn cũ: thay UI.htColor/heatStyleHT khi New UI bật, khôi phục khi thoát; tô lại .pbar
moi-tokens   --status-* (nguồn duy nhất) ◄─ --tier-*, --mx-*, --c-*/--t-* (bí danh)
```

## File đã sửa hoặc thêm

| File | Thay đổi |
|---|---|
| `App/ui-moi/moi-heat.js` (**mới**) | Cơ chế Heatmap thuần: thang 10 điểm, dải theo mức, nội suy, chọn mực chữ theo tương phản, gradient/mốc chú giải. |
| `App/js/ui-switch.js` | Thêm `ui-moi/moi-heat.js` vào danh sách nạp của giao diện mới (1 dòng). Không ảnh hưởng giao diện cũ. |
| `App/ui-moi/moi-tokens.css` | Thêm `--status-*-bg/-text/-line`. `--tier-*`, `--success/--warning/--danger/--neutral`, `--delta-*` trỏ về `--status-*`. |
| `App/ui-moi/moi-matrix.css` | `--mx-*` thành bí danh của `--status-*`. Chữ ô Heatmap dùng `--hi`. Chú giải nằm cùng hàng dải đếm/lọc để trình chiếu vừa khung. |
| `App/ui-moi/moi-components.css` | Quy tắc `.vtb-hm`, `.vtb-hm-on`, `.vtb-hm-dot`, `.vtb-hm-pill`, chú giải gọn. Viền GAP nét đứt dùng `--status-gap-text`. |
| `App/ui-moi/moi-layout.css` | `--c-*`/`--t-*` của màn cũ trong vỏ mới trỏ về `--status-*`. Ghi đè chữ trạng thái màn cũ (chip, txt, hc, delta, al, wsum…) về `--status-*-text`. Ô nhập lỗi dùng nền đỏ nhạt. Nút quản trị dùng màu thương hiệu. |
| `App/ui-moi/moi-brand.css` | Vạch trên thẻ KPI: Heatmap khi có %HT, thương hiệu khi GAP. |
| `App/ui-moi/moi-shell.js` | `MOI_HEAT.cfg(M.ng)` mỗi lần vẽ. Thay `UI.htColor`/`UI.heatStyleHT` bằng Heatmap khi New UI bật và khôi phục khi thoát. `toLaiThanh()` tô lại thanh `.pbar` của màn cũ. |
| `App/ui-moi/vtb.js` | `heat`, `hmVars`, `heatLegend`, `heatPill`. Thẻ KPI, xếp hạng, bullet và stateMatrix tô Heatmap. |
| `App/ui-moi/moi-views.js` | Thẻ KPI nhận `htv` (%HT số). Thêm chú giải gọn trên bảng xếp hạng và danh sách chỉ tiêu. |
| `App/ui-moi/moi-views2.js` | Ma trận dùng `MOI_HEAT` (bỏ `MX_RAMP`/`heatPos`/`rampAt` riêng). Thêm cột "% hoàn thành KH" vào Theo dõi chỉ tiêu. Thêm chú giải trên Thẻ điểm phòng. |
| `tests/browser-heatmap.mjs` (**mới**) | 38 kiểm thử nghiệm thu Heatmap (mục XII). |
| `tests/screenshots-trang-thai.mjs` (**mới**) | Chụp 12 màn hình trước/sau. |
| `tests/browser-ma-tran.mjs`, `browser-brand.mjs`, `browser-dual-ui.mjs` | Cập nhật assertion còn cố định mã màu cũ (Khá xanh dương, Đạt #1E8449, vạch KPI #80D1F2, "màn khác giữ màu cũ"). |
| `HEATMAP_DESIGN.md` (**mới**), `DESIGN_SYSTEM.md` (mục 10), `HEATMAP_TEST_REPORT.md` (**mới**), `SKILLS_AND_AGENTS_REPORT.md` | Tài liệu. |

## Áp dụng theo màn hình

| Màn | Heatmap | Trạng thái (`--status-*`) |
|---|---|---|
| Tổng quan chi nhánh | Thẻ KPI (vạch + chấm), thanh xếp hạng, thanh % hoàn thành, chú giải | Chip, dải phân bố mức, legend |
| Bảng điều hành BGĐ | Thẻ KPI, thanh xếp hạng, thanh rủi ro | Chip, dải phân bố |
| Xếp hạng phòng/PGD | Thanh điểm theo %HT chung, chú giải | Chip |
| Ma trận chỉ tiêu | Ô, chân bảng Điểm quy đổi, chip lọc (màu đại diện mức), chú giải | Bộ đếm, bộ lọc |
| Thẻ điểm KPI phòng | Thanh % hoàn thành theo chỉ tiêu, chú giải | Chip, dải phân bố |
| Theo dõi chỉ tiêu | Cột "% hoàn thành KH" (mới) | Chip chỉ tiêu quản trị |
| Thẻ điểm BGĐ, Diễn biến ngày, Dự báo, Điểm KPI (màn cũ trong vỏ mới) | `UI.htColor`/`heatStyleHT` → Heatmap; `.pbar` tô lại; biểu đồ cột Chart.js theo %HT | Chip/txt/hc/delta theo `--status-*` |
| Cảnh báo / Nội dung cần xử lý / Biện pháp khắc phục | Không áp dụng: đây là mức nghiêm trọng của cảnh báo, không phải mức độ hoàn thành | Chip mức cảnh báo theo `--status-*` |

## Ngoại lệ còn lại

1. **Chữ GAP #64748B / #E9EDF2 = 4,05:1** (< 4,5 AA). Giữ đúng mã quy chuẩn; bù bằng chữ "GAP" và biểu tượng.
2. **Màn cũ trong vỏ mới**: màu đặt trong mã JS dùng chung với Legacy (bảng màu chuỗi của biểu đồ đường, chú thích dự báo trong `ui.js`, nhãn `views-quan-tri`) không đổi được nếu không sửa Legacy. Các màu đó là màu chuỗi hoặc thông báo hệ thống, không phải trạng thái KPI.
3. **Bảng màu Heatmap người dùng chọn ở màn cũ** (excel/rdylgn/xanh) vẫn được tôn trọng. Chỉ bảng mặc định "kpi" chuyển sang Heatmap chung.
4. **Thẻ điểm BGĐ** cần đăng nhập quản trị; dữ liệu mẫu không mở được nên chưa kiểm tra bằng mắt. Màn này dùng cùng cơ chế với các màn cũ khác.
5. **Mù màu đỏ–lục**: thang đỏ→xanh có giới hạn vốn có; bù bằng số trong ô, nhãn và biểu tượng trạng thái.
6. `--mx-dim-*` (ô bị làm mờ khi lọc) và thang tím của chế độ Thứ hạng/Điểm bị mất vẫn là màu riêng của Ma trận, vì không mang nghĩa trạng thái.

## Ảnh trước/sau

`docs/screenshots/trang-thai/truoc/` (1440×900, 1920×1080) và `docs/screenshots/trang-thai/sau/` (thêm 1366×768): 12 màn hình gồm `tong-quan`, `dieu-hanh`, `xep-hang`, `ma-tran`, `phong`, `the-diem-bgd`, `chi-tieu`, `so-ngay`, `du-bao`, `canh-bao`, `hanh-dong`, `diem-kpi`. Ảnh kiểm thử và trình chiếu nằm trong `tests/out/hm/`.
