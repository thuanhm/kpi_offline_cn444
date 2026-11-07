/* APP — khung giao diện: thanh bên, thanh trên (chọn kỳ), điều hướng theo #hash, vẽ lại khi dữ liệu đổi. */
(function (root) {
  var esc = UI.esc;
  var ICON = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    rank: '<path d="M8 21V11M16 21V5M12 21v-6M4 21h16"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    unit: '<path d="M4 21V7l8-4 8 4v14M9 21v-5h6v5M8 10h.01M12 10h.01M16 10h.01M8 13h.01M12 13h.01M16 13h.01"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    edit: '<path d="M4 20h4L20 8l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 11v5M9.5 13.5L12 16l2.5-2.5"/>',
    day: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M7 14l3-2 3 2 4-3"/>',
    adjust: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    calc: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h4"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>'
  };
  function icon(n) { if (root.KPI_ICONS && KPI_ICONS.has(n)) return KPI_ICONS.html(n); return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>'; }

  var NAV = [
    { nhom: 'Theo dõi kết quả' },
    { id: 'tong-quan', ten: 'Tổng quan chi nhánh', icon: 'dashboard' },
    { id: 'dieu-hanh', ten: 'Bảng điều hành BGĐ', icon: 'dieu-hanh' },
    { id: 'xep-hang', ten: 'Xếp hạng phòng/PGD', icon: 'rank' },
    { id: 'ma-tran', ten: 'Ma trận chỉ tiêu', icon: 'table-2' },
    { id: 'phong', ten: 'Thẻ điểm KPI phòng', icon: 'building-2' },
    { id: 'the-diem-bgd', ten: 'Thẻ điểm Ban giám đốc', icon: 'users' },
    { id: 'chi-tieu', ten: 'Theo dõi chỉ tiêu', icon: 'target' },
    { id: 'so-ngay', ten: 'Diễn biến theo ngày', icon: 'calendar-days' },
    { nhom: 'Phân tích & điều hành' },
    { id: 'du-bao', ten: 'Dự báo & nguyên nhân', icon: 'du-bao' },
    { id: 'canh-bao', ten: 'Nội dung cần xử lý', icon: 'canh-bao' },
    { id: 'hanh-dong', ten: 'Biện pháp khắc phục', icon: 'hanh-dong' },
    { id: 'bao-cao-giao-ban', ten: 'Báo cáo giao ban', icon: 'report', admin: true },
    { nhom: 'Nhập liệu', admin: true },
    { id: 'nhap-so', ten: 'Nhập kế hoạch & thực hiện', icon: 'square-pen', admin: true },
    { id: 'kiem-tra', ten: 'Kiểm tra số liệu', icon: 'kiem-tra', admin: true },
    { id: 'tinh-tu-file', ten: 'Tính từ dữ liệu thô', icon: 'calc', admin: true },
    { id: 'nap-tu-dong', ten: 'Nạp tự động từ thư mục', icon: 'zap', admin: true },
    { nhom: 'Điều chỉnh', admin: true },
    { id: 'dieu-chinh', ten: 'Điều chỉnh số liệu', icon: 'sliders', admin: true },
    { id: 'diem-kpi', ten: 'Trừ / Cộng điểm KPI', icon: 'badge-check', admin: true },
    { nhom: 'Thiết lập', admin: true },
    { id: 'danh-muc', ten: 'Danh mục & trọng số', icon: 'list-checks', admin: true },
    { id: 'bgd-quan-tri', ten: 'Ban giám đốc', icon: 'users', admin: true },
    { id: 'du-lieu', ten: 'Dữ liệu & cài đặt', icon: 'data', admin: true },
    { nhom: '' },
    { id: 'huong-dan', ten: 'Hướng dẫn', icon: 'book' }
  ];

  var APP = { ky: null, route: { id: 'tong-quan', arg: null }, khoi: '' };

  function parseHash() {
    var h = (location.hash || '').replace(/^#\/?/, '').split('?')[0].split('/');
    var id = h[0] || 'tong-quan';
    if (!NAV.some(function (n) { return n.id === id; })) id = 'tong-quan';
    APP.route = { id: id, arg: h[1] ? decodeURIComponent(h[1]) : null };
  }
  APP.go = function (id, arg) { location.hash = '#/' + id + (arg ? '/' + encodeURIComponent(arg) : ''); };

  function ensureKy() {
    var M = STORE.model(), nam = STORE.state.settings.nam;
    if (APP.ky && M.periods.some(function (p) { return p.nam === APP.ky.nam && p.thang === APP.ky.thang; })) return;
    if (APP.ky && APP.ky.chon) return;   // người dùng chủ động chọn kỳ chưa có số (VD để nhập)
    var k = M.kyMoiNhat(nam) || M.kyMoiNhat();
    APP.ky = k ? { nam: k.nam, thang: k.thang } : { nam: nam, thang: new Date().getMonth() + 1 };
  }

  /* Menu 2 cấp: nhóm (thu gọn/mở rộng, nhớ theo máy) → mục. Nhóm chứa màn đang xem tự mở khi đổi màn hình; nhóm quản trị ẩn khi chưa đăng nhập. */
  var LS_NAV = 'KPI_CN444.nav_nhom';
  function navDong() { try { return JSON.parse(localStorage.getItem(LS_NAV) || '{}') || {}; } catch (e) { return {}; } }
  function renderSidebar() {
    var admin = STORE.isAdmin(), st = STORE.state.settings, rt = APP.route.id, moi = APP.navLast !== rt, luu = navDong(), nhom = [], cur = null;
    APP.navLast = rt;
    NAV.forEach(function (n) {
      if (n.nhom !== undefined) { cur = { ten: n.nhom, admin: n.admin, items: [] }; nhom.push(cur); return; }
      if (n.admin && !admin) return;
      cur.items.push(n);
    });
    var luuMoi = {};
    var cn = String(st.ten_chi_nhanh || '').replace(/^VietinBank\s*/i, ''), ten = 'KPI ' + cn.charAt(0).toLowerCase() + cn.slice(1);
    var html = '<a class="brand" href="#/tong-quan" title="Về trang chủ"><b>' + esc(ten) + '</b></a><nav>', idx = 0;
    nhom.forEach(function (g) {
      if (!g.items.length || (g.admin && !admin)) return;
      var items = g.items.map(function (n) { return '<a href="#/' + n.id + '" class="' + (rt === n.id ? 'on' : '') + '">' + icon(n.icon) + '<span>' + n.ten + '</span></a>'; }).join('');
      if (!g.ten) { html += '<div class="nav-items nav-solo">' + items + '</div>'; return; }
      var coActive = g.items.some(function (n) { return n.id === rt; }), mo = moi ? coActive : luu[g.ten] !== undefined ? luu[g.ten] : (coActive || idx === 0);   // đổi màn hình: chỉ nhóm chứa màn đó mở, các nhóm khác thu gọn
      if (moi) luuMoi[g.ten] = mo;
      idx++;
      html += '<div class="nav-sec' + (mo ? ' open' : '') + '" data-nhom="' + esc(g.ten) + '"><button type="button" class="nav-group" aria-expanded="' + mo + '"><span>' + esc(g.ten) + '</span>' +
        '<svg class="nav-chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6l6 -6"/></svg></button><div class="nav-items">' + items + '</div></div>';
    });
    html += '</nav><div class="side-foot">Phiên bản ' + KPI_CFG.PHIEN_BAN + ' · Chạy offline<br>Dữ liệu chỉ lưu nội bộ</div>';
    if (moi) { try { localStorage.setItem(LS_NAV, JSON.stringify(luuMoi)); } catch (x) {} }
    var sb = document.getElementById('sidebar'); sb.innerHTML = html;
    sb.onclick = function (e) {
      var b = e.target.closest('.nav-group'); if (!b) return;
      var sec = b.parentNode, m = !sec.classList.contains('open'), l = navDong();
      if (m) sb.querySelectorAll('.nav-sec.open').forEach(function (o) { o.classList.remove('open'); o.querySelector('.nav-group').setAttribute('aria-expanded', false); l[o.dataset.nhom] = false; });   // mở nhóm này thì thu gọn nhóm khác
      sec.classList.toggle('open', m); b.setAttribute('aria-expanded', m); l[sec.dataset.nhom] = m;
      try { localStorage.setItem(LS_NAV, JSON.stringify(l)); } catch (x) {}
    };
  }

  function renderTopbar() {
    var M = STORE.model(), ky = APP.ky, nam = ky.nam, co = M.thangCoSo(nam), admin = STORE.isAdmin();
    var nams = {}; M.periods.forEach(function (p) { nams[p.nam] = 1; }); nams[STORE.state.settings.nam] = 1; nams[STORE.state.settings.nam - 1] = 1; nams[nam] = 1;
    var title = (NAV.filter(function (n) { return n.id === APP.route.id; })[0] || {}).ten || '';
    var thangOpts = '';
    for (var t = 1; t <= 12; t++) thangOpts += '<option value="' + t + '"' + (t === ky.thang ? ' selected' : '') + '>Tháng ' + t + (co.indexOf(t) >= 0 ? '' : ' (chưa có TH)') + '</option>';
    document.getElementById('topbar').innerHTML =
      '<button class="icon-btn only-m" id="btn-menu" aria-label="Menu">' + icon('menu') + '</button>' +
      '<h1>' + esc(title) + '</h1><div class="grow"></div>' +
      '<div class="period"><label>Kỳ</label><select id="sel-thang">' + thangOpts + '</select>' +
      '<select id="sel-nam">' + Object.keys(nams).sort().map(function (n) { return '<option' + (+n === nam ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div>' + KPI_XUAT.html() +
      '<span id="sync-dot"></span>' + (admin && root.NAP ? '<a class="nap-btn" href="#/nap-tu-dong" title="File báo cáo thô chờ duyệt">⚡<b id="nap-badge"' + (NAP.cho.length ? '' : ' style="display:none"') + '>' + NAP.cho.length + '</b></a>' : '') +
      '<button class="btn ' + (admin ? 'admin' : 'ghost') + '" id="btn-mode" title="' + (admin ? 'Đang đăng nhập: ' + esc(STORE.nguoi() || 'Quản trị') + ' — bấm để đăng xuất' : 'Đăng nhập quản trị để chỉnh sửa') + '">' + icon(admin ? 'unlock' : 'lock') + '<span>' + (admin ? esc(STORE.nguoi() || 'Quản trị') : 'Chế độ xem') + '</span></button>';
    KPI_XUAT.bind();
    document.getElementById('sel-thang').onchange = function () { APP.ky = { nam: APP.ky.nam, thang: +this.value, chon: true }; render(); };
    document.getElementById('sel-nam').onchange = function () { var n = +this.value, k = STORE.model().kyMoiNhat(n); APP.ky = k ? { nam: n, thang: k.thang } : { nam: n, thang: 12, chon: true }; render(); };
    document.getElementById('btn-mode').onclick = toggleMode;
    document.getElementById('btn-menu').onclick = function () { document.body.classList.toggle('nav-open'); };
    APP.renderSync();
  }
  APP.renderSync = function () {
    var el = document.getElementById('sync-dot'); if (!el) return;
    var s = STORE.sync, t = { ok: ['ok', 'Đã đồng bộ thư mục chung "' + s.ten + '"'], wait: ['wait', 'Bấm để kết nối lại thư mục chung "' + s.ten + '"'], err: ['err', 'Lỗi ghi thư mục chung: ' + s.loi], none: ['none', 'Chỉ lưu trên máy này'] }[s.trang_thai] || ['none', ''];
    el.className = 'sync ' + t[0]; el.title = t[1]; el.innerHTML = '<i></i><span>' + (s.trang_thai === 'ok' ? 'Dùng chung' : s.trang_thai === 'wait' ? 'Kết nối lại' : s.trang_thai === 'err' ? 'Lỗi đồng bộ' : 'Trên máy') + '</span>';
    el.onclick = function () {
      if (s.trang_thai === 'wait') STORE.ketNoiLai().then(function (ok) { UI.toast(ok ? 'Đã kết nối lại thư mục chung.' : 'Chưa được cấp quyền.', ok ? 'ok' : 'err'); APP.renderSync(); });
      else if (STORE.isAdmin()) APP.go('du-lieu');
    };
  };

  function toggleMode() {
    if (STORE.isAdmin()) {
      UI.confirm('Đăng xuất quản trị', 'Bạn có muốn đăng xuất khỏi tài khoản quản trị và chuyển về chế độ xem?', 'Đăng xuất').then(function (ok) {
        if (!ok) return;
        STORE.logout();
        UI.toast('Đã đăng xuất chế độ quản trị.');
        if (NAV.some(function (n) { return n.id === APP.route.id && n.admin; })) APP.go('tong-quan'); else render();
      });
      return;
    }
    var defUser = STORE.lastUser() || '';
    var m = UI.modal('Đăng nhập quản trị', '<p class="muted">Chế độ quản trị cho phép nhập số, sửa danh mục, cài đặt và phân quyền quản trị trên máy này.</p>' +
      '<label class="field"><span>Tên đăng nhập</span><input id="login-user" autocomplete="username" value="' + esc(defUser) + '" placeholder="Nhập tên đăng nhập" autofocus></label>' +
      '<label class="field"><span>Mật khẩu</span><input id="login-pass" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu"></label>',
      [{ text: 'Huỷ' }, { text: 'Đăng nhập', cls: 'primary', onClick: function (w) {
        var u = w.querySelector('#login-user').value.trim();
        var p = w.querySelector('#login-pass').value;
        STORE.login(u, p).then(function (r) {
          if (r.ok) {
            UI.toast('Đăng nhập thành công — xin chào ' + (STORE.nguoi() || u) + '!', 'ok');
            m.close();
            render();
          } else {
            UI.toast(r.loi, 'err');
            w.querySelector('#login-pass').value = '';
            w.querySelector('#login-pass').focus();
          }
        });
        return false;
      } }]);
    setTimeout(function () {
      var passEl = m.el.querySelector('#login-pass');
      var userEl = m.el.querySelector('#login-user');
      if (userEl.value) passEl.focus(); else userEl.focus();
    }, 50);
    ['#login-user', '#login-pass'].forEach(function (s) {
      m.el.querySelector(s).addEventListener('keydown', function (e) {
        if (e.key === 'Enter') m.el.querySelector('footer .primary').click();
      });
    });
  }

  function banner() {
    var st = STORE.state, out = '';
    if (st.du_lieu_mau) out += '<div class="banner warn"><b>Đang hiển thị DỮ LIỆU MẪU</b> — số liệu giả lập để xem thử giao diện. ' +
      (STORE.isAdmin() ? '<button class="btn sm" id="bn-xoa-mau">Xoá dữ liệu mẫu, bắt đầu nhập thật</button>' : 'Mở khoá quản trị để xoá và nhập số thật.') + '</div>';
    if (STORE.sync.trang_thai === 'wait') out += '<div class="banner info">Máy này đã từng kết nối thư mục dùng chung <b>' + esc(STORE.sync.ten) + '</b>. Bấm bất kỳ đâu hoặc bấm <button class="btn sm" id="bn-ket-noi">Kết nối lại</button> để đồng bộ số mới nhất.</div>';
    if (STORE.isAdmin() && root.SAO_LUU_MAY && SAO_LUU_MAY.canQuyen) out += '<div class="banner info">Sao lưu ra máy: thư mục <b>' + esc(SAO_LUU_MAY.tt.ten) + '</b> cần cấp lại quyền ghi (trình duyệt hỏi lại mỗi lần mở). <button class="btn sm" id="bn-saoluu">Cấp quyền</button></div>';
    return out;
  }

  /* Tự động xin lại quyền thư mục dùng chung (Data) và thư mục phụ (Downloads) khi người dùng tương tác lần đầu */
  var daHoiChung = false, daHoiPhu = false, dangXinQuyen = false;
  function tuDongXinQuyenLanDau(e) {
    if (dangXinQuyen) return;
    // Nút cấp quyền thư mục sao lưu tự xin quyền của nó — không chồng thêm hộp hỏi quyền Data cùng lúc
    if (e && e.target && e.target.closest && e.target.closest('#bn-saoluu, [data-saoluu]')) return;

    // Nếu người dùng bấm trực tiếp vào nút Kết nối lại hoặc icon sync -> để nút tự xử lý
    if (e && e.target && e.target.closest && e.target.closest('#bn-ket-noi, #sync-dot, [data-act="quyen-phu"]')) {
      daHoiChung = true;
      return;
    }

    var canShared = (STORE.sync.trang_thai === 'wait' && !daHoiChung);
    var canPhu = (root.NAP && NAP.phu && !NAP.phu.ok && !daHoiPhu);

    if (!canShared && !canPhu) {
      goBoLangNgheTuDong();
      return;
    }

    if (canShared) {
      dangXinQuyen = true;
      daHoiChung = true;
      STORE.ketNoiLai().then(function (ok) {
        dangXinQuyen = false;
        if (ok) {
          UI.toast('Đã kết nối thư mục dùng chung: "' + (STORE.sync.ten || 'Data') + '"', 'ok');
          render();
          // Sau khi thư mục chung được cấp quyền, nếu có thư mục phụ thì thử xin tiếp
          if (root.NAP && NAP.phu && !NAP.phu.ok && !daHoiPhu) {
            dangXinQuyen = true;
            NAP.capQuyenPhu().then(function (pOk) {
              dangXinQuyen = false;
              daHoiPhu = true;
              if (pOk) UI.toast('Đã kết nối thư mục phụ: "' + (NAP.phu ? NAP.phu.ten : '') + '"', 'ok');
              goBoLangNgheTuDong();
            }).catch(function () {
              dangXinQuyen = false;
            });
          } else {
            goBoLangNgheTuDong();
          }
        } else {
          // Bấm Từ chối hoặc đóng: không hỏi lại trong lần mở này. Dải thông báo vẫn giữ nút Kết nối lại.
          render();
          if (!canPhu) goBoLangNgheTuDong();
        }
      }).catch(function () {
        dangXinQuyen = false;
        render();
      });
    } else if (canPhu) {
      dangXinQuyen = true;
      daHoiPhu = true;
      NAP.capQuyenPhu().then(function (pOk) {
        dangXinQuyen = false;
        if (pOk) UI.toast('Đã kết nối thư mục phụ: "' + (NAP.phu ? NAP.phu.ten : '') + '"', 'ok');
        goBoLangNgheTuDong();
      }).catch(function () {
        dangXinQuyen = false;
      });
    }
  }

  function dangKyLangNgheTuDong() {
    window.addEventListener('click', tuDongXinQuyenLanDau, true);
    window.addEventListener('keydown', tuDongXinQuyenLanDau, true);
  }

  function goBoLangNgheTuDong() {
    window.removeEventListener('click', tuDongXinQuyenLanDau, true);
    window.removeEventListener('keydown', tuDongXinQuyenLanDau, true);
  }

  /* tài khoản còn mật khẩu mặc định (1111) phải đổi ngay sau khi đăng nhập; đóng hộp thoại mà chưa đổi thì lần vẽ sau hỏi lại */
  function nhacDoiMk() {
    if (!STORE.isAdmin() || document.querySelector('[data-bat-doi-mk]')) return;
    var me = STORE.userHienTai().toLowerCase(), u = STORE.getUsers().filter(function (x) { return String(x.user).toLowerCase() === me; })[0];
    if (!u || !u.mac_dinh) return;
    var m = UI.modal('Đổi mật khẩu mặc định', '<p class="muted">Tài khoản <b>' + esc(u.user) + '</b> đang dùng mật khẩu mặc định nên ai cũng đăng nhập được. Hãy đặt mật khẩu mới (từ 6 ký tự, không dùng 1111) để tiếp tục.</p>' +
      '<label class="field"><span>Mật khẩu mới</span><input id="mk-moi" type="password" autocomplete="new-password"></label>' +
      '<label class="field"><span>Nhập lại mật khẩu mới</span><input id="mk-lai" type="password" autocomplete="new-password"></label>',
      [{ text: 'Đăng xuất', onClick: function () { STORE.logout(); setTimeout(render, 0); } },
       { text: 'Đổi mật khẩu', cls: 'primary', onClick: function (w) {
         var a = w.querySelector('#mk-moi').value, b = w.querySelector('#mk-lai').value;
         if (a !== b) { UI.toast('Hai lần nhập mật khẩu chưa khớp.', 'err'); return false; }
         STORE.doiMatKhau(u.user, a).then(function () { UI.toast('Đã đổi mật khẩu.', 'ok'); m.close(); render(); }, function (e) { UI.toast(e.message, 'err'); });
         return false;
       } }]);
    m.el.setAttribute('data-bat-doi-mk', '1');
  }
  APP.nhacDoiMk = nhacDoiMk;

  var rendering = false;
  function render() {
    if (rendering) return; rendering = true;
    requestAnimationFrame(function () {
      rendering = false;
      parseHash(); ensureKy();
      var r = NAV.filter(function (n) { return n.id === APP.route.id; })[0];
      if (r && r.admin && !STORE.isAdmin()) { APP.route = { id: 'tong-quan' }; history.replaceState(null, '', '#/tong-quan'); }
      UI.destroyCharts();
      var doiTrang = APP.lastRoute !== APP.route.id; APP.lastRoute = APP.route.id;   // hiệu ứng vào trang CHỈ khi đổi màn hình (không lặp lại mỗi lần số liệu đổi)
      renderSidebar(); renderTopbar();
      var view = document.getElementById('view'), fn = VIEWS[APP.route.id];
      var t0 = performance.now();
      try { view.innerHTML = banner() + '<div class="page' + (doiTrang ? ' enter' : '') + '">' + fn.html(APP) + '</div>'; if (fn.mount) fn.mount(view, APP); if (root.KPI_ICONS) KPI_ICONS.decorate(view); UI.nutAnh(view); }
      catch (e) { console.error(e); view.innerHTML = '<div class="card"><h3>Lỗi hiển thị</h3><pre>' + esc(e.stack || e.message) + '</pre></div>'; }
      var b1 = document.getElementById('bn-xoa-mau'); if (b1) b1.onclick = function () { UI.confirm('Xoá dữ liệu mẫu', 'Xoá toàn bộ số liệu mẫu? Danh mục đơn vị, chỉ tiêu, trọng số được giữ lại để anh/chị chỉnh theo thực tế.', 'Xoá dữ liệu mẫu', true).then(function (ok) { if (ok) STORE.resetAll(true); }); };
      var b3 = document.getElementById('bn-saoluu'); if (b3) b3.onclick = function () { SAO_LUU_MAY.capQuyen().then(function (r) { UI.toast(r.ok ? 'Đã cấp quyền, sao lưu ra máy hoạt động.' : (r.loi || 'Chưa được cấp quyền.'), r.ok ? 'ok' : 'err'); render(); }); };
      var b2 = document.getElementById('bn-ket-noi'); if (b2) b2.onclick = function () { STORE.ketNoiLai().then(function (ok) { UI.toast(ok ? 'Đã kết nối lại thư mục chung.' : 'Chưa được cấp quyền.', ok ? 'ok' : 'err'); render(); }); };
      document.body.classList.remove('nav-open');
      nhacDoiMk();
      if (root.KPI_DEBUG) console.log('render', APP.route.id, (performance.now() - t0).toFixed(1) + 'ms');
    });
  }
  APP.render = render;

  window.addEventListener('hashchange', function () { window.scrollTo(0, 0); render(); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) location.reload(); });
  document.addEventListener('DOMContentLoaded', function () {
    STORE.load();
    var deb = UI.debounce(render, 60), choVe = false;
    // Ô đang gõ dở (giá trị khác lúc vẽ): số từ máy khác về không được vẽ lại màn hình làm mất chữ đang gõ — hoãn tới khi rời ô.
    function dangGo() { var a = document.activeElement; return !!(a && a.matches && a.matches('#view input:not([type=checkbox]):not([type=radio]), #view textarea') && a.value !== a.defaultValue); }
    STORE.on(function () {
      // Màn nhập số tự cập nhật ô tổng của nó — không vẽ lại cả trang để giữ con trỏ đang gõ.
      if (APP.quiet) { APP.quiet = false; var f = VIEWS[APP.route.id]; if (f && f.refresh) f.refresh(); return; }
      if (dangGo()) { choVe = true; return; }
      deb();
    });
    document.addEventListener('focusout', function () { if (choVe) setTimeout(function () { if (!dangGo()) { choVe = false; deb(); } }, 0); });
    render();
    dangKyLangNgheTuDong();
    STORE.initShared().then(function () {
      render();
    });
  });
  root.APP = APP;
  root.ICON = icon;
})(window);
