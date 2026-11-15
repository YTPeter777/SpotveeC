
// ================= world helpers =================
const RB=(w,h,d,r=.06)=>new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/2-.002,h/2-.002,d/2-.002));
const boxes=[],camBlock=[],targets=[],anims=[],stations=new Map();
function put(m,x,y,z,o={}){m.position.set(x,y,z);if(o.ry)m.rotation.y=o.ry;m.traverse(c=>{if(c.isMesh){c.castShadow=o.cast!==false&&!c.material.transparent&&!c.material.isMeshBasicMaterial;c.receiveShadow=o.recv!==false}});(o.parent||scene).add(m);if(o.cam)camBlock.push(m);return m}
function solid(obj,f,pad=0){obj.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(obj);boxes.push({x0:b.min.x-pad,x1:b.max.x+pad,z0:b.min.z-pad,z1:b.max.z+pad,f});return obj}
function merged(list,mat){return new THREE.Mesh(mergeGeometries(list),mat)}
const tg=(g,x,y,z,rx=0,ry=0,rz=0)=>{if(rx)g.rotateX(rx);if(ry)g.rotateY(ry);if(rz)g.rotateZ(rz);g.translate(x,y,z);return g};
function colorize(g,c){const col=new THREE.Color(c),n=g.attributes.position.count,a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=col.r;a[i*3+1]=col.g;a[i*3+2]=col.b}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g}

// ================= building =================
const W={x0:-20,x1:20,z0:-26,z1:18},CEIL=12,F2=6,MZ=4;
const RAMP={x0:16.5,x1:19.5,z0:-10,z1:MZ};
const rampH=z=>(z-RAMP.z0)/(RAMP.z1-RAMP.z0)*F2;
const inRamp=(x,z)=>x>RAMP.x0&&x<RAMP.x1&&z>RAMP.z0&&z<RAMP.z1;
const PADS=[];// raised floor pads you can stand on (dance machine, dance floor)
function groundAt(x,z,y){let g=0;if(inRamp(x,z)){const h=rampH(z);if(h<=y+.6)g=Math.max(g,h)}if(z>=MZ&&F2<=y+.6)g=Math.max(g,F2);for(const p of PADS)if(x>p.x0&&x<p.x1&&z>p.z0&&z<p.z1&&p.y<=y+.6)g=Math.max(g,p.y);return g}
let FLOOR1=null;
{const f=new THREE.Mesh(new THREE.PlaneGeometry(40,44),M.floor);f.rotation.x=-Math.PI/2;put(f,0,0,-4,{cast:false});FLOOR1=f;
 const c=new THREE.Mesh(new THREE.PlaneGeometry(40,44),std('#100c24',1));c.rotation.x=Math.PI/2;put(c,0,CEIL,-4,{cast:false,cam:true});
 const wall=(w,h,d,x,y,z)=>put(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M.wall),x,y,z,{cam:true,cast:false});
 wall(40.8,CEIL,.4,0,CEIL/2,W.z0-.2);wall(40.8,CEIL,.4,0,CEIL/2,W.z1+.2);wall(.4,CEIL,44,W.x0-.2,CEIL/2,-4);wall(.4,CEIL,44,W.x1+.2,CEIL/2,-4);
 const trim=(arr,w,d,x,y,z)=>arr.push(tg(new THREE.BoxGeometry(w,.05,d),x,y,z));
 const base=[];trim(base,40,.04,0,.06,W.z0+.02);trim(base,40,.04,0,.06,W.z1-.02);trim(base,.04,44,W.x0+.02,.06,-4);trim(base,.04,44,W.x1-.02,.06,-4);put(merged(base,glow('#ad93ff',1.6)),0,0,0,{cast:false});
 const top=[];trim(top,40,.05,0,CEIL-.3,W.z0+.03);trim(top,40,.05,0,CEIL-.3,W.z1-.03);trim(top,.05,44,W.x0+.03,CEIL-.3,-4);trim(top,.05,44,W.x1-.03,CEIL-.3,-4);put(merged(top,glow('#ff6fb1',2)),0,0,0,{cast:false});
 const mid=[];trim(mid,40,.04,0,F2+.02,W.z0+.025);trim(mid,.04,30,W.x0+.025,F2+.02,-11);trim(mid,.04,30,W.x1-.025,F2+.02,-11);put(merged(mid,glow('#62c9ff',1.4)),0,0,0,{cast:false});
 const lp=[];for(let x=-15;x<=15;x+=7.5)for(let z=-22;z<=14;z+=6)lp.push(tg(RB(3.2,.08,1.1,.04),x,CEIL-.06,z));put(merged(lp,glow('#fff3e4',1.1)),0,0,0,{cast:false});
 const d=W.z1-MZ;const slab=new THREE.Mesh(new THREE.BoxGeometry(40,.3,d),[M.dark,M.dark,M.floor2,std('#1a1534',.9),M.dark,M.dark]);put(slab,0,F2-.15,MZ+d/2,{cam:true});
 put(new THREE.Mesh(new THREE.BoxGeometry(40,.06,.06),glow('#62c9ff',2.2)),0,F2-.15,MZ-.02,{cast:false});
 const dl=[];for(let x=-17;x<=17;x+=4.25)for(let z=6.5;z<=16.5;z+=5)dl.push(tg(new THREE.CircleGeometry(.2,20),x,F2-.31,z,Math.PI/2));put(merged(dl,glow('#fff1dc',1.6)),0,0,0,{cast:false});
 const rw=RAMP.x0-W.x0,rx=(W.x0+RAMP.x0)/2;put(new THREE.Mesh(new THREE.BoxGeometry(rw,1,.04),M.glass),rx,F2+.5,MZ+.04,{cast:false,recv:false});
 put(new THREE.Mesh(RB(rw,.07,.09,.03),M.metal),rx,F2+1.02,MZ+.04);
 const posts=[];for(let x=W.x0+.5;x<RAMP.x0;x+=2.5)posts.push(tg(new THREE.CylinderGeometry(.025,.025,1,8),x,F2+.5,MZ+.04));put(merged(posts,M.metal),0,0,0);
 for(const x of [-14,-6,2,10]){const col=put(new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,F2,28),M.metal),x,F2/2,MZ+.6,{cam:true});solid(col,0,.05);
  [.7,2.6,4.6].forEach(y=>put(new THREE.Mesh(new THREE.TorusGeometry(.27,.025,8,32),glow(['#ad93ff','#ff6fb1','#62c9ff'][Math.abs(x)%3],2)),x,y,MZ+.6,{cast:false}).rotation.x=Math.PI/2)}
 const s=new THREE.Shape(),L=RAMP.z1-RAMP.z0;s.moveTo(0,0);s.lineTo(L,0);s.lineTo(L,F2);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:RAMP.x1-RAMP.x0,bevelEnabled:false});g.rotateY(-Math.PI/2);g.translate(RAMP.x1,0,RAMP.z0);
 put(new THREE.Mesh(g,[std('#2a2152',.8),std('#3d3176',.6)]),0,0,0,{cam:true});
 const ang=Math.atan2(F2,L),steps=[];for(let z=RAMP.z0+1;z<RAMP.z1-.2;z+=1)steps.push(tg(new THREE.BoxGeometry(RAMP.x1-RAMP.x0-.3,.02,.06),(RAMP.x0+RAMP.x1)/2,rampH(z)+.015,z,-ang));put(merged(steps,glow('#62c9ff',1.5)),0,0,0,{cast:false});
 const len=Math.hypot(L,F2);const rail=new THREE.Mesh(RB(.07,.07,len,.03),M.metal);rail.rotation.x=-ang;put(rail,RAMP.x0+.04,F2/2+1,(RAMP.z0+RAMP.z1)/2);
 const gr=new THREE.Mesh(new THREE.BoxGeometry(.03,1,len),M.glass);gr.rotation.x=-ang;put(gr,RAMP.x0+.04,F2/2+.5,(RAMP.z0+RAMP.z1)/2,{cast:false,recv:false});
}
// ---- signs & posters ----
function signTex(text,color,sub){return textTex(1024,sub?320:220,(g,w,h)=>{g.textAlign='center';g.textBaseline='middle';const y=sub?h*.38:h/2;
 g.font=`800 ${Math.floor(sub?h*.5:h*.62)}px "Baloo 2","Noto Sans TC",sans-serif`;g.shadowColor=color;g.shadowBlur=h*.12;g.fillStyle=color;g.fillText(text,w/2,y);g.shadowBlur=h*.03;g.fillStyle='#fff';g.globalAlpha=.85;g.fillText(text,w/2,y);g.globalAlpha=1;
 if(sub){g.font=`700 ${Math.floor(h*.2)}px "Noto Sans TC",sans-serif`;g.shadowBlur=h*.06;g.fillStyle=color;g.fillText(sub,w/2,h*.82)}})}
