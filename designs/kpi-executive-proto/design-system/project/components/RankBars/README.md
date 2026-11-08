Xếp hạng toàn bộ đơn vị: thanh theo mức, hai vạch ngưỡng Khá/Đạt, thay đổi, GAP, trạng thái.

**Hàm:** `VTB.rankBars(…)` trả về chuỗi HTML đã escape; nạp `tokens.css`, `components/bundle.css`, `components/bundle.js`.

**Bạn cung cấp:** Truyền mảng dòng `{ma,hang,hang_truoc,ten,khoi,diem,gap,tier,delta,series,canhbao}` và `{ng,selected,noSpark}`. Hàng bấm được (role=button).

**Quy tắc:**
- Hiển thị TẤT CẢ đơn vị, không cắt top/bottom.
- Màu thanh = mức; nhãn điểm nằm trong thanh; chip mức luôn có chữ.
