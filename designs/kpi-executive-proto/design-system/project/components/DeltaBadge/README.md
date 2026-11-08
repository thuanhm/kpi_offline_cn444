Thay đổi so kỳ trước: ▲▼ + số có dấu + tên kỳ; màu theo tốt/xấu chứ không theo tăng/giảm.

**Hàm:** `VTB.deltaBadge(…)` trả về chuỗi HTML đã escape; nạp `tokens.css`, `components/bundle.css`, `components/bundle.js`.

**Bạn cung cấp:** Truyền số thay đổi và `{digits, unit, vs, lowerIsBetter}`. Với chỉ tiêu càng thấp càng tốt (nợ xấu) đặt `lowerIsBetter`.

**Quy tắc:**
- Luôn ghi kỳ so sánh (`vs`).
- Có phụ đề ẩn cho trình đọc màn hình (tăng/giảm).
