/* BÁO CÁO GIAO BAN — lớp tính THUẦN cho đối tượng chấm là PHÒNG/PGD và TOÀN CHI NHÁNH.
 * Nguyên tắc:
 *   - KHÔNG có công thức KPI thứ hai: %HT / điểm / trạng thái lấy từ KPI_ENGINE.Model.card().
 *   - Hệ thống chỉ nêu HIỆN TƯỢNG + SỐ LIỆU + CÂU HỎI; nguyên nhân do người lập báo cáo chọn. Không dự báo. Không đặt ngưỡng mới: dùng ngưỡng Đạt/Khá/Cần cải thiện của Cài đặt.
 *   - Mọi vấn đề quan trọng đều được nêu (không cắt số lượng); vấn đề chưa đánh giá vẫn vào báo cáo, bác bỏ thì chuyển vào phụ lục.
 *   - Báo cáo đọc số từ SNAPSHOT đã chụp → bản đã Hoàn thiện không đổi khi số KPI đổi. Vòng đời: nháp → hoàn thiện → đã thay thế.
 * Đối tượng báo cáo: dv = 'CN' (toàn chi nhánh) hoặc mã phòng/PGD. Mô hình tài liệu taiLieu(bc) là nguồn chung cho Xem trước, In/PDF và Word. */