function sign(text,color,w,x,y,z,ry,sub){const t=signTex(text,color,sub);const h=w*(sub?320:220)/1024;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false,depthWrite:false}));m.material.color.setScalar(1.7);m.position.set(x,y,z);m.rotation.y=ry||0;scene.add(m);return m}
sign('STRIKE!','#ff6fb1',9,-13,8.1,W.z0+.03,0,'保齡球館 · BOWLING');
sign('GAME ZONE','#ffd864',8,4.5,5.7,W.z0+.03,0,'復古電玩');
sign('↑ 2F','#62c9ff',3.2,W.x1-.03,3.2,-12.4,-Math.PI/2,'電玩區・DJ 舞池');
sign('1F ↓','#62c9ff',2.4,W.x1-.03,F2+2.6,6.5,-Math.PI/2);
sign('服務台・兌換','#ffd864',3,7,3.95,W.z1-.03,Math.PI);
sign('影音區 · TV','#ad93ff',2.6,W.x0+.03,5.12,11.1,Math.PI/2);
sign('ARCADE 2F','#ff6fb1',8,-8,10.1,W.z1-.03,Math.PI,'電玩區');
sign('DJ','#55eeb4',3,12.8,9.6,W.z1-.03,Math.PI,'DANCE FLOOR');
sign('SNACK','#ff9a5c',3,W.x1-.03,4.75,11,-Math.PI/2);
const POSTERS=[['STRIKE','AVÉRA 保齡球之夜','#ff6fb1','#2a1650'],['SNAKE','貪食蛇大賽','#55eeb4','#0d2a2a'],['HIGH SCORE','挑戰最高分','#ffd864','#2a2010'],['VS','雙人對戰','#62c9ff','#0f1d3a'],['AVÉRA','歡迎光臨','#ad93ff','#1d1440'],['DJ NIGHT','週五舞會','#ff9a5c','#2a1414']];
function posterTex([t,s,c,bg]){return textTex(512,768,(g,w,h)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);for(let i=0;i<14;i++){g.strokeStyle=c;g.globalAlpha=.08+i*.01;g.lineWidth=3;g.beginPath();g.arc(w/2,h*.42,30+i*22,0,7);g.stroke()}g.globalAlpha=1;
 g.fillStyle=c;g.globalAlpha=.9;star(g,w/2,h*.42,110,5);g.globalAlpha=1;g.fillStyle=bg;g.font='800 64px "Baloo 2",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('★',w/2,h*.43);
 g.fillStyle='#fff';g.shadowColor=c;g.shadowBlur=20;g.font=`800 ${t.length>7?70:92}px "Baloo 2",sans-serif`;g.fillText(t,w/2,h*.72);g.shadowBlur=0;g.fillStyle=c;g.font='700 40px "Noto Sans TC",sans-serif';g.fillText(s,w/2,h*.83);
 g.strokeStyle=c;g.lineWidth=10;g.strokeRect(14,14,w-28,h-28)})}
function poster(i,x,y,z,ry,s=1.3){const g=new THREE.Group();const fr=new THREE.Mesh(RB(1.06*s,1.56*s,.05,.02),M.metal);const p=new THREE.Mesh(new THREE.PlaneGeometry(s,1.5*s),new THREE.MeshBasicMaterial({map:posterTex(POSTERS[i%POSTERS.length])}));p.position.z=.03;g.add(fr,p);g.position.set(x,y,z);g.rotation.y=ry;scene.add(g)}
poster(0,W.x1-.04,2.7,-22.5,-Math.PI/2);poster(1,W.x1-.04,2.7,-18.8,-Math.PI/2);poster(2,W.x1-.04,2.7,-15.1,-Math.PI/2);
poster(3,0,3.45,W.z0+.04,0,1.1);poster(4,7.6,3.45,W.z0+.04,0,1.1);poster(5,11.6,3.45,W.z0+.04,0,1.1);
poster(4,W.x0+.04,F2+2.6,8.5,Math.PI/2);poster(1,W.x0+.04,F2+2.6,12.5,Math.PI/2);poster(5,W.x0+.04,2.7,-2.6,Math.PI/2,1.1);

// ---- lights ----
scene.add(new THREE.HemisphereLight('#cfc0ff','#3a2a52',.9));
const key=new THREE.DirectionalLight('#fff1e6',1.45);key.position.set(8,22,6);key.target.position.set(0,0,-4);key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:1,far:60});key.shadow.bias=-.0004;key.shadow.normalBias=.04;scene.add(key,key.target);
[['#ff6fb1',-13,6.5,-17,28],['#62c9ff',4,6,-18,24],['#ffd9b0',0,5.2,11,10],['#ad93ff',-8,10.5,11,20],['#55eeb4',12.8,10,14,18],['#ff9a5c',14,5,11,8]].forEach(([c,x,y,z,i])=>{const l=new THREE.PointLight(c,i,22,1.8);l.position.set(x,y,z);scene.add(l)});
// moving beam lights (fake volumetric cones)
const beamTex=ctex(16,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.85,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,.9)');g.fillStyle=gr;g.fillRect(0,0,w,h)});
function beam(x,y,z,color,len,phase){const pivot=new THREE.Group();pivot.position.set(x,y,z);const geo=new THREE.CylinderGeometry(.08,len<7?.7:1.1,len,24,1,true);geo.translate(0,-len/2,0);
 const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:beamTex,color,transparent:true,opacity:len<7?.12:.2,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));pivot.add(m);
 const head=new THREE.Mesh(new THREE.CylinderGeometry(.16,.12,.3,16),std('#222',.4,.6));pivot.add(head);scene.add(pivot);
 anims.push(t=>{pivot.rotation.z=Math.sin(t*.5+phase)*.55;pivot.rotation.x=Math.cos(t*.37+phase*1.3)*.45})}
beam(-8,CEIL-.2,-1,'#ff6fb1',10,0);beam(6,CEIL-.2,-3,'#62c9ff',10,2);beam(-2,CEIL-.2,-14,'#ad93ff',10,4);beam(10,CEIL-.2,-14,'#55eeb4',10,1);beam(9,CEIL-.2,12,'#ffd864',5.4,3);beam(15,CEIL-.2,15,'#ff6fb1',5.4,5);
// disco ball + light dots over the 2F dance floor
{const ball=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,3),new THREE.MeshStandardMaterial({color:'#ffffff',metalness:1,roughness:.05,flatShading:true,envMapIntensity:3}));ball.position.set(12.8,10.6,14);scene.add(ball);
 put(new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,1.2,6),M.metal),12.8,11.4,14,{cast:false});
 const N=46,dots=new THREE.InstancedMesh(new THREE.CircleGeometry(.09,12),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),N);const dm=new THREE.Matrix4(),dq=new THREE.Quaternion(),ds=new THREE.Vector3(1,1,1),dp=new THREE.Vector3();scene.add(dots);
 const seeds=Array.from({length:N},()=>[rnd()*Math.PI*2,2+rnd()*6,rnd()]);const up=new THREE.Euler(-Math.PI/2,0,0);
 anims.push(t=>{ball.rotation.y=t*.6;for(let i=0;i<N;i++){const[a,r,k]=seeds[i],aa=a+t*.35;dp.set(12.8+Math.cos(aa)*r,F2+.02,14+Math.sin(aa)*r*.7);if(dp.z>17.9||dp.x>19.9){dp.y=F2+1+k*3;dp.z=Math.min(dp.z,17.9)}dq.setFromEuler(up);dm.compose(dp,dq,ds);dots.setMatrixAt(i,dm)}dots.instanceMatrix.needsUpdate=true})}
// hanging neon shapes in the atrium
function neonShape(points,color,x,y,z,s=1){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0]*s,p[1]*s,0)),true);const m=new THREE.Mesh(new THREE.TubeGeometry(curve,120,.045,8,true),glow(color,2.6));const g=new THREE.Group();g.add(m);g.position.set(x,y,z);scene.add(g);
 const wire=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,CEIL-y,4),M.metal);wire.position.y=(CEIL-y)/2+s*1.1;g.add(wire);const ph=rnd()*6;anims.push(t=>{g.rotation.y=Math.sin(t*.4+ph)*.5});return g}
const starPts=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2+Math.PI/2,r=i%2?.45:1;starPts.push([Math.cos(a)*r,Math.sin(a)*r])}
neonShape(starPts,'#ffd864',2,9,-3,1.1);
neonShape([[-1,.5],[-.6,.8],[.6,.8],[1,.5],[1.1,-.4],[.7,-.6],[.3,-.2],[-.3,-.2],[-.7,-.6],[-1.1,-.4]],'#62c9ff',8,9.4,-13,1);
neonShape([[-.2,1],[.5,1],[.1,.15],[.5,.15],[-.4,-1],[-.05,-.1],[-.45,-.1]],'#ff6fb1',-3,9,-12,1.1);
neonShape([[0,-.9],[-.9,0],[-.9,.5],[-.5,.85],[0,.55],[.5,.85],[.9,.5],[.9,0]],'#ff6fb1',13,8.8,-5,.9);
// string lights under the mezzanine edge
{const N=60,b=new THREE.InstancedMesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),N),m4=new THREE.Matrix4(),cols=['#ffd864','#ff6fb1','#62c9ff','#55eeb4'];
 for(let i=0;i<N;i++){const x=W.x0+.3+i*(36/N),seg=(x-W.x0)%4/4,y=F2-.35-Math.sin(seg*Math.PI)*.35;m4.makeTranslation(x,y,MZ-.05);b.setMatrixAt(i,m4);b.setColorAt(i,new THREE.Color(cols[i%4]).multiplyScalar(2))}scene.add(b);
 anims.push(t=>{if((t*4|0)%2)return;})}
