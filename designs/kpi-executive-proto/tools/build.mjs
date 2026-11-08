// Ghép trang dashboard từ các nguồn và sinh bản chạy độc lập.
//   node tools/build.mjs
// Sinh:  dashboard/src/{index.html,calcs.js,fonts.css,vtb.js,bundle.css}  (dùng cho store của skill claude-dashboard)
//        standalone/index.html                                             (mở trực tiếp bằng trình duyệt)
// Chỉ ĐỌC (sao chép) font + logo từ App/assets; KHÔNG sửa App/ và không đọc Data/.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './lib/csv.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(ROOT, '..', '..');
const SRC = path.join(ROOT, 'dashboard', 'src');
const DS = path.join(ROOT, 'design-system', 'project');
const rd = (p) => fs.readFileSync(p, 'utf8');
const wr = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const b64 = (p) => fs.readFileSync(p).toString('base64');

// ---- calcs.js: sinh từ chính các hàm đã test ----
const calcs = createRequire(import.meta.url)(path.join(SRC, 'calcs.cjs'));
const calcsJs = '/* SINH TỰ ĐỘNG từ calcs.cjs bằng tools/build.mjs — đừng sửa tay. */\n' + calcs.map((c) =>
  `dash.calc(${JSON.stringify(c.id)}, { inputs: ${JSON.stringify(c.inputs)}, title: ${JSON.stringify(c.title)}, description: ${JSON.stringify(c.description)}, fn: ${c.fn.toString()} });`).join('\n\n') + '\n';
wr(path.join(SRC, 'calcs.js'), calcsJs);

// ---- thành phần dùng chung: sao chép từ design-system (một nguồn) ----
fs.copyFileSync(path.join(DS, 'components', 'bundle.js'), path.join(SRC, 'vtb.js'));
fs.copyFileSync(path.join(DS, 'components', 'bundle.css'), path.join(SRC, 'bundle.css'));

// ---- fonts.css: Plus Jakarta Sans (OFL) — 3 tập con × 4 độ đậm, unicode-range để tiếng Việt dùng đúng phông ----
const FONTS = path.join(REPO, 'App', 'assets', 'fonts', 'pjs');
const RANGE = {
  vietnamese: 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB',
  'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
};
let fontsCss = '/* Plus Jakarta Sans (SIL OFL 1.1) — sao chép từ App/assets/fonts/pjs, nhúng data: URL để chạy offline. */\n';
for (const w of [400, 500, 600, 700]) for (const sub of ['vietnamese', 'latin-ext', 'latin']) {
  fontsCss += `@font-face { font-family: 'Plus Jakarta Sans'; font-style: normal; font-weight: ${w}; font-display: swap; src: url(data:font/woff2;base64,${b64(path.join(FONTS, `plus-jakarta-sans-${sub}-${w}-normal.woff2`))}) format('woff2'); unicode-range: ${RANGE[sub]}; }\n`;
}
wr(path.join(SRC, 'fonts.css'), fontsCss);

// ---- Design System: font + logo (sao chép nguyên bản) + @font-face có unicode-range trong bundle.css ----
fs.mkdirSync(path.join(DS, 'fonts'), { recursive: true });
for (const f of fs.readdirSync(FONTS).filter((x) => x.endsWith('.woff2'))) fs.copyFileSync(path.join(FONTS, f), path.join(DS, 'fonts', f));
fs.mkdirSync(path.join(DS, 'assets', 'Licenses'), { recursive: true });
fs.copyFileSync(path.join(FONTS, 'OFL.txt'), path.join(DS, 'assets', 'Licenses', 'OFL.txt'));
let dsFaces = '/* @font-face đầy đủ tập con (tiếng Việt) — nạp SAU tokens.css nên ghi đè khai báo chỉ-latin. */\n';
for (const w of [400, 500, 600, 700]) for (const sub of ['vietnamese', 'latin-ext', 'latin']) dsFaces += `@font-face { font-family: 'Plus Jakarta Sans'; font-style: normal; font-weight: ${w}; font-display: swap; src: url('../fonts/plus-jakarta-sans-${sub}-${w}-normal.woff2') format('woff2'); unicode-range: ${RANGE[sub]}; }\n`;
const bundleCssPath = path.join(DS, 'components', 'bundle.css');
let bc = rd(bundleCssPath).replace(/\/\* @font-face đầy đủ[\s\S]*$/m, '').trimEnd();
wr(bundleCssPath, bc + '\n\n' + dsFaces);
wr(path.join(SRC, 'bundle.css'), bc + '\n');   // dashboard dùng font nhúng ở fonts.css nên không mang khai báo ../fonts
fs.mkdirSync(path.join(ROOT, 'design-system', 'src'), { recursive: true });
fs.copyFileSync(path.join(REPO, 'App', 'assets', 'logo-vietinbank.png'), path.join(ROOT, 'design-system', 'src', 'logo-vietinbank.png'));

// ---- index.html ----
const logo = 'data:image/png;base64,' + b64(path.join(REPO, 'App', 'assets', 'logo-vietinbank.png'));
const indexHtml = rd(path.join(SRC, 'index.template.html')).replace('{{LOGO}}', logo);
wr(path.join(SRC, 'index.html'), indexHtml);

// ---- standalone ----
const data = {};
for (const f of fs.readdirSync(path.join(SRC, 'data')).filter((x) => x.endsWith('.csv'))) data[f.replace('.csv', '')] = parseCsv(rd(path.join(SRC, 'data', f)));
const sa = indexHtml
  .replace(/<link rel="stylesheet" href="(tokens|fonts|bundle|styles)\.css">\n?/g, (_, n) => `<style data-file="${n}.css">\n${rd(path.join(SRC, n + '.css'))}\n</style>\n`)
  .replace('<script src="vtb.js"></script>', `<script>\n${rd(path.join(SRC, 'vtb.js'))}\n</script>`)
  .replace('<script src="calcs.js"></script>', `<script>\nwindow.__KPI_DATA__ = ${JSON.stringify(data).replace(/</g, '\\u003c')};\n</script>\n<script>\n${rd(path.join(ROOT, 'tools', 'dash-shim.js'))}\n</script>\n<script>\n${calcsJs}\n</script>`)
  .replace('<script src="app.js"></script>', `<script>\n${rd(path.join(SRC, 'app.js'))}\n</script>`);
wr(path.join(ROOT, 'standalone', 'index.html'), `<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${sa.replace('<title>', '<title>').replace(/<meta name="dash-one-writer">\n/, '')}\n</html>\n`);
console.log('Đã build: dashboard/src/{index.html,calcs.js,fonts.css,vtb.js,bundle.css} + standalone/index.html (' + Math.round(fs.statSync(path.join(ROOT, 'standalone', 'index.html')).size / 1024) + ' KB)');
