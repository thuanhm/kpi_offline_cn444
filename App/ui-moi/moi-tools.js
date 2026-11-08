/* MOI-TOOLS — đưa công cụ của các thư viện giao diện cũ sang các màn tự vẽ của giao diện mới:
 *  1) Tải ảnh PNG từng khung (thư viện snapdom, nạp lười qua UI.lib như giao diện cũ) — nút 📷 ở tiêu đề mỗi thẻ;
 *  2) Sắp xếp bảng bằng cách bấm tiêu đề cột (giống Tabulator ở giao diện cũ: 3 trạng thái tăng → giảm → về thứ tự gốc).
 * Chỉ thêm tương tác lên DOM đã vẽ; KHÔNG đổi số liệu. Màn cũ đặt trong vỏ mới đã có sẵn Tabulator/snapdom nên không gắn lại. */
(function (root) {
  'use strict';
  var UI = function () { return root.UI; };

  /* ---------- 1) Tải ảnh PNG ---------- */
  /* biểu tượng máy ảnh dạng SVG nét (đổi theo màu chữ của nút = xanh thương hiệu), thay cho emoji 📷 luôn có màu đen */
  var ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.3-2h5.4L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.4"/></svg>';
  function tenAnh(card) {
    var h = card.querySelector('.moi-head h2'), t = h ? h.textContent : 'khung', d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return (UI().slug(t).slice(0, 60) || 'anh') + '_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
  }
  function taiAnh(card, btn) {
    btn.disabled = true;
    return UI().lib('snapdom').then(function (sd) {
      return sd.download(card, { format: 'png', filename: tenAnh(card), scale: 2, backgroundColor: '#ffffff', exclude: ['.moi-png'] });
    }).then(function () { UI().toast('Đã tải ảnh PNG.', 'ok'); }, function (e) { UI().toast('Không tạo được ảnh: ' + (e && e.message || e), 'err'); }).then(function () { btn.disabled = false; });
  }
  function nutAnh(view) {
    if (!UI() || !UI().lib) return;
    [].forEach.call(view.querySelectorAll('.moi-card'), function (card) {
      var hd = card.querySelector(':scope > .moi-head'); if (!hd || hd.querySelector('.moi-png')) return;
      if (card.querySelector('input, select, textarea')) return;   // thẻ nhập liệu: không chụp
      if (card.closest('[data-no-png]')) return;                    // khung đánh dấu không cần ảnh
      var b = document.createElement('button'); b.type = 'button'; b.className = 'moi-png';
      b.title = 'Tải ảnh PNG của khung này'; b.setAttribute('aria-label', 'Tải ảnh PNG của khung ' + (hd.textContent || '').trim()); b.innerHTML = ICON;
      b.onclick = function (e) { e.stopPropagation(); taiAnh(card, b); };
      /* nút nằm Ở CUỐI hàng tiêu đề, sát sau phần tử điều khiển cuối cùng (nút Biểu đồ/Bảng…); gộp chung một khối không xuống dòng
       * để biểu tượng không bao giờ rơi riêng ra hàng dưới. Thẻ chỉ có tiêu đề thì nút nằm ngay sau tiêu đề. */
      var cuoi = [].filter.call(hd.children, function (c) { return c.tagName !== 'H2'; }).pop();
      if (cuoi) { var g = document.createElement('span'); g.className = 'moi-hend'; hd.insertBefore(g, cuoi); g.appendChild(cuoi); g.appendChild(b); } else hd.appendChild(b);
    });
  }

  /* ---------- 2) Sắp xếp bảng ---------- */
  function so(t) {   // "1.234,5" · "−100,0" · "104,7%" · "+10,0" → số; còn lại null
    var m = /^[+\-−]?\s*\d[\d.,]*/.exec(t); if (!m || /^\d+\/\d+/.test(t)) return null;
    var x = parseFloat(m[0].replace('−', '-').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')); return isFinite(x) ? x : null;
  }
  function sapXep(table, col, dir) {
    var body = table.tBodies[0], rows = [].slice.call(body.rows);
    if (!rows[0].hasAttribute('data-i0')) rows.forEach(function (r, i) { r.setAttribute('data-i0', i); });
    var vals = rows.map(function (r) { return (r.cells[col] ? r.cells[col].textContent : '').trim(); });
    var soHet = vals.every(function (t) { return !t || /^[–—-]$/.test(t) || so(t) !== null; }) && vals.some(function (t) { return so(t) !== null; });
    var key = function (t) { return soHet ? so(t) : t.toLowerCase(); }, rong = function (t) { return !t || /^[–—-]$/.test(t) || (soHet && so(t) === null); };
    var idx = rows.map(function (r, i) { return i; });
    idx.sort(function (a, b) {
      if (dir === 0) return +rows[a].getAttribute('data-i0') - +rows[b].getAttribute('data-i0');
      var ra = rong(vals[a]), rb = rong(vals[b]); if (ra || rb) return ra && rb ? 0 : ra ? 1 : -1;   // ô trống luôn xuống cuối
      var ka = key(vals[a]), kb = key(vals[b]), c = soHet ? ka - kb : String(ka).localeCompare(String(kb), 'vi');
      return dir * c || (+rows[a].getAttribute('data-i0') - +rows[b].getAttribute('data-i0'));
    });
    idx.forEach(function (i) { body.appendChild(rows[i]); });
  }
  function bangSapXep(view) {
    [].forEach.call(view.querySelectorAll('table.vtb-table'), function (t) {
      if (t.__moiSort || !t.tBodies[0] || t.tBodies[0].rows.length < 3 || t.querySelector('tbody input, tbody select')) return;
      t.__moiSort = true; t.classList.add('is-sortable');
      var ths = [].slice.call(t.tHead.rows[0].cells);
      ths.forEach(function (th, i) {
        if (!th.textContent.trim()) return;
        th.classList.add('moi-sortable'); th.tabIndex = 0; th.setAttribute('aria-sort', 'none'); th.title = 'Bấm để sắp xếp (tăng → giảm → về thứ tự gốc)';
        var go = function () {
          var cur = th.getAttribute('aria-sort'), dir = cur === 'none' ? 1 : cur === 'ascending' ? -1 : 0;
          ths.forEach(function (o) { o.setAttribute('aria-sort', 'none'); });
          th.setAttribute('aria-sort', dir === 1 ? 'ascending' : dir === -1 ? 'descending' : 'none');
          sapXep(t, i, dir);
        };
        th.addEventListener('click', go);
        th.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      });
    });
  }

  root.MOI_TOOLS = { attach: function (view) { try { nutAnh(view); bangSapXep(view); } catch (e) { console.error('công cụ giao diện mới', e); } }, so: so };
})(window);