// ceiling fans under the mezzanine
function fan(x,z){const g=new THREE.Group();g.position.set(x,F2-.5,z);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,.16,20),M.metal);g.add(hub);const rod=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.35,8),M.metal);rod.position.y=.25;g.add(rod);
 const bl=new THREE.Group();for(let i=0;i<4;i++){const b=new THREE.Mesh(RB(1,.03,.18,.015),std('#c9a27a',.6));b.position.x=.55;const p=new THREE.Group();p.rotation.y=i*Math.PI/2;p.add(b);bl.add(p)}g.add(bl);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.1,16,10),glow('#fff1dc',1.8));lamp.position.y=-.12;g.add(lamp);scene.add(g);anims.push((t,dt)=>{bl.rotation.y+=dt*2.2})}
fan(-6,10);fan(6,7.5);fan(1,14);

// ================= props =================
const prizeCols=['#ff9cc9','#8fd8ff','#ffe08a','#9ff0c8','#c9b4ff','#ffffff','#ffb38a'];
function plushGeos(px,py,pz,s,c,list,dir=1){const b=colorize(tg(new THREE.SphereGeometry(.12*s,14,10),px,py,pz),c);list.push(b);[-1,1].forEach(k=>list.push(colorize(tg(new THREE.SphereGeometry(.045*s,10,8),px+k*.08*s,py+.1*s,pz),c)));list.push(colorize(tg(new THREE.SphereGeometry(.03*s,8,6),px,py-.01*s,pz+dir*.11*s),'#3a2b2e'));[-1,1].forEach(k=>list.push(colorize(tg(new THREE.SphereGeometry(.014*s,6,4),px+k*.045*s,py+.04*s,pz+dir*.105*s),'#1d1640')))}
function sofa(x,f,z,ry,color,w=2.8){const g=new THREE.Group();const m=fabric(color);const seat=new THREE.Mesh(RB(w,.42,.85,.14),m);seat.position.y=.21;const back=new THREE.Mesh(RB(w,.75,.24,.12),m);back.position.set(0,.5,-.42);
 const arms=[-1,1].map(s=>{const a=new THREE.Mesh(RB(.24,.58,.85,.1),m);a.position.set(s*(w/2-.12),.29,0);return a});const pil=[-1,1].map(s=>{const p=new THREE.Mesh(RB(.5,.38,.14,.07),fabric('#fff4e8'));p.position.set(s*(w/2-.55),.55,-.26);p.rotation.z=s*.12;return p});
 g.add(seat,back,...arms,...pil);put(g,x,f,z,{ry});solid(g,f,.02);camBlock.push(back);return g}
function plant(x,f,z,s=1){const g=new THREE.Group();const pot=new THREE.Mesh(new THREE.CylinderGeometry(.3*s,.22*s,.5*s,24),phys('#f3a6c4'));pot.position.y=.25*s;g.add(pot);const lm=std('#5fcf8f',.7);
 [[0,.85,0,.42],[.2,1.15,.08,.3],[-.18,1.08,-.1,.32],[.02,1.38,-.02,.24]].forEach(([a,b,c,r])=>{const l=new THREE.Mesh(new THREE.SphereGeometry(r*s,24,16),lm);l.position.set(a*s,b*s,c*s);g.add(l)});put(g,x,f,z);solid(g,f,.02)}
function lamp(x,z,c){const g=new THREE.Group();const p=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.6,8),M.metal);p.position.y=.8;const b=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.03,20),M.metal);b.position.y=.015;const sh=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,.32,24,1,true),new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.9,side:THREE.DoubleSide}));sh.position.y=1.65;g.add(p,b,sh);put(g,x,0,z);solid(g,0,.02)}
function vending(x,f,z,ry,col){const g=new THREE.Group();const b=new THREE.Mesh(RB(1.1,2.05,.8,.08),phys(col));b.position.y=1.025;const panel=new THREE.Mesh(new THREE.PlaneGeometry(.78,1.25),new THREE.MeshBasicMaterial({map:vendTex,toneMapped:false}));panel.position.set(-.08,1.25,.405);
 const slot=new THREE.Mesh(new THREE.BoxGeometry(.6,.18,.05),M.black);slot.position.set(-.08,.35,.4);g.add(b,panel,slot);put(g,x,f,z,{ry});solid(g,f,.03);camBlock.push(b);
 const fx=Math.sin(ry),fz=Math.cos(ry);targets.push({type:'vend',x:x+fx*1.1,z:z+fz*1.1,f,y:f+2.2,face:ry+Math.PI,label:'買一瓶飲料'})}
const vendTex=ctex(256,400,(g,w,h)=>{g.fillStyle='#e8f6ff';g.fillRect(0,0,w,h);const cs=['#ff6fb1','#62c9ff','#ffd864','#55eeb4','#ff9a5c','#ad93ff'];for(let r=0;r<4;r++)for(let c=0;c<4;c++){const x=18+c*58,y=20+r*92;g.fillStyle=cs[(r*4+c)%6];g.beginPath();g.roundRect(x,y,40,70,10);g.fill();g.fillStyle='rgba(255,255,255,.6)';g.fillRect(x+8,y+10,6,40);g.fillStyle='#8a86b0';g.fillRect(x,y+76,40,6)}});

// ---- arcade cabinet family ----
const GAMES={snake:{name:'貪食蛇',col:'#55eeb4',hint:'方向鍵或滑動控制方向，吃到光點變長'},stack:{name:'疊疊樂',col:'#62c9ff',hint:'空白鍵或點一下，把方塊疊準'},mole:{name:'打地鼠',col:'#ffd864',hint:'30 秒內點到愈多地鼠愈好'},brick:{name:'打磚塊',col:'#ff9a5c',hint:'左右移動擋板，把磚塊全部打掉'},
 racer:{name:'極速賽車',col:'#ff6178',hint:'左右換車道閃開障礙物',vs:true},hoops:{name:'投籃機',col:'#ff9a5c',hint:'籃框對準時投籃，40 秒比分數',vs:true},hockey:{name:'空氣曲棍球',col:'#62c9ff',hint:'拖曳擋板把球打進對面球門，先拿 7 分',vs:true,ai:true},
 dance:{name:'跳舞機',col:'#ff6fb1',hint:'箭頭碰到上面的框框時按下對應方向',vs:true},c4:{name:'四子棋',col:'#ffd864',hint:'輪流放棋子，先連成四顆的人贏',vs:true,ai:true},claw:{name:'夾娃娃',col:'#ff9cc9',hint:'移動爪子，按下「抓」試試手氣'},coin:{name:'推幣機',col:'#ffd864',hint:'看準時機投幣，把硬幣推下去'}};
const CAB_GAMES=['snake','stack','mole','brick'];
const attract={};for(const k in GAMES){const c=cv(256,192),sc=cv(384,512);const t=tex(CAB_GAMES.includes(k)?sc:c);attract[k]={c,g:c.getContext('2d'),sc,sg:sc.getContext('2d'),t,mat:new THREE.MeshBasicMaterial({map:t,toneMapped:false})}}
// vertical arcade monitor: AVÉRA header, the game's attract loop, blinking INSERT COIN, scanlines
function composeAttract(k,time){const a=attract[k],g=a.sg,W=384,H=512;const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#100c2a');gr.addColorStop(1,'#05040e');g.fillStyle=gr;g.fillRect(0,0,W,H);
 drawWordmark(g,W/2,44,28,{blur:.25});g.fillStyle=GAMES[k].col;g.font='800 34px "Noto Sans TC","Baloo 2",sans-serif';g.textAlign='center';g.textBaseline='middle';g.shadowColor=GAMES[k].col;g.shadowBlur=14;g.fillText(GAMES[k].name,W/2,96);g.shadowBlur=0;
 g.drawImage(a.c,0,0,256,192,0,128,W,288);if(Math.sin(time*4)>0){g.fillStyle='#ffd27a';g.font='800 25px "Unbounded","Baloo 2",sans-serif';g.fillText('INSERT COIN',W/2,456)}
 g.fillStyle='rgba(255,255,255,.5)';g.font='700 17px "Unbounded",sans-serif';g.fillText('1P  ·  2P',W/2,492);g.fillStyle='rgba(0,0,0,.2)';for(let y=0;y<H;y+=3)g.fillRect(0,y,W,1);a.t.needsUpdate=true}
