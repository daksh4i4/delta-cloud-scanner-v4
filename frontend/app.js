const $=id=>document.getElementById(id);

let activeFilter="ALL";
let searchText="";
let latestData=null;
let socket=null;
let reconnectTimer=null;

const TF=[
"1m","3m","5m","15m","30m","1h","2h","4h","6h","12h","1d","1w","1M"
];

const defs=[
["wave_tf","Wave TF","select"],
["tide_tf","Tide TF","select"],
["we1","Wave EMA 1","number"],
["we2","Wave EMA 2","number"],
["we3","Wave EMA 3","number"],
["te1","Tide EMA 1","number"],
["te2","Tide EMA 2","number"],
["te3","Tide EMA 3","number"],
["fe1","Tide Filter EMA 1","number"],
["fe2","Tide Filter EMA 2","number"],
["rp","RSI Period","number"],
["rb","RSI BUY","number"],
["rs","RSI SELL","number"],
["mf","MACD Fast","number"],
["ms","MACD Slow","number"],
["mg","MACD Signal","number"],
["sp","Stoch Period","number"],
["sk","Stoch K Smooth","number"],
["sd","Stoch D Smooth","number"],
["vs","Volume SMA","number"],
["bs","BUY Score","number"],
["ss","SELL Score","number"],
["srl","S/R Lookback","number"],
["srp","S/R Pivot","number"],
["rr","Minimum R:R","number"],
["slb","SL Buffer %","number"],
["mvr","Min Volume Ratio","number"],
["mc","Min Confirmations","number"]
];

for(const d of defs){
const label=document.createElement("label");
label.textContent=d[1];
const input=document.createElement(d[2]==="select"?"select":"input");
input.id=d[0];

if(d[2]==="number")input.type="number";
if(d[0]==="rr")input.step=".1";
if(d[0]==="slb")input.step=".05";
if(d[0]==="mvr")input.step=".1";

if(d[2]==="select"){
TF.forEach(t=>{
const option=document.createElement("option");
option.value=t;
option.textContent=t;
input.appendChild(option);
});
}

label.appendChild(input);
$("settings").appendChild(label);
}

const DEFAULT_SETTINGS={
wave_tf:"15m",
tide_tf:"1h",

we1:9,
we2:20,
we3:50,

te1:9,
te2:20,
te3:50,

fe1:20,
fe2:50,

rp:14,
rb:55,
rs:45,

mf:12,
ms:26,
mg:9,

sp:14,
sk:3,
sd:3,

vs:20,

bs:70,
ss:30,

srl:160,
srp:3,

rr:2,
slb:0.20,

mvr:1.0,
mc:7
};

function fill(s){
if(!s)return;

defs.forEach(d=>{
const el=$(d[0]);
if(!el)return;

if(s[d[0]]!==undefined){
el.value=s[d[0]];
}
});
}

fill(DEFAULT_SETTINGS);

