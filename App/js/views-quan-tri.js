/* MÀN HÌNH QUẢN TRỊ — Nhập số · Danh mục & trọng số · Dữ liệu & cài đặt · Hướng dẫn */
(function (root) {
  var esc = UI.esc, num = UI.num, isNum = UI.isNum, CN = KPI_CFG.MA_CN;
  var VIEWS = root.VIEWS = root.VIEWS || {};
  var MV = '<td class="mv nowrap"><span class="drag-h" title="Kéo để đổi thứ tự" aria-label="Kéo để đổi thứ tự">⠿</span></td>';
  function fmtIn(v, ind) { return isNum(v) ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: ind && ind.dvt === '%' ? 4 : 2 }).format(v) : ''; }

  /* ================= NHẬP SỐ ================= */
  VIEWS['nhap-so'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, k = A.nhap_loai || 'a';
      var fit = localStorage.getItem('KPI_CN444.grid_fit') !== 'false';
      var cols = [{ ma: CN, ten: 'Toàn CN', khoi: 'CN' }].concat(M.units.map(function (u) { return { ma: u.ma, ten: u.ten_ngan || u.ten, khoi: u.khoi }; }));
      var inds = M.inds.filter(function (i) { return !(k === 'p' && i.huong === 'nhap_ty_le'); });
      var khoa = STORE.kyKhoa(ky.nam, ky.thang), tkh = STORE.thongTinKhoa(ky.nam, ky.thang), kt = M.kiemTraSo(ky.nam, ky.thang), dis = khoa ? ' disabled' : '';
      var h = '<div class="toolbar"><div class="pills"><button class="pill' + (k === 'p' ? ' on' : '') + '" data-k="p">Kế hoạch lũy kế</button><button class="pill' + (k === 'a' ? ' on' : '') + '" data-k="a">Thực hiện lũy kế</button></div>' +
        '<b class="ky-badge">T' + ky.thang + '/' + ky.nam + '</b><span class="muted small">đổi kỳ ở góc trên</span>' +
        (khoa ? '<span class="chip chua" title="Kỳ đã chốt số liệu">Đã khoá</span><button class="btn sm" id="b-mokhoa">Mở khoá…</button>' : '<button class="btn sm" id="b-khoa" title="Chốt số liệu kỳ này: không ai sửa được nữa trừ khi mở khoá có lý do">Khoá kỳ</button>') +
        '<span class="chip ' + (kt.day_du ? 'dat' : 'cct') + '" title="Số ô thực hiện đã có / cần có của các phòng/PGD kỳ này (chỉ tiêu có điểm)">Thực hiện ' + kt.tong_co + '/' + kt.tong_can + '</span>' +
        '<label class="check inline-check" style="cursor:pointer;font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:6px;user-select:none;margin-left:8px;" title="Tự động chia đều các cột vừa khít màn hình, không cần kéo chuột xem"><input type="checkbox" id="chk-grid-fit"' + (fit ? ' checked' : '') + '> <span>Khớp vừa màn hình</span></label>' +
        '<div class="grow"></div>' +
        '<a class="btn" href="#/tinh-tu-file">Σ Tính từ dữ liệu thô</a><button class="btn" id="b-mau">⤓ Tải mẫu Excel</button><button class="btn primary" id="b-nap"' + dis + '>⤒ Nạp từ Excel</button>' +
        (k === 'p' ? '<button class="btn" id="b-phan-bo"' + dis + '>Phân bổ KH năm</button>' : '') + '<button class="btn" id="b-chep"' + dis + '>Chép từ T' + (ky.thang > 1 ? ky.thang - 1 : 12) + '</button><button class="btn danger-ghost" id="b-xoa"' + dis + '>Xoá số kỳ này</button></div>' +
        (khoa ? '<div class="hint warn"><b>Kỳ T' + ky.thang + '/' + ky.nam + ' đã khoá</b>' + (tkh && tkh.ai ? ' bởi ' + esc(String(tkh.ai).split('@')[0]) : '') + (tkh && tkh.t ? ' lúc ' + new Date(tkh.t).toLocaleString('vi-VN') : '') + ' — chỉ xem. Muốn sửa phải chọn <b>Mở khoá</b> và ghi rõ lý do (có lưu nhật ký).</div>' : '');
      h += '<div class="hint">Nhập số rồi nhấn Enter/Tab để lưu ngay · <b>Dán thẳng một vùng từ Excel</b> (Ctrl+V) vào ô bắt đầu · Ô cột <b>Toàn CN</b> để trống thì tự lấy tổng/bình quân các phòng (số mờ) · Chỉ tiêu "%" nhập đúng con số phần trăm (1,25 = 1,25%) · Ô "·" = không áp dụng cho khối · Lưới hiển thị <b>số gốc</b>; cộng/trừ thủ công nhập ở <a href="#/dieu-chinh">Điều chỉnh số liệu</a>.</div>';
      h += '<div class="card p0"><div class="tbl-wrap grid-wrap' + (fit ? ' fit' : '') + '"><table class="grid' + (fit ? ' fit' : '') + '" id="grid"><thead><tr><th class="sticky">Chỉ tiêu</th><th class="col-dvt">ĐVT</th>' + cols.map(function (c) { return '<th title="' + esc(c.khoi) + '">' + esc(c.ten) + '<small>' + esc(c.khoi) + '</small></th>'; }).join('') + '</tr></thead><tbody>';
      var nh = null;
      inds.forEach(function (ind, r) {
        if (ind.nhom !== nh) { nh = ind.nhom; h += '<tr class="grp"><td class="sticky" colspan="' + (cols.length + 2) + '">' + esc(nh) + '</td></tr>'; }
        h += '<tr><td class="sticky" title="' + esc(ind.ten) + '">' + esc(ind.ten_ngan || ind.ten) + '<small>' + esc(ind.ma) + '</small></td><td class="muted col-dvt">' + esc(ind.dvt) + '</td>';
        cols.forEach(function (c, ci) {
          var ap = c.ma === CN || M.apDung(ind.ma, c.ma);
          if (!ap) { h += '<td class="na">·</td>'; return; }
          var v = STORE.getRaw(k, ind.ma, c.ma, ky.nam, ky.thang), ph = '';
          if (c.ma === CN && v === null) { var d = M.cnVal(k, ind.ma, ky.nam, ky.thang); if (d.v !== null) ph = (d.nguon === 'tb' ? 'BQ ' : 'Σ ') + fmtIn(Math.round(d.v * 100) / 100, ind); }
          var inf = v === null ? null : STORE.getCellInfo(k, ind.ma, c.ma, ky.nam, ky.thang), tip = inf && inf.t ? 'Cập nhật ' + new Date(inf.t).toLocaleString('vi-VN') + (inf.ai ? ' · ' + inf.ai : '') : '';
          h += '<td><input class="cell' + (c.ma === CN ? ' cn' : '') + '" data-r="' + r + '" data-c="' + ci + '" data-ct="' + ind.ma + '" data-dv="' + c.ma + '" value="' + esc(fmtIn(v, ind)) + '" placeholder="' + esc(ph) + '"' + (tip ? ' title="' + esc(tip) + '"' : '') + ' inputmode="decimal" autocomplete="off"' + (khoa ? ' readonly' : '') + '></td>';
        });
        h += '</tr>';
      });
      h += '</tbody><tfoot><tr><td class="sticky">Đã nhập</td><td></td>' + cols.map(function (c, ci) { return '<td class="cnt" data-cnt="' + ci + '"></td>'; }).join('') + '</tr></tfoot></table></div></div>';
      return h;
    },
    mount: function (v, A) {
      var ky = A.ky, k = A.nhap_loai || 'a', grid = v.querySelector('#grid'), M = STORE.model();
      var chkFit = v.querySelector('#chk-grid-fit');
      if (chkFit) {
        chkFit.onchange = function () {
          var isFit = chkFit.checked;
          localStorage.setItem('KPI_CN444.grid_fit', isFit ? 'true' : 'false');
          var wrap = v.querySelector('.grid-wrap');
          if (wrap) wrap.classList.toggle('fit', isFit);
          if (grid) grid.classList.toggle('fit', isFit);
        };
      }
      v.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { A.nhap_loai = b.dataset.k; APP.render(); }; });
      function cellAt(r, c) { return grid.querySelector('input[data-r="' + r + '"][data-c="' + c + '"]'); }
      function counts() {
        var tot = {}, got = {};
        grid.querySelectorAll('input.cell').forEach(function (i) { var c = i.dataset.c; tot[c] = (tot[c] || 0) + 1; if (i.value.trim()) got[c] = (got[c] || 0) + 1; });
        grid.querySelectorAll('[data-cnt]').forEach(function (td) { var c = td.dataset.cnt, a = got[c] || 0, b = tot[c] || 0; td.textContent = a + '/' + b; td.className = 'cnt ' + (a === b && b ? 'full' : a ? 'part' : ''); });
      }
      function save(inp) {
        var raw = inp.value, val = String(raw).trim() === '' ? null : UI.parse(raw);
        if (typeof val === 'number' && isNaN(val)) { inp.classList.add('bad'); UI.toast('"' + raw + '" không phải số hợp lệ.', 'err'); return; }
        inp.classList.remove('bad');
        var ind = M.indMap[inp.dataset.ct];
        APP.quiet = true;
        var n = STORE.setMany([{ k: k, ct: inp.dataset.ct, dv: inp.dataset.dv, nam: ky.nam, thang: ky.thang, v: val }], 'Nhập ' + (k === 'p' ? 'KH' : 'TH') + ' T' + ky.thang + '/' + ky.nam);
        if (!n) APP.quiet = false;
        if (STORE.chanCuoi()) { UI.toast('Kỳ T' + ky.thang + '/' + ky.nam + ' đã khoá — không ghi được.', 'err'); inp.value = fmtIn(STORE.getRaw(k, inp.dataset.ct, inp.dataset.dv, ky.nam, ky.thang), ind); inp.defaultValue = inp.value; return; }
        if (n && k === 'a' && val !== null) {   // cảnh báo mềm số bất thường (vẫn lưu, người nhập tự xem lại)
          var cb = STORE.model().canhBaoNhap(inp.dataset.ct, inp.dataset.dv, ky.nam, ky.thang, val); inp.classList.toggle('warn', !!cb); inp.title = cb ? '⚠ ' + cb : inp.title;
          if (cb) UI.toast('Kiểm tra lại ' + ((ind && (ind.ten_ngan || ind.ten)) || inp.dataset.ct) + ' · ' + inp.dataset.dv + ' — ' + cb + '.', 'info');
        } else inp.classList.remove('warn');
        inp.value = fmtIn(val, ind); inp.defaultValue = inp.value;   // đã lưu → không còn "đang gõ dở" (app.js hoãn vẽ lại khi ô còn dở)
        if (n) { inp.classList.add('saved'); setTimeout(function () { inp.classList.remove('saved'); }, 700); }
      }
      grid.addEventListener('change', function (e) { if (e.target.matches('input.cell')) save(e.target); });
      grid.addEventListener('focusin', function (e) { if (e.target.matches('input.cell')) e.target.select(); });
      grid.addEventListener('keydown', function (e) {
        var i = e.target; if (!i.matches('input.cell')) return;
        var r = +i.dataset.r, c = +i.dataset.c, n = null;
        if (e.key === 'Enter' || e.key === 'ArrowDown') { for (var rr = r + 1; rr < r + 40 && !n; rr++) n = cellAt(rr, c); }
        else if (e.key === 'ArrowUp') { for (var ru = r - 1; ru >= 0 && !n; ru--) n = cellAt(ru, c); }
        else if (e.key === 'ArrowRight' && i.selectionStart === i.value.length) { for (var cr = c + 1; cr < c + 40 && !n; cr++) n = cellAt(r, cr); }
        else if (e.key === 'ArrowLeft' && i.selectionStart === 0) { for (var cl = c - 1; cl >= 0 && !n; cl--) n = cellAt(r, cl); }
        else if (e.key === 'Escape') { i.blur(); return; }
        else return;
        e.preventDefault(); if (n) n.focus();
      });
      grid.addEventListener('paste', function (e) {
        var i = e.target; if (!i.matches('input.cell')) return;
        var text = (e.clipboardData || window.clipboardData).getData('text');
        if (!/[\t\n]/.test(text.trim())) return;
        e.preventDefault();
        var lines = text.replace(/\r/g, '').replace(/\n$/, '').split('\n'), r0 = +i.dataset.r, c0 = +i.dataset.c, items = [], bad = 0, skip = 0;
        lines.forEach(function (ln, dr) {
          ln.split('\t').forEach(function (cell, dc) {
            var t = cellAt(r0 + dr, c0 + dc); if (!t) { if (cell.trim()) skip++; return; }
            if (!cell.trim()) return;
            var val = cell.trim() === '-' ? null : UI.parse(cell);
            if (typeof val === 'number' && isNaN(val)) { bad++; return; }
            items.push({ k: k, ct: t.dataset.ct, dv: t.dataset.dv, nam: ky.nam, thang: ky.thang, v: val });
          });
        });
        var n = STORE.setMany(items, 'Dán số ' + (k === 'p' ? 'KH' : 'TH') + ' T' + ky.thang + '/' + ky.nam);
        UI.toast('Đã dán ' + n + ' ô' + (STORE.chanCuoi() ? ', ' + STORE.chanCuoi() + ' ô thuộc kỳ đã khoá bị bỏ qua' : '') + (bad ? ', ' + bad + ' ô không phải số' : '') + (skip ? ', ' + skip + ' ô rơi vào chỗ không áp dụng/ngoài bảng' : '') + '.', bad ? 'err' : 'ok');
      });
      counts();
      this.refresh = function () {
        // Cập nhật số mờ (tổng hợp CN) và bộ đếm, không vẽ lại bảng
        var M2 = STORE.model();
        grid.querySelectorAll('input.cn').forEach(function (inp) {
          if (inp.value.trim()) { inp.placeholder = ''; return; }
          var d = M2.cnVal(k, inp.dataset.ct, ky.nam, ky.thang), ind = M2.indMap[inp.dataset.ct];
          inp.placeholder = d.v !== null ? (d.nguon === 'tb' ? 'BQ ' : 'Σ ') + fmtIn(Math.round(d.v * 100) / 100, ind) : '';
        });
        counts();
      };
      v.querySelector('#b-mau').onclick = function () { EXCEL.taiMau(ky.nam, ky.thang).catch(function (e) { UI.toast(e.message, 'err'); }); };
      v.querySelector('#b-nap').onclick = function () { napExcel(ky); };
      v.querySelector('#b-xoa').onclick = function () {
        UI.confirm('Xoá số kỳ T' + ky.thang + '/' + ky.nam, 'Xoá toàn bộ số <b>' + (k === 'p' ? 'kế hoạch' : 'thực hiện') + '</b> của tháng này (mọi đơn vị)?', 'Xoá', true).then(function (ok) { if (ok) UI.toast('Đã xoá ' + STORE.xoaKy(ky.nam, ky.thang, k) + ' ô.', 'ok'); });
      };
      v.querySelector('#b-chep').onclick = function () {
        var tn = ky.thang > 1 ? ky.thang - 1 : 12, nn = ky.thang > 1 ? ky.nam : ky.nam - 1, items = [];
        Object.keys(STORE.state.rec).forEach(function (kk) {
          var p = kk.split('|'); if (p[0] !== k || +p[3] !== nn || +p[4] !== tn) return;
          var val = STORE.state.rec[kk][0]; if (!isNum(val)) return;
          if (STORE.getRaw(k, p[1], p[2], ky.nam, ky.thang) !== null) return;
          items.push({ k: k, ct: p[1], dv: p[2], nam: ky.nam, thang: ky.thang, v: val });
        });
        if (!items.length) { UI.toast('Không có ô trống nào để chép (hoặc tháng trước chưa có số).'); return; }
        UI.confirm('Chép số từ T' + tn + '/' + nn, 'Điền ' + items.length + ' ô <b>đang trống</b> của T' + ky.thang + '/' + ky.nam + ' bằng số tháng trước? Ô đã có số giữ nguyên. Thường dùng cho kế hoạch không đổi hoặc chỉ tiêu % tự đánh giá.', 'Chép').then(function (ok) { if (ok) UI.toast('Đã chép ' + STORE.setMany(items, 'Chép số từ T' + tn + '/' + nn) + ' ô.', 'ok'); });
      };
      var pb = v.querySelector('#b-phan-bo'); if (pb) pb.onclick = function () { phanBo(ky.nam); };
      var bk = v.querySelector('#b-khoa'); if (bk) bk.onclick = function () {
        var k2 = STORE.model().kiemTraSo(ky.nam, ky.thang), thieu = k2.tong_can - k2.tong_co, bt = k2.bat_thuong.filter(function (x) { return x.muc >= 2; }).length;
        UI.confirm('Khoá kỳ T' + ky.thang + '/' + ky.nam, 'Chốt số liệu kỳ này: sau khi khoá, không ai nhập/sửa/xoá số, điều chỉnh hay cộng trừ điểm của T' + ky.thang + '/' + ky.nam + ' được nữa (mở khoá phải ghi lý do).' +
          (thieu > 0 ? '<br><b style="color:#b45309">Còn ' + thieu + ' ô thực hiện chưa nhập.</b>' : '') + (bt ? '<br><b style="color:#b45309">Có ' + bt + ' cảnh báo số bất thường chưa xem (mục Kiểm tra số liệu).</b>' : ''), 'Khoá kỳ', thieu > 0 || bt > 0).then(function (ok) {
          if (ok && STORE.khoaKy(ky.nam, ky.thang)) UI.toast('Đã khoá kỳ T' + ky.thang + '/' + ky.nam + '.', 'ok');
        });
      };
      var bm = v.querySelector('#b-mokhoa'); if (bm) bm.onclick = function () {
        var m = UI.modal('Mở khoá kỳ T' + ky.thang + '/' + ky.nam, '<p class="muted">Mở khoá để sửa số liệu đã chốt. Lý do được ghi vào nhật ký và hiện ở lịch sử khoá kỳ.</p><label class="field"><span>Lý do mở khoá</span><input id="mk-lydo" placeholder="VD: PGD Diễn Châu nhập sai số dư huy động"></label>',
          [{ text: 'Huỷ' }, { text: 'Mở khoá', cls: 'danger', onClick: function (w) {
            STORE.moKhoaKy(ky.nam, ky.thang, w.querySelector('#mk-lydo').value).then(function () { UI.toast('Đã mở khoá kỳ. Đề nghị khoá lại sau khi hiệu chỉnh xong.', 'ok'); m.close(); }, function (e) { UI.toast(e.message, 'err'); });
            return false;
          } }]);
      };
    }
  };

  function napExcel(ky) {
    UI.pickFile('.xlsx,.xls,.xlsm,.csv').then(function (f) {
      if (!f) return;
      UI.toast('Đang đọc ' + f.name + '…');
      EXCEL.docTep(f, ky.nam, ky.thang).then(function (r) {
        var p = r.items.filter(function (x) { return x.k === 'p'; }).length, a = r.items.length - p;
        var kys = {}; r.items.forEach(function (x) { kys['T' + x.thang + '/' + x.nam] = 1; });
        var body = '<p>Đọc được <b>' + r.items.length + '</b> ô số (' + p + ' kế hoạch, ' + a + ' thực hiện) cho kỳ: <b>' + (Object.keys(kys).join(', ') || '–') + '</b>.</p>' +
          (r.trang.length ? '<ul class="small">' + r.trang.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
          (r.loi.length ? '<div class="warn-box"><b>' + r.loi.length + ' lưu ý:</b><ul class="small">' + r.loi.slice(0, 15).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + (r.loi.length > 15 ? '<li>…</li>' : '') + '</ul></div>' : '') +
          '<p class="muted small">Số trong tệp sẽ ghi đè số đang có ở cùng ô. Ô trống trong tệp được bỏ qua.</p>';
        UI.modal('Xác nhận nạp số từ Excel', body, [{ text: 'Huỷ' }, { text: 'Nạp ' + r.items.length + ' ô', cls: 'primary', onClick: function () {
          var n = STORE.setMany(r.items, 'Nạp Excel ' + f.name); UI.toast('Đã cập nhật ' + n + ' ô (các ô còn lại trùng số cũ).', 'ok');
        } }], { wide: true });
      }).catch(function (e) { console.error(e); UI.toast('Không đọc được tệp: ' + e.message, 'err'); });
    });
  }

  function phanBo(nam) {
    var M = STORE.model(), inds = M.inds.filter(function (i) { return i.huong === 'cao_tot' && i.dvt !== '%'; });
    var body = '<p>Lấy <b>kế hoạch tháng 12 (= KH cả năm)</b> rồi tạo KH lũy kế các tháng 1–11. Áp dụng cho mọi đơn vị và Toàn CN đã có KH tháng 12.</p>' +
      '<label class="field"><span>Cách phân bổ</span><select id="pb-cach"><option value="deu">Lũy kế chia đều: KH tháng t = KH năm × t/12 (chỉ tiêu tăng trưởng, doanh số)</option><option value="quy">Theo quý: 25% mỗi quý, tháng giữa quý nội suy</option><option value="giu">Giữ mức: KH mọi tháng = KH năm (chỉ tiêu số dư/số lượng lũy kế)</option></select></label>' +
      '<label class="field"><span>Chỉ tiêu</span><select id="pb-ct" multiple size="8">' + inds.map(function (i) { return '<option value="' + i.ma + '" selected>' + esc(i.ten_ngan || i.ten) + '</option>'; }).join('') + '</select></label>' +
      '<label class="check"><input type="checkbox" id="pb-de"> Ghi đè cả các tháng đã có kế hoạch</label>';
    UI.modal('Phân bổ kế hoạch năm ' + nam, body, [{ text: 'Huỷ' }, { text: 'Phân bổ', cls: 'primary', onClick: function (w) {
      var cach = w.querySelector('#pb-cach').value, de = w.querySelector('#pb-de').checked, cts = [].slice.call(w.querySelector('#pb-ct').selectedOptions).map(function (o) { return o.value; });
      var items = [], dvs = [CN].concat(M.units.map(function (u) { return u.ma; }));
      cts.forEach(function (ct) {
        dvs.forEach(function (dv) {
          var nam12 = STORE.getRaw('p', ct, dv, nam, 12); if (!isNum(nam12)) return;
          for (var t = 1; t <= 11; t++) {
            if (!de && STORE.getRaw('p', ct, dv, nam, t) !== null) continue;
            var f = cach === 'giu' ? 1 : cach === 'quy' ? (Math.floor((t - 1) / 3) * 0.25 + ((t - 1) % 3 + 1) / 3 * 0.25) : t / 12;
            var x = nam12 * f; x = Math.abs(x) >= 100 ? Math.round(x) : Math.round(x * 100) / 100;
            items.push({ k: 'p', ct: ct, dv: dv, nam: nam, thang: t, v: x });
          }
        });
      });
      if (!items.length) { UI.toast('Không có ô nào để phân bổ — hãy nhập KH tháng 12 (KH năm) trước.', 'err'); return false; }
      UI.toast('Đã phân bổ ' + STORE.setMany(items, 'Phân bổ KH năm ' + nam) + ' ô kế hoạch.', 'ok');
    } }], { wide: true });
  }

  /* ================= DANH MỤC & TRỌNG SỐ ================= */
  VIEWS['danh-muc'] = {
    html: function (A) {
      var st = STORE.state, tab = A.dm_tab || 'don-vi';
      var tabs = [['don-vi', 'Phòng / PGD'], ['chi-tieu', 'Chỉ tiêu'], ['khoi', 'Khối phòng ban'], ['trong-so', 'Trọng số KPI']];
      var h = '<div class="toolbar"><div class="tabs">' + tabs.map(function (t) { return '<button class="tab' + (tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div class="grow"></div>' +
        '<button class="btn" id="dm-add">+ ' + ({ 'don-vi': 'Thêm phòng / PGD', 'chi-tieu': 'Thêm chỉ tiêu', khoi: 'Thêm khối phòng ban' }[tab] || 'Thêm dòng') + '</button><button class="btn primary" id="dm-save">Lưu thay đổi</button></div><div class="card p0"><div class="tbl-wrap">';
      var khoiOpts = function (sel) { return st.khoi.filter(function (k) { return k.ma !== 'CN'; }).map(function (k) { return '<option value="' + esc(k.ma) + '"' + (k.ma === sel ? ' selected' : '') + '>' + esc(k.ma + ' — ' + k.ten) + '</option>'; }).join(''); };
      var opt = function (list, sel) { return list.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === sel ? ' selected' : '') + '>' + o[1] + '</option>'; }).join(''); };
      var co = {}; Object.keys(st.rec).forEach(function (kk) { if (st.rec[kk][0] !== null) { var p = kk.split('|'); co['c' + p[1]] = 1; co['d' + p[2]] = 1; } });
      if (tab === 'don-vi') {
        h += '<table class="tbl edit fx" id="dm-tbl"><colgroup><col style="width:3%"><col style="width:10%"><col style="width:22%"><col style="width:14%"><col style="width:16%"><col style="width:14%"><col style="width:7%"><col style="width:7%"><col style="width:7%"></colgroup><thead><tr><th></th><th>Mã</th><th>Tên đầy đủ</th><th>Tên ngắn (hiển thị)</th><th>Khối</th><th title="Mã phòng ban / mã DVKD xuất hiện trong báo cáo thô, nhiều mã cách nhau dấu ;">Mã trong dữ liệu thô</th><th>Thứ tự hiển thị</th><th>Đang theo dõi</th><th></th></tr></thead><tbody>';
        st.don_vi.slice().sort(function (a, b) { return a.thu_tu - b.thu_tu; }).forEach(function (u) {
          h += '<tr data-ma="' + esc(u.ma) + '">' + MV + '<td><input name="ma" value="' + esc(u.ma) + '" class="w100" title="Mã đơn vị (có thể sửa đổi, hệ thống tự chuyển số liệu sang mã mới)"></td><td><input name="ten" value="' + esc(u.ten) + '"></td><td><input name="ten_ngan" value="' + esc(u.ten_ngan || '') + '"></td>' +
            '<td><select name="khoi">' + khoiOpts(u.khoi) + '</select></td><td><input name="ma_nguon" value="' + esc(u.ma_nguon || '') + '" placeholder="VD 44401; 444-KHDN"></td><td><input name="thu_tu" type="number" value="' + (u.thu_tu || 0) + '" class="w60"></td><td class="c"><input type="checkbox" name="active"' + (u.trang_thai !== 'inactive' ? ' checked' : '') + '></td>' +
            '<td>' + (co['d' + u.ma] ? '<span class="muted small" title="Đã có số liệu — bỏ chọn Đang theo dõi để ẩn">có số liệu</span>' : '<button class="icon-btn del" title="Xoá">✕</button>') + '</td></tr>';
        });
        h += '</tbody></table>';
      } else if (tab === 'chi-tieu') {
        h += '<table class="tbl edit fx" id="dm-tbl"><colgroup><col style="width:2%"><col style="width:8%"><col style="width:20%"><col style="width:9%"><col style="width:5%"><col style="width:8%"><col style="width:10%"><col style="width:9%"><col style="width:9%"><col style="width:4%"><col style="width:5%"><col style="width:5%"><col style="width:4%"><col style="width:2%"></colgroup><thead><tr><th></th><th>Mã</th><th>Tên chỉ tiêu</th><th>Tên ngắn</th><th>ĐVT</th><th>Nhóm</th><th>Cách tính %HT</th><th>Số Toàn CN</th><th title="Dùng cho so sánh tháng trước / đầu năm / cùng kỳ">Kiểu số</th><th title="Chỉ tiêu quản trị: theo dõi KH/TH/%HT, không chấm điểm KPI">Quản trị</th><th title="Bỏ chọn: chỉ ẩn ô ở Tổng quan, chỉ tiêu vẫn tính điểm và hiện ở thẻ điểm">Hiện ở Tổng quan</th><th>Thứ tự hiển thị</th><th>Dùng</th><th></th></tr></thead><tbody>';
        KPI_ENGINE.sapXepChiTieu(st.indicators).forEach(function (i) {
          h += '<tr data-ma="' + esc(i.ma) + '">' + MV + '<td><input name="ma" value="' + esc(i.ma) + '" class="w120" title="Mã chỉ tiêu (có thể sửa đổi, hệ thống tự chuyển số liệu sang mã mới)"></td><td><input name="ten" value="' + esc(i.ten) + '" class="w280"></td><td><input name="ten_ngan" value="' + esc(i.ten_ngan || '') + '"></td><td><input name="dvt" value="' + esc(i.dvt) + '" class="w70"></td><td><input name="nhom" value="' + esc(i.nhom || '') + '"></td>' +
            '<td><select name="huong">' + opt([['cao_tot', 'Cao tốt (TH/KH)'], ['thap_tot', 'Thấp tốt (KH/TH)'], ['nhap_ty_le', 'Nhập % HT']], i.huong) + '</select></td><td><select name="tong_hop_cn">' + opt([['tong', 'Cộng các phòng'], ['tb', 'Bình quân'], ['nhap', 'Nhập riêng']], i.tong_hop_cn) + '</select></td>' +
            '<td><select name="kieu_so">' + opt([['', 'Tự nhận (' + (KPI_ENGINE.kieuSo(Object.assign({}, i, { kieu_so: '' })) === 'so_du' ? 'số dư' : 'lũy kế') + ')'], ['so_du', 'Số dư thời điểm'], ['luy_ke', 'Lũy kế phát sinh']], i.kieu_so || '') + '</select></td>' +
            '<td class="c"><input type="checkbox" name="chi_tham_khao"' + (i.chi_tham_khao ? ' checked' : '') + '></td><td class="c"><input type="checkbox" name="hien_tq"' + (i.hien_tq !== false ? ' checked' : '') + '></td><td><input name="thu_tu" type="number" value="' + (i.thu_tu || 0) + '" class="w60"></td><td class="c"><input type="checkbox" name="active"' + (i.trang_thai !== 'inactive' ? ' checked' : '') + '></td>' +
            '<td>' + (co['c' + i.ma] ? '' : '<button class="icon-btn del" title="Xoá">✕</button>') + '</td></tr>';
        });
        h += '</tbody></table>';
      } else if (tab === 'khoi') {
        h += '<table class="tbl edit" id="dm-tbl"><thead><tr><th>Mã khối</th><th>Tên khối</th><th>Số đơn vị</th><th></th></tr></thead><tbody>';
        st.khoi.forEach(function (k) {
          var n = st.don_vi.filter(function (u) { return u.khoi === k.ma; }).length;
          h += '<tr data-ma="' + esc(k.ma) + '"><td>' + (k.ma === 'CN' ? '<input name="ma" value="CN" readonly class="ro w120" title="Mã CN cố định cho toàn chi nhánh">' : '<input name="ma" value="' + esc(k.ma) + '" class="w120" title="Mã khối (có thể sửa đổi)">') + '</td><td><input name="ten" value="' + esc(k.ten) + '" class="w280"></td><td>' + (k.ma === 'CN' ? 'thẻ điểm CN' : n) + '</td><td>' + (k.ma === 'CN' || n ? '' : '<button class="icon-btn del">✕</button>') + '</td></tr>';
        });
        h += '</tbody></table>';
      } else {
        var w = {}; st.weights.forEach(function (x) { w[x.ma_chi_tieu + '|' + x.khoi] = x; });
        var inds = st.indicators.filter(function (i) { return i.trang_thai !== 'inactive'; }).sort(function (a, b) { return a.thu_tu - b.thu_tu; });
        h += '<table class="tbl edit wmat" id="dm-tbl"><thead><tr><th>Chỉ tiêu</th><th title="%HT tối đa được tính điểm (VD 130%)">%HT tối đa</th>' + st.khoi.map(function (k) { return '<th title="' + esc(k.ten) + '">' + esc(k.ma) + '<small>' + esc(k.ten) + '</small></th>'; }).join('') + '</tr></thead><tbody>';
        inds.forEach(function (i) {
          var any = st.khoi.map(function (k) { return w[i.ma + '|' + k.ma]; }).filter(Boolean)[0];
          h += '<tr data-ma="' + esc(i.ma) + '"' + (i.chi_tham_khao ? ' class="ref"' : '') + '><td><b>' + esc(i.ten_ngan || i.ten) + '</b><small class="block muted">' + esc(i.ma) + (i.chi_tham_khao ? ' · chỉ tiêu quản trị (không chấm điểm KPI)' : '') + '</small></td>' +
            '<td><input name="toi_da" type="number" step="5" class="w70" value="' + (any ? Math.round(any.toi_da * 100) : 130) + '">%</td>' +
            st.khoi.map(function (k) { var x = w[i.ma + '|' + k.ma]; return '<td><input data-khoi="' + esc(k.ma) + '" class="w60 wts" type="number" step="0.5" min="0" value="' + (x ? x.trong_so : '') + '" placeholder="–"></td>'; }).join('') + '</tr>';
        });
        h += '</tbody><tfoot><tr><td><b>Tổng trọng số</b></td><td></td>' + st.khoi.map(function (k) { return '<td class="wsum" data-sum="' + esc(k.ma) + '"></td>'; }).join('') + '</tr></tfoot></table>';
      }
      h += '</div></div>';
      if (tab === 'trong-so') h += '<p class="muted small">Ô trống = chỉ tiêu không áp dụng cho khối. Tổng trọng số mỗi khối nên bằng 100; nếu khác 100, xếp hạng vẫn công bằng vì dùng điểm quy đổi về thang 100. Trọng số là MẪU — hãy chỉnh theo văn bản giao KPI của chi nhánh.</p>';
      if (tab === 'don-vi') h += '<p class="muted small">Mã đơn vị: có thể sửa đổi — hệ thống sẽ tự động chuyển toàn bộ số liệu kế hoạch, thực hiện, nhận xét và điều chỉnh lịch sử sang mã mới. Đơn vị ngừng theo dõi được ẩn khỏi mọi màn hình nhưng vẫn giữ số cũ.</p>';
      if (tab === 'khoi') h += '<p class="muted small">Mã khối: có thể sửa đổi — hệ thống sẽ tự động cập nhật khối của các đơn vị thuộc khối đó và bảng trọng số.</p>';
      if (tab === 'chi-tieu') h += '<p class="muted small">Mã chỉ tiêu: có thể sửa đổi — hệ thống sẽ tự động chuyển toàn bộ số liệu, trọng số và công thức sang mã mới.</p>';
      return h;
    },
    mount: function (v, A) {
      var st = STORE.state, tab = A.dm_tab || 'don-vi', tbl = v.querySelector('#dm-tbl');
      v.querySelectorAll('[data-tab]').forEach(function (b) { b.onclick = function () { A.dm_tab = b.dataset.tab; APP.render(); }; });
      tbl.addEventListener('click', function (e) {
        if (e.target.classList.contains('del')) { e.target.closest('tr').remove(); return; }
      });
      /* Kéo-thả đổi thứ tự (SortableJS). Chỉ tiêu: chỉ đổi chỗ trong cùng nhóm. Chạy được trên màn hình cảm ứng. */
      var nh = function (r) { var n = r.querySelector('[name="nhom"]'); return n ? n.value.trim() : ''; };
      var tbd = tbl.querySelector('tbody');
      if (tbd && tbd.querySelector('.drag-h')) UI.lib('sortable').then(function (Sortable) {
        if (!document.body.contains(tbd)) return;
        Sortable.create(tbd, {
          handle: '.drag-h', animation: 0, draggable: 'tr:not(.ref)', forceFallback: false,
          onMove: function (ev) { return nh(ev.dragged) === nh(ev.related); },
          onEnd: function () { [].forEach.call(tbd.querySelectorAll('tr'), function (r, i) { var t = r.querySelector('[name="thu_tu"]'); if (t) t.value = i + 1; }); }
        });
      }).catch(function (e) { UI.toast(e.message, 'err'); });
      function sums() { if (tab !== 'trong-so') return; st.khoi.forEach(function (k) {
        var s = 0, n = 0; tbl.querySelectorAll('tbody tr:not(.ref) input[data-khoi="' + k.ma + '"]').forEach(function (i) { var x = parseFloat(i.value); if (isFinite(x)) { s += x; n++; } });
        var td = tbl.querySelector('[data-sum="' + k.ma + '"]'); td.textContent = n ? num(s, 1) : '–'; td.className = 'wsum ' + (!n ? '' : Math.abs(s - 100) < 0.01 ? 'ok' : 'warn');
      }); }
      tbl.addEventListener('input', sums); sums();
      var addBtn = v.querySelector('#dm-add');
      if (tab === 'trong-so') addBtn.style.display = 'none';
      addBtn.onclick = function () {
        var tb = tbl.querySelector('tbody'), tr = document.createElement('tr'); tr.dataset.new = '1';
        var khoiOpts = st.khoi.filter(function (k) { return k.ma !== 'CN'; }).map(function (k) { return '<option value="' + esc(k.ma) + '">' + esc(k.ma) + '</option>'; }).join('');
        if (tab === 'don-vi') tr.innerHTML = MV + '<td><input name="ma" placeholder="VD PGD_NA"></td><td><input name="ten" placeholder="Tên đầy đủ"></td><td><input name="ten_ngan"></td><td><select name="khoi">' + khoiOpts + '</select></td><td><input name="ma_nguon"></td><td><input name="thu_tu" type="number" class="w60" value="' + (st.don_vi.length + 1) + '"></td><td class="c"><input type="checkbox" name="active" checked></td><td><button class="icon-btn del">✕</button></td>';
        else if (tab === 'chi-tieu') tr.innerHTML = MV + '<td><input name="ma" class="w120" placeholder="MA_MOI"></td><td><input name="ten" class="w280"></td><td><input name="ten_ngan"></td><td><input name="dvt" class="w70" value="Tr đồng"></td><td><input name="nhom"></td><td><select name="huong"><option value="cao_tot">Cao tốt (TH/KH)</option><option value="thap_tot">Thấp tốt (KH/TH)</option><option value="nhap_ty_le">Nhập % HT</option></select></td><td><select name="tong_hop_cn"><option value="tong">Cộng các phòng</option><option value="tb">Bình quân</option><option value="nhap">Nhập riêng</option></select></td><td><select name="kieu_so"><option value="">Tự nhận</option><option value="so_du">Số dư thời điểm</option><option value="luy_ke">Lũy kế phát sinh</option></select></td><td class="c"><input type="checkbox" name="chi_tham_khao"></td><td class="c"><input type="checkbox" name="hien_tq" checked></td><td><input name="thu_tu" type="number" class="w60" value="' + (st.indicators.length + 1) + '"></td><td class="c"><input type="checkbox" name="active" checked></td><td><button class="icon-btn del">✕</button></td>';
        else tr.innerHTML = '<td><input name="ma" class="w120" placeholder="VD KHDN2"></td><td><input name="ten" class="w280"></td><td>0</td><td><button class="icon-btn del">✕</button></td>';
        tb.appendChild(tr); tr.querySelector('input').focus();
      };
      v.querySelector('#dm-save').onclick = function () {
        var rows = [].slice.call(tbl.querySelectorAll('tbody tr')), get = function (tr, n) { var el = tr.querySelector('[name="' + n + '"]'); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : null; };
        var codeOk = function (m) { return /^[A-Za-z0-9_]{1,24}$/.test(m); }, err = null, seen = {};
        if (tab === 'don-vi' || tab === 'chi-tieu' || tab === 'khoi') {
          var list = rows.map(function (tr) {
            var ma = (get(tr, 'ma') || '').toUpperCase(); if (!codeOk(ma)) err = 'Mã "' + ma + '" không hợp lệ (chỉ chữ không dấu, số, gạch dưới; tối đa 24 ký tự).';
            if (ma === CN && tab === 'don-vi') err = 'Mã "CN" dành cho toàn chi nhánh.';
            if (seen[ma]) err = 'Trùng mã "' + ma + '".'; seen[ma] = 1;
            if (!get(tr, 'ten')) err = 'Dòng mã "' + ma + '" chưa có tên.';
            return { tr: tr, ma: ma, maCu: tr.dataset.ma };
          });
          if (err) { UI.toast(err, 'err'); return; }

          // Đổi mã cascade nếu mã đã bị thay đổi
          list.forEach(function (x) {
            if (x.maCu && x.maCu !== x.ma) {
              if (tab === 'don-vi') STORE.doiMaDonVi(x.maCu, x.ma);
              else if (tab === 'khoi') STORE.doiMaKhoi(x.maCu, x.ma);
              else if (tab === 'chi-tieu') STORE.doiMaChiTieu(x.maCu, x.ma);
            }
          });

          if (tab === 'don-vi') STORE.setDanhMuc({ don_vi: list.map(function (x) { return { ma: x.ma, ten: get(x.tr, 'ten'), ten_ngan: get(x.tr, 'ten_ngan') || get(x.tr, 'ten'), khoi: get(x.tr, 'khoi'), ma_nguon: get(x.tr, 'ma_nguon') || '', thu_tu: +get(x.tr, 'thu_tu') || 0, trang_thai: get(x.tr, 'active') ? 'active' : 'inactive' }; }) }, 'Sửa danh mục đơn vị');
          else if (tab === 'chi-tieu') {
            var mas = {}; list.forEach(function (x) { mas[x.ma] = 1; });
            STORE.setDanhMuc({ indicators: list.map(function (x) { return { ma: x.ma, ten: get(x.tr, 'ten'), ten_ngan: get(x.tr, 'ten_ngan') || get(x.tr, 'ten'), dvt: get(x.tr, 'dvt') || '', nhom: get(x.tr, 'nhom') || 'Khác', huong: get(x.tr, 'huong'), tong_hop_cn: get(x.tr, 'tong_hop_cn'), kieu_so: get(x.tr, 'kieu_so') || '', chi_tham_khao: get(x.tr, 'chi_tham_khao'), hien_tq: get(x.tr, 'hien_tq') !== false, thu_tu: +get(x.tr, 'thu_tu') || 0, trang_thai: get(x.tr, 'active') ? 'active' : 'inactive' }; }),
              weights: st.weights.filter(function (w) { return mas[w.ma_chi_tieu]; }) }, 'Sửa danh mục chỉ tiêu');
          } else STORE.setDanhMuc({ khoi: list.map(function (x) { return { ma: x.ma, ten: get(x.tr, 'ten') }; }) }, 'Sửa danh mục khối');
        } else {
          var ws = [], keep = {};
          rows.forEach(function (tr) {
            var ma = tr.dataset.ma, td = parseFloat(get(tr, 'toi_da')); td = isFinite(td) && td > 0 ? td / 100 : 1.3; keep[ma] = 1;
            tr.querySelectorAll('input[data-khoi]').forEach(function (i) { var x = parseFloat(i.value); if (isFinite(x) && x >= 0) ws.push({ ma_chi_tieu: ma, khoi: i.dataset.khoi, trong_so: x, toi_da: td }); });
          });
          st.weights.forEach(function (w) { if (!keep[w.ma_chi_tieu]) ws.push(w); });   // giữ trọng số của chỉ tiêu đang ẩn
          STORE.setDanhMuc({ weights: ws }, 'Sửa trọng số');
        }
        UI.toast('Đã lưu danh mục thành công.', 'ok');
        APP.render();
      };
    }
  };

  /* ================= DỮ LIỆU & CÀI ĐẶT ================= */
  VIEWS['du-lieu'] = {
    html: function (A) {
      var st = STORE.state, s = st.settings, sy = STORE.sync, M = STORE.model();
      var soO = Object.keys(st.rec).filter(function (k) { return st.rec[k][0] !== null; }).length;
      var users = STORE.getUsers();
      var curUser = (STORE.userHienTai() || '').toLowerCase();

      var userRows = users.map(function (u) {
        var isMe = u.user.toLowerCase() === curUser;
        var passTag = u.mac_dinh ? '<span style="background:#fff6e0;color:#9a6700;padding:2px 6px;border-radius:4px;font-size:11px;border:1px solid #f5d590;">Không thay đổi mật khẩu (Cần đổi)</span>' : '<span style="background:#f6ffed;color:#389e0d;padding:2px 6px;border-radius:4px;font-size:11px;border:1px solid #b7eb8f;">An toàn</span>';
        var meTag = isMe ? ' <span style="color:#0969da;font-weight:600;font-size:11px;">(Đang dùng)</span>' : '';
        var canDel = !isMe && users.length > 1;
        return '<tr>' +
          '<td><b>' + esc(u.user) + '</b>' + meTag + '</td>' +
          '<td>' + esc(u.ten) + '</td>' +
          '<td>' + passTag + '</td>' +
          '<td class="right nowrap">' +
            '<button class="btn sm u-edit" data-user="' + esc(u.user) + '" title="Đổi mật khẩu / tên hiển thị">Đổi MK</button> ' +
            (canDel ? '<button class="btn sm danger-ghost u-del" data-user="' + esc(u.user) + '" data-ten="' + esc(u.ten) + '" title="Xoá người dùng">Xoá</button>' : '<button class="btn sm" disabled style="opacity:0.4" title="Không thể xoá tài khoản đang dùng hoặc tài khoản duy nhất">Xoá</button>') +
          '</td>' +
        '</tr>';
      }).join('');

      var h = '<div class="cols-2">' +
        '<div class="card"><h3>Thông tin chung chi nhánh</h3>' +
        field('Tên chi nhánh', '<input id="s-ten" value="' + esc(s.ten_chi_nhanh) + '">') + field('Mã chi nhánh', '<input id="s-ma" value="' + esc(s.ma_chi_nhanh) + '" class="w120">') +
        field('Năm theo dõi mặc định', '<input id="s-nam" type="number" value="' + s.nam + '" class="w120">') +
        '<div class="row3">' + field('Ngưỡng Đạt (%)', '<input id="s-dat" type="number" value="' + Math.round(s.nguong.dat * 100) + '">') + field('Ngưỡng Khá (%)', '<input id="s-kha" type="number" value="' + Math.round(s.nguong.kha * 100) + '">') + field('Cần cải thiện (%)', '<input id="s-cct" type="number" value="' + Math.round(s.nguong.cct * 100) + '">') + '</div>' +
        field('Ngưỡng điểm cao (điểm quy đổi, thang 100) — đếm "Đơn vị ≥ N điểm" ở Tổng quan', '<input id="s-diem" type="number" min="1" max="200" step="any" value="' + (STORE.model().ng.diem_cao) + '" class="w120">') +
        field('Cảnh báo khi điểm giảm liên tiếp (tháng)', '<input id="s-ct" type="number" min="1" max="6" value="' + (s.so_thang_canh_bao || 2) + '" class="w120">') +
        '<div class="right"><button class="btn primary" id="s-save">Lưu cài đặt chung</button></div></div>';

      h += '<div class="card" data-no-png>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
          '<h3 style="margin:0">Người dùng quản trị</h3>' +
          '<button class="btn primary sm" id="u-add">+ Thêm người dùng</button>' +
        '</div>' +
        '<p class="muted" style="margin-top:0">Danh sách tài khoản được phép mở khoá chỉnh sửa số liệu, danh mục và cấu hình hệ thống.</p>' +
        '<table class="tbl compact"><thead><tr><th>Tên đăng nhập</th><th>Họ tên hiển thị</th><th>Mật khẩu</th><th class="right">Thao tác</th></tr></thead><tbody>' +
        userRows +
        '</tbody></table></div></div>';

      h += '<div class="cols-2" style="margin-top:16px;">' +
        '<div class="card"><h3>Thư mục dữ liệu dùng chung</h3><p class="muted">Đặt thư mục <b>Data</b> trên ổ mạng nội bộ để các máy (Ban giám đốc, phòng Tổng hợp, các phòng) cùng xem một bộ số. Ứng dụng ghi tệp <code>' + STORE.FILE + '</code> và tự gộp số các máy theo từng ô.</p>';
      if (!STORE.hoTroThuMuc()) h += '<div class="warn-box">Trình duyệt này không hỗ trợ chọn thư mục. Dùng Google Chrome hoặc Microsoft Edge bản mới.</div>';
      else h += '<p>Trạng thái: <b class="sync-txt ' + sy.trang_thai + '">' + ({ ok: 'Đang đồng bộ với "' + esc(sy.ten) + '"', wait: 'Chờ cấp lại quyền cho "' + esc(sy.ten) + '"', err: 'Lỗi: ' + esc(sy.loi), none: 'Chưa kết nối — chỉ lưu trên máy này' }[sy.trang_thai]) + '</b></p>' +
        '<div class="btns"><button class="btn primary" id="d-chon">Chọn thư mục Data</button>' + (sy.trang_thai === 'wait' ? '<button class="btn" id="d-lai">Kết nối lại</button>' : '') + (sy.trang_thai !== 'none' ? '<button class="btn danger-ghost" id="d-bo">Ngắt kết nối</button>' : '') + '</div>';
      h += '<h3 class="mt">Sao lưu tự động ra máy</h3><div id="sl-box" class="muted">Đang kiểm tra…</div>';
      h += '<h3 class="mt">Sao lưu & khôi phục</h3><p class="muted">Đang có <b>' + num(soO, 0) + '</b> ô số, ' + M.units.length + ' đơn vị, ' + M.inds.length + ' chỉ tiêu. Nên tải bản sao lưu cuối mỗi tháng.</p>' +
        '<div class="btns"><button class="btn" id="d-tai">⤓ Tải bản sao lưu (.json)</button><button class="btn" id="d-gop">Gộp từ tệp sao lưu</button><button class="btn danger-ghost" id="d-thay">Khôi phục (thay toàn bộ)</button></div>' +
        '<h3 class="mt">Dọn dữ liệu</h3><div class="btns"><button class="btn danger-ghost" id="d-xoa-nam">Xoá số năm ' + s.nam + '</button><button class="btn danger-ghost" id="d-xoa-het">Xoá toàn bộ số liệu (giữ danh mục)</button></div></div>';

      h += '<div class="card" data-no-png><div class="card-head"><h3>Nhật ký thay đổi</h3><span class="muted small">' + Math.min(A.nk_n || 15, st.nhat_ky.length) + ' / ' + st.nhat_ky.length + ' mục gần nhất</span></div>' + (st.nhat_ky.length ? '<table class="tbl compact"><tbody>' + st.nhat_ky.slice(-(A.nk_n || 15)).reverse().map(function (x) { return '<tr><td class="muted nowrap">' + new Date(x.t).toLocaleString('vi-VN') + '</td><td>' + esc(x.viec) + (x.ai ? ' <small class="muted">— ' + esc(x.ai) + '</small>' : '') + '</td></tr>'; }).join('') + '</tbody></table>' + ((A.nk_n || 15) < st.nhat_ky.length ? '<div class="nk-btns"><button class="btn sm" id="nk-them">Xem thêm 20 mục</button></div>' : '') + ((A.nk_n || 15) > 15 ? '<div class="nk-btns"><button class="btn sm" id="nk-gon">Thu gọn</button></div>' : '') : '<p class="muted">Chưa có thay đổi.</p>') + '</div></div>';
      return h;
    },
    mount: function (v, A) {
      var $ = function (s) { return v.querySelector(s); };
      var $$ = function (s) { return v.querySelectorAll(s); };

      $('#s-save').onclick = function () {
        var d = +$('#s-dat').value / 100, k = +$('#s-kha').value / 100, c = +$('#s-cct').value / 100, dc = +$('#s-diem').value;
        if (!(d > k && k > c && c > 0)) { UI.toast('Ngưỡng phải giảm dần: Đạt > Khá > Cần cải thiện > 0.', 'err'); return; }
        if (!(dc > 0 && dc <= 200)) { UI.toast('Ngưỡng điểm cao phải là số lớn hơn 0 và không quá 200.', 'err'); return; }
        var p = { ten_chi_nhanh: $('#s-ten').value.trim() || 'Chi nhánh', ma_chi_nhanh: $('#s-ma').value.trim(), nam: +$('#s-nam').value || new Date().getFullYear(), nguong: { dat: d, kha: k, cct: c, diem_cao: dc }, so_thang_canh_bao: Math.max(1, +$('#s-ct').value || 2) };
        STORE.setSettings(p); STORE.log('Sửa cài đặt chi nhánh');
        UI.toast('Đã lưu cài đặt thông tin chi nhánh.', 'ok');
      };

      // Thêm người dùng quản trị
      var btnAdd = $('#u-add');
      if (btnAdd) btnAdd.onclick = function () {
        var m = UI.modal('Thêm người dùng quản trị',
          '<p class="muted">Tạo tài khoản quản trị mới để phân quyền chỉnh sửa số liệu và danh mục.</p>' +
          field('Tên đăng nhập (chữ, số không dấu, 3-20 ký tự)', '<input id="new-u-name" placeholder="VD: van_a" autocomplete="off">') +
          field('Họ tên hiển thị (ghi vào nhật ký/nhận xét)', '<input id="new-u-ten" placeholder="VD: Nguyễn Văn A" autocomplete="off">') +
          field('Mật khẩu (≥ 4 ký tự)', '<input id="new-u-pass" type="password" placeholder="Nhập mật khẩu" autocomplete="new-password">'),
          [{ text: 'Huỷ' }, { text: 'Thêm người dùng', cls: 'primary', onClick: function (w) {
            var uname = w.querySelector('#new-u-name').value.trim();
            var uten = w.querySelector('#new-u-ten').value.trim();
            var upass = w.querySelector('#new-u-pass').value;
            STORE.themUser(uname, upass, uten).then(function () {
              UI.toast('Đã thêm người dùng quản trị: ' + uname, 'ok');
              m.close();
              APP.render();
            }).catch(function (e) {
              UI.toast(e.message, 'err');
            });
            return false;
          } }]
        );
      };

      // Đổi mật khẩu / họ tên
      $$('.u-edit').forEach(function (btn) {
        btn.onclick = function () {
          var uName = this.dataset.user;
          var uObj = (STORE.getUsers() || []).filter(function (x) { return x.user === uName; })[0];
          if (!uObj) return;
          var m = UI.modal('Đổi mật khẩu: ' + uName,
            '<p class="muted">Cập nhật họ tên hiển thị và đổi mật khẩu mới cho tài khoản <b>' + esc(uName) + '</b>.</p>' +
            field('Họ tên hiển thị', '<input id="edit-u-ten" value="' + esc(uObj.ten) + '" autocomplete="off">') +
            field('Mật khẩu mới (để trống nếu không đổi mật khẩu)', '<input id="edit-u-pass" type="password" placeholder="Tối thiểu 4 ký tự" autocomplete="new-password">'),
            [{ text: 'Huỷ' }, { text: 'Cập nhật', cls: 'primary', onClick: function (w) {
              var nten = w.querySelector('#edit-u-ten').value.trim();
              var npass = w.querySelector('#edit-u-pass').value;
              STORE.doiMatKhau(uName, npass, nten).then(function () {
                UI.toast('Đã cập nhật thông tin người dùng: ' + uName, 'ok');
                m.close();
                APP.render();
              }).catch(function (e) {
                UI.toast(e.message, 'err');
              });
              return false;
            } }]
          );
        };
      });

      // Xoá người dùng
      $$('.u-del').forEach(function (btn) {
        btn.onclick = function () {
          var uName = this.dataset.user;
          var uTen = this.dataset.ten || uName;
          UI.confirm('Xoá người dùng quản trị', 'Bạn có chắc chắn muốn xoá tài khoản quản trị <b>' + esc(uName) + ' (' + esc(uTen) + ')</b> không?', 'Xoá người dùng', true).then(function (ok) {
            if (!ok) return;
            STORE.xoaUser(uName).then(function () {
              UI.toast('Đã xoá tài khoản ' + uName, 'ok');
              APP.render();
            }).catch(function (e) {
              UI.toast(e.message, 'err');
            });
          });
        };
      });

      /* Sao lưu tự động ra máy (js/sao-luu-may.js): khung tự vẽ lại theo trạng thái thật của thư mục */
      var slBox = $('#sl-box');
      function slVe() {
        var SL = root.SAO_LUU_MAY; if (!slBox || !SL) return;
        if (!SL.hoTro()) { slBox.innerHTML = '<div class="warn-box">Trình duyệt này không hỗ trợ chọn thư mục. Dùng Google Chrome hoặc Microsoft Edge bản mới.</div>'; return; }
        SL.lamMoi().then(function (t) {
          var nhan = { chua_chon: 'Chưa chọn thư mục — chưa có bản sao lưu nào trên máy này', can_cap_quyen: 'Thư mục "' + esc(t.ten) + '" cần cấp lại quyền (Chrome/Edge hỏi lại mỗi lần mở)', san_sang: 'Đang sao lưu vào "' + esc(t.ten) + '\\KPI_CN444"', loi: 'Lỗi: ' + esc(t.loi), chua_biet: 'Đang kiểm tra…' }[t.state] || '';
          var luc = t.luc || +(localStorage.getItem('KPI_CN444.saoluu.luc') || 0);
          slBox.innerHTML = '<p class="muted">Máy quản trị tự ghi thêm một bản sao lưu vào thư mục <b>trên máy này</b> (VD <code>D:\\Backup</code>) mỗi lần đăng nhập và mỗi khi số liệu đổi, phòng khi ổ mạng gặp sự cố. Chỉ ghi khi số liệu thật sự đổi.</p>' +
            '<p>Trạng thái: <b class="sync-txt ' + (t.state === 'san_sang' ? 'ok' : t.state === 'loi' ? 'err' : 'wait') + '">' + nhan + '</b>' + (t.loi && t.state !== 'loi' ? ' <small class="muted">(lỗi gần nhất: ' + esc(t.loi) + ')</small>' : '') + '</p>' +
            (luc ? '<p class="muted">Bản gần nhất: ' + new Date(luc).toLocaleString('vi-VN') + '</p>' : '') +
            '<div class="btns"><button class="btn primary" id="sl-chon" data-saoluu>' + (t.state === 'chua_chon' ? 'Chọn thư mục sao lưu…' : 'Đổi thư mục…') + '</button>' +
            (t.state === 'can_cap_quyen' ? '<button class="btn" id="sl-quyen" data-saoluu>Cấp quyền</button>' : '') +
            (t.state === 'san_sang' ? '<button class="btn" id="sl-ghi" data-saoluu>Ghi ngay</button>' : '') +
            (t.state !== 'chua_chon' ? '<button class="btn danger-ghost" id="sl-bo" data-saoluu>Bỏ thư mục</button>' : '') + '</div>' +
            (t.state !== 'chua_chon' ? '<label class="chk"><input type="checkbox" id="sl-bat"' + (SL.bat() ? ' checked' : '') + '> Tự động sao lưu (khi đăng nhập và khi số liệu đổi)</label>' : '') +
            '<p class="muted"><small>Khôi phục: "Khôi phục (thay toàn bộ)" bên dưới → chọn <code>KPI_MOI_NHAT.json</code> hoặc tệp theo ngày trong thư mục tháng. Lịch giữ: mỗi ngày tối đa 4 bản · tháng này 1 bản mỗi ngày · tháng đã qua 2 bản (ngày 15 và cuối tháng). Bản sao lưu có chứa mã băm mật khẩu — đặt thư mục ở nơi chỉ quản trị viên truy cập.</small></p>';
          var q = function (s) { return slBox.querySelector(s); }, bao = function (r, okMsg) { if (r && r.huy) return; UI.toast(r && r.ok ? okMsg : ((r && r.loi) || 'Không thực hiện được.'), r && r.ok ? 'ok' : 'err'); slVe(); };
          q('#sl-chon').onclick = function () { SL.chon().then(function (r) { bao(r, 'Đã chọn thư mục "' + r.ten + '" và ghi bản sao lưu đầu tiên.'); }); };
          if (q('#sl-quyen')) q('#sl-quyen').onclick = function () { SL.capQuyen().then(function (r) { bao(r, 'Đã cấp quyền, đã ghi bản sao lưu.'); }); };
          if (q('#sl-ghi')) q('#sl-ghi').onclick = function () { SL.ghi({ ep: true }).then(function (r) { bao({ ok: r.da_ghi, loi: r.loi }, 'Đã ghi bản sao lưu: ' + (r.tep || []).join(' · ')); }); };
          if (q('#sl-bo')) q('#sl-bo').onclick = function () { SL.bo().then(function () { UI.toast('Đã bỏ thư mục sao lưu (các tệp đã ghi vẫn còn trên máy).'); slVe(); }); };
          if (q('#sl-bat')) q('#sl-bat').onchange = function () { SL.datBat(this.checked); };
        });
      }
      slVe();

      var nt = $('#nk-them'); if (nt) nt.onclick = function () { A.nk_n = (A.nk_n || 15) + 20; APP.render(); };
      var nk2 = $('#nk-gon'); if (nk2) nk2.onclick = function () { A.nk_n = 15; APP.render(); };
      var c = $('#d-chon'); if (c) c.onclick = function () { STORE.chonThuMuc().then(function () { APP.render(); }).catch(function (e) { if (e.name !== 'AbortError') UI.toast('Không chọn được thư mục: ' + e.message, 'err'); }); };
      var l = $('#d-lai'); if (l) l.onclick = function () { STORE.ketNoiLai().then(function () { APP.render(); }); };
      var b = $('#d-bo'); if (b) b.onclick = function () { STORE.boThuMuc().then(function () { UI.toast('Đã ngắt kết nối thư mục chung.'); APP.render(); }); };
      $('#d-tai').onclick = function () { UI.download('SaoLuu_KPI_' + UI.slug(STORE.state.settings.ma_chi_nhanh || 'CN') + '_' + new Date().toISOString().slice(0, 10) + '.json', STORE.exportJSON(), 'application/json'); };
      function docJson(cb) { UI.pickFile('.json').then(function (f) { if (!f) return; f.text().then(function (t) { var d; try { d = JSON.parse(t); } catch (e) { UI.toast('Tệp không phải JSON hợp lệ.', 'err'); return; } if (!d || !d.rec || !d.indicators) { UI.toast('Tệp không đúng định dạng sao lưu KPI chi nhánh (bản 2.x).', 'err'); return; } cb(d, f.name); }); }); }
      $('#d-gop').onclick = function () { docJson(function (d, n) { var k = STORE.merge(d); STORE.log('Gộp từ ' + n); UI.toast('Đã gộp ' + k + ' thay đổi mới hơn từ ' + n + '.', 'ok'); }); };
      $('#d-thay').onclick = function () { docJson(function (d, n) { UI.confirm('Khôi phục toàn bộ', 'Thay TOÀN BỘ dữ liệu trên máy này bằng nội dung tệp <b>' + esc(n) + '</b>? Nên tải bản sao lưu hiện tại trước.', 'Khôi phục', true).then(function (ok) { if (ok) { STORE.replaceAll(d); UI.toast('Đã khôi phục.', 'ok'); } }); }); };
      $('#d-xoa-nam').onclick = function () { var n = STORE.state.settings.nam; UI.confirm('Xoá số năm ' + n, 'Xoá toàn bộ kế hoạch và thực hiện năm ' + n + ' của mọi đơn vị?', 'Xoá', true).then(function (ok) { if (ok) UI.toast('Đã xoá ' + STORE.xoaKy(n) + ' ô.', 'ok'); }); };
      $('#d-xoa-het').onclick = function () { UI.confirm('Xoá toàn bộ số liệu', 'Xoá mọi số kế hoạch/thực hiện (mọi năm). Danh mục và trọng số được giữ lại.', 'Xoá hết', true).then(function (ok) { if (ok) STORE.resetAll(true); }); };
    }
  };
  function field(l, input) { return '<label class="field"><span>' + l + '</span>' + input + '</label>'; }

  /* ================= HƯỚNG DẪN ================= */
  VIEWS['huong-dan'] = {
    html: function () {
      return '<div class="card guide"><h2>Hướng dẫn nhanh</h2>' +
        '<h3>1. Thiết lập lần đầu (quản trị viên)</h3><ol><li>Bấm <b>Chế độ xem</b> ở góc trên → Đăng nhập tài khoản quản trị → vào <b>Dữ liệu & cài đặt</b> đổi mật khẩu, thêm tài khoản quản trị, tên chi nhánh, ngưỡng đánh giá.</li>' +
        '<li>Chọn thư mục <b>Data</b> trên ổ mạng dùng chung để các máy cùng xem một bộ số (Chrome/Edge sẽ hỏi quyền — bấm Cho phép).</li>' +
        '<li><b>Danh mục & trọng số</b>: khai báo các phòng/PGD và khối của từng đơn vị; danh sách chỉ tiêu; trọng số từng chỉ tiêu theo khối (khối <b>CN</b> = thẻ điểm toàn chi nhánh do TSC giao).</li>' +
        '<li>Đang có dữ liệu mẫu: bấm <b>Xoá dữ liệu mẫu</b> trên dải vàng để bắt đầu nhập thật.</li></ol>' +
        '<h3>2. Nhập số hằng tháng</h3><ol><li><b>Nhập kế hoạch & thực hiện</b> → chọn kỳ ở góc trên → chọn Kế hoạch/Thực hiện.</li>' +
        '<li>Cách nhanh nhất: <b>Tải mẫu Excel</b> → điền (hoặc chép từ báo cáo FPM/SPM) → <b>Nạp từ Excel</b>. Hoặc chọn ô đầu rồi dán thẳng vùng số từ Excel.</li>' +
        '<li>Số là <b>lũy kế đến cuối tháng</b>. Cột <b>Toàn CN</b>: nhập số TSC giao/số chính thức của CN; để trống thì ứng dụng cộng (hoặc bình quân) các phòng.</li>' +
        '<li>Kế hoạch giao theo năm: nhập KH vào <b>tháng 12</b> rồi dùng <b>Phân bổ KH năm</b> để sinh KH lũy kế các tháng.</li></ol>' +
        '<h3>2a. Khoá kỳ & kiểm tra số liệu (2.7.0)</h3><ol><li>Sau khi nhập và rà soát xong, chọn <b>Khoá kỳ</b> ở màn Nhập số: số liệu, điều chỉnh và cộng/trừ điểm của tháng đó không ai sửa được nữa. Muốn sửa phải <b>Mở khoá</b> và ghi lý do (có nhật ký).</li>' +
        '<li><b>Kiểm tra số liệu</b>: tiến độ nhập từng đơn vị, số bất thường (lũy kế giảm, nghi sai đơn vị tính ×1000, biến động lớn, CN lệch tổng các phòng). Khi nhập số liệu bất thường ở màn Nhập số, hệ thống cảnh báo ngay (số vẫn được lưu).</li></ol>' +
        '<h3>2c. Dự báo, nguyên nhân & điều hành (2.7.0)</h3><ol><li><b>Dự báo & nguyên nhân</b>: dự báo điểm và từng chỉ tiêu cuối năm (mặc định theo tốc độ 3 tháng gần nhất — chỉ mang tính tham khảo); nguyên nhân điểm thay đổi so với tháng trước; chỉ tiêu cần ưu tiên cải thiện; <b>mô phỏng kịch bản</b> (không lưu).</li>' +
        '<li><b>Nội dung cần xử lý</b> tổng hợp mọi cảnh báo; <b>Biện pháp khắc phục</b> giao nhiệm vụ có thời hạn, người phụ trách và tự đối chiếu kết quả (giao trực tiếp từ vấn đề trong Báo cáo giao ban); <b>Bảng điều hành BGĐ</b> một trang để in/lưu PDF.</li>' +
        '<li>Ở <b>Thẻ điểm KPI phòng</b>: <b>In thẻ điểm tất cả phòng</b> (mỗi phòng một trang, có ô giải trình) hoặc <b>Excel từng phòng</b> để gửi cho đơn vị.</li></ol>' +
        '<h3>2d. Thẻ điểm Ban giám đốc (2.8.0)</h3><ol><li><b>Thiết lập › Ban giám đốc</b>: khai báo thành viên (Giám đốc, Phó giám đốc), phòng/PGD phụ trách và <b>bảng KPI riêng</b> của từng người (chỉ tiêu, trọng số, % tối đa). Có nút <b>Khởi tạo bảng KPI mẫu</b> để sao từ trọng số khối CN rồi chỉnh lại.</li>' +
        '<li>Mỗi chỉ tiêu lấy số theo <b>Chi nhánh</b> (Giám đốc; hoặc chỉ tiêu dùng chung của Phó giám đốc) hoặc <b>tổng hợp các phòng/PGD phụ trách</b> (cộng hoặc bình quân theo cách tổng hợp của chỉ tiêu). Thiếu số của một phòng phụ trách thì chỉ tiêu đó thiếu số, 0 điểm.</li>' +
        '<li><b>Thẻ điểm Ban giám đốc</b>: bảng tổng hợp, chi tiết từng thành viên, diễn biến theo tháng, cộng/trừ điểm KPI riêng. Mặc định chỉ xem được khi đăng nhập quản trị; có thể cho phép xem ở chế độ xem tại mục Ban giám đốc.</li></ol>' +
        '<h3>2b. Tính chỉ tiêu từ dữ liệu thô</h3><ol><li>Menu <b>Tính từ dữ liệu thô</b> → <b>Nạp file</b> báo cáo thô (BCCV, BCNV, danh sách thẻ, KH…). Ứng dụng tự dò dòng tiêu đề, nhận cột theo tên.</li>' +
        '<li>Công thức gồm: cột nhận diện loại file → cột mã phòng → điều kiện lọc → hàm (Tổng, Đếm, <b>Đếm không trùng</b> VD số CIF, Trung bình, Lớn/Nhỏ nhất, <b>Tỷ lệ %</b> VD nợ xấu) → quy đổi đơn vị → trừ mốc đầu năm → chỉ tiêu đích.</li>' +
        '<li>Lần đầu, gán các mã phòng trong file chưa nhận ra vào phòng/PGD — mã được lưu vào danh mục đơn vị và dùng cho mọi công thức.</li>' +
        '<li>Hằng tháng: nạp file → <b>Chạy nhanh</b> các công thức đúng loại file → xem bảng tổng hợp → Ghi. Dữ liệu thô không được lưu lại, chỉ lưu công thức và kết quả.</li></ol>' +
        '<h3>2c. Nạp tự động & diễn biến theo ngày</h3><ul><li>Thả file báo cáo thô vào <b>Data\\BAO_CAO_THO</b>. Máy quản trị đang mở ứng dụng tự quét mỗi phút; nút ⚡ trên thanh trên báo file chờ duyệt (menu <b>Nạp tự động từ thư mục</b>).</li>' +
        '<li>Kỳ lấy theo cột Ngày báo cáo. File ngày cuối tháng chốt thành số thực hiện tháng; file giữa tháng chỉ lưu ở <b>Diễn biến theo ngày</b>. Ô đã sửa tay sau lần ghi tự động được giữ.</li></ul>' +
        '<h3>2d. Điều chỉnh số liệu</h3><ul><li>Menu <b>Điều chỉnh số liệu</b>: cộng/trừ số thực hiện của 1 phòng/PGD hoặc của Toàn chi nhánh, cho 1 tháng hoặc đến hết năm, kèm lý do và căn cứ.</li>' +
        '<li>Số gốc (từ file/nhập) không bị sửa — nạp lại file không mất điều chỉnh. Số đã điều chỉnh có ghi chú "gồm đ/c" ở thẻ điểm.</li></ul>' +
        '<h3>3. Cách chấm điểm</h3><ul><li>%HT = TH/KH (càng cao càng tốt) · KH/TH (càng thấp càng tốt, VD tỷ lệ nợ xấu; TH = 0 được %HT tối đa) · nhập thẳng % (chỉ tiêu tự đánh giá).</li>' +
        '<li>Điểm chỉ tiêu = Trọng số × min(%HT, %HT tối đa). Chưa có số → 0 điểm, mất đủ trọng số. Chỉ tiêu "%" cao-tốt bị chặn trần 100%.</li>' +
        '<li>Xếp hạng theo <b>điểm quy đổi thang 100</b> = điểm đạt ÷ tổng trọng số × 100, nên các khối có tổng trọng số khác nhau vẫn so sánh công bằng.</li>' +
        '<li>Chỉ tiêu <b>quản trị</b> (VD dư nợ BQ, nguồn vốn BQ) là chỉ tiêu không chấm điểm KPI: chỉ theo dõi KH/TH/%HT phục vụ điều hành.</li></ul>' +
        '<h3>4. Theo dõi & báo cáo</h3><ul><li><b>Tổng quan</b>: điểm CN, chỉ tiêu CN, điểm các phòng, cảnh báo, nhận định tự sinh cho giao ban.</li>' +
        '<li><b>Ma trận chỉ tiêu</b>: nhìn một lượt phòng nào yếu chỉ tiêu nào. <b>Thẻ điểm KPI phòng</b>: chi tiết, ghi nhận xét/giải pháp, in hoặc xuất Excel.</li>' +
        '<li><b>Theo dõi chỉ tiêu</b> (chỉ để theo dõi): một chỉ tiêu qua các phòng — <b>So sánh kỳ</b> (so tháng trước, đầu năm, cùng kỳ năm trước; ± và %; tỷ trọng; xếp hạng mức tăng), <b>Diễn biến 12 tháng</b> (số liệu / tăng giảm / %HT từng phòng, so cùng kỳ), <b>Kế hoạch & điểm</b>. Chỉ tiêu số dư so với đầu năm; chỉ tiêu lũy kế xem phát sinh trong tháng. Cần số năm trước: chọn năm trước ở góc trên để nhập, hoặc nạp file thô cũ.</li></ul>' +
        '<h3>5. Lưu ý</h3><ul><li>Ứng dụng chạy offline hoàn toàn, không gửi dữ liệu ra ngoài. Mã PIN chỉ để tránh sửa nhầm, không thay thế phân quyền mạng — hãy phân quyền ghi thư mục Data trên ổ mạng cho đúng người.</li>' +
        '<li>Sao lưu tệp JSON cuối mỗi tháng (Dữ liệu & cài đặt → Tải bản sao lưu).</li></ul>' +
        '<p class="muted small">Phiên bản ' + KPI_CFG.PHIEN_BAN + ' (' + KPI_CFG.NGAY_PHAT_HANH + ') · Phát triển bởi Phòng TCTH - Chi nhánh Bắc Nghệ An.</p></div>';
    }
  };
})(window);