const marq={};for(const k in GAMES){const t=textTex(512,176,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#140f30');gr.addColorStop(.5,'#2e2166');gr.addColorStop(1,'#140f30');g.fillStyle=gr;g.fillRect(0,0,w,h);for(let i=0;i<10;i++){g.strokeStyle=GAMES[k].col;g.globalAlpha=.12;g.lineWidth=3;g.beginPath();g.moveTo(i*60-40,h);g.lineTo(i*60+40,0);g.stroke()}g.globalAlpha=1;drawWordmark(g,w/2,30,22,{blur:.2});g.textAlign='center';g.textBaseline='middle';g.font='800 74px "Noto Sans TC","Baloo 2",sans-serif';g.shadowColor=GAMES[k].col;g.shadowBlur=18;g.fillStyle=GAMES[k].col;g.fillText(GAMES[k].name,w/2,h*.62);g.shadowBlur=4;g.fillStyle='rgba(255,255,255,.85)';g.fillText(GAMES[k].name,w/2,h*.62)});marq[k]=new THREE.MeshBasicMaterial({map:t,toneMapped:false})}
const sideArt={};for(const k of [...CAB_GAMES,'racer'])sideArt[k]=new THREE.MeshPhysicalMaterial({map:textTex(256,512,(g,w,h)=>{const c=GAMES[k].col;const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#2b2263');gr.addColorStop(1,'#120c30');g.fillStyle=gr;g.fillRect(0,0,w,h);
 for(let i=0;i<7;i++){g.fillStyle=c;g.globalAlpha=.12+i*.05;g.beginPath();g.moveTo(0,h*.25+i*40);g.lineTo(w,h*.1+i*40);g.lineTo(w,h*.1+i*40+14);g.lineTo(0,h*.25+i*40+14);g.fill()}g.globalAlpha=1;
 g.fillStyle=c;star(g,w*.5,h*.72,60,5);g.save();g.translate(w*.5,h*.72);g.fillStyle='#120c30';g.font='800 40px "Baloo 2",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('★',0,2);g.restore();
 g.save();g.translate(w*.5,h*.45);g.rotate(-Math.PI/2);g.fillStyle='#fff';g.shadowColor=c;g.shadowBlur=14;g.font='800 52px "Noto Sans TC",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(GAMES[k].name,0,0);g.restore();g.save();g.translate(w*.5,h*.9);drawWordmark(g,0,0,30,{blur:.15});g.restore()}),roughness:.35,metalness:.1,clearcoat:1});
// upright cabinet modelled on real ones: profiled side panels with T-molding, vertical monitor behind a tilted bezel,
// control panel with joystick and buttons, coin door with lit slots, backlit marquee. All cabinets are batched per material.
const CAB2=(()=>{const Wd=.72,T=.025,IW=Wd-2*T;const P=[[-.36,0],[.30,0],[.30,.82],[.50,.90],[.50,.98],[.26,1.06],[.14,1.62],[.30,1.66],[.30,1.92],[-.36,1.92]];
 const shape=new THREE.Shape(P.map(([z,y])=>new THREE.Vector2(z,y)));const rotSide=g=>{g.rotateY(-Math.PI/2);return g};
 const sideR=rotSide(new THREE.ExtrudeGeometry(shape,{depth:T,bevelEnabled:false,curveSegments:1})).translate(Wd/2,0,0),sideL=rotSide(new THREE.ExtrudeGeometry(shape,{depth:T,bevelEnabled:false,curveSegments:1})).translate(-Wd/2+T,0,0);
 const art=new THREE.ShapeGeometry(shape);const uv=art.attributes.uv,pos=art.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+.36)/.86,pos.getY(i)/1.92);
 const artL=art.clone().rotateY(-Math.PI/2).translate(-Wd/2-.002,0,0),artR=art.clone();{const u=artR.attributes.uv;for(let i=0;i<u.count;i++)u.setX(i,1-u.getX(i))}artR.rotateY(-Math.PI/2).translate(Wd/2+.002,0,0);
 const cpShape=new THREE.Shape([[.26,.84],[.50,.89],[.50,.98],[.26,1.06]].map(([z,y])=>new THREE.Vector2(z,y)));const cp=rotSide(new THREE.ExtrudeGeometry(cpShape,{depth:IW,bevelEnabled:false})).translate(IW/2,0,0);
 const body=mergeGeometries([tg(new THREE.BoxGeometry(IW,1.9,.5),0,.95,-.11),tg(new THREE.BoxGeometry(IW,.82,.02),0,.41,.29),tg(new THREE.BoxGeometry(IW,.02,.66),0,1.91,-.03),tg(new THREE.BoxGeometry(IW,.26,.15),0,1.79,.22),tg(new THREE.BoxGeometry(IW,.6,.12),0,1.34,.13)]);
 const kick=tg(new THREE.BoxGeometry(IW,.1,.03),0,.05,.305);
 const tilt=-Math.atan2(.12,.56),bz=.20,by=1.34;const plane=(w,h,off)=>{const g=new THREE.PlaneGeometry(w,h);g.rotateX(tilt);g.translate(0,by+Math.sin(-tilt)*0+0,bz);g.translate(0,Math.sin(-tilt)*off,Math.cos(tilt)*off);return g};
 const bezel=plane(IW,.575,0),screen=plane(.39,.52,.004),glassG=plane(.44,.56,.012);
 const marq=tg(new THREE.PlaneGeometry(IW,.24),0,1.79,.298);
 const door=mergeGeometries([tg(new THREE.BoxGeometry(.28,.38,.02),0,.46,.305),tg(new THREE.BoxGeometry(.2,.05,.02),0,.2,.305)]);
 const slots=mergeGeometries([tg(new THREE.BoxGeometry(.04,.065,.012),-.06,.56,.318),tg(new THREE.BoxGeometry(.04,.065,.012),.06,.56,.318),tg(new THREE.BoxGeometry(.06,.03,.012),-.06,.38,.318),tg(new THREE.BoxGeometry(.06,.03,.012),.06,.38,.318)]);
 const a=Math.atan2(.08,.24),onCP=(x,s,h)=>[x,.98+.08*s+h*Math.cos(a),.50-.24*s+h*Math.sin(a)];
 const ctl=[];const col=(g,c)=>colorize(g,c);const put2=(g,x,s,h,c)=>{const[px,py,pz]=onCP(x,s,h);g.rotateX(a);g.translate(px,py,pz);ctl.push(col(g,c))};
 put2(new THREE.CylinderGeometry(.045,.045,.008,20),-.17,.45,.004,'#15121f');put2(new THREE.CylinderGeometry(.008,.008,.08,10),-.17,.45,.044,'#cfcfd8');put2(new THREE.SphereGeometry(.028,16,12),-.17,.45,.09,'#ff3b55');
 [['#ff3b55',0,.6],['#ffd23b',.07,.6],['#3bb8ff',.14,.6],['#4fe36f',.035,.3],['#ff8a3b',.105,.3],['#c07bff',.175,.3]].forEach(([c,x,s])=>{put2(new THREE.CylinderGeometry(.024,.024,.014,18),x,s,.007,'#1a1726');put2(new THREE.CylinderGeometry(.019,.019,.02,18),x,s,.016,c)});
 [[-.05,.88,'#ffffff'],[.02,.88,'#ffffff']].forEach(([x,s,c])=>put2(new THREE.CylinderGeometry(.013,.013,.016,14),x,s,.008,c));
 const controls=mergeGeometries(ctl);
 const tm=[];const segs=[1,2,3,4,5,6,7];for(const sx of [-1,1])for(const i of segs){const[z0,y0]=P[i],[z1,y1]=P[i+1],len=Math.hypot(z1-z0,y1-y0);const g=new THREE.BoxGeometry(.03,.022,len);g.rotateX(-Math.atan2(y1-y0,z1-z0));g.translate(sx*(Wd/2-.002),(y0+y1)/2,(z0+z1)/2);tm.push(g)}
 const tmold=mergeGeometries(tm);
 return{Wd,sides:mergeGeometries([sideL,sideR]),art:mergeGeometries([artL,artR]),cp,body,kick,bezel,screen,glass:glassG,marq,door,slots,controls,tmold}})();
const CABQ=new Map();const cabM={side:phys('#241c55',{clearcoat:1,clearcoatRoughness:.08}),body:std('#120e26',.6),cp:phys('#1b1638',{clearcoat:.6}),kick:std('#07060d',.8),bezel:phys('#06050c',{roughness:.15,clearcoat:1}),
 glass:new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.02,transparent:true,opacity:.07,depthWrite:false,clearcoat:1}),door:std('#3a3550',.35,.8,{normalMap:brushed}),slots:glow('#ff9a3d',2.6),controls:new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.25,clearcoat:.8})};
function cabQ(key,mat,geo,m4){let e=CABQ.get(key);if(!e){e={mat,geos:[]};CABQ.set(key,e)}e.geos.push(geo.clone().applyMatrix4(m4))}
function cabinet(gk,x,f,z,ry){const m4=new THREE.Matrix4().makeRotationY(ry).setPosition(x,f,z);
 for(const[k,mat]of [['sides',cabM.side],['body',cabM.body],['cp',cabM.cp],['kick',cabM.kick],['bezel',cabM.bezel],['glass',cabM.glass],['door',cabM.door],['slots',cabM.slots],['controls',cabM.controls]])cabQ(k,mat,CAB2[k],m4);
 cabQ('scr-'+gk,attract[gk].mat,CAB2.screen,m4);cabQ('mq-'+gk,marq[gk],CAB2.marq,m4);cabQ('art-'+gk,sideArt[gk],CAB2.art,m4);cabQ('tm-'+gk,glow(GAMES[gk].col,2.4),CAB2.tmold,m4);
 const hit=new THREE.Mesh(new THREE.BoxGeometry(CAB2.Wd,1.92,.86),M.black);hit.visible=false;hit.position.set(0,.96,.07);const grp=new THREE.Group();grp.add(hit);grp.position.set(x,f,z);grp.rotation.y=ry;scene.add(grp);camBlock.push(hit);solid(grp,f,.04);
 const fx=Math.sin(ry),fz=Math.cos(ry);targets.push({type:'cab',game:gk,x:x+fx*1.05,z:z+fz*1.05,f,y:f+2.25,face:ry+Math.PI,label:`玩 ${GAMES[gk].name}`,cab:{x,f,z,ry}})}
