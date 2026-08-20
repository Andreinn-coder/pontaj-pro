const $=x=>document.getElementById(x),KEY="pontaj_pro_v2",MS=["Ian","Feb","Mar","Apr","Mai","Iun","Iul","Aug","Sep","Oct","Nov","Dec"];
let S={profile:{first:"",last:"",age:"",net:0,daily:8,weekly:40,leave:21,otWeek:175,otWeekend:200,weekendPremium:0,currency:"lei"},days:{},months:{}},D=new Date(),selected="";
D.setDate(1);
try{let x=JSON.parse(localStorage.getItem(KEY));if(x)S={...S,...x,profile:{...S.profile,...x.profile}}}catch{}
const save=()=>localStorage.setItem(KEY,JSON.stringify(S)),key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,date=k=>{let a=k.split("-").map(Number);return new Date(a[0],a[1]-1,a[2])},fmt=n=>new Intl.NumberFormat("ro-RO",{maximumFractionDigits:2}).format(n),isWE=d=>[0,6].includes(d.getDay());
function wd(y,m){let n=0;for(let i=1;i<=new Date(y,m+1,0).getDate();i++)if(!isWE(new Date(y,m,i)))n++;return n}
function hours(v){if(!v.start||!v.end)return +v.hours||0;let [a,b]=[v.start,v.end].map(x=>x.split(":").map(Number)),h=(b[0]+b[1]/60)-(a[0]+a[1]/60)-(+v.break||0);return Math.max(0,h)}
function stats(y,m){
  const p=`${y}-${String(m+1).padStart(2,"0")}-`;
  const s={days:0,hours:0,ot:0,co:0,cm:0,abs:0,bonus:0,otPay:0,cmPay:0};
  Object.entries(S.days).forEach(([k,v])=>{
    if(!k.startsWith(p)) return;
    if(v.type==="work"){s.days++;s.hours+=hours(v);s.ot+=Number(v.ot)||0;s.bonus+=Number(v.dayBonus)||0;}
    if(v.type==="co") s.co++;
    if(v.type==="cm"){s.cm++;s.cmPay+=(Number(v.cmPct)||0)/100;}
    if(v.type==="absent") s.abs++;
  });
  s.norm=wd(y,m)*(Number(S.profile.daily)||8);
  s.rate=s.norm?(Number(S.profile.net)||0)/s.norm:0;
  s.normal=Math.max(0,s.hours-s.ot);
  Object.entries(S.days).forEach(([k,v])=>{
    if(!k.startsWith(p)||v.type!=="work") return;
    const d=date(k), ratePct=isWE(d)?Number(S.profile.otWeekend):Number(S.profile.otWeek);
    s.otPay+=(Number(v.ot)||0)*s.rate*ratePct/100;
  });
  const extra=S.months[p.slice(0,7)]||{};
  s.net=s.normal*s.rate+s.otPay+s.co*s.rate*(Number(S.profile.daily)||8)+s.cmPay*s.rate*(Number(S.profile.daily)||8)+s.bonus+(Number(extra.bonus)||0)-(Number(extra.deductions)||0);
  return s;
}
function render(){let y=D.getFullYear(),m=D.getMonth(),s=stats(y,m);$("period").textContent=`${MS[m]} ${y}`;$("hello").textContent=`${S.profile.first||"Utilizator"} ${S.profile.last||""}`;$("mDays").textContent=s.days;$("mHours").textContent=fmt(s.hours);$("mOT").textContent=fmt(s.ot);$("mNet").textContent=fmt(s.net)+" "+S.profile.currency;$("monthlyList").innerHTML=[["Normă lunară",fmt(s.norm)+" h"],["Ore normale",fmt(s.normal)+" h"],["Ore suplimentare",fmt(s.ot)+" h"],["CO",s.co+" zile"],["CM",s.cm+" zile"],["Absențe",s.abs+" zile"],["Tarif orar estimat",fmt(s.rate)+" "+S.profile.currency],["Plată OT",fmt(s.otPay)+" "+S.profile.currency]].map(x=>`<div><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("");$("alerts").innerHTML=(s.ot>40?'<div class="alert">⚠️ Ai peste 40 de ore suplimentare în această lună.</div>':"")+((+S.profile.leave-statsYear(y).co)<=3?'<div class="alert">🏖️ Mai ai puține zile de CO disponibile.</div>':"")+(!S.profile.net?'<div class="alert">💡 Completează salariul net din Setări.</div>':"")||'<div class="alert">✅ Nu există alerte.</div>';renderCal();renderYear();loadMonthInputs()}
function renderCal(){let c=$("cal");c.innerHTML="";let y=D.getFullYear(),m=D.getMonth(),off=(new Date(y,m,1).getDay()+6)%7;for(let i=0;i<off;i++)c.innerHTML+='<div></div>';for(let n=1;n<=new Date(y,m+1,0).getDate();n++){let d=new Date(y,m,n),k=key(d),v=S.days[k],b=document.createElement("button");b.className=`day ${v?.type||""} ${k===key(new Date())?"today":""}`;let l={work:"Lucrat",co:"CO",cm:"CM",absent:"Absent",holiday:"Sărbătoare",free:"Liber"}[v?.type]||"";b.innerHTML=`<strong>${n}</strong>${l?`<small>${l}</small>`:""}${v?.type==="work"?`<small>${fmt(hours(v))}h${v.ot?` +${fmt(v.ot)}`:""}</small>`:""}`;b.onclick=()=>openDay(k);c.appendChild(b)}}
function statsYear(y){let z={days:0,hours:0,ot:0,co:0,cm:0};Object.entries(S.days).forEach(([k,v])=>{if(!k.startsWith(y+"-"))return;if(v.type==="work"){z.days++;z.hours+=hours(v);z.ot+=+v.ot||0}if(v.type==="co")z.co++;if(v.type==="cm")z.cm++});return z}
function renderYear(){let y=D.getFullYear(),z=statsYear(y);$("year").textContent=y;$("yearCards").innerHTML=[["Zile lucrate",z.days],["Ore",fmt(z.hours)],["OT",fmt(z.ot)],["CO",z.co],["CM",z.cm],["CO rămase",Math.max(0,(+S.profile.leave||0)-z.co)]].map(x=>`<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join("");$("months").innerHTML=Array.from({length:12},(_,m)=>{let s=stats(y,m);return `<div class="monthbox"><b>${MS[m]}</b><span>${s.days} zile • ${fmt(s.hours)}h</span><br><strong>${fmt(s.net)} ${S.profile.currency}</strong></div>`}).join("")}
function openDay(k){selected=k;let v=S.days[k]||{type:"work",start:"09:00",end:"17:00",break:.0,ot:0,cmPct:75,dayBonus:0,note:""};$("modalTitle").textContent=date(k).toLocaleDateString("ro-RO",{weekday:"long",day:"numeric",month:"long"});["type","start","end","break","ot","cmPct","dayBonus","note"].forEach(id=>$(id).value=v[id]??"");$("rateHint").textContent=`OT pentru această zi: ${isWE(date(k))?S.profile.otWeekend:S.profile.otWeek}%`;show("modal")}
function show(id){$(id).classList.remove("hidden")}function hide(id){$(id).classList.add("hidden")}
$("save").onclick=()=>{S.days[selected]={type:$("type").value,start:$("start").value,end:$("end").value,break:+$("break").value||0,ot:+$("ot").value||0,cmPct:+$("cmPct").value||0,dayBonus:+$("dayBonus").value||0,note:$("note").value};save();hide("modal");render()};
$("delete").onclick=()=>{delete S.days[selected];save();hide("modal");render()};$("close").onclick=()=>hide("modal");$("settings").onclick=()=>openSettings();document.querySelector(".closeSettings").onclick=()=>hide("settingsModal");
function openSettings(){let p=S.profile;["first","last","age","net","daily","weekly","leave","otWeek","otWeekend","weekendPremium","currency"].forEach(id=>$(id).value=p[id]??"");show("settingsModal")}
$("saveSettings").onclick=()=>{["first","last","currency"].forEach(id=>S.profile[id]=$(id).value);["age","net","daily","weekly","leave","otWeek","otWeekend","weekendPremium"].forEach(id=>S.profile[id]=Number($(id).value)||0);save();hide("settingsModal");render()};
$("prev").onclick=$("prev2").onclick=()=>{D.setMonth(D.getMonth()-1);render()};$("next").onclick=$("next2").onclick=()=>{D.setMonth(D.getMonth()+1);render()};$("today").onclick=()=>{D=new Date();D.setDate(1);render()};
function monthKey(){return `${D.getFullYear()}-${String(D.getMonth()+1).padStart(2,"0")}`}
function loadMonthInputs(){let x=S.months[monthKey()]||{};$("bonus").value=x.bonus||0;$("deductions").value=x.deductions||0;$("dailyAllowance").value=x.dailyAllowance||0;$("nightHours").value=x.nightHours||0;$("nightRate").value=x.nightRate||25;let s=stats(D.getFullYear(),D.getMonth());$("salaryBreakdown").innerHTML=[["Salariu bază estimat",fmt(s.normal*s.rate)],["OT",fmt(s.otPay)],["CO",fmt(s.co*s.rate*S.profile.daily)],["CM",fmt(s.cmPay*s.rate*S.profile.daily)],["Bonusuri",fmt(s.bonus)],["Rețineri",fmt(-(x.deductions||0))],["TOTAL NET ESTIMAT",fmt(s.net)]].map(x=>`<div><span>${x[0]}</span><strong>${x[1]} ${S.profile.currency}</strong></div>`).join("")}
$("saveMonth").onclick=()=>{S.months[monthKey()]={bonus:+$("bonus").value||0,deductions:+$("deductions").value||0,dailyAllowance:+$("dailyAllowance").value||0,nightHours:+$("nightHours").value||0,nightRate:+$("nightRate").value||0};save();render();alert("Parametrii lunii au fost salvați.")};
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab").forEach(x=>x.classList.add("hidden"));b.classList.add("active");$(b.dataset.tab).classList.remove("hidden");if(b.dataset.tab==="salary")loadMonthInputs()});
if(!S.profile.first&&!S.profile.net)setTimeout(openSettings,200);render();