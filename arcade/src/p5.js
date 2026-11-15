
// ================= bowling: lanes, pinsetters, team sessions =================
const LX=[-17,-15,-11,-9],FOUL=-8,HEAD=-21.6,PIT=-24.4,LANE_W=1.05,PIN_R=.06,BALL_R=.11,LCOL=['#ff6fb1','#62c9ff','#ffd864','#55eeb4'];
const PIN_HOME=[];for(let r=0;r<4;r++)for(let k=0;k<=r;k++)PIN_HOME.push([(k-r/2)*.3,HEAD-r*.26]);
const laneLen=FOUL-PIT,laneZ=(FOUL+PIT)/2,MASK_Z=HEAD+.6,DECK_REST=1.3,SWEEP_REST=1.25;
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const pinGeo=new THREE.LatheGeometry([[0,0],[.05,.01],[.06,.07],[.062,.13],[.052,.2],[.032,.26],[.028,.29],[.04,.33],[.042,.36],[.03,.385],[0,.392]].map(([a,b])=>new THREE.Vector2(a,b)),28);
const stripeGeo=new THREE.TorusGeometry(.03,.006,8,24);stripeGeo.rotateX(Math.PI/2);
const pinMat=new THREE.MeshPhysicalMaterial({color:'#fbfaf6',roughness:.22,clearcoat:1}),stripeMat=std('#e0213e',.4);
const gutGeo=new THREE.CylinderGeometry(.11,.11,laneLen,16,1,true,-Math.PI/2,Math.PI);gutGeo.rotateX(Math.PI/2);gutGeo.scale(1,.45,1);
const maskMats=[];
const marksMat=new THREE.MeshBasicMaterial({map:ctex(256,2048,(g,w,h)=>{const ppm=h/16.4;g.fillStyle='rgba(40,18,6,.85)';g.fillRect(0,h-5,w,5);for(let k=1;k<=7;k++){const d=4.9-Math.abs(4-k)*.18,x=k*w/8,y=h-d*ppm;g.beginPath();g.moveTo(x,y-22);g.lineTo(x-6,y+8);g.lineTo(x+6,y+8);g.closePath();g.fill()}for(let k=1;k<=9;k++){g.beginPath();g.arc(k*w/10,h-2.1*ppm,3.5,0,7);g.fill()}}),transparent:true,depthWrite:false});
{const bed=new THREE.Mesh(new THREE.PlaneGeometry(13,laneLen),M.bed);bed.rotation.x=-Math.PI/2;put(bed,-13,.003,laneZ,{cast:false});
 const pit=new THREE.Mesh(new THREE.PlaneGeometry(13,PIT-W.z0),M.black);pit.rotation.x=-Math.PI/2;put(pit,-13,.004,(PIT+W.z0)/2,{cast:false});
 put(new THREE.Mesh(new THREE.PlaneGeometry(13,1.6),M.black),-13,.8,W.z0+.02,{cast:false});
 for(const [x,w] of [[-18.62,1.75],[-7.38,1.75],[-13,2.45]])put(new THREE.Mesh(RB(w,.3,laneLen,.06),M.dark),x,.15,laneZ,{cast:false});
 const caps=[];for(const x of [-16,-10])caps.push(tg(RB(.48,.07,laneLen,.03),x,.035,laneZ));put(merged(caps,M.dark),0,0,0,{cast:false});
 const edges=[];for(const x of [-17.76,-14.24,-11.76,-8.24])edges.push(tg(new THREE.BoxGeometry(.03,.03,laneLen),x,.3,laneZ));for(const x of [-16,-10])edges.push(tg(new THREE.BoxGeometry(.03,.02,laneLen),x,.075,laneZ));put(merged(edges,glow('#ad93ff',1.4)),0,0,0,{cast:false});
 const ap=new THREE.Mesh(new THREE.PlaneGeometry(13,4),M.approach);ap.rotation.x=-Math.PI/2;put(ap,-13,.006,FOUL+2,{cast:false});
 const maskTex=textTex(1024,360,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#1d1450');gr.addColorStop(1,'#0e0b22');g.fillStyle=gr;g.fillRect(0,0,w,h);for(let i=0;i<9;i++){g.strokeStyle=['#ff6fb1','#62c9ff','#ffd864'][i%3];g.globalAlpha=.25;g.lineWidth=6;g.beginPath();g.moveTo(-100+i*140,h);g.lineTo(100+i*140,0);g.stroke()}g.globalAlpha=1;
  const tw=drawWordmark(g,w/2-70,h-48,54,{blur:.2});g.font='800 50px "Unbounded","Baloo 2",sans-serif';g.fillStyle='#fff';g.textAlign='left';g.textBaseline='middle';g.fillText('BOWL',w/2-70+tw/2+22,h-46)});
 for(const x of [-16,-10]){const mu=new THREE.Mesh(RB(3.7,1.35,.3,.08),[M.dark,M.dark,M.dark,M.dark,new THREE.MeshBasicMaterial({map:maskTex}),M.dark]);put(mu,x,1.62,MASK_Z,{cam:true});
  const lm=new THREE.MeshStandardMaterial({color:'#000',emissive:'#fff3e4',emissiveIntensity:2.2});maskMats.push(lm);put(new THREE.Mesh(new THREE.BoxGeometry(3.6,.04,.04),lm),x,.92,MASK_Z+.14,{cast:false});
  put(new THREE.Mesh(RB(3.7,.25,1.2,.04),M.dark),x,2.42,MASK_Z-.5,{cast:false})}
 put(new THREE.Mesh(RB(13,.12,.12,.04),M.metal),-13,4.25,FOUL-.45);for(const x of [-19.4,-6.6])put(new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,CEIL-4.25,8),M.metal),x,(CEIL+4.25)/2,FOUL-.45);
 for(const x of [-16,-10]){const br=put(new THREE.Mesh(RB(.5,.6,1.1,.12),M.cab),x,.3,FOUL+2.4);solid(br,0,.04);put(new THREE.Mesh(new THREE.BoxGeometry(.44,.03,.9),glow('#62c9ff',1.4)),x,.61,FOUL+2.4,{cast:false});
  sofa(x,0,-2.2,Math.PI,x<-12?'#ff8fbf':'#7fd9ff',3.3)}
 {const t=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.05,28),M.white);put(t,-13,.74,-2.2);const p=new THREE.Mesh(new THREE.CylinderGeometry(.04,.2,.72,12),M.metal);put(p,-13,.36,-2.2);solid(t,0,.02)}
 {const rack=new THREE.Group();const fr=[];[0,.45,.9].forEach(y=>fr.push(tg(new THREE.BoxGeometry(.5,.04,2.2),0,.35+y,0)));[-1.05,1.05].forEach(z=>fr.push(tg(new THREE.BoxGeometry(.5,1.4,.05),0,.75,z)));rack.add(merged(fr,M.metal));
  const bl=[];for(let r=0;r<3;r++)for(let k=0;k<7;k++)bl.push(colorize(tg(new THREE.SphereGeometry(.11,20,14),0,.48+r*.45,-.9+k*.3),['#ff6fb1','#62c9ff','#ffd864','#55eeb4','#ad93ff','#ff9a5c','#f2efff'][(r*3+k)%7]));
  rack.add(new THREE.Mesh(mergeGeometries(bl),new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.12,clearcoat:1})));put(rack,-19.35,0,-2.6);solid(rack,0,.02)}
 {const g=new THREE.Group();const c=new THREE.Mesh(RB(.7,1.05,2.4,.08),phys('#62c9ff'));c.position.y=.525;const t=new THREE.Mesh(RB(.85,.06,2.55,.03),M.white);t.position.y=1.08;g.add(c,t);
  const sh=[];for(let r=0;r<3;r++)for(let k=0;k<5;k++)sh.push(colorize(tg(RB(.28,.12,.4,.03),-.27,.4+r*.5,-.9+k*.45),['#ff6fb1','#ffd864','#55eeb4','#ad93ff'][(r+k)%4]));const shelf=new THREE.Group();shelf.add(new THREE.Mesh(mergeGeometries(sh),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6})));
  const sb=new THREE.Mesh(RB(.4,1.55,2.4,.05),phys('#3a2b70'));sb.position.set(.08,.78,0);shelf.add(sb);shelf.position.x=1.3;g.add(shelf);put(g,-4.8,0,-1.8);solid(c,0,.03);solid(sb,0,.02);
  const s=sign('租鞋','#62c9ff',1.2,-4.8,1.7,-1.8,-Math.PI/2);s.position.x=-5.16;
  {const ls=[];for(let r=0;r<3;r++)ls.push(tg(RB(.42,.035,2.36,.01),-.2,.33+r*.5,0));const lm=new THREE.Mesh(mergeGeometries(ls),M.metal);shelf.add(lm)}
  poster(1,-3.19,.86,-1.2,Math.PI/2,.68);poster(4,-3.19,.86,-2.4,Math.PI/2,.68)}
}
const lanes=LX.map((x,i)=>{const L={x,i,pins:[],state:null,sim:null,ps:null,ret:null,flash:0};
 const s=new THREE.Mesh(new THREE.PlaneGeometry(LANE_W,laneLen),M.lane);s.rotation.x=-Math.PI/2;put(s,x,.01,laneZ,{cast:false});
 const d=new THREE.Mesh(new THREE.PlaneGeometry(LANE_W,laneLen),marksMat);d.rotation.x=-Math.PI/2;put(d,x,.012,laneZ,{cast:false,recv:false});
 for(const sd of [-1,1])put(new THREE.Mesh(gutGeo,M.gutter),x+sd*(LANE_W/2+.11),.056,laneZ,{cast:false});
 const mc=cv(512,288);const mt=tex(mc);L.mon={c:mc,g:mc.getContext('2d'),t:mt,fx:null,seq:-1};const smat=new THREE.MeshBasicMaterial({map:mt,toneMapped:false});
 const hood=new THREE.Group();hood.position.set(x,3.55,FOUL-.45);hood.rotation.x=.2;scene.add(hood);const hb=new THREE.Mesh(RB(1.72,1,.12,.05),std('#0b0a14',.35,.4));hb.castShadow=true;hood.add(hb);const sc=new THREE.Mesh(new THREE.PlaneGeometry(1.58,.89),smat);sc.position.z=.062;hood.add(sc);
 const s2=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.84),smat);s2.position.set(x,1.72,MASK_Z+.16);scene.add(s2);
 for(let p=0;p<10;p++){const g=new THREE.Group();const m=new THREE.Mesh(pinGeo,pinMat);m.castShadow=true;g.add(m);[.27,.3].forEach(hh=>{const st=new THREE.Mesh(stripeGeo,stripeMat);st.position.y=hh;g.add(st)});scene.add(g);L.pins.push({g,x:0,z:0,y:0,vx:0,vz:0,down:false,gone:false,tilt:0,tdx:0,tdz:1})}
 L.ballMat=new THREE.MeshPhysicalMaterial({color:LCOL[i],roughness:.1,clearcoat:1,clearcoatRoughness:.02});L.ball=new THREE.Mesh(new THREE.SphereGeometry(BALL_R,32,20),L.ballMat);L.ball.castShadow=true;L.ball.visible=false;scene.add(L.ball);
 L.ret=new THREE.Mesh(new THREE.SphereGeometry(BALL_R,32,20),L.ballMat);L.ret.visible=true;const pc=x<-12?-16:-10;L.retPos=new THREE.Vector3(pc+(x<pc?-.12:.12),.72,FOUL+2.75);L.ret.position.copy(L.retPos);scene.add(L.ret);
 L.deck=new THREE.Mesh(RB(1.02,.08,1.05,.03),std('#3a3550',.35,.7,{normalMap:brushed}));L.deck.position.set(x,DECK_REST,HEAD-.39);scene.add(L.deck);
 L.sweep=new THREE.Mesh(RB(1.2,.24,.05,.02),std('#55506e',.3,.75));L.sweep.position.set(x,SWEEP_REST,HEAD+.3);scene.add(L.sweep);
 rack(L,1023);targets.push({type:'bowl',lane:i,x,z:FOUL+1.6,f:0,y:1.75,face:Math.PI,label:''});return L});