function applyProfessionalUI(){

if(document.getElementById("professional-scanner-ui"))return;

const style=document.createElement("style");
style.id="professional-scanner-ui";

style.textContent=`

:root{
--ui-bg:#f4f7fb;
--ui-surface:#ffffff;
--ui-surface-soft:#f8fafc;
--ui-border:#e2e8f0;
--ui-border-strong:#cbd5e1;
--ui-text:#172033;
--ui-text-soft:#64748b;
--ui-text-muted:#94a3b8;
--ui-primary:#2563eb;
--ui-primary-soft:#eff6ff;
--ui-green:#15803d;
--ui-green-soft:#f0fdf4;
--ui-red:#dc2626;
--ui-red-soft:#fef2f2;
--ui-amber:#b45309;
--ui-amber-soft:#fffbeb;
--ui-cyan:#0369a1;
--ui-cyan-soft:#f0f9ff;
--ui-shadow:0 4px 16px rgba(15,23,42,.06);
--ui-shadow-hover:0 8px 24px rgba(15,23,42,.09);
}

*,*::before,*::after{
box-sizing:border-box;
}

html{
background:var(--ui-bg)!important;
}

body{
background:var(--ui-bg)!important;
color:var(--ui-text)!important;
font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
}

button,input,select{
font-family:inherit;
}

main,.container,.dashboard,.app,.page,.content{
color:var(--ui-text)!important;
}

header,.header,.topbar,.navbar,.hero,.panel,.card,
.scanner-panel,.settings-panel,.toolbar,.scanner-toolbar{
border-color:var(--ui-border)!important;
}

#settings{
display:grid!important;
grid-template-columns:repeat(auto-fit,minmax(155px,1fr));
gap:12px;
margin-top:14px;
margin-bottom:18px;
padding:0;
background:transparent!important;
}

#settings label{
display:flex;
flex-direction:column;
gap:7px;
min-width:0;
padding:11px 12px;
background:#fff!important;
color:#475569!important;
border:1px solid #e2e8f0!important;
border-radius:10px;
font-size:11px;
font-weight:700;
line-height:1.25;
box-shadow:0 1px 2px rgba(15,23,42,.03);
transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease;
}

#settings label:hover{
border-color:#bfdbfe!important;
box-shadow:var(--ui-shadow);
transform:translateY(-1px);
}

#settings input,#settings select{
width:100%;
min-height:34px;
background:#fff!important;
color:#172033!important;
border:1px solid #cbd5e1!important;
border-radius:7px;
padding:7px 9px;
outline:none;
font-size:12px;
font-weight:700;
box-shadow:inset 0 1px 1px rgba(15,23,42,.02);
}

#settings select option{
background:#fff!important;
color:#172033!important;
}

#settings input:hover,#settings select:hover{
border-color:#94a3b8!important;
}

#settings input:focus,#settings select:focus{
border-color:var(--ui-primary)!important;
box-shadow:0 0 0 3px rgba(37,99,235,.10)!important;
}

button,.filter-btn,#saveButton{
border-radius:8px!important;
transition:all .18s ease!important;
}

#saveButton{
background:var(--ui-primary)!important;
color:#fff!important;
border:1px solid var(--ui-primary)!important;
font-weight:800!important;
box-shadow:0 2px 6px rgba(37,99,235,.18)!important;
}

#saveButton:hover{
background:#1d4ed8!important;
border-color:#1d4ed8!important;
box-shadow:0 5px 14px rgba(37,99,235,.22)!important;
transform:translateY(-1px);
}

#saveButton:disabled{
opacity:.65!important;
transform:none!important;
}

.filter-btn{
background:#fff!important;
color:#475569!important;
border:1px solid var(--ui-border)!important;
font-weight:750!important;
}

.filter-btn:hover{
background:#f8fafc!important;
border-color:#cbd5e1!important;
color:#1e293b!important;
}

.filter-btn.active{
background:var(--ui-primary-soft)!important;
color:#1d4ed8!important;
border-color:#bfdbfe!important;
box-shadow:0 2px 8px rgba(37,99,235,.08)!important;
}

#searchInput{
background:#fff!important;
color:#172033!important;
border:1px solid var(--ui-border-strong)!important;
border-radius:8px!important;
outline:none!important;
}

#searchInput::placeholder{
color:#94a3b8!important;
}

#searchInput:focus{
border-color:var(--ui-primary)!important;
box-shadow:0 0 0 3px rgba(37,99,235,.10)!important;
}

.dot.ok{
background:#16a34a!important;
box-shadow:0 0 0 3px rgba(22,163,74,.12)!important;
}

.dot:not(.ok){
background:#f59e0b!important;
box-shadow:0 0 0 3px rgba(245,158,11,.12)!important;
}

#msg{
color:var(--ui-green)!important;
font-weight:700;
}

table{
width:100%;
font-variant-numeric:tabular-nums;
border-collapse:separate!important;
border-spacing:0!important;
background:#fff!important;
color:var(--ui-text)!important;
border:1px solid var(--ui-border)!important;
border-radius:10px;
overflow:hidden;
}

thead,thead tr{
background:#f8fafc!important;
}

th{
background:#f8fafc!important;
color:#475569!important;
border-bottom:1px solid var(--ui-border)!important;
font-size:10px!important;
font-weight:800!important;
text-transform:uppercase;
letter-spacing:.035em;
white-space:nowrap;
}

td{
background:#fff!important;
color:#334155!important;
border-bottom:1px solid #edf1f5!important;
font-size:11px!important;
font-weight:600;
white-space:nowrap;
}

tbody tr{
background:#fff!important;
transition:background .12s ease;
}

tbody tr:nth-child(even){
background:#fbfcfe!important;
}

tbody tr:hover td{
background:#f5f9ff!important;
}

tbody tr:last-child td{
border-bottom:none!important;
}

.coin-name{
color:#0f172a!important;
font-weight:850!important;
letter-spacing:.01em;
}

.signal-buy,.buy,.BUY{
background:#dcfce7!important;
color:#166534!important;
border:1px solid #86efac!important;
font-weight:850!important;
}

.signal-sell,.sell,.SELL{
background:#fee2e2!important;
color:#b91c1c!important;
border:1px solid #fca5a5!important;
font-weight:850!important;
}

.signal-neutral,.neutral,.NEUTRAL{
background:#fef3c7!important;
color:#92400e!important;
border:1px solid #fcd34d!important;
font-weight:850!important;
}

.score-high{
background:#dcfce7!important;
color:#166534!important;
border:1px solid #86efac!important;
}

.score-low{
background:#fee2e2!important;
color:#b91c1c!important;
border:1px solid #fca5a5!important;
}

.score-mid{
background:#fef3c7!important;
color:#92400e!important;
border:1px solid #fcd34d!important;
}

.confirm{
background:#eff6ff!important;
color:#1d4ed8!important;
border:1px solid #bfdbfe!important;
}

.rsi-bull{
background:#dcfce7!important;
color:#166534!important;
border:1px solid #86efac!important;
}

.rsi-bear{
background:#fee2e2!important;
color:#b91c1c!important;
border:1px solid #fca5a5!important;
}

.rsi-neutral{
background:#f8fafc!important;
color:#475569!important;
border:1px solid #e2e8f0!important;
}

.macd-bull{
color:#15803d!important;
font-weight:800!important;
}

.macd-bear{
color:#dc2626!important;
font-weight:800!important;
}

.stoch-bull{
color:#15803d!important;
font-weight:800!important;
}

.stoch-bear{
color:#dc2626!important;
font-weight:800!important;
}

.ha-bull{
background:#f0fdf4!important;
color:#166534!important;
border:1px solid #bbf7d0!important;
}

.ha-bear{
background:#fef2f2!important;
color:#b91c1c!important;
border:1px solid #fecaca!important;
}

.support{
color:#0369a1!important;
background:#f0f9ff!important;
padding:3px 6px;
border-radius:5px;
font-weight:750!important;
}

.resistance{
color:#7c3aed!important;
background:#f5f3ff!important;
padding:3px 6px;
border-radius:5px;
font-weight:750!important;
}

.entry{
color:#0369a1!important;
font-weight:800!important;
}

.sl{
color:#dc2626!important;
font-weight:800!important;
}

.tp{
color:#15803d!important;
font-weight:800!important;
}

.rr{
background:#f5f3ff!important;
color:#6d28d9!important;
border:1px solid #ddd6fe!important;
font-weight:850!important;
}

.badge,.signal,.score,.confirmation,.rr-badge{
display:inline-flex;
align-items:center;
justify-content:center;
min-height:24px;
padding:3px 7px;
border-radius:6px;
font-size:10px;
line-height:1;
font-weight:800;
}

.card{
background:#fff!important;
color:#172033!important;
border:1px solid #e2e8f0!important;
box-shadow:var(--ui-shadow)!important;
}

.card:hover{
box-shadow:var(--ui-shadow-hover)!important;
}

input,select{
color:#172033;
}

input::placeholder{
color:#94a3b8;
}

h1,h2,h3,h4,h5{
color:#172033!important;
}

.muted,.subtle,.secondary{
color:#64748b!important;
}

::-webkit-scrollbar{
width:9px;
height:9px;
}

::-webkit-scrollbar-track{
background:#eef2f7;
}

::-webkit-scrollbar-thumb{
background:#cbd5e1;
border-radius:20px;
border:2px solid #eef2f7;
}

::-webkit-scrollbar-thumb:hover{
background:#94a3b8;
}

@media(max-width:900px){
#settings{
grid-template-columns:repeat(auto-fit,minmax(135px,1fr));
gap:9px;
}
th{
font-size:9px!important;
}
td{
font-size:10px!important;
}
}

@media(max-width:600px){
#settings{
grid-template-columns:repeat(2,minmax(0,1fr));
}
#settings label{
padding:9px;
}
}
`;

document.head.appendChild(style);
}

