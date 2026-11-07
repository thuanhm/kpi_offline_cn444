const vm = require('vm'), fs = require('fs'), path = require('path'); const JS = process.argv[2]; let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
const sb = { console, document: { createTextNode: (t) => ({ nodeType: 3, nodeValue: t }) }, localStorage: { getItem: () => null, setItem() {} } }; sb.window = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(JS, 'icons.js'), 'utf8'), sb); const I = sb.KPI_ICONS;
ok(!!I && typeof I.decorate === 'function' && typeof I.chiTieu === 'function' && typeof I.html === 'function', 'KPI_ICONS tạo được, có đủ html/decorate/chiTieu/has');
const app = fs.readFileSync(path.join(JS, 'app.js'), 'utf8'), ui = fs.readFileSync(path.join(JS, 'ui.js'), 'utf8');
const nav = [...app.matchAll(/icon: '([a-z0-9-]+)'/g)].map((m) => m[1]), nut = Object.values(I.ICON_NUT), chip = [...ui.matchAll(/(?:dat|kha|cct|chua|thieu|kad): '([a-z-]+)'/g)].map((m) => m[1]), toast = ['circle-alert', 'circle-check', 'lightbulb'], nhom = I.NHOM.map((x) => x[1]).concat('target'), menu = ['menu'];
const dung = [...new Set([].concat(nav, nut, chip, toast, nhom, menu))];
const thieu = dung.filter((n) => !I.has(n)); ok(thieu.length === 0, dung.length + ' tên icon đang dùng đều có trong bộ Tabler' + (thieu.length ? ' — THIẾU: ' + thieu.join(',') : ''));
ok(nav.length === 22, 'menu có 22 mục icon (' + nav.length + ')');
ok(dung.every((n) => /^<svg class="ic[^"]*" viewBox="0 0 24 24"/.test(I.html(n)) && /<(path|circle|rect|line|polyline)/.test(I.html(n))), 'mọi icon dựng ra <svg> có nét vẽ');
ok(I.html('khong-co-ten') === '' && !I.has('khong-co-ten'), 'tên lạ trả rỗng + has=false (nơi gọi dùng icon cũ, không vỡ giao diện)');
ok(!/<script|onerror|javascript:/i.test(JSON.stringify(dung.map((n) => I.html(n)))), 'không có mã chủ động trong SVG');
// decorate với DOM giả
const mk = (txt) => { const b = { kids: [{ nodeType: 3, nodeValue: txt }], svg: false, get firstChild() { return this.kids[0]; }, querySelector() { return this.svg ? {} : null; }, insertAdjacentHTML(p, h) { this.svg = /<svg class="ic ic-btn"/.test(h); this.html = h; } }; return b; };
const b1 = mk('⤓ Tải bản sao lưu (.json)'), b2 = mk('✓ Hoàn thiện'), b3 = mk('Chọn thư mục');
const el = { querySelectorAll: (s) => (s === '#d-tai' ? [b1] : s === '#bc-hoan' ? [b2] : s === '#d-chon' ? [b3] : []) };
I.decorate(el); ok(b1.svg && b2.svg && b3.svg, 'decorate gắn icon cho nút khớp id');
ok(b1.kids[0].nodeValue === 'Tải bản sao lưu (.json)' && b2.kids[0].nodeValue === 'Hoàn thiện' && b3.kids[0].nodeValue === 'Chọn thư mục', 'bỏ ký tự đầu cũ (⤓ ✓), giữ nguyên nhãn không có ký tự');
const h1 = b1.html; I.decorate(el); ok(b1.html === h1, 'decorate lần hai không gắn trùng (idempotent)');
ok(I.chiTieu({ nhom: 'Tín dụng', ten: 'Dư nợ' }) === 'hand-coins' && I.chiTieu({ nhom: 'Huy động vốn' }) === 'piggy-bank' && I.chiTieu({ nhom: 'Thẻ', ten: 'Thẻ TDQT' }) === 'credit-card' && I.chiTieu({ nhom: 'Khác', ten: 'xyz' }) === 'target', 'icon theo nhóm chỉ tiêu');
// UI.chip có icon
const sb2 = { console, document: {}, localStorage: { getItem: () => null, setItem() {} }, setTimeout, clearTimeout, Date, Math, JSON }; sb2.window = sb2; vm.createContext(sb2);
['config.js', 'icons.js', 'ui.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8'), sb2, { filename: f }));
const T = sb2.KPI_CFG.TRANG_THAI, c1 = sb2.UI.chip(T.DAT), c2 = sb2.UI.chip(T.CHUA_DAT), c3 = sb2.UI.chip('<b>x</b>');
ok(/class="chip dat"><svg class="ic ic-chip"/.test(c1) && /Đạt<\/span>$/.test(c1) && /class="chip chua"><svg/.test(c2), 'UI.chip có icon theo trạng thái (Đạt / Chưa đạt)');
ok(/&lt;b&gt;x&lt;\/b&gt;/.test(c3) && !/<b>x/.test(c3), 'UI.chip vẫn thoát ký tự đặc biệt');
console.log(fail ? '\n' + fail + ' LỖI' : '\nTẤT CẢ ĐẠT'); process.exit(fail ? 1 : 0);
