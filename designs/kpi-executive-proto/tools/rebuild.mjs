// Dựng lại toàn bộ prototype theo đúng thứ tự:  node tools/rebuild.mjs [--no-publish]
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const T = path.dirname(fileURLToPath(import.meta.url));
const run = (f, label) => { process.stdout.write(`▶ ${label} … `); try { execFileSync(process.execPath, [path.join(T, f)], { stdio: 'pipe', encoding: 'utf8' }); console.log('OK'); } catch (e) { console.log('LỖI\n' + (e.stdout || '') + (e.stderr || '')); process.exit(1); } };
run('build-tokens.mjs', 'token màu/chữ + kiểm tra tương phản');
run('gen-data.mjs', 'dữ liệu giả lập (seed 20261108)');
run('test-d7.mjs', 'test D7 + phân loại mức');
run('build.mjs', 'ghép trang + bản độc lập');
run('gen-ds.mjs', 'Design System (README, preview, cover, logo)');
run('build.mjs', 'ghép lại (đồng bộ bundle)');
if (!process.argv.includes('--no-publish')) run('publish-dashboard.mjs', 'ghi dashboard vào store claude-dashboard');
console.log('Xong. Mở standalone/index.html hoặc chạy skill `open` cho dashboard/.');
