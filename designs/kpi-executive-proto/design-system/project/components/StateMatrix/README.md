Ma trận đơn vị × chỉ tiêu: ô nền nhạt 4 mức + biểu tượng + % — thay heatmap cầu vồng.

**Hàm:** `VTB.stateMatrix(…)` trả về chuỗi HTML đã escape; nạp `tokens.css`, `components/bundle.css`, `components/bundle.js`.

**Bạn cung cấp:** Truyền `{cols:[{ct,name}],rows:[{dv,name,cells:{ct:{ht,tier}}}],active}`.

**Quy tắc:**
- Không dùng thang cầu vồng. Mức rời, mỗi ô có biểu tượng + số.
- Ô không áp dụng hiển thị “·”.
