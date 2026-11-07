/* SAO LƯU RA MÁY — máy quản trị chọn MỘT LẦN một thư mục trên máy (VD D:\Backup); từ đó mỗi lần đăng nhập và mỗi khi số liệu đổi
 * (kể cả số nhận từ máy khác về), ứng dụng tự ghi một bản sao lưu vào đó — thêm một bản NGOÀI ổ mạng, phòng khi ổ mạng gặp sự cố.
 * Không có kho IndexedDB riêng; mỗi bản sao lưu là một tệp JSON:
 *   <thư mục đã chọn>\KPI_CN444\KPI_MOI_NHAT.json                          bản mới nhất (ghi đè)  → khôi phục: Dữ liệu & cài đặt › Khôi phục
 *   <thư mục đã chọn>\KPI_CN444\<YYYY-MM>\KPI444_<YYYY-MM-DD>_<HHhMM>_<người>.json   bản theo khung giờ
 *   <thư mục đã chọn>\KPI_CN444\THONG_TIN.txt                              cập nhật lúc nào, ai, số ô — đọc được bằng Notepad
 * Chỉ ghi khi NỘI DUNG SỐ LIỆU đổi (bỏ qua nhật ký / giờ lưu); gộp các thay đổi liên tiếp (đợi 10 giây yên tĩnh); mỗi máy ghi thư mục của CHÍNH MÌNH.
 * Lịch giữ: mỗi ngày tối đa 4 bản (trước 10h · 10h–13h · 13h–16h · từ 16h) · tháng này giữ bản cuối mỗi ngày ·
 * tháng đã qua chỉ giữ 2 bản (ngày 15 và cuối tháng) · mọi năm đều giữ.
 * Chrome/Edge bắt cấp lại quyền thư mục mỗi lần mở trình duyệt: chưa cấp thì có dải thông báo + nút "Cấp quyền"; lỗi sao lưu KHÔNG bao giờ chặn thao tác chính. */