boxes.push({x0:-19.6,x1:-6.4,z0:W.z0,z1:FOUL-.25,f:0});
function rack(L,mask,yOff=0){L.pins.forEach((p,k)=>{const[hx,hz]=PIN_HOME[k];p.x=L.x+hx;p.z=hz;p.y=yOff;p.vx=p.vz=0;p.down=false;p.tilt=0;p.gone=!(mask>>k&1);p.g.visible=!p.gone;syncPin(p)})}
const axTmp=new THREE.Vector3();
function syncPin(p){p.g.position.set(p.x,.01+p.y,p.z);p.g.quaternion.identity();if(p.tilt>0){axTmp.set(p.tdz,0,-p.tdx).normalize();p.g.quaternion.setFromAxisAngle(axTmp,p.tilt);p.g.position.y=.01+p.y+Math.sin(p.tilt)*.05}}
function standingMask(L){let m=0;L.pins.forEach((p,k)=>{if(!p.gone&&!p.down)m|=1<<k});return m}
// ---- frame maths ----
function frameInfo(r){let i=0;for(let f=0;f<9;f++){if(i>=r.length)return{frame:f,ri:0,rerack:true,ended:false};if(r[i]===10){i++;continue}if(i+1>=r.length)return{frame:f,ri:1,rerack:false,ended:false};i+=2}
 const t=r.slice(i);if(t.length===0)return{frame:9,ri:0,rerack:true,ended:false};if(t.length===1)return{frame:9,ri:1,rerack:t[0]===10,ended:false};
 if(t.length===2){if(!(t[0]===10||t[0]+t[1]===10))return{frame:9,ri:2,ended:true};return{frame:9,ri:2,rerack:(t[0]===10&&t[1]===10)||(t[0]<10&&t[0]+t[1]===10),ended:false}}return{frame:9,ri:3,ended:true}}
