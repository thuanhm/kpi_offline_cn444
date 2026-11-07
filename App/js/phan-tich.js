/* PHÂN TÍCH — hàm thuần mở rộng KPI_ENGINE.Model (không đọc DOM, không ghi dữ liệu):
 *   duBao / duBaoDonVi / duBaoXepHang  — dự báo kết quả cuối năm (T12) từ số lũy kế đến kỳ đang xem
 *   phanRa                              — điểm đổi so với kỳ trước là do chỉ tiêu nào
 *   cuuDiem                             — chỉ tiêu cần ưu tiên cải thiện: điểm có thể bổ sung khi hoàn thành kế hoạch
 *   moPhong                             — thử "nếu số thực hiện/kế hoạch là X thì điểm và hạng ra sao" (không lưu)
 *   kiemTraSo / canhBaoNhap             — tiến độ nhập liệu và số bất thường
 * Mọi dự báo chỉ mang tính tham khảo theo cách tính được chọn (mặc định: tốc độ 3 tháng gần nhất). Cách "theo kế hoạch" giữ nguyên tỷ lệ hoàn thành hiện tại nên điểm dự kiến = điểm hiện tại — chỉ dùng để ước số tuyệt đối. */
(function (root) {
  var E = root.KPI_ENGINE, P = E.Model.prototype, CN = root.KPI_CFG.MA_CN, TT = root.KPI_CFG.TRANG_THAI, kieuSo = E.kieuSo, computeKpi = E.computeKpi;
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function r2(x) { return Math.round(x * 100) / 100; }

  var CACH = { gan_day: 'Theo tốc độ 3 tháng gần nhất', theo_kh: 'Theo đường kế hoạch (giữ nguyên tỷ lệ hoàn thành hiện tại)', tuyen_tinh: 'Theo tốc độ bình quân từ đầu năm' }, MAC_DINH = 'gan_day';

  /* Tốc độ tăng mỗi tháng trong tối đa 3 tháng gần nhất (tháng trước năm = 0 với chỉ tiêu lũy kế). */
  function tocDo(M, ct, dv, nam, thang, kieu) {
    var m = Math.min(3, thang), cuoi = M.val('a', ct, dv, nam, thang), dau = thang - m >= 1 ? M.val('a', ct, dv, nam, thang - m) : (kieu === 'luy_ke' ? 0 : null);
    if (!isNum(cuoi) || !isNum(dau)) { m = 1; dau = thang > 1 ? M.val('a', ct, dv, nam, thang - 1) : (kieu === 'luy_ke' ? 0 : null); if (!isNum(cuoi) || !isNum(dau)) return null; }
    return (cuoi - dau) / m;
  }

  /* Dự báo 1 chỉ tiêu của 1 đơn vị đến cuối năm. cach: 'theo_kh' (mặc định) · 'gan_day' · 'tuyen_tinh'. */
  P.duBao = function (ct, dv, nam, thang, cach) {
    cach = CACH[cach] ? cach : MAC_DINH;
    var ind = this.indMap[ct]; if (!ind) return null;
    var key = 'db|' + ct + '|' + dv + '|' + nam + '|' + thang + '|' + cach; if (this.cache[key]) return this.cache[key];
    var kieu = kieuSo(ind), th = this.val('a', ct, dv, nam, thang), kh = this.val('p', ct, dv, nam, thang), khNam = this.val('p', ct, dv, nam, 12), con = 12 - thang;
    var tyLe = ind.huong === 'nhap_ty_le' || ind.dvt === '%';
    var out = { ct: ct, ma: ct, ind: ind, kieu: kieu, cach: cach, th: th, kh: kh, kh_nam: khNam, con_thang: con, du_bao: null, ht_du_bao: null, can_moi_thang: null, toc_do: null, ket_luan: null, ly_do: '' };
    if (!isNum(th)) { out.ly_do = 'Chưa có số thực hiện'; return (this.cache[key] = out); }
    var tg = tocDo(this, ct, dv, nam, thang, kieu); out.toc_do = tg;
    var db = th;
    if (thang >= 12 || tyLe) { out.ly_do = tyLe ? 'Chỉ tiêu tỷ lệ: giữ nguyên mức hiện tại' : ''; }
    else if (cach === 'theo_kh' && isNum(kh) && kh > 0 && isNum(khNam)) db = th * khNam / kh;
    else if (cach === 'tuyen_tinh' && kieu === 'luy_ke') db = th / thang * 12;
    else if (tg !== null) db = th + tg * con;
    else { out.ly_do = 'Chưa đủ số liệu các tháng trước để dự báo'; }
    out.du_bao = db = r2(db);
    if (isNum(khNam)) {
      if (!tyLe && con > 0) out.can_moi_thang = r2((khNam - th) / con);
      var k = computeKpi({ kh: khNam, th: db, ts: 1, toi_da: 9, huong: ind.huong, ap_dung: true, nguong: this.ng, tran_100: ind.dvt === '%' && ind.huong === 'cao_tot' });
      out.ht_du_bao = k.ht;
      if (isNum(k.ht)) {
        var daDat = ind.huong === 'cao_tot' && !tyLe && th >= khNam;
        out.ket_luan = daDat ? 'da_dat' : k.ht >= this.ng.dat ? 'dat' : k.ht >= this.ng.kha ? 'sat' : 'khong_dat';
      }
    } else if (ind.huong === 'nhap_ty_le') {
      var k2 = computeKpi({ kh: null, th: db, ts: 1, toi_da: 9, huong: ind.huong, ap_dung: true, nguong: this.ng }); out.ht_du_bao = k2.ht;
      if (isNum(k2.ht)) out.ket_luan = k2.ht >= this.ng.dat ? 'dat' : k2.ht >= this.ng.kha ? 'sat' : 'khong_dat';
    }
    return (this.cache[key] = out);
  };

  /* Dự báo toàn bộ chỉ tiêu có điểm của 1 đơn vị + điểm quy đổi dự kiến cuối năm. */
  P.duBaoDonVi = function (dv, nam, thang, cach) {
    cach = CACH[cach] ? cach : MAC_DINH;
    var key = 'dbdv|' + dv + '|' + nam + '|' + thang + '|' + cach; if (this.cache[key]) return this.cache[key];
    var self = this, c = this.card(dv, nam, thang), rows = [], tongDiem = 0, nguyCo = 0, khong = 0;
    c.rows.forEach(function (r) {
      var d = self.duBao(r.ma, dv, nam, thang, cach), x = Object.assign({}, d, { ts: r.ts, toi_da: r.toi_da, diem_hien_tai: r.diem, ht_hien_tai: r.ht });
      var diemDb = r.diem;   // không dự báo được → giữ điểm hiện tại
      if (d && isNum(d.du_bao) && isNum(d.kh_nam) || (d && d.ind.huong === 'nhap_ty_le' && isNum(d.du_bao))) {
        var k = computeKpi({ kh: d.kh_nam, th: d.du_bao, ts: r.ts, toi_da: r.toi_da, huong: r.ind.huong, ap_dung: true, nguong: self.ng, tran_100: r.ind.dvt === '%' && r.ind.huong === 'cao_tot' });
        if (isNum(k.diem)) diemDb = k.diem;
      }
      x.diem_du_bao = isNum(diemDb) ? diemDb : 0; x.mat_du_bao = isNum(r.ts) ? Math.max(0, r.ts - x.diem_du_bao) : null;
      tongDiem += x.diem_du_bao;
      if (d && (d.ket_luan === 'sat' || d.ket_luan === 'khong_dat')) { nguyCo++; if (d.ket_luan === 'khong_dat') khong++; }
      rows.push(x);
    });
    var qd = c.ts ? Math.max(0, r2(tongDiem / c.ts * 100 + c.dc_diem)) : null;
    return (this.cache[key] = { dv: dv, ten_ngan: c.ten_ngan, card: c, rows: rows, quy_doi_hien_tai: c.quy_doi, quy_doi_du_bao: qd, so_nguy_co: nguyCo, so_khong_dat: khong });
  };

  /* Bảng dự báo các phòng/PGD (xếp hạng theo điểm dự kiến cuối năm) + toàn chi nhánh. */
  P.duBaoXepHang = function (nam, thang, cach) {
    var self = this, rk = this.ranking(nam, thang).filter(function (c) { return c.co_so; });
    var list = rk.map(function (c) { var d = self.duBaoDonVi(c.ma, nam, thang, cach); return { ma: c.ma, ten_ngan: c.ten_ngan, khoi: c.khoi, hang_hien_tai: c.hang, quy_doi: c.quy_doi, du_bao: d.quy_doi_du_bao, so_nguy_co: d.so_nguy_co, so_khong_dat: d.so_khong_dat, d: d }; });
    var sx = list.slice().sort(function (a, b) { return (b.du_bao || 0) - (a.du_bao || 0); });
    sx.forEach(function (x, i) { x.hang_du_bao = i && Math.abs((x.du_bao || 0) - (sx[i - 1].du_bao || 0)) <= 0.001 ? sx[i - 1].hang_du_bao : i + 1; });
    return { ds: sx, cn: this.duBaoDonVi(CN, nam, thang, cach) };
  };

  /* Điểm quy đổi đổi bao nhiêu so với kỳ trước (cùng năm; T1 không có kỳ trước) và nguyên nhân theo từng chỉ tiêu. */
  P.phanRa = function (dv, nam, thang) {
    if (thang <= 1) return { co: false, ly_do: 'Tháng 1 không có kỳ trước cùng năm để so sánh.' };
    var key = 'pr|' + dv + '|' + nam + '|' + thang; if (this.cache[key]) return this.cache[key];
    var nay = this.card(dv, nam, thang), tr = this.card(dv, nam, thang - 1);
    if (!nay.co_so || !tr.co_so || !isNum(nay.quy_doi) || !isNum(tr.quy_doi)) return (this.cache[key] = { co: false, ly_do: 'Một trong hai kỳ chưa có số thực hiện.' });
    var tmap = {}; tr.rows.forEach(function (r) { tmap[r.ma] = r; });
    var rows = nay.rows.map(function (r) {
      var t = tmap[r.ma], dn = isNum(r.diem) ? r.diem : 0, dt = t && isNum(t.diem) ? t.diem : 0;
      return { ma: r.ma, ind: r.ind, ts: r.ts, diem: dn, diem_truoc: dt, d_diem: r2(dn - dt), dong_gop: nay.ts ? r2((dn - dt) / nay.ts * 100) : 0, ht: r.ht, ht_truoc: t ? t.ht : null, th: r.th, th_truoc: t ? t.th : null, tt: r.tt, tt_truoc: t ? t.tt : null };
    }).sort(function (a, b) { return Math.abs(b.dong_gop) - Math.abs(a.dong_gop); });
    var dDc = r2(nay.dc_diem - tr.dc_diem), d = r2(nay.quy_doi - tr.quy_doi);
    return (this.cache[key] = { co: true, dv: dv, nay: nay, truoc: tr, d_quy_doi: d, d_dc_diem: dDc, rows: rows,
      tang: rows.filter(function (x) { return x.dong_gop > 0.005; }), giam: rows.filter(function (x) { return x.dong_gop < -0.005; }) });
  };

  /* Chỉ tiêu cần ưu tiên cải thiện: điểm có thể bổ sung nếu hoàn thành 100% KH, kèm số còn phải thực hiện. */
  P.cuuDiem = function (dv, nam, thang, n) {
    var c = this.card(dv, nam, thang), out = [];
    c.rows.forEach(function (r) {
      if (!isNum(r.ts) || !r.ts) return;
      var thieu = !isNum(r.th) || !isNum(r.kh) && r.ind.huong !== 'nhap_ty_le', lay = isNum(r.diem) ? r.ts - r.diem : r.ts;
      if (lay < 0.005 || (!thieu && isNum(r.ht) && r.ht >= 1)) return;
      var can = null;
      if (!thieu && isNum(r.kh) && isNum(r.th) && r.ind.huong !== 'nhap_ty_le') can = r.ind.huong === 'thap_tot' ? r.th - r.kh : r.kh - r.th;   // cần tăng (cao tốt) / cần giảm (thấp tốt)
      if (r.ind.huong === 'nhap_ty_le' && isNum(r.th)) can = 100 - r.th;
      out.push({ ma: r.ma, ind: r.ind, ts: r.ts, diem: r.diem, ht: r.ht, kh: r.kh, th: r.th, tt: r.tt, thieu: thieu, lay_lai: r2(lay), lay_lai_qd: c.ts ? r2(lay / c.ts * 100) : 0, can: can === null ? null : r2(can) });
    });
    out.sort(function (a, b) { return b.lay_lai - a.lay_lai; });
    return n ? out.slice(0, n) : out;
  };

  /* Mô phỏng. ghiDe: { ma_ct: { th: số, kh: số } } — chỉ thay trong bộ nhớ. */
  P.moPhong = function (dv, nam, thang, ghiDe) {
    ghiDe = ghiDe || {};
    var self = this, c = this.card(dv, nam, thang), tong = 0;
    var rows = c.rows.map(function (r) {
      var ov = ghiDe[r.ma] || {}, th = isNum(ov.th) ? ov.th : r.th, kh = isNum(ov.kh) ? ov.kh : r.kh;
      var k = computeKpi({ kh: kh, th: th, ts: r.ts, toi_da: r.toi_da, huong: r.ind.huong, ap_dung: true, nguong: self.ng, tran_100: r.ind.dvt === '%' && r.ind.huong === 'cao_tot' });
      var diem = isNum(k.diem) ? k.diem : 0; tong += diem;
      return { ma: r.ma, ind: r.ind, ts: r.ts, kh_truoc: r.kh, kh_sau: kh, th_truoc: r.th, th_sau: th, ht_truoc: r.ht, ht_sau: k.ht, diem_truoc: isNum(r.diem) ? r.diem : 0, diem_sau: diem, d_diem: r2(diem - (isNum(r.diem) ? r.diem : 0)), tt_sau: k.tt, doi: isNum(ov.th) || isNum(ov.kh) };
    });
    var qdGoc = c.ts ? r2(tong / c.ts * 100) : null, qd = qdGoc !== null ? Math.max(0, r2(qdGoc + c.dc_diem)) : null;
    var hangTruoc = null, hangSau = null;
    if (dv !== CN && isNum(c.quy_doi) && isNum(qd)) {
      var kh = this.ranking(nam, thang).filter(function (x) { return x.ma !== dv && x.co_so && isNum(x.quy_doi); });
      hangTruoc = 1 + kh.filter(function (x) { return x.quy_doi > c.quy_doi + 0.001; }).length;
      hangSau = 1 + kh.filter(function (x) { return x.quy_doi > qd + 0.001; }).length;
    }
    return { dv: dv, ten_ngan: c.ten_ngan, rows: rows, truoc: { quy_doi: c.quy_doi, hang: hangTruoc }, sau: { quy_doi: qd, hang: hangSau }, d_quy_doi: isNum(qd) && isNum(c.quy_doi) ? r2(qd - c.quy_doi) : null, so_doi: rows.filter(function (x) { return x.doi; }).length };
  };

  /* ---------- Kiểm tra số liệu ---------- */
  function nguongKt(M) { var s = M.s.settings; return { so_du: +s.kt_so_du > 0 ? +s.kt_so_du : 0.3, luy_ke: +s.kt_luy_ke > 0 ? +s.kt_luy_ke : 0.5 }; }

  /* Đánh giá 1 số thực hiện (th) so với tháng trước (tr) và nhịp bình quân (tb = số tăng bình quân/tháng các tháng trước). → null hoặc { muc, loai, text } */
  function danhGiaSo(M, ind, th, tr, tb, thang) {
    var kieu = kieuSo(ind), ng = nguongKt(M), tyLe = ind.dvt === '%' || ind.huong === 'nhap_ty_le';
    if (!isNum(th)) return null;
    if (th < 0 && kieu === 'so_du' && !tyLe) return { muc: 2, loai: 'Số âm', text: 'số dư/mức âm (' + th + ')' };
    if (tyLe && ind.huong === 'nhap_ty_le' && (th < 0 || th > 100)) return { muc: 2, loai: 'Tỷ lệ ngoài 0–100', text: 'tỷ lệ ' + th + ' nằm ngoài khoảng 0–100' };
    if (!isNum(tr)) return null;
    if (tr > 0 && th > 0 && (th / tr >= 20 || th / tr <= 1 / 20)) return { muc: 2, loai: 'Nghi sai đơn vị tính (×10, ×1000)', text: 'gấp ' + (Math.round(th / tr * 100) / 100) + ' lần tháng trước (' + tr + ' → ' + th + ')' };
    if (kieu === 'luy_ke' && !tyLe) {
      if (th < tr - 1e-9) return { muc: 2, loai: 'Lũy kế giảm', text: 'số lũy kế thấp hơn tháng trước (' + tr + ' → ' + th + ')' };
      var inc = th - tr;
      if (isNum(tb) && tb > 0 && thang > 2 && Math.abs(inc - tb) / tb > ng.luy_ke * 2) return { muc: 1, loai: 'Phát sinh trong tháng biến động bất thường', text: 'phát sinh ' + (Math.round(inc * 100) / 100) + ' so với bình quân ' + (Math.round(tb * 100) / 100) + '/tháng' };
    } else if (tr !== 0 && Math.abs(th - tr) / Math.abs(tr) > ng.so_du) {
      return { muc: 1, loai: 'Biến động lớn', text: 'đổi ' + (th > tr ? '+' : '') + (Math.round((th - tr) / Math.abs(tr) * 1000) / 10) + '% so với tháng trước (' + tr + ' → ' + th + ')' };
    }
    return null;
  }
  /* Cảnh báo khi vừa nhập 1 ô thực hiện (dùng ở màn Nhập số). Chuỗi rỗng = bình thường. */
  P.canhBaoNhap = function (ct, dv, nam, thang, v) {
    var ind = this.indMap[ct]; if (!ind || !isNum(v) || thang <= 1) return '';
    var tr = this.val('a', ct, dv, nam, thang - 1), prev = thang > 2 ? this.val('a', ct, dv, nam, thang - 2) : (kieuSo(ind) === 'luy_ke' ? 0 : null);
    var tb = isNum(tr) && thang > 2 ? tr / (thang - 1) : null;
    var d = danhGiaSo(this, ind, v, tr, tb, thang); void prev;
    return d ? d.loai + ': ' + d.text : '';
  };

  P.kiemTraSo = function (nam, thang) {
    var key = 'kt|' + nam + '|' + thang; if (this.cache[key]) return this.cache[key];
    var self = this, tienDo = [], bt = [], tongCan = 0, tongCo = 0;
    this.units.forEach(function (u) {
      var c = self.card(u.ma, nam, thang); if (!c.so_ct) return;
      var t = { dv: u.ma, ten_ngan: c.ten_ngan, can: c.rows.length, co_th: 0, co_kh: 0, thieu_th: [], thieu_kh: [] };
      c.rows.forEach(function (r) {
        var tyLe = r.ind.huong === 'nhap_ty_le';
        if (isNum(r.th)) t.co_th++; else t.thieu_th.push(r.ind);
        if (tyLe || isNum(r.kh)) t.co_kh++; else t.thieu_kh.push(r.ind);
        var tr = r.th_truoc, tb = isNum(tr) && thang > 2 ? tr / (thang - 1) : null, d = danhGiaSo(self, r.ind, r.th, tr, tb, thang);
        if (d) bt.push({ muc: d.muc, loai: d.loai, dv: u.ma, ct: r.ma, text: c.ten_ngan + ' · ' + r.ind.ten_ngan + ': ' + d.text + '.' });
      });
      tongCan += t.can; tongCo += t.co_th; tienDo.push(t);
    });
    this.inds.forEach(function (ind) {   // CN nhập riêng lệch tổng các phòng
      if (ind.tong_hop_cn !== 'tong') return;
      var own = self.raw('a', ind.ma, CN, nam, thang); if (own === null || !own) return;
      var s = 0, n = 0; self.units.forEach(function (u) { var x = self.raw('a', ind.ma, u.ma, nam, thang); if (x !== null) { s += x; n++; } });
      if (n && Math.abs(s - own) / Math.abs(own) > 0.01) bt.push({ muc: 2, loai: 'Lệch tổng', ct: ind.ma, text: ind.ten_ngan + ': số CN nhập riêng ' + own + ' lệch tổng các phòng ' + (Math.round(s * 100) / 100) + ' (' + (Math.round((s - own) / Math.abs(own) * 1000) / 10) + '%).' });
    });
    bt.sort(function (a, b) { return b.muc - a.muc; });
    return (this.cache[key] = { tien_do: tienDo, bat_thuong: bt, tong_can: tongCan, tong_co: tongCo, day_du: tongCan > 0 && tongCo === tongCan });
  };

  E.CACH_DU_BAO = CACH; E.CACH_MAC_DINH = MAC_DINH; E.danhGiaSo = danhGiaSo;
})(window);