function flushCabinets(){for(const[k,e]of CABQ){const m=new THREE.Mesh(mergeGeometries(e.geos),e.mat);const tr=e.mat.transparent||e.mat.isMeshBasicMaterial;m.castShadow=!tr&&k!=='slots';m.receiveShadow=!tr;if(e.mat.side!==undefined&&k.startsWith('art-'))e.mat.side=THREE.DoubleSide;scene.add(m)}CABQ.clear()}
// 2-player stations: one game, two sides
function station(id,game,slots,extra={}){const st={id,game,slots,occ:[null,null],...extra};stations.set(id,st);slots.forEach((s,i)=>targets.push({type:'st',st:id,slot:i,x:s.x,z:s.z,f:s.f,y:s.f+(s.py||2),face:s.face,label:''}));return st}
function claw(x,f,z,color,id){const g=new THREE.Group();const bm=phys(color);const base=new THREE.Mesh(RB(1.25,.95,1.25,.1),bm);base.position.y=.475;
 const gl=new THREE.Mesh(new THREE.BoxGeometry(1.18,1.15,1.18),M.glass);gl.position.y=1.53;const top=new THREE.Mesh(RB(1.25,.34,1.25,.08),bm);top.position.y=2.27;const lt=new THREE.Mesh(new THREE.BoxGeometry(1.27,.04,1.27),glow('#ffd864',2.2));lt.position.y=2.1;
 const pr=[];for(let k=0;k<14;k++)plushGeos((rnd()-.5)*.8,1.06+rnd()*.18,(rnd()-.5)*.8,1,prizeCols[k%7],pr);const prizes=new THREE.Mesh(mergeGeometries(pr),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9}));
 const cg=new THREE.Group();cg.position.set(0,1.95,0);const rod=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.3,8),M.chrome);rod.position.y=.12;cg.add(rod);const fingers=[];for(let k=0;k<3;k++){const p=new THREE.Group();const a=k/3*Math.PI*2;p.rotation.y=a;const fm=new THREE.Mesh(new THREE.BoxGeometry(.02,.16,.02),M.chrome);fm.position.set(0,-.08,.04);p.add(fm);cg.add(p);fingers.push(p)}
 const mq=new THREE.Mesh(new THREE.PlaneGeometry(1,.22),clawMarq);mq.position.set(0,2.27,.63);g.add(base,gl,top,lt,prizes,cg,mq);const ry=z>0?Math.PI:0;put(g,x,f,z,{ry});solid(g,f,.04);camBlock.push(base);
 const ph=rnd()*9;anims.push(t=>{if(g.userData.busy)return;const k=(t*.25+ph)%1;cg.position.x=Math.sin(t*.7+ph)*.35;cg.position.z=Math.cos(t*.53+ph)*.35;cg.position.y=1.95-(k>.85?Math.sin((k-.85)/.15*Math.PI)*.55:0);fingers.forEach(f=>f.rotation.x=k>.85?-.5:0)});
 g.userData.claw=cg;const fz=Math.cos(ry);targets.push({type:'cab',game:'claw',x,z:z+fz*1.1,f,y:f+2.6,face:ry+Math.PI,label:'玩 夾娃娃',obj:g})}
const clawMarq=new THREE.MeshBasicMaterial({map:textTex(512,112,(g,w,h)=>{g.textAlign='center';g.textBaseline='middle';g.font='800 64px "Noto Sans TC",sans-serif';g.fillStyle='#fff';g.shadowColor='#ff6fb1';g.shadowBlur=14;g.fillText('夾娃娃',w/2,h/2+4)}),transparent:true,toneMapped:false});
function coinPusher(x,f,z){const g=new THREE.Group();const b=new THREE.Mesh(RB(1.5,1.1,1.2,.1),phys('#ffd864'));b.position.y=.55;const top=new THREE.Mesh(RB(1.5,.5,1.2,.1),phys('#ff6fb1'));top.position.y=2.15;
 const gl=new THREE.Mesh(new THREE.BoxGeometry(1.4,.8,1.1),M.glass);gl.position.y=1.5;const shelf=new THREE.Mesh(new THREE.BoxGeometry(1.3,.04,.9),std('#c9c4e8',.3,.8));shelf.position.set(0,1.15,0);
 const pusher=new THREE.Mesh(new THREE.BoxGeometry(1.28,.12,.4),std('#9a94c8',.3,.8));pusher.position.set(0,1.23,-.25);const N=26,coins=new THREE.InstancedMesh(new THREE.CylinderGeometry(.06,.06,.015,16),std('#ffd864',.25,1),N);const m4=new THREE.Matrix4();
 for(let i=0;i<N;i++){m4.makeTranslation((rnd()-.5)*1.1,1.18+(i%3)*.016,(rnd()-.1)*.4);coins.setMatrixAt(i,m4)}const mq=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.32),marq.coin);mq.position.set(0,2.15,.61);
 g.add(b,top,gl,shelf,pusher,coins,mq);put(g,x,f,z);solid(g,f,.04);camBlock.push(b);anims.push(t=>{pusher.position.z=-.3+Math.sin(t*1.4)*.12});
 targets.push({type:'cab',game:'coin',x,z:z+1.15,f,y:f+2.6,face:Math.PI,label:'玩 推幣機'})}
const pinTex=(()=>{const c=cv(256,160);return{c,g:c.getContext('2d'),t:tex(c)}})();
function pinball(x,f,z){const g=new THREE.Group();const body=new THREE.Mesh(RB(.75,.35,1.45,.05),phys('#ff9a5c'));body.position.set(0,.95,0);body.rotation.x=.12;
 const field=new THREE.Mesh(new THREE.PlaneGeometry(.66,1.34),new THREE.MeshBasicMaterial({map:pinTex.t,toneMapped:false}));field.position.set(0,1.13,0);field.rotation.x=-Math.PI/2+.12;
 const legs=[];[[-.32,-.65],[.32,-.65],[-.32,.65],[.32,.65]].forEach(([a,b2])=>legs.push(tg(new THREE.CylinderGeometry(.025,.025,.85,8),a,.42,b2)));const lg=merged(legs,M.chrome);
 const back=new THREE.Mesh(RB(.75,.7,.14,.04),phys('#2b2263'));back.position.set(0,1.62,-.68);const bs=new THREE.Mesh(new THREE.PlaneGeometry(.66,.5),attract.brick.mat);bs.position.set(0,1.62,-.605);
 g.add(body,field,lg,back,bs);put(g,x,f,z);solid(g,f,.04);camBlock.push(body);targets.push({type:'cab',game:'brick',x,z:z+1.15,f,y:f+2.2,face:Math.PI,label:'玩 打磚塊'})}
function racer(x,f,z){const g=new THREE.Group();const cab=new THREE.Mesh(RB(1.3,1.9,.9,.1),phys('#ff6178'));cab.position.set(0,.95,0);const scr=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.75),racerScr.mat);scr.position.set(0,1.35,.455);
 const seat=new THREE.Mesh(RB(.7,.5,.7,.15),fabric('#2b2263'));seat.position.set(0,.45,1.5);const sb=new THREE.Mesh(RB(.7,.8,.18,.08),fabric('#2b2263'));sb.position.set(0,.85,1.82);const base=new THREE.Mesh(RB(1.2,.12,1.9,.05),std('#1a1534',.5,.3));base.position.set(0,.06,1.05);
 const wheel=new THREE.Mesh(new THREE.TorusGeometry(.17,.03,10,24),std('#222',.4));wheel.position.set(0,.98,.82);wheel.rotation.x=-.9;const col=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.4,8),std('#222',.4));col.position.set(0,.85,.65);col.rotation.x=-.9;
 const mq=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.3),marq.racer);mq.position.set(0,1.95,.455);const tr=new THREE.Mesh(new THREE.BoxGeometry(1.32,.04,.04),glow('#ff6178',2.4));tr.position.set(0,.12,.47);
 g.add(cab,scr,seat,sb,base,wheel,col,mq,tr);put(g,x,f,z);solid(g,f,.03);camBlock.push(cab);anims.push(t=>{wheel.rotation.z=Math.sin(t*1.7+x)*.4});return g}
