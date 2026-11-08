/* MÀN HÌNH THEO DÕI — Tổng quan · Xếp hạng · Ma trận · Thẻ điểm KPI phòng · Theo dõi chỉ tiêu */
(function (root) {
  var esc = UI.esc, num = UI.num, pct = UI.pct, isNum = UI.isNum, CN = KPI_CFG.MA_CN, TT = KPI_CFG.TRANG_THAI;
  var VIEWS = root.VIEWS = root.VIEWS || {};
  function ng() { return STORE.model().ng; }
  function kyText(k) { return 'T' + k.thang + '/' + k.nam; }
  function delta(a, b, d, unit) {
    if (!isNum(a) || !isNum(b)) return '';
    var x = a - b, cls = Math.abs(x) < 0.005 ? 'flat' : x > 0 ? 'up' : 'down';
    return '<span class="delta ' + cls + '">' + (x > 0 ? '▲ ' : x < 0 ? '▼ ' : '● ') + num(Math.abs(x), d === undefined ? 1 : d) + (unit || '') + '</span>';
  }
  function rankMove(c) {
    if (!c.hang_truoc) return '<span class="muted">–</span>';
    var x = c.hang_truoc - c.hang;
    return x > 0 ? '<span class="delta up">▲ ' + x + '</span>' : x < 0 ? '<span class="delta down">▼ ' + (-x) + '</span>' : '<span class="delta flat">●</span>';
  }
  function stack(c) {
    var t = c.so_ct || 1, seg = function (n, k) { return n ? '<i class="' + k + '" style="width:' + (n / t * 100).toFixed(1) + '%" title="' + n + '"></i>' : ''; };
    return '<div class="stack">' + seg(c.so_dat, 'dat') + seg(c.so_kha, 'kha') + seg(c.so_cct, 'cct') + seg(c.so_chua, 'chua') + seg(c.so_thieu, 'thieu') + '</div>';
  }
  function topMat(c, n) {
    return c.rows.filter(function (r) { return isNum(r.mat) && r.mat > 0.005; }).sort(function (a, b) { return b.mat - a.mat; }).slice(0, n || 1);
  }
  function legend() {
    var g = ng();
    return '<div class="legend"><span><i class="dat"></i>Đạt ≥ ' + pct(g.dat, 0) + '</span><span><i class="kha"></i>Khá ≥ ' + pct(g.kha, 0) + '</span><span><i class="cct"></i>Cần cải thiện ≥ ' + pct(g.cct, 0) + '</span><span><i class="chua"></i>Chưa đạt</span><span><i class="thieu"></i>GAP</span></div>';
  }
  function empty(msg) {
    return '<div class="card empty"><h3>Chưa có số thực hiện</h3><p>' + (msg || 'Kỳ đang chọn chưa có số liệu.') + '</p>' +
      (STORE.isAdmin() ? '<a class="btn primary" href="#/nhap-so">Nhập số liệu</a>' : '<p class="muted">Nhờ quản trị viên nhập số hoặc kết nối thư mục dữ liệu chung.</p>') + '</div>';
  }
  function dcNote(d, ind) { return d && Math.abs(d) > 1e-9 ? '<small class="block dc-note" title="Đã gồm điều chỉnh thủ công — xem màn Điều chỉnh số liệu">gồm đ/c ' + UI.signed(Math.round(d * 1e4) / 1e4, ind) + '</small>' : ''; }
  function hangClass(h, n) { if (n < 2) return 'kha'; var p = (h - 1) / (n - 1); return h === 1 ? 'dat hang1' : p <= 0.34 ? 'dat' : p <= 0.67 ? 'kha' : h === n ? 'chua' : 'cct'; }
  function legendHang() { return '<div class="legend"><span><i class="dat"></i>Nhóm đầu</span><span><i class="kha"></i>Nhóm giữa</span><span><i class="cct"></i>Nhóm cuối</span><span><i class="chua"></i>Cuối bảng</span></div>'; }
  function colorOf(r) { return isNum(r) ? UI.htColor(r) : UI.cssVar('--c-thieu'); }

  /* ================= TỔNG QUAN ================= */
  function nhanDinh(M, ky, cn, prev, rk) {
    var s = [], g = ng();
    s.push('Lũy kế đến hết tháng ' + ky.thang + '/' + ky.nam + ', toàn chi nhánh đạt ' + num(cn.quy_doi, 1) + '/100 điểm KPI' +
      (prev && isNum(prev.quy_doi) ? ' (' + (cn.quy_doi >= prev.quy_doi ? 'tăng ' : 'giảm ') + num(Math.abs(cn.quy_doi - prev.quy_doi), 1) + ' điểm so với tháng trước)' : '') +
      '; ' + cn.so_dat + '/' + cn.so_ct + ' chỉ tiêu đạt kế hoạch.');
    if (rk.length) {
      s.push('Dẫn đầu: ' + rk.slice(0, 3).map(function (c) { return c.ten_ngan + ' (' + num(c.quy_doi, 1) + ')'; }).join(', ') + '.');
      var cuoi = rk.filter(function (c) { return c.quy_doi < g.kha * 100; });
      if (cuoi.length) s.push('Dưới ' + num(g.kha * 100, 0) + ' điểm: ' + cuoi.map(function (c) { return c.ten_ngan + ' (' + num(c.quy_doi, 1) + ')'; }).join(', ') + '.');
    }
    var thap = cn.rows.filter(function (r) { return isNum(r.ht) && r.ht < g.dat; }).sort(function (a, b) { return a.ht - b.ht; });
    if (thap.length) s.push('Chỉ tiêu chi nhánh chưa đạt: ' + thap.slice(0, 5).map(function (r) { return r.ind.ten_ngan + ' ' + pct(r.ht); }).join('; ') + '.');
    var cap = [];
    rk.forEach(function (c) { topMat(c, 2).forEach(function (r) { cap.push({ c: c, r: r }); }); });
    cap.sort(function (a, b) { return b.r.mat - a.r.mat; });
    if (cap.length) s.push('Ưu tiên khắc phục: ' + cap.slice(0, 4).map(function (x) { return x.c.ten_ngan + ' – ' + x.r.ind.ten_ngan + ' (đạt ' + pct(x.r.ht) + ', mất ' + num(x.r.mat, 1) + ' điểm)'; }).join('; ') + '.');
    return s.join(' ');
  }

  window.KPI_NHAN_DINH = nhanDinh;   // dùng chung cho xuất Word / PowerPoint (xuat-office.js)
  VIEWS['tong-quan'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, cn = M.card(CN, ky.nam, ky.thang);
      if (!cn.co_so && !M.ranking(ky.nam, ky.thang).some(function (c) { return c.co_so; })) return empty('Chọn kỳ khác ở góc trên, hoặc nhập số cho ' + kyText(ky) + '.');
      var prev = ky.thang > 1 ? M.card(CN, ky.nam, ky.thang - 1) : null, rk = M.ranking(ky.nam, ky.thang), al = M.alerts(ky.nam, ky.thang), g = ng();
      var tb = rk.length ? rk.reduce(function (a, c) { return a + (c.quy_doi || 0); }, 0) / rk.length : null;
      var dat90 = KPI_ENGINE.demDiemCao(rk, g.diem_cao), nghiem = al.filter(function (a) { return a.muc === 3; }).length;
      var h = '<section class="hero card">' +
        '<div class="hero-ring ' + UI.htClass(cn.ht_chung, g) + '">' + UI.ring(cn.ht_chung, num(cn.quy_doi, 1)) + '</div>' +
        '<div class="hero-txt"><small>ĐIỂM KPI TOÀN CHI NHÁNH · LŨY KẾ ' + kyText(ky) + '</small><h2>' + esc(STORE.state.settings.ten_chi_nhanh) + '</h2>' +
        '<p>' + num(cn.diem, 2) + ' / ' + cn.ts + ' điểm theo trọng số ' + (prev ? delta(cn.quy_doi, prev.quy_doi, 2, ' điểm so T' + (ky.thang - 1)) : '') + '</p>' +
        '<div class="chips"><span class="chip dat">' + cn.so_dat + ' Đạt</span><span class="chip kha">' + cn.so_kha + ' Khá</span><span class="chip cct">' + cn.so_cct + ' Cần cải thiện</span><span class="chip chua">' + cn.so_chua + ' Chưa đạt</span>' + (cn.so_thieu ? '<span class="chip thieu">' + cn.so_thieu + ' GAP</span>' : '') + '</div></div>' +
        '<div class="hero-stats">' +
        stat('Dẫn đầu', rk[0] ? '<a href="#/phong/' + rk[0].ma + '">' + esc(rk[0].ten_ngan) + '</a>' : '–', rk[0] ? num(rk[0].quy_doi, 1) + ' điểm' : '') +
        stat('Bình quân các đơn vị', num(tb, 1), 'điểm / ' + rk.length + ' phòng, PGD') +
        stat('Đơn vị ≥ ' + num(g.diem_cao, 0) + ' điểm', dat90 + '/' + rk.length, rk.length ? pct(dat90 / rk.length, 0) + ' số đơn vị' : '') +
        stat('Cảnh báo nghiêm trọng', '<span class="' + (nghiem ? 'txt-chua' : 'txt-dat') + '">' + nghiem + '</span>', al.length + ' cảnh báo tổng') +
        '</div></section>';

      h += '<div class="sec-head"><h3>Chỉ tiêu toàn chi nhánh</h3>' + legend() + '</div><div class="tiles">';
      var allRows = (cn.rows || []).concat(cn.ref || []).filter(function (r) {
        return r.ind && r.ind.trang_thai !== 'inactive' && r.ind.hien_tq !== false;
      }).sort(function (a, b) {
        return (a.ind.thu_tu || 0) - (b.ind.thu_tu || 0);
      });
      allRows.forEach(function (r) {
        var dTh = isNum(r.th) && isNum(r.th_truoc) && r.ind.huong === 'cao_tot' ? r.th - r.th_truoc : null;
        var tsBadge = r.ind.chi_tham_khao ? 'Quản trị' : (r.ts ? 'TS ' + r.ts : 'Quản trị');
        h += '<a class="tile ' + UI.htClass(r.ht, g) + '" href="#/chi-tieu/' + r.ma + '"><div class="tile-top"><span class="tile-name">' + (root.KPI_ICONS ? KPI_ICONS.html(KPI_ICONS.chiTieu(r.ind), 'ic-tile') : '') + esc(r.ind.ten_ngan || r.ind.ten) + '</span><em>' + tsBadge + '</em></div>' +
          '<div class="tile-val">' + UI.val(r.th, r.ind) + (r.ind.dvt !== '%' ? '<small>' + esc(r.ind.dvt) + '</small>' : '') + '</div>' +
          '<div class="tile-sub">' + (r.ind.huong === 'nhap_ty_le' ? 'Tự đánh giá % hoàn thành' : (isNum(r.kh) ? 'KH ' + UI.val(r.kh, r.ind) : (r.ind.chi_tham_khao ? 'Chỉ tiêu quản trị' : 'KH –'))) + (r.nguon_cn === 'tong' ? ' · <span title="Số thực hiện CN = cộng các phòng">TH Σ phòng</span>' : '') + '</div>' +
          UI.bar(r.ht, g) + '<div class="tile-foot"><b>' + pct(r.ht) + '</b>' + (dTh !== null ? '<span class="muted">+' + num(dTh) + ' trong tháng</span>' : '') + (isNum(r.ht_nam) ? '<span class="muted">' + pct(r.ht_nam, 0) + ' KH năm</span>' : '') + '</div></a>';
      });
      h += '</div>';

      h += '<div class="cols-2"><div class="card"><div class="card-head"><h3>Điểm quy đổi các phòng/PGD</h3><a href="#/xep-hang" class="link">Xếp hạng chi tiết →</a></div><div class="chart h300"><canvas id="c-rank"></canvas></div></div>' +
        '<div class="card"><div class="card-head"><h3>Diễn biến điểm KPI ' + ky.nam + '</h3></div><div class="chart h300"><canvas id="c-trend"></canvas></div></div></div>';

      h += '<div class="cols-2"><div class="card"><div class="card-head"><h3>Cảnh báo điều hành</h3><span class="muted">' + al.length + ' mục</span></div>' + alertList(al, 9) + '</div>' +
        '<div class="card"><div class="card-head"><h3>Nhận định nhanh</h3><button class="btn sm" id="btn-copy">Sao chép</button></div><p class="nhan-dinh" id="nd">' + esc(nhanDinh(M, ky, cn, prev, rk)) + '</p>' +
        '<p class="muted small">Đoạn văn tự sinh từ số liệu — dùng làm khung cho báo cáo giao ban, chỉnh sửa trước khi gửi.</p></div></div>';
      return h;
    },
    mount: function (v, A) {
      var M = STORE.model(), ky = A.ky, rk = M.ranking(ky.nam, ky.thang), g = ng();
      UI.chart(v.querySelector('#c-rank'), { type: 'bar', data: { labels: rk.map(function (c) { return c.ten_ngan; }),
        datasets: [{ data: rk.map(function (c) { return round(c.quy_doi); }), backgroundColor: rk.map(function (c) { return colorOf(c.ht_chung); }), borderRadius: 5, barThickness: 18 }] },
        options: { indexAxis: 'y', plugins: { legend: { display: false }, annotation: UI.nguong(g, 'x', false), nhanSo: { fmt: function (v) { return num(v, 1); } }, tooltip: { callbacks: { label: function (x) { return ' ' + num(x.raw, 1) + ' điểm'; } } } },
          scales: { x: { min: 0, suggestedMax: 110, grid: { color: '#eef2f7' } }, y: { grid: { display: false } } },
          onClick: function (e, el) { if (el[0]) APP.go('phong', rk[el[0].index].ma); } } });
      var months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
      var cnS = M.scoreSeries(CN, ky.nam), avg = months.map(function (_, i) {
        var a = M.units.map(function (u) { return M.scoreSeries(u.ma, ky.nam)[i]; }).filter(isNum); return a.length ? round(a.reduce(function (x, y) { return x + y; }, 0) / a.length) : null; });
      UI.chart(v.querySelector('#c-trend'), { type: 'line', data: { labels: months, datasets: [
        { label: 'Toàn chi nhánh', data: cnS.map(round), borderColor: UI.cssVar('--primary'), backgroundColor: 'rgba(14,76,146,.08)', fill: true, tension: .3, pointRadius: 3 },
        { label: 'Bình quân phòng/PGD', data: avg, borderColor: UI.cssVar('--accent'), borderDash: [5, 4], tension: .3, pointRadius: 2, nhanSo: false },
        ] },
        options: { spanGaps: true, plugins: { legend: { position: 'bottom' }, annotation: UI.nguong(g, 'y', true), nhanSo: { fmt: function (v) { return num(v, 1); } } }, scales: { y: { suggestedMin: 60, suggestedMax: 110, grid: { color: '#eef2f7' } }, x: { grid: { display: false } } } } });
      var b = v.querySelector('#btn-copy'); if (b) b.onclick = function () { navigator.clipboard.writeText(v.querySelector('#nd').textContent).then(function () { UI.toast('Đã sao chép nhận định.', 'ok'); }); };
      bindAlerts(v);
    }
  };
  function noteInfo(ma, ky) {
    var i = STORE.getNoteInfo(ma, ky.nam, ky.thang);
    return i ? '<p class="muted small">Cập nhật ' + (i.ai ? 'bởi <b>' + esc(i.ai) + '</b> ' : '') + 'lúc ' + new Date(i.t).toLocaleString('vi-VN') + '</p>' : '';
  }
  function stat(t, v, s) { return '<div class="stat"><small>' + t + '</small><b>' + v + '</b><span>' + esc(s) + '</span></div>'; }
  function round(x) { return isNum(x) ? Math.round(x * 100) / 100 : null; }
  function alertList(al, n) {
    if (!al.length) return '<p class="ok-box">Không có cảnh báo trong kỳ này. 👍</p>';
    var lv = { 3: 'chua', 2: 'cct', 1: 'thieu' };
    var item = function (a) { return '<li class="al ' + lv[a.muc] + '"' + (a.dv ? ' data-dv="' + a.dv + '"' : a.ct ? ' data-ct="' + a.ct + '"' : '') + '><em>' + esc(a.loai) + '</em><span>' + esc(a.text) + '</span></li>'; };
    return '<ul class="alerts">' + al.slice(0, n).map(item).join('') + '</ul>' + (al.length > n ? '<details><summary>Xem thêm ' + (al.length - n) + ' cảnh báo</summary><ul class="alerts">' + al.slice(n).map(item).join('') + '</ul></details>' : '');
  }
  function bindAlerts(v) { v.querySelectorAll('.al').forEach(function (li) { li.onclick = function () { if (li.dataset.dv) APP.go('phong', li.dataset.dv); else if (li.dataset.ct) APP.go('chi-tieu', li.dataset.ct); }; }); }

  /* ================= XẾP HẠNG ================= */
  VIEWS['xep-hang'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, rk = M.ranking(ky.nam, ky.thang, A.khoi || null), st = STORE.state;
      var h = '<div class="toolbar"><div class="pills">' + [''].concat(st.khoi.filter(function (k) { return k.ma !== 'CN' && M.units.some(function (u) { return u.khoi === k.ma; }); }).map(function (k) { return k.ma; }))
        .map(function (k) { var t = k ? (st.khoi.filter(function (x) { return x.ma === k; })[0] || {}).ten || k : 'Tất cả đơn vị'; return '<button class="pill' + ((A.khoi || '') === k ? ' on' : '') + '" data-khoi="' + k + '">' + esc(t) + '</button>'; }).join('') +
        '</div><div class="grow"></div>' + legend() + '</div>';
      if (!rk.some(function (c) { return c.co_so; })) return h + empty();
      h += '<div class="card p0"><div id="tb-rank" class="tb-x"></div></div>';
      h += '<div class="card"><div class="card-head"><h3>So sánh điểm theo nhóm chỉ tiêu</h3><span class="muted">điểm đạt / trọng số của từng nhóm</span></div><div class="chart h320"><canvas id="c-nhom"></canvas></div></div>';
      return h;
    },
    mount: function (v, A) {
      v.querySelectorAll('[data-khoi]').forEach(function (b) { b.onclick = function () { A.khoi = b.dataset.khoi; APP.render(); }; });
      var M = STORE.model(), ky = A.ky, rk = M.ranking(ky.nam, ky.thang, A.khoi || null), elRk = v.querySelector('#tb-rank');
      if (elRk) {
        var dong = rk.map(function (c) { var m = topMat(c, 1)[0]; return { ma: c.ma, c: c, m: m, hang: c.hang, ten: c.ten_ngan, khoi: c.khoi, diem: c.diem, qd: c.quy_doi, mat: m ? m.mat : 0 }; });
        UI.bang(elRk, [
          { t: 'Hạng', f: 'hang', kieu: 'so', w: 70, c: true, g: 0, hien: function (r) { return '<span class="medal m' + Math.min(r.c.hang, 4) + '">' + r.c.hang + '</span>'; } },
          { t: 'Đơn vị', f: 'ten', kieu: 'chu', w: 140, g: 2, hien: function (r) { var c = r.c; return '<b>' + esc(c.ten_ngan) + '</b>' + (c.ten !== c.ten_ngan ? '<small class="block muted">' + esc(c.ten) + '</small>' : ''); } },
          { t: 'Khối', f: 'khoi', kieu: 'chu', w: 80, hien: function (r) { return '<span class="tag">' + esc(r.c.khoi) + '</span>'; } },
          { t: 'Điểm / TS', f: 'diem', kieu: 'so', w: 100, r: true, hien: function (r) { return '<span class="num">' + num(r.c.diem, 2) + ' / ' + r.c.ts + '</span>'; } },
          { t: 'Điểm quy đổi (thang 100)', f: 'qd', kieu: 'so', w: 180, g: 2, hien: function (r) { var c = r.c; return '<div class="score-cell"><b class="txt-' + UI.htClass(c.ht_chung, ng()) + '">' + num(c.quy_doi, 1) + '</b>' + UI.bar(c.ht_chung, ng(), 1.3) + '</div>'; } },
          { t: 'Cơ cấu chỉ tiêu', f: 'co_cau', w: 160, g: 2, hien: function (r) { return stack(r.c) + '<small class="muted">' + r.c.so_dat + '/' + r.c.so_ct + ' đạt</small>'; } },
          { t: 'Xu hướng ' + ky.nam, f: 'xu_huong', w: 110, hien: function (r) { return '<span class="spark-cell">' + UI.spark(M.scoreSeries(r.c.ma, ky.nam)) + '</span>'; } },
          { t: 'Mất điểm nhiều nhất', f: 'mat', kieu: 'so', w: 150, g: 2, hien: function (r) { return r.m ? esc(r.m.ind.ten_ngan) + ' <small class="muted">(-' + num(r.m.mat, 1) + ')</small>' : '<span class="muted">–</span>'; } },
          { t: 'So tháng trước', f: 'so_truoc', w: 110, c: true, hien: function (r) { return rankMove(r.c); } }
        ], dong, { click: function (r) { APP.go('phong', r.ma); }, rowFmt: function (r, row) { row.classList.add('clk'); } }).then(function () { if (elRk.isConnected) UI.nutAnh(v); });
      }
      var nhoms = []; M.inds.forEach(function (i) { if (!i.chi_tham_khao && nhoms.indexOf(i.nhom) < 0) nhoms.push(i.nhom); });
      var pal = ['#0E4C92', '#2F80ED', '#27AE60', '#F2994A', '#9B51E0', '#EB5757', '#56CCF2', '#6FCF97'];
      UI.chart(v.querySelector('#c-nhom'), { type: 'bar', data: { labels: rk.map(function (c) { return c.ten_ngan; }), datasets: nhoms.map(function (n, i) {
        return { label: n, backgroundColor: pal[i % pal.length], borderRadius: 2, data: rk.map(function (c) { return round(c.rows.filter(function (r) { return r.ind.nhom === n; }).reduce(function (a, r) { return a + (r.diem || 0); }, 0)); }) };
      }) }, options: { plugins: { legend: { position: 'bottom' }, nhanSo: { fmt: function (v) { return v >= 0.5 ? num(v, 1) : ''; } } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: '#eef2f7' } } } } });
    }
  };

  /* ================= MA TRẬN ================= */
  VIEWS['ma-tran'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, mode = A.mt_mode || 'ht', rk = M.ranking(ky.nam, ky.thang), cn = M.card(CN, ky.nam, ky.thang), g = ng(), RI = M.rankInd(ky.nam, ky.thang);
      if (!rk.some(function (c) { return c.co_so; })) return empty();
      var cols = [cn].concat(rk);
      var h = '<div class="toolbar"><div class="pills">' + [['ht', '% hoàn thành KH'], ['hang', 'Thứ hạng'], ['kh_nam', '% KH năm'], ['diem', 'Điểm đạt'], ['mat', 'Điểm bị mất']].map(function (x) { return '<button class="pill' + (mode === x[0] ? ' on' : '') + '" data-mode="' + x[0] + '">' + x[1] + '</button>'; }).join('') +
        '</div><div class="grow"></div>' + UI.heatLegend(mode === 'hang' ? 'Hạng cuối' : mode === 'mat' ? 'Mất nhiều điểm' : 'Thấp', mode === 'hang' ? 'Hạng 1' : mode === 'mat' ? 'Không mất điểm' : 'Vượt KH') + '</div>' + (mode === 'kh_nam' ? '<p class="muted small">Số trong ô = TH lũy kế ÷ KH cả năm (KH tháng 12). Màu = tiến độ so với KH lũy kế đến tháng đang xem. Chỉ tiêu càng thấp càng tốt / tự đánh giá không áp dụng.</p>' : mode === 'hang' ? '<p class="muted small">Hạng của phòng/PGD ở từng chỉ tiêu theo % hoàn thành KH (1 = cao nhất, bằng % thì đồng hạng). Cột Toàn CN hiện % hoàn thành để tham chiếu.</p>' : '') + '<div class="card p0"><div class="tbl-wrap heat-wrap"><table class="heat"><thead><tr><th class="sticky">Chỉ tiêu</th>' +
        cols.map(function (c) {
          var sub = c.ma === CN ? 'Thẻ điểm CN' : (c.hang ? 'Hạng ' + c.hang : '–');
          return '<th><a href="#/phong/' + c.ma + '">' + esc(c.ten_ngan) + '</a><small>' + sub + '</small></th>';
        }).join('') + '</tr></thead><tbody>';
      var nhom = null;
      M.inds.forEach(function (ind) {
        if (ind.nhom !== nhom) { nhom = ind.nhom; h += '<tr class="grp"><td class="sticky" colspan="' + (cols.length + 1) + '">' + esc(nhom) + '</td></tr>'; }
        h += '<tr><td class="sticky"><a href="#/chi-tieu/' + ind.ma + '">' + esc(ind.ten_ngan) + '</a>' + (ind.chi_tham_khao ? '<small> quản trị</small>' : '') + '</td>';
        cols.forEach(function (c) {
          var r = c.rows.concat(c.ref).filter(function (x) { return x.ma === ind.ma; })[0];
          if (!r) { h += '<td class="na">·</td>'; return; }
          var cls = r.tt === TT.THIEU ? 'thieu' : '', t = r.tt === TT.THIEU ? null : UI.htT(r.ht, g), txt, tip = '';
          if (mode === 'hang' && c.ma !== CN) {
            var ri = RI.ct[ind.ma], hh = ri && ri.hang[c.ma];
            txt = hh ? hh + '<small>/' + ri.n + '</small>' : '–'; cls = hh ? (hh === 1 ? 'hang1' : '') : 'thieu'; t = hh ? (ri.n > 1 ? 1 - (hh - 1) / (ri.n - 1) : 0.7) : null; tip = hh ? '\nHạng ' + hh + '/' + ri.n : '';
          } else if (mode === 'kh_nam') {
            txt = isNum(r.ht_nam) ? pct(r.ht_nam, 0) : '–'; if (!isNum(r.ht_nam)) { cls = 'thieu'; t = null; } tip = '\n%KH năm: ' + pct(r.ht_nam) + ' (KH năm ' + UI.val(r.kh_nam, ind) + ')';
          } else if (mode === 'hang') txt = isNum(r.ht) ? pct(r.ht, 0) : '–';
          else if (mode === 'diem') txt = isNum(r.diem) ? num(r.diem, 1) + '<small>/' + r.ts + '</small>' : (r.ind.chi_tham_khao ? pct(r.ht, 0) : '–');
          else if (mode === 'mat') { t = isNum(r.mat) && r.ts ? 1 - Math.min(r.mat / r.ts, 1) : t; txt = isNum(r.mat) ? (r.mat > 0.005 ? '-' + num(r.mat, 1) : '✓') : (r.ind.chi_tham_khao ? pct(r.ht, 0) : '–'); }
          else txt = isNum(r.ht) ? pct(r.ht, 0) : '–';
          h += '<td class="hc ' + cls + (r.ind.chi_tham_khao ? ' ref' : '') + '" style="' + (((mode === 'hang' && c.ma !== CN) || mode === 'mat') ? UI.heatStyle(t) : (r.tt === TT.THIEU ? '' : UI.heatStyleHT(r.ht, g))) + '" data-dv="' + c.ma + '" title="' + esc(c.ten_ngan + ' · ' + ind.ten_ngan + '\nKH: ' + UI.val(r.kh, ind) + '  TH: ' + UI.val(r.th, ind) + '\n%HT: ' + pct(r.ht) + (isNum(r.ts) ? '  Điểm: ' + num(r.diem, 2) + '/' + r.ts : '') + tip) + '">' + txt + '</td>';
        });
        h += '</tr>';
      });
      h += '</tbody><tfoot>' + (mode === 'hang' ? '<tr><td class="sticky">Hạng bình quân</td>' + cols.map(function (c) { var t = RI.tom[c.ma]; return c.ma === CN || !t ? '<td class="na">·</td>' : '<td class="hc" style="' + UI.heatStyle(rk.length > 1 ? 1 - (t.tb - 1) / (rk.length - 1) : 0.7) + '"><b>' + num(t.tb, 1) + '</b></td>'; }).join('') + '</tr>' +
          '<tr><td class="sticky">Số chỉ tiêu top 3 / cuối bảng</td>' + cols.map(function (c) { var t = RI.tom[c.ma]; return c.ma === CN || !t ? '<td class="na">·</td>' : '<td class="c small"><span class="txt-dat"><b>' + t.top3 + '</b></span> / <span class="txt-chua"><b>' + t.cuoi + '</b></span></td>'; }).join('') + '</tr>' : '') +
        '<tr><td class="sticky">Điểm quy đổi</td>' + cols.map(function (c) { return '<td class="hc" style="' + UI.heatStyleHT(c.ht_chung, g) + '"><b>' + num(c.quy_doi, 1) + '</b></td>'; }).join('') + '</tr></tfoot></table></div></div>' +
        '<p class="muted small">Ô "·" = chỉ tiêu không áp dụng cho khối của đơn vị. Di chuột lên ô để xem KH/TH; bấm vào ô để mở thẻ điểm đơn vị.</p>';
      return h;
    },
    mount: function (v, A) {
      v.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () { A.mt_mode = b.dataset.mode; APP.render(); }; });
      var hp = v.querySelector('#heat-pal'); if (hp) hp.onchange = function () { UI.setHeatPal(this.value); APP.render(); };
      v.querySelector('.heat') && v.querySelector('.heat').addEventListener('click', function (e) { var td = e.target.closest('td[data-dv]'); if (td) APP.go('phong', td.dataset.dv); });
    }
  };

  /* ================= THẺ ĐIỂM ĐƠN VỊ ================= */
  VIEWS['phong'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, ma = A.route.arg || (M.units[0] && M.units[0].ma) || CN, g = ng();
      if (ma !== CN && !M.unitMap[ma]) ma = CN;
      A.route.arg = ma;
      var c = M.card(ma, ky.nam, ky.thang), prev = ky.thang > 1 ? M.card(ma, ky.nam, ky.thang - 1) : null, rk = M.ranking(ky.nam, ky.thang);
      var me = rk.filter(function (x) { return x.ma === ma; })[0];
      var h = '<div class="toolbar no-print"><select id="sel-dv" class="sel-lg"><option value="' + CN + '"' + (ma === CN ? ' selected' : '') + '>★ Toàn chi nhánh</option>' +
        M.units.map(function (u) { return '<option value="' + u.ma + '"' + (u.ma === ma ? ' selected' : '') + '>' + esc(u.ten) + '</option>'; }).join('') + '</select><div class="grow"></div>' +
        (ma !== CN ? '<a href="#/diem-kpi/' + ma + '" class="btn" style="text-decoration:none;">Trừ / Cộng điểm KPI</a>' : '') +
        '<button class="btn" id="btn-print">In thẻ điểm</button><button class="btn" id="btn-xlsx">Xuất Excel báo cáo</button><button class="btn" id="btn-all-print" title="Mỗi phòng/PGD một trang A4 để gửi cho đơn vị">In thẻ điểm tất cả phòng</button><button class="btn" id="btn-all-xlsx" title="Một tệp Excel, mỗi đơn vị một sheet">Excel từng phòng</button></div>';
      if (!c.so_ct) return h + '<div class="card empty"><h3>Chưa khai báo trọng số</h3><p>Khối "' + esc(c.khoi) + '" chưa có trọng số chỉ tiêu nào. Vào Danh mục & trọng số để khai báo.</p></div>';
      h += '<section class="hero card sm"><div class="hero-ring ' + UI.htClass(c.ht_chung, g) + '">' + UI.ring(c.ht_chung, num(c.quy_doi, 1), 112) + '</div>' +
        '<div class="hero-txt"><small>THẺ ĐIỂM KPI · LŨY KẾ ' + kyText(ky) + ' · KHỐI ' + esc(c.khoi) + '</small><h2>' + esc(c.ten) + '</h2>' +
        '<p>' + num(c.diem, 2) + ' / ' + c.ts + ' điểm' + (c.dc_diem ? ' (' + (c.dc_diem > 0 ? '+' : '') + num(c.dc_diem, 2) + ' điểm thưởng/kỷ luật → KPI: <b>' + num(c.quy_doi, 2) + '</b>)' : '') + (prev ? ' ' + delta(c.quy_doi, prev.quy_doi, 2, ' điểm so T' + (ky.thang - 1)) : '') + '</p>' +
        '<div class="chips"><span class="chip dat">' + c.so_dat + ' Đạt</span><span class="chip kha">' + c.so_kha + ' Khá</span><span class="chip cct">' + c.so_cct + ' Cần cải thiện</span><span class="chip chua">' + c.so_chua + ' Chưa đạt</span>' + (c.so_thieu ? '<span class="chip thieu">' + c.so_thieu + ' GAP</span>' : '') + '</div></div>' +
        '<div class="hero-stats">' + (me ? stat('Xếp hạng', me.hang + '/' + rk.length, me.hang_truoc ? 'tháng trước: ' + me.hang_truoc : '') : stat('Đơn vị', 'Toàn CN', 'thẻ điểm chi nhánh')) +
        (c.dc_diem ? stat('Cộng/trừ điểm KPI', (c.dc_diem > 0 ? '<span class="txt-dat">+' + num(c.dc_diem, 2) + '</span>' : '<span class="txt-chua">' + num(c.dc_diem, 2) + '</span>'), c.ds_dc_diem.length + ' khoản thi đua/kỷ luật') : (c.diem >= c.ts ? stat('Điểm vượt trọng số', '<span class="txt-dat">+' + num(c.diem - c.ts, 2) + '</span>', 'nhờ chỉ tiêu vượt KH (trần %HT tối đa)') : stat('Điểm bị mất', '<span class="txt-chua">' + num(c.ts - c.diem, 2) + '</span>', 'trên ' + c.ts + ' điểm trọng số'))) + '</div></section>';

      if (c.ds_dc_diem && c.ds_dc_diem.length > 0) {
        h += '<div class="card p0" style="margin-bottom:14px;"><div style="padding:10px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="font-size:14px;font-weight:700;">Điểm thi đua, khen thưởng & kỷ luật trong tháng (tổng: <span class="' + (c.dc_diem > 0 ? 'txt-dat' : 'txt-chua') + '">' + (c.dc_diem > 0 ? '+' : '') + num(c.dc_diem, 2) + ' điểm</span>)</div>' +
          '<a href="#/diem-kpi/' + ma + '" class="btn ghost btn-sm">Quản lý cộng/trừ điểm</a>' +
          '</div><div class="tbl-wrap"><table class="tbl"><thead><tr>' +
          '<th style="width:40px;" class="c">#</th><th style="width:100px;" class="c">Loại</th><th style="width:90px;" class="r">Điểm</th><th>Lý do</th><th>Căn cứ văn bản</th><th style="width:120px;">Người duyệt</th>' +
          '</tr></thead><tbody>' +
          c.ds_dc_diem.map(function (x, idx) {
            var isCong = x.diem >= 0;
            return '<tr><td class="c muted">' + (idx + 1) + '</td><td class="c">' + (isCong ? '<span class="chip dat" style="font-size:11px;padding:2px 6px;">Cộng điểm</span>' : '<span class="chip chua" style="font-size:11px;padding:2px 6px;">Trừ điểm</span>') + '</td>' +
              '<td class="r num" style="font-weight:700;color:' + (isCong ? 'var(--dat,#16a34a)' : 'var(--chua,#dc2626)') + ';">' + (isCong ? '+' : '') + num(x.diem, 2) + '</td>' +
              '<td><b>' + esc(x.ly_do || '—') + '</b></td><td class="small">' + esc(x.can_cu || '—') + '</td><td class="small muted">' + esc(x.ai || '—') + '</td></tr>';
          }).join('') +
          '</tbody></table></div></div>';
      }

      h += '<div class="card p0"><div class="tbl-wrap"><table class="tbl score"><thead><tr><th>#</th><th>Chỉ tiêu</th><th class="r">TS</th><th class="r">Kế hoạch</th><th class="r">Thực hiện</th><th class="r">+/- so KH</th><th style="min-width:150px">% hoàn thành</th><th class="r">Điểm</th><th class="r">Mất</th><th>Trạng thái</th><th class="r">%KH năm</th><th class="r">TH tăng trong tháng</th></tr></thead><tbody>';
      var nhom = null, i = 0;
      c.rows.concat(c.ref).forEach(function (r) {
        var gname = r.ind.chi_tham_khao ? 'Chỉ tiêu quản trị (không chấm điểm KPI)' : r.ind.nhom;
        if (gname !== nhom) { nhom = gname; h += '<tr class="grp"><td colspan="12">' + esc(nhom) + '</td></tr>'; }
        var dTh = isNum(r.th) && isNum(r.th_truoc) && r.ind.huong === 'cao_tot' ? r.th - r.th_truoc : null;
        h += '<tr' + (r.ind.chi_tham_khao ? ' class="ref"' : '') + '><td class="muted">' + (++i) + '</td><td><a href="#/chi-tieu/' + r.ma + '">' + esc(r.ind.ten) + '</a><small class="block muted">' + esc(r.ind.dvt) + (r.ind.huong === 'thap_tot' ? ' · càng thấp càng tốt' : r.ind.huong === 'nhap_ty_le' ? ' · nhập % hoàn thành' : '') + (r.nguon_cn === 'tong' ? ' · Σ các phòng' : r.nguon_cn === 'tb' ? ' · bình quân các phòng' : '') + '</small></td>' +
          '<td class="r">' + (r.ts === null ? '–' : r.ts) + '</td><td class="r num">' + UI.val(r.kh, r.ind) + '</td><td class="r num"><b>' + UI.val(r.th, r.ind) + '</b>' + dcNote(r.dc, r.ind) + '</td><td class="r num ' + (isNum(r.gap) ? ((r.ind.huong === 'thap_tot' ? -r.gap : r.gap) >= 0 ? 'txt-dat' : 'txt-chua') : '') + '">' + UI.signed(r.gap, r.ind) + '</td>' +
          '<td><div class="score-cell"><b class="txt-' + UI.htClass(r.ht, g) + '">' + pct(r.ht) + '</b>' + UI.bar(r.ht, g, Math.max(r.toi_da || 1.3, 1)) + '</div></td>' +
          '<td class="r num">' + (isNum(r.diem) ? num(r.diem, 2) : '–') + '</td><td class="r num ' + (r.mat > 0.005 ? 'txt-chua' : 'muted') + '">' + (isNum(r.mat) ? num(r.mat, 2) : '–') + '</td><td>' + UI.chip(r.tt) + '</td>' +
          '<td class="r num">' + pct(r.ht_nam, 0) + '</td><td class="r num">' + (dTh === null ? '–' : UI.signed(dTh, r.ind)) + '</td></tr>';
      });
      h += '</tbody><tfoot><tr><td></td><td><b>TỔNG CỘNG CHỈ TIÊU</b></td><td class="r"><b>' + c.ts + '</b></td><td colspan="4"></td><td class="r"><b>' + num(c.diem, 2) + '</b></td><td class="r txt-chua"><b>' + num(c.rows.reduce(function (a, r) { return a + (r.mat || 0); }, 0), 2) + '</b></td><td colspan="3"></td></tr>' +
        (c.dc_diem ? '<tr><td></td><td colspan="6"><b>Điểm cộng/trừ thi đua - kỷ luật KPI:</b></td><td class="r num" style="font-weight:800;color:' + (c.dc_diem > 0 ? 'var(--dat,#16a34a)' : 'var(--chua,#dc2626)') + ';">' + (c.dc_diem > 0 ? '+' : '') + num(c.dc_diem, 2) + '</td><td colspan="4"></td></tr>' +
        '<tr style="background:var(--card-hover,#f1f5f9);"><td></td><td colspan="6"><b>ĐIỂM KPI CHÍNH THỨC (QUY ĐỔI THANG 100):</b></td><td class="r num" style="font-size:15px;font-weight:900;color:var(--primary);">' + num(c.quy_doi, 2) + '</td><td colspan="4"></td></tr>' : '') +
        '</tfoot></table></div></div>';

      h += '<div class="cols-2"><div class="card"><div class="card-head"><h3>Diễn biến điểm quy đổi ' + ky.nam + '</h3></div><div class="chart h260"><canvas id="c-tr"></canvas></div></div>' +
        '<div class="card"><div class="card-head"><h3>Điểm bị mất theo chỉ tiêu</h3><span class="muted">tập trung khắc phục từ trên xuống</span></div><div class="chart h260"><canvas id="c-mat"></canvas></div></div></div>';
      var note = STORE.getNote(ma, ky.nam, ky.thang);
      h += '<div class="card"><div class="card-head"><h3>Nhận xét & giải pháp ' + kyText(ky) + '</h3></div>' +
        (STORE.isAdmin() ? '<textarea id="note" rows="4" placeholder="Nguyên nhân chưa đạt, giải pháp, đầu mối, thời hạn…">' + esc(note) + '</textarea><div class="right"><button class="btn primary sm" id="btn-note">Lưu nhận xét</button></div>'
          : (note ? '<p class="pre">' + esc(note) + '</p>' : '<p class="muted">Chưa có nhận xét.</p>')) + noteInfo(ma, ky) + '</div>';
      return h;
    },
    mount: function (v, A) {
      var M = STORE.model(), ky = A.ky, ma = A.route.arg, c = M.card(ma, ky.nam, ky.thang), g = ng();
      v.querySelector('#sel-dv').onchange = function () { APP.go('phong', this.value); };
      v.querySelector('#btn-print').onclick = function () { window.print(); };
      v.querySelector('#btn-all-print').onclick = function () { KPI_THE_DIEM.inTatCa(ky); };
      v.querySelector('#btn-all-xlsx').onclick = function () { KPI_THE_DIEM.xuatExcel(ky).then(function (n) { UI.toast('Đã xuất thẻ điểm ' + n + ' đơn vị.', 'ok'); }, function (e) { UI.toast(e.message, 'err'); }); };
      v.querySelector('#btn-xlsx').onclick = function () { EXCEL.xuatBaoCao(ky.nam, ky.thang).catch(function (e) { UI.toast(e.message, 'err'); }); };
      var bn = v.querySelector('#btn-note'); if (bn) bn.onclick = function () { STORE.setNote(ma, ky.nam, ky.thang, v.querySelector('#note').value.trim()); UI.toast('Đã lưu nhận xét.', 'ok'); };
      if (!c.so_ct) return;
      var months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
      var ds = [{ label: c.ten_ngan, data: M.scoreSeries(ma, ky.nam).map(round), borderColor: UI.cssVar('--primary'), backgroundColor: 'rgba(14,76,146,.08)', fill: true, tension: .3 }];
      if (ma !== CN) ds.push({ label: 'Toàn chi nhánh', data: M.scoreSeries(CN, ky.nam).map(round), borderColor: UI.cssVar('--accent'), borderDash: [5, 4], tension: .3, pointRadius: 2 });
      UI.chart(v.querySelector('#c-tr'), { type: 'line', data: { labels: months, datasets: ds }, options: { spanGaps: true, plugins: { legend: { position: 'bottom' }, annotation: UI.nguong(g, 'y', true), nhanSo: { fmt: function (v) { return num(v, 1); } } }, scales: { y: { suggestedMin: 60, suggestedMax: 110 }, x: { grid: { display: false } } } } });
      var mat = c.rows.filter(function (r) { return isNum(r.mat) && r.mat > 0.005; }).sort(function (a, b) { return b.mat - a.mat; });
      if (!mat.length) { v.querySelector('#c-mat').parentNode.innerHTML = '<p class="ok-box">Không bị mất điểm ở chỉ tiêu nào.</p>'; return; }
      UI.chart(v.querySelector('#c-mat'), { type: 'bar', data: { labels: mat.map(function (r) { return r.ind.ten_ngan; }), datasets: [{ data: mat.map(function (r) { return round(r.mat); }), backgroundColor: mat.map(function (r) { return colorOf(r.ht); }), borderRadius: 4, barThickness: 16 }] },
        options: { indexAxis: 'y', plugins: { legend: { display: false }, nhanSo: { fmt: function (v) { return num(v, 2); } }, tooltip: { callbacks: { label: function (x) { var r = mat[x.dataIndex]; return ' Mất ' + num(r.mat, 2) + '/' + r.ts + ' điểm · đạt ' + pct(r.ht); } } } }, scales: { x: { beginAtZero: true }, y: { grid: { display: false } } } } });
    }
  };

})(window);
