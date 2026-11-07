/* MÀN HÌNH BÁO CÁO GIAO BAN — Lập báo cáo (kỳ, đơn vị, kỳ so sánh) · B Nhận định · C Bảng KPI · E Vấn đề · F Giải pháp · G Kết luận · Lịch sử · Xem trước · Word · In/PDF.
 * Toàn bộ số liệu lấy từ SNAPSHOT trong bản ghi (js/bao-cao-giao-ban.js), lưu ở js/bao-cao-luu.js. Chỉnh sửa chỉ đổi bộ nhớ rồi lưu nháp (không vẽ lại cả trang → giữ con trỏ đang gõ). */
(function (root) {
  var esc = UI.esc, BC = root.KPI_BAO_CAO, BL = root.KPI_BAO_CAO_LUU, F = BC.fmt, CN = KPI_CFG.MA_CN;
  var VIEWS = root.VIEWS = root.VIEWS || {};
  var ST = { bc: null, dv: CN, loai: 'thang', nam: null, thang: null, quy: null, loaiSo: 'lien_truoc', ls: [], tai: false }, luuTimer = null, LS_CD = 'KPI_CN444.bc.chuc_danh';
  function nguoi() { var cd = ''; try { cd = localStorage.getItem(LS_CD) || ''; } catch (e) {} return { username: STORE.userHienTai() || 'admin', ho_ten: STORE.nguoi() || STORE.userHienTai() || '', chuc_danh: cd }; }
  function sel(id, opts, cur, dis) { return '<select id="' + id + '"' + (dis ? ' disabled' : '') + '>' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; }
  function luuNhap(ngay) { if (!ST.bc || ST.bc.trang_thai !== 'nhap') return; clearTimeout(luuTimer); luuTimer = setTimeout(function () { ST.bc.sua_luc = new Date().toISOString(); BL.luu(ST.bc).then(function () { var e = document.getElementById('bc-luu'); if (e) e.textContent = '✓ Đã lưu nháp'; }, function (e) { UI.toast(e.message, 'err'); }); }, ngay ? 0 : 500); }
  function napLs() { return BL.ds().then(function (d) { ST.ls = d; var e = document.getElementById('bc-ls'); if (e) e.innerHTML = htmlLs(); return d; }); }

  /* ---------- Tài liệu → HTML (Xem trước + In/PDF) ---------- */
  function htmlDoc(blocks) {
    return '<div class="bc-doc">' + blocks.map(function (b) {
      if (b.t === 'dau') return '<div class="bc-dau"><b>' + esc(String(b.don_vi || '').toUpperCase()) + '</b>' + (b.nhap ? '<span class="bc-nhap">BẢN NHÁP</span>' : '') + '</div>';
      if (b.t === 'tieu_de') return '<h1>' + esc(b.text) + '</h1>';
      if (b.t === 'h1') return '<h2>' + esc(b.text) + '</h2>';
      if (b.t === 'h2') return '<h3>' + esc(b.text) + '</h3>';
      if (b.t === 'p') return '<p' + (b.can === 'c' ? ' class="c"' : '') + (b.nho || b.i ? ' style="' + (b.i ? 'font-style:italic;' : '') + (b.nho ? 'font-size:.9em' : '') + '"' : '') + '>' + (b.b ? '<b>' + esc(b.text) + '</b>' : esc(b.text)) + '</p>';
      if (b.t === 'ds') return '<ul>' + b.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
      if (b.t === 'bang') return '<table class="bc-bang"><thead><tr>' + b.cot.map(function (c) { return '<th>' + esc(c.t) + '</th>'; }).join('') + '</tr></thead><tbody>' + b.dong.map(function (d) {
        if (d.nhom) return '<tr class="g"><td colspan="' + b.cot.length + '">' + esc(d.o[0]) + '</td></tr>';
        return '<tr' + (d.tong ? ' class="t"' : '') + '>' + d.o.map(function (t, i) { return '<td class="' + (b.cot[i].can || 'l') + '">' + esc(t) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
      if (b.t === 'ky') return '<div class="bc-ky"><b>' + esc(b.text) + '</b><i>(Ký, ghi rõ họ tên)</i><b class="ten">' + esc(b.ten) + '</b></div>';
      return '';
    }).join('') + '</div>';
  }
  function tenTep(bc, ext) { return 'BaoCaoGiaoBan_' + UI.slug(bc.snapshot.ten_dv) + '_' + UI.slug(bc.ky.nhan) + (bc.trang_thai === 'nhap' ? '_NHAP' : '') + ext; }
  function inPdf(bc) {
    var d = document.getElementById('bc-print'); if (!d) { d = document.createElement('div'); d.id = 'bc-print'; document.body.appendChild(d); }
    d.innerHTML = htmlDoc(BC.taiLieu(bc)); document.body.classList.add('printing-bc');
    var xong = function () { document.body.classList.remove('printing-bc'); window.removeEventListener('afterprint', xong); }; window.addEventListener('afterprint', xong);
    UI.toast('Hộp thoại in mở ra — chọn "Lưu dưới dạng PDF" để xuất PDF.', 'info'); setTimeout(function () { window.print(); }, 50);
  }
  /* Hộp thoại "Xuất prompt gửi Genie": chọn độ dài, thêm yêu cầu → tải .txt hoặc sao chép. */
  function moGenie(bc) {
    var G = KPI_GENIE, tuy = function (w) { return { do_dai: w.querySelector('#gn-dd').value, them: w.querySelector('#gn-them').value, kem_bac_bo: w.querySelector('#gn-bb').checked }; };
    var coBb = bc.van_de.some(function (v) { return v.trang_thai === 'bac_bo'; }), kb = Math.round(G.taoPrompt(bc, {}).length / 1024);
    UI.modal('Xuất prompt gửi Genie',
      (bc.trang_thai === 'nhap' ? '<div class="warn-box">Báo cáo đang là <b>bản nháp</b>: prompt sẽ mang nội dung nháp hiện tại. Nên hoàn thiện trước khi gửi.</div>' : '') +
      '<p class="muted">Tạo một tệp <b>.txt</b> gồm: yêu cầu viết báo cáo giao ban, ngữ cảnh người lập đã soạn (nhận định, vấn đề và nguyên nhân đã chọn, giải pháp, kết luận) và <b>số liệu JSON</b> của kỳ. Dán/tải tệp này vào Genie để viết thành báo cáo hoàn chỉnh. Chỉ gửi vào hệ thống AI nội bộ đã được phê duyệt. Dung lượng khoảng ' + kb + ' KB.</p>' +
      '<label class="field"><span>Độ dài báo cáo mong muốn</span><select id="gn-dd">' + Object.keys(G.DO_DAI).map(function (k) { return '<option value="' + k + '"' + (k === 'chuan' ? ' selected' : '') + '>' + esc(G.DO_DAI[k][0]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span>Yêu cầu bổ sung cho Genie (tuỳ chọn)</span><textarea id="gn-them" rows="3" placeholder="VD: Nhấn mạnh kết quả huy động vốn; viết theo mẫu báo cáo gửi Giám đốc chi nhánh…"></textarea></label>' +
      (coBb ? '<label class="check" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="gn-bb"> <span>Kèm danh sách nhận định đã bác bỏ (chỉ để Genie tham khảo, không đưa vào nội dung)</span></label>' : '<input type="checkbox" id="gn-bb" style="display:none">'),
      [{ text: 'Đóng' },
       { text: 'Sao chép nội dung', onClick: function (w) {
         var t = G.taoPrompt(bc, tuy(w)); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject(new Error('Trình duyệt không cho phép sao chép.'))).then(function () { UI.toast('Đã sao chép prompt (' + Math.round(t.length / 1024) + ' KB).', 'ok'); }, function (e) { UI.toast(e.message, 'err'); }); return false;
       } },
       { text: 'Tải tệp .txt', cls: 'primary', onClick: function (w) { G.xuat(bc, tuy(w)); UI.toast('Đã xuất ' + G.tenTep(bc) + ' — gửi tệp này cho Genie.', 'ok'); } }]);
  }
  function xuatWord(bc) {
    UI.lib('xlsx').then(function (X) {
      var bytes = root.KPI_XUAT_DOCX.taoDocx(BC.taiLieu(bc), 'Báo cáo giao ban ' + bc.ky.nhan + ' — ' + bc.snapshot.ten_dv, X);
      UI.download(tenTep(bc, '.docx'), bytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); UI.toast('Đã xuất Word.', 'ok');
    }).catch(function (e) { UI.toast('Không xuất được Word: ' + e.message, 'err'); });
  }

  /* ---------- Các mục ---------- */
  function htmlLap(M) {
    var nam = ST.nam || APP.ky.nam, ds = [[CN, 'Toàn chi nhánh']].concat(M.units.map(function (u) { return [u.ma, u.ten]; })), nams = {}; M.periods.forEach(function (p) { nams[p.nam] = 1; }); nams[nam] = 1; nams[nam - 1] = 1;
    var thang = ST.thang || APP.ky.thang, T = []; for (var i = 1; i <= 12; i++) T.push([i, 'Tháng ' + i]);
    var kyChon = ST.loai === 'thang' ? sel('bc-thang', T, thang) : ST.loai === 'quy' ? sel('bc-quy', [[1, 'Quý 1'], [2, 'Quý 2'], [3, 'Quý 3'], [4, 'Quý 4']], ST.quy || Math.ceil(thang / 3)) : '';
    var ky = ST.loai === 'thang' ? BC.kyTuLoai(M, 'thang', { nam: nam, thang: thang }) : ST.loai === 'quy' ? BC.kyTuLoai(M, 'quy', { nam: nam, quy: ST.quy || Math.ceil(thang / 3) }) : BC.kyTuLoai(M, 'nam', { nam: nam }), ks = BC.kySo(ky, ST.loaiSo);
    return '<div class="card bc-lap"><div class="bc-row"><b>Lập báo cáo</b>' + sel('bc-dv', ds, ST.dv) + sel('bc-loai', Object.keys(BC.LOAI_KY).map(function (k) { return [k, BC.LOAI_KY[k]]; }), ST.loai) + sel('bc-nam', Object.keys(nams).sort().map(function (n) { return [n, 'Năm ' + n]; }), nam) + kyChon +
      sel('bc-so', Object.keys(BC.LOAI_SO).map(function (k) { return [k, BC.LOAI_SO[k]]; }), ST.loaiSo) + '<span class="muted">→ ' + esc(ky.nhan) + (ks ? ' · so ' + esc(ks.nhan) : '') + '</span><span class="sp"></span><button class="btn primary" id="bc-tao">Tạo báo cáo</button></div>' +
      (ky.ghi_chu.length ? '<div class="warn-box">' + ky.ghi_chu.map(esc).join('<br>') + '</div>' : '') + '</div>';
  }
  function htmlDau(bc) {
    var ro = bc.trang_thai !== 'nhap', ng = nguoi();
    return '<div class="card bc-dau-card"><div class="bc-row"><span class="chip ' + bc.trang_thai + '">' + BC.TRANG_THAI[bc.trang_thai] + '</span><b>' + esc(bc.snapshot.ten_dv) + ' · ' + esc(bc.ky.nhan) + '</b>' + (bc.ky_so.loai !== 'khong' ? '<span class="muted">so ' + esc(bc.ky_so.nhan) + '</span>' : '') +
      '<span class="muted">Ngày chốt ' + esc(F.dm(bc.ngay_chot)) + ' · lập bởi ' + esc((bc.nguoi_lap || {}).ho_ten || '') + '</span><span class="sp"></span><span id="bc-luu" class="muted">' + (ro ? '' : '') + '</span>' +
      (ro ? '' : '<button class="btn" id="bc-moi">⟳ Làm mới số</button>') + '<button class="btn" id="bc-xem">Xem trước</button><button class="btn" id="bc-word">⤓ Word</button><button class="btn" id="bc-pdf">⤓ PDF / In</button><button class="btn" id="bc-pptx" title="Xuất slide giao ban (.pptx) theo kỳ của báo cáo">⤓ PowerPoint</button><button class="btn" id="bc-genie" title="Tạo tệp .txt gồm yêu cầu, ngữ cảnh đã soạn và số liệu JSON để gửi Genie viết báo cáo">Xuất prompt gửi Genie</button>' +
      (ro ? (bc.trang_thai === 'hoan_thien' ? '<button class="btn primary" id="bc-molai">Mở lại để sửa</button>' : '') : '<button class="btn danger-ghost" id="bc-xoa">Xoá nháp</button><button class="btn primary" id="bc-hoan">✓ Hoàn thiện</button>') + '</div>' +
      (bc.snapshot.canh_bao_ky.length ? '<div class="warn-box">' + bc.snapshot.canh_bao_ky.map(esc).join('<br>') + '</div>' : '') +
      (ro ? '' : '<div class="bc-row" style="margin-top:8px"><label class="muted">Chức danh ký trên báo cáo&nbsp;<input id="bc-cd" value="' + esc(ng.chuc_danh) + '" placeholder="VD: TRƯỞNG PHÒNG TỔNG HỢP" style="min-width:260px"></label></div>') + '</div>';
  }
  function htmlNhanDinh(bc, ro) {
    return '<div class="card"><h3>B · Nhận định tổng quan <small class="muted">Hệ thống soạn dự thảo từ số liệu — người lập sửa / xác nhận</small></h3>' + Object.keys(BC.NH_TITLE).map(function (k) {
      var n = bc.nhan_dinh[k] || { noi_dung: '' }; return '<label class="field"><span>' + BC.NH_TITLE[k] + (n.da_sua ? ' <em class="muted">(đã sửa)</em>' : ' <em class="muted">(dự thảo)</em>') + (ro ? '' : ' <button type="button" class="btn sm" data-gn="' + k + '" title="Sao chép prompt để Genie viết nhận định cho mục này">Prompt Genie</button>') + '</span><textarea data-nd="' + k + '" rows="3"' + (ro ? ' disabled' : '') + '>' + esc(n.noi_dung) + '</textarea></label>'; }).join('') + '</div>';
  }
  function htmlKpi(bc) { var b = BC.taiLieu(Object.assign({}, bc, { ket_luan: Object.assign({}, bc.ket_luan, { chon: { B: false, C: 'tat_ca', F: false, phu_luc: false } }), van_de: [] })); return '<div class="card p0"><div style="padding:14px 16px 0"><h3>C · Bảng tổng hợp KPI <small class="muted">' + esc(bc.ky.nhan) + (bc.ky_so.loai !== 'khong' ? ' · so ' + esc(bc.ky_so.nhan) : '') + '</small></h3></div><div class="tbl-wrap">' + htmlDoc(b.filter(function (x) { return x.t === 'bang'; })) + '</div></div>'; }
  function htmlVd(bc, ro) {
    var dem = {}; bc.van_de.forEach(function (v) { dem[v.trang_thai] = (dem[v.trang_thai] || 0) + 1; });
    return '<div class="card"><h3>E · Vấn đề trọng tâm <small class="muted">' + bc.van_de.length + ' vấn đề · ' + Object.keys(BC.DANH_GIA).map(function (k) { return (dem[k] || 0) + ' ' + BC.DANH_GIA[k].toLowerCase(); }).join(' · ') + '</small></h3>' +
      '<p class="muted">Hệ thống chỉ nêu hiện tượng, số liệu và câu hỏi; <b>nguyên nhân do người lập chọn</b>. Vấn đề mức cao / trung bình chưa đánh giá vẫn vào báo cáo; bác bỏ thì chuyển vào phụ lục.</p>' +
      bc.van_de.map(function (v, i) {
        var d = ro ? ' disabled' : '', h = '<div class="bc-vd ' + (v.muc || 'khong') + '" data-i="' + i + '"><div class="bc-row"><span class="chip m-' + (v.muc || 'khong') + '">' + (v.muc ? BC.MUC[v.muc] : 'Chưa phân mức') + '</span><b>' + esc(v.tieu_de) + '</b><span class="muted">' + esc(BC.NGUON[v.nguon] || '') + (v.khong_con ? ' · không còn phát sinh ở số mới' : '') + (v.so_doi ? ' · số đã đổi' : '') + '</span><span class="sp"></span>' +
          sel('vd-tt-' + i, Object.keys(BC.DANH_GIA).map(function (k) { return [k, BC.DANH_GIA[k]]; }), v.trang_thai, ro) + '</div><p>' + esc(v.hien_tuong) + '</p>';
        if (v.so_lieu.length) h += '<ul class="muted">' + v.so_lieu.map(function (x) { return '<li>' + esc(x[0]) + ': ' + esc(x[1]) + '</li>'; }).join('') + '</ul>';
        if (v.ly_do_chu_y) h += '<p class="muted"><i>Vì sao nêu: ' + esc(v.ly_do_chu_y) + '</i></p>';
        if (v.cau_hoi.length) h += '<details><summary>Câu hỏi xác minh (' + v.cau_hoi.length + ')</summary><ul>' + v.cau_hoi.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></details>';
        if (v.trang_thai === 'xac_nhan' || v.trang_thai === 'kiem_tra') h += '<div class="bc-nn"><b>Nguyên nhân</b> ' + v.goi_y.map(function (g) { return '<label><input type="checkbox" data-nn="' + esc(g.id) + '"' + (v.nguyen_nhan.indexOf(g.id) >= 0 ? ' checked' : '') + d + '> ' + esc(g.ten) + '</label>'; }).join('') +
          '<input data-f="nguyen_nhan_khac" placeholder="Nguyên nhân khác…" value="' + esc(v.nguyen_nhan_khac) + '"' + d + '><textarea data-f="boi_canh" rows="2" placeholder="Bối cảnh / diễn giải…"' + d + '>' + esc(v.boi_canh) + '</textarea></div>';
        if (v.trang_thai === 'bac_bo') h += '<textarea data-f="ly_do_bac_bo" rows="2" placeholder="Lý do bác bỏ (bắt buộc)…"' + d + '>' + esc(v.ly_do_bac_bo) + '</textarea>';
        if (v.trang_thai !== 'bac_bo') h += '<textarea data-f="huong_xu_ly" rows="2" placeholder="Hướng xử lý…"' + d + '>' + esc(v.huong_xu_ly) + '</textarea>' + (ro ? '' : '<button class="btn sm vd-gp" data-i="' + i + '">+ Đưa sang Giải pháp</button> <button class="btn sm vd-gn" data-i="' + i + '" title="Sao chép prompt để Genie nhận xét vấn đề này và gợi ý hướng xử lý (dán vào ô Hướng xử lý)">Prompt Genie</button> <button class="btn sm vd-hd" data-i="' + i + '" title="Tạo nhiệm vụ có người phụ trách, thời hạn và tự đối chiếu kết quả ở kỳ sau (mục Biện pháp khắc phục)">Giao nhiệm vụ theo dõi</button>');
        return h + '</div>'; }).join('') + (ro ? '' : '<button class="btn" id="bc-them-vd">+ Thêm vấn đề người lập phát hiện</button>') + '</div>';
  }
  function htmlGp(bc, ro) {
    var d = ro ? ' disabled' : '';
    return '<div class="card"><h3>F · Giải pháp và kiến nghị <small class="muted">' + (bc.giai_phap || []).length + ' dòng · kiến nghị BGĐ = nội dung vượt thẩm quyền đơn vị</small></h3>' + ((bc.giai_phap || []).length ? '<table class="tbl compact bc-gp"><thead><tr><th>Giải pháp / kiến nghị</th><th>Phụ trách</th><th>Hạn</th><th>BGĐ</th><th></th></tr></thead><tbody>' + bc.giai_phap.map(function (g, i) {
      return '<tr data-g="' + i + '"><td><textarea data-gf="giai_phap" rows="2"' + d + '>' + esc(g.giai_phap) + '</textarea></td><td><input data-gf="phu_trach" value="' + esc(g.phu_trach) + '"' + d + '></td><td><input type="date" data-gf="han" value="' + esc(g.han || '') + '"' + d + '></td><td class="c"><input type="checkbox" data-gf="kien_nghi_bgd"' + (g.kien_nghi_bgd ? ' checked' : '') + d + '></td><td>' + (ro ? '' : '<button class="btn sm danger-ghost gp-xoa">Xoá</button>') + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="muted">Chưa có giải pháp.</p>') + (ro ? '' : '<button class="btn" id="bc-them-gp">+ Thêm dòng</button>') + '</div>';
  }
  function htmlKl(bc, ro) {
    var c = bc.ket_luan.chon || {}, d = ro ? ' disabled' : '';
    return '<div class="card"><h3>G · Kết luận và hoàn thiện báo cáo</h3><label class="field"><span>Nhận định tổng thể' + (d ? '' : ' <button type="button" class="btn sm" data-gn="ket_luan" title="Sao chép prompt để Genie viết nhận định tổng thể">Prompt Genie</button>') + '</span><textarea id="kl-nd" rows="4"' + d + '>' + esc(bc.ket_luan.noi_dung) + '</textarea></label><div class="bc-row"><b>Đưa vào bản chính thức:</b>' +
      '<label><input type="checkbox" id="kl-B"' + (c.B !== false ? ' checked' : '') + d + '> B Nhận định</label>' + sel('kl-C', [['tat_ca', 'Bảng KPI: tất cả chỉ tiêu'], ['khong_dat', 'Bảng KPI: chỉ chỉ tiêu chưa đạt'], ['khong', 'Không đưa bảng KPI']], c.C || 'tat_ca', ro) +
      '<label><input type="checkbox" id="kl-F"' + (c.F !== false ? ' checked' : '') + d + '> F Giải pháp & kiến nghị</label><label><input type="checkbox" id="kl-P"' + (c.phu_luc !== false ? ' checked' : '') + d + '> Phụ lục nhận định đã bác bỏ</label></div><p class="muted">Mục E (vấn đề) luôn có trong báo cáo — chia theo: đã xác nhận · đang xác minh · chưa đánh giá; bác bỏ ở phụ lục.</p></div>';
  }
  function htmlLs() {
    var TT = { nhap: 'Nháp', hoan_thien: 'Hoàn thiện', thay_the: 'Đã thay thế' };
    return ST.ls.length ? '<table class="tbl compact"><thead><tr><th>Trạng thái</th><th>Đơn vị</th><th>Kỳ</th><th>Cập nhật</th><th>Người lập</th><th class="right">Vấn đề</th><th></th></tr></thead><tbody>' + ST.ls.map(function (m) {
      return '<tr><td><span class="chip ' + m.trang_thai + '">' + TT[m.trang_thai] + '</span></td><td>' + esc(m.ten_dv) + '</td><td>' + esc(m.ky) + (m.ky_so ? ' <small class="muted">so ' + esc(m.ky_so) + '</small>' : '') + '</td><td class="muted nowrap">' + new Date(m.sua_luc).toLocaleString('vi-VN') + '</td><td>' + esc(m.nguoi_lap) + '</td><td class="right">' + m.so_van_de + '</td><td class="right nowrap"><button class="btn sm ls-mo" data-id="' + esc(m.id) + '">Mở</button> <button class="btn sm ls-json" data-id="' + esc(m.id) + '" title="Tải tệp .json">⤓</button></td></tr>'; }).join('') + '</tbody></table>' : '<p class="muted">Chưa có báo cáo nào.</p>';
  }

  VIEWS.baoCaoKiemThu = { ST: ST, moGenie: moGenie };   // chỉ dùng cho kiểm thử giao diện
  VIEWS['bao-cao-giao-ban'] = {
    html: function () {
      var M = STORE.model(), bc = ST.bc, ro = bc && bc.trang_thai !== 'nhap', h = '<h2 class="page-title">Báo cáo giao ban</h2>' + htmlLap(M);
      if (bc) h += htmlDau(bc) + htmlNhanDinh(bc, ro) + htmlKpi(bc) + htmlVd(bc, ro) + htmlGp(bc, ro) + htmlKl(bc, ro);
      else h += '<div class="card empty"><h3>Chưa mở báo cáo</h3><p class="muted">Chọn đơn vị, kỳ và kỳ so sánh rồi bấm <b>Tạo báo cáo</b>, hoặc mở một báo cáo trong phần Lịch sử bên dưới.</p></div>';
      return h + '<div class="card"><div class="card-head"><h3>Lịch sử báo cáo giao ban</h3><div class="btns"><button class="btn sm" id="ls-chung" title="Đọc các bản hoàn thiện của máy khác trên Data\\BAO_CAO_GIAO_BAN">⟳ Đồng bộ thư mục chung</button><button class="btn sm" id="ls-nap">⬆ Nạp tệp .json</button></div></div><div id="bc-ls">' + htmlLs() + '</div></div>';
    },
    mount: function (v) {
      var $ = function (s) { return v.querySelector(s); }, bc = ST.bc, M = STORE.model(), rerender = function () { APP.render(); };
      if (!ST.tai) { ST.tai = true; BL.napChung().then(function (n) { if (n) UI.toast('Đã nạp ' + n + ' báo cáo hoàn thiện từ thư mục chung.', 'ok'); return napLs(); }); } else napLs();
      /* --- lập báo cáo --- */
      var on = function (id, fn) { var e = $('#' + id); if (e) e.onchange = function () { fn(this.value); rerender(); }; };
      on('bc-dv', function (x) { ST.dv = x; }); on('bc-loai', function (x) { ST.loai = x; }); on('bc-nam', function (x) { ST.nam = +x; }); on('bc-thang', function (x) { ST.thang = +x; }); on('bc-quy', function (x) { ST.quy = +x; }); on('bc-so', function (x) { ST.loaiSo = x; });
      $('#bc-tao').onclick = function () {
        var nam = ST.nam || APP.ky.nam, thang = ST.thang || APP.ky.thang, ky = ST.loai === 'thang' ? BC.kyTuLoai(M, 'thang', { nam: nam, thang: thang }) : ST.loai === 'quy' ? BC.kyTuLoai(M, 'quy', { nam: nam, quy: ST.quy || Math.ceil(thang / 3) }) : BC.kyTuLoai(M, 'nam', { nam: nam });
        try { ST.bc = BC.taoBaoCao({ M: M, state: STORE.state, ky: ky, ks: BC.kySo(ky, ST.loaiSo), dv: ST.dv, nguoi: nguoi(), app_version: KPI_CFG.PHIEN_BAN }); } catch (e) { UI.toast('Không tạo được báo cáo: ' + e.message, 'err'); return; }
        BL.luu(ST.bc).then(function () { UI.toast('Đã tạo bản nháp: ' + ST.bc.snapshot.ten_dv + ' · ' + ST.bc.ky.nhan + ' (' + ST.bc.van_de.length + ' vấn đề).', 'ok'); rerender(); }, function (e) { UI.toast(e.message, 'err'); });
      };
      /* --- lịch sử --- */
      $('#ls-chung').onclick = function () { BL.napChung().then(function (n) { UI.toast(n ? 'Đã nạp ' + n + ' báo cáo từ thư mục chung.' : 'Không có báo cáo mới trên thư mục chung.', n ? 'ok' : 'info'); napLs(); }); };
      $('#ls-nap').onclick = function () { UI.pickFile('.json').then(function (f) { if (!f) return; f.text().then(function (t) { return BL.napJson(t); }).then(function (b) { UI.toast('Đã nạp báo cáo ' + b.ky.nhan + '.', 'ok'); napLs(); }, function (e) { UI.toast(e.message, 'err'); }); }); };
      v.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('.ls-mo, .ls-json'); if (!b) return;
        BL.doc(b.dataset.id).then(function (x) { if (!x) return; if (b.classList.contains('ls-json')) UI.download(tenTep(x, '.json'), JSON.stringify(x), 'application/json'); else { ST.bc = x; rerender(); } });
      });
      if (!bc) return;
      var ro = bc.trang_thai !== 'nhap';
      $('#bc-xem').onclick = function () { UI.modal('Xem trước — ' + bc.snapshot.ten_dv + ' · ' + bc.ky.nhan, htmlDoc(BC.taiLieu(bc)), [{ text: 'Đóng' }, { text: 'Word', onClick: function () { xuatWord(bc); return false; } }, { text: 'PDF / In', cls: 'primary', onClick: function () { inPdf(bc); return false; } }], { wide: true }); };
      $('#bc-genie').onclick = function () { moGenie(bc); };
      $('#bc-word').onclick = function () { xuatWord(bc); }; $('#bc-pdf').onclick = function () { inPdf(bc); };
      $('#bc-pptx').onclick = function () { var b = this; b.disabled = true; KPI_OFFICE.xuatPptx(bc.ky.nam, bc.ky.thang).then(function () { UI.toast('Đã xuất PowerPoint.', 'ok'); }, function (e) { UI.toast('Không xuất được PowerPoint: ' + e.message, 'err'); }).then(function () { b.disabled = false; }); };
      if (ro) { var mo = $('#bc-molai'); if (mo) mo.onclick = function () { ST.bc = BC.moLai(bc, nguoi()); BL.luu(ST.bc).then(function () { UI.toast('Đã tạo bản mới từ bản hoàn thiện (giữ số đã chốt). Bản cũ chuyển "Đã thay thế" khi bản mới được hoàn thiện.', 'ok'); rerender(); }, function (e) { UI.toast(e.message, 'err'); }); }; return; }
      /* --- chỉnh sửa bản nháp --- */
      $('#bc-cd').oninput = function () { try { localStorage.setItem(LS_CD, this.value); } catch (e) {} bc.nguoi_lap.chuc_danh = this.value; luuNhap(); };
      $('#bc-moi').onclick = function () { try { ST.bc = BC.lamMoiSo(bc, { M: M, state: STORE.state, boi: nguoi().username }); } catch (e) { UI.toast(e.message, 'err'); return; } BL.luu(ST.bc).then(function () { UI.toast('Đã làm mới số theo dữ liệu hiện hành (giữ đánh giá và phần đã sửa).', 'ok'); rerender(); }); };
      $('#bc-xoa').onclick = function () { UI.confirm('Xoá bản nháp', 'Xoá bản nháp <b>' + esc(bc.snapshot.ten_dv) + ' · ' + esc(bc.ky.nhan) + '</b>?', 'Xoá', true).then(function (ok) { if (ok) BL.xoaNhap(bc.id).then(function () { ST.bc = null; rerender(); }); }); };
      $('#bc-hoan').onclick = function () {
        var kt = BC.kiemTraHoanThien(bc); if (!kt.ok) { UI.modal('Chưa thể hoàn thiện', '<ul>' + kt.loi.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>', [{ text: 'Đóng', cls: 'primary' }]); return; }
        UI.confirm('Hoàn thiện báo cáo', (kt.hoi.length ? '<p><b>Lưu ý:</b> ' + kt.hoi.map(esc).join('<br>') + '</p>' : '') + 'Sau khi hoàn thiện, số liệu và nội dung được chốt, <b>không sửa trực tiếp</b> (muốn sửa phải "Mở lại" tạo bản mới). Bản hoàn thiện được ghi lên thư mục chung. Tiếp tục?', 'Hoàn thiện').then(function (ok) {
          if (!ok) return; var moi = BC.hoanThien(bc, nguoi());
          BL.luu(moi).then(function () { if (!bc.phien_ban_cua) return; return BL.doc(bc.phien_ban_cua).then(function (cu) { return cu && cu.trang_thai === 'hoan_thien' ? BL.luu(BC.danhDauThayThe(cu, moi.id)) : null; }); }).then(function () { ST.bc = moi; UI.toast('Đã hoàn thiện báo cáo.', 'ok'); rerender(); }, function (e) { UI.toast(e.message, 'err'); });
        });
      };
      /* nhận định / kết luận / vấn đề / giải pháp: cập nhật bộ nhớ rồi lưu nháp (không vẽ lại) */
      v.querySelectorAll('[data-nd]').forEach(function (t) { t.oninput = function () { var n = bc.nhan_dinh[t.dataset.nd]; n.noi_dung = t.value; n.da_sua = t.value !== n.du_thao; luuNhap(); }; });
      /* Prompt Genie từng mục: sao chép vào bộ nhớ tạm; không được phép thì hiện ô văn bản để tự chép */
      var genie = function (muc, nhan) {
        var t; try { t = KPI_GENIE.taoPromptMuc(bc, muc); } catch (e) { UI.toast(e.message, 'err'); return; }
        KPI_GENIE.saoChep(t).then(function (ok) {
          if (ok) UI.toast('Đã sao chép prompt mục "' + nhan + '" — dán vào Genie, rồi dán kết quả vào ô tương ứng.', 'ok');
          else UI.modal('Prompt cho Genie — ' + nhan, '<p class="muted">Trình duyệt không cho phép sao chép tự động. Chọn tất cả (Ctrl+A) rồi sao chép (Ctrl+C).</p><textarea readonly rows="14" style="width:100%" onfocus="this.select()">' + esc(t) + '</textarea>', [{ text: 'Đóng' }]);
        });
      };
      v.querySelectorAll('[data-gn]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); genie(b.dataset.gn, b.dataset.gn === 'ket_luan' ? 'Nhận định tổng thể' : BC.NH_TITLE[b.dataset.gn]); }; });
      $('#kl-nd').oninput = function () { bc.ket_luan.noi_dung = this.value; bc.ket_luan.da_sua = true; luuNhap(); };
      [['kl-B', 'B'], ['kl-F', 'F'], ['kl-P', 'phu_luc']].forEach(function (x) { $('#' + x[0]).onchange = function () { bc.ket_luan.chon[x[1]] = this.checked; luuNhap(); }; }); $('#kl-C').onchange = function () { bc.ket_luan.chon.C = this.value; luuNhap(); };
      v.querySelectorAll('.bc-vd').forEach(function (box) {
        var vd = bc.van_de[+box.dataset.i], i = box.dataset.i;
        box.querySelector('#vd-tt-' + i).onchange = function () { vd.trang_thai = this.value; luuNhap(true); rerender(); };
        box.querySelectorAll('[data-nn]').forEach(function (c) { c.onchange = function () { var k = vd.nguyen_nhan.indexOf(c.dataset.nn); if (c.checked && k < 0) vd.nguyen_nhan.push(c.dataset.nn); if (!c.checked && k >= 0) vd.nguyen_nhan.splice(k, 1); luuNhap(); }; });
        box.querySelectorAll('[data-f]').forEach(function (t) { t.oninput = function () { vd[t.dataset.f] = t.value; luuNhap(); }; });
        var gn = box.querySelector('.vd-gn'); if (gn) gn.onclick = function () { genie({ vd: vd.id }, 'Hướng xử lý — ' + vd.tieu_de); };
        var hd = box.querySelector('.vd-hd'); if (hd) hd.onclick = function () {
          VIEWS['hanh-dong'].mo(null, { tieu_de: String(vd.huong_xu_ly || '').trim() || ('Xử lý: ' + vd.tieu_de), dv: bc.dv === KPI_CFG.MA_CN ? '' : bc.dv, ct: vd.ma_chi_tieu || '', nam: bc.ky.nam, thang: bc.ky.thang || APP.ky.thang, mo_ta: vd.hien_tuong || '', nguon: 'bao_cao:' + bc.id }, APP);
        };
        var g = box.querySelector('.vd-gp'); if (g) g.onclick = function () { bc.giai_phap.push({ vd_id: vd.id, giai_phap: '', phu_trach: '', han: '', kien_nghi_bgd: false }); luuNhap(true); UI.toast('Đã thêm dòng giải pháp cho "' + vd.tieu_de + '" — điền nội dung ở mục F.', 'ok'); rerender(); };
      });
      $('#bc-them-vd').onclick = function () {
        UI.modal('Thêm vấn đề', '<label class="field"><span>Tiêu đề</span><input id="nv-td"></label><label class="field"><span>Hiện tượng / số liệu</span><textarea id="nv-ht" rows="3"></textarea></label><label class="field"><span>Mức</span>' + sel('nv-muc', [['', 'Chưa phân mức'], ['cao', 'Cao'], ['tb', 'Trung bình'], ['thap', 'Thấp']], '') + '</label>',
          [{ text: 'Huỷ' }, { text: 'Thêm', cls: 'primary', onClick: function (w) { var td = w.querySelector('#nv-td').value; if (!td.trim()) { UI.toast('Nhập tiêu đề.', 'err'); return false; } ST.bc = BC.themVanDe(bc, { tieu_de: td, hien_tuong: w.querySelector('#nv-ht').value, muc: w.querySelector('#nv-muc').value || null }); luuNhap(true); setTimeout(rerender, 0); } }]);
      };
      var tg = $('#bc-them-gp'); if (tg) tg.onclick = function () { bc.giai_phap.push({ vd_id: null, giai_phap: '', phu_trach: '', han: '', kien_nghi_bgd: false }); luuNhap(true); rerender(); };
      v.querySelectorAll('.bc-gp tr[data-g]').forEach(function (tr) {
        var g = bc.giai_phap[+tr.dataset.g];
        tr.querySelectorAll('[data-gf]').forEach(function (e) { e[e.type === 'checkbox' ? 'onchange' : 'oninput'] = function () { g[e.dataset.gf] = e.type === 'checkbox' ? e.checked : e.value; luuNhap(); }; });
        tr.querySelector('.gp-xoa').onclick = function () { bc.giai_phap.splice(+tr.dataset.g, 1); luuNhap(true); rerender(); };
      });
    }
  };
})(window);
