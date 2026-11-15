
// ================= sound effects (synthesised) =================
const SFX={on:store.get('sfx',true),ctx:null,vol:store.get('sfxv',80)/100};
function sfx(n){if(!SFX.on)return;try{if(!SFX.ctx)SFX.ctx=new(window.AudioContext||window.webkitAudioContext)();const c=SFX.ctx;if(c.state==='suspended')c.resume();const t=c.currentTime,o=c.createGain();o.gain.value=SFX.vol;o.connect(c.destination);
 const tone=(f,d,type='sine',v=.12,at=0,f2)=>{const s=c.createOscillator(),g=c.createGain();s.type=type;s.frequency.setValueAtTime(f,t+at);if(f2)s.frequency.exponentialRampToValueAtTime(f2,t+at+d);g.gain.setValueAtTime(v,t+at);g.gain.exponentialRampToValueAtTime(.001,t+at+d);s.connect(g);g.connect(o);s.start(t+at);s.stop(t+at+d+.02)};
 const noise=(d,v=.2,fq=1200,at=0,q=.8)=>{const b=c.createBuffer(1,c.sampleRate*d,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=fq;f.Q.value=q;const g=c.createGain();g.gain.setValueAtTime(v,t+at);g.gain.exponentialRampToValueAtTime(.001,t+at+d);s.connect(f);f.connect(g);g.connect(o);s.start(t+at)};
 ({click:()=>tone(880,.06,'triangle',.08),coin:()=>{tone(988,.08,'square',.06);tone(1319,.25,'square',.06,.08)},win:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.18,'triangle',.1,i*.09)),lose:()=>[392,330,262].forEach((f,i)=>tone(f,.22,'triangle',.1,i*.12)),
  hit:()=>noise(.08,.25,2200),pop:()=>tone(600,.08,'sine',.12,0,1200),roll:()=>noise(1.6,.12,180,0,.5),strike:()=>{noise(.5,.5,900,0,.6);noise(.35,.35,2400,.05);tone(90,.4,'sine',.3)},pins:()=>noise(.3,.35,1500,0,.7),
  beep:()=>tone(660,.1,'square',.05),chime:()=>{tone(988,.16,'sine',.09,0);tone(1319,.24,'sine',.07,.09)},kick:()=>tone(150,.16,'sine',.35,0,45),hat:()=>noise(.04,.08,8000,0,.5),snare:()=>noise(.12,.18,1800,0,.6),go:()=>tone(880,.35,'square',.07),flash:()=>{noise(.15,.3,4000);tone(1800,.08,'sine',.05)},whoosh:()=>noise(.4,.15,600,0,.4)}[n]||(()=>{}))()}catch(e){}}

// ================= player state =================
const SPAWN={x:0,z:.5};
const me={x:SPAWN.x,y:0,z:SPAWN.z,vy:0,vx:0,vz:0,speed:0,emote:'',et:-9,mode:'preview',talk:false,air:false,pose:'',seat:null,slot:null};
let myAv=makeAnimal(look);scene.add(myAv);myAv.position.set(me.x,0,me.z);
let myName='',myBubble={text:'',t:-99};
const keys={};let camYaw=0,camPitch=.3,camDist=6.2,camCur=6.2;
const clock=new THREE.Clock();
function jump(){if(ADMP.fly)return;if(me.mode==='sit'){standUp();return}if(me.mode==='walk'&&me.y-groundAt(me.x,me.z,me.y)<.05){me.vy=6.2;me.air=true;sfx('pop')}}
let emoteSeq=0;function doEmote(e){if(!['walk','preview','sit','bowl','cab'].includes(me.mode))return;me.emote=e;me.et=clock.elapsedTime;emoteSeq++;if(e==='heart')spawnFloat(myAv.position);if(e==='dance')spawnFloat(myAv.position,noteTex,3);togglePop('emopop',false);sendPresence(true)}
const EMOTES=[['wave','👋','揮手'],['dance','💃','跳舞'],['cheer','🙌','歡呼'],['heart','💖','比心'],['spin','🤸','翻滾'],['laugh','😆','大笑']];