function frameScores(r){const out=[];let s=0,i=0;for(let f=0;f<10;f++){if(i>=r.length){out.push(null);continue}
 if(r[i]===10){if(r[i+1]==null||r[i+2]==null){out.push(null);i++;continue}s+=10+r[i+1]+r[i+2];out.push(s);i++}
 else{if(r[i+1]==null){out.push(null);i+=2;continue}if(r[i]+r[i+1]===10){if(r[i+2]==null){out.push(null);i+=2;continue}s+=10+r[i+2]}else s+=r[i]+r[i+1];out.push(s);i+=2}}return out}
function laneMarks(r){const out=[];let i=0;for(let f=0;f<10;f++){const m=[];if(f<9){const a=r[i],b=r[i+1];if(a===10){m.push('X');i++}else{if(a!=null)m.push(a===0?'-':a);if(b!=null)m.push(a+b===10?'/':b===0?'-':b);if(a!=null)i+=2}}
 else{let prev=null;for(const v of r.slice(i)){if(prev!=null&&prev<10&&prev+v===10){m.push('/');prev=null}else{m.push(v===10?'X':v===0?'-':v);prev=v===10?null:v}}}out.push(m)}return out}
const total=r=>frameScores(r).filter(x=>x!=null).pop()||0;

// ---- my aiming state ----
const AIM={pos:0,ang:0,t0:0,power:0,charging:false,pt:0};
let myLane=-1;
const laneOf=i=>lanes[i];
function sessionHas(st,id){return st&&st.ps.some(p=>p[0]===id)}
function enterLane(i){const L=lanes[i];const st=L.state;
 if(st&&!sessionHas(st,MYID)){if(st.ps.length>=4){toast(`第 ${i+1} 道已經滿 4 人了`);return}NET.emit('ln',{t:'join',lane:i,name:myName});toast(`已請求加入 ${peerName(st.host)} 的第 ${i+1} 道`,[],3000);goLane(i);return}
 if(st&&sessionHas(st,MYID)){goLane(i);return}
 const mates=partyMates().filter(id=>peers.has(id));
 const start=withParty=>{const ps=[[MYID,myName]];L.state={lane:i,host:MYID,ps,turn:0,rolls:{},stand:1023,rr:true,phase:'aim',seq:1,fx:''};L.state.rolls[MYID]=[];broadcastLane(L);goLane(i);
  if(withParty)for(const id of mates)NET.emit('ln',{t:'inv',lane:i,to:id});feed('sys','',withParty?`🎳 開了第 ${i+1} 道，已邀請隊友一起打`:`🎳 開始在第 ${i+1} 道打保齡球`)};
 if(mates.length)toast(`要和隊友一起打第 ${i+1} 道嗎？大家會輪流投球`,[{t:'自己打',fn:()=>start(false)},{t:'和隊伍一起打',pri:true,fn:()=>start(true)}],12000);else start(false)}
