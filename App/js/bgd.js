/* ĐIỂM KPI BAN GIÁM ĐỐC — hàm thuần mở rộng KPI_ENGINE.Model (không đọc DOM).
 * Mỗi thành viên BGĐ có bảng KPI riêng (state.bgd_trong_so): chỉ tiêu, trọng số, % tối đa và NGUỒN SỐ:
 *   'cn'        — dùng số của toàn chi nhánh (Giám đốc; hoặc chỉ tiêu dùng chung của Phó giám đốc)
 *   'phu_trach' — tổng hợp số của các phòng/PGD mà thành viên phụ trách (state.bgd[].phu_trach) theo cách tổng hợp của chỉ tiêu:
 *                 'tong' = cộng · 'tb' / 'nhap' = bình quân. Thiếu số của BẤT KỲ đơn vị phụ trách (có áp dụng chỉ tiêu) → chỉ tiêu thiếu số, 0 điểm, giống thẻ điểm đơn vị.
 * Chấm điểm bằng đúng computeKpi (%HT, trần %tối đa, ngưỡng Đạt/Khá/CCT) như thẻ điểm phòng/PGD. Cộng/trừ điểm KPI lưu trong state.diem_kpi với dv = 'BGD:<mã>'. */
(function (root) {
  var E = root.KPI_ENGINE, P = E.Model.prototype, CN = root.KPI_CFG.MA_CN, TT = root.KPI_CFG.TRANG_THAI, computeKpi = E.computeKpi;
  var TIEN_TO = 'BGD:', MA_DIEM_CN = 'DIEM_KPI_CN';
  /* Chỉ tiêu ảo "Điểm KPI chi nhánh": thực hiện = điểm quy đổi (thang 100) của thẻ điểm toàn chi nhánh cùng kỳ; %HT = điểm / 100; không có kế hoạch. */
  var IND_DIEM_CN = { ma: MA_DIEM_CN, ten: 'Điểm KPI chi nhánh', ten_ngan: 'Điểm KPI CN', dvt: 'điểm', nhom: 'Điểm KPI chi nhánh', huong: 'nhap_ty_le', tong_hop_cn: 'nhap', chi_tham_khao: false, trang_thai: 'active', ao: true };
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function r2(x) { return Math.round(x * 100) / 100; }

  /* Bảng KPI mẫu từ trọng số khối CN: Giám đốc dùng số chi nhánh; Phó giám đốc dùng tổng phòng phụ trách, riêng chỉ tiêu chỉ nhập tay ở cấp CN thì dùng số chi nhánh. */
  function mau(state) {
    var inds = {}; state.indicators.forEach(function (i) { inds[i.ma] = i; });
    var wCn = state.weights.filter(function (w) { return w.khoi === CN && inds[w.ma_chi_tieu] && !inds[w.ma_chi_tieu].chi_tham_khao && w.trong_so > 0; });
    var ds = state.don_vi.filter(function (u) { return u.trang_thai !== 'inactive'; }), kd = ds.filter(function (u) { return u.khoi === 'KHDN' || u.khoi === 'HT'; }).map(function (u) { return u.ma; }),
      kc = ds.filter(function (u) { return u.khoi === 'KHCN' || u.khoi === 'PGD'; }).map(function (u) { return u.ma; });
    var bgd = [{ ma: 'GD', ho_ten: '', chuc_danh: 'Giám đốc', phu_trach: [], thu_tu: 1, trang_thai: 'active' },
      { ma: 'PGD1', ho_ten: '', chuc_danh: 'Phó giám đốc', phu_trach: kd, thu_tu: 2, trang_thai: 'active' },
      { ma: 'PGD2', ho_ten: '', chuc_danh: 'Phó giám đốc', phu_trach: kc, thu_tu: 3, trang_thai: 'active' }], ts = [];
    bgd.forEach(function (m) {
      wCn.forEach(function (w) { ts.push({ ma_bgd: m.ma, ma_chi_tieu: w.ma_chi_tieu, trong_so: w.trong_so, toi_da: w.toi_da || 1.3, nguon: m.ma === 'GD' || inds[w.ma_chi_tieu].tong_hop_cn === 'nhap' ? 'cn' : 'phu_trach' }); });
    });
    return { bgd: bgd, bgd_trong_so: ts };
  }

  P.bgdDs = function (kemNgung) {
    return (this.s.bgd || []).filter(function (m) { return kemNgung || m.trang_thai !== 'inactive'; }).sort(function (a, b) { return (a.thu_tu || 0) - (b.thu_tu || 0); });
  };
  P.bgdMap = function () { var m = {}; (this.s.bgd || []).forEach(function (x) { m[x.ma] = x; }); return m; };
  P.bgdTrongSo = function (ma) {
    var self = this;
    return (this.s.bgd_trong_so || []).filter(function (w) { return w.ma_bgd === ma && (w.ma_chi_tieu === MA_DIEM_CN || (self.indMap[w.ma_chi_tieu] && !self.indMap[w.ma_chi_tieu].chi_tham_khao)); });
  };

  /* Tổng hợp số của các đơn vị phụ trách cho 1 chỉ tiêu. → { v, ap: [đơn vị có áp dụng], thieu: [đơn vị chưa có số] } */
  function tongHop(M, k, ind, dvs, nam, thang) {
    var ap = dvs.filter(function (u) { return M.apDung(ind.ma, u); }), thieu = [], s = 0;
    ap.forEach(function (u) { var x = M.raw(k, ind.ma, u, nam, thang); if (x === null) thieu.push(u); else s += x; });
    if (!ap.length || thieu.length) return { v: null, ap: ap, thieu: thieu };
    return { v: ind.tong_hop_cn === 'tong' ? s : s / ap.length, ap: ap, thieu: [] };
  }
  P.bgdSo = function (k, ind, m, nguon, nam, thang) {
    if (thang < 1) return { v: null, ap: [], thieu: [] };
    if (nguon !== 'phu_trach') return { v: this.val(k, ind.ma, CN, nam, thang), ap: [], thieu: [] };
    var dvs = (m.phu_trach || []).filter(function (u) { return this.unitMap[u]; }, this);
    return tongHop(this, k, ind, dvs, nam, thang);
  };

  /* Thẻ điểm của 1 thành viên BGĐ tại 1 kỳ — cùng hình dạng với Model.card() để dùng chung cách hiển thị. */
  P.cardBgd = function (ma, nam, thang) {
    var key = 'bgd|' + ma + '|' + nam + '|' + thang; if (this.cache[key]) return this.cache[key];
    var self = this, m = this.bgdMap()[ma]; if (!m) return null;
    var rows = [], tong = { diem: 0, ts: 0, dat: 0, kha: 0, cct: 0, chua: 0, thieu: 0 };
    this.bgdTrongSo(ma).forEach(function (w) {
      var ao = w.ma_chi_tieu === MA_DIEM_CN, ind = ao ? IND_DIEM_CN : self.indMap[w.ma_chi_tieu], nguon = ao || w.nguon !== 'phu_trach' ? 'cn' : 'phu_trach', kh, th, khNam, tt1;
      if (ao) {
        var dn = self.card(CN, nam, thang), dt = thang > 1 ? self.card(CN, nam, thang - 1) : null;
        kh = { v: null, ap: [], thieu: [] }; th = { v: dn.co_so && isNum(dn.quy_doi) ? dn.quy_doi : null, ap: [], thieu: [] }; khNam = null; tt1 = dt && dt.co_so && isNum(dt.quy_doi) ? dt.quy_doi : null;
      } else {
        kh = self.bgdSo('p', ind, m, nguon, nam, thang); th = self.bgdSo('a', ind, m, nguon, nam, thang); khNam = self.bgdSo('p', ind, m, nguon, nam, 12).v; tt1 = self.bgdSo('a', ind, m, nguon, nam, thang - 1).v;
      }
      var ts = +w.trong_so || 0, toiDa = +w.toi_da || 1.3;
      var r = computeKpi({ kh: kh.v, th: th.v, ts: ts, toi_da: toiDa, huong: ind.huong, ap_dung: true, nguong: self.ng, tran_100: ind.dvt === '%' && ind.huong === 'cao_tot' });
      var thieu = (th.thieu || []).concat(kh.thieu || []).filter(function (u, i, a) { return a.indexOf(u) === i; });
      rows.push({ ind: ind, ma: ind.ma, kh: kh.v, th: th.v, gap: r.gap, ht: r.ht, ts: ts, toi_da: toiDa, diem: r.diem, mat: r.mat, tt: r.tt, kh_nam: khNam,
        ht_nam: (ind.huong === 'cao_tot' && isNum(th.v) && isNum(khNam) && khNam) ? th.v / khNam : null, th_truoc: tt1, nguon: nguon, don_vi_ap: th.ap || [], thieu: thieu });
      tong.ts += ts; tong.diem += isNum(r.diem) ? r.diem : 0;
      if (r.tt === TT.DAT) tong.dat++; else if (r.tt === TT.KHA) tong.kha++; else if (r.tt === TT.CCT) tong.cct++; else if (r.tt === TT.CHUA_DAT) tong.chua++; else tong.thieu++;
    });
    var dsDc = (this.s.diem_kpi || []).filter(function (x) {
      if (x.xoa || String(x.dv) !== TIEN_TO + ma || Number(x.nam) !== Number(nam)) return false;
      var tu = Number(x.thang) || 1, den = Number(x.thang_den || x.thang) || tu; return thang >= tu && thang <= den;
    });
    var dc = r2(dsDc.reduce(function (a, x) { return a + (Number(x.diem) || 0); }, 0));
    var goc = tong.ts ? r2(tong.diem / tong.ts * 100) : null, qd = goc !== null ? Math.max(0, r2(goc + dc)) : (dc !== 0 ? dc : null);
    var ten = (m.chuc_danh || 'BGĐ') + (m.ho_ten ? ' ' + m.ho_ten : '');
    var out = { ma: ma, ma_dc: TIEN_TO + ma, bgd: m, ten: ten, ten_ngan: m.ho_ten || m.chuc_danh || ma, khoi: 'BGD', nam: nam, thang: thang, rows: rows, ref: [],
      diem_goc: tong.diem, quy_doi_goc: goc, dc_diem: dc, ds_dc_diem: dsDc, diem: tong.diem, ts: tong.ts, ht_chung: qd !== null ? qd / 100 : null, quy_doi: qd,
      so_dat: tong.dat, so_kha: tong.kha, so_cct: tong.cct, so_chua: tong.chua, so_thieu: tong.thieu, so_ct: rows.length,
      co_so: rows.some(function (r) { return isNum(r.th); }) || dsDc.length > 0, phu_trach: (m.phu_trach || []).filter(function (u) { return self.unitMap[u]; }) };
    return (this.cache[key] = out);
  };
  P.scoreSeriesBgd = function (ma, nam) {
    var out = [];
    for (var t = 1; t <= 12; t++) {
      var co = this.periods.some(function (p) { return p.nam === nam && p.thang === t; }), c = co ? this.cardBgd(ma, nam, t) : null;
      out.push(c && c.co_so ? c.quy_doi : null);
    }
    return out;
  };
  P.bgdTongHop = function (nam, thang) { var self = this; return this.bgdDs().map(function (m) { return self.cardBgd(m.ma, nam, thang); }).filter(Boolean); };

  /* Kiểm tra cấu hình: trả danh sách cảnh báo (chuỗi) để hiển thị ở màn quản trị. */
  P.bgdKiemTra = function () {
    var self = this, out = [], phu = {};
    this.bgdDs().forEach(function (m) {
      var ws = self.bgdTrongSo(m.ma), ts = ws.reduce(function (a, w) { return a + (+w.trong_so || 0); }, 0), ten = (m.chuc_danh || '') + (m.ho_ten ? ' ' + m.ho_ten : '') || m.ma;
      if (!ws.length) out.push(ten + ': chưa khai báo bảng KPI (chỉ tiêu, trọng số).');
      else if (Math.abs(ts - 100) > 0.001) out.push(ten + ': tổng trọng số ' + r2(ts) + ' (khác 100; điểm vẫn quy đổi về thang 100).');
      var pt = (m.phu_trach || []).filter(function (u) { return self.unitMap[u]; });
      if (ws.some(function (w) { return w.nguon === 'phu_trach'; }) && !pt.length) out.push(ten + ': có chỉ tiêu lấy số theo phòng phụ trách nhưng chưa khai báo phòng phụ trách.');
      (m.phu_trach || []).forEach(function (u) { if (!self.unitMap[u]) out.push(ten + ': đơn vị phụ trách "' + u + '" không còn trong danh mục.'); phu[u] = (phu[u] || 0) + 1; });
    });
    return out;
  };
  E.bgdMau = mau; E.BGD_TIEN_TO = TIEN_TO; E.BGD_MA_DIEM_CN = MA_DIEM_CN; E.BGD_IND_DIEM_CN = IND_DIEM_CN;
})(window);
