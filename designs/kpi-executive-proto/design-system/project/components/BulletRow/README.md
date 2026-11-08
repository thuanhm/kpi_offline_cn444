Một chỉ tiêu: thanh thực hiện so kế hoạch (vạch đen = 100%), %HT, GAP, mức.

**Hàm:** `VTB.bulletRow(…)` trả về chuỗi HTML đã escape; nạp `tokens.css`, `components/bundle.css`, `components/bundle.js`.

**Bạn cung cấp:** Truyền `{id,name,nhom,ht,tier,thTxt,khTxt,gapTxt,gapBad,cap,active}`. `ht` rỗng → thanh GAP nét đứt.

**Quy tắc:**
- GAP (thiếu số) vẽ viền nét đứt, không phải thanh rỗng 0%.
- Với số DỰ KIẾN, ghi chữ DỰ KIẾN ở `thTxt`.
