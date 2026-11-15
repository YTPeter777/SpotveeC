
// ================= NPC greetings, now-playing chip, loading screen, performance panel =================
const NPCSAY={clerk:['歡迎光臨 AVÉRA！','需要幫忙嗎？設定裡可以重看新手教學喔','每天登入都會送 1000 枚代幣！'],snack:['要來點什麼嗎？按 E 排隊點餐','今天的珍珠奶茶特別好喝！','爆米花剛爆好喔～'],shoes:['打保齡球前記得換鞋！','四條球道都開放中','組隊可以全隊輪流打喔'],dj:['一起跳舞吧！','想點歌？到 1F 放映室打開點歌平板']};
const npcBub=new Map();
function npcTick(t){if(!document.body.classList.contains('playing'))return;for(const n of npcs){const lines=NPCSAY[n.kind];if(!lines)continue;const d=Math.hypot(n.a.position.x-me.x,n.a.position.z-me.z);let b=npcBub.get(n);
 if(!b){const e=document.createElement('div');e.className='npcb';e.hidden=true;document.body.append(e);b={e,until:0,cool:0};npcBub.set(n,b)}
 if(d<3.2&&Math.abs(n.a.position.y-me.y)<2&&t>b.cool){b.e.textContent=`${n.name}：${lines[Math.floor(Math.random()*lines.length)]}`;b.until=t+4.5;b.cool=t+25}
 const on=t<b.until;if(on){const s=toScreen(n.a.position.x,n.a.position.y+1.75,n.a.position.z);if(s){b.e.hidden=false;b.e.style.transform=`translate(${s[0].toFixed(0)}px,${s[1].toFixed(0)}px) translate(-50%,-100%)`}else b.e.hidden=true}else b.e.hidden=true}}
// now playing (top-left): what the room's TV is playing, who asked for it and how long is left
function fmtDur(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
setInterval(()=>{const el=$('nowp');if(!el)return;const on=!!YTS.v&&document.body.classList.contains('playing');el.hidden=!on;if(!on)return;
 $('nowp-t').textContent=YTS.title||'youtu.be/'+YTS.v;$('nowp-s').textContent=`${YTS.by} 點播 · ${YTS.d?'剩 '+fmtDur(YTS.d-ytNow()):(YTS.p?'播放中':'已暫停')}`},1000);
$('nowp').onclick=()=>openTV();
// entering a room: a short loading screen while the room connects and shaders warm up
async function roomLoading(name,work){const L=$('rload');$('rl-name').textContent=name;$('rl-step').textContent='連線到包廂…';L.hidden=false;L.classList.remove('out');const t0=performance.now();
 try{await work((s)=>{$('rl-step').textContent=s})}finally{const left=Math.max(0,900-(performance.now()-t0));await new Promise(r=>setTimeout(r,left));L.classList.add('out');setTimeout(()=>{L.hidden=true},380)}}
let warmed=false;function warmUp(){if(warmed)return;warmed=true;try{renderer.compile(scene,camera)}catch(e){}}
// performance panel
const PERF={on:store.get('perf',false),t:0};
function perfTick(){if(!PERF.on)return;const now=performance.now();if(now-PERF.t<500)return;PERF.t=now;const i=renderer.info,m=performance.memory;
 $('perf').innerHTML=`<b>${Math.round(NETH.fps)}</b><small>FPS</small><span>畫質 ${{ultra:'極致',high:'高',low:'省電'}[QUAL]}</span><span>繪製 ${i.render.calls}</span><span>三角形 ${(i.render.triangles/1000).toFixed(0)}k</span><span>貼圖 ${i.memory.textures}</span>${m?`<span>記憶體 ${(m.usedJSHeapSize/1048576).toFixed(0)} MB</span>`:''}<span>延遲 ${net.self??'—'} ms</span><span>解析度 ×${renderer.getPixelRatio().toFixed(2)}</span>`}
function setPerf(on){PERF.on=on;store.set('perf',on);$('perf').hidden=!on;$('t-perf')?.setAttribute('aria-pressed',on)}
setPerf(PERF.on);$('t-perf').onclick=()=>setPerf(!PERF.on);
