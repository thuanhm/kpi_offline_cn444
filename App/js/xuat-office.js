/* XUẤT BÁO CÁO CHI NHÁNH THEO KỲ ĐANG CHỌN: PowerPoint (PptxGenJS), Word (docx), ảnh PNG cả trang (SnapDOM). Chạy offline, thư viện nằm trong lib/.
 * Số liệu lấy từ KPI_ENGINE (ranking/card/alerts/scoreSeries) — không có công thức thứ hai. Biểu đồ trong PowerPoint là biểu đồ thật (sửa được số và màu). */
(function (root) {
  var CN = root.KPI_CFG.MA_CN, XANH = '005993', DO = 'D71249', FONT = 'Arial';
  var MAU = { dat: 'D9F2E3', kha: 'FFF3C2', cct: 'FFE0B8', chua: 'F8D0D6', cot: '2E9D6A', cotkha: 'F0B429', cotcct: 'F07829', cotchua: 'D9534F' };

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function n(v, d) { return isNum(v) ? v.toLocaleString('vi-VN', { minimumFractionDigits: d || 0, maximumFractionDigits: d === undefined ? 2 : d }) : '–'; }
  function pc(v) { return isNum(v) ? n(v * 100, 1) + '%' : '–'; }
  function mauO(v, ng) { return !isNum(v) ? 'FFFFFF' : v >= ng.dat - 1e-9 ? MAU.dat : v >= ng.kha - 1e-9 ? MAU.kha : v >= ng.cct - 1e-9 ? MAU.cct : MAU.chua; }
  function mauCot(v, ng) { return !isNum(v) ? '9AA8BD' : v >= ng.dat - 1e-9 ? MAU.cot : v >= ng.kha - 1e-9 ? MAU.cotkha : v >= ng.cct - 1e-9 ? MAU.cotcct : MAU.cotchua; }
  function pad(x) { return (x < 10 ? '0' : '') + x; }
  function giayXuat() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }

  /* Gom số liệu một kỳ */
  function duLieu(nam, thang) {
    var M = root.STORE.model(), st = root.STORE.state, rk = M.ranking(nam, thang), cn = M.card(CN, nam, thang), prev = thang > 1 ? M.card(CN, nam, thang - 1) : null;
    var nd = root.KPI_NHAN_DINH ? root.KPI_NHAN_DINH(M, { nam: nam, thang: thang }, cn, prev, rk) : '';
    var co = M.thangCoSo(nam).filter(function (t) { return t <= thang; });
    var cnS = M.scoreSeries(CN, nam), tb = [];
    for (var i = 0; i < 12; i++) { var a = M.units.map(function (u) { return M.scoreSeries(u.ma, nam)[i]; }).filter(isNum); tb.push(a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null); }
    return { M: M, st: st, rk: rk, cn: cn, prev: prev, nd: nd, ng: M.ng, nam: nam, thang: thang, ky: 'Tháng ' + thang + '/' + nam, kyNgan: 'T' + thang + '/' + nam, tenCn: st.settings.ten_chi_nhanh || 'Chi nhánh',
      al: M.alerts(nam, thang), thangCo: co, cnS: cnS, tbS: tb, file: root.UI.slug(st.settings.ma_chi_nhanh || 'CN') + '_T' + thang + '_' + nam };
  }
  var CT_XH = ['Hạng', 'Đơn vị', 'Khối', 'Điểm / TS', 'Điểm quy đổi', '%HT chung', 'Chỉ tiêu đạt'];
  function hang(c) { return [c.hang, c.ten_ngan, c.khoi, n(c.diem, 2) + ' / ' + c.ts, n(c.quy_doi, 1), pc(c.ht_chung), c.so_dat + '/' + c.so_ct]; }
  function giaTri(v, ind) { return isNum(v) ? (root.UI.val ? root.UI.val(v, ind) : n(v)) : '–'; }

  /* ---------- PowerPoint ---------- */
  /* opt.theDiem = true: thêm mỗi phòng/PGD một slide thẻ điểm chi tiết */
  function xuatPptx(nam, thang, opt) {
    opt = opt || {};
    return root.UI.lib('pptx').then(function (Pptx) {
      var D = duLieu(nam, thang), p = new Pptx(), ng = D.ng;
      p.layout = 'LAYOUT_WIDE'; p.title = 'Giao ban KPI ' + D.ky; p.author = D.tenCn;
      function dau(s, tieuDe) {
        s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.9, fill: { color: XANH } });
        s.addShape(p.ShapeType.rect, { x: 0, y: 0.9, w: 13.33, h: 0.05, fill: { color: DO } });
        s.addText(tieuDe, { x: 0.5, y: 0.1, w: 12.3, h: 0.7, fontFace: FONT, fontSize: 24, bold: true, color: 'FFFFFF', valign: 'middle' });
        s.addText(D.tenCn + ' · ' + D.ky, { x: 0.5, y: 7.1, w: 9, h: 0.3, fontFace: FONT, fontSize: 10, color: '66758C' });
      }
      function the(s, x, y, w, nhan, giaTriText, mau) {
        s.addShape(p.ShapeType.rect, { x: x, y: y, w: w, h: 0.95, fill: { color: 'F2F5FA' }, line: { color: 'D5DEE8', width: 0.75 } });
        s.addText(nhan, { x: x + 0.1, y: y + 0.04, w: w - 0.2, h: 0.28, fontFace: FONT, fontSize: 10, color: '66758C' });
        s.addText(giaTriText, { x: x + 0.1, y: y + 0.32, w: w - 0.2, h: 0.55, fontFace: FONT, fontSize: 22, bold: true, color: mau || XANH });
      }
      var hdTable = function (cols, w) { return cols.map(function (t, i) { return { text: t, options: { bold: true, color: 'FFFFFF', fill: { color: XANH }, align: i === 0 && w ? 'left' : 'center' } }; }); };
      var cn = D.cn, rk = D.rk, s;

      // 1. Bìa
      s = p.addSlide(); s.background = { color: XANH };
      s.addShape(p.ShapeType.rect, { x: 0, y: 4.4, w: 13.33, h: 0.07, fill: { color: DO } });
      s.addText('BÁO CÁO GIAO BAN KPI', { x: 0.8, y: 2.0, w: 11.7, h: 0.9, fontFace: FONT, fontSize: 40, bold: true, color: 'FFFFFF' });
      s.addText(D.tenCn + ' — ' + D.ky, { x: 0.8, y: 3.1, w: 11.7, h: 0.6, fontFace: FONT, fontSize: 22, color: 'DCE8F2' });
      s.addText('Xuất lúc ' + giayXuat(), { x: 0.8, y: 4.7, w: 11.7, h: 0.4, fontFace: FONT, fontSize: 14, color: 'DCE8F2' });

      // 2. Kết quả toàn chi nhánh
      s = p.addSlide(); dau(s, 'Kết quả toàn chi nhánh');
      var dtruoc = D.prev && isNum(D.prev.diem) && isNum(cn.diem) ? cn.diem - D.prev.diem : null;
      the(s, 0.5, 1.15, 2.95, 'Điểm KPI quy đổi (thang 100)', n(cn.quy_doi, 1), mauCot(cn.ht_chung, ng));
      the(s, 3.6, 1.15, 2.95, 'Điểm theo trọng số', n(cn.diem, 2) + ' / ' + cn.ts);
      the(s, 6.7, 1.15, 2.95, 'Chỉ tiêu đạt', cn.so_dat + ' / ' + cn.so_ct);
      the(s, 9.8, 1.15, 3.0, 'So với tháng trước', dtruoc === null ? '–' : (dtruoc > 0 ? '+' : '') + n(dtruoc, 2) + ' điểm', dtruoc !== null && dtruoc < 0 ? MAU.cotchua : MAU.cot);
      var rows = cn.rows, rh = Math.min(0.3, 4.75 / (rows.length + 1)), fs = rh < 0.25 ? 9 : 10;
      s.addTable([hdTable(['Chỉ tiêu', 'TS', 'Kế hoạch', 'Thực hiện', '%HT', 'Điểm', 'Trạng thái'], true)].concat(rows.map(function (r) {
        var cell = function (t, al, fill) { return { text: String(t), options: { align: al, fill: { color: fill || 'FFFFFF' } } }; };
        return [cell(r.ind.ten_ngan || r.ind.ten, 'left'), cell(r.ts === null ? '' : r.ts, 'center'), cell(giaTri(r.kh, r.ind), 'right'), cell(giaTri(r.th, r.ind), 'right'), cell(pc(r.ht), 'center', mauO(r.ht, ng)), cell(isNum(r.diem) ? n(r.diem, 2) : '–', 'center'), cell(r.tt || '', 'center')];
      })), { x: 0.5, y: 2.3, w: 12.3, colW: [3.8, 0.7, 2.0, 2.0, 1.1, 1.1, 1.6], rowH: rh, fontFace: FONT, fontSize: fs, border: { type: 'solid', pt: 0.5, color: 'B7C4D1' }, valign: 'middle', autoPage: false });

      // 3. Xếp hạng phòng/PGD (bảng + biểu đồ cột thật)
      s = p.addSlide(); dau(s, 'Xếp hạng phòng / PGD');
      var xh = [hdTable(['Hạng', 'Đơn vị', 'Điểm quy đổi', '%HT', 'Đạt'], true)].concat(rk.map(function (c) {
        return [c.hang, c.ten_ngan, n(c.quy_doi, 1), pc(c.ht_chung), c.so_dat + '/' + c.so_ct].map(function (t, i) { return { text: String(t), options: { align: i === 1 ? 'left' : 'center', fill: { color: i === 2 || i === 3 ? mauO(c.ht_chung, ng) : 'FFFFFF' } } }; });
      }));
      s.addTable(xh, { x: 0.4, y: 1.2, w: 6.6, colW: [0.7, 2.4, 1.4, 1.1, 1.0], rowH: Math.min(0.42, 5.7 / (rk.length + 1)), fontFace: FONT, fontSize: Math.max(9, Math.min(13, Math.floor(260 / (rk.length + 2)))), border: { type: 'solid', pt: 0.5, color: 'B7C4D1' }, valign: 'middle', autoPage: false });
      var maxQd = Math.max.apply(null, rk.map(function (c) { return isNum(c.quy_doi) ? c.quy_doi : 0; }).concat([100]));
      s.addChart(p.charts.BAR, [{ name: 'Điểm quy đổi', labels: rk.map(function (c) { return c.ten_ngan; }), values: rk.map(function (c) { return isNum(c.quy_doi) ? Math.round(c.quy_doi * 10) / 10 : 0; }) }], {
        x: 7.2, y: 1.2, w: 5.8, h: 5.7, barDir: 'bar', chartColors: rk.map(function (c) { return mauCot(c.ht_chung, ng); }), showValue: true, dataLabelFormatCode: '0.0', dataLabelFontSize: 10, dataLabelFontFace: FONT,
        catAxisLabelFontSize: 10, catAxisLabelFontFace: FONT, catAxisOrientation: 'maxMin', valAxisMinVal: 0, valAxisMaxVal: Math.ceil(maxQd / 10) * 10 + 10, valAxisLabelFontSize: 9, valGridLine: { color: 'E3E9F2', size: 0.5 }, showLegend: false, barGapWidthPct: 40
      });

      // 4. Ma trận % hoàn thành (một slide)
      s = p.addSlide(); dau(s, 'Ma trận % hoàn thành kế hoạch');
      var inds = D.M.inds.filter(function (i) { return !i.chi_tham_khao; }), nc = Math.max(1, rk.length), cw = Math.min(1.5, (12.5 - 3.2) / nc);
      var mh = Math.min(0.34, 5.3 / (inds.length + 1)), mf = mh < 0.26 ? 8 : mh < 0.3 ? 9 : 10;
      s.addTable([[{ text: 'Chỉ tiêu', options: { bold: true, color: 'FFFFFF', fill: { color: XANH } } }].concat(rk.map(function (c) { return { text: c.ten_ngan, options: { bold: true, color: 'FFFFFF', fill: { color: XANH }, align: 'center' } }; }))].concat(inds.map(function (ind) {
        return [{ text: ind.ten_ngan || ind.ten, options: { align: 'left' } }].concat(rk.map(function (c) {
          var r = c.rows.filter(function (x) { return x.ma === ind.ma; })[0], ht = r && isNum(r.ht) ? r.ht : null;
          return { text: r ? pc(ht) : 'KAD', options: { align: 'center', fill: { color: mauO(ht, ng) } } };
        }));
      })), { x: 0.4, y: 1.15, w: 3.2 + cw * nc, colW: [3.2].concat(rk.map(function () { return cw; })), rowH: mh, fontFace: FONT, fontSize: mf, border: { type: 'solid', pt: 0.5, color: 'B7C4D1' }, valign: 'middle', autoPage: false });
      s.addText('Màu ô: xanh = đạt (≥ ' + pc(ng.dat) + '), vàng = khá (≥ ' + pc(ng.kha) + '), cam = cần cải thiện (≥ ' + pc(ng.cct) + '), hồng = chưa đạt; KAD = không áp dụng.', { x: 0.4, y: 6.75, w: 12.5, h: 0.3, fontFace: FONT, fontSize: 10, color: '66758C' });

      // 5. Diễn biến điểm trong năm (biểu đồ đường thật)
      s = p.addSlide(); dau(s, 'Diễn biến điểm KPI năm ' + D.nam);
      var ms = D.thangCo.length ? D.thangCo : [D.thang], lab = ms.map(function (t) { return 'T' + t; }), z = function (v) { return isNum(v) ? Math.round(v * 10) / 10 : 0; };
      var serie = [{ name: 'Toàn chi nhánh', labels: lab, values: ms.map(function (t) { return z(D.cnS[t - 1]); }) }, { name: 'Bình quân phòng/PGD', labels: lab, values: ms.map(function (t) { return z(D.tbS[t - 1]); }) }, { name: 'Ngưỡng đạt', labels: lab, values: ms.map(function () { return ng.dat * 100; }) }];
      var vs = serie[0].values.concat(serie[1].values).filter(function (v) { return v > 0; }), lo = vs.length ? Math.floor(Math.min.apply(null, vs) / 5) * 5 - 5 : 0, hi = vs.length ? Math.ceil(Math.max.apply(null, vs.concat([ng.dat * 100])) / 5) * 5 + 5 : 120;
      s.addChart(p.charts.LINE, serie, { x: 0.5, y: 1.2, w: 12.3, h: 5.7, chartColors: [XANH, DO, '9AA8BD'], lineSize: 2.5, lineDataSymbolSize: 7, showLegend: true, legendPos: 'b', legendFontSize: 11, legendFontFace: FONT, valAxisMinVal: lo, valAxisMaxVal: hi, valAxisLabelFontSize: 10, catAxisLabelFontSize: 11, valGridLine: { color: 'E3E9F2', size: 0.5 }, showValue: false });

      // 6. Nhận định & cảnh báo
      s = p.addSlide(); dau(s, 'Nhận định và cảnh báo');
      s.addText('Nhận định', { x: 0.5, y: 1.15, w: 6.2, h: 0.35, fontFace: FONT, fontSize: 15, bold: true, color: XANH });
      s.addText(D.nd || 'Chưa có số liệu để nhận định.', { x: 0.5, y: 1.55, w: 6.2, h: 5.3, fontFace: FONT, fontSize: 13, color: '15233B', valign: 'top', fit: 'shrink' });
      s.addText('Cảnh báo điều hành (' + D.al.length + ')', { x: 7.0, y: 1.15, w: 5.8, h: 0.35, fontFace: FONT, fontSize: 15, bold: true, color: DO });
      var cb = D.al.slice(0, 9).map(function (a) { return { text: a.loai + ': ' + a.text, options: { bullet: true, breakLine: true, color: a.muc === 3 ? 'B1292A' : '15233B' } }; });
      if (D.al.length > 9) cb.push({ text: '… và ' + (D.al.length - 9) + ' cảnh báo khác trong ứng dụng.', options: { italic: true, color: '66758C' } });
      s.addText(cb.length ? cb : [{ text: 'Không có cảnh báo trong kỳ này.', options: { color: '2E9D6A' } }], { x: 7.0, y: 1.55, w: 5.8, h: 5.3, fontFace: FONT, fontSize: 12, valign: 'top', fit: 'shrink', paraSpaceAfter: 6 });

      // Thẻ điểm từng phòng/PGD (tuỳ chọn)
      if (opt.theDiem) D.M.units.forEach(function (u) {
        var c = D.M.card(u.ma, nam, thang); s = p.addSlide(); dau(s, 'Thẻ điểm — ' + (u.ten_ngan || u.ten));
        the(s, 0.5, 1.15, 3.0, 'Điểm quy đổi / hạng', n(c.quy_doi, 1) + (c.hang ? '  ·  hạng ' + c.hang + '/' + rk.length : ''), mauCot(c.ht_chung, ng));
        the(s, 3.65, 1.15, 3.0, 'Điểm theo trọng số', n(c.diem, 2) + ' / ' + c.ts);
        the(s, 6.8, 1.15, 3.0, 'Chỉ tiêu đạt', c.so_dat + ' / ' + c.so_ct);
        the(s, 9.95, 1.15, 2.85, 'Điểm bị mất', n(c.rows.reduce(function (a, r) { return a + (r.mat || 0); }, 0), 2), MAU.cotchua);
        var rs = c.rows, h2 = Math.min(0.3, 4.75 / (rs.length + 1));
        s.addTable([hdTable(['Chỉ tiêu', 'TS', 'Kế hoạch', 'Thực hiện', '%HT', 'Điểm', 'Mất điểm', 'Trạng thái'], true)].concat(rs.map(function (r) {
          var cell = function (t, al, fill) { return { text: String(t), options: { align: al, fill: { color: fill || 'FFFFFF' } } }; };
          return [cell(r.ind.ten_ngan || r.ind.ten, 'left'), cell(r.ts === null ? '' : r.ts, 'center'), cell(giaTri(r.kh, r.ind), 'right'), cell(giaTri(r.th, r.ind), 'right'), cell(pc(r.ht), 'center', mauO(r.ht, ng)), cell(isNum(r.diem) ? n(r.diem, 2) : '–', 'center'), cell(isNum(r.mat) ? n(r.mat, 2) : '–', 'center'), cell(r.tt || '', 'center')];
        })), { x: 0.5, y: 2.3, w: 12.3, colW: [3.6, 0.7, 1.9, 1.9, 1.0, 1.0, 1.0, 1.2], rowH: h2, fontFace: FONT, fontSize: h2 < 0.25 ? 9 : 10, border: { type: 'solid', pt: 0.5, color: 'B7C4D1' }, valign: 'middle', autoPage: false });
      });
      return p.writeFile({ fileName: (opt.theDiem ? 'Giao_ban_KPI_kem_the_diem_' : 'Giao_ban_KPI_') + D.file + '.pptx' });
    });
  }

  /* Biểu đồ cột xếp hạng dạng ảnh PNG cho Word; trả null nếu môi trường không vẽ được (không làm hỏng cả tệp) */
  function anhXepHang(D) {
    if (typeof root.document === 'undefined' || !root.document.createElement) return Promise.resolve(null);
    return root.UI.lib('chart').then(function (Chart) {
      var cv = root.document.createElement('canvas'), W = 900, H = Math.max(260, 60 + D.rk.length * 34); cv.width = W; cv.height = H;
      var ch = new Chart(cv.getContext('2d'), { type: 'bar', data: { labels: D.rk.map(function (c) { return c.ten_ngan; }), datasets: [{ data: D.rk.map(function (c) { return isNum(c.quy_doi) ? Math.round(c.quy_doi * 10) / 10 : 0; }), backgroundColor: D.rk.map(function (c) { return '#' + mauCot(c.ht_chung, D.ng); }), borderRadius: 3 }] },
        options: { animation: false, responsive: false, indexAxis: 'y', devicePixelRatio: 2, layout: { padding: { right: 36 } }, plugins: { legend: { display: false }, datalabels: { display: !!root.ChartDataLabels, anchor: 'end', align: 'end', color: '#15233B', font: { size: 12, weight: 'bold' }, formatter: function (v) { return n(v, 1); } } }, scales: { x: { min: 0, grid: { color: '#e3e9f2' } }, y: { grid: { display: false } } } } });
      var url = cv.toDataURL('image/png'); ch.destroy();
      var b = atob(url.split(',')[1]), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
      return { data: u, w: W, h: H };
    }).catch(function () { return null; });
  }

  /* ---------- Word: báo cáo A4 theo mẫu văn bản hành chính (tiêu ngữ, ngày tháng, tiêu đề, mục I–V, bảng thẻ điểm); mục Đề xuất để trống ---------- */
  var TNR = 'Times New Roman';
  function tenNganHang(st) { return (st.settings.ten_ngan_hang || 'Ngân hàng TMCP Công thương Việt Nam').toUpperCase(); }
  function tenChiNhanhHoa(st) { var t = String(st.settings.ten_chi_nhanh || 'Chi nhánh').replace(/^\s*vietinbank\s*/i, '').trim(); return t.toUpperCase(); }
  function diaDanh(st) { return st.settings.dia_danh || String(st.settings.ten_chi_nhanh || '').replace(/^.*chi nhánh\s*/i, '').replace(/^(bắc|nam|đông|tây|trung)\s+/i, '').trim() || '………'; }

  function xuatDocx(nam, thang) {
    return Promise.all([root.UI.lib('docx'), Promise.resolve().then(function () { return anhXepHang(duLieu(nam, thang)); })]).then(function (r) {
      var X = r[0], anh = r[1], D = duLieu(nam, thang), ng = D.ng, cn = D.cn, st = D.st, C = X.AlignmentType.CENTER, J = X.AlignmentType.JUSTIFIED, hom = new Date();
      var MX = { dat: ['E2F0D9', '2E7D32'], kha: ['DDEBF7', '1F5FA8'], cct: ['FFF2CC', '9C6500'], chua: ['FCE4D6', 'C00000'] };
      function mauHT(v) { return !isNum(v) ? null : v >= ng.dat - 1e-9 ? MX.dat : v >= ng.kha - 1e-9 ? MX.kha : v >= ng.cct - 1e-9 ? MX.cct : MX.chua; }
      function tx(t, o) { return new X.TextRun(Object.assign({ text: String(t), font: TNR, size: 26 }, o || {})); }
      function pa(t, o, po) { return new X.Paragraph(Object.assign({ children: [tx(t, o)], spacing: { after: 120, line: 312 } }, po || {})); }
      function muc(t) { return new X.Paragraph({ spacing: { before: 240, after: 100 }, keepNext: true, children: [tx(t.toUpperCase(), { bold: true })] }); }
      function chuThich(t) { return new X.Paragraph({ alignment: C, keepNext: true, spacing: { before: 60, after: 60 }, children: [tx(t, { italics: true, size: 22 })] }); }
      function vienO() { var b = { style: X.BorderStyle.SINGLE, size: 4, color: '9DB6D3' }; return { top: b, bottom: b, left: b, right: b }; }
      function khongVien() { var b = { style: X.BorderStyle.NONE, size: 0, color: 'FFFFFF' }; return { top: b, bottom: b, left: b, right: b }; }
      function o(t, w, fillRgb, kieu, canh) {
        kieu = kieu || {};
        return new X.TableCell({ width: { size: w, type: X.WidthType.DXA }, borders: vienO(), shading: fillRgb ? { type: X.ShadingType.CLEAR, color: 'auto', fill: fillRgb } : undefined, margins: { top: 30, bottom: 30, left: 60, right: 60 }, verticalAlign: X.VerticalAlign.CENTER,
          children: [new X.Paragraph({ alignment: canh || C, children: [tx(t, Object.assign({ size: 22 }, kieu))] })] });
      }
      function bang(W, cot, dong) {
        return new X.Table({ width: { size: W.reduce(function (a, b) { return a + b; }, 0), type: X.WidthType.DXA }, columnWidths: W,
          rows: [new X.TableRow({ tableHeader: true, cantSplit: true, children: cot.map(function (t, i) { return o(t, W[i], 'DCE6F1', { bold: true }); }) })].concat(dong) });
      }
      // Tiêu ngữ theo mẫu văn bản hành chính: ngắt dòng cố định (không phụ thuộc bề rộng cột), mỗi khối có gạch ngắn ở giữa bên dưới
      function dongQh(t, o2) { return new X.Paragraph({ alignment: C, spacing: { after: 0, line: 276 }, children: [tx(t, Object.assign({ size: 26 }, o2 || {}))] }); }
      function chiaDoi(t) {   // tên dài → 2 dòng cân bằng theo từ
        var w = t.split(/\s+/), best = 0, bd = 1e9; for (var i = 1; i < w.length; i++) { var d = Math.abs(w.slice(0, i).join(' ').length - w.slice(i).join(' ').length); if (d < bd) { bd = d; best = i; } }
        return w.length < 4 ? [t] : [w.slice(0, best).join(' '), w.slice(best).join(' ')];
      }
      function gach(rongTong, rong) {   // gạch ngắn giữa: bảng lồng 3 ô, ô giữa có viền dưới
        var le = Math.round((rongTong - rong) / 2), vo = { style: X.BorderStyle.NONE, size: 0, color: 'FFFFFF' }, co = { style: X.BorderStyle.SINGLE, size: 6, color: '000000' };
        var cell = function (w, vien) { return new X.TableCell({ width: { size: w, type: X.WidthType.DXA }, borders: { top: vo, left: vo, right: vo, bottom: vien ? co : vo }, children: [new X.Paragraph({ spacing: { after: 0, line: 120 }, children: [tx('', { size: 8 })] })] }); };
        return new X.Table({ width: { size: rongTong, type: X.WidthType.DXA }, columnWidths: [le, rong, rongTong - le - rong], borders: X.TableBorders.NONE, rows: [new X.TableRow({ children: [cell(le, false), cell(rong, true), cell(rongTong - le - rong, false)] })] });
      }
      var WT = 3900, WP = 5171, trai = chiaDoi(tenNganHang(st)).map(function (t) { return dongQh(t); }).concat([dongQh('CHI NHÁNH ' + tenChiNhanhHoa(st).replace(/^CHI NHÁNH\s*/, ''), { bold: true }), gach(WT, 1200)]);
      var phai = [dongQh('CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT', { bold: true }), dongQh('NAM', { bold: true }), dongQh('Độc lập - Tự do - Hạnh phúc', { bold: true }), gach(WP, 2400)];
      var oTn = function (w, ds) { return new X.TableCell({ borders: khongVien(), width: { size: w, type: X.WidthType.DXA }, children: ds.concat([new X.Paragraph({ spacing: { after: 0, line: 120 }, children: [tx('', { size: 8 })] })]) }); };
      var tieuNgu = new X.Table({ width: { size: WT + WP, type: X.WidthType.DXA }, columnWidths: [WT, WP], borders: X.TableBorders.NONE, rows: [new X.TableRow({ children: [oTn(WT, trai), oTn(WP, phai)] })] });
      var ngayThang = diaDanh(st) + ', ngày ' + hom.getDate() + ' tháng ' + (hom.getMonth() + 1) + ' năm ' + hom.getFullYear();

      // Bảng 1: thẻ điểm KPI toàn chi nhánh
      var W1 = [480, 2500, 800, 480, 1350, 1350, 1000, 1111];
      var b1 = bang(W1, ['TT', 'Chỉ tiêu', 'ĐVT', 'TS', 'Kế hoạch', 'Thực hiện', '%HT', 'Điểm'], cn.rows.map(function (rw, i) {
        var m = mauHT(rw.ht);
        return new X.TableRow({ cantSplit: true, children: [o(i + 1, W1[0]), o(rw.ind.ten_ngan || rw.ind.ten, W1[1], null, null, X.AlignmentType.LEFT), o(rw.ind.dvt || '', W1[2]), o(rw.ts === null ? '' : rw.ts, W1[3]), o(giaTri(rw.kh, rw.ind), W1[4], null, null, X.AlignmentType.RIGHT),
          o(giaTri(rw.th, rw.ind), W1[5], null, { bold: true }, X.AlignmentType.RIGHT), o(pc(rw.ht), W1[6], m && m[0], m ? { bold: true, color: m[1] } : null), o(isNum(rw.diem) ? n(rw.diem, 2) : '–', W1[7], null, null, X.AlignmentType.RIGHT)] });
      }));
      // Bảng 2: kết quả các phòng/PGD
      var W2 = [600, 2300, 850, 1400, 1300, 1250, 1371];
      var b2 = bang(W2, CT_XH, D.rk.map(function (c) {
        var m = mauHT(c.ht_chung);
        return new X.TableRow({ cantSplit: true, children: hang(c).map(function (t, i) { return i === 5 ? o(t, W2[i], m && m[0], m ? { bold: true, color: m[1] } : null) : o(t, W2[i], null, i === 1 ? { bold: true } : null, i === 1 ? X.AlignmentType.LEFT : C); }) });
      }));

      var ch = [
        tieuNgu,
        new X.Paragraph({ alignment: X.AlignmentType.RIGHT, spacing: { before: 200, after: 200 }, indent: { right: 300 }, children: [tx(ngayThang, { italics: true })] }),
        new X.Paragraph({ alignment: C, spacing: { before: 120, after: 40 }, children: [tx('BÁO CÁO', { bold: true, size: 32 })] }),
        new X.Paragraph({ alignment: C, spacing: { after: 0 }, children: [tx('Kết quả thực hiện chỉ tiêu KPI các phòng/phòng giao dịch', { bold: true })] }),
        new X.Paragraph({ alignment: C, spacing: { after: 160 }, children: [tx('lũy kế đến hết ' + D.ky.toLowerCase(), { bold: true })] }),
        muc('I. Kết quả chung toàn chi nhánh'),
        pa(D.nd || 'Chưa có số liệu để nhận định.', null, { alignment: J, indent: { firstLine: 567 } }),
        chuThich('Bảng 1. Thẻ điểm KPI toàn chi nhánh'), b1,
        muc('II. Kết quả các phòng/phòng giao dịch'),
        chuThich('Bảng 2. Xếp hạng điểm KPI các phòng/PGD'), b2
      ];
      var so = 'III';
      if (anh) { ch.push(muc('III. Biểu đồ xếp hạng điểm quy đổi'), new X.Paragraph({ alignment: C, children: [new X.ImageRun({ type: 'png', data: anh.data, transformation: { width: 560, height: Math.round(560 * anh.h / anh.w) } })] }), chuThich('Hình 1. Điểm quy đổi (thang 100) các phòng/PGD')); so = 'IV'; }
      ch.push(muc(so + '. Cảnh báo điều hành'));
      if (D.al.length) D.al.slice(0, 15).forEach(function (a) { ch.push(new X.Paragraph({ bullet: { level: 0 }, alignment: J, spacing: { after: 60, line: 300 }, children: [tx(a.loai + ': ', { bold: true, size: 24 }), tx(a.text, { size: 24 })] })); });
      else ch.push(pa('Không có cảnh báo trong kỳ này.'));
      if (D.al.length > 15) ch.push(pa('… và ' + (D.al.length - 15) + ' cảnh báo khác (xem trong ứng dụng).', { italics: true, color: '66758C', size: 22 }));
      ch.push(muc((so === 'III' ? 'IV' : 'V') + '. Đề xuất, kiến nghị'));
      for (var i = 0; i < 4; i++) ch.push(pa('…………………………………………………………………………………………………………………………', { color: '808080' }));
      ch.push(pa('Ghi chú: ô %HT tô màu theo ngưỡng — xanh lá đạt (≥ ' + pc(ng.dat) + '), xanh dương khá (≥ ' + pc(ng.kha) + '), vàng cần cải thiện (≥ ' + pc(ng.cct) + '), cam chưa đạt. Nhận định do hệ thống tự sinh từ số liệu, cần rà soát trước khi gửi. Xuất lúc ' + giayXuat() + '.', { italics: true, size: 20, color: '66758C' }, { spacing: { before: 200 } }));
      var doc = new X.Document({ creator: D.tenCn, title: 'Báo cáo KPI ' + D.ky, styles: { default: { document: { run: { font: TNR, size: 26 } } } },
        sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 } } }, children: ch }] });
      return X.Packer.toBlob(doc).then(function (b) { root.UI.download('Bao_cao_KPI_' + D.file + '.docx', b); return { co_anh: !!anh }; });
    });
  }

  root.KPI_OFFICE = { xuatPptx: xuatPptx, xuatDocx: xuatDocx, duLieu: duLieu, giayXuat: giayXuat };
})(window);