// ================= start screen =================
function swatches(el,list,key){list.forEach((c,i)=>{const b=document.createElement('button');b.className='sw';b.style.background=c;b.setAttribute('aria-label',(key==='fur'?'毛色 ':'衣服 ')+(i+1));b.onclick=()=>{look[key]=i;refreshLook()};el.append(b)})}
SPECIES.forEach((s,i)=>{const b=document.createElement('button');b.innerHTML=`<img alt=""><span>${s.n}</span>`;b.onclick=()=>{if(look.sp!==i){look.sp=i;look.fur=FUR_DEFAULT[s.k]}refreshLook()};$('pk-sp').append(b)});
swatches($('pk-fur'),FURS,'fur');swatches($('pk-cl'),OUTFIT,'cl');
ACCS.forEach((a,i)=>{const b=document.createElement('button');b.innerHTML=`<img alt=""><span>${a.n}</span>`;b.onclick=()=>{look.acc=i;refreshLook()};$('pk-acc').append(b)});
function refreshLook(){[...$('pk-sp').children].forEach((b,i)=>b.setAttribute('aria-pressed',i===look.sp));[...$('pk-fur').children].forEach((b,i)=>b.setAttribute('aria-pressed',i===look.fur));[...$('pk-cl').children].forEach((b,i)=>b.setAttribute('aria-pressed',i===look.cl));[...$('pk-acc').children].forEach((b,i)=>b.setAttribute('aria-pressed',i===look.acc));
 const r=myAv.rotation.y;scene.remove(myAv);myAv=makeAnimal(look);myAv.rotation.y=r;scene.add(myAv);try{applyEquip(myAv,ACC.equip,isStaff());setProp(myAv,me.prop)}catch(e){}myAv.position.set(me.x,me.y,me.z);if(me.mode==='preview'){me.emote='spin';me.et=clock.elapsedTime}
 $('me-badge').src=portrait(look);$('me-pf').style.setProperty('--pc',OUTFIT[look.cl]);updatePicks();store.set('look',look);sfx('click')}
function updatePicks(){[...$('pk-sp').children].forEach((b,i)=>{const lk={sp:i,fur:i===look.sp?look.fur:FUR_DEFAULT[SPECIES[i].k],cl:look.cl,acc:0};b.querySelector('img').src=portrait(lk)});
 [...$('pk-acc').children].forEach((b,i)=>{b.querySelector('img').src=portrait({...look,acc:i})})}
document.querySelectorAll('.tabs button').forEach(t=>t.onclick=()=>{document.querySelectorAll('.tabs button').forEach(b=>{const on=b===t;b.setAttribute('aria-selected',on);$(b.dataset.pane).hidden=!on});sfx('click')});
$('nick').value=store.get('nick','');
$('nick').addEventListener('keydown',e=>{if(e.key==='Enter')$('go').click()});
// entering the game is handled by the website flow (pS.js)

// ================= input =================
const typing=()=>document.activeElement&&['INPUT','TEXTAREA'].includes(document.activeElement.tagName);
addEventListener('keydown',e=>{if(typing()){if(e.key==='Escape')document.activeElement.blur();return}
 keys[e.code]=true;
 if(e.key==='Escape'){if(!$('help').hidden){$('help').hidden=true;return}if(!$('photo').hidden){$('photo').hidden=true;return}togglePop('people',false);togglePop('menu',false);togglePop('emopop',false);togglePop('roompnl',false)}
 if(me.mode==='preview'||me.mode==='site')return;
 if(me.mode==='queue'){if(e.key==='Escape')leaveShopQueue();return}
 if(me.mode==='booth'){if(e.key==='Escape')leaveBooth();else if(e.code==='Space'){e.preventDefault();boothShoot()}return}
 if((me.mode==='walk'||me.mode==='bowl'||me.mode==='sit')&&e.code==='KeyV'&&!e.repeat){toggleMic();return}
 if(me.mode==='walk'||me.mode==='sit'){if(e.code==='Space'){e.preventDefault();jump()}else if(e.code==='KeyE')interact();else if(e.code==='Enter'){e.preventDefault();openChat()}
  else if(/^Digit[1-6]$/.test(e.code))doEmote(EMOTES[+e.code[5]-1][0])}
 else if(me.mode==='bowl'){if(e.code==='Space'&&!e.repeat){e.preventDefault();bowlPress()}else if(e.code==='Escape')leaveLane();else if(e.code==='Enter'){e.preventDefault();openChat()}}
 else if(me.mode==='cab'){if(e.code==='Escape')closeGame();else gameKey(e.code,true);if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault()}});
