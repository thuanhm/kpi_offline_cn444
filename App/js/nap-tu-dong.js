/* NẠP TỰ ĐỘNG TỪ THƯ MỤC (chức năng "⚡ Nạp nhanh" và "Chốt số dư cuối tháng", gom theo phòng/PGD).
 *  - Quét Data\BAO_CAO_THO (dùng chung) và tuỳ chọn 1 thư mục phụ trên máy (VD Downloads) — CHỈ ĐỌC, không sửa/xoá file.
 *  - Sổ đã nạp: Data\NAP_TU_DONG\DA_NAP.json — file "đã nạp" = cùng tên + cùng dung lượng + giờ sửa lệch ≤ 2 giây; khác → nạp lại.
 *  - Khoá: Data\NAP_TU_DONG\KHOA.json — mỗi lúc chỉ 1 máy nạp, khoá tự hết hạn sau 3 phút.
 *  - Mỗi file: dò công thức khớp (phải có cột nhận diện), lấy NGÀY BÁO CÁO từ cột "Ngày báo cáo" (ngày lớn nhất) hoặc tên file.
 *  - Ghi ẢNH SỐ THEO NGÀY (so_ngay) cho mọi công thức thực hiện; số THỰC HIỆN THÁNG chỉ ghi khi là ngày cuối tháng
 *    (hoặc luôn theo ngày mới nhất trong tháng — tuỳ cài đặt). Nạp lại file cuối tháng → cập nhật; ô SỬA TAY sau lần ghi tự động được GIỮ.
 *  - Chế độ 'hoi' (mặc định): kết quả vào hàng chờ duyệt; 'tu_ghi': ghi ngay, có nhật ký.
 * Phần đọc/ghi thư mục tách thành "backend" để kiểm thử (NAP.setBackend). */
