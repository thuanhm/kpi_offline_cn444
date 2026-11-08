/* KPI ENGINE — hàm thuần (không đọc DOM). Quy tắc chấm điểm:
 *   %HT = TH/KH (cao tốt) · KH/TH (thấp tốt; TH = 0 → %tối đa) · TH/100 (nhập tỷ lệ)
 *   Điểm = trọng số × min(%HT, %tối đa); thiếu số → 0 điểm, mất đủ trọng số; TH âm → 0 điểm.
 * Đối tượng chấm: từng PHÒNG/PGD (trọng số theo khối) và TOÀN CHI NHÁNH (khối 'CN').
 * Kết quả mỗi kỳ được tính một lần rồi lưu đệm cho tới khi dữ liệu đổi (phiên bản dữ liệu tăng). */
(function (root) {
  var CFG = root.KPI_CFG, TT = CFG.TRANG_THAI, CN = CFG.MA_CN;
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  /* Sắp chỉ tiêu: các chỉ tiêu cùng NHÓM đứng liền nhau (nhóm xếp theo thứ tự nhỏ nhất trong nhóm), trong nhóm theo Thứ tự. */
  function sapXepChiTieu(list) {
    var min = {};
    list.forEach(function (i) { var g = i.nhom || '', t = i.thu_tu || 0; if (min[g] === undefined || t < min[g]) min[g] = t; });
    return list.slice().sort(function (a, b) {
      var ga = a.nhom || '', gb = b.nhom || '';
      if (ga !== gb) return (min[ga] - min[gb]) || (ga < gb ? -1 : 1);
      return (a.thu_tu || 0) - (b.thu_tu || 0);
    });
  }

  function trangThai(r, ng) {
    if (r >= ng.dat) return TT.DAT;
    if (r >= ng.kha) return TT.KHA;
    if (r >= ng.cct) return TT.CCT;
    return TT.CHUA_DAT;
  }

  function computeKpi(o) {
    var out = { gap: null, ht: null, diem: null, mat: null, tt: null };
    if (o.ap_dung === false) { out.tt = TT.KAD; return out; }
    var kh = o.kh, th = o.th, nhapTL = o.huong === 'nhap_ty_le', thapKh0 = o.huong === 'thap_tot' && kh === 0;
    if (nhapTL ? !isNum(th) : (!isNum(kh) || !isNum(th) || (kh === 0 && !thapKh0))) {
      out.tt = TT.THIEU;
      if (isNum(o.ts)) { out.diem = 0; out.mat = o.ts; }
      return out;
    }
    out.gap = nhapTL ? null : th - kh;
    var max = o.toi_da, r;
    if (nhapTL) r = th / 100;
    else if (o.huong === 'thap_tot') r = th === 0 ? (isNum(max) ? max : 1) : kh / th;
    else r = th / kh;
    if (o.tran_100 && r > 1) r = 1;
    out.ht = r;
    out.tt = trangThai(r, o.nguong);
    if (!isNum(o.ts) || !isNum(max)) { out.tt = TT.THIEU_CH; return out; }
    if (th < 0) { out.diem = 0; out.mat = o.ts; out.tt = TT.CHUA_DAT; return out; }
    out.diem = o.ts * Math.min(Math.max(r, 0), max);
    out.mat = Math.max(0, o.ts - out.diem);
    return out;
  }

  /* ---------- Mô hình tính toán trên state ---------- */
  function Model(state, version) {
    this.s = state; this.v = version; this.cache = {};
    var ng = state.settings.nguong;
    this.ng = { dat: +ng.dat || 1, kha: +ng.kha || 0.8, cct: +ng.cct || 0.7, diem_cao: isNum(+ng.diem_cao) && +ng.diem_cao > 0 ? +ng.diem_cao : 90 };   // diem_cao: ngưỡng điểm (D7); thiếu/không hợp lệ → 90
    this.units = state.don_vi.filter(function (d) { return d.trang_thai !== 'inactive'; })
      .sort(function (a, b) { return (a.thu_tu || 0) - (b.thu_tu || 0); });
    this.inds = sapXepChiTieu(state.indicators.filter(function (i) { return i.trang_thai !== 'inactive'; }));
    var w = {}; state.weights.forEach(function (x) { w[x.ma_chi_tieu + '|' + x.khoi] = x; });
    this.w = w;
    var im = {}; this.inds.forEach(function (i) { im[i.ma] = i; }); this.indMap = im;
    var um = {}; this.units.forEach(function (u) { um[u.ma] = u; }); this.unitMap = um;
    // Chỉ mục giá trị: v[k][ma_ct][ma_dv][nam] = mảng 13 phần tử (theo tháng)
    var v = { p: {}, a: {} }, kyCoTH = {};
    Object.keys(state.rec).forEach(function (key) {
      var val = state.rec[key][0]; if (!isNum(val)) return;
      var p = key.split('|'), k = p[0], ct = p[1], dv = p[2], nam = +p[3], th = +p[4];
      var a = v[k][ct] || (v[k][ct] = {}); var b = a[dv] || (a[dv] = {}); var arr = b[nam] || (b[nam] = new Array(13));
      arr[th] = val;
      if (k === 'a') kyCoTH[nam * 100 + th] = 1;
    });
    this.idx = v;
    // Điều chỉnh thủ công (cộng/trừ) trên số THỰC HIỆN: số dùng = số gốc + điều chỉnh. adjDv: theo đơn vị (kể cả CN trực tiếp);
    // adjCn: phần điều chỉnh của các phòng được tính vào số CN khi CN có số riêng (khi CN là tổng các phòng thì đã gồm sẵn).
    var adjDv = {}, adjCn = {};
    (state.dieu_chinh || []).forEach(function (d) {
      if (d.xoa || !isNum(d.so)) return;
      var den = d.pham_vi === 'den_cuoi_nam' ? 12 : d.thang;
      for (var t = d.thang; t <= den; t++) {
        var k = d.ct + '|' + d.dv + '|' + d.nam + '|' + t;
        adjDv[k] = (adjDv[k] || 0) + d.so;
        if (d.dv !== CN && d.ap_cn !== false) { var kc = d.ct + '|' + d.nam + '|' + t; adjCn[kc] = (adjCn[kc] || 0) + d.so; }
      }
    });
    this.adjDv = adjDv; this.adjCn = adjCn;
    this.periods = Object.keys(kyCoTH).map(Number).sort(function (a, b) { return a - b; })
      .map(function (x) { return { nam: Math.floor(x / 100), thang: x % 100 }; });
  }

  Model.prototype.goc = function (k, ct, dv, nam, thang) {
    var a = this.idx[k][ct]; if (!a) return null; a = a[dv]; if (!a) return null; a = a[nam]; if (!a) return null;
    var x = a[thang]; return isNum(x) ? x : null;
  };
  /* Tổng điều chỉnh đang áp cho 1 ô thực hiện (CN: gồm điều chỉnh trực tiếp CN; tuChon 'phong' = phần từ các phòng). */
  Model.prototype.dc = function (ct, dv, nam, thang) { return this.adjDv[ct + '|' + dv + '|' + nam + '|' + thang] || 0; };
  Model.prototype.dcCnTuPhong = function (ct, nam, thang) { return this.adjCn[ct + '|' + nam + '|' + thang] || 0; };
  Model.prototype.raw = function (k, ct, dv, nam, thang) {
    var x = this.goc(k, ct, dv, nam, thang);
    if (x === null || k !== 'a') return x;
    var d = this.dc(ct, dv, nam, thang) + (dv === CN ? this.dcCnTuPhong(ct, nam, thang) : 0);
    return d ? Math.round((x + d) * 1e4) / 1e4 : x;
  };
  /* Số của chi nhánh: ưu tiên số CN nhập riêng; không có thì tổng hợp từ các phòng theo tong_hop_cn. */
  Model.prototype.cnVal = function (k, ct, nam, thang) {
    var own = this.raw(k, ct, CN, nam, thang);
    if (own !== null) return { v: own, nguon: 'nhap' };
    var ind = this.indMap[ct]; if (!ind || ind.tong_hop_cn === 'nhap') return { v: null, nguon: null };
    var s = 0, n = 0, self = this;
    this.units.forEach(function (u) { var x = self.raw(k, ct, u.ma, nam, thang); if (x !== null) { s += x; n++; } });
    if (!n) return { v: null, nguon: null };
    var dcCn = k === 'a' ? this.dc(ct, CN, nam, thang) : 0;
    return { v: (ind.tong_hop_cn === 'tb' ? s / n : s) + dcCn, nguon: ind.tong_hop_cn === 'tb' ? 'tb' : 'tong' };
  };
  Model.prototype.val = function (k, ct, dv, nam, thang) {
    return dv === CN ? this.cnVal(k, ct, nam, thang).v : this.raw(k, ct, dv, nam, thang);
  };
  Model.prototype.khoiOf = function (dv) { return dv === CN ? 'CN' : (this.unitMap[dv] ? this.unitMap[dv].khoi : null); };
  Model.prototype.apDung = function (ct, dv) { return !!this.w[ct + '|' + this.khoiOf(dv)]; };

  /* Thẻ điểm của 1 đơn vị (hoặc CN) tại 1 kỳ. */
  Model.prototype.card = function (dv, nam, thang) {
    var key = dv + '|' + nam + '|' + thang;
    if (this.cache[key]) return this.cache[key];
    var self = this, khoi = this.khoiOf(dv), rows = [], ref = [];
    var tong = { diem: 0, ts: 0, dat: 0, kha: 0, cct: 0, chua: 0, thieu: 0 };
    this.inds.forEach(function (ind) {
      if (ind.trang_thai === 'inactive') return;
      var w = self.w[ind.ma + '|' + khoi];
      if (!w) {
        if (ind.chi_tham_khao || dv === CN) w = { ma_chi_tieu: ind.ma, khoi: khoi, trong_so: 0, toi_da: 1.3 };
        else return;
      }
      var kh = self.val('p', ind.ma, dv, nam, thang), th = self.val('a', ind.ma, dv, nam, thang);
      var r = computeKpi({ kh: kh, th: th, ts: ind.chi_tham_khao ? null : w.trong_so, toi_da: w.toi_da, huong: ind.huong,
        ap_dung: true, nguong: self.ng, tran_100: ind.dvt === '%' && ind.huong === 'cao_tot' });
      var khNam = self.val('p', ind.ma, dv, nam, 12);
      var thTruoc = thang > 1 ? self.val('a', ind.ma, dv, nam, thang - 1) : null;
      var row = { ind: ind, ma: ind.ma, kh: kh, th: th, gap: r.gap, ht: r.ht, ts: ind.chi_tham_khao ? null : w.trong_so, toi_da: w.toi_da,
        diem: ind.chi_tham_khao ? null : r.diem, mat: ind.chi_tham_khao ? null : r.mat, tt: ind.chi_tham_khao && r.tt === TT.THIEU_CH ? (r.ht !== null ? trangThai(r.ht, self.ng) : TT.THIEU) : r.tt,
        kh_nam: khNam, ht_nam: (ind.huong === 'cao_tot' && isNum(th) && isNum(khNam) && khNam) ? th / khNam : null,
        th_truoc: thTruoc, dc: dv === CN ? (self.cnVal('a', ind.ma, nam, thang).nguon === 'nhap' ? self.dc(ind.ma, CN, nam, thang) + self.dcCnTuPhong(ind.ma, nam, thang) : self.dc(ind.ma, CN, nam, thang)) : self.dc(ind.ma, dv, nam, thang), nguon_cn: dv === CN ? self.cnVal('a', ind.ma, nam, thang).nguon : null };
      if (ind.chi_tham_khao) { ref.push(row); return; }
      rows.push(row);
      tong.ts += w.trong_so || 0; tong.diem += isNum(r.diem) ? r.diem : 0;
      if (r.tt === TT.DAT) tong.dat++; else if (r.tt === TT.KHA) tong.kha++; else if (r.tt === TT.CCT) tong.cct++;
      else if (r.tt === TT.CHUA_DAT) tong.chua++; else tong.thieu++;
    });
    var u = dv === CN ? null : this.unitMap[dv];
    var dsDcDiem = (self.s.diem_kpi || []).filter(function (x) {
      if (x.xoa || String(x.dv) !== String(dv) || Number(x.nam) !== Number(nam)) return false;
      var tTu = Number(x.thang) || 1;
      var tDen = Number(x.thang_den || x.thang) || tTu;
      return Number(thang) >= tTu && Number(thang) <= tDen;
    });
    var dcDiem = dsDcDiem.reduce(function (acc, x) { return acc + (Number(x.diem) || 0); }, 0);
    dcDiem = Math.round(dcDiem * 100) / 100;
    var quyDoiGoc = tong.ts ? Math.round((tong.diem / tong.ts * 100) * 100) / 100 : null;
    var quyDoi = quyDoiGoc !== null ? Math.max(0, Math.round((quyDoiGoc + dcDiem) * 100) / 100) : (dcDiem !== 0 ? dcDiem : null);
    var htChung = quyDoi !== null ? quyDoi / 100 : null;
    var out = { ma: dv, ten: dv === CN ? this.s.settings.ten_chi_nhanh : (u ? u.ten : dv), ten_ngan: dv === CN ? 'Toàn chi nhánh' : (u ? (u.ten_ngan || u.ten) : dv),
      khoi: khoi, nam: nam, thang: thang, rows: rows, ref: ref,
      diem_goc: tong.diem, quy_doi_goc: quyDoiGoc, dc_diem: dcDiem, ds_dc_diem: dsDcDiem,
      diem: tong.diem, ts: tong.ts,
      ht_chung: htChung, quy_doi: quyDoi,
      so_dat: tong.dat, so_kha: tong.kha, so_cct: tong.cct, so_chua: tong.chua, so_thieu: tong.thieu, so_ct: rows.length,
      co_so: rows.some(function (r) { return isNum(r.th); }) || dsDcDiem.length > 0 };
    this.cache[key] = out;
    return out;
  };

  /* Xếp hạng các phòng theo điểm quy đổi thang 100 (công bằng khi tổng trọng số các khối khác nhau). */
  Model.prototype.ranking = function (nam, thang, khoi) {
    var self = this;
    var list = this.units.filter(function (u) { return !khoi || u.khoi === khoi; })
      .map(function (u) { return self.card(u.ma, nam, thang); }).filter(function (c) { return c.so_ct > 0; });
    list.sort(function (a, b) {
      var d = (b.quy_doi || 0) - (a.quy_doi || 0);
      if (Math.abs(d) > 0.001) return d;
      return (a.u ? a.u.thu_tu : 0) - (b.u ? b.u.thu_tu : 0);
    });
    var prev = thang > 1 ? this.ranking0(nam, thang - 1, khoi) : {};
    var coDiem = list.some(function (c) { return isNum(c.quy_doi) && c.quy_doi > 0; });
    var curHang = 1;
    list.forEach(function (c, i) {
      if (!coDiem || !c.co_so || c.quy_doi === null) {
        c.hang = null;
      } else {
        if (i > 0 && Math.abs((c.quy_doi || 0) - (list[i - 1].quy_doi || 0)) > 0.001) {
          curHang = i + 1;
        }
        c.hang = curHang;
      }
      c.hang_truoc = prev[c.ma] || null;
    });
    return list;
  };
  Model.prototype.ranking0 = function (nam, thang, khoi) {
    var self = this, m = {};
    this.units.filter(function (u) { return !khoi || u.khoi === khoi; }).map(function (u) { return self.card(u.ma, nam, thang); })
      .filter(function (c) { return c.so_ct > 0 && c.co_so; })
      .sort(function (a, b) { return (b.quy_doi || 0) - (a.quy_doi || 0); })
      .forEach(function (c, i) { m[c.ma] = i + 1; });
    return m;
  };

  /* Thứ hạng từng chỉ tiêu giữa các phòng/PGD theo %HT (cao → hạng 1; bằng %HT thì đồng hạng; không có %HT thì không xếp).
   * → { ct: { hang: {ma_dv: số}, n: số đơn vị được xếp } } ; tom: {ma_dv: { tb, top3, cuoi, so }} (chỉ tính chỉ tiêu có điểm). */
  Model.prototype.rankInd = function (nam, thang) {
    var key = 'rank|' + nam + '|' + thang; if (this.cache[key]) return this.cache[key];
    var self = this, out = {}, tom = {};
    var cards = this.units.map(function (u) { return self.card(u.ma, nam, thang); });
    this.inds.forEach(function (ind) {
      var ds = [];
      cards.forEach(function (c) { var r = c.rows.concat(c.ref).filter(function (x) { return x.ma === ind.ma; })[0]; if (r && isNum(r.ht)) ds.push({ ma: c.ma, ht: r.ht }); });
      ds.sort(function (a, b) { return b.ht - a.ht; });
      var hang = {}; ds.forEach(function (x, i) { hang[x.ma] = i && Math.abs(x.ht - ds[i - 1].ht) < 1e-9 ? hang[ds[i - 1].ma] : i + 1; });
      out[ind.ma] = { hang: hang, n: ds.length };
      if (ind.chi_tham_khao || ds.length < 2) return;
      var last = hang[ds[ds.length - 1].ma];
      Object.keys(hang).forEach(function (m) {
        var t = tom[m] || (tom[m] = { s: 0, so: 0, top3: 0, cuoi: 0 }), h = hang[m];
        t.s += h; t.so++; if (h <= 3) t.top3++; if (h === last && last > 1) t.cuoi++;
      });
    });
    Object.keys(tom).forEach(function (m) { tom[m].tb = tom[m].s / tom[m].so; });
    return (this.cache[key] = { ct: out, tom: tom });
  };

  /* Chuỗi 12 tháng: điểm quy đổi của 1 đơn vị. */
  Model.prototype.scoreSeries = function (dv, nam) {
    var out = [];
    for (var t = 1; t <= 12; t++) {
      var co = this.periods.some(function (p) { return p.nam === nam && p.thang === t; });
      out.push(co ? this.card(dv, nam, t).quy_doi : null);
    }
    return out;
  };
  /* Chuỗi 12 tháng KH/TH/%HT của 1 chỉ tiêu tại 1 đơn vị. */
  Model.prototype.indSeries = function (ct, dv, nam) {
    var kh = [], th = [], ht = [], ind = this.indMap[ct];
    for (var t = 1; t <= 12; t++) {
      var p = this.val('p', ct, dv, nam, t), a = this.val('a', ct, dv, nam, t);
      kh.push(p); th.push(a);
      var r = computeKpi({ kh: p, th: a, ts: 1, toi_da: 9, huong: ind ? ind.huong : 'cao_tot', ap_dung: true, nguong: this.ng });
      ht.push(r.ht);
    }
    return { kh: kh, th: th, ht: ht };
  };
  Model.prototype.kyMoiNhat = function (nam) {
    var ds = this.periods.filter(function (p) { return !nam || p.nam === nam; });
    return ds.length ? ds[ds.length - 1] : null;
  };
  Model.prototype.thangCoSo = function (nam) {
    return this.periods.filter(function (p) { return p.nam === nam; }).map(function (p) { return p.thang; });
  };

  /* Cảnh báo điều hành cho 1 kỳ. */
  Model.prototype.alerts = function (nam, thang) {
    var self = this, out = [], ng = this.ng, soThang = +this.s.settings.so_thang_canh_bao || 2;
    this.units.forEach(function (u) {
      var c = self.card(u.ma, nam, thang);
      if (!c.so_ct) return;
      if (!c.co_so) { out.push({ muc: 2, dv: u.ma, loai: 'Thiếu số liệu', text: c.ten_ngan + ': chưa có số thực hiện T' + thang + '/' + nam + '.' }); return; }
      c.rows.forEach(function (r) {
        if (r.tt === TT.THIEU) out.push({ muc: 1, dv: u.ma, ct: r.ma, loai: 'Thiếu số liệu', text: c.ten_ngan + ' · ' + r.ind.ten_ngan + ': chưa có ' + (isNum(r.kh) || r.ind.huong === 'nhap_ty_le' ? 'số thực hiện' : 'kế hoạch') + '.' });
        else if (isNum(r.ht) && r.ht < ng.cct && r.ts >= 5) out.push({ muc: 3, dv: u.ma, ct: r.ma, loai: 'Hoàn thành thấp', text: c.ten_ngan + ' · ' + r.ind.ten_ngan + ': đạt ' + Math.round(r.ht * 1000) / 10 + '% KH, mất ' + (Math.round(r.mat * 100) / 100) + ' điểm.' });
        if (r.ind.huong === 'thap_tot' && isNum(r.th) && isNum(r.kh) && r.th > r.kh) out.push({ muc: 3, dv: u.ma, ct: r.ma, loai: 'Vượt ngưỡng', text: c.ten_ngan + ' · ' + r.ind.ten_ngan + ' ' + String(r.th).replace('.', ',') + '% vượt mức kế hoạch ' + String(r.kh).replace('.', ',') + '%.' });
      });
      // Điểm giảm liên tiếp
      if (thang > soThang) {
        var giam = true;
        for (var k = 0; k < soThang; k++) {
          var a = self.card(u.ma, nam, thang - k).quy_doi, b = self.card(u.ma, nam, thang - k - 1).quy_doi;
          if (!(isNum(a) && isNum(b) && a < b - 0.05)) { giam = false; break; }
        }
        if (giam) out.push({ muc: 2, dv: u.ma, loai: 'Xu hướng giảm', text: c.ten_ngan + ': điểm KPI giảm ' + soThang + ' tháng liên tiếp.' });
      }
    });
    // Kiểm soát phân giao kế hoạch: KH CN (TSC giao) so với tổng KH đã giao cho các phòng
    this.inds.forEach(function (ind) {
      if (ind.tong_hop_cn !== 'tong') return;
      var cn = self.raw('p', ind.ma, CN, nam, thang); if (cn === null || !cn) return;
      var s = 0, n = 0; self.units.forEach(function (u) { var x = self.raw('p', ind.ma, u.ma, nam, thang); if (x !== null) { s += x; n++; } });
      if (n && s < cn * 0.995) out.push({ muc: 2, ct: ind.ma, loai: 'Phân giao thiếu', text: ind.ten_ngan + ': tổng KH giao các phòng mới bằng ' + Math.round(s / cn * 1000) / 10 + '% KH chi nhánh.' });
    });
    return out.sort(function (a, b) { return b.muc - a.muc; });
  };

  /* Kiểu số để so sánh: 'so_du' (số dư/mức tại thời điểm — so tháng trước, đầu năm, cùng kỳ) · 'luy_ke' (cộng dồn phát sinh trong năm). */
  function kieuSo(ind) {
    if (!ind) return 'so_du';
    if (ind.kieu_so === 'so_du' || ind.kieu_so === 'luy_ke') return ind.kieu_so;
    if (ind.dvt === '%' || ind.huong === 'nhap_ty_le') return 'so_du';
    var t = (ind.ma + ' ' + ind.ten).toLowerCase();
    if (/tăng trưởng|_tt\b|tang|tăng thêm/.test(t)) return 'luy_ke';
    if (/cuoi_ky|cuối kỳ|_bq\b|bình quân|mau\b|kích hoạt|nhận lương|hiện hữu|số dư/.test(t)) return 'so_du';
    return ind.dvt === 'Tr đồng' ? 'luy_ke' : 'so_du';
  }
  /* Số đơn vị có điểm quy đổi >= ngưỡng điểm cao (settings.nguong.diem_cao, mặc định 90). Dùng chung cho mọi giao diện. */
  function demDiemCao(list, diemCao) { var n = 0; (list || []).forEach(function (c) { if (c && isNum(c.quy_doi) && c.quy_doi >= diemCao) n++; }); return n; }
  root.KPI_ENGINE = { sapXepChiTieu: sapXepChiTieu, kieuSo: kieuSo, computeKpi: computeKpi, Model: Model, trangThai: trangThai, demDiemCao: demDiemCao };
})(window);