(function (root) {
  var ENG = root.KPI_ENGINE, CFG = root.KPI_CFG, CH = root.KPI_BAO_CAO_CAU_HOI;
  var CN = (CFG && CFG.MA_CN) || 'CN', SCHEMA = 1, EPS = 1e-9;
  var TRANG_THAI = { nhap: 'Nháp', hoan_thien: 'Hoàn thiện', thay_the: 'Đã thay thế' };
  var DANH_GIA = { chua: 'Chưa đánh giá', xac_nhan: 'Đã xác nhận', bac_bo: 'Đã bác bỏ', kiem_tra: 'Cần kiểm tra thêm' };
  var MUC = { cao: 'Cao', tb: 'Trung bình', thap: 'Thấp' };
  var NGUON = { kpi: 'Chỉ tiêu KPI', du_lieu: 'Dữ liệu', don_vi: 'Đơn vị', phan_giao: 'Phân giao kế hoạch', nguoi_lap: 'Người lập bổ sung', ky_truoc: 'Theo dõi từ kỳ trước' };
  var LOAI_KY = { thang: 'Tháng', quy: 'Quý', nam: 'Năm' };
  var LOAI_SO = { lien_truoc: 'Kỳ liền trước', cung_ky: 'Cùng kỳ năm trước', dau_nam: 'Đầu năm (31/12 năm trước)', khong: 'Không so sánh' };
  var NH_TITLE = { tong_quan: 'Tình hình chung', tich_cuc: 'Kết quả tích cực', quan_tam: 'Chỉ tiêu cần quan tâm', rui_ro: 'Rủi ro, biến động' };

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function cuoiThang(nam, thang) { return iso(new Date(nam, thang, 0)); }
  function dm(s) { return s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : ''; }
  function nf(v, d) { if (!isNum(v)) return '–'; var t = Math.abs(v).toLocaleString('vi-VN', { minimumFractionDigits: d || 0, maximumFractionDigits: d === undefined ? 2 : d }); return (v < 0 ? '−' : '') + t; }
  function pct(v) { return isNum(v) ? (v * 100).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%' : '–'; }
  function sg(v, d) { return isNum(v) ? (v > 0 ? '+' : '') + nf(v, d) : '–'; }

  /* ---------- KỲ ---------- */
  /* ref: { nam, thang, quy } → ky { loai, nam, thang (tháng dùng số KPI), quy, nhan, ghi_chu[] } */
  function kyTuLoai(M, loai, ref) {
    ref = ref || {};
    var nam = +ref.nam || (M.kyMoiNhat() || {}).nam || new Date().getFullYear(), co = M.thangCoSo(nam), cuoiCo = co.length ? co[co.length - 1] : null;
    var k = { loai: loai, nam: nam, thang: null, quy: null, nhan: '', ghi_chu: [] };
    if (loai === 'quy') {
      var q = +ref.quy || Math.ceil((cuoiCo || 1) / 3), cuoi = q * 3, trong = co.filter(function (m) { return m > cuoi - 3 && m <= cuoi; });
      k.quy = q; k.thang = trong.length ? trong[trong.length - 1] : cuoi; k.nhan = 'Quý ' + q + '/' + nam;
      if (k.thang < cuoi) k.ghi_chu.push('Quý chưa đủ tháng: số KPI lấy đến hết tháng ' + pad(k.thang) + '/' + nam + '.');
    } else if (loai === 'nam') {
      k.thang = cuoiCo || 12; k.nhan = 'Năm ' + nam;
      if (k.thang < 12) k.ghi_chu.push('Năm chưa kết thúc: số KPI lũy kế đến hết tháng ' + pad(k.thang) + '/' + nam + '.');
    } else { k.loai = 'thang'; k.thang = +ref.thang || cuoiCo || 1; k.nhan = 'Tháng ' + pad(k.thang) + '/' + nam; }
    if (co.indexOf(k.thang) < 0) k.ghi_chu.push('Tháng ' + pad(k.thang) + '/' + nam + ' chưa có số thực hiện.');
    return k;
  }
  /* Kỳ so sánh → { loai, nam, thang, nhan } | null. Tháng của kỳ so luôn CÙNG VỊ TRÍ với kỳ chính (so cùng loại số). */
  function kySo(ky, loai) {
    if (!ky || !loai || loai === 'khong') return null;
    var o = { loai: loai, nam: ky.nam, thang: null, nhan: '' };
    if (loai === 'dau_nam') { o.nam = ky.nam - 1; o.thang = 12; o.nhan = '31/12/' + o.nam; return o; }
    if (ky.loai === 'thang') {
      if (loai === 'lien_truoc') { o.thang = ky.thang === 1 ? 12 : ky.thang - 1; o.nam = ky.thang === 1 ? ky.nam - 1 : ky.nam; } else { o.thang = ky.thang; o.nam = ky.nam - 1; }
      o.nhan = 'T' + pad(o.thang) + '/' + o.nam;
    } else if (ky.loai === 'quy') {
      if (loai === 'lien_truoc') { var q = ky.quy === 1 ? 4 : ky.quy - 1; o.nam = ky.quy === 1 ? ky.nam - 1 : ky.nam; o.thang = q * 3; o.nhan = 'Quý ' + q + '/' + o.nam; }
      else { o.nam = ky.nam - 1; o.thang = ky.thang; o.nhan = 'Quý ' + ky.quy + '/' + o.nam + ' (đến T' + pad(o.thang) + ')'; }
    } else {
      o.nam = ky.nam - 1; o.thang = loai === 'lien_truoc' ? 12 : ky.thang; o.nhan = loai === 'lien_truoc' ? 'Năm ' + o.nam : 'Cùng kỳ ' + o.nam + ' (đến T' + pad(o.thang) + ')';
    }
    return o;
  }
  /* Có so được số của kỳ so với kỳ chính không? Số lũy kế bắt đầu lại từ 0 mỗi năm → không so với năm trước, trừ "cùng kỳ". */
  function soDuoc(kieu, ky, ks) {
    if (!ks) return { ok: false, ly_do: '' };
    if (kieu === 'luy_ke' && ks.nam !== ky.nam && ks.loai !== 'cung_ky') return { ok: false, ly_do: 'Số lũy kế tính lại từ đầu mỗi năm — không so với năm trước (chọn "Cùng kỳ năm trước").' };
    return { ok: true };
  }
  function tenDv(M, dv) { return dv === CN ? 'Toàn chi nhánh' : ((M.unitMap[dv] || {}).ten || dv); }

  /* ---------- CHỤP SỐ ---------- */
  function chupSo(M, o) {
    var dv = o.dv, ky = o.ky, ks = o.ks && o.ks.thang ? o.ks : null, nam = ky.nam, th = ky.thang, luc = o.luc || new Date().toISOString();
    var c = M.card(dv, nam, th), cs = ks ? M.card(dv, ks.nam, ks.thang) : null, ng = M.ng, st = o.state;
    var snap = { chup_luc: luc, nguon: { updated_at: (st && st.cap_nhat_luc) || null }, dv: dv, ten_dv: tenDv(M, dv), ten_chi_nhanh: (st && st.settings && st.settings.ten_chi_nhanh) || '', kpi: [], don_vi: {}, xu_huong: {}, canh_bao_ky: (ky.ghi_chu || []).slice(),
      nguong: { dat: ng.dat, kha: ng.kha, cct: ng.cct }, khoi: c.khoi };
    var soMap = {}; if (cs) cs.rows.concat(cs.ref).forEach(function (r) { soMap[r.ma] = r; });
    var cards = dv === CN ? M.units.map(function (u) { return M.card(u.ma, nam, th); }) : [];
    c.rows.concat(c.ref).forEach(function (r) {
      var ind = r.ind, kieu = ENG.kieuSo(ind), sd = soDuoc(kieu, ky, ks), rs = soMap[r.ma], thS = rs && isNum(rs.th) ? rs.th : null;
      snap.kpi.push({ ma: r.ma, ten: ind.ten, ten_ngan: ind.ten_ngan || ind.ten, nhom: ind.nhom || '', nhom_nv: CH.nhomCua(ind), dvt: ind.dvt || '', huong: ind.huong || 'cao_tot', kieu_so: kieu, tham_khao: !!ind.chi_tham_khao,
        kh: isNum(r.kh) ? r.kh : null, th: isNum(r.th) ? r.th : null, ht: isNum(r.ht) ? r.ht : null, gap: isNum(r.gap) ? r.gap : null, diem: isNum(r.diem) ? r.diem : null, trong_so: isNum(r.ts) ? r.ts : null, mat_diem: isNum(r.mat) ? r.mat : null, trang_thai: r.tt || '',
        so: { th: sd.ok ? thS : null, delta: sd.ok && isNum(thS) && isNum(r.th) ? r.th - thS : null, delta_pt: sd.ok && isNum(thS) && thS !== 0 && isNum(r.th) ? (r.th - thS) / Math.abs(thS) : null, ghi_chu: !ks ? '' : !sd.ok ? sd.ly_do : !isNum(thS) ? 'Kỳ so chưa có số.' : '' },
        kh_nam: isNum(r.kh_nam) ? r.kh_nam : null, ht_nam: isNum(r.ht_nam) ? r.ht_nam : null, tg: th / 12, dc: isNum(r.dc) && r.dc ? r.dc : null });
      var ser = M.indSeries(r.ma, dv, nam).ht.slice(0, th); snap.xu_huong[r.ma] = ser.map(function (x) { return isNum(x) ? x : null; });
      if (dv === CN) snap.don_vi[r.ma] = cards.map(function (cd) { var x = cd.rows.concat(cd.ref).filter(function (y) { return y.ma === r.ma; })[0]; return x ? { ma: cd.ma, ten: cd.ten_ngan, khoi: cd.khoi, kh: isNum(x.kh) ? x.kh : null, th: isNum(x.th) ? x.th : null, ht: isNum(x.ht) ? x.ht : null } : null; }).filter(Boolean);
    });
    snap.tong = { quy_doi: c.quy_doi, quy_doi_goc: c.quy_doi_goc, dc_diem: c.dc_diem, diem: c.diem, ts: c.ts, ht_chung: c.ht_chung, so_dat: c.so_dat, so_kha: c.so_kha, so_cct: c.so_cct, so_chua: c.so_chua, so_thieu: c.so_thieu, so_ct: c.so_ct, co_so: c.co_so };
    var rk = M.ranking(nam, th); snap.xep_hang = rk.map(function (x) { return { ma: x.ma, ten: x.ten_ngan, khoi: x.khoi, quy_doi: x.quy_doi, hang: x.hang, hang_truoc: x.hang_truoc }; });
    var me = rk.filter(function (x) { return x.ma === dv; })[0]; snap.hang = me ? { hang: me.hang, hang_truoc: me.hang_truoc, n: rk.length } : null;
    snap.canh_bao = M.alerts(nam, th).filter(function (a) { return dv === CN || !a.dv || a.dv === dv; }).map(function (a) { return { muc: a.muc, loai: a.loai, text: a.text, dv: a.dv || null, ct: a.ct || null }; });
    if (!c.co_so) snap.canh_bao_ky.push('Tháng ' + pad(th) + '/' + nam + ' chưa có số thực hiện của ' + snap.ten_dv + '.');
    if (ks && !cs.co_so) snap.canh_bao_ky.push('Kỳ so ' + ks.nhan + ' chưa có số thực hiện — cột so sánh để trống.');
    return snap;
  }

  /* ---------- PHÁT HIỆN VẤN ĐỀ ---------- */
  function dien(t, v) { return String(t).replace(/\{(\w+)\}/g, function (m, k) { return v[k] !== undefined && v[k] !== null && v[k] !== '' ? v[k] : '…'; }); }
  function slugNn(t) { return 'tc_' + String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40); }
  function goiY(nhomNv, nguon, tuyChinh) {
    var k = nguon && nguon !== 'kpi' ? nguon : (nhomNv || 'khac');
    if (tuyChinh && Array.isArray(tuyChinh[k]) && tuyChinh[k].filter(Boolean).length) return tuyChinh[k].filter(Boolean).map(function (t) { return { id: slugNn(t), ten: String(t) }; });
    return ((nguon && nguon !== 'kpi' ? CH.NGUYEN_NHAN_NGUON[nguon] : CH.NGUYEN_NHAN[nhomNv]) || CH.NGUYEN_NHAN.khac).map(function (x) { return { id: x[0], ten: x[1] }; });
  }
  function cauHoi(flags, nhomNv, v, nguon) {
    var out = [];
    if (nguon && nguon !== 'kpi') { (CH.CAU_HOI_NGUON[nguon] || []).forEach(function (c) { out.push(dien(c, v)); }); return out; }
    flags.forEach(function (f) { (CH.CAU_HOI[f] || []).forEach(function (c) { var t = dien(c, v); if (out.indexOf(t) < 0) out.push(t); }); });
    if (CH.CAU_HOI_NHOM[nhomNv]) out.push(CH.CAU_HOI_NHOM[nhomNv]);
    return out;
  }
  function vdMoi(o) {
    return Object.assign({ id: '', nguon: 'kpi', luat: [], ma_chi_tieu: null, tieu_de: '', muc: null, hien_tuong: '', so_lieu: [], ly_do_chu_y: '', cau_hoi: [], goi_y: [], diem_luat: 0,
      trang_thai: 'chua', nguyen_nhan: [], nguyen_nhan_khac: '', boi_canh: '', ly_do_bac_bo: '', huong_xu_ly: '', theo_doi: false, so_doi: false, khong_con: false, ky_truoc: null }, o);
  }
  function chuoiGiam(ser) { var n = 0; for (var i = ser.length - 1; i > 0; i--) { if (isNum(ser[i]) && isNum(ser[i - 1]) && ser[i] < ser[i - 1] - EPS) n++; else break; } return n; }
  var BAC = { cao: 3, tb: 2, thap: 1 };
  function nang(muc, len) { return (BAC[len] || 0) > (BAC[muc] || 0) ? len : muc; }

  function phatHien(snap, ky, ks, tuyChinh) {
    var ng = snap.nguong, ksNhan = ks ? ks.nhan : '', out = [], thieu = [], tsTong = (snap.tong && snap.tong.ts) || 0;
    snap.kpi.forEach(function (r) {
      if (r.tham_khao) return;
      if (r.ht === null) { if (r.trong_so !== null) thieu.push(r.ten + (r.huong === 'nhap_ty_le' || isNum(r.kh) ? ' (chưa có số thực hiện)' : ' (chưa có kế hoạch)')); return; }
      var flags = [], muc = null, ser = snap.xu_huong[r.ma] || [];
      if (r.ht < ng.cct - EPS) { muc = 'cao'; flags.push('muc.canh_bao'); } else if (r.ht < ng.kha - EPS) { muc = 'tb'; flags.push('muc.chu_y'); } else if (r.ht < ng.dat - EPS) { muc = 'thap'; flags.push('muc.thap'); }
      if (muc && isNum(r.mat_diem) && tsTong > 0 && r.mat_diem >= 0.1 * tsTong) { flags.push('ah.cao'); muc = nang(muc, 'tb'); }
      var gl = chuoiGiam(ser);
      if (gl >= 2) { if (muc) { flags.push('xh.giam_lien_tiep'); muc = nang(muc, 'tb'); } else { flags.push('xh.dat_nhung_giam'); muc = 'thap'; } }
      if (r.huong === 'cao_tot' && r.kieu_so === 'so_du' && isNum(r.so.delta) && r.so.delta < 0) { flags.push('xh.giam'); if (!muc) muc = 'thap'; }
      if (isNum(r.ht_nam) && r.huong === 'cao_tot' && r.kieu_so === 'luy_ke' && r.ht_nam < r.tg * ng.kha - EPS) { flags.push('tien_do.cham'); muc = nang(muc, 'tb'); }
      if (!flags.length) return;
      var dvt = r.dvt ? ' ' + r.dvt : '', v = { ten: r.ten, gap: isNum(r.gap) ? nf(Math.abs(r.gap)) + dvt : '', ht: pct(r.ht), delta: sg(r.so.delta) + dvt, ky_so: ksNhan, lien_tiep: gl, ht_nam: pct(r.ht_nam), tg: pct(r.tg) };
      var sl = r.huong === 'nhap_ty_le' ? [['% hoàn thành', nf(r.th) + '%']] : [['Kế hoạch', nf(r.kh) + dvt], ['Thực hiện', nf(r.th) + dvt], ['% hoàn thành', pct(r.ht)]];
      if (isNum(r.gap) && r.huong !== 'nhap_ty_le') sl.push(['Chênh lệch TH − KH', sg(r.gap) + dvt]);
      if (ks) sl.push(['So ' + ksNhan, isNum(r.so.delta) ? sg(r.so.delta) + dvt + (isNum(r.so.delta_pt) ? ' (' + sg(r.so.delta_pt * 100, 1) + '%)' : '') : (r.so.ghi_chu || '–')]);
      if (isNum(r.ht_nam)) sl.push(['Tiến độ năm', pct(r.ht_nam) + ' KH năm · thời gian đã qua ' + pct(r.tg)]);
      if (isNum(r.trong_so)) sl.push(['Điểm / trọng số', nf(r.diem, 2) + ' / ' + nf(r.trong_so, 2)]);
      var dvs = (snap.don_vi[r.ma] || []).filter(function (x) { return isNum(x.ht); }).sort(function (a, b) { return a.ht - b.ht; });
      if (dvs.length > 1) sl.push(['Đơn vị thấp nhất', dvs.slice(0, 3).map(function (x) { return x.ten + ' ' + pct(x.ht); }).join(' · ')]);
      var them = [];
      if (flags.indexOf('xh.giam_lien_tiep') >= 0 || flags.indexOf('xh.dat_nhung_giam') >= 0) them.push('%HT giảm ' + gl + ' kỳ liên tiếp');
      if (flags.indexOf('tien_do.cham') >= 0) them.push('tiến độ năm ' + pct(r.ht_nam) + ' kế hoạch năm, thời gian đã qua ' + pct(r.tg));
      if (flags.indexOf('xh.giam') >= 0) them.push('giảm ' + nf(-r.so.delta) + dvt + ' so ' + ksNhan);
      var ly = []; if (muc === 'cao') ly.push('dưới ngưỡng Cần cải thiện ' + pct(ng.cct)); else if (muc === 'tb') ly.push('dưới ngưỡng Khá ' + pct(ng.kha)); else if (flags.indexOf('muc.thap') >= 0) ly.push('chưa tới ngưỡng Đạt ' + pct(ng.dat));
      if (flags.indexOf('ah.cao') >= 0) ly.push('mất ' + nf(r.mat_diem, 2) + ' điểm (≥ 10% tổng trọng số)'); if (them.length) ly = ly.concat(them);
      out.push(vdMoi({ id: 'kpi:' + r.ma, nguon: 'kpi', luat: flags, ma_chi_tieu: r.ma, tieu_de: r.ten, muc: muc || 'thap', diem_luat: (BAC[muc || 'thap'] * 100) + (r.mat_diem || 0),
        hien_tuong: r.ten + ' đạt ' + pct(r.ht) + ' kế hoạch' + (them.length ? '; ' + them.join('; ') : '') + '.', so_lieu: sl, ly_do_chu_y: ly.join('; '), cau_hoi: cauHoi(flags, r.nhom_nv, v), goi_y: goiY(r.nhom_nv, null, tuyChinh) }));
    });
    var soThieu = (snap.tong && snap.tong.so_thieu) || 0;
    if (thieu.length) out.push(vdMoi({ id: 'du_lieu', nguon: 'du_lieu', tieu_de: 'Dữ liệu kỳ chưa đầy đủ', muc: 'tb', diem_luat: 250,
      hien_tuong: thieu.length + ' chỉ tiêu chưa đủ cơ sở đánh giá: ' + thieu.join('; ') + '.', so_lieu: [['Chỉ tiêu thiếu số', thieu.length + ' / ' + ((snap.tong && snap.tong.so_ct) || '?')]],
      ly_do_chu_y: 'Thiếu số thì KPI tính 0 điểm, nhận định chưa đủ căn cứ.', cau_hoi: cauHoi([], '', {}, 'du_lieu'), goi_y: goiY('', 'du_lieu', tuyChinh) }));
    if (snap.dv === CN) {
      var duoi = (snap.xep_hang || []).filter(function (x) { return isNum(x.quy_doi) && x.quy_doi / 100 < ng.kha - EPS; }).sort(function (a, b) { return a.quy_doi - b.quy_doi; });
      var gm = (snap.canh_bao || []).filter(function (a) { return a.loai === 'Xu hướng giảm'; });
      if (duoi.length || gm.length) out.push(vdMoi({ id: 'don_vi', nguon: 'don_vi', tieu_de: duoi.length + ' phòng/PGD dưới ngưỡng Khá' + (gm.length ? ', ' + gm.length + ' đơn vị điểm giảm liên tiếp' : ''), muc: duoi.some(function (x) { return x.quy_doi / 100 < ng.cct; }) ? 'cao' : 'tb', diem_luat: 260,
        hien_tuong: duoi.map(function (x) { return x.ten + ' ' + nf(x.quy_doi, 1) + '/100'; }).join('; ') + (gm.length ? (duoi.length ? '. ' : '') + gm.map(function (a) { return a.text; }).join(' ') : '') + '.',
        so_lieu: duoi.map(function (x) { return [x.ten + ' (' + x.khoi + ')', 'điểm quy đổi ' + nf(x.quy_doi, 1) + (x.hang ? ' · hạng ' + x.hang : '')]; }), ly_do_chu_y: 'Dưới ngưỡng Khá ' + pct(ng.kha) + ' của chi nhánh.', cau_hoi: cauHoi([], '', {}, 'don_vi'), goi_y: goiY('', 'don_vi', tuyChinh) }));
      var pg = (snap.canh_bao || []).filter(function (a) { return a.loai === 'Phân giao thiếu'; });
      if (pg.length) out.push(vdMoi({ id: 'phan_giao', nguon: 'phan_giao', tieu_de: pg.length + ' chỉ tiêu phân giao kế hoạch chưa đủ', muc: null, diem_luat: 0, hien_tuong: pg.map(function (a) { return a.text; }).join(' '),
        so_lieu: pg.map(function (a) { return [a.ct || '', a.text]; }), ly_do_chu_y: 'Tổng kế hoạch các phòng nhỏ hơn kế hoạch chi nhánh (chưa phân mức).', cau_hoi: cauHoi([], '', {}, 'phan_giao'), goi_y: goiY('', 'phan_giao', tuyChinh) }));
    }
    var RM = { cao: 0, tb: 1, thap: 2 };
    return out.sort(function (a, b) { var ma = a.muc ? RM[a.muc] : 3, mb = b.muc ? RM[b.muc] : 3; return ma - mb || (b.diem_luat || 0) - (a.diem_luat || 0); });
  }

  /* ---------- DỰ THẢO NHẬN ĐỊNH (chỉ số liệu, không nguyên nhân) ---------- */
  function duThao(snap, ky, vds) {
    var t = snap.tong, cao = vds.filter(function (v) { return v.muc === 'cao'; }), tb = vds.filter(function (v) { return v.muc === 'tb'; }), thap = vds.filter(function (v) { return v.muc === 'thap'; }), chua = vds.filter(function (v) { return !v.muc; });
    var hang = snap.hang && snap.hang.hang ? ', xếp hạng ' + snap.hang.hang + '/' + snap.hang.n + (snap.hang.hang_truoc ? ' (kỳ trước ' + snap.hang.hang_truoc + ')' : '') : '';
    var tq = ky.nhan + ' · ' + snap.ten_dv + ': ' + (t && t.co_so ? 'điểm quy đổi ' + nf(t.quy_doi, 1) + '/100 (' + nf(t.diem, 2) + '/' + nf(t.ts, 2) + ' điểm), ' + t.so_dat + '/' + t.so_ct + ' chỉ tiêu đạt' + hang + '. ' : 'chưa có số thực hiện. ')
      + 'Hệ thống ghi nhận ' + vds.length + ' vấn đề: ' + cao.length + ' mức cao, ' + tb.length + ' trung bình, ' + thap.length + ' thấp, ' + chua.length + ' dữ kiện chưa phân mức.';
    var tot = snap.kpi.filter(function (r) { return !r.tham_khao && r.ht !== null && r.ht >= snap.nguong.dat - EPS && r.trong_so !== null; }).sort(function (a, b) { return b.ht - a.ht; });
    var tc = tot.map(function (r) { return r.ten + ' đạt ' + pct(r.ht) + (isNum(r.so.delta) && r.so.delta > 0 ? ', tăng ' + nf(r.so.delta) + (r.dvt ? ' ' + r.dvt : '') + ' so ' + (snap.ky_so_nhan || 'kỳ so') : ''); });
    var qt = cao.concat(tb).map(function (v) { return v.tieu_de; }), rr = vds.filter(function (v) { return !v.muc || v.luat.indexOf('tien_do.cham') >= 0 || v.luat.indexOf('xh.giam_lien_tiep') >= 0; }).map(function (v) { return v.tieu_de; });
    return { tong_quan: tq, tich_cuc: tc.length ? tc.join('; ') + '.' : 'Chưa có chỉ tiêu đạt kế hoạch trong kỳ.', quan_tam: qt.length ? qt.join('; ') + '.' : 'Không có vấn đề mức cao / trung bình.', rui_ro: rr.length ? rr.join('; ') + '.' : 'Không ghi nhận biến động / rủi ro khác từ dữ liệu.' };
  }

  /* ---------- BÁO CÁO ---------- */
  function taoId(nguoi, luc) { var d = new Date(luc || Date.now()); return 'BCGB_' + iso(d).replace(/-/g, '') + '_' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '_' + String(nguoi && nguoi.username || 'x').toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Math.random().toString(36).slice(2, 6); }   // hậu tố ngẫu nhiên: không trùng mã khi tạo / mở lại trong cùng một giây
  function tuyChinhCua(state) { return (state && state.settings && state.settings.giao_ban && state.settings.giao_ban.nguyen_nhan) || null; }
  /* o: { M, state, ky, ks, dv, nguoi: { username, ho_ten, chuc_danh }, luc, id?, app_version?, ngay_chot? } */
  function taoBaoCao(o) {
    var luc = o.luc || new Date().toISOString(), dv = o.dv || CN, snap = chupSo(o.M, { dv: dv, ky: o.ky, ks: o.ks, luc: luc, state: o.state }); snap.ky_so_nhan = o.ks ? o.ks.nhan : '';
    var vds = phatHien(snap, o.ky, o.ks, tuyChinhCua(o.state)), dt = duThao(snap, o.ky, vds), nd = {};
    Object.keys(dt).forEach(function (k) { nd[k] = { du_thao: dt[k], noi_dung: dt[k], da_sua: false }; });
    var hn = luc.slice(0, 10), ct = cuoiThang(o.ky.nam, o.ky.thang);
    return { id: o.id || taoId(o.nguoi, luc), schema: SCHEMA, app_version: o.app_version || '', trang_thai: 'nhap', dv: dv, ky: copy(o.ky), ky_so: o.ks ? copy(o.ks) : { loai: 'khong' },
      ngay_chot: o.ngay_chot || (ct <= hn ? ct : hn), ngay_chot_nguon: o.ngay_chot ? 'sua_tay' : 'tu_dong', nguoi_lap: copy(o.nguoi || {}), tao_luc: luc, sua_luc: luc, hoan_thien_luc: null, hoan_thien_boi: null,
      phien_ban_cua: null, thay_the_boi: null, snapshot: snap, nhan_dinh: nd, van_de: vds, giai_phap: [],
      ket_luan: { noi_dung: dt.tong_quan, da_sua: false, chon: { B: true, C: 'tat_ca', F: true, phu_luc: true } }, lich_su_sua: [{ luc: luc, boi: (o.nguoi || {}).username || '', viec: 'tao' }] };
  }
  /* Làm mới số của bản NHÁP: giữ đánh giá theo id vấn đề; vấn đề đã đánh giá mà không còn → giữ, đánh dấu khong_con; nhận định đã sửa giữ nguyên. */
  function lamMoiSo(bc, o) {
    if (bc.trang_thai !== 'nhap') throw new Error('Chỉ làm mới số cho bản nháp.');
    var luc = o.luc || new Date().toISOString(), ks = bc.ky_so && bc.ky_so.loai !== 'khong' ? bc.ky_so : null, snap = chupSo(o.M, { dv: bc.dv, ky: bc.ky, ks: ks, luc: luc, state: o.state }); snap.ky_so_nhan = ks ? ks.nhan : '';
    var vds = phatHien(snap, bc.ky, ks, tuyChinhCua(o.state)), cu = {}; bc.van_de.forEach(function (v) { cu[v.id] = v; });
    var GIU = ['trang_thai', 'nguyen_nhan', 'nguyen_nhan_khac', 'boi_canh', 'ly_do_bac_bo', 'huong_xu_ly', 'theo_doi', 'ky_truoc'];
    var moi = vds.map(function (v) { var c = cu[v.id]; if (!c) return v; GIU.forEach(function (k) { v[k] = copy(c[k] === undefined ? null : c[k]); }); if (v.trang_thai == null) v.trang_thai = 'chua'; v.so_doi = c.hien_tuong !== v.hien_tuong; delete cu[v.id]; return v; });
    Object.keys(cu).forEach(function (id) { var c = cu[id]; if (c.nguon === 'nguoi_lap' || c.nguon === 'ky_truoc') moi.push(c); else if (c.trang_thai !== 'chua') { c.khong_con = true; moi.push(c); } });
    var dt = duThao(snap, bc.ky, moi), out = copy(bc);
    Object.keys(dt).forEach(function (k) { var n = out.nhan_dinh[k] || { da_sua: false }; n.du_thao = dt[k]; if (!n.da_sua) n.noi_dung = dt[k]; out.nhan_dinh[k] = n; });
    if (!out.ket_luan.da_sua) out.ket_luan.noi_dung = dt.tong_quan;
    var hn = luc.slice(0, 10), ct = cuoiThang(bc.ky.nam, bc.ky.thang); if (out.ngay_chot_nguon !== 'sua_tay') out.ngay_chot = ct <= hn ? ct : hn;
    out.snapshot = snap; out.van_de = moi; out.sua_luc = luc; out.lich_su_sua.push({ luc: luc, boi: o.boi || '', viec: 'lam_moi_so' });
    return out;
  }
  /* Người lập bổ sung một vấn đề (nguồn nguoi_lap) */
  function themVanDe(bc, o) {
    var out = copy(bc), n = out.van_de.filter(function (v) { return v.nguon === 'nguoi_lap'; }).length + 1;
    out.van_de.push(vdMoi({ id: 'nl:' + Date.now().toString(36) + n, nguon: 'nguoi_lap', tieu_de: String(o.tieu_de || '').trim(), hien_tuong: String(o.hien_tuong || '').trim(), muc: o.muc || null, goi_y: goiY('khac', null, null), cau_hoi: [] }));
    out.sua_luc = o.luc || new Date().toISOString(); return out;
  }
  function datDanhGia(vd, patch) {
    var v = Object.assign({}, vd, patch || {}), loi = '';
    v.nguyen_nhan = (v.nguyen_nhan || []).slice(); v.nguyen_nhan_khac = String(v.nguyen_nhan_khac || ''); v.boi_canh = String(v.boi_canh || ''); v.ly_do_bac_bo = String(v.ly_do_bac_bo || '');
    if (!DANH_GIA[v.trang_thai]) loi = 'Trạng thái không hợp lệ.';
    else if (v.trang_thai === 'xac_nhan' && !v.nguyen_nhan.length && !v.nguyen_nhan_khac.trim() && !v.boi_canh.trim()) loi = 'Chọn ít nhất một nguyên nhân hoặc ghi bối cảnh trước khi xác nhận.';
    else if (v.trang_thai === 'bac_bo' && !v.ly_do_bac_bo.trim()) loi = 'Ghi lý do bác bỏ nhận định.';
    return { ok: !loi, vd: loi ? vd : v, loi: loi };
  }
  function kiemTraHoanThien(bc) {
    var loi = [], hoi = [];
    if (!String(bc.ket_luan && bc.ket_luan.noi_dung || '').trim()) loi.push('Chưa có nhận định tổng thể (mục G).');
    bc.van_de.forEach(function (v) { var r = datDanhGia(v, {}); if (!r.ok) loi.push(v.tieu_de + ': ' + r.loi); if (v.nguon === 'nguoi_lap' && !v.tieu_de) loi.push('Có vấn đề bổ sung chưa có tiêu đề.'); });
    var chua = bc.van_de.filter(function (v) { return v.trang_thai === 'chua' && (v.muc === 'cao' || v.muc === 'tb'); });
    if (chua.length) hoi.push(chua.length + ' vấn đề mức cao / trung bình chưa đánh giá — vẫn vào báo cáo ở mục "Chưa đánh giá": ' + chua.map(function (v) { return v.tieu_de; }).join('; '));
    (bc.giai_phap || []).forEach(function (g, i) { if (!String(g.giai_phap || '').trim()) loi.push('Giải pháp dòng ' + (i + 1) + ' chưa có nội dung.'); });
    return { ok: !loi.length, loi: loi, hoi: hoi };
  }
  function ghiSu(bc, boi, viec, luc) { bc.lich_su_sua = (bc.lich_su_sua || []).concat([{ luc: luc, boi: boi, viec: viec }]); }
  function hoanThien(bc, nguoi, luc) {
    if (bc.trang_thai !== 'nhap') throw new Error('Báo cáo không ở trạng thái nháp.');
    var out = copy(bc); luc = luc || new Date().toISOString();
    out.trang_thai = 'hoan_thien'; out.hoan_thien_luc = luc; out.hoan_thien_boi = (nguoi && (nguoi.ho_ten || nguoi.username)) || ''; out.sua_luc = luc; ghiSu(out, nguoi && nguoi.username, 'hoan_thien', luc);
    return out;
  }
  /* Mở lại bản hoàn thiện để sửa = tạo BẢN MỚI (cùng số đã chốt); bản cũ chỉ chuyển "Đã thay thế" khi bản mới được hoàn thiện (danhDauThayThe). */
  function moLai(bc, nguoi, luc) {
    luc = luc || new Date().toISOString(); var out = copy(bc), id = taoId(nguoi, luc);
    out.id = id; out.trang_thai = 'nhap'; out.phien_ban_cua = bc.id; out.thay_the_boi = null; out.hoan_thien_luc = null; out.hoan_thien_boi = null; out.tao_luc = luc; out.sua_luc = luc; out.nguoi_lap = copy(nguoi || {});
    out.lich_su_sua = [{ luc: luc, boi: (nguoi || {}).username || '', viec: 'mo_lai_tu ' + bc.id }]; return out;
  }
  function danhDauThayThe(cu, idMoi, luc) { var out = copy(cu); out.trang_thai = 'thay_the'; out.thay_the_boi = idMoi; out.sua_luc = luc || new Date().toISOString(); ghiSu(out, '', 'thay_the_boi ' + idMoi, out.sua_luc); return out; }
  function meta(bc) { return { id: bc.id, trang_thai: bc.trang_thai, dv: bc.dv, ten_dv: bc.snapshot && bc.snapshot.ten_dv, ky: bc.ky && bc.ky.nhan, ky_so: bc.ky_so && bc.ky_so.nhan || '', ngay_chot: bc.ngay_chot, nguoi_lap: (bc.nguoi_lap || {}).ho_ten || (bc.nguoi_lap || {}).username || '', sua_luc: bc.sua_luc, hoan_thien_luc: bc.hoan_thien_luc, phien_ban_cua: bc.phien_ban_cua, so_van_de: (bc.van_de || []).length }; }

  /* ---------- MÔ HÌNH TÀI LIỆU (nguồn chung cho Xem trước / In-PDF / Word) ---------- */
  function taiLieu(bc) {
    var s = bc.snapshot, ky = bc.ky, ks = bc.ky_so && bc.ky_so.loai !== 'khong' ? bc.ky_so : null, ch = (bc.ket_luan && bc.ket_luan.chon) || {}, B = [], dvt = function (r) { return r.dvt ? ' ' + r.dvt : ''; };
    B.push({ t: 'dau', don_vi: s.ten_chi_nhanh, nhap: bc.trang_thai === 'nhap' });
    B.push({ t: 'tieu_de', text: 'BÁO CÁO GIAO BAN ' + ky.nhan.toUpperCase() });
    B.push({ t: 'p', can: 'c', text: 'Đơn vị: ' + s.ten_dv + ' · Ngày chốt số liệu: ' + dm(bc.ngay_chot) + (ks ? ' · So sánh: ' + ks.nhan : '') });
    (s.canh_bao_ky || []).forEach(function (c) { B.push({ t: 'p', i: true, nho: true, text: 'Lưu ý: ' + c }); });
    var stt = 0, muc = function (t) { stt++; return ['I', 'II', 'III', 'IV', 'V', 'VI'][stt - 1] + '. ' + t; };
    if (ch.B !== false) {
      B.push({ t: 'h1', text: muc('Nhận định tổng quan') });
      Object.keys(NH_TITLE).forEach(function (k) { var n = bc.nhan_dinh[k]; if (n && String(n.noi_dung || '').trim()) { B.push({ t: 'p', b: true, text: NH_TITLE[k] }); B.push({ t: 'p', text: n.noi_dung }); } });
    }
    if (ch.C !== 'khong') {
      var rows = s.kpi.filter(function (r) { return ch.C !== 'khong_dat' || (r.ht !== null && r.ht < s.nguong.dat - EPS) || r.ht === null; }), cot = [{ t: 'Chỉ tiêu', w: 30, can: 'l' }, { t: 'ĐVT', w: 9, can: 'c' }, { t: 'Kế hoạch', w: 12, can: 'r' }, { t: 'Thực hiện', w: 12, can: 'r' }, { t: '%HT', w: 8, can: 'r' }, { t: 'Điểm/TS', w: 11, can: 'r' }];
      if (ks) cot.push({ t: 'So ' + ks.nhan, w: 14, can: 'r' });
      B.push({ t: 'h1', text: muc('Bảng tổng hợp KPI' + (ch.C === 'khong_dat' ? ' (chỉ tiêu chưa đạt)' : '')) });
      var dong = [], nh = null; rows.forEach(function (r) {
        if (r.nhom !== nh) { nh = r.nhom; dong.push({ nhom: true, o: [nh || 'Khác'] }); }
        var o = [r.ten + (r.tham_khao ? ' (quản trị)' : ''), r.dvt, r.huong === 'nhap_ty_le' ? '–' : nf(r.kh), nf(r.th), pct(r.ht), isNum(r.trong_so) ? nf(r.diem, 2) + '/' + nf(r.trong_so, 2) : '–'];
        if (ks) o.push(isNum(r.so.delta) ? sg(r.so.delta) + (isNum(r.so.delta_pt) ? ' (' + sg(r.so.delta_pt * 100, 1) + '%)' : '') : '–'); dong.push({ o: o });
      });
      var t = s.tong; dong.push({ tong: true, o: ['Tổng điểm quy đổi (thang 100)', '', '', '', t && t.ht_chung !== null ? pct(t.ht_chung) : '–', t ? nf(t.diem, 2) + '/' + nf(t.ts, 2) : '–'].concat(ks ? [''] : []) });
      B.push({ t: 'bang', cot: cot, dong: dong });
    }
    var vd = bc.van_de.filter(function (v) { return v.trang_thai !== 'bac_bo'; }), nhomVd = [['xac_nhan', 'Vấn đề đã xác nhận'], ['kiem_tra', 'Vấn đề đang xác minh'], ['chua', 'Vấn đề chưa đánh giá']];
    B.push({ t: 'h1', text: muc('Vấn đề trọng tâm') });
    if (!vd.length) B.push({ t: 'p', text: 'Không ghi nhận vấn đề trong kỳ.' });
    nhomVd.forEach(function (g) {
      var ds = vd.filter(function (v) { return v.trang_thai === g[0]; }); if (!ds.length) return;
      B.push({ t: 'h2', text: g[1] + ' (' + ds.length + ')' });
      ds.forEach(function (v, i) {
        B.push({ t: 'p', b: true, text: (i + 1) + '. ' + v.tieu_de + (v.muc ? ' — mức ' + MUC[v.muc].toLowerCase() : '') });
        B.push({ t: 'p', text: v.hien_tuong });
        if (v.so_lieu && v.so_lieu.length) B.push({ t: 'ds', items: v.so_lieu.map(function (x) { return x[0] + ': ' + x[1]; }) });
        var nn = (v.nguyen_nhan || []).map(function (id) { var g2 = (v.goi_y || []).filter(function (y) { return y.id === id; })[0]; return g2 ? g2.ten : id; }).concat(String(v.nguyen_nhan_khac || '').trim() ? [v.nguyen_nhan_khac.trim()] : []);
        if (nn.length) B.push({ t: 'p', text: 'Nguyên nhân: ' + nn.join('; ') + '.' }); if (String(v.boi_canh || '').trim()) B.push({ t: 'p', text: 'Bối cảnh: ' + v.boi_canh.trim() }); if (String(v.huong_xu_ly || '').trim()) B.push({ t: 'p', text: 'Hướng xử lý: ' + v.huong_xu_ly.trim() });
      });
    });
    if (ch.F !== false) {
      var gp = bc.giai_phap || []; B.push({ t: 'h1', text: muc('Giải pháp và kiến nghị' )});
      if (!gp.length) B.push({ t: 'p', text: 'Chưa có giải pháp, kiến nghị.' });
      else B.push({ t: 'bang', cot: [{ t: 'STT', w: 6, can: 'c' }, { t: 'Giải pháp / kiến nghị', w: 46, can: 'l' }, { t: 'Phụ trách', w: 18, can: 'l' }, { t: 'Hạn', w: 12, can: 'c' }, { t: 'Loại', w: 14, can: 'c' }], dong: gp.map(function (g, i) { return { o: [String(i + 1), g.giai_phap, g.phu_trach || '', g.han ? dm(g.han) : '', g.kien_nghi_bgd ? 'Kiến nghị BGĐ' : 'Thuộc đơn vị'] }; }) });
    }
    B.push({ t: 'h1', text: muc('Kết luận') }); B.push({ t: 'p', text: bc.ket_luan.noi_dung });
    var bb = bc.van_de.filter(function (v) { return v.trang_thai === 'bac_bo'; });
    if (ch.phu_luc !== false && bb.length) { B.push({ t: 'h1', text: 'Phụ lục: nhận định hệ thống đưa ra đã bác bỏ' }); B.push({ t: 'ds', items: bb.map(function (v) { return v.tieu_de + ' — lý do: ' + v.ly_do_bac_bo; }) }); }
    var ng = bc.nguoi_lap || {}; B.push({ t: 'ky', text: (ng.chuc_danh || 'NGƯỜI LẬP BÁO CÁO').toUpperCase(), ten: bc.hoan_thien_boi || ng.ho_ten || ng.username || '' });
    return B;
  }

  root.KPI_BAO_CAO = { SCHEMA: SCHEMA, TRANG_THAI: TRANG_THAI, DANH_GIA: DANH_GIA, MUC: MUC, NGUON: NGUON, LOAI_KY: LOAI_KY, LOAI_SO: LOAI_SO, NH_TITLE: NH_TITLE,
    kyTuLoai: kyTuLoai, kySo: kySo, chupSo: chupSo, phatHien: phatHien, duThao: duThao, taoBaoCao: taoBaoCao, lamMoiSo: lamMoiSo, themVanDe: themVanDe, datDanhGia: datDanhGia, kiemTraHoanThien: kiemTraHoanThien,
    hoanThien: hoanThien, moLai: moLai, danhDauThayThe: danhDauThayThe, meta: meta, taiLieu: taiLieu, tenDv: tenDv, fmt: { nf: nf, pct: pct, sg: sg, dm: dm } };
})(typeof window !== 'undefined' ? window : this);
