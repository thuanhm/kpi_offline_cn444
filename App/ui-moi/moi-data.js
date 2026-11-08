/* MOI-DATA — lớp dữ liệu THUẦN của giao diện mới (không đụng DOM). Chỉ ĐỌC kết quả của STORE.model() / KPI_ENGINE;
 * KHÔNG tự tính điểm, %HT, hạng hay mức. Mọi con số hiển thị đều lấy nguyên từ engine — nên giao diện cũ và mới luôn khớp nhau.
 * Việc duy nhất ở đây là chọn/sắp xếp/đổi tên trường cho dễ vẽ, và ánh xạ chuỗi trạng thái của engine sang mã mức (dat/kha/cct/chua/gap). */
(function (root) {
  var E = root.KPI_ENGINE, CFG = root.KPI_CFG, CN = CFG.MA_CN, TT = CFG.TRANG_THAI;
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  /* Chỉ tiêu ưu tiên hiển thị thành thẻ KPI (theo MÃ có trong danh mục; mã không tồn tại thì bỏ qua — không bịa chỉ tiêu). */
  var UU_TIEN = ['NII', 'THU_NGOAI_LAI', 'DU_NO_CUOI_KY', 'NGUON_VON_CUOI_KY', 'CASA_CUOI_KY', 'TY_LE_NO_XAU', 'DU_NO_TT', 'NGUON_VON_TT', 'THU_NO_XLRR', 'VBI', 'MANULIFE'];

  /* Chuỗi trạng thái của engine → mã mức dùng cho màu/biểu tượng. Thiếu số, không áp dụng, thiếu cấu hình → 'gap'. */
  function tierTT(tt) { return tt === TT.DAT ? 'dat' : tt === TT.KHA ? 'kha' : tt === TT.CCT ? 'cct' : tt === TT.CHUA_DAT ? 'chua' : 'gap'; }
  /* Mức của một điểm/%HT chung (dùng chính E.trangThai với ngưỡng cấu hình M.ng) */
  function tierHt(M, ht) { return isNum(ht) ? tierTT(E.trangThai(ht, M.ng)) : 'gap'; }

  function rowVM(r) {
    var i = r.ind || {};
    return { ma: r.ma, ten: i.ten || r.ma, ten_ngan: i.ten_ngan || i.ten || r.ma, nhom: i.nhom || '', dvt: i.dvt || '', huong: i.huong, tham_khao: !!i.chi_tham_khao, thu_tu: i.thu_tu || 0,
      kh: r.kh, th: r.th, gap: r.gap, ht: r.ht, tier: tierTT(r.tt), tt: r.tt, ts: r.ts, diem: r.diem, mat: r.mat, ht_nam: r.ht_nam, th_truoc: r.th_truoc, kh_nam: r.kh_nam, ind: i };
  }
  function cardRows(card) { return card.rows.concat(card.ref).filter(function (r) { return r.ind && r.ind.trang_thai !== 'inactive'; }); }

  /* Xếp hạng toàn bộ đơn vị — lấy nguyên thứ tự/hạng của M.ranking (không xếp lại) */
  function rank(M, nam, thang, khoi) {
    return M.ranking(nam, thang, khoi || null).map(function (c) {
      var pv = thang > 1 ? M.card(c.ma, nam, thang - 1) : null;
      return { ma: c.ma, hang: c.hang, hang_truoc: c.hang_truoc, ten: c.ten_ngan, ten_day_du: c.ten, khoi: c.khoi, diem: c.quy_doi, ht: c.ht_chung,
        gap: isNum(c.quy_doi) ? c.quy_doi - 100 * M.ng.dat : null, tier: tierHt(M, c.ht_chung),
        delta: pv && isNum(pv.quy_doi) && isNum(c.quy_doi) ? c.quy_doi - pv.quy_doi : null, series: M.scoreSeries(c.ma, nam),
        canhbao: c.so_chua > 0 ? c.so_chua + ' chỉ tiêu chưa đạt' : (c.so_thieu > 0 ? 'Thiếu số ' + c.so_thieu + ' chỉ tiêu' : ''), co_so: c.co_so, card: c };
    });
  }

  /* Chọn n chỉ tiêu cho dải thẻ KPI: mã ưu tiên có trong danh mục, rồi bù theo thứ tự danh mục; chỉ lấy chỉ tiêu được phép hiển thị tổng quan */
  function kpiChinh(cn, n) {
    var all = cardRows(cn).filter(function (r) { return r.ind.hien_tq !== false; }), by = {}, out = [];
    all.forEach(function (r) { by[r.ma] = r; });
    UU_TIEN.forEach(function (m) { if (by[m] && out.length < n) out.push(by[m]); });
    all.slice().sort(function (a, b) { return (a.ind.thu_tu || 0) - (b.ind.thu_tu || 0); }).forEach(function (r) { if (out.length < n && out.indexOf(r) < 0) out.push(r); });
    return out.map(rowVM);
  }

  function avgSeries(M, nam) {
    var out = [];
    for (var t = 0; t < 12; t++) {
      var s = 0, n = 0; M.units.forEach(function (u) { var v = M.scoreSeries(u.ma, nam)[t]; if (isNum(v)) { s += v; n++; } });
      out.push(n ? s / n : null);
    }
    return out;
  }
  /* Dự kiến điểm CN cuối năm — CHỈ khi hàm dự báo SẴN CÓ của hệ thống (duBaoXepHang) trả về số; không tự suy diễn */
  function duBaoCn(M, nam, thang) {
    try { var X = M.duBaoXepHang ? M.duBaoXepHang(nam, thang) : null; return { X: X, diem: X && X.cn && isNum(X.cn.quy_doi_du_bao) ? X.cn.quy_doi_du_bao : null }; } catch (e) { return { X: null, diem: null }; }
  }

  function tongQuan(M, ky) {
    var nam = ky.nam, thang = ky.thang, cn = M.card(CN, nam, thang), prev = thang > 1 ? M.card(CN, nam, thang - 1) : null, rk = rank(M, nam, thang, null), al = M.alerts(nam, thang), ng = M.ng;
    var du = duBaoCn(M, nam, thang), cards = rk.map(function (r) { return r.card; });
    return { cn: cn, prev: prev, co_so: cn.co_so || rk.some(function (r) { return r.co_so; }), tier: tierHt(M, cn.ht_chung),
      delta: prev && isNum(prev.quy_doi) && isNum(cn.quy_doi) ? cn.quy_doi - prev.quy_doi : null,
      counts: { dat: cn.so_dat, kha: cn.so_kha, cct: cn.so_cct, chua: cn.so_chua, gap: cn.so_thieu }, rk: rk, alerts: al,
      stats: { diem_cao: ng.diem_cao, cao: E.demDiemCao(cards, ng.diem_cao), so_dv: rk.length,
        duoi_kha: cards.filter(function (c) { return isNum(c.quy_doi) && c.quy_doi < ng.kha * 100; }).length, can_chu_y: cn.so_cct + cn.so_chua, canh_bao3: al.filter(function (a) { return a.muc === 3; }).length },
      series_cn: M.scoreSeries(CN, nam), series_bq: avgSeries(M, nam), du_bao: du.diem, X: du.X, kpi: kpiChinh(cn, 8), rows: cardRows(cn).map(rowVM) };
  }

  /* Các dòng đơn vị × chỉ tiêu có mất điểm (cho "đơn vị kéo giảm") — lấy từ card của từng đơn vị */
  function matDonVi(M, nam, thang) {
    var out = [];
    M.ranking(nam, thang, null).forEach(function (c) { if (!c.co_so) return; c.rows.forEach(function (r) { if (isNum(r.mat) && r.mat > 0.005) out.push({ dv: c.ma, ten_dv: c.ten_ngan, ct: r.ma, ten_ct: r.ind.ten_ngan || r.ind.ten, mat: r.mat, ht: r.ht, tier: tierTT(r.tt) }); }); });
    return out.sort(function (a, b) { return b.mat - a.mat; });
  }

  root.MOI_DATA = { UU_TIEN: UU_TIEN, isNum: isNum, tierTT: tierTT, tierHt: tierHt, rowVM: rowVM, cardRows: cardRows, rank: rank, kpiChinh: kpiChinh, avgSeries: avgSeries, duBaoCn: duBaoCn, tongQuan: tongQuan, matDonVi: matDonVi };
})(window);
