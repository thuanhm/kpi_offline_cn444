/* MÀN HÌNH VẬN HÀNH — Nội dung cần xử lý (cảnh báo tập trung) · Kiểm tra số liệu & khoá kỳ · Biện pháp khắc phục · Bảng điều hành 1 trang cho Ban giám đốc. */
(function (root) {
  var esc = UI.esc, num = UI.num, pct = UI.pct, isNum = UI.isNum, CN = KPI_CFG.MA_CN;
  var VIEWS = root.VIEWS = root.VIEWS || {};
  var TTHD = { moi: ['cct', 'Mới giao'], dang_lam: ['kha', 'Đang làm'], xong: ['dat', 'Đã xong'], huy: ['thieu', 'Huỷ'] };
  function kyText(k) { return 'T' + k.thang + '/' + k.nam; }
  function homNay() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function quaHan(x) { return (x.trang_thai === 'moi' || x.trang_thai === 'dang_lam') && x.han && x.han < homNay(); }
  function tenDv(M, dv) { return !dv ? 'Toàn chi nhánh' : dv === CN ? 'Toàn chi nhánh' : ((M.unitMap[dv] || {}).ten_ngan || dv); }
  function chipHD(x) { var t = TTHD[x.trang_thai] || TTHD.moi; return '<span class="chip ' + t[0] + '">' + t[1] + '</span>' + (quaHan(x) ? ' <span class="chip chua">Quá hạn</span>' : ''); }
  function ngayVN(s) { return s ? s.split('-').reverse().join('/') : '–'; }
  function dlt(x, d) { if (!isNum(x)) return '<span class="muted">–</span>'; var c = Math.abs(x) < 0.005 ? 'flat' : x > 0 ? 'up' : 'down'; return '<span class="delta ' + c + '">' + (x > 0 ? '▲ ' : x < 0 ? '▼ ' : '● ') + num(Math.abs(x), d === undefined ? 1 : d) + '</span>'; }
  function goiY(M, ky) {   // việc cần làm: gom mọi nguồn cảnh báo thành danh sách ưu tiên
    var items = [], hd = STORE.getHanhDong(), kt = M.kiemTraSo(ky.nam, ky.thang), X = M.duBaoXepHang(ky.nam, ky.thang);
    var quaH = hd.filter(quaHan);
    quaH.forEach(function (x) { items.push({ muc: 3, loai: 'Nhiệm vụ quá hạn', text: x.tieu_de + ' — ' + tenDv(M, x.dv) + ', hạn ' + ngayVN(x.han) + (x.nguoi ? ' (' + x.nguoi + ')' : ''), href: '#/hanh-dong' }); });
    if (!STORE.kyKhoa(ky.nam, ky.thang) && kt.tong_can) {
      var thieu = kt.tong_can - kt.tong_co;
      if (thieu > 0) items.push({ muc: 2, loai: 'Thiếu số liệu', text: 'Kỳ ' + kyText(ky) + ' còn ' + thieu + ' ô thực hiện chưa nhập (' + kt.tien_do.filter(function (t) { return t.thieu_th.length; }).map(function (t) { return t.ten_ngan + ' ' + t.thieu_th.length; }).join(', ') + ').', href: STORE.isAdmin() ? '#/kiem-tra' : null });
    }
    kt.bat_thuong.forEach(function (b) { items.push({ muc: b.muc, loai: 'Số liệu bất thường · ' + b.loai, text: b.text, href: STORE.isAdmin() ? '#/kiem-tra' : null }); });
    M.alerts(ky.nam, ky.thang).forEach(function (a) { if (a.loai === 'Thiếu số liệu') return; items.push({ muc: a.muc, loai: a.loai, text: a.text, href: a.dv ? '#/phong/' + a.dv : (a.ct ? '#/chi-tieu/' + a.ct : null) }); });
    X.ds.forEach(function (d) { if (d.so_khong_dat) items.push({ muc: 2, loai: 'Dự báo cuối năm', text: d.ten_ngan + ': ' + d.so_khong_dat + ' chỉ tiêu có nguy cơ không đạt kế hoạch năm theo xu hướng hiện tại (điểm dự kiến ' + num(d.du_bao, 1) + ').', href: '#/du-bao' }); });
    for (var t = 1; t < ky.thang; t++) if (STORE.kyKhoa(ky.nam, t) === false && M.card(CN, ky.nam, t).co_so) { items.push({ muc: 1, loai: 'Chưa khoá kỳ', text: 'Kỳ T' + t + '/' + ky.nam + ' đã qua nhưng chưa khoá số liệu.', href: STORE.isAdmin() ? '#/nhap-so' : null }); break; }
    return items.sort(function (a, b) { return b.muc - a.muc; });
  }

  /* ================= VIỆC CẦN LÀM ================= */
  VIEWS['canh-bao'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, it = goiY(M, ky), nhom = { 3: [], 2: [], 1: [] };
      it.forEach(function (x) { (nhom[x.muc] || nhom[1]).push(x); });
      var cap = { 3: ['chua', 'Nghiêm trọng — cần xử lý ngay'], 2: ['cct', 'Cần theo dõi'], 1: ['kha', 'Lưu ý'] };
      var h = '<div class="toolbar"><span class="muted small">Tổng hợp cảnh báo kỳ ' + kyText(ky) + ': tiến độ KH, thiếu/bất thường số liệu, dự báo cuối năm, hành động quá hạn, kỳ chưa khoá.</span></div>';
      if (!it.length) return h + '<div class="card empty"><h3>Không có nội dung cần xử lý</h3><p>Chưa phát hiện cảnh báo nào cho ' + kyText(ky) + '.</p></div>';
      h += '<div class="chips" style="margin-bottom:10px">' + [3, 2, 1].map(function (m) { return '<span class="chip ' + cap[m][0] + '">' + nhom[m].length + ' ' + cap[m][1].split(' — ')[0].toLowerCase() + '</span>'; }).join('') + '</div>';
      [3, 2, 1].forEach(function (m) {
        if (!nhom[m].length) return;
        h += '<div class="card"><div class="card-head"><h3><span class="chip ' + cap[m][0] + '">' + cap[m][1] + '</span></h3></div><ul class="cb-list">' + nhom[m].map(function (x) {
          return '<li><b>' + esc(x.loai) + '</b> — ' + esc(x.text) + (x.href ? ' <a class="link" href="' + x.href + '">Xem →</a>' : '') + '</li>'; }).join('') + '</ul></div>';
      });
      return h;
    }
  };

  /* ================= KIỂM TRA SỐ LIỆU & KHOÁ KỲ ================= */
  VIEWS['kiem-tra'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, kt = M.kiemTraSo(ky.nam, ky.thang), khoa = STORE.kyKhoa(ky.nam, ky.thang), tk = STORE.thongTinKhoa(ky.nam, ky.thang), s = STORE.state.settings;
      var h = '<section class="card db-hero"><div><small>TIẾN ĐỘ NHẬP THỰC HIỆN · ' + kyText(ky) + '</small><div class="db-big"><b>' + kt.tong_co + '</b> / ' + kt.tong_can + ' ô</div><p class="muted small">' + (kt.day_du ? 'Đã nhập đủ số thực hiện cho các phòng/PGD.' : 'Còn ' + (kt.tong_can - kt.tong_co) + ' ô chưa nhập.') + '</p></div>' +
        '<div class="db-hero-r"><small>KHOÁ KỲ</small><div class="db-big">' + (khoa ? '<span class="chip chua">Đã khoá</span>' : '<span class="chip dat">Đang mở</span>') + '</div><p class="muted small">' + (khoa && tk ? 'Bởi ' + esc(String(tk.ai || '').split('@')[0] || '—') + ' lúc ' + new Date(tk.t).toLocaleString('vi-VN') : 'Số liệu còn sửa được.') + '</p>' +
        '<a class="btn' + (khoa ? '' : ' primary') + '" href="#/nhap-so">' + (khoa ? 'Mở khoá ở màn Nhập số' : 'Khoá kỳ ở màn Nhập số') + '</a></div></section>';
      h += '<div class="card p0"><div class="card-head" style="padding:12px 16px"><h3>Tiến độ nhập theo đơn vị</h3></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Đơn vị</th><th class="r">Thực hiện</th><th style="min-width:140px">Tiến độ</th><th class="r">Kế hoạch</th><th>Còn thiếu</th></tr></thead><tbody>';
      kt.tien_do.forEach(function (t) {
        var p = t.can ? t.co_th / t.can : 0;
        h += '<tr><td><b>' + esc(t.ten_ngan) + '</b></td><td class="r num">' + t.co_th + '/' + t.can + '</td><td><div class="pbar ' + (p >= 1 ? 'dat' : p >= .5 ? 'cct' : 'chua') + '"><i style="width:' + Math.round(p * 100) + '%"></i></div></td><td class="r num">' + t.co_kh + '/' + t.can + '</td><td class="small">' +
          (t.thieu_th.length ? 'TH: ' + t.thieu_th.slice(0, 4).map(function (i) { return esc(i.ten_ngan || i.ten); }).join(', ') + (t.thieu_th.length > 4 ? ' +' + (t.thieu_th.length - 4) : '') : '<span class="txt-dat">✓ đủ TH</span>') + (t.thieu_kh.length ? '<br>KH: ' + t.thieu_kh.slice(0, 4).map(function (i) { return esc(i.ten_ngan || i.ten); }).join(', ') : '') + '</td></tr>';
      });
      h += '</tbody></table></div></div>';
      h += '<div class="card"><div class="card-head"><h3>Số liệu bất thường (' + kt.bat_thuong.length + ')</h3><a class="link" href="#/nhap-so">Mở màn Nhập số →</a></div>' +
        (kt.bat_thuong.length ? '<ul class="cb-list">' + kt.bat_thuong.map(function (b) { return '<li><span class="chip ' + (b.muc >= 2 ? 'chua' : 'cct') + '">' + esc(b.loai) + '</span> ' + esc(b.text) + '</li>'; }).join('') + '</ul>' : '<p class="ok-box">Không phát hiện số bất thường.</p>') + '</div>';
      h += '<div class="card"><div class="card-head"><h3>Ngưỡng phát hiện bất thường</h3></div><div class="row2"><label class="field"><span>Chỉ tiêu số dư/mức: biến động vượt … % so với tháng trước</span><input id="kt-sd" inputmode="decimal" value="' + Math.round((+s.kt_so_du > 0 ? +s.kt_so_du : 0.3) * 100) + '"></label>' +
        '<label class="field"><span>Chỉ tiêu lũy kế: phát sinh tháng lệch vượt … % so với bình quân</span><input id="kt-lk" inputmode="decimal" value="' + Math.round((+s.kt_luy_ke > 0 ? +s.kt_luy_ke : 0.5) * 100) + '"></label></div><button class="btn primary" id="kt-luu">Lưu ngưỡng</button> <span class="muted small">Ngoài ra luôn cảnh báo (ngưỡng lệch phát sinh tháng = 2 lần giá trị trên): lũy kế giảm, số âm, tỷ lệ ngoài 0–100, số gấp 20 lần / bằng 1/20 tháng trước (nghi sai đơn vị tính), CN nhập riêng lệch tổng các phòng &gt; 1%.</span></div>';
      var ls = Object.keys(STORE.state.khoa_ky).map(function (k) { var p = k.split('|'); return { nam: +p[0], thang: +p[1], x: STORE.state.khoa_ky[k] }; }).sort(function (a, b) { return (b.x.t || 0) - (a.x.t || 0); });
      h += '<div class="card"><div class="card-head"><h3>Lịch sử khoá / mở khoá kỳ</h3></div>' + (ls.length ? '<table class="tbl"><thead><tr><th>Kỳ</th><th>Trạng thái</th><th>Người</th><th>Lúc</th><th>Lý do mở khoá</th></tr></thead><tbody>' + ls.map(function (r) {
        return '<tr><td>T' + r.thang + '/' + r.nam + '</td><td>' + (r.x.khoa ? '<span class="chip chua">Đã khoá</span>' : '<span class="chip dat">Đã mở</span>') + '</td><td>' + esc(String(r.x.ai || '').split('@')[0] || '–') + '</td><td>' + new Date(r.x.t).toLocaleString('vi-VN') + '</td><td>' + esc(r.x.lydo || '') + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="muted">Chưa khoá kỳ nào.</p>') + '</div>';
      return h;
    },
    mount: function (v) {
      var b = v.querySelector('#kt-luu'); if (!b) return;
      b.onclick = function () {
        var a = UI.parse(v.querySelector('#kt-sd').value), c = UI.parse(v.querySelector('#kt-lk').value);
        if (!isNum(a) || !isNum(c) || a <= 0 || c <= 0 || a > 1000 || c > 1000) { UI.toast('Nhập số phần trăm lớn hơn 0.', 'err'); return; }
        STORE.setSettings({ kt_so_du: a / 100, kt_luy_ke: c / 100 }); UI.toast('Đã lưu ngưỡng.', 'ok');
      };
    }
  };

  /* ================= HÀNH ĐỘNG KHẮC PHỤC ================= */
  function htHienTai(M, x) {   // % hoàn thành của chỉ tiêu liên quan ở kỳ mới nhất (để đối chiếu với thời điểm giao nhiệm vụ)
    if (!x.ct) return null;
    var k = M.kyMoiNhat(x.nam) || { nam: x.nam, thang: x.thang }, dv = x.dv || CN, r = M.card(dv, k.nam, k.thang).rows.filter(function (y) { return y.ma === x.ct; })[0];
    return r && isNum(r.ht) ? { ht: r.ht, ky: k } : null;
  }
  VIEWS['hanh-dong'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, adm = STORE.isAdmin(), loc = A.hd_loc || 'mo', ds = STORE.getHanhDong();
      var dem = { mo: ds.filter(function (x) { return x.trang_thai === 'moi' || x.trang_thai === 'dang_lam'; }).length, qua: ds.filter(quaHan).length, xong: ds.filter(function (x) { return x.trang_thai === 'xong'; }).length };
      var list = ds.filter(function (x) { return loc === 'tat' ? true : loc === 'xong' ? (x.trang_thai === 'xong' || x.trang_thai === 'huy') : loc === 'qua' ? quaHan(x) : (x.trang_thai === 'moi' || x.trang_thai === 'dang_lam'); })
        .sort(function (a, b) { return (quaHan(b) ? 1 : 0) - (quaHan(a) ? 1 : 0) || String(a.han || '9').localeCompare(String(b.han || '9')); });
      var h = '<div class="toolbar"><div class="pills">' + [['mo', 'Đang mở (' + dem.mo + ')'], ['qua', 'Quá hạn (' + dem.qua + ')'], ['xong', 'Đã xong / huỷ (' + (ds.length - dem.mo) + ')'], ['tat', 'Tất cả (' + ds.length + ')']].map(function (x) { return '<button class="pill' + (loc === x[0] ? ' on' : '') + '" data-loc="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div><div class="grow"></div>' +
        (adm ? '<button class="btn primary" id="hd-them">+ Giao nhiệm vụ mới</button>' : '<span class="muted small">Đăng nhập quản trị để giao nhiệm vụ / cập nhật.</span>') + '</div>';
      if (!list.length) return h + '<div class="card empty"><h3>Chưa có nhiệm vụ nào</h3><p>' + (adm ? 'Chọn "Giao nhiệm vụ mới", hoặc giao nhiệm vụ trực tiếp từ vấn đề trong Báo cáo giao ban.' : 'Chưa có việc nào trong nhóm này.') + '</p></div>';
      h += '<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nội dung thực hiện</th><th>Đơn vị · chỉ tiêu</th><th>Phụ trách</th><th>Hạn</th><th>Trạng thái</th><th>Đối chiếu kết quả</th>' + (adm ? '<th></th>' : '') + '</tr></thead><tbody>';
      list.forEach(function (x) {
        var nay = htHienTai(M, x), ind = x.ct ? M.indMap[x.ct] : null, dc = '';
        if (nay && isNum(x.ht_luc_tao)) { var d = nay.ht - x.ht_luc_tao; dc = pct(x.ht_luc_tao, 0) + ' → <b>' + pct(nay.ht, 0) + '</b> (' + kyText(nay.ky) + ') ' + dlt(d * 100, 1) + ' điểm %' + (d > 0.005 ? ' <span class="chip dat">Cải thiện</span>' : d < -0.005 ? ' <span class="chip chua">Suy giảm</span>' : ' <span class="chip cct">Không thay đổi</span>'); }
        else if (nay) dc = 'Hiện ' + pct(nay.ht, 0) + ' (' + kyText(nay.ky) + ')';
        h += '<tr><td><b>' + esc(x.tieu_de) + '</b>' + (x.mo_ta ? '<small class="block muted">' + esc(x.mo_ta) + '</small>' : '') + (x.ket_qua ? '<small class="block">Kết quả: ' + esc(x.ket_qua) + '</small>' : '') + '</td>' +
          '<td>' + esc(tenDv(M, x.dv)) + (ind ? '<small class="block muted">' + esc(ind.ten_ngan || ind.ten) + '</small>' : '') + '<small class="block muted">giao ở ' + (x.thang ? 'T' + x.thang + '/' + x.nam : '–') + '</small></td><td>' + esc(x.nguoi || '–') + '</td><td>' + ngayVN(x.han) + '</td><td>' + chipHD(x) + '</td><td class="small">' + (dc || '<span class="muted">–</span>') + '</td>' +
          (adm ? '<td class="nowrap"><button class="btn sm" data-sua="' + x.id + '">Cập nhật</button> <button class="btn sm danger-ghost" data-xoa="' + x.id + '">Xoá</button></td>' : '') + '</tr>';
      });
      return h + '</tbody></table></div></div>';
    },
    mount: function (v, A) {
      var M = STORE.model();
      v.querySelectorAll('[data-loc]').forEach(function (b) { b.onclick = function () { A.hd_loc = b.dataset.loc; APP.render(); }; });
      var them = v.querySelector('#hd-them'); if (them) them.onclick = function () { VIEWS['hanh-dong'].mo(null, null, A); };
      v.querySelectorAll('[data-sua]').forEach(function (b) { b.onclick = function () { VIEWS['hanh-dong'].mo(STORE.getHanhDong().filter(function (x) { return x.id === b.dataset.sua; })[0], null, A); }; });
      v.querySelectorAll('[data-xoa]').forEach(function (b) { b.onclick = function () { UI.confirm('Xoá nhiệm vụ', 'Xoá nhiệm vụ này khỏi danh sách?', 'Xoá', true).then(function (ok) { if (ok) STORE.xoaHanhDong(b.dataset.xoa); }); }; });
      void M;
    },
    /* Hộp thoại giao nhiệm vụ / cập nhật. x: bản ghi (sửa) hoặc null (thêm); dien: giá trị điền sẵn { tieu_de, dv, ct, nguon }. Dùng chung với Báo cáo giao ban. */
    mo: function (x, dien, A) {
      var M = STORE.model(), ky = A.ky, g = x || Object.assign({ trang_thai: 'moi', nam: ky.nam, thang: ky.thang, dv: '', ct: '' }, dien || {});
      var dvOpt = '<option value="">Toàn chi nhánh / không gắn đơn vị</option>' + M.units.map(function (u) { return '<option value="' + u.ma + '"' + (g.dv === u.ma ? ' selected' : '') + '>' + esc(u.ten) + '</option>'; }).join('');
      var ctOpt = '<option value="">Không gắn chỉ tiêu</option>' + M.inds.map(function (i) { return '<option value="' + i.ma + '"' + (g.ct === i.ma ? ' selected' : '') + '>' + esc(i.ten) + '</option>'; }).join('');
      var stOpt = Object.keys(TTHD).map(function (k) { return '<option value="' + k + '"' + (g.trang_thai === k ? ' selected' : '') + '>' + TTHD[k][1] + '</option>'; }).join('');
      var m = UI.modal(x ? 'Cập nhật nhiệm vụ' : 'Giao nhiệm vụ mới',
        '<label class="field"><span>Nội dung nhiệm vụ</span><input id="hd-td" value="' + esc(g.tieu_de || '') + '" placeholder="VD: Rà soát nợ nhóm 2 của PGD Thái Hòa"></label>' +
        '<div class="row2"><label class="field"><span>Đơn vị</span><select id="hd-dv">' + dvOpt + '</select></label><label class="field"><span>Chỉ tiêu liên quan</span><select id="hd-ct">' + ctOpt + '</select></label></div>' +
        '<div class="row2"><label class="field"><span>Người phụ trách</span><input id="hd-ng" value="' + esc(g.nguoi || '') + '"></label><label class="field"><span>Hạn hoàn thành</span><input id="hd-han" type="date" value="' + esc(g.han || '') + '"></label></div>' +
        '<div class="row2"><label class="field"><span>Trạng thái</span><select id="hd-st">' + stOpt + '</select></label><label class="field"><span>Ghi chú</span><input id="hd-mt" value="' + esc(g.mo_ta || '') + '"></label></div>' +
        '<label class="field"><span>Kết quả (khi xong)</span><input id="hd-kq" value="' + esc(g.ket_qua || '') + '"></label>',
        [{ text: 'Huỷ' }, { text: 'Lưu', cls: 'primary', onClick: function (w) {
          var q = function (s) { return w.querySelector(s).value; }, rec = { tieu_de: q('#hd-td'), dv: q('#hd-dv'), ct: q('#hd-ct'), nguoi: q('#hd-ng').trim(), han: q('#hd-han'), trang_thai: q('#hd-st'), mo_ta: q('#hd-mt').trim(), ket_qua: q('#hd-kq').trim() };
          if (x) rec.id = x.id; else { rec.nam = g.nam; rec.thang = g.thang; if (g.nguon) rec.nguon = g.nguon; }
          if (!x && rec.ct) { var r = M.card(rec.dv || CN, g.nam, g.thang).rows.filter(function (y) { return y.ma === rec.ct; })[0]; if (r && isNum(r.ht)) rec.ht_luc_tao = r.ht; }
          try { STORE.luuHanhDong(rec); } catch (e) { UI.toast(e.message, 'err'); return false; }
          UI.toast('Đã lưu nhiệm vụ.', 'ok');
        } }]);
      void m;
    }
  };

  /* ================= BẢNG ĐIỀU HÀNH 1 TRANG (Ban giám đốc) ================= */
  VIEWS['dieu-hanh'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, cn = M.card(CN, ky.nam, ky.thang), g = M.ng;
      if (!cn.co_so) return '<div class="card empty"><h3>Chưa có số thực hiện</h3><p>Kỳ ' + kyText(ky) + ' chưa có số liệu. Chọn kỳ khác ở góc trên.</p></div>';
      var prev = ky.thang > 1 ? M.card(CN, ky.nam, ky.thang - 1) : null, rk = M.ranking(ky.nam, ky.thang).filter(function (c) { return c.co_so; }), X = M.duBaoXepHang(ky.nam, ky.thang);
      var kt = M.kiemTraSo(ky.nam, ky.thang), hd = STORE.getHanhDong().filter(function (x) { return x.trang_thai === 'moi' || x.trang_thai === 'dang_lam'; }), it = goiY(M, ky).filter(function (x) { return x.muc >= 2; });
      var row = function (c, i) { var pv = ky.thang > 1 ? M.card(c.ma, ky.nam, ky.thang - 1).quy_doi : null; return '<tr><td>' + (c.hang || i + 1) + '</td><td><b>' + esc(c.ten_ngan) + '</b></td><td class="r num">' + num(c.quy_doi, 1) + '</td><td class="r">' + dlt(isNum(pv) ? c.quy_doi - pv : null, 1) + '</td></tr>'; };
      var cap = []; rk.forEach(function (c) { c.rows.forEach(function (r) { if (isNum(r.mat) && r.mat > 0.005) cap.push({ c: c, r: r }); }); }); cap.sort(function (a, b) { return b.r.mat - a.r.mat; });
      var khongDat = X.cn.rows.filter(function (r) { return r.ket_luan === 'khong_dat'; }).sort(function (a, b) { return (b.mat_du_bao || 0) - (a.mat_du_bao || 0); });
      var h = '<div class="toolbar no-print"><div class="grow"></div><button class="btn" id="dh-in">In / Lưu PDF</button></div>';
      h += '<section class="card dh-head"><div><small>BẢNG ĐIỀU HÀNH · ' + kyText(ky).toUpperCase() + ' (LŨY KẾ)</small><h2>' + esc(STORE.state.settings.ten_chi_nhanh) + '</h2><p class="muted small">Lập ngày ' + new Date().toLocaleDateString('vi-VN') + ' · số liệu đến hết ' + kyText(ky) + (STORE.kyKhoa(ky.nam, ky.thang) ? ' · <b>đã khoá</b>' : ' · chưa khoá') + '</p></div>' +
        '<div class="dh-kpis"><div><small>Điểm KPI CN</small><b class="txt-' + UI.htClass(cn.ht_chung, g) + '">' + num(cn.quy_doi, 1) + '</b>' + (prev ? dlt(cn.quy_doi - prev.quy_doi, 1) : '') + '</div>' +
        '<div><small>Dự kiến cuối năm</small><b>' + num(X.cn.quy_doi_du_bao, 1) + '</b><span class="muted small">theo tốc độ 3 tháng gần nhất</span></div>' +
        '<div><small>Chỉ tiêu đạt</small><b>' + cn.so_dat + '/' + cn.so_ct + '</b><span class="muted small">' + cn.so_chua + ' chưa đạt</span></div>' +
        '<div><small>Số liệu</small><b>' + kt.tong_co + '/' + kt.tong_can + '</b><span class="muted small">' + kt.bat_thuong.length + ' bất thường</span></div></div></section>';
      h += '<div class="cols-2"><div class="card"><div class="card-head"><h3>Đơn vị dẫn đầu</h3></div><table class="tbl"><tbody>' + rk.slice(0, 3).map(row).join('') + '</tbody></table></div>' +
        '<div class="card"><div class="card-head"><h3>Đơn vị cuối bảng xếp hạng</h3></div><table class="tbl"><tbody>' + rk.slice(-3).reverse().map(function (c) { return row(c, rk.indexOf(c)); }).join('') + '</tbody></table></div></div>';
      h += '<div class="cols-2"><div class="card"><div class="card-head"><h3>Chỉ tiêu mất điểm lớn nhất</h3></div>' + (cap.length ? '<table class="tbl"><tbody>' + cap.slice(0, 5).map(function (x) { return '<tr><td><b>' + esc(x.c.ten_ngan) + '</b></td><td>' + esc(x.r.ind.ten_ngan || x.r.ind.ten) + '</td><td class="r">' + pct(x.r.ht, 0) + '</td><td class="r txt-chua">-' + num(x.r.mat, 1) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="ok-box">Không có chỉ tiêu mất điểm.</p>') + '</div>' +
        '<div class="card"><div class="card-head"><h3>Chỉ tiêu toàn CN có nguy cơ không đạt KH năm</h3></div>' + (khongDat.length ? '<table class="tbl"><tbody>' + khongDat.slice(0, 5).map(function (r) { return '<tr><td>' + esc(r.ind.ten_ngan || r.ind.ten) + '</td><td class="r">dự kiến ' + (isNum(r.ht_du_bao) ? pct(r.ht_du_bao, 0) : '–') + '</td><td class="r small muted">cần ' + (r.can_moi_thang === null ? '–' : UI.val(r.can_moi_thang, r.ind)) + '/tháng</td></tr>'; }).join('') + '</tbody></table>' : '<p class="ok-box">Chưa có chỉ tiêu nào có nguy cơ không đạt KH năm theo xu hướng hiện tại.</p>') + '</div></div>';
      h += '<div class="cols-2"><div class="card"><div class="card-head"><h3>Cảnh báo cần xử lý (' + it.length + ')</h3></div>' + (it.length ? '<ul class="cb-list">' + it.slice(0, 6).map(function (x) { return '<li><b>' + esc(x.loai) + '</b> — ' + esc(x.text) + '</li>'; }).join('') + '</ul>' : '<p class="ok-box">Không có.</p>') + '</div>' +
        '<div class="card"><div class="card-head"><h3>Nhiệm vụ đang theo dõi (' + hd.length + ')</h3></div>' + (hd.length ? '<ul class="cb-list">' + hd.slice(0, 6).map(function (x) { return '<li>' + chipHD(x) + ' ' + esc(x.tieu_de) + ' <span class="muted small">· ' + esc(tenDv(M, x.dv)) + (x.han ? ' · hạn ' + ngayVN(x.han) : '') + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">Chưa giao nhiệm vụ nào.</p>') + '</div></div>';
      return h;
    },
    mount: function (v) { var b = v.querySelector('#dh-in'); if (b) b.onclick = function () { window.print(); }; }
  };
  VIEWS['canh-bao'].goiY = goiY; VIEWS['hanh-dong'].quaHan = quaHan; VIEWS['hanh-dong'].tenDv = tenDv;   // dùng chung với giao diện mới
})(window);
