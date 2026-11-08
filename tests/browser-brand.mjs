// KIỂM THỬ NHẬN DIỆN THƯƠNG HIỆU VietinBank (giao diện mới) — Edge/Chrome headless, hồ sơ sạch ⇒ dữ liệu MẪU; không đọc Data/.
//   node tests/browser-brand.mjs   → ghi tests/out/brand-results.json
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch } from './lib/browser.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = path.join(ROOT, 'tests', 'out');
const APPURL = pathToFileURL(path.join(ROOT, 'App', 'index.html')).href, KEY = 'KPI_CN444.giao_dien';
fs.mkdirSync(OUT, { recursive: true });
const R = []; let fail = 0;
const rec = (g, n, ok, d = '') => { R.push({ g, n, ok: !!ok, d: String(d).slice(0, 300) }); if (!ok) fail++; console.log((ok ? '✓' : '✗') + ' [' + g + '] ' + n + (d && !ok ? ' — ' + d : '')); };
const BLUE = 'rgb(0, 83, 142)', RED = 'rgb(215, 18, 73)', SKY = 'rgb(128, 209, 242)';
const lum = (c) => { const v = c.match(/\d+/g).slice(0, 3).map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const cr = (a, c) => { const x = lum(a), y = lum(c); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
/* --- tĩnh: mã màu trong mã nguồn giao diện mới --- */
const MOI = path.join(ROOT, 'App', 'ui-moi'), files = fs.readdirSync(MOI).filter((f) => /\.(css|js)$/.test(f)), src = Object.fromEntries(files.map((f) => [f, fs.readFileSync(path.join(MOI, f), 'utf8')]));
const all = Object.values(src).join('\n');
const onlyIn = (re) => files.filter((f) => re.test(src[f])).join();
rec('15.1 Thương hiệu', 'Không còn #005993 / #00539B / #0085CA trong giao diện mới', !/#005993|#00539b|#0085ca/i.test(all));
rec('15.1 Thương hiệu', 'Mã thương hiệu chỉ định nghĩa MỘT lần, trong moi-tokens.css (#00538E, #D71249, #80D1F2)', onlyIn(/#00538e/i) === 'moi-tokens.css' && onlyIn(/#d71249/i) === 'moi-tokens.css' && onlyIn(/#80d1f2/i) === 'moi-tokens.css');
rec('15.1 Thương hiệu', 'Không dùng #80D1F2 làm màu chữ (chỉ nền/nét)', !/[^-]color:\s*(#80d1f2|var\(--brand-sky\)|var\(--series-sky\))/i.test(all));
rec('15.1 Thương hiệu', 'moi-brand.css chỉ dùng token (không mã màu hex cứng)', !/#[0-9a-f]{3,8}\b/i.test(src['moi-brand.css'].replace(/\/\*[\s\S]*?\*\//g, '')));
const b = await launch(9363);
async function moi(w = 1440, h = 900) {
  const p = await b.newPage(); await p.viewport(w, h);
  await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .page, #view .moi-page')`, 20000);
  await p.eval(`localStorage.setItem('${KEY}', 'moi')`); await p.goto(APPURL, { ready: false }); await p.waitFor(`!!document.querySelector('#view .moi-page')`, 20000);
  await p.sleep(400); return p;
}
try {
  const p = await moi();
  const tok = await p.eval(`(() => { const s = getComputedStyle(document.body), g = (n) => s.getPropertyValue(n).trim().toLowerCase(); return { blue: g('--brand-blue'), red: g('--brand-red'), sky: g('--brand-sky'), missing: ['--background-main','--surface-primary','--surface-hover','--surface-selected','--text-primary','--text-secondary','--text-muted','--text-inverse','--text-disabled','--border-default','--border-subtle','--border-strong','--border-focus','--primary-button','--primary-button-hover','--accent-button','--accent-button-hover','--navigation-active','--navigation-hover','--selected-state','--focus-ring','--success','--warning','--danger','--info','--neutral'].filter((n) => !g(n)) }; })()`);
  rec('15.1 Thương hiệu', 'Token thương hiệu đúng: #00538e, #d71249, #80d1f2', tok.blue === '#00538e' && tok.red === '#d71249' && tok.sky === '#80d1f2', JSON.stringify(tok));
  rec('15.1 Token', 'Đủ các Design Tokens chuẩn hóa (nền, chữ, viền, tương tác, ngữ nghĩa)', tok.missing.length === 0, tok.missing.join(','));
  const ui = await p.eval(`(() => { const h1 = getComputedStyle(document.querySelector('.moi-h1')), on = document.querySelector('.moi-nav-i.is-on'), cs = getComputedStyle(on), bf = getComputedStyle(on, '::before'), pr = document.querySelector('.moi-btn.primary'), ic = getComputedStyle(document.querySelector('.moi-nav-i:not(.is-on) .ic')), top = getComputedStyle(document.querySelector('.moi-top')), af = getComputedStyle(document.querySelector('.moi-h1'), '::after'), kpi = document.querySelector('.vtb-kpi:not(.is-active)'); return { h1: h1.color, navBg: cs.backgroundColor, navInk: cs.color, bar: bf.backgroundColor, btn: (() => { const t = document.createElement('button'); t.className = 'moi-btn primary'; document.querySelector('#view').appendChild(t); const c = getComputedStyle(t).backgroundColor; t.remove(); return c; })(), ic: ic.color, sideBg: getComputedStyle(document.querySelector('.moi-side')).backgroundColor, topBg: top.backgroundColor, topB: top.borderTopColor, topH: Math.round(document.querySelector('.moi-top').getBoundingClientRect().height), acc: af.backgroundColor, kpiTop: kpi && getComputedStyle(kpi).borderTopColor, surf: getComputedStyle(document.querySelector('.moi-card')).backgroundColor }; })()`);
  rec('15.2 Header', 'Header nền trắng, dải xanh #00538E phía trên, tiêu đề xanh, vệt nhấn đỏ #D71249, gọn một hàng (cao ≤ 64px)', ui.topBg === 'rgb(255, 255, 255)' && ui.topB === BLUE && ui.h1 === BLUE && ui.acc === RED && ui.topH <= 64, JSON.stringify(ui));
  rec('15.2 Sidebar', 'Sidebar nền xanh #00538E; mục đang chọn nền trắng chữ xanh, chỉ báo đỏ #D71249 ở cạnh (không nền đỏ); icon mục thường trắng', ui.sideBg === BLUE && ui.navInk === BLUE && ui.bar === RED && ui.ic === 'rgb(255, 255, 255)' && ui.navBg !== RED, JSON.stringify(ui));
  rec('15.2 Nút', 'Nút chính nền xanh #00538E', ui.btn === BLUE, ui.btn);
  rec('15.2 KPI Card', 'Thẻ KPI nền trắng, đường nhấn trên xanh da trời #80D1F2 (không tô cả thẻ)', ui.kpiTop === SKY && ui.surf === 'rgb(255, 255, 255)', ui.kpiTop);
  const c1 = cr(BLUE, 'rgb(255,255,255)'), c2 = cr(BLUE, 'rgb(228,239,247)'), c3 = cr('rgb(255,255,255)', RED);
  rec('15.2 Tương phản', 'Chữ xanh #00538E trên nền trắng và nền xanh nhạt ≥ 4,5:1; chữ trắng trên đỏ #D71249 ≥ 4,5:1', c1 >= 4.5 && c2 >= 4.5 && c3 >= 4.5, [c1, c2, c3].map((x) => x.toFixed(2)).join('/'));
  const sem = await p.eval(`(() => { const s = getComputedStyle(document.body); return ['--tier-dat','--tier-kha','--tier-cct','--tier-chua','--tier-gap','--tier-chua-ink','--danger'].map((n) => s.getPropertyValue(n).trim().toLowerCase()); })()`);
  rec('15.1 Tách màu', 'Màu trạng thái KPI (Chưa đạt, cảnh báo) khác đỏ thương hiệu; thương hiệu không thay màu nghiệp vụ', !sem.includes('#d71249'), sem.join());
  const snap = () => p.eval(`JSON.stringify(STORE.model().ranking(APP.ky.nam, APP.ky.thang).map((c) => [c.ma, c.hang, c.quy_doi, c.so_dat, c.so_kha, c.so_cct, c.so_chua]))`);
  const kpi0 = await snap();
  const routes = await p.eval(`[...document.querySelectorAll('.moi-nav-i')].map((a) => a.getAttribute('href')).filter((h) => h && h.startsWith('#/'))`);
  rec('15.2 Màn hình', 'Thanh điều hướng có ≥ 10 màn hình', routes.length >= 10, routes.length);
  for (const w of [[1920, 1080], [1440, 900], [1366, 768]]) {
    await p.viewport(w[0], w[1]); const bad = [];
    for (const r of routes) {
      await p.eval(`location.hash = '${r}'`); await p.sleep(450);
      const o = await p.eval(`(() => { const t = document.querySelector('.moi-h1'), d = document.documentElement; return { h1: t ? getComputedStyle(t).color : null, shell: !!document.querySelector('.moi-side') && !!document.querySelector('.moi-top'), ovf: d.scrollWidth > innerWidth + 2, brand: getComputedStyle(document.body).getPropertyValue('--brand-blue').trim().toLowerCase() }; })()`);
      if (o.h1 !== BLUE || !o.shell || o.ovf || o.brand !== '#00538e') bad.push(r + ':' + JSON.stringify(o));
    }
    rec('15.4 Responsive', w[0] + '×' + w[1] + ': mọi màn hình mang nhận diện thống nhất (Header xanh, khung đủ, không tràn ngang)', bad.length === 0, bad.join(' | '));
  }
  await p.viewport(1440, 900); await p.eval(`location.hash = '#/ma-tran'`); await p.sleep(700);
  const hm = await p.eval(`(() => { const c = [...document.querySelectorAll('.moi-mx tbody td.vtb-hm')].map((e) => getComputedStyle(e).backgroundColor); return { n: c.length, brand: c.filter((x) => x === '${BLUE}' || x === '${RED}' || x === '${SKY}').length, distinct: new Set(c).size }; })()`);
  rec('15.3 Heatmap', 'Heatmap độc lập thương hiệu: không ô nào dùng #00538E/#D71249/#80D1F2; màu theo mức quy chuẩn', hm.n > 20 && hm.brand === 0 && hm.distinct >= 4, JSON.stringify(hm));
  await p.eval(`UI_SWITCH.dat('cu')`); await p.sleep(900);
  const legacy = await p.eval(`(() => ({ moi: document.body.classList.contains('ui-moi'), brand: getComputedStyle(document.body).getPropertyValue('--brand-blue').trim(), cls: !!document.querySelector('.moi-side,.vtb-kpi,.moi-brand') }))()`);
  rec('15.5 Legacy', 'Giao diện cũ không nhận token/lớp thương hiệu mới (không có --brand-blue, không có moi-*/vtb-*)', !legacy.moi && legacy.brand === '' && !legacy.cls, JSON.stringify(legacy));
  await p.eval(`UI_SWITCH.dat('moi')`); await p.sleep(900);
  rec('15.5 KPI không đổi', 'Điểm, hạng, số chỉ tiêu theo mức của mọi đơn vị giống hệt sau khi duyệt mọi màn hình và đổi giao diện', (await snap()) === kpi0);
  rec('15.5 Console', 'Không lỗi console / runtime', p.logs.length === 0, p.logs.map((l) => l.text).join(' | '));
  await p.close();
} finally { await b.close(); }
fs.writeFileSync(path.join(OUT, 'brand-results.json'), JSON.stringify({ at: new Date().toISOString(), fail, total: R.length, results: R }, null, 1));
console.log(`\n${R.length - fail}/${R.length} đạt` + (fail ? ` — ${fail} LỖI` : ''));
process.exit(fail ? 1 : 0);