applyProfessionalUI();

async function save(){

const settings={};

defs.forEach(d=>{
const el=$(d[0]);
if(!el)return;

settings[d[0]]=
d[2]==="number"
?Number(el.value)
:el.value;
});

const button=$("saveButton");
const msg=$("msg");

if(button){
button.disabled=true;
button.textContent="Saving...";
}

if(msg)msg.textContent="";

try{

const response=await fetch("/api/settings",{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(settings)
});

if(!response.ok){
throw new Error(`HTTP ${response.status}`);
}

const data=await response.json();

latestData=latestData||{};
latestData.settings=data.settings||settings;

fill(latestData.settings);

if(msg){
msg.textContent="✓ Settings saved successfully";
}

render(latestData);

}catch(e){

console.error("Settings save failed:",e);

if(msg){
msg.textContent="✕ Failed to save settings";
}

}finally{

if(button){
button.disabled=false;
button.textContent="Save Settings";
}

}
}

function f(value,decimals=2){

if(
value===null||
value===undefined||
value===""||
Number.isNaN(Number(value))
)return"—";

return Number(value).toLocaleString(
undefined,
{
minimumFractionDigits:decimals,
maximumFractionDigits:decimals
}
);
}

function formatChange(value){

if(
value===null||
value===undefined||
Number.isNaN(Number(value))
)return"—";

const n=Number(value);

const cls=n>0
?"macd-bull"
:n<0
?"macd-bear"
:"";

const sign=n>0?"+":"";

return`
<span class="${cls}">
${sign}${f(n,2)}%
</span>
`;
}

