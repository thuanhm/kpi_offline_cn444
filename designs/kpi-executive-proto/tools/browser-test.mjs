// KIỂM THỬ NGHIỆM THU TRÊN TRÌNH DUYỆT (bản độc lập). Chạy: node tools/browser-test.mjs
// Ghi reports/browser-test.json + reports/browser-test.md. Thoát mã 1 nếu có mục không đạt.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL0 = pathToFileURL(path.join(ROOT, 'standalone', 'index.html')).href;
const results = []; let failed = 0;
const rec = (group, name, ok, detail = '') => { results.push({ group, name, ok, detail }); if (!ok) failed++; console.log((ok ? '✓' : '✗') + ' [' + group + '] ' + name + (detail ? ' — ' + detail : '')); };

const b = await launch(9335);
async function open(w, h, hash = '') { const p = await b.newPage(); await p.viewport(w, h); await p.goto(URL0 + hash); return p; }
const ev = (p, s) => p.eval(s);
const val = (p, f) => p.eval(`(() => { ${f} })()`);
try {
  /* ---- 1. Kích thước màn hình mục tiêu: không lỗi console, không tràn ngang, bố cục không vỡ ---- */
  const SIZES = [[1920, 1080], [1440, 900], [1366, 768], [1024, 768], [768, 1024], [390, 844]];
  for (const [w, h] of SIZES) for (const man of ['tong-quan', 'dieu-hanh']) {
    const p = await open(w, h, man === 'tong-quan' ? '' : '#man=dieu-hanh');
    const o = await val(p, `const d = document.documentElement; return { sw: d.scrollWidth, iw: innerWidth, vis: [...document.querySelectorAll('.screen:not([hidden]) [data-draw]')].filter(e => e.closest('[hidden]') == null && e.innerHTML.trim() === '—').length };`);
    rec('Kích thước', `${w}×${h} · ${man}: không tràn ngang`, o.sw <= o.iw + 1, `scrollWidth ${o.sw} / cửa sổ ${o.iw}`);
    rec('Kích thước', `${w}×${h} · ${man}: mọi khối đã được vẽ (không còn "—")`, o.vis === 0, o.vis ? o.vis + ' khối chưa vẽ' : '');
    rec('Console', `${w}×${h} · ${man}: không lỗi/cảnh báo console`, p.logs.length === 0, p.logs.slice(0, 2).map((l) => l.text.slice(0, 100)).join(' | '));
    await p.close();
  }

  /* ---- 2. Trình chiếu 16:9: vừa khung, không mất nội dung ở nhiều kích thước cửa sổ ---- */
  for (const man of ['tong-quan', 'dieu-hanh']) for (const [w, h] of [[1920, 1080], [1440, 900], [1280, 720], [1000, 700]]) {
    const p = await open(w, h, `#man=${man}&tc=1`);
    const o = await val(p, `
      const r = document.querySelector('.is-stage .stage').getBoundingClientRect(), s = document.querySelector('.screen:not([hidden])');
      const clipped = [...s.querySelectorAll('.card')].filter(c => c.scrollHeight - c.clientHeight > 4).map(c => c.className.split(' ').slice(-1)[0]);
      const rows = [...s.querySelectorAll('.vtb-rk-row')]; const cardR = rows[0].closest('.card').getBoundingClientRect();
      const lastBottom = rows.length ? rows[rows.length - 1].getBoundingClientRect().bottom : 0;
      const ratio = r.width / r.height;
      return { inside: r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, ratio, clipped, rows: rows.length, rowsVisible: lastBottom <= cardR.bottom + 1, sw: document.documentElement.scrollWidth, iw: innerWidth };`);
    rec('Trình chiếu', `${man} @${w}×${h}: khung 16:9 nằm gọn trong cửa sổ`, o.inside && Math.abs(o.ratio - 16 / 9) < 0.02, `tỷ lệ ${o.ratio.toFixed(3)}`);
    rec('Trình chiếu', `${man} @${w}×${h}: không thẻ nào bị cắt nội dung`, o.clipped.length === 0, o.clipped.join(', '));
    rec('Trình chiếu', `${man} @${w}×${h}: đủ 12 đơn vị trong bảng xếp hạng, hàng cuối còn trong thẻ`, o.rows === 12 && o.rowsVisible, `${o.rows} hàng`);
    rec('Trình chiếu', `${man} @${w}×${h}: không tràn ngang`, o.sw <= o.iw + 1);
    await p.close();
  }

  /* ---- 3. Chuyển màn hình, chọn kỳ, lọc, drill-down, trình chiếu ---- */
  let p = await open(1440, 900);
  const vis = (id) => val(p, `return !document.getElementById('${id}').hidden;`);
  rec('Tương tác', 'Mặc định mở Tổng quan chi nhánh', (await vis('screen-tong-quan')) && !(await vis('screen-dieu-hanh')));
  await p.click('.tab[data-man="dieu-hanh"]');
  rec('Tương tác', 'Bấm tab → chuyển sang Điều hành BGĐ', !(await vis('screen-tong-quan')) && (await vis('screen-dieu-hanh')));
  await p.click('.tab[data-man="tong-quan"]');
  const hero10 = await val(p, `return document.querySelector('[data-draw="tq-hero"] .vtb-hero-num').textContent;`);
  await ev(p, `(() => { const s = document.getElementById('sel-ky'); s.value = '5'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`); await p.sleep(500);
  const hero5 = await val(p, `return document.querySelector('[data-draw="tq-hero"] .vtb-hero-num').textContent;`);
  rec('Tương tác', 'Chọn kỳ báo cáo T5 → điểm KPI đổi so với T10', hero5 !== hero10, `T10 ${hero10} → T5 ${hero5}`);
  const noFc = await val(p, `const t = document.querySelector('[data-draw="tq-trend"]'); return { dashed: !!t.querySelector('[stroke-dasharray="6 5"]'), has: t.textContent.includes('DỰ KIẾN'), msg: t.textContent.includes('Chưa có dữ liệu dự kiến') };`);
  rec('D8', 'Kỳ không có dữ liệu dự kiến: KHÔNG vẽ đường dự kiến và có thông báo', !noFc.dashed && noFc.msg, JSON.stringify(noFc));
  await ev(p, `(() => { const s = document.getElementById('sel-ky'); s.value = '10'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`); await p.sleep(500);
  const fc = await val(p, `const t = document.querySelector('[data-draw="tq-trend"]'); const dash = t.querySelector('path[stroke-dasharray="6 5"]'); const solid = [...t.querySelectorAll('path')].filter(x => !x.getAttribute('stroke-dasharray') && x.getAttribute('stroke') === 'var(--series-1)').length; return { dashed: !!dash, label: [...t.querySelectorAll('text')].some(x => x.textContent.startsWith('DỰ KIẾN')), legend: t.textContent.includes('không phải số thực tế'), solid };`);
  rec('D8', 'Đường dự kiến: nét ĐỨT + nhãn "DỰ KIẾN" + chú giải; đường thực tế nét LIỀN', fc.dashed && fc.label && fc.legend && fc.solid >= 1, JSON.stringify(fc));
  const rk0 = await val(p, `return document.querySelectorAll('[data-draw="tq-rank"] .vtb-rk-row').length;`);
  await p.click('.pill[data-khoi="KHDN"]');
  const rk1 = await val(p, `return document.querySelectorAll('[data-draw="tq-rank"] .vtb-rk-row').length;`);
  rec('Tương tác', 'Lọc theo khối KHDN → danh sách xếp hạng thu hẹp', rk0 === 12 && rk1 === 3, `${rk0} → ${rk1}`);
  await p.click('.pill[data-khoi=""]');
  await p.click('[data-draw="tq-rank"] .vtb-rk-row[data-dv="DV12"]');
  const dr = await val(p, `return { scope: document.querySelector('[data-draw="tq-scope"]').textContent, rows: document.querySelectorAll('[data-draw="tq-bullets"] .vtb-bullet').length, sum: !!document.querySelector('[data-draw="tq-drill"] .drill-sum') };`);
  rec('Tương tác', 'Drill-down: bấm đơn vị → xuống chỉ tiêu của đơn vị đó', dr.sum && /P\.HT-2/.test(dr.scope) && dr.rows === 6, JSON.stringify(dr));
  await p.click('[data-draw="tq-bullets"] .vtb-bullet[data-ct="THE"]');
  const ct = await val(p, `return document.querySelector('[data-draw="tq-compare-name"]').textContent;`);
  rec('Tương tác', 'Drill-down: bấm chỉ tiêu → biểu đồ so sánh KH/TH đổi theo', /Thẻ phát hành/.test(ct) && /P\.HT-2/.test(ct), ct);
  await p.click('#btn-clear-dv'); await p.click('[data-draw="tq-kpis"] .vtb-kpi[data-ct="NII"]');
  const ct2 = await val(p, `return document.querySelector('[data-draw="tq-compare-name"]').textContent;`);
  rec('Tương tác', 'Bấm thẻ KPI (NII) → chi tiết chỉ tiêu đổi', /NII/.test(ct2) && /Toàn CN/.test(ct2), ct2);
  await p.click('#btn-present');
  rec('Tương tác', 'Bấm "Trình chiếu" → vào chế độ trình chiếu', await val(p, `return document.getElementById('vtb-root').classList.contains('is-stage');`));
  await p.key('ArrowRight');
  rec('Tương tác', 'Trình chiếu: phím → chuyển màn hình', await vis('screen-dieu-hanh'));
  await p.key('Escape');
  rec('Tương tác', 'Phím Esc thoát trình chiếu', !(await val(p, `return document.getElementById('vtb-root').classList.contains('is-stage');`)));
  await p.click('#btn-present'); await p.click('#btn-exit-present');
  rec('Tương tác', 'Nút "Thoát trình chiếu" thoát được', !(await val(p, `return document.getElementById('vtb-root').classList.contains('is-stage');`)));

  /* ---- 4. Bảng thay thế cho mọi biểu đồ ---- */
  const alt = await val(p, `return [...document.querySelectorAll('[data-view-card]')].map(c => ({ h: c.querySelector('h2').textContent.slice(0, 40), table: c.querySelectorAll('.v-table table tbody tr').length, hasToggle: !!c.querySelector('.seg') }));`);
  p = await open(1440, 900, '#man=dieu-hanh'); const alt2 = await val(p, `return [...document.querySelectorAll('.screen:not([hidden]) [data-view-card]')].map(c => ({ h: c.querySelector('h2').textContent.slice(0, 40), table: c.querySelectorAll('.v-table table tbody tr').length, hasToggle: !!c.querySelector('.seg') }));`);
  const bad = alt.concat(alt2).filter((x) => !x.table || !x.hasToggle);
  rec('Truy cập', `Mọi biểu đồ (${alt.length + alt2.length}) có nút chuyển sang dạng bảng và bảng có dữ liệu`, bad.length === 0, bad.map((x) => x.h).join('; '));
  await p.click('.screen:not([hidden]) [data-view-card] .seg button[data-view="table"]');
  rec('Truy cập', 'Bấm "Bảng" → hiển thị bảng thay cho biểu đồ', await val(p, `const c = document.querySelector('.screen:not([hidden]) [data-view-card].is-table'); return !!c && getComputedStyle(c.querySelector('.v-table')).display !== 'none' && getComputedStyle(c.querySelector('.v-chart')).display === 'none';`));

  /* ---- 5. Trạng thái không chỉ bằng màu; nhất quán màu; không gradient/3D ---- */
  p = await open(1440, 900);
  const tiers = await val(p, `const els = [...document.querySelectorAll('[data-tier].vtb-chip')]; const noLabel = els.filter(e => !e.textContent.trim() || !e.querySelector('svg')).length; const shapes = {}; els.forEach(e => { const t = e.dataset.tier; shapes[t] = (shapes[t] || new Set()).add(e.querySelector('svg').innerHTML.length); }); return { n: els.length, noLabel, kinds: Object.keys(shapes).sort() };`);
  rec('Màu', `Mọi chip trạng thái (${tiers.n}) có biểu tượng + nhãn chữ`, tiers.n > 20 && tiers.noLabel === 0, tiers.kinds.join(','));
  const cols = await val(p, `const m = {}; for (const t of ['dat','kha','cct','chua','gap']) { const e = document.querySelector('.vtb-f-' + t) ; m[t] = e ? getComputedStyle(e).backgroundColor : null; } return m;`);
  const WANT = { dat: 'rgb(28, 92, 171)', kha: 'rgb(109, 167, 236)', cct: 'rgb(236, 131, 90)', chua: 'rgb(176, 42, 42)', gap: 'rgb(137, 150, 171)' };
  rec('Màu', 'Màu trạng thái PA-A đúng giá trị phê duyệt (#1c5cab, #6da7ec, #ec835a, #b02a2a, #8996ab) ở mọi thành phần', Object.keys(WANT).every((k) => cols[k] === WANT[k]), JSON.stringify(cols));
  const brand = await val(p, `const root = getComputedStyle(document.documentElement); return { blue: root.getPropertyValue('--brand-blue').trim(), red: root.getPropertyValue('--brand-red').trim() };`);
  rec('Màu', 'Màu thương hiệu #005993 và #d71249 được giữ nguyên', brand.blue === '#005993' && brand.red === '#d71249', JSON.stringify(brand));
  const css = await val(p, `let g = 0, d3 = 0, an = 0; for (const s of document.styleSheets) for (const r of s.cssRules) { const t = r.cssText || ''; if (t.startsWith('@font-face')) continue; if (/gradient\\(/i.test(t)) g++; if (/perspective|rotate3d|translate3d|rotateX|rotateY/i.test(t)) d3++; if (/@keyframes|animation:/i.test(t)) an++; } return { g, d3, an };`);
  rec('Thiết kế', 'Không dùng gradient', css.g === 0, 'gradient: ' + css.g);
  rec('Thiết kế', 'Không dùng hiệu ứng 3D', css.d3 === 0, '3D: ' + css.d3);
  rec('Thiết kế', 'Không dùng animation / keyframes', css.an === 0, 'animation: ' + css.an);
  const svg3d = await val(p, `return document.querySelectorAll('svg [filter], svg filter, canvas').length;`);
  rec('Thiết kế', 'Biểu đồ là SVG phẳng (không canvas/filter)', svg3d === 0, String(svg3d));
  const font = await p.eval(`(async () => { await document.fonts.load('600 14px "Plus Jakarta Sans"', 'ặờỹ'); await document.fonts.ready; return { loaded: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight).slice(0, 4), sample: document.fonts.check('600 14px "Plus Jakarta Sans"', 'ặờỹ') }; })()`);
  rec('Typography', 'Plus Jakarta Sans được nạp và hỗ trợ tiếng Việt (ặ ờ ỹ)', font.sample === true && font.loaded.length > 0, JSON.stringify(font));
  const small = await val(p, `const bad = []; document.querySelectorAll('.screen:not([hidden]) *').forEach(e => { if (e.children.length === 0 && e.textContent.trim() && !(e instanceof SVGElement)) { const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 11.9) bad.push(e.className + ':' + fs); } }); return bad.slice(0, 5);`);
  rec('Typography', 'Chữ HTML không nhỏ hơn 12px', small.length === 0, small.join(', '));

  /* ---- 6. Bàn phím ---- */
  p = await open(1440, 900); await p.eval(`document.body.focus(); window.scrollTo(0,0)`);
  const seen = [];
  for (let i = 0; i < 40; i++) { await p.key('Tab'); seen.push(await val(p, `const e = document.activeElement; const cs = getComputedStyle(e); return { tag: e.tagName, cls: (e.className && e.className.baseVal === undefined ? e.className : '').split(' ').slice(0, 2).join('.'), role: e.getAttribute('role') || '', outline: cs.outlineStyle + ' ' + cs.outlineWidth, ring: e.matches(':focus-visible') };`)); }
  const kinds = new Set(seen.map((s) => s.tag + (s.role ? '[' + s.role + ']' : '')));
  rec('Bàn phím', 'Tab đi qua tab màn hình, ô chọn, nút, thẻ KPI, hàng xếp hạng', ['BUTTON', 'SELECT', 'DIV[button]'].every((k) => kinds.has(k)), [...kinds].join(', '));
  const noRing = seen.filter((s) => !s.ring || s.outline.startsWith('none'));
  rec('Bàn phím', 'Mọi phần tử nhận focus đều có vòng focus nhìn thấy (outline)', noRing.length === 0, noRing.slice(0, 3).map((s) => s.tag + '.' + s.cls).join(', '));
  await p.eval(`document.querySelector('.vtb-rk-row[data-dv="DV03"]').focus()`); await p.key('Enter');
  rec('Bàn phím', 'Enter trên hàng xếp hạng kích hoạt drill-down', await val(p, `return document.querySelector('[data-draw="tq-scope"]').textContent.includes('P.KHDN-3');`));
  const tapSmall = await val(p, `return [...document.querySelectorAll('.tab,.btn,.vtb-kpi,.vtb-rk-row,.vtb-bullet')].filter(e => e.getBoundingClientRect().height < 28 && e.offsetParent).map(e => e.className.split(' ')[0]).slice(0, 5);`);
  rec('Bàn phím', 'Vùng bấm tối thiểu 28px (nút, thẻ, hàng)', tapSmall.length === 0, tapSmall.join(', '));

  /* ---- 7. Nhãn/ARIA cho biểu đồ ---- */
  const aria = await val(p, `const bad = [...document.querySelectorAll('svg.vtb-trend, svg.vtb-col, svg.vtb-spark')].filter(s => !s.getAttribute('aria-label')); return bad.length;`);
  rec('Truy cập', 'Mọi biểu đồ SVG có aria-label mô tả', aria === 0, aria + ' thiếu');
  const dots = await val(p, `const d = [...document.querySelectorAll('.vtb-dot, .vtb-col rect')]; return { n: d.length, tab: d.filter(x => x.getAttribute('tabindex') === '0' && x.getAttribute('aria-label')).length };`);
  rec('Truy cập', 'Điểm dữ liệu biểu đồ truy cập được bằng bàn phím và có nhãn (tooltip không là cách duy nhất)', dots.n > 0 && dots.n === dots.tab, JSON.stringify(dots));
  const dirs = await val(p, `return document.documentElement.lang;`);
  rec('Truy cập', 'Trang khai báo ngôn ngữ vi', dirs === 'vi', dirs);

  /* ---- 8. D7 hiển thị cấu hình ---- */
  const d7 = await val(p, `const t = [...document.querySelectorAll('[data-draw="tq-stats"] .vtb-stat')][0]; return t.textContent.replace(/\\s+/g, ' ');`);
  rec('D7', 'Ô "Đơn vị ≥ N điểm" lấy N từ cấu hình nguong (mặc định 90) và đếm đúng', /≥ 90 điểm/.test(d7) && /7\/12/.test(d7), d7);

  /* ---- 9. In A4 ngang (màn Điều hành, chế độ trình chiếu) ---- */
  p = await open(1920, 1080, '#man=dieu-hanh&tc=1'); const pdf = path.join(ROOT, 'reports', 'in-a4-ngang_dieu-hanh.pdf'); await p.pdf(pdf);
  const pdfTxt = fs.readFileSync(pdf, 'latin1'); const pages = (pdfTxt.match(/\/Type\s*\/Page\b(?!s)/g) || []).length;
  rec('In ấn', 'Màn Điều hành in ra A4 ngang đúng 1 trang', pages === 1, pages + ' trang; ' + Math.round(fs.statSync(pdf).size / 1024) + ' KB');
} catch (e) { rec('Hệ thống', 'Bộ kiểm thử chạy hết không lỗi', false, e.message); }
finally { await b.close(); }

fs.writeFileSync(path.join(ROOT, 'reports', 'browser-test.json'), JSON.stringify({ at: new Date().toISOString(), total: results.length, failed, results }, null, 1));
const groups = [...new Set(results.map((r) => r.group))];
let md = `# Kết quả kiểm thử trên trình duyệt\n\nTổng: ${results.length} kiểm tra · **${results.length - failed} đạt** · ${failed} không đạt. Chạy bằng \`node tools/browser-test.mjs\` (Edge headless qua DevTools Protocol).\n`;
for (const g of groups) { md += `\n## ${g}\n\n| | Kiểm tra | Chi tiết |\n|---|---|---|\n`; for (const r of results.filter((x) => x.group === g)) md += `| ${r.ok ? '✓' : '✗'} | ${r.name} | ${String(r.detail).replace(/\|/g, '\\|').slice(0, 160)} |\n`; }
fs.writeFileSync(path.join(ROOT, 'reports', 'browser-test.md'), md);
console.log(`\n${results.length - failed}/${results.length} đạt`); process.exit(failed ? 1 : 0);
