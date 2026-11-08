/* MOI-SHELL — vỏ giao diện mới: khung (sidebar/topbar/nội dung), điều hướng, nút chuyển đổi giao diện, sự kiện dùng chung, Presentation Mode.
 * Tái dùng nguyên các phần tử #sidebar #topbar #view của khung cũ (đổi tên lớp CSS khi vào/ra) nên mọi màn hình cũ vẫn chạy bên trong được
 * (hosted legacy). Màn hình đã thiết kế lại (H.VIEWS) vẽ bằng Design System; màn hình khác hiển thị bản cũ với bảng màu mới (UI skin). */
(function (root) {
  var H = root.MOI_UI, V = root.VTB, D = root.MOI_DATA, CN = root.KPI_CFG.MA_CN, orig = null, rsT = null;
  var $ = function (id) { return document.getElementById(id); };
  var esc = V.esc;
  var STAGE_OK = { 'tong-quan': 1, 'dieu-hanh': 1 };

  function vaoKhung() {
    if (document.body.classList.contains('ui-moi')) return;
    var app = document.querySelector('.app'), main = document.querySelector('.main'), side = $('sidebar'), top = $('topbar'), view = $('view');
    orig = { app: app.className, main: main.className, side: side.className, top: top.className, view: view.className };
    app.className = 'moi-app'; main.className = 'moi-main'; side.className = 'moi-side'; top.className = 'moi-top'; view.className = 'moi-content vtb-scope';
    document.body.classList.add('ui-moi');
  }
  function thoat() {
    var app = document.querySelector('.moi-app'), main = document.querySelector('.moi-main'), side = $('sidebar'), top = $('topbar'), view = $('view');
    if (orig && app) { app.className = orig.app; main.className = orig.main; side.className = orig.side; top.className = orig.top; view.className = orig.view; }
    document.body.classList.remove('ui-moi', 'moi-nav-open', 'moi-presenting');
    var st = $('moi-stage-root'); if (st) st.remove();
    orig = null;
  }

  /* ---------- Sidebar ---------- */
  function renderSide(A) {
    var admin = STORE.isAdmin(), st = STORE.state.settings, rt = A.route.id, grp = [], cur = null;
    A.NAV.forEach(function (n) { if (n.nhom !== undefined) { cur = { ten: n.nhom, admin: n.admin, items: [] }; grp.push(cur); return; } if (n.admin && !admin) return; cur.items.push(n); });
    var cn = String(st.ten_chi_nhanh || '').replace(/^VietinBank\s*/i, '');
    var h = '<a class="moi-brand" href="#/tong-quan" title="Về Tổng quan"><img src="assets/logo-vietinbank.png" alt="VietinBank" width="124" height="33"><span class="moi-brand-t"><b>' + esc(cn) + '</b><small>Dashboard KPI điều hành</small></span></a><nav aria-label="Điều hướng">';
    grp.forEach(function (g) {
      if (!g.items.length || (g.admin && !admin)) return;
      h += '<div class="moi-nav-g">' + (g.ten ? '<div class="moi-nav-h">' + esc(g.ten) + '</div>' : '') + g.items.map(function (n) {
        var nat = H.VIEWS[n.id] ? '' : '', on = rt === n.id;
        return '<a class="moi-nav-i' + (on ? ' is-on' : '') + '" href="#/' + n.id + '"' + (on ? ' aria-current="page"' : '') + '>' + A.icon(n.icon) + '<span>' + n.ten + '</span></a>'; }).join('') + '</div>';
    });
    h += '</nav><div class="moi-side-foot">Phiên bản ' + KPI_CFG.PHIEN_BAN + ' · Chạy offline<br>Giao diện mới (Design System VietinBank)</div>';
    $('sidebar').innerHTML = h;
  }

  /* ---------- Topbar ---------- */
  function renderTop(A) {
    var M = STORE.model(), ky = A.ky, nam = ky.nam, co = M.thangCoSo(nam), admin = STORE.isAdmin();
    var nams = {}; M.periods.forEach(function (p) { nams[p.nam] = 1; }); nams[STORE.state.settings.nam] = 1; nams[STORE.state.settings.nam - 1] = 1; nams[nam] = 1;
    var title = (A.NAV.filter(function (n) { return n.id === A.route.id; })[0] || {}).ten || '';
    var tOpts = ''; for (var t = 1; t <= 12; t++) tOpts += '<option value="' + t + '"' + (t === ky.thang ? ' selected' : '') + '>Tháng ' + t + (co.indexOf(t) >= 0 ? '' : ' (chưa có TH)') + '</option>';
    var stage = !!STAGE_OK[A.route.id];
    $('topbar').innerHTML = '<button type="button" class="moi-ico-btn moi-only-m" id="moi-btn-menu" aria-label="Mở menu">' + A.icon('menu') + '</button><h1 class="moi-h1">' + esc(title) + '</h1><div class="moi-grow"></div>' +
      '<div class="moi-period"><label for="sel-thang">Kỳ báo cáo</label><select id="sel-thang" aria-label="Tháng">' + tOpts + '</select><select id="sel-nam" aria-label="Năm">' + Object.keys(nams).sort().map(function (n) { return '<option' + (+n === nam ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div>' +
      '<span class="moi-upd" title="Thời điểm cập nhật dữ liệu gần nhất">Cập nhật ' + esc(H.kyNgay(STORE.state.cap_nhat_luc)) + '</span>' +
      (stage ? '<button type="button" class="moi-btn primary" data-act="stage" title="Chế độ trình chiếu 16:9 (họp giao ban)">Trình chiếu</button>' : '') +
      KPI_XUAT.html() + UI_SWITCH.html() + '<span id="sync-dot"></span>' + (admin && root.NAP ? '<a class="moi-nap" href="#/nap-tu-dong" title="File báo cáo thô chờ duyệt">⚡<b id="nap-badge"' + (NAP.cho.length ? '' : ' style="display:none"') + '>' + NAP.cho.length + '</b></a>' : '') +
      '<button type="button" class="moi-btn' + (admin ? ' admin' : '') + '" id="btn-mode" title="' + (admin ? 'Đang đăng nhập: ' + esc(STORE.nguoi() || 'Quản trị') + ' — bấm để đăng xuất' : 'Đăng nhập quản trị để chỉnh sửa') + '">' + A.icon(admin ? 'unlock' : 'lock') + '<span>' + (admin ? esc(STORE.nguoi() || 'Quản trị') : 'Chế độ xem') + '</span></button>';
    KPI_XUAT.bind(); UI_SWITCH.bind($('topbar')); A.renderSync();
    $('sel-thang').onchange = function () { A.ky = { nam: A.ky.nam, thang: +this.value, chon: true }; A.render(); };
    $('sel-nam').onchange = function () { var n = +this.value, k = STORE.model().kyMoiNhat(n); A.ky = k ? { nam: n, thang: k.thang } : { nam: n, thang: 12, chon: true }; A.render(); };
    $('btn-mode').onclick = A.toggleMode;
    $('topbar').onclick = function (e) { onClick(e, false); };           // nút Trình chiếu… nằm ở thanh trên
    $('moi-btn-menu').onclick = function () { document.body.classList.toggle('moi-nav-open'); };
  }

  /* ---------- Presentation Mode (khung 16:9, tham chiếu 1920×1080) ---------- */
  function setScale() { var r = $('moi-stage-root'); if (!r) return; r.style.setProperty('--s', String(Math.max(0.2, Math.min(window.innerWidth / 1920, window.innerHeight / 1080)))); }
  function renderStage(A) {
    var man = A.moi_stage_man === 'dieu-hanh' ? 'dieu-hanh' : 'tong-quan', M = STORE.model(), ky = A.ky, co = M.thangCoSo(ky.nam);
    var r = $('moi-stage-root'); if (!r) { r = document.createElement('div'); r.id = 'moi-stage-root'; document.body.appendChild(r); }
    r.className = 'moi-stage-root vtb-scope is-stage';
    var tOpts = ''; for (var t = 1; t <= 12; t++) tOpts += '<option value="' + t + '"' + (t === ky.thang ? ' selected' : '') + '>Tháng ' + t + (co.indexOf(t) >= 0 ? '' : ' (chưa có TH)') + '</option>';
    r.innerHTML = '<div class="moi-stage"><header class="moi-st-head"><div class="moi-st-brand"><img src="assets/logo-vietinbank.png" alt="VietinBank" width="132" height="35"><span class="moi-brand-t"><b>' + esc(String(STORE.state.settings.ten_chi_nhanh || '').replace(/^VietinBank\s*/i, '')) + '</b><small>Dashboard KPI điều hành</small></span></div>' +
      '<nav class="moi-st-tabs" aria-label="Chọn màn hình trình chiếu"><button type="button" data-st="tong-quan" aria-pressed="' + (man === 'tong-quan') + '">Tổng quan chi nhánh</button><button type="button" data-st="dieu-hanh" aria-pressed="' + (man === 'dieu-hanh') + '">Điều hành Ban giám đốc</button></nav><div class="moi-grow"></div>' +
      (STORE.state.du_lieu_mau ? '<span class="moi-mock">DỮ LIỆU MẪU</span>' : '') + '<label class="moi-fl inline"><span>Kỳ</span><select id="moi-st-thang" class="moi-sel" aria-label="Tháng">' + tOpts + '</select></label>' +
      '<button type="button" class="moi-btn" data-act="stage-exit">Thoát trình chiếu (Esc)</button></header><div class="moi-st-body">' + H.VIEWS[man].html(A, true) + '</div></div>';
    document.body.classList.add('moi-presenting'); setScale();
    $('moi-st-thang').onchange = function () { A.ky = { nam: A.ky.nam, thang: +this.value, chon: true }; A.render(); };
    var body = r.querySelector('.moi-st-body'); V.attachTips(r); V.attachKeys(r); H.ve(body, true);
    if (!r.__moi) { r.__moi = true; r.addEventListener('click', function (e) { onClick(e, true); }); }
  }
  function thoatStage(A) { A.moi_tc = false; var r = $('moi-stage-root'); if (r) r.remove(); document.body.classList.remove('moi-presenting'); }

  /* ---------- Sự kiện dùng chung ---------- */
  function onClick(e, st) {
    if (!document.body.classList.contains('ui-moi')) return;      // an toàn: không bao giờ can thiệp giao diện cũ
    var A = root.APP, t = e.target, b, route = A.route.id;
    if (t.closest && t.closest('.moi-legacy')) return;            // màn cũ tự xử lý sự kiện của nó
    if ((b = t.closest('[data-st]'))) { A.moi_stage_man = b.getAttribute('data-st'); A.render(); return; }
    if ((b = t.closest('[data-act]'))) {
      var a = b.getAttribute('data-act');
      if (a === 'stage') { A.moi_tc = true; A.moi_stage_man = route === 'dieu-hanh' ? 'dieu-hanh' : 'tong-quan'; A.render(); }
      else if (a === 'stage-exit') { thoatStage(A); A.render(); }
      else if (a === 'copy-nd') { var tx = $('moi-nd'); if (tx && navigator.clipboard) navigator.clipboard.writeText(tx.textContent).then(function () { UI.toast('Đã sao chép nhận định.', 'ok'); }, function () {}); }
      else if (a === 've-cn') { A.moi_dv = null; A.render(); }
      else if (a === 'giao-viec') { var hv = root.VIEWS['hanh-dong']; if (hv && hv.mo) hv.mo(null, null, A); }
      else { var v = H.VIEWS[route]; if (v && v.act) v.act(a, A); }
      return;
    }
    if ((b = t.closest('.moi-seg button'))) { var card = b.closest('[data-view-card]'); if (card) { card.classList.toggle('is-table', b.getAttribute('data-view') === 'table'); [].forEach.call(b.parentNode.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); } return; }
    if ((b = t.closest('.moi-pill[data-khoi]'))) { A.khoi = b.getAttribute('data-khoi'); A.render(); return; }
    if ((b = t.closest('.moi-pill[data-mode]'))) { A.mt_mode = b.getAttribute('data-mode'); A.render(); return; }
    if (t.closest('.vtb-tip')) return;
    if ((b = t.closest('[data-href]'))) { var hr = b.getAttribute('data-href'); if (st) { thoatStage(A); } if (hr) location.hash = hr; return; }
    if ((b = t.closest('[data-ct]'))) {
      var ct = b.getAttribute('data-ct');
      if (st || route === 'dieu-hanh') { thoatStage(A); A.moi_ct = ct; A.moi_dv = A.moi_dv || null; if (route === 'tong-quan') A.render(); else APP.go('tong-quan'); }
      else if (route === 'tong-quan') { A.moi_ct = ct; A.render(); var el = $('moi-bullets'); if (el && el.scrollIntoView) setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 30); }
      else if (route !== 'chi-tieu') APP.go('chi-tieu', ct);
      return;
    }
    if ((b = t.closest('[data-dv]'))) {
      var dv = b.getAttribute('data-dv');
      if (route === 'tong-quan' && !st) { A.moi_dv = A.moi_dv === dv ? null : dv; A.render(); var el2 = $('moi-bullets'); if (el2 && el2.scrollIntoView) setTimeout(function () { el2.scrollIntoView({ block: 'start' }); }, 30); }
      else if (st || route === 'dieu-hanh') { thoatStage(A); A.moi_dv = dv; APP.go('tong-quan'); if (location.hash === '#/tong-quan') A.render(); }
      else APP.go('phong', dv);
    }
  }
  window.addEventListener('keydown', function (e) {
    if (!document.body.classList.contains('ui-moi') || !$('moi-stage-root')) return;
    var A = root.APP;
    if (e.key === 'Escape') { thoatStage(A); A.render(); }
    else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) { A.moi_stage_man = A.moi_stage_man === 'dieu-hanh' ? 'tong-quan' : 'dieu-hanh'; A.render(); }
  });
  window.addEventListener('resize', function () {
    if (!document.body.classList.contains('ui-moi')) return; clearTimeout(rsT);
    rsT = setTimeout(function () { setScale(); var s = $('moi-stage-root'); if (s) H.ve(s.querySelector('.moi-st-body'), true); else H.ve($('view'), false); }, 120);
  });

  /* ---------- Vẽ ---------- */
  function render(A, banner) {
    vaoKhung();
    var rt = A.route.id, view = $('view'), nat = H.VIEWS[rt];
    if (A.moi_tc && !STAGE_OK[rt]) thoatStage(A);
    renderSide(A); renderTop(A);
    if (A.moi_tc && STAGE_OK[rt]) { view.innerHTML = ''; renderStage(A); return; }
    var st = $('moi-stage-root'); if (st) { st.remove(); document.body.classList.remove('moi-presenting'); }
    if (nat) {
      view.innerHTML = banner + '<div class="moi-page" data-route="' + esc(rt) + '">' + nat.html(A, false) + '</div>';
      if (nat.mount) nat.mount(view, A);
      H.ve(view, false);
      if (!view.__moi) { view.__moi = true; V.attachTips(view); V.attachKeys(view); view.addEventListener('click', function (e) { onClick(e, false); }); }
    } else {                                   // màn hình chưa thiết kế lại: dùng bản cũ trong vỏ mới (bảng màu mới)
      var fn = root.VIEWS[rt];
      view.innerHTML = banner + '<div class="page moi-legacy" data-route="' + esc(rt) + '">' + fn.html(A) + '</div>';
      if (fn.mount) fn.mount(view, A);
      if (root.KPI_ICONS) KPI_ICONS.decorate(view);
      var trang = view.querySelector('.moi-legacy');
      UI.nangBang(view).then(function () { if (view.querySelector('.moi-legacy') === trang) UI.nutAnh(view); });
      if (!view.__moi) { view.__moi = true; view.addEventListener('click', function (e) { onClick(e, false); }); }
    }
    document.body.classList.remove('moi-nav-open');
    if (rt !== A.moiLast) { A.moiLast = rt; window.scrollTo(0, 0); }
  }
  root.UI_MOI = { render: render, thoat: function () { thoatStage(root.APP || {}); thoat(); } };
})(window);