function goLane(i){myLane=i;me.mode='bowl';document.body.classList.add('busy');$('bowl').hidden=false;togglePop('people',false);togglePop('emopop',false);Object.assign(AIM,{pos:0,power:0,charging:false,t0:clock.elapsedTime});renderLaneHUD();sendPresence(true)}
function leaveLane(){if(me.mode!=='bowl')return;setTimeout(flushInvites,700);const L=lanes[myLane];const st=L.state;
 if(st){if(st.host===MYID){if(st.ps.length>1){st.ps=st.ps.filter(p=>p[0]!==MYID);st.host=st.ps[0][0];st.turn=Math.min(st.turn,st.ps.length-1);st.seq++;broadcastLane(L)}else{L.state=null;NET.emit('ln',{t:'close',lane:myLane});resetLane(L)}}else NET.emit('ln',{t:'leave',lane:myLane})}
 me.mode='walk';document.body.classList.remove('busy');$('bowl').hidden=true;me.x=L.x;me.z=FOUL+2.9;me.y=0;camYaw=0;me.emote='';arrow.visible=false;myLane=-1;sendPresence(true)}
function resetLane(L){L.sim=null;L.ps=null;L.ball.visible=false;L.ret.visible=true;L.ret.position.copy(L.retPos);L.ballMat.color.set(LCOL[L.i]);rack(L,1023);L.deck.position.y=DECK_REST;L.sweep.position.set(L.x,SWEEP_REST,HEAD+.3)}
function broadcastLane(L){const st=L.state;NET.emit('ln',{t:'state',...st});renderLaneHUD()}
function myTurn(L){const st=L.state;return st&&st.phase==='aim'&&st.ps[st.turn]&&st.ps[st.turn][0]===MYID&&!L.sim&&!L.ps}
// ---- throw ----
const hold=(el,fn)=>{let iv=null;const s=e=>{e.preventDefault();fn();clearInterval(iv);iv=setInterval(fn,40)},x=()=>{clearInterval(iv);iv=null};el.addEventListener('pointerdown',s);['pointerup','pointerleave','pointercancel'].forEach(k=>el.addEventListener(k,x))};
hold($('bl'),()=>{AIM.pos=Math.max(-.42,AIM.pos-.025)});hold($('br'),()=>{AIM.pos=Math.min(.42,AIM.pos+.025)});
$('throw').addEventListener('pointerdown',e=>{e.preventDefault();$('throw').setPointerCapture(e.pointerId);bowlPress()});['pointerup','pointercancel'].forEach(k=>$('throw').addEventListener(k,bowlRelease));
$('bx').onclick=leaveLane;
function bowlPress(){const L=lanes[myLane];if(!L)return;const st=L.state;
 if(st&&st.phase==='done'&&st.host===MYID){st.rolls={};st.ps.forEach(p=>st.rolls[p[0]]=[]);st.turn=0;st.stand=1023;st.rr=true;st.phase='aim';st.seq++;st.fx='';broadcastLane(L);applyLaneState(L,st,true);return}
 if(!myTurn(L))return;AIM.charging=true;AIM.power=0;AIM.pt=clock.elapsedTime}
function bowlRelease(){if(!AIM.charging)return;AIM.charging=false;const L=lanes[myLane];if(!L||!myTurn(L))return;const sp=5+AIM.power*8;
 const p={t:'throw',lane:L.i,x:+AIM.pos.toFixed(3),vx:+(Math.sin(AIM.ang)*sp).toFixed(3),vz:+(-Math.cos(AIM.ang)*sp).toFixed(3),hook:+(-Math.sign(AIM.ang)*.35*(1-AIM.power*.5)).toFixed(3),seed:(Math.random()*1e9)|0,c:look.cl};
 NET.emit('ln',p);startSim(L,{...p,i:MYID});me.emote='bowl';me.et=clock.elapsedTime;emoteSeq++;setPow(0);sendPresence(true)}
function startSim(L,p){L.ballMat.color.set(OUTFIT[clampI(p.c,OUTFIT.length)]);L.ret.visible=false;L.ps=null;
 L.sim={ball:{x:L.x+THREE.MathUtils.clamp(num(p.x),-.45,.45),z:FOUL+.3,vx:THREE.MathUtils.clamp(num(p.vx),-3,3),vz:THREE.MathUtils.clamp(num(p.vz),-14,-3),gut:false},hook:THREE.MathUtils.clamp(num(p.hook),-.5,.5),rng:mulberry(num(p.seed)),t:0,by:p.i,stand:L.state?L.state.stand:standingMask(L),sent:false,rumble:false};
 rack(L,L.sim.stand);L.ball.visible=true;if(camera.position.distanceTo(L.ball.position)<14)sfx('roll')}
