/* MOI-HEAT — CƠ CHẾ HEATMAP DÙNG CHUNG cho toàn bộ giao diện mới (thuần, không đụng DOM, không phụ thuộc engine).
 * Một nguồn duy nhất: mọi thành phần (ô ma trận, thẻ KPI, thanh tiến độ, xếp hạng, biểu đồ, màn hình cũ trong vỏ mới) gọi các hàm ở đây.
 *
 * ĐẦU VÀO đều là kết quả ENGINE đã tính, KHÔNG tính lại:
 *   ht   — % hoàn thành KH lũy kế (r.ht). Engine đã quy về cùng chiều "cao là tốt":
 *          cao_tot = TH/KH · thap_tot = KH/TH (VD tỷ lệ nợ xấu: càng thấp so với ngưỡng → ht càng cao → càng xanh) · nhap_ty_le = số nhập / 100.
 *          Hệ thống KHÔNG có metadata "khoảng mục tiêu" → không tự suy diễn; nếu sau này có, chỉ cần quy về ht ở engine.
 *   tier — mức do engine xếp (dat/kha/cct/chua/gap). Màu luôn nằm TRONG DẢI của mức này nên không bao giờ mâu thuẫn bộ lọc/bộ đếm.
 *   ng   — ngưỡng cấu hình (M.ng: dat/kha/cct). Không tạo ngưỡng mới.
 * ĐẦU RA: vị trí 0..1 trên thang, màu nền (#rrggbb) và màu chữ có tương phản cao nhất. Giá trị KPI gốc không bị đổi.
 * GAP (thiếu số / thiếu cấu hình) → null: thành phần hiển thị nền trung tính --status-gap-*; KHÔNG coi là 0% hay Chưa đạt. */
(function (root) {
  'use strict';
  /* Thang 10 điểm màu Đỏ → Cam → Vàng → Xanh lá (theo bảng tham khảo của chủ dự án). Các điểm cách đều, nội suy tuyến tính trong sRGB. */
  var STOPS = ['#F04438', '#F66B35', '#F99536', '#FFBC35', '#FFE43B', '#D8E936', '#A9DC32', '#76CA45', '#43B86A', '#20A36C'];
  /* Dải vị trí của từng mức trên thang: Chưa đạt = đỏ→cam, Cần cải thiện = cam vàng→vàng, Khá = vàng→xanh vàng, Đạt = xanh lá. */
  var BAND = { chua: [0, 0.3], cct: [0.3, 0.46], kha: [0.46, 0.66], dat: [0.66, 1] };
  /* Biên %HT trong mỗi mức (lấy từ ngưỡng cấu hình): Chưa đạt trải từ (ng.cct − 0,3) đến ng.cct; Đạt trải từ ng.dat đến ng.dat + 0,3 (vượt hơn vẫn là xanh đậm nhất). */
  var SPAN_DUOI = 0.3, SPAN_TREN = 0.3;
  var INK_DARK = '#0F172A', INK_LIGHT = '#FFFFFF';
  var NG = { dat: 1, kha: 0.8, cct: 0.7 };

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function cfg(ng) { if (ng && isNum(ng.dat) && isNum(ng.kha) && isNum(ng.cct)) NG = { dat: ng.dat, kha: ng.kha, cct: ng.cct }; return NG; }
  function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  function toHex(a) { return '#' + a.map(function (v) { v = Math.round(Math.max(0, Math.min(255, v))); return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase(); }
  /* Màu tại vị trí p (0..1) — nội suy liên tục giữa 10 điểm */
  function at(p) {
    p = Math.max(0, Math.min(1, isNum(p) ? p : 0));
    var f = p * (STOPS.length - 1), i = Math.min(STOPS.length - 2, Math.floor(f)), k = f - i, a = hex(STOPS[i]), b = hex(STOPS[i + 1]);
    return toHex([0, 1, 2].map(function (j) { return a[j] + (b[j] - a[j]) * k; }));
  }
  function lum(c) { return hex(c).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (s, v, j) { return s + v * [0.2126, 0.7152, 0.0722][j]; }, 0); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function ink(bg) { return contrast(bg, INK_DARK) >= contrast(bg, INK_LIGHT) ? INK_DARK : INK_LIGHT; }
  /* Biên %HT [thấp, cao] của mức t theo ngưỡng cấu hình */
  function edges(t, ng) {
    ng = ng || NG;
    return t === 'chua' ? [ng.cct - SPAN_DUOI, ng.cct] : t === 'cct' ? [ng.cct, ng.kha] : t === 'kha' ? [ng.kha, ng.dat] : t === 'dat' ? [ng.dat, ng.dat + SPAN_TREN] : null;
  }
  /* Vị trí chuẩn hóa: mức (engine) chọn dải, %HT (engine) chọn điểm trong dải. Mức có nhưng thiếu %HT → giữa dải. GAP → null. */
  function pos(ht, t, ng) {
    var B = BAND[t]; if (!B) return null;
    if (!isNum(ht)) return (B[0] + B[1]) / 2;
    var e = edges(t, ng), u = e[1] > e[0] ? (ht - e[0]) / (e[1] - e[0]) : 1;
    return B[0] + (B[1] - B[0]) * Math.max(0, Math.min(1, u));
  }
  /* Kết quả đầy đủ cho một giá trị: { pos, bg, ink, tier } hoặc null (GAP / không áp dụng) */
  function of(ht, t, ng) { var p = pos(ht, t, ng); if (p === null) return null; var bg = at(p); return { pos: p, bg: bg, ink: ink(bg), tier: t }; }
  function color(ht, t, ng) { var h = of(ht, t, ng); return h ? h.bg : null; }
  /* Màu đại diện của một mức — dùng cho chip lọc/chú giải theo mức (Chưa đạt lấy gần đầu đỏ, Đạt lấy vùng xanh lá đậm để đọc đúng nghĩa) */
  var REP = { chua: 0.05, cct: 0.38, kha: 0.56, dat: 0.85 };
  function band(t) { return REP[t] != null ? at(REP[t]) : null; }
  /* Chuỗi CSS linear-gradient của toàn thang (cho chú giải) */
  function gradient(dir) { return 'linear-gradient(' + (dir || '90deg') + ',' + STOPS.map(function (c, i) { return c + ' ' + Math.round(i / (STOPS.length - 1) * 1000) / 10 + '%'; }).join(',') + ')'; }
  /* Các mốc chú giải: vị trí trên thang + nhãn %HT tương ứng với ngưỡng cấu hình */
  function ticks(ng) { ng = ng || NG; return [{ p: BAND.cct[0], v: ng.cct }, { p: BAND.kha[0], v: ng.kha }, { p: BAND.dat[0], v: ng.dat }]; }

  root.MOI_HEAT = { STOPS: STOPS, BAND: BAND, INK_DARK: INK_DARK, cfg: cfg, at: at, pos: pos, of: of, color: color, band: band, ink: ink, contrast: contrast, edges: edges, gradient: gradient, ticks: ticks };
})(window);