const racerScr=(()=>{const c=cv(256,176);const t=tex(c);return{c,g:c.getContext('2d'),t,mat:new THREE.MeshBasicMaterial({map:t,toneMapped:false})}})();
function airHockey(x,f,z,ry,id){const g=new THREE.Group();const t=new THREE.Mesh(RB(1.45,.82,2.5,.08),phys('#3b6cff',{clearcoat:1}));t.position.y=.41;
 const top=new THREE.Mesh(new THREE.PlaneGeometry(1.3,2.34),new THREE.MeshStandardMaterial({color:'#dff2ff',emissive:'#62c9ff',emissiveIntensity:.25,roughness:.12}));top.rotation.x=-Math.PI/2;top.position.y=.825;
 const line=new THREE.Mesh(new THREE.PlaneGeometry(1.3,.03),glow('#ff6fb1',1.5));line.rotation.x=-Math.PI/2;line.position.y=.828;const ring=new THREE.Mesh(new THREE.RingGeometry(.2,.23,32),glow('#ff6fb1',1.5));ring.rotation.x=-Math.PI/2;ring.position.y=.829;
 const goals=[-1,1].map(s=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.5,.05,.05),glow(s<0?'#ff6fb1':'#55eeb4',2));m.position.set(0,.85,s*1.2);return m});
 const ms=[-1,1].map(s=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.06,20),glow(s<0?'#ff6fb1':'#55eeb4',1.4));m.position.set(0,.86,s*.8);return m});const puck=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.015,20),std('#111',.4));puck.position.set(0,.835,0);
 g.add(t,top,line,ring,...goals,...ms,puck);put(g,x,f,z,{ry});solid(g,f,.03);
 const ph=rnd()*9;anims.push(tt=>{if(g.userData.busy)return;puck.position.x=Math.sin(tt*1.3+ph)*.5;puck.position.z=Math.sin(tt*.9+ph)*.9;ms[0].position.x=puck.position.x*.6;ms[1].position.x=-puck.position.x*.5});
 const fx=Math.sin(ry),fz=Math.cos(ry);station(id,'hockey',[{x:x-fx*1.75,z:z-fz*1.75,f,face:ry},{x:x+fx*1.75,z:z+fz*1.75,f,face:ry+Math.PI}],{obj:g});return g}
const danceTiles=[];
function danceMachine(x,f,z,ry,id){const g=new THREE.Group();const cols=['#ff6fb1','#62c9ff','#55eeb4','#ffd864'];const pads=[];
 for(const s of [-1,1]){const pad=new THREE.Mesh(RB(1.9,.22,1.9,.08),std('#2b2263',.4,.3));pad.position.set(s*1.05,.11,0);g.add(pad);
  [[0,-.55],[-.55,0],[.55,0],[0,.55]].forEach(([a,b],k)=>{const m=new THREE.MeshStandardMaterial({color:'#000',emissive:cols[k],emissiveIntensity:.4});danceTiles.push(m);const t=new THREE.Mesh(RB(.5,.04,.5,.04),m);t.position.set(s*1.05+a,.23,b);g.add(t)});
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.8,10),M.chrome);bar.rotation.z=Math.PI/2;bar.position.set(s*1.05,1.05,-.85);g.add(bar);pads.push(pad)}
 const scr=new THREE.Mesh(RB(4.2,2.4,.45,.12),M.cab);scr.position.set(0,1.4,-1.2);const s1=new THREE.Mesh(new THREE.PlaneGeometry(3.4,1.3),danceScr.mat);s1.position.set(0,1.75,-.97);const mq=new THREE.Mesh(new THREE.PlaneGeometry(2,.45),marq.dance);mq.position.set(0,2.75,-.97);
 const spk=[-1,1].map(s=>{const m=new THREE.Mesh(RB(.6,1.4,.5,.08),M.dark);m.position.set(s*2.4,.7,-1.1);return m});g.add(scr,s1,mq,...spk);put(g,x,f,z,{ry});solid(scr,f,.03);spk.forEach(s=>solid(s,f,.02));camBlock.push(scr);
 g.updateMatrixWorld(true);const v=new THREE.Vector3();const slots=[-1,1].map(s=>{v.set(s*1.05,0,0).applyMatrix4(g.matrixWorld);return{x:v.x,z:v.z,f,face:ry+Math.PI,py:2.3,stand:.22}});
 slots.forEach(s=>PADS.push({x0:s.x-.95,x1:s.x+.95,z0:s.z-.95,z1:s.z+.95,y:f+.22}));station(id,'dance',slots,{obj:g})}
const danceScr=(()=>{const c=cv(512,196);const t=tex(c);return{c,g:c.getContext('2d'),t,mat:new THREE.MeshBasicMaterial({map:t,toneMapped:false})}})();
const hoopsScore=[];
function hoopsMachine(x,f,z,ry){const g=new THREE.Group();const base=new THREE.Mesh(RB(1.3,.95,2.5,.1),phys('#ff8a4c'));base.position.y=.475;
 const ramp=new THREE.Mesh(new THREE.BoxGeometry(1.15,.04,2.2),std('#2b2263',.6));ramp.position.set(0,1.0,.05);ramp.rotation.x=-.1;const sides=[-1,1].map(s=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.03,1.7,2.4),M.glass);m.position.set(s*.64,1.8,0);return m});
 const board=new THREE.Mesh(RB(1.25,1,.08,.04),M.white);board.position.set(0,2.55,-1.18);const sq=new THREE.Mesh(new THREE.PlaneGeometry(.42,.32),glow('#ff6fb1',1.2));sq.position.set(0,2.45,-1.135);
 const hoop=new THREE.Mesh(new THREE.TorusGeometry(.22,.018,10,32),glow('#ff9a5c',2));hoop.rotation.x=Math.PI/2;hoop.position.set(0,2.15,-.9);const net=new THREE.Mesh(new THREE.CylinderGeometry(.22,.14,.3,14,3,true),new THREE.MeshBasicMaterial({color:'#ffffff',wireframe:true,transparent:true,opacity:.7}));net.position.set(0,1.99,-.9);
 const balls=[0,1,2,3].map(k=>{const b=new THREE.Mesh(new THREE.SphereGeometry(.12,20,14),std('#ff8a3c',.7));b.position.set(-.36+k*.24,1.13,.95);return b});
 const sc=cv(256,96);const st=tex(sc);hoopsScore.push({c:sc,t:st});const scm=new THREE.Mesh(new THREE.PlaneGeometry(.8,.3),new THREE.MeshBasicMaterial({map:st,toneMapped:false}));scm.position.set(0,3.2,-1.165);const frame=new THREE.Mesh(RB(1.3,.42,.14,.05),M.cab);frame.position.set(0,3.2,-1.25);
 const fly=new THREE.Mesh(new THREE.SphereGeometry(.12,20,14),std('#ff8a3c',.7));g.add(base,ramp,...sides,board,sq,hoop,net,...balls,frame,scm,fly);put(g,x,f,z,{ry});camBlock.push(base,board);solid(g,f,.04);
 const ph=rnd()*5;anims.push(t=>{const k=((t*.6+ph)%1.6)/1.6;if(k<.5){const p=k/.5;fly.visible=true;fly.position.set(0,1.2+Math.sin(p*Math.PI)*1.6,.9-p*1.8)}else fly.visible=false});
 const fx=Math.sin(ry),fz=Math.cos(ry);return{x:x+fx*1.75,z:z+fz*1.75,f,face:ry+Math.PI}}
function c4Table(x,f,z,id){const g=new THREE.Group();const top=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.06,32),M.white);top.position.y=.75;const leg=new THREE.Mesh(new THREE.CylinderGeometry(.06,.25,.72,16),M.metal);leg.position.y=.36;
 const board=new THREE.Mesh(RB(.7,.6,.06,.03),phys('#3b6cff'));board.position.set(0,1.1,0);board.rotation.y=Math.PI/2;const holes=[];for(let c=0;c<7;c++)for(let r=0;r<6;r++)holes.push(tg(new THREE.CircleGeometry(.035,12),0,.85+r*.085+.03,-.255+c*.085,0,Math.PI/2));
 const hm=merged(holes,std('#0e0b22',.5));hm.position.x=.032;const hm2=hm.clone();hm2.rotation.y=Math.PI;hm2.position.x=-.032;
 const stools=[-1,1].map(s=>{const st=new THREE.Group();const seat=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.08,24),fabric(s<0?'#ff9cc9':'#7fd9ff'));seat.position.y=.5;const p=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.5,8),M.chrome);p.position.y=.25;st.add(seat,p);st.position.x=s*.95;return st});
 g.add(top,leg,board,hm,hm2,...stools);put(g,x,f,z);solid(top,f,.02);station(id,'c4',[{x:x-.95,z,f,face:Math.PI/2,py:1.9,sit:.5},{x:x+.95,z,f,face:-Math.PI/2,py:1.9,sit:.5}],{obj:g})}
function kiddieRide(x,z,kind){const g=new THREE.Group();const base=new THREE.Mesh(RB(1.1,.3,1.6,.12),phys('#ffd864'));base.position.y=.15;g.add(base);const body=new THREE.Group();body.position.y=.3;g.add(body);
 if(kind==='horse'){const m=phys('#ff9cc9');const b=new THREE.Mesh(new THREE.CapsuleGeometry(.24,.6,8,16),m);b.rotation.x=Math.PI/2;b.position.y=.55;const n=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.3,8,12),m);n.position.set(0,.85,.42);n.rotation.x=-.5;const h=new THREE.Mesh(new THREE.SphereGeometry(.17,20,14),m);h.position.set(0,1.02,.58);
  const mane=new THREE.Mesh(new THREE.BoxGeometry(.05,.3,.35),phys('#ad93ff'));mane.position.set(0,.98,.35);[[-.12,.3],[.12,.3],[-.12,-.3],[.12,-.3]].forEach(([a,c])=>{const l=new THREE.Mesh(new THREE.CapsuleGeometry(.05,.25,6,8),m);l.position.set(a,.22,c);body.add(l)});const e=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),M.black);e.position.set(.1,1.06,.7);const e2=e.clone();e2.position.x=-.1;body.add(b,n,h,mane,e,e2)}
 else{const m=phys('#62c9ff');const b=new THREE.Mesh(RB(.8,.4,1.3,.18),m);b.position.y=.4;const cab=new THREE.Mesh(RB(.7,.35,.6,.15),M.glass);cab.position.set(0,.75,-.1);const wh=[];[[-.42,.4],[.42,.4],[-.42,-.4],[.42,-.4]].forEach(([a,c])=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.1,16),std('#222',.6));w.rotation.z=Math.PI/2;w.position.set(a,.2,c);body.add(w)});const l=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),glow('#ffd864',2));l.position.set(.25,.45,.66);const l2=l.clone();l2.position.x=-.25;body.add(b,cab,l,l2)}
 put(g,x,0,z);solid(base,0,.05);anims.push(t=>{const k=g.userData.ride?1:.15;body.rotation.x=Math.sin(t*3)*.12*k;body.position.y=.3+Math.abs(Math.sin(t*3))*.05*k});
 targets.push({type:'ride',x:x+1.1,z,f:0,y:1.9,face:-Math.PI/2,label:'騎上去搖一搖',obj:g,seat:{x,z,y:kind==='horse'?.95:.75,face:0}})}
