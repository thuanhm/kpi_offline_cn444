/* THẺ ĐIỂM GỬI TỪNG PHÒNG — mỗi phòng/PGD một trang A4: điểm, hạng, bảng chỉ tiêu, 3 chỉ tiêu cần cải thiện nhất, ô giải trình để đơn vị ghi tay.
 * inTatCa: mở hộp thoại in (chọn "Lưu dưới dạng PDF"); xuatExcel: một tệp, mỗi đơn vị một sheet (định dạng như báo cáo Excel, có khung giải trình). Dùng chung vùng in #bc-print với Báo cáo giao ban. */
(function (root) {
  var esc = UI.esc, num = UI.num, pct = UI.pct, isNum = UI.isNum, CN = KPI_CFG.MA_CN;
  function kyText(k) { return 'T' + k.thang + '/' + k.nam; }

  function trangThe(M, c, ky) {
    var rk = M.ranking(ky.nam, ky.thang), tong = rk.filter(function (x) { return x.co_so; }).length, cuu = M.cuuDiem(c.ma, ky.nam, ky.thang, 3), prev = ky.thang > 1 ? M.card(c.ma, ky.nam, ky.thang - 1) : null;
    var h = '<section class="td-trang"><header><div><small>' + esc(STORE.state.settings.ten_chi_nhanh) + '</small><h2>THẺ ĐIỂM KPI · ' + esc(c.ten) + '</h2><p>Kỳ ' + kyText(ky) + ' (lũy kế từ đầu năm) · lập ngày ' + new Date().toLocaleDateString('vi-VN') + '</p></div>' +
      '<div class="td-diem"><b>' + num(c.quy_doi, 1) + '</b><span>/ 100 điểm</span>' + (c.hang ? '<em>Hạng ' + c.hang + '/' + tong + '</em>' : '') + (prev && isNum(prev.quy_doi) && isNum(c.quy_doi) ? '<small>' + (c.quy_doi >= prev.quy_doi ? '▲ ' : '▼ ') + num(Math.abs(c.quy_doi - prev.quy_doi), 2) + ' so với T' + (ky.thang - 1) + '</small>' : '') + '</div></header>';
    h += '<table class="td-tbl"><thead><tr><th>Chỉ tiêu</th><th>ĐVT</th><th>Kế hoạch</th><th>Thực hiện</th><th>% HT</th><th>TS</th><th>Điểm</th><th>Xếp loại</th></tr></thead><tbody>';
    c.rows.forEach(function (r) { h += '<tr><td>' + esc(r.ind.ten_ngan || r.ind.ten) + '</td><td>' + esc(r.ind.dvt) + '</td><td class="r">' + UI.val(r.kh, r.ind) + '</td><td class="r">' + UI.val(r.th, r.ind) + '</td><td class="r">' + (isNum(r.ht) ? pct(r.ht) : '–') + '</td><td class="r">' + r.ts + '</td><td class="r">' + (isNum(r.diem) ? num(r.diem, 2) : '–') + '</td><td>' + esc(r.tt || '') + '</td></tr>'; });
    h += '<tr class="tot"><td colspan="5">Tổng</td><td class="r">' + c.ts + '</td><td class="r">' + num(c.diem, 2) + '</td><td></td></tr></tbody></table>';
    if (Math.abs(c.dc_diem) > 0.004) h += '<p class="td-note">Cộng/trừ điểm KPI: ' + (c.dc_diem > 0 ? '+' : '') + num(c.dc_diem, 2) + ' điểm quy đổi.</p>';
    h += '<div class="td-cuu"><b>Chỉ tiêu cần ưu tiên cải thiện:</b> ' + (cuu.length ? cuu.map(function (x) { return esc(x.ind.ten_ngan || x.ind.ten) + ' (' + (isNum(x.ht) ? pct(x.ht, 0) : 'chưa có số') + ', có thể bổ sung +' + num(x.lay_lai, 2) + ' điểm)'; }).join('; ') : 'không có — các chỉ tiêu đã đạt kế hoạch') + '.</div>';
    return h + '<div class="td-giai-trinh"><b>Giải trình / kiến nghị của đơn vị:</b></div><footer><span>Người lập</span><span>Trưởng đơn vị</span></footer></section>';
  }

  function inTatCa(ky) {
    var M = STORE.model(), ds = M.ranking(ky.nam, ky.thang).filter(function (c) { return c.so_ct > 0; });
    if (!ds.length) { UI.toast('Kỳ ' + kyText(ky) + ' chưa có số liệu để in.', 'err'); return; }
    var d = document.getElementById('bc-print'); if (!d) { d = document.createElement('div'); d.id = 'bc-print'; document.body.appendChild(d); }
    d.innerHTML = '<div class="td-wrap">' + ds.map(function (c) { return trangThe(M, c, ky); }).join('') + '</div>'; document.body.classList.add('printing-bc');
    var xong = function () { document.body.classList.remove('printing-bc'); window.removeEventListener('afterprint', xong); }; window.addEventListener('afterprint', xong);
    UI.toast('In ' + ds.length + ' thẻ điểm (mỗi phòng một trang) — chọn "Lưu dưới dạng PDF" để gửi.', 'info'); setTimeout(function () { window.print(); }, 50);
  }

  function xuatExcel(ky) { return EXCEL.xuatTheDiemPhong(ky.nam, ky.thang); }
  root.KPI_THE_DIEM = { inTatCa: inTatCa, xuatExcel: xuatExcel, trangThe: trangThe };
})(window);
