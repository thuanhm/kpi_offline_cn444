/* MÀN HÌNH CỘNG / TRỪ ĐIỂM KPI — Giao diện 2 cột chuyên nghiệp theo nhận diện VietinBank.
 * Cột trái: Danh sách đơn vị & điểm hiện tại.
 * Cột phải: 4 Thẻ KPI stats, Form nhập nhiều dòng (+ Thêm dòng, Lưu các khoản, chọn phạm vi tháng),
 * Bảng lịch sử các khoản đã áp dụng trong năm, Xuất Excel toàn chi nhánh. */
(function (root) {
  var esc = UI.esc, isNum = UI.isNum, CN = root.KPI_CFG ? root.KPI_CFG.MA_CN : 'CN';
  var VIEWS = root.VIEWS = root.VIEWS || {};

  function fmtDiem(v, dau) {
    if (!isNum(v)) return '—';
    var s = (Math.round(v * 100) / 100).toFixed(2);
    if (s.endsWith('.00')) s = s.slice(0, -3);
    else if (s.endsWith('0')) s = s.slice(0, -1);
    s = s.replace('.', ',');
    if (dau && v > 0) return '+' + s;
    return s;
  }

  function fmtNgay(t) {
    if (!t) return '—';
    var d = new Date(t);
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' ' + pad(d.getDate()) + '-' + pad(d.getMonth() + 1);
  }

  function xuatExcelDiemKpi(nam) {
    UI.lib('xlsx').then(function (XLSX) {
      var M = STORE.model(), st = STORE.state;
      var wb = XLSX.utils.book_new();
      var ds = (st.diem_kpi || []).filter(function (x) {
        return !x.xoa && Number(x.nam) === Number(nam);
      });

      var rows = [
        ['DANH SÁCH CỘNG / TRỪ ĐIỂM KPI NĂM ' + nam + ' — ' + (st.settings.ten_chi_nhanh || 'CHI NHÁNH')],
        ['STT', 'Mã ĐV', 'Tên đơn vị', 'Khối', 'Từ tháng', 'Đến tháng', 'Phạm vi', 'Điểm (+/-)', 'Lý do', 'Căn cứ / Văn bản', 'Người nhập', 'Thời gian nhập']
      ];

      ds.forEach(function (x, i) {
        var u = x.dv === CN ? { ten: 'Toàn chi nhánh', khoi: 'CN' } : (M.unitMap[x.dv] || { ten: x.dv, khoi: '' });
        var tTu = x.thang || 1;
        var tDen = x.thang_den || tTu;
        var pvText = (tTu === tDen) ? 'Chỉ tháng ' + tTu : 'Từ T' + tTu + ' đến T' + tDen;
        rows.push([
          i + 1,
          x.dv,
          u.ten,
          u.khoi,
          tTu,
          tDen,
          pvText,
          x.diem,
          x.ly_do || '',
          x.can_cu || '',
          x.ai || '',
          fmtNgay(x.luc)
        ]);
      });

      var ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 6 }, { wch: 10 }, { wch: 26 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 36 }, { wch: 26 }, { wch: 16 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Diem_KPI_' + nam);
      XLSX.writeFile(wb, 'Cong_tru_diem_KPI_' + (st.settings.ma_chi_nhanh || 'CN') + '_' + nam + '.xlsx');
      UI.toast('Đã xuất file Excel cộng/trừ điểm KPI năm ' + nam, 'ok');
    }).catch(function (err) {
      UI.toast('Lỗi khi xuất file Excel: ' + err.message, 'err');
    });
  }

  VIEWS['diem-kpi'] = {
    html: function (A) {
      var M = STORE.model(), ky = A.ky, admin = STORE.isAdmin();
      var units = M.units || [];
      var allUnits = [{ ma: CN, ten: 'Toàn chi nhánh', khoi: 'CN' }].concat(units);

      // Đơn vị đang chọn
      var maSel = A.route.arg || (units[0] && units[0].ma) || CN;
      if (!allUnits.some(function (u) { return u.ma === maSel; })) {
        maSel = units[0] ? units[0].ma : CN;
      }
      A.route.arg = maSel;

      var curU = (maSel === CN) ? { ma: CN, ten: 'Toàn chi nhánh', khoi: 'CN' } : (M.unitMap[maSel] || { ma: maSel, ten: maSel, khoi: '' });
      var cardCur = M.card(maSel, ky.nam, ky.thang);
      var rk = M.ranking(ky.nam, ky.thang);
      var rkItem = rk.filter(function (x) { return x.ma === maSel; })[0];
      var rkTotal = rk.length;

      var diemGoc = cardCur.quy_doi_goc;
      var tongDc = cardCur.dc_diem || 0;
      var diemChinhThuc = cardCur.quy_doi;
      var dsKhoanHienTai = cardCur.ds_dc_diem || [];

      // Tất cả các khoản của đơn vị này trong cả năm
      var allDiemKpiNam = (STORE.state.diem_kpi || []).filter(function (x) {
        return !x.xoa && String(x.dv) === String(maSel) && Number(x.nam) === Number(ky.nam);
      });
      allDiemKpiNam.sort(function (a, b) { return (b.luc || 0) - (a.luc || 0); });

      var h = '';

      // Thanh kỳ & ghi chú
      h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap;">' +
        '<div style="font-weight:700;font-size:14px;color:var(--text);display:flex;align-items:center;gap:6px;">' +
        '<span>Kỳ đang xem <b>T' + ky.thang + '/' + ky.nam + '</b></span>' +
        '</div>' +
        '<div class="muted small">Điểm cộng/trừ được cộng vào tổng điểm KPI → điểm quy đổi và xếp hạng tự tính lại.</div>' +
        '</div>';

      // Layout 2 cột
      h += '<div class="kpi-adj-wrap" style="display:grid;grid-template-columns:250px 1fr;gap:16px;align-items:start;">';

      // CỘT TRÁI: DANH SÁCH ĐƠN VỊ
      h += '<div class="card p0" style="position:sticky;top:66px;max-height:calc(100vh - 90px);display:flex;flex-direction:column;">' +
        '<div style="padding:12px 14px;border-bottom:1px solid var(--line);font-weight:700;font-size:13.5px;color:var(--text);">' +
        'Chọn đơn vị' +
        '</div>' +
        '<div class="kpi-unit-list" style="overflow-y:auto;padding:6px;flex:1;">';

      allUnits.forEach(function (u) {
        var isCur = u.ma === maSel;
        var cu = M.card(u.ma, ky.nam, ky.thang);
        var uDiem = cu.quy_doi;
        var uDc = cu.dc_diem || 0;

        h += '<a href="#/diem-kpi/' + u.ma + '" class="kpi-unit-row ' + (isCur ? 'active' : '') + '" style="' +
          'display:block;padding:9px 12px;border-radius:8px;margin-bottom:3px;text-decoration:none;color:inherit;transition:all .15s;' +
          (isCur ? 'background:#fff;border-left:3.5px solid var(--primary);box-shadow:0 2px 6px rgba(0,0,0,.07);font-weight:600;' : '') +
          '">' +
          '<div style="font-size:13px;color:' + (isCur ? 'var(--primary-d)' : 'var(--text)') + ';line-height:1.3;">' + esc(u.ten) + '</div>' +
          '<div class="muted small" style="font-size:11.5px;margin-top:2px;">' +
          esc(u.khoi) + ' · ' + (isNum(uDiem) ? fmtDiem(uDiem) + ' điểm' : '—') +
          (uDc !== 0 ? '<span style="font-weight:700;color:' + (uDc > 0 ? 'var(--c-dat,#12925a)' : 'var(--accent,#d71249)') + ';"> · ' + fmtDiem(uDc, true) + '</span>' : '') +
          '</div>' +
          '</a>';
      });

      h += '</div></div>';

      // CỘT PHẢI: CHI TIẾT ĐƠN VỊ, FORM THÊM & LỊCH SỬ
      h += '<div style="display:flex;flex-direction:column;gap:16px;min-width:0;">';

      // KHỐI CARD TRÊN: 4 STATS & FORM NHẬP THÊM
      h += '<div class="card" style="padding:18px 20px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
        '<h2 style="font-size:18px;font-weight:750;color:var(--text);margin:0;">' + esc(curU.ten) + '</h2>' +
        '<span class="muted small" style="font-weight:600;">T' + ky.thang + '/' + ky.nam + '</span>' +
        '</div>';

      // 4 Hộp Stats ngang
      h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:12px 14px;background:var(--bg);border-radius:10px;margin-bottom:20px;">' +
        '<div>' +
        '<div class="muted small" style="font-size:11px;font-weight:700;letter-spacing:.03em;">ĐIỂM CHỈ TIÊU</div>' +
        '<div style="font-size:22px;font-weight:800;color:var(--text);margin-top:2px;">' + (isNum(diemGoc) ? fmtDiem(diemGoc) : '—') + '</div>' +
        '<div class="muted small" style="font-size:11.5px;">/ ' + (cardCur.ts || 100) + ' trọng số</div>' +
        '</div>' +

        '<div>' +
        '<div class="muted small" style="font-size:11px;font-weight:700;letter-spacing:.03em;">CỘNG/TRỪ ĐANG ÁP DỤNG</div>' +
        '<div style="font-size:22px;font-weight:800;margin-top:2px;color:' + (tongDc > 0 ? 'var(--c-dat,#12925a)' : tongDc < 0 ? 'var(--accent,#d71249)' : 'var(--muted)') + ';">' +
        (tongDc !== 0 ? fmtDiem(tongDc, true) : '0') +
        '</div>' +
        '<div class="muted small" style="font-size:11.5px;">' + dsKhoanHienTai.length + ' khoản</div>' +
        '</div>' +

        '<div>' +
        '<div class="muted small" style="font-size:11px;font-weight:700;letter-spacing:.03em;">TỔNG ĐIỂM KPI</div>' +
        '<div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:2px;">' + (isNum(diemChinhThuc) ? fmtDiem(diemChinhThuc) : '—') + '</div>' +
        '<div class="muted small" style="font-size:11.5px;">quy đổi ' + (isNum(diemChinhThuc) ? fmtDiem(diemChinhThuc) : '0') + '/100</div>' +
        '</div>' +

        '<div>' +
        '<div class="muted small" style="font-size:11px;font-weight:700;letter-spacing:.03em;">XẾP HẠNG</div>' +
        '<div style="font-size:22px;font-weight:800;color:var(--text);margin-top:2px;">' + (rkItem && rkItem.hang ? rkItem.hang + '/' + rkTotal : '—') + '</div>' +
        '<div class="muted small" style="font-size:11.5px;">' + (rkItem && rkItem.hang_truoc ? 'T trước: ' + rkItem.hang_truoc : 'toàn khối/CN') + '</div>' +
        '</div>' +
        '</div>';

      // PHẦN: THÊM KHOẢN CỘNG/TRỪ
      h += '<div style="margin-top:14px;">' +
        '<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:10px;">Thêm khoản cộng/trừ</div>';

      if (!admin) {
        h += '<div style="padding:14px;background:var(--bg);border-radius:8px;display:flex;align-items:center;justify-content:space-between;">' +
          '<span class="muted small">Chế độ xem — Đăng nhập quyền quản trị để thêm hoặc sửa các khoản cộng/trừ điểm.</span>' +
          '<button class="btn admin sm" id="btn-login-kpi">Đăng nhập quản trị</button>' +
          '</div>';
      } else {
        h += '<form id="form-kpi-grid" autocomplete="off">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">' +
          '<label class="field" style="margin:0;">' +
          '<span style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px;display:block;">Áp dụng từ tháng</span>' +
          '<select name="thang" id="sel-ap-thang" style="height:36px;border:1px solid var(--line);border-radius:8px;padding:0 10px;background:#fff;font-weight:600;">' +
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (t) {
            return '<option value="' + t + '"' + (t === ky.thang ? ' selected' : '') + '>Tháng ' + t + '/' + ky.nam + '</option>';
          }).join('') +
          '</select></label>' +

          '<label class="field" style="margin:0;">' +
          '<span style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px;display:block;">Phạm vi</span>' +
          '<select name="pham_vi" id="sel-pham-vi" style="height:36px;border:1px solid var(--line);border-radius:8px;padding:0 10px;background:#fff;font-weight:600;">' +
          '<option value="den_cuoi_nam">Từ tháng này đến hết năm (điểm lũy kế)</option>' +
          '<option value="thang">Chỉ tháng này</option>' +
          '</select></label>' +
          '</div>';

        // Lưới nhập nhiều dòng
        h += '<div class="tbl-wrap" style="border:1px solid var(--line);border-radius:8px;overflow:hidden;margin-bottom:10px;">' +
          '<table class="tbl" id="tbl-input-kpi" style="margin:0;">' +
          '<thead><tr style="background:var(--bg);">' +
          '<th style="width:36px;" class="c">#</th>' +
          '<th style="width:140px;">Điểm (+/−)</th>' +
          '<th>Lý do</th>' +
          '<th style="width:240px;">Căn cứ / văn bản</th>' +
          '<th style="width:36px;" class="c"></th>' +
          '</tr></thead>' +
          '<tbody id="tbody-input-kpi">' +
          '<!-- Dòng 1 ban đầu -->' +
          '<tr class="kpi-in-row">' +
          '<td class="c muted row-idx">1</td>' +
          '<td><input class="cell in-diem" type="text" inputmode="decimal" placeholder="VD 1 hoặc -0,5" style="width:100%;height:32px;padding:4px 8px;border:1px solid var(--line);border-radius:6px;font-weight:700;"></td>' +
          '<td><input class="cell in-ly-do" type="text" placeholder="VD vi phạm quy trình tín dụng / hoàn thành xuất sắc" style="width:100%;height:32px;padding:4px 8px;border:1px solid var(--line);border-radius:6px;"></td>' +
          '<td><input class="cell in-can-cu" type="text" placeholder="VD Thông báo 45/TB-CNBNA" style="width:100%;height:32px;padding:4px 8px;border:1px solid var(--line);border-radius:6px;"></td>' +
          '<td class="c"><button type="button" class="icon-btn btn-del-row" style="color:var(--muted);font-size:14px;" title="Xoá dòng">✕</button></td>' +
          '</tr>' +
          '</tbody>' +
          '</table></div>';

        // Dưới bảng: Tổng điểm đang gõ & Nút bấm
        h += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:6px;">' +
          '<div style="font-size:12.5px;color:var(--muted);display:flex;align-items:center;gap:8px;">' +
          '<b id="lbl-tong-nhap" style="font-size:15px;color:var(--text);font-weight:800;">0</b>' +
          '<span>Nhập điểm dương để cộng, âm để trừ.</span>' +
          '</div>' +
          '<div style="display:flex;gap:8px;">' +
          '<button type="button" class="btn sm" id="btn-add-row" style="font-weight:600;">+ Thêm dòng</button>' +
          '<button type="submit" class="btn primary sm" style="font-weight:600;padding:6px 16px;">Lưu các khoản</button>' +
          '</div>' +
          '</div>' +
          '</form>';
      }

      h += '</div></div>'; // Hết Card trên

      // KHỐI CARD DƯỚI: CÁC KHOẢN ĐÃ CỘNG/TRỪ NĂM N
      h += '<div class="card p0">' +
        '<div style="padding:14px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;">' +
        '<h3 style="margin:0;font-size:15px;color:var(--text);font-weight:700;">' +
        'Các khoản đã cộng/trừ năm ' + ky.nam + ' (' + allDiemKpiNam.length + ')' +
        '</h3>' +
        '<button class="btn sm" id="btn-export-excel-kpi" style="font-size:12px;font-weight:600;gap:4px;">' +
        '<span>⤓ Xuất Excel (tất cả đơn vị)</span>' +
        '</button>' +
        '</div>' +

        '<div class="tbl-wrap"><table class="tbl" style="margin:0;">' +
        '<thead><tr>' +
        '<th style="width:120px;">Áp dụng</th>' +
        '<th style="width:90px;" class="r">Điểm</th>' +
        '<th>Lý do</th>' +
        '<th style="width:200px;">Căn cứ</th>' +
        '<th style="width:120px;" class="c">T' + ky.thang + '</th>' +
        '<th style="width:110px;">Nhập lúc</th>' +
        (admin ? '<th style="width:40px;" class="c"></th>' : '') +
        '</tr></thead>' +
        '<tbody>';

      if (!allDiemKpiNam.length) {
        h += '<tr><td colspan="' + (admin ? 7 : 6) + '" class="c muted" style="padding:28px;">' +
          'Chưa có khoản cộng/trừ điểm nào trong năm ' + ky.nam + ' cho đơn vị này.' +
          '</td></tr>';
      } else {
        allDiemKpiNam.forEach(function (x) {
          var tTu = Number(x.thang) || 1;
          var tDen = Number(x.thang_den || x.thang) || tTu;
          var isDangAp = (Number(ky.thang) >= tTu && Number(ky.thang) <= tDen);
          var apDungText = (tTu === tDen) ? ('T' + tTu + '/' + x.nam) : ('T' + tTu + '→T' + tDen + '/' + x.nam);
          var isCong = x.diem >= 0;

          h += '<tr>' +
            '<td class="small" style="font-weight:600;">' + esc(apDungText) + '</td>' +
            '<td class="r num" style="font-weight:800;color:' + (isCong ? 'var(--c-dat,#12925a)' : 'var(--accent,#d71249)') + ';">' +
            fmtDiem(x.diem, true) +
            '</td>' +
            '<td><b>' + esc(x.ly_do || '—') + '</b></td>' +
            '<td class="small muted">' + esc(x.can_cu || '—') + '</td>' +
            '<td class="c">' +
            (isDangAp ? '<span class="chip dat" style="font-size:11px;padding:2px 8px;font-weight:600;">đang áp dụng</span>' : '<span class="muted small">—</span>') +
            '</td>' +
            '<td class="small muted" title="Người nhập: ' + esc(x.ai || '') + '">' + fmtNgay(x.luc) + '</td>' +
            (admin ? '<td class="c"><button class="icon-btn btn-del-kpi" data-id="' + esc(x.id) + '" style="color:var(--muted);font-size:14px;" title="Xoá khoản này">✕</button></td>' : '') +
            '</tr>';
        });
      }

      h += '</tbody>' +
        '<tfoot><tr>' +
        '<td colspan="1" style="font-weight:700;">Tổng áp dụng T' + ky.thang + '</td>' +
        '<td class="r num" style="font-size:15px;font-weight:900;color:' + (tongDc > 0 ? 'var(--c-dat,#12925a)' : tongDc < 0 ? 'var(--accent,#d71249)' : 'inherit') + ';">' +
        (tongDc !== 0 ? fmtDiem(tongDc, true) : '0') +
        '</td>' +
        '<td colspan="' + (admin ? 5 : 4) + '" class="small muted">' +
        'Tổng điểm điều chỉnh cộng thẳng vào tổng điểm KPI tháng ' + ky.thang + ' của ' + esc(curU.ten) +
        '</td>' +
        '</tr></tfoot>' +
        '</table></div>' +
        '</div>'; // Hết Card dưới

      h += '</div>'; // Hết Cột phải
      h += '</div>'; // Hết Layout 2 cột

      return h;
    },

    bind: function (el, A) {
      var ky = A.ky, ma = A.route.arg;

      // Nút login nếu đang ở chế độ xem
      var btnLogin = el.querySelector('#btn-login-kpi');
      if (btnLogin) {
        btnLogin.addEventListener('click', function () {
          var btnMode = document.getElementById('btn-mode');
          if (btnMode) btnMode.click();
        });
      }

      // Nút Xuất Excel
      var btnXlsx = el.querySelector('#btn-export-excel-kpi');
      if (btnXlsx) {
        btnXlsx.addEventListener('click', function () {
          xuatExcelDiemKpi(ky.nam);
        });
      }

      // Xoá khoản trong bảng lịch sử
      el.querySelectorAll('.btn-del-kpi').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          if (!id) return;
          UI.confirm('Xoá khoản cộng/trừ điểm', 'Bạn có chắc muốn xoá khoản cộng/trừ điểm này?', 'Xoá', true).then(function (ok) {
            if (!ok) return;
            try { STORE.xoaDiemKpi(id); } catch (e) { UI.toast(e.message, 'err'); return; }   // kỳ đã khoá
            UI.toast('Đã xoá khoản điều chỉnh.', 'ok');
          });
        });
      });

      // BẢNG NHẬP NHIỀU DÒNG
      var tbody = el.querySelector('#tbody-input-kpi');
      var lblTong = el.querySelector('#lbl-tong-nhap');
      var btnAdd = el.querySelector('#btn-add-row');
      var form = el.querySelector('#form-kpi-grid');

      function parseSo(val) {
        if (!val) return 0;
        var s = String(val).trim().replace(',', '.');
        var n = parseFloat(s);
        return isNaN(n) ? 0 : n;
      }

      function updateTong() {
        if (!tbody || !lblTong) return;
        var total = 0;
        tbody.querySelectorAll('.in-diem').forEach(function (inp) {
          total += parseSo(inp.value);
        });
        total = Math.round(total * 100) / 100;
        lblTong.textContent = fmtDiem(total, true);
        lblTong.style.color = (total > 0) ? 'var(--c-dat,#12925a)' : (total < 0) ? 'var(--accent,#d71249)' : 'var(--text)';
      }

      function reindex() {
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(function (tr, i) {
          var tdIdx = tr.querySelector('.row-idx');
          if (tdIdx) tdIdx.textContent = (i + 1);
        });
      }

      function bindRow(tr) {
        var inpDiem = tr.querySelector('.in-diem');
        if (inpDiem) inpDiem.addEventListener('input', updateTong);
        var btnDel = tr.querySelector('.btn-del-row');
        if (btnDel) {
          btnDel.addEventListener('click', function () {
            if (tbody.querySelectorAll('tr').length <= 1) {
              // Nếu còn 1 dòng thì chỉ làm sạch ô
              tr.querySelectorAll('input').forEach(function (ip) { ip.value = ''; });
              updateTong();
              return;
            }
            tr.remove();
            reindex();
            updateTong();
          });
        }
      }

      if (tbody) {
        tbody.querySelectorAll('tr').forEach(bindRow);
      }

      if (btnAdd && tbody) {
        btnAdd.addEventListener('click', function () {
          var count = tbody.querySelectorAll('tr').length + 1;
          var tr = document.createElement('tr');
          tr.className = 'kpi-in-row';
          tr.innerHTML = '<td class="c muted row-idx">' + count + '</td>' +
            '<td><input class="cell in-diem" type="text" inputmode="decimal" placeholder="VD 1 hoặc -0,5" style="width:100%;height:32px;padding:4px 8px;border:1px solid var(--line);border-radius:6px;font-weight:700;"></td>' +
            '<td><input class="cell in-ly-do" type="text" placeholder="VD vi phạm quy trình tín dụng / hoàn thành xuất sắc" style="width:100%;height:32px;padding:4px 8px;border:1px solid var(--line);border-radius:6px;"></td>' +
            '<td><input class="cell in-can-cu" type="text" placeholder="VD Thông báo 45/TB-CNBNA" style="width:100%;height:32px;padding:4px 8px;border:1px solid var(--line);border-radius:6px;"></td>' +
            '<td class="c"><button type="button" class="icon-btn btn-del-row" style="color:var(--muted);font-size:14px;" title="Xoá dòng">✕</button></td>';
          tbody.appendChild(tr);
          bindRow(tr);
          var firstInp = tr.querySelector('.in-diem');
          if (firstInp) firstInp.focus();
        });
      }

      if (form) {
        form.addEventListener('submit', function (ev) {
          ev.preventDefault();
          var selThang = form.querySelector('#sel-ap-thang');
          var selPhamVi = form.querySelector('#sel-pham-vi');
          var thangVal = parseInt(selThang ? selThang.value : ky.thang, 10);
          var phamViVal = selPhamVi ? selPhamVi.value : 'den_cuoi_nam';
          var thangDenVal = (phamViVal === 'den_cuoi_nam') ? 12 : thangVal;

          var rows = tbody.querySelectorAll('tr');
          var listToSave = [];
          var hasError = false;

          rows.forEach(function (tr, i) {
            if (hasError) return;
            var inpDiem = tr.querySelector('.in-diem');
            var inpLyDo = tr.querySelector('.in-ly-do');
            var inpCanCu = tr.querySelector('.in-can-cu');

            var rawDiem = inpDiem ? inpDiem.value.trim() : '';
            var rawLyDo = inpLyDo ? inpLyDo.value.trim() : '';
            var rawCanCu = inpCanCu ? inpCanCu.value.trim() : '';

            // Nếu dòng hoàn toàn trống thì bỏ qua
            if (!rawDiem && !rawLyDo && !rawCanCu) return;

            var dVal = parseSo(rawDiem);
            if (rawDiem === '' || dVal === 0) {
              UI.toast('Dòng ' + (i + 1) + ': chưa nhập số điểm hợp lệ.', 'warn');
              if (inpDiem) inpDiem.focus();
              hasError = true;
              return;
            }

            if (!rawLyDo) {
              UI.toast('Dòng ' + (i + 1) + ': chưa nhập lý do.', 'warn');
              if (inpLyDo) inpLyDo.focus();
              hasError = true;
              return;
            }

            listToSave.push({
              dv: ma,
              nam: ky.nam,
              thang: thangVal,
              thang_den: thangDenVal,
              pham_vi: phamViVal,
              diem: dVal,
              ly_do: rawLyDo,
              can_cu: rawCanCu
            });
          });

          if (hasError) return;

          if (!listToSave.length) {
            UI.toast('Vui lòng nhập ít nhất một khoản cộng/trừ điểm.', 'warn');
            return;
          }

          try { STORE.themDiemKpi(listToSave, 'Lưu ' + listToSave.length + ' khoản cộng/trừ KPI đơn vị ' + ma); } catch (e) { UI.toast(e.message, 'err'); return; }   // kỳ đã khoá
          UI.toast('Đã lưu ' + listToSave.length + ' khoản cộng/trừ.', 'ok');

          // Reset lại bảng nhập về 1 dòng trắng
          tbody.innerHTML = '<tr class="kpi-in-row">' +
            '<td class="c muted row-idx">1</td>' +
            '<td><input class="cell in-diem" type="text" inputmode="decimal" placeholder="VD 1 hoặc -0,5" style="width:100%;height:32px;padding:4px 8px;border:1px solid var(--line);border-radius:6px;font-weight:700;"></td>' +
            '<td><input class="cell in-ly-do" type="text" placeholder="VD vi phạm quy trình tín dụng / hoàn thành xuất sắc" style="width:100%;height:32px;padding:4px 8px;border:1px solid var(--line);border-radius:6px;"></td>' +
            '<td><input class="cell in-can-cu" type="text" placeholder="VD Thông báo 45/TB-CNBNA" style="width:100%;height:32px;padding:4px 8px;border:1px solid var(--line);border-radius:6px;"></td>' +
            '<td class="c"><button type="button" class="icon-btn btn-del-row" style="color:var(--muted);font-size:14px;" title="Xoá dòng">✕</button></td>' +
            '</tr>';
          bindRow(tbody.querySelector('tr'));
          updateTong();
        });
      }
    }
  };
})(window);
