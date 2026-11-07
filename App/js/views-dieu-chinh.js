/* MÀN HÌNH ĐIỀU CHỈNH SỐ LIỆU — cộng/trừ thủ công trên số thực hiện (thường là Dư nợ BQ, Nguồn vốn BQ, CASA BQ sau khi tính từ file thô).
 * Nhập trên 1 BẢNG: dòng Toàn chi nhánh + mọi phòng/PGD, mỗi dòng 1 ô số điều chỉnh (+/-), số sau điều chỉnh tính ngay; lưu một lần.
 * Số gốc (từ file / nhập) giữ nguyên; điều chỉnh lưu thành danh sách có lý do, căn cứ → nạp lại file không mất điều chỉnh.
 * Mỗi điều chỉnh chỉ tác động đúng đơn vị của dòng đó; khi số Toàn CN là tổng các phòng thì tự gồm điều chỉnh của phòng. */
(function (root) {
  var esc = UI.esc, isNum = UI.isNum, CN = KPI_CFG.MA_CN;
  var VIEWS = root.VIEWS = root.VIEWS || {};
  var KEM_MAC_DINH = { DU_NO_BQ: ['DU_NO_TT'], NGUON_VON_BQ: ['NGUON_VON_TT'] };
  function opt(list, sel) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(sel) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function fmtIn(v) { return isNum(v) ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(v) : ''; }

  /* Chỉ tiêu Δ tăng trưởng đi kèm: từ công thức có "trừ mốc = chỉ tiêu này" + mặc định */
  function kemCua(ct) {
    var out = (KEM_MAC_DINH[ct] || []).slice();
    (STORE.state.cong_thuc || []).forEach(function (f) { if (f.tru_moc === 'ct' && f.moc_ct === ct && f.ma_ct && out.indexOf(f.ma_ct) < 0) out.push(f.ma_ct); });
    var M = STORE.model(); return out.filter(function (m) { return M.indMap[m]; });
  }
  function nhomCua(x) { return x.nhom || x.id; }

  /* Số gốc / điều chỉnh đang có / số dùng của 1 dòng */
  function dong(M, ct, dv, nam, thang) {
    var dung = M.val('a', ct, dv, nam, thang), goc = M.goc('a', ct, dv, nam, thang), d;
    if (isNum(dung) && isNum(goc)) d = dung - goc;
    else if (dv === CN) {   // CN là tổng các phòng
      d = M.dc(ct, CN, nam, thang);
      M.units.forEach(function (x) { if (M.goc('a', ct, x.ma, nam, thang) !== null) d += M.dc(ct, x.ma, nam, thang); });
      goc = isNum(dung) ? dung - d : null;
    } else d = M.dc(ct, dv, nam, thang);
    return { goc: goc, dc: Math.round((d || 0) * 1e4) / 1e4, dung: dung, tong: dv === CN && M.goc('a', ct, CN, nam, thang) === null };
  }

  VIEWS['dieu-chinh'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, inds = M.inds.filter(function (i) { return i.dvt !== '%' && i.huong !== 'nhap_ty_le'; });
      var f = A.dcf || (A.dcf = { ct: M.indMap.DU_NO_BQ ? 'DU_NO_BQ' : (inds[0] && inds[0].ma), thang: ky.thang, pham_vi: 'thang', ly_do: '', can_cu: '', kem: null, nhap: {}, ly_do_dv: {} });
      if (!M.indMap[f.ct]) f.ct = inds[0] && inds[0].ma;
      var kem = kemCua(f.ct); if (!f.kem || f.kem_ct !== f.ct) { f.kem = kem.slice(); f.kem_ct = f.ct; }
      var ind = M.indMap[f.ct] || { dvt: '' };

      var h = '<div class="card"><form id="dc-form" autocomplete="off"><div class="dc-head">' +
        '<label class="field"><span>Chỉ tiêu (số thực hiện)</span><select name="ct">' + opt(inds.map(function (i) { return [i.ma, i.ten + ' (' + i.dvt + ')']; }), f.ct) + '</select></label>' +
        '<label class="field"><span>Áp dụng từ tháng</span><select name="thang">' + opt([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (t) { return [t, 'Tháng ' + t + '/' + ky.nam]; }), f.thang) + '</select></label>' +
        '<label class="field"><span>Phạm vi</span><select name="pham_vi">' + opt([['thang', 'Chỉ tháng này'], ['den_cuoi_nam', 'Từ tháng này đến hết năm']], f.pham_vi) + '</select></label></div>' +
        (kem.length ? '<div class="dc-kem"><span class="muted small">Áp dụng đồng thời cho:</span> ' + kem.map(function (m) { return '<label class="check inline-check"><input type="checkbox" name="kem" value="' + m + '"' + (f.kem.indexOf(m) >= 0 ? ' checked' : '') + '> ' + esc(M.indMap[m].ten_ngan || M.indMap[m].ten) + '</label>'; }).join('') + '</div>' : '') +
        '<div class="row2"><label class="field"><span>Lý do chung (dùng cho các dòng không ghi lý do riêng)</span><input name="ly_do" value="' + esc(f.ly_do) + '" placeholder="VD điều chỉnh khoản vay hạch toán sai mã phòng"></label>' +
        '<label class="field"><span>Căn cứ / số văn bản</span><input name="can_cu" value="' + esc(f.can_cu) + '" placeholder="VD QĐ 123/QĐ-CNBNA ngày 01/11/2026"></label></div>';

      // Bảng nhập
      var dvs = [{ ma: CN, ten_ngan: 'Toàn chi nhánh' }].concat(M.units);
      h += '<div class="tbl-wrap"><table class="tbl dc-grid" id="dc-grid"><thead><tr><th>Đơn vị</th><th class="r">Số gốc T' + f.thang + '</th><th class="r">Đã điều chỉnh</th><th class="r dc-in-h">Điều chỉnh thêm (+/−)</th><th class="r">Số sau điều chỉnh</th><th>Lý do riêng (nếu khác lý do chung)</th></tr></thead><tbody>';
      dvs.forEach(function (u, i) {
        var ap = u.ma === CN || M.apDung(f.ct, u.ma), r = dong(M, f.ct, u.ma, ky.nam, f.thang), nv = f.nhap[u.ma];
        h += '<tr data-dv="' + u.ma + '"' + (u.ma === CN ? ' class="cn-row"' : '') + (ap ? '' : ' class="na-row"') + '><td><b>' + esc(u.ten_ngan || u.ten) + '</b>' + (r.tong ? '<small class="muted"> Σ phòng</small>' : '') + (ap ? '' : '<small class="muted"> · không áp dụng</small>') + '</td>' +
          '<td class="r num">' + UI.val(r.goc, ind) + '</td><td class="r num ' + (r.dc > 0 ? 'txt-dat' : r.dc < 0 ? 'txt-chua' : 'muted') + '">' + (r.dc ? UI.signed(r.dc, ind) : '–') + '</td>' +
          '<td class="r"><input class="cell dc-in" data-i="' + i + '" data-dv="' + u.ma + '" value="' + esc(ap ? (nv || '') : '') + '" inputmode="decimal" placeholder="' + (ap ? '0' : '·') + '"' + (ap ? '' : ' disabled') + '></td>' +
          '<td class="r num"><b class="dc-sau" data-tong="' + (r.tong ? 1 : '') + '" data-dung="' + (isNum(r.dung) ? r.dung : '') + '">' + UI.val(r.dung, ind) + '</b></td>' +
          '<td><input class="dc-ly" data-dv="' + u.ma + '" value="' + esc(f.ly_do_dv[u.ma] || '') + '" placeholder="—"></td></tr>';
      });
      h += '</tbody><tfoot><tr><td><b>Cộng các phòng/PGD</b></td><td></td><td></td><td class="r num" id="dc-tong"></td><td colspan="2" class="muted small" id="dc-dem"></td></tr></tfoot></table></div>' +
        '<p class="muted small">Gõ số rồi Enter để xuống dòng; dán cả cột số từ Excel vào ô đầu. Số âm để trừ. Dòng <b>Toàn chi nhánh</b> chỉ đổi số CN; khi số CN là tổng các phòng (Σ phòng) thì đã tự gồm điều chỉnh của phòng — không nhập lặp ở dòng CN.</p>' +
        '<div class="btns right-btns"><button type="button" class="btn" data-act="xoa-nhap">Xoá số đang nhập</button><button type="button" class="btn primary" data-act="luu">Lưu các điều chỉnh</button></div></form></div>';

      // Danh sách điều chỉnh đã lưu
      var ds = STORE.state.dieu_chinh.filter(function (x) { return !x.xoa && x.nam === ky.nam; }), nh = {}, ord = [];
      ds.forEach(function (x) { var k = nhomCua(x) + '|' + x.dv; if (!nh[k]) { nh[k] = []; ord.push(k); } nh[k].push(x); });
      ord.sort(function (a, b) { return nh[b][0].luc - nh[a][0].luc; });
      h += '<div class="card"><div class="card-head"><h3>Các điều chỉnh năm ' + ky.nam + ' (' + ord.length + ')</h3><button class="btn sm" data-act="xuat">⤓ Xuất Excel</button></div>' +
        (ord.length ? '<div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>Áp dụng</th><th>Chỉ tiêu</th><th>Đơn vị</th><th class="r">Số</th><th>Lý do</th><th>Căn cứ</th><th>Nhập lúc</th><th></th></tr></thead><tbody>' +
          ord.map(function (k) {
            var g = nh[k], x = g[0], seen = {}, ctTen = [];
            g.forEach(function (y) { if (!seen[y.ct]) { seen[y.ct] = 1; ctTen.push((M.indMap[y.ct] || {}).ten_ngan || y.ct); } });
            var ind2 = M.indMap[x.ct] || {}, ten = x.dv === CN ? 'Toàn CN' : ((M.unitMap[x.dv] || {}).ten_ngan || x.dv);
            return '<tr><td class="nowrap">T' + x.thang + (x.pham_vi === 'den_cuoi_nam' ? '→T12' : '') + '/' + x.nam + '</td><td>' + esc(ctTen.join(' + ')) + '</td><td>' + esc(ten) + '</td>' +
              '<td class="r num ' + (x.so > 0 ? 'txt-dat' : 'txt-chua') + '">' + UI.signed(x.so, ind2) + '</td><td>' + esc(x.ly_do) + '</td><td class="muted">' + esc(x.can_cu || '') + '</td>' +
              '<td class="muted nowrap">' + new Date(x.luc).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) + '</td>' +
              '<td><button class="icon-btn" data-xoa="' + esc(k) + '" title="Xoá điều chỉnh">✕</button></td></tr>';
          }).join('') + '</tbody></table></div>' : '<p class="muted">Chưa có điều chỉnh nào.</p>') + '</div>';
      return h;
    },
    mount: function (v, A) {
      var M = STORE.model(), form = v.querySelector('#dc-form'), grid = v.querySelector('#dc-grid'), f = A.dcf, ky = A.ky, ind = M.indMap[f.ct] || {};
      function doc() {
        var g = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value : undefined; };
        ['ct', 'pham_vi', 'ly_do', 'can_cu'].forEach(function (n) { var x = g(n); if (x !== undefined) f[n] = x; });
        f.thang = +g('thang') || f.thang;
        var k = form.querySelectorAll('[name=kem]'); if (k.length) f.kem = [].filter.call(k, function (i) { return i.checked; }).map(function (i) { return i.value; });
        f.nhap = {}; grid.querySelectorAll('.dc-in').forEach(function (i) { if (i.value.trim()) f.nhap[i.dataset.dv] = i.value; });
        f.ly_do_dv = {}; grid.querySelectorAll('.dc-ly').forEach(function (i) { if (i.value.trim()) f.ly_do_dv[i.dataset.dv] = i.value; });
      }
      function tinh() {   // cập nhật số sau điều chỉnh + tổng, không vẽ lại
        var tong = 0, dem = 0, loi = 0;
        grid.querySelectorAll('tbody tr').forEach(function (tr) {
          var inp = tr.querySelector('.dc-in'), out = tr.querySelector('.dc-sau'), raw = inp.value.trim(), x = raw ? UI.parse(raw) : 0, dung = out.dataset.dung === '' ? null : +out.dataset.dung;
          inp.classList.toggle('bad', raw !== '' && !(isNum(x)));
          if (raw && !isNum(x)) { loi++; return; }
          tr.classList.toggle('dc-co', !!x);
          out.textContent = UI.val(isNum(dung) ? dung + (x || 0) : null, ind);
          out.className = 'dc-sau ' + (x > 0 ? 'txt-dat' : x < 0 ? 'txt-chua' : '');
          if (x) { dem++; if (tr.dataset.dv !== CN) tong += x; }
        });
        var cn = grid.querySelector('.dc-sau[data-tong="1"]');   // CN = tổng các phòng → cộng luôn số đang nhập ở các phòng
        if (cn && tong) { var d0 = cn.dataset.dung === '' ? null : +cn.dataset.dung, xcn = UI.parse(grid.querySelector('.dc-in[data-dv="' + CN + '"]').value) || 0;
          cn.textContent = UI.val(isNum(d0) ? d0 + tong + xcn : null, ind); cn.className = 'dc-sau ' + (tong + xcn > 0 ? 'txt-dat' : tong + xcn < 0 ? 'txt-chua' : ''); }
        v.querySelector('#dc-tong').innerHTML = tong ? '<b>' + UI.signed(Math.round(tong * 1e4) / 1e4, ind) + '</b>' : '–';
        v.querySelector('#dc-dem').textContent = dem ? dem + ' dòng sẽ được điều chỉnh' + (loi ? ' · ' + loi + ' ô không phải số' : '') : (loi ? loi + ' ô không phải số' : '');
      }
      grid.addEventListener('input', UI.debounce(tinh, 80));
      grid.addEventListener('focusin', function (e) { if (e.target.matches('.dc-in')) e.target.select(); });
      grid.addEventListener('keydown', function (e) {
        if (!e.target.matches('.dc-in') || (e.key !== 'Enter' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
        e.preventDefault();
        var st = e.key === 'ArrowUp' ? -1 : 1, i = +e.target.dataset.i + st, n = grid.querySelector('.dc-in[data-i="' + i + '"]');
        while (n && n.disabled) { i += st; n = grid.querySelector('.dc-in[data-i="' + i + '"]'); }
        if (n) n.focus();
      });
      grid.addEventListener('paste', function (e) {
        if (!e.target.matches('.dc-in')) return;
        var t = (e.clipboardData || window.clipboardData).getData('text'); if (!/\n/.test(t.trim())) return;
        e.preventDefault();
        var lines = t.replace(/\r/g, '').replace(/\n$/, '').split('\n'), i0 = +e.target.dataset.i;
        lines.forEach(function (ln, k) { var n = grid.querySelector('.dc-in[data-i="' + (i0 + k) + '"]'); if (n && !n.disabled) n.value = ln.split('\t')[0].trim(); });
        tinh(); UI.toast('Đã dán ' + Math.min(lines.length, grid.querySelectorAll('.dc-in').length - i0) + ' dòng.', 'ok');
      });
      form.addEventListener('change', function (e) { if (e.target.name === 'ct' || e.target.name === 'thang') { doc(); if (e.target.name === 'ct') { f.nhap = {}; f.ly_do_dv = {}; } APP.render(); } });
      tinh();
      v.querySelector('.page').addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.xoa) {
          var p = b.dataset.xoa.split('|');
          UI.confirm('Xoá điều chỉnh', 'Xoá điều chỉnh này? Số dùng tính KPI quay về số gốc (cộng các điều chỉnh khác).', 'Xoá', true).then(function (ok) {
            if (!ok) return; var t = Date.now(), n = 0;
            STORE.state.dieu_chinh.forEach(function (x) { if (nhomCua(x) === p[0] && x.dv === p[1] && !x.xoa) { x.xoa = true; x.luc = t; n++; } });
            if (n) STORE.touch('Xoá điều chỉnh ' + p[1] + ' (' + p[0] + ')');
            UI.toast('Đã xoá điều chỉnh.', 'ok');
          });
          return;
        }
        if (b.dataset.act === 'xuat') return xuat(A);
        if (b.dataset.act === 'xoa-nhap') { grid.querySelectorAll('.dc-in,.dc-ly').forEach(function (i) { i.value = ''; }); tinh(); return; }
        if (b.dataset.act !== 'luu') return;
        doc();
        var dsDv = Object.keys(f.nhap), list = [], nhom = 'DC' + Date.now().toString(36), cts = [f.ct].concat(f.kem || []), thieuLyDo = [], sai = [];
        dsDv.forEach(function (dv) {
          var so = UI.parse(f.nhap[dv]);
          if (!isNum(so)) { sai.push(dv); return; }
          if (!so) return;
          var ly = (f.ly_do_dv[dv] || f.ly_do || '').trim(); if (!ly) { thieuLyDo.push(dv); return; }
          cts.forEach(function (ct, i) {
            list.push({ id: nhom + '_' + dv + '_' + i, nhom: nhom, ct: ct, dv: dv, so: so, ap_cn: false, nam: ky.nam, thang: f.thang, pham_vi: f.pham_vi, ly_do: ly, can_cu: f.can_cu.trim(), kieu: 'mot', may: root.NAP ? NAP.MAY : '' });
          });
        });
        if (sai.length) { UI.toast('Có ' + sai.length + ' ô không phải số hợp lệ.', 'err'); return; }
        if (thieuLyDo.length) { UI.toast('Nhập lý do chung hoặc lý do riêng cho: ' + thieuLyDo.map(function (d) { return d === CN ? 'Toàn CN' : ((M.unitMap[d] || {}).ten_ngan || d); }).join(', ') + '.', 'err'); return; }
        if (!list.length) { UI.toast('Chưa nhập số điều chỉnh nào.', 'err'); return; }
        var soDv = list.length / cts.length;
        UI.confirm('Lưu điều chỉnh', 'Lưu điều chỉnh <b>' + esc(cts.map(function (c) { return (M.indMap[c] || {}).ten_ngan || c; }).join(' + ')) + '</b> cho <b>' + soDv + '</b> đơn vị, áp dụng T' + f.thang + (f.pham_vi === 'den_cuoi_nam' ? ' đến T12' : '') + '/' + ky.nam + '?', 'Lưu').then(function (ok) {
          if (!ok) return;
          try { STORE.themDieuChinh(list, 'Điều chỉnh ' + cts.join('+') + ' T' + f.thang + '/' + ky.nam + ' cho ' + soDv + ' đơn vị' + (f.ly_do ? ': ' + f.ly_do : '')); }
          catch (e) { UI.toast(e.message, 'err'); return; }   // kỳ đã khoá
          f.nhap = {}; f.ly_do_dv = {};
          UI.toast('Đã lưu điều chỉnh cho ' + soDv + ' đơn vị.', 'ok');
        });
      });
    }
  };

  function xuat(A) {
    UI.lib('xlsx').then(function (XLSX) {
      var M = STORE.model(), ten = function (m) { return m === CN ? 'Toàn CN' : ((M.unitMap[m] || {}).ten || m); };
      var aoa = [['DANH SÁCH ĐIỀU CHỈNH SỐ LIỆU NĂM ' + A.ky.nam + ' — ' + STORE.state.settings.ten_chi_nhanh], [], ['Nhóm', 'Từ tháng', 'Đến tháng', 'Mã chỉ tiêu', 'Chỉ tiêu', 'Mã đơn vị', 'Đơn vị', 'Số điều chỉnh', 'Lý do', 'Căn cứ', 'Nhập lúc']];
      STORE.state.dieu_chinh.filter(function (x) { return !x.xoa && x.nam === A.ky.nam; }).forEach(function (x) {
        aoa.push([x.nhom || x.id, x.thang, x.pham_vi === 'den_cuoi_nam' ? 12 : x.thang, x.ct, (M.indMap[x.ct] || {}).ten || '', x.dv, ten(x.dv), x.so, x.ly_do, x.can_cu || '', new Date(x.luc).toLocaleString('vi-VN')]);
      });
      var wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = [14, 8, 8, 14, 30, 10, 26, 14, 50, 30, 18].map(function (w) { return { wch: w }; });
      XLSX.utils.book_append_sheet(wb, ws, 'DIEU_CHINH'); XLSX.writeFile(wb, 'Dieu_chinh_so_lieu_' + A.ky.nam + '.xlsx');
    });
  }
})(window);
