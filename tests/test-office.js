/* Xuất PowerPoint / Word / Excel có màu (xuat-office.js, excel.js). node test-office.js <thư mục App> [thư mục ghi tệp] */
const vm = require('vm'), fs = require('fs'), path = require('path');
const APP = process.argv[2], OUT = process.argv[3] || require('os').tmpdir(); const JS = path.join(APP, 'js'); let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
function ctx(files, extra) { const sb = Object.assign({ console, Blob, TextEncoder, TextDecoder, setTimeout, clearTimeout, setInterval, clearInterval, Uint8Array, ArrayBuffer }, extra || {}); sb.window = sb; sb.self = sb; vm.createContext(sb); files.forEach((f) => vm.runInContext(fs.readFileSync(f, 'utf8'), sb, { filename: f })); return sb; }
(async () => {
  const ls = {}, ss = {};
  const A = ctx(['config.js', 'cong-thuc.js', 'engine.js', 'ui.js', 'store.js', 'phan-tich.js', 'bgd.js', 'excel.js', 'xuat-office.js'].map((f) => path.join(JS, f)), {
    localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } },
    sessionStorage: { getItem: (k) => (k in ss ? ss[k] : null), setItem: (k, v) => { ss[k] = String(v); }, removeItem: (k) => { delete ss[k]; } },
    document: { hidden: false, getElementById: () => null, addEventListener() {} }, crypto: require('crypto').webcrypto, btoa, atob });
  A.STORE.load(); const st = A.STORE.state, nam = st.settings.nam, M = A.STORE.model(); const th = (M.kyMoiNhat() || {}).thang || 10;
  const libs = { pptx: ctx([path.join(APP, 'lib/pptxgen.bundle.js')]).PptxGenJS, docx: ctx([path.join(APP, 'lib/docx.umd.js')]).docx, 'xlsx-style': ctx([path.join(APP, 'lib/xlsx-js-style.bundle.js')]).XLSX };
  ok(libs.pptx && libs.docx && libs['xlsx-style'], 'nạp được pptxgenjs, docx, xlsx-js-style');
  A.UI.lib = (n) => Promise.resolve(libs[n]); const saved = {}; A.UI.download = (name, blob) => { saved[name] = blob; };
  A.KPI_NHAN_DINH = () => 'Nhận định thử nghiệm.';
  libs.pptx.prototype.writeFile = function (o) { return this.write({ outputType: 'uint8array' }).then((b) => { saved[o.fileName] = Buffer.from(b); }); };
  console.log('1. PowerPoint'); await A.KPI_OFFICE.xuatPptx(nam, th);
  const pf = Object.keys(saved).find((k) => /\.pptx$/.test(k)); ok(pf && saved[pf].length > 10000, 'tạo tệp ' + pf + ' (' + (saved[pf] || []).length + ' byte)');
  fs.writeFileSync(path.join(OUT, 'test.pptx'), saved[pf]);
  const nSlide = (b) => { const names = []; const t = b.toString('latin1'); const re = /PK[\s\S]{26}(ppt\/slides\/slide\d+\.xml)(?!\.)/g; let m; while ((m = re.exec(t))) names.push(m[1]); return new Set(names).size; };   // đếm tên tệp slide trong zip
  ok(nSlide(saved[pf]) === 6, 'bản thường: đúng 6 slide (' + nSlide(saved[pf]) + ')');
  await A.KPI_OFFICE.xuatPptx(nam, th, { theDiem: true }); const pf2 = Object.keys(saved).find((k) => /kem_the_diem.*\.pptx$/.test(k));
  ok(pf2 && nSlide(saved[pf2]) === 6 + M.units.length, 'bản kèm thẻ điểm: 6 + ' + M.units.length + ' slide (' + (pf2 && nSlide(saved[pf2])) + ')');
  fs.writeFileSync(path.join(OUT, 'test2.pptx'), saved[pf2]);
  libs.jszip_for_docx = (b) => ctx([path.join(APP, 'lib/pptxgen.bundle.js')]).JSZip.loadAsync(b);
  console.log('2. Word'); await A.KPI_OFFICE.xuatDocx(nam, th);
  const wf = Object.keys(saved).find((k) => /\.docx$/.test(k)); const wb = Buffer.from(await saved[wf].arrayBuffer()); ok(wb.length > 3000 && wb.slice(0, 2).toString() === 'PK', 'tạo tệp ' + wf + ' (' + wb.length + ' byte)');
  fs.writeFileSync(path.join(OUT, 'test.docx'), wb);
  { const dz = await libs.jszip_for_docx(wb), dx = await dz.file('word/document.xml').async('string'), tx = (dx.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map((t) => t.replace(/<[^>]+>/g, ''));
    const i0 = tx.indexOf('NGÂN HÀNG TMCP CÔNG'); ok(i0 === 0 && tx[1] === 'THƯƠNG VIỆT NAM' && /^CHI NHÁNH /.test(tx[2]), 'tiêu ngữ trái: tên ngân hàng 2 dòng + chi nhánh in đậm');
    ok(tx.indexOf('CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT') > 0 && tx.indexOf('NAM') > 0 && tx.indexOf('Độc lập - Tự do - Hạnh phúc') > 0, 'tiêu ngữ phải: quốc hiệu + tiêu ngữ');
    ok(/Nghệ An, ngày \d+ tháng \d+ năm \d{4}/.test(tx.join('|')) && tx.indexOf('BÁO CÁO') > 0, 'có dòng ngày tháng và tiêu đề BÁO CÁO');
    ok((dx.match(/<w:tcBorders><w:top w:val="none"[^>]*\/><w:left w:val="none"[^>]*\/><w:bottom w:val="single"/g) || []).length >= 2, 'hai gạch ngắn dưới tiêu ngữ'); }
  console.log('3. Excel báo cáo đầy đủ (bố cục, màu, cố định dòng/cột)');
  libs.jszip = libs.pptx && ctx([path.join(APP, 'lib/pptxgen.bundle.js')]).JSZip; const X = libs['xlsx-style'];
  await A.EXCEL.xuatBaoCao(nam, th); const xf = Object.keys(saved).find((k) => /\.xlsx$/.test(k)); ok(xf, 'tạo tệp ' + xf);
  const xb = Buffer.from(await saved[xf].arrayBuffer()); fs.writeFileSync(path.join(OUT, 'test.xlsx'), xb);
  const wbk = X.read(xb, { type: 'buffer', cellStyles: true }); const names = wbk.SheetNames;
  ok(names[0] === 'Tổng hợp' && names.indexOf('Ma trận %HT') > 0 && names.indexOf('% KH năm') > 0 && names.length >= 5 + M.units.length, 'các sheet: ' + names.slice(0, 5).join(' | ') + ' … (' + names.length + ')');
  const z = await libs.jszip.loadAsync(xb), x1 = await z.file('xl/worksheets/sheet1.xml').async('string');
  ok(/showGridLines="0"/.test(x1) && /state="frozen"/.test(x1), 'ẩn đường lưới + cố định dòng/cột');
  ok(/orientation="landscape"/.test(x1) && /fitToPage="1"/.test(x1) && /<tabColor/.test(x1), 'in ngang vừa khổ giấy + màu thẻ sheet');
  ok(x1.indexOf('<sheetPr') < x1.indexOf('<sheetViews') && x1.indexOf('<sheetViews') < x1.indexOf('<sheetData') && x1.indexOf('<pageMargins') < x1.indexOf('<pageSetup'), 'thứ tự phần tử XML đúng');
  ok(wbk.Sheets['Tổng hợp']['!merges'] && wbk.Sheets['Tổng hợp']['!merges'].length >= 2, 'tiêu đề được gộp ô');
  const sty = await z.file('xl/styles.xml').async('string'); ok(/FFFFE699/.test(sty) && /FFD9F2E3/.test(sty) && /FF005993/.test(sty), 'có màu hạng 1 (vàng), ngưỡng đạt (xanh), tiêu đề (xanh VietinBank)');
  // quy tắc tô màu (dinhDang) trên bảng nhỏ
  const ng = { dat: 1, kha: 0.8, cct: 0.7 }, mk = (name, aoa) => { const w = X.utils.book_new(); X.utils.book_append_sheet(w, X.utils.aoa_to_sheet(aoa), name); return w; };
  let w3 = mk('MA', [['T'], [], ['Mã', 'Chỉ', 'ĐVT', 'P1', 'P2'], ['x', 'y', '%', 0.5, 1.05]]); A.EXCEL.dinhDang(X, w3, ng, { MA: { h: 2, tu: 3 } });
  ok(w3.Sheets.MA.D4.s.fill.fgColor.rgb === 'F8D0D6' && w3.Sheets.MA.E4.s.fill.fgColor.rgb === 'D9F2E3', 'ma trận: 50% hồng, 105% xanh');
  w3 = mk('KN', [['T'], [], ['Mã', 'Chỉ', 'ĐVT', 'P1'], ['x', 'y', '%', 0.5]]); A.EXCEL.dinhDang(X, w3, ng, { KN: { h: 2 } });
  const fk = w3.Sheets.KN.D4.s.fill; ok(!fk || fk.fgColor.rgb === 'F7F9FC', '%KH năm: chỉ nền sọc, không tô theo ngưỡng');
  w3 = mk('PH', [['T'], ['k'], [], ['STT', 'M', 'C', 'd', 'ts', 'kh', 'th', 'gap', 'ht', 'diem', 'mat', 'tt', 'khn', 'htn'], [1, 'M', 'C', 'd', 1, 1, 1, -5, 0.5, 1, 0, 'Chưa đạt', 1, 0.4]]);
  A.EXCEL.dinhDang(X, w3, ng, { PH: { h: 3, heat: [8], tt: 11, chenh: 7 } }); const ph = w3.Sheets.PH;
  ok(ph.I5.s.fill.fgColor.rgb === 'F8D0D6' && ph.L5.s.fill.fgColor.rgb === 'F8D0D6', 'thẻ điểm: %HT và trạng thái tô màu'); ok(!ph.N5.s.fill || ph.N5.s.fill.fgColor.rgb === 'F7F9FC', 'thẻ điểm: %KH năm không tô theo ngưỡng'); ok(ph.H5.s.font.color.rgb === 'B1292A', 'chênh lệch âm: chữ đỏ');
  console.log('4. Excel thẻ điểm từng phòng');
  await A.EXCEL.xuatTheDiemPhong(nam, th); const pf4 = Object.keys(saved).find((k) => /The_diem_cac_phong.*\.xlsx$/.test(k)); ok(pf4, 'tạo tệp ' + pf4);
  const b4 = Buffer.from(await saved[pf4].arrayBuffer()), w4 = X.read(b4, { type: 'buffer' }); fs.writeFileSync(path.join(OUT, 'test-phong.xlsx'), b4);
  ok(w4.SheetNames.length === M.units.length, 'mỗi phòng/PGD một sheet (' + w4.SheetNames.length + ')');
  const z4 = await libs.jszip.loadAsync(b4), x4 = await z4.file('xl/worksheets/sheet1.xml').async('string'); ok(/showGridLines="0"/.test(x4) && /state="frozen"/.test(x4) && /landscape/.test(x4), 'cùng định dạng báo cáo (ẩn lưới, cố định dòng/cột, in ngang)');
  const s4 = JSON.stringify(X.utils.sheet_to_json(w4.Sheets[w4.SheetNames[0]], { header: 1 })); ok(/Giải trình/.test(s4) && /TỔNG CỘNG/.test(s4), 'có dòng tổng cộng và khung giải trình');
  console.log(fail ? 'THẤT BẠI ' + fail : 'TẤT CẢ ĐẠT'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('LỖI', e); process.exit(1); });
