// Sinh tài liệu Design System (README brand book, README + preview từng thành phần, Cover) rồi chạy upload logo + check.
//   node tools/gen-ds.mjs        (chạy sau tools/build-tokens.mjs và tools/build.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(ROOT, '..', '..');
const DSR = path.join(ROOT, 'design-system'), DS = path.join(DSR, 'project');
const A = path.join(REPO, '.claude', 'skills', 'claude-design-system', 'scripts', 'artifact.mjs');
const wr = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const tokens = JSON.parse(fs.readFileSync(path.join(DS, 'tokens.json'), 'utf8'));
const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

// ---------- bundle.js: dòng đầu khai báo namespace + danh sách thành phần ----------
const COMPONENTS = [
  { name: 'TierChip', group: 'Trạng thái', fn: 'tierChip', summary: 'Nhãn trạng thái KPI gồm biểu tượng khác hình + chữ; không bao giờ chỉ là màu.',
    use: 'Truyền mã mức (`dat`, `kha`, `cct`, `chua`, `gap`) và tuỳ chọn `text`/`long`. Mã mức lấy từ `VTB.tierOf(ht, nguong)` — ngưỡng luôn lấy từ cấu hình, không viết cứng.',
    rules: ['Dùng ở MỌI nơi hiển thị trạng thái: thẻ KPI, bảng, ma trận, danh sách cảnh báo.', 'Không tự đổi màu hay bỏ biểu tượng; `gap` nghĩa là chưa có số, không phải 0%.'],
    sample: `r.innerHTML = ['dat','kha','cct','chua','gap'].map(t => VTB.tierChip(t)).join(' ') + '<br><br>' + VTB.tierChip('chua',{text:'3 quá hạn'});`, h: 110 },
  { name: 'DeltaBadge', group: 'Trạng thái', fn: 'deltaBadge', summary: 'Thay đổi so kỳ trước: ▲▼ + số có dấu + tên kỳ; màu theo tốt/xấu chứ không theo tăng/giảm.',
    use: 'Truyền số thay đổi và `{digits, unit, vs, lowerIsBetter}`. Với chỉ tiêu càng thấp càng tốt (nợ xấu) đặt `lowerIsBetter`.',
    rules: ['Luôn ghi kỳ so sánh (`vs`).', 'Có phụ đề ẩn cho trình đọc màn hình (tăng/giảm).'],
    sample: `r.innerHTML = [VTB.deltaBadge(1.2,{vs:'so T9/2026'}), VTB.deltaBadge(-0.4,{vs:'so T9/2026'}), VTB.deltaBadge(0,{}), VTB.deltaBadge(-0.3,{lowerIsBetter:true,unit:' đ%'})].join('<br><br>');`, h: 150 },
  { name: 'Sparkline', group: 'Biểu đồ', fn: 'sparkline', summary: 'Đường xu hướng nhỏ, 2px, có điểm cuối; không trục.',
    use: 'Truyền mảng giá trị (có thể chứa `null`) và `{w,h,label}`. Luôn kèm số hiện tại bên cạnh.', rules: ['Có `aria-label` mô tả; không dùng thay cho biểu đồ đầy đủ.'],
    sample: `r.innerHTML = VTB.sparkline([88,89,90.5,90,91.2,92,93.4,93.8,93.8],{w:160,h:40});`, h: 90 },
  { name: 'TierBar', group: 'Trạng thái', fn: 'tierBar', summary: 'Dải 100% phân bố số chỉ tiêu theo mức, khe 2px, kèm chú giải có số.',
    use: 'Truyền `{dat,kha,cct,chua,gap}` là số lượng. Chú giải có biểu tượng + chữ + số nên không phụ thuộc màu.', rules: ['Nhãn số nằm trong đoạn chỉ khi đủ chỗ; số luôn có ở chú giải.'],
    sample: `r.innerHTML = VTB.tierBar({dat:7,kha:6,cct:3,chua:2,gap:2});`, h: 130 },
  { name: 'HeroFigure', group: 'Thẻ KPI', fn: 'heroFigure', summary: 'MỘT số chính của màn hình: số lớn, đơn vị, chip mức, thay đổi, xu hướng.',
    use: 'Truyền `{label,value,unit,tier,delta,spark,note}`. Mỗi màn chỉ có một HeroFigure.', rules: ['Số dùng chữ tỷ lệ (không `tabular-nums`), cùng họ chữ sans.', 'Khi trình chiếu dùng bậc `present-hero`.'],
    sample: `r.innerHTML = VTB.heroFigure({label:'Điểm KPI toàn chi nhánh · lũy kế T10/2026',value:'93,8',unit:'/ 100 điểm',tier:'kha',delta:VTB.deltaBadge(0.1,{vs:'so T9/2026'}),spark:VTB.sparkline([90,91,92,93,93.8],{w:200,h:36})});`, h: 200 },
  { name: 'KpiCard', group: 'Thẻ KPI', fn: 'kpiCard', summary: 'Thẻ chỉ tiêu: tên, mức, giá trị, kế hoạch, %HT, thay đổi, xu hướng; bấm/Enter để xem chi tiết.',
    use: 'Truyền `{id,label,value,unit,sub,ht,tier,delta,spark,active}`. Có `id` thì thẻ là nút (role=button, tabindex=0).', rules: ['Thứ bậc: tên → giá trị → kế hoạch → %HT.', 'Thẻ đang chọn dùng viền `brand-blue` 1px + vòng 1px, không đổ bóng.'],
    sample: `r.style.display='grid'; r.style.gridTemplateColumns='repeat(3,1fr)'; r.style.gap='12px'; r.innerHTML = [['TOI','458,9','Tỷ đồng','dat','108% KH'],['Tỷ lệ nợ xấu','1,92','%','chua','63% KH'],['CASA','2.930','Tỷ đồng','kha','94% KH']].map((x,i)=>VTB.kpiCard({id:'k'+i,label:x[0],value:x[1],unit:x[2],sub:'KH lũy kế (mẫu)',ht:x[4],tier:x[3],delta:VTB.deltaBadge(i-1,{unit:' đ%'}),spark:VTB.sparkline([1,2,2,3,i+3],{w:70,h:24}),active:i===0})).join('');`, h: 190 },
  { name: 'StatTile', group: 'Thẻ KPI', fn: 'statTile', summary: 'Ô số phụ (đếm đơn vị, số cảnh báo): nhãn, số lớn, ghi chú.', use: 'Truyền `{label,value|valueHtml,sub}`.', rules: ['Dùng cho 3–4 số phụ; số chính dùng HeroFigure.'],
    sample: `r.style.display='grid'; r.style.gridTemplateColumns='repeat(3,1fr)'; r.style.gap='12px'; r.innerHTML = VTB.statTile({label:'Đơn vị ≥ 90 điểm',value:'7/12',sub:'ngưỡng cấu hình nguong'}) + VTB.statTile({label:'Dưới mức Khá',value:'2',sub:'trên 12 đơn vị'}) + VTB.statTile({label:'Cảnh báo nghiêm trọng',value:'2',sub:'kỳ này'});`, h: 130 },
  { name: 'RankBars', group: 'Biểu đồ', fn: 'rankBars', summary: 'Xếp hạng toàn bộ đơn vị: thanh theo mức, hai vạch ngưỡng Khá/Đạt, thay đổi, GAP, trạng thái.',
    use: 'Truyền mảng dòng `{ma,hang,hang_truoc,ten,khoi,diem,gap,tier,delta,series,canhbao}` và `{ng,selected,noSpark}`. Hàng bấm được (role=button).', rules: ['Hiển thị TẤT CẢ đơn vị, không cắt top/bottom.', 'Màu thanh = mức; nhãn điểm nằm trong thanh; chip mức luôn có chữ.'],
    sample: `const ng={dat:1,kha:.8,cct:.7}; const rows=[['Đơn vị 01',107,1.2],['Đơn vị 02',99.5,.5],['Đơn vị 03',81.2,-.4],['Đơn vị 04',72.5,-9.4]].map((x,i)=>({ma:'m'+i,hang:i+1,hang_truoc:i+1,ten:x[0],khoi:'KHỐI',diem:x[1],gap:x[1]-100,tier:VTB.tierOf(x[1]/100,ng),delta:x[2],series:[80,82,85,90,x[1]],canhbao:''})); r.innerHTML = VTB.rankBars(rows,{ng:ng,selected:'m1'}); VTB.attachTips(r);`, h: 340 },
  { name: 'BulletRow', group: 'Biểu đồ', fn: 'bulletRow', summary: 'Một chỉ tiêu: thanh thực hiện so kế hoạch (vạch đen = 100%), %HT, GAP, mức.',
    use: 'Truyền `{id,name,nhom,ht,tier,thTxt,khTxt,gapTxt,gapBad,cap,active}`. `ht` rỗng → thanh GAP nét đứt.', rules: ['GAP (thiếu số) vẽ viền nét đứt, không phải thanh rỗng 0%.', 'Với số DỰ KIẾN, ghi chữ DỰ KIẾN ở `thTxt`.'],
    sample: `r.innerHTML = [['Tổng thu nhập (TOI)',1.08,'dat','458,9','423,8','+35,1'],['Tiền gửi KHCN',.64,'chua','5.998','9.350','−3.352'],['Hài lòng KH (CX)',null,'gap','Chưa có số','','–']].map(x=>VTB.bulletRow({id:x[0],name:x[0],nhom:'Nhóm mẫu',ht:x[1],tier:x[2],thTxt:x[3],khTxt:x[4],gapTxt:x[5],gapBad:x[2]==='chua'})).join('');`, h: 230 },
  { name: 'AttentionList', group: 'Cảnh báo', fn: 'attentionList', summary: 'Danh sách cảnh báo có mức (biểu tượng + chữ), nội dung, bấm được để xuống chi tiết.',
    use: 'Truyền mảng `{muc:1|2|3,loai,text,dv,ct,meta}`. Có `dv`/`ct` thì dòng là nút.', rules: ['Sắp xếp theo mức giảm dần.', 'Mức 3 dùng `chua`, 2 dùng `cct`, 1 dùng `gap` — cùng hệ màu trạng thái.'],
    sample: `r.innerHTML = VTB.attentionList([{muc:3,loai:'KPI chưa đạt',text:'Tỷ lệ nợ xấu 63% kế hoạch.',ct:'x'},{muc:2,loai:'Đơn vị điểm thấp',text:'Đơn vị 04 đạt 72,5 điểm.',dv:'y'},{muc:1,loai:'Chưa khoá kỳ',text:'Kỳ T10/2026 chưa khoá.'}]);`, h: 190 },
  { name: 'TrendLine', group: 'Biểu đồ', fn: 'trendLine', summary: 'Đường theo tháng: thực tế nét LIỀN, DỰ KIẾN nét ĐỨT + nhãn, ngưỡng nét mảnh, nhãn cuối đường.',
    use: 'Truyền `{w,h,series:[{name,vals[12]}],refs:[{v,label}],forecast:{from:{i,v},to:{i,v}},yMin,yMax,fmt}`. Chỉ truyền `forecast` khi CÓ dữ liệu dự kiến đầu vào.', rules: ['KHÔNG tự tạo dự báo khi thiếu dữ liệu.', 'Số DỰ KIẾN không bao giờ vẽ như số thực tế: nét đứt, điểm đầu rỗng, nhãn DỰ KIẾN, chú giải.', 'Mỗi điểm có tooltip + aria-label và focus bàn phím.'],
    sample: `r.innerHTML = VTB.trendLine({w:560,h:240,series:[{name:'Toàn CN',vals:[88,89,90,90.5,91.5,92,92.6,93.3,93.8,93.8,null,null]},{name:'BQ đơn vị',vals:[85,86,87,88,88.6,89,89.5,90,90.2,90.2,null,null],color:'var(--series-neutral)',thin:true}],refs:[{v:100,label:'Đạt 100'},{v:80,label:'Khá 80'}],forecast:{from:{i:9,v:93.8},to:{i:11,v:95.4}},yMin:75,yMax:105,rightPad:130}); VTB.attachTips(r);`, h: 360 },
  { name: 'ColumnDiverge', group: 'Biểu đồ', fn: 'columnDiverge', summary: 'Cột tăng/giảm theo tháng quanh đường 0: xanh = tăng, cam = giảm, nhãn từng cột.',
    use: 'Truyền `{w,h,vals[],fmt,short}`.', rules: ['Hai màu phân kỳ + ký hiệu ▲▼ trên nhãn: không chỉ dựa vào màu.'],
    sample: `r.innerHTML = VTB.columnDiverge({w:520,h:220,vals:[null,9.9,4.2,7.1,-7.6,11,3.5,-10.8,11.5,10]}); VTB.attachTips(r);`, h: 300 },
  { name: 'LossBars', group: 'Biểu đồ', fn: 'lossBars', summary: 'Mục mất điểm / GAP: tên, thanh một tông, giá trị âm, chip mức.',
    use: 'Truyền mảng `{ct|dv,name,sub,val,valTxt,tier}`.', rules: ['Thanh dùng thang một tông `seq-550`, vì độ lớn, không phải trạng thái.'],
    sample: `r.innerHTML = VTB.lossBars([{ct:'a',name:'Tỷ lệ nợ xấu',sub:'63% kế hoạch',val:2.2,valTxt:'−2,2 điểm',tier:'chua'},{ct:'b',name:'Tiền gửi KHCN',sub:'64% kế hoạch',val:1.4,valTxt:'−1,4 điểm',tier:'chua'},{ct:'c',name:'LNTT',sub:'78% kế hoạch',val:1.3,valTxt:'−1,3 điểm',tier:'cct'}]);`, h: 200 },
  { name: 'StateMatrix', group: 'Bảng', fn: 'stateMatrix', summary: 'Ma trận đơn vị × chỉ tiêu: ô nền nhạt 4 mức + biểu tượng + % — thay heatmap cầu vồng.',
    use: 'Truyền `{cols:[{ct,name}],rows:[{dv,name,cells:{ct:{ht,tier}}}],active}`.', rules: ['Không dùng thang cầu vồng. Mức rời, mỗi ô có biểu tượng + số.', 'Ô không áp dụng hiển thị “·”.'],
    sample: `r.innerHTML = VTB.stateMatrix({cols:[{ct:'a',name:'TOI'},{ct:'b',name:'CASA'},{ct:'c',name:'Nợ xấu'}],rows:[{dv:'d1',name:'Đơn vị 01',cells:{a:{ht:1.17,tier:'dat'},b:{ht:.98,tier:'kha'},c:{ht:.76,tier:'cct'}}},{dv:'d2',name:'Đơn vị 02',cells:{a:{ht:.9,tier:'kha'},b:{ht:null,tier:'gap'},c:{ht:.55,tier:'chua'}}}]});`, h: 200 },
  { name: 'DataTable', group: 'Bảng', fn: 'dataTable', summary: 'Bảng thay thế cho mọi biểu đồ (WCAG): tiêu đề cột dính, số căn phải.',
    use: 'Truyền `{caption,cols:[{k,t,cls,html}],rows}`. `rows[i]._key` đặt `data-key`.', rules: ['Mỗi biểu đồ phải có bản bảng; bảng chứa mọi giá trị biểu đồ thể hiện.'],
    sample: `r.innerHTML = VTB.dataTable({caption:'Mẫu',cols:[{k:'a',t:'Đơn vị'},{k:'b',t:'Điểm',cls:'vtb-r'},{k:'c',t:'Mức'}],rows:[{a:'Đơn vị 01',b:'107,0',c:'Đạt'},{a:'Đơn vị 02',b:'99,5',c:'Khá'}]});`, h: 150 },
  { name: 'DataFreshness', group: 'Trạng thái', fn: 'dataFreshness', summary: 'Dải trạng thái dữ liệu: thời điểm cập nhật, kỳ, khoá kỳ, độ đầy đủ số liệu.',
    use: 'Truyền `{capNhat,ky,khoa,soLieu,extra}`.', rules: ['Luôn hiển thị trên màn điều hành; khoá kỳ có chip + chữ.'],
    sample: `r.innerHTML = VTB.dataFreshness({capNhat:'2026-11-08 08:30',ky:'T10/2026 (lũy kế)',khoa:false,soLieu:'161/188 ô thực hiện đã nhập',extra:'2 số liệu bất thường · Dữ liệu giả lập'});`, h: 90 },
];
const hdr = `/* @ds-bundle: ${JSON.stringify({ format: 4, namespace: 'VTB', components: COMPONENTS.map((c) => ({ name: c.name })) })} */\n`;
const bjs = path.join(DS, 'components', 'bundle.js');
let src = fs.readFileSync(bjs, 'utf8').replace(/^\/\* @ds-bundle:.*\*\/\n/, '');
fs.writeFileSync(bjs, hdr + src);

