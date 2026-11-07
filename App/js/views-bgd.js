/* MÀN HÌNH BAN GIÁM ĐỐC — Thẻ điểm KPI từng thành viên BGĐ · Quản trị: khai báo thành viên, phòng phụ trách, bảng KPI riêng. Tính điểm: bgd.js */
(function (root) {
  var esc = UI.esc, num = UI.num, pct = UI.pct, isNum = UI.isNum, CN = KPI_CFG.MA_CN, E = KPI_ENGINE, TIEN_TO = E.BGD_TIEN_TO;
  var VIEWS = root.VIEWS = root.VIEWS || {};
  var CHUC_DANH = ['Giám đốc', 'Phó giám đốc'];
  function kyText(k) { return 'T' + k.thang + '/' + k.nam; }
  function tenNgan(M, dv) { return (M.unitMap[dv] || {}).ten_ngan || dv; }
  function dlt(x, d) { if (!isNum(x)) return '<span class="muted">–</span>'; var c = Math.abs(x) < 0.005 ? 'flat' : x > 0 ? 'up' : 'down'; return '<span class="delta ' + c + '">' + (x > 0 ? '▲ ' : x < 0 ? '▼ ' : '● ') + num(Math.abs(x), d === undefined ? 2 : d) + '</span>'; }
  function xepLoai(M, c) { return isNum(c.ht_chung) ? UI.chip(E.trangThai(c.ht_chung, M.ng)) : '<span class="chip thieu">–</span>'; }
  function nguonText(M, r, m) {
    if (r.ind.ao) return 'Thẻ điểm toàn chi nhánh';
    if (r.nguon === 'cn') return 'Chi nhánh';
    var ds = (m.phu_trach || []).filter(function (u) { return M.unitMap[u] && M.apDung(r.ma, u); }).map(function (u) { return tenNgan(M, u); });
    return (r.ind.tong_hop_cn === 'tong' ? 'Tổng ' : 'Bình quân ') + ds.length + ' đơn vị<small class="block muted">' + esc(ds.join(', ') || 'chưa có đơn vị') + '</small>';
  }

  /* ================= THẺ ĐIỂM BAN GIÁM ĐỐC ================= */
  VIEWS['the-diem-bgd'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, adm = STORE.isAdmin(), g = M.ng;
      if (!adm && !STORE.state.settings.bgd_cong_khai) return '<div class="card empty"><h3>Thẻ điểm Ban giám đốc</h3><p>Nội dung này chỉ hiển thị khi đăng nhập quản trị. Quản trị viên có thể cho phép xem ở chế độ xem tại mục Ban giám đốc (Thiết lập).</p></div>';
      var ds = M.bgdTongHop(ky.nam, ky.thang);
      if (!ds.length) return '<div class="card empty"><h3>Chưa khai báo thành viên Ban giám đốc</h3><p>' + (adm ? 'Khai báo thành viên, phòng phụ trách và bảng KPI riêng tại <a href="#/bgd-quan-tri">Thiết lập › Ban giám đốc</a>.' : 'Nhờ quản trị viên khai báo.') + '</p></div>';
      var sel = ds.filter(function (c) { return c.ma === A.bgd_sel; })[0] || ds[0], c = sel, prev = ky.thang > 1 ? M.cardBgd(c.ma, ky.nam, ky.thang - 1) : null;
      var h = '<div class="toolbar no-print"><span class="muted small">Điểm lũy kế đến hết ' + kyText(ky) + ' · thang 100 · cùng ngưỡng Đạt ≥ ' + pct(g.dat, 0) + ', Khá ≥ ' + pct(g.kha, 0) + ', Cần cải thiện ≥ ' + pct(g.cct, 0) + '</span><div class="grow"></div><button class="btn" id="bgd-in">In thẻ điểm</button></div>';
      h += '<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Thành viên</th><th>Phụ trách</th><th style="min-width:170px">Điểm quy đổi</th><th class="r">So tháng trước</th><th class="r">Đạt / Khá / CCT / Chưa</th><th>Xếp loại</th></tr></thead><tbody>';
      ds.forEach(function (x) {
        var pv = ky.thang > 1 ? M.cardBgd(x.ma, ky.nam, ky.thang - 1) : null;
        h += '<tr data-bgd="' + x.ma + '" class="clickable' + (x.ma === c.ma ? ' sel' : '') + '"><td><b>' + esc(x.bgd.ho_ten || x.bgd.chuc_danh) + '</b><small class="block muted">' + esc(x.bgd.chuc_danh) + '</small></td><td class="small">' + (x.bgd.chuc_danh === 'Giám đốc' && !x.phu_trach.length ? 'Toàn chi nhánh' : esc(x.phu_trach.map(function (u) { return tenNgan(M, u); }).join(', ') || '–')) + '</td>' +
          '<td><div class="score-cell"><b class="txt-' + UI.htClass(x.ht_chung, g) + '">' + num(x.quy_doi, 1) + '</b>' + UI.bar(x.ht_chung, g, 1.3) + '</div></td><td class="r">' + (pv && isNum(pv.quy_doi) && isNum(x.quy_doi) ? dlt(x.quy_doi - pv.quy_doi, 2) : '<span class="muted">–</span>') + '</td>' +
          '<td class="r">' + x.so_dat + ' / ' + x.so_kha + ' / ' + x.so_cct + ' / ' + x.so_chua + (x.so_thieu ? ' <span class="chip thieu">' + x.so_thieu + ' GAP</span>' : '') + '</td><td>' + xepLoai(M, x) + '</td></tr>';
      });
      h += '</tbody></table></div></div><p class="muted small no-print">Chọn một dòng để xem bảng KPI chi tiết của thành viên.</p>';
      h += '<section class="hero card sm"><div class="hero-ring ' + UI.htClass(c.ht_chung, g) + '">' + UI.ring(c.ht_chung, num(c.quy_doi, 1), 112) + '</div><div class="hero-txt"><small>THẺ ĐIỂM KPI · ' + kyText(ky) + ' (LŨY KẾ)</small><h2>' + esc(c.ten) + '</h2>' +
        '<p>' + num(c.diem, 2) + ' / ' + c.ts + ' điểm theo trọng số' + (Math.abs(c.dc_diem) > 0.004 ? ' · cộng/trừ điểm KPI ' + (c.dc_diem > 0 ? '+' : '') + num(c.dc_diem, 2) : '') + (prev && isNum(prev.quy_doi) && isNum(c.quy_doi) ? ' ' + dlt(c.quy_doi - prev.quy_doi, 2) + ' so với T' + (ky.thang - 1) : '') + '</p>' +
        '<p class="muted small">Phụ trách: ' + (c.phu_trach.length ? esc(c.phu_trach.map(function (u) { return tenNgan(M, u); }).join(', ')) : 'toàn chi nhánh') + '</p></div></section>';
      h += '<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Chỉ tiêu</th><th>Nguồn số</th><th class="r">TS</th><th class="r">Kế hoạch</th><th class="r">Thực hiện</th><th style="min-width:150px">% hoàn thành</th><th class="r">Điểm</th><th class="r">Mất điểm</th><th>Xếp loại</th></tr></thead><tbody>';
      var nhom = null;
      c.rows.forEach(function (r) {
        if (r.ind.nhom !== nhom) { nhom = r.ind.nhom; h += '<tr class="grp"><td colspan="9">' + esc(nhom) + '</td></tr>'; }
        h += '<tr><td>' + (r.ind.ao ? esc(r.ind.ten) : '<a href="#/chi-tieu/' + r.ma + '">' + esc(r.ind.ten_ngan || r.ind.ten) + '</a>') + '<small class="block muted">' + esc(r.ind.dvt) + '</small></td><td class="small">' + nguonText(M, r, c.bgd) + (r.thieu.length ? '<small class="block txt-chua">Thiếu số: ' + esc(r.thieu.map(function (u) { return tenNgan(M, u); }).join(', ')) + '</small>' : '') + '</td><td class="r">' + num(r.ts, 2) + '</td>' +
          '<td class="r num">' + UI.val(r.kh, r.ind) + '</td><td class="r num"><b>' + UI.val(r.th, r.ind) + '</b></td><td><div class="score-cell"><b class="txt-' + UI.htClass(r.ht, g) + '">' + pct(r.ht) + '</b>' + UI.bar(r.ht, g, Math.max(r.toi_da || 1.3, 1)) + '</div></td>' +
          '<td class="r num">' + (isNum(r.diem) ? num(r.diem, 2) : '–') + '</td><td class="r num">' + (isNum(r.mat) && r.mat > 0.005 ? '<span class="txt-chua">-' + num(r.mat, 2) + '</span>' : '<span class="txt-dat">✓</span>') + '</td><td>' + UI.chip(r.tt) + '</td></tr>';
      });
      h += '</tbody></table></div></div>';
      h += '<div class="card"><div class="card-head"><h3>Diễn biến điểm KPI năm ' + ky.nam + '</h3></div><div class="chart h300"><canvas id="c-bgd"></canvas></div></div>';
      var dc = (STORE.state.diem_kpi || []).filter(function (x) { return !x.xoa && x.dv === c.ma_dc && Number(x.nam) === ky.nam; });
      h += '<div class="card"><div class="card-head"><h3>Cộng / trừ điểm KPI năm ' + ky.nam + '</h3></div>' + (dc.length ? '<table class="tbl"><thead><tr><th>Từ – đến tháng</th><th class="r">Điểm</th><th>Lý do</th><th>Căn cứ</th><th>Người nhập</th>' + (adm ? '<th></th>' : '') + '</tr></thead><tbody>' + dc.map(function (x) {
        return '<tr><td>T' + x.thang + (x.thang_den && x.thang_den !== x.thang ? ' – T' + x.thang_den : '') + '</td><td class="r num ' + (x.diem < 0 ? 'txt-chua' : 'txt-dat') + '">' + (x.diem > 0 ? '+' : '') + num(x.diem, 2) + '</td><td>' + esc(x.ly_do) + '</td><td>' + esc(x.can_cu) + '</td><td>' + esc(String(x.ai || '').split('@')[0]) + '</td>' + (adm ? '<td><button class="btn sm danger-ghost" data-xdc="' + x.id + '">Xoá</button></td>' : '') + '</tr>'; }).join('') + '</tbody></table>' : '<p class="muted">Chưa có khoản cộng/trừ điểm.</p>') +
        (adm ? '<div class="row2" style="margin-top:10px"><label class="field"><span>Điểm (+ cộng / − trừ)</span><input id="dc-diem" inputmode="decimal" placeholder="-1,5"></label><label class="field"><span>Lý do</span><input id="dc-lydo"></label></div><div class="row2"><label class="field"><span>Từ tháng</span><input id="dc-tu" inputmode="numeric" value="' + ky.thang + '"></label><label class="field"><span>Đến tháng</span><input id="dc-den" inputmode="numeric" value="' + ky.thang + '"></label></div><label class="field"><span>Căn cứ / văn bản</span><input id="dc-cc"></label><button class="btn primary" id="dc-them">Thêm khoản cộng/trừ</button>' : '') + '</div>';
      return h;
    },
    mount: function (v, A) {
      var M = STORE.model(), ky = A.ky;
      if (!STORE.isAdmin() && !STORE.state.settings.bgd_cong_khai) return;
      var ds = M.bgdTongHop(ky.nam, ky.thang); if (!ds.length) return;
      var c = ds.filter(function (x) { return x.ma === A.bgd_sel; })[0] || ds[0];
      v.querySelectorAll('tr[data-bgd]').forEach(function (tr) { tr.onclick = function () { A.bgd_sel = tr.dataset.bgd; APP.render(); }; });
      var pr = v.querySelector('#bgd-in'); if (pr) pr.onclick = function () { window.print(); };
      var cv = v.querySelector('#c-bgd'), ser = M.scoreSeriesBgd(c.ma, ky.nam);
      UI.chart(cv, { type: 'line', data: { labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'], datasets: [
        { label: c.ten, data: ser, borderColor: UI.cssVar('--primary'), backgroundColor: 'rgba(14,76,146,.08)', fill: true, tension: .3, pointRadius: 3 },
        { label: 'Ngưỡng đạt', data: ser.map(function () { return M.ng.dat * 100; }), borderColor: '#9aa8bd', borderWidth: 1, pointRadius: 0, borderDash: [2, 3], nhanSo: false }] },
        options: { spanGaps: true, plugins: { legend: { position: 'bottom' }, nhanSo: { fmt: function (x) { return num(x, 1); } } }, scales: { y: { suggestedMin: 60, suggestedMax: 110, grid: { color: '#eef2f7' } }, x: { grid: { display: false } } } } });
      v.querySelectorAll('[data-xdc]').forEach(function (b) { b.onclick = function () {
        UI.confirm('Xoá khoản cộng/trừ điểm', 'Xoá khoản cộng/trừ điểm này?', 'Xoá', true).then(function (ok) { if (!ok) return; try { STORE.xoaDiemKpi(b.dataset.xdc); } catch (e) { UI.toast(e.message, 'err'); } });
      }; });
      var add = v.querySelector('#dc-them'); if (add) add.onclick = function () {
        var q = function (s) { return v.querySelector(s).value; }, d = UI.parse(q('#dc-diem')), tu = parseInt(q('#dc-tu'), 10), den = parseInt(q('#dc-den'), 10);
        if (!isNum(d) || d === 0) { UI.toast('Nhập số điểm cộng/trừ khác 0.', 'err'); return; }
        if (!(tu >= 1 && tu <= 12 && den >= tu && den <= 12)) { UI.toast('Tháng không hợp lệ (từ 1 đến 12, "đến" không nhỏ hơn "từ").', 'err'); return; }
        if (!q('#dc-lydo').trim()) { UI.toast('Nhập lý do cộng/trừ điểm.', 'err'); return; }
        try { STORE.themDiemKpi([{ dv: c.ma_dc, nam: ky.nam, thang: tu, thang_den: den, diem: d, ly_do: q('#dc-lydo'), can_cu: q('#dc-cc') }], 'Cộng/trừ điểm KPI ' + c.ten); UI.toast('Đã lưu khoản cộng/trừ điểm.', 'ok'); } catch (e) { UI.toast(e.message, 'err'); }
      };
    }
  };

  /* ================= QUẢN TRỊ: THÀNH VIÊN + BẢNG KPI RIÊNG ================= */
  function dsKpi(M) { return M.inds.filter(function (i) { return !i.chi_tham_khao; }); }
  VIEWS['bgd-quan-tri'] = {
    html: function (A) {
      var M = STORE.model(), st = STORE.state, ds = M.bgdDs(true), sel = A.bgd_qt && M.bgdMap()[A.bgd_qt] ? A.bgd_qt : (ds[0] && ds[0].ma), cb = M.bgdKiemTra();
      var h = '<div class="hint">Mỗi thành viên Ban giám đốc có <b>bảng KPI riêng</b> (chỉ tiêu, trọng số, % tối đa). Mỗi chỉ tiêu lấy số theo <b>Chi nhánh</b> (Giám đốc; hoặc chỉ tiêu dùng chung) hoặc <b>tổng hợp các phòng/PGD phụ trách</b> (cộng hoặc bình quân theo cách tổng hợp của chỉ tiêu; thiếu số một phòng thì chỉ tiêu thiếu số, 0 điểm). Cộng/trừ điểm KPI nhập ở <a href="#/the-diem-bgd">Thẻ điểm Ban giám đốc</a>.</div>';
      if (cb.length) h += '<div class="hint warn"><b>Cần rà soát:</b><ul class="cb-list">' + cb.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
      h += '<div class="card"><div class="card-head"><h3>1. Thành viên Ban giám đốc</h3><div><button class="btn" id="bq-mau">Khởi tạo bảng KPI mẫu</button> <button class="btn" id="bq-them">+ Thêm thành viên</button></div></div>';
      h += '<div class="tbl-wrap"><table class="tbl" id="bq-tv"><thead><tr><th>Mã</th><th>Họ tên</th><th>Chức danh</th><th class="r">Thứ tự</th><th>Trạng thái</th><th>Phòng/PGD phụ trách</th><th></th></tr></thead><tbody>';
      h += ds.map(function (m) { return rowTv(M, m, false); }).join('') || '<tr class="bq-trong"><td colspan="7" class="muted">Chưa có thành viên. Chọn "Khởi tạo bảng KPI mẫu" hoặc "Thêm thành viên".</td></tr>';
      h += '</tbody></table></div><button class="btn primary" id="bq-luu-tv">Lưu thành viên</button></div>';
      if (sel) {
        var ws = {}; st.bgd_trong_so.forEach(function (w) { if (w.ma_bgd === sel) ws[w.ma_chi_tieu] = w; });
        h += '<div class="card"><div class="card-head"><h3>2. Bảng KPI riêng</h3><div><select id="bq-sel" class="sel-lg">' + ds.map(function (m) { return '<option value="' + esc(m.ma) + '"' + (m.ma === sel ? ' selected' : '') + '>' + esc(m.chuc_danh + (m.ho_ten ? ' ' + m.ho_ten : '') + ' (' + m.ma + ')') + '</option>'; }).join('') + '</select> ' +
          '<select id="bq-cp"><option value="">Sao chép bảng KPI từ…</option>' + ds.filter(function (m) { return m.ma !== sel; }).map(function (m) { return '<option value="' + esc(m.ma) + '">' + esc((m.ho_ten || m.chuc_danh) + ' (' + m.ma + ')') + '</option>'; }).join('') + '</select></div></div>';
        h += '<div class="tbl-wrap"><table class="tbl" id="bq-ws"><thead><tr><th style="width:44px">Áp dụng</th><th>Chỉ tiêu</th><th class="r">Trọng số</th><th class="r">% tối đa</th><th>Nguồn số</th></tr></thead><tbody>';
        var wa = ws[E.BGD_MA_DIEM_CN];
        h += '<tr class="grp"><td colspan="5">Điểm KPI chi nhánh</td></tr><tr data-ct="' + E.BGD_MA_DIEM_CN + '"><td class="c"><input type="checkbox" class="w-ap"' + (wa ? ' checked' : '') + '></td><td>Điểm KPI chi nhánh<small class="block muted">Thực hiện = điểm quy đổi (thang 100) của thẻ điểm toàn chi nhánh; % hoàn thành = điểm ÷ 100</small></td>' +
          '<td class="r"><input class="cell w-ts" inputmode="decimal" value="' + (wa ? esc(String(Math.round(wa.trong_so * 1e4) / 1e4).replace('.', ',')) : '') + '"></td><td class="r"><input class="cell w-td" inputmode="decimal" value="' + (wa ? Math.round((wa.toi_da || 1.3) * 100) : 130) + '"></td><td><select class="w-ng" disabled><option value="cn">Thẻ điểm chi nhánh</option></select></td></tr>';
        var nhom = null;
        dsKpi(M).forEach(function (i) {
          var w = ws[i.ma]; if (i.nhom !== nhom) { nhom = i.nhom; h += '<tr class="grp"><td colspan="5">' + esc(nhom) + '</td></tr>'; }
          h += '<tr data-ct="' + esc(i.ma) + '"><td class="c"><input type="checkbox" class="w-ap"' + (w ? ' checked' : '') + '></td><td>' + esc(i.ten_ngan || i.ten) + '<small class="block muted">' + esc(i.ma) + ' · ' + esc(i.dvt) + ' · tổng hợp: ' + (i.tong_hop_cn === 'tong' ? 'cộng' : i.tong_hop_cn === 'tb' ? 'bình quân' : 'chỉ nhập ở CN') + '</small></td>' +
            '<td class="r"><input class="cell w-ts" inputmode="decimal" value="' + (w ? esc(String(Math.round(w.trong_so * 1e4) / 1e4).replace('.', ',')) : '') + '"></td><td class="r"><input class="cell w-td" inputmode="decimal" value="' + (w ? Math.round((w.toi_da || 1.3) * 100) : 130) + '"></td>' +
            '<td><select class="w-ng"><option value="cn"' + (!w || w.nguon !== 'phu_trach' ? ' selected' : '') + '>Chi nhánh</option><option value="phu_trach"' + (w && w.nguon === 'phu_trach' ? ' selected' : '') + '>Phòng/PGD phụ trách</option></select></td></tr>';
        });
        h += '</tbody><tfoot><tr><td></td><td><b>Tổng trọng số</b></td><td class="r" id="bq-tong"></td><td colspan="2"></td></tr></tfoot></table></div><button class="btn primary" id="bq-luu-ws">Lưu bảng KPI</button></div>';
      }
      h += '<div class="card"><label class="check" style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="bq-congkhai"' + (st.settings.bgd_cong_khai ? ' checked' : '') + '> <span><b>Cho phép xem thẻ điểm Ban giám đốc ở chế độ xem</b> (không cần đăng nhập quản trị). Mặc định tắt vì đây là thông tin đánh giá cá nhân; lưu ý dữ liệu vẫn nằm trong tệp dùng chung.</span></label></div>';
      return h;
    },
    mount: function (v, A) {
      var M = STORE.model(), st = STORE.state, q = function (s, r) { return (r || v).querySelector(s); };
      var tong = function () { var s = 0; v.querySelectorAll('#bq-ws tr[data-ct]').forEach(function (tr) { if (tr.querySelector('.w-ap').checked) { var x = UI.parse(tr.querySelector('.w-ts').value); if (isNum(x)) s += x; } }); var t = q('#bq-tong'); if (t) { t.textContent = num(s, 2); t.className = 'r ' + (Math.abs(s - 100) < 0.001 ? 'txt-dat' : 'txt-cct'); } };
      tong(); A.bgd_dirty = false;
      var ws = q('#bq-ws'); if (ws) { ws.addEventListener('input', function () { A.bgd_dirty = true; tong(); }); ws.addEventListener('change', function () { A.bgd_dirty = true; tong(); }); }
      var cong = q('#bq-congkhai'); if (cong) cong.onchange = function () { STORE.setSettings({ bgd_cong_khai: this.checked }); UI.toast(this.checked ? 'Đã cho phép xem thẻ điểm BGĐ ở chế độ xem.' : 'Đã tắt xem công khai thẻ điểm BGĐ.', 'ok'); };
      var tb = q('#bq-tv tbody');
      q('#bq-them').onclick = function () { var e = tb.querySelector('.bq-trong'); if (e) e.remove(); tb.insertAdjacentHTML('beforeend', rowTv(M, { ma: '', ho_ten: '', chuc_danh: 'Phó giám đốc', phu_trach: [], thu_tu: tb.querySelectorAll('tr').length + 1, trang_thai: 'active' }, true)); };
      tb.addEventListener('click', function (e) { var b = e.target.closest('.tv-xoa'); if (b) b.closest('tr').remove(); });
      q('#bq-mau').onclick = function () {
        UI.confirm('Khởi tạo bảng KPI mẫu', 'Tạo Giám đốc + 2 Phó giám đốc với bảng KPI sao từ trọng số khối "CN" (Phó giám đốc: tổng các phòng phụ trách). <b>Thay thế</b> khai báo Ban giám đốc hiện có (nếu có). Anh/chị cần chỉnh lại họ tên, phòng phụ trách và trọng số cho đúng văn bản giao KPI.', 'Khởi tạo', st.bgd.length > 0).then(function (ok) {
          if (!ok) return; var m = E.bgdMau(st); STORE.setDanhMuc({ bgd: m.bgd, bgd_trong_so: m.bgd_trong_so }, 'Khởi tạo bảng KPI mẫu Ban giám đốc'); A.bgd_qt = 'GD'; UI.toast('Đã khởi tạo. Hãy nhập họ tên và chỉnh phòng phụ trách.', 'ok');
        });
      };
      q('#bq-luu-tv').onclick = function () {
        var out = [], seen = {}, loi = '';
        tb.querySelectorAll('tr[data-ma-tv]').forEach(function (tr, i) {
          var ma = String(q('.tv-ma', tr).value).trim().toUpperCase();
          if (!/^[A-Z0-9_]{2,12}$/.test(ma)) loi = 'Mã thành viên "' + ma + '" không hợp lệ (2–12 ký tự chữ hoa không dấu, số hoặc _).'; else if (seen[ma]) loi = 'Mã "' + ma + '" bị trùng.'; seen[ma] = 1;
          var tt = UI.parse(q('.tv-tt', tr).value);
          out.push({ ma: ma, ho_ten: String(q('.tv-ten', tr).value).trim(), chuc_danh: q('.tv-cd', tr).value, thu_tu: isNum(tt) ? tt : i + 1, trang_thai: q('.tv-st', tr).value, phu_trach: [].slice.call(tr.querySelectorAll('.tv-pt:checked')).map(function (c) { return c.value; }) });
        });
        if (loi) { UI.toast(loi, 'err'); return; }
        var giu = {}; out.forEach(function (m) { giu[m.ma] = 1; });
        STORE.setDanhMuc({ bgd: out, bgd_trong_so: st.bgd_trong_so.filter(function (w) { return giu[w.ma_bgd]; }) }, 'Cập nhật thành viên Ban giám đốc (' + out.length + ')'); UI.toast('Đã lưu thành viên Ban giám đốc.', 'ok');
      };
      var sel = q('#bq-sel');
      var doiThanhVien = function (ma) { if (A.bgd_dirty) UI.confirm('Chưa lưu bảng KPI', 'Bảng KPI đang sửa chưa lưu. Chuyển thành viên sẽ bỏ các thay đổi này?', 'Bỏ thay đổi', true).then(function (ok) { if (ok) { A.bgd_qt = ma; APP.render(); } else sel.value = A.bgd_qt; }); else { A.bgd_qt = ma; APP.render(); } };
      if (sel) { A.bgd_qt = A.bgd_qt || sel.value; sel.onchange = function () { doiThanhVien(this.value); }; }
      var cp = q('#bq-cp'); if (cp) cp.onchange = function () {
        var tu = this.value; if (!tu) return; var cur = sel.value, self = this;
        UI.confirm('Sao chép bảng KPI', 'Thay toàn bộ bảng KPI của thành viên đang chọn bằng bảng của "' + esc(tu) + '"?', 'Sao chép', true).then(function (ok) {
          self.value = ''; if (!ok) return;
          var moi = st.bgd_trong_so.filter(function (w) { return w.ma_bgd !== cur; }).concat(st.bgd_trong_so.filter(function (w) { return w.ma_bgd === tu; }).map(function (w) { return Object.assign({}, w, { ma_bgd: cur }); }));
          STORE.setDanhMuc({ bgd_trong_so: moi }, 'Sao chép bảng KPI BGĐ ' + tu + ' → ' + cur); A.bgd_dirty = false; UI.toast('Đã sao chép bảng KPI.', 'ok');
        });
      };
      var luu = q('#bq-luu-ws'); if (luu) luu.onclick = function () {
        var cur = sel.value, rows = [], loi = '';
        v.querySelectorAll('#bq-ws tr[data-ct]').forEach(function (tr) {
          if (!tr.querySelector('.w-ap').checked) return;
          var ts = UI.parse(q('.w-ts', tr).value), td = UI.parse(q('.w-td', tr).value), ct = tr.dataset.ct;
          if (!isNum(ts) || ts <= 0 || ts > 100) loi = 'Trọng số của "' + ct + '" phải là số lớn hơn 0 và không quá 100.';
          else if (!isNum(td) || td < 100 || td > 300) loi = '% tối đa của "' + ct + '" phải từ 100 đến 300.';
          rows.push({ ma_bgd: cur, ma_chi_tieu: ct, trong_so: isNum(ts) ? Math.round(ts * 1e4) / 1e4 : 0, toi_da: isNum(td) ? td / 100 : 1.3, nguon: q('.w-ng', tr).value });
        });
        if (loi) { UI.toast(loi, 'err'); return; }
        STORE.setDanhMuc({ bgd_trong_so: st.bgd_trong_so.filter(function (w) { return w.ma_bgd !== cur; }).concat(rows) }, 'Cập nhật bảng KPI Ban giám đốc ' + cur + ' (' + rows.length + ' chỉ tiêu)'); A.bgd_dirty = false;
        UI.toast('Đã lưu bảng KPI (' + rows.length + ' chỉ tiêu).', 'ok');
      };
    }
  };
  function rowTv(M, m, moi) {
    return '<tr data-ma-tv="1"><td><input class="cell tv-ma" style="width:90px" value="' + esc(m.ma) + '"' + (moi ? '' : ' readonly') + ' placeholder="PGD3"></td><td><input class="cell tv-ten" style="width:180px;text-align:left" value="' + esc(m.ho_ten) + '" placeholder="Họ và tên"></td>' +
      '<td><select class="tv-cd">' + CHUC_DANH.map(function (c) { return '<option' + (c === m.chuc_danh ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></td><td class="r"><input class="cell tv-tt" style="width:60px" value="' + esc(m.thu_tu) + '"></td>' +
      '<td><select class="tv-st"><option value="active"' + (m.trang_thai !== 'inactive' ? ' selected' : '') + '>Đang áp dụng</option><option value="inactive"' + (m.trang_thai === 'inactive' ? ' selected' : '') + '>Ngừng</option></select></td>' +
      '<td class="small">' + M.units.map(function (u) { return '<label style="display:inline-flex;gap:3px;margin:1px 8px 1px 0;white-space:nowrap"><input type="checkbox" class="tv-pt" value="' + esc(u.ma) + '"' + ((m.phu_trach || []).indexOf(u.ma) >= 0 ? ' checked' : '') + '>' + esc(u.ten_ngan || u.ten) + '</label>'; }).join('') + '</td>' +
      '<td><button type="button" class="btn sm danger-ghost tv-xoa">Xoá</button></td></tr>';
  }
})(window);