function knock(p){p.down=true;const s=Math.hypot(p.vx,p.vz)||1;p.tdx=p.vx/s;p.tdz=p.vz/s}
function simStep(L,dt){const S=L.sim,b=S.ball;S.t+=dt;const n=4,h=dt/n;let hitNow=false;
 for(let s=0;s<n;s++){
  if(!b.gut&&b.z>-19.5)b.vx+=S.hook*h*(b.z<-13?1:.3);
  b.x+=b.vx*h;b.z+=b.vz*h;
  if(!b.gut&&Math.abs(b.x-L.x)>LANE_W/2-.02){b.gut=true;b.vx=0}
  if(b.gut)b.x=L.x+Math.sign(b.x-L.x)*(LANE_W/2+.1);
  if(b.z<PIT){b.vz=0;b.vx=0}
  if(!b.gut)for(const p of L.pins){if(p.gone)continue;const dx=p.x-b.x,dz=p.z-b.z,d=Math.hypot(dx,dz),m=BALL_R+PIN_R+(p.down?.08:0);
   if(d<m&&d>0){const nx=dx/d,nz=dz/d,spd=Math.hypot(b.vx,b.vz);p.vx=nx*spd*.8+b.vx*.25+(S.rng()-.5)*.4;p.vz=nz*spd*.8+b.vz*.25;p.x=b.x+nx*m;p.z=b.z+nz*m;if(!p.down){knock(p);hitNow=true}b.vx*=.96;b.vz*=.96;b.vx-=nx*.25}}
  for(let i=0;i<10;i++){const a=L.pins[i];if(a.gone)continue;for(let j=i+1;j<10;j++){const c=L.pins[j];if(c.gone)continue;const dx=c.x-a.x,dz=c.z-a.z,d=Math.hypot(dx,dz),m=PIN_R*2+((a.down||c.down)?.17:0);
   if(d<m&&d>0){const nx=dx/d,nz=dz/d,rel=(a.vx-c.vx)*nx+(a.vz-c.vz)*nz;if(rel>0){const imp=rel*.85;a.vx-=nx*imp*.6;a.vz-=nz*imp*.6;c.vx+=nx*imp;c.vz+=nz*imp;if(imp>.25){if(!c.down)knock(c);if(!a.down&&rel>.9)knock(a)}}const o=(m-d)/2;a.x-=nx*o;a.z-=nz*o;c.x+=nx*o;c.z+=nz*o}}}}
 if(hitNow&&!S.rumble){S.rumble=true;if(camera.position.distanceTo(L.ball.position)<18)sfx('pins')}
 let moving=0;for(const p of L.pins){if(p.gone)continue;p.x+=p.vx*dt;p.z+=p.vz*dt;const f=Math.exp(-(p.down?2.2:5)*dt);p.vx*=f;p.vz*=f;moving=Math.max(moving,Math.hypot(p.vx,p.vz));
  if(p.down&&p.tilt<Math.PI/2)p.tilt=Math.min(Math.PI/2,p.tilt+dt*7);if(Math.abs(p.x-L.x)>LANE_W/2+.15||p.z<PIT-.1){p.gone=true;p.g.visible=false}syncPin(p)}
 L.ball.position.set(b.x,BALL_R+(b.gut?-.05:.01),b.z);L.ball.rotation.x-=b.vz*dt/BALL_R;L.ball.visible=b.z>PIT-.05;
 if(!S.sent&&((b.z<=PIT&&moving<.08&&S.t>1.2)||S.t>14)){S.sent=true;if(S.by===MYID){let k=0;L.pins.forEach((p,i)=>{if((S.stand>>i&1)&&(p.down||p.gone))k++});const s=standingMask(L);
  NET.emit('ln',{t:'res',lane:L.i,k,s});if(L.state&&L.state.host===MYID)hostApplyRes(L,k,s,MYID)}}}
// ---- host authority ----
const cloneLane=st=>({...st,ps:st.ps.map(p=>p.slice()),rolls:Object.fromEntries(Object.entries(st.rolls).map(([k,v])=>[k,v.slice()]))});
function hostApplyRes(L,k,s,by){const st=L.state;if(!st||st.phase!=='aim'||!st.ps[st.turn]||st.ps[st.turn][0]!==by)return;k=clampI(k,11);s=s&1023;const prevCopy=cloneLane(st);
 const r=st.rolls[by]||(st.rolls[by]=[]);const before=frameInfo(r);r.push(k);const after=frameInfo(r);
 st.fx=before.rerack&&k===10?'STRIKE!':(!before.rerack&&k>0&&s===0)?'SPARE!':k===0?'GUTTER':'';
 let rer;if(after.ended||after.ri===0){let nt=-1;for(let j=1;j<=st.ps.length;j++){const c=(st.turn+j)%st.ps.length;if(!frameInfo(st.rolls[st.ps[c][0]]||[]).ended){nt=c;break}}if(nt<0)st.phase='done';else st.turn=nt;rer=true}else rer=!!after.rerack;
 st.stand=rer?1023:s;st.rr=rer;st.seq++;broadcastLane(L);applyLaneState(L,st,false,prevCopy)}
