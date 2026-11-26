/* 阿錡拉老師的美術教案庫 — vanilla JS, no build step */
(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app = $('#app');
let LESSONS = [];
const MASTERWORKS = 'https://akila33-jpg.github.io/moving-art-class-masterworks/';
const AGE_ORDER = ['幼兒','兒童','青少年','成人','長輩'];
const DUR = [
  {k:'60 分鐘內', f:d=>d>0&&d<=60},
  {k:'約 90 分鐘', f:d=>d>60&&d<=100},
  {k:'約 2 小時', f:d=>d>100&&d<=120},
  {k:'多堂／3 小時以上', f:d=>d>120},
  {k:'未註明', f:d=>!d},
];
const GROUPS = [
  {key:'age', label:'年齡', get:l=>l.ages, order:AGE_ORDER},
  {key:'stu', label:'學生類別', get:l=>l.students},
  {key:'media', label:'媒材', get:l=>l.media},
  {key:'theme', label:'主題', get:l=>l.themes},
  {key:'season', label:'節令', get:l=>l.season},
  {key:'dur', label:'時長', get:l=>DUR.filter(x=>x.f(l.duration)).map(x=>x.k), order:DUR.map(x=>x.k)},
];

/* ---------- helpers ---------- */
function haystack(l){
  const parts=[l.id,l.title,l.subtitle,l.summary,l.unit,...l.ages,...l.students,...l.themes,...l.media,...l.season,...l.tags,l.series,
    ...l.goals,...l.materials,...l.steps.map(s=>s.t+' '+s.d),...l.adapt];
  l.sections.forEach(s=>{parts.push(s.h); s.rows.forEach(r=>parts.push(r.join(' ')));});
  return parts.join(' ').toLowerCase();
}
function setTitle(t){document.title = (t? t+'｜':'') + '阿錡拉老師的美術教案庫';}
function navActive(name){document.querySelectorAll('nav.main a').forEach(a=>{ if(a.dataset.nav===name) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });}
function art(l){
  if(l.cover) return `<div class="art" style="--c:${l.color}"><img src="${esc(l.cover)}" alt="" loading="lazy"></div>`;
  return `<div class="art gen" style="--c:${l.color}"><span class="big">${esc(l.title.replace(/^與(.+?)對談：/,'$1｜'))}</span></div>`;
}
function card(l){
  return `<a class="card reveal" href="#/lesson/${l.id}" style="--c:${l.color}">
    ${art(l)}${l.status==='新教案'?'<span class="badge">新教案</span>':l.status==='規劃中'?'<span class="badge">長期計畫</span>':''}
    <div class="body"><h3>${esc(l.title)}</h3>${l.subtitle?`<p class="sub">${esc(l.subtitle)}</p>`:''}
    <p class="sum">${esc(l.summary)}</p>
    <div class="pills"><span class="pill strong">${esc(l.durationText)}</span>${l.ages.slice(0,3).map(a=>`<span class="pill">${esc(a)}</span>`).join('')}${l.media.slice(0,2).map(a=>`<span class="pill">${esc(a)}</span>`).join('')}</div></div></a>`;
}
function featureMasterworks(){
  return `<a class="feature reveal" href="${MASTERWORKS}" target="_blank" rel="noopener">
    <div class="fx" aria-hidden="true"></div>
    <div class="ft"><p class="note" style="color:#e8c872;letter-spacing:.2em;margin:0 0 6px">精選課程網站</p>
    <h3>《移動的美術課》名作參考</h3>
    <p>朝陽、流水、原彩、樹影、暮色、星空——六個主題對照可查證的名作，以及六幅系列畫從構圖到打底的創作過程，給想學畫的人參考。</p>
    <span class="btn">開啟網站 ↗</span></div></a>`;
}
function observe(){
  const els=document.querySelectorAll('.reveal:not(.in)');
  if(!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(e=>e.classList.add('in'));return;}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -6% 0px'});
  els.forEach((e,i)=>{e.style.transitionDelay=Math.min(i%6,5)*60+'ms';io.observe(e);});
}
function countBy(get){const m=new Map();LESSONS.forEach(l=>get(l).forEach(v=>m.set(v,(m.get(v)||0)+1)));return m;}
function ordered(g){const m=countBy(g.get);let keys=[...m.keys()];
  if(g.order) keys.sort((a,b)=>(g.order.indexOf(a)+1||99)-(g.order.indexOf(b)+1||99)); else keys.sort((a,b)=>m.get(b)-m.get(a)||a.localeCompare(b,'zh-Hant'));
  return keys.map(k=>[k,m.get(k)]);}

/* ---------- views ---------- */
function home(){
  setTitle(''); navActive('home');
  const feat=LESSONS.filter(l=>l.featured);
  const stu=ordered(GROUPS[1]).slice(0,8);
  app.innerHTML=`<div class="view">
  <section class="hero wrap">
    <div class="eyebrow">AKILA 阿錡拉｜高雄特教美術</div>
    <h1>每個人都能<span class="hl">畫出自己的樣子</span></h1>
    <p class="lede">一位特教美術老師十多年的課堂筆記：給身心障礙朋友、長輩與孩子的美術教案，免費查詢、列印，也能直接投影上課。</p>
    <form class="bigsearch" role="search" id="hs"><label for="hq" class="skip">搜尋教案</label>
      <input id="hq" type="search" placeholder="想找什麼？例如：黏土、梵谷、長輩、新年…" autocomplete="off">
      <button class="btn accent" type="submit">找教案</button></form>
    <div class="quick"><span class="label">依年齡找</span>${ordered(GROUPS[0]).map(([k,n])=>`<a class="chip" href="#/find?age=${encodeURIComponent(k)}">${esc(k)}<span class="n">${n}</span></a>`).join('')}</div>
    <div class="quick"><span class="label">依學生類別找</span>${stu.map(([k,n])=>`<a class="chip" href="#/find?stu=${encodeURIComponent(k)}">${esc(k)}<span class="n">${n}</span></a>`).join('')}</div>
  </section>
  <section class="sec wrap">${featureMasterworks()}</section>
  <section class="sec wrap"><div class="sec-head"><div><h2>精選課程</h2><p>老師最常被問到、最適合第一次使用的教案。</p></div><a class="btn ghost" href="#/find">看全部 ${LESSONS.length} 份教案 →</a></div>
    <div class="grid">${feat.map(card).join('')}</div></section>
  <section class="sec wrap"><div class="sec-head"><div><h2>系列｜與藝術家對談</h2><p>梵谷、草間彌生、蒙德里安、北齋、畢卡索：把名畫拆成簡單的形狀與顏色。</p></div></div>
    <div class="grid">${LESSONS.filter(l=>l.series==='與藝術家對談'&&!l.featured).map(card).join('')}</div></section>
  <section class="sec wrap"><div class="block" style="--c:#2f5a34"><h2><span class="ic">✦</span>上課時怎麼用？</h2>
    <div class="two"><ul class="ticks"><li>用上方搜尋或「找教案」篩選年齡、學生類別、媒材。</li><li>打開教案頁，按「簡報模式」就能在電視或投影幕上一步一步翻頁。</li><li>簡報可用鍵盤方向鍵、簡報筆或點畫面左右側翻頁。</li></ul>
    <ul class="ticks"><li>按「列印／存成 PDF」帶紙本進教室。</li><li>網頁打開過一次後，沒有網路也能使用。</li><li>每份教案都附「調整方式」，可依學員能力增減。</li></ul></div></div></section>
  </div>`;
  $('#hs').addEventListener('submit',e=>{e.preventDefault();location.hash='#/find?q='+encodeURIComponent($('#hq').value.trim());});
  observe();
}

function parseQuery(qs){const p=new URLSearchParams(qs||'');const st={q:p.get('q')||''};GROUPS.forEach(g=>st[g.key]=p.getAll(g.key));return st;}
function toQuery(st){const p=new URLSearchParams();if(st.q)p.set('q',st.q);GROUPS.forEach(g=>st[g.key].forEach(v=>p.append(g.key,v)));const s=p.toString();return s?'?'+s:'';}
function find(qs){
  setTitle('找教案'); navActive('find');
  const st=parseQuery(qs);
  app.innerHTML=`<div class="view"><div class="findbar"><div class="wrap"><form class="bigsearch" role="search" id="fs"><label for="fq" class="skip">搜尋</label>
    <input id="fq" type="search" value="${esc(st.q)}" placeholder="搜尋標題、媒材、步驟、藝術家…" autocomplete="off"><button class="btn accent" type="submit">搜尋</button></form></div></div>
    <div class="wrap"><div class="filters" id="filters"></div>
    <div class="resultline"><b id="count" aria-live="polite"></b><button class="btn ghost" id="clear" type="button">清除篩選</button></div>
    <div class="grid" id="results"></div></div></div>`;
  const render=()=>{
    $('#filters').innerHTML=GROUPS.map(g=>`<div class="fgroup" role="group" aria-label="${g.label}"><b>${g.label}</b>${ordered(g).map(([k,n])=>`<button type="button" class="chip" data-g="${g.key}" data-v="${esc(k)}" aria-pressed="${st[g.key].includes(k)}">${esc(k)}<span class="n">${n}</span></button>`).join('')}</div>`).join('');
    const words=st.q.toLowerCase().split(/\s+/).filter(Boolean);
    const res=LESSONS.filter(l=>words.every(w=>l._h.includes(w)) && GROUPS.every(g=>!st[g.key].length || g.get(l).some(v=>st[g.key].includes(v))));
    $('#count').textContent=`找到 ${res.length} 份教案`;
    $('#results').innerHTML=res.length?res.map(card).join(''):`<div class="empty"><h3>沒有符合的教案</h3><p>試試少選一個條件，或換個關鍵字。</p></div>`;
    observe();
  };
  const sync=()=>{history.replaceState(null,'','#/find'+toQuery(st));render();};
  $('#filters').addEventListener('click',e=>{const b=e.target.closest('button[data-g]');if(!b)return;const a=st[b.dataset.g],v=b.dataset.v;const i=a.indexOf(v);i>=0?a.splice(i,1):a.push(v);sync();});
  $('#fs').addEventListener('submit',e=>{e.preventDefault();st.q=$('#fq').value.trim();sync();});
  let t;$('#fq').addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>{st.q=$('#fq').value.trim();sync();},220);});
  $('#clear').addEventListener('click',()=>{st.q='';GROUPS.forEach(g=>st[g.key]=[]);$('#fq').value='';sync();});
  render();
}

