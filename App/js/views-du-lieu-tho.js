/* MÀN HÌNH "TÍNH TỪ DỮ LIỆU THÔ" — nạp file báo cáo thô (BCCV, BCNV, sao kê, danh sách KH…), soạn & lưu công thức,
 * ghép mã phòng, xem trước rồi ghi thẳng vào kế hoạch/thực hiện của kỳ đang chọn. Chạy nhiều công thức trên 1 file một lần. */
(function (root) {
  var esc = UI.esc, num = UI.num, isNum = UI.isNum, CN = KPI_CFG.MA_CN, CT = root.CONG_THUC;
  var VIEWS = root.VIEWS = root.VIEWS || {};
  var CHIA = [[1, 'Giữ nguyên'], [1000, '÷ 1.000 (đồng → nghìn)'], [1e6, '÷ 1.000.000 (đồng → triệu đồng)'], [1e9, '÷ 1.000.000.000 (đồng → tỷ)']];

  function S(A) { return A.tf || (A.tf = { file: null, sheets: null, sheet: null, dong: 0, b: null, draft: null, kq: null, chon: {} }); }
  function moi() { return { id: 'CT' + Date.now().toString(36), ten: 'Công thức mới', ma_ct: '', loai: 'a', cot_dv: '', loc: [{ cot: 'Ma chi nhanh', dk: 'bang', gt: STORE.state.settings.ma_chi_nhanh || '444' }], ham: 'tong', cot_gt: '', loc_tu: [], chia: 1e6, tru_moc: '', moc_ct: '', moc_nhap: {}, ghi_cn: true }; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function ctx(A) {
    var M = STORE.model(), ky = A.ky;
    return { don_vi: STORE.state.don_vi, moc: function (ct, dv) { return M.val('a', ct, dv, ky.nam - 1, 12); } };
  }
  function opt(list, sel) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(sel) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function cotSel(st, name, val, rong) {
    if (st.b) {
      var co = st.b.hdr.some(function (h) { return CT.khoa(h) === CT.khoa(val); });
      return '<select name="' + name + '">' + (rong ? '<option value="">' + esc(rong) + '</option>' : '<option value="">— chọn cột —</option>') +
        (val && !co ? '<option value="' + esc(val) + '" selected>⚠ ' + esc(val) + ' (không có trong file)</option>' : '') +
        st.b.hdr.map(function (h) { return '<option value="' + esc(h) + '"' + (CT.khoa(h) === CT.khoa(val) && co ? ' selected' : '') + '>' + esc(h) + '</option>'; }).join('') + '</select>';
    }
    return '<input name="' + name + '" value="' + esc(val || '') + '" list="dl-cot" placeholder="' + esc(rong || 'Tên cột trong file') + '">';
  }
  function dkRows(st, list, kind) {
    return (list || []).map(function (c, i) {
      var noGt = c.dk === 'co_gt' || c.dk === 'trong';
      return '<div class="dk-row" data-kind="' + kind + '" data-i="' + i + '">' + cotSel(st, 'cot', c.cot) +
        '<select name="dk">' + opt(Object.keys(CT.DK).map(function (k) { return [k, CT.DK[k]]; }), c.dk) + '</select>' +
        '<input name="gt" value="' + esc(c.gt || '') + '" placeholder="' + (/ds/.test(c.dk) ? 'nhiều giá trị cách nhau ;' : 'giá trị') + '"' + (noGt ? ' disabled' : '') + '>' +
        '<button class="icon-btn" data-act="xoa-dk" title="Bỏ điều kiện">✕</button></div>';
    }).join('');
  }

  VIEWS['tinh-tu-file'] = {
    html: function (A) {
      var st = S(A), M = STORE.model(), ky = A.ky, ds = STORE.state.cong_thuc || [];
      if (!st.draft) st.draft = clone(ds[0] || moi());
      var f = st.draft;
      var h = '<div class="toolbar"><button class="btn primary" data-act="nap">⤒ Nạp file dữ liệu thô</button>' +
        (st.file ? '<span class="file-chip">📄 ' + esc(st.file) + '</span>' : '<span class="muted small">Excel (.xlsx, .xls) hoặc .csv — dữ liệu chỉ đọc trong trình duyệt, không lưu lại</span>') +
        '<div class="grow"></div><b class="ky-badge">Ghi vào kỳ T' + ky.thang + '/' + ky.nam + '</b></div>';

      // ---- Tệp đang mở
      if (st.b) {
        var shs = Object.keys(st.sheets);
        h += '<div class="card"><div class="card-head"><h3>Dữ liệu trong file</h3><span class="muted">' + num(st.b.rows.length, 0) + ' dòng · ' + st.b.hdr.length + ' cột · tiêu đề ở dòng ' + (st.b.i0 + 1) + '</span></div>' +
          '<div class="toolbar">' + (shs.length > 1 ? '<label class="inline">Trang <select data-act="sheet">' + opt(shs.map(function (x) { return [x, x + ' (' + st.sheets[x].length + ' dòng)']; }), st.sheet) + '</select></label>' : '') +
          '<label class="inline">Dòng tiêu đề <input type="number" min="0" class="w70" data-act="dong" value="' + (st.dong || 0) + '"> <small class="muted">0 = tự dò</small></label></div>' +
          '<div class="tbl-wrap preview"><table class="tbl compact"><thead><tr>' + st.b.hdr.map(function (x, i) { return '<th>' + colLetter(i) + ' · ' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          st.b.rows.slice(0, 5).map(function (r) { return '<tr>' + st.b.hdr.map(function (_, i) { var v = r[i]; return '<td class="nowrap">' + esc(v === null || v === undefined ? '' : (typeof v === 'number' ? num(v) : String(v).slice(0, 40))) + '</td>'; }).join('') + '</tr>'; }).join('') +
          '</tbody></table></div></div>';
        // ---- Chạy nhanh
        h += '<div class="card"><div class="card-head"><h3>Chạy nhanh các công thức đã lưu với file này</h3><button class="btn primary sm" data-act="chay-nhieu">Xem kết quả các công thức đã chọn</button></div><table class="tbl compact"><thead><tr><th></th><th>Công thức</th><th>Ghi vào</th><th>Tình trạng với file</th></tr></thead><tbody>' +
          ds.map(function (x) {
            var th = CT.cotThieu(x, st.b), ind = M.indMap[x.ma_ct], ok = !th.length && ind;
            if (st.chon[x.id] === undefined) st.chon[x.id] = ok && CT.dsNhanDien(x).length > 0;
            return '<tr><td><input type="checkbox" data-chon="' + esc(x.id) + '"' + (st.chon[x.id] && ok ? ' checked' : '') + (ok ? '' : ' disabled') + '></td><td><b>' + esc(x.ten) + '</b></td><td>' + (ind ? (x.loai === 'p' ? 'KH · ' : 'TH · ') + esc(ind.ten_ngan || ind.ten) : '<span class="txt-chua">chưa chọn chỉ tiêu</span>') + '</td><td>' +
              (th.length ? '<span class="txt-cct">không khớp — thiếu cột: ' + esc(th.join(', ')) + '</span>' : CT.dsNhanDien(x).length ? '<span class="txt-dat">✓ đúng loại file, đủ cột</span>' : '<span class="txt-cct">đủ cột, nhưng chưa khai báo nhận diện file — tự chọn nếu đúng</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      } else {
        h += '<div class="card intro"><h3>Tính chỉ tiêu từ báo cáo thô — cách dùng</h3><ol>' +
          '<li>Nạp file báo cáo thô xuất từ hệ thống (VD báo cáo dư nợ BCCV, huy động BCNV, danh sách thẻ, KH…). Ứng dụng tự dò dòng tiêu đề và nhận cột theo <b>tên</b>.</li>' +
          '<li>Chọn hoặc soạn công thức: cột mã phòng → điều kiện lọc → phép tính → chia đơn vị → (trừ mốc đầu năm) → chỉ tiêu đích.</li>' +
          '<li>Bấm <b>Xem kết quả</b>: bảng theo từng phòng/PGD, kèm các mã phòng chưa ghép được — gán một lần, lần sau tự nhận.</li>' +
          '<li>Bấm <b>Ghi vào kỳ</b>. Tháng sau chỉ cần nạp file mới và dùng <b>Chạy nhanh</b> cho tất cả công thức.</li></ol>' +
          '<p class="muted small">Đã có sẵn ' + ds.filter(function (x) { return x.mau; }).length + ' công thức mẫu theo cấu trúc BCCV/BCNV. Tên cột, mã chi nhánh (444) và cách lọc CASA là giả định — kiểm tra lại với file thật.</p></div>';
      }

      // ---- Soạn công thức
      var inds = M.inds;
      h += '<div class="ct-layout"><div class="card ct-list"><div class="card-head"><h3>Công thức</h3><button class="btn sm" data-act="moi">+ Mới</button></div>' +
        ds.map(function (x) { return '<button class="ct-item' + (x.id === f.id ? ' on' : '') + '" data-mo="' + esc(x.id) + '"><b>' + esc(x.ten) + '</b><small>' + esc((M.indMap[x.ma_ct] || {}).ten_ngan || x.ma_ct || '—') + (x.mau ? ' · mẫu' : '') + '</small></button>'; }).join('') +
        (ds.some(function (x) { return x.id === f.id; }) ? '' : '<button class="ct-item on"><b>' + esc(f.ten) + '</b><small>chưa lưu</small></button>') + '</div>';

      h += '<div class="card ct-edit" id="ct-edit"><div class="row2"><label class="field"><span>Tên công thức</span><input name="ten" value="' + esc(f.ten) + '"></label>' +
        '<label class="field"><span>Ghi kết quả vào</span><div class="flex"><select name="loai" class="w120">' + opt([['a', 'Thực hiện'], ['p', 'Kế hoạch']], f.loai) + '</select><select name="ma_ct"><option value="">— chọn chỉ tiêu —</option>' +
        inds.map(function (i) { return '<option value="' + i.ma + '"' + (i.ma === f.ma_ct ? ' selected' : '') + '>' + esc(i.ten) + ' (' + esc(i.dvt) + ')</option>'; }).join('') + '</select></div></label></div>';
      h += '<label class="field"><span>Nhận diện loại file — các cột bắt buộc phải có (cách nhau dấu ;)</span><input name="nhan_dien" value="' + esc(f.nhan_dien || '') + '" list="dl-cot" placeholder="VD: Nhom no (BCCV) · Loai tai khoan (BCNV)"></label>' +
        '<p class="muted small">Tránh chạy nhầm công thức trên file khác loại có cột trùng tên (VD BCCV và BCNV đều có cột Du BQ nam).</p>';
      h += '<div class="step"><b>1</b><div><h4>Gom theo phòng/PGD</h4><label class="field"><span>Cột chứa mã phòng ban / mã DVKD</span>' + cotSel(st, 'cot_dv', f.cot_dv, '— Không chia theo phòng (chỉ ghi Toàn CN) —') + '</label>' +
        '<label class="check"><input type="checkbox" name="ghi_cn"' + (f.ghi_cn ? ' checked' : '') + '> Ghi cả số <b>Toàn CN</b> = tính trên mọi dòng thỏa điều kiện (kể cả dòng chưa ghép được phòng)</label></div></div>';
      h += '<div class="step"><b>2</b><div><h4>Chỉ lấy các dòng thỏa</h4><div id="dk-loc">' + dkRows(st, f.loc, 'loc') + '</div><button class="btn sm" data-act="them-dk" data-kind="loc">+ Thêm điều kiện</button></div></div>';
      h += '<div class="step"><b>3</b><div><h4>Phép tính</h4><div class="row2"><label class="field"><span>Hàm</span><select name="ham">' + opt(Object.keys(CT.HAM).map(function (k) { return [k, CT.HAM[k]]; }), f.ham) + '</select></label>' +
        '<label class="field"><span>' + (f.ham === 'dem' ? 'Cột giá trị (không cần với Đếm số dòng)' : f.ham === 'dem_kt' ? 'Cột cần đếm không trùng (VD Số CIF)' : 'Cột giá trị') + '</span>' + cotSel(st, 'cot_gt', f.cot_gt) + '</label></div>' +
        (f.ham === 'ty_le' ? '<p class="muted small">Tử số = tổng cột giá trị của các dòng thỏa thêm điều kiện dưới đây; mẫu số = tổng của mọi dòng ở bước 2. Kết quả × 100 (đơn vị %).</p><div id="dk-tu">' + dkRows(st, f.loc_tu, 'loc_tu') + '</div><button class="btn sm" data-act="them-dk" data-kind="loc_tu">+ Điều kiện tử số</button>' : '') +
        (f.ham === 'ty_le' || f.ham === 'dem' || f.ham === 'dem_kt' ? '' : '<label class="field"><span>Quy đổi đơn vị</span><select name="chia">' + opt(CHIA, f.chia || 1) + '</select></label>') + '</div></div>';
      h += '<div class="step"><b>4</b><div><h4>Trừ mốc (chỉ tiêu tăng trưởng)</h4><label class="field"><span>Kết quả</span><select name="tru_moc">' + opt([['', 'Không trừ — lấy nguyên kết quả'], ['ct', 'Trừ số thực hiện tháng 12 năm trước của chỉ tiêu…'], ['nhap', 'Trừ số gốc nhập tay từng phòng']], f.tru_moc) + '</select></label>';
      if (f.tru_moc === 'ct') h += '<label class="field"><span>Chỉ tiêu làm mốc (lấy số T12/' + (ky.nam - 1) + ')</span><select name="moc_ct"><option value="">— chọn —</option>' + inds.map(function (i) { return '<option value="' + i.ma + '"' + (i.ma === f.moc_ct ? ' selected' : '') + '>' + esc(i.ten) + '</option>'; }).join('') + '</select></label>';
      if (f.tru_moc === 'nhap') h += '<div class="moc-grid">' + [{ ma: CN, ten_ngan: 'Toàn CN' }].concat(M.units).map(function (u) { var v = (f.moc_nhap || {})[u.ma]; return '<label><span>' + esc(u.ten_ngan || u.ten) + '</span><input data-moc="' + u.ma + '" value="' + (isNum(v) ? esc(String(v).replace('.', ',')) : '') + '" inputmode="decimal"></label>'; }).join('') + '</div>';
      h += '</div></div>';
      h += '<p class="dien-giai" id="dien-giai">' + esc(CT.dienGiai(f, (M.indMap[f.ma_ct] || {}).ten)) + '</p>' +
        '<div class="btns"><button class="btn primary" data-act="chay"' + (st.b ? '' : ' disabled title="Nạp file trước"') + '>▶ Xem kết quả</button><button class="btn" data-act="luu">Lưu công thức</button><button class="btn" data-act="nhan-ban">Nhân bản</button>' +
        (ds.some(function (x) { return x.id === f.id; }) ? '<button class="btn danger-ghost" data-act="xoa">Xoá</button>' : '') + '</div></div></div>';

      // ---- Kết quả
      if (st.kq && st.kq.id === f.id) h += ketQuaHtml(st.kq.r, f, M, ky);
      var cols = {}; ds.forEach(function (x) { [x.cot_dv, x.cot_gt].concat((x.loc || []).concat(x.loc_tu || []).map(function (c) { return c.cot; })).forEach(function (c) { if (c) cols[c] = 1; }); });
      h += '<datalist id="dl-cot">' + Object.keys(cols).map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>';
      return h;
    },
    mount: function (v, A) {
      var st = S(A), ed = v.querySelector('#ct-edit');
      function doc() {   // đọc form → bản nháp
        var f = st.draft, g = function (n) { var el = ed.querySelector('[name="' + n + '"]'); return el ? (el.type === 'checkbox' ? el.checked : el.value) : undefined; };
        ['ten', 'nhan_dien', 'loai', 'ma_ct', 'cot_dv', 'ham', 'cot_gt', 'tru_moc', 'moc_ct'].forEach(function (n) { var x = g(n); if (x !== undefined) f[n] = x; });
        var c = g('chia'); if (c !== undefined) f.chia = +c; f.ghi_cn = !!g('ghi_cn');
        ['loc', 'loc_tu'].forEach(function (k) {
          var rows = ed.querySelectorAll('.dk-row[data-kind="' + k + '"]'); if (!rows.length && k === 'loc_tu' && f.ham !== 'ty_le') return;
          f[k] = [].map.call(rows, function (r) { return { cot: r.querySelector('[name=cot]').value, dk: r.querySelector('[name=dk]').value, gt: r.querySelector('[name=gt]').value }; });
        });
        var mocs = ed.querySelectorAll('[data-moc]'); if (mocs.length) { f.moc_nhap = {}; mocs.forEach(function (i) { var x = UI.parse(i.value); if (isNum(x)) f.moc_nhap[i.dataset.moc] = x; }); }
        return f;
      }
      ed.addEventListener('input', UI.debounce(function () { doc(); var M = STORE.model(); v.querySelector('#dien-giai').textContent = CT.dienGiai(st.draft, (M.indMap[st.draft.ma_ct] || {}).ten); }, 200));
      ed.addEventListener('change', function (e) { if (/^(ham|tru_moc|dk)$/.test(e.target.name)) { doc(); APP.render(); } });
      v.querySelector('.page').addEventListener('click', function (e) {
        var b = e.target.closest('[data-act],[data-mo],[data-chon]'); if (!b) return;
        if (b.dataset.chon) { st.chon[b.dataset.chon] = b.checked; return; }
        if (b.dataset.mo) { st.draft = clone(STORE.state.cong_thuc.filter(function (x) { return x.id === b.dataset.mo; })[0]); st.kq = null; APP.render(); return; }
        var act = b.dataset.act;
        if (act === 'nap') return napFile(A);
        if (act === 'moi') { st.draft = moi(); st.kq = null; return APP.render(); }
        if (act === 'them-dk') { doc(); st.draft[b.dataset.kind] = (st.draft[b.dataset.kind] || []).concat([{ cot: '', dk: 'bang', gt: '' }]); return APP.render(); }
        if (act === 'xoa-dk') { var row = b.closest('.dk-row'); row.remove(); doc(); return APP.render(); }
        if (act === 'chay') { doc(); return chayMot(A); }
        if (act === 'luu') { doc(); return luu(st.draft); }
        if (act === 'nhan-ban') { doc(); st.draft = clone(st.draft); st.draft.id = 'CT' + Date.now().toString(36); st.draft.ten += ' (bản sao)'; delete st.draft.mau; st.kq = null; return APP.render(); }
        if (act === 'xoa') return UI.confirm('Xoá công thức', 'Xoá công thức "' + esc(st.draft.ten) + '"? Số đã ghi vào chỉ tiêu không bị xoá.', 'Xoá', true).then(function (ok) {
          if (!ok) return; STORE.setDanhMuc({ cong_thuc: STORE.state.cong_thuc.filter(function (x) { return x.id !== st.draft.id; }) }, 'Xoá công thức ' + st.draft.ten); st.draft = null; st.kq = null; });
        if (act === 'chay-nhieu') return chayNhieu(A);
        if (act === 'ghi') return ghi(A);
        if (act === 'ghep') return ghep(A, v);
      });
      var shSel = v.querySelector('[data-act=sheet]'); if (shSel) shSel.onchange = function () { st.sheet = this.value; st.dong = 0; dungBang(st); st.kq = null; APP.render(); };
      var dg = v.querySelector('[data-act=dong]'); if (dg) dg.onchange = function () { st.dong = Math.max(0, +this.value || 0); dungBang(st); st.kq = null; APP.render(); };
    }
  };

  function colLetter(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function dungBang(st) {
    st.b = CT.bang(st.sheets[st.sheet] || [], st.dong);
    if (!st.b) UI.toast('Không dò được dòng tiêu đề ở trang "' + st.sheet + '". Nhập số dòng tiêu đề.', 'err');
  }

  function napFile(A) {
    UI.pickFile('.xlsx,.xls,.xlsm,.xlsb,.csv').then(function (file) {
      if (!file) return;
      UI.toast('Đang đọc ' + file.name + ' (' + Math.round(file.size / 1024) + ' KB)…');
      var t0 = performance.now();
      Promise.all([UI.lib('xlsx'), file.arrayBuffer()]).then(function (r) {
        return new Promise(function (ok) { setTimeout(function () { ok(r); }, 30); });
      }).then(function (r) {
        var XLSX = r[0], wb = XLSX.read(r[1], { type: 'array', dense: true }), st = S(A);
        st.sheets = {}; var best = null, n = -1;
        wb.SheetNames.forEach(function (sn) {
          var aoa = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: true, defval: null, blankrows: true });
          st.sheets[sn] = aoa; if (aoa.length > n) { n = aoa.length; best = sn; }
        });
        st.file = file.name; st.sheet = best; st.dong = 0; st.kq = null; st.chon = {};
        dungBang(st);
        UI.toast('Đã đọc ' + file.name + ': ' + (st.b ? num(st.b.rows.length, 0) + ' dòng' : 'chưa nhận ra tiêu đề') + ' trong ' + Math.round(performance.now() - t0) + ' ms.', 'ok');
        APP.render();
      }).catch(function (e) { console.error(e); UI.toast('Không đọc được file: ' + e.message, 'err'); });
    });
  }

  function kiemTra(f) {
    if (!f.ma_ct) return 'Chưa chọn chỉ tiêu để ghi kết quả.';
    if (f.tru_moc === 'ct' && !f.moc_ct) return 'Chưa chọn chỉ tiêu làm mốc.';
    return '';
  }
  function luu(f) {
    var e = kiemTra(f); if (e) { UI.toast(e, 'err'); return; }
    var ds = (STORE.state.cong_thuc || []).slice(), i = ds.findIndex(function (x) { return x.id === f.id; }), x = clone(f);
    x.luc = Date.now(); delete x.mau;
    if (i >= 0) ds[i] = x; else ds.push(x);
    STORE.setDanhMuc({ cong_thuc: ds }, 'Lưu công thức ' + f.ten); UI.toast('Đã lưu công thức.', 'ok');
  }
  function chayMot(A) {
    var st = S(A), f = st.draft, e = kiemTra(f);
    if (e) { UI.toast(e, 'err'); return; }
    var t0 = performance.now(), r = CT.chay(f, st.b, ctx(A));
    if (!r.ok) { UI.toast(r.loi.join(' '), 'err'); return; }
    st.kq = { id: f.id, r: r, ms: performance.now() - t0 };
    APP.render();
    setTimeout(function () { var el = document.getElementById('ket-qua'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
  }

  function ketQuaHtml(r, f, M, ky) {
    var ind = M.indMap[f.ma_ct] || { dvt: '' }, k = f.loai === 'p' ? 'p' : 'a', thieuMoc = 0;
    var h = '<div class="card" id="ket-qua"><div class="card-head"><h3>Kết quả: ' + esc(f.ten) + '</h3><span class="muted">' + num(r.dong_loc, 0) + '/' + num(r.tong_dong, 0) + ' dòng thỏa điều kiện</span></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Đơn vị</th><th class="r">Số dòng</th><th class="r">Giá trị tính' + (f.tru_moc ? '' : '') + '</th>' + (f.tru_moc ? '<th class="r">Mốc trừ</th>' : '') + '<th class="r">Sẽ ghi (' + esc(ind.dvt) + ')</th><th class="r">Số đang có T' + ky.thang + '</th><th class="r">Chênh lệch</th></tr></thead><tbody>';
    var dong = function (ma, ten, x, cls) {
      var cu = STORE.getRaw(k, f.ma_ct, ma, ky.nam, ky.thang);
      if (x && x.thieu_moc) thieuMoc++;
      return '<tr class="' + (cls || '') + '"><td><b>' + esc(ten) + '</b></td><td class="r num">' + (x ? num(x.n, 0) : '–') + '</td><td class="r num">' + (x ? UI.val(x.gia_tri, ind) : '–') + '</td>' +
        (f.tru_moc ? '<td class="r num">' + (x ? (isNum(x.moc) ? UI.val(x.moc, ind) : '<span class="txt-chua">thiếu</span>') : '–') + '</td>' : '') +
        '<td class="r num"><b>' + (x ? UI.val(x.ket_qua, ind) : '–') + '</b></td><td class="r num muted">' + UI.val(cu, ind) + '</td><td class="r num">' + (x && isNum(x.ket_qua) && isNum(cu) ? UI.signed(x.ket_qua - cu, ind) : '–') + '</td></tr>';
    };
    M.units.forEach(function (u) { if (r.theo_dv[u.ma] || M.apDung(f.ma_ct, u.ma)) h += dong(u.ma, u.ten_ngan || u.ten, r.theo_dv[u.ma]); });
    if (r.cn) h += dong(CN, 'Toàn chi nhánh', r.cn, 'cn-row');
    h += '</tbody></table></div>';
    if (thieuMoc) h += '<div class="warn-box">' + thieuMoc + ' đơn vị chưa có số mốc' + (f.tru_moc === 'ct' ? ' (chỉ tiêu ' + esc(f.moc_ct) + ' tháng 12/' + (ky.nam - 1) + ')' : '') + ' — các ô này sẽ KHÔNG được ghi. Nhập số mốc rồi chạy lại.</div>';
    if (f.cot_dv && r.khong_ghep.length) {
      var opts = '<option value="">— bỏ qua —</option>' + M.units.map(function (u) { return '<option value="' + u.ma + '">' + esc(u.ten_ngan || u.ten) + '</option>'; }).join('');
      h += '<h4 class="mt">Mã trong cột «' + esc(f.cot_dv) + '» chưa ghép được phòng/PGD (' + r.khong_ghep.length + ')</h4><p class="muted small">Gán một lần — mã được lưu vào danh mục đơn vị (cột "Mã trong dữ liệu thô") và dùng cho mọi công thức. Mã thuộc chi nhánh/đơn vị khác thì để "bỏ qua".</p>' +
        '<div class="tbl-wrap ghep-wrap"><table class="tbl compact"><thead><tr><th>Mã trong file</th><th class="r">Số dòng</th><th class="r">Giá trị</th><th>Ghép vào</th></tr></thead><tbody>' +
        r.khong_ghep.slice(0, 200).map(function (x) { var gv = f.ham === 'ty_le' || f.ham === 'dem' || f.ham === 'dem_kt' ? x.gia_tri : (isNum(x.gia_tri) ? x.gia_tri / (+f.chia || 1) : null); return '<tr><td><code>' + esc(x.gt) + '</code></td><td class="r num">' + num(x.n, 0) + '</td><td class="r num">' + UI.val(gv, ind) + '</td><td><select data-ghep="' + esc(x.gt) + '">' + opts + '</select></td></tr>'; }).join('') +
        '</tbody></table></div><div class="right"><button class="btn" data-act="ghep">Lưu ghép mã & chạy lại</button></div>';
    }
    h += '<div class="btns mt"><button class="btn primary" data-act="ghi">Ghi vào ' + (k === 'p' ? 'kế hoạch' : 'thực hiện') + ' T' + ky.thang + '/' + ky.nam + '</button><span class="muted small">Ô đang có số sẽ bị thay bằng số mới.</span></div></div>';
    return h;
  }

  function itemsTu(f, r, ky) {
    var k = f.loai === 'p' ? 'p' : 'a', out = [];
    Object.keys(r.theo_dv).forEach(function (ma) { var x = r.theo_dv[ma]; if (x && isNum(x.ket_qua)) out.push({ k: k, ct: f.ma_ct, dv: ma, nam: ky.nam, thang: ky.thang, v: x.ket_qua }); });
    if (r.cn && isNum(r.cn.ket_qua)) out.push({ k: k, ct: f.ma_ct, dv: CN, nam: ky.nam, thang: ky.thang, v: r.cn.ket_qua });
    return out;
  }
  function ghi(A) {
    var st = S(A), f = st.draft, ky = A.ky, items = itemsTu(f, st.kq.r, ky);
    if (!items.length) { UI.toast('Không có số nào để ghi.', 'err'); return; }
    UI.confirm('Ghi kết quả', 'Ghi <b>' + items.length + '</b> ô vào ' + (f.loai === 'p' ? 'kế hoạch' : 'thực hiện') + ' chỉ tiêu <b>' + esc((STORE.model().indMap[f.ma_ct] || {}).ten || f.ma_ct) + '</b> kỳ <b>T' + ky.thang + '/' + ky.nam + '</b>?', 'Ghi').then(function (ok) {
      if (!ok) return;
      var n = STORE.setMany(items, 'Tính từ file ' + st.file + ' · ' + f.ten);
      UI.toast('Đã ghi ' + items.length + ' ô (' + n + ' ô thay đổi).', 'ok');
    });
  }
  function ghep(A, v) {
    var st = S(A), add = {};
    v.querySelectorAll('[data-ghep]').forEach(function (s) { if (s.value) (add[s.value] = add[s.value] || []).push(s.dataset.ghep); });
    if (!Object.keys(add).length) { UI.toast('Chưa gán mã nào.'); return; }
    var dv = STORE.state.don_vi.map(function (u) {
      if (!add[u.ma]) return u;
      var cu = String(u.ma_nguon || '').split(/[;,]/).map(function (x) { return x.trim(); }).filter(Boolean);
      return Object.assign({}, u, { ma_nguon: cu.concat(add[u.ma]).join('; ') });
    });
    STORE.setDanhMuc({ don_vi: dv }, 'Ghép mã dữ liệu thô cho ' + Object.keys(add).join(', '));
    setTimeout(function () { chayMot(A); UI.toast('Đã lưu ghép mã và tính lại.', 'ok'); }, 80);
  }

  function chayNhieu(A) {
    var st = S(A), ky = A.ky, M = STORE.model(), c = ctx(A), all = [], rows = [];
    (STORE.state.cong_thuc || []).forEach(function (f) {
      if (!st.chon[f.id] || CT.cotThieu(f, st.b).length || !M.indMap[f.ma_ct]) return;
      var r = CT.chay(f, st.b, c), it = r.ok ? itemsTu(f, r, ky) : [];
      all = all.concat(it);
      rows.push('<tr><td><b>' + esc(f.ten) + '</b><small class="block muted">' + (f.loai === 'p' ? 'KH · ' : 'TH · ') + esc(M.indMap[f.ma_ct].ten_ngan) + '</small></td><td class="r">' + (r.ok ? num(r.dong_loc, 0) : '–') + '</td><td class="r">' + it.length + '</td><td>' +
        (!r.ok ? '<span class="txt-chua">' + esc(r.loi.join(' ')) + '</span>' : (r.khong_ghep.length ? '<span class="txt-cct">' + r.khong_ghep.length + ' mã chưa ghép</span> ' : '') +
          (Object.keys(r.theo_dv).concat(r.cn ? ['CN'] : []).some(function (m) { var x = m === 'CN' ? r.cn : r.theo_dv[m]; return x && x.thieu_moc; }) ? '<span class="txt-cct">thiếu mốc</span>' : (r.khong_ghep.length ? '' : '<span class="txt-dat">✓</span>'))) + '</td></tr>');
    });
    if (!rows.length) { UI.toast('Chưa chọn công thức nào đủ cột.', 'err'); return; }
    UI.modal('Chạy ' + rows.length + ' công thức trên ' + st.file, '<p>Kỳ ghi: <b>T' + ky.thang + '/' + ky.nam + '</b>. Tổng cộng <b>' + all.length + '</b> ô số.</p><table class="tbl compact"><thead><tr><th>Công thức</th><th class="r">Dòng khớp</th><th class="r">Ô ghi</th><th>Lưu ý</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>' +
      '<p class="muted small">Công thức có mã chưa ghép: mở công thức đó, bấm Xem kết quả để gán mã phòng. Ô thiếu mốc không được ghi.</p>',
      [{ text: 'Huỷ' }, { text: 'Ghi ' + all.length + ' ô', cls: 'primary', onClick: function () { var n = STORE.setMany(all, 'Chạy ' + rows.length + ' công thức trên ' + st.file); UI.toast('Đã ghi ' + all.length + ' ô (' + n + ' ô thay đổi).', 'ok'); } }], { wide: true });
  }
})(window);
