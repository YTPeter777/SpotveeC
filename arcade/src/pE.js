
// ================= economy: coins to play, daily bonus, leaderboards, anti-cheat =================
const GAME_COST={snake:10,stack:10,mole:10,brick:10,claw:30,coin:10,racer:15,hoops:15,hockey:15,dance:15,c4:10,grip:10,bowl:30};
const CPU_FREE=5;// CPU games per day that count for score/rewards; later ones still cost coins but are unscored
const SCORE_CAP={snake:4,stack:3,mole:5,brick:60,claw:1.2,coin:25,racer:140,hoops:8,dance:45,hockey:1,c4:1,grip:250,bowl:20};
function cpuCount(){const d=new Date().toDateString(),c=store.get('cpuc',{d:'',n:0});return c.d===d?c.n:0}
function cpuInc(){store.set('cpuc',{d:new Date().toDateString(),n:cpuCount()+1})}
async function spendCoins(game,n){if(BK.mode==='supa'){const r=await rpc('avera_spend',{p_secret:BK.secret,p_game:game});if(r.ok)ACC.coins=r.coins;return r}
 const cur=(await dget('players/'+BK.uid))||{};const c=cur.coins??ACC.coins;if(c<n)return{error:'coins'};ACC.coins=c-n;await dupd('players/'+BK.uid,{coins:ACC.coins});return{ok:true,coins:ACC.coins}}
let payBusy=false;
async function payGate(game,go){if(payBusy)return;if(!featureOn('games')&&game!=='bowl'||game==='bowl'&&!featureOn('bowling')){notify({tone:'warn',icon:'gear',text:'這項設施目前維護中',ms:3000});return}
 const c=GAME_COST[game]??10;if((ACC.coins|0)<c){notify({key:'nocoin',tone:'err',icon:'coin',title:'代幣不足',text:`這台需要 ${c} 代幣，你目前有 ${ACC.coins|0}。每天登入送 1000 枚，也可以玩別的遊戲賺。`,ms:5500});sfx('lose');return}
 payBusy=true;const r=await spendCoins(game,c).finally(()=>payBusy=false);if(r.error){notify({tone:'err',icon:'coin',text:r.error==='coins'?'代幣不足':'扣款失敗，請稍後再試',ms:3000});return}
 notify({key:'coins',tone:'info',icon:'coin',text:`投幣 ${c}（剩 ${ACC.coins}）`,ms:1800,quiet:true});sfx('coin');AC.reset();go()}
// ---- anti-cheat: input rhythm and score plausibility ----
const AC={taps:[],t0:0,reset(){this.taps=[];this.t0=performance.now()},tap(){const n=performance.now();this.taps.push(n);if(this.taps.length>400)this.taps.shift()},
 verdict(game,score){const dur=Math.max(1,(performance.now()-this.t0)/1000);const t=this.taps;let maxSec=0;for(let i=0,j=0;i<t.length;i++){while(t[i]-t[j]>1000)j++;maxSec=Math.max(maxSec,i-j+1)}
  let regular=false;if(t.length>=30){const iv=[];for(let i=1;i<t.length;i++)iv.push(t[i]-t[i-1]);const m=iv.reduce((a,b)=>a+b,0)/iv.length,sd=Math.sqrt(iv.reduce((a,b)=>a+(b-m)**2,0)/iv.length);regular=sd<4&&m<120}
  const rate=score/dur,cap=(SCORE_CAP[game]||50)*1.5;const why=maxSec>=18?'autoclick':regular?'bot_rhythm':rate>cap?'impossible_score':'';return{why,maxSec,rate:+rate.toFixed(2),dur:+dur.toFixed(1),taps:t.length}}};
addEventListener('pointerdown',()=>{if(me.mode==='cab'||me.mode==='bowl')AC.tap()},true);addEventListener('keydown',e=>{if(!e.repeat&&(me.mode==='cab'||me.mode==='bowl'))AC.tap()},true);
async function flagCheat(game,score,v){const data={game,score,...v,room:ROOM.id};if(BK.mode==='supa')rpc('avera_flag',{p_secret:BK.secret,p_kind:'cheat',p_data:data});else{const cur=(await dget('reports/'+BK.uid))||{items:[]};const items=[...(cur.items||[]),{id:rhex(4),kind:'cheat',target:ACC.name,body:`系統偵測：${v.why}（${game} ${score} 分）`,ctx:data,t:Date.now(),status:'open',name:ACC.name}].slice(-30);dset('reports/'+BK.uid,{items,name:ACC.name})}}
// rewards + leaderboard, only for clean, scored plays
async function submitScore(game,score){if(BK.mode==='supa'){rpc('avera_score',{p_secret:BK.secret,p_game:game,p_score:score|0});return}
 const ref='lb/'+game,cur=(await dget(ref))||{top:[]};const me0={id:BK.uid,n:ACC.name,s:score|0,t:Date.now(),lk:ACC.look};const top=(cur.top||[]).filter(x=>x.id!==BK.uid);const prev=(cur.top||[]).find(x=>x.id===BK.uid);top.push(prev&&prev.s>=me0.s?prev:me0);top.sort((a,b)=>b.s-a.s);await dset(ref,{top:top.slice(0,20)})}
