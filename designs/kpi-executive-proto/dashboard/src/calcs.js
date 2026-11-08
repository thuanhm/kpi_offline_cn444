/* SINH TỰ ĐỘNG từ calcs.cjs bằng tools/build.mjs — đừng sửa tay. */
dash.calc("cfg", { inputs: ["cau_hinh"], title: "Cấu hình ngưỡng", description: "Ngưỡng Đạt/Khá/Cần cải thiện và ngưỡng điểm cao nguong.diem_cao (D7, mặc định 90). Một nguồn cấu hình cho mọi màn hình.", fn: function (cau_hinh) {
      var o = {}; cau_hinh.forEach(function (r) { o[r.key] = r.value; });
      var n = function (k, d) { var v = Number(o[k]); return o[k] !== undefined && o[k] !== '' && isFinite(v) ? v : d; };
      return { dat: n('nguong.dat', 1), kha: n('nguong.kha', 0.8), cct: n('nguong.cct', 0.7), diem_cao: n('nguong.diem_cao', 90), chi_nhanh: o['chi_nhanh'] || '' };
    } });

dash.calc("kq", { inputs: ["ket_qua","cfg"], title: "Kết quả đã phân loại", description: "Đổi văn bản CSV thành số và gán mức Đạt/Khá/CCT/Chưa đạt/GAP theo ngưỡng cấu hình. GAP = chưa có số thực hiện.", fn: function (ket_qua, cfg) {
      var N = function (x) { if (x === '' || x === null || x === undefined) return null; var v = Number(x); return isFinite(v) ? v : null; };
      var tier = function (ht) { return ht === null ? 'gap' : ht >= cfg.dat ? 'dat' : ht >= cfg.kha ? 'kha' : ht >= cfg.cct ? 'cct' : 'chua'; };
      return ket_qua.map(function (r) {
        var ht = N(r.ht), kh = N(r.kh), th = N(r.th);
        return { thang: +r.thang, dv: r.dv, ct: r.ct, ts: N(r.ts), kh: kh, th: th, ht: ht, th_truoc: N(r.th_truoc), diem: N(r.diem), mat: N(r.mat), tier: tier(ht), gap: th === null || kh === null ? null : th - kh };
      });
    } });

dash.calc("diem_dv", { inputs: ["kq"], title: "Điểm theo đơn vị và tháng", description: "Điểm quy đổi (thang 100) = tổng điểm / tổng trọng số của chỉ tiêu có số × 100; đếm số chỉ tiêu theo mức. Quy tắc minh hoạ của prototype.", fn: function (kq) {
      var g = {}, out = [];
      kq.forEach(function (r) {
        var k = r.dv + '|' + r.thang, o = g[k];
        if (!o) { o = g[k] = { dv: r.dv, thang: r.thang, sd: 0, sts: 0, mat: 0, n: 0, so_dat: 0, so_kha: 0, so_cct: 0, so_chua: 0, so_gap: 0 }; out.push(o); }
        o.n++; if (r.diem !== null) { o.sd += r.diem; o.sts += r.ts; o.mat += r.mat; } o['so_' + r.tier]++;
      });
      out.forEach(function (o) { o.quy_doi = o.sts ? (o.sd / o.sts) * 100 : null; });
      return out;
    } });

