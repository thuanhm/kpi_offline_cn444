# Kiểm tra hành vi bảng Tabulator bằng Edge không giao diện, dùng dữ liệu mẫu: sắp xếp 3 trạng thái, bấm dòng, chuyển màn hình nhiều lần, xuất PNG.
# Chạy: powershell -NoProfile -ExecutionPolicy Bypass -File tests\smoke-bang.ps1
$ErrorActionPreference = 'Continue'; [Console]::OutputEncoding = [Text.Encoding]::UTF8
$app = Join-Path (Split-Path -Parent $PSScriptRoot) 'App'
$edge = @('C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', 'C:\Program Files\Microsoft\Edge\Application\msedge.exe') | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) { Write-Host 'Không tìm thấy Microsoft Edge.'; exit 2 }
$s = [IO.File]::ReadAllText("$app\index.html", [Text.Encoding]::UTF8)
$inj = @'
<script>
window.requestAnimationFrame=function(f){return setTimeout(f,0)};
function L(t){console.log('SMOKE '+t)}
function ok(c,t){L((c?'OK ':'FAIL ')+t)}
window.onerror=function(m,s,l){L('FAIL JS '+m+' @'+String(s).split('/').pop()+':'+l)};
window.addEventListener('unhandledrejection',function(e){L('FAIL REJ '+(e.reason&&e.reason.message||e.reason))});
sessionStorage.setItem('KPI_CN444.user_ss','admin');sessionStorage.setItem('KPI_CN444.ten_ss','Admin');sessionStorage.setItem('KPI_CN444.admin','1');
function go(r){location.hash='#/'+r;APP.render()}
function ten(){return [].map.call(document.querySelectorAll('#view .tabulator-row'),function(r){return r.querySelectorAll('.tabulator-cell')[1].textContent.trim().slice(0,8)}).join('|')}
function col(f){return document.querySelector('#view .tabulator-col[tabulator-field="'+f+'"]')}
function wait(ms){return new Promise(function(o){setTimeout(o,ms)})}
setTimeout(async function(){
  try{
    document.querySelectorAll('.modal-wrap').forEach(function(e){e.remove()});
    go('xep-hang'); await wait(2500);
    var goc=ten(), n=document.querySelectorAll('#view .tabulator-row').length; ok(n>=3,'xep-hang co '+n+' dong');
    col('qd').click(); await wait(200); var tang=ten();
    col('qd').click(); await wait(200); var giam=ten();
    col('qd').click(); await wait(200); var khong=ten();
    ok(tang!==giam,'sap xep tang khac giam'); ok(khong===goc,'bam lan 3 ve thu tu ban dau');
    col('ten').click(); await wait(200); var theoTen=ten(); ok(theoTen!==goc,'sap xep theo chu');
    document.querySelector('#view .tabulator-row').click(); await wait(500); ok(/^#\/phong\//.test(location.hash),'bam dong mo the diem phong ('+location.hash+')');
    go('xep-hang'); await wait(1500);
    var sd=await UI.lib('snapdom'), img=await sd.toPng(document.querySelector('#view .tabulator'),{scale:1}); ok(img.src.length>5000,'xuat PNG bang Tabulator');
    var t0=document.getElementsByTagName('*').length;
    for(var k=0;k<20;k++){go(k%2?'xep-hang':'du-bao'); await wait(150)}
    ok(document.querySelectorAll('#view .tabulator').length<=1 && document.getElementsByTagName('*').length<t0+300,'chuyen man hinh 20 lan khong tang DOM');
    L('DONE');
  }catch(e){L('FAIL EXC '+e.message)}
},2500);
</script></body>
'@
$tmp = "$app\_smoke.html"
[IO.File]::WriteAllText($tmp, $s.Replace('</body>', $inj), (New-Object Text.UTF8Encoding($false)))
try {
  $out = & $edge --headless=new --disable-gpu --allow-file-access-from-files --enable-logging=stderr --v=0 --virtual-time-budget=60000 --dump-dom "file:///$($tmp.Replace('\','/'))" 2>&1 | Out-String
} finally { Remove-Item $tmp -ErrorAction SilentlyContinue }
$lines = [regex]::Matches($out, 'SMOKE ([^\r\n"]*)') | ForEach-Object { $_.Groups[1].Value.Trim() } | Select-Object -Unique
$lines | ForEach-Object { Write-Host $_ }
$fail = @($lines | Where-Object { $_ -like 'FAIL*' }).Count; $done = @($lines | Where-Object { $_ -like 'DONE*' }).Count
if ($fail -gt 0 -or $done -eq 0) { Write-Host "THẤT BẠI ($fail lỗi$(if (-not $done) { ', chưa chạy hết' }))"; exit 1 }
Write-Host 'TẤT CẢ ĐẠT'