const _rewardGame=rewardGame;
rewardGame=function(game,score){if(!score||score<=0)return;if(G?.noScore){notify({tone:'info',text:'這場是今日電腦對戰的額外場次，不計分也不發代幣',ms:3500,quiet:true});return}
 const v=AC.verdict(game,score);if(v.why){notify({tone:'warn',icon:'shield',title:'這場不計分',text:'系統偵測到異常的操作或分數，這場不列入排行也不發代幣。',ms:6000});flagCheat(game,score,v);return}
 _rewardGame(game,score);submitScore(game,score)};
async function loadBoard(game){if(BK.mode==='supa'){const r=await rpc('avera_leaderboard',{p_game:game});return(r.top||[]).map(x=>({n:x.name,s:x.score,lk:x.look}))}return((await dget('lb/'+game))?.top||[]).map(x=>({n:x.n,s:x.s,lk:x.lk}))}
// ---- 3D leaderboard on the wall above the pinballs ----
const LB={c:cv(768,576),i:0,games:['snake','stack','mole','brick','racer','hoops','dance','claw','grip','bowl'],data:{}};LB.t=tex(LB.c);
{const m=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.55),new THREE.MeshBasicMaterial({map:LB.t,toneMapped:false}));m.position.set(11.1,4.35,W.z0+.07);scene.add(m);const fr=new THREE.Mesh(RB(3.5,2.65,.04,.02),std('#0b0a14',.3,.5));fr.position.set(11.1,4.35,W.z0+.04);scene.add(fr)}
function drawBoard(){const g=LB.c.getContext('2d'),w=768,h=576,k=LB.games[LB.i%LB.games.length],list=LB.data[k]||[];const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#1d1450');gr.addColorStop(1,'#0c0820');g.fillStyle=gr;g.fillRect(0,0,w,h);
 drawWordmark(g,150,52,30,{blur:.2});g.fillStyle='#ffd27a';g.font='800 40px "Noto Sans TC",sans-serif';g.textAlign='right';g.textBaseline='middle';g.fillText(`🏆 ${GAMES[k]?.name||'保齡球'} 排行榜`,w-36,54);
 g.fillStyle='rgba(255,255,255,.1)';g.fillRect(36,96,w-72,2);g.textAlign='left';if(!list.length){g.fillStyle='#d8d0ff';g.font='600 30px "Noto Sans TC",sans-serif';g.fillText('還沒有人上榜，快來挑戰！',48,170)}
 list.slice(0,7).forEach((x,i)=>{const y=140+i*60;g.fillStyle=['#ffd27a','#e4e4ff','#ffb27a'][i]||'#a39bd2';g.font='800 32px "Unbounded",sans-serif';g.fillText(i+1,48,y);g.fillStyle='#fff';g.font='800 30px "Noto Sans TC",sans-serif';g.fillText(String(x.n).slice(0,12),110,y);g.textAlign='right';g.fillStyle='#ffd27a';g.font='800 30px "Unbounded",sans-serif';g.fillText(x.s,w-48,y);g.textAlign='left'});LB.t.needsUpdate=true}
async function refreshBoard(){const k=LB.games[LB.i%LB.games.length];try{LB.data[k]=await loadBoard(k)}catch(e){}drawBoard()}
setInterval(()=>{if(!document.body.classList.contains('playing'))return;LB.i++;refreshBoard()},9000);
// ---- leaderboard panel ----
async function openBoard(game){togglePop('lbp',true);const k=game||$('lbp').dataset.g||'snake';$('lbp').dataset.g=k;const tabs=$('lb-tabs');tabs.replaceChildren();for(const g of LB.games){const b=document.createElement('button');b.textContent=GAMES[g]?.name||'保齡球';b.setAttribute('aria-pressed',g===k);b.onclick=()=>openBoard(g);tabs.append(b)}
 const l=$('lb-list');l.innerHTML='<div class="empty">讀取中…</div>';const list=await loadBoard(k);l.replaceChildren();if(!list.length){l.innerHTML='<div class="empty">還沒有人上榜。</div>';return}
 list.slice(0,20).forEach((x,i)=>{const r=document.createElement('div');r.className='prow lbr';const n=document.createElement('b');n.className='rk r'+(i+1);n.textContent=i+1;r.append(n);if(x.lk)r.append(pfEl(cleanLook(x.lk)));const m=document.createElement('div');m.className='mid';const nm=document.createElement('div');nm.className='nm';nm.textContent=x.n;m.append(nm);r.append(m);const s=document.createElement('b');s.className='sc';s.textContent=x.s;r.append(s);l.append(r)})}
$('b-lb').onclick=()=>$('lbp').hidden?openBoard():togglePop('lbp',false);$('lbp-x').onclick=()=>togglePop('lbp',false);