// ---------- components/<Comp>/README.md + preview.html ----------
for (const c of COMPONENTS) {
  wr(path.join(DS, 'components', c.name, 'README.md'), `${c.summary}\n\n**Hàm:** \`VTB.${c.fn}(…)\` trả về chuỗi HTML đã escape; nạp \`tokens.css\`, \`components/bundle.css\`, \`components/bundle.js\`.\n\n**Bạn cung cấp:** ${c.use}\n\n**Quy tắc:**\n${c.rules.map((r) => '- ' + r).join('\n')}\n`);
  wr(path.join(DS, 'components', c.name, 'preview.html'), `<!-- @dsCard group="${c.group}" height=${c.h} subtitle="${c.summary.replace(/"/g, '&quot;').slice(0, 110)}" -->\n<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>body{margin:0;padding:12px;background:var(--surface-page)}</style></head><body><div class="vtb-scope" id="r"></div><script>(function(){var r=document.getElementById('r');${c.sample}VTB.attachKeys(r);})();</script></body></html>\n`);
}

// ---------- Cover (xem cover.md) ----------
const tk = (n) => tokens.color.tokens.find((t) => t.name === n).value;
wr(path.join(DS, 'components', 'Cover', 'preview.html'), `<!-- @dsCard height=288 -->
<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>body{margin:0;background:var(--surface-page)}svg{display:block;width:960px;height:288px}
.ground{fill:var(--surface-page)}.brand{fill:var(--brand-blue)}.red{fill:var(--brand-red)}.ink{fill:var(--ink)}.kha{fill:var(--tier-kha)}.cct{fill:var(--tier-cct)}.dat{fill:var(--tier-dat)}.tint{fill:var(--brand-blue-tint)}.chua{fill:var(--tier-chua)}.gap{fill:var(--tier-gap)}
.tile{rx:var(--radius-md)}.pill{rx:6px}.name{font:700 68px/0.95 var(--font-sans);fill:var(--ink);letter-spacing:-.02em}.tag{font:500 14px var(--font-sans);fill:var(--ink-muted)}</style></head><body>
<svg viewBox="0 0 960 288" role="img" aria-label="VietinBank KPI">
<!-- Khối màu: brand-blue 232×168, ink 240×104 (tràn mép trên-phải), brand-red 96×96, tier-kha 136×96, tier-cct 112×112, brand-blue-tint 112×112, tier-dat 240×72 (bội của space-1..space-12).
     Bố cục: mô-đun lệch, bước 8px, tràn mép trên và phải, không có hàng ô bằng nhau.
     Hoạ tiết: hàng "dải trạng thái" — 5 viên thuốc bo 6px (radius-sm) màu Đạt/Khá/CCT/Chưa đạt/GAP trong khối ink, chính là TierBar của hệ thống: dấu hiệu riêng của dashboard KPI này.
     Bước/bo góc dùng: space-1 (4), space-2 (8), space-12 (48), radius-sm (6), radius-md (10). -->
<rect class="ground" width="960" height="288"/>
<rect class="tile brand" x="480" y="0" width="232" height="168"/>
<rect class="tile ink" x="720" y="0" width="240" height="104"/>
<rect class="pill dat" x="740" y="44" width="70" height="16"/><rect class="pill kha" x="814" y="44" width="52" height="16"/><rect class="pill cct" x="870" y="44" width="30" height="16"/><rect class="pill chua" x="904" y="44" width="22" height="16"/><rect class="pill gap" x="930" y="44" width="14" height="16"/>
<rect class="tile red" x="720" y="112" width="96" height="96"/>
<rect class="tile kha" x="824" y="112" width="136" height="96"/>
<rect class="tile cct" x="480" y="176" width="112" height="112"/>
<rect class="tile tint" x="600" y="176" width="112" height="112"/>
<rect class="tile dat" x="720" y="216" width="240" height="72"/>
<text class="name" x="32" y="196">VietinBank</text><text class="name" x="32" y="258">KPI</text>
<text class="tag" x="32" y="278">Một hệ trạng thái cho mọi màn hình KPI.</text>
</svg></body></html>
`);
// cover: văn bản nằm đáy trái; tagline đặt dưới tên → dịch lên để không tràn
let cv = fs.readFileSync(path.join(DS, 'components', 'Cover', 'preview.html'), 'utf8').replace('y="196">VietinBank', 'y="150">VietinBank').replace('y="258">KPI', 'y="214">KPI').replace('y="278">Một hệ', 'y="248">Một hệ');
fs.writeFileSync(path.join(DS, 'components', 'Cover', 'preview.html'), cv);

