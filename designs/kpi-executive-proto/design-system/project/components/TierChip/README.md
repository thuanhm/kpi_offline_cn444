Nhãn trạng thái KPI gồm biểu tượng khác hình + chữ; không bao giờ chỉ là màu.

**Hàm:** `VTB.tierChip(…)` trả về chuỗi HTML đã escape; nạp `tokens.css`, `components/bundle.css`, `components/bundle.js`.

**Bạn cung cấp:** Truyền mã mức (`dat`, `kha`, `cct`, `chua`, `gap`) và tuỳ chọn `text`/`long`. Mã mức lấy từ `VTB.tierOf(ht, nguong)` — ngưỡng luôn lấy từ cấu hình, không viết cứng.

**Quy tắc:**
- Dùng ở MỌI nơi hiển thị trạng thái: thẻ KPI, bảng, ma trận, danh sách cảnh báo.
- Không tự đổi màu hay bỏ biểu tượng; `gap` nghĩa là chưa có số, không phải 0%.
