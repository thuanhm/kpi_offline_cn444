/* BÁO CÁO GIAO BAN — dữ liệu câu hỏi xác minh + nguyên nhân GỢI Ý.
 * Chỉ là gợi ý để người lập báo cáo CHỌN — không phải kết luận, không chọn sẵn nguyên nhân nào. Biến {…} được điền từ số liệu đã chụp. */
(function (root) {
  /* Nhóm nghiệp vụ nhận từ tên chỉ tiêu + nhóm (không đặt sẵn danh sách chỉ tiêu). */
  var NHOM = [
    { id: 'tin_dung', ten: 'Tín dụng', tu: /(dư nợ|du no|tín dụng|tin dung|cho vay|giải ngân|nợ xấu|no xau|nợ nhóm|xlrr|thu nợ)/i },
    { id: 'huy_dong', ten: 'Huy động vốn', tu: /(nguồn vốn|nguon von|huy động|huy dong|tiền gửi|tien gui|casa|không kỳ hạn)/i },
    { id: 'dich_vu', ten: 'Dịch vụ & thu thuần', tu: /(phí|thu thuần|thu thuan|dịch vụ|dich vu|bảo hiểm|vbi|manulife|thẻ|the |pos|ipay|efast|tk |tài khoản|khut|kiều hối|ngoại tệ|lãi thuần|nii|lợi nhuận)/i },
    { id: 'khac', ten: 'Chỉ tiêu khác', tu: /.*/ }
  ];
  function nhomCua(ind) {
    var t = String((ind && ind.ten) || '') + ' ' + String((ind && ind.nhom) || '');
    if (/(^|[^a-zà-ỹ])(thẻ|the)([^a-zà-ỹ]|$)/i.test(t)) return 'dich_vu';
    for (var i = 0; i < NHOM.length; i++) if (NHOM[i].tu.test(t)) return NHOM[i].id;
    return 'khac';
  }
  /* Câu hỏi theo DẤU HIỆU. Biến: {ten} {gap} {ht} {delta} {ky_so} {lien_tiep} {ht_nam} {tg} {dv_thap} */
  var CAU_HOI = {
    'muc.canh_bao': ['Chỉ tiêu đạt {ht} — đâu là khó khăn chính so với kế hoạch được giao?', 'Phần còn thiếu {gap} tập trung ở đơn vị / nhóm khách hàng nào?'],
    'muc.chu_y': ['Chỉ tiêu đạt {ht} — cần thêm điều kiện gì để về đích?'],
    'muc.thap': ['Chỉ tiêu đạt {ht}, chưa tới mức Đạt — còn vướng ở đâu?'],
    'ah.cao': ['Chỉ tiêu ảnh hưởng lớn đến điểm KPI — có cần ưu tiên nguồn lực cho chỉ tiêu này?'],
    'xh.giam_lien_tiep': ['Chỉ tiêu giảm {lien_tiep} kỳ liên tiếp — giảm đều ở nhiều đơn vị hay tập trung vài đơn vị / khách hàng lớn?'],
    'xh.dat_nhung_giam': ['Đang đạt kế hoạch nhưng giảm {lien_tiep} kỳ — có nguy cơ không giữ được đến cuối kỳ?'],
    'xh.giam': ['Mức giảm {delta} so {ky_so} do khách hàng giảm số dư / hoạt động, hay do yếu tố thời điểm?'],
    'tien_do.cham': ['Đã qua {tg} thời gian năm nhưng mới đạt {ht_nam} kế hoạch năm — cần đẩy mạnh thực hiện ở mảng nào?']
  };
  var CAU_HOI_NHOM = {
    tin_dung: 'Trong kỳ có khoản vay lớn đến hạn, tất toán trước hạn hoặc khách hàng chuyển sang tổ chức tín dụng khác không?',
    huy_dong: 'Có khách hàng rút / chuyển khoản lớn, sổ đến hạn chưa tái tục hoặc cạnh tranh lãi suất không?',
    dich_vu: 'Sản phẩm / chương trình nào đang triển khai chưa đạt, có vướng quy trình hoặc công cụ không?',
    khac: 'Yếu tố nào ảnh hưởng chính đến kết quả kỳ này?'
  };
  var NGUYEN_NHAN = {
    tin_dung: [['kh_tra_no', 'Khách hàng trả nợ / tất toán trước hạn'], ['den_han', 'Khoản vay đến hạn chưa giải ngân lại'], ['mua_vu', 'Yếu tố mùa vụ, chu kỳ sản xuất kinh doanh'], ['nhu_cau', 'Nhu cầu vay mới thấp'],
      ['dieu_kien', 'Hồ sơ chưa đủ điều kiện / đang chờ phê duyệt'], ['canh_tranh', 'Cạnh tranh lãi suất từ ngân hàng khác'], ['chat_luong', 'Siết chất lượng tín dụng, xử lý nợ'], ['nhan_su', 'Thay đổi nhân sự / địa bàn phụ trách']],
    huy_dong: [['rut_tien', 'Khách hàng rút tiền / chuyển khoản lớn'], ['den_han', 'Sổ đến hạn chưa tái tục'], ['lai_suat', 'Cạnh tranh lãi suất'], ['mua_vu', 'Yếu tố mùa vụ, thời điểm (lương, thuế, lễ tết)'],
      ['kh_lon', 'Biến động của một vài khách hàng lớn'], ['to_chuc', 'Khách hàng tổ chức điều chuyển vốn'], ['nhan_su', 'Thay đổi nhân sự / địa bàn phụ trách']],
    dich_vu: [['trien_khai', 'Chưa triển khai / triển khai chậm sản phẩm'], ['chuong_trinh', 'Chương trình khuyến mại, ưu đãi kết thúc hoặc chưa có'], ['quy_trinh', 'Vướng quy trình, hệ thống, công cụ'],
      ['nhu_cau', 'Nhu cầu khách hàng thấp'], ['chi_tieu_moi', 'Chỉ tiêu mới giao, chưa có tệp khách hàng'], ['ghi_nhan', 'Thời điểm ghi nhận thu nhập / hạch toán'], ['nhan_su', 'Phân công cán bộ chưa phù hợp']],
    khac: [['du_lieu', 'Số liệu chưa đầy đủ / chưa cập nhật'], ['thoi_diem', 'Yếu tố thời điểm'], ['nhan_su', 'Nhân sự'], ['thi_truong', 'Thị trường, địa bàn']]
  };
  /* Nguồn không phải chỉ tiêu KPI */
  var CAU_HOI_NGUON = {
    du_lieu: ['Các chỉ tiêu chưa đủ số — đầu mối nào cần nhập, hạn khi nào?'],
    don_vi: ['Đơn vị dưới ngưỡng Khá cần hỗ trợ gì (khách hàng, sản phẩm, nhân sự, công cụ)?'],
    phan_giao: ['Phần kế hoạch chi nhánh chưa phân giao hết cho các phòng / PGD — dự kiến phân giao khi nào, cho đơn vị nào?']
  };
  var NGUYEN_NHAN_NGUON = {
    du_lieu: [['chua_nhap', 'Đầu mối chưa nhập'], ['chua_co_bc', 'Chưa có báo cáo nguồn'], ['dang_doi_soat', 'Đang đối soát số liệu']],
    don_vi: [['moi', 'Nhân sự mới / mới điều chuyển'], ['dia_ban', 'Địa bàn khó'], ['ky_nang', 'Cần bổ sung kỹ năng'], ['kh_giam', 'Khách hàng giảm']],
    phan_giao: [['cho_chi_dao', 'Chờ chỉ đạo của Ban giám đốc'], ['cho_tsc', 'Chờ Trụ sở chính xác nhận kế hoạch'], ['can_can_doi', 'Đang cân đối giữa các đơn vị']]
  };
  root.KPI_BAO_CAO_CAU_HOI = { NHOM: NHOM, nhomCua: nhomCua, CAU_HOI: CAU_HOI, CAU_HOI_NHOM: CAU_HOI_NHOM, NGUYEN_NHAN: NGUYEN_NHAN, CAU_HOI_NGUON: CAU_HOI_NGUON, NGUYEN_NHAN_NGUON: NGUYEN_NHAN_NGUON };
})(typeof window !== 'undefined' ? window : this);