function photoBooth(x,z){const g=new THREE.Group();const b=new THREE.Mesh(RB(1.6,2.3,1.6,.08),phys('#ad93ff'));b.position.y=1.15;const cur=new THREE.Mesh(new THREE.PlaneGeometry(1,1.7,8,1),new THREE.MeshStandardMaterial({color:'#ff6fb1',roughness:.9,side:THREE.DoubleSide}));
 const pos=cur.geometry.attributes.position;for(let i=0;i<pos.count;i++)pos.setZ(i,Math.sin(pos.getX(i)*18)*.03);cur.geometry.computeVertexNormals();cur.position.set(.81,1.05,0);cur.rotation.y=Math.PI/2;
 const sg=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.35),new THREE.MeshBasicMaterial({map:signTex('PHOTO','#ffd864'),transparent:true,toneMapped:false}));sg.position.set(.81,2.1,0);sg.rotation.y=Math.PI/2;g.add(b,cur,sg);put(g,x,0,z);solid(b,0,.03);camBlock.push(b);
 targets.push({type:'photo',x:x+1.4,z,f:0,y:2.4,face:-Math.PI/2,label:'拍一張拍貼'})}
function lockers(x,z,n){const g=[],d=[];for(let i=0;i<n;i++){g.push(tg(RB(.5,1.9,.5,.03),0,.95,i*.52));d.push(tg(new THREE.BoxGeometry(.04,.03,.12),.26,1.2,i*.52));d.push(tg(new THREE.BoxGeometry(.01,.4,.3),.255,1.55,i*.52))}
 const m=merged(g,phys(['#ff9cc9','#7fd9ff'][0])),m2=merged(d,M.chrome);const grp=new THREE.Group();grp.add(m,m2);put(grp,x,0,z);solid(grp,0,.02)}

// ---- 1F bowling surroundings (lanes themselves are built in the bowling module) ----
// ---- 1F retro corner ----
[-3.5,-2,-.5,1,2.5].forEach((x,i)=>cabinet(CAB_GAMES[i%4],x,0,-25.5,0));
claw(4.4,0,-25.2,'#ff9cc9');claw(6.0,0,-25.2,'#8fd8ff');coinPusher(8,0,-25.3);
[9.6,10.6,11.6,12.6].forEach(x=>pinball(x,0,-25.1));
[-2.5,-1,.5,2,3.5].forEach((x,i)=>{cabinet(CAB_GAMES[(i+1)%4],x,0,-18.6,Math.PI);cabinet(CAB_GAMES[(i+2)%4],x,0,-17.7,0)});
{racer(7.4,0,-19.4);racer(9.0,0,-19.4);station('race1','racer',[{x:7.4,z:-17.9,f:0,face:Math.PI,py:1.9,sit:.45,seat:{x:7.4,z:-17.95}},{x:9,z:-17.9,f:0,face:Math.PI,py:1.9,sit:.45,seat:{x:9,z:-17.95}}])}
airHockey(12.6,0,-18.5,0,'hk1');danceMachine(12.2,0,-11.5,Math.PI/2,'dance1');
plant(13.6,0,-25.3);plant(-5.5,0,-25.3,.9);plant(14.3,0,-6.2,.9);
// ---- lobby ----
const tvC=cv(1024,576);const tvTex=tex(tvC);
{const fr=new THREE.Mesh(RB(5.5,3.2,.16,.08),std('#0b0a14',.35,.4));fr.rotation.y=Math.PI/2;put(fr,W.x0+.1,3.05,11.1,{cam:true});
 const sc=new THREE.Mesh(new THREE.PlaneGeometry(5.2,2.925),new THREE.MeshBasicMaterial({map:tvTex,toneMapped:false}));sc.rotation.y=Math.PI/2;put(sc,W.x0+.19,3.05,11.1,{cast:false});
 put(new THREE.Mesh(new THREE.BoxGeometry(.04,.04,5.5),glow('#ad93ff',2)),W.x0+.2,1.42,11.1,{cast:false});
 const rug=new THREE.Mesh(new THREE.PlaneGeometry(6,4),M.rug);rug.rotation.x=-Math.PI/2;rug.rotation.z=Math.PI/2;put(rug,-15.2,.006,11.1,{cast:false});
 const s1=sofa(-13.2,0,9.7,-Math.PI/2,'#7fd9ff'),s2=sofa(-13.2,0,12.5,-Math.PI/2,'#ff9cc9');
 const t=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.4,32),phys('#f6f1ff',{clearcoat:1}));put(t,-15.9,.2,11.1);solid(t,0,.02);
 lamp(-12.2,8.0,'#ffd9b0');lamp(-12.2,14.2,'#ffd9b0');
 targets.push({type:'tv',x:-15,z:11.1,f:0,y:2,r:3.4,px:W.x0+.5,py:1.35,pz:11.1,label:'一起看 YouTube'});
 [[s1,9.7],[s2,12.5]].forEach(([s,z])=>[-.7,.7].forEach(o=>targets.push({type:'sit',x:-14.3,z:z+o,f:0,y:1.6,r:.75,face:-Math.PI/2,label:'坐下來',seat:{x:-13.3,z:z+o,y:.42}})))}
