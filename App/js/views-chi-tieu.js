/* MÀN HÌNH THEO DÕI CHỈ TIÊU — 1 chỉ tiêu qua các phòng/PGD (mục đích THEO DÕI, không chấm điểm).
 *  Tab "So sánh kỳ": số kỳ này so tháng trước · đầu năm (31/12 năm trước) · cùng kỳ năm trước (± và %), tỷ trọng, xếp hạng mức tăng.
 *  Tab "Diễn biến 12 tháng": bảng các phòng × T1..T12 (số liệu / tăng giảm trong tháng / % hoàn thành KH), biểu đồ nhiều đường, so cùng kỳ.
 *  Tab "Kế hoạch & điểm": KH, TH, %HT, điểm của chỉ tiêu ở từng phòng.
 * Chỉ tiêu số dư (dư nợ, nguồn vốn cuối kỳ, BQ, số KH…) so với đầu năm; chỉ tiêu lũy kế (NII, thu phí…) xem phát sinh trong tháng và cùng kỳ. */
(function (root) {
  var esc = UI.esc, num = UI.num, pct = UI.pct, isNum = UI.isNum, CN = KPI_CFG.MA_CN;
  var VIEWS = root.VIEWS = root.VIEWS || {};
  var THANG = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  var PAL = ['#005993', '#e4572e', '#17a589', '#f2a541', '#8e44ad', '#2e86de', '#c0392b', '#16a085', '#d35400', '#7f8c8d', '#27ae60', '#e84393'];
  function opt(list, sel) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(sel) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function stat(t, v, s) { return '<div class="stat"><small>' + t + '</small><b>' + v + '</b><span>' + s + '</span></div>'; }
  function r2(x) { return isNum(x) ? Math.round(x * 100) / 100 : null; }

  /* Bộ số so sánh của 1 đơn vị */
  function soSanh(M, ct, dv, nam, t, kieu) {
    var g = function (y, m) { return M.val('a', ct, dv, y, m); };
    var cur = g(nam, t), tt = t > 1 ? g(nam, t - 1) : (kieu === 'luy_ke' ? 0 : g(nam - 1, 12)), dn = g(nam - 1, 12), ck = g(nam - 1, t);
    var d = function (a, b) { return isNum(a) && isNum(b) ? a - b : null; }, p = function (a, b) { return isNum(a) && isNum(b) && b ? (a - b) / Math.abs(b) : null; };
    return { cur: cur, tt: tt, tt_d: d(cur, tt), tt_p: kieu === 'luy_ke' ? null : p(cur, tt), dn: dn, dn_d: d(cur, dn), dn_p: p(cur, dn), ck: ck, ck_d: d(cur, ck), ck_p: p(cur, ck),
      ps_ck: isNum(ck) ? ck - (t > 1 ? (g(nam - 1, t - 1) || 0) : 0) : null };
  }
  function dCell(x, ind, xau) {   // ô ± : xanh nếu tốt
    if (!isNum(x)) return '<td class="r num muted">–</td>';
    var tot = xau ? x < 0 : x > 0, cls = Math.abs(x) < 1e-9 ? 'muted' : tot ? 'txt-dat' : 'txt-chua';
    return '<td class="r num ' + cls + '">' + UI.signed(r2(x), ind) + '</td>';
  }
  function pCell(x, xau) {
    if (!isNum(x)) return '<td class="r num muted">–</td>';
    var tot = xau ? x < 0 : x > 0;
    return '<td class="r num ' + (Math.abs(x) < 1e-9 ? 'muted' : tot ? 'txt-dat' : 'txt-chua') + '">' + (x > 0 ? '+' : '') + pct(x) + '</td>';
  }

  VIEWS['chi-tieu'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, ma = A.route.arg;
      if (!ma || !M.indMap[ma]) ma = M.inds[0] && M.inds[0].ma; A.route.arg = ma;
      var ind = M.indMap[ma]; if (!ind) return '<div class="card empty"><p>Danh mục chưa có chỉ tiêu.</p></div>';
      var tab = A.ct_tab || 'so-sanh', kieu = KPI_ENGINE.kieuSo(ind), xau = ind.huong === 'thap_tot';
      var h = '<div class="toolbar"><select id="sel-ct" class="sel-lg">';
      var nh = null; M.inds.forEach(function (i) { if (i.nhom !== nh) { if (nh !== null) h += '</optgroup>'; nh = i.nhom; h += '<optgroup label="' + esc(nh) + '">'; } h += '<option value="' + i.ma + '"' + (i.ma === ma ? ' selected' : '') + '>' + esc(i.ten) + (i.chi_tham_khao ? ' · quản trị' : '') + '</option>'; });
      h += '</optgroup></select><div class="pills">' + [['so-sanh', 'So sánh kỳ'], ['dien-bien', 'Diễn biến 12 tháng'], ['ke-hoach', 'Kế hoạch & điểm']].map(function (x) { return '<button class="pill' + (tab === x[0] ? ' on' : '') + '" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></div>';
      var c = soSanh(M, ma, CN, ky.nam, ky.thang, kieu);
      h += '<section class="card ind-head"><div><small>' + esc(ind.nhom) + ' · ĐVT: ' + esc(ind.dvt) + ' · ' + (kieu === 'so_du' ? 'Số dư / mức tại thời điểm' : 'Số lũy kế phát sinh trong năm') + (xau ? ' · càng thấp càng tốt' : '') + (ind.chi_tham_khao ? ' · <b>chỉ tiêu quản trị, không tính điểm</b>' : '') + '</small><h2>' + esc(ind.ten) + '</h2></div>' +
        '<div class="ind-kpis">' + stat('Toàn CN ' + 'T' + ky.thang + '/' + ky.nam, UI.val(c.cur, ind), '') +
        (kieu === 'so_du' ? stat('So tháng trước', fmtD(c.tt_d, ind, xau), fmtP(c.tt_p)) + stat('So đầu năm', fmtD(c.dn_d, ind, xau), fmtP(c.dn_p) + ' · 31/12/' + (ky.nam - 1)) : stat('Phát sinh trong tháng', fmtD(c.tt_d, ind, xau), 'T' + ky.thang + '/' + ky.nam) + stat('Phát sinh cùng tháng năm trước', UI.val(c.ps_ck, ind), 'T' + ky.thang + '/' + (ky.nam - 1))) +
        stat('So cùng kỳ năm trước', fmtD(c.ck_d, ind, xau), fmtP(c.ck_p) + ' · T' + ky.thang + '/' + (ky.nam - 1)) + '</div></section>';
      if (tab === 'so-sanh') h += tabSoSanh(M, A, ind, kieu, xau);
      else if (tab === 'dien-bien') h += tabDienBien(M, A, ind, kieu, xau);
      else h += tabKeHoach(M, A, ind);
      return h;
    },
    mount: function (v, A) {
      var M = STORE.model(), ky = A.ky, ma = A.route.arg, ind = M.indMap[ma], tab = A.ct_tab || 'so-sanh';
      var s = v.querySelector('#sel-ct'); if (s) s.onchange = function () { A.ct_dv = null; APP.go('chi-tieu', this.value); };
      v.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { A.ct_tab = b.dataset.tab; APP.render(); }; });
      if (!ind) return;
      var kieu = KPI_ENGINE.kieuSo(ind), xau = ind.huong === 'thap_tot';
      if (tab === 'so-sanh') mountSoSanh(v, M, A, ind, kieu, xau);
      else if (tab === 'dien-bien') mountDienBien(v, M, A, ind, kieu);
      else mountKeHoach(v, M, A, ind);
    }
  };
  VIEWS['chi-tieu'].soSanh = soSanh; VIEWS['chi-tieu'].dsSoSanh = dsSoSanh; VIEWS['chi-tieu'].giaTri = giaTri;   // dùng chung với giao diện mới
  function fmtD(x, ind, xau) { if (!isNum(x)) return '–'; var tot = xau ? x < 0 : x > 0; return '<span class="' + (Math.abs(x) < 1e-9 ? '' : tot ? 'txt-dat' : 'txt-chua') + '">' + UI.signed(r2(x), ind) + '</span>'; }
  function fmtP(x) { return isNum(x) ? (x > 0 ? '+' : '') + pct(x) : ''; }

  /* ---------- Tab So sánh kỳ ---------- */
  function tieuChi(kieu) {
    return kieu === 'so_du' ? [['tt_d', 'Tăng so tháng trước (số tuyệt đối)'], ['tt_p', 'Tăng so tháng trước (%)'], ['dn_d', 'Tăng so đầu năm (số tuyệt đối)'], ['dn_p', 'Tăng so đầu năm (%)'], ['ck_d', 'Tăng so cùng kỳ (số tuyệt đối)'], ['ck_p', 'Tăng so cùng kỳ (%)']]
      : [['tt_d', 'Phát sinh trong tháng'], ['cur', 'Lũy kế kỳ này'], ['ck_d', 'Tăng so cùng kỳ (số tuyệt đối)'], ['ck_p', 'Tăng so cùng kỳ (%)']];
  }
  function dsSoSanh(M, A, ind, kieu, xau) {
    var ky = A.ky, tc = tieuChi(kieu), k = tc.some(function (x) { return x[0] === A.ct_rank; }) ? A.ct_rank : (kieu === 'so_du' ? 'dn_d' : 'tt_d'); A.ct_rank = k;
    var rows = M.units.map(function (u) { return { u: u, s: soSanh(M, ind.ma, u.ma, ky.nam, ky.thang, kieu) }; })
      .filter(function (x) { return isNum(x.s.cur) || isNum(x.s.dn) || isNum(x.s.ck); });
    var co = rows.filter(function (x) { return isNum(x.s[k]); }).sort(function (a, b) { return xau ? a.s[k] - b.s[k] : b.s[k] - a.s[k]; });
    co.forEach(function (x, i) { x.hang = i && Math.abs(x.s[k] - co[i - 1].s[k]) < 1e-9 ? co[i - 1].hang : i + 1; });
    rows.sort(function (a, b) { return (a.hang || 999) - (b.hang || 999); });
    return { rows: rows, k: k, tc: tc };
  }
  function tabSoSanh(M, A, ind, kieu, xau) {
    var ky = A.ky, d = dsSoSanh(M, A, ind, kieu, xau), cn = soSanh(M, ind.ma, CN, ky.nam, ky.thang, kieu), cong = ind.dvt !== '%' && ind.huong !== 'nhap_ty_le';
    var tong = d.rows.reduce(function (a, x) { return a + (isNum(x.s.cur) ? x.s.cur : 0); }, 0);
    var h = '<div class="card p0"><div class="card-head pad"><h3>So sánh các phòng/PGD · T' + ky.thang + '/' + ky.nam + '</h3><label class="inline">Xếp hạng theo <select id="ct-rank">' + opt(d.tc, d.k) + '</select></label></div><div class="tbl-wrap"><table class="tbl ss"><thead>';
    if (kieu === 'so_du') h += '<tr><th rowspan="2">Hạng</th><th rowspan="2">Đơn vị</th><th rowspan="2" class="r">T' + ky.thang + '/' + ky.nam + '</th><th colspan="3" class="c grp-h">So tháng trước</th><th colspan="3" class="c grp-h">So đầu năm (31/12/' + (ky.nam - 1) + ')</th><th colspan="3" class="c grp-h">So cùng kỳ (T' + ky.thang + '/' + (ky.nam - 1) + ')</th>' + (cong ? '<th rowspan="2" class="r">Tỷ trọng</th>' : '') + '</tr>' +
      '<tr><th class="r">T' + (ky.thang > 1 ? ky.thang - 1 : 12) + '</th><th class="r">±</th><th class="r">%</th><th class="r">Đầu năm</th><th class="r">±</th><th class="r">%</th><th class="r">Cùng kỳ</th><th class="r">±</th><th class="r">%</th></tr>';
    else h += '<tr><th rowspan="2">Hạng</th><th rowspan="2">Đơn vị</th><th rowspan="2" class="r">Lũy kế T' + ky.thang + '/' + ky.nam + '</th><th rowspan="2" class="r">Phát sinh T' + ky.thang + '</th><th colspan="3" class="c grp-h">So cùng kỳ lũy kế (T' + ky.thang + '/' + (ky.nam - 1) + ')</th>' + (cong ? '<th rowspan="2" class="r">Tỷ trọng</th>' : '') + '</tr><tr><th class="r">Cùng kỳ</th><th class="r">±</th><th class="r">%</th></tr>';
    h += '</thead><tbody>';
    var dong = function (ten, s, hang, cls, dv) {
      var x = '<tr class="' + (cls || '') + '"' + (dv ? ' data-dv="' + dv + '"' : '') + '><td>' + (hang ? '<span class="medal m' + Math.min(hang, 4) + '">' + hang + '</span>' : '') + '</td><td><b>' + esc(ten) + '</b></td><td class="r num"><b>' + UI.val(s.cur, ind) + '</b></td>';
      if (kieu === 'so_du') x += '<td class="r num muted">' + UI.val(s.tt, ind) + '</td>' + dCell(s.tt_d, ind, xau) + pCell(s.tt_p, xau) + '<td class="r num muted">' + UI.val(s.dn, ind) + '</td>' + dCell(s.dn_d, ind, xau) + pCell(s.dn_p, xau) + '<td class="r num muted">' + UI.val(s.ck, ind) + '</td>' + dCell(s.ck_d, ind, xau) + pCell(s.ck_p, xau);
      else x += dCell(s.tt_d, ind, xau) + '<td class="r num muted">' + UI.val(s.ck, ind) + '</td>' + dCell(s.ck_d, ind, xau) + pCell(s.ck_p, xau);
      if (cong) x += '<td class="r num">' + (dv && tong && isNum(s.cur) ? pct(s.cur / tong) : dv ? '–' : '') + '</td>';
      return x + '</tr>';
    };
    h += dong('Toàn chi nhánh', cn, null, 'cn-row');
    d.rows.forEach(function (x) { h += dong(x.u.ten_ngan || x.u.ten, x.s, x.hang, '', x.u.ma); });
    h += '</tbody></table></div></div>';
    if (!d.rows.length) h += '<p class="muted">Chưa có số liệu của chỉ tiêu này ở các phòng.</p>';
    else if (!d.rows.some(function (x) { return isNum(x.s.ck) || isNum(x.s.dn); })) h += '<div class="warn-box small">Chưa có số năm ' + (ky.nam - 1) + ' nên chưa so được với đầu năm / cùng kỳ. Nạp file thô năm trước vào BAO_CAO_THO hoặc nhập số (chọn năm ' + (ky.nam - 1) + ' ở góc trên → Nhập kế hoạch & thực hiện).</div>';
    h += '<div class="card"><div class="card-head"><h3>' + esc((d.tc.filter(function (x) { return x[0] === d.k; })[0] || [])[1]) + ' theo đơn vị</h3></div><div class="chart h300"><canvas id="c-ss"></canvas></div></div>';
    return h;
  }
  function mountSoSanh(v, M, A, ind, kieu, xau) {
    var r = v.querySelector('#ct-rank'); if (r) r.onchange = function () { A.ct_rank = this.value; APP.render(); };
    v.querySelectorAll('tr[data-dv]').forEach(function (tr) { tr.onclick = function () { A.ct_dv = tr.dataset.dv; A.ct_tab = 'dien-bien'; APP.render(); }; });
    var d = dsSoSanh(M, A, ind, kieu, xau), k = d.k, laP = /_p$/.test(k), rows = d.rows.filter(function (x) { return isNum(x.s[k]); });
    UI.chart(v.querySelector('#c-ss'), { type: 'bar', data: { labels: rows.map(function (x) { return x.u.ten_ngan || x.u.ten; }),
      datasets: [{ data: rows.map(function (x) { return laP ? r2(x.s[k] * 100) : r2(x.s[k]); }), borderRadius: 5, maxBarThickness: 46,
        backgroundColor: rows.map(function (x) { var tot = xau ? x.s[k] < 0 : x.s[k] >= 0; return k === 'cur' ? UI.cssVar('--primary') : tot ? '#2e9d6a' : '#d9534f'; }) }] },
      options: { plugins: { legend: { display: false }, nhanSo: { fmt: function (v) { return laP ? num(v, 1) + '%' : UI.val(v, ind); } }, tooltip: { callbacks: { label: function (c) { return ' ' + (laP ? num(c.raw, 1) + '%' : UI.val(c.raw, ind)); } } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: '#eef2f7' }, ticks: { callback: function (t) { return laP ? num(t) + '%' : num(t); } } } } } });
  }

  /* ---------- Tab Diễn biến 12 tháng ---------- */
  function giaTri(M, ind, dv, nam, t, xem, kieu) {
    var v = M.val('a', ind.ma, dv, nam, t);
    if (xem === 'so') return v;
    if (xem === 'tang') { var p = t > 1 ? M.val('a', ind.ma, dv, nam, t - 1) : (kieu === 'luy_ke' ? 0 : M.val('a', ind.ma, dv, nam - 1, 12)); return isNum(v) && isNum(p) ? v - p : null; }
    var kh = M.val('p', ind.ma, dv, nam, t);
    return KPI_ENGINE.computeKpi({ kh: kh, th: v, ts: 1, toi_da: 9, huong: ind.huong, ap_dung: true, nguong: M.ng }).ht;
  }
  function tabDienBien(M, A, ind, kieu, xau) {
    var ky = A.ky, xem = A.ct_xem || 'so';
    var dvs = [{ ma: CN, ten_ngan: 'Toàn chi nhánh' }].concat(M.units).filter(function (u) { for (var t = 1; t <= 12; t++) if (isNum(M.val('a', ind.ma, u.ma, ky.nam, t)) || isNum(M.val('a', ind.ma, u.ma, ky.nam - 1, t))) return true; return false; });
    var h = '<div class="toolbar"><div class="pills">' + [['so', kieu === 'so_du' ? 'Số liệu' : 'Lũy kế'], ['tang', kieu === 'so_du' ? 'Tăng/giảm so tháng trước' : 'Phát sinh trong tháng'], ['ht', '% hoàn thành KH']].map(function (x) { return '<button class="pill' + (xem === x[0] ? ' on' : '') + '" data-xem="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<span class="muted small">Năm ' + ky.nam + ' (đổi ở góc trên) · bấm 1 dòng để so với cùng kỳ năm ' + (ky.nam - 1) + '</span></div>';
    h += '<div class="card p0"><div class="tbl-wrap"><table class="tbl db"><thead><tr><th>Đơn vị</th>' + THANG.map(function (m, i) { return '<th class="r' + (i + 1 === ky.thang ? ' cur-m' : '') + '">' + m + '</th>'; }).join('') + '</tr></thead><tbody>';
    dvs.forEach(function (u) {
      h += '<tr data-dv="' + u.ma + '" class="' + (u.ma === CN ? 'cn-row ' : '') + (A.ct_dv === u.ma ? 'sel' : '') + '"><td><b>' + esc(u.ten_ngan || u.ten) + '</b></td>';
      for (var t = 1; t <= 12; t++) {
        var x = giaTri(M, ind, u.ma, ky.nam, t, xem, kieu), cls = (t === ky.thang ? 'cur-m ' : '');
        if (xem === 'ht') h += '<td class="r num hc-s ' + cls + '" style="' + UI.heatStyleHT(x, M.ng) + '">' + (isNum(x) ? pct(x, 0) : '') + '</td>';
        else if (xem === 'tang') { var tot = xau ? x < 0 : x > 0; h += '<td class="r num ' + cls + (isNum(x) ? (Math.abs(x) < 1e-9 ? 'muted' : tot ? 'txt-dat' : 'txt-chua') : '') + '">' + (isNum(x) ? UI.signed(r2(x), ind) : '') + '</td>'; }
        else h += '<td class="r num ' + cls + '">' + (isNum(x) ? UI.val(r2(x), ind) : '') + '</td>';
      }
      h += '</tr>';
    });
    h += '</tbody></table></div></div>';
    if (!dvs.length) h += '<p class="muted">Chưa có số liệu.</p>';
    var tenDv = A.ct_dv ? (A.ct_dv === CN ? 'Toàn chi nhánh' : ((M.unitMap[A.ct_dv] || {}).ten_ngan || A.ct_dv)) : null;
    h += '<div class="card"><div class="card-head"><h3>' + (tenDv ? esc(tenDv) + ': ' + ky.nam + ' so với ' + (ky.nam - 1) : 'Các phòng/PGD năm ' + ky.nam) + '</h3>' + (tenDv ? '<button class="btn sm" data-act="tat-ca">Xem tất cả đơn vị</button>' : '<span class="muted small">Bấm tên trong chú giải để ẩn/hiện đường · Toàn CN ẩn mặc định vì quy mô lớn</span>') + '</div><div class="chart h340"><canvas id="c-db"></canvas></div></div>';
    return h;
  }
  function mountDienBien(v, M, A, ind, kieu) {
    var ky = A.ky, xem = A.ct_xem || 'so';
    v.querySelectorAll('[data-xem]').forEach(function (b) { b.onclick = function () { A.ct_xem = b.dataset.xem; APP.render(); }; });
    v.querySelectorAll('tr[data-dv]').forEach(function (tr) { tr.onclick = function () { A.ct_dv = A.ct_dv === tr.dataset.dv ? null : tr.dataset.dv; APP.render(); }; });
    var b = v.querySelector('[data-act=tat-ca]'); if (b) b.onclick = function () { A.ct_dv = null; APP.render(); };
    var laHt = xem === 'ht', ser = function (dv, nam) { var o = []; for (var t = 1; t <= 12; t++) { var x = giaTri(M, ind, dv, nam, t, xem, kieu); o.push(isNum(x) ? r2(laHt ? x * 100 : x) : null); } return o; };
    var ds;
    var bar = xem === 'tang';
    if (A.ct_dv) ds = [{ label: String(ky.nam), data: ser(A.ct_dv, ky.nam), borderColor: UI.cssVar('--primary'), backgroundColor: bar ? UI.cssVar('--primary') : 'rgba(14,76,146,.08)', fill: !bar, tension: .25, pointRadius: 3, borderRadius: 4 },
      { label: String(ky.nam - 1) + ' (cùng kỳ)', data: ser(A.ct_dv, ky.nam - 1), borderColor: '#9aa8bd', backgroundColor: bar ? '#b9c5d6' : 'transparent', borderDash: bar ? [] : [5, 4], tension: .25, pointRadius: 2, borderRadius: 4 }];
    else ds = [{ ma: CN, ten_ngan: 'Toàn chi nhánh' }].concat(M.units).map(function (u, i) {
      return { label: u.ten_ngan || u.ten, data: ser(u.ma, ky.nam), borderColor: u.ma === CN ? '#1b2a41' : PAL[(i - 1) % PAL.length], backgroundColor: u.ma === CN ? '#1b2a41' : PAL[(i - 1) % PAL.length], borderWidth: u.ma === CN ? 2.5 : 2, tension: .25, pointRadius: 2, hidden: u.ma === CN && !laHt };
    }).filter(function (d) { return d.data.some(isNum); });
    UI.chart(v.querySelector('#c-db'), { type: xem === 'tang' && A.ct_dv ? 'bar' : 'line', data: { labels: THANG, datasets: ds },
      options: { spanGaps: true, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' }, nhanSo: { fmt: function (v) { return laHt ? num(v, 1) + '%' : UI.val(v, ind); } }, tooltip: { callbacks: { label: function (c) { return ' ' + c.dataset.label + ': ' + (laHt ? num(c.raw, 1) + '%' : UI.val(c.raw, ind)); } } } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: '#eef2f7' }, ticks: { callback: function (t) { return laHt ? num(t) + '%' : num(t); } } } } } });
  }

  /* ---------- Tab Kế hoạch & điểm ---------- */
  function tabKeHoach(M, A, ind) {
    var ky = A.ky, g = M.ng, ma = ind.ma;
    var rows = M.units.map(function (u) { var c = M.card(u.ma, ky.nam, ky.thang); return { u: u, r: c.rows.concat(c.ref).filter(function (x) { return x.ma === ma; })[0] }; }).filter(function (x) { return x.r; });
    if (!rows.length) return '<div class="card empty"><p>Chỉ tiêu này chưa gắn với khối nào trong Danh mục & trọng số nên chưa có kế hoạch/điểm theo phòng. Các tab So sánh kỳ và Diễn biến vẫn dùng được.</p></div>';
    rows.sort(function (a, b) { return (isNum(b.r.ht) ? b.r.ht : -1) - (isNum(a.r.ht) ? a.r.ht : -1); });
    var h = '<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Đơn vị</th><th>Khối</th><th class="r">TS</th><th class="r">Kế hoạch</th><th class="r">Thực hiện</th><th class="r">+/- so KH</th><th style="min-width:150px">% hoàn thành</th><th class="r">Điểm</th><th class="r">%KH năm</th></tr></thead><tbody>';
    rows.forEach(function (x, i) {
      var r = x.r;
      h += '<tr data-dv="' + x.u.ma + '"><td class="muted">' + (i + 1) + '</td><td><b>' + esc(x.u.ten_ngan || x.u.ten) + '</b></td><td><span class="tag">' + esc(x.u.khoi) + '</span></td><td class="r">' + (r.ts === null ? '–' : r.ts) + '</td>' +
        '<td class="r num">' + UI.val(r.kh, ind) + '</td><td class="r num"><b>' + UI.val(r.th, ind) + '</b>' + (r.dc ? '<small class="block dc-note">gồm đ/c ' + UI.signed(r2(r.dc), ind) + '</small>' : '') + '</td>' + dCell(r.gap, ind, ind.huong === 'thap_tot') +
        '<td><div class="score-cell"><b class="txt-' + UI.htClass(r.ht, g) + '">' + pct(r.ht) + '</b>' + UI.bar(r.ht, g, Math.max(r.toi_da || 1.3, 1)) + '</div></td><td class="r num">' + (isNum(r.diem) ? num(r.diem, 2) : '–') + '</td><td class="r num">' + pct(r.ht_nam, 0) + '</td></tr>';
    });
    h += '</tbody></table></div></div><div class="card"><div class="card-head"><h3>Kế hoạch & thực hiện theo đơn vị · T' + ky.thang + '/' + ky.nam + '</h3></div><div class="chart h300"><canvas id="c-dv"></canvas></div></div>';
    return h;
  }
  function mountKeHoach(v, M, A, ind) {
    var ky = A.ky, ma = ind.ma, us = M.units.filter(function (u) { return M.apDung(ma, u.ma); }), ht = ind.huong === 'nhap_ty_le';
    v.querySelectorAll('tr[data-dv]').forEach(function (tr) { tr.onclick = function () { APP.go('phong', tr.dataset.dv); }; });
    UI.chart(v.querySelector('#c-dv'), { type: 'bar', data: { labels: us.map(function (u) { return u.ten_ngan || u.ten; }), datasets: (ht ? [] : [{ label: 'Kế hoạch', data: us.map(function (u) { return M.val('p', ma, u.ma, ky.nam, ky.thang); }), backgroundColor: '#c9d6ea', borderRadius: 4 }])
      .concat([{ label: 'Thực hiện', data: us.map(function (u) { return M.val('a', ma, u.ma, ky.nam, ky.thang); }), backgroundColor: UI.cssVar('--primary'), borderRadius: 4 }]) },
      options: { plugins: { legend: { position: 'bottom' }, nhanSo: { fmt: function (v) { return UI.val(v, ind); } }, tooltip: { callbacks: { label: function (x) { return ' ' + x.dataset.label + ': ' + UI.val(x.raw, ind); } } } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#eef2f7' }, ticks: { callback: function (t) { return num(t); } } } } } });
  }
})(window);
