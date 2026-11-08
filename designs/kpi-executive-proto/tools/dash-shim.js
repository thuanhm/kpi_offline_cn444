/* Lớp mô phỏng TỐI THIỂU của API `dash` (dash.data / calc / draw / onData / params / setParams / setLink) để chạy
 * cùng một trang dashboard ở chế độ ĐỘC LẬP (mở file bằng trình duyệt, không cần máy chủ). Chỉ dùng cho bản standalone;
 * bản dashboard chuẩn dùng API thật của skill claude-dashboard. Dữ liệu nằm trong window.__KPI_DATA__ (ô là chuỗi như CSV). */
(function (w) {
  'use strict';
  var DATA = w.__KPI_DATA__ || {}, calcs = {}, results = {}, onData = [], draws = {}, scheduled = false;
  var DEFAULTS = { ky: '10', dv: '', ct: 'TOI', khoi: '', man: 'tong-quan', tc: '0' };
  function readHash() { var o = {}; location.hash.replace(/^#/, '').split('&').forEach(function (kv) { if (!kv) return; var i = kv.indexOf('='); if (i > 0) o[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1)); }); return o; }
  var params = Object.assign({}, DEFAULTS, readHash());
  function writeHash() { var a = []; Object.keys(params).forEach(function (k) { if (params[k] !== DEFAULTS[k]) a.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k])); }); try { history.replaceState(null, '', a.length ? '#' + a.join('&') : location.pathname + location.search); } catch (e) {} }
  function get(id) {
    if (Object.prototype.hasOwnProperty.call(DATA, id)) return DATA[id];
    if (Object.prototype.hasOwnProperty.call(results, id)) return results[id];
    var c = calcs[id]; if (!c) return undefined;
    results[id] = null; results[id] = c.fn.apply(null, c.inputs.map(get)); return results[id];
  }
  var dash = {
    colors: ['#005993', '#eb6834', '#1baf7a', '#6250d6'],
    params: function () { return Object.assign({}, params); },
    setParams: function (p) { Object.keys(p).forEach(function (k) { params[k] = p[k] === null || p[k] === undefined ? DEFAULTS[k] || '' : String(p[k]); }); writeHash(); schedule(); },
    resetParams: function () { params = Object.assign({}, DEFAULTS); writeHash(); schedule(); },
    setLink: function () {},
    data: function (id) { var d = get(id); return d === undefined ? { status: 'missing', data: [] } : { status: 'ok', data: d, columns: d && d[0] ? Object.keys(d[0]) : [], meta: [] }; },
    calc: function (id, o) { calcs[id] = o; },
    onData: function (fn) { onData.push(fn); schedule(); },
    draw: function (name, fn) { if (fn) { draws[name] = fn; schedule(); } else runDraw(name); },
    refresh: function () {},
  };
  function runDraw(name) { var els = document.querySelectorAll('[data-draw="' + name + '"]'); for (var i = 0; i < els.length; i++) { if (els[i].closest('[hidden]')) continue; try { draws[name](els[i]); } catch (e) { console.error('draw ' + name, e); } } }
  function run() { scheduled = false; onData.forEach(function (f) { try { f(); } catch (e) { console.error('onData', e); } }); Object.keys(draws).forEach(runDraw); document.documentElement.setAttribute('data-ready', '1'); }
  function schedule() { if (scheduled) return; scheduled = true; (w.requestAnimationFrame || setTimeout)(run); }
  var tm; w.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(schedule, 80); });
  w.addEventListener('hashchange', function () { params = Object.assign({}, DEFAULTS, readHash()); schedule(); });
  w.dash = dash;
})(window);
