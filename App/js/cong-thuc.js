/* CÔNG THỨC TỪ DỮ LIỆU THÔ — hàm thuần, gom số theo PHÒNG/PGD.
 * Một công thức: chọn cột đơn vị (mã phòng ban / mã DVKD trong file) → lọc dòng → gom giá trị → chia đơn vị tiền → trừ mốc → ghi vào chỉ tiêu.
 * Cột luôn nhận theo TÊN tiêu đề (bỏ dấu, không phân biệt hoa thường, bỏ ký tự ()/.-_), không theo vị trí → file thêm/bớt cột vẫn chạy.
 * Dữ liệu thô chỉ nằm trong bộ nhớ trình duyệt khi tính; ứng dụng chỉ lưu công thức và kết quả theo phòng.
 *
 * Công thức: { id, ten, mo_ta, ma_ct, loai: 'a'|'p', cot_dv, loc: [{cot, dk, gt}], ham, cot_gt, loc_tu: [{cot, dk, gt}],
 *              chia, tru_moc: '' | 'ct' | 'nhap', moc_ct, moc_nhap: {ma_dv: số}, ghi_cn, luc } */
(function (root) {
  function khoa(s) {
    return String(s === null || s === undefined ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase().replace(/[()\/.\-_:]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function trong(v) { return v === null || v === undefined || (typeof v === 'string' && v.trim() === ''); }
  /* Số trong file thô: hỗ trợ cả định dạng quốc tế (chấm thập phân) và Việt Nam (phẩy thập phân) */
  function so(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (trong(v)) return null;
    var s = String(v).trim().replace(/\s| /g, ''), neg = /^\(.*\)$/.test(s); if (neg) s = s.slice(1, -1);
    s = s.replace(/%$/, '');
    var lastDot = s.lastIndexOf('.'), lastComma = s.lastIndexOf(',');
    if (lastDot >= 0 && lastComma >= 0) {
      if (lastDot > lastComma) s = s.replace(/,/g, '');   // 1,234,567.89 -> chấm thập phân
      else s = s.replace(/\./g, '').replace(',', '.');     // 1.234.567,89 -> phẩy thập phân
    } else if (lastDot >= 0) {
      var dotCount = (s.match(/\./g) || []).length;
      if (dotCount > 1) s = s.replace(/\./g, '');         // 1.000.000 -> nhiều chấm là hàng nghìn
      // Đúng 1 dấu chấm (152.443, 98.5342...): là dấu chấm thập phân chuẩn quốc tế, giữ nguyên
    } else if (lastComma >= 0) {
      var commaCount = (s.match(/,/g) || []).length;
      if (commaCount > 1) s = s.replace(/,/g, '');         // 1,000,000 -> nhiều phẩy là hàng nghìn
      else s = s.replace(',', '.');                       // 152,44 -> phẩy thập phân
    }
    var x = Number(s); if (!isFinite(x)) return null;
    return neg ? -x : x;
  }

  /* Dò dòng tiêu đề trong 25 dòng đầu: dòng có nhiều ô CHỮ nhất (≥ 2) và dòng dưới không trống. */
  function doTieuDe(aoa) {
    var tot = -1, max = 1;
    for (var i = 0; i < Math.min(aoa.length, 25); i++) {
      var r = aoa[i] || [], n = 0;
      for (var j = 0; j < r.length; j++) if (typeof r[j] === 'string' && r[j].trim() && so(r[j]) === null) n++;
      var sau = aoa[i + 1] || [];
      if (n > max && sau.some(function (v) { return !trong(v); })) { max = n; tot = i; }
    }
    return tot;
  }
  /* aoa → bảng { hdr: [tên], k: [khoá], rows, i0 } */
  function bang(aoa, dong) {
    var i0 = dong > 0 ? dong - 1 : doTieuDe(aoa);
    if (i0 < 0) return null;
    var hdr = (aoa[i0] || []).map(function (x, i) { return trong(x) ? 'Cột ' + (i + 1) : String(x).trim(); });
    var rows = aoa.slice(i0 + 1).filter(function (r) { return r && r.some(function (v) { return !trong(v); }); });
    return { hdr: hdr, k: hdr.map(khoa), rows: rows, i0: i0 };
  }
  function timCot(b, ten) {
    if (!ten) return -1;
    var k = khoa(ten), i = b.k.indexOf(k);
    return i;
  }

  var DK = {
    bang: 'bằng', khac: 'khác', bat_dau: 'bắt đầu bằng', khong_bat_dau: 'không bắt đầu bằng', chua: 'chứa', khong_chua: 'không chứa',
    trong_ds: 'thuộc danh sách', ngoai_ds: 'không thuộc danh sách', lon_hon: '>', lon_bang: '≥', nho_hon: '<', nho_bang: '≤', co_gt: 'có giá trị', trong: 'để trống'
  };
  var HAM = { tong: 'Tổng', dem: 'Đếm số dòng', dem_kt: 'Đếm không trùng', tb: 'Trung bình', max: 'Lớn nhất', min: 'Nhỏ nhất', ty_le: 'Tỷ lệ % (tử số / mẫu số)' };

  function dsGt(gt) { return String(gt || '').split(/[;,\n]/).map(khoa).filter(Boolean); }
  /* Biên dịch điều kiện → hàm(row) */
  function bienDich(b, loc, loi) {
    return (loc || []).filter(function (c) { return c && c.cot; }).map(function (c) {
      var i = timCot(b, c.cot);
      if (i < 0) { loi.push('Không có cột "' + c.cot + '" trong file.'); return function () { return false; }; }
      var g = khoa(c.gt), ds = dsGt(c.gt), n = so(c.gt);
      switch (c.dk) {
        case 'bang': return function (r) { var v = r[i]; var x = so(v); return (n !== null && x !== null) ? x === n : khoa(v) === g; };
        case 'khac': return function (r) { var v = r[i]; var x = so(v); return (n !== null && x !== null) ? x !== n : khoa(v) !== g; };
        case 'bat_dau': return function (r) { return ds.some(function (d) { return khoa(r[i]).indexOf(d) === 0; }); };
        case 'khong_bat_dau': return function (r) { return !ds.some(function (d) { return khoa(r[i]).indexOf(d) === 0; }); };
        case 'chua': return function (r) { return khoa(r[i]).indexOf(g) >= 0; };
        case 'khong_chua': return function (r) { return khoa(r[i]).indexOf(g) < 0; };
        case 'trong_ds': return function (r) { var v = khoa(r[i]); return ds.indexOf(v) >= 0 || ds.some(function (d) { return so(d) !== null && so(r[i]) === so(d); }); };
        case 'ngoai_ds': return function (r) { var v = khoa(r[i]); return !(ds.indexOf(v) >= 0 || ds.some(function (d) { return so(d) !== null && so(r[i]) === so(d); })); };
        case 'lon_hon': return function (r) { var x = so(r[i]); return x !== null && x > n; };
        case 'lon_bang': return function (r) { var x = so(r[i]); return x !== null && x >= n; };
        case 'nho_hon': return function (r) { var x = so(r[i]); return x !== null && x < n; };
        case 'nho_bang': return function (r) { var x = so(r[i]); return x !== null && x <= n; };
        case 'co_gt': return function (r) { return !trong(r[i]); };
        case 'trong': return function (r) { return trong(r[i]); };
      }
      return function () { return true; };
    });
  }

  /* Bảng ghép mã: giá trị cột đơn vị (khoá) → mã đơn vị trong danh mục.
   * Nguồn: mã đơn vị, tên, tên ngắn và trường "Mã trong dữ liệu thô" (ma_nguon, nhiều mã cách nhau ;).
   * Hỗ trợ tự động chuẩn hoá mã phòng Core/PS của ngân hàng: 44405 <-> 044405000 */
  function bangGhep(donVi) {
    var m = {};
    donVi.forEach(function (u) {
      if (u.trang_thai === 'inactive') return;
      [u.ma, u.ten, u.ten_ngan].forEach(function (x) { if (x) m[khoa(x)] = u.ma; });
      var themBienThe = function (raw) {
        var k = khoa(raw);
        if (!k) return;
        m[k] = u.ma;
        // Nếu mã 5 số: sinh thêm mã PS 9 số (0 + mã + 000)
        if (/^\d{5}$/.test(k)) m['0' + k + '000'] = u.ma;
        // Nếu mã PS 9 số dạng 0444xx000: sinh thêm mã 5 số
        if (/^0\d{5}000$/.test(k)) m[k.slice(1, 6)] = u.ma;
      };
      themBienThe(u.ma);
      String(u.ma_nguon || '').split(/[;,\n]/).forEach(themBienThe);
    });
    return m;
  }

  function gom() { return { n: 0, s: 0, set: null, mx: null, mn: null, tu: 0 }; }
  function themGt(a, ham, v, laTu) {
    a.n++;
    if (ham === 'dem') return;
    if (ham === 'dem_kt') { if (!trong(v)) { (a.set || (a.set = {}))[khoa(v)] = 1; } return; }
    var x = so(v); if (x === null) return;
    a.s += x; if (laTu) a.tu += x;
    if (a.mx === null || x > a.mx) a.mx = x;
    if (a.mn === null || x < a.mn) a.mn = x;
  }
  function ketQua(a, ham) {
    if (!a || !a.n) return null;
    switch (ham) {
      case 'dem': return a.n;
      case 'dem_kt': return a.set ? Object.keys(a.set).length : 0;
      case 'tb': return a.s / a.n;
      case 'max': return a.mx;
      case 'min': return a.mn;
      case 'ty_le': return a.s ? a.tu / a.s * 100 : null;
      default: return a.s;
    }
  }

  /* Chạy công thức trên bảng. ctx: { don_vi, moc: function(ma_ct, ma_dv) → số | null }
   * → { ok, loi[], tong_dong, dong_loc, theo_dv: {ma: {gia_tri, n, moc, ket_qua}}, cn, khong_ghep: [{gt, n, gia_tri}] } */
  function chay(f, b, ctx) {
    var loi = [], out = { ok: false, loi: loi, tong_dong: b.rows.length, dong_loc: 0, theo_dv: {}, cn: null, khong_ghep: [] };
    var loc = bienDich(b, f.loc, loi), locTu = f.ham === 'ty_le' ? bienDich(b, f.loc_tu, loi) : [];
    var iDv = f.cot_dv ? timCot(b, f.cot_dv) : -1, iGt = timCot(b, f.cot_gt);
    var thieuND = dsNhanDien(f).filter(function (c) { return timCot(b, c) < 0; });
    if (thieuND.length) loi.push('File không đúng loại cho công thức này (thiếu cột nhận diện: ' + thieuND.join(', ') + ').');
    if (f.cot_dv && iDv < 0) loi.push('Không có cột đơn vị "' + f.cot_dv + '" trong file.');
    if (f.ham !== 'dem' && iGt < 0) loi.push(f.cot_gt ? 'Không có cột giá trị "' + f.cot_gt + '" trong file.' : 'Chưa chọn cột giá trị.');
    if (f.ham === 'ty_le' && !locTu.length) loi.push('Hàm tỷ lệ cần ít nhất 1 điều kiện tử số (VD Nhóm nợ ≥ 3).');
    if (loi.length) return out;
    var ghep = bangGhep(ctx.don_vi), dv = {}, kg = {}, all = gom(), ham = f.ham;
    for (var r = 0; r < b.rows.length; r++) {
      var row = b.rows[r], ok = true;
      for (var c = 0; c < loc.length; c++) if (!loc[c](row)) { ok = false; break; }
      if (!ok) continue;
      out.dong_loc++;
      var laTu = false;
      if (ham === 'ty_le') { laTu = true; for (var t = 0; t < locTu.length; t++) if (!locTu[t](row)) { laTu = false; break; } }
      var v = iGt >= 0 ? row[iGt] : null;
      themGt(all, ham, v, laTu);
      if (iDv < 0) continue;
      var raw = row[iDv], ma = ghep[khoa(raw)];
      if (!ma) { var kk = trong(raw) ? '(trống)' : String(raw).trim(); (kg[kk] || (kg[kk] = gom())); themGt(kg[kk], ham, v, laTu); continue; }
      themGt(dv[ma] || (dv[ma] = gom()), ham, v, laTu);
    }
    var chia = +f.chia || 1, tinh = function (a, ma) {
      var g = ketQua(a, ham); if (g === null) return null;
      if (ham !== 'ty_le' && ham !== 'dem' && ham !== 'dem_kt') g = g / chia;
      var moc = null;
      if (f.tru_moc === 'ct' && f.moc_ct) moc = ctx.moc(f.moc_ct, ma);
      else if (f.tru_moc === 'nhap') { var mm = (f.moc_nhap || {})[ma]; moc = typeof mm === 'number' ? mm : null; }
      var kq = f.tru_moc ? (moc === null ? null : g - moc) : g;
      return { gia_tri: lam(g), n: a.n, moc: moc, ket_qua: kq === null ? null : lam(kq), thieu_moc: !!f.tru_moc && moc === null };
    };
    Object.keys(dv).forEach(function (ma) { out.theo_dv[ma] = tinh(dv[ma], ma); });
    if (f.ghi_cn || iDv < 0) out.cn = tinh(all, 'CN');
    out.khong_ghep = Object.keys(kg).map(function (k) { return { gt: k, n: kg[k].n, gia_tri: ketQua(kg[k], ham) }; }).sort(function (a, b) { return b.n - a.n; });
    out.ok = true;
    return out;
  }
  function lam(x) { return Math.round(x * 1e4) / 1e4; }

  /* Công thức nào dùng được với file này (đủ cột)? → [] tên cột thiếu */
  function dsNhanDien(f) { return String(f.nhan_dien || '').split(/[;\n]/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function cotThieu(f, b) {
    var can = dsNhanDien(f).concat([f.cot_dv, f.ham === 'dem' ? null : f.cot_gt].concat((f.loc || []).map(function (c) { return c.cot; })).concat(f.ham === 'ty_le' ? (f.loc_tu || []).map(function (c) { return c.cot; }) : []));
    var th = []; can.forEach(function (c) { if (c && timCot(b, c) < 0 && th.indexOf(c) < 0) th.push(c); });
    return th;
  }

  /* Diễn giải công thức thành câu tiếng Việt (để rà soát, giống SUMIFS). */
  function dienGiai(f, tenCt) {
    var dk = function (l) { return (l || []).filter(function (c) { return c.cot; }).map(function (c) { return '«' + c.cot + '» ' + DK[c.dk] + (c.dk === 'co_gt' || c.dk === 'trong' ? '' : ' ' + c.gt); }).join(' VÀ '); };
    var s = (HAM[f.ham] || 'Tổng') + (f.ham === 'dem' ? '' : ' cột «' + (f.cot_gt || '?') + '»');
    if (f.ham === 'ty_le') s = 'Tổng «' + f.cot_gt + '» của dòng thỏa [' + dk(f.loc_tu) + '] ÷ tổng «' + f.cot_gt + '» × 100';
    var t = s + (f.loc && f.loc.some(function (c) { return c.cot; }) ? ', chỉ lấy dòng có ' + dk(f.loc) : '') +
      (f.cot_dv ? ', gom theo «' + f.cot_dv + '» → phòng/PGD' : ', không chia theo phòng (ghi cho Toàn CN)') +
      (+f.chia > 1 && f.ham !== 'ty_le' && f.ham !== 'dem' && f.ham !== 'dem_kt' ? ', chia ' + new Intl.NumberFormat('vi-VN').format(f.chia) : '') +
      (f.tru_moc === 'ct' ? ', trừ số «' + f.moc_ct + '» tháng 12 năm trước' : f.tru_moc === 'nhap' ? ', trừ số gốc nhập tay từng phòng' : '') +
      ' → ' + (f.loai === 'p' ? 'kế hoạch' : 'thực hiện') + ' «' + (tenCt || f.ma_ct) + '».';
    return t;
  }

  /* Công thức mẫu theo cấu trúc báo cáo dư nợ (BCCV/BC_QLHS_ChoVay) và huy động (BCNV). */
  function mau() {
    var t = Date.now(), id = function (s) { return 'MAU_' + s; };
    var cn = [{ cot: 'Ma chi nhanh', dk: 'bang', gt: '444' }], DN = 'Nhom no', NV = 'Loai tai khoan';
    return [
      { id: id('DNBQ'), ten: 'Dư nợ BQ năm (BCCV)', nhan_dien: DN, ma_ct: 'DU_NO_BQ', loai: 'a', cot_dv: 'Ma DVKD (sau ra soat)', loc: cn, ham: 'tong', cot_gt: 'Du BQ nam', chia: 1000, tru_moc: '', ghi_cn: true, mau: true, luc: t,
        mo_ta: 'Cộng cột Dư BQ năm theo phòng, quy về tỷ đồng (chia 1.000 do báo cáo ở đơn vị triệu).' },
      { id: id('DNTT'), ten: 'Δ Dư nợ BQ tăng trưởng (BCCV)', nhan_dien: DN, ma_ct: 'DU_NO_TT', loai: 'a', cot_dv: 'Ma DVKD (sau ra soat)', loc: cn, ham: 'tong', cot_gt: 'Du BQ nam', chia: 1000, tru_moc: 'ct', moc_ct: 'DU_NO_BQ', ghi_cn: true, mau: true, luc: t,
        mo_ta: 'Dư BQ năm nay trừ Dư nợ BQ tháng 12 năm trước (cần có số DU_NO_BQ T12 năm trước, hoặc đổi sang số gốc nhập tay).' },
      { id: id('NX'), ten: 'Tỷ lệ nợ xấu (BCCV)', nhan_dien: DN, ma_ct: 'TY_LE_NO_XAU', loai: 'a', cot_dv: 'Ma DVKD (sau ra soat)', loc: cn, ham: 'ty_le', cot_gt: 'So du (quy doi)', loc_tu: [{ cot: 'Nhom no', dk: 'lon_bang', gt: '3' }], chia: 1, tru_moc: '', ghi_cn: true, mau: true, luc: t,
        mo_ta: 'Dư nợ nhóm 3–5 ÷ tổng dư nợ × 100.' },
      { id: id('NVBQ'), ten: 'Nguồn vốn BQ năm (BCNV)', nhan_dien: NV, ma_ct: 'NGUON_VON_BQ', loai: 'a', cot_dv: 'Ma DVKD (sau ra soat)', loc: cn, ham: 'tong', cot_gt: 'Du BQ nam', chia: 1000, tru_moc: '', ghi_cn: true, mau: true, luc: t,
        mo_ta: 'Cộng Dư BQ năm của báo cáo huy động theo phòng, quy về tỷ đồng.' },
      { id: id('NVTT'), ten: 'Δ Nguồn vốn BQ tăng trưởng (BCNV)', nhan_dien: NV, ma_ct: 'NGUON_VON_TT', loai: 'a', cot_dv: 'Ma DVKD (sau ra soat)', loc: cn, ham: 'tong', cot_gt: 'Du BQ nam', chia: 1000, tru_moc: 'ct', moc_ct: 'NGUON_VON_BQ', ghi_cn: true, mau: true, luc: t,
        mo_ta: 'Nguồn vốn BQ năm nay trừ Nguồn vốn BQ tháng 12 năm trước.' },
      { id: id('CASA'), ten: 'Δ CASA BQ tăng trưởng (BCNV)', nhan_dien: NV, ma_ct: 'CASA_TT', loai: 'a', cot_dv: 'Ma DVKD (sau ra soat)', loc: cn.concat([{ cot: 'San pham', dk: 'bat_dau', gt: '1' }]), ham: 'tong', cot_gt: 'Du BQ nam', chia: 1000, tru_moc: 'nhap', moc_nhap: {}, ghi_cn: true, mau: true, luc: t,
        mo_ta: 'CASA = sản phẩm có mã bắt đầu bằng 1 (quy ước). Trừ CASA BQ năm trước nhập tay từng phòng.' }
    ].concat(mauCuoiKy());
  }

  function mauCuoiKy() {
    var t = Date.now(), cn = [{ cot: 'Ma chi nhanh', dk: 'bang', gt: '444' }];
    return [
      { id: 'MAU_DNCK', ten: 'Dư nợ cuối kỳ (BCCV)', nhan_dien: 'Nhom no', ma_ct: 'DU_NO_CUOI_KY', loai: 'a', cot_dv: 'Ma DVKD (sau ra soat)', loc: cn, ham: 'tong', cot_gt: 'So du (quy doi)', chia: 1000, tru_moc: '', ghi_cn: true, mau: true, luc: t, mo_ta: 'Cộng số dư quy đổi theo phòng tại ngày báo cáo, quy về tỷ đồng — chỉ tiêu quản trị, không chấm điểm.' },
      { id: 'MAU_NVCK', ten: 'Nguồn vốn cuối kỳ (BCNV)', nhan_dien: 'Loai tai khoan', ma_ct: 'NGUON_VON_CUOI_KY', loai: 'a', cot_dv: 'Ma DVKD (sau ra soat)', loc: cn, ham: 'tong', cot_gt: 'So du (quy doi)', chia: 1000, tru_moc: '', ghi_cn: true, mau: true, luc: t, mo_ta: 'Cộng số dư huy động theo phòng tại ngày báo cáo, quy về tỷ đồng — chỉ tiêu quản trị, không chấm điểm.' },
      { id: 'MAU_CASACK', ten: 'CASA cuối kỳ (BCNV)', nhan_dien: 'Loai tai khoan', ma_ct: 'CASA_CUOI_KY', loai: 'a', cot_dv: 'Ma DVKD (sau ra soat)', loc: cn.concat([{ cot: 'San pham', dk: 'bat_dau', gt: '1' }]), ham: 'tong', cot_gt: 'So du (quy doi)', chia: 1000, tru_moc: '', ghi_cn: true, mau: true, luc: t, mo_ta: 'CASA = sản phẩm mã bắt đầu bằng 1 (giả định), quy về tỷ đồng — chỉ tiêu quản trị, không chấm điểm.' }
    ];
  }
  root.CONG_THUC = { mauCuoiKy: mauCuoiKy, khoa: khoa, so: so, doTieuDe: doTieuDe, bang: bang, timCot: timCot, chay: chay, cotThieu: cotThieu, dsNhanDien: dsNhanDien, dienGiai: dienGiai, bangGhep: bangGhep, mau: mau, DK: DK, HAM: HAM };
})(window);
