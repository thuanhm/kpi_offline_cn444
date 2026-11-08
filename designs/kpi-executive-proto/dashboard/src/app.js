/* Dashboard KPI điều hành — các "drawing" (nội dung theo dữ liệu) và tương tác. Chỉ dùng dash.* và VTB.*.
 * Không import store.js / engine.js; không đọc dữ liệu thật. Mọi con số đến từ dataset/calc. */
(function () {
  'use strict';
  var V = window.VTB, root = document.getElementById('vtb-root');
  V.attachTips(root); V.attachKeys(root);
  var KEY_CT = ['TOI', 'TOI_TT', 'DUNO_CK', 'HDV_CK', 'CASA', 'DV', 'NII', 'NPL'];       // 8 thẻ KPI của màn Tổng quan
  var MATRIX_CT = ['TOI', 'NII', 'DV', 'DUNO_CK', 'HDV_CK', 'CASA', 'NPL', 'THE'];     // cột của ma trận trạng thái
  var isNum = V.isNum, esc = V.esc, num = V.num, pct = V.pct, sgn = V.sgn;

  function P() { return dash.params(); }
  function stage() { return root.classList.contains('is-stage'); }
  function D(id) { var d = dash.data(id); return d && d.status === 'ok' ? d.data : null; }
  function ky() { var v = parseInt(P().ky, 10); return v >= 1 && v <= 12 ? v : 10; }
  function man() { return P().man === 'dieu-hanh' ? 'dieu-hanh' : 'tong-quan'; }
  function kyRow(m) { return (D('ky') || []).filter(function (r) { return +r.thang === m; })[0] || null; }
  function nhan(m) { var r = kyRow(m); return r ? r.nhan : 'T' + m; }
  function cfg() { return D('cfg'); }
  function ng(c) { return { dat: c.dat, kha: c.kha, cct: c.cct }; }
  function fmtV(v, dvt) { if (!isNum(v)) return '–'; if (dvt === '%') return num(v, 2) + '%'; return Math.abs(v) >= 1000 ? num(v, 0) : num(v, 1); }
  function unitTxt(dvt) { return dvt === '%' ? '' : dvt; }
  function gapTxt(r) { if (!isNum(r.gap)) return '–'; return sgn(r.gap, Math.abs(r.gap) >= 1000 ? 0 : 1) + (r.dvt === '%' ? ' đ%' : ''); }
  function tabWidth(el, min) { return Math.max(min || 320, Math.floor(el.clientWidth || 600)); }
  function pair(chart, table) { return '<div class="v-chart">' + chart + '</div><div class="v-table">' + table + '</div>'; }
  function ctRows(m) { return (D('ct_cn') || []).filter(function (r) { return r.thang === m; }).sort(function (a, b) { return a.thu_tu - b.thu_tu; }); }
  function tongRow(m) { return (D('tong_cn') || []).filter(function (r) { return r.thang === m; })[0] || null; }
  function noData(el, msg) { el.innerHTML = '<p class="vtb-empty">' + esc(msg || 'Kỳ này chưa có số thực hiện.') + '</p>'; }
  function ready() { return D('cfg') && D('tong_cn') && D('ct_cn') && D('xep_hang') && D('kq') && D('ky'); }

  /* ===================== TIÊU ĐỀ & BỘ LỌC ===================== */
  dash.draw('chon-ky', function (sel) {
    var k = D('ky'); if (!k) return;
    sel.replaceChildren.apply(sel, k.slice().reverse().map(function (r) { var o = new Option(r.nhan + (r.khoa === 'true' ? ' · đã khoá' : ''), r.thang); return o; }));
    sel.value = String(ky()); sel.onchange = function () { dash.setParams({ ky: sel.value }); };
  });
  dash.draw('chon-dv', function (sel) {
    var u = D('don_vi'); if (!u) return;
    sel.replaceChildren.apply(sel, [new Option('Toàn chi nhánh', '')].concat(u.filter(function (r) { return r.ma !== 'CN'; }).map(function (r) { return new Option(r.ten_ngan, r.ma); })));
    sel.value = P().dv || ''; sel.onchange = function () { dash.setParams({ dv: sel.value }); };
  });
  dash.draw('cap-nhat', function (el) { var r = kyRow(ky()); if (r) el.textContent = 'Cập nhật ' + r.cap_nhat_luc; });

  /* ===================== MÀN 1: TỔNG QUAN ===================== */
  dash.draw('tq-hero', function (el) {
    if (!ready()) return; var r = tongRow(ky()); if (!r) return noData(el);
    el.innerHTML = V.heroFigure({ label: 'Điểm KPI toàn chi nhánh · lũy kế ' + nhan(ky()), value: num(r.quy_doi, 1), unit: '/ 100 điểm', tier: r.tier,
      delta: r.delta === null ? '<span class="vtb-caption">Kỳ đầu tiên</span>' : V.deltaBadge(r.delta, { digits: 1, vs: 'so ' + nhan(ky() - 1) }),
      spark: V.sparkline(r.series_cn, { w: 220, h: 36, label: 'Điểm KPI toàn chi nhánh các tháng đến ' + nhan(ky()) }) });
  });
  dash.draw('tq-tierbar', function (el) {
    if (!ready()) return; var r = tongRow(ky()); if (!r) return noData(el);
    el.innerHTML = V.tierBar({ dat: r.so_dat, kha: r.so_kha, cct: r.so_cct, chua: r.so_chua, gap: r.so_gap });
  });
  dash.draw('tq-stats', function (el) {
    if (!ready()) return; var r = tongRow(ky()); if (!r) return;
    var cb = (D('canh_bao') || []).filter(function (x) { return +x.thang === ky() && +x.muc === 3; }).length;
    el.innerHTML = V.statTile({ label: 'Đơn vị ≥ ' + num(r.diem_cao, 0) + ' điểm', value: r.dv_cao + '/' + r.so_dv, sub: 'ngưỡng cấu hình nguong' }) +
      V.statTile({ label: 'Đơn vị dưới mức Khá', value: String(r.dv_duoi_kha), sub: 'trên ' + r.so_dv + ' đơn vị' }) +
      V.statTile({ label: 'Chỉ tiêu cần chú ý', value: String(r.so_cct + r.so_chua), sub: 'CCT + Chưa đạt' }) +
      V.statTile({ label: 'Cảnh báo nghiêm trọng', value: String(cb), sub: 'ghi nhận kỳ này' });
  });
  dash.draw('tq-kpis', function (el) {
    if (!ready()) return; var rows = ctRows(ky()), all = D('ct_cn'), active = P().ct || 'TOI';
    el.innerHTML = KEY_CT.map(function (ct) {
      var r = rows.filter(function (x) { return x.ct === ct; })[0]; if (!r) return '';
      var ser = all.filter(function (x) { return x.ct === ct && x.thang <= ky(); }).sort(function (a, b) { return a.thang - b.thang; }).map(function (x) { return x.th; });
      var d = isNum(r.ht) && isNum(r.ht_truoc) ? (r.ht - r.ht_truoc) * 100 : null;
      return V.kpiCard({ id: ct, label: r.ten_ngan, value: fmtV(r.th, r.dvt).replace('%', ''), unit: r.dvt === '%' ? '%' : r.dvt, sub: isNum(r.kh) ? 'KH lũy kế ' + fmtV(r.kh, r.dvt) : 'Chưa có số kỳ này',
        ht: isNum(r.ht) ? pct(r.ht, 0) + ' KH' : 'GAP', tier: r.tier, delta: d === null ? '' : V.deltaBadge(d, { digits: 1, unit: ' đ%' }), spark: V.sparkline(ser, { w: 70, h: 24 }), active: ct === active });
    }).join('');
  });

  function rankRows(m, khoi) { return (D('xep_hang') || []).filter(function (r) { return r.thang === m && (!khoi || r.khoi === khoi); }).sort(function (a, b) { return a.hang - b.hang; }); }
  function rankDraw(el, compact) {
    if (!ready()) return; var c = cfg(), rows = rankRows(ky(), compact ? '' : P().khoi || '');
    if (!rows.length) return noData(el);
    var mapped = rows.map(function (r) { return { ma: r.dv, hang: r.hang, hang_truoc: r.hang_truoc, ten: r.ten_ngan, khoi: r.khoi, diem: r.quy_doi, gap: r.gap, tier: r.tier, delta: r.delta, series: r.series, canhbao: r.canhbao }; });
    var tbl = V.dataTable({ caption: 'Xếp hạng đơn vị ' + nhan(ky()), cols: [{ k: 'hang', t: 'Hạng', cls: 'vtb-r' }, { k: 'ten', t: 'Đơn vị' }, { k: 'khoi', t: 'Khối' }, { k: 'diem', t: 'Điểm KPI', cls: 'vtb-r' }, { k: 'delta', t: 'So kỳ trước', cls: 'vtb-r' }, { k: 'gap', t: 'GAP điểm', cls: 'vtb-r' }, { k: 'tier', t: 'Mức' }, { k: 'canhbao', t: 'Cảnh báo' }],
      rows: mapped.map(function (r) { return { _key: r.ma, hang: r.hang, ten: r.ten, khoi: r.khoi, diem: num(r.diem, 1), delta: isNum(r.delta) ? sgn(r.delta, 1) : '–', gap: sgn(r.gap, 1), tier: V.LABEL_LONG[r.tier], canhbao: r.canhbao || '–' }; }) });
    el.innerHTML = pair(V.rankBars(mapped, { ng: ng(c), selected: compact ? '' : P().dv || '', noSpark: stage() }), tbl);
  }
  dash.draw('tq-rank', function (el) { rankDraw(el, false); });

  dash.draw('tq-trend', function (el) {
    if (!ready()) return; var r = tongRow(ky()), c = cfg(); if (!r) return noData(el);
    var w = tabWidth(el, 340), fc = r.du_bao !== null ? { from: { i: ky() - 1, v: r.quy_doi }, to: { i: 11, v: r.du_bao } } : null;
    var chart = V.trendLine({ w: w, h: stage() ? 185 : 290, rightPad: Math.min(150, w * 0.26), series: [{ name: 'Toàn CN', vals: r.series_cn }, { name: 'BQ đơn vị', vals: r.series_bq, color: 'var(--series-neutral)', thin: true, labelColor: 'var(--ink-2)' }],
      refs: [{ v: c.dat * 100, label: 'Đạt ' + num(c.dat * 100, 0) }, { v: c.kha * 100, label: 'Khá ' + num(c.kha * 100, 0) }], forecast: fc, yMin: stage() ? 75 : 70, yMax: stage() ? 105 : 110, aria: 'Diễn biến điểm KPI toàn chi nhánh đến ' + nhan(ky()) });
    var note = fc ? '' : '<p class="vtb-caption">Chưa có dữ liệu dự kiến cho kỳ này — biểu đồ chỉ hiển thị số thực tế.</p>';
    var rows = []; for (var i = 0; i < 12; i++) { if (isNum(r.series_cn[i]) || (fc && i === 11)) rows.push({ _key: i + 1, th: 'T' + (i + 1), cn: isNum(r.series_cn[i]) ? num(r.series_cn[i], 1) : '–', bq: isNum(r.series_bq[i]) ? num(r.series_bq[i], 1) : '–', loai: isNum(r.series_cn[i]) ? 'Thực tế' : 'DỰ KIẾN (không phải số thực tế)' }); }
    if (fc) rows[rows.length - 1] = { _key: 12, th: 'T12', cn: num(r.du_bao, 1), bq: '–', loai: 'DỰ KIẾN (không phải số thực tế)' };
    var tbl = V.dataTable({ caption: 'Điểm KPI theo tháng', cols: [{ k: 'th', t: 'Tháng' }, { k: 'cn', t: 'Toàn chi nhánh', cls: 'vtb-r' }, { k: 'bq', t: 'BQ đơn vị', cls: 'vtb-r' }, { k: 'loai', t: 'Loại số liệu' }], rows: rows });
    el.innerHTML = pair(chart + note, tbl);
  });

  function alertDraw(el, items, max) { el.innerHTML = V.attentionList(items.slice(0, max)); }
  dash.draw('tq-alert-dv', function (el) {
    if (!ready()) return; var c = cfg(), rows = rankRows(ky(), '').filter(function (r) { return r.quy_doi < c.kha * 100; }).sort(function (a, b) { return a.quy_doi - b.quy_doi; });
    if (!rows.length) { el.innerHTML = '<p class="vtb-empty">Không có đơn vị nào dưới mức Khá.</p>'; return; }
    alertDraw(el, rows.map(function (r) { return { muc: r.quy_doi < c.cct * 100 ? 3 : 2, loai: r.ten_ngan, text: 'đạt ' + num(r.quy_doi, 1) + ' điểm (GAP ' + sgn(r.gap, 1) + '), hạng ' + r.hang + '. ' + r.canhbao + '.', dv: r.dv }; }), stage() ? 2 : 6);
  });
  dash.draw('tq-alert-kpi', function (el) {
    if (!ready()) return; var rows = ctRows(ky()), it = [];
    rows.forEach(function (r) {
      if (r.tier === 'chua' || r.tier === 'cct') it.push({ muc: r.tier === 'chua' ? 3 : 2, loai: r.tier === 'chua' ? 'KPI chưa đạt' : 'Cần cải thiện', text: r.ten_ngan + ': ' + pct(r.ht, 0) + ' kế hoạch (GAP ' + gapTxt(r) + (r.dvt === '%' ? '' : ' ' + r.dvt) + ').', ct: r.ct, k: r.ht });
      else if (r.ket_luan === 'khong_dat' || r.ket_luan === 'nguy_co') it.push({ muc: 2, loai: 'Nguy cơ không đạt KH năm', text: r.ten_ngan + ': DỰ KIẾN chỉ đạt ' + pct(r.ht_du_bao, 0) + ' kế hoạch năm.', ct: r.ct, k: r.ht_du_bao });
    });
    it.sort(function (a, b) { return b.muc - a.muc || a.k - b.k; });
    if (!it.length) { el.innerHTML = '<p class="vtb-empty">Không có KPI cần cảnh báo.</p>'; return; }
    alertDraw(el, it, stage() ? 2 : 6);
  });
  dash.draw('tq-alert-van-de', function (el) {
    if (!D('canh_bao') || !D('hd_tt')) return; var it = [];
    D('canh_bao').filter(function (x) { return +x.thang === ky(); }).forEach(function (x) { it.push({ muc: +x.muc, loai: x.loai, text: x.text, dv: x.dv, ct: x.ct }); });
    D('hd_tt').filter(function (x) { return x.thang === ky() && x.qua_han; }).forEach(function (x) { it.push({ muc: 3, loai: 'Nhiệm vụ quá hạn', text: x.van_de + ' — hạn ' + x.han.split('-').reverse().join('/') + ', phụ trách: ' + x.nguoi + '.', dv: x.dv, ct: x.ct }); });
    if (!it.length) { el.innerHTML = '<p class="vtb-empty">Chưa có cảnh báo hoặc nhiệm vụ quá hạn ghi nhận cho kỳ này.</p>'; return; }
    it.sort(function (a, b) { return b.muc - a.muc; }); alertDraw(el, it, 6);
  });

  /* --- Chi tiết: bullet theo chỉ tiêu của CN hoặc của đơn vị đang chọn --- */
  function selDv() { var d = P().dv; return d && (D('don_vi') || []).some(function (u) { return u.ma === d; }) ? d : ''; }
  dash.draw('tq-scope', function (el) { var d = selDv(), u = (D('don_vi') || []).filter(function (x) { return x.ma === d; })[0]; el.textContent = '· ' + (u ? u.ten_ngan : 'Toàn chi nhánh') + ' · ' + nhan(ky()); });
  dash.draw('tq-drill', function (el) {
    var d = selDv(); if (!ready()) return;
    if (!d) { el.innerHTML = '<p class="hint-box">Đang xem toàn chi nhánh. Chọn một phòng/PGD ở bảng xếp hạng (hoặc ô “Đơn vị” trên đầu trang) để xuống chi tiết từng chỉ tiêu của đơn vị đó; bấm một chỉ tiêu để xem biểu đồ so sánh với kế hoạch bên dưới.</p>'; return; }
    var r = rankRows(ky(), '').filter(function (x) { return x.dv === d; })[0]; if (!r) return noData(el, 'Đơn vị chưa có số liệu kỳ này.');
    el.innerHTML = '<div class="drill-sum"><div><div class="vtb-label">' + esc(r.ten) + ' · ' + esc(r.khoi) + '</div><div class="vtb-hero-row"><span class="vtb-hero-num">' + num(r.quy_doi, 1) + '</span><span class="vtb-hero-unit">/ 100 · hạng ' + r.hang + '</span></div></div><div class="vtb-hero-meta">' + V.tierChip(r.tier) + V.deltaBadge(r.delta, { digits: 1, vs: 'so ' + nhan(ky() - 1) }) + '</div><div style="min-width:240px;flex:1">' + V.tierBar({ dat: r.so_dat, kha: r.so_kha, cct: r.so_cct, chua: r.so_chua, gap: r.so_gap }) + '</div></div>';
  });
  dash.draw('tq-bullets', function (el) {
    if (!ready()) return; var d = selDv(), active = P().ct || 'TOI', cts = {}; (D('chi_tieu') || []).forEach(function (c) { cts[c.ma] = c; });
    var rows = d ? (D('kq') || []).filter(function (r) { return r.dv === d && r.thang === ky(); }).map(function (r) { var c = cts[r.ct]; return { thu_tu: +c.thu_tu, ct: r.ct, ten_ngan: c.ten_ngan, nhom: c.nhom, dvt: c.dvt, huong: c.huong, ht: r.ht, th: r.th, kh: r.kh, gap: r.gap, tier: r.tier, ts: r.ts, mat: r.mat }; }) : ctRows(ky());
    rows.sort(function (a, b) { return a.thu_tu - b.thu_tu; }); if (!rows.length) return noData(el);
    var html = '', last = '';
    rows.forEach(function (r) {
      if (r.nhom !== last) { last = r.nhom; html += '<div class="bl-group">' + esc(last) + '</div>'; }
      html += V.bulletRow({ id: r.ct, name: r.ten_ngan, ht: r.ht, tier: r.tier, thTxt: isNum(r.th) ? fmtV(r.th, r.dvt) : 'Chưa có số', khTxt: isNum(r.kh) ? fmtV(r.kh, r.dvt) : '', gapTxt: isNum(r.gap) ? gapTxt(r) : '–', gapBad: isNum(r.gap) && ((r.huong === 'thap_tot') ? r.gap > 0 : r.gap < 0), active: r.ct === active, cap: 1.3 });
    });
    var tbl = V.dataTable({ caption: 'Tỷ lệ hoàn thành kế hoạch theo chỉ tiêu', cols: [{ k: 'ten', t: 'Chỉ tiêu' }, { k: 'nhom', t: 'Nhóm' }, { k: 'th', t: 'Thực hiện', cls: 'vtb-r' }, { k: 'kh', t: 'Kế hoạch', cls: 'vtb-r' }, { k: 'ht', t: '% hoàn thành', cls: 'vtb-r' }, { k: 'gap', t: 'GAP', cls: 'vtb-r' }, { k: 'tier', t: 'Mức' }],
      rows: rows.map(function (r) { return { _key: r.ct, ten: r.ten_ngan, nhom: r.nhom, th: fmtV(r.th, r.dvt), kh: fmtV(r.kh, r.dvt), ht: isNum(r.ht) ? pct(r.ht, 0) : '–', gap: isNum(r.gap) ? gapTxt(r) : '–', tier: V.LABEL_LONG[r.tier] }; }) });
    el.innerHTML = pair(html, tbl);
  });
  function ctOf(id) { return (D('chi_tieu') || []).filter(function (c) { return c.ma === id; })[0]; }
  dash.draw('tq-compare-name', function (el) { var c = ctOf(P().ct || 'TOI'), d = selDv(), u = (D('don_vi') || []).filter(function (x) { return x.ma === d; })[0]; if (c) el.textContent = '· ' + c.ten_ngan + (u ? ' · ' + u.ten_ngan : ' · Toàn CN'); });
  dash.draw('tq-growth-name', function (el) { var c = ctOf(P().ct || 'TOI'); if (c) el.textContent = '· ' + c.ten_ngan + ' · Toàn CN'; });
  dash.draw('tq-compare', function (el) {
    if (!ready()) return; var ct = P().ct || 'TOI', d = selDv() || 'CN', c = ctOf(ct); if (!c) return;
    var rows = (D('kq') || []).filter(function (r) { return r.dv === d && r.ct === ct && r.thang <= ky(); }).sort(function (a, b) { return a.thang - b.thang; });
    if (!rows.length) return noData(el, 'Chỉ tiêu này không áp dụng cho đơn vị đã chọn.');
    var th = [], kh = []; for (var i = 0; i < 12; i++) { var r = rows.filter(function (x) { return x.thang === i + 1; })[0]; th.push(r ? r.th : null); kh.push(r ? r.kh : null); }
    var f = function (v) { return fmtV(v, c.dvt); }, w = tabWidth(el, 340);
    var chart = V.trendLine({ w: w, h: 270, rightPad: Math.min(170, w * 0.3), n: 12, series: [{ name: 'Thực hiện', vals: th }, { name: 'Kế hoạch', vals: kh, color: 'var(--series-neutral)', thin: true, labelColor: 'var(--ink-2)' }], fmt: f, yMin: c.kieu === 'ty_le' ? undefined : 0, aria: 'Thực hiện so với kế hoạch ' + c.ten_ngan });
    var tbl = V.dataTable({ caption: 'Thực hiện so với kế hoạch ' + c.ten_ngan, cols: [{ k: 'th', t: 'Tháng' }, { k: 'kh', t: 'Kế hoạch', cls: 'vtb-r' }, { k: 'tt', t: 'Thực hiện', cls: 'vtb-r' }, { k: 'ht', t: '% hoàn thành', cls: 'vtb-r' }, { k: 'gap', t: 'GAP', cls: 'vtb-r' }],
      rows: rows.map(function (r) { return { _key: r.thang, th: 'T' + r.thang, kh: f(r.kh), tt: f(r.th), ht: isNum(r.ht) ? pct(r.ht, 0) : 'GAP (thiếu số)', gap: isNum(r.gap) ? sgn(r.gap, 1) : '–' }; }) });
    el.innerHTML = pair(chart, tbl);
  });
  dash.draw('tq-growth', function (el) {
    if (!ready()) return; var ct = P().ct || 'TOI', c = ctOf(ct); if (!c) return;
    var rows = (D('ct_cn') || []).filter(function (r) { return r.ct === ct && r.thang <= ky(); }).sort(function (a, b) { return a.thang - b.thang; }), vals = []; for (var i = 0; i < 12; i++) { var r = rows.filter(function (x) { return x.thang === i + 1; })[0]; vals.push(r && isNum(r.mom) ? r.mom : null); }
    var u = rows.length && rows[rows.length - 1].mom_u ? rows[rows.length - 1].mom_u : '%', fm = function (v) { return sgn(v, 1) + (u === '%' ? '%' : ' đ%'); };
    var chart = V.columnDiverge({ w: tabWidth(el, 320), h: 250, vals: vals, fmt: fm, short: function (v) { return sgn(v, 1); }, aria: 'Tăng trưởng theo tháng của ' + c.ten_ngan });
    var tbl = V.dataTable({ caption: 'Tăng trưởng theo tháng', cols: [{ k: 'th', t: 'Tháng' }, { k: 'mom', t: 'So tháng trước', cls: 'vtb-r' }], rows: vals.map(function (v, i) { return isNum(v) ? { _key: i + 1, th: 'T' + (i + 1), mom: fm(v) } : null; }).filter(Boolean) });
    el.innerHTML = pair(chart, tbl);
  });
  dash.draw('tq-nhan-dinh', function (el) {
    if (!ready()) return; var r = tongRow(ky()); if (!r) return; var rk = rankRows(ky(), ''), ct = ctRows(ky()), s = [];
    s.push('Lũy kế đến hết ' + nhan(ky()) + ', toàn chi nhánh đạt ' + num(r.quy_doi, 1) + '/100 điểm KPI' + (r.delta !== null ? ' (' + (r.delta >= 0 ? 'tăng ' : 'giảm ') + num(Math.abs(r.delta), 1) + ' điểm so với ' + nhan(ky() - 1) + ')' : '') + '; ' + r.so_dat + '/' + r.so_ct + ' chỉ tiêu đạt kế hoạch, ' + r.so_chua + ' chưa đạt, ' + r.so_gap + ' chưa có số.');
    if (rk.length) s.push('Dẫn đầu: ' + rk.slice(0, 3).map(function (x) { return x.ten_ngan + ' (' + num(x.quy_doi, 1) + ')'; }).join(', ') + '. Thấp nhất: ' + rk.slice(-2).reverse().map(function (x) { return x.ten_ngan + ' (' + num(x.quy_doi, 1) + ')'; }).join(', ') + '.');
    var thap = ct.filter(function (x) { return x.tier === 'chua' || x.tier === 'cct'; }).sort(function (a, b) { return a.ht - b.ht; });
    if (thap.length) s.push('Chỉ tiêu cần ưu tiên khắc phục: ' + thap.slice(0, 4).map(function (x) { return x.ten_ngan + ' ' + pct(x.ht, 0); }).join('; ') + '.');
    if (r.du_bao !== null) s.push('Theo số liệu dự kiến đầu vào, điểm KPI cuối năm DỰ KIẾN khoảng ' + num(r.du_bao, 1) + ' (không phải số thực tế).');
    el.textContent = s.join(' ');
  });

  /* ===================== MÀN 2: ĐIỀU HÀNH BGĐ ===================== */
  function openTasks(m) { return (D('hd_tt') || []).filter(function (x) { return x.thang === m && x.trang_thai !== 'xong'; }).sort(function (a, b) { return (b.qua_han ? 1 : 0) - (a.qua_han ? 1 : 0) || b.muc - a.muc || (a.han < b.han ? -1 : 1); }); }
  dash.draw('bgd-q1', function (el) {
    if (!ready()) return; var r = tongRow(ky()); if (!r) return noData(el);
    el.innerHTML = 'Điểm KPI <b>' + num(r.quy_doi, 1) + '</b>' + (r.delta !== null ? ' (' + (r.delta >= 0 ? '▲' : '▼') + num(Math.abs(r.delta), 1) + ' so ' + esc(nhan(ky() - 1)) + ')' : '') + ', mức <b>' + V.LABEL[r.tier] + '</b>; ' + r.so_dat + '/' + r.so_ct + ' chỉ tiêu đạt, ' + (r.so_cct + r.so_chua) + ' cần cải thiện hoặc chưa đạt.' + (r.du_bao !== null ? ' <span class="dukien-tag">DỰ KIẾN</span> cuối năm ' + num(r.du_bao, 1) + '.' : '');
  });
  dash.draw('bgd-q2', function (el) {
    if (!ready()) return; var rk = rankRows(ky(), '').slice().sort(function (a, b) { return a.quy_doi - b.quy_doi; }), ct = ctRows(ky()).filter(function (x) { return isNum(x.mat) && x.mat > 0.005; }).sort(function (a, b) { return b.mat - a.mat; });
    if (!rk.length) return noData(el);
    el.innerHTML = 'Đơn vị thấp nhất: <b>' + esc(rk[0].ten_ngan) + '</b> (' + num(rk[0].quy_doi, 1) + ') và <b>' + esc(rk[1].ten_ngan) + '</b> (' + num(rk[1].quy_doi, 1) + ')' + (ct.length ? '. Chỉ tiêu CN mất nhiều điểm nhất: <b>' + esc(ct[0].ten_ngan) + '</b> (−' + num(ct[0].mat, 1) + ' điểm)' + (ct[1] ? ', <b>' + esc(ct[1].ten_ngan) + '</b> (−' + num(ct[1].mat, 1) + ')' : '') : '') + '.';
  });
  dash.draw('bgd-q3', function (el) {
    var t = openTasks(ky()); if (!D('hd_tt')) return; if (!t.length) { el.textContent = 'Chưa có nhiệm vụ cần xử lý trong kỳ này.'; return; }
    var late = t.filter(function (x) { return x.qua_han; }).length;
    el.innerHTML = '<b>' + t.length + '</b> việc đang mở' + (late ? ', trong đó <b>' + late + '</b> quá hạn' : '') + '. Ưu tiên: ' + t.slice(0, 2).map(function (x) { return esc(x.van_de); }).join('; ') + '.';
  });
  dash.draw('bgd-kpis', function (el) {
    if (!ready()) return; var r = tongRow(ky()); if (!r) return noData(el); var t = openTasks(ky()), late = t.filter(function (x) { return x.qua_han; }).length;
    var cb3 = (D('canh_bao') || []).filter(function (x) { return +x.thang === ky() && +x.muc === 3; }).length;
    var k1 = '<div class="vtb-stat">' + V.heroFigure({ label: 'Điểm KPI toàn chi nhánh', value: num(r.quy_doi, 1), unit: '/ 100', tier: r.tier, delta: r.delta === null ? '' : V.deltaBadge(r.delta, { digits: 1, vs: 'so ' + nhan(ky() - 1) }) }) + '</div>';
    var k2 = '<div class="vtb-stat"><div class="vtb-label">Điểm KPI cuối năm' + (r.du_bao !== null ? ' · <span class="dukien-tag">DỰ KIẾN</span>' : '') + '</div>' + (r.du_bao !== null ? '<div class="vtb-hero-row"><span class="vtb-hero-num" style="color:var(--forecast)">' + num(r.du_bao, 1) + '</span><span class="vtb-hero-unit">/ 100</span></div><div class="vtb-caption">Số dự kiến từ dữ liệu đầu vào, không phải số thực tế. Mức Đạt: ' + num(cfg().dat * 100, 0) + ' điểm.</div>' : '<div class="vtb-caption" style="margin-top:8px">Chưa có dữ liệu dự kiến cho kỳ này nên không hiển thị. Hệ thống không tự tạo dự báo.</div>') + '</div>';
    var k3 = '<div class="vtb-stat"><div class="vtb-label">Chỉ tiêu theo mức</div>' + V.tierBar({ dat: r.so_dat, kha: r.so_kha, cct: r.so_cct, chua: r.so_chua, gap: r.so_gap }) + '</div>';
    var k4 = '<div class="vtb-stat"><div class="vtb-label">Việc cần xử lý</div><div class="vtb-hero-row"><span class="vtb-hero-num">' + t.length + '</span><span class="vtb-hero-unit">việc đang mở</span></div><div class="vtb-hero-meta">' + (late ? V.tierChip('chua', { text: late + ' quá hạn' }) : V.tierChip('dat', { text: 'Không quá hạn' })) + V.tierChip(cb3 ? 'cct' : 'dat', { text: cb3 + ' cảnh báo nghiêm trọng' }) + '</div></div>';
    el.innerHTML = k1 + k2 + k3 + k4;
  });
  dash.draw('bgd-rank', function (el) { rankDraw(el, true); });
  dash.draw('bgd-loss', function (el) {
    if (!ready()) return; var rows = ctRows(ky()).filter(function (x) { return isNum(x.mat) && x.mat > 0.005; }).sort(function (a, b) { return b.mat - a.mat; }).slice(0, stage() ? 4 : 7);
    if (!rows.length) { el.innerHTML = '<p class="vtb-empty">Không có chỉ tiêu mất điểm.</p>'; return; }
    var tbl = V.dataTable({ caption: 'Chỉ tiêu mất điểm nhiều nhất', cols: [{ k: 'ten', t: 'Chỉ tiêu' }, { k: 'ht', t: '% hoàn thành', cls: 'vtb-r' }, { k: 'mat', t: 'Điểm mất', cls: 'vtb-r' }, { k: 'tier', t: 'Mức' }], rows: rows.map(function (r) { return { _key: r.ct, ten: r.ten_ngan, ht: pct(r.ht, 0), mat: '−' + num(r.mat, 2), tier: V.LABEL_LONG[r.tier] }; }) });
    el.innerHTML = pair(V.lossBars(rows.map(function (r) { return { ct: r.ct, name: r.ten_ngan, sub: r.nhom + ' · ' + pct(r.ht, 0) + ' kế hoạch', val: r.mat, valTxt: '−' + num(r.mat, 1) + ' điểm', tier: r.tier }; })), tbl);
  });
  dash.draw('bgd-focus', function (el) {
    if (!ready() || !D('mat_diem')) return; var rows = rankRows(ky(), '').slice().sort(function (a, b) { return a.quy_doi - b.quy_doi; }).slice(0, stage() ? 4 : 5), c = cfg();
    var items = rows.map(function (r) { var top = D('mat_diem').filter(function (x) { return x.dv === r.dv && x.thang === ky(); })[0];
      return { dv: r.dv, name: r.ten_ngan, sub: top ? 'mất nhiều nhất: ' + top.ten_ct + ' (−' + num(top.mat, 1) + ')' : r.canhbao, val: Math.max(0, 100 * c.dat - r.quy_doi), valTxt: '−' + num(Math.max(0, 100 * c.dat - r.quy_doi), 1) + ' điểm', tier: r.tier, diem: r.quy_doi }; });
    var tbl = V.dataTable({ caption: 'Đơn vị cần tập trung chỉ đạo', cols: [{ k: 'ten', t: 'Đơn vị' }, { k: 'diem', t: 'Điểm KPI', cls: 'vtb-r' }, { k: 'gap', t: 'GAP so mức Đạt', cls: 'vtb-r' }, { k: 'sub', t: 'Chỉ tiêu mất nhiều nhất' }, { k: 'tier', t: 'Mức' }], rows: items.map(function (x) { return { _key: x.dv, ten: x.name, diem: num(x.diem, 1), gap: x.valTxt, sub: x.sub, tier: V.LABEL_LONG[x.tier] }; }) });
    el.innerHTML = pair(V.lossBars(items), tbl);
  });
  dash.draw('bgd-risk', function (el) {
    if (!ready()) return; var c = cfg(), rows = ctRows(ky()).filter(function (x) { return x.ket_luan === 'khong_dat' || x.ket_luan === 'nguy_co'; }).sort(function (a, b) { return a.ht_du_bao - b.ht_du_bao; });
    if (!rows.length) { el.innerHTML = '<p class="vtb-empty">Chưa có dữ liệu dự kiến cho kỳ này, hoặc không có chỉ tiêu nguy cơ. Hệ thống không tự tạo dự báo.</p>'; return; }
    rows = rows.slice(0, stage() ? 3 : 8);
    var html = rows.map(function (r) {
      var t = V.tierOf(r.ht_du_bao, ng(c));
      return V.bulletRow({ id: r.ct, name: r.ten_ngan, nhom: r.can_moi_thang === null ? '' : 'cần ' + fmtV(r.can_moi_thang, r.dvt) + (r.dvt === '%' ? '' : ' ' + r.dvt) + '/tháng', ht: r.ht_du_bao, tier: t, thTxt: 'DỰ KIẾN', khTxt: '', gapTxt: '', gapBad: true, cap: 1.3 }).replace('<small>DỰ KIẾN', '<small class="dk">DỰ KIẾN');
    }).join('');
    var tbl = V.dataTable({ caption: 'Chỉ tiêu có nguy cơ không đạt kế hoạch năm (DỰ KIẾN)', cols: [{ k: 'ten', t: 'Chỉ tiêu' }, { k: 'ht', t: '% KH năm (DỰ KIẾN)', cls: 'vtb-r' }, { k: 'can', t: 'Cần mỗi tháng', cls: 'vtb-r' }, { k: 'tier', t: 'Kết luận' }], rows: rows.map(function (r) { return { _key: r.ct, ten: r.ten_ngan, ht: pct(r.ht_du_bao, 0) + ' (DỰ KIẾN)', can: r.can_moi_thang === null ? '–' : fmtV(r.can_moi_thang, r.dvt) + ' ' + unitTxt(r.dvt), tier: r.ket_luan === 'khong_dat' ? 'Nguy cơ không đạt' : 'Cần theo dõi' }; }) });
    el.innerHTML = pair('<p class="vtb-caption" style="margin-bottom:6px"><span class="dukien-tag">DỰ KIẾN</span> % hoàn thành KH năm; vạch đen = 100%.</p>' + html, tbl);
  });
  dash.draw('bgd-tasks', function (el) {
    if (!D('hd_tt') || !D('don_vi')) return; var us = {}, t = openTasks(ky()).slice(0, 3); D('don_vi').forEach(function (u) { us[u.ma] = u.ten_ngan; });
    if (!t.length) { el.innerHTML = '<p class="vtb-empty">Không có nhiệm vụ đang mở.</p>'; return; }
    el.innerHTML = '<ul class="task-list">' + t.map(function (x) { return '<li>' + (x.qua_han ? V.tierChip('chua', { text: 'Quá hạn' }) : V.tierChip(x.muc >= 3 ? 'cct' : 'gap', { text: x.trang_thai === 'dang_lam' ? 'Đang làm' : 'Mới giao' })) + '<span class="t-b"><b>' + esc(x.van_de) + '</b><small>' + esc(x.dv ? us[x.dv] : 'Toàn CN') + ' · ' + esc(x.nguoi) + ' · hạn ' + esc(x.han.split('-').reverse().join('/')) + '</small></span></li>'; }).join('') + '</ul>';
  });
  dash.draw('bgd-actions', function (el) {
    if (!D('hd_tt')) return; var rows = (D('hd_tt') || []).filter(function (x) { return x.thang === ky(); });
    if (!rows.length) { el.innerHTML = '<p class="vtb-empty">Chưa ghi nhận vấn đề hoặc đề xuất hành động cho kỳ này.</p>'; return; }
    var us = {}; (D('don_vi') || []).forEach(function (u) { us[u.ma] = u.ten_ngan; });
    rows.sort(function (a, b) { return (b.qua_han ? 1 : 0) - (a.qua_han ? 1 : 0) || (a.trang_thai === 'xong' ? 1 : 0) - (b.trang_thai === 'xong' ? 1 : 0) || b.muc - a.muc; });
    var TT = { moi: 'Mới giao', dang_lam: 'Đang làm', xong: 'Đã xong' }, LV = { 3: 'chua', 2: 'cct', 1: 'gap' }, LVT = { 3: 'Cao', 2: 'Trung bình', 1: 'Thấp' };
    el.innerHTML = V.dataTable({ caption: 'Vấn đề và đề xuất hành động', cols: [{ k: 'muc', t: 'Ưu tiên', html: true }, { k: 'vd', t: 'Vấn đề → đề xuất', html: true }, { k: 'dv', t: 'Đơn vị' }, { k: 'nguoi', t: 'Phụ trách' }, { k: 'han', t: 'Hạn' }, { k: 'tt', t: 'Trạng thái', html: true }],
      rows: rows.map(function (x) { return { _key: x.id, muc: V.tierChip(LV[x.muc], { text: LVT[x.muc] }), vd: '<span class="cell-act-title"><b>' + esc(x.van_de) + '</b><small>' + esc(x.de_xuat) + '</small></span>', dv: x.dv ? us[x.dv] : 'Toàn CN', nguoi: x.nguoi, han: x.han.split('-').reverse().join('/'),
        tt: (x.trang_thai === 'xong' ? V.tierChip('dat', { text: TT[x.trang_thai] }) : '<span class="vtb-caption">' + TT[x.trang_thai] + '</span>') + (x.qua_han ? ' <span class="tag-late">' + V.tierChip('chua', { text: 'Quá hạn' }) + '</span>' : '') }; }) });
  });
  dash.draw('bgd-growth', function (el) {
    if (!ready()) return; var rows = ctRows(ky()).filter(function (x) { return isNum(x.th) && (isNum(x.yoy) || isNum(x.ytd) || isNum(x.mom)); });
    if (!rows.length) return noData(el);
    var f = function (v, u) { return isNum(v) ? sgn(v, 1) + (u || '%') : '–'; };
    el.innerHTML = V.dataTable({ caption: 'Chỉ tiêu tăng trưởng', cols: [{ k: 'ten', t: 'Chỉ tiêu' }, { k: 'th', t: 'Thực hiện', cls: 'vtb-r' }, { k: 'mom', t: 'So tháng trước', cls: 'vtb-r' }, { k: 'yoy', t: 'So cùng kỳ năm trước', cls: 'vtb-r' }, { k: 'ytd', t: 'So đầu năm', cls: 'vtb-r' }, { k: 'tier', t: 'Mức', html: true }],
      rows: rows.map(function (r) { return { _key: r.ct, ten: r.ten_ngan, th: fmtV(r.th, r.dvt) + ' ' + unitTxt(r.dvt), mom: f(r.mom, r.mom_u === '%' ? '%' : ' đ%'), yoy: f(r.yoy), ytd: f(r.ytd), tier: V.tierChip(r.tier) }; }) });
  });
  dash.draw('bgd-matrix', function (el) {
    if (!ready()) return; var cm = {}, k = D('kq'); (D('chi_tieu') || []).forEach(function (c) { cm[c.ma] = c; });
    var cols = MATRIX_CT.map(function (id) { return { ct: id, name: cm[id].ten_ngan }; }), units = (D('don_vi') || []).filter(function (u) { return u.ma !== 'CN'; });
    var rows = units.map(function (u) { var cells = {}; k.forEach(function (r) { if (r.dv === u.ma && r.thang === ky() && MATRIX_CT.indexOf(r.ct) >= 0) cells[r.ct] = { ht: r.ht, tier: r.tier }; }); return { dv: u.ma, name: u.ten_ngan, cells: cells }; });
    el.innerHTML = V.stateMatrix({ cols: cols, rows: rows, active: P().dv || '' });
  });
  dash.draw('bgd-fresh', function (el) {
    if (!ready()) return; var r = kyRow(ky()); if (!r) return; var rows = D('kq').filter(function (x) { return x.thang === ky() && x.dv !== 'CN'; }), co = rows.filter(function (x) { return x.th !== null; }).length;
    var bt = (D('bat_thuong') || []).filter(function (x) { return +x.thang === ky(); }).length;
    el.innerHTML = V.dataFreshness({ capNhat: r.cap_nhat_luc, ky: r.nhan + ' (lũy kế)', khoa: r.khoa === 'true', soLieu: co + '/' + rows.length + ' ô thực hiện đã nhập', extra: bt + ' số liệu bất thường · Dữ liệu giả lập' });
  });

  /* ===================== ĐIỀU KHIỂN: màn hình, trình chiếu, chọn, chuyển bảng ===================== */
  function setScale() { var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080); root.style.setProperty('--s', String(Math.max(0.2, s))); }
  function apply() {
    var m = man(), st = P().tc === '1', pr = P();
    root.classList.toggle('is-stage', st);
    ['tong-quan', 'dieu-hanh'].forEach(function (n) { var s = document.getElementById('screen-' + n); if (s) s.hidden = n !== m; });
    root.querySelectorAll('.tab').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-man') === m ? 'true' : 'false'); });
    root.querySelectorAll('.pill[data-khoi]').forEach(function (b) { b.setAttribute('aria-pressed', (b.getAttribute('data-khoi') === (pr.khoi || '')) ? 'true' : 'false'); });
    if (st) setScale();
  }
  dash.onData(apply); window.addEventListener('resize', function () { if (stage()) setScale(); });

  function go(p) { dash.setParams(p); }
  function scrollTo(id) { var e = document.getElementById(id); if (e && e.scrollIntoView && !stage()) e.scrollIntoView({ block: 'start' }); }
  root.addEventListener('click', function (e) {
    var t = e.target, b;
    if ((b = t.closest('.tab'))) { go({ man: b.getAttribute('data-man') }); return; }
    if (t.closest('#btn-present')) { go({ tc: '1' }); return; }
    if (t.closest('#btn-exit-present')) { go({ tc: '0' }); return; }
    if ((b = t.closest('.pill[data-khoi]'))) { go({ khoi: b.getAttribute('data-khoi') }); return; }
    if ((b = t.closest('.seg button'))) { var card = b.closest('[data-view-card]'); if (card) { card.classList.toggle('is-table', b.getAttribute('data-view') === 'table'); b.parentNode.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); } return; }
    if (t.closest('#btn-clear-dv')) { go({ dv: '' }); return; }
    if (t.closest('#btn-copy-nd')) { var tx = document.getElementById('nd-text').textContent; if (navigator.clipboard) navigator.clipboard.writeText(tx).catch(function () {}); return; }
    if (t.closest('.vtb-tip')) return;
    if ((b = t.closest('[data-ct]')) && !t.closest('th[data-ct]')) { if (stage() || man() === 'dieu-hanh') { go({ man: 'tong-quan', tc: '0', ct: b.getAttribute('data-ct') }); } else { go({ ct: b.getAttribute('data-ct') }); } setTimeout(function () { scrollTo('tq-bullets'); }, 50); return; }
    if ((b = t.closest('[data-dv]'))) { var d = b.getAttribute('data-dv'); if (man() === 'dieu-hanh') { go({ man: 'tong-quan', tc: '0', dv: d }); } else { go({ dv: P().dv === d ? '' : d }); } setTimeout(function () { scrollTo('tq-bullets'); }, 50); return; }
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && stage()) { go({ tc: '0' }); }
    else if (stage() && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) { go({ man: man() === 'dieu-hanh' ? 'tong-quan' : 'dieu-hanh' }); }
  });
})();