// ---------- Logo (sao chép nguyên bản) ----------
wr(path.join(DS, 'assets', 'Logos', 'README.md'), `# Logos\n\n\`logo-vietinbank.png\` là logo chính thức đã có sẵn trong dự án ứng dụng KPI (\`App/assets/logo-vietinbank.png\`), được **sao chép nguyên bản, không vẽ lại, không chỉnh sửa**.\n\n- Hiển thị bằng thẻ \`<img>\` (không dùng \`currentColor\`); ảnh có màu riêng (xanh thương hiệu và đỏ thương hiệu).\n- Đặt trên \`surface-card\` (trắng); chiều cao nên từ 32px; không kéo méo, không tô lại, không đặt trên nền màu tier.\n- Đây là hướng dẫn dùng trong prototype, **không thay thế** quy chuẩn nhận diện chính thức của VietinBank.\n`);
let up = null;
try { up = JSON.parse(execFileSync(process.execPath, [A, 'upload', DSR, path.join(DSR, 'src', 'logo-vietinbank.png'), '--group', 'Logos'], { encoding: 'utf8' })); } catch (e) { console.error('upload logo lỗi:', e.message.slice(0, 300)); }

// ---------- README (brand book) ----------
const g = (n) => tokens.color.tokens.find((t) => t.name === n).value;
wr(path.join(DS, 'README.md'), `Hệ thống thiết kế cho dashboard KPI điều hành của VietinBank Chi nhánh Bắc Nghệ An: một hệ màu trạng thái duy nhất, số liệu đọc nhanh, chạy offline, hai màn hình (Tổng quan chi nhánh, Điều hành Ban giám đốc) và chế độ trình chiếu 16:9.

## Nguyên tắc nội dung

- Viết tiếng Việt, câu ngắn, chủ động. Số theo định dạng vi-VN: dấu chấm hàng nghìn, dấu phẩy thập phân (\`1.234,5\`); phần trăm \`96%\`; thay đổi có dấu và tên kỳ (\`▲ 0,1 so T9/2026\`).
- Dùng đúng thuật ngữ: **Đạt**, **Khá**, **Cần cải thiện**, **Chưa đạt**, **GAP** (chưa có số). “Dự kiến” viết hoa **DỰ KIẾN** mỗi khi là số chưa xảy ra.
- Nhãn trạng thái luôn là chữ + biểu tượng. Không dùng emoji.
- Câu mẫu thật: “Điểm KPI 93,8 (▲0,1 so T9/2026), mức Khá; 7/20 chỉ tiêu đạt.”, “Chưa có dữ liệu dự kiến cho kỳ này.”

## Nền tảng thị giác

**Màu thương hiệu.** \`brand-blue\` (${g('brand-blue')}) cho nút, liên kết, tiêu đề nhấn và chuỗi dữ liệu chính. \`brand-red\` (${g('brand-red')}) **chỉ** cho nhận diện (dải trên cùng, logo); không bao giờ dùng cho dữ liệu hoặc trạng thái vì dễ nhầm với \`tier-chua\`.

**Nền và chữ.** Trang \`surface-page\`, thẻ \`surface-card\`, rãnh/tiêu đề bảng \`surface-sunken\`, đường kẻ \`line\` (nét liền, mảnh). Chữ chính \`ink\`; chữ phụ \`ink-2\`; nhãn/trục \`ink-muted\`. Mọi chữ đạt ≥4,5:1 trên các nền nêu trong ghi chú token.

**Hệ trạng thái KPI (PA-A).** Một hệ duy nhất cho Đạt/Khá/Cần cải thiện/Chưa đạt/GAP, dùng ở mọi nơi:

| Mức | Màu đổ | Chữ trên nền nhạt | Biểu tượng |
|---|---|---|---|
| Đạt | \`tier-dat\` ${g('tier-dat')} | \`tier-dat-ink\` | vòng đặc + dấu ✓ |
| Khá | \`tier-kha\` ${g('tier-kha')} | \`tier-kha-ink\` | vòng rỗng + dấu ✓ |
| Cần cải thiện | \`tier-cct\` ${g('tier-cct')} | \`tier-cct-ink\` | tam giác cảnh báo |
| Chưa đạt | \`tier-chua\` ${g('tier-chua')} | \`tier-chua-ink\` | vòng đặc + dấu ✕ |
| GAP | \`tier-gap\` ${g('tier-gap')} | \`tier-gap-ink\` | vòng nét đứt + gạch |

Chữ đặt trực tiếp lên màu đổ dùng \`on-tier-*\`. Màu đổ \`tier-kha\`, \`tier-cct\`, \`tier-gap\` dưới 3:1 trên \`surface-card\` nên **bắt buộc** kèm nhãn chữ + biểu tượng (đã gắn sẵn trong \`TierChip\`, \`TierBar\`, \`RankBars\`, \`BulletRow\`). Ngưỡng của từng mức lấy từ cấu hình \`nguong\`, không viết cứng trong thành phần.

**Danh mục và độ lớn.** Chuỗi so sánh dùng \`series-1\`…\`series-4\` (tối đa 4; chuỗi bình quân/kế hoạch/tham chiếu dùng \`series-neutral\` — xám đủ sáng để tách khỏi xanh thương hiệu). Độ lớn thuần túy (điểm mất, hạng) dùng thang một tông \`seq-100\`…\`seq-700\`. Không dùng thang cầu vồng.

**Chữ.** Plus Jakarta Sans (400/500/600/700, có tiếng Việt), kể cả số lớn; không dùng chữ có chân. Bậc: \`caption\` 12, \`body\` 14, \`title-sm\` 16, \`title\` 20, \`display\` 28, \`hero\` 52; trình chiếu dùng \`present-*\`. \`tabular-nums\` chỉ cho cột bảng; số lớn dùng số tỷ lệ.

**Khoảng cách, bo góc, nổi.** Lưới 4px: \`space-1\`…\`space-12\`. Bo góc \`radius-sm\` (chip, nút), \`radius-md\` (thẻ), \`radius-pill\` (thanh). Bóng chỉ hai mức: \`shadow-card\` rất nhẹ, \`shadow-pop\` cho tooltip. Không gradient, không hiệu ứng 3D, không animation.

**Biểu đồ.** SVG phẳng; đường 2–2,5px; lưới \`chart-grid\` nét liền; ngưỡng \`chart-ref\` nét liền mảnh kèm nhãn; **nét đứt dành riêng cho số DỰ KIẾN** (\`forecast\`) kèm nhãn và chú giải. Nhãn trực tiếp ở cuối đường và đầu thanh; không đặt số lên mọi điểm. Mỗi biểu đồ có bản bảng (\`DataTable\`) và \`aria-label\`; điểm dữ liệu truy cập được bằng bàn phím.

**Bố cục.** Lưới 12 cột, tối đa \`layout-max\`, căn giữa. Chế độ trình chiếu dùng khung \`stage-w\`×\`stage-h\` (1920×1080) và co giãn theo cửa sổ; nội dung phụ ẩn. Vùng bấm tối thiểu \`tap-min\`.

## Tiếp cận

Chữ ≥4,5:1; viền/biểu tượng mang nghĩa ≥3:1; vòng focus 2px \`focus-ring\`; mọi hàng/thẻ bấm được là \`role="button"\` có \`tabindex="0"\` và nhận Enter/Space; không chỉ dựa vào màu; tooltip chỉ bổ trợ.

## Biểu tượng

Biểu tượng trạng thái là hình học đơn giản (vòng, tam giác, dấu ✓ ✕, nét đứt) được viết trong \`VTB.svgIcon\`, mỗi mức một hình khác nhau. Logo VietinBank xem nhóm tài sản **Logos**: sao chép nguyên bản, không vẽ lại.

## Cách dùng

Nạp \`tokens.css\`, \`components/bundle.css\`, \`components/bundle.js\`; đặt thành phần trong phần tử \`class="vtb-scope"\`. Thêm \`is-stage\` vào phần tử gốc để dùng bậc chữ trình chiếu.
`);

// ---------- Chỉ mục ----------
const idx = { v: 3, layout: 'files', createdOnFiles: { v: 1, at: now }, title: tokens.name, namespace: 'VTB', libraries: [], sections: {}, groups: ['Logos'], assetGroups: { Logos: { name: 'Logos', tile: 'l', order: [], files: {} } }, blobs: {}, docs: { readme: 'project/README.md', sections: [] }, lastChange: { by: 'Claude Code', via: 'Claude Code', at: now, note: 'Prototype giai đoạn 1: token, thành phần, brand book.' } };
if (up && up.record) { const key = up.key || 'logo-vietinbank.png'; idx.assetGroups.Logos.files[key] = up.record; idx.assetGroups.Logos.order = [key]; }
wr(path.join(DS, 'design-system.json'), JSON.stringify(idx, null, 2) + '\n');
console.log('Đã sinh Design System:', COMPONENTS.length, 'thành phần + Cover; logo upload:', up ? 'OK' : 'LỖI');
if (up) console.log(JSON.stringify(up).slice(0, 300));
