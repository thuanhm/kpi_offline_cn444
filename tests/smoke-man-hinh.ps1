# Duyệt toàn bộ màn hình của ứng dụng bằng Edge không giao diện; thất bại nếu có màn hình báo "Lỗi hiển thị" hoặc lỗi JS.
# Chạy: powershell -File tests\smoke-man-hinh.ps1     (cần Microsoft Edge; dùng dữ liệu mẫu có sẵn)
$ErrorActionPreference = 'Continue'; [Console]::OutputEncoding = [Text.Encoding]::UTF8
$app = Join-Path (Split-Path -Parent $PSScriptRoot) 'App'
$edge = @('C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', 'C:\Program Files\Microsoft\Edge\Application\msedge.exe') | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { Write-Host 'Không tìm thấy Microsoft Edge.'; exit 2 }
$s = [IO.File]::ReadAllText("$app\index.html", [Text.Encoding]::UTF8)
$inj = @'
<script>
window.requestAnimationFrame=function(f){return setTimeout(f,0)};
function L(t){console.log('SMOKE '+t)}
window.onerror=function(m,s,l){L('FAIL JS '+m+' @'+String(s).split('/').pop()+':'+l)};
window.addEventListener('unhandledrejection',function(e){L('FAIL REJ '+(e.reason&&e.reason.message||e.reason))});
sessionStorage.setItem('KPI_CN444.user_ss','admin');sessionStorage.setItem('KPI_CN444.ten_ss','Admin');sessionStorage.setItem('KPI_CN444.admin','1');
var routes=['tong-quan','dieu-hanh','xep-hang','ma-tran','phong/CN','phong/P.KHCN','the-diem-bgd','chi-tieu','so-ngay','du-bao','canh-bao','hanh-dong','bao-cao-giao-ban','nhap-so','kiem-tra','tinh-tu-file','nap-tu-dong','dieu-chinh','diem-kpi','danh-muc','bgd-quan-tri','du-lieu','huong-dan'];
var i=0;
function next(){
  if(i>0){var v=document.getElementById('view'),bad=v.innerHTML.indexOf('Lỗi hiển thị')>=0;L((bad?'FAIL ':'OK ')+routes[i-1]+(bad?' :: '+((v.querySelector('pre')||{}).textContent||'').split('\n').slice(0,2).join(' | '):''))}
  if(i>=routes.length){L('DONE '+routes.length);return}
  location.hash='#/'+routes[i++];APP.render();setTimeout(next,400);
}
setTimeout(function(){document.querySelectorAll('.modal-wrap').forEach(function(e){e.remove()});next()},2500);
</script></body>
'@
$tmp = "$app\_smoke.html"
[IO.File]::WriteAllText($tmp, $s.Replace('</body>', $inj), (New-Object Text.UTF8Encoding($false)))
try {
  $out = & $edge --headless=new --disable-gpu --allow-file-access-from-files --enable-logging=stderr --v=0 --virtual-time-budget=40000 --dump-dom "file:///$($tmp.Replace('\','/'))" 2>&1 | Out-String
} finally { Remove-Item $tmp -ErrorAction SilentlyContinue }
$lines = [regex]::Matches($out, 'SMOKE ([^\r\n"]*)') | ForEach-Object { $_.Groups[1].Value.Trim() } | Select-Object -Unique
$lines | ForEach-Object { Write-Host $_ }
$fail = @($lines | Where-Object { $_ -like 'FAIL*' }).Count; $done = @($lines | Where-Object { $_ -like 'DONE*' }).Count
if ($fail -gt 0 -or $done -eq 0) { Write-Host "THẤT BẠI ($fail lỗi$(if (-not $done) { ', chưa chạy hết' }))"; exit 1 }
Write-Host 'TẤT CẢ ĐẠT'