(function (root) {
  var CT = root.CONG_THUC, CN = KPI_CFG.MA_CN, DIR_THO = 'BAO_CAO_THO', DIR_NAP = 'NAP_TU_DONG', HAN_KHOA = 3 * 60 * 1000;
  var cho = [], dangQuet = false, lanQuet = null, thongBao = '', beTest = null, phu = null, phuOk = false, ls = [];
  var MAY = (function () { try { var x = localStorage.getItem('KPI_CN444.may'); if (!x) { x = 'M' + Math.random().toString(36).slice(2, 8).toUpperCase(); localStorage.setItem('KPI_CN444.may', x); } return x; } catch (e) { return 'M?'; } })();
  function phat() { ls.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.y + '-' + pad(d.m) + '-' + pad(d.d); }
  function soNgayThang(y, m) { return new Date(y, m, 0).getDate(); }

  /* ---------- Backend thư mục thật (File System Access API) ---------- */
  function fsBackend() {
    var d = STORE.dir; if (!d) return null;
    function napDir() { return d.getDirectoryHandle(DIR_NAP, { create: true }); }
    return {
      ten: d.name,
      list: async function () {
        var out = [], nguon = [['chung', await d.getDirectoryHandle(DIR_THO, { create: true })]];
        if (phuOk && phu) nguon.push(['phu', phu]);
        for (var i = 0; i < nguon.length; i++) {
          for await (var e of nguon[i][1].values()) {
            if (e.kind !== 'file' || !/\.(xlsx|xls|xlsm|xlsb|csv)$/i.test(e.name) || /^~\$/.test(e.name)) continue;
            var f = await e.getFile();
            out.push({ ten: e.name, size: f.size, lm: f.lastModified, nguon: nguon[i][0], file: f });
          }
        }
        return out;
      },
      read: function (it) { return it.file.arrayBuffer(); },
      readJson: async function (name) { try { var fh = await (await napDir()).getFileHandle(name); return JSON.parse(await (await fh.getFile()).text()); } catch (e) { return null; } },
      writeJson: async function (name, obj) { var fh = await (await napDir()).getFileHandle(name, { create: true }); var w = await fh.createWritable(); await w.write(JSON.stringify(obj, null, 1)); await w.close(); }
    };
  }
  function be() { return beTest || fsBackend(); }

  /* ---------- Ngày báo cáo ---------- */
  function ngayTu(v) {
    if (typeof v === 'number' && v > 30000 && v < 80000) { var dt = new Date(Math.round((v - 25569) * 864e5)); return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() }; }
    if (v instanceof Date) return { y: v.getFullYear(), m: v.getMonth() + 1, d: v.getDate() };
    var s = String(v || '').trim(), m;
    if ((m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/))) return hop(+m[3], +m[2], +m[1]);
    if ((m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/))) return hop(+m[1], +m[2], +m[3]);
    if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) return hop(+m[1], +m[2], +m[3]);
    return null;
  }
  function hop(y, m, d) { return y > 2000 && y < 2100 && m >= 1 && m <= 12 && d >= 1 && d <= soNgayThang(y, m) ? { y: y, m: m, d: d } : null; }
  function cmp(a, b) { return (a.y - b.y) || (a.m - b.m) || (a.d - b.d); }
  function timNgay(b) {
    var i = b.k.findIndex(function (k) { return /^(ngay bao cao|ngay bc|ngay du lieu|report date|ngay)$/.test(k); });
    if (i < 0) return null;
    var best = null;
    for (var r = 0; r < b.rows.length; r++) { var d = ngayTu(b.rows[r][i]); if (d && (!best || cmp(d, best) > 0)) best = d; }
    return best;
  }
  function ngayTuTen(ten) {
    var m;
    if ((m = ten.match(/(\d{1,2})[.\-_](\d{1,2})[.\-_](\d{4})/))) return hop(+m[3], +m[2], +m[1]);
    if ((m = ten.match(/(20\d{2})(\d{2})(\d{2})/))) return hop(+m[1], +m[2], +m[3]);
    if ((m = ten.match(/T(\d{1,2})[.\-_ ]?(20\d{2})/i))) { var y = +m[2], mm = +m[1]; return mm >= 1 && mm <= 12 ? { y: y, m: mm, d: soNgayThang(y, mm) } : null; }
    return null;
  }

  /* ---------- Xử lý 1 file → kết quả chờ ghi ---------- */
  async function xuLy(it, B) {
    // CSV: đọc nguyên văn (raw) — nếu không SheetJS tự hiểu "03/11/2026" theo kiểu Mỹ (tháng/ngày) → sai ngày báo cáo.
    var XLSX = await UI.lib('xlsx'), buf = await B.read(it), wb = XLSX.read(buf, { type: 'array', dense: true, raw: /\.csv$/i.test(it.ten) });
    var M = STORE.model(), st = STORE.state, kq = { key: it.nguon + '/' + it.ten, ten: it.ten, nguon: it.nguon, size: it.size, lm: it.lm, ngay: null, ct: [], loi: [] };
    wb.SheetNames.forEach(function (sn) {
      var b = CT.bang(XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: true, defval: null, blankrows: true }), 0);
      if (!b) return;
      var ds = (st.cong_thuc || []).filter(function (f) { return CT.dsNhanDien(f).length && M.indMap[f.ma_ct] && !CT.cotThieu(f, b).length; });
      if (!ds.length) return;
      var ngay = timNgay(b) || ngayTuTen(it.ten);
      if (!ngay) { kq.loi.push('Trang "' + sn + '": không xác định được ngày báo cáo (không có cột Ngày báo cáo, tên file không chứa ngày).'); return; }
      if (!kq.ngay || cmp(ngay, kq.ngay) > 0) kq.ngay = ngay;
      var ctx = { don_vi: st.don_vi, moc: function (ma, dv) { return M.val('a', ma, dv, ngay.y - 1, 12); } };
      ds.forEach(function (f) {
        var r = CT.chay(f, b, ctx);
        if (!r.ok) { kq.loi.push(f.ten + ': ' + r.loi.join(' ')); return; }
        var v = {}; Object.keys(r.theo_dv).forEach(function (ma) { var x = r.theo_dv[ma]; if (x && UI.isNum(x.ket_qua)) v[ma] = x.ket_qua; });
        if (r.cn && UI.isNum(r.cn.ket_qua)) v[CN] = r.cn.ket_qua;
        var thieuMoc = Object.keys(r.theo_dv).filter(function (m) { return r.theo_dv[m] && r.theo_dv[m].thieu_moc; }).length + (r.cn && r.cn.thieu_moc ? 1 : 0);
        kq.ct.push({ id: f.id, ten: f.ten, ma_ct: f.ma_ct, loai: f.loai === 'p' ? 'p' : 'a', ngay: ngay, v: v, dong: r.dong_loc, khong_ghep: r.khong_ghep.filter(function (x) { return x.gt !== '(trống)'; }).length, thieu_moc: thieuMoc });
      });
    });
    if (!kq.ct.length && !kq.loi.length) kq.loi.push('Không có công thức nào khớp loại file này (kiểm tra cột nhận diện của công thức).');
    kq.ghi_th = kq.ct.length ? seGhiThang(kq) : false;
    return kq;
  }

  /* Ngày này có được ghi vào số thực hiện tháng không? */
  function seGhiThang(kq) {
    var n = kq.ngay, cd = (STORE.state.settings.nap || {}).ghi_th || 'cuoi_thang';
    if (n.d === soNgayThang(n.y, n.m)) return true;
    if (cd !== 'luon') return false;
    var pre = n.y + '-' + pad(n.m) + '-';   // có ảnh ngày muộn hơn trong cùng tháng thì không ghi đè bằng ngày cũ
    return !Object.keys(STORE.state.so_ngay).some(function (k) { return k.indexOf(pre) === 0 && k > iso(n); });
  }

  /* ---------- Ghi 1 kết quả ---------- */
  function apDung(kq) {
    var st = STORE.state, t = Date.now(), items = [], giu = 0;
    kq.ct.forEach(function (c) {
      var day = iso(c.ngay);
      if (c.loai === 'a') {   // ảnh số theo ngày
        var cu = st.so_ngay[day], o = cu || { t: 0, v: {} };
        o = { t: t, v: Object.assign({}, o.v), tv: Object.assign({}, o.tv) };   // tv: giờ ghi từng ô → gộp nhiều máy theo ô
        Object.keys(o.v).forEach(function (sk) { if (!o.tv[sk]) o.tv[sk] = cu ? cu.t || 0 : 0; });   // ô của bản cũ chưa có tv: giữ giờ cũ của ngày
        if (cu && cu.tx) o.tx = cu.tx;
        Object.keys(c.v).forEach(function (dv) { var sk = c.ma_ct + '|' + dv; o.v[sk] = c.v[dv]; o.tv[sk] = t; });
        st.so_ngay[day] = o;
      }
      var vaoThang = c.loai === 'p' || kq.ghi_th;
      if (!vaoThang) return;
      Object.keys(c.v).forEach(function (dv) {
        var k = c.loai + '|' + c.ma_ct + '|' + dv + '|' + c.ngay.y + '|' + c.ngay.m, cu = st.rec[k], auto = st.tu_dong_ghi[k];
        if (cu && auto && cu[1] > auto + 1000) { giu++; return; }   // đã sửa tay sau lần ghi tự động → giữ
        items.push({ k: c.loai, ct: c.ma_ct, dv: dv, nam: c.ngay.y, thang: c.ngay.m, v: c.v[dv] });
      });
    });
    STORE.setMany(items, null, { ai: 'auto' });   // ô do nạp tự động ghi nhãn 'auto' (ngắn, không kèm máy → tệp chung không phình)
    items.forEach(function (it) { var k = it.k + '|' + it.ct + '|' + it.dv + '|' + it.nam + '|' + it.thang; if (st.rec[k]) st.tu_dong_ghi[k] = st.rec[k][1]; });
    STORE.touch('Nạp tự động ' + kq.ten + ' (ngày ' + fmtNgay(kq.ngay) + '): ' + (items.length ? items.length + ' ô số tháng' : 'chỉ lưu số theo ngày') + (giu ? ', giữ ' + giu + ' ô sửa tay' : ''));
    return { o: items.length, giu: giu };
  }
  function fmtNgay(n) { return n ? pad(n.d) + '/' + pad(n.m) + '/' + n.y : '?'; }

  /* ---------- Quét ---------- */
  async function quet(thuCong) {
    var B = be();
    if (!B) { thongBao = 'Chưa kết nối thư mục Data.'; phat(); return; }
    if (dangQuet) return;
    dangQuet = true; thongBao = 'Đang quét…'; phat();
    try {
      var khoa = await B.readJson('KHOA.json');
      if (khoa && khoa.may !== MAY && khoa.het_han > Date.now()) { thongBao = 'Máy ' + khoa.may + ' đang nạp — thử lại sau.'; return; }
      await B.writeJson('KHOA.json', { may: MAY, het_han: Date.now() + HAN_KHOA });
      var so = (await B.readJson('DA_NAP.json')) || { files: {} }, files = await B.list(), moi = 0, tuGhi = (STORE.state.settings.nap || {}).che_do === 'tu_ghi';
      for (var i = 0; i < files.length; i++) {
        var it = files[i], key = it.nguon + '/' + it.ten, cu = so.files[key];
        if (cu && cu.size === it.size && Math.abs((cu.lm || 0) - it.lm) <= 2000) continue;
        if (cho.some(function (x) { return x.key === key && x.size === it.size && x.lm === it.lm; })) continue;
        cho = cho.filter(function (x) { return x.key !== key; });
        moi++; thongBao = 'Đang đọc ' + it.ten + '…'; phat();
        var kq;
        try { kq = await xuLy(it, B); } catch (e) { kq = { key: key, ten: it.ten, nguon: it.nguon, size: it.size, lm: it.lm, ct: [], loi: ['Không đọc được file: ' + e.message] }; }
        if (tuGhi && kq.ct.length) { var r = apDung(kq); so.files[key] = ghiSo(kq, 'da_ghi', r); }
        else if (!kq.ct.length) so.files[key] = ghiSo(kq, 'bo_qua', null);   // không công thức nào khớp: ghi soCache để khỏi đọc lại
        else cho.push(kq);
      }
      await B.writeJson('DA_NAP.json', so);
      await B.writeJson('KHOA.json', { may: MAY, het_han: 0 });
      lanQuet = Date.now();
      thongBao = moi ? 'Phát hiện ' + moi + ' file mới/đổi' + (cho.length ? ', ' + cho.length + ' chờ duyệt.' : '.') : 'Không có file mới.';
      if (thuCong || moi) UI.toast(thongBao, moi ? 'ok' : 'info');
      soCache = so;
    } catch (e) { console.error(e); thongBao = 'Lỗi quét: ' + e.message; }
    finally { dangQuet = false; phat(); }
  }
  var soCache = null;
  function ghiSo(kq, tt, r) {
    return { size: kq.size, lm: kq.lm, ngay: kq.ngay ? iso(kq.ngay) : null, tt: tt, luc: Date.now(), may: MAY,
      ghi_chu: tt === 'da_ghi' ? (r.o ? r.o + ' ô số tháng' : 'chỉ lưu số theo ngày') + (r.giu ? ', giữ ' + r.giu + ' ô sửa tay' : '') + ' · ' + kq.ct.map(function (c) { return c.ten; }).join(', ')
        : (kq.loi || []).join(' ') || 'Bỏ qua' };
  }
  async function duyet(key, dongY) {
    var kq = cho.filter(function (x) { return x.key === key; })[0]; if (!kq) return;
    var B = be(), so = B ? ((await B.readJson('DA_NAP.json')) || { files: {} }) : { files: {} }, r = null;
    if (dongY) r = apDung(kq);
    so.files[key] = ghiSo(kq, dongY ? 'da_ghi' : 'bo_qua', r);
    if (B) await B.writeJson('DA_NAP.json', so);
    soCache = so;
    cho = cho.filter(function (x) { return x.key !== key; });
    UI.toast(dongY ? 'Đã ghi ' + kq.ten + (r.o ? ': ' + r.o + ' ô số tháng.' : ': lưu số theo ngày.') : 'Đã bỏ qua ' + kq.ten + '.', 'ok');
    phat();
  }
  async function docSo() { var B = be(); if (B) soCache = (await B.readJson('DA_NAP.json')) || { files: {} }; phat(); return soCache; }
  async function napLaiFn(key) { var B = be(); if (!B) return; var so = (await B.readJson('DA_NAP.json')) || { files: {} }; delete so.files[key]; await B.writeJson('DA_NAP.json', so); soCache = so; return quet(true); }

  /* ---------- Thư mục phụ (theo máy) ---------- */
  function idb(op, val) {
    return new Promise(function (ok) {
      var r = indexedDB.open('KPI_CN444', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onsuccess = function () { var tx = r.result.transaction('kv', op === 'get' ? 'readonly' : 'readwrite'), s = tx.objectStore('kv');
        if (op === 'get') { var q = s.get('dir_phu'); q.onsuccess = function () { ok(q.result); }; q.onerror = function () { ok(null); }; }
        else { if (op === 'set') s.put(val, 'dir_phu'); else s.delete('dir_phu'); tx.oncomplete = function () { ok(); }; } };
      r.onerror = function () { ok(null); };
    });
  }
  function chonPhu() { return root.showDirectoryPicker({ id: 'kpi-phu', mode: 'read' }).then(function (h) { phu = h; phuOk = true; return idb('set', h); }).then(phat); }
  function boPhu() { phu = null; phuOk = false; return idb('del').then(phat); }
  var pendingPhu = null;
  function capQuyenPhu() {
    return initPhuPromise.then(function () {
      if (!phu) return false;
      if (pendingPhu) return pendingPhu;
      pendingPhu = phu.requestPermission({ mode: 'read' }).then(function (p) {
        pendingPhu = null;
        phuOk = (p === 'granted');
        phat();
        return phuOk;
      }).catch(function () {
        pendingPhu = null;
        phuOk = false;
        phat();
        return false;
      });
      return pendingPhu;
    });
  }
  var initPhuPromise = idb('get').then(function (h) {
    if (!h) return;
    phu = h;
    return h.queryPermission({ mode: 'read' }).then(function (p) {
      phuOk = (p === 'granted');
      phat();
    });
  }).catch(function () {});

  // Tự quét: 10 giây sau khi mở, sau đó mỗi 60 giây (máy đang ở chế độ quản trị, đã kết nối Data, bật tự quét).
  function tick() { var s = STORE.state && STORE.state.settings.nap; if (s && s.bat && STORE.isAdmin() && be() && !document.hidden) quet(false); }
  setTimeout(tick, 10000); setInterval(tick, 60000);

  root.NAP = {
    quet: quet, duyet: duyet, docSo: docSo, napLai: napLaiFn, on: function (f) { ls.push(f); },
    get cho() { return cho; }, get dangQuet() { return dangQuet; }, get lanQuet() { return lanQuet; }, get thongBao() { return thongBao; }, get so() { return soCache; },
    get phu() { return phu ? { ten: phu.name, ok: phuOk } : null; }, chonPhu: chonPhu, boPhu: boPhu, capQuyenPhu: capQuyenPhu, MAY: MAY,
    setBackend: function (b) { beTest = b; }, fmtNgay: fmtNgay, iso: iso, ngayTu: ngayTu, ngayTuTen: ngayTuTen, DIR_THO: DIR_THO, DIR_NAP: DIR_NAP
  };
})(window);