vending(W.x0+.45,0,6.0,Math.PI/2,'#ff6fb1');vending(W.x0+.45,0,7.25,Math.PI/2,'#62c9ff');
lockers(W.x0+.26,14.4,6);
{const d=new THREE.Group();const c=new THREE.Mesh(RB(5,1.05,1,.12),phys('#ad93ff',{clearcoat:1}));c.position.y=.525;const top=new THREE.Mesh(RB(5.2,.08,1.15,.04),M.white);top.position.y=1.09;const st=new THREE.Mesh(new THREE.BoxGeometry(5,.05,.05),glow('#62c9ff',2.2));st.position.set(0,.2,.52);
 const reg=new THREE.Mesh(RB(.4,.3,.3,.04),std('#222',.4));reg.position.set(-1.5,1.28,0);d.add(c,top,st,reg);put(d,7,0,15.0);solid(d,0,.03);camBlock.push(c);
 const pw=[];const cub=[];for(let r=0;r<4;r++)for(let k=0;k<8;k++){cub.push(tg(new THREE.BoxGeometry(.56,.04,.36),4.8+k*.62,.9+r*.58,17.75));plushGeos(4.8+k*.62,1.05+r*.58,17.7,.9+rnd()*.3,prizeCols[(r*8+k)%7],pw,-1)}
 for(let k=0;k<=8;k++)cub.push(tg(new THREE.BoxGeometry(.04,2.35,.36),4.49+k*.62,2.05,17.75));put(merged(cub,phys('#3a2b70')),0,0,0);put(new THREE.Mesh(mergeGeometries(pw),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9})),0,0,0)}
{const pts=[];// entrance
 put(new THREE.Mesh(RB(4.4,3.2,.2,.06),M.metal),0,1.6,W.z1-.1,{cast:false});put(new THREE.Mesh(new THREE.PlaneGeometry(4,2.95),new THREE.MeshStandardMaterial({color:'#9fd8ff',emissive:'#62c9ff',emissiveIntensity:.35,roughness:.05,metalness:.2})),0,1.5,W.z1-.21,{ry:Math.PI,cast:false});
 const mat=new THREE.Mesh(new THREE.PlaneGeometry(4,1.6),std('#ff6fb1',.9));mat.rotation.x=-Math.PI/2;put(mat,0,.008,W.z1-1,{cast:false});
 for(const x of [-2.6,2.6])for(const z of [15.2,13.6]){const p=new THREE.Group();const b=new THREE.Mesh(new THREE.CylinderGeometry(.15,.18,.05,20),M.chrome);const c=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.95,10),M.chrome);c.position.y=.48;const k=new THREE.Mesh(new THREE.SphereGeometry(.05,12,8),M.chrome);k.position.y=.97;p.add(b,c,k);put(p,x,0,z);solid(p,0,.02)}
 for(const x of [-2.6,2.6]){const r=new THREE.Mesh(new THREE.TorusGeometry(.8,.025,8,24,Math.PI),fabric('#c8102e'));r.rotation.set(0,Math.PI/2,Math.PI);r.position.set(x,.92,14.4);scene.add(r)}}
{const logo=textTex(1024,1024,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#c9a35a';g.lineWidth=14;g.beginPath();g.arc(512,512,480,0,7);g.stroke();g.lineWidth=4;g.beginPath();g.arc(512,512,446,0,7);g.stroke();
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;g.save();g.translate(512+Math.cos(a)*463,512+Math.sin(a)*463);g.rotate(a);g.fillStyle='#c9a35a';g.fillRect(-3,-9,6,18);g.restore()}
  g.fillStyle='#ffd27a';star(g,512,330,70,4);drawWordmark(g,512,520,150,{blur:.12});g.fillStyle='#e9dcff';g.font='700 46px "Noto Sans TC",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('Q 版 3D 遊戲場',512,680);g.font='700 30px "Unbounded",sans-serif';g.fillStyle='#c9a35a';g.fillText('EST. 2026',512,760)});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(4.2,4.2),new THREE.MeshStandardMaterial({map:logo,transparent:true,roughness:.4,emissive:'#ffffff',emissiveMap:logo,emissiveIntensity:.25}));m.rotation.x=-Math.PI/2;put(m,0,.007,7.2,{cast:false})}
kiddieRide(5.4,8.2,'horse');kiddieRide(5.4,11.4,'car');photoBooth(-18.95,1.0);
// snack bar
{const g=new THREE.Group();const c=new THREE.Mesh(RB(1,1.05,4.4,.1),phys('#ff9a5c'));c.position.y=.525;const top=new THREE.Mesh(RB(1.25,.08,4.6,.04),M.white);top.position.y=1.09;const st=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,4.4),glow('#ffd864',2.2));st.position.set(-.52,.2,0);g.add(c,top,st);
 const pop=new THREE.Group();const pb=new THREE.Mesh(RB(.55,.6,.45,.04),M.glass);pb.position.y=.3;const pr=new THREE.Mesh(RB(.6,.12,.5,.03),phys('#c8102e'));pr.position.y=.66;const pf=new THREE.Mesh(RB(.6,.06,.5,.03),phys('#c8102e'));pf.position.y=.03;pop.add(pb,pr,pf);
 const N=40,corn=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.025,0),std('#fff6d8',.8),N);pop.add(corn);const cm=new THREE.Matrix4();const cs=Array.from({length:N},()=>[rnd(),rnd(),rnd()]);pop.position.set(0,1.13,-1.4);g.add(pop);
 anims.push(t=>{for(let i=0;i<N;i++){const[a,b,k]=cs[i],ph=(t*1.6+k*3)%1;cm.makeTranslation((a-.5)*.42,.08+(i<26?0:Math.abs(Math.sin(ph*Math.PI))*.42),(b-.5)*.32);corn.setMatrixAt(i,cm)}corn.instanceMatrix.needsUpdate=true});
 const dr=new THREE.Mesh(RB(.5,.75,.45,.05),phys('#62c9ff'));dr.position.set(0,1.5,1.4);g.add(dr);for(let k=0;k<3;k++){const cup=new THREE.Mesh(new THREE.CylinderGeometry(.05,.04,.12,12),std(['#ff6fb1','#ffd864','#55eeb4'][k],.5));cup.position.set(-.3,1.19,.5+k*.2);g.add(cup)}
 put(g,14.4,0,11);solid(c,0,.03);camBlock.push(c);
 for(let k=0;k<4;k++){const s=new THREE.Group();const seat=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.08,24),fabric('#ff6fb1'));seat.position.y=.72;const p=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.72,8),M.chrome);p.position.y=.36;const b=new THREE.Mesh(new THREE.CylinderGeometry(.18,.2,.03,20),M.chrome);s.add(seat,p,b);put(s,13.3,0,9.4+k*1.05);solid(s,0,.0)}
 const menu=ctex(768,420,(g,w,h)=>{g.fillStyle='#1d1440';g.fillRect(0,0,w,h);g.strokeStyle='#ff9a5c';g.lineWidth=8;g.strokeRect(10,10,w-20,h-20);g.fillStyle='#ffd864';g.font='800 56px "Baloo 2",sans-serif';g.textAlign='center';g.fillText('MENU',w/2,74);g.font='700 34px "Noto Sans TC",sans-serif';g.textAlign='left';
  [['🍿 爆米花','60'],['🥤 汽水','40'],['🌭 熱狗','80'],['🍦 霜淇淋','50']].forEach(([a,b],i)=>{g.fillStyle='#fff';g.fillText(a,70,150+i*64);g.fillStyle='#55eeb4';g.textAlign='right';g.fillText(b+' 代幣',w-70,150+i*64);g.textAlign='left'})});
 const mb=new THREE.Mesh(new THREE.PlaneGeometry(3,1.65),new THREE.MeshBasicMaterial({map:menu,toneMapped:false}));mb.rotation.y=-Math.PI/2;put(mb,W.x1-.04,3.3,11,{cast:false});
 targets.push({type:'snack',x:12.6,z:11,f:0,y:2.2,r:1.8,face:Math.PI/2,label:'買點心'})}
plant(-18.9,0,3.4);plant(14.2,0,16.8);plant(-17.6,0,17.1);
// ---- 2F ----
for(let i=0;i<10;i++)cabinet(CAB_GAMES[i%4],-18+i*1.5,F2,17.45,Math.PI);
[-15,-13.5,-12,-10.5].forEach((x,i)=>{cabinet(CAB_GAMES[i%4],x,F2,10.6,Math.PI);cabinet(CAB_GAMES[(i+1)%4],x,F2,11.5,0)});
{const a=hoopsMachine(-1.2,F2,16.6,Math.PI),b=hoopsMachine(.6,F2,16.6,Math.PI);station('hoops1','hoops',[{...a,py:2.4},{...b,py:2.4}])}
claw(3.6,F2,17.2,'#ffd864');claw(5.3,F2,17.2,'#9ff0c8');claw(7,F2,17.2,'#c9b4ff');
airHockey(9.5,F2,9.5,Math.PI/2,'hk2');c4Table(-6.6,F2,8.2,'c4a');c4Table(-3.2,F2,8.2,'c4b');
// DJ booth + LED dance floor
const floorTiles=(()=>{const n=5,m=4,s=.98,g=new THREE.InstancedMesh(RB(s-.04,.06,s-.04,.02),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),n*m);const m4=new THREE.Matrix4();let i=0;
 for(let a=0;a<n;a++)for(let b=0;b<m;b++){m4.makeTranslation(10.8+a*s,F2+.03,12.6+b*s);g.setMatrixAt(i,m4);g.setColorAt(i++,new THREE.Color('#ff6fb1'))}scene.add(g);g.receiveShadow=true;
 PADS.push({x0:10.3,x1:15.3,z0:12.1,z1:16,y:F2+.06});const cols=['#ff6fb1','#62c9ff','#55eeb4','#ffd864','#ad93ff'].map(c=>new THREE.Color(c)),dark=new THREE.Color('#1a1238'),cc=new THREE.Color();
 anims.push(t=>{const b=Math.floor(t*2.4);let i=0;for(let a=0;a<n;a++)for(let bb=0;bb<m;bb++){const on=((a+bb+b)%3===0)||((a*bb+b)%5===0);cc.copy(on?cols[(a+bb+b)%5]:dark).multiplyScalar(on?1.7:1);g.setColorAt(i++,cc)}g.instanceColor.needsUpdate=true});return g})();
{const g=new THREE.Group();const desk=new THREE.Mesh(RB(3,1.1,.9,.1),M.cab);desk.position.y=.55;const fr=new THREE.Mesh(new THREE.PlaneGeometry(2.8,.8),danceScr.mat);fr.position.set(0,.6,.46);
 const decks=[-.8,.8].map(x=>{const d=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.04,32),std('#111',.3,.4));d.position.set(x,1.12,0);return d});const lap=new THREE.Mesh(RB(.4,.03,.3,.01),M.metal);lap.position.set(0,1.13,0);
 g.add(desk,fr,...decks,lap);put(g,12.8,F2,16.9);solid(desk,F2,.03);camBlock.push(desk);anims.push((t,dt)=>decks.forEach(d=>d.rotation.y+=dt*3.5));
 for(const x of [10.3,15.3]){const s=new THREE.Mesh(RB(.8,1.8,.7,.08),M.dark);put(s,x,F2+.9,17.3);solid(s,F2,.02);for(const y of [.5,1.25]){const c=new THREE.Mesh(new THREE.CircleGeometry(.22,24),std('#333',.6));c.position.set(x,F2+y,17.66);scene.add(c);const r=new THREE.Mesh(new THREE.RingGeometry(.22,.26,24),glow('#55eeb4',2));r.position.set(x,F2+y,17.67);scene.add(r)}}}
{const bb=[[-18.2,6.0,'#ffd864'],[-16.7,6.5,'#ff9cc9'],[-17.6,7.7,'#7fd9ff']];bb.forEach(([x,z,c])=>{const b=new THREE.Mesh(new THREE.SphereGeometry(.55,28,20),fabric(c));b.scale.set(1,.62,1);put(b,x,F2+.34,z);solid(b,F2,0)})}
plant(-19,F2,16.9);plant(14.8,F2,5.2);plant(-8.6,F2,5);
flushCabinets();