function signalBadge(signal){

const s=String(
signal||"NEUTRAL"
).toUpperCase();

if(s==="BUY"){
return`
<span class="badge signal-buy">
BUY
</span>
`;
}

if(s==="SELL"){
return`
<span class="badge signal-sell">
SELL
</span>
`;
}

return`
<span class="badge signal-neutral">
NEUTRAL
</span>
`;
}

function scoreBadge(score){

if(
score===null||
score===undefined||
Number.isNaN(Number(score))
)return"—";

const n=Number(score);

let cls="score-mid";

if(n>=70){
cls="score-high";
}else if(n<=30){
cls="score-low";
}

return`
<span class="badge ${cls}">
${f(n,0)}
</span>
`;
}

function confirmationBadge(value){

if(
value===null||
value===undefined||
value===""
)return"—";

return`
<span class="badge confirm">
${value}
</span>
`;
}

function rsiDisplay(value){

if(
value===null||
value===undefined||
Number.isNaN(Number(value))
)return"—";

const n=Number(value);

let cls="rsi-neutral";

if(n>=55){
cls="rsi-bull";
}else if(n<=45){
cls="rsi-bear";
}

return`
<span class="badge ${cls}">
${f(n,1)}
</span>
`;
}

function macdDisplay(w){

if(!w)return"—";

const macd=Number(w.macd);
const signal=Number(w.macd_signal);

if(
Number.isNaN(macd)||
Number.isNaN(signal)
)return"—";

const bullish=macd>=signal;

return`
<span class="${
bullish
?"macd-bull"
:"macd-bear"
}">
${f(macd,6)}
/
${f(signal,6)}
</span>
`;
}

function stochDisplay(w){

if(!w)return"—";

const k=Number(w.stoch_k);
const d=Number(w.stoch_d);

if(
Number.isNaN(k)||
Number.isNaN(d)
)return"—";

const bullish=k>=d;

return`
<span class="${
bullish
?"stoch-bull"
:"stoch-bear"
}">
${f(k,1)}
/
${f(d,1)}
</span>
`;
}

function haDisplay(ha){

if(!ha)return"—";

const value=String(
ha.signal||
ha.direction||
ha.color||
""
).toUpperCase();

if(
value.includes("BUY")||
value.includes("BULL")||
value.includes("GREEN")
){
return`
<span class="badge ha-bull">
${value||"BULL"}
</span>
`;
}

if(
value.includes("SELL")||
value.includes("BEAR")||
value.includes("RED")
){
return`
<span class="badge ha-bear">
${value||"BEAR"}
</span>
`;
}

return value||"—";
}

