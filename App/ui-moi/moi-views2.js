/* MOI-VIEWS (2/2) — Phân tích chi tiết chỉ tiêu · Xếp hạng · Ma trận trạng thái · Thẻ điểm đơn vị · Nội dung cần xử lý.
 * Tái dùng hàm sẵn có của màn cũ (soSanh, dsSoSanh, giaTri, goiY) để số liệu/xếp hạng khớp tuyệt đối; trạng thái (A.ct_dv, A.ct_rank, A.khoi, A.mt_mode, A.route.arg) dùng chung với giao diện cũ. */
(function (root) {
  var V = root.VTB, D = root.MOI_DATA, E = root.KPI_ENGINE, H = root.MOI_UI, CN = root.KPI_CFG.MA_CN, VIEWS = H.VIEWS;
  var esc = V.esc, num = V.num, pct = V.pct, sgn = V.sgn, isNum = V.isNum;
  function opt(list, sel) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(sel) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function dcell(x, ind, xau, kind) {   // ô ± / % : màu theo tốt/xấu + ký hiệu
    if (!isNum(x)) return '<span class="vtb-caption">–</span>';
    var tot = xau ? x < 0 : x > 0, flat = Math.abs(x) < 1e-9, txt = kind === 'p' ? (x > 0 ? '+' : '') + pct(x, 1) : sgn(Math.round(x * 100) / 100, Math.abs(x) >= 100 ? 0 : 2) + (ind && ind.dvt === '%' ? ' đ%' : '');
    return '<span class="' + (flat ? '' : tot ? 'is-good' : 'is-bad') + '">' + (flat ? '' : (tot ? '▲ ' : '▼ ')) + txt + '</span>';
  }

  /* ====================== PHÂN TÍCH CHI TIẾT CHỈ TIÊU ====================== */
  VIEWS['chi-tieu'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, ma = A.route.arg; if (!ma || !M.indMap[ma]) ma = M.inds[0] && M.inds[0].ma; A.route.arg = ma;
      var ind = M.indMap[ma]; if (!ind) return '<div class="moi-card moi-empty"><h2>Danh mục chưa có chỉ tiêu</h2></div>';
      var VC = root.VIEWS['chi-tieu'], kieu = E.kieuSo(ind), xau = ind.huong === 'thap_tot', dv = A.ct_dv && M.unitMap[A.ct_dv] ? A.ct_dv : CN, apDung = dv === CN || M.apDung(ma, dv);
      var sel = '<select id="moi-sel-ct" class="moi-sel" aria-label="Chọn chỉ tiêu">', nh = null; M.inds.forEach(function (i) { if (i.nhom !== nh) { if (nh !== null) sel += '</optgroup>'; nh = i.nhom; sel += '<optgroup label="' + esc(nh) + '">'; } sel += '<option value="' + esc(i.ma) + '"' + (i.ma === ma ? ' selected' : '') + '>' + esc(i.ten) + (i.chi_tham_khao ? ' · quản trị' : '') + '</option>'; }); sel += '</optgroup></select>';
      var selDv = '<select id="moi-sel-dv" class="moi-sel" aria-label="Chọn đơn vị">' + opt([[CN, 'Toàn chi nhánh']].concat(M.units.map(function (u) { return [u.ma, u.ten_ngan || u.ten]; })), dv) + '</select>';
      var s = VC.soSanh(M, ma, dv, ky.nam, ky.thang, kieu), f = function (v) { return H.fmtV(v, ind); }, tenDv = dv === CN ? 'Toàn chi nhánh' : (M.unitMap[dv].ten_ngan || M.unitMap[dv].ten);
      var tile = function (label, val, d, p, vs) { return V.statTile({ label: label, valueHtml: val, sub: '' }).replace('<div class="vtb-caption"></div>', '<div class="vtb-caption">' + dcell(d, ind, xau) + ' ' + (isNum(p) ? dcell(p, ind, xau, 'p') : '') + (vs ? ' <span>' + esc(vs) + '</span>' : '') + '</div>'); };
      var head = '<div class="moi-stats4">' + V.statTile({ label: tenDv + ' · ' + H.kyTxt(ky), valueHtml: esc(f(s.cur)) + (H.dvt(ind) ? ' <small>' + esc(H.dvt(ind)) + '</small>' : ''), sub: ind.nhom + (xau ? ' · càng thấp càng tốt' : '') }) +
        (kieu === 'so_du' ? tile('So tháng trước', esc(f(s.tt)), s.tt_d, s.tt_p, '') + tile('So đầu năm (31/12/' + (ky.nam - 1) + ')', esc(f(s.dn)), s.dn_d, s.dn_p, '') : tile('Phát sinh trong tháng', esc(f(s.tt_d)), null, null, 'T' + ky.thang + '/' + ky.nam) + tile('Phát sinh cùng tháng năm trước', esc(f(s.ps_ck)), null, null, 'T' + ky.thang + '/' + (ky.nam - 1))) +
        tile('So cùng kỳ năm trước', esc(f(s.ck)), s.ck_d, s.ck_p, 'T' + ky.thang + '/' + (ky.nam - 1)) + '</div>';
      var d = VC.dsSoSanh(M, A, ind, kieu, xau), tc = d.tc, cong = ind.dvt !== '%' && ind.huong !== 'nhap_ty_le', tong = d.rows.reduce(function (a, x) { return a + (isNum(x.s.cur) ? x.s.cur : 0); }, 0);
      var cols = [{ k: 'hang', t: 'Hạng', cls: 'vtb-r' }, { k: 'ten', t: 'Đơn vị', html: true }, { k: 'cur', t: 'Kỳ này', cls: 'vtb-r' }];
      if (kieu === 'so_du') cols.push({ k: 'tt', t: 'So tháng trước', cls: 'vtb-r', html: true }, { k: 'dn', t: 'So đầu năm', cls: 'vtb-r', html: true }, { k: 'ck', t: 'So cùng kỳ', cls: 'vtb-r', html: true }); else cols.push({ k: 'tt', t: 'Phát sinh tháng', cls: 'vtb-r', html: true }, { k: 'ck', t: 'So cùng kỳ', cls: 'vtb-r', html: true });
      if (cong) cols.push({ k: 'tr', t: 'Tỷ trọng', cls: 'vtb-r' });
      var rowsT = d.rows.map(function (x) { var r = { _key: x.u.ma, hang: x.hang || '–', ten: '<button type="button" class="moi-linkbtn' + (x.u.ma === dv ? ' is-on' : '') + '" data-pick-dv="' + esc(x.u.ma) + '">' + esc(x.u.ten_ngan || x.u.ten) + '</button>', cur: f(x.s.cur), tr: isNum(x.s.cur) && tong ? pct(x.s.cur / tong, 1) : '–' };
        if (kieu === 'so_du') { r.tt = dcell(x.s.tt_d, ind, xau) + ' ' + dcell(x.s.tt_p, ind, xau, 'p'); r.dn = dcell(x.s.dn_d, ind, xau) + ' ' + dcell(x.s.dn_p, ind, xau, 'p'); r.ck = dcell(x.s.ck_d, ind, xau) + ' ' + dcell(x.s.ck_p, ind, xau, 'p'); } else { r.tt = dcell(x.s.tt_d, ind, xau); r.ck = dcell(x.s.ck_d, ind, xau) + ' ' + dcell(x.s.ck_p, ind, xau, 'p'); } return r; });
      var tong0 = VC.soSanh(M, ma, CN, ky.nam, ky.thang, kieu); rowsT.unshift({ _key: CN, hang: '', ten: '<b>Toàn chi nhánh</b>', cur: f(tong0.cur), tr: '', tt: kieu === 'so_du' ? dcell(tong0.tt_d, ind, xau) + ' ' + dcell(tong0.tt_p, ind, xau, 'p') : dcell(tong0.tt_d, ind, xau), dn: dcell(tong0.dn_d, ind, xau) + ' ' + dcell(tong0.dn_p, ind, xau, 'p'), ck: dcell(tong0.ck_d, ind, xau) + ' ' + dcell(tong0.ck_p, ind, xau, 'p') });
      var cmp = '<div class="moi-ch" data-ch="compare" data-ct="' + esc(ma) + '" data-dv="' + (dv === CN ? '' : esc(dv)) + '"></div>', gr = '<div class="moi-ch" data-ch="growth" data-ct="' + esc(ma) + '" data-dv="' + (dv === CN ? '' : esc(dv)) + '"></div>';
      return '<div class="moi-toolbar"><label class="moi-fl"><span>Chỉ tiêu</span>' + sel + '</label><label class="moi-fl"><span>Đơn vị</span>' + selDv + '</label>' + (ind.chi_tham_khao ? V.tierChip('gap', { text: 'Chỉ tiêu quản trị, không tính điểm' }) : '') + '<a class="moi-link" href="#/chi-tieu">Làm mới</a></div>' +
        '<section class="moi-card moi-c12 moi-ind-head"><div class="vtb-label">' + esc(ind.nhom) + ' · ĐVT: ' + esc(ind.dvt) + ' · ' + (kieu === 'so_du' ? 'Số dư / mức tại thời điểm' : 'Số lũy kế phát sinh trong năm') + '</div><h2 class="moi-ind-t">' + esc(ind.ten) + '</h2>' + (apDung ? head : H.empty('Chỉ tiêu này không áp dụng cho đơn vị đã chọn.')) + '</section>' +
        '<div class="moi-grid"><section class="moi-card moi-c6" data-view-card><div class="moi-head"><h2>Thực hiện so với kế hoạch <span class="moi-scope">· ' + esc(tenDv) + '</span></h2>' + H.seg('Kiểu hiển thị so sánh') + '</div>' + cmp + '</section>' +
        '<section class="moi-card moi-c6" data-view-card><div class="moi-head"><h2>Xu hướng ' + (kieu === 'so_du' ? 'tăng/giảm so tháng trước' : 'phát sinh trong tháng') + ' <span class="moi-scope">· ' + esc(tenDv) + '</span></h2>' + H.seg('Kiểu hiển thị tăng trưởng') + '</div>' + gr + '</section></div>' +
        '<section class="moi-card moi-c12"><div class="moi-head"><h2>So sánh các phòng/PGD · ' + H.kyTxt(ky) + '</h2><label class="moi-fl inline"><span>Xếp hạng theo</span><select id="moi-ct-rank" class="moi-sel">' + opt(tc, d.k) + '</select></label></div>' +
        (d.rows.length ? H.tbl({ caption: 'So sánh các đơn vị theo chỉ tiêu', cols: cols, rows: rowsT }) : H.empty('Chưa có số liệu của chỉ tiêu này ở các phòng.')) + '<p class="vtb-caption">Bấm tên một đơn vị để xem diễn biến của đơn vị đó ở hai biểu đồ phía trên.</p></section>';
    },
    mount: function (v, A) {
      var g = function (s) { return v.querySelector(s); };
      g('#moi-sel-ct').onchange = function () { A.ct_dv = A.ct_dv || null; APP.go('chi-tieu', this.value); };
      g('#moi-sel-dv').onchange = function () { A.ct_dv = this.value === CN ? null : this.value; APP.render(); };
      var r = g('#moi-ct-rank'); if (r) r.onchange = function () { A.ct_rank = this.value; APP.render(); };
      [].forEach.call(v.querySelectorAll('[data-pick-dv]'), function (b) { b.onclick = function () { A.ct_dv = b.getAttribute('data-pick-dv'); APP.render(); }; });
    }
  };

  /* ====================== XẾP HẠNG ====================== */
  VIEWS['xep-hang'] = {
    html: function (A) {
      var M = STORE.model(), rk = D.rank(M, A.ky.nam, A.ky.thang, A.khoi || null), ng = M.ng, st = STORE.state;
      var pills = '<div class="moi-pills" role="group" aria-label="Lọc theo khối"><button type="button" class="moi-pill" data-khoi="" aria-pressed="' + !A.khoi + '">Tất cả đơn vị</button>' + st.khoi.filter(function (k) { return k.ma !== CN && M.units.some(function (u) { return u.khoi === k.ma; }); }).map(function (k) { return '<button type="button" class="moi-pill" data-khoi="' + esc(k.ma) + '" aria-pressed="' + (A.khoi === k.ma) + '">' + esc(k.ten) + '</button>'; }).join('') + '</div>';
      if (!rk.some(function (r) { return r.co_so; })) return '<div class="moi-toolbar">' + pills + '</div>' + H.thieuSo(A);
      var xep = rk.filter(function (r) { return isNum(r.diem) && r.hang; }), top = xep[0], bot = xep[xep.length - 1], cnt = { dat: 0, kha: 0, cct: 0, chua: 0, gap: 0 }; rk.forEach(function (r) { cnt[r.tier]++; });
      var tiles = '<div class="moi-stats4">' + V.statTile({ label: 'Dẫn đầu', value: top ? top.ten : '–', sub: top ? num(top.diem, 1) + ' điểm' : '' }) + V.statTile({ label: 'Thấp nhất', value: bot ? bot.ten : '–', sub: bot ? num(bot.diem, 1) + ' điểm' : '' }) +
        V.statTile({ label: 'Khoảng cách dẫn đầu – thấp nhất', value: top && bot ? num(top.diem - bot.diem, 1) : '–', sub: 'điểm' }) + V.statTile({ label: 'Đơn vị dưới mức Khá', value: String(rk.filter(function (r) { return isNum(r.diem) && r.diem < ng.kha * 100; }).length), sub: 'trên ' + rk.length + ' đơn vị' }) + '</div>';
      return '<div class="moi-toolbar">' + pills + '<span class="vtb-caption">Hạng theo điểm quy đổi (thang 100), cùng cách xếp hạng của giao diện cũ.</span></div>' + tiles +
        H.card('moi-c12', 'Bảng xếp hạng ' + H.kyTxt(A.ky), '<p class="vtb-caption moi-sub">Bấm một đơn vị để mở thẻ điểm. Hai vạch dọc: ngưỡng Khá và Đạt.</p>' + H.rankHtml(A, rk, { noSpark: false }), H.seg('Kiểu hiển thị xếp hạng')) +
        H.cardPlain('moi-c12', 'Cơ cấu mức của các đơn vị', V.tierBar(cnt));
    }
  };

  /* ====================== MA TRẬN TRẠNG THÁI (thay heatmap cầu vồng) ====================== */
  VIEWS['ma-tran'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, mode = A.mt_mode || 'ht', RI = M.rankInd(ky.nam, ky.thang), cn = M.card(CN, ky.nam, ky.thang), rk = M.ranking(ky.nam, ky.thang);
      if (!rk.some(function (c) { return c.co_so; })) return H.thieuSo(A);
      var MODES = [['ht', '% hoàn thành KH'], ['hang', 'Thứ hạng'], ['kh_nam', '% KH năm'], ['diem', 'Điểm đạt'], ['mat', 'Điểm bị mất']], cols = [cn].concat(rk);
      var pills = '<div class="moi-pills" role="group" aria-label="Chế độ ma trận">' + MODES.map(function (x) { return '<button type="button" class="moi-pill" data-mode="' + x[0] + '" aria-pressed="' + (mode === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>';
      var note = { ht: 'Số trong ô = % hoàn thành kế hoạch lũy kế.', hang: 'Hạng của đơn vị ở từng chỉ tiêu theo % hoàn thành (1 = cao nhất).', kh_nam: 'Số trong ô = thực hiện lũy kế ÷ kế hoạch cả năm.', diem: 'Số trong ô = điểm đạt / trọng số.', mat: 'Số trong ô = điểm bị mất (✓ = không mất điểm).' }[mode];
      var th = '<tr><th scope="col" class="vtb-sticky">Chỉ tiêu</th>' + cols.map(function (c) { return '<th scope="col"><a href="#/phong/' + esc(c.ma) + '">' + esc(c.ten_ngan) + '</a><small>' + (c.ma === CN ? 'Thẻ điểm CN' : (c.hang ? 'Hạng ' + c.hang : '–')) + '</small></th>'; }).join('') + '</tr>';
      var tb = '', nhom = null;
      M.inds.forEach(function (ind) {
        if (ind.nhom !== nhom) { nhom = ind.nhom; tb += '<tr class="moi-mx-grp"><td colspan="' + (cols.length + 1) + '">' + esc(nhom) + '</td></tr>'; }
        tb += '<tr><th scope="row" class="vtb-sticky"><a href="#/chi-tieu/' + esc(ind.ma) + '">' + esc(ind.ten_ngan) + '</a>' + (ind.chi_tham_khao ? '<small> quản trị</small>' : '') + '</th>';
        cols.forEach(function (c) {
          var r = c.rows.concat(c.ref).filter(function (x) { return x.ma === ind.ma; })[0]; if (!r) { tb += '<td class="vtb-na" aria-label="Không áp dụng">·</td>'; return; }
          var t = D.tierTT(r.tt), txt;
          if (mode === 'hang' && c.ma !== CN) { var ri = RI.ct[ind.ma], hh = ri && ri.hang[c.ma]; txt = hh ? hh + '/' + ri.n : '–'; }
          else if (mode === 'kh_nam') txt = isNum(r.ht_nam) ? pct(r.ht_nam, 0) : '–';
          else if (mode === 'diem') txt = isNum(r.diem) ? num(r.diem, 1) + '/' + r.ts : (ind.chi_tham_khao ? pct(r.ht, 0) : '–');
          else if (mode === 'mat') txt = isNum(r.mat) ? (r.mat > 0.005 ? '−' + num(r.mat, 1) : '✓') : (ind.chi_tham_khao ? pct(r.ht, 0) : '–');
          else txt = isNum(r.ht) ? pct(r.ht, 0) : 'GAP';
          tb += '<td class="vtb-cell vtb-t-' + t + '" data-tier="' + t + '" data-dv="' + esc(c.ma) + '" data-tip="' + esc(c.ten_ngan + ' · ' + ind.ten_ngan + ' · KH ' + H.fmtV(r.kh, ind) + ' · TH ' + H.fmtV(r.th, ind) + ' · ' + (isNum(r.ht) ? pct(r.ht, 1) : 'chưa có số') + ' · ' + V.LABEL_LONG[t]) + '">' + V.svgIcon(t) + '<span>' + esc(txt) + '</span></td>';
        });
        tb += '</tr>';
      });
      var foot = '<tr><th scope="row" class="vtb-sticky">Điểm quy đổi</th>' + cols.map(function (c) { var t = D.tierHt(M, c.ht_chung); return '<td class="vtb-cell vtb-t-' + t + '" data-tier="' + t + '">' + V.svgIcon(t) + '<span><b>' + num(c.quy_doi, 1) + '</b></span></td>'; }).join('') + '</tr>';
      return '<div class="moi-toolbar">' + pills + '<div class="moi-legend">' + V.TIERS.map(function (t) { return '<span class="vtb-t-' + t + '">' + V.svgIcon(t) + ' ' + V.LABEL[t] + '</span>'; }).join('') + '</div></div><p class="vtb-caption">' + esc(note) + ' Màu = mức theo ngưỡng cấu hình (một hệ trạng thái duy nhất); ô “·” = không áp dụng cho khối của đơn vị. Bấm một ô để mở thẻ điểm đơn vị.</p>' +
        '<section class="moi-card moi-c12"><div class="vtb-tablewrap moi-mx-wrap"><table class="vtb-matrix"><caption class="vtb-sr">Ma trận trạng thái chỉ tiêu theo đơn vị</caption><thead>' + th + '</thead><tbody>' + tb + '</tbody><tfoot>' + foot + '</tfoot></table></div></section>';
    }
  };

  /* ====================== THẺ ĐIỂM ĐƠN VỊ ====================== */
  VIEWS['phong'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, ma = A.route.arg || (M.units[0] && M.units[0].ma) || CN; if (ma !== CN && !M.unitMap[ma]) ma = CN; A.route.arg = ma;
      var c = M.card(ma, ky.nam, ky.thang), prev = ky.thang > 1 ? M.card(ma, ky.nam, ky.thang - 1) : null, rk = D.rank(M, ky.nam, ky.thang, null), me = rk.filter(function (r) { return r.ma === ma; })[0];
      var sel = '<select id="moi-sel-dvp" class="moi-sel" aria-label="Chọn đơn vị"><option value="' + CN + '"' + (ma === CN ? ' selected' : '') + '>★ Toàn chi nhánh</option>' + M.units.map(function (u) { return '<option value="' + esc(u.ma) + '"' + (u.ma === ma ? ' selected' : '') + '>' + esc(u.ten) + '</option>'; }).join('') + '</select>';
      var tb = '<div class="moi-toolbar">' + sel + '<span class="moi-grow"></span>' + (ma !== CN ? '<a class="moi-btn" href="#/diem-kpi/' + esc(ma) + '">Trừ / Cộng điểm KPI</a>' : '') + '<button type="button" class="moi-btn" data-act="in">In thẻ điểm</button><button type="button" class="moi-btn" data-act="xlsx">Xuất Excel báo cáo</button><button type="button" class="moi-btn" data-act="in-tat-ca">In thẻ điểm tất cả phòng</button></div>';
      if (!c.so_ct) return tb + '<div class="moi-card moi-empty"><h2>Chưa khai báo trọng số</h2><p>Khối “' + esc(c.khoi) + '” chưa có trọng số chỉ tiêu nào. Vào Danh mục &amp; trọng số để khai báo.</p></div>';
      var delta = prev && isNum(prev.quy_doi) && isNum(c.quy_doi) ? c.quy_doi - prev.quy_doi : null;
      var hero = V.heroFigure({ label: 'Thẻ điểm KPI · lũy kế ' + H.kyTxt(ky) + ' · khối ' + c.khoi, value: num(c.quy_doi, 1), unit: '/ 100 điểm', tier: D.tierHt(M, c.ht_chung), delta: delta === null ? '' : V.deltaBadge(delta, { digits: 2, vs: 'so ' + H.kyTruoc(ky) }), note: num(c.diem, 2) + ' / ' + c.ts + ' điểm theo trọng số' + (c.dc_diem ? ' · cộng/trừ điểm KPI ' + sgn(c.dc_diem, 2) : '') });
      var rows = D.cardRows(c).map(D.rowVM), bl = '', last = null;
      rows.forEach(function (r) { var g = r.nhom || 'Khác'; if (g !== last) { last = g; bl += '<div class="moi-grp">' + esc(g) + '</div>'; }
        bl += V.bulletRow({ id: r.ma, name: r.ten, nhom: (r.tham_khao ? 'quản trị · không chấm điểm · ' : '') + (isNum(r.ts) ? 'Trọng số ' + r.ts + ' · ' : '') + (isNum(r.diem) ? 'điểm ' + num(r.diem, 2) : '') + (isNum(r.mat) && r.mat > 0.005 ? ' · mất ' + num(r.mat, 2) : ''), ht: r.ht, tier: r.tier, thTxt: isNum(r.th) ? H.fmtV(r.th, r.ind) : 'Chưa có số', khTxt: isNum(r.kh) ? H.fmtV(r.kh, r.ind) : '', gapTxt: isNum(r.gap) ? H.gapTxt(r) : '–', gapBad: isNum(r.gap) && (r.huong === 'thap_tot' ? r.gap > 0 : r.gap < 0), cap: Math.max(r.ind && 1.3, 1) }); });
      var tbl = H.tbl({ caption: 'Thẻ điểm KPI ' + c.ten_ngan, cols: [{ k: 'ten', t: 'Chỉ tiêu' }, { k: 'ts', t: 'TS', cls: 'vtb-r' }, { k: 'kh', t: 'Kế hoạch', cls: 'vtb-r' }, { k: 'th', t: 'Thực hiện', cls: 'vtb-r' }, { k: 'ht', t: '% HT', cls: 'vtb-r' }, { k: 'diem', t: 'Điểm', cls: 'vtb-r' }, { k: 'mat', t: 'Mất', cls: 'vtb-r' }, { k: 'tier', t: 'Mức' }],
        rows: rows.map(function (r) { return { _key: r.ma, ten: r.ten, ts: isNum(r.ts) ? r.ts : '–', kh: H.fmtV(r.kh, r.ind), th: H.fmtV(r.th, r.ind), ht: isNum(r.ht) ? pct(r.ht, 1) : '–', diem: isNum(r.diem) ? num(r.diem, 2) : '–', mat: isNum(r.mat) ? num(r.mat, 2) : '–', tier: V.LABEL_LONG[r.tier] }; }) });
      var dc = c.ds_dc_diem && c.ds_dc_diem.length ? H.cardPlain('moi-c12', 'Điểm thi đua, khen thưởng và kỷ luật (tổng ' + sgn(c.dc_diem, 2) + ' điểm)', H.tbl({ caption: 'Cộng/trừ điểm KPI', cols: [{ k: 'diem', t: 'Điểm', cls: 'vtb-r' }, { k: 'ly', t: 'Lý do' }, { k: 'cc', t: 'Căn cứ' }, { k: 'ai', t: 'Người duyệt' }], rows: c.ds_dc_diem.map(function (x, i) { return { _key: i, diem: sgn(x.diem, 2), ly: x.ly_do || '—', cc: x.can_cu || '—', ai: x.ai || '—' }; }) })) : '';
      var note = STORE.getNote(ma, ky.nam, ky.thang), info = STORE.getNoteInfo(ma, ky.nam, ky.thang);
      var nt = H.cardPlain('moi-c12', 'Nhận xét và giải pháp ' + H.kyTxt(ky), (STORE.isAdmin() ? '<textarea id="moi-note" class="moi-ta" rows="4" placeholder="Nguyên nhân chưa đạt, giải pháp, đầu mối, thời hạn…">' + esc(note) + '</textarea><div class="moi-right"><button type="button" class="moi-btn primary" data-act="luu-note">Lưu nhận xét</button></div>' : (note ? '<p class="moi-pre">' + esc(note) + '</p>' : H.empty('Chưa có nhận xét.'))) + (info ? '<p class="vtb-caption">Cập nhật ' + (info.ai ? 'bởi ' + esc(info.ai) + ' ' : '') + 'lúc ' + new Date(info.t).toLocaleString('vi-VN') + '</p>' : ''));
      return tb + '<div class="moi-grid"><section class="moi-card moi-c3">' + hero + '<div class="moi-sep"></div>' + V.tierBar({ dat: c.so_dat, kha: c.so_kha, cct: c.so_cct, chua: c.so_chua, gap: c.so_thieu }) + (me ? '<p class="vtb-caption moi-mt">Xếp hạng: <b>' + (me.hang || '–') + '/' + rk.length + '</b>' + (me.hang_truoc ? ' · tháng trước hạng ' + me.hang_truoc : '') + '</p>' : '') + '</section>' +
        H.card('moi-c9', 'Chỉ tiêu của ' + esc(c.ten_ngan), '<div class="moi-bl-head vtb-caption" aria-hidden="true"><span>Chỉ tiêu</span><span>% hoàn thành (vạch đen = mức kế hoạch)</span><span class="vtb-r">Thực hiện / KH</span><span class="vtb-r">GAP</span><span>Mức</span></div>' + H.pair(bl, tbl), H.seg('Kiểu hiển thị thẻ điểm')) + '</div>' + dc +
        '<div class="moi-grid">' + H.card('moi-c12', 'Diễn biến điểm quy đổi ' + ky.nam, '<div class="moi-ch" data-ch="unit-trend" data-dv="' + esc(ma) + '"></div>', H.seg('Kiểu hiển thị diễn biến')) + '</div>' + nt;
    },
    mount: function (v, A) {
      var M = STORE.model(), ky = A.ky, ma = A.route.arg, g = function (s) { return v.querySelector(s); };
      var s = g('#moi-sel-dvp'); if (s) s.onchange = function () { APP.go('phong', this.value); };
      v.onclick = v.onclick;   // (sự kiện chung do vỏ giao diện mới xử lý: data-act, data-ct…)
      void M; void ky; void ma;
    },
    act: function (a, A) {
      var ky = A.ky, ma = A.route.arg;
      if (a === 'in') window.print();
      else if (a === 'xlsx') EXCEL.xuatBaoCao(ky.nam, ky.thang).catch(function (e) { UI.toast(e.message, 'err'); });
      else if (a === 'in-tat-ca') KPI_THE_DIEM.inTatCa(ky);
      else if (a === 'luu-note') { var t = document.getElementById('moi-note'); if (t) { STORE.setNote(ma, ky.nam, ky.thang, t.value.trim()); UI.toast('Đã lưu nhận xét.', 'ok'); } }
    }
  };
  H.CH['unit-trend'] = function (el, A) {
    var M = STORE.model(), dv = el.getAttribute('data-dv') || CN, ky = A.ky, w = Math.max(320, el.clientWidth || 600), ng = M.ng, s = M.scoreSeries(dv, ky.nam), cs = dv === CN ? null : M.scoreSeries(CN, ky.nam), c = M.card(dv, ky.nam, ky.thang);
    var series = [{ name: dv === CN ? 'Toàn CN' : c.ten_ngan, vals: s }]; if (cs) series.push({ name: 'Toàn CN', vals: cs, color: 'var(--series-neutral)', thin: true, labelColor: 'var(--ink-2)' });
    var chart = V.trendLine({ w: w, h: 270, rightPad: Math.min(150, w * 0.26), series: series, refs: [{ v: ng.dat * 100, label: 'Đạt ' + num(ng.dat * 100, 0) }, { v: ng.kha * 100, label: 'Khá ' + num(ng.kha * 100, 0) }], yMin: 50, yMax: 110, aria: 'Diễn biến điểm quy đổi ' + c.ten_ngan });
    var rows = []; for (var i = 0; i < 12; i++) if (isNum(s[i])) rows.push({ _key: i + 1, th: 'T' + (i + 1), a: num(s[i], 1), b: cs && isNum(cs[i]) ? num(cs[i], 1) : '–' });
    el.innerHTML = H.pair(chart, H.tbl({ caption: 'Điểm quy đổi theo tháng', cols: [{ k: 'th', t: 'Tháng' }, { k: 'a', t: dv === CN ? 'Toàn CN' : c.ten_ngan, cls: 'vtb-r' }, { k: 'b', t: 'Toàn CN', cls: 'vtb-r' }], rows: rows }));
  };

  /* ====================== NỘI DUNG CẦN XỬ LÝ ====================== */
  VIEWS['canh-bao'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, it = VIEWS_LEGACY_GOIY(M, ky), nhom = { 3: [], 2: [], 1: [] }; it.forEach(function (x) { (nhom[x.muc] || nhom[1]).push(x); });
      var cap = { 3: 'Nghiêm trọng — cần xử lý ngay', 2: 'Cần theo dõi', 1: 'Lưu ý' };
      var head = '<p class="vtb-caption">Tổng hợp cảnh báo kỳ ' + H.kyTxt(ky) + ': tiến độ KH, thiếu/bất thường số liệu, dự báo cuối năm, hành động quá hạn, kỳ chưa khoá.</p>';
      if (!it.length) return head + '<div class="moi-card moi-empty"><h2>Không có nội dung cần xử lý</h2><p>Chưa phát hiện cảnh báo nào cho ' + H.kyTxt(ky) + '.</p></div>';
      var cnt = '<div class="moi-chips">' + [3, 2, 1].map(function (m) { return V.tierChip(m === 3 ? 'chua' : m === 2 ? 'cct' : 'gap', { text: nhom[m].length + ' ' + cap[m].split(' — ')[0].toLowerCase() }); }).join(' ') + '</div>';
      return head + cnt + [3, 2, 1].filter(function (m) { return nhom[m].length; }).map(function (m) { return H.cardPlain('moi-c12', cap[m], V.attentionList(nhom[m].map(function (x) { return { muc: m, loai: x.loai, text: x.text, href: x.href }; }))); }).join('');
    }
  };
  function VIEWS_LEGACY_GOIY(M, ky) { var f = root.VIEWS['canh-bao'] && root.VIEWS['canh-bao'].goiY; return f ? f(M, ky) : []; }
})(window);
