/* XUẤT PROMPT GỬI GENIE — dựng tệp .txt gồm: (1) yêu cầu viết báo cáo giao ban, (2) ngữ cảnh người lập đã soạn trong báo cáo (nhận định, vấn đề + nguyên nhân đã chọn, giải pháp, kết luận),
 * (3) số liệu dạng JSON (chụp từ snapshot của báo cáo) để Genie — AI nội bộ — viết thành báo cáo hoàn chỉnh. Hàm thuần (không đọc DOM) để kiểm thử bằng Node; chỉ `xuat` chạm trình duyệt. */
(function (root) {
  var BC = root.KPI_BAO_CAO;
  var BAT_DAU = '=== BẮT ĐẦU SỐ LIỆU JSON ===', KET_THUC = '=== KẾT THÚC SỐ LIỆU JSON ===';
  var DO_DAI = { ngan: ['Ngắn gọn (khoảng 1–2 trang)', 'Viết ngắn gọn, mỗi mục tối đa vài câu; chỉ nêu các ý chính.'], chuan: ['Tiêu chuẩn (khoảng 2–4 trang)', 'Viết đầy đủ nhưng cô đọng, đủ các mục theo bố cục.'], chi_tiet: ['Chi tiết (trên 4 trang)', 'Viết chi tiết, phân tích theo từng nhóm chỉ tiêu và từng đơn vị khi có số liệu.'] };
  var CHIEU = { cao_tot: 'cao là tốt', thap_tot: 'thấp là tốt', nhap_ty_le: 'nhập trực tiếp tỷ lệ phần trăm' };

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function r4(x) { return isNum(x) ? Math.round(x * 1e4) / 1e4 : (x === undefined ? null : x); }
  function co(s) { return String(s === undefined || s === null ? '' : s).trim(); }
  function nn(v) {
    return (v.nguyen_nhan || []).map(function (id) { var g = (v.goi_y || []).filter(function (y) { return y.id === id; })[0]; return g ? g.ten : id; }).concat(co(v.nguyen_nhan_khac) ? [co(v.nguyen_nhan_khac)] : []);
  }

  /* Số liệu JSON — dữ liệu lấy từ snapshot đã chốt của báo cáo (không tính lại), tỷ lệ là số thập phân (1 = 100%). */
  function taoJson(bc) {
    var s = bc.snapshot, t = s.tong || {}, ng = bc.nguoi_lap || {};
    return {
      thong_tin: { don_vi: s.ten_dv, ma_don_vi: s.dv, chi_nhanh: s.ten_chi_nhanh, ky: { nam: bc.ky.nam, thang: bc.ky.thang || null, nhan: bc.ky.nhan }, ky_so_sanh: bc.ky_so && bc.ky_so.loai !== 'khong' ? bc.ky_so.nhan : null,
        ngay_chot_so: bc.ngay_chot, nguoi_lap: ng.ho_ten || ng.username || '', chuc_danh: ng.chuc_danh || '', trang_thai_bao_cao: BC.TRANG_THAI[bc.trang_thai] || bc.trang_thai, so_lieu_chup_luc: s.chup_luc },
      chu_giai: { ty_le: 'Các trường ty_le_* là số thập phân: 1 = 100% (VD 0,95 = 95%).', ke_hoach_thuc_hien: 'Kế hoạch và thực hiện là số lũy kế từ đầu năm đến hết kỳ báo cáo (trừ chỉ tiêu số dư/mức thì là mức tại cuối kỳ).',
        diem: 'diem = điểm đạt theo trọng số; diem_mat = điểm bị mất so với trọng số; điểm quy đổi tính trên thang 100.', quan_tri: 'quan_tri = true: chỉ tiêu quản trị, theo dõi, không chấm điểm KPI.',
        chieu_tot: 'cao_tot: càng cao càng tốt; thap_tot: càng thấp càng tốt; nhap_ty_le: nhập trực tiếp tỷ lệ.', so_voi_ky_so_sanh: 'Chênh lệch thực hiện so với kỳ so sánh (nếu có); null nghĩa là không so sánh được.', xu_huong: 'ty_le_ht_theo_thang: tỷ lệ hoàn thành kế hoạch từng tháng từ tháng 1 đến kỳ báo cáo; null = chưa có số.' },
      nguong_xep_loai: { dat: r4(s.nguong.dat), kha: r4(s.nguong.kha), can_cai_thien: r4(s.nguong.cct) },
      tong_hop: { diem_quy_doi_thang_100: r4(t.quy_doi), diem_goc_quy_doi: r4(t.quy_doi_goc), cong_tru_diem_kpi: r4(t.dc_diem), tong_diem_theo_trong_so: r4(t.diem), tong_trong_so: r4(t.ts), ty_le_hoan_thanh_chung: r4(t.ht_chung),
        so_chi_tieu: { tong: t.so_ct, dat: t.so_dat, kha: t.so_kha, can_cai_thien: t.so_cct, chua_dat: t.so_chua, thieu_so: t.so_thieu }, xep_hang: s.hang ? { hang: s.hang.hang, hang_ky_truoc: s.hang.hang_truoc || null, tren_tong_so_don_vi: s.hang.n } : null },
      chi_tieu: (s.kpi || []).map(function (r) {
        return { ma: r.ma, ten: r.ten, nhom: r.nhom, dvt: r.dvt, chieu_tot: r.huong, quan_tri: !!r.tham_khao, ke_hoach: r4(r.kh), thuc_hien: r4(r.th), ty_le_ht: r4(r.ht), chenh_lech_so_voi_kh: r4(r.gap), diem: r4(r.diem), trong_so: r4(r.trong_so), diem_mat: r4(r.mat_diem), xep_loai: r.trang_thai,
          ke_hoach_ca_nam: r4(r.kh_nam), ty_le_ht_ca_nam: r4(r.ht_nam), so_voi_ky_so_sanh: r.so ? { thuc_hien_ky_so: r4(r.so.th), chenh_lech: r4(r.so.delta), ty_le_thay_doi: r4(r.so.delta_pt), ghi_chu: r.so.ghi_chu || '' } : null,
          ty_le_ht_theo_thang: ((s.xu_huong || {})[r.ma] || []).map(r4) };
      }),
      xep_hang_cac_don_vi: (s.xep_hang || []).map(function (x) { return { don_vi: x.ten, khoi: x.khoi, diem_quy_doi: r4(x.quy_doi), hang: x.hang, hang_ky_truoc: x.hang_truoc || null }; }),
      don_vi_theo_chi_tieu: s.dv === root.KPI_CFG.MA_CN ? Object.keys(s.don_vi || {}).map(function (ma) { return { ma_chi_tieu: ma, cac_don_vi: s.don_vi[ma].map(function (d) { return { don_vi: d.ten, khoi: d.khoi, ke_hoach: r4(d.kh), thuc_hien: r4(d.th), ty_le_ht: r4(d.ht) }; }) }; }) : [],
      canh_bao_he_thong: (s.canh_bao || []).map(function (a) { return { muc: a.muc, loai: a.loai, noi_dung: a.text }; }), canh_bao_ky: s.canh_bao_ky || []
    };
  }

  /* Phần ngữ cảnh người lập đã soạn — theo đúng lựa chọn đưa vào báo cáo (ket_luan.chon). */
  function nguCanh(bc, opt) {
    var L = [], ch = (bc.ket_luan && bc.ket_luan.chon) || {}, s = bc.snapshot;
    L.push('Đơn vị báo cáo: ' + s.ten_dv + ' (' + s.ten_chi_nhanh + ')');
    L.push('Kỳ báo cáo: ' + bc.ky.nhan + (bc.ky_so && bc.ky_so.loai !== 'khong' ? ' · so sánh với ' + bc.ky_so.nhan : ' · không so sánh với kỳ khác'));
    L.push('Ngày chốt số liệu: ' + bc.ngay_chot);
    L.push('Người lập: ' + ((bc.nguoi_lap || {}).ho_ten || (bc.nguoi_lap || {}).username || '') + ((bc.nguoi_lap || {}).chuc_danh ? ' — ' + bc.nguoi_lap.chuc_danh : ''));
    if (bc.trang_thai === 'nhap') L.push('LƯU Ý: đây là BẢN NHÁP của người lập, nội dung chưa được chốt.');
    if (ch.B !== false) {
      L.push('', '--- A. Nhận định do người lập soạn / chỉnh sửa ---');
      Object.keys(BC.NH_TITLE).forEach(function (k) { var n = bc.nhan_dinh[k]; if (n && co(n.noi_dung)) { L.push('[' + BC.NH_TITLE[k] + ']' + (n.da_sua ? ' (người lập đã chỉnh sửa)' : ''), co(n.noi_dung)); } });
    }
    var vd = (bc.van_de || []).filter(function (v) { return v.trang_thai !== 'bac_bo'; }), nhom = [['xac_nhan', 'Vấn đề đã được người lập XÁC NHẬN'], ['kiem_tra', 'Vấn đề đang cần XÁC MINH THÊM (nêu rõ là đang xác minh, không kết luận nguyên nhân)'], ['chua', 'Vấn đề CHƯA ĐƯỢC ĐÁNH GIÁ (chỉ nêu hiện tượng và số liệu, không suy đoán nguyên nhân)']];
    L.push('', '--- B. Vấn đề trọng tâm ---');
    if (!vd.length) L.push('Không ghi nhận vấn đề trong kỳ.');
    nhom.forEach(function (gr) {
      var ds = vd.filter(function (v) { return v.trang_thai === gr[0]; }); if (!ds.length) return;
      L.push('', gr[1] + ' — ' + ds.length + ' vấn đề:');
      ds.forEach(function (v, i) {
        L.push((i + 1) + '. ' + v.tieu_de + (v.muc ? ' — mức ' + BC.MUC[v.muc].toLowerCase() : '') + ' (nguồn: ' + (BC.NGUON[v.nguon] || v.nguon) + ')', '   Hiện tượng: ' + co(v.hien_tuong));
        (v.so_lieu || []).forEach(function (x) { L.push('   - ' + x[0] + ': ' + x[1]); });
        var n = nn(v); if (n.length) L.push('   Nguyên nhân (người lập đã chọn): ' + n.join('; '));
        if (co(v.boi_canh)) L.push('   Bối cảnh: ' + co(v.boi_canh)); if (co(v.huong_xu_ly)) L.push('   Hướng xử lý: ' + co(v.huong_xu_ly));
      });
    });
    if (ch.F !== false) {
      L.push('', '--- C. Giải pháp và kiến nghị ---');
      if (!(bc.giai_phap || []).length) L.push('Chưa có giải pháp, kiến nghị.');
      (bc.giai_phap || []).forEach(function (x, i) {
        var v = (bc.van_de || []).filter(function (y) { return y.id === x.vd_id; })[0];
        L.push((i + 1) + '. ' + co(x.giai_phap) + (co(x.phu_trach) ? ' — phụ trách: ' + co(x.phu_trach) : '') + (x.han ? ' — hạn: ' + x.han : '') + (x.kien_nghi_bgd ? ' — KIẾN NGHỊ BAN GIÁM ĐỐC' : '') + (v ? ' (liên quan vấn đề: ' + v.tieu_de + ')' : ''));
      });
    }
    L.push('', '--- D. Kết luận do người lập soạn ---', co(bc.ket_luan && bc.ket_luan.noi_dung) || '(chưa có)');
    var bb = (bc.van_de || []).filter(function (v) { return v.trang_thai === 'bac_bo'; });
    if (bb.length && ch.phu_luc !== false && opt.kem_bac_bo) { L.push('', '--- E. Nhận định hệ thống đã bị người lập BÁC BỎ (chỉ để tham khảo, KHÔNG đưa vào nội dung chính) ---'); bb.forEach(function (v) { L.push('- ' + v.tieu_de + ' — lý do bác bỏ: ' + co(v.ly_do_bac_bo)); }); }
    return L.join('\n');
  }

  /* opt: { do_dai: 'ngan'|'chuan'|'chi_tiet', them: 'yêu cầu bổ sung (văn bản)', kem_bac_bo: bool } → chuỗi văn bản (chưa kèm BOM). */
  function taoPrompt(bc, opt) {
    opt = opt || {}; var dd = DO_DAI[opt.do_dai] || DO_DAI.chuan, s = bc.snapshot, ky = bc.ky.nhan, data = taoJson(bc), L = [];
    var coF = !(bc.ket_luan && bc.ket_luan.chon && bc.ket_luan.chon.F === false), LA = ['I', 'II', 'III', 'IV', 'V'], k = 0, muc = [];
    muc.push(LA[k++] + '. Tình hình thực hiện chung (điểm KPI quy đổi, xếp hạng, số chỉ tiêu đạt / chưa đạt, so sánh kỳ so sánh nếu có)');
    muc.push(LA[k++] + '. Kết quả thực hiện các chỉ tiêu (bảng tổng hợp: kế hoạch, thực hiện, % hoàn thành, điểm; nhận xét theo từng nhóm chỉ tiêu)');
    muc.push(LA[k++] + '. Vấn đề trọng tâm và nguyên nhân');
    if (coF) muc.push(LA[k++] + '. Giải pháp và kiến nghị (nêu rõ người phụ trách, thời hạn; tách riêng kiến nghị Ban giám đốc)');
    muc.push(LA[k++] + '. Kết luận');
    L.push('YÊU CẦU CHO GENIE — VIẾT BÁO CÁO GIAO BAN', '='.repeat(60), '',
      'Vai trò: Bạn là chuyên viên Phòng Tổng hợp của một chi nhánh ngân hàng thương mại, có kinh nghiệm viết báo cáo giao ban điều hành cho Ban giám đốc.', '',
      'Nhiệm vụ: Dựa vào PHẦN NGỮ CẢNH do người lập đã soạn và PHẦN SỐ LIỆU JSON bên dưới, hãy viết thành MỘT BÁO CÁO GIAO BAN HOÀN CHỈNH về kết quả thực hiện kế hoạch / chỉ tiêu KPI của ' + s.ten_dv + ', ' + ky + '.', '',
      'Nguyên tắc bắt buộc:',
      '1. Chỉ sử dụng số liệu có trong phần JSON. Không bịa số, không ước đoán số. Số nào không có hoặc bằng null thì ghi "chưa có số liệu".',
      '2. Chỉ nêu NGUYÊN NHÂN mà người lập đã chọn / ghi trong phần ngữ cảnh. Vấn đề chưa đánh giá hoặc đang xác minh thì chỉ nêu hiện tượng, số liệu và việc đang xác minh; không tự suy diễn nguyên nhân.',
      '3. Giữ nguyên các nhận định, giải pháp, kiến nghị và kết luận của người lập về ý nghĩa; được phép diễn đạt lại cho mạch lạc, đúng văn phong hành chính ngân hàng. Không thêm giải pháp ngoài danh sách.',
      '4. Số liệu trích dẫn phải khớp JSON. Chỉ được tự tính các phép đơn giản (chênh lệch, tỷ lệ phần trăm) và phải dùng số trong JSON làm gốc.',
      '5. Trình bày số theo kiểu Việt Nam: dấu phẩy ngăn cách phần thập phân, dấu chấm ngăn cách hàng nghìn; luôn kèm đơn vị tính. Tỷ lệ trong JSON là số thập phân (1 = 100%).',
      '6. Văn phong: tiếng Việt, trang trọng, khách quan, ngắn gọn, đúng thuật ngữ ngân hàng; không dùng khẩu ngữ, không dùng biểu tượng cảm xúc; không có lời chào hay lời bình luận của AI.',
      '7. Không đưa vào báo cáo các nhận định đã bị bác bỏ (nếu có nêu ở cuối phần ngữ cảnh).',
      '8. ' + dd[1], '',
      'Bố cục báo cáo yêu cầu:',
      '   Tiêu đề: BÁO CÁO GIAO BAN ' + String(ky).toUpperCase() + ' — ' + String(s.ten_dv).toUpperCase(),
      '   ' + muc.join('\n   '),
      '   Cuối báo cáo: chức danh và họ tên người lập.',
      '   Bảng trình bày dạng bảng văn bản (markdown) để dễ dán vào Word.');
    if (co(opt.them)) L.push('', 'Yêu cầu bổ sung của người lập: ' + co(opt.them));
    L.push('', '', 'NGỮ CẢNH DO NGƯỜI LẬP ĐÃ SOẠN TRONG BÁO CÁO GIAO BAN', '='.repeat(60), nguCanh(bc, opt), '', '',
      'SỐ LIỆU (JSON)', '='.repeat(60), BAT_DAU, JSON.stringify(data, null, 1), KET_THUC, '', '— Hết —');
    return L.join('\n');
  }

  /* ---------- Prompt TỪNG MỤC (để dán vào Genie lấy nhận định từng ô trong báo cáo) ---------- */
  var MUC = {
    tong_quan: { ten: 'Tình hình chung', doan: '3–5 câu', yc: 'Nêu điểm KPI quy đổi, xếp hạng, số chỉ tiêu đạt / chưa đạt, so sánh với kỳ so sánh (nếu có) và đánh giá chung về kết quả kỳ.' },
    tich_cuc: { ten: 'Kết quả tích cực', doan: '2–4 câu', yc: 'Nêu các chỉ tiêu đạt hoặc vượt kế hoạch và mức tăng so với kỳ so sánh, kèm số liệu cụ thể; ưu tiên chỉ tiêu có trọng số lớn.' },
    quan_tam: { ten: 'Chỉ tiêu cần quan tâm', doan: '2–4 câu', yc: 'Nêu các chỉ tiêu chưa đạt kế hoạch: mức thiếu hụt, điểm bị mất, xu hướng gần đây. Chỉ nêu nguyên nhân nếu đã có trong dữ liệu; nếu chưa có thì không suy đoán.' },
    rui_ro: { ten: 'Rủi ro, biến động', doan: '2–4 câu', yc: 'Nêu biến động bất thường, cảnh báo của hệ thống, chỉ tiêu có xu hướng xấu đi. Chỉ viết khi có dữ liệu; nếu không có thì viết đúng một câu: "Không ghi nhận biến động / rủi ro đáng kể từ dữ liệu kỳ này."' },
    ket_luan: { ten: 'Nhận định tổng thể (kết luận)', doan: '3–5 câu', yc: 'Tổng kết kết quả chung, nêu các vấn đề cần ưu tiên xử lý và định hướng kỳ tới; thống nhất với các nhận định các mục đã soạn, không mâu thuẫn số liệu.' }
  };
  function chiTieuGon(c) { return { ma: c.ma, ten: c.ten, dvt: c.dvt, quan_tri: c.quan_tri, ke_hoach: c.ke_hoach, thuc_hien: c.thuc_hien, ty_le_ht: c.ty_le_ht, diem: c.diem, trong_so: c.trong_so, diem_mat: c.diem_mat, xep_loai: c.xep_loai, so_voi_ky_so_sanh: c.so_voi_ky_so_sanh }; }
  function chiTieuXuHuong(c) { return Object.assign(chiTieuGon(c), { ty_le_ht_theo_thang: c.ty_le_ht_theo_thang, ke_hoach_ca_nam: c.ke_hoach_ca_nam, ty_le_ht_ca_nam: c.ty_le_ht_ca_nam }); }
  function vdDong(v) {
    var o = ['- ' + v.tieu_de + (v.muc ? ' (mức ' + BC.MUC[v.muc].toLowerCase() + ')' : '') + ' — ' + (BC.DANH_GIA[v.trang_thai] || v.trang_thai), '  Hiện tượng: ' + co(v.hien_tuong)];
    var n = nn(v); if (n.length) o.push('  Nguyên nhân người lập chọn: ' + n.join('; ')); if (co(v.boi_canh)) o.push('  Bối cảnh: ' + co(v.boi_canh)); if (co(v.huong_xu_ly)) o.push('  Hướng xử lý: ' + co(v.huong_xu_ly));
    return o.join('\n');
  }
  function khongDat(c, ng) { return c.ty_le_ht === null || c.ty_le_ht < ng.dat - 1e-6; }
  /* Dữ liệu JSON lọc theo mục để prompt gọn và đúng trọng tâm */
  function jsonMuc(bc, muc, vd) {
    var j = taoJson(bc), ng = j.nguong_xep_loai, ct = j.chi_tieu;
    var out = { thong_tin: j.thong_tin, chu_giai: { ty_le: j.chu_giai.ty_le, ke_hoach_thuc_hien: j.chu_giai.ke_hoach_thuc_hien, diem: j.chu_giai.diem, quan_tri: j.chu_giai.quan_tri }, nguong_xep_loai: ng, tong_hop: j.tong_hop };
    if (vd) {
      out.chi_tieu_lien_quan = ct.filter(function (c) { return c.ma === vd.ma_chi_tieu; }).map(chiTieuXuHuong);
      out.so_theo_don_vi = j.don_vi_theo_chi_tieu.filter(function (x) { return x.ma_chi_tieu === vd.ma_chi_tieu; });
      return out;
    }
    if (muc === 'tong_quan' || muc === 'ket_luan') { out.chi_tieu = ct.map(chiTieuGon); out.xep_hang_cac_don_vi = j.xep_hang_cac_don_vi; }
    else if (muc === 'tich_cuc') out.chi_tieu_dat = ct.filter(function (c) { return !khongDat(c, ng); }).map(chiTieuGon);
    else if (muc === 'quan_tam') out.chi_tieu_chua_dat = ct.filter(function (c) { return khongDat(c, ng); }).map(chiTieuXuHuong);
    else if (muc === 'rui_ro') {
      out.canh_bao_he_thong = j.canh_bao_he_thong; out.canh_bao_ky = j.canh_bao_ky;
      out.chi_tieu_xu_huong_xau = ct.filter(function (c) { var a = c.ty_le_ht_theo_thang.filter(function (x) { return x !== null; }); return a.length >= 2 && a[a.length - 1] < a[a.length - 2] - 0.005; }).map(chiTieuXuHuong);
    }
    return out;
  }
  /* muc: 'tong_quan' | 'tich_cuc' | 'quan_tam' | 'rui_ro' | 'ket_luan' | { vd: id vấn đề }. opt.them: yêu cầu bổ sung. → văn bản prompt */
  function taoPromptMuc(bc, muc, opt) {
    opt = opt || {}; var s = bc.snapshot, ky = bc.ky.nhan, vd = null, cfg, ten, hienTai = '', L = [], ch = bc.ket_luan || {};
    if (muc && typeof muc === 'object') {
      vd = (bc.van_de || []).filter(function (v) { return v.id === muc.vd; })[0]; if (!vd) throw new Error('Không tìm thấy vấn đề.');
      cfg = { ten: 'Hướng xử lý cho vấn đề "' + vd.tieu_de + '"', doan: '2–4 câu', yc: 'Nhận xét ngắn về hiện tượng và mức ảnh hưởng đến kết quả KPI (dựa trên số liệu), rồi đề xuất 1–3 hướng xử lý để người lập cân nhắc. Hướng xử lý phải khả thi trong phạm vi chi nhánh, không giả định nguyên nhân chưa được xác nhận.' };
      ten = cfg.ten; hienTai = co(vd.huong_xu_ly);
    } else {
      cfg = MUC[muc]; if (!cfg) throw new Error('Mục không hợp lệ: ' + muc); ten = cfg.ten;
      hienTai = muc === 'ket_luan' ? co(ch.noi_dung) : co(((bc.nhan_dinh || {})[muc] || {}).noi_dung);
    }
    L.push('YÊU CẦU CHO GENIE — NHẬN ĐỊNH MỤC "' + ten.toUpperCase() + '"', '='.repeat(60), '',
      'Vai trò: Chuyên viên Phòng Tổng hợp của chi nhánh ngân hàng thương mại, đang soạn báo cáo giao ban cho Ban giám đốc.', '',
      'Nhiệm vụ: Viết nội dung cho MỘT mục duy nhất của báo cáo giao ban ' + ky + ' — ' + s.ten_dv + ': "' + ten + '" (khoảng ' + cfg.doan + ').',
      'Nội dung cần có: ' + cfg.yc, '',
      'Nguyên tắc bắt buộc:',
      '1. Chỉ dùng số liệu trong phần JSON và phần ngữ cảnh bên dưới. Không bịa số; số nào null hoặc không có thì ghi "chưa có số liệu".',
      '2. Chỉ nêu nguyên nhân khi người lập đã ghi trong ngữ cảnh; không tự suy diễn nguyên nhân.',
      '3. Số liệu trích dẫn phải khớp JSON; chỉ được tự tính phép đơn giản (chênh lệch, tỷ lệ %) từ số trong JSON. Tỷ lệ trong JSON là số thập phân (1 = 100%).',
      '4. Số theo kiểu Việt Nam: dấu phẩy ngăn cách phần thập phân, dấu chấm ngăn cách hàng nghìn, luôn kèm đơn vị tính.',
      '5. Văn phong tiếng Việt hành chính ngân hàng: trang trọng, khách quan, ngắn gọn; không khẩu ngữ, không biểu tượng cảm xúc.',
      '6. CHỈ TRẢ VỀ ĐOẠN VĂN BẢN của mục này để dán thẳng vào báo cáo: không tiêu đề, không markdown, không gạch đầu dòng, không lời dẫn hay bình luận.');
    if (co(opt.them)) L.push('7. Yêu cầu bổ sung của người lập: ' + co(opt.them));
    L.push('', 'NGỮ CẢNH', '='.repeat(60), 'Đơn vị: ' + s.ten_dv + ' · Kỳ: ' + ky + (bc.ky_so && bc.ky_so.loai !== 'khong' ? ' · so sánh với ' + bc.ky_so.nhan : '') + (bc.trang_thai === 'nhap' ? ' · (báo cáo đang là bản nháp)' : ''));
    if (hienTai) L.push('', 'Nội dung hiện có của mục này (dự thảo của hệ thống hoặc người lập đã sửa — hãy hoàn thiện, có thể viết lại cho mạch lạc, giữ đúng số liệu):', hienTai);
    var vds = (bc.van_de || []).filter(function (v) { return v.trang_thai !== 'bac_bo'; });
    if (vd) L.push('', 'Vấn đề cần viết hướng xử lý:', vdDong(vd));
    else if ((muc === 'quan_tam' || muc === 'rui_ro' || muc === 'ket_luan') && vds.length) L.push('', 'Các vấn đề trọng tâm của báo cáo (đã loại vấn đề bị bác bỏ):', vds.map(vdDong).join('\n'));
    if (muc === 'ket_luan') {
      Object.keys(BC.NH_TITLE).forEach(function (k) { var n = (bc.nhan_dinh || {})[k]; if (n && co(n.noi_dung)) L.push('', 'Nhận định mục "' + BC.NH_TITLE[k] + '" đã soạn:', co(n.noi_dung)); });
      if ((bc.giai_phap || []).length) L.push('', 'Giải pháp, kiến nghị đã soạn:', bc.giai_phap.map(function (g, i) { return (i + 1) + '. ' + co(g.giai_phap) + (co(g.phu_trach) ? ' — ' + co(g.phu_trach) : '') + (g.kien_nghi_bgd ? ' (kiến nghị BGĐ)' : ''); }).join('\n'));
    }
    L.push('', 'SỐ LIỆU (JSON)', '='.repeat(60), BAT_DAU, JSON.stringify(jsonMuc(bc, muc && typeof muc === 'string' ? muc : null, vd)), KET_THUC, '', '— Hết —');
    return L.join('\n');
  }
  /* Sao chép vào bộ nhớ tạm → Promise<boolean>; false = không được phép (giao diện hiện ô văn bản để tự chép). */
  function saoChep(text) {
    return root.navigator && root.navigator.clipboard ? root.navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; }) : Promise.resolve(false);
  }
  function tenTep(bc) { return 'Prompt_Genie_' + root.UI.slug(bc.snapshot.ten_dv) + '_' + root.UI.slug(bc.ky.nhan) + (bc.trang_thai === 'nhap' ? '_NHAP' : '') + '.txt'; }
  /* Tải tệp .txt (UTF-8 có BOM để Notepad hiện đúng tiếng Việt). */
  function xuat(bc, opt) { var txt = taoPrompt(bc, opt); root.UI.download(tenTep(bc), '﻿' + txt, 'text/plain;charset=utf-8'); return txt; }

  root.KPI_GENIE = { taoPromptMuc: taoPromptMuc, saoChep: saoChep, MUC: MUC, taoPrompt: taoPrompt, taoJson: taoJson, nguCanh: nguCanh, tenTep: tenTep, xuat: xuat, DO_DAI: DO_DAI, BAT_DAU: BAT_DAU, KET_THUC: KET_THUC, CHIEU: CHIEU };
})(typeof window !== 'undefined' ? window : this);
