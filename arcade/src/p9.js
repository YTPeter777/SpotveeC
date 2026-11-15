
// ================= name tags =================
function makeTag(){const d=document.createElement('div');d.className='tag';d.innerHTML='<div class="bub" hidden></div><div class="nt"><span class="cdot"></span><svg class="i f pt"><use href="#i-star"/></svg><svg class="i mic"><use href="#i-mic"/></svg><span class="n"></span></div>';document.body.append(d);return d}
const myTag=makeTag();myTag.hidden=true;
function placeTag(el,av,name,bub,t,talk,party){const pc=av.userData.ring?.material?.color;if(pc&&el._pc!==pc.getHexString()){el._pc=pc.getHexString();el.style.setProperty('--pc','#'+el._pc)}const d=camera.position.distanceTo(av.position);const s=d<24&&toScreen(av.position.x,av.position.y+1.68,av.position.z);if(!s||$('cab').hidden===false){el.hidden=true;return}el.hidden=false;
 el.style.transform=`translate(${s[0].toFixed(1)}px,${s[1].toFixed(1)}px) translate(-50%,-100%)`;const n=el.querySelector('.n');if(n.textContent!==name)n.textContent=name;el.classList.toggle('talk',!!talk);el.classList.toggle('party',!!party);
 const b=el.querySelector('.bub'),show=!!bub.text&&t-bub.t<6;b.hidden=!show;if(show&&b.textContent!==bub.text)b.textContent=bub.text}

