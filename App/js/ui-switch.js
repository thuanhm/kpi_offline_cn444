/* UI SWITCH — chuyển đổi giữa GIAO DIỆN CŨ (legacy) và GIAO DIỆN MỚI (ui-moi/).
 * - Mặc định giao diện cũ; lựa chọn được nhớ trên máy (localStorage "KPI_CN444.giao_dien": 'cu' | 'moi' — không chứa dữ liệu nghiệp vụ).
 * - Giao diện mới nạp LƯỜI (chỉ khi được chọn): ui-moi/moi.css + vtb.js + moi-data.js + moi-views.js + moi-shell.js.
 *   Nếu nạp lỗi hoặc giao diện mới gặp sự cố → tự quay về giao diện cũ, không mất dữ liệu.
 * - Hai giao diện dùng CHUNG: STORE, Model/engine, APP (kỳ, đơn vị, bộ lọc, màn hình đang xem). Mô-đun này không chứa nghiệp vụ.
 * - CSS của nút chuyển đổi tự chèn (tiền tố .ui-sw) nên không phải sửa app.css của giao diện cũ. */
(function (root) {
  var KEY = 'KPI_CN444.giao_dien', V = (root.KPI_CFG && KPI_CFG.PHIEN_BAN) || '0';
  var FILES = { css: ['ui-moi/moi.css'], js: ['ui-moi/vtb.js', 'ui-moi/moi-data.js', 'ui-moi/moi-views.js', 'ui-moi/moi-views2.js', 'ui-moi/moi-shell.js'] };
  var pref = doc(), san = false, dangNap = null, cssDa = false;

  function doc() { try { return localStorage.getItem(KEY) === 'moi' ? 'moi' : 'cu'; } catch (e) { return 'cu'; } }
  function luu(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* trình duyệt chặn lưu: vẫn dùng được trong phiên */ } }
  function laMoi() { return pref === 'moi' && san; }
  function giaoDien() { return pref; }

  function css() {
    if (cssDa) return; cssDa = true;
    var s = document.createElement('style'); s.id = 'ui-sw-css';
    s.textContent = '.ui-sw{display:inline-flex;gap:2px;padding:2px;border-radius:9px;background:rgba(102,117,140,.16);vertical-align:middle}' +
      '.ui-sw button{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;font:inherit;font-size:12.5px;font-weight:600;line-height:1;color:#4a5a72;padding:7px 10px;border-radius:7px;cursor:pointer;white-space:nowrap}' +
      '.ui-sw button:hover{background:rgba(255,255,255,.7)}' +
      '.ui-sw button[aria-pressed="true"]{background:#005993;color:#fff}' +
      '.ui-sw button:focus-visible{outline:2px solid #005993;outline-offset:2px}' +
      '.ui-sw svg{width:14px;height:14px;flex:none}' +
      '@media (max-width:1180px){.ui-sw button span{display:none}}';
    document.head.appendChild(s);
  }
  var IC = {
    cu: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2.5" width="12" height="11" rx="1.5"/><path d="M6 2.5v11M2 6.5h4"/></svg>',
    moi: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2.5" width="12" height="11" rx="1.5"/><path d="M2 6h12M8 6v7.5"/></svg>'
  };
  /* HTML nút chuyển đổi (dùng ở header của CẢ HAI giao diện) */
  function html() {
    css(); var m = pref === 'moi';
    return '<div class="ui-sw" role="group" aria-label="Chọn giao diện"><button type="button" data-gd="cu" aria-pressed="' + !m + '" title="Giao diện cũ (đang dùng ổn định)">' + IC.cu + '<span>Giao diện cũ</span></button>' +
      '<button type="button" data-gd="moi" aria-pressed="' + m + '" title="Giao diện mới (Design System VietinBank)">' + IC.moi + '<span>Giao diện mới</span></button></div>';
  }
  function bind(box) {
    if (!box) return;
    [].forEach.call(box.querySelectorAll('.ui-sw [data-gd]'), function (b) { b.onclick = function () { dat(b.getAttribute('data-gd')); }; });
  }

  function tai(src, kieu) {
    return new Promise(function (ok, no) {
      var e = document.createElement(kieu === 'css' ? 'link' : 'script'), u = src + '?v=' + V;
      if (kieu === 'css') { e.rel = 'stylesheet'; e.href = u; } else e.src = u;
      e.onload = function () { ok(); }; e.onerror = function () { no(new Error('Không nạp được ' + src)); };
      document.head.appendChild(e);
    });
  }
  /* Nạp giao diện mới (một lần). Tệp JS nạp lần lượt theo thứ tự phụ thuộc. */
  function nap() {
    if (san) return Promise.resolve();
    if (dangNap) return dangNap;
    dangNap = Promise.all(FILES.css.map(function (f) { return tai(f, 'css'); })).then(function () {
      return FILES.js.reduce(function (p, f) { return p.then(function () { return tai(f, 'js'); }); }, Promise.resolve());
    }).then(function () { if (!root.UI_MOI) throw new Error('Giao diện mới không khởi tạo được'); san = true; }, function (e) { dangNap = null; throw e; });
    return dangNap;
  }
  /* Gọi khi mở ứng dụng: nếu lần trước dùng giao diện mới thì nạp trước khi vẽ lần đầu; lỗi → dùng giao diện cũ. */
  function khoiDong() {
    if (pref !== 'moi') return Promise.resolve();
    return nap().catch(function (e) { console.error(e); pref = 'cu'; });
  }
  /* Đổi giao diện. opt.khongLuu: không ghi nhớ (dùng khi tự lùi về giao diện cũ do sự cố). */
  function dat(gd, opt) {
    gd = gd === 'moi' ? 'moi' : 'cu'; opt = opt || {};
    if (gd === pref && (gd === 'cu' || san)) return Promise.resolve();
    if (gd === 'moi') {
      return nap().then(function () { pref = 'moi'; luu('moi'); if (root.APP) APP.render(); }, function (e) {
        console.error(e); if (root.UI) UI.toast('Không mở được giao diện mới: ' + e.message + ' — vẫn dùng giao diện cũ.', 'err');
        if (root.APP) APP.render();
      });
    }
    pref = 'cu'; if (!opt.khongLuu) luu('cu');
    if (root.UI_MOI && UI_MOI.thoat) UI_MOI.thoat();     // trả khung trang về nguyên trạng của giao diện cũ
    if (root.APP) APP.render();
    return Promise.resolve();
  }
  /* Giao diện mới gặp sự cố khi vẽ → lùi về giao diện cũ (không ghi nhớ) để người dùng vẫn làm việc được. */
  function suCo(e) {
    console.error('Giao diện mới lỗi, quay về giao diện cũ:', e);
    pref = 'cu'; if (root.UI_MOI && UI_MOI.thoat) UI_MOI.thoat();
    if (root.UI) UI.toast('Giao diện mới gặp sự cố, đã quay về giao diện cũ. Dữ liệu không bị ảnh hưởng.', 'err');
    setTimeout(function () { if (root.APP) APP.render(); }, 0);
  }
  root.UI_SWITCH = { html: html, bind: bind, laMoi: laMoi, giaoDien: giaoDien, dat: dat, khoiDong: khoiDong, suCo: suCo, nap: nap, KEY: KEY };
})(window);
