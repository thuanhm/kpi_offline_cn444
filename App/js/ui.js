/* UI — tiện ích hiển thị dùng chung: định dạng số kiểu Việt Nam, thông báo, hộp thoại, biểu đồ, nạp thư viện khi cần. */
(function (root) {
  var TT = root.KPI_CFG.TRANG_THAI;
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var nfCache = {};
  function nf(d) { return nfCache[d] || (nfCache[d] = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: d, minimumFractionDigits: 0 })); }
  function num(v, d) { if (!isNum(v)) return '–'; if (d === undefined) d = Math.abs(v) >= 100 ? 0 : 2; return nf(d).format(v); }
  function pct(r, d) { return isNum(r) ? nf(d === undefined ? 1 : d).format(r * 100) + '%' : '–'; }
  function val(v, ind) { if (!isNum(v)) return '–'; return ind && ind.dvt === '%' ? nf(2).format(v) + '%' : num(v); }
  function signed(v, ind) { if (!isNum(v)) return '–'; return (v > 0 ? '+' : '') + (ind && ind.dvt === '%' ? nf(2).format(v) : num(v)); }
  /* Đọc số người dùng gõ / dán: "1.234,5" · "1234.5" · "1 234" · "95%" · "(120)" (= âm) */
  function parse(s) {
    if (isNum(s)) return s;
    if (s === null || s === undefined) return null;
    s = String(s).trim().replace(/ /g, ' ').replace(/%$/, '').replace(/\s+/g, '');
    if (!s || s === '-' || s === '–') return null;
    var neg = /^\(.*\)$/.test(s); if (neg) s = s.slice(1, -1);
    var hasC = s.indexOf(',') >= 0, hasD = s.indexOf('.') >= 0;
    if (hasC && hasD) { if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, ''); }
    else if (hasC) { s = /^-?\d{1,3}(,\d{3})+$/.test(s) && s.split(',').length > 2 ? s.replace(/,/g, '') : s.replace(',', '.'); }
    else if (hasD && /^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    var v = Number(s); if (!isFinite(v)) return NaN;
    return neg ? -v : v;
  }

  function ttClass(tt) {
    return tt === TT.DAT ? 'dat' : tt === TT.KHA ? 'kha' : tt === TT.CCT ? 'cct' : tt === TT.CHUA_DAT ? 'chua' : 'thieu';
  }
  function htClass(r, ng) { if (!isNum(r)) return 'thieu'; return r >= ng.dat ? 'dat' : r >= ng.kha ? 'kha' : r >= ng.cct ? 'cct' : 'chua'; }
  var IC_CHIP = { dat: 'circle-check', kha: 'check', cct: 'circle-alert', chua: 'arrow-down-right', thieu: 'minus', kad: 'minus' };
  function chip(tt) { var c = ttClass(tt), ic = root.KPI_ICONS && IC_CHIP[c] ? KPI_ICONS.html(IC_CHIP[c], 'ic-chip') : ''; return '<span class="chip ' + c + '">' + ic + esc(tt || '–') + '</span>'; }
  function bar(r, ng, cap) {
    var w = isNum(r) ? Math.max(0, Math.min(r / (cap || 1.3), 1)) * 100 : 0;
    var mark = 100 / (cap || 1.3);
    return '<div class="pbar ' + htClass(r, ng) + '"><i style="width:' + w.toFixed(1) + '%' + (isNum(r) ? ';background:' + htColor(r) : '') + '"></i><b style="left:' + mark.toFixed(1) + '%"></b></div>';
  }
  /* Sparkline SVG (nhẹ, không cần Chart.js) */
  function spark(arr, w, h) {
    w = w || 96; h = h || 26;
    var pts = arr.map(function (v, i) { return { v: v, i: i }; }).filter(function (p) { return isNum(p.v); });
    if (pts.length < 2) return '<svg class="spark" width="' + w + '" height="' + h + '"></svg>';
    var mn = Math.min.apply(null, pts.map(function (p) { return p.v; })), mx = Math.max.apply(null, pts.map(function (p) { return p.v; }));
    if (mx - mn < 1) { mn -= 0.5; mx += 0.5; }
    var x = function (i) { return 2 + i / (arr.length - 1) * (w - 4); }, y = function (v) { return h - 3 - (v - mn) / (mx - mn) * (h - 6); };
    var d = pts.map(function (p, k) { return (k ? 'L' : 'M') + x(p.i).toFixed(1) + ' ' + y(p.v).toFixed(1); }).join(' ');
    var last = pts[pts.length - 1], up = last.v >= pts[pts.length - 2].v;
    return '<svg class="spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<circle cx="' + x(last.i).toFixed(1) + '" cy="' + y(last.v).toFixed(1) + '" r="2.6" class="' + (up ? 'up' : 'down') + '"/></svg>';
  }
  /* Vòng tròn điểm */
  function ring(r, label, size) {
    size = size || 132; var st = 11, rr = (size - st) / 2, c = 2 * Math.PI * rr, p = isNum(r) ? Math.max(0, Math.min(r, 1)) : 0;
    return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + rr + '" stroke-width="' + st + '" class="ring-bg"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + rr + '" stroke-width="' + st + '" class="ring-fg" stroke-dasharray="' + (c * p).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '<text x="50%" y="49%" class="ring-val">' + esc(label) + '</text><text x="50%" y="66%" class="ring-sub">/ 100 điểm</text></svg>';
  }

  /* ---------- Thông báo & hộp thoại ---------- */
  function toast(msg, kind) {
    var box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    var el = document.createElement('div'); el.className = 'toast ' + (kind || 'info'); var ti = kind === 'err' ? 'circle-alert' : kind === 'ok' ? 'circle-check' : 'lightbulb'; if (root.KPI_ICONS) el.innerHTML = KPI_ICONS.html(ti, 'ic-toast'); el.appendChild(document.createTextNode(msg));
    box.appendChild(el); setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 300); }, kind === 'err' ? 6000 : 3200);
  }
  function modal(title, body, buttons, opt) {
    opt = opt || {};
    var wrap = document.createElement('div'); wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="modal ' + (opt.wide ? 'wide' : '') + '" role="dialog" aria-modal="true"><header><h3>' + esc(title) + '</h3><button class="icon-btn" data-x aria-label="Đóng">✕</button></header>' +
      '<div class="modal-body">' + body + '</div><footer></footer></div>';
    var foot = wrap.querySelector('footer');
    function close() { wrap.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    (buttons || [{ text: 'Đóng' }]).forEach(function (b) {
      var btn = document.createElement('button'); btn.className = 'btn ' + (b.cls || ''); btn.textContent = b.text;
      btn.onclick = function () { if (b.onClick && b.onClick(wrap) === false) return; close(); };
      foot.appendChild(btn);
    });
    wrap.querySelector('[data-x]').onclick = close;
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(wrap);
    var f = wrap.querySelector('input,select,textarea'); if (f) f.focus();
    return { el: wrap, close: close };
  }
  function confirm(title, text, okText, danger) {
    return new Promise(function (ok) {
      modal(title, '<p>' + text + '</p>', [{ text: 'Huỷ', onClick: function () { ok(false); } }, { text: okText || 'Đồng ý', cls: danger ? 'danger' : 'primary', onClick: function () { ok(true); } }]);
    });
  }

  /* ---------- Thư viện nạp khi cần ---------- */
  var libs = {};
  function nap(src) {
    return new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = src;
      s.onload = ok; s.onerror = function () { no(new Error('Không nạp được ' + src + ' — kiểm tra thư mục lib.')); };
      document.head.appendChild(s);
    });
  }
  /* Thư viện (đều nằm trong lib/, chạy offline): xlsx đọc/ghi thô; 'xlsx-style' = xlsx-js-style (ghi Excel có màu/viền, nạp riêng
     để không đụng bản xlsx dùng đọc tệp); chart kèm plugin annotation + datalabels (datalabels mặc định TẮT, từng biểu đồ tự bật). */
  var LIB = {
    xlsx: function () { return nap('lib/xlsx.full.min.js').then(function () { return root.XLSX; }); },
    'xlsx-style': function () {
      return lib('xlsx').then(function (plain) {
        return nap('lib/xlsx-js-style.bundle.js').then(function () { root.XLSX_STYLE = root.XLSX; root.XLSX = plain; return root.XLSX_STYLE; });
      });
    },
    chart: function () {
      // Plugin là phần bổ sung: thiếu tệp nào thì biểu đồ vẫn vẽ được (chỉ mất đường ngưỡng / nhãn tương ứng)
      var opt = function (src) { return nap(src).then(function () { return true; }, function () { return false; }); };
      return nap('lib/chart.umd.min.js').then(function () { return Promise.all([opt('lib/chartjs-plugin-annotation.min.js'), opt('lib/chartjs-plugin-datalabels.min.js')]); }).then(function () {
        var C = root.Chart, pl = [root['chartjs-plugin-annotation'], root.ChartDataLabels].filter(Boolean);
        if (pl.length) C.register.apply(C, pl);
        if (root.ChartDataLabels) C.defaults.plugins.datalabels.display = false;
        return C;
      });
    },
    pptx: function () { return nap('lib/pptxgen.bundle.js').then(function () { return root.PptxGenJS; }); },
    jszip: function () { return lib('pptx').then(function () { return root.JSZip; }); },   // JSZip đi kèm trong bản bundle của PptxGenJS
    sortable: function () { return nap('lib/Sortable.min.js').then(function () { return root.Sortable; }); },
    snapdom: function () { return nap('lib/snapdom.js').then(function () { return root.snapdom; }); },
    docx: function () { return nap('lib/docx.umd.js').then(function () { return root.docx; }); }
  };
  var GLOBAL = { xlsx: 'XLSX', 'xlsx-style': 'XLSX_STYLE', chart: 'Chart', pptx: 'PptxGenJS', sortable: 'Sortable', docx: 'docx', snapdom: 'snapdom', jszip: 'JSZip' };
  function lib(name) {
    if (!LIB[name]) return Promise.reject(new Error('Thư viện không có: ' + name));
    if (libs[name]) return libs[name];
    if (root[GLOBAL[name]] && name !== 'chart' && name !== 'xlsx-style') return Promise.resolve(root[GLOBAL[name]]);
    libs[name] = LIB[name]().catch(function (e) { libs[name] = null; throw e; });
    return libs[name];
  }

  /* ---------- Biểu đồ (Chart.js) ---------- */
  var charts = [];
  function destroyCharts() { charts.forEach(function (c) { try { c.destroy(); } catch (e) {} }); charts = []; }
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  /* Nhãn số liệu trên biểu đồ (không cần plugin ngoài). Tuỳ chọn: options.plugins.nhanSo = { fmt(v, ctx), off }
     Dataset có thể tắt riêng bằng nhanSo:false. Cột xếp chồng → nhãn trong ô; đường nhiều hơn 3 chuỗi → chỉ nhãn điểm cuối.
     Nhãn chạm nhau thì bỏ bớt để không rối. */
  var nhanSo = {
    id: 'nhanSo',
    afterDatasetsDraw: function (ch, _a, o) {
      if (!o || o.off) return;
      try { veNhan(ch, o); } catch (e) { if (root.console) console.warn('nhanSo:', e); }
    }
  };
  function veNhan(ch, o) {
    {
      var c = ch.ctx, fmt = o.fmt || function (v) { return num(v, 1); }, horiz = ch.options.indexAxis === 'y';
      var vs = ch.scales[horiz ? 'x' : 'y'], stacked = !!(vs && vs.options && vs.options.stacked);
      var dark = cssVar('--text') || '#243247', placed = [];
      var nLine = ch.data.datasets.filter(function (d, i) { return d.nhanSo !== false && ch.isDatasetVisible(i) && ch.getDatasetMeta(i).type === 'line'; }).length;
      c.save(); c.font = '600 11px ' + (Chart.defaults.font.family || 'sans-serif'); c.textBaseline = 'middle';
      ch.data.datasets.forEach(function (ds, i) {
        if (ds.nhanSo === false || !ch.isDatasetVisible(i)) return;
        var meta = ch.getDatasetMeta(i), isLine = meta.type === 'line', last = -1;
        if (isLine && nLine > 3) { ds.data.forEach(function (v, k) { if (isNum(v)) last = k; }); }
        meta.data.forEach(function (el, k) {
          var v = ds.data[k]; if (!isNum(v)) return;
          if (isLine && nLine > 3 && k !== last) return;
          var t = fmt(v, { dataset: ds, index: k, chart: ch }); if (t === '' || t == null) return;
          var w = c.measureText(t).width, p = el.tooltipPosition ? el.tooltipPosition(true) : { x: el.x, y: el.y }, x, y, col = dark, al = 'center';
          if (isLine) { x = p.x; y = p.y - 11; if (nLine > 3 && x + w / 2 > ch.chartArea.right) { x = ch.chartArea.right - w / 2; } }
          else if (stacked) {
            var size = horiz ? Math.abs(el.base - el.x) : Math.abs(el.base - el.y);
            if (size < (horiz ? w + 6 : 15)) return; x = horiz ? (el.x + el.base) / 2 : el.x; y = horiz ? el.y : (el.y + el.base) / 2; col = '#fff';
          } else if (horiz) { x = el.x + 5 + w / 2; y = el.y; }
          else { x = el.x; y = (v < 0 ? el.y + 10 : el.y - 9); }
          var r = { l: x - w / 2 - 1, r: x + w / 2 + 1, t: y - 7, b: y + 7 };
          for (var q = 0; q < placed.length; q++) { var z = placed[q]; if (r.l < z.r && r.r > z.l && r.t < z.b && r.b > z.t) return; }
          placed.push(r); c.fillStyle = col; c.textAlign = al; c.fillText(t, x, y);
        });
      });
      c.restore();
    }
  }
  function chart(canvas, cfg) {
    if (!canvas) return;
    lib('chart').then(function (Chart) {
      if (!document.body.contains(canvas)) return;
      var ho = cfg.options = cfg.options || {}, po = ho.plugins = ho.plugins || {};
      if (!(po.nhanSo && po.nhanSo.off)) {
        po.nhanSo = po.nhanSo || {}; (cfg.plugins = cfg.plugins || []).push(nhanSo);
        var lp = ho.layout = ho.layout || {}; if (lp.padding === undefined) lp.padding = { top: 20, right: ho.indexAxis === 'y' ? 44 : 10 };
      }
      Chart.defaults.font.family = cssVar('--font') || 'Segoe UI, system-ui, sans-serif';
      Chart.defaults.font.size = 12;
      Chart.defaults.color = cssVar('--muted');
      Chart.defaults.animation = { duration: 350 };
      Chart.defaults.plugins.legend.labels.boxWidth = 10;
      Chart.defaults.plugins.tooltip.backgroundColor = '#0b2447';
      Chart.defaults.maintainAspectRatio = false;
      charts.push(new Chart(canvas.getContext('2d'), cfg));
    }).catch(function (e) { canvas.parentNode.innerHTML = '<p class="muted">' + esc(e.message) + '</p>'; });
  }

  /* Cấu hình plugin annotation: đường ngưỡng Đạt (thang điểm 100) và, nếu bang=true, các dải Đạt / Khá / Cần cải thiện / Chưa đạt.
     ng = { dat, kha, cct } (số thập phân, 1 = 100%); truc = 'y' (cột/đường đứng) hoặc 'x' (cột ngang). Dùng: options.plugins.annotation = UI.nguong(ng, 'y', true). */
  function nguong(ng, truc, bang) {
    var T = truc === 'x' ? 'x' : 'y', a = {}, d = ng.dat * 100, k = ng.kha * 100, c = ng.cct * 100;
    function lo(min, max, mau) { var o = { type: 'box', backgroundColor: mau, borderWidth: 0, drawTime: 'beforeDatasetsDraw' }; o[T + 'Min'] = min; if (max !== null) o[T + 'Max'] = max; return o; }
    if (bang) { a.dat = lo(d, null, 'rgba(46,157,106,.07)'); a.kha = lo(k, d, 'rgba(240,180,41,.09)'); a.cct = lo(c, k, 'rgba(240,120,41,.09)'); a.chua = lo(-1e9, c, 'rgba(217,83,79,.08)'); }
    a.dong = { type: 'line', borderColor: '#2e9d6a', borderWidth: 1.5, borderDash: [5, 4], label: { display: true, content: 'Đạt ' + Math.round(d), position: 'end', backgroundColor: 'rgba(46,157,106,.9)', color: '#fff', font: { size: 10 }, padding: 2 } };
    a.dong[T + 'Min'] = d; a.dong[T + 'Max'] = d;
    return { annotations: a };
  }

  /* ---------- Tải ảnh PNG (SnapDOM): gắn nút vào mọi biểu đồ và bảng/heatmap của màn hình đang hiển thị ---------- */
  function tenAnh(el) {
    var h = el.querySelector('h3, h4, .card-title') || (el.closest('.card') || document).querySelector('h3, h4'), t = (h && h.textContent || document.title || 'anh').trim();
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return (slug(t).slice(0, 60) || 'anh') + '_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
  }
  function taiAnh(el, btn) {
    btn.disabled = true;
    return lib('snapdom').then(function (sd) {
      return sd.download(el, { format: 'png', filename: tenAnh(el), scale: 2, backgroundColor: '#ffffff', exclude: ['.png-btn'] });
    }).then(function () { toast('Đã tải ảnh PNG.', 'ok'); }, function (e) { toast('Không tạo được ảnh: ' + (e && e.message || e), 'err'); }).then(function () { btn.disabled = false; });
  }
  function nutAnh(view) {
    var dich = [];   // [phần tử chụp, nơi gắn nút]
    [].forEach.call(view.querySelectorAll('canvas'), function (cv) { var c = cv.closest('.card') || cv.parentNode; dich.push([c, c]); });
    [].forEach.call(view.querySelectorAll('table.tbl, table.heat'), function (tb) {
      if (tb.querySelector('input, select, textarea')) return;   // bảng nhập liệu: không chụp
      if (tb.closest('.card') && tb.closest('.card').querySelector('canvas')) return;
      if (dich.some(function (d) { return d[0].contains(tb); })) return;
      dich.push([tb, tb.closest('.card') || tb.parentNode]);
    });
    dich.forEach(function (d) {
      var neo = d[1]; if (neo.querySelector(':scope > .png-btn, :scope > .png-row, :scope > .card-head > .png-btn')) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'png-btn'; b.title = 'Tải ảnh PNG của khung này'; b.setAttribute('aria-label', 'Tải ảnh PNG của khung này'); b.textContent = '📷';
      b.onclick = function (e) { e.stopPropagation(); taiAnh(d[0], b); };
      var hd = neo.querySelector(':scope > .card-head');
      if (hd) hd.appendChild(b); else { var rw = document.createElement('div'); rw.className = 'png-row'; rw.appendChild(b); neo.insertBefore(rw, neo.firstChild); }
    });
  }

  function download(name, data, type) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: type || 'application/octet-stream' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function pickFile(accept) {
    return new Promise(function (ok) {
      var i = document.createElement('input'); i.type = 'file'; i.accept = accept || '';
      i.onchange = function () { ok(i.files[0] || null); }; i.click();
    });
  }
  function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }
  function slug(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, ''); }

  /* ---------- Thang màu heatmap (gradient liên tục) ---------- */
  var PALETTE = {
    kpi: { ten: 'KPI theo % hoàn thành (xanh đậm – vàng – cam – đỏ)', stops: ['#cf1322', '#ff4d4f', '#ff7a45', '#fa8c16', '#faad14', '#7cb305', '#52c41a', '#237804', '#0d5e0d'] },
    excel: { ten: 'Excel (đỏ – vàng – xanh)', stops: ['#F8696B', '#FFEB84', '#63BE7B'] },
    rdylgn: { ten: 'ColorBrewer RdYlGn', stops: ['#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60', '#1a9850'] },
    xanh: { ten: 'Xanh dương đậm nhạt (dễ đọc khi mù màu, in đen trắng)', stops: ['#f7fbff', '#c6dbef', '#6baed6', '#2171b5', '#08306b'] }
  };
  function heatPal() { var k = 'kpi'; try { k = localStorage.getItem('KPI_CN444.heat') || 'kpi'; } catch (e) {} return PALETTE[k] ? k : 'kpi'; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  /* t: 0 (kém) → 1 (tốt) */
  function heatRgb(t) {
    var st = PALETTE[heatPal()].stops, x = Math.max(0, Math.min(1, t)) * (st.length - 1), i = Math.min(Math.floor(x), st.length - 2), f = x - i;
    var a = hex(st[i]), b = hex(st[i + 1]);
    return [0, 1, 2].map(function (k) { return Math.round(a[k] + (b[k] - a[k]) * f); });
  }
  function heatStyle(t) {
    if (!isNum(t)) return '';
    var c = heatRgb(t), lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
    return 'background:rgb(' + c.join(',') + ');color:' + (lum < 0.55 ? '#fff' : '#1b2a41');
  }
  /* %HT → độ tốt t theo ngưỡng (≤50%: 0 · CCT: .25 · Khá: .45 · Đạt: .7 · Đạt+25%: 1) */
  function htT(r, ng) {
    if (!isNum(r)) return null;
    var pts = [[0.5, 0], [ng.cct, 0.25], [ng.kha, 0.45], [ng.dat, 0.7], [ng.dat + 0.25, 1]];
    if (r <= pts[0][0]) return 0; if (r >= pts[4][0]) return 1;
    for (var i = 1; i < pts.length; i++) if (r <= pts[i][0]) { var a = pts[i - 1], b = pts[i]; return a[1] + (r - a[0]) / (b[0] - a[0]) * (b[1] - a[1]); }
    return 1;
  }
  /* Bảng màu KPI theo % hoàn thành (pct: 0–200+). Thang từ xanh đậm (xuất sắc) đến đỏ sẫm (kém). */
  function getCompletionColor(pct) {
    if (pct === null || pct === undefined || !isFinite(pct)) return '#d9d9d9';   // chưa có số
    if (pct >= 120) return '#0d5e0d';   // xanh đậm
    if (pct >= 110) return '#237804';   // xanh
    if (pct >= 100) return '#52c41a';   // xanh nhạt
    if (pct >= 95) return '#7cb305';    // vàng xanh
    if (pct >= 90) return '#faad14';    // vàng
    if (pct >= 80) return '#fa8c16';    // cam
    if (pct >= 70) return '#ff7a45';    // cam nhạt
    if (pct >= 60) return '#ff4d4f';    // đỏ
    return '#cf1322';                   // đỏ sẫm
  }
  function htColor(r) { return isNum(r) ? getCompletionColor(r * 100) : '#d9d9d9'; }   // r: tỷ lệ (1 = 100%)
  /* Màu ô theo %HT: bảng KPI dùng màu rời theo mốc; các bảng màu khác vẫn dùng thang liên tục qua htT. */
  function heatStyleHT(r, ng) {
    if (!isNum(r)) return '';
    if (heatPal() !== 'kpi') return heatStyle(htT(r, ng));
    var c = hex(htColor(r)), lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
    return 'background:rgb(' + c.join(',') + ');color:' + (lum < 0.62 ? '#fff' : '#1b2a41');
  }
  function heatLegend(trai, phai) {
    var st = PALETTE[heatPal()].stops;
    return '<div class="heat-legend"><span>' + esc(trai) + '</span><i style="background:linear-gradient(90deg,' + st.join(',') + ')"></i><span>' + esc(phai) + '</span>' +
      '<select id="heat-pal" title="Bảng màu">' + Object.keys(PALETTE).map(function (k) { return '<option value="' + k + '"' + (k === heatPal() ? ' selected' : '') + '>' + esc(PALETTE[k].ten) + '</option>'; }).join('') + '</select></div>';
  }
  function setHeatPal(k) { try { localStorage.setItem('KPI_CN444.heat', k); } catch (e) {} }

  root.UI = { getCompletionColor: getCompletionColor, htColor: htColor, heatStyleHT: heatStyleHT, heatStyle: heatStyle, htT: htT, heatLegend: heatLegend, setHeatPal: setHeatPal, esc: esc, num: num, pct: pct, val: val, signed: signed, parse: parse, isNum: isNum, chip: chip, ttClass: ttClass, htClass: htClass,
    bar: bar, spark: spark, ring: ring, toast: toast, modal: modal, confirm: confirm, lib: lib, nutAnh: nutAnh, nguong: nguong, chart: chart, destroyCharts: destroyCharts,
    cssVar: cssVar, download: download, pickFile: pickFile, debounce: debounce, slug: slug };
})(window);
