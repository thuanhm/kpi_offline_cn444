/* MÀN HÌNH: Nạp tự động từ thư mục (quản trị) · Diễn biến theo ngày (theo dõi) */
(function (root) {
  var esc = UI.esc, num = UI.num, isNum = UI.isNum, CN = KPI_CFG.MA_CN;
  var VIEWS = root.VIEWS = root.VIEWS || {};
  function opt(list, sel) { return list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(sel) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function gio(t) { return t ? new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '–'; }

  /* ================= NẠP TỰ ĐỘNG ================= */
  VIEWS['nap-tu-dong'] = {
    html: function () {
      var st = STORE.state, s = st.settings.nap, dir = STORE.dir, phu = NAP.phu, M = STORE.model();
      var h = '<div class="cols-2"><div class="card"><h3>Thư mục theo dõi</h3>';
      if (!STORE.hoTroThuMuc()) h += '<div class="warn-box">Trình duyệt không hỗ trợ đọc thư mục. Dùng Chrome hoặc Edge bản mới.</div>';
      h += '<table class="tbl compact kv"><tbody>' +
        '<tr><td>Thư mục chung</td><td>' + (dir ? '<b>' + esc(dir.name) + '\\' + NAP.DIR_THO + '</b> <span class="txt-dat">● đã kết nối</span>' : '<span class="txt-chua">Chưa kết nối Data</span> — <a href="#/du-lieu">kết nối ở Dữ liệu & cài đặt</a>') + '</td></tr>' +
        '<tr><td>Thư mục phụ (máy này)</td><td>' + (phu ? '<b>' + esc(phu.ten) + '</b> ' + (phu.ok ? '<span class="txt-dat">● đọc được</span>' : '<button class="btn sm" data-act="quyen-phu">Cho phép đọc</button>') + ' <button class="btn sm danger-ghost" data-act="bo-phu">Bỏ</button>' : '<button class="btn sm" data-act="chon-phu">Chọn thư mục (VD Downloads)</button> <span class="muted small">không bắt buộc</span>') + '</td></tr>' +
        '<tr><td>Máy này</td><td>' + esc(NAP.MAY) + (STORE.isAdmin() ? ' · quản trị' : '') + '</td></tr>' +
        '<tr><td>Lần quét gần nhất</td><td>' + gio(NAP.lanQuet) + ' · <span class="muted">' + esc(NAP.thongBao || 'chưa quét') + '</span></td></tr></tbody></table>' +
        '<div class="btns mt"><button class="btn primary" data-act="quet"' + (dir && !NAP.dangQuet ? '' : ' disabled') + '>' + (NAP.dangQuet ? 'Đang quét…' : '⟳ Quét ngay') + '</button></div>' +
        '<p class="muted small">Thả file báo cáo thô (BCCV, BCNV…) vào <b>' + (dir ? esc(dir.name) : 'Data') + '\\' + NAP.DIR_THO + '</b>. Ứng dụng chỉ đọc, không sửa/xoá file; tự quét mỗi phút khi đang mở ở chế độ quản trị. Trình duyệt chỉ đọc được thư mục khi ứng dụng đang mở.</p></div>';
      h += '<div class="card"><h3>Cài đặt</h3>' +
        '<label class="check"><input type="checkbox" id="n-bat"' + (s.bat ? ' checked' : '') + '> Tự quét mỗi phút</label>' +
        '<label class="field"><span>Khi phát hiện file mới</span><select id="n-che">' + opt([['hoi', 'Hỏi trước — hiện kết quả, tôi bấm Ghi (khuyên dùng)'], ['tu_ghi', 'Tự ghi ngay — có nhật ký']], s.che_do) + '</select></label>' +
        '<label class="field"><span>Ghi vào số thực hiện tháng</span><select id="n-th">' + opt([['cuoi_thang', 'Chỉ file ngày cuối tháng (chốt số) — ngày giữa tháng chỉ lưu ở Diễn biến theo ngày'], ['luon', 'Luôn cập nhật theo ngày mới nhất trong tháng']], s.ghi_th) + '</select></label>' +
        '<p class="muted small">Ô thực hiện đã <b>sửa tay sau</b> lần ghi tự động được giữ nguyên. Nạp lại file cuối tháng (VD khi có số NII) sẽ cập nhật các ô còn lại. Kỳ ghi lấy theo cột <b>Ngày báo cáo</b> (ngày lớn nhất) hoặc ngày trong tên file.</p>' +
        '<div class="right"><button class="btn primary" data-act="luu">Lưu cài đặt</button></div></div></div>';

      // Hàng chờ
      var cho = NAP.cho;
      h += '<div class="card"><div class="card-head"><h3>Chờ duyệt (' + cho.length + ')</h3>' + (cho.length > 1 ? '<button class="btn sm primary" data-act="ghi-het">Ghi tất cả</button>' : '') + '</div>';
      if (!cho.length) h += '<p class="muted">Không có file nào chờ duyệt.</p>';
      cho.forEach(function (kq) {
        h += '<div class="cho-item"><div class="cho-head"><div><b>📄 ' + esc(kq.ten) + '</b><small class="block muted">' + (kq.nguon === 'phu' ? 'thư mục phụ' : 'thư mục chung') + ' · ngày báo cáo <b>' + NAP.fmtNgay(kq.ngay) + '</b> · ' +
          (kq.ghi_th ? '<span class="txt-dat">sẽ ghi số thực hiện T' + kq.ngay.m + '/' + kq.ngay.y + '</span>' : '<span class="txt-cct">giữa tháng — chỉ lưu số theo ngày</span>') + '</small></div>' +
          '<div class="btns"><button class="btn sm" data-bo="' + esc(kq.key) + '">Bỏ qua</button><button class="btn sm primary" data-ghi="' + esc(kq.key) + '">Ghi</button></div></div>' +
          '<table class="tbl compact"><thead><tr><th>Công thức</th><th>Chỉ tiêu</th><th class="r">Dòng khớp</th><th class="r">Số đơn vị</th><th class="r">Toàn CN</th><th>Lưu ý</th></tr></thead><tbody>' +
          kq.ct.map(function (c) { var ind = M.indMap[c.ma_ct] || {}; var n = Object.keys(c.v).filter(function (k) { return k !== CN; }).length;
            return '<tr><td>' + esc(c.ten) + '</td><td>' + (c.loai === 'p' ? 'KH · ' : 'TH · ') + esc(ind.ten_ngan || c.ma_ct) + '</td><td class="r num">' + num(c.dong, 0) + '</td><td class="r num">' + n + '</td><td class="r num"><b>' + UI.val(c.v[CN], ind) + '</b></td><td>' +
              (c.khong_ghep ? '<span class="txt-cct">' + c.khong_ghep + ' mã phòng chưa ghép</span> ' : '') + (c.thieu_moc ? '<span class="txt-cct">' + c.thieu_moc + ' đơn vị thiếu mốc (không ghi)</span>' : '') + (!c.khong_ghep && !c.thieu_moc ? '<span class="txt-dat">✓</span>' : '') + '</td></tr>'; }).join('') +
          '</tbody></table>' + (kq.loi.length ? '<div class="warn-box small">' + kq.loi.map(esc).join('<br>') + '</div>' : '') + '</div>';
      });
      h += (cho.some(function (k) { return k.ct.some(function (c) { return c.khong_ghep; }); }) ? '<p class="muted small">Mã phòng chưa ghép: mở <a href="#/tinh-tu-file">Tính từ dữ liệu thô</a>, nạp file đó, bấm Xem kết quả để gán mã một lần.</p>' : '') + '</div>';

      // Lịch sử
      var so = NAP.so, ds = so ? Object.keys(so.files).map(function (k) { return Object.assign({ key: k }, so.files[k]); }).sort(function (a, b) { return b.luc - a.luc; }) : [];
      h += '<div class="card"><div class="card-head"><h3>Sổ file đã nạp</h3><span class="muted small">Data\\' + NAP.DIR_NAP + '\\DA_NAP.json</span></div>' +
        (ds.length ? '<div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>File</th><th>Ngày BC</th><th>Kết quả</th><th>Lúc</th><th>Máy</th><th></th></tr></thead><tbody>' +
          ds.slice(0, 60).map(function (x) { return '<tr><td>' + esc(x.key.replace(/^chung\//, '').replace(/^phu\//, '(phụ) ')) + '</td><td class="nowrap">' + esc(x.ngay ? x.ngay.split('-').reverse().join('/') : '–') + '</td><td><span class="chip ' + (x.tt === 'da_ghi' ? 'dat' : 'thieu') + '">' + (x.tt === 'da_ghi' ? 'Đã ghi' : 'Bỏ qua') + '</span> <small class="muted">' + esc(x.ghi_chu || '') + '</small></td><td class="nowrap muted">' + gio(x.luc) + '</td><td class="muted">' + esc(x.may || '') + '</td><td><button class="btn sm" data-lai="' + esc(x.key) + '" title="Xoá khỏi sổ để quét và nạp lại">Nạp lại</button></td></tr>'; }).join('') +
          '</tbody></table></div>' : '<p class="muted">Chưa có file nào.</p>') + '</div>';
      return h;
    },
    mount: function (v) {
      var pg = v.querySelector('.page');
      if (!NAP.so && STORE.dir) NAP.docSo();
      pg.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.ghi) return NAP.duyet(b.dataset.ghi, true);
        if (b.dataset.bo) return NAP.duyet(b.dataset.bo, false);
        if (b.dataset.lai) return NAP.napLai(b.dataset.lai);
        var a = b.dataset.act;
        if (a === 'quet') NAP.quet(true);
        else if (a === 'chon-phu') NAP.chonPhu().catch(function (err) { if (err.name !== 'AbortError') UI.toast(err.message, 'err'); });
        else if (a === 'bo-phu') NAP.boPhu();
        else if (a === 'quyen-phu') NAP.capQuyenPhu();
        else if (a === 'ghi-het') NAP.cho.map(function (k) { return k.key; }).reduce(function (p, k) { return p.then(function () { return NAP.duyet(k, true); }); }, Promise.resolve());
        else if (a === 'luu') { STORE.setSettings({ nap: { bat: v.querySelector('#n-bat').checked, che_do: v.querySelector('#n-che').value, ghi_th: v.querySelector('#n-th').value } }); STORE.log('Sửa cài đặt nạp tự động'); UI.toast('Đã lưu cài đặt nạp tự động.', 'ok'); }
      });
    }
  };

  /* ================= DIỄN BIẾN THEO NGÀY ================= */
  VIEWS['so-ngay'] = {
    html: function (A) {
      var st = STORE.state, M = STORE.model(), days = Object.keys(st.so_ngay).filter(function (d) { return Object.keys(st.so_ngay[d].v || {}).length; }).sort();
      if (!days.length) return '<div class="card empty"><h3>Chưa có số theo ngày</h3><p>Số theo ngày được lưu mỗi khi nạp file báo cáo thô có ngày báo cáo (Nạp tự động từ thư mục). Ảnh của ngày cuối tháng tự chốt thành số thực hiện tháng.</p>' + (STORE.isAdmin() ? '<a class="btn primary" href="#/nap-tu-dong">Thiết lập nạp tự động</a>' : '') + '</div>';
      var cts = {}; days.forEach(function (d) { Object.keys(st.so_ngay[d].v).forEach(function (k) { cts[k.split('|')[0]] = 1; }); });
      var dsCt = M.inds.filter(function (i) { return cts[i.ma]; });
      var ct = A.sn_ct && cts[A.sn_ct] ? A.sn_ct : (dsCt[0] && dsCt[0].ma); A.sn_ct = ct;
      var ind = M.indMap[ct] || { dvt: '' };
      var thangs = []; days.forEach(function (d) { var t = d.slice(0, 7); if (thangs.indexOf(t) < 0 && Object.keys(st.so_ngay[d].v).some(function (k) { return k.indexOf(ct + '|') === 0; })) thangs.push(t); });
      var th = A.sn_th && thangs.indexOf(A.sn_th) >= 0 ? A.sn_th : thangs[thangs.length - 1]; A.sn_th = th;
      var dd = days.filter(function (d) { return d.indexOf(th) === 0 && Object.keys(st.so_ngay[d].v).some(function (k) { return k.indexOf(ct + '|') === 0; }); });
      var y = +th.slice(0, 4), m = +th.slice(5, 7);
      var h = '<div class="toolbar"><select id="sn-ct" class="sel-lg">' + opt(dsCt.map(function (i) { return [i.ma, i.ten]; }), ct) + '</select>' +
        '<select id="sn-th" class="sel-lg" style="min-width:160px">' + opt(thangs.map(function (t) { return [t, 'Tháng ' + (+t.slice(5)) + '/' + t.slice(0, 4)]; }), th) + '</select></div>';
      var dvs = [{ ma: CN, ten_ngan: 'Toàn chi nhánh' }].concat(M.units).filter(function (u) { return dd.some(function (d) { return isNum(st.so_ngay[d].v[ct + '|' + u.ma]); }); });
      h += '<div class="card"><div class="card-head"><h3>' + esc(ind.ten || ct) + ' — tháng ' + m + '/' + y + '</h3><span class="muted">' + dd.length + ' ngày có số · ĐVT ' + esc(ind.dvt) + '</span></div><div class="chart h300"><canvas id="c-ngay"></canvas></div></div>';
      h += '<div class="card p0"><div class="tbl-wrap"><table class="tbl daily"><thead><tr><th>Đơn vị</th>' + dd.map(function (d) { return '<th class="r">' + d.slice(8) + '/' + d.slice(5, 7) + (STORE.isAdmin() ? ' <button class="icon-btn" data-xoa-ngay="' + d + '" title="Xoá số ngày ' + d.split('-').reverse().join('/') + '">✕</button>' : '') + '</th>'; }).join('') + '<th class="r">Δ trong tháng</th><th class="r">KH tháng</th><th class="r">% KH</th></tr></thead><tbody>';
      dvs.forEach(function (u) {
        var adj = M.dc(ct, u.ma, y, m) + (u.ma === CN ? M.dcCnTuPhong(ct, y, m) : 0);
        var vals = dd.map(function (d) { var x = st.so_ngay[d].v[ct + '|' + u.ma]; return isNum(x) ? x + adj : null; });
        var dau = vals.filter(isNum)[0], cuoi = vals.filter(isNum).slice(-1)[0], kh = M.val('p', ct, u.ma, y, m);
        var r = isNum(cuoi) && isNum(kh) && kh ? (ind.huong === 'thap_tot' ? (cuoi ? kh / cuoi : null) : cuoi / kh) : null;
        h += '<tr' + (u.ma === CN ? ' class="cn-row"' : '') + ' data-dv="' + u.ma + '"><td><b>' + esc(u.ten_ngan || u.ten) + '</b></td>' + vals.map(function (x, i) {
          var p = i ? vals[i - 1] : null, c = isNum(x) && isNum(p) ? (x > p ? 'up' : x < p ? 'down' : '') : '';
          return '<td class="r num ' + c + '">' + UI.val(x, ind) + '</td>'; }).join('') +
          '<td class="r num">' + (isNum(dau) && isNum(cuoi) ? UI.signed(cuoi - dau, ind) : '–') + '</td><td class="r num muted">' + UI.val(kh, ind) + '</td><td class="r num txt-' + UI.htClass(r, M.ng) + '">' + UI.pct(r) + '</td></tr>';
      });
      h += '</tbody></table></div></div><p class="muted small">Số theo ngày lấy từ các file báo cáo thô đã nạp. Ngày cuối tháng tự chốt thành số thực hiện tháng (xem cài đặt ở Nạp tự động). Số đã cộng/trừ các điều chỉnh thủ công của tháng. Bấm một dòng để vẽ đơn vị đó lên biểu đồ.</p>';
      return h;
    },
    mount: function (v, A) {
      var s1 = v.querySelector('#sn-ct'); if (!s1) return;
      s1.onchange = function () { A.sn_ct = this.value; A.sn_dv = null; APP.render(); };
      v.querySelector('#sn-th').onchange = function () { A.sn_th = this.value; APP.render(); };
      v.querySelectorAll('[data-xoa-ngay]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); var d = b.dataset.xoaNgay; UI.confirm('Xoá số theo ngày', 'Xoá toàn bộ số theo ngày <b>' + d.split('-').reverse().join('/') + '</b>? (Không ảnh hưởng số thực hiện tháng đã ghi.) Muốn nạp lại: vào Nạp tự động → "Nạp lại" file tương ứng.', 'Xoá', true).then(function (ok) { if (ok) { STORE.xoaNgay(d); UI.toast('Đã xoá số ngày ' + d.split('-').reverse().join('/') + '.', 'ok'); } }); }; });
      v.querySelectorAll('tr[data-dv]').forEach(function (tr) { tr.onclick = function () { A.sn_dv = tr.dataset.dv; APP.render(); }; });
      var st = STORE.state, M = STORE.model(), ct = A.sn_ct, th = A.sn_th, ind = M.indMap[ct] || {}, y = +th.slice(0, 4), m = +th.slice(5, 7);
      var dd = Object.keys(st.so_ngay).sort().filter(function (d) { return d.indexOf(th) === 0 && Object.keys(st.so_ngay[d].v).some(function (k) { return k.indexOf(ct + '|') === 0; }); });
      var dv = A.sn_dv || CN, ten = dv === CN ? 'Toàn chi nhánh' : ((M.unitMap[dv] || {}).ten_ngan || dv), kh = M.val('p', ct, dv, y, m);
      var adj = M.dc(ct, dv, y, m) + (dv === CN ? M.dcCnTuPhong(ct, y, m) : 0);
      var ds = [{ label: ten, data: dd.map(function (d) { var x = st.so_ngay[d].v[ct + '|' + dv]; return isNum(x) ? x + adj : null; }), borderColor: UI.cssVar('--primary'), backgroundColor: 'rgba(14,76,146,.08)', fill: true, tension: .25, pointRadius: 3 }];
      if (isNum(kh)) ds.push({ label: 'KH tháng', data: dd.map(function () { return kh; }), borderColor: UI.cssVar('--accent'), borderDash: [5, 4], pointRadius: 0 });
      UI.chart(v.querySelector('#c-ngay'), { type: 'line', data: { labels: dd.map(function (d) { return d.slice(8) + '/' + d.slice(5, 7); }), datasets: ds },
        options: { spanGaps: true, plugins: { legend: { position: 'bottom' }, nhanSo: { fmt: function (v) { return UI.val(v, ind); } }, tooltip: { callbacks: { label: function (x) { return ' ' + x.dataset.label + ': ' + UI.val(x.raw, ind); } } } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#eef2f7' }, ticks: { callback: function (t) { return num(t); } } } } } });
    }
  };

  NAP.on(function () {
    if (!root.APP) return;
    if (APP.route && APP.route.id === 'nap-tu-dong') APP.render();
    var b = document.getElementById('nap-badge'); if (b) { b.textContent = NAP.cho.length; b.style.display = NAP.cho.length ? '' : 'none'; }
  });
})(window);
