
// ================= 3D claw machine =================
const plushMat=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.85,sheen:1,sheenRoughness:.5,sheenColor:new THREE.Color('#ffffff')});
const PRIZE_N=['小熊','小兔','小貓','小狗','小雞','小企鵝','小狐狸'];
function claw3D(G,setS,restart,finish){const obj=curTarget.obj,cg=obj.userData.claw,fingers=obj.userData.fingers,pm=obj.userData.prizes;
 for(const m of obj.userData.items||[])obj.remove(m);pm.visible=false;const items=[];
 for(let i=0;i<10;i++){const list=[];plushGeos(0,0,0,1.05,prizeCols[i%7],list);const m=new THREE.Mesh(mergeGeometries(list),plushMat);m.castShadow=true;const it={m,x:(Math.random()-.5)*.76,z:(Math.random()-.5)*.6-.06,y:1.1+Math.random()*.05,vy:0,st:'pit',n:PRIZE_N[i%7]};m.position.set(it.x,it.y,it.z);m.rotation.y=Math.random()*6;obj.add(m);items.push(it)}
 obj.userData.items=items.map(i=>i.m);
 let st='move',tries=3,won=0,time=20,cx=0,cz=0,cy=1.95,close=0,held=null,slipAt=0,wait=0;const kk={};const CH={x:.42,z:.4},GRAB_Y=1.24,TOP=1.95;
 const hud=()=>{$('cabs').innerHTML=`<div class="led"><small>TIME</small><b>${String(Math.max(0,Math.ceil(time))).padStart(2,'0')}</b></div><div class="led"><small>TRY</small><b>${tries}</b></div><div class="led"><small>WIN</small><b>${won}</b></div>`};
 G.pad=[null,{t:'▲',code:'ArrowUp'},null,{t:'◀',code:'ArrowLeft'},{t:'▼',code:'ArrowDown'},{t:'▶',code:'ArrowRight'},{t:'抓！',code:'go',span:1}];G.padCols=3;G.pose='play';
 const drop=()=>{if(G.over){restart();return}if(st==='move'){st='down';sfx('whoosh')}};
 G.key=(c,dn)=>{const m={ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',ArrowUp:'u',KeyW:'u',ArrowDown:'d',KeyS:'d'}[c];if(m)kk[m]=dn;else if(dn&&(c==='Space'||c==='go'||c==='Enter'))drop()};
 G.down=()=>{if(G.over)restart()};
 G.cleanup=()=>{for(const it of items)obj.remove(it.m);obj.userData.items=[];pm.visible=true;cg.position.set(0,TOP,0);fingers.forEach(f=>f.rotation.x=0)};
 G.draw=g=>{gbg(g,'#1d1450','#0e0b22');gtext(g,'夾娃娃',GW/2,GH/2,40,'#ff9cc9')};
 G.update=dt=>{if(G.over)return;
  if(st==='move'){cx=THREE.MathUtils.clamp(cx+((kk.r?1:0)-(kk.l?1:0))*.42*dt,-.44,.44);cz=THREE.MathUtils.clamp(cz+((kk.d?1:0)-(kk.u?1:0))*.42*dt,-.42,.42);time-=dt;if(time<=0){time=0;st='down'}}
  else if(st==='down'){close=Math.max(0,close-dt*3);cy-=.75*dt;if(cy<=GRAB_Y){cy=GRAB_Y;st='close';wait=.45;sfx('hit')}}
  else if(st==='close'){close=Math.min(1,close+dt*2.6);wait-=dt;if(wait<=0){let best=null,bd=9;for(const it of items)if(it.st==='pit'){const d=Math.hypot(it.x-cx,it.z-cz);if(d<bd){bd=d;best=it}}
    if(best&&bd<.11&&Math.random()<THREE.MathUtils.clamp(.92-bd*6,.2,.9)){held=best;best.st='held';slipAt=Math.random()<.16?1.45+Math.random()*.35:99}st='up'}}
  else if(st==='up'){cy+=.55*dt;if(held&&cy>slipAt){held.st='fall';held.vy=0;held=null;sfx('lose')}if(cy>=TOP){cy=TOP;st=held?'carry':'back'}}
  else if(st==='carry'){const dx=CH.x-cx,dz=CH.z-cz,d=Math.hypot(dx,dz);if(d>.01){const s=Math.min(d,.45*dt);cx+=dx/d*s;cz+=dz/d*s}else{st='release';wait=.35;close=0;held.st='chute';held.vy=0;held=null}}
  else if(st==='release'){wait-=dt;if(wait<=0)st='back'}
  else if(st==='back'){close=Math.max(0,close-dt*2);const d=Math.hypot(cx,cz);if(d>.01){const s=Math.min(d,.5*dt);cx-=cx/d*s;cz-=cz/d*s}else{tries--;time=20;st='move';if(tries<=0){G.over=true;finish()}}}
  cg.position.set(cx,cy,cz);fingers.forEach(f=>f.rotation.x=-.55+close*.75);
  for(const it of items){if(it.st==='held'){it.x=cx;it.z=cz;it.y=cy-.23}else if(it.st==='fall'||it.st==='chute'){it.vy-=9.8*dt;it.y+=it.vy*dt;const floor=it.st==='chute'?.4:1.08;if(it.y<=floor){it.y=floor;it.vy=0;if(it.st==='chute'){it.st='won';it.m.visible=false;won++;setS(won);sfx('win');earnCoins('claw',8);notify({tone:'ok',icon:'gift',title:'夾到了！',text:`你夾到了一隻${it.n}（+8 代幣）`,ms:4000});NET.emit('ann',{t:`在夾娃娃機夾到了${it.n}！`})}else it.st='pit'}}
   it.m.position.set(it.x,it.y,it.z)}
  hud()};
 hud()}
