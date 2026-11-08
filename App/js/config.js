/* CẤU HÌNH MẶC ĐỊNH — KPI CHI NHÁNH BẮC NGHỆ AN (CN 444)
 * Đây là danh mục MẪU để khởi tạo lần đầu. Sau khi chạy, mọi chỉnh sửa (đơn vị, chỉ tiêu, trọng số) làm trong
 * màn hình "Danh mục" và được lưu cùng dữ liệu — không cần sửa file này.
 *
 * Quy ước:
 *  - Kế hoạch / thực hiện là số LŨY KẾ đến tháng chọn (không cộng dồn các tháng).
 *  - Chỉ tiêu ĐVT "%" lưu đúng con số phần trăm đã nhập (1,5 = 1,5%; 95 = 95%).
 *  - huong: 'cao_tot' (TH/KH) · 'thap_tot' (KH/TH, VD tỷ lệ nợ xấu) · 'nhap_ty_le' (nhập thẳng % hoàn thành, không cần KH).
 *  - tong_hop_cn: cách ra số Chi nhánh khi CN chưa nhập số riêng — 'tong' (cộng các phòng) · 'tb' (bình quân) · 'nhap' (chỉ nhập tay).
 *  - chi_tham_khao: CHỈ TIÊU QUẢN TRỊ — theo dõi KH/TH/%HT nhưng không chấm điểm KPI (tên trường giữ nguyên để tương thích dữ liệu cũ).
 *  - Trọng số khai theo KHỐI; khối 'CN' là thẻ điểm của toàn chi nhánh. */
