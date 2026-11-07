/* XUẤT WORD (.docx) OFFLINE — Dựng WordprocessingML tối thiểu + nén zip bằng SheetJS (XLSX.CFB) — không thư viện mới, không mạng.
 * Đầu vào: mô hình tài liệu của KPI_GIAO_BAN.taiLieu(bc) (cùng nguồn với Xem trước / PDF → nội dung khớp nhau).
 * Khổ A4 dọc, lề 2 / 1,5 / 2 / 3 cm, Times New Roman 13, bảng lặp dòng tiêu đề, ảnh biểu đồ PNG nhúng (word/media). Hàm THUẦN (test bằng node). */
(function (root) {
  var isNode = typeof module !== 'undefined' && module.exports;
  var W_TRANG = 11906, H_TRANG = 16838, LE = { tren: 1134, phai: 850, duoi: 1134, trai: 1701 }, RONG = W_TRANG - LE.trai - LE.phai;   // twip
  var EMU_TWIP = 635;

  function x(s) { return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function run(text, o) {
    o = o || {};
    var rp = (o.b ? '<w:b/>' : '') + (o.i ? '<w:i/>' : '') + (o.mau ? '<w:color w:val="' + o.mau + '"/>' : '') + (o.co ? '<w:sz w:val="' + o.co + '"/><w:szCs w:val="' + o.co + '"/>' : '');
    return '<w:r>' + (rp ? '<w:rPr>' + rp + '</w:rPr>' : '') + '<w:t xml:space="preserve">' + x(text) + '</w:t></w:r>';
  }
  function para(runs, o) {
    o = o || {};
    var pp = (o.kieu ? '<w:pStyle w:val="' + o.kieu + '"/>' : '') + (o.giu ? '<w:keepNext/>' : '') + '<w:spacing w:before="' + (o.truoc || 0) + '" w:after="' + (o.sau === undefined ? 60 : o.sau) + '"/>'
      + (o.thut ? '<w:ind w:left="' + o.thut + '"' + (o.treo ? ' w:hanging="' + o.treo + '"' : '') + '/>' : '') + '<w:jc w:val="' + (o.can === 'c' ? 'center' : o.can === 'r' ? 'right' : o.can === 'l' ? 'left' : 'both') + '"/>';
    return '<w:p><w:pPr>' + pp + '</w:pPr>' + runs + '</w:p>';
  }
  function bang(k) {
    var tong = k.cot.reduce(function (a, c) { return a + c.w; }, 0), rong = k.cot.map(function (c) { return Math.round(RONG * c.w / tong); });
    var o = '<w:tbl><w:tblPr><w:tblW w:w="' + RONG + '" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(function (b) { return '<w:' + b + ' w:val="single" w:sz="4" w:space="0" w:color="000000"/>'; }).join('')
      + '</w:tblBorders><w:tblCellMar><w:left w:w="70" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' + rong.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>';
    var o2 = function (text, i, d) { var c = k.cot[i] || { can: 'l' }; return '<w:tc><w:tcPr><w:tcW w:w="' + rong[i] + '" w:type="dxa"/>' + (d && d.nen ? '<w:shd w:val="clear" w:color="auto" w:fill="' + d.nen + '"/>' : '') + '</w:tcPr>' + para(run(text, { b: d && d.dam, co: 19 }), { can: d && d.can ? d.can : c.can, sau: 0 }) + '</w:tc>'; };
    o += '<w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>' + k.cot.map(function (c, i) { return o2(c.t, i, { dam: true, nen: 'E8E8E8', can: 'c' }); }).join('') + '</w:tr>';
    k.dong.forEach(function (d) {
      if (d.nhom) { o += '<w:tr><w:trPr><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:w="' + RONG + '" w:type="dxa"/><w:gridSpan w:val="' + k.cot.length + '"/><w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/></w:tcPr>' + para(run(d.o[0], { b: true, co: 19 }), { can: 'l', sau: 0 }) + '</w:tc></w:tr>'; return; }
      o += '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + d.o.map(function (t, i) { return o2(t, i, { dam: d.tong }); }).join('') + '</w:tr>';
    });
    return o + '</w:tbl>' + para('', { sau: 60 });
  }
  function anh(rid, n, k) {
    var maxEmu = RONG * EMU_TWIP, w = (k.w || 900) * 9525, h = (k.h || 420) * 9525;
    if (w > maxEmu) { h = Math.round(h * maxEmu / w); w = maxEmu; }
    var dr = '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + w + '" cy="' + h + '"/><wp:docPr id="' + n + '" name="Bieu do ' + n + '"/>'
      + '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
      + '<pic:nvPicPr><pic:cNvPr id="' + n + '" name="image' + n + '.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="' + rid + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
      + '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + w + '" cy="' + h + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>';
    return para('<w:r>' + dr + '</w:r>', { can: 'c', sau: 0, giu: true }) + (k.chu ? para(run(k.chu, { i: true, co: 22 }), { can: 'c', sau: 120 }) : '');
  }
  function b64(s) {
    if (isNode) return Uint8Array.from(Buffer.from(s, 'base64'));
    var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u;
  }
  function utf8(s) { return isNode ? Uint8Array.from(Buffer.from(s, 'utf8')) : new TextEncoder().encode(s); }

  /* blocks → { files: { đường dẫn: chuỗi | Uint8Array } } (tách riêng để test) */
  function dung(blocks, tieuDe) {
    var body = [], media = [], n = 0;
    blocks.forEach(function (k) {
      if (k.t === 'dau') { body.push(para(run(String(k.don_vi || '').toUpperCase(), { b: true, co: 24 }), { can: 'l', sau: 0 })); if (k.nhap) body.push(para(run('BẢN NHÁP', { b: true, mau: 'B00000' }), { can: 'r', sau: 0 })); }
      else if (k.t === 'tieu_de') body.push(para(run(k.text, { b: true, co: 30 }), { can: 'c', truoc: 200, sau: 80 }));
      else if (k.t === 'h1') body.push(para(run(k.text, { b: true }), { can: 'l', truoc: 200, sau: 80, giu: true }));
      else if (k.t === 'h2') body.push(para(run(k.text, { b: true, i: true }), { can: 'l', truoc: 120, sau: 60, giu: true }));
      else if (k.t === 'p') body.push(para(run(k.text, { b: k.b, i: k.i, co: k.nho ? 22 : null }), { can: k.can === 'c' ? 'c' : null, truoc: k.b ? 100 : 0 }));
      else if (k.t === 'ds') k.items.forEach(function (it) { body.push(para(run('– ' + it, { i: k.i }), { thut: 425, treo: 200, sau: 20 })); });
      else if (k.t === 'bang') body.push(bang(k));
      else if (k.t === 'anh' && k.src && /^data:image\/png;base64,/.test(k.src)) { n++; var rid = 'rIdImg' + n; media.push({ rid: rid, ten: 'image' + n + '.png', data: b64(k.src.split(',')[1]) }); body.push(anh(rid, n, k)); }
      else if (k.t === 'ky') { body.push(para(run(k.text, { b: true }), { can: 'c', thut: 5100, truoc: 360, sau: 0 })); body.push(para(run('(Ký, ghi rõ họ tên)', { i: true }), { can: 'c', thut: 5100, sau: 1100 })); body.push(para(run(k.ten, { b: true }), { can: 'c', thut: 5100 })); }
    });
    var sect = '<w:sectPr><w:pgSz w:w="' + W_TRANG + '" w:h="' + H_TRANG + '"/><w:pgMar w:top="' + LE.tren + '" w:right="' + LE.phai + '" w:bottom="' + LE.duoi + '" w:left="' + LE.trai + '" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>';
    var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>' + body.join('') + sect + '</w:body></w:document>';
    var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="26"/><w:szCs w:val="26"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>';
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>'
      + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>';
    var drels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
      + media.map(function (m) { return '<Relationship Id="' + m.rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/' + m.ten + '"/>'; }).join('') + '</Relationships>';
    var core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + x(tieuDe || 'Báo cáo giao ban') + '</dc:title><dc:creator>KPI các phòng</dc:creator></cp:coreProperties>';
    var files = { '[Content_Types].xml': ct, '_rels/.rels': rels, 'docProps/core.xml': core, 'word/document.xml': doc, 'word/styles.xml': styles, 'word/_rels/document.xml.rels': drels };
    media.forEach(function (m) { files['word/media/' + m.ten] = m.data; });
    return { files: files, so_anh: media.length };
  }
  /* → Uint8Array (.docx). XLSX: SheetJS (trình duyệt: window.XLSX). */
  function taoDocx(blocks, tieuDe, XLSX) {
    XLSX = XLSX || root.XLSX; var C = XLSX.CFB, z = C.utils.cfb_new(), f = dung(blocks, tieuDe).files;
    Object.keys(f).forEach(function (p) { C.utils.cfb_add(z, p, typeof f[p] === 'string' ? utf8(f[p]) : f[p]); });
    var out = C.write(z, { fileType: 'zip', type: 'array', compression: true });
    return out instanceof Uint8Array ? out : new Uint8Array(out);
  }
  var api = { dung: dung, taoDocx: taoDocx };
  if (isNode) module.exports = api; else root.KPI_XUAT_DOCX = api;
})(typeof self !== 'undefined' ? self : this);
