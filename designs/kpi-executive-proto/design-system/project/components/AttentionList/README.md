Danh sách cảnh báo có mức (biểu tượng + chữ), nội dung, bấm được để xuống chi tiết.

**Hàm:** `VTB.attentionList(…)` trả về chuỗi HTML đã escape; nạp `tokens.css`, `components/bundle.css`, `components/bundle.js`.

**Bạn cung cấp:** Truyền mảng `{muc:1|2|3,loai,text,dv,ct,meta}`. Có `dv`/`ct` thì dòng là nút.

**Quy tắc:**
- Sắp xếp theo mức giảm dần.
- Mức 3 dùng `chua`, 2 dùng `cct`, 1 dùng `gap` — cùng hệ màu trạng thái.
