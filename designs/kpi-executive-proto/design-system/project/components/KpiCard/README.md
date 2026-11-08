Thẻ chỉ tiêu: tên, mức, giá trị, kế hoạch, %HT, thay đổi, xu hướng; bấm/Enter để xem chi tiết.

**Hàm:** `VTB.kpiCard(…)` trả về chuỗi HTML đã escape; nạp `tokens.css`, `components/bundle.css`, `components/bundle.js`.

**Bạn cung cấp:** Truyền `{id,label,value,unit,sub,ht,tier,delta,spark,active}`. Có `id` thì thẻ là nút (role=button, tabindex=0).

**Quy tắc:**
- Thứ bậc: tên → giá trị → kế hoạch → %HT.
- Thẻ đang chọn dùng viền `brand-blue` 1px + vòng 1px, không đổ bóng.
