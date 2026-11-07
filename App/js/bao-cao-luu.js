/* KHO BÁO CÁO GIAO BAN — tách riêng khỏi dữ liệu KPI.
 * - Trên máy: IndexedDB 'KPI_CN444_GIAO_BAN' (bền sau khi đóng ứng dụng). Không có IndexedDB → bộ nhớ phiên.
 * - Thư mục chung: Data\BAO_CAO_GIAO_BAN\<id>.json — CHỈ bản Hoàn thiện / Đã thay thế (bản nháp ở máy người lập). Dùng chung tay cầm thư mục đã kết nối (STORE.dir).
 * - BẤT BIẾN: bản đã Hoàn thiện không bị ghi đè nội dung (chỉ được chuyển "Đã thay thế"); mỗi id một tệp, không ghi vào id khác. */
(function (root) {
  var DB = 'KPI_CN444_GIAO_BAN', ST = 'bao_cao', THU_MUC = 'BAO_CAO_GIAO_BAN', mem = {}, dbP = null;
  function db() {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    if (!dbP) dbP = new Promise(function (ok) { try { var r = indexedDB.open(DB, 1); r.onupgradeneeded = function () { if (!r.result.objectStoreNames.contains(ST)) r.result.createObjectStore(ST, { keyPath: 'id' }); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { ok(null); }; } catch (e) { ok(null); } });
    return dbP;
  }
  function tx(mode, fn) { return db().then(function (d) { if (!d) return fn(null); return new Promise(function (ok, no) { var t = d.transaction(ST, mode), s = t.objectStore(ST), kq; fn(s, function (v) { kq = v; }); t.oncomplete = function () { ok(kq); }; t.onerror = function () { no(t.error); }; }); }); }
  function tatCa() { return tx('readonly', function (s, xong) { if (!s) return Object.keys(mem).map(function (k) { return JSON.parse(mem[k]); }); var r = s.getAll(); r.onsuccess = function () { xong(r.result || []); }; }); }
  function doc(id) { return tx('readonly', function (s, xong) { if (!s) return mem[id] ? JSON.parse(mem[id]) : null; var r = s.get(id); r.onsuccess = function () { xong(r.result || null); }; }); }
  function dat(bc) { return tx('readwrite', function (s) { if (!s) { mem[bc.id] = JSON.stringify(bc); return bc; } s.put(bc); }); }
  function xoaDb(id) { return tx('readwrite', function (s) { if (!s) { delete mem[id]; return; } s.delete(id); }); }

  /* Được ghi `moi` đè lên `cu` không? (hàm thuần) */
  function choGhi(cu, moi) {
    if (!moi || !moi.id || !moi.ky || !Array.isArray(moi.van_de)) return { ok: false, loi: 'Bản ghi không hợp lệ.' };
    if (!cu) return { ok: true };
    if (cu.trang_thai === 'nhap') return { ok: true };
    if (cu.trang_thai === 'hoan_thien' && moi.trang_thai === 'thay_the') return { ok: true };
    if (cu.trang_thai === moi.trang_thai && JSON.stringify(cu.snapshot) === JSON.stringify(moi.snapshot) && JSON.stringify(cu.van_de) === JSON.stringify(moi.van_de) && JSON.stringify(cu.giai_phap) === JSON.stringify(moi.giai_phap) && JSON.stringify(cu.ket_luan) === JSON.stringify(moi.ket_luan)) return { ok: true, giong: true };
    return { ok: false, loi: 'Báo cáo đã hoàn thiện — không ghi đè. Dùng "Mở lại để sửa" (tạo bản mới).' };
  }
  function thuMucChung() { var d = root.STORE && root.STORE.dir; return d && d.getDirectoryHandle ? d.getDirectoryHandle(THU_MUC, { create: true }) : Promise.resolve(null); }
  function ghiChung(bc) {
    if (bc.trang_thai === 'nhap') return Promise.resolve(false);
    return thuMucChung().then(function (d) {
      if (!d) return false;
      return d.getFileHandle(bc.id + '.json', { create: true }).then(function (fh) { return fh.createWritable(); }).then(function (w) { return Promise.resolve(w.write(JSON.stringify(bc))).then(function () { return w.close(); }); }).then(function () { return true; });
    }).catch(function (e) { console.error(e); return false; });
  }
  /* Lưu bản ghi (kiểm tra bất biến); bản không phải nháp ghi thêm lên thư mục chung. Trả bc. */
  function luu(bc) {
    return doc(bc.id).then(function (cu) {
      var c = choGhi(cu, bc); if (!c.ok) throw new Error(c.loi);
      return (c.giong ? Promise.resolve() : dat(bc)).then(function () { return ghiChung(bc); }).then(function () { return bc; });
    });
  }
  /* Xoá: chỉ bản nháp */
  function xoaNhap(id) { return doc(id).then(function (cu) { if (!cu) return false; if (cu.trang_thai !== 'nhap') throw new Error('Chỉ xoá được bản nháp.'); return xoaDb(id).then(function () { return true; }); }); }
  function ds() { return tatCa().then(function (a) { return a.map(root.KPI_BAO_CAO.meta).sort(function (x, y) { return (y.sua_luc || '') < (x.sua_luc || '') ? -1 : 1; }); }); }
  /* Đọc các bản hoàn thiện của máy khác trên thư mục chung → lưu vào máy (không đè bản hoàn thiện đang có). Trả số báo cáo nhận thêm. */
  function napChung() {
    return thuMucChung().then(function (d) {
      if (!d || !d.values) return 0;
      return tatCa().then(function (all) {
        var co = {}; all.forEach(function (b) { co[b.id] = b; }); var ten = [], it = d.values();
        function buoc() { return it.next().then(function (r) { if (r.done) return; if (r.value && r.value.kind === 'file' && /^BCGB_.*\.json$/i.test(r.value.name)) ten.push(r.value.name); return buoc(); }); }
        return buoc().then(function () {
          var moi = 0;
          return ten.reduce(function (p, n) {
            return p.then(function () {
              var id = n.replace(/\.json$/i, ''), cu = co[id]; if (cu && cu.trang_thai === 'thay_the') return;
              return d.getFileHandle(n).then(function (fh) { return fh.getFile(); }).then(function (f) { return f.text(); }).then(function (t) {
                var bc = JSON.parse(String(t).replace(/^﻿/, '')); if (!bc || bc.id !== id || bc.trang_thai === 'nhap' || (cu && cu.trang_thai === bc.trang_thai)) return;
                if (!choGhi(cu, bc).ok) return; return dat(bc).then(function () { moi++; });
              }).catch(function (e) { console.error('Đọc ' + n, e); });
            });
          }, Promise.resolve()).then(function () { return moi; });
        });
      });
    }).catch(function () { return 0; });
  }
  /* Nạp 1 tệp JSON báo cáo (sao lưu) → lưu nếu hợp lệ và không đè bản hoàn thiện */
  function napJson(text) {
    var bc; try { bc = JSON.parse(String(text).replace(/^﻿/, '')); } catch (e) { return Promise.reject(new Error('Tệp không phải JSON.')); }
    if (!bc || !/^BCGB_/.test(bc.id || '') || !bc.snapshot) return Promise.reject(new Error('Tệp không phải báo cáo giao ban.'));
    return luu(bc);
  }
  root.KPI_BAO_CAO_LUU = { THU_MUC: THU_MUC, choGhi: choGhi, luu: luu, doc: doc, ds: ds, tatCa: tatCa, xoaNhap: xoaNhap, napChung: napChung, napJson: napJson, _mem: function () { mem = {}; } };
})(typeof window !== 'undefined' ? window : this);
