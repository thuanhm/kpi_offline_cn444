/* MOI-VIEWS (1/2) — tiện ích dùng chung + màn hình Tổng quan chi nhánh + Điều hành Ban giám đốc (giao diện mới).
 * Dữ liệu: STORE.model() qua MOI_DATA (không tính lại nghiệp vụ). Thành phần: VTB (Design System). Trạng thái: dùng chung APP/A với giao diện cũ. */
(function (root) {
  var V = root.VTB, D = root.MOI_DATA, E = root.KPI_ENGINE, CN = root.KPI_CFG.MA_CN;
  var esc = V.esc, num = V.num, pct = V.pct, sgn = V.sgn, isNum = V.isNum;
  var H = root.MOI_UI = { VIEWS: {}, CH: {} };

  /* ---------- tiện ích ---------- */
  H.kyTxt = function (k) { return 'T' + k.thang + '/' + k.nam; };
  H.kyTruoc = function (k) { return k.thang > 1 ? 'T' + (k.thang - 1) + '/' + k.nam : null; };
  H.fmtV = function (v, ind) { return isNum(v) ? (root.UI ? UI.val(v, ind) : num(v)) : '–'; };
  H.kyNgay = function (t) { return t ? new Date(t).toLocaleString('vi-VN') : '–'; };
  H.dvt = function (ind) { return ind && ind.dvt && ind.dvt !== '%' ? ind.dvt : ''; };
  H.gapTxt = function (r) { return isNum(r.gap) ? sgn(r.gap, Math.abs(r.gap) >= 1000 ? 0 : 2) + (r.dvt === '%' ? ' đ%' : '') : '–'; };
  H.pair = function (chart, table) { return '<div class="moi-vchart">' + chart + '</div><div class="moi-vtable">' + table + '</div>'; };
  H.tbl = function (o) { return V.dataTable(o); };
  H.empty = function (msg) { return '<p class="vtb-empty">' + esc(msg) + '</p>'; };
  H.seg = function (label) { return '<div class="moi-seg" role="group" aria-label="' + esc(label) + '"><button type="button" data-view="chart" aria-pressed="true">Biểu đồ</button><button type="button" data-view="table" aria-pressed="false">Bảng</button></div>'; };
  H.card = function (cls, title, body, extra) { return '<section class="moi-card ' + cls + '" data-view-card><div class="moi-head"><h2>' + title + '</h2>' + (extra || '') + '</div>' + body + '</section>'; };
  H.cardPlain = function (cls, title, body, extra) { return '<section class="moi-card ' + cls + '"><div class="moi-head"><h2>' + title + '</h2>' + (extra || '') + '</div>' + body + '</section>'; };
  H.nenKy = function (A, M) { var T = D.tongQuan(M, A.ky); return T.co_so; };
  H.thieuSo = function (A) {
    return '<div class="moi-card moi-empty"><h2>Chưa có số thực hiện</h2><p>Kỳ ' + H.kyTxt(A.ky) + ' chưa có số liệu. Chọn kỳ khác ở góc trên' + (STORE.isAdmin() ? ' hoặc <a href="#/nhap-so">nhập số liệu</a>.' : '.') + '</p></div>';
  };
  H.rankHtml = function (A, rows, o) {
    var M = STORE.model(); o = o || {};
    var tbl = H.tbl({ caption: 'Xếp hạng đơn vị ' + H.kyTxt(A.ky), cols: [{ k: 'hang', t: 'Hạng', cls: 'vtb-r' }, { k: 'ten', t: 'Đơn vị' }, { k: 'khoi', t: 'Khối' }, { k: 'diem', t: 'Điểm KPI', cls: 'vtb-r' }, { k: 'delta', t: 'So kỳ trước', cls: 'vtb-r' }, { k: 'gap', t: 'GAP điểm', cls: 'vtb-r' }, { k: 'tier', t: 'Mức' }, { k: 'cb', t: 'Cảnh báo' }],
      rows: rows.map(function (r) { return { _key: r.ma, hang: r.hang || '–', ten: r.ten, khoi: r.khoi, diem: num(r.diem, 1), delta: isNum(r.delta) ? sgn(r.delta, 1) : '–', gap: isNum(r.gap) ? sgn(r.gap, 1) : '–', tier: V.LABEL_LONG[r.tier], cb: r.canhbao || '–' }; }) });
    return H.pair(V.heatLegend({ compact: true, title: '% hoàn thành chung' }) + V.rankBars(rows, { ng: M.ng, selected: o.selected || '', noSpark: !!o.noSpark }), tbl);
  };
  /* Dải thẻ KPI từ dữ liệu engine (một dòng/chỉ tiêu). soSanh: hàm sẵn có của màn "Theo dõi chỉ tiêu" để lấy mức thay đổi. */
  H.kpiCards = function (M, A, T, active) {
    var ss = root.VIEWS['chi-tieu'] && VIEWS['chi-tieu'].soSanh;
    return T.kpi.map(function (r) {
      var kieu = E.kieuSo(r.ind), s = ss ? ss(M, r.ma, CN, A.ky.nam, A.ky.thang, kieu) : null, xau = r.huong === 'thap_tot';
      var p = s ? (kieu === 'so_du' ? s.tt_p : s.ck_p) : null, vs = kieu === 'so_du' ? 'so ' + (H.kyTruoc(A.ky) || 'đầu năm') : 'so cùng kỳ ' + (A.ky.nam - 1);
      var dl = isNum(p) ? '<span title="' + esc('Thay đổi ' + vs) + '">' + V.deltaBadge(p * 100, { digits: 1, unit: '%', lowerIsBetter: xau }) + '</span>' : '';
      return V.kpiCard({ id: r.ma, htv: r.ht, label: r.ten_ngan, value: H.fmtV(r.th, r.ind).replace('%', ''), unit: r.dvt === '%' ? '%' : r.dvt, sub: isNum(r.kh) ? 'KH ' + H.fmtV(r.kh, r.ind) + (isNum(r.gap) ? ' · GAP ' + H.gapTxt(r) : '') : (r.huong === 'nhap_ty_le' ? 'Tự đánh giá % hoàn thành' : 'Chưa có kế hoạch'),
        ht: isNum(r.ht) ? pct(r.ht, 0) + (r.huong === 'nhap_ty_le' ? '' : ' KH') : 'Thiếu số', tier: r.tier, delta: dl, spark: V.sparkline(M.indSeries(r.ma, CN, A.ky.nam).th.slice(0, A.ky.thang), { w: 70, h: 24 }), active: r.ma === active });
    }).join('');
  };

  /* ---------- biểu đồ (vẽ sau khi biết bề rộng thật) ---------- */
  H.CH['trend'] = function (el, A, st) {
    var M = STORE.model(), T = D.tongQuan(M, A.ky), w = Math.max(320, el.clientWidth || 600), ng = M.ng;
    var fc = T.du_bao !== null && isNum(T.cn.quy_doi) ? { from: { i: A.ky.thang - 1, v: T.cn.quy_doi }, to: { i: 11, v: T.du_bao } } : null;
    /* trục bắt đầu/kết thúc đúng mốc nhãn (làm tròn 10): 70–130 mặc định (điểm quy đổi có thể vượt 130), tự mở rộng khi số liệu vượt; bước lưới 10 khi khoảng ≤ 60, ngược lại 20 */
    /* Điểm KPI Giám đốc chi nhánh (thẻ điểm BGĐ, hàm sẵn có của hệ thống) — chỉ khi được phép xem thẻ điểm BGĐ (quản trị hoặc đã bật công khai) */
    var gdMa = null, gd = null;
    try { if (M.scoreSeriesBgd && (STORE.isAdmin() || STORE.state.settings.bgd_cong_khai)) { var gds = M.bgdDs(), g0 = gds.filter(function (m) { return m.ma === 'GD'; })[0] || gds.filter(function (m) { return /giám đốc/i.test(m.chuc_danh || '') && !/phó/i.test(m.chuc_danh || ''); })[0]; if (g0) { gdMa = g0.ma; gd = M.scoreSeriesBgd(g0.ma, A.ky.nam).map(function (v, i) { return i < A.ky.thang ? v : null; }); } } } catch (e) { gd = null; }
    var vAll = T.series_cn.concat(T.series_bq, [T.du_bao], gd || []).filter(isNum);
    var yDuoi = Math.min(70, Math.floor(Math.min.apply(null, vAll.concat([70])) / 10) * 10), yTren = Math.max(130, Math.ceil(Math.max.apply(null, vAll.concat([130])) / 10) * 10);
    var hFit = !st && el.__fitting ? el.__hFit : (st ? 190 : 290);   // mỗi lần vẽ mới bắt đầu từ 290 rồi mới nới theo thẻ (thu lại được khi thẻ thấp đi)
    var chart = V.trendLine({ w: w, h: hFit, rightPad: st ? Math.max(132, Math.min(150, w * 0.26)) : 'auto', axisFmt: st ? null : function (v) { return num(v, 0); }, refDash: !st, legendPlot: !st, series: [{ name: 'Toàn CN', vals: T.series_cn }, { name: 'BQ đơn vị', vals: T.series_bq, color: 'var(--series-accent)', thin: true, labelColor: 'var(--ink-2)' }].concat(gd ? [{ name: 'Giám đốc CN', vals: gd, color: 'var(--series-4)', thin: true, labelColor: 'var(--series-4)' }] : []),
      refs: [{ v: ng.dat * 100, label: 'Đạt ' + num(ng.dat * 100, 0) }, { v: ng.kha * 100, label: 'Khá ' + num(ng.kha * 100, 0) }], forecast: fc, yMin: st ? 60 : yDuoi, yMax: st ? Math.max(110, Math.ceil(Math.max.apply(null, T.series_cn.filter(isNum).concat([100])) / 10) * 10) : yTren, yStep: st ? null : (yTren - yDuoi <= 60 ? 10 : 20), bottomPad: st ? null : 36, aria: 'Diễn biến điểm KPI toàn chi nhánh đến ' + H.kyTxt(A.ky) });
    var note = fc ? '' : '<p class="vtb-caption">Chưa có số dự kiến cho kỳ này — biểu đồ chỉ hiển thị số thực tế.</p>';
    var rows = []; for (var i = 0; i < 12; i++) if (isNum(T.series_cn[i])) rows.push({ _key: i + 1, th: 'T' + (i + 1), cn: num(T.series_cn[i], 1), bq: isNum(T.series_bq[i]) ? num(T.series_bq[i], 1) : '–', gd: gd && isNum(gd[i]) ? num(gd[i], 1) : '–', loai: 'Thực tế' });
    if (fc) rows.push({ _key: 12, th: 'T12', cn: num(T.du_bao, 1), bq: '–', gd: '–', loai: 'DỰ KIẾN (không phải số thực tế)' });
    el.innerHTML = H.pair(chart + note, H.tbl({ caption: 'Điểm KPI theo tháng', cols: [{ k: 'th', t: 'Tháng' }, { k: 'cn', t: 'Toàn chi nhánh', cls: 'vtb-r' }, { k: 'bq', t: 'BQ đơn vị', cls: 'vtb-r' }].concat(gd ? [{ k: 'gd', t: 'Giám đốc CN', cls: 'vtb-r' }] : []).concat([{ k: 'loai', t: 'Loại số liệu' }]), rows: rows }));
    if (!st && !el.__fitting) {
      var vc = el.querySelector('.moi-vchart'), svg = el.querySelector('svg.vtb-trend');
      if (vc && svg && svg.getBoundingClientRect().width) {
        /* .moi-ch giãn hết phần còn lại của thẻ (CSS); phần dư = chiều cao .moi-ch − nội dung. Trần theo tỷ lệ 0,8 × rộng (≤ 480px) để không méo; dư nữa thì căn giữa dọc */
        var thua = el.getBoundingClientRect().height - vc.getBoundingClientRect().height;
        var hMoi = Math.max(240, Math.min(480, Math.round(w * 0.8), Math.round(hFit + thua)));
        if (Math.abs(hMoi - hFit) > 6) { el.__hFit = hMoi; el.__fitting = true; try { H.CH['trend'](el, A, st); } finally { el.__fitting = false; } }
      }
    }
  };
  function selCt(A, M, T) { var c = A.moi_ct; return c && M.indMap[c] ? c : (T.kpi[0] ? T.kpi[0].ma : (M.inds[0] && M.inds[0].ma)); }
  H.selCt = selCt;
  H.CH['compare'] = function (el, A) {
    var M = STORE.model(), T = D.tongQuan(M, A.ky), ct = el.getAttribute('data-ct') || selCt(A, M, T), ind = M.indMap[ct], dvA = el.getAttribute('data-dv'), dv = dvA !== null ? (dvA && M.unitMap[dvA] ? dvA : CN) : (A.moi_dv && (M.unitMap[A.moi_dv]) ? A.moi_dv : CN); if (!ind) return;
    if (dv !== CN && !M.apDung(ct, dv)) { el.innerHTML = H.empty('Chỉ tiêu này không áp dụng cho đơn vị đã chọn.'); return; }
    var s = M.indSeries(ct, dv, A.ky.nam), f = function (v) { return H.fmtV(v, ind); }, w = Math.max(320, el.clientWidth || 600), th = s.th.map(function (v, i) { return i < A.ky.thang ? v : null; });
    if (!s.kh.some(isNum) && !th.some(isNum)) { el.innerHTML = H.empty('Chưa có số liệu của chỉ tiêu này.'); return; }
    var chart = V.trendLine({ w: w, h: 270, rightPad: Math.min(170, w * 0.3), series: [{ name: 'Thực hiện', vals: th }, { name: 'Kế hoạch', vals: s.kh, color: 'var(--series-accent)', thin: true, labelColor: 'var(--ink-2)' }], fmt: f, yMin: ind.dvt === '%' ? undefined : 0, aria: 'Thực hiện so với kế hoạch ' + ind.ten_ngan });
    var rows = []; for (var i = 0; i < 12; i++) if (isNum(s.kh[i]) || isNum(th[i])) rows.push({ _key: i + 1, th: 'T' + (i + 1), kh: f(s.kh[i]), tt: f(th[i]), ht: isNum(s.ht[i]) && isNum(th[i]) ? pct(s.ht[i], 0) : '–' });
    el.innerHTML = H.pair(chart, H.tbl({ caption: 'Thực hiện so với kế hoạch', cols: [{ k: 'th', t: 'Tháng' }, { k: 'kh', t: 'Kế hoạch', cls: 'vtb-r' }, { k: 'tt', t: 'Thực hiện', cls: 'vtb-r' }, { k: 'ht', t: '% hoàn thành', cls: 'vtb-r' }], rows: rows }));
  };
  H.CH['growth'] = function (el, A) {
    var M = STORE.model(), T = D.tongQuan(M, A.ky), ct = el.getAttribute('data-ct') || selCt(A, M, T), ind = M.indMap[ct], dvA = el.getAttribute('data-dv'), dv = dvA !== null ? (dvA && M.unitMap[dvA] ? dvA : CN) : (A.moi_dv && M.unitMap[A.moi_dv] ? A.moi_dv : CN), gt = VIEWS['chi-tieu'] && VIEWS['chi-tieu'].giaTri; if (!ind || !gt) return;
    var kieu = E.kieuSo(ind), vals = []; for (var t = 1; t <= 12; t++) vals.push(t <= A.ky.thang ? gt(M, ind, dv, A.ky.nam, t, 'tang', kieu) : null);
    if (!vals.some(isNum)) { el.innerHTML = H.empty('Chưa đủ số liệu để tính tăng trưởng.'); return; }
    var fm = function (v) { return sgn(v, Math.abs(v) >= 100 ? 0 : 1) + (ind.dvt === '%' ? ' đ%' : ''); };
    el.innerHTML = H.pair(V.columnDiverge({ w: Math.max(320, el.clientWidth || 520), h: 250, vals: vals, fmt: fm, short: function (v) { return sgn(v, Math.abs(v) >= 100 ? 0 : 1); }, aria: (kieu === 'so_du' ? 'Tăng giảm so tháng trước' : 'Phát sinh trong tháng') + ' của ' + ind.ten_ngan }),
      H.tbl({ caption: kieu === 'so_du' ? 'Tăng/giảm so tháng trước' : 'Phát sinh trong tháng', cols: [{ k: 'th', t: 'Tháng' }, { k: 'v', t: kieu === 'so_du' ? 'Tăng/giảm' : 'Phát sinh', cls: 'vtb-r' }], rows: vals.map(function (v, i) { return isNum(v) ? { _key: i + 1, th: 'T' + (i + 1), v: fm(v) } : null; }).filter(Boolean) }));
  };
  H.ve = function (root0, st) {
    [].forEach.call(root0.querySelectorAll('[data-ch]'), function (el) { var f = H.CH[el.getAttribute('data-ch')]; if (!f) return; try { f(el, APP, !!st); } catch (e) { console.error('biểu đồ', el.getAttribute('data-ch'), e); el.innerHTML = H.empty('Không vẽ được biểu đồ.'); } });
  };

  /* ====================== TỔNG QUAN CHI NHÁNH ====================== */
  H.VIEWS['tong-quan'] = {
    html: function (A, st) {
      var M = STORE.model(), T = D.tongQuan(M, A.ky); if (!T.co_so) return H.thieuSo(A);
      var cn = T.cn, ng = M.ng, ct = selCt(A, M, T), dv = A.moi_dv && M.unitMap[A.moi_dv] ? A.moi_dv : '';
      var prevTxt = H.kyTruoc(A.ky);
      var hero = V.heroFigure({ label: 'Điểm KPI toàn chi nhánh · lũy kế ' + H.kyTxt(A.ky), value: num(cn.quy_doi, 1), unit: '/ 100 điểm', tier: T.tier,
        delta: T.delta === null ? '<span class="vtb-caption">Chưa có kỳ trước để so sánh</span>' : V.deltaBadge(T.delta, { digits: 1, vs: 'so ' + prevTxt }), spark: V.sparkline(T.series_cn, { w: 220, h: 36, label: 'Điểm KPI toàn chi nhánh các tháng đến ' + H.kyTxt(A.ky) }),
        note: num(cn.diem, 2) + ' / ' + cn.ts + ' điểm theo trọng số' + (Math.abs(cn.dc_diem) > 0.004 ? ' · cộng/trừ ' + sgn(cn.dc_diem, 2) : '') });
      var s = T.stats, stats = V.statTile({ label: 'Đơn vị ≥ ' + num(s.diem_cao, 0) + ' điểm', value: s.cao + '/' + s.so_dv, sub: 'ngưỡng cấu hình nguong' }) + V.statTile({ label: 'Đơn vị dưới mức Khá', value: String(s.duoi_kha), sub: 'trên ' + s.so_dv + ' đơn vị' }) +
        V.statTile({ label: 'Chỉ tiêu cần chú ý', value: String(s.can_chu_y), sub: 'Cần cải thiện + Chưa đạt' }) + V.statTile({ label: 'Cảnh báo nghiêm trọng', value: String(s.canh_bao3), sub: 'trong ' + T.alerts.length + ' cảnh báo' });
      var rkAll = T.rk, rkShow = rkAll;   // thẻ Xếp hạng ở Tổng quan luôn hiện toàn bộ đơn vị (không có bộ lọc nhóm)
      /* cảnh báo */
      var lowDv = rkAll.filter(function (r) { return isNum(r.diem) && r.diem < ng.kha * 100; }).sort(function (a, b) { return a.diem - b.diem; }).map(function (r) { return { muc: r.diem < ng.cct * 100 ? 3 : 2, loai: r.ten, text: 'đạt ' + num(r.diem, 1) + ' điểm (GAP ' + sgn(r.gap, 1) + '), hạng ' + (r.hang || '–') + '. ' + (r.canhbao ? r.canhbao + '.' : ''), dv: r.ma }; });
      var kp = []; T.rows.forEach(function (r) { if (r.tham_khao) return; if (r.tier === 'chua' || r.tier === 'cct') kp.push({ muc: r.tier === 'chua' ? 3 : 2, loai: r.tier === 'chua' ? 'KPI chưa đạt' : 'Cần cải thiện', text: r.ten_ngan + ': ' + pct(r.ht, 0) + ' kế hoạch' + (isNum(r.mat) ? ', mất ' + num(r.mat, 2) + ' điểm' : '') + '.', ct: r.ma, k: r.ht }); });
      if (T.X && T.X.cn) T.X.cn.rows.forEach(function (r) { if (r.ket_luan === 'khong_dat' && isNum(r.ht_du_bao)) kp.push({ muc: 2, loai: 'Nguy cơ không đạt KH năm', text: r.ind.ten_ngan + ': DỰ KIẾN chỉ đạt ' + pct(r.ht_du_bao, 0) + ' kế hoạch năm.', ct: r.ma, k: r.ht_du_bao }); });
      kp.sort(function (a, b) { return b.muc - a.muc || (a.k || 0) - (b.k || 0); });
      var gy = VIEWS['canh-bao'] && VIEWS['canh-bao'].goiY ? VIEWS['canh-bao'].goiY(M, A.ky) : [];
      var lim = st ? 2 : 6;
      var alerts = '<h3 class="moi-h3">Đơn vị có kết quả thấp</h3>' + (lowDv.length ? V.attentionList(lowDv.slice(0, lim)) : H.empty('Không có đơn vị nào dưới mức Khá.')) +
        '<h3 class="moi-h3">KPI chưa đạt và nguy cơ không hoàn thành</h3>' + (kp.length ? V.attentionList(kp.slice(0, lim)) : H.empty('Không có KPI cần cảnh báo.')) +
        '<div class="moi-secondary"><h3 class="moi-h3">Vấn đề cần điều hành</h3>' + (gy.length ? V.attentionList(gy.slice(0, 8).map(function (x) { return { muc: x.muc, loai: x.loai, text: x.text, href: x.href }; })) : H.empty('Chưa có cảnh báo ghi nhận cho kỳ này.')) + '</div>';
      /* chi tiết chỉ tiêu: theo CN hoặc đơn vị đã chọn */
      var rowsBl, scope = 'Toàn chi nhánh', cardU = null;
      if (dv) { cardU = M.card(dv, A.ky.nam, A.ky.thang); rowsBl = D.cardRows(cardU).map(D.rowVM); scope = cardU.ten_ngan; } else rowsBl = T.rows;
      rowsBl = rowsBl.slice().sort(function (a, b) { return (a.thu_tu - b.thu_tu); });
      var nhomOrd = E.sapXepChiTieu(rowsBl.map(function (r) { return r.ind; })), ordIdx = {}; nhomOrd.forEach(function (i, k) { ordIdx[i.ma] = k; }); rowsBl.sort(function (a, b) { return ordIdx[a.ma] - ordIdx[b.ma]; });
      var bl = '', lastN = null;
      rowsBl.forEach(function (r) {
        var g = r.nhom || 'Khác'; if (g !== lastN) { lastN = g; bl += '<div class="moi-grp">' + esc(g) + '</div>'; }
        bl += V.bulletRow({ id: r.ma, name: r.ten_ngan, nhom: r.tham_khao ? 'quản trị · không chấm điểm' : (isNum(r.ts) ? 'trọng số ' + r.ts : ''), ht: r.ht, tier: r.tier, thTxt: isNum(r.th) ? H.fmtV(r.th, r.ind) : 'Chưa có số', khTxt: isNum(r.kh) ? H.fmtV(r.kh, r.ind) : '', gapTxt: isNum(r.gap) ? H.gapTxt(r) : '–', gapBad: isNum(r.gap) && (r.huong === 'thap_tot' ? r.gap > 0 : r.gap < 0), active: r.ma === ct, cap: Math.max(1.3, 1) });
      });
      var blTbl = H.tbl({ caption: 'Tỷ lệ hoàn thành kế hoạch theo chỉ tiêu', cols: [{ k: 'ten', t: 'Chỉ tiêu' }, { k: 'nhom', t: 'Nhóm' }, { k: 'th', t: 'Thực hiện', cls: 'vtb-r' }, { k: 'kh', t: 'Kế hoạch', cls: 'vtb-r' }, { k: 'ht', t: '% hoàn thành', cls: 'vtb-r' }, { k: 'gap', t: 'GAP', cls: 'vtb-r' }, { k: 'tier', t: 'Mức' }],
        rows: rowsBl.map(function (r) { return { _key: r.ma, ten: r.ten_ngan, nhom: r.nhom, th: H.fmtV(r.th, r.ind), kh: H.fmtV(r.kh, r.ind), ht: isNum(r.ht) ? pct(r.ht, 0) : '–', gap: isNum(r.gap) ? H.gapTxt(r) : '–', tier: V.LABEL_LONG[r.tier] }; }) });
      var drill = dv && cardU ? '<div class="moi-drill"><div><div class="vtb-label">' + esc(cardU.ten) + ' · ' + esc(cardU.khoi) + '</div><div class="vtb-hero-row"><span class="vtb-hero-num">' + num(cardU.quy_doi, 1) + '</span><span class="vtb-hero-unit">/ 100 · ' + (function () { var r = rkAll.filter(function (x) { return x.ma === dv; })[0]; return r && r.hang ? 'hạng ' + r.hang : 'chưa xếp hạng'; })() + '</span></div></div><div class="vtb-hero-meta">' + V.tierChip(D.tierHt(M, cardU.ht_chung)) + '</div><div class="moi-drill-bar">' + V.tierBar({ dat: cardU.so_dat, kha: cardU.so_kha, cct: cardU.so_cct, chua: cardU.so_chua, gap: cardU.so_thieu }) + '</div><a class="moi-link" href="#/phong/' + esc(dv) + '">Mở thẻ điểm đơn vị →</a></div>'
        : '<p class="moi-hint">Đang xem toàn chi nhánh. Bấm một phòng/PGD ở bảng xếp hạng để xuống chi tiết từng chỉ tiêu của đơn vị đó; bấm một chỉ tiêu để xem biểu đồ so sánh với kế hoạch.</p>';
      var cind = M.indMap[ct];
      var nd = root.KPI_NHAN_DINH ? KPI_NHAN_DINH(M, A.ky, cn, T.prev, rkAll.map(function (r) { return r.card; })) : '';
      return '<div class="moi-grid moi-tq">' +
        '<section class="moi-card moi-c3 a-hero" aria-label="Điểm KPI toàn chi nhánh">' + hero + '<div class="moi-sep"></div><div class="vtb-label">Phân bố chỉ tiêu theo mức</div><div class="moi-mt">' + V.tierBar(T.counts) + '</div></section>' +
        '<div class="moi-c9 a-topright"><div class="moi-kpis a-kpis">' + H.kpiCards(M, A, T, ct) + '</div><div class="moi-stats">' + stats + '</div></div>' +
        H.card('moi-c7 a-rank', 'Xếp hạng phòng/PGD', '<p class="vtb-caption moi-sub">Bấm một đơn vị để xem chi tiết các chỉ tiêu bên dưới. Hai vạch dọc trên mỗi thanh là ngưỡng Khá và ngưỡng Đạt.</p>' + H.rankHtml(A, rkShow, { selected: dv, noSpark: st }), H.seg('Kiểu hiển thị xếp hạng')) +
        '<div class="moi-c5 a-side">' + H.card('a-trend', 'Diễn biến điểm KPI toàn chi nhánh', '<div class="moi-ch" data-ch="trend"></div>', H.seg('Kiểu hiển thị xu hướng')) + H.cardPlain('a-alerts', 'Cảnh báo điều hành', alerts) + '</div>' +
        H.card('moi-c12 a-bullets moi-secondary', 'Tỷ lệ hoàn thành kế hoạch theo chỉ tiêu <span class="moi-scope">· ' + esc(scope) + ' · ' + H.kyTxt(A.ky) + '</span>', drill + H.pair(V.heatLegend({ compact: true }) + '<div class="moi-bl-head vtb-caption" aria-hidden="true"><span>Chỉ tiêu</span><span>% hoàn thành (vạch đen = mức kế hoạch)</span><span class="vtb-r">Thực hiện / KH</span><span class="vtb-r">GAP</span><span>Mức</span></div>' + bl, blTbl).replace('<div class="moi-vchart">', '<div class="moi-vchart" id="moi-bullets">'),
          (dv ? '<button type="button" class="moi-btn sm" data-act="ve-cn">Về toàn chi nhánh</button> ' : '') + H.seg('Kiểu hiển thị chỉ tiêu')) +
        H.card('moi-c6 a-compare moi-secondary', 'Thực hiện so với kế hoạch <span class="moi-scope">· ' + esc(cind ? cind.ten_ngan : '') + ' · ' + esc(scope) + '</span>', '<div class="moi-ch" data-ch="compare"></div>', H.seg('Kiểu hiển thị so sánh') + '<a class="moi-link" href="#/chi-tieu/' + esc(ct) + '">Phân tích chi tiết →</a>') +
        H.card('moi-c6 a-growth moi-secondary', 'Xu hướng tăng trưởng theo tháng <span class="moi-scope">· ' + esc(cind ? cind.ten_ngan : '') + ' · ' + esc(scope) + '</span>', '<div class="moi-ch" data-ch="growth"></div>', H.seg('Kiểu hiển thị tăng trưởng')) +
        H.cardPlain('moi-c12 a-nd moi-secondary', 'Nhận định điều hành', '<p class="moi-nd" id="moi-nd">' + esc(nd) + '</p><p class="vtb-caption">Đoạn văn tự sinh từ số liệu; dùng làm khung cho báo cáo giao ban, chỉnh sửa trước khi gửi.</p>', '<button type="button" class="moi-btn sm" data-act="copy-nd">Sao chép</button>') + '</div>';
    }
  };

  /* ====================== ĐIỀU HÀNH BAN GIÁM ĐỐC ====================== */
  H.VIEWS['dieu-hanh'] = {
    html: function (A, st) {
      var M = STORE.model(), T = D.tongQuan(M, A.ky); if (!T.co_so) return H.thieuSo(A);
      var cn = T.cn, ng = M.ng, rk = T.rk, hv = VIEWS['hanh-dong'] || {}, qh = hv.quaHan || function () { return false; };
      var hd = STORE.getHanhDong().filter(function (x) { return x.trang_thai === 'moi' || x.trang_thai === 'dang_lam'; }).sort(function (a, b) { return (qh(b) ? 1 : 0) - (qh(a) ? 1 : 0) || String(a.han || '9').localeCompare(String(b.han || '9')); });
      var gy = VIEWS['canh-bao'] && VIEWS['canh-bao'].goiY ? VIEWS['canh-bao'].goiY(M, A.ky) : [], gy2 = gy.filter(function (x) { return x.muc >= 2; }), late = hd.filter(qh).length;
      var low = rk.filter(function (r) { return isNum(r.diem); }).sort(function (a, b) { return a.diem - b.diem; });
      var lossCn = T.rows.filter(function (r) { return !r.tham_khao && isNum(r.mat) && r.mat > 0.005; }).sort(function (a, b) { return b.mat - a.mat; });
      var kt = M.kiemTraSo ? M.kiemTraSo(A.ky.nam, A.ky.thang) : { tong_co: 0, tong_can: 0, bat_thuong: [] }, khoa = STORE.kyKhoa(A.ky.nam, A.ky.thang);
      var dk = '<span class="moi-dukien">DỰ KIẾN</span>';
      var q1 = 'Điểm KPI <b>' + num(cn.quy_doi, 1) + '</b>' + (T.delta !== null ? ' (' + (T.delta >= 0 ? '▲' : '▼') + num(Math.abs(T.delta), 1) + ' so ' + esc(H.kyTruoc(A.ky)) + ')' : '') + ', mức <b>' + V.LABEL[T.tier] + '</b>; ' + cn.so_dat + '/' + cn.so_ct + ' chỉ tiêu đạt, ' + (cn.so_cct + cn.so_chua) + ' cần cải thiện hoặc chưa đạt' + (cn.so_thieu ? ', ' + cn.so_thieu + ' thiếu số' : '') + '.' + (T.du_bao !== null ? ' ' + dk + ' cuối năm ' + num(T.du_bao, 1) + '.' : '');
      var q2 = (low.length ? 'Đơn vị thấp nhất: <b>' + esc(low[0].ten) + '</b> (' + num(low[0].diem, 1) + ')' + (low[1] ? ' và <b>' + esc(low[1].ten) + '</b> (' + num(low[1].diem, 1) + ')' : '') + '. ' : '') + (lossCn.length ? 'Chỉ tiêu CN mất nhiều điểm nhất: <b>' + esc(lossCn[0].ten_ngan) + '</b> (−' + num(lossCn[0].mat, 1) + ' điểm)' + (lossCn[1] ? ', <b>' + esc(lossCn[1].ten_ngan) + '</b> (−' + num(lossCn[1].mat, 1) + ')' : '') + '.' : 'Không có chỉ tiêu CN mất điểm.');
      var q3 = '<b>' + hd.length + '</b> nhiệm vụ đang mở' + (late ? ', trong đó <b>' + late + '</b> quá hạn' : '') + '; <b>' + gy2.length + '</b> nội dung cảnh báo cần theo dõi' + (gy2[0] ? '. Ưu tiên: ' + esc(gy2[0].loai) + ' — ' + esc(gy2[0].text) : '.');
      var q3a = '<section class="moi-card moi-c12 a-3q" aria-label="Ba câu hỏi điều hành"><div class="moi-q3">' +
        '<div class="moi-q"><div class="moi-q-t"><span class="moi-q-n" aria-hidden="true">1</span>Chi nhánh đang ở đâu so với kế hoạch?</div><p class="moi-q-a">' + q1 + '</p></div>' +
        '<div class="moi-q"><div class="moi-q-t"><span class="moi-q-n" aria-hidden="true">2</span>Đơn vị và chỉ tiêu nào đang kéo giảm kết quả?</div><p class="moi-q-a">' + q2 + '</p></div>' +
        '<div class="moi-q"><div class="moi-q-t"><span class="moi-q-n" aria-hidden="true">3</span>Cần tập trung chỉ đạo việc gì tiếp theo?</div><p class="moi-q-a">' + q3 + '</p></div></div></section>';
      var k1 = '<div class="vtb-stat">' + V.heroFigure({ label: 'Điểm KPI toàn chi nhánh', value: num(cn.quy_doi, 1), unit: '/ 100', tier: T.tier, delta: T.delta === null ? '' : V.deltaBadge(T.delta, { digits: 1, vs: 'so ' + H.kyTruoc(A.ky) }) }) + '</div>';
      var k2 = '<div class="vtb-stat"><div class="vtb-label">Điểm KPI cuối năm' + (T.du_bao !== null ? ' · ' + dk : '') + '</div>' + (T.du_bao !== null ? '<div class="vtb-hero-row"><span class="vtb-hero-num moi-fc">' + num(T.du_bao, 1) + '</span><span class="vtb-hero-unit">/ 100</span></div><div class="vtb-caption">Số dự kiến theo xu hướng (chức năng Dự báo của hệ thống), không phải số thực tế. Mức Đạt: ' + num(ng.dat * 100, 0) + ' điểm.</div>' : '<div class="vtb-caption moi-mt">Chưa có số dự kiến cho kỳ này nên không hiển thị. Giao diện không tự tạo dự báo.</div>') + '</div>';
      var k3 = '<div class="vtb-stat"><div class="vtb-label">Chỉ tiêu theo mức</div>' + V.tierBar(T.counts) + '</div>';
      var k4 = '<div class="vtb-stat"><div class="vtb-label">Việc cần xử lý</div><div class="vtb-hero-row"><span class="vtb-hero-num">' + hd.length + '</span><span class="vtb-hero-unit">nhiệm vụ đang mở</span></div><div class="vtb-hero-meta">' + (late ? V.tierChip('chua', { text: late + ' quá hạn' }) : V.tierChip('dat', { text: 'Không quá hạn' })) + V.tierChip(T.stats.canh_bao3 ? 'cct' : 'dat', { text: T.stats.canh_bao3 + ' cảnh báo nghiêm trọng' }) + '</div></div>';
      /* xếp hạng */
      var rankC = H.card('moi-c5 a-rank', 'Xếp hạng toàn bộ đơn vị', H.rankHtml(A, rk, { noSpark: true }), H.seg('Kiểu hiển thị xếp hạng'));
      /* mất điểm + đơn vị cần chỉ đạo */
      var lossItems = lossCn.slice(0, st ? 4 : 7).map(function (r) { return { ct: r.ma, name: r.ten_ngan, sub: r.nhom + ' · ' + pct(r.ht, 0) + ' kế hoạch', val: r.mat, valTxt: '−' + num(r.mat, r.mat < 0.1 ? 2 : 1) + ' điểm', tier: r.tier }; });
      var lossT = H.tbl({ caption: 'Chỉ tiêu mất điểm nhiều nhất', cols: [{ k: 'ten', t: 'Chỉ tiêu' }, { k: 'ht', t: '% hoàn thành', cls: 'vtb-r' }, { k: 'mat', t: 'Điểm mất', cls: 'vtb-r' }, { k: 'tier', t: 'Mức' }], rows: lossCn.slice(0, 7).map(function (r) { return { _key: r.ma, ten: r.ten_ngan, ht: pct(r.ht, 0), mat: '−' + num(r.mat, 2), tier: V.LABEL_LONG[r.tier] }; }) });
      var lossC = H.card('moi-a-loss', 'Chỉ tiêu mất điểm nhiều nhất', lossItems.length ? H.pair(V.lossBars(lossItems), lossT) : H.empty('Không có chỉ tiêu mất điểm.'), H.seg('Kiểu hiển thị mất điểm'));
      var mdv = D.matDonVi(M, A.ky.nam, A.ky.thang), foc = low.filter(function (r) { return 100 * ng.dat - r.diem > 0.005; }).slice(0, st ? 4 : 5).map(function (r) { var top = mdv.filter(function (x) { return x.dv === r.ma; })[0], gv = Math.max(0, 100 * ng.dat - r.diem);
        return { dv: r.ma, name: r.ten, sub: top ? 'mất nhiều nhất: ' + top.ten_ct + ' (−' + num(top.mat, 1) + ')' : r.canhbao, val: gv, valTxt: '−' + num(gv, 1) + ' điểm', tier: r.tier, diem: r.diem }; });
      var focT = H.tbl({ caption: 'Đơn vị cần tập trung chỉ đạo', cols: [{ k: 'ten', t: 'Đơn vị' }, { k: 'diem', t: 'Điểm KPI', cls: 'vtb-r' }, { k: 'gap', t: 'GAP so mức Đạt', cls: 'vtb-r' }, { k: 'sub', t: 'Chỉ tiêu mất nhiều nhất' }, { k: 'tier', t: 'Mức' }], rows: foc.map(function (x) { return { _key: x.dv, ten: x.name, diem: num(x.diem, 1), gap: x.valTxt, sub: x.sub, tier: V.LABEL_LONG[x.tier] }; }) });
      var focC = H.card('moi-a-focus', 'Đơn vị cần tập trung chỉ đạo', '<p class="vtb-caption moi-sub">GAP = số điểm còn thiếu so với mức Đạt.</p>' + (foc.length ? H.pair(V.lossBars(foc), focT) : H.empty('Không có đơn vị nào dưới mức Đạt.')), H.seg('Kiểu hiển thị đơn vị cần chỉ đạo'));
      /* nguy cơ */
      var risk = T.X && T.X.cn ? T.X.cn.rows.filter(function (r) { return r.ket_luan === 'khong_dat' && isNum(r.ht_du_bao); }).sort(function (a, b) { return (b.mat_du_bao || 0) - (a.mat_du_bao || 0); }) : [];
      var riskH = risk.slice(0, st ? 3 : 8).map(function (r) { return V.bulletRow({ id: r.ma, name: r.ind.ten_ngan, nhom: isNum(r.can_moi_thang) ? 'cần ' + H.fmtV(r.can_moi_thang, r.ind) + (r.ind.dvt === '%' ? '' : ' ' + r.ind.dvt) + '/tháng' : '', ht: r.ht_du_bao, tier: D.tierHt(M, r.ht_du_bao), thTxt: 'DỰ KIẾN', khTxt: '', gapTxt: '', gapBad: true, cap: 1.3 }).replace('<small>DỰ KIẾN', '<small class="moi-dk">DỰ KIẾN'); }).join('');
      var riskT = H.tbl({ caption: 'Chỉ tiêu có nguy cơ không đạt kế hoạch năm (DỰ KIẾN)', cols: [{ k: 'ten', t: 'Chỉ tiêu' }, { k: 'ht', t: '% KH năm (DỰ KIẾN)', cls: 'vtb-r' }, { k: 'can', t: 'Cần mỗi tháng', cls: 'vtb-r' }], rows: risk.map(function (r) { return { _key: r.ma, ten: r.ind.ten_ngan, ht: pct(r.ht_du_bao, 0) + ' (DỰ KIẾN)', can: isNum(r.can_moi_thang) ? H.fmtV(r.can_moi_thang, r.ind) : '–' }; }) });
      var riskC = H.card('moi-a-risk', 'Nguy cơ không đạt KH năm', risk.length ? '<p class="vtb-caption"><span class="moi-dukien">DỰ KIẾN</span> % hoàn thành KH năm; vạch đen = mức kế hoạch.</p>' + H.pair(riskH, riskT) : H.empty(T.X && T.X.cn ? 'Chưa có chỉ tiêu nào có nguy cơ không đạt kế hoạch năm theo xu hướng hiện tại.' : 'Chưa có số dự kiến cho kỳ này; giao diện không tự tạo dự báo.'), H.seg('Kiểu hiển thị nguy cơ'));
      /* nhiệm vụ (trình chiếu) */
      var tenDv = hv.tenDv || function (m, dv) { return dv || 'Toàn chi nhánh'; };
      var taskC = '<section class="moi-card moi-a-tasks moi-stage-only"><div class="moi-head"><h2>Nhiệm vụ cần xử lý</h2></div>' + (hd.length ? '<ul class="moi-tasks">' + hd.slice(0, 3).map(function (x) { return '<li>' + (qh(x) ? V.tierChip('chua', { text: 'Quá hạn' }) : V.tierChip('gap', { text: x.trang_thai === 'dang_lam' ? 'Đang làm' : 'Mới giao' })) + '<span><b>' + esc(x.tieu_de) + '</b><small>' + esc(tenDv(M, x.dv)) + (x.nguoi ? ' · ' + esc(x.nguoi) : '') + (x.han ? ' · hạn ' + esc(x.han.split('-').reverse().join('/')) : '') + '</small></span></li>'; }).join('') + '</ul>' : H.empty('Không có nhiệm vụ đang mở.')) + '</section>';
      /* vấn đề & hành động (đầy đủ) */
      var TTHD = { moi: 'Mới giao', dang_lam: 'Đang làm', xong: 'Đã xong', huy: 'Huỷ' }, all = STORE.getHanhDong().sort(function (a, b) { return (qh(b) ? 1 : 0) - (qh(a) ? 1 : 0) || String(a.han || '9').localeCompare(String(b.han || '9')); });
      var actC = H.cardPlain('moi-c12 a-actions moi-secondary', 'Vấn đề và hành động điều hành', all.length ? H.tbl({ caption: 'Nhiệm vụ và hành động khắc phục', cols: [{ k: 'nd', t: 'Nội dung thực hiện', html: true }, { k: 'dv', t: 'Đơn vị · chỉ tiêu' }, { k: 'ng', t: 'Phụ trách' }, { k: 'han', t: 'Hạn' }, { k: 'tt', t: 'Trạng thái', html: true }],
        rows: all.slice(0, 12).map(function (x) { var ind = x.ct ? M.indMap[x.ct] : null; return { _key: x.id, nd: '<span class="moi-act"><b>' + esc(x.tieu_de) + '</b>' + (x.mo_ta ? '<small>' + esc(x.mo_ta) + '</small>' : '') + '</span>', dv: tenDv(M, x.dv) + (ind ? ' · ' + (ind.ten_ngan || ind.ten) : ''), ng: x.nguoi || '–', han: x.han ? x.han.split('-').reverse().join('/') : '–', tt: V.tierChip(x.trang_thai === 'xong' ? 'dat' : x.trang_thai === 'huy' ? 'gap' : 'cct', { text: TTHD[x.trang_thai] || 'Mới giao' }) + (qh(x) ? ' ' + V.tierChip('chua', { text: 'Quá hạn' }) : '') }; }) }) + (all.length > 12 ? '<p class="vtb-caption">Hiển thị 12/' + all.length + ' mục. <a class="moi-link" href="#/hanh-dong">Xem tất cả →</a></p>' : '') : H.empty('Chưa ghi nhận nhiệm vụ nào.'),
        (STORE.isAdmin() ? '<button type="button" class="moi-btn sm" data-act="giao-viec">+ Giao nhiệm vụ mới</button> ' : '') + '<a class="moi-link" href="#/hanh-dong">Quản lý nhiệm vụ →</a>');
      /* tăng trưởng */
      var ss = VIEWS['chi-tieu'] && VIEWS['chi-tieu'].soSanh, gr = ss ? T.rows.filter(function (r) { return !r.tham_khao && isNum(r.th) && r.ind.hien_tq !== false; }).slice(0, 14) : [];
      var fp = function (x) { return isNum(x) ? (x > 0 ? '+' : '') + pct(x, 1) : '–'; };
      var growC = H.cardPlain('moi-c12 a-growthtb moi-secondary', 'Phân tích chỉ tiêu tăng trưởng', gr.length ? H.tbl({ caption: 'Tăng trưởng các chỉ tiêu', cols: [{ k: 'ten', t: 'Chỉ tiêu' }, { k: 'th', t: 'Thực hiện', cls: 'vtb-r' }, { k: 'tt', t: 'So tháng trước', cls: 'vtb-r' }, { k: 'ck', t: 'So cùng kỳ năm trước', cls: 'vtb-r' }, { k: 'dn', t: 'So đầu năm', cls: 'vtb-r' }, { k: 'tier', t: 'Mức', html: true }],
        rows: gr.map(function (r) { var kieu = E.kieuSo(r.ind), s = ss(M, r.ma, CN, A.ky.nam, A.ky.thang, kieu); return { _key: r.ma, ten: r.ten_ngan, th: H.fmtV(r.th, r.ind) + (H.dvt(r.ind) ? ' ' + H.dvt(r.ind) : ''), tt: kieu === 'so_du' ? fp(s.tt_p) : (isNum(s.tt_d) ? sgn(s.tt_d, 1) + ' phát sinh' : '–'), ck: fp(s.ck_p), dn: kieu === 'so_du' ? fp(s.dn_p) : '–', tier: V.tierChip(r.tier) }; }) }) : H.empty('Chưa có số liệu để phân tích tăng trưởng.'));
      /* ma trận */
      var cols = T.kpi.map(function (r) { return { ma: r.ma, name: r.ten_ngan }; });
      var mx = '<div class="vtb-tablewrap"><table class="vtb-matrix"><caption class="vtb-sr">Ma trận trạng thái KPI theo đơn vị và chỉ tiêu</caption><thead><tr><th scope="col" class="vtb-sticky">Đơn vị</th>' + cols.map(function (c) { return '<th scope="col">' + esc(c.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        M.units.map(function (u) { var c = M.card(u.ma, A.ky.nam, A.ky.thang), rs = {}; D.cardRows(c).forEach(function (r) { rs[r.ma] = r; });
          return '<tr><th scope="row" class="vtb-sticky"><button type="button" data-dv="' + esc(u.ma) + '">' + esc(u.ten_ngan || u.ten) + '</button></th>' + cols.map(function (cc) { var r = rs[cc.ma]; if (!r) return '<td class="vtb-na" aria-label="Không áp dụng">·</td>'; var t = D.tierTT(r.tt), h = V.heat(r.ht, t); return '<td class="vtb-cell vtb-t-' + t + (h ? ' vtb-hm' : '') + '"' + (h ? ' style="' + V.hmVars(h) + '"' : '') + ' data-tier="' + t + '" data-tip="' + esc((u.ten_ngan || u.ten) + ' · ' + cc.name + ': ' + (isNum(r.ht) ? pct(r.ht, 0) : 'chưa có số') + ' · ' + V.LABEL_LONG[t]) + '">' + (h ? '' : V.svgIcon(t)) + '<span>' + (isNum(r.ht) ? pct(r.ht, 0) : 'Thiếu số') + '</span></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      var mxC = H.cardPlain('moi-c12 a-matrix moi-secondary', 'Ma trận trạng thái: đơn vị × chỉ tiêu chính', V.heatLegend({ compact: true }) + mx, '<span class="vtb-caption">Mỗi ô: % hoàn thành kế hoạch, màu Heatmap; ô xám = thiếu số</span>');
      var fresh = '<footer class="moi-c12 a-fresh">' + V.dataFreshness({ capNhat: H.kyNgay(STORE.state.cap_nhat_luc), ky: H.kyTxt(A.ky) + ' (lũy kế)', khoa: khoa, soLieu: kt.tong_co + '/' + kt.tong_can + ' ô thực hiện đã nhập', extra: (kt.bat_thuong || []).length + ' số liệu bất thường' + (STORE.state.du_lieu_mau ? ' · DỮ LIỆU MẪU' : '') }) + '</footer>';
      return '<div class="moi-grid moi-bgd">' + q3a + '<div class="moi-c12 moi-kpis4 a-kpis4">' + k1 + k2 + k3 + k4 + '</div>' + rankC + '<div class="moi-c4 a-mid">' + lossC + focC + '</div><div class="moi-c3 a-right">' + riskC + taskC + '</div>' + actC + growC + mxC + fresh + '</div>';
    }
  };
})(window);