dash.calc("xep_hang", { inputs: ["diem_dv","don_vi","cfg"], title: "Xếp hạng đơn vị", description: "Xếp hạng toàn bộ đơn vị theo điểm quy đổi mỗi tháng; hạng kỳ trước, chênh lệch, GAP so mức Đạt, mức và chuỗi điểm.", fn: function (diem_dv, don_vi, cfg) {
      var info = {}; don_vi.forEach(function (d) { info[d.ma] = d; });
      var by = {}, q = {}, series = {}, rankOf = {};
      diem_dv.forEach(function (r) {
        if (r.dv === 'CN') return;
        (by[r.thang] = by[r.thang] || []).push(r); q[r.dv + '|' + r.thang] = r.quy_doi;
        (series[r.dv] = series[r.dv] || [null, null, null, null, null, null, null, null, null, null, null, null])[r.thang - 1] = r.quy_doi;
      });
      var tierOf = function (x) { var h = x / 100; return h >= cfg.dat ? 'dat' : h >= cfg.kha ? 'kha' : h >= cfg.cct ? 'cct' : 'chua'; };
      Object.keys(by).forEach(function (t) {
        by[t].sort(function (a, b) { return b.quy_doi - a.quy_doi || Number(info[a.dv].thu_tu) - Number(info[b.dv].thu_tu); });
        by[t].forEach(function (r, i) { rankOf[r.dv + '|' + t] = i + 1; });
      });
      var out = [];
      Object.keys(by).forEach(function (t) {
        by[t].forEach(function (r) {
          var p = q[r.dv + '|' + (t - 1)], d = info[r.dv], cb = '';
          if (r.quy_doi < cfg.kha * 100) cb = 'Dưới mức Khá'; else if (r.so_chua > 0) cb = r.so_chua + ' chỉ tiêu chưa đạt'; else if (r.so_gap > 0) cb = 'Thiếu số ' + r.so_gap + ' chỉ tiêu';
          out.push({ thang: +t, dv: r.dv, ten_ngan: d.ten_ngan, ten: d.ten, khoi: d.khoi, quy_doi: r.quy_doi, hang: rankOf[r.dv + '|' + t], hang_truoc: rankOf[r.dv + '|' + (t - 1)] || null,
            delta: p === undefined ? null : r.quy_doi - p, gap: r.quy_doi - 100 * cfg.dat, tier: tierOf(r.quy_doi), so_dat: r.so_dat, so_kha: r.so_kha, so_cct: r.so_cct, so_chua: r.so_chua, so_gap: r.so_gap, mat: r.mat, canhbao: cb,
            series: series[r.dv].map(function (v, i) { return i < t ? v : null; }) });
        });
      });
      return out;
    } });

dash.calc("tong_cn", { inputs: ["diem_dv","xep_hang","cfg","du_bao"], title: "Tổng hợp toàn chi nhánh", description: "Điểm KPI CN, thay đổi so kỳ trước, phân bố mức, số đơn vị đạt nguong.diem_cao (>=) và dưới mức Khá, chuỗi 12 tháng, điểm dự kiến (nếu có dữ liệu đầu vào).", fn: function (diem_dv, xep_hang, cfg, du_bao) {
      var cn = {}, ser = [null, null, null, null, null, null, null, null, null, null, null, null], bq = ser.slice(), per = {};
      diem_dv.forEach(function (r) { if (r.dv === 'CN') { cn[r.thang] = r; ser[r.thang - 1] = r.quy_doi; } });
      xep_hang.forEach(function (r) { (per[r.thang] = per[r.thang] || []).push(r); });
      Object.keys(per).forEach(function (t) { bq[t - 1] = per[t].reduce(function (a, r) { return a + r.quy_doi; }, 0) / per[t].length; });
      var tierOf = function (x) { var h = x / 100; return h >= cfg.dat ? 'dat' : h >= cfg.kha ? 'kha' : h >= cfg.cct ? 'cct' : 'chua'; };
      var cut = function (a, t) { return a.map(function (v, i) { return i < t ? v : null; }); };
      return Object.keys(cn).map(function (t) {
        var r = cn[t], pv = cn[t - 1], u = per[t] || [], f = du_bao.filter(function (d) { return d.ct === 'DIEM_CN' && Number(d.thang) === Number(t); })[0];
        var dub = f && f.quy_doi_du_bao !== '' && isFinite(Number(f.quy_doi_du_bao)) ? Number(f.quy_doi_du_bao) : null;
        return { thang: +t, quy_doi: r.quy_doi, quy_doi_truoc: pv ? pv.quy_doi : null, delta: pv ? r.quy_doi - pv.quy_doi : null, tier: tierOf(r.quy_doi),
          so_dat: r.so_dat, so_kha: r.so_kha, so_cct: r.so_cct, so_chua: r.so_chua, so_gap: r.so_gap, so_ct: r.n, so_dv: u.length, tb_dv: bq[t - 1],
          dv_cao: u.filter(function (x) { return x.quy_doi >= cfg.diem_cao; }).length, dv_duoi_kha: u.filter(function (x) { return x.quy_doi < cfg.kha * 100; }).length, diem_cao: cfg.diem_cao,
          series_cn: cut(ser, +t), series_bq: cut(bq, +t), du_bao: dub };
      });
    } });