// ---- applying shared state ----
const rollCount=s=>Object.values(s.rolls).reduce((a,r)=>a+r.length,0);
function applyLaneState(L,st,instant,prevO){const prev=prevO||L.state,firstSeen=!prev||prev.seq!==st.seq;L.state=st;
 if(!firstSeen&&!instant){renderLaneHUD();return}
 if(st.fx&&prev&&st.seq>prev.seq&&L.mon.seq!==st.seq){L.mon.seq=st.seq;L.mon.fx={text:st.fx,t0:clock.elapsedTime};if(st.fx==='STRIKE!'){L.flash=clock.elapsedTime;if(camera.position.distanceTo(L.deck.position)<22)sfx('strike')}
  if(myLane===L.i){$('bmsg').textContent=st.fx;$('bmsg').classList.remove('pop');void $('bmsg').offsetWidth;$('bmsg').classList.add('pop');setTimeout(()=>{if($('bmsg').textContent===st.fx)$('bmsg').textContent=''},1500);
   if(st.fx==='STRIKE!'&&st.ps.find(p=>p[0]===MYID)&&L.sim&&L.sim.by===MYID){me.emote='cheer';me.et=clock.elapsedTime;emoteSeq++;NET.emit('ann',{t:`在第 ${L.i+1} 道打出 STRIKE！`})}}}
 if(instant){L.sim=null;rack(L,st.stand);L.ball.visible=false;L.ret.visible=true}
 else if(prev&&st.seq>prev.seq&&rollCount(st)!==rollCount(prev)){L.sim=null;L.ball.visible=false;startPinsetter(L,st.stand,st.rr)}
 if(st.phase==='done'&&prev&&prev.phase!=='done'&&sessionHas(st,MYID)){rewardGame('bowl',total(st.rolls[MYID]||[])*3);const sc=st.ps.map(p=>[p[1],total(st.rolls[p[0]]||[])]).sort((a,b)=>b[1]-a[1]);if(sc.length>1)feed('ann','',`🎳 第 ${L.i+1} 道結束：${sc.map(s=>s[0]+' '+s[1]).join('、')}`);else announce(`保齡球拿到 ${sc[0][1]} 分`);sfx('win')}
 renderLaneHUD()}
// ---- pinsetter animation ----
function startPinsetter(L,stand,rerack){L.ps={t:0,stand,rerack,lift:rerack?0:stand};L.ballRetT=clock.elapsedTime+1.6}
function pinsetterStep(L,dt){const P=L.ps;P.t+=dt;const t=P.t,ease=k=>k<0?0:k>1?1:k*k*(3-2*k);
 let sy=SWEEP_REST,sz=HEAD+.3,dy=DECK_REST;
 if(t<.3)sy=SWEEP_REST-(SWEEP_REST-.12)*ease(t/.3);else if(t<2.2)sy=.12;else sy=.12+(SWEEP_REST-.12)*ease((t-2.2)/.35);
 if(t>=1.1&&t<1.6)sz=HEAD+.3+(PIT+.1-HEAD-.3)*ease((t-1.1)/.5);else if(t>=1.6&&t<1.95)sz=PIT+.1+(HEAD+.3-PIT-.1)*ease((t-1.6)/.35);
 if(t<.3)dy=DECK_REST;else if(t<.7)dy=DECK_REST-(DECK_REST-.47)*ease((t-.3)/.4);else if(t<1.1)dy=.47+(DECK_REST-.47)*ease((t-.7)/.4);else if(t<1.95)dy=DECK_REST;else if(t<2.35)dy=DECK_REST-(DECK_REST-.47)*ease((t-1.95)/.4);else dy=.47+(DECK_REST-.47)*ease((t-2.35)/.4);
 L.sweep.position.set(L.x,sy,sz);L.deck.position.y=dy;
 if(t>=.7&&!P.lifted){P.lifted=true;L.pins.forEach((p,k)=>{if(P.lift>>k&1){const[hx,hz]=PIN_HOME[k];p.x=L.x+hx;p.z=hz;p.tilt=0;p.down=false;p.carried=true}else p.carried=false})}
 if(t>=1.1&&t<1.6)L.pins.forEach(p=>{if(!p.carried&&!p.gone&&p.z>sz-.15){p.gone=true;p.g.visible=false}});
 if(t>=1.6&&!P.loaded){P.loaded=true;L.pins.forEach((p,k)=>{const on=P.stand>>k&1;if(on){const[hx,hz]=PIN_HOME[k];p.x=L.x+hx;p.z=hz;p.tilt=0;p.down=false;p.gone=false;p.carried=true;p.g.visible=true}else{p.carried=false;p.gone=true;p.g.visible=false}})}
 if(t>=.7&&t<2.35)L.pins.forEach(p=>{if(p.carried){p.y=Math.max(0,dy-.47);syncPin(p)}});
 if(t>=2.75){rack(L,P.stand);L.ps=null;if(myLane===L.i)renderLaneHUD()}}
const arrow=new THREE.Mesh(new THREE.ConeGeometry(.07,.32,3),glow('#ffd864',2.6));arrow.visible=false;scene.add(arrow);
function laneTick(dt,t){for(const L of lanes){if(L.sim)simStep(L,dt);if(L.ps)pinsetterStep(L,dt);
 if(!L.ret.visible&&!L.sim&&L.ballRetT&&t>L.ballRetT){L.ret.visible=true;L.ret.userData.t0=t;L.ballRetT=0}
 if(L.ret.visible&&L.ret.userData.t0){const k=Math.min(1,(t-L.ret.userData.t0)/.6);L.ret.position.set(L.retPos.x,L.retPos.y+Math.sin(k*Math.PI)*.12,L.retPos.z-.5+k*.5);L.ret.rotation.x=k*6;if(k>=1)L.ret.userData.t0=0}
 const fl=t-L.flash<2.5;const mm=maskMats[L.x<-12?0:1];mm.emissive.setHSL(fl?(t*2)%1:.08,fl?1:.3,fl?.6:.95)}}
