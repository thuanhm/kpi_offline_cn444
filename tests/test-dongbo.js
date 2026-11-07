/* Mô phỏng nhiều máy dùng chung 1 thư mục (có độ trễ như ổ mạng) để kiểm thử store.js. Chạy: node test-dongbo.js <thư mục js> */
const vm = require('vm'), fs = require('fs'), path = require('path'), { webcrypto } = require('crypto');
const JS = process.argv[2];
let fail = 0;
function ok(c, m) { if (!c) { fail++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Ổ chung giả: 1 tệp, lastModified tăng đều, độ trễ ngẫu nhiên; hook để chèn ghi xen giữa */
function makeFS(opt) {
  opt = opt || {};
  const fsx = { text: '', lm: 0, reads: {}, writes: 0, hookRead: null, lat: opt.lat || 0 };
  const lat = () => sleep(Math.random() * fsx.lat);
  fsx.rawWrite = (t) => { fsx.text = t; fsx.lm = Math.max(fsx.lm + 1, Date.now()); fsx.writes++; };
  fsx.handle = (who) => ({
    name: 'Data',
    async getFileHandle(name, o) {
      await lat();
      if (!fsx.text && !(o && o.create)) { const e = new Error('nf'); e.name = 'NotFoundError'; throw e; }
      if (!fsx.text && o && o.create) { fsx.text = ''; fsx.lm = Math.max(fsx.lm + 1, Date.now()); }
      return {
        async getFile() { await lat(); const snap = { t: fsx.text, lm: fsx.lm }; return { lastModified: snap.lm, size: Buffer.byteLength(snap.t), async text() { await lat(); fsx.reads[who] = (fsx.reads[who] || 0) + 1; if (fsx.hookRead) { const h = fsx.hookRead; fsx.hookRead = null; await h(who); } return snap.t; } }; },
        async createWritable() { await lat(); let buf = ''; return { async write(s) { buf += s; }, async close() { await lat(); fsx.rawWrite(buf); } }; }
      };
    },
    async requestPermission() { return 'granted'; }, async queryPermission() { return 'granted'; }
  });
  return fsx;
}

function makeMachine(name, fsx, user) {
  const ls = {}, ss = {}, intervals = [], idb = {};
  const sb = {
    localStorage: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } },
    sessionStorage: { getItem: (k) => (k in ss ? ss[k] : null), setItem: (k, v) => { ss[k] = String(v); }, removeItem: (k) => { delete ss[k]; } },
    document: { hidden: false, getElementById: () => null }, UI: { toast() {} }, console, crypto: webcrypto, TextEncoder, btoa, atob,
    setTimeout, clearTimeout, setInterval: (fn) => { intervals.push(fn); return intervals.length; }, Date, Math, JSON, Promise,
    showDirectoryPicker: async () => fsx.handle(name),
    indexedDB: { open() { const req = {}; setTimeout(() => { req.result = { createObjectStore() {}, transaction() { const tx = {}; const os = { get(k) { const q = {}; setTimeout(() => { q.result = idb[k]; q.onsuccess && q.onsuccess(); }); return q; }, put(v, k) { idb[k] = v; setTimeout(() => tx.oncomplete && tx.oncomplete()); }, delete(k) { delete idb[k]; setTimeout(() => tx.oncomplete && tx.oncomplete()); } }; tx.objectStore = () => os; return tx; } }; req.onupgradeneeded && req.onupgradeneeded(); req.onsuccess && req.onsuccess(); }); return req; } }
  };
  sb.window = sb; vm.createContext(sb);
  ss['KPI_CN444.user_ss'] = user; ss['KPI_CN444.ten_ss'] = user;
  ls['KPI_CN444.may'] = 'M_' + name;
  ['config.js', 'cong-thuc.js', 'engine.js', 'store.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(JS, f), 'utf8'), sb, { filename: f }));
  sb.STORE.load();
  return { name, sb, S: sb.STORE, ls, poll: () => Promise.all(intervals.map((f) => f())) };
}
async function settle(ms) { await sleep(ms); }
const cells = (m) => Object.keys(m.S.state.rec).filter((k) => k.startsWith('a|TEST_'));
const fileRec = (fsx) => { try { return JSON.parse(fsx.text).rec; } catch (e) { return {}; } };

(async () => {
  console.log('1. Ô số ghi người nhập + nạp tự động');
  {
    const fsx = makeFS(), A = makeMachine('A', fsx, 'lan');
    A.S.setMany([{ k: 'a', ct: 'TEST_1', dv: '44405', nam: 2026, thang: 1, v: 5 }], 'x');
    const i = A.S.getCellInfo('a', 'TEST_1', '44405', 2026, 1);
    ok(i && i.ai === 'lan@M_A', 'ô tay ghi "user@máy": ' + (i && i.ai));
    A.S.setMany([{ k: 'a', ct: 'TEST_2', dv: '44405', nam: 2026, thang: 1, v: 5 }], null, { ai: 'auto' });
    ok(A.S.getCellInfo('a', 'TEST_2', '44405', 2026, 1).ai === 'auto', 'nạp tự động ghi nhãn auto');
    ok(A.S.state.rec['a|TEST_1|44405|2026|1'].length === 3, 'ô dạng [số, giờ, người]');
    const B = makeMachine('B', fsx, '');
    B.S.setMany([{ k: 'a', ct: 'TEST_3', dv: '44405', nam: 2026, thang: 1, v: 7 }], 'y');
    ok(B.S.state.rec['a|TEST_3|44405|2026|1'].length === 2, 'chưa đăng nhập → ô giữ dạng gọn [số, giờ]');
  }

  console.log('2. Gộp tệp thiếu users không đè tài khoản');
  {
    const A = makeMachine('A', makeFS(), 'lan');
    A.S.state.users[0].h = 'HASH_MOI'; A.S.state.users[0].sua_luc = 1;
    A.S.merge({ schema: 2, rec: {}, khoi: [], don_vi: [], indicators: [], weights: [] });
    ok(A.S.state.users[0].h === 'HASH_MOI', 'gộp tệp không có users giữ nguyên mật khẩu hiện tại');
  }

  console.log('3. Hai máy ghi đồng thời nhiều vòng (ổ mạng có độ trễ) — không mất ô nào');
  {
    const fsx = makeFS({ lat: 8 }), A = makeMachine('A', fsx, 'lan'), B = makeMachine('B', fsx, 'hoa');
    await A.S.chonThuMuc(); await B.S.chonThuMuc();
    for (let r = 0; r < 8; r++) {
      A.S.setMany([{ k: 'a', ct: 'TEST_A' + r, dv: '44405', nam: 2026, thang: 1, v: r }], 'a' + r);
      B.S.setMany([{ k: 'a', ct: 'TEST_B' + r, dv: '44430', nam: 2026, thang: 1, v: r }], 'b' + r);
      A.S.saveNow(); B.S.saveNow();
      await sleep(Math.random() * 25);
    }
    let rounds = 0; const nTest = (m) => cells(m).length, nFile = () => Object.keys(fileRec(fsx)).filter((k) => k.indexOf('TEST_') > 0).length; for (; rounds < 8; rounds++) { await settle(400); await A.poll(); await B.poll(); await settle(400); if (nFile() === 16 && nTest(A) === 16 && nTest(B) === 16) break; } console.log('   (hội tụ sau ' + (rounds + 1) + ' vòng kiểm tra 20 giây)'); global.__rounds = (global.__rounds || []).concat(rounds + 1);
    const f = fileRec(fsx), want = 16;
    const nf = Object.keys(f).filter((k) => k.indexOf('TEST_') > 0).length;
    ok(nf === want, 'tệp chung có đủ ' + want + ' ô (có ' + nf + ')');
    ok(cells(A).length === want && cells(B).length === want, 'cả hai máy đều thấy đủ ' + want + ' ô (A ' + cells(A).length + ', B ' + cells(B).length + ')');
    ok(A.S.sync.trang_thai === 'ok' && B.S.sync.trang_thai === 'ok', 'trạng thái đồng bộ ok');
  }

  console.log('4. Yêu cầu ghi đến lúc đang ghi không bị bỏ (lần sửa cuối lên tệp)');
  {
    const fsx = makeFS({ lat: 30 }), A = makeMachine('A', fsx, 'lan');
    await A.S.chonThuMuc();
    A.S.setMany([{ k: 'a', ct: 'TEST_X1', dv: '44405', nam: 2026, thang: 1, v: 1 }], 'x1'); A.S.saveNow();
    await sleep(40);   // đang ghi giữa chừng
    A.S.setMany([{ k: 'a', ct: 'TEST_X2', dv: '44405', nam: 2026, thang: 1, v: 2 }], 'x2'); A.S.saveNow();
    await settle(1500);
    const f = fileRec(fsx);
    ok(!!f['a|TEST_X2|44405|2026|1'], 'lần sửa thứ 2 (gửi lúc đang ghi) đã có trong tệp chung');
  }

  console.log('5. Khoá lạc quan: máy khác ghi xen giữa lúc đọc và ghi → đọc/gộp lại');
  {
    const fsx = makeFS({ lat: 3 }), A = makeMachine('A', fsx, 'lan'), B = makeMachine('B', fsx, 'hoa');
    await A.S.chonThuMuc(); await B.S.chonThuMuc(); await settle(300);
    A.S.setMany([{ k: 'a', ct: 'TEST_A1', dv: '44405', nam: 2026, thang: 1, v: 1 }], 'a1');
    // sau khi A đọc tệp xong, B (đã có sẵn số riêng) ghi chèn vào tệp
    B.S.setMany([{ k: 'a', ct: 'TEST_B1', dv: '44430', nam: 2026, thang: 1, v: 2 }], 'b1');
    fsx.hookRead = async () => { await B.S.saveNow(); await sleep(150); };
    const r0 = fsx.reads.A || 0;
    A.S.saveNow(); await settle(1500);
    const f = fileRec(fsx);
    ok(!!f['a|TEST_A1|44405|2026|1'] && !!f['a|TEST_B1|44430|2026|1'], 'tệp chứa cả số của A và số B ghi xen giữa');
    ok((fsx.reads.A || 0) - r0 >= 2, 'A đã đọc lại (đọc ' + ((fsx.reads.A || 0) - r0) + ' lần)');
  }

  console.log('6. Tự ghi lại khi tệp thiếu số của máy này (lần ghi trước bị đè)');
  {
    const fsx = makeFS({ lat: 2 }), A = makeMachine('A', fsx, 'lan'), B = makeMachine('B', fsx, 'hoa');
    await A.S.chonThuMuc(); await B.S.chonThuMuc(); await settle(300);
    A.S.setMany([{ k: 'a', ct: 'TEST_LOST', dv: '44405', nam: 2026, thang: 1, v: 9 }], 'lost');
    await A.S.saveNow(); await settle(300);
    // mô phỏng máy B đè tệp bằng bản của nó (không có ô của A)
    B.S.state.rec = Object.assign({}, B.S.state.rec); delete B.S.state.rec['a|TEST_LOST|44405|2026|1'];
    const doc = JSON.parse(fsx.text); delete doc.rec['a|TEST_LOST|44405|2026|1']; fsx.rawWrite(JSON.stringify(doc));
    ok(!fileRec(fsx)['a|TEST_LOST|44405|2026|1'], 'điều kiện: tệp đang thiếu ô của A');
    await A.poll(); await settle(500);
    ok(!!fileRec(fsx)['a|TEST_LOST|44405|2026|1'], 'A tự ghi lại ô còn thiếu sau lần kiểm tra 20 giây');
  }

  console.log('7. Hiệu năng: số lần stringify mỗi lần lưu');
  {
    const fsx = makeFS(), A = makeMachine('A', fsx, 'lan'); await A.S.chonThuMuc(); await settle(100);
    let n = 0, all = 0; const orig = A.sb.JSON.stringify; A.sb.JSON.stringify = function () { const r = orig.apply(this, arguments); all++; if (r && r.length > 50000) n++; return r; };
    A.S.setMany([{ k: 'a', ct: 'TEST_P', dv: '44405', nam: 2026, thang: 1, v: 3 }], 'p'); await A.S.saveNow(); await settle(300);
    A.sb.JSON.stringify = orig;
    ok(n <= 1, 'một lần lưu (localStorage + tệp chung) stringify ' + n + ' lần toàn bộ state (tổng mọi lần ' + all + ')');
    const big = JSON.stringify(A.S.state).length;
    console.log('   (kích thước state: ' + Math.round(big / 1024) + ' KB)');
  }
  console.log(fail ? '\n' + fail + ' LỖI' : '\nTẤT CẢ ĐẠT');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