// ================= 3D screens =================
function drawAttract(t){for(const k of CAB_GAMES){const{g,t:tx}=attract[k],col=GAMES[k].col;g.fillStyle='#0b0820';g.fillRect(0,0,256,192);
  if(k==='snake'){for(let i=0;i<14;i++){const a=t*1.5-i*.18;g.fillStyle=i?col:'#c8ffe6';g.beginPath();g.roundRect(128+Math.cos(a)*70-7,100+Math.sin(a*2)*38-7,14,14,4);g.fill()}g.fillStyle='#ff6fb1';g.beginPath();g.arc(128+Math.cos(t*1.5+1)*70,100+Math.sin((t*1.5+1)*2)*38,6,0,7);g.fill()}
  else if(k==='stack'){for(let r=0;r<6;r++){g.fillStyle=`hsl(${195+r*12},90%,64%)`;const w=84-r*8,x=128-w/2+(r===5?Math.sin(t*3)*50:0);g.beginPath();g.roundRect(x,170-r*22,w,18,5);g.fill()}}
  else if(k==='mole'){for(let i=0;i<3;i++){const up=Math.max(0,Math.sin(t*3+i*2));g.fillStyle='#c48a5c';g.beginPath();g.ellipse(64+i*64,146-up*40,18,20,0,0,7);g.fill();g.fillStyle='#000';g.fillRect(40+i*64,146,48,16)}}
  else{for(let r=0;r<4;r++)for(let c=0;c<7;c++)if((r*7+c+Math.floor(t*2))%5){g.fillStyle=`hsl(${r*50},85%,65%)`;g.fillRect(16+c*32,40+r*16,28,12)}const bx=128+Math.sin(t*2.3)*100,by=120+Math.abs(Math.sin(t*3.1))*-50+40;g.fillStyle='#ffd864';g.beginPath();g.arc(bx,by,5,0,7);g.fill();g.fillStyle='#fff';g.fillRect(bx-24,172,48,6)}
  g.fillStyle='rgba(255,255,255,.05)';for(let y=0;y<192;y+=4)g.fillRect(0,y,256,1);g.fillStyle='#fff';g.font='800 20px "Baloo 2",sans-serif';g.textAlign='center';g.textBaseline='middle';if(Math.sin(t*4)>0)g.fillText('PRESS START',128,22);tx.needsUpdate=true}
 {const{g,t:tx}=racerScr,w=256,h=176;g.fillStyle='#262044';g.fillRect(0,0,w,h);g.fillStyle='#3a3360';g.beginPath();g.moveTo(w*.42,40);g.lineTo(w*.58,40);g.lineTo(w,h);g.lineTo(0,h);g.fill();g.fillStyle='#fff';const off=(t*3)%1;for(let i=0;i<6;i++){const k=((i+off)/6),y=40+k*k*(h-40),ww=2+k*8;g.fillRect(w/2-ww/2,y,ww,4+k*10)}
  g.fillStyle='#ffd864';g.beginPath();g.roundRect(w/2-20+Math.sin(t*1.7)*30,h-46,40,34,8);g.fill();g.fillStyle='#ff6178';g.font='800 18px "Baloo 2",sans-serif';g.textAlign='center';g.fillText('RACE',w/2,20);tx.needsUpdate=true}
 {const{g,t:tx}=danceScr,w=512,h=196;g.fillStyle='#26114a';g.fillRect(0,0,w,h);const cols=['#ff6fb1','#62c9ff','#55eeb4','#ffd864'],A=['◀','▼','▲','▶'];g.textAlign='center';g.textBaseline='middle';g.font='800 40px "Baloo 2",sans-serif';
  for(let l=0;l<4;l++){g.fillStyle='rgba(255,255,255,.25)';g.fillText(A[l],90+l*110,36);for(let k=0;k<3;k++){const y=36+((t*120+l*70+k*90)%200);g.fillStyle=cols[l];g.fillText(A[l],90+l*110,h-y+36)}}tx.needsUpdate=true}
 {const{g,t:tx}=pinTex;g.fillStyle='#1d1450';g.fillRect(0,0,256,160);for(let i=0;i<9;i++){g.fillStyle=`hsl(${(i*40+t*120)%360},90%,${Math.sin(t*6+i)>0?65:30}%)`;g.beginPath();g.arc(30+i*25,40+Math.sin(i)*20,8,0,7);g.fill()}g.fillStyle='#fff';g.beginPath();g.arc(128+Math.sin(t*2.1)*80,100+Math.cos(t*2.7)*40,6,0,7);g.fill();tx.needsUpdate=true}
 hoopsScore.forEach((s,i)=>{const g=s.c.getContext('2d');g.fillStyle='#120c30';g.fillRect(0,0,256,96);g.fillStyle='#ff9a5c';g.font='800 64px "Baloo 2",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(Math.floor(t*1.3+i*7)%60).padStart(2,'0'),128,52);s.t.needsUpdate=true})}

// ================= main loop =================
let frameN=0,lastZone='',lastNear=null;const TICON={bowl:'pin',cab:'game',st:'game',tv:'tv',sit:'sofa',ride:'horse',vend:'cup',snack:'cup',photo:'camera'},TLABEL={bowl:'打球',cab:'開玩',st:'對戰',tv:'看影片',sit:'坐下',ride:'騎乘',vend:'購買',snack:'購買',photo:'拍照'};
function tick(){requestAnimationFrame(tick);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;frameN++;const ox=me.x,oz=me.z;
 if(me.mode==='walk'||me.mode==='sit'){walkStep(dt,t);
  near=me.mode==='walk'?findNear():null;$('a-act').hidden=!near;if(near&&near!==lastNear){lastNear=near;const ic=TICON[near.type]||'hand';$('p-i').firstElementChild.setAttribute('href','#i-'+ic);$('a-act-i').firstElementChild.setAttribute('href','#i-'+ic);$('a-act-t').textContent=TLABEL[near.type]||'互動'}
  if(near){const s=toScreen(near.px??near.x,near.py??near.y,near.pz??near.z);if(s){$('prompt').hidden=false;const lb=targetLabel(near);if($('p-t').textContent!==lb)$('p-t').textContent=lb;const x=THREE.MathUtils.clamp(s[0],120,innerWidth-120),y=THREE.MathUtils.clamp(s[1],110,innerHeight-130);$('prompt').style.transform=`translate(${x.toFixed(1)}px,${(y+Math.sin(t*4)*3).toFixed(1)}px) translate(-50%,-100%)`}else $('prompt').hidden=true}else $('prompt').hidden=true;
  camT.set(me.x,me.y+1.1,me.z);camFollow(camT,dt);arrow.visible=false}
 else if(me.mode==='bowl'){$('prompt').hidden=true;laneCamera(dt,t)}
 else if(me.mode==='site'){siteCam(t,dt)}
 else if(me.mode==='preview'){const a=Math.sin(t*.35)*.45;camT.set(me.x,.72,me.z);camera.position.set(me.x+Math.sin(a)*2.9,1.15,me.z+Math.cos(a)*2.9);camera.lookAt(camT);
  const wide=innerWidth>760;camera.setViewOffset(innerWidth,innerHeight,wide?-innerWidth*.2:0,wide?0:innerHeight*.26,innerWidth,innerHeight);myAv.rotation.y=Math.sin(t*.6)*.25}
 else{me.speed=0;camT.set(me.x,me.y+1.1,me.z);camFollow(camT,dt)}
 if(me.mode==='walk'){me.vx=(me.x-ox)/Math.max(dt,1e-3);me.vz=(me.z-oz)/Math.max(dt,1e-3);if(Math.hypot(me.vx,me.vz)<.05)me.vx=me.vz=0}else{me.vx=me.vz=0;if(me.mode!=='preview')me.speed=0}
 laneTick(dt,t);
 myAv.position.set(me.x,me.y,me.z);animAvatar(myAv,t,dt,me.speed,me.emote,me.et,me.air,me.talk,me.pose);
 if(me.mode!=='preview'){placeTag(myTag,myAv,myName,myBubble,t,me.talk,PARTY.id&&partyMates().length)}else myTag.hidden=true;
 voiceTick(t,frameN);NETH.fn++;if(t-NETH.ft>=1){NETH.fps=NETH.fn/(t-NETH.ft);NETH.ft=t;NETH.fn=0}
 for(const p of peers.values()){if(!p.av){p.tag.hidden=true;continue}const age=Math.min((performance.now()-p.lastMv)/1000,.6);p.tgt.copy(p.base).addScaledVector(p.vel,age);p.cur.lerp(p.tgt,1-Math.exp(-dt*12));p.talk=p.talkNet||p.talkLocal>t;
  const d=p.av.position.distanceTo(p.cur);p.speed=THREE.MathUtils.lerp(p.speed,d/Math.max(dt,1e-3),.2);p.av.position.copy(p.cur);let dy=p.yaw-p.av.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));p.av.rotation.y+=dy*Math.min(1,dt*12);
  const pose=p.pose||(p.act==='cab'&&['racer','c4'].includes(p.game)?'sit':'');animAvatar(p.av,t,dt,p.speed,p.act==='cab'&&!p.emote?'play':p.emote,p.act==='cab'?t-1:p.et,p.air,p.talk,pose);placeTag(p.tag,p.av,p.name,p.bubble,t,p.talk,PARTY.id&&p.pt===PARTY.id)}
 animNPCs(t,dt);for(const f of anims)f(t,dt);
 for(let i=floaters.length-1;i>=0;i--){const h=floaters[i];h.t+=dt;if(h.t<0){h.s.visible=false;continue}h.s.visible=true;h.s.position.y+=dt*.8;h.s.position.x+=Math.sin(h.t*6+i)*dt*.3;h.s.material.opacity=Math.max(0,1-h.t/1.6);h.s.scale.setScalar(.25+h.t*.12);if(h.t>1.6){scene.remove(h.s);h.s.material.dispose();floaters.splice(i,1)}}
 const beat=Math.floor(t*2.5);danceTiles.forEach((m,i)=>m.emissiveIntensity=(beat+i)%4===0?2.4:.35);
 gameTick(dt);
 if(frameN%4===0)drawAttract(t);
 if(frameN%3===0)for(const L of lanes)if(L.state||L.mon.fx||frameN%12===0)drawMonitor(L,t);
 if(frameN%20===0&&(me.mode==='walk'||me.mode==='sit')){const z=zoneName();if(z!==lastZone){lastZone=z;showZone(z)}}
 sendMove(false);if(frameN%90===0)pushInfo();
 if(QUAL==='low')renderer.render(scene,camera);else composer.render()}

// ================= boot =================
(function boot(){const so=SFX.on;SFX.on=false;refreshLook();SFX.on=so;me.mode='site';myAv.visible=false;resize();tick();drawTV();siteBoot();
 document.fonts.load('800 40px "Baloo 2"').then(()=>document.fonts.load('700 40px "Noto Sans TC"','保齡球館復古電玩區投籃機服務台兌換影音區夾娃娃貪食蛇疊疊樂打地鼠打磚塊極速賽車空氣曲棍球跳舞機四子棋推幣機租鞋爆米花汽水熱狗霜淇淋代幣空道站上助走按第格擊倒準備回合比賽結束挑戰最高分雙人對戰一起玩週五舞會之夜大賽')).then(()=>redraws.forEach(f=>f())).catch(()=>{});
 })();
</script>
</body>
</html>