dash.calc("ct_cn", { inputs: ["kq","chi_tieu","du_bao","moc_cn"], title: "Chỉ tiêu toàn chi nhánh", description: "Chỉ tiêu CN theo tháng: thực hiện, kế hoạch, %HT, GAP, mức, tăng trưởng so tháng trước / cùng kỳ / đầu năm, và dự kiến (chỉ khi có dữ liệu dự kiến đầu vào).", fn: function (kq, chi_tieu, du_bao, moc_cn) {
      var N = function (x) { if (x === '' || x === null || x === undefined) return null; var v = Number(x); return isFinite(v) ? v : null; };
      var ctm = {}, key = {}, db = {}, mc = {}, out = [];
      chi_tieu.forEach(function (c) { ctm[c.ma] = c; });
      kq.forEach(function (r) { if (r.dv === 'CN') key[r.thang + '|' + r.ct] = r; });
      du_bao.forEach(function (d) { db[d.thang + '|' + d.ct] = d; });
      moc_cn.forEach(function (m) { mc[m.thang + '|' + m.ct] = m; });
      kq.forEach(function (r) {
        if (r.dv !== 'CN') return;
        var c = ctm[r.ct], p = key[(r.thang - 1) + '|' + r.ct], d = db[r.thang + '|' + r.ct], m = mc[r.thang + '|' + r.ct], mom = null, momU = '', yoy = null, ytd = null;
        if (p && r.th !== null && p.th !== null) {
          if (c.kieu === 'so_du') { mom = p.th ? (r.th / p.th - 1) * 100 : null; momU = '%'; }
          else if (c.kieu === 'luy_ke') { var p2 = key[(r.thang - 2) + '|' + r.ct], fl = r.th - p.th, fl0 = p2 && p2.th !== null ? p.th - p2.th : p.th; mom = fl0 ? (fl / fl0 - 1) * 100 : null; momU = '%'; }
          else { mom = r.th - p.th; momU = 'điểm %'; }
        }
        if (m && r.th !== null) { var a = N(m.th_cung_ky_nam_truoc), b = N(m.moc_dau_nam); if (a) yoy = (r.th / a - 1) * 100; if (b) ytd = (r.th / b - 1) * 100; }
        out.push({ thang: r.thang, ct: r.ct, ten_ngan: c.ten_ngan, ten: c.ten, dvt: c.dvt, nhom: c.nhom, huong: c.huong, kieu: c.kieu, hien_tq: c.hien_tq === '1', thu_tu: Number(c.thu_tu),
          ts: r.ts, kh: r.kh, th: r.th, ht: r.ht, ht_truoc: p ? p.ht : null, th_truoc: p ? p.th : null, tier: r.tier, gap: r.gap, mat: r.mat, mom: mom, mom_u: momU, yoy: yoy, ytd: ytd,
          ht_du_bao: d && d.ht_du_bao !== '' ? Number(d.ht_du_bao) : null, ket_luan: d ? d.ket_luan : '', can_moi_thang: d ? N(d.can_moi_thang) : null });
      });
      return out;
    } });

dash.calc("mat_diem", { inputs: ["kq","don_vi","chi_tieu"], title: "Điểm mất theo đơn vị–chỉ tiêu", description: "Các dòng đơn vị–chỉ tiêu có mất điểm (> 0,005), sắp xếp giảm dần theo điểm mất.", fn: function (kq, don_vi, chi_tieu) {
      var dm = {}, cm = {}; don_vi.forEach(function (d) { dm[d.ma] = d; }); chi_tieu.forEach(function (c) { cm[c.ma] = c; });
      return kq.filter(function (r) { return r.dv !== 'CN' && r.mat !== null && r.mat > 0.005; })
        .map(function (r) { return { thang: r.thang, dv: r.dv, ct: r.ct, mat: r.mat, ht: r.ht, tier: r.tier, ten_dv: dm[r.dv].ten_ngan, ten_ct: cm[r.ct].ten_ngan }; })
        .sort(function (a, b) { return b.mat - a.mat; });
    } });

dash.calc("hd_tt", { inputs: ["hanh_dong","ky"], title: "Trạng thái nhiệm vụ", description: "Nhiệm vụ/đề xuất hành động kèm cờ quá hạn: chưa xong và hạn nhỏ hơn ngày lập báo cáo của kỳ.", fn: function (hanh_dong, ky) {
      var ng = {}; ky.forEach(function (k) { ng[k.thang] = k.ngay_lap; });
      return hanh_dong.map(function (h) { return { id: h.id, thang: Number(h.thang), van_de: h.van_de, de_xuat: h.de_xuat, dv: h.dv, ct: h.ct, nguoi: h.nguoi, han: h.han, trang_thai: h.trang_thai, muc: Number(h.muc), qua_han: h.trang_thai !== 'xong' && h.han < ng[h.thang] }; });
    } });