addEventListener('keyup',e=>{keys[e.code]=false;if(me.mode==='bowl'&&e.code==='Space')bowlRelease();if(me.mode==='cab')gameKey(e.code,false)});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
const gl=$('gl');let drag=null;
gl.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};gl.setPointerCapture(e.pointerId);togglePop('people',false);togglePop('menu',false);togglePop('emopop',false);if(typing())document.activeElement.blur()});
const VIEW={sens:store.get('vsens',1),inv:store.get('vinv',false),follow:store.get('vfollow',true),lastDrag:0};
gl.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(me.mode==='walk'||me.mode==='sit'||me.mode==='queue'){const k=VIEW.sens*(isTouch?1.25:1);camYaw-=(e.clientX-drag.x)*.0055*k;camPitch=THREE.MathUtils.clamp(camPitch+(e.clientY-drag.y)*.0042*k*(VIEW.inv?-1:1),.02,1.05);VIEW.lastDrag=performance.now()}drag.x=e.clientX;drag.y=e.clientY});
// third-person follow: while walking, the camera eases in behind the character unless you are steering it
function camAutoFollow(dt){if(!VIEW.follow||me.speed<.6||performance.now()-VIEW.lastDrag<1200||drag)return;const want=myAv.rotation.y+Math.PI;let d=want-camYaw;d=Math.atan2(Math.sin(d),Math.cos(d));camYaw+=d*Math.min(1,dt*1.1)}
const endDrag=()=>drag=null;gl.addEventListener('pointerup',endDrag);gl.addEventListener('pointercancel',endDrag);
gl.addEventListener('wheel',e=>{camDist=THREE.MathUtils.clamp(camDist+e.deltaY*.01,2.8,11)},{passive:true});
let pinch=null;gl.addEventListener('touchstart',e=>{if(e.touches.length===2){pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);drag=null}},{passive:true});
gl.addEventListener('touchmove',e=>{if(pinch&&e.touches.length===2){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);camDist=THREE.MathUtils.clamp(camDist-(d-pinch)*.02,2.8,11);pinch=d}},{passive:true});
gl.addEventListener('touchend',()=>{pinch=null},{passive:true});
const joy=$('joy'),knob=$('knob');let jv={x:0,y:0},jid=null;
joy.addEventListener('pointerdown',e=>{jid=e.pointerId;joy.setPointerCapture(jid);jm(e)});
joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)jm(e)});
const jend=()=>{jid=null;jv={x:0,y:0};knob.style.transform=''};joy.addEventListener('pointerup',jend);joy.addEventListener('pointercancel',jend);
function jm(e){const r=joy.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/50,y=(e.clientY-r.top-r.height/2)/50;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}jv={x,y};knob.style.transform=`translate(${x*40}px,${y*40}px)`}
$('a-jump').onclick=jump;$('a-act').onclick=()=>interact();$('prompt').onclick=()=>interact();
$('a-chat').onclick=()=>openChat();$('a-mic').onclick=()=>toggleMic();$('a-emo').onclick=()=>togglePop('emopop');
EMOTES.forEach(([k,ic,n],i)=>{const b=document.createElement('button');b.innerHTML=`<b>${ic}</b>${n}`;b.title=`${n}（${i+1}）`;b.onclick=()=>doEmote(k);$('emopop').append(b)});
function togglePop(id,force){const el=$(id);if(!el)return;const open=force??el.hidden;el.hidden=!open;const btn={people:'me-btn',menu:'b-menu',emopop:'a-emo',roompnl:'b-room',lbp:'b-lb',proppop:'a-prop',admq:'b-admin'}[id];if(btn)$(btn)?.setAttribute('aria-expanded',open);
 if(open){for(const o of ['people','menu','roompnl','lbp','admq'])if(o!==id&&o!=='emopop'&&id!=='emopop')togglePop(o,false);if(id==='people')renderPeople();if(id==='roompnl')renderRoomPanel();if(id==='menu')renderSettings()}}
