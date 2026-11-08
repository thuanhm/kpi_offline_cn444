/* VietinBank KPI — thư viện thành phần (HTML/SVG thuần, một script cổ điển).
 * Gán window.VTB. Không phụ thuộc React, thư viện ngoài, store.js hay engine.js.
 * Mọi hàm trả về CHUỖI HTML đã escape; màu lấy từ biến CSS của tokens.css. */
(function (w) {
  'use strict';
  var TIERS = ['dat', 'kha', 'cct', 'chua', 'gap'];
  var LABEL = { dat: 'Đạt', kha: 'Khá', cct: 'Cần cải thiện', chua: 'Chưa đạt', gap: 'GAP' };
  var LABEL_LONG = { dat: 'Đạt', kha: 'Khá', cct: 'Cần cải thiện', chua: 'Chưa đạt', gap: 'GAP (thiếu số)' };
  // Biểu tượng KHÁC HÌNH cho từng mức → không phụ thuộc màu (viewBox 16×16, nét 1.8)
  var ICON = {
    dat: '<circle cx="8" cy="8" r="6.2" fill="currentColor" stroke="none"/><path d="M5 8.2l2.1 2.1L11 6.1" stroke="var(--on-fill,#fff)" stroke-width="1.9"/>',
    kha: '<circle cx="8" cy="8" r="6" fill="none"/><path d="M5 8.2l2.1 2.1L11 6.1"/>',
    cct: '<path d="M8 2.2l6.2 11H1.8z" fill="none"/><path d="M8 6.4v3.2M8 11.6v.1"/>',
    chua: '<circle cx="8" cy="8" r="6.2" fill="currentColor" stroke="none"/><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="var(--on-fill,#fff)" stroke-width="1.9"/>',
    gap: '<circle cx="8" cy="8" r="6" fill="none" stroke-dasharray="2.2 2.2"/><path d="M5.2 8h5.6"/>',
  };
  var NF = {};
  function nf(d) { return NF[d] || (NF[d] = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d })); }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function num(v, d) { return isNum(v) ? nf(d == null ? 1 : d).format(v) : '–'; }
  function pct(r, d) { return isNum(r) ? nf(d == null ? 0 : d).format(r * 100) + '%' : '–'; }
  function sgn(v, d) { return isNum(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(d == null ? 1 : d).format(Math.abs(v)) : '–'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tierOf(ht, ng) {
    if (!isNum(ht)) return 'gap';
    return ht >= ng.dat ? 'dat' : ht >= ng.kha ? 'kha' : ht >= ng.cct ? 'cct' : 'chua';
  }
  function svgIcon(t, cls) {
    return '<svg class="vtb-ic ' + (cls || '') + '" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ICON[t] + '</svg>';
  }

  /* ---------- TierChip: biểu tượng + nhãn chữ (không chỉ màu) ---------- */
  function tierChip(t, opt) {
    opt = opt || {}; var txt = opt.text != null ? opt.text : (opt.long ? LABEL_LONG[t] : LABEL[t]);
    return '<span class="vtb-chip vtb-t-' + t + '" data-tier="' + t + '">' + svgIcon(t) + '<span>' + esc(txt) + '</span></span>';
  }

  /* ---------- DeltaBadge: ▲▼ + số có dấu + tên kỳ; màu theo tốt/xấu, không theo tăng/giảm ---------- */
  function deltaBadge(v, opt) {
    opt = opt || {};
    if (!isNum(v)) return '<span class="vtb-delta is-flat">–</span>';
    var good = opt.lowerIsBetter ? v < 0 : v > 0, flat = Math.abs(v) < Math.pow(10, -(opt.digits == null ? 1 : opt.digits)) / 2;
    var cls = flat ? 'is-flat' : good ? 'is-good' : 'is-bad', glyph = flat ? '●' : v > 0 ? '▲' : '▼';
    return '<span class="vtb-delta ' + cls + '"><span aria-hidden="true">' + glyph + '</span> ' + num(Math.abs(v), opt.digits == null ? 1 : opt.digits) + (opt.unit || '') + (opt.vs ? ' <span class="vtb-delta-vs">' + esc(opt.vs) + '</span>' : '') +
      '<span class="vtb-sr"> (' + (flat ? 'không đổi' : v > 0 ? 'tăng' : 'giảm') + (opt.vs ? ' ' + esc(opt.vs) : '') + ')</span></span>';
  }

  /* ---------- Sparkline SVG (có điểm cuối; dự kiến nét đứt nếu có) ---------- */
  function sparkline(vals, opt) {
    opt = opt || {}; var W = opt.w || 96, H = opt.h || 28, p = 3;
    var pts = []; vals.forEach(function (v, i) { if (isNum(v)) pts.push([i, v]); });
    if (pts.length < 2) return '<svg class="vtb-spark" width="' + W + '" height="' + H + '" role="img" aria-label="Chưa đủ dữ liệu xu hướng"></svg>';
    var lo = Math.min.apply(null, pts.map(function (q) { return q[1]; })), hi = Math.max.apply(null, pts.map(function (q) { return q[1]; }));
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    var X = function (i) { return p + (i / (vals.length - 1)) * (W - 2 * p); }, Y = function (v) { return H - p - ((v - lo) / (hi - lo)) * (H - 2 * p); };
    var d = pts.map(function (q, k) { return (k ? 'L' : 'M') + X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1); }).join(' '), last = pts[pts.length - 1];
    var lab = opt.label || ('Xu hướng: từ ' + num(pts[0][1], 1) + ' đến ' + num(last[1], 1));
    return '<svg class="vtb-spark" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(lab) + '"><path d="' + d + '" fill="none" stroke="var(--series-1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' + X(last[0]).toFixed(1) + '" cy="' + Y(last[1]).toFixed(1) + '" r="3" fill="var(--series-1)" stroke="var(--surface-card)" stroke-width="2"/></svg>';
  }

  /* ---------- TierBar: dải 100% theo mức, khe 2px, nhãn trực tiếp + chú giải số ---------- */
  function tierBar(counts, opt) {
    opt = opt || {}; var tot = 0; TIERS.forEach(function (t) { tot += counts[t] || 0; });
    var seg = TIERS.filter(function (t) { return counts[t]; }).map(function (t) {
      return '<span class="vtb-seg vtb-f-' + t + '" style="flex:' + counts[t] + ' 1 0" data-tier="' + t + '" title="' + esc(LABEL_LONG[t]) + ': ' + counts[t] + '/' + tot + '">' + (counts[t] / tot >= 0.09 ? '<b>' + counts[t] + '</b>' : '') + '</span>';
    }).join('');
    var leg = TIERS.map(function (t) { return '<li class="vtb-t-' + t + '">' + svgIcon(t) + '<span>' + esc(LABEL[t]) + '</span> <b>' + (counts[t] || 0) + '</b></li>'; }).join('');
    return '<div class="vtb-tierbar" role="img" aria-label="' + esc(TIERS.map(function (t) { return LABEL[t] + ' ' + (counts[t] || 0); }).join(', ') + ' trên tổng ' + tot) + '"><div class="vtb-seg-row">' + seg + '</div></div><ul class="vtb-tier-legend">' + leg + '</ul>';
  }

  /* ---------- HeroFigure: MỘT số chính ---------- */
  function heroFigure(o) {
    return '<div class="vtb-hero"><div class="vtb-label">' + esc(o.label) + '</div><div class="vtb-hero-row"><span class="vtb-hero-num">' + esc(o.value) + '</span>' + (o.unit ? '<span class="vtb-hero-unit">' + esc(o.unit) + '</span>' : '') + '</div>' +
      '<div class="vtb-hero-meta">' + (o.tier ? tierChip(o.tier) : '') + (o.delta || '') + '</div>' + (o.spark ? '<div class="vtb-hero-spark">' + o.spark + '</div>' : '') + (o.note ? '<div class="vtb-caption">' + esc(o.note) + '</div>' : '') + '</div>';
  }

  /* ---------- StatTile / KpiCard ---------- */
  function kpiCard(o) { // o: {id,label,value,unit,kh,ht,gap,tier,spark,delta,active}
    var attrs = o.id ? ' data-ct="' + esc(o.id) + '" role="button" tabindex="0" aria-pressed="' + (o.active ? 'true' : 'false') + '"' : '';
    return '<div class="vtb-kpi vtb-bd-' + o.tier + (o.active ? ' is-active' : '') + '"' + attrs + ' aria-label="' + esc(o.label + ': ' + o.value + (o.unit ? ' ' + o.unit : '') + ', ' + LABEL_LONG[o.tier]) + '">' +
      '<div class="vtb-kpi-top"><span class="vtb-label">' + esc(o.label) + '</span>' + tierChip(o.tier) + '</div>' +
      '<div class="vtb-kpi-val"><span class="vtb-display">' + esc(o.value) + '</span><span class="vtb-caption">' + esc(o.unit || '') + '</span></div>' +
      '<div class="vtb-kpi-sub vtb-caption">' + esc(o.sub || '') + '</div>' +
      '<div class="vtb-kpi-foot"><span class="vtb-kpi-ht">' + esc(o.ht) + '</span>' + (o.delta || '') + '<span class="vtb-kpi-spark">' + (o.spark || '') + '</span></div></div>';
  }
  function statTile(o) { return '<div class="vtb-stat"><div class="vtb-label">' + esc(o.label) + '</div><div class="vtb-display">' + (o.valueHtml != null ? o.valueHtml : esc(o.value)) + '</div><div class="vtb-caption">' + esc(o.sub || '') + '</div></div>'; }

  /* ---------- RankBars: xếp hạng đầy đủ; thanh theo mức + nhãn trực tiếp; hàng bấm được ---------- */
  function rankBars(rows, o) { // rows: {ma,hang,hang_truoc,ten,khoi,diem,gap,tier,delta,series,canhbao}
    o = o || {}; var max = o.max || 110, ng = o.ng; 
    var head = '<div class="vtb-rk-head vtb-caption" aria-hidden="true"><span>Hạng</span><span>Đơn vị</span><span class="vtb-rk-scale">Điểm KPI (thang 100)</span><span class="vtb-r">So kỳ trước</span><span class="vtb-r">GAP điểm</span><span>Trạng thái</span></div>';
    var body = rows.map(function (r) {
      var mv = r.hang && r.hang_truoc ? r.hang_truoc - r.hang : 0, mvTxt = !r.hang || !r.hang_truoc ? '–' : mv > 0 ? '▲' + mv : mv < 0 ? '▼' + (-mv) : '●';
      return '<div class="vtb-rk-row' + (o.selected === r.ma ? ' is-active' : '') + '" data-dv="' + esc(r.ma) + '" role="button" tabindex="0" aria-pressed="' + (o.selected === r.ma ? 'true' : 'false') + '" aria-label="' + esc('Hạng ' + (r.hang || 'chưa xếp') + ', ' + r.ten + ', ' + num(r.diem, 1) + ' điểm, ' + LABEL_LONG[r.tier]) + '" data-tip="' + esc(r.ten + ' · hạng ' + (r.hang || '–') + ' · ' + num(r.diem, 1) + ' điểm · GAP ' + sgn(r.gap, 1) + ' điểm' + (r.hang_truoc ? ' · hạng kỳ trước ' + r.hang_truoc : '')) + '">' +
        '<span class="vtb-rk-no">' + (r.hang || '–') + '<small class="' + (mv > 0 ? 'is-good' : mv < 0 ? 'is-bad' : '') + '">' + mvTxt + '</small></span>' +
        '<span class="vtb-rk-name"><b>' + esc(r.ten) + '</b><small>' + esc(r.khoi || '') + '</small></span>' +
        '<span class="vtb-rk-bar"><i class="vtb-f-' + r.tier + '" style="width:' + (isNum(r.diem) ? Math.min(100, Math.max(0, r.diem / max * 100)) : 0) + '%"></i><em>' + num(r.diem, 1) + '</em>' + '<b class="vtb-rk-l" style="left:' + (ng.kha * 100 / max * 100) + '%"></b><b class="vtb-rk-l" style="left:' + (ng.dat * 100 / max * 100) + '%"></b></span>' +
        '<span class="vtb-r">' + (o.noSpark ? '' : (r.series ? sparkline(r.series, { w: 64, h: 22 }) : '')) + deltaBadge(r.delta, { digits: 1 }) + '</span>' +
        '<span class="vtb-r vtb-num ' + (r.gap < 0 ? 'is-bad' : 'is-good') + '">' + sgn(r.gap, 1) + '</span>' +
        '<span>' + tierChip(r.tier) + (r.canhbao ? '<span class="vtb-warn">' + esc(r.canhbao) + '</span>' : '') + '</span></div>';
    }).join('');
    return '<div class="vtb-rank">' + head + body + '</div>';
  }

  /* ---------- BulletRow: thực hiện so kế hoạch (vạch 100%), kèm GAP + nhãn ---------- */
  function bulletRow(r) { // r: {id,name,nhom,ht,tier,thTxt,khTxt,gapTxt,delta,spark,active,cap}
    var cap = r.cap || 1.3, w = isNum(r.ht) ? Math.min(100, Math.max(0, r.ht / cap * 100)) : 0, ref = 100 / cap;
    return '<div class="vtb-bullet' + (r.active ? ' is-active' : '') + '" data-ct="' + esc(r.id) + '" role="button" tabindex="0" aria-pressed="' + (r.active ? 'true' : 'false') + '" aria-label="' + esc(r.name + ': ' + (isNum(r.ht) ? pct(r.ht, 0) + ' kế hoạch' : 'chưa có số') + ', ' + LABEL_LONG[r.tier]) + '">' +
      '<span class="vtb-bl-name"><b>' + esc(r.name) + '</b><small>' + esc(r.nhom || '') + '</small></span>' +
      '<span class="vtb-bl-bar">' + (isNum(r.ht) ? '<i class="vtb-f-' + r.tier + '" style="width:' + w + '%"></i>' : '<i class="vtb-f-gap vtb-hatch" style="width:100%"></i>') + '<b style="left:' + ref + '%"></b></span>' +
      '<span class="vtb-bl-val vtb-num"><b>' + (isNum(r.ht) ? pct(r.ht, 0) : '–') + '</b><small>' + esc(r.thTxt || '') + (r.khTxt ? ' / KH ' + esc(r.khTxt) : '') + '</small></span>' +
      '<span class="vtb-bl-gap vtb-num ' + (r.gapBad ? 'is-bad' : '') + '">' + esc(r.gapTxt || '–') + '</span><span class="vtb-bl-tier">' + tierChip(r.tier) + '</span></div>';
  }

  /* ---------- AttentionList ---------- */
  function attentionList(items) { // items: {muc,loai,text,dv,ct,meta}
    if (!items.length) return '<p class="vtb-empty">Không có nội dung cần xử lý.</p>';
    var LV = { 3: ['chua', 'Nghiêm trọng'], 2: ['cct', 'Cần theo dõi'], 1: ['gap', 'Lưu ý'] };
    return '<ul class="vtb-att">' + items.map(function (x) {
      var l = LV[x.muc] || LV[1], tag = x.dv ? ' data-dv="' + esc(x.dv) + '"' : x.ct ? ' data-ct="' + esc(x.ct) + '"' : x.href ? ' data-href="' + esc(x.href) + '"' : '';
      return '<li class="vtb-att-i' + (tag ? ' is-link' : '') + '"' + tag + (tag ? ' role="button" tabindex="0"' : '') + '><span class="vtb-chip vtb-t-' + l[0] + '">' + svgIcon(l[0]) + '<span>' + l[1] + '</span></span><span class="vtb-att-body"><b>' + esc(x.loai) + '</b> ' + esc(x.text) + (x.meta ? '<small>' + esc(x.meta) + '</small>' : '') + '</span></li>';
    }).join('') + '</ul>';
  }

  /* ---------- ViewAsTable: bảng thay thế cho mọi biểu đồ ---------- */
  function dataTable(o) { // o: {caption, cols:[{k,t,cls}], rows:[{...}], key, source}
    var th = o.cols.map(function (c) { return '<th scope="col"' + (c.cls ? ' class="' + c.cls + '"' : '') + (c.k ? ' data-field="' + esc(c.k) + '"' : '') + '>' + esc(c.t) + '</th>'; }).join('');
    var tr = o.rows.map(function (r) { return '<tr' + (r._key != null ? ' data-key="' + esc(r._key) + '"' : '') + '>' + o.cols.map(function (c) { var v = r[c.k]; return '<td' + (c.cls ? ' class="' + c.cls + '"' : '') + '>' + (c.html ? v : esc(v == null ? '–' : v)) + '</td>'; }).join('') + '</tr>'; }).join('');
    return '<div class="vtb-tablewrap"><table class="vtb-table"><caption class="vtb-sr">' + esc(o.caption || '') + '</caption><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody></table></div>';
  }

  /* ---------- TrendLine: đường thực tế nét liền; DỰ KIẾN nét đứt + nhãn; nhãn trực tiếp ----------
   * o: {w,h, months:12, series:[{name,vals[12 hoặc null],cls}], refs:[{v,label}], forecast:{from:{i,v},to:{i,v},label}, yMin,yMax, fmt, unit} */
  function trendLine(o) {
    var W = o.w || 640, H = o.h || 280, L = 44, R = o.rightPad || 118, T = 16, B = 28, n = o.n || 12, fmt = o.fmt || function (v) { return num(v, 1); };
    var all = []; o.series.forEach(function (s) { s.vals.forEach(function (v) { if (isNum(v)) all.push(v); }); });
    (o.refs || []).forEach(function (r) { all.push(r.v); }); if (o.forecast) all.push(o.forecast.to.v);
    var lo = o.yMin != null ? o.yMin : Math.floor(Math.min.apply(null, all) / 5) * 5, hi = o.yMax != null ? o.yMax : Math.ceil(Math.max.apply(null, all) / 5) * 5;
    var X = function (i) { return L + (i / (n - 1)) * (W - L - R); }, Y = function (v) { return T + (1 - (v - lo) / (hi - lo)) * (H - T - B); };
    var step = (hi - lo) <= 30 ? 10 : (hi - lo) <= 80 ? 20 : Math.pow(10, Math.floor(Math.log10(hi - lo))) / (((hi - lo) / Math.pow(10, Math.floor(Math.log10(hi - lo)))) > 5 ? 1 : 2);
    var g = '', k;
    for (k = Math.ceil(lo / step) * step; k <= hi + 1e-9; k += step) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(k) + '" y2="' + Y(k) + '" stroke="var(--chart-grid)"/><text x="' + (L - 8) + '" y="' + (Y(k) + 4) + '" text-anchor="end" class="vtb-axis">' + fmt(k) + '</text>';
    for (k = 0; k < n; k++) g += '<text x="' + X(k) + '" y="' + (H - 8) + '" text-anchor="middle" class="vtb-axis">T' + (k + 1) + '</text>';
    var refs = (o.refs || []).map(function (r) { return '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(r.v) + '" y2="' + Y(r.v) + '" stroke="var(--chart-ref)" stroke-width="1"/><text x="' + (L + 6) + '" y="' + (Y(r.v) - 5) + '" class="vtb-axis vtb-ref">' + esc(r.label) + '</text>'; }).join('');
    var lines = '', labels = [], dots = '';
    o.series.forEach(function (s, si) {
      var segs = [], cur = []; s.vals.forEach(function (v, i) { if (isNum(v)) cur.push([i, v]); else if (cur.length) { segs.push(cur); cur = []; } }); if (cur.length) segs.push(cur);
      var col = s.color || 'var(--series-1)';
      segs.forEach(function (sg) { lines += '<path d="' + sg.map(function (q, j) { return (j ? 'L' : 'M') + X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1); }).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="' + (s.thin ? 1.6 : 2.5) + '" stroke-linecap="round" stroke-linejoin="round"/>'; });
      var last = null; s.vals.forEach(function (v, i) { if (isNum(v)) last = [i, v]; });
      s.vals.forEach(function (v, i) { if (isNum(v)) dots += '<circle class="vtb-dot" cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="' + (last && i === last[0] ? 4.5 : 3) + '" fill="' + col + '" stroke="var(--surface-card)" stroke-width="2" data-tip="' + esc(s.name + ' · T' + (i + 1) + ': ' + fmt(v)) + '" tabindex="0" role="img" aria-label="' + esc(s.name + ' tháng ' + (i + 1) + ': ' + fmt(v)) + '"/>'; });
      if (last) labels.push({ y: Y(last[1]), x: X(last[0]), text: s.name + ' ' + fmt(last[1]), col: s.labelColor || 'var(--ink)' });
    });
    var fc = '';
    if (o.forecast && isNum(o.forecast.from.v) && isNum(o.forecast.to.v)) {
      var f = o.forecast; fc = '<path d="M' + X(f.from.i).toFixed(1) + ' ' + Y(f.from.v).toFixed(1) + 'L' + X(f.to.i).toFixed(1) + ' ' + Y(f.to.v).toFixed(1) + '" fill="none" stroke="var(--forecast)" stroke-width="2.5" stroke-dasharray="6 5" stroke-linecap="butt"/>' +
        '<circle cx="' + X(f.to.i).toFixed(1) + '" cy="' + Y(f.to.v).toFixed(1) + '" r="5" fill="var(--surface-card)" stroke="var(--forecast)" stroke-width="2.5" data-tip="DỰ KIẾN T' + (f.to.i + 1) + ': ' + fmt(f.to.v) + ' (không phải số thực tế)" tabindex="0" role="img" aria-label="Dự kiến tháng ' + (f.to.i + 1) + ': ' + fmt(f.to.v) + ', không phải số thực tế"/>';
      labels.push({ y: Y(f.to.v), x: X(f.to.i), text: 'DỰ KIẾN ' + fmt(f.to.v), col: 'var(--forecast)', bold: true });
    }
    labels.sort(function (a, b) { return a.y - b.y; }); for (k = 1; k < labels.length; k++) if (labels[k].y - labels[k - 1].y < 17) labels[k].y = labels[k - 1].y + 17;
    var lab = labels.map(function (l) { return '<text x="' + (l.x + 9) + '" y="' + (l.y + 4) + '" class="vtb-end' + (l.bold ? ' vtb-end-b' : '') + '" fill="' + l.col + '">' + esc(l.text) + '</text>'; }).join('');
    var aria = o.aria || 'Biểu đồ đường';
    return '<svg class="vtb-trend" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(aria) + '">' + g + refs + lines + fc + dots + lab + '</svg>' + trendLegend(o);
  }
  function trendLegend(o) {
    var it = o.series.map(function (s) { return '<li><svg width="26" height="10" aria-hidden="true"><line x1="1" x2="25" y1="5" y2="5" stroke="' + (s.color || 'var(--series-1)') + '" stroke-width="2.5" stroke-linecap="round"/></svg>' + esc(s.name) + ' <small>(thực tế)</small></li>'; });
    if (o.forecast) it.push('<li><svg width="26" height="10" aria-hidden="true"><line x1="1" x2="25" y1="5" y2="5" stroke="var(--forecast)" stroke-width="2.5" stroke-dasharray="5 4"/></svg><b class="vtb-dukien">DỰ KIẾN</b> <small>(nét đứt, không phải số thực tế)</small></li>');
    if (o.refs && o.refs.length) it.push('<li><svg width="26" height="10" aria-hidden="true"><line x1="1" x2="25" y1="5" y2="5" stroke="var(--chart-ref)" stroke-width="1"/></svg>Ngưỡng</li>');
    return '<ul class="vtb-legend">' + it.join('') + '</ul>';
  }

  /* ---------- ColumnDiverge: cột tăng/giảm theo tháng (xanh = tăng, cam = giảm), nhãn từng cột ---------- */
  function columnDiverge(o) { // o: {w,h,vals[12],fmt,aria}
    var W = o.w || 520, H = o.h || 220, L = 44, R = 10, T = 22, B = 28, n = o.vals.length, fmt = o.fmt || function (v) { return sgn(v, 1); };
    var vs = o.vals.filter(isNum); if (!vs.length) return '<p class="vtb-empty">Chưa có dữ liệu.</p>';
    var hi = Math.max(0, Math.max.apply(null, vs)), lo = Math.min(0, Math.min.apply(null, vs)); if (hi === lo) hi = 1;
    var pad = (hi - lo) * 0.12; hi += pad; if (lo < 0) lo -= pad;
    var Y = function (v) { return T + (1 - (v - lo) / (hi - lo)) * (H - T - B); }, bw = Math.min(26, (W - L - R) / n * 0.62), cx = function (i) { return L + (i + 0.5) * (W - L - R) / n; };
    var out = '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="var(--chart-axis)"/>';
    o.vals.forEach(function (v, i) {
      out += '<text x="' + cx(i) + '" y="' + (H - 8) + '" text-anchor="middle" class="vtb-axis">T' + (i + 1) + '</text>';
      if (!isNum(v)) return;
      var y0 = Y(0), y1 = Y(v), pos = v >= 0, top = Math.min(y0, y1), h = Math.max(1, Math.abs(y1 - y0));
      out += '<rect x="' + (cx(i) - bw / 2) + '" y="' + top + '" width="' + bw + '" height="' + h + '" rx="3" fill="' + (pos ? 'var(--series-1)' : 'var(--series-2)') + '" data-tip="' + esc('T' + (i + 1) + ': ' + fmt(v) + (pos ? ' (tăng)' : ' (giảm)')) + '" tabindex="0" role="img" aria-label="' + esc('Tháng ' + (i + 1) + ': ' + fmt(v) + (pos ? ', tăng' : ', giảm')) + '"/>' +
        '<text x="' + cx(i) + '" y="' + (pos ? top - 5 : top + h + 12) + '" text-anchor="middle" class="vtb-axis vtb-val">' + (pos ? '▲' : '▼') + ' ' + esc(o.short ? o.short(v) : fmt(v)) + '</text>';
    });
    return '<svg class="vtb-col" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(o.aria || 'Biểu đồ cột') + '">' + out + '</svg><ul class="vtb-legend"><li><i class="vtb-sw" style="background:var(--series-1)"></i>▲ Tăng</li><li><i class="vtb-sw" style="background:var(--series-2)"></i>▼ Giảm</li></ul>';
  }

  /* ---------- LossBars: điểm mất theo mục (thanh một tông) ---------- */
  function lossBars(items, o) { // items: {key,name,sub,val,max,tier,valTxt}
    o = o || {}; var mx = Math.max.apply(null, items.map(function (x) { return x.val; }).concat([0.0001]));
    return '<div class="vtb-loss">' + items.map(function (x) {
      var tag = x.dv ? ' data-dv="' + esc(x.dv) + '"' : x.ct ? ' data-ct="' + esc(x.ct) + '"' : '';
      return '<div class="vtb-loss-r' + (tag ? ' is-link' : '') + '"' + tag + (tag ? ' role="button" tabindex="0"' : '') + ' aria-label="' + esc(x.name + ': ' + x.valTxt) + '"><span class="vtb-loss-n"><b>' + esc(x.name) + '</b><small>' + esc(x.sub || '') + '</small></span><span class="vtb-loss-b"><i style="width:' + (x.val / mx * 100) + '%"></i></span><span class="vtb-num vtb-loss-v is-bad">' + esc(x.valTxt) + '</span>' + (x.tier ? tierChip(x.tier) : '') + '</div>';
    }).join('') + '</div>';
  }

  /* ---------- StateMatrix (thay heatmap cầu vồng): ô nền nhạt 4 mức + biểu tượng + số ---------- */
  function stateMatrix(o) { // o: {cols:[{ct,name}], rows:[{dv,name,cells:{ct:{ht,tier}}}], active}
    var th = '<tr><th scope="col" class="vtb-sticky">Đơn vị</th>' + o.cols.map(function (c) { return '<th scope="col" data-ct="' + esc(c.ct) + '">' + esc(c.name) + '</th>'; }).join('') + '</tr>';
    var tb = o.rows.map(function (r) {
      return '<tr' + (o.active === r.dv ? ' class="is-active"' : '') + '><th scope="row" class="vtb-sticky"><button type="button" data-dv="' + esc(r.dv) + '">' + esc(r.name) + '</button></th>' + o.cols.map(function (c) {
        var x = r.cells[c.ct]; if (!x) return '<td class="vtb-na" aria-label="Không áp dụng">·</td>';
        return '<td class="vtb-cell vtb-t-' + x.tier + '" data-tier="' + x.tier + '" data-tip="' + esc(r.name + ' · ' + c.name + ': ' + (isNum(x.ht) ? pct(x.ht, 0) : 'chưa có số') + ' · ' + LABEL_LONG[x.tier]) + '">' + svgIcon(x.tier) + '<span>' + (isNum(x.ht) ? pct(x.ht, 0) : 'GAP') + '</span></td>';
      }).join('') + '</tr>';
    }).join('');
    return '<div class="vtb-tablewrap"><table class="vtb-matrix"><caption class="vtb-sr">Ma trận trạng thái KPI theo đơn vị và chỉ tiêu</caption><thead>' + th + '</thead><tbody>' + tb + '</tbody></table></div>';
  }

  /* ---------- DataFreshness ---------- */
  function dataFreshness(o) {
    return '<div class="vtb-fresh"><span><b>Cập nhật:</b> ' + esc(o.capNhat) + '</span><span><b>Kỳ:</b> ' + esc(o.ky) + '</span><span>' + (o.khoa ? '<span class="vtb-chip vtb-t-dat">' + svgIcon('dat') + '<span>Đã khoá kỳ</span></span>' : '<span class="vtb-chip vtb-t-cct">' + svgIcon('cct') + '<span>Chưa khoá kỳ</span></span>') + '</span><span><b>Số liệu:</b> ' + esc(o.soLieu) + '</span>' + (o.extra ? '<span>' + esc(o.extra) + '</span>' : '') + '</div>';
  }

  /* ---------- Tooltip dùng chung (chuột + bàn phím); gọi một lần cho mỗi root ---------- */
  var tipEl = null;
  function attachTips(root) {
    if (root.__vtbTips) return; root.__vtbTips = true;
    function show(t) {
      var s = t.getAttribute && t.getAttribute('data-tip'); if (!s) return hide();
      if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'vtb-tip'; tipEl.setAttribute('role', 'tooltip'); tipEl.hidden = true; document.body.appendChild(tipEl); }
      tipEl.textContent = s; tipEl.hidden = false;
      var r = t.getBoundingClientRect(), tw = tipEl.offsetWidth, x = Math.min(window.innerWidth - tw - 8, Math.max(8, r.left + r.width / 2 - tw / 2)), y = r.top - tipEl.offsetHeight - 8; if (y < 8) y = r.bottom + 8;
      tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
    }
    function hide() { if (tipEl) tipEl.hidden = true; }
    root.addEventListener('mouseover', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); t ? show(t) : hide(); });
    root.addEventListener('mouseleave', hide); root.addEventListener('focusin', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); t ? show(t) : hide(); });
    root.addEventListener('focusout', hide); w.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
  }
  /* Phím Enter/Space kích hoạt các phần tử role=button (hàng, thẻ) */
  function attachKeys(root) {
    if (root.__vtbKeys) return; root.__vtbKeys = true;
    root.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute && e.target.getAttribute('role') === 'button' && e.target.tagName !== 'BUTTON') { e.preventDefault(); e.target.click(); } });
  }

  w.VTB = { TIERS: TIERS, LABEL: LABEL, LABEL_LONG: LABEL_LONG, esc: esc, num: num, pct: pct, sgn: sgn, isNum: isNum, tierOf: tierOf, svgIcon: svgIcon, tierChip: tierChip, deltaBadge: deltaBadge, sparkline: sparkline, tierBar: tierBar, heroFigure: heroFigure, kpiCard: kpiCard, statTile: statTile,
    rankBars: rankBars, bulletRow: bulletRow, attentionList: attentionList, dataTable: dataTable, trendLine: trendLine, columnDiverge: columnDiverge, lossBars: lossBars, stateMatrix: stateMatrix, dataFreshness: dataFreshness, attachTips: attachTips, attachKeys: attachKeys };
})(window);
