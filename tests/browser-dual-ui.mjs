// KIỂM THỬ NGHIỆM THU DUAL UI trên ỨNG DỤNG THẬT (App/index.html) bằng Edge/Chrome headless (CDP, không cần cài thư viện).
//   node tests/browser-dual-ui.mjs        → in kết quả, ghi tests/out/dual-ui-results.json
// Dùng hồ sơ trình duyệt SẠCH (tạm) nên ứng dụng chạy bằng DỮ LIỆU MẪU (DEMO) — KHÔNG đọc/ghi dữ liệu vận hành.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = path.join(ROOT, 'tests', 'out');
const APPURL = pathToFileURL(path.join(ROOT, 'App', 'index.html')).href;
fs.mkdirSync(OUT, { recursive: true });
const R = []; let fail = 0;
const rec = (g, n, ok, d = '') => { R.push({ g, n, ok: !!ok, d: String(d).slice(0, 260) }); if (!ok) fail++; console.log((ok ? '✓' : '✗') + ' [' + g + '] ' + n + (d && !ok ? ' — ' + d : '')); };
const KEY = 'KPI_CN444.giao_dien';

const b = await launch(9351);
async function mo(w = 1440, h = 900, pref) {
  const p = await b.newPage(); await p.viewport(w, h);
  await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000);
  if (pref !== undefined) { await p.eval(`localStorage.setItem('${KEY}', '${pref}')`); await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000); }
  await p.sleep(500); return p;
}
const wait = async (p, ms = 600) => p.sleep(ms);
const go = async (p, hash, ms = 700) => { await p.eval(`location.hash = '${hash}'`); await p.sleep(ms); };
const isMoi = (p) => p.eval(`document.body.classList.contains('ui-moi')`);
const admin = (p) => p.eval(`(() => { sessionStorage.setItem('KPI_CN444.admin', '1'); sessionStorage.setItem('KPI_CN444.user_ss', 'admin'); sessionStorage.setItem('KPI_CN444.ten_ss', 'Quản trị viên'); STORE.state.users.forEach(u => { u.mac_dinh = false; }); APP.render(); return STORE.isAdmin(); })()`);