(function (root) {
  var KHOI = [
    { ma: 'CN',   ten: 'Toàn chi nhánh (thẻ điểm CN)' },
    { ma: 'KHDN', ten: 'Khối Khách hàng doanh nghiệp' },
    { ma: 'KHCN', ten: 'Khối Khách hàng cá nhân' },
    { ma: 'PGD',  ten: 'Phòng giao dịch' },
    { ma: 'HT',   ten: 'Dịch vụ & hỗ trợ' }
  ];

  var DON_VI = [
    { ma: 'KHDN',  ten: 'Phòng Khách hàng doanh nghiệp', ten_ngan: 'P.KHDN',       khoi: 'KHDN' },
    { ma: 'KHCN',  ten: 'Phòng Khách hàng cá nhân',      ten_ngan: 'P.KHCN',       khoi: 'KHCN' },
    { ma: 'DVKH',  ten: 'Phòng Dịch vụ khách hàng',      ten_ngan: 'P.DVKH',       khoi: 'HT' },
    { ma: 'PGD_DC', ten: 'PGD Diễn Châu',                ten_ngan: 'PGD Diễn Châu', khoi: 'PGD' },
    { ma: 'PGD_QL', ten: 'PGD Quỳnh Lưu',                ten_ngan: 'PGD Quỳnh Lưu', khoi: 'PGD' },
    { ma: 'PGD_HM', ten: 'PGD Hoàng Mai',                ten_ngan: 'PGD Hoàng Mai', khoi: 'PGD' },
    { ma: 'PGD_TH', ten: 'PGD Thái Hòa',                 ten_ngan: 'PGD Thái Hòa',  khoi: 'PGD' },
    { ma: 'PGD_YT', ten: 'PGD Yên Thành',                ten_ngan: 'PGD Yên Thành', khoi: 'PGD' }
  ];

  /* [mã, tên đầy đủ, tên ngắn, ĐVT, nhóm, hướng, tổng hợp CN, chỉ tiêu quản trị (không chấm điểm), %tối đa,
   *  trọng số { CN, KHDN, KHCN, PGD, HT }] */
  var CT = [
    ['NII', 'Thu nhập lãi thuần', 'NII', 'Tr đồng', 'Hiệu quả kinh doanh', 'cao_tot', 'tong', 0, 1.3, [20, 20, 20, 20, 10]],
    ['THU_NGOAI_LAI', 'Thu thuần ngoài lãi', 'Thu ngoài lãi', 'Tr đồng', 'Hiệu quả kinh doanh', 'cao_tot', 'tong', 0, 1.3, [12, 12, 12, 12, 24]],
    ['VBI', 'Doanh số bảo hiểm phi nhân thọ VBI', 'BH VBI', 'Tr đồng', 'Bảo hiểm', 'cao_tot', 'tong', 0, 1.3, [3, 0, 4, 4, 4]],
    ['MANULIFE', 'Doanh số bảo hiểm nhân thọ Manulife', 'BH Manulife', 'Tr đồng', 'Bảo hiểm', 'cao_tot', 'tong', 0, 1.3, [2, 0, 4, 4, 4]],
    ['DU_NO_TT', 'Dư nợ tín dụng bình quân tăng trưởng trong năm (delta TDBQ)', 'Δ Dư nợ BQ', 'Tỷ đồng', 'Tín dụng', 'cao_tot', 'tong', 0, 1.3, [12, 16, 14, 12, 0]],
    ['DU_NO_BQ', 'Dư nợ tín dụng bình quân', 'Dư nợ BQ', 'Tỷ đồng', 'Tín dụng', 'cao_tot', 'tong', 1, 1.3, [0, 0, 0, 0, null]],
    ['DU_NO_CUOI_KY', 'Dư nợ tín dụng cuối kỳ', 'Dư nợ cuối kỳ', 'Tỷ đồng', 'Tín dụng', 'cao_tot', 'tong', 1, 1.3, [0, 0, 0, 0, null]],
    ['TY_LE_NO_XAU', 'Tỷ lệ nợ xấu trước XLRR', 'Tỷ lệ nợ xấu', '%', 'Tín dụng', 'thap_tot', 'nhap', 0, 1.0, [12, 10, 8, 8, 0]],
    ['THU_NO_XLRR', 'Thu hồi nợ đã XLRR', 'Thu nợ XLRR', 'Tr đồng', 'Tín dụng', 'cao_tot', 'tong', 0, 1.3, [8, 6, 6, 6, 0]],
    ['NGUON_VON_TT', 'Nguồn vốn huy động bình quân tăng trưởng trong năm (delta NVBQ)', 'Δ Nguồn vốn BQ', 'Tỷ đồng', 'Huy động vốn', 'cao_tot', 'tong', 0, 1.3, [12, 14, 12, 14, 12]],
    ['NGUON_VON_BQ', 'Nguồn vốn huy động bình quân', 'Nguồn vốn BQ', 'Tỷ đồng', 'Huy động vốn', 'cao_tot', 'tong', 1, 1.3, [0, 0, 0, 0, 0]],
    ['NGUON_VON_CUOI_KY', 'Nguồn vốn huy động cuối kỳ', 'Nguồn vốn cuối kỳ', 'Tỷ đồng', 'Huy động vốn', 'cao_tot', 'tong', 1, 1.3, [0, 0, 0, 0, 0]],
    ['CASA_CUOI_KY', 'Tiền gửi không kỳ hạn (CASA) cuối kỳ', 'CASA cuối kỳ', 'Tỷ đồng', 'Huy động vốn', 'cao_tot', 'tong', 1, 1.3, [0, 0, 0, 0, 0]],
    ['CASA_TT', 'CASA bình quân tăng trưởng trong năm', 'Δ CASA BQ', 'Tỷ đồng', 'Huy động vốn', 'cao_tot', 'tong', 0, 1.3, [5, 8, 5, 5, 8]],
    ['KHUT_TANG', 'Số lượng khách hàng ưu tiên tăng thêm', 'KHUT tăng', 'KH', 'Khách hàng', 'cao_tot', 'tong', 0, 1.3, [4, 4, 4, 5, 6]],
    ['TK_LUONG', 'Số lượng KHCN nhận lương qua tài khoản', 'KH nhận lương', 'KH', 'Khách hàng', 'cao_tot', 'tong', 0, 1.3, [1, 2, 3, 3, 4]],
    ['THE_TDQT', 'Số lượng thẻ tín dụng quốc tế kích hoạt lũy kế', 'Thẻ TDQT', 'Thẻ', 'Thẻ & dịch vụ số', 'cao_tot', 'tong', 0, 1.3, [2, 0, 4, 3, 4]],
    ['IPAY', 'Khách hàng hoạt động hàng tháng (MAU) iPay', 'iPay MAU', 'KH', 'Thẻ & dịch vụ số', 'cao_tot', 'tong', 0, 1.3, [3, 0, 4, 4, 8]],
    ['EFAST', 'Khách hàng hoạt động hàng tháng (MAU) eFAST', 'eFAST MAU', 'KH', 'Thẻ & dịch vụ số', 'cao_tot', 'tong', 0, 1.3, [2, 8, 0, 0, 4]],
    ['CX', 'Trải nghiệm khách hàng (CX) — % hoàn thành', 'CX', '%', 'Chất lượng', 'nhap_ty_le', 'tb', 0, 1.0, [2, 0, 0, 0, 12]]
  ];

  var KHOI_COT = ['CN', 'KHDN', 'KHCN', 'PGD', 'HT'];
  var CT_MOI_25 = CT.filter(function (c) { return /_CUOI_KY$/.test(c[0]); });
  var indicators = [], weights = [];
  CT.forEach(function (c, i) {
    indicators.push({ ma: c[0], ten: c[1], ten_ngan: c[2], dvt: c[3], nhom: c[4], huong: c[5], tong_hop_cn: c[6],
      chi_tham_khao: !!c[7], thu_tu: i + 1, trang_thai: 'active' });
    c[9].forEach(function (ts, k) {
      if (ts === null || ts === undefined) return;
      if (ts === 0 && !c[7]) return;           // trọng số 0 với chỉ tiêu tính điểm = không áp dụng cho khối
      weights.push({ ma_chi_tieu: c[0], khoi: KHOI_COT[k], trong_so: ts, toi_da: c[8] });
    });
  });

  root.KPI_CFG = {
    PHIEN_BAN: '2.12.0',
    CT_MOI_25: CT_MOI_25.map(function (c) { return { ind: { ma: c[0], ten: c[1], ten_ngan: c[2], dvt: c[3], nhom: c[4], huong: c[5], tong_hop_cn: c[6], chi_tham_khao: true, trang_thai: 'active' }, w: c[9] }; }),
    KHOI_COT: KHOI_COT,
    NGAY_PHAT_HANH: '06/11/2026',
    MA_CN: 'CN',
    SCHEMA: 2,
    TRANG_THAI: { DAT: 'Đạt', KHA: 'Khá', CCT: 'Cần cải thiện', CHUA_DAT: 'Chưa đạt', THIEU: 'Thiếu dữ liệu', KAD: 'Không áp dụng', THIEU_CH: 'Thiếu cấu hình' },
    mac_dinh: function () {
      return {
        schema: 2,
        settings: { ten_chi_nhanh: 'VietinBank Chi nhánh Bắc Nghệ An', ma_chi_nhanh: '444', nam: 2026,
          nguong: { dat: 1.0, kha: 0.8, cct: 0.7 }, so_thang_canh_bao: 2 },   // PIN: lưu băm ở settings.pin_hash (mặc định 1111 nếu chưa đặt)
        khoi: JSON.parse(JSON.stringify(KHOI)),
        don_vi: DON_VI.map(function (d, i) { return Object.assign({ thu_tu: i + 1, trang_thai: 'active' }, d); }),
        indicators: JSON.parse(JSON.stringify(indicators)),
        weights: JSON.parse(JSON.stringify(weights)),
        rec: {},          // khóa "k|ma_ct|ma_dv|nam|thang" (k = 'p' kế hoạch | 'a' thực hiện) → [giá trị, thời điểm ms]
        ghi_chu: {},      // khóa "ma_dv|nam|thang" → [văn bản, thời điểm]
        nhat_ky: [],
        dm_luc: Date.now(),
        cap_nhat_luc: 0,
        du_lieu_mau: false
      };
    }
  };
})(window);