// ---- HUD + monitors ----
function setPow(v){$('pow').style.strokeDashoffset=(276.5*(1-v)).toFixed(1)}
function renderLaneHUD(){if(myLane<0)return;const L=lanes[myLane],st=L.state;const box=$('score');box.replaceChildren();
 if(!st){box.innerHTML='<div class="sh">等待中…</div>';return}const cur=st.ps[st.turn];
 const sh=document.createElement('div');sh.className='sh';sh.innerHTML=`<svg class="i sm"><use href="#i-pin"/></svg><span>LANE ${L.i+1}</span><span style="flex:1"></span>`;const sb=document.createElement('b');sb.textContent=st.phase==='done'?'比賽結束':cur?(cur[0]===MYID?'輪到你':cur[1]+' 的回合'):'';sh.append(sb);box.append(sh);
 st.ps.forEach(([id,name],idx)=>{const r=st.rolls[id]||[],sc=frameScores(r),mk=laneMarks(r),fi=frameInfo(r),turn=idx===st.turn&&st.phase==='aim';const row=document.createElement('div');row.className='sr'+(turn?' turn':'');
  const who=document.createElement('div');who.className='who';const lk=id===MYID?look:peers.get(id)?.look;if(lk)who.append(pfEl(lk));const nm=document.createElement('span');nm.textContent=id===MYID?'你':name;who.append(nm);row.append(who);
  for(let f=0;f<10;f++){const fb=document.createElement('div');fb.className='fb'+(turn&&f===fi.frame?' cur':'');const rr=document.createElement('div');rr.className='rr';const m=mk[f];const cells=f<9?(m[0]==='X'?['','X']:[m[0]??'',m[1]??'']):[m[0]??'',m[1]??'',m[2]??''];
   for(const v of cells){const c=document.createElement('span');c.textContent=v;if(v==='X')c.className='x';else if(v==='/')c.className='s';if(f===9)c.style.width='33.4%';rr.append(c)}const tt=document.createElement('div');tt.className='tt';tt.textContent=sc[f]??'';fb.append(rr,tt);row.append(fb)}
  const tot=document.createElement('div');tot.className='tot';tot.textContent=total(r);row.append(tot);box.append(row)});
 const mine=myTurn(L);$('throw').disabled=!(mine||(st.phase==='done'&&st.host===MYID));$('throw-t').textContent=st.phase==='done'?(st.host===MYID?'再來一局':'等房主'):mine?'按住投球':cur&&cur[0]===MYID?'排瓶中…':'看隊友打';
 $('bl').disabled=$('br').disabled=!mine;$('bhint').textContent=st.phase==='done'?'這局結束了！':mine?(isTouch?'左右調站位 · 按住蓄力，箭頭對準時放開':'← → 調站位 · 按住空白鍵蓄力，箭頭對準時放開'):`第 ${L.i+1} 道 · ${st.ps.length} 人一起打`}