try {
  /* ============ A. Giao diện cũ được bảo toàn ============ */
  let p = await mo();
  rec('A. Legacy', 'Mặc định mở giao diện CŨ', !(await isMoi(p)) && (await p.eval(`localStorage.getItem('${KEY}')`)) === null);
  rec('A. Legacy', 'Khung cũ nguyên vẹn (lớp sidebar/topbar/content, không có lớp moi-*)', await p.eval(`!!document.querySelector('aside.sidebar#sidebar') && !!document.querySelector('header.topbar#topbar') && !!document.querySelector('main.content#view') && !document.querySelector('[class*="moi-"]')`));
  rec('A. Legacy', 'Tổng quan cũ hiển thị vòng điểm + ô chỉ tiêu', await p.eval(`!!document.querySelector('#view .ring-val') && document.querySelectorAll('#view .tile').length > 5`));
  rec('A. Legacy', 'Nút chuyển đổi có ở header cũ, "Giao diện cũ" đang được chọn', await p.eval(`document.querySelector('#topbar .ui-sw [data-gd="cu"]').getAttribute('aria-pressed') === 'true' && document.querySelector('#topbar .ui-sw [data-gd="moi"]').getAttribute('aria-pressed') === 'false'`));
  rec('A. Legacy', 'Không lỗi console khi mở giao diện cũ', p.logs.length === 0, p.logs.map((l) => l.text).join(' | '));
  const snap = (pp) => pp.eval(`(() => { const g = (s, k) => { const e = document.querySelector(s); return e ? getComputedStyle(e)[k] : null; }; return JSON.stringify([g('#sidebar','backgroundImage'), g('#sidebar','width'), g('.card','borderRadius'), g('.card','boxShadow'), g('body','fontSize'), g('body','fontFamily'), g('#topbar','height'), g('.tile','borderTopColor'), g('.chip.dat','color'), g('.btn','borderRadius'), g('#view','paddingTop'), getComputedStyle(document.body, '::before').height]); })()`);
  const css0 = await snap(p);
  const legacyRoutes = await p.eval(`APP.NAV.filter(n => n.id).map(n => n.id)`);
  await admin(p); let bad = [];
  for (const rt of legacyRoutes) { p.logs.length = 0; await go(p, '#/' + rt, 650); const t = await p.eval(`document.getElementById('view').innerText`); if (/Lỗi hiển thị/.test(t) || p.logs.length) bad.push(rt + (p.logs[0] ? ':' + p.logs[0].text.slice(0, 80) : ':Lỗi hiển thị')); }
  rec('A. Legacy', `Mở được TẤT CẢ ${legacyRoutes.length} màn hình ở giao diện cũ (cả màn quản trị), không lỗi`, bad.length === 0, bad.join('; '));
  await p.close();

  /* ============ B. Chuyển đổi + ghi nhớ ============ */
  p = await mo();
  await p.click('#topbar .ui-sw [data-gd="moi"]'); await wait(p, 1200);
  rec('B. Chuyển đổi', 'Bấm "Giao diện mới" → vào giao diện mới (body.ui-moi, .moi-page)', (await isMoi(p)) && await p.eval(`!!document.querySelector('#view .moi-page')`));
  rec('B. Chuyển đổi', 'Nút chuyển đổi có ở header mới, hiển thị rõ đang dùng giao diện nào', await p.eval(`document.querySelector('#topbar .ui-sw [data-gd="moi"]').getAttribute('aria-pressed') === 'true'`));
  rec('B. Chuyển đổi', 'Lựa chọn được ghi nhớ (localStorage = moi), không chứa dữ liệu nghiệp vụ', (await p.eval(`localStorage.getItem('${KEY}')`)) === 'moi');
  await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .moi-page')`, 20000);
  rec('B. Chuyển đổi', 'Refresh → vẫn ở giao diện mới (không phải đăng nhập lại / không mất dữ liệu mẫu)', await isMoi(p) && await p.eval(`STORE.state.du_lieu_mau === true`));
  rec('B. Chuyển đổi', 'Không lỗi console ở giao diện mới sau refresh', p.logs.length === 0, p.logs.map((l) => l.text).join(' | '));
  await p.click('#topbar .ui-sw [data-gd="cu"]'); await wait(p, 900);
  rec('B. Chuyển đổi', 'Quay lại giao diện cũ: bỏ body.ui-moi, khung cũ được khôi phục, không còn lớp moi-*', !(await isMoi(p)) && await p.eval(`!!document.querySelector('aside.sidebar#sidebar') && !!document.querySelector('header.topbar#topbar') && !!document.querySelector('main.content#view') && !document.querySelector('[class*="moi-"]') && !!document.querySelector('#view .page')`));
  rec('B. Chuyển đổi', 'Ghi nhớ lựa chọn "cũ" và refresh → vẫn giao diện cũ', (await p.eval(`localStorage.getItem('${KEY}')`)) === 'cu' && await (async () => { await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000); return !(await isMoi(p)); })());
  const css1 = await (async () => { await p.click('#topbar .ui-sw [data-gd="moi"]'); await wait(p, 1000); await go(p, '#/xep-hang'); await go(p, '#/tong-quan'); await p.click('#topbar .ui-sw [data-gd="cu"]'); await wait(p, 900); return snap(p); })();
  rec('B. Cách ly CSS', 'Sau khi dùng giao diện mới rồi quay lại, kiểu dáng giao diện cũ KHÔNG đổi (12 thuộc tính tính toán giống hệt trước đó)', css0 === css1, css0 === css1 ? '' : css0 + ' ≠ ' + css1);
  await p.click('#view .tile'); await wait(p, 500);
  rec('B. Cách ly CSS', 'Sự kiện của giao diện cũ vẫn đúng sau khi quay lại (bấm ô chỉ tiêu → mở màn chỉ tiêu)', (await p.eval(`location.hash`)).startsWith('#/chi-tieu/'));
  await p.eval(`UI_SWITCH.dat('moi')`); await wait(p, 1000);
  await p.eval(`UI_SWITCH.suCo(new Error('mô phỏng sự cố'))`); await wait(p, 900);
  rec('B. An toàn', 'Giao diện mới gặp sự cố → tự lùi về giao diện cũ, người dùng vẫn làm việc được', !(await isMoi(p)) && await p.eval(`!!document.querySelector('#view .page')`));
  const errs0 = p.logs.length;
  p.logs.length = 0;
  await p.eval(`UI_SWITCH.dat('moi')`); await wait(p, 800); await p.click('#topbar .ui-sw [data-gd="cu"]'); await p.sleep(500); await p.click('#topbar .ui-sw [data-gd="moi"]'); await p.sleep(500);
  const n0 = await p.eval(`document.querySelectorAll('*').length`);
  for (let i = 0; i < 20; i++) { await p.click('#topbar .ui-sw [data-gd="' + (i % 2 ? 'moi' : 'cu') + '"]'); await p.sleep(250); }
  await p.click('#topbar .ui-sw [data-gd="moi"]'); await wait(p, 700);
  const n1 = await p.eval(`document.querySelectorAll('*').length`);
  rec('B. Ổn định', 'Chuyển đổi liên tục 20 lần: không lỗi console', p.logs.length === 0, p.logs.slice(0, 2).map((l) => l.text.slice(0, 100)).join(' | '));
  rec('B. Ổn định', 'Chuyển đổi liên tục 20 lần: số phần tử DOM không phình ra (rò rỉ)', Math.abs(n1 - n0) / n0 < 0.05, n0 + ' → ' + n1);
  void errs0; await p.close();

  /* ============ C. Giữ trạng thái khi chuyển ============ */
  p = await mo(1440, 900, 'cu');
  await p.eval(`APP.ky = { nam: 2026, thang: 6, chon: true }; APP.khoi = 'PGD'; APP.render()`); await wait(p, 600);
  await go(p, '#/chi-tieu/DU_NO_BQ'); await p.eval(`APP.ct_dv = 'PGD_DC'; APP.render()`); await wait(p, 600);
  await p.click('#topbar .ui-sw [data-gd="moi"]'); await wait(p, 1200);
  const st1 = await p.eval(`({ thang: APP.ky.thang, rt: APP.route.id, ct: APP.route.arg, selCt: document.getElementById('moi-sel-ct').value, selDv: document.getElementById('moi-sel-dv').value, selThang: document.getElementById('sel-thang').value })`);
  rec('C. Giữ trạng thái', 'Kỳ báo cáo (T6), màn hình, chỉ tiêu đang xem và đơn vị đang chọn được giữ khi chuyển cũ → mới', st1.thang === 6 && st1.rt === 'chi-tieu' && st1.ct === 'DU_NO_BQ' && st1.selCt === 'DU_NO_BQ' && st1.selDv === 'PGD_DC' && st1.selThang === '6', JSON.stringify(st1));
  await go(p, '#/xep-hang'); await wait(p, 500);
  rec('C. Giữ trạng thái', 'Bộ lọc nhóm đơn vị (PGD) được giữ: giao diện mới chỉ liệt kê PGD', await p.eval(`(() => { const r = [...document.querySelectorAll('#view .vtb-rk-row')]; return r.length > 0 && r.every(x => /\(PGD\)/.test(x.getAttribute('data-tip'))) && document.querySelector('.moi-pill[data-khoi="PGD"]').getAttribute('aria-pressed') === 'true'; })()`));
  await p.click('#topbar .ui-sw [data-gd="cu"]'); await wait(p, 900);
  rec('C. Giữ trạng thái', 'Quay về giao diện cũ: kỳ và nhóm đơn vị vẫn được giữ', await p.eval(`APP.ky.thang === 6 && APP.khoi === 'PGD' && document.getElementById('sel-thang').value === '6' && !!document.querySelector('.pill.on[data-khoi="PGD"]')`));
  await p.close();

  /* ============ D. Đối chiếu nghiệp vụ cũ ↔ mới ============ */
  p = await mo(1440, 900, 'cu');
  const parity = async (thang) => {
    await p.eval(`APP.ky = { nam: 2026, thang: ${thang}, chon: true }; UI_SWITCH.dat('cu')`); await go(p, '#/tong-quan', 900);
    const leg = await p.eval(`({ hero: document.querySelector('#view .ring-val').textContent, stat: (() => { const s = [...document.querySelectorAll('#view .stat')].filter(x => /Đơn vị ≥/.test(x.querySelector('small').textContent))[0]; return s.querySelector('small').textContent.trim() + ' = ' + s.querySelector('b').textContent.trim(); })() })`);
    await p.eval(`UI_SWITCH.dat('moi')`); await go(p, '#/tong-quan', 1100);
    const nw = await p.eval(`(() => { const M = STORE.model(), cn = M.card('CN', 2026, ${thang}), ex = []; document.querySelectorAll('.vtb-kpi[data-ct]').forEach(k => { const r = cn.rows.concat(cn.ref).filter(x => x.ma === k.dataset.ct)[0]; ex.push([k.dataset.ct, k.querySelector('.vtb-display').textContent.trim(), UI.val(r.th, r.ind).replace('%', '')]); }); return { hero: document.querySelector('#view .vtb-hero-num').textContent, stat: (() => { const s = [...document.querySelectorAll('#view .moi-stats .vtb-stat')].filter(x => /Đơn vị ≥/.test(x.textContent))[0]; return s.querySelector('.vtb-label').textContent.trim() + ' = ' + s.querySelector('.vtb-display').textContent.trim(); })(), kpi: ex, rank: [...document.querySelectorAll('#view .vtb-rk-row')].map(r => r.dataset.dv), M: M.ranking(2026, ${thang}).map(c => c.ma), quyDoi: UI.num(cn.quy_doi, 1) }; })()`);
    return { leg, nw };
  };
  for (const t of [3, 6, 10]) {
    const { leg, nw } = await parity(t);
    const fl = (x) => parseFloat(x.replace(',', '.'));
    rec('D. Đối chiếu KPI', `T${t}: điểm KPI chi nhánh bằng nhau về giá trị giữa hai giao diện (cũ ${leg.hero} · mới ${nw.hero}; mới luôn hiện 1 chữ số thập phân)`, Math.abs(fl(leg.hero) - fl(nw.hero)) < 1e-9 && Math.abs(fl(nw.quyDoi) - fl(nw.hero)) < 1e-9, leg.hero + ' vs ' + nw.hero);
    rec('D. Đối chiếu KPI', `T${t}: giá trị thực hiện của MỌI thẻ KPI mới = số của engine (${nw.kpi.length} thẻ)`, nw.kpi.length >= 6 && nw.kpi.every((x) => x[1] === x[2]), JSON.stringify(nw.kpi.filter((x) => x[1] !== x[2]).slice(0, 2)));
    const dat = (x) => x.replace(/\s+/g, ' ').toLowerCase();
    rec('D. Đối chiếu KPI', `T${t}: "Đơn vị ≥ N điểm" (D7) giống nhau (${leg.stat})`, leg.stat.includes('=') && dat(leg.stat) === dat(nw.stat), leg.stat + ' vs ' + nw.stat);
    rec('D. Đối chiếu KPI', `T${t}: thứ tự xếp hạng đơn vị mới = M.ranking của engine`, JSON.stringify(nw.rank) === JSON.stringify(nw.M), nw.rank.join(',') + ' vs ' + nw.M.join(','));
  }
  await go(p, '#/xep-hang', 900); await p.eval(`UI_SWITCH.dat('cu')`); await go(p, '#/xep-hang', 1500);
  const legRank = await p.eval(`[...document.querySelectorAll('#tb-rank .tabulator-row')].map(r => r.textContent.replace(/\\s+/g, ' ').trim().slice(0, 40))`);
  await p.eval(`UI_SWITCH.dat('moi')`); await go(p, '#/xep-hang', 1000);
  const nwRank = await p.eval(`[...document.querySelectorAll('#view .vtb-rk-row')].map(r => r.querySelector('.vtb-rk-name b').textContent)`);
  rec('D. Đối chiếu KPI', 'Bảng xếp hạng cũ (Tabulator) và mới liệt kê cùng thứ tự đơn vị', legRank.length === nwRank.length && nwRank.every((n, i) => legRank[i].includes(n.slice(0, 12))), nwRank.join(',') + ' | ' + legRank.map((x) => x.slice(0, 14)).join(','));
  await p.eval(`STORE.setSettings({ nguong: { dat: 1, kha: 0.8, cct: 0.7, diem_cao: 85 } }); APP.ky = { nam: 2026, thang: 10, chon: true }`); await go(p, '#/tong-quan', 900);
  const n85a = await p.eval(`(() => { const s = [...document.querySelectorAll('#view .moi-stats .vtb-stat')].filter(x => /Đơn vị ≥/.test(x.textContent))[0]; return s.querySelector('.vtb-label').textContent.trim() + ' ' + s.querySelector('.vtb-display').textContent.trim(); })()`);
  await p.eval(`UI_SWITCH.dat('cu')`); await go(p, '#/tong-quan', 1000);
  const n85b = await p.eval(`(() => { const s = [...document.querySelectorAll('#view .stat')].filter(x => /Đơn vị ≥/.test(x.querySelector('small').textContent))[0]; return s.querySelector('small').textContent.trim() + ' ' + s.querySelector('b').textContent.trim(); })()`);
  const exp85 = await p.eval(`STORE.model().ranking(2026, 10).filter(c => c.quy_doi >= 85).length`);
  rec('D. Đối chiếu KPI', 'D7: đổi nguong.diem_cao = 85 → cả hai giao diện cùng hiển thị "≥ 85 điểm" và cùng số đơn vị đúng theo engine', /≥ 85 điểm/.test(n85a) && /≥ 85 điểm/.test(n85b) && n85a.split(' ').pop().startsWith(exp85 + '/') && n85b.split(' ').pop().startsWith(exp85 + '/'), n85a + ' | ' + n85b + ' | engine ' + exp85);
  await p.close();

  /* ============ E. Tính năng giao diện mới ============ */
  p = await mo(1440, 900, 'moi');
  await go(p, '#/tong-quan', 1000);
  const fc = await p.eval(`(() => { const X = STORE.model().duBaoXepHang(2026, APP.ky.thang), du = X && X.cn && X.cn.quy_doi_du_bao, svg = document.querySelector('[data-ch="trend"] svg.vtb-trend'); return { co: typeof du === 'number' && isFinite(du), dashed: !!svg.querySelector('path[stroke-dasharray="6 5"]'), label: [...svg.querySelectorAll('text')].some(t => t.textContent.startsWith('DỰ KIẾN')), legend: !!svg.parentNode.querySelector('.vtb-dukien'), solid: [...svg.querySelectorAll('path')].filter(x => !x.getAttribute('stroke-dasharray') && x.getAttribute('stroke') === 'var(--series-1)').length }; })()`);
  rec('E. D8 Dự kiến', 'Biểu đồ xu hướng: thực tế nét LIỀN; DỰ KIẾN nét ĐỨT + nhãn + chú giải — và chỉ vẽ khi hệ thống có số dự báo', fc.solid >= 1 && fc.dashed === fc.co && fc.label === fc.co && (!fc.co || fc.legend), JSON.stringify(fc));
  await p.eval(`APP.ky = { nam: 2026, thang: 10, chon: true }; APP.render()`); await wait(p, 600);
  const dashed = await p.eval(`document.querySelectorAll('[data-view-card]').length`);
  rec('E. Bảng thay thế', `Mỗi biểu đồ có nút "Bảng" và bảng có dữ liệu (${dashed} khối ở Tổng quan)`, await p.eval(`[...document.querySelectorAll('#view [data-view-card]')].every(c => !!c.querySelector('.moi-seg') && c.querySelectorAll('.moi-vtable table tbody tr').length > 0)`));
  await p.click('#view [data-view-card] .moi-seg button[data-view="table"]');
  rec('E. Bảng thay thế', 'Bấm "Bảng" → hiển thị bảng, ẩn biểu đồ', await p.eval(`(() => { const c = document.querySelector('#view [data-view-card].is-table'); return !!c && getComputedStyle(c.querySelector('.moi-vtable')).display !== 'none' && getComputedStyle(c.querySelector('.moi-vchart')).display === 'none'; })()`));
  /* lọc + drill-down */
  /* Thẻ Xếp hạng ở Tổng quan không còn bộ lọc nhóm (theo yêu cầu): kiểm tra lọc trên màn Xếp hạng, rồi quay lại Tổng quan để thử drill-down */
  await go(p, '#/xep-hang'); await wait(p, 500);
  const n0r = await p.eval(`document.querySelectorAll('#view .vtb-rk-row').length`);
  await p.click('.moi-pill[data-khoi="PGD"]');
  const n1r = await p.eval(`document.querySelectorAll('#view .vtb-rk-row').length`);
  await p.click('.moi-pill[data-khoi=""]');
  rec('E. Bộ lọc', 'Màn Xếp hạng: lọc theo nhóm đơn vị (PGD) rồi xoá lọc → danh sách thu hẹp rồi trở lại đầy đủ', n1r > 0 && n1r < n0r && (await p.eval(`document.querySelectorAll('#view .vtb-rk-row').length`)) === n0r, n0r + '→' + n1r);
  rec('E. Bộ lọc', 'Thẻ Xếp hạng ở Tổng quan không còn bộ lọc nhóm', (await (async () => { await go(p, '#/tong-quan'); await wait(p, 500); return p.eval(`!document.querySelector('.a-rank .moi-pill[data-khoi]')`); })()));
  await p.click('#view .vtb-rk-row'); await wait(p, 500);
  const dr = await p.eval(`({ dv: APP.moi_dv, drill: !!document.querySelector('.moi-drill .vtb-hero-num'), scope: document.querySelector('.a-bullets .moi-scope').textContent })`);
  rec('E. Drill-down', 'Chi nhánh → đơn vị: bấm một đơn vị ở xếp hạng → hiện chi tiết chỉ tiêu của đơn vị đó', !!dr.dv && dr.drill, JSON.stringify(dr));
  await p.click('#view .a-bullets .moi-vchart .vtb-bullet'); await wait(p, 500);
  rec('E. Drill-down', 'Đơn vị → chỉ tiêu: bấm một chỉ tiêu → biểu đồ so sánh kế hoạch/thực hiện đổi theo', await p.eval(`!!APP.moi_ct && document.querySelector('.a-compare .moi-scope').textContent.includes(STORE.model().indMap[APP.moi_ct].ten_ngan)`));
  await p.click('[data-act="ve-cn"]'); rec('E. Drill-down', 'Nút "Về toàn chi nhánh" hoạt động', await p.eval(`!APP.moi_dv`));
  /* bàn phím */
  await p.eval(`document.querySelector('#view .vtb-rk-row').focus()`); await p.key('Enter'); await wait(p, 400);
  rec('E. Bàn phím', 'Enter trên hàng xếp hạng kích hoạt drill-down', await p.eval(`!!APP.moi_dv`));
  await p.eval(`document.activeElement.blur(); document.body.setAttribute('tabindex', '-1'); document.body.focus(); window.scrollTo(0, 0)`); const seen = [];
  for (let i = 0; i < 45; i++) { await p.key('Tab'); seen.push(await p.eval(`(() => { const e = document.activeElement, cs = getComputedStyle(e); return { tag: e.tagName, role: e.getAttribute('role') || '', ring: e.matches(':focus-visible') && !cs.outlineStyle.startsWith('none') }; })()`)); }
  const kinds = [...new Set(seen.map((s) => s.tag + (s.role ? '[' + s.role + ']' : '')))];
  rec('E. Bàn phím', 'Tab đi qua liên kết điều hướng, nút (chuyển giao diện), ô chọn, thẻ KPI; mọi phần tử nhận focus có vòng focus nhìn thấy', kinds.includes('A') && kinds.includes('BUTTON') && kinds.includes('SELECT') && seen.every((s) => s.ring), kinds.join(',') + ' | không vòng: ' + JSON.stringify(seen.filter((s) => !s.ring).slice(0, 2)));
  /* màu & trạng thái */
  const col = await p.eval(`(() => { const box = document.createElement('div'); box.className = 'vtb-scope'; box.innerHTML = ['dat','kha','cct','chua','gap'].map(t => '<span class="vtb-seg vtb-f-' + t + '" id="pa-' + t + '"></span>').join(''); document.getElementById('view').appendChild(box); const m = {}; for (const t of ['dat','kha','cct','chua','gap']) m[t] = getComputedStyle(document.getElementById('pa-' + t)).backgroundColor; box.remove(); const ch = [...document.querySelectorAll('#view .vtb-chip[data-tier]')]; return { m, n: ch.length, sans: ch.filter(c => !c.querySelector('svg') || !c.textContent.trim()).length }; })()`);
  const W = { dat: 'rgb(99, 190, 123)', kha: 'rgb(255, 235, 132)', cct: 'rgb(244, 162, 97)', chua: 'rgb(231, 107, 112)', gap: 'rgb(233, 237, 242)' };
  rec('E. Màu PA-A', 'Màu trạng thái theo quy chuẩn --status-* (Đạt #63BE7B · Khá #FFEB84 · CCT #F4A261 · Chưa đạt #E76B70 · GAP #E9EDF2) — kiểm bằng mẫu đủ 5 mức', Object.keys(W).every((k) => col.m[k] === W[k]), JSON.stringify(col.m));
  rec('E. Màu PA-A', `Không chỉ dựa vào màu: ${col.n} chip trạng thái đều có biểu tượng + nhãn chữ`, col.n > 10 && col.sans === 0);
  rec('E. D6', 'Ma trận trạng thái (cập nhật theo yêu cầu Heatmap liên tục): mỗi ô có số + mức hợp lệ; ô có số dùng màu Heatmap --hm, ô GAP giữ biểu tượng; không có thang cũ .heat-legend', await (async () => { await go(p, '#/ma-tran', 900); return p.eval(`(() => { const c = [...document.querySelectorAll('#view td.vtb-cell')]; return c.length > 20 && c.every(x => (x.querySelector('svg') || x.style.getPropertyValue('--hm')) && x.textContent.trim() && /^(dat|kha|cct|chua|gap)$/.test(x.dataset.tier)) && !document.querySelector('.heat-legend'); })()`); })());
  rec('E. Console', 'Không lỗi/cảnh báo console khi dùng các tính năng giao diện mới', p.logs.length === 0, p.logs.slice(0, 3).map((l) => l.text.slice(0, 120)).join(' | '));
  await p.close();

  /* ============ F. Mọi màn hình trong giao diện mới ============ */
  p = await mo(1440, 900, 'moi'); await admin(p); const routes = await p.eval(`APP.NAV.filter(n => n.id).map(n => [n.id, !!n.admin])`); let badM = [], nat = [], host = [];
  for (const [rt] of routes) { p.logs.length = 0; await go(p, '#/' + rt, 750); const info = await p.eval(`({ t: document.getElementById('view').innerText.slice(0, 4000), native: !!document.querySelector('#view .moi-page'), host: !!document.querySelector('#view .moi-legacy'), ov: document.documentElement.scrollWidth > innerWidth + 1 })`); (info.native ? nat : host).push(rt); if (/Lỗi hiển thị/.test(info.t) || p.logs.length || info.ov) badM.push(rt + (info.ov ? ':tràn ngang' : '') + (p.logs[0] ? ':' + p.logs[0].text.slice(0, 80) : '')); }
  rec('F. Mọi màn hình', `Mở được TẤT CẢ ${routes.length} màn hình ở giao diện mới, không lỗi, không tràn ngang`, badM.length === 0, badM.join('; '));
  rec('F. Mọi màn hình', `Thiết kế lại hoàn toàn bằng Design System: ${nat.length} màn (${nat.join(', ')}); đặt trong vỏ mới với bảng màu mới: ${host.length} màn (${host.join(', ')})`, nat.length >= 6 && nat.length + host.length === routes.length);
  await go(p, '#/du-lieu', 900);
  rec('F. D7 cài đặt', 'Màn "Dữ liệu & cài đặt" có ô "Ngưỡng điểm cao", mặc định 90; sửa → lưu → refresh vẫn giữ', await (async () => {
    await p.eval(`STORE.setSettings({ nguong: { dat: 1, kha: 0.8, cct: 0.7, diem_cao: 90 } }); APP.render()`); await p.sleep(500);
    const v0 = await p.eval(`document.getElementById('s-diem').value`);
    await p.eval(`document.getElementById('s-diem').value = '88'; document.getElementById('s-save').click()`); await p.sleep(900);
    await p.goto(APPURL + '#/du-lieu', { ready: false }); await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000); await p.sleep(600);
    const v1 = await p.eval(`STORE.model().ng.diem_cao + '|' + STORE.state.settings.nguong.dat`);
    return v0 === '90' && v1 === '88|1';
  })());
  await p.close();

  /* ============ G. Presentation Mode + kích thước ============ */
  for (const [w, h] of [[1920, 1080], [1440, 900], [1366, 768]]) for (const man of ['tong-quan', 'dieu-hanh']) {
    p = await mo(w, h, 'moi'); await go(p, '#/' + (man === 'dieu-hanh' ? 'dieu-hanh' : 'tong-quan'), 1000); await p.click('[data-act="stage"]'); await wait(p, 900);
    const o = await p.eval(`(() => { const st = document.querySelector('.moi-stage'), r = st.getBoundingClientRect(), sc = st.querySelector('.moi-st-body'); const cl = [...sc.querySelectorAll('.moi-card')].filter(c => c.scrollHeight - c.clientHeight > 4).map(c => c.className.split(' ').slice(-1)[0]); const rows = [...sc.querySelectorAll('.vtb-rk-row')], card = rows[0] && rows[0].closest('.moi-card'); return { in: r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, ratio: r.width / r.height, cl, rowsOk: rows.length > 0 && rows[rows.length - 1].getBoundingClientRect().bottom <= card.getBoundingClientRect().bottom + 1, nav: !document.querySelector('.moi-stage-root .moi-nav-i'), sw: document.documentElement.scrollWidth <= innerWidth + 1 }; })()`);
    rec('G. Trình chiếu', `${man} @${w}×${h}: khung 16:9 vừa cửa sổ (${o.ratio.toFixed(3)}), không thẻ nào bị cắt, đủ hàng xếp hạng, không điều hướng thừa`, o.in && Math.abs(o.ratio - 16 / 9) < 0.02 && o.cl.length === 0 && o.rowsOk && o.nav && o.sw, JSON.stringify(o));
    if (w === 1920 && man === 'tong-quan') {
      const ky0 = await p.eval(`APP.ky.thang`); await p.key('ArrowRight'); await wait(p, 700);
      rec('G. Trình chiếu', 'Phím → chuyển giữa Tổng quan và Điều hành BGĐ; không mất kỳ đang xem', await p.eval(`document.querySelector('.moi-st-tabs [data-st="dieu-hanh"]').getAttribute('aria-pressed') === 'true' && APP.ky.thang === ${ky0}`));
      await p.key('Escape'); await wait(p, 600);
      rec('G. Trình chiếu', 'Esc thoát trình chiếu; quay lại màn hình thường, trạng thái ứng dụng được giữ', await p.eval(`!document.querySelector('.moi-stage-root') && !!document.querySelector('#view .moi-page') && APP.ky.thang === ${ky0}`));
      await p.click('[data-act="stage"]'); await wait(p, 600); await p.click('[data-act="stage-exit"]'); await wait(p, 500);
      rec('G. Trình chiếu', 'Nút "Thoát trình chiếu" hoạt động', await p.eval(`!document.querySelector('.moi-stage-root')`));
    }
    await p.close();
  }
  for (const [w, h] of [[1920, 1080], [1440, 900], [1366, 768], [1024, 768], [768, 1024]]) {
    p = await mo(w, h, 'moi'); const bad2 = [];
    for (const rt of ['tong-quan', 'dieu-hanh', 'chi-tieu', 'xep-hang', 'ma-tran', 'phong', 'canh-bao']) { await go(p, '#/' + rt, 700); if (await p.eval(`document.documentElement.scrollWidth > innerWidth + 1`)) bad2.push(rt); }
    rec('H. Kích thước', `${w}×${h}: 7 màn hình mới không tràn ngang / vỡ bố cục`, bad2.length === 0 && p.logs.length === 0, bad2.join(',') + ' ' + p.logs.slice(0, 1).map((l) => l.text.slice(0, 80)).join(''));
    await p.close();
  }
} catch (e) { rec('Hệ thống', 'Bộ kiểm thử chạy hết không ngoại lệ', false, e.stack || e.message); }
finally { await b.close(); }
fs.writeFileSync(path.join(OUT, 'dual-ui-results.json'), JSON.stringify({ at: new Date().toISOString(), total: R.length, failed: fail, results: R }, null, 1));
console.log(`\n${R.length - fail}/${R.length} đạt`); process.exit(fail ? 1 : 0);
