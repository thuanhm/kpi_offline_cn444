/* STORE — giữ dữ liệu, lưu trên máy (localStorage), đồng bộ thư mục dùng chung (Data) và sao lưu JSON.
 * Mỗi ô số là 1 bản ghi [giá trị, thời điểm] → nhiều máy cùng ghi vào Data được GỘP theo từng ô (ô nào sửa sau thắng),
 * không ghi đè cả tệp. Xoá số = ghi giá trị null (giữ dấu thời điểm để máy khác cũng xoá theo). */
(function (root) {
  var CFG = root.KPI_CFG, LS_KEY = 'KPI_CN444.data.v2', LS_MODE = 'KPI_CN444.admin', FILE = 'KPI_CHI_NHANH.json';
  var state = null, version = 0, model = null, listeners = [], saveTimer = null, dirHandle = null, dirOk = false, fileStamp = 0;

  function now() { return Date.now(); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function key(k, ct, dv, nam, thang) { return k + '|' + ct + '|' + dv + '|' + nam + '|' + thang; }

  /* Bộ đếm thay đổi + đệm chuỗi JSON: mỗi lần lưu chỉ stringify 1 lần và bỏ qua nếu state không đổi.
   * mut tăng ở bump / scheduleSave / merge có thay đổi; json() chỉ dựng lại khi mut đổi; luuMay() chỉ ghi localStorage khi chuỗi mới hơn lần ghi trước. */
  var mut = 0, jsonMut = -1, jsonStr = '', lsMut = -2, mergeCh = false;
  function json() { if (jsonMut !== mut) { jsonStr = JSON.stringify(state); jsonMut = mut; } return jsonStr; }
  function luuMay() {
    var s = json(); if (lsMut === jsonMut) return;
    try { localStorage.setItem(LS_KEY, s); lsMut = jsonMut; }
    catch (e) { root.UI && UI.toast('Không lưu được trên máy: ' + e.message, 'err'); }
  }
  /* Mã máy (dùng chung khoá với nap-tu-dong.js) — phân biệt người nhập khi nhiều người dùng chung một tài khoản */
  var mayCache = null;
  function mayId() {
    if (mayCache) return mayCache;
    try { var x = localStorage.getItem('KPI_CN444.may'); if (!x) { x = 'M' + Math.random().toString(36).slice(2, 8).toUpperCase(); localStorage.setItem('KPI_CN444.may', x); } mayCache = x; }
    catch (e) { mayCache = 'M?'; }
    return mayCache;
  }
  /* Nhãn người nhập ghi vào ô số: "tên_đăng_nhập@mã_máy" (rỗng nếu chưa đăng nhập → ô giữ dạng [số, giờ] gọn như cũ) */
  function nhanNguoi() { var u = userHienTai(); return u ? u + '@' + mayId() : ''; }

  function normalize(d) {
    var base = CFG.mac_dinh();
    if (!d || typeof d !== 'object') d = base;
    ['khoi', 'don_vi', 'indicators', 'weights'].forEach(function (k) { if (!Array.isArray(d[k])) d[k] = base[k]; });
    d.settings = Object.assign({}, base.settings, d.settings || {});
    d.settings.nguong = Object.assign({}, base.settings.nguong, (d.settings && d.settings.nguong) || {});
    d.rec = d.rec && typeof d.rec === 'object' ? d.rec : {};
    d.ghi_chu = d.ghi_chu || {};
    d.nhat_ky = Array.isArray(d.nhat_ky) ? d.nhat_ky.slice(-300) : [];
    d.dieu_chinh = Array.isArray(d.dieu_chinh) ? d.dieu_chinh : [];
    d.diem_kpi = Array.isArray(d.diem_kpi) ? d.diem_kpi : [];
    d.so_ngay = d.so_ngay && typeof d.so_ngay === 'object' ? d.so_ngay : {};
    d.tu_dong_ghi = d.tu_dong_ghi && typeof d.tu_dong_ghi === 'object' ? d.tu_dong_ghi : {};
    d.users_xoa = d.users_xoa && typeof d.users_xoa === 'object' ? d.users_xoa : {};   // dấu vết xoá người dùng { tên_thường: giờ } → máy khác gộp vào không làm sống lại
    d.bgd = Array.isArray(d.bgd) ? d.bgd : [];   // thành viên Ban giám đốc [{ ma, ho_ten, chuc_danh, phu_trach: [mã đơn vị], thu_tu, trang_thai }] (thuộc danh mục: gộp theo dm_luc)
    d.bgd_trong_so = Array.isArray(d.bgd_trong_so) ? d.bgd_trong_so : [];   // bảng KPI riêng [{ ma_bgd, ma_chi_tieu, trong_so, toi_da, nguon: 'cn' | 'phu_trach' }]
    d.khoa_ky = d.khoa_ky && typeof d.khoa_ky === 'object' ? d.khoa_ky : {};   // khoá kỳ { 'nam|thang': { khoa, t, ai, lydo } } — bản ghi mới nhất (t) thắng khi gộp
    d.hanh_dong = Array.isArray(d.hanh_dong) ? d.hanh_dong : [];   // theo dõi hành động khắc phục (gộp theo id, luc mới nhất thắng)
    d.ma_cu = d.ma_cu && typeof d.ma_cu === 'object' ? d.ma_cu : {};   // dấu vết đổi mã { 'ct:CU' | 'dv:CU': { moi, t } } → số liệu máy khác còn mã cũ được chuyển sang mã mới
    d.settings.nap = Object.assign({ bat: true, che_do: 'hoi', ghi_th: 'cuoi_thang' }, d.settings.nap || {});
    if (!Array.isArray(d.users) || d.users.length === 0) {
      d.users = [{
        user: 'admin',
        ten: 'Quản trị viên',
        salt: '/+1/YRz8DAr2/OkzqyBf0w==',
        iter: 150000,
        h: 'hyM1a//6LS/67S+y5OpGHoLQTYCYmuTlm0ECGVvzgcs=',
        mac_dinh: true,
        vai_tro: 'admin',
        tao_luc: now()
      }];
    }
    if (!Array.isArray(d.cong_thuc)) d.cong_thuc = root.CONG_THUC ? root.CONG_THUC.mau() : [];
    if (!d.settings.mig_25) {   // thêm chỉ tiêu cuối kỳ (tham khảo) và công thức mẫu nếu dữ liệu cũ chưa có
      CFG.CT_MOI_25.forEach(function (x) {
        if (d.indicators.some(function (i) { return i.ma === x.ind.ma; })) return;
        var bq = d.indicators.filter(function (i) { return i.ma === x.ind.ma.replace('CUOI_KY', 'BQ'); })[0] || d.indicators.filter(function (i) { return i.ma === x.ind.ma.replace('CUOI_KY', 'TT'); })[0];
        d.indicators.push(Object.assign({ thu_tu: bq ? (bq.thu_tu || 0) + 0.5 : 99 }, x.ind));
        x.w.forEach(function (ts, k) { var kh = CFG.KHOI_COT[k]; if (ts !== null && d.khoi.some(function (q) { return q.ma === kh; })) d.weights.push({ ma_chi_tieu: x.ind.ma, khoi: kh, trong_so: 0, toi_da: 1.3 }); });
      });
      if (root.CONG_THUC) root.CONG_THUC.mauCuoiKy().forEach(function (f) { if (!d.cong_thuc.some(function (x) { return x.id === f.id || x.ma_ct === f.ma_ct; })) d.cong_thuc.push(f); });
      d.settings.mig_25 = true;
    }
    d.dm_luc = d.dm_luc || 0; d.schema = 2;
    return d;
  }

  function load() {
    try { var raw = localStorage.getItem(LS_KEY); state = normalize(raw ? JSON.parse(raw) : null); if (!raw) { DEMO.tao(state); } }
    catch (e) { console.error(e); state = normalize(null); DEMO.tao(state); }
    bump(false);
  }
  function bump(persist) {
    version++; mut++; model = null;
    if (persist !== false) scheduleSave();
    listeners.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
  }
  /* ---------- Số theo ngày: gộp THEO TỪNG Ô ----------
   * Ngày = { t, v: {ct|dv: số}, tv?: {ct|dv: giờ ghi ô}, tx?: giờ xoá cả ngày }.
   * Mỗi ô lấy bản mới hơn giữa hai máy (ô không có tv → dùng t của ngày, tương thích tệp cũ); ô ghi trước lần xoá ngày (tx) bị bỏ.
   * Ngày rỗng không có tx cũng coi là lần xoá lúc t. */
  function gioO(d, sk) { return d.tv && d.tv[sk] ? d.tv[sk] : d.t || 0; }
  function gioXoa(d) { return d.tx || (d.v && Object.keys(d.v).length === 0 ? d.t || 0 : 0); }
  function gopNgay(a, b) {
    var tx = Math.max(gioXoa(a), gioXoa(b)), v = {}, tv = {}, keys = {}, k, doi = false;
    Object.keys(a.v || {}).forEach(function (x) { keys[x] = 1; }); Object.keys(b.v || {}).forEach(function (x) { keys[x] = 1; });
    for (k in keys) {
      var coA = a.v && k in a.v, coB = b.v && k in b.v, ta = coA ? gioO(a, k) : -1, tb = coB ? gioO(b, k) : -1, tt = Math.max(ta, tb);
      if (tt <= tx) continue;
      var tuB = tb > ta; v[k] = tuB ? b.v[k] : a.v[k]; tv[k] = tt;
      if (tuB && (!coA || a.v[k] !== b.v[k])) doi = true;
    }
    var t = Math.max(a.t || 0, b.t || 0), out = { t: t, v: v, tv: tv };
    if (tx) out.tx = tx;
    if (t !== (a.t || 0) || tx !== gioXoa(a) || Object.keys(v).length !== Object.keys(a.v || {}).length) doi = true;
    return { ngay: out, doi: doi };
  }
  /* Máy khác có thiếu gì so với bản của mình không (để biết có cần ghi lại tệp chung) */
  function ngayThieu(a, b) {
    if (!b) return true; if (gioXoa(a) > gioXoa(b)) return true;
    return Object.keys(a.v || {}).some(function (k) { return !(b.v && k in b.v) || gioO(a, k) > gioO(b, k); });
  }

  function getModel() { if (!model) model = new root.KPI_ENGINE.Model(state, version); return model; }

  function scheduleSave() {
    mut++; state.cap_nhat_luc = now();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 400);
  }
  function saveNow() {
    luuMay();
    if (dirOk) writeShared();
  }

  function log(viec) {
    var e = { t: now(), viec: viec }, ai = nguoi(); if (ai) { e.ai = ai; e.may = mayId(); }
    state.nhat_ky.push(e);
    if (state.nhat_ky.length > 300) state.nhat_ky.splice(0, state.nhat_ky.length - 300);
  }

  /* ---------- Ghi số ---------- */
  /* Ô số = [giá trị, giờ ms] hoặc [giá trị, giờ ms, người nhập]. ai: nhãn người nhập ('' = không ghi; mặc định lấy phiên hiện tại). */
  function oSo(val, t, ai) { return ai ? [val, t, ai] : [val, t]; }
  var chanDem = 0;   // số ô bị từ chối vì thuộc kỳ đã khoá trong lần ghi gần nhất
  function setVal(k, ct, dv, nam, thang, v, ai) {
    if (kyKhoa(nam, thang)) { chanDem++; return false; }
    var kk = key(k, ct, dv, nam, thang), cu = state.rec[kk];
    var val = (typeof v === 'number' && isFinite(v)) ? v : null;
    if (cu && cu[0] === val) return false;
    if (!cu && val === null) return false;
    state.rec[kk] = oSo(val, now(), ai);
    return true;
  }
  /* items: [{k, ct, dv, nam, thang, v}] · opts.ai: nhãn người nhập (nạp tự động truyền 'auto') */
  function setMany(items, nhan, opts) {
    var n = 0, ai = opts && opts.ai !== undefined ? opts.ai : nhanNguoi();
    chanDem = 0;
    items.forEach(function (it) { if (setVal(it.k, it.ct, it.dv, it.nam, it.thang, it.v, ai)) n++; });
    if (n) { if (nhan) log(nhan + ' (' + n + ' ô)'); bump(); }
    return n;
  }
  function getRaw(k, ct, dv, nam, thang) { var r = state.rec[key(k, ct, dv, nam, thang)]; return r ? r[0] : null; }
  /* Ai nhập ô này, lúc nào → { t, ai } (ai rỗng với số cũ chưa ghi người nhập) hoặc null nếu chưa có ô */
  function getCellInfo(k, ct, dv, nam, thang) { var r = state.rec[key(k, ct, dv, nam, thang)]; return r ? { t: r[1] || 0, ai: r[2] || '' } : null; }
  function xoaKy(nam, thang, k) {
    var n = 0, t = now(), ai = nhanNguoi();
    Object.keys(state.rec).forEach(function (kk) {
      var p = kk.split('|');
      if (+p[3] === nam && (!thang || +p[4] === thang) && (!k || p[0] === k) && state.rec[kk][0] !== null && !kyKhoa(+p[3], +p[4])) { state.rec[kk] = oSo(null, t, ai); n++; }
    });
    if (n) { log('Xoá số ' + (k === 'p' ? 'kế hoạch' : k === 'a' ? 'thực hiện' : 'KH + TH') + ' ' + (thang ? 'T' + thang + '/' : 'năm ') + nam + ' (' + n + ' ô)'); bump(); }
    return n;
  }

  /* ---------- Khoá kỳ ---------- */
  function kyKhoa(nam, thang) { var x = state.khoa_ky[nam + '|' + thang]; return !!(x && x.khoa); }
  function thongTinKhoa(nam, thang) { return state.khoa_ky[nam + '|' + thang] || null; }
  /* Ném lỗi nếu có tháng nào trong [tu, den] của năm đã khoá (dùng cho điều chỉnh / cộng trừ điểm trải nhiều tháng) */
  function chanKhoa(nam, tu, den) {
    for (var t = +tu || 1; t <= (+den || +tu || 1); t++) if (kyKhoa(+nam, t)) throw new Error('Kỳ T' + t + '/' + nam + ' đã khoá số liệu — mở khoá (ghi rõ lý do) trước khi sửa.');
  }
  function khoaKy(nam, thang) {
    if (!isAdmin()) return false;
    nam = +nam; thang = +thang; if (kyKhoa(nam, thang)) return false;
    state.khoa_ky[nam + '|' + thang] = { khoa: true, t: now(), ai: nguoi() || '' };
    log('Khoá kỳ T' + thang + '/' + nam); bump(); return true;
  }
  function moKhoaKy(nam, thang, lyDo) {
    if (!isAdmin()) return Promise.reject(new Error('Chỉ quản trị viên được mở khoá kỳ.'));
    lyDo = String(lyDo || '').trim(); if (lyDo.length < 5) return Promise.reject(new Error('Nhập lý do mở khoá (ít nhất 5 ký tự).'));
    nam = +nam; thang = +thang; if (!kyKhoa(nam, thang)) return Promise.resolve(false);
    state.khoa_ky[nam + '|' + thang] = { khoa: false, t: now(), ai: nguoi() || '', lydo: lyDo };
    log('Mở khoá kỳ T' + thang + '/' + nam + ' — lý do: ' + lyDo); bump(); return Promise.resolve(true);
  }

  /* ---------- Hành động khắc phục ---------- */
  function luuHanhDong(h) {
    var t = now(), ds = state.hanh_dong, cu = h.id ? ds.filter(function (x) { return x.id === h.id; })[0] : null;
    var tieuDe = String(h.tieu_de !== undefined ? h.tieu_de : (cu ? cu.tieu_de : '') || '').trim(); if (!tieuDe) throw new Error('Nhập nội dung hành động.');
    var rec = Object.assign({}, cu || { id: 'HD_' + t + '_' + Math.random().toString(36).slice(2, 6), tao_luc: t, tao_boi: nguoi() || '' }, h, { tieu_de: tieuDe, luc: t, ai: nguoi() || '' });
    rec.trang_thai = ['moi', 'dang_lam', 'xong', 'huy'].indexOf(rec.trang_thai) >= 0 ? rec.trang_thai : 'moi';
    if (cu) ds[ds.indexOf(cu)] = rec; else ds.push(rec);
    log((cu ? 'Cập nhật' : 'Thêm') + ' hành động khắc phục: ' + tieuDe.slice(0, 60)); bump(); return rec;
  }
  function xoaHanhDong(id) {
    var x = state.hanh_dong.filter(function (y) { return y.id === id && !y.xoa; })[0]; if (!x) return false;
    x.xoa = true; x.luc = now(); log('Xoá hành động khắc phục: ' + String(x.tieu_de).slice(0, 60)); bump(); return true;
  }
  function getHanhDong() { return state.hanh_dong.filter(function (x) { return !x.xoa; }); }

  /* ---------- Danh mục ---------- */
  function setDanhMuc(patch, nhan) {
    Object.keys(patch).forEach(function (k) { state[k] = patch[k]; });
    state.dm_luc = now(); log(nhan || 'Sửa danh mục'); bump();
  }
  function setSettings(patch) { state.settings = Object.assign({}, state.settings, patch); state.dm_luc = now(); bump(); }

  /* Ghi dấu vết đổi mã; các dấu vết trỏ tới mã cũ này được nối thẳng tới mã mới (A→B rồi B→C ⇒ A→C) */
  function ghiMaCu(loai, cu, moi, t) {
    var mc = state.ma_cu;
    Object.keys(mc).forEach(function (k) { if (k.indexOf(loai + ':') === 0 && mc[k].moi === cu) mc[k] = { moi: moi, t: mc[k].t }; });
    mc[loai + ':' + cu] = { moi: moi, t: t };
    delete mc[loai + ':' + moi];   // mã mới từng là mã cũ đã bỏ → dùng lại hợp lệ
  }
  /* Đổi mã đơn vị (cascade rename toàn bộ số liệu, nhận xét, điều chỉnh) */
  function doiMaDonVi(maCu, maMoi) {
    if (!maCu || !maMoi || maCu === maMoi) return 0;
    var t = now(), n = 0;
    ghiMaCu('dv', maCu, maMoi, t);
    (state.bgd || []).forEach(function (m) { m.phu_trach = (m.phu_trach || []).map(function (x) { return x === maCu ? maMoi : x; }); });
    // 1. Số liệu rec: k|ct|dv|nam|thang
    Object.keys(state.rec).forEach(function (k) {
      var p = k.split('|');
      if (p[2] === maCu) {
        var v = state.rec[k];
        delete state.rec[k];
        p[2] = maMoi;
        state.rec[p.join('|')] = oSo(v[0], t, v[2]);
        n++;
      }
    });
    // 2. Nhận xét ghi_chu: dv|nam|thang
    Object.keys(state.ghi_chu).forEach(function (k) {
      var p = k.split('|');
      if (p[0] === maCu) {
        var v = state.ghi_chu[k];
        delete state.ghi_chu[k];
        p[0] = maMoi;
        state.ghi_chu[p.join('|')] = [v[0], t, v[2] || ''];
      }
    });
    // 3. Điều chỉnh thủ công
    (state.dieu_chinh || []).forEach(function (x) {
      if (x.dv === maCu) { x.dv = maMoi; x.luc = t; }
    });
    // 3b. Cộng/trừ điểm KPI
    (state.diem_kpi || []).forEach(function (x) {
      if (x.dv === maCu) { x.dv = maMoi; x.luc = t; }
    });
    // 4. Số theo ngày so_ngay
    Object.keys(state.so_ngay || {}).forEach(function (day) {
      var obj = state.so_ngay[day];
      if (obj && obj.v) {
        Object.keys(obj.v).forEach(function (sk) {
          var p = sk.split('|');
          if (p[1] === maCu) {
            var val = obj.v[sk], tk = obj.tv && obj.tv[sk];
            delete obj.v[sk]; if (obj.tv) delete obj.tv[sk];
            p[1] = maMoi;
            obj.v[p.join('|')] = val; if (tk) obj.tv[p.join('|')] = tk;
          }
        });
      }
    });
    log('Đổi mã đơn vị từ ' + maCu + ' sang ' + maMoi + ' (' + n + ' ô số)');
    return n;
  }

  /* Đổi mã khối (cascade rename đơn vị và trọng số) */
  function doiMaKhoi(maCu, maMoi) {
    if (!maCu || !maMoi || maCu === maMoi) return;
    (state.don_vi || []).forEach(function (u) {
      if (u.khoi === maCu) u.khoi = maMoi;
    });
    (state.weights || []).forEach(function (w) {
      if (w.khoi === maCu) w.khoi = maMoi;
    });
    log('Đổi mã khối từ ' + maCu + ' sang ' + maMoi);
  }

  /* Đổi mã chỉ tiêu (cascade rename số liệu, trọng số, công thức) */
  function doiMaChiTieu(maCu, maMoi) {
    if (!maCu || !maMoi || maCu === maMoi) return 0;
    var t = now(), n = 0;
    ghiMaCu('ct', maCu, maMoi, t);
    (state.bgd_trong_so || []).forEach(function (w) { if (w.ma_chi_tieu === maCu) w.ma_chi_tieu = maMoi; });
    Object.keys(state.rec).forEach(function (k) {
      var p = k.split('|');
      if (p[1] === maCu) {
        var v = state.rec[k];
        delete state.rec[k];
        p[1] = maMoi;
        state.rec[p.join('|')] = oSo(v[0], t, v[2]);
        n++;
      }
    });
    (state.weights || []).forEach(function (w) {
      if (w.ma_chi_tieu === maCu) w.ma_chi_tieu = maMoi;
    });
    (state.cong_thuc || []).forEach(function (f) {
      if (f.ma_ct === maCu) f.ma_ct = maMoi;
    });
    Object.keys(state.so_ngay || {}).forEach(function (day) {
      var obj = state.so_ngay[day];
      if (obj && obj.v) {
        Object.keys(obj.v).forEach(function (sk) {
          var p = sk.split('|');
          if (p[0] === maCu) {
            var val = obj.v[sk], tk = obj.tv && obj.tv[sk];
            delete obj.v[sk]; if (obj.tv) delete obj.tv[sk];
            p[0] = maMoi;
            obj.v[p.join('|')] = val; if (tk) obj.tv[p.join('|')] = tk;
          }
        });
      }
    });
    log('Đổi mã chỉ tiêu từ ' + maCu + ' sang ' + maMoi + ' (' + n + ' ô số)');
    return n;
  }

  /* ---------- Gộp dữ liệu từ máy khác / tệp sao lưu ---------- */
  /* khongSao = true: `other` là đối tượng vừa JSON.parse từ tệp (không ai dùng lại) → bỏ bước sao chép sâu 500 KB.
   * Trả số ô/mục đổi giá trị (để báo người dùng); mergeCh = state có thay đổi gì (kể cả chỉ đổi giờ) → làm mất hiệu lực bộ đệm JSON. */
  function merge(other, khongSao) {
    // Tệp không có danh sách người dùng thì normalize() tự chèn admin mặc định (mật khẩu 1111, giờ = bây giờ) → sẽ đè tài khoản thật. Ghi nhớ trước khi chuẩn hoá.
    var coUser = !!(other && Array.isArray(other.users) && other.users.length), coBgd = !!(other && Array.isArray(other.bgd));
    other = normalize(khongSao ? other : clone(other));
    var doi = 0, ch = false, rec = state.rec, orec = other.rec, k, a, b, kk;
    // Danh mục trước (dm_luc mới hơn thì thay cả danh mục) để biết mã nào còn tồn tại khi chuyển mã cũ → mới
    if ((other.dm_luc || 0) > (state.dm_luc || 0)) {
      ['khoi', 'don_vi', 'indicators', 'weights', 'settings', 'cong_thuc'].forEach(function (k) { state[k] = other[k]; });
      if (coBgd) { state.bgd = other.bgd; state.bgd_trong_so = other.bgd_trong_so; }
      state.dm_luc = other.dm_luc; doi++; ch = true;
    }
    var mcMoi = false;
    for (k in other.ma_cu) { a = state.ma_cu[k]; b = other.ma_cu[k]; if (!a || (b.t || 0) > (a.t || 0)) { state.ma_cu[k] = b; ch = true; mcMoi = true; } }
    var kk0 = state.khoa_ky;   // khoá kỳ: bản ghi mới hơn thắng; ô số ghi SAU giờ khoá trên máy chưa biết lệnh khoá thì bị bỏ khi gộp
    for (k in other.khoa_ky) { a = kk0[k]; b = other.khoa_ky[k]; if (!a || (b.t || 0) > (a.t || 0)) { kk0[k] = b; ch = true; } }
    var khoaT = null; for (k in kk0) if (kk0[k].khoa) { (khoaT = khoaT || {})[k] = kk0[k].t || 0; }
    var hdMap = {}, hdCh = false; state.hanh_dong.forEach(function (x) { hdMap[x.id] = x; });
    other.hanh_dong.forEach(function (x) { var a2 = hdMap[x.id]; if (!a2 || (x.luc || 0) > (a2.luc || 0)) { hdMap[x.id] = x; doi++; hdCh = true; } });
    if (hdCh) { state.hanh_dong = Object.keys(hdMap).map(function (k2) { return hdMap[k2]; }); ch = true; }
    var coMC = Object.keys(state.ma_cu).length > 0, conMa = null;
    if (coMC) { conMa = { ct: {}, dv: {} }; state.indicators.forEach(function (i) { conMa.ct[i.ma] = 1; }); state.don_vi.forEach(function (u) { conMa.dv[u.ma] = 1; }); }
    // Mã cũ đã đổi (và không còn trong danh mục) → mã hiện hành; ts không mới hơn lúc đổi = bản đã được chuyển rồi (bỏ), mới hơn = nhập sau khi đổi trên máy chưa cập nhật (chuyển sang mã mới)
    var doiMa = function (loai, ma, ts) {
      var e = state.ma_cu[loai + ':' + ma], hop = 0;
      if (!e || conMa[loai][ma]) return ma;
      if ((ts || 0) <= e.t) return null;
      while (e && !conMa[loai][ma] && hop++ < 8) { ma = e.moi; e = state.ma_cu[loai + ':' + ma]; }
      return ma;
    };
    var doiKhoa = function (key, iCt, iDv, ts) {
      var p = key.split('|'), m;
      if (iCt >= 0) { m = doiMa('ct', p[iCt], ts); if (m === null) return null; p[iCt] = m; }
      if (iDv >= 0) { m = doiMa('dv', p[iDv], ts); if (m === null) return null; p[iDv] = m; }
      return p.join('|');
    };
    if (coMC && mcMoi) {   // máy này vừa biết thêm việc đổi mã → dọn số/nhận xét của chính mình còn nằm ở mã cũ
      Object.keys(rec).forEach(function (k0) {
        var c0 = rec[k0], k1 = doiKhoa(k0, 1, 2, c0[1]);
        if (k1 === k0) return;
        delete rec[k0]; ch = true;
        if (k1 !== null && (!rec[k1] || (c0[1] || 0) > (rec[k1][1] || 0))) rec[k1] = c0;
      });
      Object.keys(state.ghi_chu).forEach(function (k0) {
        var c0 = state.ghi_chu[k0], k1 = doiKhoa(k0, -1, 0, c0[1]);
        if (k1 === k0) return;
        delete state.ghi_chu[k0]; ch = true;
        if (k1 !== null && (!state.ghi_chu[k1] || (c0[1] || 0) > (state.ghi_chu[k1][1] || 0))) state.ghi_chu[k1] = c0;
      });
    }
    for (k in orec) {
      b = orec[k]; kk = k;
      if (coMC) { kk = doiKhoa(k, 1, 2, b[1]); if (kk === null) continue; }
      a = rec[kk];
      if (khoaT) { var pk = kk.split('|'), lt = khoaT[pk[3] + '|' + pk[4]]; if (lt !== undefined && (b[1] || 0) > lt) continue; }
      if (!a || (b[1] || 0) > (a[1] || 0)) { if (!a || a[0] !== b[0]) doi++; rec[kk] = b; ch = true; }
    }
    var dcMap = {}, dcCh = false; state.dieu_chinh.forEach(function (x) { dcMap[x.id] = x; });
    other.dieu_chinh.forEach(function (x) { var a = dcMap[x.id]; if (!a || (x.luc || 0) > (a.luc || 0)) { dcMap[x.id] = x; doi++; dcCh = true; } });
    if (dcCh) { state.dieu_chinh = Object.keys(dcMap).map(function (k) { return dcMap[k]; }); ch = true; }
    var dkpMap = {}, dkpCh = false; (state.diem_kpi || []).forEach(function (x) { dkpMap[x.id] = x; });
    (other.diem_kpi || []).forEach(function (x) { var a = dkpMap[x.id]; if (!a || (x.luc || 0) > (a.luc || 0)) { dkpMap[x.id] = x; doi++; dkpCh = true; } });
    if (dkpCh) { state.diem_kpi = Object.keys(dkpMap).map(function (k) { return dkpMap[k]; }); ch = true; }
    for (k in other.so_ngay) {
      a = state.so_ngay[k]; b = other.so_ngay[k]; if (!b || typeof b !== 'object') continue;
      if (coMC && b.v) { var nv = {}, ntv = {}; Object.keys(b.v).forEach(function (sk) { var k2 = doiKhoa(sk, 0, 1, (b.t || 0) + 1); if (k2 !== null) { nv[k2] = b.v[sk]; if (b.tv && b.tv[sk]) ntv[k2] = b.tv[sk]; } }); b = Object.assign({}, b, { v: nv, tv: ntv }); }
      if (!a) { state.so_ngay[k] = b; doi++; ch = true; continue; }
      var g = gopNgay(a, b); if (g.doi) { state.so_ngay[k] = g.ngay; doi++; ch = true; }
    }
    for (k in other.tu_dong_ghi) if ((other.tu_dong_ghi[k] || 0) > (state.tu_dong_ghi[k] || 0)) { state.tu_dong_ghi[k] = other.tu_dong_ghi[k]; ch = true; }
    for (k in other.ghi_chu) {
      b = other.ghi_chu[k]; kk = k;
      if (coMC) { kk = doiKhoa(k, -1, 0, b[1]); if (kk === null) continue; }
      a = state.ghi_chu[kk];
      if (!a || (b[1] || 0) > (a[1] || 0)) { state.ghi_chu[kk] = b; ch = true; }
    }
    if (coUser) {
      var uMap = {}, uCh = false;
      (state.users || []).forEach(function (u) { uMap[String(u.user).toLowerCase()] = u; });
      other.users.forEach(function (ou) {
        var uk = String(ou.user).toLowerCase();
        var cur = uMap[uk];
        if (!cur || (ou.sua_luc || ou.tao_luc || 0) > (cur.sua_luc || cur.tao_luc || 0)) {
          uMap[uk] = ou;
          doi++; uCh = true;
        }
      });
      if (uCh) { state.users = Object.keys(uMap).map(function (k) { return uMap[k]; }); ch = true; }
    }
    // Người dùng đã bị xoá (giờ xoá ≥ giờ sửa gần nhất) thì không để máy khác làm sống lại; luôn giữ ít nhất một tài khoản
    var ux = state.users_xoa;
    for (k in other.users_xoa) if ((other.users_xoa[k] || 0) > (ux[k] || 0)) { ux[k] = other.users_xoa[k]; ch = true; }
    if (Object.keys(ux).length) {
      var conLai = state.users.filter(function (u) { var z = ux[String(u.user).toLowerCase()]; return !(z && z >= (u.sua_luc || u.tao_luc || 0)); });
      if (conLai.length && conLai.length < state.users.length) { state.users = conLai; ch = true; doi++; }
    }
    var nk = state.nhat_ky, sig = nk.length + ':' + (nk.length ? nk[nk.length - 1].t : 0), seen = {};
    state.nhat_ky = nk.concat(other.nhat_ky).filter(function (x) { var s = x.t + x.viec; if (seen[s]) return false; seen[s] = 1; return true; })
      .sort(function (a, b) { return a.t - b.t; }).slice(-300);
    nk = state.nhat_ky; if (sig !== nk.length + ':' + (nk.length ? nk[nk.length - 1].t : 0)) ch = true;
    if (other.du_lieu_mau === false && state.du_lieu_mau) { state.du_lieu_mau = false; ch = true; }
    if (ch) mut++;
    mergeCh = ch;
    return doi;
  }
  /* Máy này có số mà tệp chung (other, đã gộp) CHƯA có / còn cũ hơn không? → cần ghi lại (vd lần ghi trước bị máy khác đè). Duyệt thoát sớm, rẻ. */
  function thieuTrongFile(o) {
    var rec = state.rec, orec = o.rec || {}, k, a, b;
    for (k in rec) { a = rec[k]; b = orec[k]; if (!b || (a[1] || 0) > (b[1] || 0)) return true; }
    var hon = function (ds, od) { var m = {}; (od || []).forEach(function (x) { m[x.id] = x; }); return (ds || []).some(function (x) { var y = m[x.id]; return !y || (x.luc || 0) > (y.luc || 0); }); };
    if (hon(state.dieu_chinh, o.dieu_chinh) || hon(state.diem_kpi, o.diem_kpi)) return true;
    var okk = o.khoa_ky || {}; for (k in state.khoa_ky) if (!okk[k] || (state.khoa_ky[k].t || 0) > (okk[k].t || 0)) return true;
    if (hon(state.hanh_dong, o.hanh_dong)) return true;
    var ux = o.users_xoa || {}; for (k in state.users_xoa) if ((state.users_xoa[k] || 0) > (ux[k] || 0)) return true;
    var mc = o.ma_cu || {}; for (k in state.ma_cu) if (!mc[k] || (state.ma_cu[k].t || 0) > (mc[k].t || 0)) return true;
    var sn = o.so_ngay || {}; for (k in state.so_ngay) { if (ngayThieu(state.so_ngay[k], sn[k])) return true; }
    return false;
  }
  function replaceAll(d) { state = normalize(clone(d)); state.dm_luc = now(); log('Khôi phục toàn bộ dữ liệu từ tệp'); bump(); }
  function resetAll(keepCatalog) {
    var base = CFG.mac_dinh();
    if (keepCatalog) ['khoi', 'don_vi', 'indicators', 'weights', 'settings', 'cong_thuc', 'users', 'bgd', 'bgd_trong_so'].forEach(function (k) { if (state[k]) base[k] = state[k]; });
    var t = now(); Object.keys(state.rec).forEach(function (k) { base.rec[k] = [null, t]; });
    base.du_lieu_mau = false; base.dm_luc = t;
    state = normalize(base); log(keepCatalog ? 'Xoá toàn bộ số liệu (giữ danh mục)' : 'Đặt lại toàn bộ về mặc định'); bump();
  }
  function exportJSON() { var d = clone(state); d.xuat_luc = now(); return JSON.stringify(d); }

  /* ---------- Thư mục dùng chung (File System Access API, Chrome/Edge) ---------- */
  var IDB = {
    db: function () { return new Promise(function (ok, no) { var r = indexedDB.open('KPI_CN444', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; }); },
    get: function (k) { return IDB.db().then(function (db) { return new Promise(function (ok) { var q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = function () { ok(q.result); }; q.onerror = function () { ok(null); }; }); }); },
    set: function (k, v) { return IDB.db().then(function (db) { return new Promise(function (ok) { var tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = function () { ok(); }; tx.onerror = function () { ok(); }; }); }); },
    del: function (k) { return IDB.db().then(function (db) { return new Promise(function (ok) { var tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = function () { ok(); }; }); }); }
  };
  function hoTroThuMuc() { return typeof root.showDirectoryPicker === 'function'; }

  /* Đọc tệp chung → { other, stamp }; other = null nếu chưa có / rỗng. Cập nhật fileStamp để vòng kiểm tra 20 giây không đọc lại tệp vừa đọc/ghi. */
  function docChung() {
    if (!dirHandle) return Promise.resolve({ other: null, stamp: 0 });
    return dirHandle.getFileHandle(FILE, { create: false }).then(function (fh) { return fh.getFile(); })
      .then(function (f) { return f.text().then(function (t) { fileStamp = f.lastModified; return { other: t ? JSON.parse(t) : null, stamp: f.lastModified }; }); })
      .catch(function (e) { if (e && e.name === 'NotFoundError') return { other: null, stamp: 0 }; throw e; });
  }
  function readShared() { return docChung().then(function (r) { return r.other; }); }

  /* GHI TỆP CHUNG:
   *  - đọc → gộp số máy khác → (kiểm tra khoá lạc quan) → ghi MỘT lần; chuỗi JSON dùng chung đệm với localStorage.
   *  - khoá lạc quan: ngay trước khi ghi, nếu tệp đã bị máy khác ghi xen giữa (lastModified đổi) → đọc + gộp lại (tối đa 3 vòng) thay vì đè.
   *  - yêu cầu ghi đến lúc đang ghi KHÔNG bị bỏ: đánh dấu ghiLai, ghi tiếp ngay khi xong.
   *  - lỗi (tệp đang bị khoá, mạng chập chờn): tự thử lại sau 3s, 6s, 9s… tối đa 5 lần rồi chờ lần lưu kế tiếp. */
  var writing = false, ghiLai = false, loiLien = 0, thuLai = null;
  function ghiMotLan(lan) {
    var stamp0 = 0, fh = null;
    return docChung().then(function (r) {
      stamp0 = r.stamp;
      if (r.other) { var doi = merge(r.other, true); if (doi) { version++; model = null; listeners.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } }); } }
      return dirHandle.getFileHandle(FILE, { create: true });
    }).then(function (h) { fh = h; return fh.getFile(); })
      .then(function (f) {
        if (stamp0 && f.lastModified !== stamp0 && lan < 3) return ghiMotLan(lan + 1);
        // Ghi xong đọc lại mốc giờ để vòng kiểm tra 20 giây không đọc lại bản của chính mình. NHƯNG nếu máy khác vừa ghi chèn ngay sau lần ghi này thì
        // mốc đó là của họ: kích thước tệp lệch bản vừa ghi → đặt 0 để lần kiểm tra kế tiếp đọc + gộp.
        var text = json(), bytes = new TextEncoder().encode(text).length;
        return fh.createWritable().then(function (w) { return w.write(text).then(function () { return w.close(); }); })
          .then(function () { return fh.getFile(); }).then(function (f2) { fileStamp = f2.size === bytes ? f2.lastModified : 0; });
      });
  }
  function writeShared() {
    if (!dirHandle) return Promise.resolve();
    if (writing) { ghiLai = true; return Promise.resolve(); }
    writing = true; ghiLai = false;
    return ghiMotLan(0)
      .then(function () { loiLien = 0; setSync('ok'); luuMay(); })
      .catch(function (e) {
        setSync('err', e.message); loiLien++;
        if (loiLien <= 5) { clearTimeout(thuLai); thuLai = setTimeout(writeShared, Math.min(30000, 3000 * loiLien)); }
      })
      .then(function () { writing = false; if (ghiLai) { ghiLai = false; return writeShared(); } });
  }
  var syncState = { trang_thai: 'none', loi: '' };
  function setSync(t, loi) { syncState = { trang_thai: t, loi: loi || '', luc: now() }; var el = document.getElementById('sync-dot'); if (el && root.APP) APP.renderSync(); }
  function chonThuMuc() {
    return root.showDirectoryPicker({ id: 'kpi-cn444', mode: 'readwrite' }).then(function (h) {
      dirHandle = h; dirOk = true; return IDB.set('dir', h);
    }).then(function () { return readShared(); }).then(function (other) {
      if (other) { var n = merge(other, true); bump(false); UI.toast('Đã kết nối thư mục "' + dirHandle.name + '" và gộp ' + n + ' thay đổi.', 'ok'); }
      else UI.toast('Đã kết nối thư mục "' + dirHandle.name + '". Tạo mới tệp ' + FILE + '.', 'ok');
      return writeShared();
    });
  }
  var pendingPerm = null;
  function ketNoiLai() {
    if (!dirHandle) return Promise.resolve(false);
    if (pendingPerm) return pendingPerm;
    pendingPerm = dirHandle.requestPermission({ mode: 'readwrite' }).then(function (p) {
      pendingPerm = null;
      if (p !== 'granted') return false;
      dirOk = true;
      return readShared().then(function (o) {
        if (o) { var n = merge(o, true); if (n) bump(false); }
        setSync('ok');
        luuMay();
        writeShared();
        return true;
      });
    }).catch(function () {
      pendingPerm = null;
      return false;
    });
    return pendingPerm;
  }
  function boThuMuc() { dirHandle = null; dirOk = false; setSync('none'); return IDB.del('dir'); }
  var initSharedPromise = null;
  function initShared() {
    if (!hoTroThuMuc()) return Promise.resolve();
    if (initSharedPromise) return initSharedPromise;
    initSharedPromise = IDB.get('dir').then(function (h) {
      if (!h) return;
      dirHandle = h;
      return h.queryPermission({ mode: 'readwrite' }).then(function (p) {
        if (p === 'granted') {
          dirOk = true;
          return readShared().then(function (o) {
            if (o) { var n = merge(o, true), doiMay = mergeCh; if (n) bump(false); if (doiMay) luuMay(); if (thieuTrongFile(o)) writeShared(); }
            setSync('ok');
          });
        }
        setSync('wait');
      });
    }).catch(function (e) { setSync('err', e.message); });
    return initSharedPromise;
  }
  // Kiểm tra tệp dùng chung mỗi 20 giây: có máy khác vừa lưu thì gộp về.
  // fileStamp chỉ ghi nhận SAU khi đọc + phân tích thành công (đọc dở lúc máy khác đang ghi → lần sau thử lại, không bỏ lỡ bản cập nhật).
  // Sau khi gộp: nếu máy này còn số mà tệp chưa có (lần ghi trước bị máy khác đè) → ghi lại ngay, không đợi lần sửa kế tiếp.
  setInterval(function () {
    if (!dirOk || !dirHandle || writing || document.hidden) return;
    dirHandle.getFileHandle(FILE).then(function (fh) { return fh.getFile(); }).then(function (f) {
      if (f.lastModified === fileStamp) return;
      return f.text().then(function (t) {
        var o = JSON.parse(t); fileStamp = f.lastModified;
        var n = merge(o, true);
        var doiMay = mergeCh;
        if (n) { bump(false); UI.toast('Đã cập nhật ' + n + ' thay đổi từ máy khác.', 'info'); }
        if (doiMay) luuMay();
        if (thieuTrongFile(o)) writeShared();
      });
    }).catch(function () {});
  }, 20000);

  /* ---------- Quyền chỉnh sửa & Quản lý người dùng quản trị ---------- */
  function isAdmin() { try { return sessionStorage.getItem(LS_MODE) === '1'; } catch (e) { return false; } }
  /* Mật khẩu người dùng được băm PBKDF2-SHA-256 (có muối salt 16 bytes, 150.000 vòng) → lưu trong state.users;
   * Không lưu mật khẩu dạng chữ trong Data / tệp sao lưu.
   * Giới hạn thử sai theo máy (localStorage): sai 5 lần → khoá 5 phút, có ghi nhật ký hệ thống. */
  var LS_TRY = 'KPI_CN444.login_try', LS_USER = 'KPI_CN444.last_user', SS_USER = 'KPI_CN444.user_ss', SS_TEN = 'KPI_CN444.ten_ss';
  var MIN_MK = 6, MAX_SAI = 5, KHOA_MS = 5 * 60 * 1000, ITER = 150000;

  function coSubtle() { return !!(root.crypto && root.crypto.subtle && root.TextEncoder); }
  function toB64(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); }
  function fromB64(b) { var s = atob(b), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }

  function hashPassword(pass, salt, iter) {
    if (!coSubtle()) return Promise.reject(new Error('Trình duyệt không hỗ trợ Web Crypto API (hãy mở ứng dụng bằng Chrome/Edge).'));
    return crypto.subtle.importKey('raw', new TextEncoder().encode(String(pass)), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: iter || ITER, hash: 'SHA-256' }, k, 256); })
      .then(function (b) { return toB64(new Uint8Array(b)); });
  }

  function tryState() { try { return JSON.parse(localStorage.getItem(LS_TRY) || '{}'); } catch (e) { return {}; } }
  function conKhoa() { var s = tryState(); return s.den > now() ? Math.ceil((s.den - now()) / 1000) : 0; }
  function nguoi() { try { return sessionStorage.getItem(SS_TEN) || sessionStorage.getItem(SS_USER) || ''; } catch (e) { return ''; } }
  function userHienTai() { try { return sessionStorage.getItem(SS_USER) || ''; } catch (e) { return ''; } }
  function lastUser() { try { return localStorage.getItem(LS_USER) || ''; } catch (e) { return ''; } }
  function tenGoiY() { return nguoi() || lastUser(); }

  function login(username, password) {
    username = String(username || '').trim();
    password = String(password || '');
    if (!username) return Promise.resolve({ ok: false, loi: 'Vui lòng nhập tên đăng nhập.' });
    if (!password) return Promise.resolve({ ok: false, loi: 'Vui lòng nhập mật khẩu.' });

    var kh = conKhoa();
    if (kh) return Promise.resolve({ ok: false, loi: 'Máy này đang bị tạm khoá do đăng nhập sai nhiều lần. Thử lại sau ' + Math.ceil(kh / 60) + ' phút.' });

    var uList = state.users || [];
    var uObj = uList.filter(function (x) { return String(x.user).toLowerCase() === username.toLowerCase(); })[0];

    // bỏ lối đăng nhập dự phòng admin/1111 — chỉ người dùng có trong danh sách và có mật khẩu băm mới vào được
    if (!uObj || !uObj.h || !uObj.salt) {
      return Promise.resolve(xuLyDangNhapSai(username));
    }

    return hashPassword(password, fromB64(uObj.salt), uObj.iter || ITER).then(function (h) {
      if (h === uObj.h) {
        return dangNhapThanhCong(uObj);
      }
      return xuLyDangNhapSai(username);
    }).catch(function (e) {
      return { ok: false, loi: 'Lỗi xác thực: ' + e.message };
    });
  }

  function dangNhapThanhCong(uObj) {
    try {
      localStorage.removeItem(LS_TRY);
      sessionStorage.setItem(LS_MODE, '1');
      sessionStorage.setItem(SS_USER, uObj.user);
      sessionStorage.setItem(SS_TEN, uObj.ten || uObj.user);
      localStorage.setItem(LS_USER, uObj.user);
    } catch (e) {}
    log('Đăng nhập quản trị (' + (uObj.ten || uObj.user) + ')');
    scheduleSave();
    try { if (root.SAO_LUU_MAY) root.SAO_LUU_MAY.khiDangNhap(); } catch (e) {}   // sao lưu ra máy khi đăng nhập
    return { ok: true, user: uObj };
  }

  function xuLyDangNhapSai(username) {
    var s = tryState();
    s.n = (s.n || 0) + 1;
    var loi;
    if (s.n >= MAX_SAI) {
      s.den = now() + KHOA_MS;
      s.n = 0;
      loi = 'Đăng nhập sai ' + MAX_SAI + ' lần liên tiếp — tạm khoá máy ' + (KHOA_MS / 60000) + ' phút.';
      state.nhat_ky.push({ t: now(), viec: 'Đăng nhập sai ' + MAX_SAI + ' lần — tạm khoá máy ' + (KHOA_MS / 60000) + ' phút', ai: username + ' (chưa xác thực)' });
      scheduleSave();
    } else {
      loi = 'Tên đăng nhập hoặc mật khẩu không đúng (còn ' + (MAX_SAI - s.n) + ' lần thử).';
    }
    try { localStorage.setItem(LS_TRY, JSON.stringify(s)); } catch (e) {}
    return { ok: false, loi: loi };
  }

  function logout() {
    try {
      sessionStorage.removeItem(LS_MODE);
      sessionStorage.removeItem(SS_USER);
      sessionStorage.removeItem(SS_TEN);
    } catch (e) {}
  }

  /* Quản lý danh sách người dùng quản trị */
  function getUsers() {
    return (state.users || []).map(function (u) {
      return {
        user: u.user,
        ten: u.ten || u.user,
        vai_tro: u.vai_tro || 'admin',
        mac_dinh: !!u.mac_dinh,
        tao_luc: u.tao_luc || 0,
        sua_luc: u.sua_luc || 0
      };
    });
  }

  function themUser(username, password, hoTen, vaiTro) {
    username = String(username || '').trim();
    hoTen = String(hoTen || '').trim();
    password = String(password || '');
    vaiTro = vaiTro || 'admin';

    if (!/^[a-zA-Z0-9_\.]{3,20}$/.test(username)) {
      return Promise.reject(new Error('Tên đăng nhập phải từ 3-20 ký tự, chỉ gồm chữ, số, dấu gạch dưới hoặc chấm (viết liền, không dấu).'));
    }
    if (password === '1111') {
      return Promise.reject(new Error('Không dùng mật khẩu mặc định 1111.'));
    }
    if (password.length < MIN_MK) {
      return Promise.reject(new Error('Mật khẩu phải từ ' + MIN_MK + ' ký tự trở lên.'));
    }
    if (!hoTen) {
      return Promise.reject(new Error('Vui lòng nhập họ tên hiển thị.'));
    }
    if (!coSubtle()) {
      return Promise.reject(new Error('Trình duyệt không hỗ trợ mã hoá mật khẩu.'));
    }

    var list = state.users || [];
    if (list.some(function (u) { return String(u.user).toLowerCase() === username.toLowerCase(); })) {
      return Promise.reject(new Error('Tên đăng nhập "' + username + '" đã tồn tại.'));
    }

    var salt = crypto.getRandomValues(new Uint8Array(16));
    return hashPassword(password, salt, ITER).then(function (h) {
      var t = now();
      var newUser = {
        user: username,
        ten: hoTen,
        vai_tro: vaiTro,
        salt: toB64(salt),
        iter: ITER,
        h: h,
        mac_dinh: false,
        tao_luc: t,
        sua_luc: t
      };
      state.users.push(newUser);
      delete state.users_xoa[username.toLowerCase()];
      state.dm_luc = t;
      log('Thêm người dùng quản trị: ' + username + ' (' + hoTen + ')');
      bump();
      return newUser;
    });
  }

  function doiMatKhau(username, passMoi, hoTenMoi) {
    username = String(username || '').trim();
    passMoi = String(passMoi || '');
    var list = state.users || [];
    var uObj = list.filter(function (u) { return String(u.user).toLowerCase() === username.toLowerCase(); })[0];
    if (!uObj) return Promise.reject(new Error('Không tìm thấy người dùng "' + username + '".'));

    if (passMoi === '1111') {
      return Promise.reject(new Error('Không dùng mật khẩu mặc định 1111.'));
    }
    if (passMoi && passMoi.length < MIN_MK) {
      return Promise.reject(new Error('Mật khẩu mới phải từ ' + MIN_MK + ' ký tự trở lên.'));
    }

    var t = now();
    var p = Promise.resolve();
    if (passMoi) {
      if (!coSubtle()) return Promise.reject(new Error('Trình duyệt không hỗ trợ mã hoá mật khẩu.'));
      var salt = crypto.getRandomValues(new Uint8Array(16));
      p = hashPassword(passMoi, salt, ITER).then(function (h) {
        uObj.salt = toB64(salt);
        uObj.iter = ITER;
        uObj.h = h;
        uObj.mac_dinh = false;
      });
    }

    return p.then(function () {
      if (hoTenMoi && hoTenMoi.trim()) uObj.ten = hoTenMoi.trim();
      uObj.sua_luc = t;
      state.dm_luc = t;
      if (userHienTai().toLowerCase() === username.toLowerCase() && uObj.ten) {
        sessionStorage.setItem(SS_TEN, uObj.ten);
      }
      log('Đổi thông tin/mật khẩu người dùng: ' + username);
      bump();
      return uObj;
    });
  }

  function xoaUser(username) {
    username = String(username || '').trim();
    var list = state.users || [];
    if (list.length <= 1) {
      return Promise.reject(new Error('Không thể xoá tài khoản quản trị duy nhất còn lại.'));
    }
    if (userHienTai().toLowerCase() === username.toLowerCase()) {
      return Promise.reject(new Error('Không thể xoá tài khoản bạn đang dùng để đăng nhập.'));
    }
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].user).toLowerCase() === username.toLowerCase()) { idx = i; break; }
    }
    if (idx < 0) return Promise.reject(new Error('Không tìm thấy người dùng "' + username + '".'));

    var uXoa = list.splice(idx, 1)[0];
    state.users_xoa[String(uXoa.user).toLowerCase()] = state.dm_luc = now();
    log('Xoá người dùng quản trị: ' + uXoa.user + ' (' + (uXoa.ten || '') + ')');
    bump();
    return Promise.resolve(uXoa);
  }

  function datPin(pin) {
    return doiMatKhau(userHienTai() || 'admin', pin);
  }

  /* ---------- Dữ liệu mẫu (chỉ tạo khi máy chưa có dữ liệu) ---------- */
  var DEMO = {
    tao: function (s) {
      var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      var nam = s.settings.nam, thangCuoi = 10, t0 = now();
      var quyMo = { KHDN: 3.2, KHCN: 2.4, HT: 0.5, PGD: 1 };
      var nam0 = { NII: 18000, THU_NGOAI_LAI: 2400, VBI: 900, MANULIFE: 1500, DU_NO_TT: 60000, DU_NO_BQ: 520000, THU_NO_XLRR: 1800,
        NGUON_VON_TT: 70000, NGUON_VON_BQ: 610000, CASA_TT: 14000, DU_NO_CUOI_KY: 540000, NGUON_VON_CUOI_KY: 630000, CASA_CUOI_KY: 190000, KHUT_TANG: 40, TK_LUONG: 600, THE_TDQT: 300, IPAY: 2600, EFAST: 120 };
      var cap = { DU_NO_BQ: 1, NGUON_VON_BQ: 1, DU_NO_CUOI_KY: 1, NGUON_VON_CUOI_KY: 1, CASA_CUOI_KY: 1 };
      var w = {}; s.weights.forEach(function (x) { w[x.ma_chi_tieu + '|' + x.khoi] = 1; });
      s.don_vi.forEach(function (u, ui) {
        var qm = quyMo[u.khoi] * (u.khoi === 'PGD' ? (0.7 + ((ui * 3) % 5) * 0.12) : 1);
        var suc = 0.82 + rnd() * 0.32;   // năng lực chung của đơn vị
        s.indicators.forEach(function (ind) {
          if (!w[ind.ma + '|' + u.khoi]) return;
          var lech = suc + (rnd() - 0.5) * 0.36;
          for (var t = 1; t <= 12; t++) {
            var kh, th = null, nhieu = 1 + (rnd() - 0.5) * 0.06 + (t - 6) * 0.004;
            if (ind.ma === 'TY_LE_NO_XAU') { kh = u.khoi === 'KHDN' ? 1.5 : 1.8; if (t <= thangCuoi) th = Math.round((kh * (0.55 + rnd() * 0.75 / lech)) * 100) / 100; }
            else if (ind.huong === 'nhap_ty_le') { kh = null; if (t <= thangCuoi) th = Math.round((88 + rnd() * 14) * 10) / 10; }
            else {
              var goc = nam0[ind.ma] * qm;
              kh = cap[ind.ma] ? Math.round(goc * (1 + t * 0.008)) : Math.round(goc * t / 12);
              if (/^(KHUT|TK_|THE_|IPAY|EFAST)/.test(ind.ma)) kh = Math.max(1, Math.round(kh));
              if (t <= thangCuoi) th = Math.round(kh * lech * nhieu * (/^(KHUT|TK_|THE_|IPAY|EFAST)/.test(ind.ma) ? 1 : 1));
            }
            if (kh !== null) s.rec[key('p', ind.ma, u.ma, nam, t)] = [kh, t0];
            if (th !== null) s.rec[key('a', ind.ma, u.ma, nam, t)] = [th, t0];
          }
        });
      });
      // KH chi nhánh do TSC giao (ví dụ: thấp hơn tổng phân giao cho phòng 2%) và tỷ lệ nợ xấu CN
      s.indicators.forEach(function (ind) {
        for (var t = 1; t <= 12; t++) {
          if (ind.ma === 'TY_LE_NO_XAU') { s.rec[key('p', ind.ma, 'CN', nam, t)] = [1.6, t0]; if (t <= thangCuoi) s.rec[key('a', ind.ma, 'CN', nam, t)] = [Math.round((1.1 + rnd() * 0.5) * 100) / 100, t0]; continue; }
          if (ind.huong === 'nhap_ty_le') continue;
          var tong = 0, co = 0;
          s.don_vi.forEach(function (u) { var r = s.rec[key('p', ind.ma, u.ma, nam, t)]; if (r) { tong += r[0]; co++; } });
          if (co) s.rec[key('p', ind.ma, 'CN', nam, t)] = [Math.round(tong * 0.98), t0];
        }
      });
      // Số thực hiện năm trước (để so sánh cùng kỳ / đầu năm)
      Object.keys(s.rec).forEach(function (k) {
        var p = k.split('|'); if (+p[3] !== nam) return;
        var ind = s.indicators.filter(function (i) { return i.ma === p[1]; })[0]; if (!ind) return;
        var t = +p[4], src = p[0] === 'a' ? s.rec[k][0] : null;
        if (p[0] === 'p' && t > thangCuoi) src = s.rec[k][0];
        if (src === null || (p[0] === 'p' && t <= thangCuoi) || (p[0] === 'p' && p[2] === 'CN')) return;
        var v = ind.ma === 'TY_LE_NO_XAU' ? Math.round((1.2 + rnd() * 1.1) * 100) / 100 : ind.huong === 'nhap_ty_le' ? Math.round((85 + rnd() * 12) * 10) / 10 : src * (0.84 + rnd() * 0.1);
        if (ind.dvt !== '%' && ind.huong !== 'nhap_ty_le') v = Math.round(v);
        s.rec[key('a', p[1], p[2], nam - 1, t)] = [v, t0];
      });
      s.du_lieu_mau = true; s.dm_luc = 1; s.cap_nhat_luc = t0;
    }
  };

  /* Quản lý các khoản cộng/trừ điểm KPI của phòng/PGD */
  function themDiemKpi(dsHoacMot, nhan) {
    var t = now(), u = tenGoiY() || nguoi() || 'Quản trị';
    var ds = Array.isArray(dsHoacMot) ? dsHoacMot : [dsHoacMot];
    ds.forEach(function (item) { if (item) { var tu = Number(item.thang) || 1; chanKhoa(item.nam, tu, item.thang_den ? Number(item.thang_den) : (item.pham_vi === 'den_cuoi_nam' ? 12 : tu)); } });
    ds.forEach(function (item) {
      if (!item) return;
      var diem = Number(item.diem) || 0;
      var loai = item.loai || (diem >= 0 ? 'cong' : 'tru');
      if (loai === 'tru' && diem > 0) diem = -diem;
      if (loai === 'cong' && diem < 0) diem = Math.abs(diem);
      var thangTu = Number(item.thang) || 1;
      var phamVi = item.pham_vi || (item.thang_den && Number(item.thang_den) > thangTu ? 'den_cuoi_nam' : 'thang');
      var thangDen = item.thang_den ? Number(item.thang_den) : (phamVi === 'den_cuoi_nam' ? 12 : thangTu);
      var rec = {
        id: item.id || ('DKP_' + t + '_' + Math.random().toString(36).slice(2, 7)),
        dv: String(item.dv),
        nam: Number(item.nam),
        thang: thangTu,
        thang_den: thangDen,
        pham_vi: phamVi,
        loai: loai,
        diem: Math.round(diem * 100) / 100,
        ly_do: String(item.ly_do || '').trim(),
        can_cu: String(item.can_cu || '').trim(),
        ai: item.ai || u,
        luc: t,
        xoa: false
      };
      state.diem_kpi.push(rec);
    });
    log(nhan || ('Thêm cộng/trừ điểm KPI (' + ds.length + ' khoản)'));
    bump();
  }

  function xoaDiemKpi(id, nhan) {
    var t = now(), tim = false;
    (state.diem_kpi || []).forEach(function (x) { if (x.id === id && !x.xoa) chanKhoa(x.nam, Number(x.thang) || 1, Number(x.thang_den || x.thang) || 1); });
    (state.diem_kpi || []).forEach(function (x) {
      if (x.id === id && !x.xoa) {
        x.xoa = true;
        x.luc = t;
        tim = true;
      }
    });
    if (tim) {
      log(nhan || ('Xoá khoản cộng/trừ điểm KPI ' + id));
      bump();
    }
    return tim;
  }

  function getDiemKpi(dv, nam, thang) {
    return (state.diem_kpi || []).filter(function (x) {
      return !x.xoa && String(x.dv) === String(dv) && Number(x.nam) === Number(nam) && Number(x.thang) === Number(thang);
    });
  }

  function tongDiemKpi(dv, nam, thang) {
    var list = getDiemKpi(dv, nam, thang);
    var s = list.reduce(function (acc, x) { return acc + (Number(x.diem) || 0); }, 0);
    return Math.round(s * 100) / 100;
  }

  root.STORE = {
    load: load, get state() { return state; }, get version() { return version; }, model: getModel,
    on: function (fn) { listeners.push(fn); }, setVal: setVal, setMany: setMany, getRaw: getRaw, xoaKy: xoaKy,
    setDanhMuc: setDanhMuc, setSettings: setSettings, doiMaDonVi: doiMaDonVi, doiMaKhoi: doiMaKhoi, doiMaChiTieu: doiMaChiTieu, merge: function (o) { var n = merge(o); bump(); return n; },
    replaceAll: replaceAll, resetAll: resetAll, exportJSON: exportJSON, log: function (v) { log(v); scheduleSave(); },
    setNote: function (dv, nam, thang, text) { state.ghi_chu[dv + '|' + nam + '|' + thang] = [text, now(), nguoi()]; log('Sửa nhận xét ' + dv + ' T' + thang + '/' + nam); bump(); },
    getNote: function (dv, nam, thang) { var r = state.ghi_chu[dv + '|' + nam + '|' + thang]; return r ? r[0] : ''; },
    getNoteInfo: function (dv, nam, thang) { var r = state.ghi_chu[dv + '|' + nam + '|' + thang]; return r && r[0] ? { t: r[1], ai: r[2] || '' } : null; },
    isAdmin: isAdmin, login: login, logout: logout, datPin: datPin, coSubtle: coSubtle, nguoi: nguoi, tenGoiY: tenGoiY, conKhoa: conKhoa,
    userHienTai: userHienTai, lastUser: lastUser, getUsers: getUsers, themUser: themUser, doiMatKhau: doiMatKhau, xoaUser: xoaUser,
    hoTroThuMuc: hoTroThuMuc, chonThuMuc: chonThuMuc, ketNoiLai: ketNoiLai, boThuMuc: boThuMuc, initShared: initShared,
    get sync() { return { trang_thai: syncState.trang_thai, loi: syncState.loi, luc: syncState.luc, ten: dirHandle ? dirHandle.name : '' }; },
    themDieuChinh: function (ds, nhan) { ds.forEach(function (x) { chanKhoa(x.nam, x.thang, x.pham_vi === 'den_cuoi_nam' ? 12 : x.thang); }); var t = now(); ds.forEach(function (x) { x.luc = t; x.ai = nguoi(); state.dieu_chinh.push(x); }); log(nhan); bump(); },
    xoaDieuChinh: function (nhom) { state.dieu_chinh.forEach(function (x) { if ((x.nhom || x.id) === nhom && !x.xoa) chanKhoa(x.nam, x.thang, x.pham_vi === 'den_cuoi_nam' ? 12 : x.thang); }); var t = now(), n = 0; state.dieu_chinh.forEach(function (x) { if ((x.nhom || x.id) === nhom && !x.xoa) { x.xoa = true; x.luc = t; n++; } }); if (n) { log('Xoá điều chỉnh ' + nhom); bump(); } return n; },
    themDiemKpi: themDiemKpi, xoaDiemKpi: xoaDiemKpi, getDiemKpi: getDiemKpi, tongDiemKpi: tongDiemKpi,
    xoaNgay: function (day) { if (!state.so_ngay[day]) return false; var tx = now(); state.so_ngay[day] = { t: tx, v: {}, tx: tx }; log('Xoá số theo ngày ' + day); bump(); return true; },   // đánh dấu rỗng (t mới) để lan sang các máy khác khi gộp
    kyKhoa: kyKhoa, thongTinKhoa: thongTinKhoa, khoaKy: khoaKy, moKhoaKy: moKhoaKy, chanCuoi: function () { return chanDem; },
    luuHanhDong: luuHanhDong, xoaHanhDong: xoaHanhDong, getHanhDong: getHanhDong,
    saveNow: saveNow, FILE: FILE,
    get dir() { return dirOk ? dirHandle : null; },
    getCellInfo: getCellInfo, mayId: mayId,
    touch: function (nhan) { if (nhan) log(nhan); bump(); }
  };
})(window);
