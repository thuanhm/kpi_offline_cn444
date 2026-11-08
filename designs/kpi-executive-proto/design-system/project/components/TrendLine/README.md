Đường theo tháng: thực tế nét LIỀN, DỰ KIẾN nét ĐỨT + nhãn, ngưỡng nét mảnh, nhãn cuối đường.

**Hàm:** `VTB.trendLine(…)` trả về chuỗi HTML đã escape; nạp `tokens.css`, `components/bundle.css`, `components/bundle.js`.

**Bạn cung cấp:** Truyền `{w,h,series:[{name,vals[12]}],refs:[{v,label}],forecast:{from:{i,v},to:{i,v}},yMin,yMax,fmt}`. Chỉ truyền `forecast` khi CÓ dữ liệu dự kiến đầu vào.

**Quy tắc:**
- KHÔNG tự tạo dự báo khi thiếu dữ liệu.
- Số DỰ KIẾN không bao giờ vẽ như số thực tế: nét đứt, điểm đầu rỗng, nhãn DỰ KIẾN, chú giải.
- Mỗi điểm có tooltip + aria-label và focus bàn phím.