const pinXY=[[0,0],[-1,1],[1,1],[-2,2],[0,2],[2,2],[-3,3],[-1,3],[1,3],[3,3]];
function drawMonitor(L,t){const g=L.mon.g,W2=640,H2=360,col=LCOL[L.i],st=L.state;g.setTransform(.8,0,0,.8,0,0);
 const bg=g.createLinearGradient(0,0,0,H2);bg.addColorStop(0,'#141036');bg.addColorStop(1,'#26145a');g.fillStyle=bg;g.fillRect(0,0,W2,H2);g.textBaseline='middle';
 if(!st){g.textAlign='center';g.fillStyle=col;g.shadowColor=col;g.shadowBlur=24;g.font='800 72px "Baloo 2",sans-serif';g.fillText('LANE '+(L.i+1),W2/2,118+Math.sin(t*2)*6);g.shadowBlur=0;
  g.fillStyle='#fff';g.font='700 26px "Noto Sans TC",sans-serif';if(Math.sin(t*3)>-.4)g.fillText('空球道 · 站上助走道按 E 開始',W2/2,200);
  for(let k=0;k<10;k++){const[a,b]=pinXY[k];g.fillStyle=`hsla(${(t*80+k*30)%360},90%,70%,.95)`;g.beginPath();g.arc(W2/2+a*24,246+b*20,8,0,7);g.fill()}L.mon.t.needsUpdate=true;return}
 g.fillStyle=col;g.fillRect(0,0,W2,46);g.fillStyle='#140f30';g.font='800 26px "Baloo 2","Noto Sans TC",sans-serif';g.textAlign='left';const cur=st.ps[st.turn];g.fillText(`LANE ${L.i+1}  ·  ${st.phase==='done'?'比賽結束':(cur?cur[1]+' 的回合':'')}`,16,24);
 const rows=st.ps.slice(0,4),rh=Math.min(70,(H2-60)/Math.max(1,rows.length)),fw=(W2-150)/10;
 rows.forEach(([id,name],ri)=>{const r=st.rolls[id]||[],sc=frameScores(r),mk=laneMarks(r),y=56+ri*rh,turn=ri===st.turn&&st.phase==='aim';
  g.fillStyle=turn?'rgba(255,216,100,.16)':'rgba(255,255,255,.05)';g.beginPath();g.roundRect(8,y,W2-16,rh-6,10);g.fill();g.fillStyle=turn?'#ffd864':'#fff';g.textAlign='left';g.font=`700 ${rows.length>2?18:22}px "Noto Sans TC",sans-serif`;g.fillText(name.slice(0,6),18,y+rh/2-3);
  g.textAlign='center';for(let f=0;f<10;f++){const x=110+f*fw;g.fillStyle='#fff';g.font=`800 ${rows.length>2?15:19}px "Baloo 2",sans-serif`;g.fillText(mk[f].join(' '),x+fw/2,y+rh*.3);g.fillStyle='#ffd864';g.font=`800 ${rows.length>2?15:20}px "Baloo 2",sans-serif`;g.fillText(sc[f]??'',x+fw/2,y+rh*.66)}
  g.fillStyle='#ffd864';g.font=`800 ${rows.length>2?22:28}px "Baloo 2",sans-serif`;g.fillText(total(r),W2-40,y+rh/2-3)});
 if(rows.length===1){g.fillStyle='rgba(255,255,255,.06)';g.beginPath();g.roundRect(30,150,236,190,14);g.fill();const mask=L.sim?standingMask(L):st.stand;for(let k=0;k<10;k++){const[a,b]=pinXY[k],up=mask>>k&1;g.beginPath();g.arc(148+a*27,320-b*38,13,0,7);g.fillStyle=up?'#fff':'rgba(255,111,177,.28)';g.fill()}
  const r=st.rolls[rows[0][0]]||[],last=r.length?r[r.length-1]:null;g.textAlign='left';g.fillStyle='rgba(255,255,255,.62)';g.font='500 21px "Noto Sans TC",sans-serif';const fi=frameInfo(r);g.fillText(`第 ${fi.frame+1} 格 · 第 ${Math.min(fi.ri,2)+1} 球`,292,190);g.fillStyle='#fff';g.font='800 86px "Baloo 2",sans-serif';g.fillText(last==null?'—':last,292,262);g.font='500 20px "Noto Sans TC",sans-serif';g.fillStyle='rgba(255,255,255,.62)';g.fillText(last==null?'準備投球':'上一球擊倒',292,320)}
 const fx=L.mon.fx;if(fx){const k=(t-fx.t0)/2.2;if(k>1)L.mon.fx=null;else{g.fillStyle=`rgba(10,6,30,${.8*(1-k*k)})`;g.fillRect(0,0,W2,H2);const c2=fx.text==='STRIKE!'?'#ff6fb1':fx.text==='SPARE!'?'#62c9ff':'#ffd864';
  if(fx.text==='STRIKE!'||fx.text==='SPARE!'){for(let i=0;i<44;i++){const a=i/44*Math.PI*2+i,r=k*430*(.4+(i%5)/5);g.fillStyle=['#ff6fb1','#62c9ff','#ffd864','#55eeb4'][i%4];g.globalAlpha=1-k;g.fillRect(W2/2+Math.cos(a)*r,H2/2+Math.sin(a)*r*.6+k*k*120,11,11)}g.globalAlpha=1;
   for(let j=0;j<3;j++){const x=W2/2+(j-1)*120,fall=Math.min(1,k*3);g.save();g.translate(x,H2/2+100);g.rotate((j-1)*fall*1.3);g.fillStyle='#fff';g.beginPath();g.roundRect(-11,-72,22,72,10);g.fill();g.fillStyle='#e0213e';g.fillRect(-11,-56,22,6);g.restore()}}
  const s2=1+Math.max(0,.6-k*3);g.save();g.translate(W2/2,H2/2-24);g.scale(s2,s2);g.textAlign='center';g.font='800 118px "Baloo 2",sans-serif';g.fillStyle=c2;g.shadowColor=c2;g.shadowBlur=40;g.fillText(fx.text,0,0);g.shadowBlur=0;g.restore()}}
 L.mon.t.needsUpdate=true}
// ---- lane camera + my aim ----
function laneCamera(dt,t){const L=lanes[myLane];if(!L)return;const st=L.state,cur=st&&st.ps[st.turn],isMine=!!(st&&st.phase==='aim'&&cur&&cur[0]===MYID),ready=myTurn(L);me.pose='';
 if(ready){AIM.ang=Math.sin((t-AIM.t0)*2.4)*.075;if(AIM.charging){const k=(t-AIM.pt)*1.1%2;AIM.power=k>1?2-k:k}if(keys.ArrowLeft||keys.KeyA)AIM.pos=Math.max(-.42,AIM.pos-dt*.8);if(keys.ArrowRight||keys.KeyD)AIM.pos=Math.min(.42,AIM.pos+dt*.8);setPow(AIM.power);
  L.ball.visible=true;L.ball.position.set(L.x+AIM.pos,BALL_R+.01,FOUL+.3);L.ret.visible=false;arrow.visible=true;arrow.position.set(L.x+AIM.pos+Math.sin(AIM.ang)*.9,.08,FOUL+.3-Math.cos(AIM.ang)*.9);arrow.rotation.set(-Math.PI/2,0,-AIM.ang)}else arrow.visible=false;
 if(L.sim){const b=L.sim.ball,fz=Math.max(b.z,-18.6);camP.set(L.x+(b.x-L.x)*.4,1,fz+2.6);camT.set(L.x,.1,Math.min(fz-4,HEAD))}
 else if(isMine){camP.set(L.x+AIM.pos-.15,2.05,FOUL+4.3);camT.set(L.x,.15,-15)}else{camP.set(L.x,2.5,FOUL+5.2);camT.set(L.x,.2,-16)}
 if(isMine||(L.sim&&L.sim.by===MYID)){me.x=L.x+AIM.pos;me.z=FOUL+1.25;me.y=0;myAv.rotation.y=Math.PI}
 else{const slot=Math.max(0,st?st.ps.findIndex(p=>p[0]===MYID):0),pc=L.x<-12?-16:-10;me.x=pc-1.2+slot*.8;me.z=-2.25;me.y=.42;me.pose='sit';myAv.rotation.y=Math.PI}
 camera.position.lerp(camP,1-Math.exp(-dt*5));camera.lookAt(camT)}
