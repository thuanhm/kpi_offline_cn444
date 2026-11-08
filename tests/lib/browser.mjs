// Điều khiển Edge/Chrome headless qua Chrome DevTools Protocol, KHÔNG cần cài thêm thư viện (dùng WebSocket có sẵn của Node 22+).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];
export function findBrowser() { const p = process.env.BROWSER_PATH || CANDIDATES.find((x) => fs.existsSync(x)); if (!p) throw new Error('Không tìm thấy Edge/Chrome. Đặt BROWSER_PATH.'); return p; }

export async function launch(port = 9333) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kpi-proto-'));
  const proc = spawn(findBrowser(), [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--headless=new', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--force-color-profile=srgb', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
  let ver = null;
  for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await new Promise((r) => setTimeout(r, 250)); } }
  if (!ver) { proc.kill(); throw new Error('Trình duyệt không khởi động được'); }
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const pending = new Map(), listeners = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const { ok, no } = pending.get(d.id); pending.delete(d.id); d.error ? no(new Error(d.error.message)) : ok(d.result); } else if (d.method) listeners.forEach((f) => f(d)); };
  const send = (method, params = {}, sessionId) => new Promise((ok, no) => { const i = ++id; pending.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) })); });

  async function newPage() {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const S = (m, p) => send(m, p, sessionId), logs = [];
    listeners.push((d) => {
      if (d.sessionId !== sessionId) return;
      if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) logs.push({ type: d.params.type, text: d.params.args.map((a) => a.value ?? a.description ?? '').join(' ') });
      if (d.method === 'Runtime.exceptionThrown') logs.push({ type: 'exception', text: d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text });
      if (d.method === 'Log.entryAdded' && ['error', 'warning'].includes(d.params.entry.level)) logs.push({ type: 'log-' + d.params.entry.level, text: d.params.entry.text + ' ' + (d.params.entry.url || '') });
    });
    await S('Page.enable'); await S('Runtime.enable'); await S('Log.enable');
    const page = {
      logs, S,
      async viewport(w, h, mobile = false) { await S('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile }); },
      async goto(url, { ready = true } = {}) { await S('Page.navigate', { url }); await page.waitFor('document.readyState === "complete"'); if (ready) await page.waitFor('document.documentElement.getAttribute("data-ready") === "1"', 15000); await page.sleep(400); },
      async eval(expr) { const r = await S('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; },
      async waitFor(expr, timeout = 10000) { const t0 = Date.now(); while (Date.now() - t0 < timeout) { try { if (await page.eval(expr)) return true; } catch { /* trang đang nạp */ } await page.sleep(100); } throw new Error('Hết thời gian chờ: ' + expr); },
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
      async shot(file, { full = false } = {}) {
        let params = { format: 'png', fromSurface: true };
        if (full) { const m = await S('Page.getLayoutMetrics'); const w = Math.ceil(m.cssContentSize.width), h = Math.ceil(m.cssContentSize.height); params = { ...params, captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } }; }
        const { data } = await S('Page.captureScreenshot', params); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(data, 'base64')); return file;
      },
      async pdf(file) { const { data } = await S('Page.printToPDF', { landscape: true, printBackground: true, preferCSSPageSize: true }); fs.writeFileSync(file, Buffer.from(data, 'base64')); return file; },
      async click(sel) { const r = await page.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({block:'center'}); const b = e.getBoundingClientRect(); return {x:b.left+b.width/2, y:b.top+b.height/2}; })()`); if (!r) throw new Error('Không thấy phần tử ' + sel); await S('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 }); await S('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 }); await page.sleep(350); },
      async key(key, code = key) { await S('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: key === 'Tab' ? 9 : key === 'Enter' ? 13 : key === 'Escape' ? 27 : key === 'ArrowRight' ? 39 : key === 'ArrowLeft' ? 37 : 0 }); await S('Input.dispatchKeyEvent', { type: 'keyUp', key, code }); await page.sleep(250); },
      async close() { await send('Target.closeTarget', { targetId }); },
    };
    return page;
  }
  return { newPage, async close() { try { await send('Browser.close'); } catch { /* đã đóng */ } proc.kill(); try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* bỏ qua */ } } };
}
