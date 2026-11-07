/* MÀN HÌNH DỰ BÁO & NGUYÊN NHÂN — Dự báo cuối năm · Biến động điểm (nguyên nhân thay đổi, chỉ tiêu cần ưu tiên cải thiện) · Mô phỏng kịch bản. Dùng hàm thuần trong phan-tich.js. */
(function (root) {
  var esc = UI.esc, num = UI.num, pct = UI.pct, isNum = UI.isNum, CN = KPI_CFG.MA_CN, E = KPI_ENGINE;
  var VIEWS = root.VIEWS = root.VIEWS || {};
  var KL = { da_dat: ['dat', 'Đã đạt KH năm'], dat: ['dat', 'Dự kiến đạt'], sat: ['cct', 'Cận ngưỡng — cần đẩy mạnh thực hiện'], khong_dat: ['chua', 'Có nguy cơ không đạt KH năm'] };
  var TABS = [['du-bao', 'Dự báo cuối năm'], ['bien-dong', 'Biến động điểm & chỉ tiêu ưu tiên cải thiện'], ['mo-phong', 'Mô phỏng kịch bản']];
  function kyText(k) { return 'T' + k.thang + '/' + k.nam; }
  function chipKL(k) { return k && KL[k] ? '<span class="chip ' + KL[k][0] + '">' + KL[k][1] + '</span>' : '<span class="chip thieu">–</span>'; }
  function dlt(x, d) { if (!isNum(x)) return '<span class="muted">–</span>'; var c = Math.abs(x) < 0.005 ? 'flat' : x > 0 ? 'up' : 'down'; return '<span class="delta ' + c + '">' + (x > 0 ? '▲ ' : x < 0 ? '▼ ' : '● ') + num(Math.abs(x), d === undefined ? 2 : d) + '</span>'; }
  function dvSel(M, ma, id) {
    return '<select id="' + id + '" class="sel-lg"><option value="' + CN + '"' + (ma === CN ? ' selected' : '') + '>★ Toàn chi nhánh</option>' + M.units.map(function (u) { return '<option value="' + u.ma + '"' + (u.ma === ma ? ' selected' : '') + '>' + esc(u.ten) + '</option>'; }).join('') + '</select>';
  }
  function giaTri(v, ind) { return isNum(v) ? UI.val(v, ind) : '–'; }
  function coSo(M, ky) { return M.card(CN, ky.nam, ky.thang).co_so || M.ranking(ky.nam, ky.thang).some(function (c) { return c.co_so; }); }

  /* ---------- Tab 1: Dự báo cuối năm ---------- */
  function tabDuBao(M, A, ky) {
    var cach = A.db_cach || E.CACH_MAC_DINH, X = M.duBaoXepHang(ky.nam, ky.thang, cach), cn = X.cn, g = M.ng;
    var sel = A.db_dv && (A.db_dv === CN || M.unitMap[A.db_dv]) ? A.db_dv : CN;
    var h = '<div class="toolbar"><label class="inline">Cách dự báo <select id="db-cach">' + Object.keys(E.CACH_DU_BAO).map(function (k) { return '<option value="' + k + '"' + (k === cach ? ' selected' : '') + '>' + E.CACH_DU_BAO[k] + '</option>'; }).join('') + '</select></label>' +
      '<span class="muted small">Dự báo dựa trên số lũy kế đến hết ' + kyText(ky) + ' sang tháng 12. Kết quả chỉ mang tính tham khảo; chỉ tiêu có tính mùa vụ cần đối chiếu thêm các cách tính khác. Cách "Theo đường kế hoạch" giữ nguyên tỷ lệ hoàn thành hiện tại nên điểm dự kiến không đổi, chỉ dùng để ước tính số tuyệt đối cuối năm.</span></div>';
    if (ky.thang >= 12) h += '<div class="hint">Tháng 12: số liệu đã là cả năm nên dự báo bằng thực tế.</div>';
    var tot = cn.quy_doi_du_bao, cur = cn.quy_doi_hien_tai, mau = isNum(tot) ? UI.htClass(tot / 100, g) : 'thieu';
    h += '<section class="card db-hero"><div><small>ĐIỂM KPI TOÀN CHI NHÁNH</small><div class="db-big">' + num(cur, 1) + ' <span class="muted">→</span> <b class="txt-' + mau + '">' + num(tot, 1) + '</b></div>' +
      '<p class="muted small">Hiện tại (lũy kế ' + kyText(ky) + ') → dự kiến cuối năm. ' + cn.so_khong_dat + ' chỉ tiêu có nguy cơ không đạt, ' + (cn.so_nguy_co - cn.so_khong_dat) + ' chỉ tiêu cận ngưỡng.</p></div>' +
      '<div class="db-hero-r"><small>PHÒNG/PGD DỰ KIẾN</small><div class="chips">' + [['dat', 'Đạt', function (r) { return r >= g.dat; }], ['kha', 'Khá', function (r) { return r >= g.kha && r < g.dat; }], ['cct', 'Cần cải thiện', function (r) { return r >= g.cct && r < g.kha; }], ['chua', 'Chưa đạt', function (r) { return r < g.cct; }]].map(function (x) {
        return '<span class="chip ' + x[0] + '">' + X.ds.filter(function (d) { return x[2]((d.du_bao || 0) / 100); }).length + ' ' + x[1] + '</span>'; }).join('') + '</div></div></section>';
    h += '<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Đơn vị</th><th class="r">Hạng hiện tại</th><th class="r">Điểm hiện tại</th><th style="min-width:170px">Điểm dự kiến cuối năm</th><th class="r">Hạng dự kiến</th><th class="r">Chỉ tiêu cần lưu ý</th></tr></thead><tbody>';
    X.ds.forEach(function (d) {
      var mv = d.hang_hien_tai && d.hang_du_bao ? d.hang_hien_tai - d.hang_du_bao : 0;
      h += '<tr data-dv="' + d.ma + '" class="clickable' + (d.ma === sel ? ' sel' : '') + '"><td><b>' + esc(d.ten_ngan) + '</b></td><td class="r">' + (d.hang_hien_tai || '–') + '</td><td class="r num">' + num(d.quy_doi, 1) + '</td>' +
        '<td><div class="score-cell"><b class="txt-' + UI.htClass((d.du_bao || 0) / 100, g) + '">' + num(d.du_bao, 1) + '</b>' + UI.bar((d.du_bao || 0) / 100, g, 1.3) + '</div></td>' +
        '<td class="r">' + (d.hang_du_bao || '–') + ' ' + (mv > 0 ? '<span class="delta up">▲ ' + mv + '</span>' : mv < 0 ? '<span class="delta down">▼ ' + (-mv) + '</span>' : '') + '</td>' +
        '<td class="r">' + (d.so_khong_dat ? '<span class="chip chua">' + d.so_khong_dat + ' nguy cơ không đạt</span> ' : '') + (d.so_nguy_co - d.so_khong_dat ? '<span class="chip cct">' + (d.so_nguy_co - d.so_khong_dat) + ' cận ngưỡng</span>' : '') + (!d.so_nguy_co ? '<span class="muted">–</span>' : '') + '</td></tr>';
    });
    h += '</tbody></table></div></div><p class="muted small">Chọn một dòng để xem dự báo từng chỉ tiêu của đơn vị đó (bên dưới).</p>';
    h += '<div class="card"><div class="card-head"><h3>Điểm hiện tại và dự kiến cuối năm</h3></div><div class="chart h300"><canvas id="c-db"></canvas></div></div>';
    var d = sel === CN ? cn : M.duBaoDonVi(sel, ky.nam, ky.thang, cach);
    h += '<div class="card p0"><div class="card-head" style="padding:12px 16px"><h3>Dự báo từng chỉ tiêu · ' + esc(d.ten_ngan) + '</h3></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th style="min-width:190px">Chỉ tiêu</th><th class="r">Thực hiện ' + kyText(ky) + '</th><th class="r">KH cả năm</th><th class="r">Dự báo cuối năm</th><th class="r">% HT dự kiến</th><th>Nhận định</th><th class="r">Cần thực hiện mỗi tháng còn lại</th><th class="r">Tốc độ 3 tháng gần nhất</th><th class="r">Mất điểm dự kiến</th></tr></thead><tbody>';
    d.rows.slice().sort(function (a, b) { return (b.mat_du_bao || 0) - (a.mat_du_bao || 0); }).forEach(function (r) {
      var kieuLK = r.kieu === 'luy_ke';
      h += '<tr><td><a href="#/chi-tieu/' + r.ma + '">' + esc(r.ind.ten_ngan || r.ind.ten) + '</a><small class="block muted">' + (kieuLK ? 'lũy kế' : 'số dư/mức') + ' · ' + esc(r.ind.dvt) + '</small></td><td class="r num">' + giaTri(r.th, r.ind) + '</td><td class="r num">' + giaTri(r.kh_nam, r.ind) + '</td>' +
        '<td class="r num"><b>' + giaTri(r.du_bao, r.ind) + '</b></td><td class="r num">' + (isNum(r.ht_du_bao) ? pct(r.ht_du_bao) : '–') + '</td><td>' + chipKL(r.ket_luan) + (r.ly_do ? '<small class="block muted">' + esc(r.ly_do) + '</small>' : '') + '</td>' +
        '<td class="r num">' + (r.can_moi_thang === null ? '–' : giaTri(r.can_moi_thang, r.ind)) + '</td><td class="r num">' + (r.toc_do === null ? '–' : giaTri(Math.round(r.toc_do * 100) / 100, r.ind)) + '</td><td class="r num">' + (isNum(r.mat_du_bao) && r.mat_du_bao > 0.005 ? '<span class="txt-chua">-' + num(r.mat_du_bao, 2) + '</span>' : '<span class="txt-dat">✓</span>') + '</td></tr>';
    });
    return h + '</tbody></table></div></div>';
  }
  function mountDuBao(v, M, A, ky) {
    var cach = A.db_cach || E.CACH_MAC_DINH, X = M.duBaoXepHang(ky.nam, ky.thang, cach);
    var c = v.querySelector('#db-cach'); if (c) c.onchange = function () { A.db_cach = this.value; APP.render(); };
    v.querySelectorAll('tr[data-dv]').forEach(function (tr) { tr.onclick = function () { A.db_dv = tr.dataset.dv; APP.render(); }; });
    UI.chart(v.querySelector('#c-db'), { type: 'bar', data: { labels: X.ds.map(function (d) { return d.ten_ngan; }), datasets: [
      { label: 'Điểm hiện tại', data: X.ds.map(function (d) { return d.quy_doi; }), backgroundColor: '#c9d6ea', borderRadius: 4 },
      { label: 'Dự kiến cuối năm', data: X.ds.map(function (d) { return d.du_bao; }), backgroundColor: UI.cssVar('--primary'), borderRadius: 4 }] },
      options: { plugins: { legend: { position: 'bottom' }, nhanSo: { fmt: function (v) { return num(v, 1); } } }, scales: { x: { grid: { display: false } }, y: { suggestedMin: 50, suggestedMax: 110, grid: { color: '#eef2f7' } } } } });
  }

  /* ---------- Tab 2: Biến động điểm + chỉ tiêu cần ưu tiên cải thiện ---------- */
  function tabBienDong(M, A, ky) {
    var ma = A.db_dv && (A.db_dv === CN || M.unitMap[A.db_dv]) ? A.db_dv : (M.units[0] ? M.units[0].ma : CN), p = M.phanRa(ma, ky.nam, ky.thang), cuu = M.cuuDiem(ma, ky.nam, ky.thang, 8), c = M.card(ma, ky.nam, ky.thang);
    var h = '<div class="toolbar">' + dvSel(M, ma, 'db-dv') + '<span class="muted small">So sánh ' + kyText(ky) + ' với ' + (ky.thang > 1 ? 'T' + (ky.thang - 1) : 'kỳ trước') + ' (cùng năm, lũy kế).</span></div>';
    if (!p.co) h += '<div class="card empty"><p>' + esc(p.ly_do) + '</p></div>';
    else {
      var nn = function (list, cls) {
        if (!list.length) return '<p class="muted">Không có.</p>';
        return '<table class="tbl"><thead><tr><th>Chỉ tiêu</th><th class="r">% HT trước → nay</th><th class="r">Điểm</th></tr></thead><tbody>' + list.slice(0, 6).map(function (x) {
          return '<tr><td><a href="#/chi-tieu/' + x.ma + '">' + esc(x.ind.ten_ngan || x.ind.ten) + '</a></td><td class="r num">' + (isNum(x.ht_truoc) ? pct(x.ht_truoc, 0) : '–') + ' → <b>' + (isNum(x.ht) ? pct(x.ht, 0) : '–') + '</b></td><td class="r num"><span class="txt-' + cls + '">' + (x.dong_gop > 0 ? '+' : '') + num(x.dong_gop, 2) + '</span></td></tr>'; }).join('') + '</tbody></table>';
      };
      h += '<section class="card db-hero"><div><small>ĐIỂM QUY ĐỔI ' + esc(p.nay.ten_ngan).toUpperCase() + '</small><div class="db-big"><b>' + num(p.nay.quy_doi, 2) + '</b> ' + dlt(p.d_quy_doi, 2) + '</div><p class="muted small">so với ' + num(p.truoc.quy_doi, 2) + ' ở T' + (ky.thang - 1) + (Math.abs(p.d_dc_diem) > 0.004 ? ' · trong đó cộng/trừ điểm KPI đổi ' + (p.d_dc_diem > 0 ? '+' : '') + num(p.d_dc_diem, 2) : '') + '.</p></div></section>';
      h += '<div class="cols-2"><div class="card"><div class="card-head"><h3>Chỉ tiêu làm tăng điểm (' + p.tang.length + ')</h3></div>' + nn(p.tang, 'dat') + '</div><div class="card"><div class="card-head"><h3>Chỉ tiêu làm giảm điểm (' + p.giam.length + ')</h3></div>' + nn(p.giam, 'chua') + '</div></div>';
      if (!p.tang.length && !p.giam.length && Math.abs(p.d_dc_diem) < 0.005) h += '<p class="muted">Điểm không đổi so với tháng trước.</p>';
    }
    h += '<div class="card p0"><div class="card-head" style="padding:12px 16px"><h3>Chỉ tiêu cần ưu tiên cải thiện · ' + esc(c.ten_ngan) + '</h3><span class="muted small">Điểm có thể bổ sung tối đa khi hoàn thành 100% kế hoạch</span></div>';
    if (!cuu.length) return h + '<p class="ok-box" style="margin:12px 16px">Không còn chỉ tiêu nào bị mất điểm.</p></div>';
    h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Chỉ tiêu</th><th class="r">% HT</th><th class="r">Còn thiếu / cần giảm</th><th class="r">Điểm bổ sung tối đa</th><th class="r">Quy đổi (thang 100)</th><th></th></tr></thead><tbody>';
    cuu.forEach(function (x, i) {
      h += '<tr><td class="muted">' + (i + 1) + '</td><td><a href="#/chi-tieu/' + x.ma + '">' + esc(x.ind.ten_ngan || x.ind.ten) + '</a><small class="block muted">TS ' + x.ts + (x.thieu ? ' · <b class="txt-chua">chưa có số</b>' : '') + '</small></td><td class="r num">' + (isNum(x.ht) ? pct(x.ht) : '–') + '</td>' +
        '<td class="r num">' + (x.can === null ? '–' : giaTri(x.can, x.ind) + (x.ind.huong === 'thap_tot' ? ' (giảm)' : '')) + '</td><td class="r num"><b>+' + num(x.lay_lai, 2) + '</b></td><td class="r num">+' + num(x.lay_lai_qd, 2) + '</td>' +
        '<td class="r"><button class="btn sm" data-thu="' + x.ma + '">Mô phỏng</button></td></tr>';
    });
    return h + '</tbody></table></div></div>';
  }
  function mountBienDong(v, M, A, ky) {
    var s = v.querySelector('#db-dv'); if (s) s.onchange = function () { A.db_dv = this.value; APP.render(); };
    v.querySelectorAll('[data-thu]').forEach(function (b) {
      b.onclick = function () {
        var ma = A.db_dv && (A.db_dv === CN || M.unitMap[A.db_dv]) ? A.db_dv : (M.units[0] ? M.units[0].ma : CN), r = M.card(ma, ky.nam, ky.thang).rows.filter(function (x) { return x.ma === b.dataset.thu; })[0];
        A.mp_key = ma + '|' + ky.nam + '|' + ky.thang; A.mp = {}; if (r && isNum(r.kh)) A.mp[r.ma] = { th: r.kh };
        A.db_tab = 'mo-phong'; A.db_dv = ma; APP.render();
      };
    });
  }

  /* ---------- Tab 3: Mô phỏng ---------- */
  function tabMoPhong(M, A, ky) {
    var ma = A.db_dv && (A.db_dv === CN || M.unitMap[A.db_dv]) ? A.db_dv : (M.units[0] ? M.units[0].ma : CN), key = ma + '|' + ky.nam + '|' + ky.thang;
    if (A.mp_key !== key) { A.mp_key = key; A.mp = {}; }
    var m = M.moPhong(ma, ky.nam, ky.thang, A.mp), g = M.ng;
    var hr = function (x) { return x === null ? '–' : x; };
    var h = '<div class="toolbar">' + dvSel(M, ma, 'db-dv') + '<div class="grow"></div><button class="btn" id="mp-kh">Giả định hoàn thành 100% kế hoạch các chỉ tiêu chưa đạt</button><button class="btn" id="mp-xoa">Xoá giả định</button></div>' +
      '<div class="hint">Nhập số thực hiện giả định vào cột <b>TH giả định</b> để xem tác động đến điểm và thứ hạng. Kết quả chỉ mang tính tham khảo trên màn hình — <b>không lưu</b> và không ảnh hưởng số liệu chính thức.</div>' +
      '<section class="card db-hero"><div><small>ĐIỂM QUY ĐỔI · ' + esc(m.ten_ngan).toUpperCase() + '</small><div class="db-big">' + num(m.truoc.quy_doi, 2) + ' <span class="muted">→</span> <b class="txt-' + UI.htClass(isNum(m.sau.quy_doi) ? m.sau.quy_doi / 100 : null, g) + '">' + num(m.sau.quy_doi, 2) + '</b> ' + (m.so_doi ? dlt(m.d_quy_doi, 2) : '') + '</div>' +
      '<p class="muted small">' + (m.so_doi ? 'Đã giả định ' + m.so_doi + ' chỉ tiêu.' : 'Chưa có chỉ tiêu giả định.') + '</p></div>' + (ma !== CN ? '<div class="db-hero-r"><small>THỨ HẠNG TRONG ' + M.ranking(ky.nam, ky.thang).length + ' ĐƠN VỊ</small><div class="db-big">' + hr(m.truoc.hang) + ' <span class="muted">→</span> <b>' + hr(m.sau.hang) + '</b></div></div>' : '') + '</section>';
    h += '<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Chỉ tiêu</th><th class="r">TS</th><th class="r">KH</th><th class="r">TH hiện tại</th><th class="r">% HT</th><th class="r" style="min-width:130px">TH giả định</th><th class="r">% HT giả định</th><th class="r">Điểm</th><th class="r">Δ điểm</th></tr></thead><tbody>';
    m.rows.forEach(function (r) {
      var ov = A.mp[r.ma];
      h += '<tr' + (r.doi ? ' class="sel"' : '') + '><td><a href="#/chi-tieu/' + r.ma + '">' + esc(r.ind.ten_ngan || r.ind.ten) + '</a></td><td class="r">' + r.ts + '</td><td class="r num">' + giaTri(r.kh_truoc, r.ind) + '</td><td class="r num">' + giaTri(r.th_truoc, r.ind) + '</td><td class="r num">' + (isNum(r.ht_truoc) ? pct(r.ht_truoc) : '–') + '</td>' +
        '<td class="r"><input class="cell mp-in" data-ct="' + r.ma + '" value="' + (ov && isNum(ov.th) ? esc(String(ov.th).replace('.', ',')) : '') + '" placeholder="' + esc(isNum(r.th_truoc) ? String(Math.round(r.th_truoc * 100) / 100).replace('.', ',') : '') + '" inputmode="decimal" autocomplete="off"></td>' +
        '<td class="r num">' + (isNum(r.ht_sau) ? '<b class="txt-' + UI.htClass(r.ht_sau, g) + '">' + pct(r.ht_sau) + '</b>' : '–') + '</td><td class="r num">' + num(r.diem_sau, 2) + '</td><td class="r num">' + (r.doi ? dlt(r.d_diem, 2) : '') + '</td></tr>';
    });
    return h + '</tbody></table></div></div>';
  }
  function mountMoPhong(v, M, A, ky) {
    var s = v.querySelector('#db-dv'); if (s) s.onchange = function () { A.db_dv = this.value; APP.render(); };
    v.querySelectorAll('.mp-in').forEach(function (i) {
      i.onchange = function () {
        var val = String(i.value).trim() === '' ? null : UI.parse(i.value);
        if (typeof val === 'number' && isNaN(val)) { UI.toast('"' + i.value + '" không phải số hợp lệ.', 'err'); return; }
        if (val === null) delete A.mp[i.dataset.ct]; else A.mp[i.dataset.ct] = { th: val };
        i.defaultValue = i.value; APP.render();
      };
    });
    var kh = v.querySelector('#mp-kh'); if (kh) kh.onclick = function () {
      var ma = A.db_dv && (A.db_dv === CN || M.unitMap[A.db_dv]) ? A.db_dv : (M.units[0] ? M.units[0].ma : CN);
      M.card(ma, ky.nam, ky.thang).rows.forEach(function (r) { if (isNum(r.kh) && r.ind.huong !== 'nhap_ty_le' && !(isNum(r.ht) && r.ht >= 1)) A.mp[r.ma] = { th: r.kh }; });
      APP.render();
    };
    var x = v.querySelector('#mp-xoa'); if (x) x.onclick = function () { A.mp = {}; APP.render(); };
  }

  VIEWS['du-bao'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, tab = A.db_tab || 'du-bao';
      var h = '<div class="toolbar no-print"><div class="pills">' + TABS.map(function (t) { return '<button class="pill' + (tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div></div>';
      if (!coSo(M, ky)) return h + '<div class="card empty"><h3>Chưa có số thực hiện</h3><p>Kỳ ' + kyText(ky) + ' chưa có số liệu để phân tích. Chọn kỳ khác ở góc trên.</p></div>';
      return h + (tab === 'bien-dong' ? tabBienDong(M, A, ky) : tab === 'mo-phong' ? tabMoPhong(M, A, ky) : tabDuBao(M, A, ky));
    },
    mount: function (v, A) {
      var M = STORE.model(), ky = A.ky, tab = A.db_tab || 'du-bao';
      v.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { A.db_tab = b.dataset.tab; APP.render(); }; });
      if (!coSo(M, ky)) return;
      if (tab === 'bien-dong') mountBienDong(v, M, A, ky); else if (tab === 'mo-phong') mountMoPhong(v, M, A, ky); else mountDuBao(v, M, A, ky);
    }
  };
})(window);