$('me-btn').onclick=()=>togglePop('people');$('b-menu').onclick=()=>togglePop('menu');
$('menu-x').onclick=()=>togglePop('menu',false);$('b-help').onclick=()=>{togglePop('menu',false);$('help').hidden=false};$('help-x').onclick=()=>$('help').hidden=true;$('photo-x').onclick=()=>$('photo').hidden=true;
document.querySelectorAll('#qseg button').forEach(b=>b.onclick=()=>{QUAL=b.dataset.q;store.set('q',QUAL);applyQuality()});
$('t-sfx').onclick=()=>{SFX.on=!SFX.on;store.set('sfx',SFX.on);$('t-sfx').setAttribute('aria-pressed',SFX.on);sfx('click')};$('t-sfx').setAttribute('aria-pressed',SFX.on);
function applyQuality(){const ultra=QUAL==='ultra',lo=QUAL==='low';const pr=Math.min(devicePixelRatio,lo?1:2);renderer.setPixelRatio(pr);composer.setPixelRatio(pr);renderer.shadowMap.enabled=!lo;key.castShadow=!lo;
 key.shadow.mapSize.set(ultra?4096:2048,ultra?4096:2048);if(key.shadow.map){key.shadow.map.dispose();key.shadow.map=null}gtao.enabled=ultra;setReflection(ultra&&!isTouch);resize();
 scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)});document.querySelectorAll('#qseg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.q===QUAL))}
applyQuality();

// ================= chat, feed, toasts =================
function openChat(){if(me.mode==='preview')return;$('chatbar').hidden=false;document.body.classList.add('chatting');$('unread').hidden=true;showFeed();$('msg').focus()}
function closeChat(){$('chatbar').hidden=true;document.body.classList.remove('chatting');showFeed()}
$('msg').addEventListener('blur',()=>setTimeout(()=>{if(!typing())closeChat()},150));
$('chatbar').addEventListener('submit',e=>{e.preventDefault();const t=$('msg').value.trim();if(!t){$('msg').blur();return}if(ACC.mutedUntil>Date.now()){notify({key:'muted',tone:'warn',icon:'volx',text:`你目前被禁言，${Math.ceil((ACC.mutedUntil-Date.now())/6e4)} 分鐘後才能聊天`});return}$('msg').value='';if(isTouch)$('msg').blur();
 feed('',myName,t,OUTFIT[look.cl],look);myBubble={text:t,t:clock.elapsedTime};NET.emit('chat',{t});sfx('click')});
function showFeed(){const open=document.body.classList.contains('chatting');const ch=[...$('feed').children];ch.forEach((c,i)=>c.hidden=!open&&i<ch.length-4);if(open)$('feed').scrollTop=1e9}
function feed(cls,name,text,color,lk){const d=document.createElement('div');d.className='m'+(cls?' '+cls:'');if(cls==='sys'||cls==='ann'){text=String(text).replace(/^[\p{Extended_Pictographic}️‍\s]+/u,'');d.innerHTML=`<svg class="i"><use href="#i-${cls==='ann'?'trophy':'info'}"/></svg>`}else if(lk)d.append(pfEl(lk));
 const body=document.createElement('span');body.className='body';if(name){const b=document.createElement('b');b.textContent=name;b.style.color=color||'#fff';body.append(b)}body.append(document.createTextNode(text));d.append(body);$('feed').append(d);
 while($('feed').children.length>60)$('feed').firstChild.remove();setTimeout(()=>d.classList.add('gone'),cls==='sys'?7000:14000);if(name&&!document.body.classList.contains('chatting'))$('unread').hidden=false;showFeed()}
function announce(t){feed('ann','',`${myName} ${t}`);NET.emit('ann',{t})}
function showCoach(){if(store.get('coached',false))return;notify({key:'coach',tone:'tip',title:'小提示',text:`走到機台、球道前按${isTouch?'「互動」':' E '}就能開始玩；點左上角自己的名字可以看誰在線、邀請組隊。`,ms:16000,btns:[{t:'知道了',pri:true,fn:()=>store.set('coached',true)}],onClose:()=>store.set('coached',true)})}
function zoneName(){if(me.y>3){if(me.x>10&&me.z>11.8)return'2F · DJ 舞池';return'2F · 電玩區'}if(inRamp(me.x,me.z))return'樓梯';if(me.x<-6.4&&me.z<-1)return'1F · 保齡球館';if(me.z<-5)return'1F · 復古電玩';if(me.x<-11&&me.z>4)return'1F · 放映室';if(me.x>12&&me.z>7)return'1F · 點心吧';return'1F · 大廳'}

// ================= interactions =================
let near=null;
function findNear(){let best=null,bd=1;for(const t of targets){if(Math.abs(t.f-me.y)>1)continue;const d=Math.hypot(t.x-me.x,t.z-me.z)/(t.r||1.5);if(d<bd){bd=d;best=t}}return best}
function targetLabel(t){if(t.type!=='st')return t.label;const st=stations.get(t.st),g=GAMES[st.game];const other=st.occ[1-t.slot];if(st.occ[t.slot]&&st.occ[t.slot]!==MYID)return`${g.name}（${peerName(st.occ[t.slot])} 在玩）`;
 if(other&&other!==MYID){const p=peers.get(other);return p&&p.stState==='wait'?`⚔️ 加入 ${p.name} 的${g.name}對戰`:`${g.name}（${peerName(other)} 在玩）`}return`${g.name} · 雙人對戰`}
function interact(){if(me.mode==='sit'){standUp();return}if(me.mode!=='walk'||!near)return;const t=near;sfx('click');
 if(t.face!=null)myAv.rotation.y=t.face;
 if(t.type==='bowl')payGate('bowl',()=>enterLane(t.lane));else if(t.type==='cab')payGate(t.game,()=>openGame(t.game,{target:t}));else if(t.type==='st')stationInteract(t);
 else if(t.type==='tv')openTV();else if(t.type==='sit'||t.type==='ride')sitDown(t);
 else if(t.type==='vend'){buyItem('cola').then(r=>{if(r.error){notify({tone:'err',icon:'coin',text:r.error==='coins'?'代幣不夠喔！玩遊戲可以賺代幣':'販賣機故障中',ms:3000});return}heldItem(myAv,'drink');doEmote('drink');sfx('coin');notify({tone:'ok',icon:'bag',text:`買了一瓶霓虹可樂（剩 ${ACC.coins} 代幣）`,ms:2500,quiet:true})})}
 else if(t.type==='snack'){joinShopQueue()}
 else if(t.type==='photo')enterBooth()}
function sitDown(t){me.mode='sit';me.seat=t;me.pose=t.type==='ride'?'ride':'sit';me.x=t.seat.x;me.z=t.seat.z;me.y=t.seat.y;me.vy=0;myAv.rotation.y=t.seat.face??t.face??0;if(t.obj)t.obj.userData.ride=true;sendPresence(true)}
function standUp(){const t=me.seat;me.mode='walk';me.pose='';if(t){if(t.obj)t.obj.userData.ride=false;me.x=t.x;me.z=t.z;me.y=0}me.seat=null;sendPresence(true)}
function takePhoto(){sfx('flash');const pos=camera.position.clone(),q=camera.quaternion.clone();const f=new THREE.Vector3(Math.sin(myAv.rotation.y),0,Math.cos(myAv.rotation.y));
 camera.position.set(me.x+f.x*2.3,me.y+1.15,me.z+f.z*2.3);camera.lookAt(me.x,me.y+.75,me.z);me.emote='heart';me.et=clock.elapsedTime-.6;animAvatar(myAv,clock.elapsedTime,0,0,'heart',me.et,false,false,'');
 renderer.render(scene,camera);let url='';try{url=renderer.domElement.toDataURL('image/jpeg',.9)}catch(e){}camera.position.copy(pos);camera.quaternion.copy(q);
 if(url){$('photo-img').src=url;$('photo-cap').textContent=`${myName} · ${new Date().toLocaleDateString('zh-TW')}`;$('photo').hidden=false}}

// ================= movement / camera =================
const ray=new THREE.Raycaster(),camT=new THREE.Vector3(),camDir=new THREE.Vector3(),tv3=new THREE.Vector3(),camP=new THREE.Vector3();
function camFollow(target,dt){camDir.set(Math.sin(camYaw)*Math.cos(camPitch),Math.sin(camPitch),Math.cos(camYaw)*Math.cos(camPitch));ray.set(target,camDir);ray.far=camDist+.4;
 const hit=ray.intersectObjects(camBlock,true)[0];const d=hit?Math.max(.45,hit.distance-.3):camDist;camCur=d<camCur?d:camCur+(d-camCur)*Math.min(1,dt*3);camera.position.copy(target).addScaledVector(camDir,camCur);camera.lookAt(target)}
function toScreen(x,y,z){tv3.set(x,y,z).project(camera);if(tv3.z>1||tv3.z<-1)return null;return[(tv3.x*.5+.5)*innerWidth,(-tv3.y*.5+.5)*innerHeight]}
function collide(nx,nz,y){for(const b of boxes){if(Math.abs(y-b.f)>2)continue;const cx=THREE.MathUtils.clamp(nx,b.x0,b.x1),cz=THREE.MathUtils.clamp(nz,b.z0,b.z1),dx=nx-cx,dz=nz-cz,d=Math.hypot(dx,dz),r=.32;
 if(d<r){if(d>1e-4){nx=cx+dx/d*r;nz=cz+dz/d*r}else{const o=[nx-b.x0,b.x1-nx,nz-b.z0,b.z1-nz],m=Math.min(...o);if(m===o[0])nx=b.x0-r;else if(m===o[1])nx=b.x1+r;else if(m===o[2])nz=b.z0-r;else nz=b.z1+r}}}
 for(const p of peers.values()){if(!p.av||Math.abs(p.cur.y-y)>1)continue;const dx=nx-p.cur.x,dz=nz-p.cur.z,d=Math.hypot(dx,dz);if(d<.55&&d>1e-3){nx=p.cur.x+dx/d*.55;nz=p.cur.z+dz/d*.55}}
 for(const n of npcs){const p=n.a.position;if(Math.abs(p.y-y)>1)continue;const dx=nx-p.x,dz=nz-p.z,d=Math.hypot(dx,dz);if(d<.55&&d>1e-3){nx=p.x+dx/d*.55;nz=p.z+dz/d*.55}}
 return[THREE.MathUtils.clamp(nx,W.x0+.4,W.x1-.4),THREE.MathUtils.clamp(nz,W.z0+.4,W.z1-.4)]}
function walkStep(dt,t){let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+jv.x,iz=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-jv.y;const l=Math.hypot(ix,iz);if(l>1){ix/=l;iz/=l}
 if(me.mode==='sit'){if(l>.3)standUp();else return}
 const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),mx=fx*iz-fz*ix,mz=fz*iz+fx*ix;const run=keys.ShiftLeft||keys.ShiftRight||(isTouch&&l>.92);const sp=run?7:4.4;me.speed=Math.hypot(mx,mz)*sp;
 if(me.speed>.1){const want=Math.atan2(mx,mz);let d=want-myAv.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));myAv.rotation.y+=d*Math.min(1,dt*12);if(me.emote&&!['heart','drink','eat'].includes(me.emote))me.emote=''}
 if(ADMP.fly){const spd=(run?9:5)*dt;me.x=THREE.MathUtils.clamp(me.x+mx*spd*1.6,W.x0+.3,W.x1-.3);me.z=THREE.MathUtils.clamp(me.z+mz*spd*1.6,W.z0+.3,W.z1-.3);me.y=THREE.MathUtils.clamp(me.y+((keys.Space?1:0)-(keys.KeyC||keys.ControlLeft?1:0)+(ADMP.up||0))*spd,0,CEIL-1.6);me.vy=0;me.air=me.y>.05;return}
 const[nx,nz]=ADMP.noclip?[me.x+mx*sp*dt,me.z+mz*sp*dt]:collide(me.x+mx*sp*dt,me.z+mz*sp*dt,me.y);const g0=groundAt(me.x,me.z,me.y),g1=groundAt(nx,nz,me.y),wedge=inRamp(nx,nz)&&rampH(nz)>me.y+.6;
 if(ADMP.noclip||!(g0-g1>.6||wedge)){me.x=THREE.MathUtils.clamp(nx,W.x0+.3,W.x1-.3);me.z=THREE.MathUtils.clamp(nz,W.z0+.3,W.z1-.3)}
 const g=groundAt(me.x,me.z,me.y);me.vy-=18*dt;me.y+=me.vy*dt;if(me.y<=g){me.y=g;me.vy=0;me.air=false}else if(me.vy<=0&&me.y-g<.25&&(inRamp(me.x,me.z)||g>0&&g<1)){me.y=g;me.vy=0;me.air=false}
 if(me.y<F2-.3&&me.z>MZ)me.y=Math.min(me.y,F2-1.5)}
