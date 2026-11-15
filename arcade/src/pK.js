
// ================= snack bar: real queue, clerk, coins =================
// Queue order is shared through presence (sq = when you joined the line); every client computes the same order.
const SHOP={spot0:{x:12.55,z:11},step:.85,dir:{x:-1,z:0},serving:false,menuOpen:false,timer:0,clerk:null,prep:0};
me.sq=0;
function shopLine(){const l=[];if(me.sq)l.push({id:MYID,sq:me.sq,me:true});for(const p of peers.values())if(p.sq)l.push({id:p.id,sq:p.sq,name:p.name});l.sort((a,b)=>a.sq-b.sq||(a.id<b.id?-1:1));return l}
function shopSpot(i){return{x:SHOP.spot0.x+SHOP.dir.x*SHOP.step*i,z:SHOP.spot0.z+SHOP.dir.z*SHOP.step*i}}
function joinShopQueue(){if(me.sq)return;if(!featureOn('shop')){notify({tone:'warn',icon:'gear',text:'點心吧目前維護中',ms:3000});return}me.sq=Date.now();me.mode='queue';pushInfo(true);sfx('click');$('shopq').hidden=false;updShop(true)}
function leaveShopQueue(quiet){if(!me.sq)return;me.sq=0;SHOP.menuOpen=false;$('shopm').hidden=true;$('shopq').hidden=true;clearTimeout(SHOP.timer);if(me.mode==='queue')me.mode='walk';pushInfo(true);if(!quiet)notify({tone:'info',icon:'bag',text:'已離開點心吧的隊伍',ms:2500,quiet:true})}
function updShop(force){if(!me.sq)return;const l=shopLine(),i=l.findIndex(x=>x.me);if(i<0)return;const s=shopSpot(i);
 // walk to my spot in line
 const dx=s.x-me.x,dz=s.z-me.z,d=Math.hypot(dx,dz);if(d>.05){const st=Math.min(d,.07);me.x+=dx/d*st;me.z+=dz/d*st;me.speed=3.2;myAv.rotation.y=Math.atan2(dx,dz)}else{me.speed=0;myAv.rotation.y=Math.PI/2}
 $('shopq-pos').textContent=i===0?'輪到你了！':`第 ${i+1} 位`;$('shopq-n').textContent=i===0?'請選擇要買的點心':`前面還有 ${i} 人`;
 if(i===0&&d<.3&&!SHOP.menuOpen&&!SHOP.serving)openShopMenu()}
function openShopMenu(){SHOP.menuOpen=true;const m=$('shopm'),list=$('shopm-l');list.replaceChildren();$('shopm-c').textContent=ACC.coins|0;const shop=ACC.config.shop||DEFAULT_SHOP;
 for(const[k,it]of Object.entries(shop)){if(it.off)continue;const b=document.createElement('button');b.className='sitem';b.disabled=(ACC.coins|0)<it.p;b.innerHTML=`<span class="si-ic">${{drink:'🥤',eat:'🍿'}[it.k]||'🍬'}</span><b></b><span class="si-p"><svg class="i sm"><use href="#i-coin"/></svg>${it.p}</span>`;b.querySelector('b').textContent=it.n;b.onclick=()=>shopBuy(k,it);list.append(b)}
 m.hidden=false;sfx('chime');let left=25;$('shopm-t').textContent=left;clearInterval(SHOP.timer);SHOP.timer=setInterval(()=>{left--;$('shopm-t').textContent=left;if(left<=0){clearInterval(SHOP.timer);if(SHOP.menuOpen){notify({tone:'warn',text:'太久沒有點餐，已讓給下一位',ms:3500});leaveShopQueue(true)}}},1000)}
async function shopBuy(k,it){if(SHOP.serving)return;clearInterval(SHOP.timer);const r=await buyItem(k);if(r.error){notify({tone:'err',icon:'coin',text:r.error==='coins'?'代幣不夠喔！玩遊戲可以賺代幣':'購買失敗',ms:3500});if(r.error==='coins'){leaveShopQueue(true)}else openShopMenu();return}
 SHOP.menuOpen=false;SHOP.serving=true;$('shopm').hidden=true;$('shopq-pos').textContent='製作中…';$('shopq-n').textContent=it.n;SHOP.prep=performance.now();NET.emit('sq',{t:'serve',n:it.n});sfx('coin');
 setTimeout(()=>{SHOP.serving=false;heldItem(myAv,it.k==='drink'?'drink':'eat');doEmote(it.k==='drink'?'drink':'eat');notify({tone:'ok',icon:'bag',text:`買到了 ${it.n}！（剩 ${ACC.coins} 代幣）`,ms:3500});NET.emit('ann',{t:`在點心吧買了 ${it.n}`});leaveShopQueue(true);me.x-=.6}, 2600)}
onNet('sq',(d,from)=>{if(d.t==='serve')SHOP.prep=performance.now()});
$('shopq-x').onclick=()=>leaveShopQueue();$('shopm-x').onclick=()=>leaveShopQueue();
setInterval(()=>{if(me.sq&&!document.body.classList.contains('playing'))leaveShopQueue(true)},2000);
// clerk walks to the drink machine and back while preparing an order
SHOP.clerk=npcs.find(n=>n.kind==='snack');
anims.push((t)=>{const c=SHOP.clerk;if(!c)return;const k=(performance.now()-SHOP.prep)/2600;if(k>=0&&k<1){const s=Math.sin(k*Math.PI);c.a.position.z=11+s*1.3;c.a.rotation.y=k<.5?0:Math.PI;if(k>.8)c.a.rotation.y=-Math.PI/2}else{c.a.position.z=11;c.a.rotation.y=-Math.PI/2}});
// coins for playing: minigames on exit, bowling per finished game
let rewardGame=function(game,score){if(!score||score<=0)return;const n=Math.min(30,4+Math.floor(Math.sqrt(score)*1.6));earnCoins(game,n)};