function safeSR(value){

if(
value===null||
value===undefined||
value===""||
Number.isNaN(Number(value))
)return"—";

return f(value,8);
}

function planValue(value,type){

if(
value===null||
value===undefined||
value===""||
Number.isNaN(Number(value))
)return"—";

return`
<span class="${type}">
${f(value,8)}
</span>
`;
}

function rrDisplay(value){

if(
value===null||
value===undefined||
value===""||
Number.isNaN(Number(value))
)return"—";

return`
<span class="badge rr">
${f(value,2)}R
</span>
`;
}

function updateFilterButtons(){

[
["filterAll","ALL"],
["filterBuy","BUY"],
["filterSell","SELL"],
["filterNeutral","NEUTRAL"]
].forEach(([id,value])=>{

const button=$(id);
if(!button)return;

button.classList.toggle(
"active",
activeFilter===value
);

});
}

function setFilter(filter){

activeFilter=String(
filter||"ALL"
).toUpperCase();

updateFilterButtons();
render(latestData);
}

function setupSearch(){

const input=$("searchInput");
if(!input)return;

input.addEventListener(
"input",
()=>{
searchText=input.value
.trim()
.toUpperCase();

render(latestData);
}
);
}

function render(j){

if(!j)return;

latestData=j;

const markets=
Array.isArray(j.markets)
?j.markets
:[];

const status=j.status||{};

if($("coins")){
$("coins").textContent=markets.length;
}

if($("scan")){
$("scan").textContent=
status.last_scan||
status.updated||
j.last_scan||
"—";
}

if($("wave")){
$("wave").textContent=
j.settings?.wave_tf||
"—";
}

if($("tide")){
$("tide").textContent=
j.settings?.tide_tf||
"—";
}

if($("st")){
$("st").textContent=
status.message||
status.status||
"Connected";
}

const filtered=markets.filter(m=>{

const signal=String(
m.signal||
m.final_signal||
m.trade_signal||
"NEUTRAL"
).toUpperCase();

if(
activeFilter!=="ALL"&&
signal!==activeFilter
){
return false;
}

if(!searchText)return true;

const symbol=String(
m.symbol||""
).toUpperCase();

return symbol.includes(searchText);
});

const rows=$("rows");
if(!rows)return;

rows.innerHTML=filtered.map((m,i)=>{

const x=m.indicators||m;

const w=
x.wave||
x.wave_indicators||
m.wave||
m;

const ha=
x.ha||
x.heikin_ashi||
m.ha;

const sr=
x.sr||
x.support_resistance||
m.sr||
{};

const p=
x.trade_plan||
m.trade_plan||
{};

const s=String(
x.signal||
m.signal||
m.final_signal||
m.trade_signal||
"NEUTRAL"
).toUpperCase();

const conf=
x.confirmations??
x.confirmation??
m.confirmations??
m.confirmation;

const entry=
s!=="NEUTRAL"
?planValue(p.entry,"entry")
:"—";

const sl=
s!=="NEUTRAL"
?planValue(p.sl,"sl")
:"—";

const tp1=
s!=="NEUTRAL"
?planValue(p.tp1,"tp")
:"—";

const tp2=
s!=="NEUTRAL"
?planValue(p.tp2,"tp")
:"—";

const rr=
s!=="NEUTRAL"
?rrDisplay(p.rr)
:"—";

return`

<tr>

<td><strong>${i+1}</strong></td>

<td>
<span class="coin-name">
${m.symbol??"—"}
</span>
</td>

<td>
<strong>${f(m.price,10)}</strong>
</td>

<td>${formatChange(m.change)}</td>

<td>${f(m.volume,0)}</td>

<td>${m.volume_rank??"—"}</td>

<td>${f(m.oi,0)}</td>

<td>${j.settings?.wave_tf??"—"}</td>

<td>${j.settings?.tide_tf??"—"}</td>

<td>${f(x.tide9,8)}</td>

<td>${f(x.tide20,8)}</td>

<td>${rsiDisplay(w.rsi)}</td>

<td>${macdDisplay(w)}</td>

<td>${stochDisplay(w)}</td>

<td>${scoreBadge(x.score)}</td>

<td>${x.score_rank??"—"}</td>

<td>${signalBadge(s)}</td>

<td>${confirmationBadge(conf)}</td>

<td>${haDisplay(ha)}</td>

<td>
<span class="support">
${safeSR(sr.s2)}
</span>
</td>

<td>
<span class="support">
${safeSR(sr.s1)}
</span>
</td>

<td>
<span class="resistance">
${safeSR(sr.r1)}
</span>
</td>

<td>
<span class="resistance">
${safeSR(sr.r2)}
</span>
</td>

<td>${entry}</td>

<td>${sl}</td>

<td>${tp1}</td>

<td>${tp2}</td>

<td>${rr}</td>

</tr>
`;

}).join("");
}

