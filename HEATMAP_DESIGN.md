# HEATMAP DESIGN — Continuous Heatmap toàn New UI

Áp dụng cho giao diện mới (`body.ui-moi`). Giao diện cũ (Legacy UI) không đổi.

## 1. Hai hệ màu độc lập

| Hệ | Dùng cho | Nguồn |
|---|---|---|
| **Thương hiệu VietinBank** #00538E · #D71249 · #80D1F2 | Header, Sidebar, điều hướng, nút, tiêu đề | `--brand-*` trong `moi-tokens.css` |
| **Heatmap** (thang liên tục) | Mức độ hoàn thành KPI: ô ma trận, thanh xếp hạng, thanh tiến độ, vạch thẻ KPI, ô %HT trong bảng | `App/ui-moi/moi-heat.js` (`MOI_HEAT`) |
| **Trạng thái nghiệp vụ** (5 màu rời) | Phân loại Đạt / Khá / Cần cải thiện / Chưa đạt / GAP: chip, bộ lọc, bộ đếm, dải phân bố, legend trạng thái | `--status-*` trong `moi-tokens.css` |

Màu thương hiệu không bao giờ thay cho màu Heatmap hay màu trạng thái. Đã có test kiểm tra: không phần tử Heatmap nào có nền #00538E, #D71249 hoặc #80D1F2.

## 2. Thang màu

10 điểm màu cách đều, nội suy tuyến tính trong sRGB, giữ nguyên bảng tham chiếu của chủ dự án:

`#F04438 → #F66B35 → #F99536 → #FFBC35 → #FFE43B → #D8E936 → #A9DC32 → #76CA45 → #43B86A → #20A36C`

- Chữ trên nền là `#0F172A` hoặc trắng, tự chọn theo tương phản cao hơn. Thực tế mọi điểm trên thang đều dùng chữ `#0F172A`, tương phản thấp nhất **4,75:1**, đạt WCAG AA. Mực `#1B2333` cũ chỉ đạt 4,19:1 ở hai đầu thang nên đã được thay.
- Không gradient trong ô: mỗi ô là một màu đặc. Gradient chỉ xuất hiện ở thanh chú giải.

## 3. Chuẩn hóa: từ kết quả KPI đến vị trí trên thang

Đầu vào lấy nguyên từ engine, không tính lại:

1. `ht`: % hoàn thành KH lũy kế. Engine đã quy mọi chiều đánh giá về "cao là tốt":
   - `cao_tot`: TH ÷ KH (dư nợ, huy động, CASA, NII, thu dịch vụ…).
   - `thap_tot`: KH ÷ TH (tỷ lệ nợ xấu…). TH càng thấp so với ngưỡng thì ht càng cao, màu càng xanh.
   - `nhap_ty_le`: số nhập ÷ 100.
2. `tier`: mức do engine xếp (`E.trangThai` với ngưỡng cấu hình `M.ng`).
3. `ng`: ngưỡng cấu hình (dat / kha / cct). Không tạo ngưỡng mới.

**Mức chọn dải, %HT chọn điểm trong dải**, nên màu không bao giờ mâu thuẫn với trạng thái:

| Mức | Dải trên thang | %HT trong mức (ngưỡng mặc định) | Sắc |
|---|---|---|---|
| Chưa đạt | 0 – 0,30 | (ng.cct − 30 điểm %) → ng.cct, tức 40% → 70% | đỏ → cam |
| Cần cải thiện | 0,30 – 0,46 | ng.cct → ng.kha, tức 70% → 80% | cam vàng → vàng |
| Khá | 0,46 – 0,66 | ng.kha → ng.dat, tức 80% → 100% | vàng → xanh vàng |
| Đạt | 0,66 – 1 | ng.dat → ng.dat + 30 điểm %, tức 100% → 130% | xanh lá nhạt → xanh lá đậm |

Giá trị ngoài biên được kẹp ở đầu dải. Mức có nhưng thiếu %HT thì lấy giữa dải.

## 4. Trường hợp đặc biệt

| Trường hợp | Hiển thị |
|---|---|
| GAP: thiếu số hoặc thiếu cấu hình (`Thiếu dữ liệu`, `Thiếu cấu hình`) | `MOI_HEAT.of` trả `null`. Nền xám `--status-gap-bg`, chữ "GAP" và biểu tượng nét đứt. Không bị coi là 0% hay Chưa đạt, không cộng vào bộ đếm Chưa đạt. |
| Không áp dụng (đơn vị không có chỉ tiêu) | Dấu "·" trên nền trắng, không phải một trạng thái. |
| Khoảng mục tiêu | Danh mục hiện **không có** metadata này (chỉ có `cao_tot`, `thap_tot`, `nhap_ty_le`). Không tự suy diễn. Nếu sau này có, chỉ cần engine quy về `ht`, Heatmap tự dùng được. |
| Chế độ Thứ hạng và Điểm bị mất (Ma trận) | Không phải mức độ hoàn thành nên dùng thang một tông tím riêng, không dùng Heatmap. |

## 5. Áp dụng theo thành phần

| Thành phần | Cách thể hiện |
|---|---|
| Thẻ KPI | Nền trắng; vạch trên 4px và chấm cạnh %HT mang màu Heatmap. Thẻ GAP giữ vạch thương hiệu nhạt. |
| Ma trận chỉ tiêu | Nền ô = Heatmap, chữ = màu mực tự chọn. Chip lọc dùng màu đại diện của mức. Lọc trạng thái: ô thuộc mức giữ màu, ô khác làm mờ, không xóa hàng/cột. |
| Bảng xếp hạng | Thanh điểm tô theo %HT chung; thứ tự = hạng chính thức của engine. |
| Thanh % hoàn thành (bullet) | Thanh tô Heatmap; vạch đen = mức kế hoạch 100%. Đây không phải tiến độ thời gian. |
| Bảng so sánh (Theo dõi chỉ tiêu) | Cột "% hoàn thành KH" dạng ô Heatmap. |
| Màn cũ trong vỏ mới | `UI.htColor` và `UI.heatStyleHT` được thay bằng Heatmap chung khi New UI bật, khôi phục khi thoát. Thanh `.pbar` được tô lại. Biểu đồ cột Chart.js của màn cũ cũng nhận màu này. |
| Legend | `VTB.heatLegend()` dùng chung: thang liên tục, mốc = ngưỡng cấu hình, ô GAP và tooltip giải thích chiều đánh giá. Chỉ cần một thang vì mọi chỉ tiêu dùng chung ngưỡng cấu hình và chung đơn vị %HT. |

## 6. Khả năng tiếp cận

- Không chỉ dựa vào màu: mỗi ô có số. Trạng thái có chip với biểu tượng khác hình và nhãn chữ, kèm tooltip KH/TH/%HT/trạng thái.
- Thang đỏ–xanh khó phân biệt với người mù màu đỏ–lục. Validator của skill `dataviz` đo ΔE vàng↔xanh vàng = 5,2 (protan). Đây là giới hạn đã biết, được bù bằng số trong ô và nhãn trạng thái.
- `forced-colors`: ô và chấm Heatmap giữ màu (`forced-color-adjust: none`).
