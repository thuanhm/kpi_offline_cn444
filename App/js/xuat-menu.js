/* NÚT "XUẤT" Ở THANH TRÊN CÙNG — menu xuất ảnh trang đang xem và các báo cáo cả chi nhánh theo kỳ đang chọn. Dùng được ở chế độ xem (không cần đăng nhập quản trị). */
(function (root) {
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var dangChay = false;

  function kyNhan() { var k = root.APP.ky; return 'T' + k.thang + '/' + k.nam; }

  /* Ảnh PNG cả trang đang xem: thêm tạm dải đầu (màu VietinBank, tên chi nhánh, kỳ, giờ xuất) rồi chụp toàn bộ nội dung, kể cả phần ngoài màn hình */
  function anhTrang() {
    var page = document.querySelector('#view .page'); if (!page) return Promise.reject(new Error('Chưa có nội dung để chụp.'));
    var tieuDe = (document.querySelector('#topbar h1') || {}).textContent || '', st = root.STORE.state;
    var head = document.createElement('div'); head.className = 'png-head';
    head.innerHTML = '<div class="png-band"></div><div class="png-head-in"><b>' + esc(st.settings.ten_chi_nhanh || '') + '</b><span>' + esc(tieuDe) + ' · Kỳ ' + esc(kyNhan()) + ' · Xuất lúc ' + esc(root.KPI_OFFICE.giayXuat()) + '</span></div>';
    page.insertBefore(head, page.firstChild);
    return root.UI.lib('snapdom').then(function (sd) {
      var d = new Date(), p2 = function (x) { return (x < 10 ? '0' : '') + x; };
      return sd.download(page, { format: 'png', scale: 2, backgroundColor: '#f2f5fa', exclude: ['.png-btn', '.png-row'], filename: root.UI.slug(tieuDe).slice(0, 50) + '_' + kyNhan().replace('/', '_') + '_' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) });
    }).then(function () { head.remove(); }, function (e) { head.remove(); throw e; });
  }

  function coSo() {
    var k = root.APP.ky, M = root.STORE.model();
    if (M.thangCoSo(k.nam).indexOf(k.thang) < 0) { root.UI.toast('Kỳ ' + kyNhan() + ' chưa có số thực hiện — hãy chọn kỳ khác trước khi xuất.', 'err'); return false; }
    return true;
  }
  var MUC = [
    { id: 'png', nhom: 'Ảnh của trang đang xem', ten: 'Ảnh PNG cả trang này', mo_ta: 'Chụp toàn bộ màn hình đang xem thành 1 ảnh, có dải đầu VietinBank, tên chi nhánh, kỳ, giờ xuất', chay: function () { return anhTrang(); }, can: false },
    { id: 'pptx', nhom: 'Báo cáo cả chi nhánh', ten: 'Slide giao ban (PowerPoint)', mo_ta: '6 slide: bìa, kết quả toàn chi nhánh, xếp hạng, ma trận, diễn biến điểm, nhận định và cảnh báo', chay: function (k) { return root.KPI_OFFICE.xuatPptx(k.nam, k.thang); }, can: true },
    { id: 'pptx2', ten: 'Slide giao ban + thẻ điểm từng đơn vị', mo_ta: '6 slide trên, thêm mỗi phòng/PGD 1 slide thẻ điểm chi tiết', chay: function (k) { return root.KPI_OFFICE.xuatPptx(k.nam, k.thang, { theDiem: true }); }, can: true },
    { id: 'docx', ten: 'Báo cáo Word', mo_ta: 'Văn bản A4: quốc hiệu, nhận định, bảng điểm, biểu đồ xếp hạng, cảnh báo; mục Đề xuất để trống', chay: function (k) { return root.KPI_OFFICE.xuatDocx(k.nam, k.thang); }, can: true },
    { id: 'xlsx', ten: 'Báo cáo Excel đầy đủ', mo_ta: 'Tổng hợp, ma trận, thứ hạng theo chỉ tiêu, % kế hoạch năm, thẻ điểm từng đơn vị; tô màu theo ngưỡng', chay: function (k) { return root.EXCEL.xuatBaoCao(k.nam, k.thang); }, can: true }
  ];

  function html() { return '<div class="xuat-wrap"><button class="btn" id="btn-xuat" aria-haspopup="true" aria-expanded="false" title="Xuất ảnh, slide, Word, Excel theo kỳ đang chọn">⤓ Xuất ▾</button><div class="xuat-menu" id="xuat-menu" hidden></div></div>'; }

  function dong() { var m = document.getElementById('xuat-menu'), b = document.getElementById('btn-xuat'); if (m) m.hidden = true; if (b) b.setAttribute('aria-expanded', 'false'); }
  function mo() {
    var m = document.getElementById('xuat-menu'), b = document.getElementById('btn-xuat'); if (!m) return;
    var h = '<div class="xuat-ky">Kỳ ' + esc(kyNhan()) + '</div>', nhom = '';
    MUC.forEach(function (x) {
      if (x.nhom && x.nhom !== nhom) { nhom = x.nhom; h += '<div class="xuat-nhom">' + esc(nhom) + '</div>'; }
      h += '<button type="button" class="xuat-item" data-x="' + x.id + '"><b>' + esc(x.ten) + '</b><small>' + esc(x.mo_ta) + '</small></button>';
    });
    h += '<div class="xuat-ghi">Muốn xuất tháng khác: đổi kỳ ở ô bên cạnh trước.</div>';
    m.innerHTML = h; m.hidden = false; b.setAttribute('aria-expanded', 'true');
    [].forEach.call(m.querySelectorAll('[data-x]'), function (el) { el.onclick = function () { chay(el.dataset.x); }; });
  }
  function chay(id) {
    var x = MUC.filter(function (y) { return y.id === id; })[0]; if (!x || dangChay) return; dong();
    if (x.can && !coSo()) return;
    dangChay = true; var k = { nam: root.APP.ky.nam, thang: root.APP.ky.thang }, b = document.getElementById('btn-xuat'); if (b) { b.disabled = true; b.textContent = 'Đang tạo…'; }
    root.UI.toast('Đang tạo ' + x.ten.toLowerCase() + ' — ' + kyNhan() + '…', 'ok');
    Promise.resolve().then(function () { return x.chay(k); }).then(function () { root.UI.toast('Đã xuất: ' + x.ten + ' (' + kyNhan() + ').', 'ok'); }, function (e) { root.UI.toast('Không xuất được: ' + (e && e.message || e), 'err'); })
      .then(function () { dangChay = false; var b2 = document.getElementById('btn-xuat'); if (b2) { b2.disabled = false; b2.textContent = '⤓ Xuất ▾'; } });
  }
  function bind() {
    var b = document.getElementById('btn-xuat'); if (!b) return;
    b.onclick = function (e) { e.stopPropagation(); var m = document.getElementById('xuat-menu'); if (m.hidden) mo(); else dong(); };
  }
  document.addEventListener('click', function (e) { var w = e.target.closest && e.target.closest('.xuat-wrap'); if (!w) dong(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dong(); });

  root.KPI_XUAT = { html: html, bind: bind, anhTrang: anhTrang };
})(window);