function rowsHTML(rows){
  let out='',tbl=[];
  const flush=()=>{if(tbl.length){out+=`<table class="tb">${tbl.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`;tbl=[];}};
  rows.forEach(r=>{if(r.length>1)tbl.push(r);else{flush();out+=`<p>${esc(r[0])}</p>`;}});flush();return out;
}
function lesson(id){
  const l=LESSONS.find(x=>x.id===id); if(!l) return notFound();
  setTitle(l.title); navActive('find');
  const facts=[['適用年齡',l.ages.join('、')],['學生類別',l.students.join('、')],['時長',l.durationText],['媒材',l.media.join('、')],['主題',l.themes.join('、')],['節令',l.season.join('、')],['適用單位',l.unit]];
  app.innerHTML=`<div class="view" style="--c:${l.color}">
  <header class="lhero"><div class="wrap"><div class="crumb"><a href="#/find">← 找教案</a></div>
    <h1>${esc(l.title)}</h1>${l.subtitle?`<p class="sub">${esc(l.subtitle)}</p>`:''}<p class="sum">${esc(l.summary)}</p>
    <div class="pills">${l.tags.map(t=>`<a class="pill" href="#/find?q=${encodeURIComponent(t)}">#${esc(t)}</a>`).join('')}</div>
    <div class="actions"><a class="btn" href="#/present/${l.id}">▶ 簡報模式</a><button class="btn ghost" id="print" type="button">列印／存成 PDF</button></div></div></header>
  <div class="wrap">
    <div class="factgrid">${facts.map(([k,v])=>`<div class="fact"><b>${k}</b><span>${esc(v||'—')}</span></div>`).join('')}</div>
    <div class="two">
      <section class="block"><h2><span class="ic">◎</span>課程目標</h2><ul class="ticks">${l.goals.map(g=>`<li>${esc(g)}</li>`).join('')||'<li>見完整教案</li>'}</ul></section>
      <section class="block"><h2><span class="ic">✎</span>媒材清單</h2><ul class="ticks">${l.materials.map(g=>`<li>${esc(g)}</li>`).join('')||'<li>見完整教案</li>'}</ul></section>
    </div>
    <section class="block"><h2><span class="ic">➜</span>步驟</h2><ol class="steps">${l.steps.map(s=>s.head?`<li class="head">${esc(s.t)}</li>`:`<li>${s.t?`<span class="t">${esc(s.t)}</span><br>`:''}${esc(s.d)}</li>`).join('')}</ol></section>
    ${l.diagram?`<section class="block"><h2><span class="ic">▦</span>步驟圖</h2><img class="diagram" src="${esc(l.diagram)}" alt="${esc(l.title)} 步驟圖（老師自製教學圖）" loading="lazy"></section>`:''}
    ${l.adapt.length?`<section class="block"><h2><span class="ic">♡</span>調整方式</h2><ul class="ticks">${l.adapt.map(g=>`<li>${esc(g)}</li>`).join('')}</ul></section>`:''}
    ${l.handouts.length?`<section class="block"><h2><span class="ic">⎙</span>講義與教材</h2><div class="photos">${l.handouts.map(h=>`<figure style="margin:0"><img class="diagram" src="${esc(h.src)}" alt="${esc(h.label)}" loading="lazy"><figcaption class="note">${esc(h.label)}</figcaption></figure>`).join('')}</div></section>`:''}
    <section class="block"><h2><span class="ic">❀</span>成果照片</h2>${l.photos.length?`<div class="photos">${l.photos.map(p=>`<figure style="margin:0"><img class="diagram" src="images/${l.id}/${esc(p.file)}" alt="${esc(p.alt||p.caption||'作品照片')}" loading="lazy">${p.caption?`<figcaption class="note">${esc(p.caption)}</figcaption>`:''}</figure>`).join('')}</div>`:`<div class="placeholder">成果照片整理中。照片只會放作品本身，經機構與家長同意、看不到臉和名字後才上架。</div>`}</section>
    <section class="block full"><h2><span class="ic">☰</span>完整教案內容</h2>${l.sections.map(s=>`<details><summary>${esc(s.h)}</summary>${rowsHTML(s.rows)}</details>`).join('')||'<p class="note">本教案的重點已整理在上方。</p>'}</section>
    ${l.refs.length?`<section class="block"><h2><span class="ic">↗</span>參考來源</h2><ul class="clean">${l.refs.map(r=>`<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.label)}</a></li>`).join('')}</ul><p class="note">公有領域作品連到開放典藏；仍受著作權保護的作品只連到官方網站，本站不放作品圖片。</p></section>`:''}
    ${l.notes?`<p class="note">${esc(l.notes)}</p>`:''}
    <p class="note">教案編號 ${l.id}｜建檔 ${esc(l.date)}｜設計：Akila 阿錡拉</p>
  </div></div>`;
  $('#print').addEventListener('click',()=>{document.querySelectorAll('details').forEach(d=>d.open=true);window.print();});
  window.scrollTo(0,0); observe();
}

function records(){
  setTitle('課程紀錄'); navActive('records');
  const by={};LESSONS.forEach(l=>(by[l.date]=by[l.date]||[]).push(l));
  const months=Object.keys(by).sort().reverse();
  app.innerHTML=`<div class="view wrap sec"><h1>課程紀錄</h1><p class="prose">依教案建檔月份排列，最新的在最上面。每份教案都會在課後補上去識別化的觀察與作品照片。</p>
  <div class="tl">${months.map(m=>`<div class="m reveal"><h3>${m.replace('-',' 年 ')} 月</h3><div class="items">${by[m].map(l=>`<a class="it" href="#/lesson/${l.id}" style="--c:${l.color}"><span class="dot"></span><span><b>${esc(l.title)}</b><br><span class="note">${esc(l.unit)}｜${esc(l.durationText)}</span></span><small>${l.id}</small></a>`).join('')}</div></div>`).join('')}</div></div>`;
  observe();
}

function resources(){
  setTitle('教學資源'); navActive('resources');
  const refs=[];const seen=new Set();LESSONS.forEach(l=>l.refs.forEach(r=>{if(!seen.has(r.url)){seen.add(r.url);refs.push({...r,l});}}));
  const toolbox=(LESSONS.find(l=>l.id==='L003')||{sections:[]}).sections.find(s=>s.h.includes('工具箱'));
  app.innerHTML=`<div class="view wrap sec"><h1>教學資源</h1><p class="prose">課堂上會用到的網站、繪本、材料與教具，整理在這裡。</p>
  <section class="sec">${featureMasterworks()}</section>
  <section class="block reveal" style="--c:#6b4aa0"><h2><span class="ic">❑</span>繪本清單</h2><ul class="ticks">
    <li><b>十二生肖立體書</b>（老師自備）— 搭配 <a href="#/lesson/L017">彩虹刮畫十二生肖</a>：老師翻頁，大家一起找生肖、學動物的聲音與動作。</li>
    <li><b>生命故事書</b>（長輩自己的書）— 搭配 <a href="#/lesson/R004">生命故事書計畫</a>：一頁頁留下長輩的話與作品。</li></ul>
    <p class="note">之後分享的繪本會陸續補上書名與適用課程。</p></section>
  <section class="block reveal" style="--c:#2f5a34"><h2><span class="ic">✂</span>材料與教具</h2>
    <div class="two"><ul class="ticks"><li><b>加粗筆桿與握式筆套</b>：手部控制較弱時使用。</li><li><b>海綿刷、滾筒、印章（瓶蓋、軟木塞）</b>：大面積塗色、蓋印。</li><li><b>紙膠帶、止滑墊、斜面畫板</b>：固定紙張。</li><li><b>預剪零件盒</b>：一次只發當下需要的零件。</li></ul>
    <ul class="ticks"><li><b>顏色卡、心情卡、二選一圖卡</b>：讓不用口語的學員也能選擇與表達。</li><li><b>規則圖卡與星星表</b>：見 <a href="#/lesson/L012">彩繪花盆</a>。</li><li><b>鈍口刮棒、活動眼睛替代品</b>：見 <a href="#/lesson/L017">彩虹刮畫</a>的安全提醒。</li><li><b>計時器或沙漏</b>：把步驟拆小。</li></ul></div></section>
  ${toolbox?`<section class="block reveal"><h2><span class="ic">♡</span>通用能力調整工具箱</h2>${rowsHTML(toolbox.rows)}</section>`:''}
  <section class="block reveal"><h2><span class="ic">↗</span>名作與參考連結</h2><ul class="clean">${refs.map(r=>`<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.label)}</a> <span class="note">— ${esc(r.l.title)}</span></li>`).join('')}</ul>
    <p class="note">著作權說明：公有領域或開放授權的作品才放圖片；仍受保護的作品（例如草間彌生、波特羅）只提供官方網站連結。</p></section></div>`;
  observe();
}

function parents(){
  setTitle('家長專區'); navActive('parents');
  app.innerHTML=`<div class="view wrap sec prose"><h1>家長專區</h1>
  <p>這裡的教案都是老師在課堂上實際使用、或為特定班級設計的美術課。您可以用它來了解孩子或家人在美術課做了什麼，也可以挑一兩堂在家一起做。</p>
  <h2>在家一起做的小建議</h2><ul class="clean"><li>先看教案頁的「媒材清單」，家裡有的材料就可以替代。</li><li>從「60 分鐘內」或「黏土」類的教案開始，比較好準備。</li><li>一次只說一個步驟，可以打開「簡報模式」放在電視上一起看。</li><li>作品不需要「像」範例，讓他自己選顏色、選位置，就是最好的作品。</li></ul>
  <h2>照片與隱私</h2><div class="callout"><p>本站<b>不放學員的臉、名字或任何可辨識的資料</b>。教案中的班級與機構一律改寫成一般說法（例如「長輩據點」「兒童美術班」）。</p><p style="margin:0">成果照片只放作品本身，經機構與家長同意後才會上架。若您發現任何不妥，請透過老師或機構聯絡，我們會立即撤下。</p></div>
  <h2>美術課是什麼樣的課？</h2><p>這是藝術陪伴與創作課程：重點是動手、選擇、表達與分享，不是醫療或能力評量。每份教案都附「調整方式」，讓不同能力的人都能參與。</p>
  <p><a class="btn" href="#/find?dur=60%20%E5%88%86%E9%90%98%E5%85%A7">找 60 分鐘內的教案 →</a></p></div>`;
}

function about(){
  setTitle('關於阿錡拉老師'); navActive('about');
  app.innerHTML=`<div class="view wrap sec prose"><h1>關於阿錡拉老師</h1>
  <p><b>Akila 阿錡拉（楊忠錡）</b>，高雄的藝術家與美術老師。自 2011 年起以「阿錡拉」為名創作與教學，長期在身心障礙機構、長輩據點與兒童美術班上課。</p>
  <div class="callout"><p style="margin:0">「生活即美育」——美不只在美術館裡，也在每天往返教室的路上：清晨的光、河邊的風、傍晚的雲。</p></div>
  <h2>創作</h2><p>系列作品《移動的美術課》是六幅 30 號壓克力風景畫：朝陽、流水、原彩、樹影、暮色、星空，畫的是在不同教室之間移動時看見的光與風景，將於 2026 年 12 月 2 日至 27 日在岡山文化中心《蛻變》聯展展出。</p>
  <p><a class="btn ghost" href="${MASTERWORKS}" target="_blank" rel="noopener">《移動的美術課》名作參考網站 ↗</a></p>
  <h2>這個網站</h2><p>把老師多年的教案整理成大家都能用的資源：老師、陪同人員、家長都可以搜尋、列印，或直接在教室電視上投影。教案會持續增加。</p>
  <h2>聯絡</h2><p>社群帳號：<b>akila_art</b>。課程合作請透過社群帳號私訊。</p></div>`;
}

/* ---------- presenter ---------- */
function present(id){
  const l=LESSONS.find(x=>x.id===id); if(!l) return notFound();
  setTitle('簡報｜'+l.title);
  const S=[];
  S.push(`<div class="k">美術課｜${esc(l.durationText)}</div><h1>${esc(l.title)}</h1>${l.subtitle?`<p>${esc(l.subtitle)}</p>`:''}`);
  if(l.goals.length) S.push(`<div class="k">今天我們要</div><ul>${l.goals.slice(0,4).map(g=>`<li>${esc(g)}</li>`).join('')}</ul>`);
  if(l.materials.length) S.push({light:true,h:`<div class="k">準備材料</div><h2>今天的材料</h2><ul class="${l.materials.length>5?'cols':''}" style="font-size:clamp(20px,2.6vw,46px)">${l.materials.slice(0,12).map(g=>`<li>${esc(g.replace(/（.*?）/g,''))}</li>`).join('')}</ul>`});
  let n=0;
  l.steps.forEach(s=>{
    if(s.head){S.push(`<div class="k">接下來</div><h1>${esc(s.t)}</h1>`);return;}
    n++;
    const big=s.d.length>90?'font-size:clamp(20px,2.6vw,44px)':'';
    S.push({light:true,h:`<div class="row"><div class="num" style="color:${l.color}">${n}</div><div>${s.t?`<span class="tchip">${esc(s.t)}</span>`:''}<p style="${big}">${esc(s.d)}</p></div></div>`});
  });
  if(l.diagram) S.push({light:true,h:`<img class="full" src="${esc(l.diagram)}" alt="步驟圖">`});
  S.push(`<div class="k">分享時間</div><h1>完成了！</h1><p>說說看：你最喜歡作品的哪裡？</p>`);
  const deck=document.createElement('div');deck.className='deck';deck.setAttribute('role','dialog');deck.setAttribute('aria-label','簡報模式');
  deck.innerHTML=`<div class="prog"><i></i></div><div class="stage">${S.map((s,i)=>{const o=typeof s==='string'?{h:s}:s;return `<section class="slide ${o.light?'light':''}" style="--c:${l.color}" aria-hidden="true">${o.h}</section>`;}).join('')}<div class="hint">← → 方向鍵、簡報筆或點畫面左右翻頁｜F 全螢幕｜Esc 離開</div></div>
  <div class="bar"><button type="button" data-a="x">✕ 離開</button><button type="button" data-a="p">◀ 上一頁</button><button type="button" data-a="n">下一頁 ▶</button><button type="button" data-a="f">全螢幕</button><span class="pos"></span></div>`;
  document.body.appendChild(deck);document.body.style.overflow='hidden';
  const slides=[...deck.querySelectorAll('.slide')];let i=0;
  const show=k=>{i=Math.max(0,Math.min(slides.length-1,k));slides.forEach((s,j)=>{s.classList.toggle('on',j===i);s.classList.toggle('prev',j<i);s.setAttribute('aria-hidden',j!==i);});
    deck.querySelector('.pos').textContent=`${i+1} / ${slides.length}`;deck.querySelector('.prog i').style.width=((i+1)/slides.length*100)+'%';};
  const close=()=>{document.removeEventListener('keydown',key);if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});deck.remove();document.body.style.overflow='';location.hash='#/lesson/'+l.id;};
  const fs=()=>{if(document.fullscreenElement)document.exitFullscreen();else deck.requestFullscreen&&deck.requestFullscreen().catch(()=>{});};
  const key=e=>{const k=e.key;
    if(['ArrowRight','PageDown',' ','Enter','ArrowDown','n'].includes(k)){e.preventDefault();show(i+1);}
    else if(['ArrowLeft','PageUp','ArrowUp','Backspace','p'].includes(k)){e.preventDefault();show(i-1);}
    else if(k==='Home')show(0); else if(k==='End')show(slides.length-1);
    else if(k==='f'||k==='F')fs(); else if(k==='Escape'&&!document.fullscreenElement)close();};
  document.addEventListener('keydown',key);
  deck.querySelector('.stage').addEventListener('click',e=>{const r=e.currentTarget.getBoundingClientRect();(e.clientX-r.left)<r.width/3?show(i-1):show(i+1);});
  let x0=null;deck.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;},{passive:true});
  deck.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>50)show(dx<0?i+1:i-1);x0=null;});
  deck.querySelector('.bar').addEventListener('click',e=>{const a=e.target.dataset.a;if(a==='x')close();if(a==='p')show(i-1);if(a==='n')show(i+1);if(a==='f')fs();});
  setTimeout(()=>{const h=deck.querySelector('.hint');if(h)h.style.opacity=0;},4000);
  window._deckClose=()=>{document.removeEventListener('keydown',key);deck.remove();document.body.style.overflow='';};
  show(0);
}

function notFound(){app.innerHTML=`<div class="view wrap sec"><h1>找不到這一頁</h1><p><a href="#/">回首頁</a></p></div>`;}

/* lightbox for diagrams */
document.addEventListener('click',e=>{const img=e.target.closest('img.diagram');if(!img)return;const lb=document.createElement('div');lb.className='lb';lb.innerHTML=`<img src="${img.src}" alt="${esc(img.alt)}">`;lb.addEventListener('click',()=>lb.remove());document.body.appendChild(lb);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const lb=$('.lb');if(lb)lb.remove();}});
window.addEventListener('beforeprint',()=>document.querySelectorAll('details').forEach(d=>d.open=true));

/* ---------- router ---------- */
function route(){
  if(window._deckClose && !location.hash.startsWith('#/present/')){window._deckClose();window._deckClose=null;}
  const h=location.hash.replace(/^#/,'')||'/';
  const [path,qs]=h.split('?');
  const seg=path.split('/').filter(Boolean);
  if(!seg.length) home();
  else if(seg[0]==='find') find(qs);
  else if(seg[0]==='lesson') lesson(seg[1]);
  else if(seg[0]==='present'){ if(!$('#app .lhero')) lesson(seg[1]); present(seg[1]); return; }
  else if(seg[0]==='records') records();
  else if(seg[0]==='resources') resources();
  else if(seg[0]==='parents') parents();
  else if(seg[0]==='about') about();
  else notFound();
  if(seg[0]!=='find') window.scrollTo({top:0});
}
fetch('data/lessons.json').then(r=>r.json()).then(d=>{LESSONS=d;LESSONS.forEach(l=>l._h=haystack(l));window.addEventListener('hashchange',route);route();})
  .catch(()=>{app.innerHTML='<div class="wrap sec"><h1>資料載入失敗</h1><p>請重新整理頁面。</p></div>';});
if('serviceWorker' in navigator && location.protocol==='https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