(function (root) {
  var isNode = typeof module !== 'undefined' && module.exports;
  var SUB = 'KPI_CN444', TEN_MOI = 'KPI_MOI_NHAT.json', TEN_INFO = 'THONG_TIN.txt', KEY_DIR = 'dir_saoluu', TRE = 10000;
  var LS_BAT = 'KPI_CN444.saoluu.bat', LS_HASH = 'KPI_CN444.saoluu.hash', LS_LUC = 'KPI_CN444.saoluu.luc';

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function slug(s) { var t = String(s == null ? '' : s).toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30); return t || 'admin'; }
  function fnv(str) { var h = 0x811c9dc5; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; } return ('0000000' + h.toString(16)).slice(-8) + ':' + str.length; }
  function ngayGio(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '_' + pad(d.getHours()) + 'h' + pad(d.getMinutes()); }
  function thangStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function gioVN(d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  function tenTep(d, nguoi) { return 'KPI444_' + ngayGio(d) + '_' + slug(nguoi) + '.json'; }
  function khung(h) { return h < 10 ? 1 : h < 13 ? 2 : h < 16 ? 3 : 4; }

  /* ---------- Lịch giữ (hàm thuần, kiểm thử được) ----------
   * ds: tên tệp kèm thư mục tháng ('2026-10/KPI444_2026-10-25_14h30_admin.json'); now: ms. Trả { xoa: [...], giu: [...] }; tệp lạ tên không bao giờ bị xoá. */
  function docTen(n) {
    var m = /^KPI444_(\d{4})-(\d{2})-(\d{2})_(\d{2})h(\d{2})(?:_[^.\/]*)?\.json$/.exec(String(n).split('/').pop());
    return m ? { n: n, ngay: m[1] + m[2] + m[3], b: khung(+m[4]), t: +m[4] * 100 + +m[5] } : null;
  }
  function chonXoa(ds, now) {
    var d0 = new Date(now), homNay = d0.getFullYear() + pad(d0.getMonth() + 1) + pad(d0.getDate()), thangNay = homNay.slice(0, 6), xs = [];
    (ds || []).forEach(function (n) { var x = docTen(n); if (x) xs.push(x); });
    var sau = function (a, b) { return a.ngay > b.ngay || (a.ngay === b.ngay && (a.b > b.b || (a.b === b.b && (a.t > b.t || (a.t === b.t && a.n > b.n))))); };
    var cuoiNgay = {}, cuoiThang = {}, giuaThang = {}, dauThang = {}, cuoiKhung = {};
    xs.forEach(function (x) {
      var k = x.ngay.slice(0, 6), kb = x.ngay + '_' + x.b, c;
      if (!(c = cuoiKhung[kb]) || sau(x, c)) cuoiKhung[kb] = x;
      if (!(c = cuoiNgay[x.ngay]) || sau(x, c)) cuoiNgay[x.ngay] = x;
      if (!(c = cuoiThang[k]) || sau(x, c)) cuoiThang[k] = x;
      if (!(c = dauThang[k]) || sau(c, x)) dauThang[k] = x;
      if (+x.ngay.slice(6, 8) <= 15 && (!(c = giuaThang[k]) || sau(x, c))) giuaThang[k] = x;
    });
    var xoa = [], giu = [];
    xs.forEach(function (x) {
      var k = x.ngay.slice(0, 6);
      var giuLai = cuoiKhung[x.ngay + '_' + x.b] === x && (x.ngay >= homNay || (k >= thangNay ? cuoiNgay[x.ngay] === x : (cuoiThang[k] === x || (giuaThang[k] || dauThang[k]) === x)));
      (giuLai ? giu : xoa).push(x.n);
    });
    return { xoa: xoa.sort(), giu: giu.sort() };
  }

  if (isNode) { module.exports = { chonXoa: chonXoa, docTen: docTen, tenTep: tenTep, slug: slug, fnv: fnv }; return; }

  /* ---------- Trình duyệt ---------- */
  var S = root.STORE;
  var tt = { state: 'chua_biet', ten: '', luc: null, tep: [], loi: '', ly_do: '' }, dirH = null, daTai = false, timer = null, dangGhi = false, moi = false, ls = [];
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function phat() { ls.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
  function hoTro() { return typeof root.showDirectoryPicker === 'function'; }
  function bat() { return lsGet(LS_BAT) !== '0'; }
  function datTT(st, extra) {   // đổi trạng thái → báo giao diện (dải thông báo) chỉ khi thật sự đổi
    var doi = tt.state !== st; tt.state = st; if (extra) Object.keys(extra).forEach(function (k) { tt[k] = extra[k]; });
    if (doi && root.APP && root.APP.render) root.APP.render();
    phat();
  }

  function db() {
    return new Promise(function (ok, no) { var r = indexedDB.open('KPI_CN444', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; });
  }
  function kv(op, val) {
    return db().then(function (d) {
      return new Promise(function (ok) {
        var tx = d.transaction('kv', op === 'get' ? 'readonly' : 'readwrite'), s = tx.objectStore('kv'), q;
        if (op === 'get') { q = s.get(KEY_DIR); q.onsuccess = function () { ok(q.result); }; q.onerror = function () { ok(null); }; }
        else { if (op === 'set') s.put(val, KEY_DIR); else s.delete(KEY_DIR); tx.oncomplete = function () { ok(); }; tx.onerror = function () { ok(); }; }
      });
    }).catch(function () { return null; });
  }
  function taiDir() {
    if (daTai) return Promise.resolve(dirH);
    return kv('get').then(function (h) { dirH = h || null; daTai = true; return dirH; });
  }
  function quyen(h, hoi) {
    if (!h || !h.queryPermission) return Promise.resolve('granted');
    return Promise.resolve(h.queryPermission({ mode: 'readwrite' })).then(function (p) { return p === 'granted' || !hoi ? p : h.requestPermission({ mode: 'readwrite' }); });
  }
  /* Làm mới trạng thái (không hỏi quyền) → resolve tt */
  function lamMoi() {
    if (!hoTro()) { datTT('khong_ho_tro'); return Promise.resolve(tt); }
    return taiDir().then(function (h) {
      if (!h) { datTT('chua_chon', { ten: '' }); return tt; }
      return quyen(h, false).then(function (p) { datTT(p === 'granted' ? 'san_sang' : 'can_cap_quyen', { ten: h.name || '' }); return tt; });
    }).catch(function (e) { datTT('loi', { loi: e.message }); return tt; });
  }

  function ghiTep(dir, ten, text) {
    return dir.getFileHandle(ten, { create: true }).then(function (fh) { return fh.createWritable(); })
      .then(function (w) { return Promise.resolve(w.write(text)).then(function () { return w.close(); }); });
  }
  function lietTep(dir) {   // tên các tệp .json trực tiếp trong dir
    var out = [], it = dir.values();
    function buoc() { return it.next().then(function (r) { if (r.done) return out; if (r.value && r.value.kind === 'file') out.push(r.value.name); return buoc(); }); }
    return buoc();
  }
  function lietThang(root0) {
    var out = [], it = root0.values();
    function buoc() { return it.next().then(function (r) { if (r.done) return out; if (r.value && r.value.kind === 'directory' && /^\d{4}-\d{2}$/.test(r.value.name)) out.push(r.value); return buoc(); }); }
    return buoc();
  }
  /* Dọn bản cũ theo lịch giữ; mọi lỗi bỏ qua */
  function donCu(sub, now) {
    return lietThang(sub).then(function (dirs) {
      var tatca = [], map = {};
      return dirs.reduce(function (p, d) { return p.then(function () { map[d.name] = d; return lietTep(d).then(function (ds) { ds.forEach(function (n) { tatca.push(d.name + '/' + n); }); }); }); }, Promise.resolve()).then(function () {
        var xoa = chonXoa(tatca, now).xoa;
        return xoa.reduce(function (p, n) { return p.then(function (k) { var i = n.indexOf('/'); return map[n.slice(0, i)].removeEntry(n.slice(i + 1)).then(function () { return k + 1; }, function () { return k; }); }); }, Promise.resolve(0));
      });
    }).catch(function () { return 0; });
  }

  /* Ghi một bản. opt.ep = true: ghi ngay kể cả khi không đổi / đang tắt tự động (nút "Ghi ngay"). Luôn resolve { da_ghi, ly_do?, tep?, loi? }. */
  function ghi(opt) {
    opt = opt || {};
    if (!hoTro()) return Promise.resolve({ da_ghi: false, ly_do: 'khong_ho_tro' });
    if (!S || !S.isAdmin()) return Promise.resolve({ da_ghi: false, ly_do: 'khong_quyen' });
    if (!opt.ep && !bat()) return Promise.resolve({ da_ghi: false, ly_do: 'tat' });
    var st = S.state;
    if (!opt.ep && st.du_lieu_mau) return Promise.resolve({ da_ghi: false, ly_do: 'du_lieu_mau' });   // không sao lưu số giả lập
    if (dangGhi) { moi = true; return Promise.resolve({ da_ghi: false, ly_do: 'dang_ghi' }); }
    dangGhi = true;
    return taiDir().then(function (h) {
      if (!h) return { da_ghi: false, ly_do: 'chua_chon' };
      return quyen(h, false).then(function (p) {
        if (p !== 'granted') { datTT('can_cap_quyen', { ten: h.name || '' }); return { da_ghi: false, ly_do: 'can_cap_quyen' }; }
        // Chỉ so NỘI DUNG SỐ LIỆU: bỏ nhật ký + giờ lưu (đổi mỗi lần đăng nhập) để không sinh bản trùng
        var hash = fnv(JSON.stringify(Object.assign({}, st, { nhat_ky: null, cap_nhat_luc: 0 })));
        if (!opt.ep && hash === lsGet(LS_HASH)) return { da_ghi: false, ly_do: 'khong_doi' };
        var now = new Date(), nguoi = (S.userHienTai && S.userHienTai()) || 'admin', text = JSON.stringify(Object.assign({}, st, { xuat_luc: now.getTime() }));
        var soO = Object.keys(st.rec).filter(function (k) { return st.rec[k][0] !== null; }).length;
        var info = ['SAO LƯU KPI — ' + (st.settings.ten_chi_nhanh || ''), '', 'Cập nhật lúc : ' + gioVN(now) + ' (người ghi: ' + nguoi + ', máy ' + (S.mayId ? S.mayId() : '') + ')',
          'Số liệu      : ' + soO + ' ô số · ' + (st.don_vi || []).length + ' đơn vị · ' + (st.indicators || []).length + ' chỉ tiêu',
          'Ứng dụng     : KPI các phòng, năm theo dõi ' + (st.settings.nam || ''), '',
          'Khôi phục: mở ứng dụng → Dữ liệu & cài đặt → "Khôi phục (thay toàn bộ)" → chọn KPI_MOI_NHAT.json (hoặc tệp theo ngày trong thư mục tháng).',
          'Lịch giữ: mỗi ngày tối đa 4 bản (trước 10h / 10h–13h / 13h–16h / từ 16h) · tháng này giữ bản cuối mỗi ngày · tháng đã qua giữ 2 bản (ngày 15 và cuối tháng) · mọi năm đều giữ.'].join('\r\n') + '\r\n';
        var sub, ten = tenTep(now, nguoi), thang = thangStr(now);
        return h.getDirectoryHandle(SUB, { create: true }).then(function (d) { sub = d; return ghiTep(sub, TEN_MOI, text); })
          .then(function () { return sub.getDirectoryHandle(thang, { create: true }); }).then(function (dt) { return ghiTep(dt, ten, text); })
          .then(function () { return ghiTep(sub, TEN_INFO, info); })
          .then(function () { lsSet(LS_HASH, hash); lsSet(LS_LUC, String(now.getTime())); return donCu(sub, now.getTime()); })
          .then(function (xoa) { return { da_ghi: true, tep: [SUB + '/' + TEN_MOI, SUB + '/' + thang + '/' + ten], da_don: xoa, luc: now.getTime() }; });
      });
    }).catch(function (e) { return { da_ghi: false, ly_do: 'loi', loi: (e && e.message) || 'Không ghi được' }; })
      .then(function (kq) {
        dangGhi = false;
        if (kq.da_ghi) { datTT('san_sang', { luc: kq.luc, tep: kq.tep, loi: '' }); }
        else if (kq.ly_do === 'loi') datTT(tt.state === 'chua_biet' ? 'loi' : tt.state, { loi: kq.loi });
        tt.ly_do = kq.ly_do || '';
        if (moi) { moi = false; hen(); }
        return kq;
      });
  }
  /* Hẹn ghi sau ~10 giây yên tĩnh (gộp nhiều thay đổi liên tiếp thành một lần ghi) */
  function hen(ms) {
    if (!S || !S.isAdmin() || !bat() || (daTai && !dirH)) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { timer = null; ghi(); }, ms === undefined ? TRE : ms);
  }

  function chon() {
    if (!hoTro()) return Promise.resolve({ ok: false, loi: 'Trình duyệt này không cho chọn thư mục. Hãy dùng Google Chrome hoặc Microsoft Edge bản mới.' });
    return root.showDirectoryPicker({ id: 'kpi-saoluu', mode: 'readwrite', startIn: 'documents' }).then(function (h) {
      // Không cho chọn trùng thư mục dữ liệu chung — sao lưu phải nằm NGOÀI ổ mạng
      var chung = S && S.dir;
      return (chung && h.isSameEntry ? h.isSameEntry(chung) : Promise.resolve(false)).then(function (trung) {
        if (trung) return { ok: false, loi: 'Thư mục này đang là Data dùng chung. Hãy chọn một thư mục trên máy (VD D:\\Backup).' };
        return quyen(h, true).then(function (p) {
          if (p !== 'granted') return { ok: false, loi: 'Chưa được cấp quyền ghi vào thư mục.' };
          dirH = h; daTai = true;
          return kv('set', h).then(function () { try { localStorage.removeItem(LS_HASH); } catch (e) {} datTT('san_sang', { ten: h.name || '' }); return ghi({ ep: true }); }).then(function (kq) { return { ok: kq.da_ghi, ten: h.name || '', kq: kq, loi: kq.loi }; });
        });
      });
    }, function (e) { return e && e.name === 'AbortError' ? { ok: false, huy: true } : { ok: false, loi: (e && e.message) || 'Không chọn được thư mục' }; });
  }
  function capQuyen() {
    return taiDir().then(function (h) {
      if (!h) return { ok: false, loi: 'Chưa chọn thư mục sao lưu.' };
      return quyen(h, true).then(function (p) {
        if (p !== 'granted') return { ok: false, loi: 'Chưa được cấp quyền.' };
        datTT('san_sang', { ten: h.name || '' }); return ghi({}).then(function (kq) { return { ok: true, kq: kq }; });
      });
    }).catch(function (e) { return { ok: false, loi: (e && e.message) || 'Không cấp được quyền' }; });
  }
  function bo() { dirH = null; daTai = true; if (timer) { clearTimeout(timer); timer = null; } return kv('del').then(function () { datTT('chua_chon', { ten: '', tep: [] }); return { ok: true }; }); }
  function datBat(on) { lsSet(LS_BAT, on ? '1' : '0'); if (on) hen(); phat(); }

  /* Móc: số liệu đổi (kể cả số gộp từ máy khác) → hẹn ghi; đăng nhập → ghi sớm (chỉ khi nội dung đã đổi so với bản gần nhất) */
  if (S && S.on) S.on(function () { hen(); });
  lamMoi().then(function () { if (tt.state === 'san_sang') hen(3000); });

  root.SAO_LUU_MAY = {
    hoTro: hoTro, lamMoi: lamMoi, chon: chon, capQuyen: capQuyen, bo: bo, ghi: ghi, hen: hen, bat: bat, datBat: datBat,
    khiDangNhap: function () { taiDir().then(function (h) { if (h) hen(2000); }); },
    on: function (f) { ls.push(f); }, get tt() { return tt; }, get canQuyen() { return tt.state === 'can_cap_quyen'; },
    chonXoa: chonXoa, SUB: SUB
  };
})(typeof self !== 'undefined' ? self : this);
