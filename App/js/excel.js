/* EXCEL — tải mẫu nhập, nạp số từ Excel (dạng bảng ngang hoặc dạng danh sách), xuất báo cáo nhiều trang. */
(function (root) {
  var CN = root.KPI_CFG.MA_CN;
  function norm(s) { return UI.slug(String(s || '')).toUpperCase(); }

  function sheetFromAoa(XLSX, aoa, widths, fmt) {
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    if (widths) ws['!cols'] = widths.map(function (w) { return { wch: w }; });
    if (fmt) {
      var rg = XLSX.utils.decode_range(ws['!ref']);
      for (var R = rg.s.r; R <= rg.e.r; R++) for (var C = rg.s.c; C <= rg.e.c; C++) {
        var c = ws[XLSX.utils.encode_cell({ r: R, c: C })]; if (!c || c.t !== 'n') continue;
        var f = fmt(R, C, c.v); if (f) c.z = f;
      }
    }
    return ws;
  }

  /* ---------- Mẫu nhập số (có sẵn số đang có) ---------- */
  function taiMau(nam, thang) {
    return UI.lib('xlsx').then(function (XLSX) {
      var st = STORE.state, M = STORE.model(), wb = XLSX.utils.book_new();
      var cols = [{ ma: CN, ten: 'Toàn CN' }].concat(M.units.map(function (u) { return { ma: u.ma, ten: u.ten_ngan || u.ten }; }));
      [['p', 'KE_HOACH', 'KẾ HOẠCH LŨY KẾ'], ['a', 'THUC_HIEN', 'THỰC HIỆN LŨY KẾ']].forEach(function (x) {
        var aoa = [[x[2] + ' — ' + st.settings.ten_chi_nhanh], ['Năm', nam, 'Tháng', thang, 'Ghi chú: số lũy kế đến cuối tháng; ô trống = giữ nguyên số đang có; cột "Toàn CN" để trống nếu muốn cộng tự động từ các phòng.'],
          ['', '', ''].concat(cols.map(function (c) { return c.ten; })), ['MA_CT', 'Tên chỉ tiêu', 'ĐVT'].concat(cols.map(function (c) { return c.ma; }))];
        M.inds.forEach(function (ind) {
          if (x[0] === 'p' && ind.huong === 'nhap_ty_le') return;
          aoa.push([ind.ma, ind.ten, ind.dvt].concat(cols.map(function (c) {
            if (!M.apDung(ind.ma, c.ma) && !(c.ma === CN)) return '';
            var v = STORE.getRaw(x[0], ind.ma, c.ma, nam, thang); return v === null ? '' : v;
          })));
        });
        XLSX.utils.book_append_sheet(wb, sheetFromAoa(XLSX, aoa, [16, 46, 9].concat(cols.map(function () { return 15; }))), x[1]);
      });
      var hd = [['HƯỚNG DẪN NHẬP SỐ'], [''],
        ['1. Trang KE_HOACH và THUC_HIEN: dòng 4 là mã đơn vị, cột A là mã chỉ tiêu — KHÔNG đổi 2 vùng mã này.'],
        ['2. Ô B2 = năm, D2 = tháng của số liệu. Số là LŨY KẾ đến cuối tháng.'],
        ['3. Ô để trống = không thay đổi số đang có. Muốn xoá số: nhập dấu gạch "-" .'],
        ['4. Chỉ tiêu ĐVT "%" ghi đúng con số phần trăm (VD 1,25 nghĩa là 1,25%; 95 nghĩa là 95%).'],
        ['5. Ô xám/không có số ở cột một phòng = chỉ tiêu không áp dụng cho khối của phòng đó.'],
        ['6. Muốn nạp nhiều tháng một lúc: dùng trang DU_LIEU (mỗi dòng: Năm · Tháng · Mã đơn vị · Mã chỉ tiêu · Kế hoạch · Thực hiện).'],
        [''], ['DANH SÁCH MÃ ĐƠN VỊ'], ['Mã', 'Tên', 'Khối'], [CN, st.settings.ten_chi_nhanh, 'CN']]
        .concat(M.units.map(function (u) { return [u.ma, u.ten, u.khoi]; }));
      XLSX.utils.book_append_sheet(wb, sheetFromAoa(XLSX, hd, [14, 60, 10]), 'HUONG_DAN');
      XLSX.utils.book_append_sheet(wb, sheetFromAoa(XLSX, [['Năm', 'Tháng', 'Mã đơn vị', 'Mã chỉ tiêu', 'Kế hoạch', 'Thực hiện']], [8, 8, 12, 16, 14, 14]), 'DU_LIEU');
      XLSX.writeFile(wb, 'Mau_nhap_so_KPI_T' + thang + '_' + nam + '.xlsx');
    });
  }

  /* ---------- Đọc tệp Excel → danh sách ô ---------- */
  function docTep(file, namMacDinh, thangMacDinh) {
    return Promise.all([UI.lib('xlsx'), file.arrayBuffer()]).then(function (r) {
      var XLSX = r[0], wb = XLSX.read(r[1], { type: 'array' }), M = STORE.model();
      var unitCode = {}; unitCode[norm(CN)] = CN; unitCode['TOAN_CN'] = CN; unitCode['CHI_NHANH'] = CN;
      M.units.forEach(function (u) { unitCode[norm(u.ma)] = u.ma; unitCode[norm(u.ten)] = u.ma; if (u.ten_ngan) unitCode[norm(u.ten_ngan)] = u.ma; });
      var indCode = {}; M.inds.forEach(function (i) { indCode[norm(i.ma)] = i.ma; indCode[norm(i.ten)] = i.ma; if (i.ten_ngan) indCode[norm(i.ten_ngan)] = i.ma; });
      var items = [], loi = [], trang = [];
      wb.SheetNames.forEach(function (sn) {
        var aoa = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: true, defval: '' });
        if (!aoa.length) return;
        var nsn = norm(sn);
        // Dạng danh sách
        var hr = -1;
        for (var i = 0; i < Math.min(aoa.length, 10); i++) { var h = aoa[i].map(norm); if (h.indexOf('NAM') >= 0 && h.indexOf('THANG') >= 0 && h.some(function (x) { return /MA_CHI_TIEU|MA_CT/.test(x); })) { hr = i; break; } }
        if (hr >= 0) {
          var H = aoa[hr].map(norm), cN = H.indexOf('NAM'), cT = H.indexOf('THANG'), cD = H.findIndex(function (x) { return /MA_DON_VI|MA_DV|DON_VI/.test(x); }),
            cC = H.findIndex(function (x) { return /MA_CHI_TIEU|MA_CT/.test(x); }), cP = H.findIndex(function (x) { return /KE_HOACH|^KH$/.test(x); }), cA = H.findIndex(function (x) { return /THUC_HIEN|^TH$/.test(x); });
          var n0 = items.length;
          for (var rI = hr + 1; rI < aoa.length; rI++) {
            var row = aoa[rI], nam = +row[cN], th = +row[cT], dv = unitCode[norm(row[cD])], ct = indCode[norm(row[cC])];
            if (!row[cC] && !row[cD]) continue;
            if (!nam || !th || th < 1 || th > 12 || !dv || !ct) { loi.push(sn + ' dòng ' + (rI + 1) + ': không nhận ra ' + (!dv ? 'mã đơn vị "' + row[cD] + '"' : !ct ? 'mã chỉ tiêu "' + row[cC] + '"' : 'năm/tháng')); continue; }
            [[cP, 'p'], [cA, 'a']].forEach(function (x) {
              if (x[0] < 0) return; var raw = row[x[0]]; if (raw === '' || raw === null) return;
              var v = String(raw).trim() === '-' ? null : UI.parse(raw);
              if (typeof v === 'number' && isNaN(v)) { loi.push(sn + ' dòng ' + (rI + 1) + ': "' + raw + '" không phải số'); return; }
              items.push({ k: x[1], ct: ct, dv: dv, nam: nam, thang: th, v: v });
            });
          }
          trang.push(sn + ' (danh sách): ' + (items.length - n0) + ' ô');
          return;
        }
        // Dạng bảng ngang
        var k = /KE_HOACH|^KH/.test(nsn) ? 'p' : /THUC_HIEN|^TH/.test(nsn) ? 'a' : null;
        if (!k) return;
        var hdr = -1;
        for (var j = 0; j < Math.min(aoa.length, 12); j++) if (/^MA_CT$|^MA_CHI_TIEU$/.test(norm(aoa[j][0]))) { hdr = j; break; }
        if (hdr < 0) { loi.push(sn + ': không thấy dòng tiêu đề có ô "MA_CT" ở cột A.'); return; }
        var nam2 = namMacDinh, thang2 = thangMacDinh;
        for (var q = 0; q < hdr; q++) aoa[q].forEach(function (c, ci) { var nc = norm(c); if (nc === 'NAM' && +aoa[q][ci + 1]) nam2 = +aoa[q][ci + 1]; if (nc === 'THANG' && +aoa[q][ci + 1]) thang2 = +aoa[q][ci + 1]; });
        var colDv = aoa[hdr].map(function (c, ci) { return ci < 1 ? null : unitCode[norm(c)] || null; });
        aoa[hdr].forEach(function (c, ci) { if (ci > 2 && c !== '' && !colDv[ci]) loi.push(sn + ': cột "' + c + '" không khớp mã đơn vị nào — bỏ qua.'); });
        var n1 = items.length;
        for (var r2 = hdr + 1; r2 < aoa.length; r2++) {
          var rw = aoa[r2]; if (!rw[0]) continue;
          var ct2 = indCode[norm(rw[0])]; if (!ct2) { loi.push(sn + ' dòng ' + (r2 + 1) + ': mã chỉ tiêu "' + rw[0] + '" không có trong danh mục.'); continue; }
          colDv.forEach(function (dv, ci) {
            if (!dv) return; var raw = rw[ci]; if (raw === '' || raw === null || raw === undefined) return;
            var v = String(raw).trim() === '-' ? null : UI.parse(raw);
            if (typeof v === 'number' && isNaN(v)) { loi.push(sn + ' ô ' + XLSX.utils.encode_cell({ r: r2, c: ci }) + ': "' + raw + '" không phải số'); return; }
            items.push({ k: k, ct: ct2, dv: dv, nam: nam2, thang: thang2, v: v });
          });
        }
        trang.push(sn + ' → T' + thang2 + '/' + nam2 + ': ' + (items.length - n1) + ' ô');
      });
      return { items: items, loi: loi, trang: trang };
    });
  }

  /* ---------- Báo cáo Excel xuất ra: bố cục + định dạng (xlsx-js-style) + chỉnh XML (cố định dòng/cột, ẩn đường lưới, in ngang vừa khổ giấy, màu thẻ sheet) ---------- */
  var MAU = { xanh: '005993', xanhNhat: 'E6F1F8', do: 'D71249', chu: 'FFFFFF', vien: 'C9D4DF', dat: 'D9F2E3', kha: 'FFF3C2', cct: 'FFE0B8', chua: 'F8D0D6', soc: 'F7F9FC', xam: '5A6B7B', vang: 'FFE699', bac: 'D9D9D9', dong: 'F4B183', tot: '1E7B4F', xau: 'B1292A' };
  var FONT = 'Arial', MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  function vien(rgb, kieu) { var e = { style: kieu || 'thin', color: { rgb: rgb || MAU.vien } }; return { top: e, bottom: e, left: e, right: e }; }
  function mauNguong(v, ng) { return v >= ng.dat - 1e-9 ? MAU.dat : v >= ng.kha - 1e-9 ? MAU.kha : v >= ng.cct - 1e-9 ? MAU.cct : MAU.chua; }
  function fill(rgb) { return { patternType: 'solid', fgColor: { rgb: rgb } }; }
  function doDai(c) {   // độ dài hiển thị ước lượng của ô, để tính độ rộng cột
    if (c.t !== 'n') return String(c.v).length;
    if (c.z === '0.0%') return (c.v * 100).toFixed(1).length + 1;
    if (c.z === '#,##0') return Math.round(c.v).toLocaleString('vi-VN').length;
    return Math.abs(c.v) >= 1000 ? Math.round(c.v).toLocaleString('vi-VN').length + 3 : String(Math.round(c.v * 100) / 100).length + 1;
  }
  /* CF[tên sheet] = { h: dòng tiêu đề bảng, cuoi: dòng cuối bảng (dòng sau là ghi chú), heat: [cột %HT tô theo ngưỡng], heatTheo: { cột: cột lấy giá trị tô },
       tu: cột đầu vùng ma trận tô màu, tt: cột trạng thái, chenh: cột chênh lệch (đỏ/xanh), giua: [cột căn giữa], wrap: [cột xuống dòng], tong: dòng tổng, tongTu: dòng bắt đầu khối tổng kết,
       huy: cột hạng (tô vàng/bạc/đồng cho 1-2-3), dongBang: số cột cố định bên trái, tab: màu thẻ sheet } */
  function dinhDang(XLSX, wb, ng, CF) {
    wb.SheetNames.forEach(function (sn) {
      var cf = CF[sn]; if (!cf) return;
      var ws = wb.Sheets[sn], rg = XLSX.utils.decode_range(ws['!ref']), nc = rg.e.c + 1, cuoi = cf.cuoi === undefined ? rg.e.r : cf.cuoi, R, C, c, rong = [], merges = [];
      var giua = cf.giua || [], wrap = cf.wrap || [], heat = cf.heat || [], addr = function (r, cc) { return XLSX.utils.encode_cell({ r: r, c: cc }); };
      // độ rộng cột: theo nội dung bảng và từ dài nhất của tiêu đề (tiêu đề tự xuống dòng)
      for (C = 0; C < nc; C++) {
        var m = 0, tl = 0; c = ws[addr(cf.h, C)];
        if (c && c.v !== undefined) { tl = Math.min(String(c.v).length, 14); String(c.v).split(/\s+/).forEach(function (w) { tl = Math.max(tl, w.length); }); }
        for (R = cf.h + 1; R <= cuoi; R++) { c = ws[addr(R, C)]; if (c && c.v !== undefined && c.v !== '') m = Math.max(m, doDai(c)); }
        rong[C] = { wch: Math.max(cf.toiThieu || 7, Math.min(cf.toiDa || 46, Math.max(m, tl) + 2)) };
      }
      for (R = rg.s.r; R <= rg.e.r; R++) for (C = rg.s.c; C <= rg.e.c; C++) {
        c = ws[addr(R, C)];
        var trongBang = R >= cf.h && R <= cuoi;
        if (!c) { if (!trongBang) continue; c = ws[addr(R, C)] = { t: 's', v: '' }; }
        var base = { name: FONT, sz: 10 };
        if (R === 0) c.s = { font: { name: FONT, sz: 16, bold: true, color: { rgb: MAU.xanh } }, alignment: { vertical: 'center' } };
        else if (R < cf.h) c.s = { font: { name: FONT, sz: 10, italic: true, color: { rgb: MAU.xam } }, alignment: { vertical: 'center' } };
        else if (R === cf.h) c.s = { font: { name: FONT, sz: 10, bold: true, color: { rgb: MAU.chu } }, fill: fill(MAU.xanh), alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: vien(MAU.xanh) };
        else if (R > cuoi) c.s = { font: { name: FONT, sz: 9, italic: true, color: { rgb: MAU.xam } }, alignment: { vertical: 'top', wrapText: true } };
        else {
          var st = { font: base, border: vien(), alignment: { vertical: 'center' } }, la = c.t === 'n', tong = cf.tong === R || (cf.tongTu !== undefined && R >= cf.tongTu);
          st.alignment.horizontal = giua.indexOf(C) >= 0 ? 'center' : la ? 'right' : 'left';
          if (wrap.indexOf(C) >= 0) st.alignment.wrapText = true;
          if ((R - cf.h) % 2 === 0) st.fill = fill(MAU.soc);
          if (la || c.v !== '') {
            var theoC = cf.heatTheo && cf.heatTheo[C] !== undefined ? ws[addr(R, cf.heatTheo[C])] : null;
            if (la && (heat.indexOf(C) >= 0 || (cf.tu !== undefined && C >= cf.tu))) st.fill = fill(mauNguong(c.v, ng));
            else if (theoC && theoC.t === 'n') st.fill = fill(mauNguong(theoC.v, ng));
            else if (cf.tt === C && c.t === 's') { var t = String(c.v).toLowerCase(); st.fill = fill(/^đạt|vượt/.test(t) ? MAU.dat : /^khá/.test(t) ? MAU.kha : /cải thiện/.test(t) ? MAU.cct : /chưa/.test(t) ? MAU.chua : 'FFFFFF'); st.font = { name: FONT, sz: 10, bold: true }; }
            if (cf.huy === C && la && c.v >= 1 && c.v <= 3) { st.fill = fill([MAU.vang, MAU.bac, MAU.dong][c.v - 1]); st.font = { name: FONT, sz: 10, bold: true }; }
            if (cf.chenh === C && la && c.v !== 0) st.font = { name: FONT, sz: 10, color: { rgb: c.v < 0 ? MAU.xau : MAU.tot } };
          }
          if (tong) { st.font = { name: FONT, sz: 10, bold: true, color: { rgb: MAU.xanh } }; if (!st.fill || st.fill.fgColor.rgb === MAU.soc) st.fill = fill(MAU.xanhNhat); st.border = vien(MAU.xanh); }
          c.s = st;
        }
      }
      // gộp ô tiêu đề / ghi chú cho gọn, đặt chiều cao dòng
      ws['!rows'] = ws['!rows'] || [];
      ws['!rows'][0] = { hpt: 30 }; ws['!rows'][cf.h] = { hpt: cf.caoTieuDe || 36 };
      if (nc > 1) { merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: nc - 1 } }); for (R = 1; R < cf.h; R++) if (ws[addr(R, 0)] && ws[addr(R, 0)].v) merges.push({ s: { r: R, c: 0 }, e: { r: R, c: nc - 1 } }); }
      for (R = cuoi + 1; R <= rg.e.r; R++) if (ws[addr(R, 0)] && ws[addr(R, 0)].v) { merges.push({ s: { r: R, c: 0 }, e: { r: R, c: nc - 1 } }); ws['!rows'][R] = { hpt: 26 }; }
      ws['!merges'] = (ws['!merges'] || []).concat(merges); ws['!cols'] = rong;
    });
  }

  /* Chỉnh XML sau khi ghi: cố định dòng tiêu đề/cột đầu, ẩn đường lưới, in ngang vừa bề rộng khổ A4, màu thẻ sheet. Lỗi thì bỏ qua (tệp vẫn đủ số liệu). */
  function chinhXml(XLSX, wb, CF, bytes, JSZip) {
    return JSZip.loadAsync(bytes).then(function (zip) {
      return Promise.all(wb.SheetNames.map(function (sn, i) {
        var f = 'xl/worksheets/sheet' + (i + 1) + '.xml', cf = CF[sn], file = zip.file(f); if (!file || !cf) return null;
        return file.async('string').then(function (xml) {
          var rowCut = cf.h + 1, colCut = cf.dongBang || 0, tl = XLSX.utils.encode_cell({ r: rowCut, c: colCut }), pane;
          if (colCut) pane = '<pane xSplit="' + colCut + '" ySplit="' + rowCut + '" topLeftCell="' + tl + '" activePane="bottomRight" state="frozen"/><selection pane="topRight"/><selection pane="bottomLeft"/><selection pane="bottomRight" activeCell="' + tl + '" sqref="' + tl + '"/>';
          else pane = '<pane ySplit="' + rowCut + '" topLeftCell="' + tl + '" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="' + tl + '" sqref="' + tl + '"/>';
          var views = '<sheetViews><sheetView showGridLines="0" workbookViewId="0">' + pane + '</sheetView></sheetViews>';
          xml = /<sheetViews>[\s\S]*?<\/sheetViews>/.test(xml) ? xml.replace(/<sheetViews>[\s\S]*?<\/sheetViews>/, views) : /<dimension[^>]*\/>/.test(xml) ? xml.replace(/(<dimension[^>]*\/>)/, '$1' + views) : xml.replace(/(<worksheet[^>]*>)/, '$1' + views);
          if (!/<sheetPr[\s>]/.test(xml)) xml = xml.replace(/(<worksheet[^>]*>)/, '$1<sheetPr><tabColor rgb="FF' + (cf.tab || MAU.xanh) + '"/><pageSetUpPr fitToPage="1"/></sheetPr>');
          // pageMargins → pageSetup phải đứng trước ignoredErrors (đúng thứ tự phần tử của bảng tính)
          var pm = '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>', ps = '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>';
          xml = xml.replace(/<pageMargins[^>]*\/>/, '').replace(/<pageSetup[^>]*\/>/, '');
          xml = /<ignoredErrors/.test(xml) ? xml.replace('<ignoredErrors', pm + ps + '<ignoredErrors') : xml.replace('</worksheet>', pm + ps + '</worksheet>');
          zip.file(f, xml);
        });
      })).then(function () { return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: MIME_XLSX }); });
    });
  }

  /* Một sheet thẻ điểm của một đơn vị (dùng cho báo cáo cả chi nhánh và cho thẻ điểm gửi từng phòng). opt.giaiTrinh: thêm khung giải trình để đơn vị điền tay. */
  function themTheDiem(XLSX, wb, CF, c, soDv, nam, thang, ky, opt) {
    var pctF = '0.0%', numF = '#,##0', dF = '0.00';
    function n(v) { return UI.isNum(v) ? v : ''; }
      var a = [['THẺ ĐIỂM KPI — ' + c.ten.toUpperCase()], ['Kỳ: ' + ky + ' · Khối: ' + c.khoi + ' · Điểm: ' + UI.num(c.diem, 2) + '/' + c.ts + (c.hang ? ' · Hạng ' + c.hang + '/' + soDv : '')], [],
        ['STT', 'Mã', 'Chỉ tiêu', 'ĐVT', 'Trọng số', 'Kế hoạch', 'Thực hiện', '+/- so KH', '%HT', 'Điểm', 'Mất điểm', 'Trạng thái', 'KH năm', '%KH năm', 'TH tháng trước']];
      c.rows.concat(c.ref).forEach(function (r, i) {
        a.push([i + 1, r.ma, (r.ind.ten) + (r.ind.chi_tham_khao ? ' (quản trị)' : ''), r.ind.dvt, r.ts === null ? '' : r.ts, n(r.kh), n(r.th), n(r.gap), n(r.ht), n(r.diem), n(r.mat), r.tt, n(r.kh_nam), n(r.ht_nam), n(r.th_truoc)]);
      });
      var tongR = a.length; a.push(['', '', 'TỔNG CỘNG', '', c.ts, '', '', '', c.ht_chung, c.diem, c.rows.reduce(function (s, r) { return s + (r.mat || 0); }, 0)]);
      var note = STORE.getNote(c.ma, nam, thang); if (note) a.push([], ['Ghi chú: ' + note]);
      if (opt && opt.giaiTrinh) a.push([], ['Giải trình / kiến nghị của đơn vị:'], ['……………………………………………………………………………………………………………………'], ['……………………………………………………………………………………………………………………'], ['……………………………………………………………………………………………………………………']);
    var name = UI.slug(c.ma === CN ? 'CN' : c.ten_ngan).slice(0, 28) || c.ma; if (wb.SheetNames.indexOf(name) >= 0) name = name + '_' + c.ma;
      XLSX.utils.book_append_sheet(wb, sheetFromAoa(XLSX, a, null, function (R, C, v) {
        if (R < 4) return null; if (C === 8 || C === 13) return pctF; if (C === 9 || C === 10) return dF; if (C >= 5 && C <= 14) return Math.abs(v) < 100 && v % 1 ? '#,##0.00' : numF; return null;
      }), name);
      CF[name] = { h: 3, cuoi: tongR, tong: tongR, heat: [8], tt: 11, chenh: 7, giua: [0, 1, 3, 4, 11], wrap: [2], dongBang: 3, toiDa: 48, tab: c.ma === CN ? MAU.do : '7F9DB9' };
  }

  /* Ghi tệp: áp định dạng, chỉnh XML (cố định dòng/cột, ẩn lưới, in ngang) rồi tải xuống */
  function ghiTep(XLSX, wb, CF, ten) {
    var bytes = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return UI.lib('jszip').then(function (JSZip) { return chinhXml(XLSX, wb, CF, bytes, JSZip); }).catch(function () { return new Blob([bytes], { type: MIME_XLSX }); }).then(function (blob) { UI.download(ten, blob, MIME_XLSX); });
  }

  /* Thẻ điểm từng phòng/PGD trong một tệp (mỗi đơn vị một sheet, cùng định dạng báo cáo, có khung giải trình) */
  function xuatTheDiemPhong(nam, thang) {
    return UI.lib('xlsx-style').then(function (XLSX) {
      var M = STORE.model(), ky = 'Tháng ' + thang + '/' + nam, ds = M.ranking(nam, thang).filter(function (c) { return c.so_ct > 0; }), wb = XLSX.utils.book_new(), CF = {};
      if (!ds.length) throw new Error('Kỳ ' + ky + ' chưa có số liệu để xuất.');
      ds.forEach(function (c) { themTheDiem(XLSX, wb, CF, c, ds.length, nam, thang, ky, { giaiTrinh: true }); });
      dinhDang(XLSX, wb, M.ng, CF);
      return ghiTep(XLSX, wb, CF, 'The_diem_cac_phong_T' + thang + '_' + nam + '.xlsx').then(function () { return ds.length; });
    });
  }

  /* ---------- Xuất báo cáo ---------- */
  function xuatBaoCao(nam, thang) {
    return UI.lib('xlsx-style').then(function (XLSX) {
      var M = STORE.model(), st = STORE.state, wb = XLSX.utils.book_new(), ky = 'Tháng ' + thang + '/' + nam, CF = {};
      var rk = M.ranking(nam, thang), cn = M.card(CN, nam, thang);
      var pctF = '0.0%', numF = '#,##0', dF = '0.00', cuoiBang = function (a) { return a.length - 1; };
      var ghiMau = 'Màu ô: xanh = đạt (≥ ' + Math.round(M.ng.dat * 100) + '%), vàng = khá (≥ ' + Math.round(M.ng.kha * 100) + '%), cam = cần cải thiện (≥ ' + Math.round(M.ng.cct * 100) + '%), hồng = chưa đạt; KAD = không áp dụng.';
      // 1. Tổng hợp xếp hạng
      var a1 = [['KẾT QUẢ KPI CÁC PHÒNG/PGD — ' + st.settings.ten_chi_nhanh.toUpperCase()], ['Kỳ: ' + ky + ' · Điểm toàn chi nhánh: ' + UI.num(cn.diem, 2) + '/' + cn.ts + ' · Xuất lúc ' + KPI_OFFICE.giayXuat()], [],
        ['Hạng', 'Mã', 'Đơn vị', 'Khối', 'Điểm KPI', 'Tổng trọng số', 'Điểm quy đổi (thang 100)', '%HT chung', 'Đạt', 'Khá', 'Cần cải thiện', 'Chưa đạt', 'GAP', 'Hạng tháng trước']];
      rk.forEach(function (c) { a1.push([c.hang, c.ma, c.ten, c.khoi, c.diem, c.ts, c.quy_doi, c.ht_chung, c.so_dat, c.so_kha, c.so_cct, c.so_chua, c.so_thieu, c.hang_truoc || '']); });
      var cu1 = cuoiBang(a1); a1.push([], [ghiMau]);
      XLSX.utils.book_append_sheet(wb, sheetFromAoa(XLSX, a1, null, function (R, C) { return R > 3 && (C === 4 || C === 6) ? dF : R > 3 && C === 7 ? pctF : null; }), 'Tổng hợp');
      CF['Tổng hợp'] = { h: 3, cuoi: cu1, heat: [7], heatTheo: { 6: 7 }, huy: 0, giua: [0, 1, 3, 5, 8, 9, 10, 11, 12, 13], dongBang: 3, toiDa: 40 };
      // 2. Ma trận %HT
      var cols = [cn].concat(rk);
      var a2 = [['MA TRẬN % HOÀN THÀNH KẾ HOẠCH — ' + ky], [], ['Mã', 'Chỉ tiêu', 'ĐVT'].concat(cols.map(function (c) { return c.ten_ngan; }))];
      M.inds.forEach(function (ind) {
        a2.push([ind.ma, ind.ten_ngan || ind.ten, ind.dvt].concat(cols.map(function (c) {
          var r = c.rows.concat(c.ref).filter(function (x) { return x.ma === ind.ma; })[0]; return r && UI.isNum(r.ht) ? r.ht : (r ? '' : 'KAD');
        })));
      });
      var cu2 = cuoiBang(a2); a2.push([], [ghiMau]);
      XLSX.utils.book_append_sheet(wb, sheetFromAoa(XLSX, a2, null, function (R, C) { return R > 2 && C > 2 ? pctF : null; }), 'Ma trận %HT');
      CF['Ma trận %HT'] = { h: 2, cuoi: cu2, tu: 3, giua: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], dongBang: 3, toiDa: 34 };
      // 2b. Thứ hạng từng chỉ tiêu
      var RI = M.rankInd(nam, thang), a2b = [['THỨ HẠNG CÁC PHÒNG/PGD THEO TỪNG CHỈ TIÊU (theo % hoàn thành KH) — ' + ky], [], ['Mã', 'Chỉ tiêu', 'Số đơn vị xếp hạng'].concat(rk.map(function (c) { return c.ten_ngan; }))];
      M.inds.forEach(function (ind) { var ri = RI.ct[ind.ma]; a2b.push([ind.ma, (ind.ten_ngan || ind.ten) + (ind.chi_tham_khao ? ' (quản trị)' : ''), ri.n].concat(rk.map(function (c) { return ri.hang[c.ma] || ''; }))); });
      var cu2b = cuoiBang(a2b);
      a2b.push(['', 'Hạng bình quân', ''].concat(rk.map(function (c) { var t = RI.tom[c.ma]; return t ? Math.round(t.tb * 100) / 100 : ''; })));
      a2b.push(['', 'Số chỉ tiêu top 3', ''].concat(rk.map(function (c) { var t = RI.tom[c.ma]; return t ? t.top3 : ''; })));
      a2b.push(['', 'Số chỉ tiêu cuối bảng', ''].concat(rk.map(function (c) { var t = RI.tom[c.ma]; return t ? t.cuoi : ''; })));
      XLSX.utils.book_append_sheet(wb, sheetFromAoa(XLSX, a2b, null), 'Hạng theo chỉ tiêu');
      CF['Hạng theo chỉ tiêu'] = { h: 2, cuoi: a2b.length - 1, tongTu: cu2b + 1, giua: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], dongBang: 3, toiDa: 34, tab: '2E9D6A' };
      // 2c. % KH năm (tiến độ lũy kế so với kế hoạch cả năm — không tô theo ngưỡng %HT của kỳ)
      var a2c = [['% THỰC HIỆN SO VỚI KẾ HOẠCH NĂM — lũy kế ' + ky], [], ['Mã', 'Chỉ tiêu', 'ĐVT'].concat(cols.map(function (c) { return c.ten_ngan; }))];
      M.inds.forEach(function (ind) { if (ind.huong !== 'cao_tot' || ind.dvt === '%') return; a2c.push([ind.ma, ind.ten_ngan || ind.ten, ind.dvt].concat(cols.map(function (c) { var r = c.rows.concat(c.ref).filter(function (x) { return x.ma === ind.ma; })[0]; return r && UI.isNum(r.ht_nam) ? r.ht_nam : ''; }))); });
      var cu2c = cuoiBang(a2c); a2c.push([], ['Tiến độ lũy kế so với kế hoạch cả năm (không so với ngưỡng đạt của kỳ nên không tô màu theo ngưỡng).']);
      XLSX.utils.book_append_sheet(wb, sheetFromAoa(XLSX, a2c, null, function (R, C) { return R > 2 && C > 2 ? pctF : null; }), '% KH năm');
      CF['% KH năm'] = { h: 2, cuoi: cu2c, giua: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], dongBang: 3, toiDa: 34, tab: '2E9D6A' };
      // 3. Thẻ điểm từng đơn vị
      cols.forEach(function (c) { themTheDiem(XLSX, wb, CF, c, rk.length, nam, thang, ky); });
      dinhDang(XLSX, wb, M.ng, CF);
      return ghiTep(XLSX, wb, CF, 'Bao_cao_KPI_' + UI.slug(st.settings.ma_chi_nhanh || 'CN') + '_T' + thang + '_' + nam + '.xlsx');
    });
  }

  root.EXCEL = { taiMau: taiMau, docTep: docTep, xuatBaoCao: xuatBaoCao, xuatTheDiemPhong: xuatTheDiemPhong, dinhDang: dinhDang };
})(window);