async function loadInitial(){

try{

const response=
await fetch("/api/status");

if(!response.ok){
throw new Error(
`HTTP ${response.status}`
);
}

const data=
await response.json();

latestData=data;

if(data.settings){
fill(data.settings);
}else{
fill(DEFAULT_SETTINGS);
}

render(data);

}catch(e){

console.error(
"Initial API load failed:",
e
);

if($("st")){
$("st").textContent=
"API connection failed";
}
}
}

function connect(){

try{

const protocol=
location.protocol==="https:"
?"wss"
:"ws";

const url=
protocol+
"://"+
location.host+
"/ws";

socket=
new WebSocket(url);

socket.onopen=()=>{

console.log(
"Delta Cloud Scanner WebSocket connected"
);

if($("st")){
$("st").textContent=
"Delta WS connected";
}

if($("dot")){
$("dot").className=
"dot ok";
}
};

socket.onmessage=event=>{

try{

const data=
JSON.parse(event.data);

if(data&&data.type==="delta"){

if(!latestData){
return;
}

if(data.status){

latestData.status={
...(latestData.status||{}),
...data.status
};
}

if(data.settings){

latestData.settings=
data.settings;

fill(data.settings);
}

if(!Array.isArray(latestData.markets)){
latestData.markets=[];
}

const bySymbol=
new Map(
latestData.markets.map(m=>[
String(m.symbol),
m
])
);

if(Array.isArray(data.markets)){

data.markets.forEach(patch=>{

const symbol=
String(patch.symbol||"");

if(!symbol)return;

const existing=
bySymbol.get(symbol);

if(!existing){

latestData.markets.push(patch);
bySymbol.set(symbol,patch);
return;
}

Object.keys(patch).forEach(key=>{

if(
key==="indicators"&&
patch.indicators&&
typeof patch.indicators==="object"
){

existing.indicators=
patch.indicators;

}else{

existing[key]=patch[key];

}

});

});

}

if(
Array.isArray(data.removed)&&
data.removed.length
){

const removeSet=
new Set(
data.removed.map(String)
);

latestData.markets=
latestData.markets.filter(
m=>!removeSet.has(
String(m.symbol)
)
);
}

render(latestData);

}else{

render(data);

}

}catch(e){

console.error(
"WebSocket JSON error:",
e
);

}

};

socket.onerror=error=>{

console.error(
"WebSocket error:",
error
);

if(socket){
socket.close();
}

};

socket.onclose=()=>{

console.warn(
"WebSocket disconnected. Reconnecting..."
);

if($("st")){
$("st").textContent=
"Reconnecting...";
}

if($("dot")){
$("dot").className="dot";
}

if(reconnectTimer){
clearTimeout(reconnectTimer);
}

reconnectTimer=
setTimeout(
connect,
3000
);
};

}catch(e){

console.error(
"WebSocket connection failed:",
e
);

reconnectTimer=
setTimeout(
connect,
3000
);

}
}

updateFilterButtons();
setupSearch();
loadInitial();
connect();

window.save=save;
window.setFilter=setFilter;

console.log(
"%cDelta Cloud Scanner V4 - Professional Light Dashboard",
"color:#2563eb;font-size:16px;font-weight:800"
);

console.log(
"%cProfessional frontend + Search + Signal Filters loaded",
"color:#64748b;font-size:12px"
);
