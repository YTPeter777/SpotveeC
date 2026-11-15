<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// ---- config (site build) ----
const SB_URL='https://maiokuzmkjzcctngxqco.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haW9rdXpta2p6Y2N0bmd4cWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NzgxMDQsImV4cCI6MjEwNjE1NDEwNH0.MM-TFE9YFwlHShWCFIquya6D7Tqa93iChSzF1Y-jrFE'; // public anon key
const SUPABASE_JS='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
const ROOM_PREFIX='avera'; // realtime channels are 'av-<room chan>'
const YT_API_KEY=''; // optional YouTube Data API v3 key for in-app search

const $=id=>document.getElementById(id);
const isTouch=matchMedia('(pointer:coarse)').matches;
const IN_CLAUDE=!!(window.claude&&window.claude.use);
const LOCAL=(()=>{try{return new URLSearchParams(location.search).has('local')}catch(e){return false}})();
const store={get(k,d){try{const v=localStorage.getItem('na3-'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('na3-'+k,JSON.stringify(v))}catch(e){}}};
const clampI=(v,n,d=0)=>Number.isInteger(v)&&v>=0&&v<n?v:d;
const num=(v,d=0)=>typeof v==='number'&&isFinite(v)?v:d;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ================= renderer & post =================
let QUAL=store.get('q',isTouch?'high':'ultra');if(!['ultra','high','low'].includes(QUAL))QUAL='high';
const renderer=new THREE.WebGLRenderer({canvas:$('gl'),antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:false});
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#120e2a');scene.fog=new THREE.Fog('#120e2a',42,90);
const camera=new THREE.PerspectiveCamera(55,1,.05,200);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.34;
const rtt=new THREE.WebGLRenderTarget(2,2,{type:THREE.HalfFloatType,samples:4});
const composer=new EffectComposer(renderer,rtt);composer.addPass(new RenderPass(scene,camera));
const gtao=new GTAOPass(scene,camera,2,2);gtao.blendIntensity=.85;try{gtao.updateGtaoMaterial({radius:.45,distanceExponent:1.4,thickness:1,scale:1,samples:12})}catch(e){}composer.addPass(gtao);
const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.5,.35,1.3);composer.addPass(bloom);composer.addPass(new OutputPass());
function resize(){renderer.setSize(innerWidth,innerHeight,false);composer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
let rzT=0,rzW=innerWidth,rzH=innerHeight;addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();clearTimeout(rzT);rzT=setTimeout(()=>{if(Math.abs(innerWidth-rzW)<2&&Math.abs(innerHeight-rzH)<90)return;rzW=innerWidth;rzH=innerHeight;resize()},180)});
const maxAniso=renderer.capabilities.getMaxAnisotropy();

// ================= procedural textures (colour + height → normal + roughness) =================
let seed=11;const rnd=()=>(seed=seed*16807%2147483647)/2147483647;
const redraws=[];
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function tex(c,rep,srgb=true){const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=maxAniso;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1])}return t}
function ctex(w,h,draw,rep){const c=cv(w,h);draw(c.getContext('2d'),w,h);return tex(c,rep)}
function textTex(w,h,draw){const c=cv(w,h);draw(c.getContext('2d'),w,h);const t=tex(c);redraws.push(()=>{const g=c.getContext('2d');g.clearRect(0,0,w,h);draw(g,w,h);t.needsUpdate=true});return t}
// the AVÉRA wordmark, drawn into any canvas (used by signs, lanes, cabinets, posters)
function drawWordmark(g,cx,cy,size,o={}){g.save();g.font=`800 ${size}px "Unbounded","Baloo 2",sans-serif`;g.textBaseline='middle';g.textAlign='left';const L=['A','V','É','R','A'],sp=size*(o.sp??.12);const ws=L.map(c=>g.measureText(c).width);const tot=ws.reduce((a,b)=>a+b,0)+sp*4;let x=cx-tot/2;
 const gr=g.createLinearGradient(cx-tot/2,0,cx+tot/2,0);gr.addColorStop(0,o.c1||'#d9c9ff');gr.addColorStop(.5,o.c2||'#ff8cc4');gr.addColorStop(1,o.c3||'#ffc58a');
 for(const pass of (o.glow===false?[0]:[1,0])){g.shadowColor=pass?(o.glowc||'#ff6fb1'):'transparent';g.shadowBlur=pass?size*(o.blur??.3):0;x=cx-tot/2;L.forEach((c,i)=>{g.fillStyle=o.flat||(c==='É'?(o.accent||'#ffd27a'):gr);g.fillText(c,x,cy);x+=ws[i]+sp})}g.restore();return tot}
function normalFrom(hc,str){const w=hc.width,h=hc.height,src=hc.getContext('2d').getImageData(0,0,w,h).data,o=cv(w,h),og=o.getContext('2d'),img=og.createImageData(w,h),d=img.data;
 const H=(x,y)=>src[(((y+h)%h)*w+((x+w)%w))*4]/255;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(H(x+1,y)-H(x-1,y))*str,dy=(H(x,y+1)-H(x,y-1))*str;let nx=-dx,ny=dy,nz=1;const l=Math.hypot(nx,ny,nz);const i=(y*w+x)*4;d[i]=(nx/l*.5+.5)*255;d[i+1]=(ny/l*.5+.5)*255;d[i+2]=(nz/l*.5+.5)*255;d[i+3]=255}
 og.putImageData(img,0,0);return o}
function pbr(size,draw,rep,nStr=2){const c=cv(size,size),h=cv(size,size),r=cv(size,size);const gc=c.getContext('2d'),gh=h.getContext('2d'),gr=r.getContext('2d');draw(gc,gh,gr,size);
 const set={map:tex(c,rep),normalMap:tex(normalFrom(h,nStr),rep,false),roughnessMap:tex(r,rep,false)};return set}
function poly(g,x,y,s,n){g.beginPath();for(let k=0;k<n;k++){const a=k/n*Math.PI*2+rnd()*.8,r=s*(.55+rnd()*.6);g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}g.closePath();g.fill()}
function star(g,x,y,r,p=4){g.beginPath();for(let i=0;i<p*2;i++){const a=i/(p*2)*Math.PI*2-Math.PI/2,rr=i%2?r*.38:r;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}g.closePath();g.fill()}
const TQ=isTouch?512:1024;
// polished marble: every tile gets its own veins; brass inlay between tiles (metalness in the blue channel)
function marbleSet(S,o,rep){const c=cv(S,S),h=cv(S,S),r=cv(S,S);const g=c.getContext('2d'),gh=h.getContext('2d'),gr=r.getContext('2d');const n=o.tiles,ts=S/n,k=S/2048,inl=Math.max(2,5*k);
 g.fillStyle=o.base;g.fillRect(0,0,S,S);gh.fillStyle='rgb(128,128,128)';gh.fillRect(0,0,S,S);gr.fillStyle=`rgb(0,${o.rough},0)`;gr.fillRect(0,0,S,S);
 for(let i=0;i<220;i++){const x=rnd()*S,y=rnd()*S,R=(80+rnd()*320)*k,cg=g.createRadialGradient(x,y,0,x,y,R),col=rnd()<.5?o.cloudA:o.cloudB;cg.addColorStop(0,col);cg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=cg;g.fillRect(x-R,y-R,2*R,2*R)}
 const vein=(x,y,a,len,w,alpha,branch)=>{const pts=[[x,y]];for(let i=0;i<len;i++){a+=(rnd()-.5)*.55;x+=Math.cos(a)*7*k;y+=Math.sin(a)*7*k;pts.push([x,y])}
  for(const[ctx,style,lw,blur]of [[g,o.vein.replace('A',(alpha*.45).toFixed(3)),w*3.2,6*k],[g,o.vein.replace('A',alpha.toFixed(3)),w,1.5*k],[gh,'rgb(112,112,112)',w*1.2,0],[gr,`rgb(0,${o.rough+40},0)`,w*1.4,0]]){ctx.save();ctx.strokeStyle=style;ctx.lineWidth=lw;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=style;ctx.shadowBlur=blur;ctx.beginPath();pts.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.stroke();ctx.restore()}
  if(branch>0)for(let b=0;b<2;b++){const p=pts[Math.floor(rnd()*pts.length)];vein(p[0],p[1],a+(rnd()-.5)*2,len*.35,w*.5,alpha*.7,branch-1)}};
 for(let ty=0;ty<n;ty++)for(let tx=0;tx<n;tx++){const x0=tx*ts,y0=ty*ts;for(const ctx of [g,gh,gr]){ctx.save();ctx.beginPath();ctx.rect(x0,y0,ts,ts);ctx.clip()}
  g.fillStyle=`rgba(${rnd()<.5?255:0},${rnd()<.5?255:0},${rnd()<.5?255:0},${(.01+rnd()*.025).toFixed(3)})`;g.fillRect(x0,y0,ts,ts);
  const dir=rnd()*Math.PI*2;for(let v=0;v<1+Math.floor(rnd()*2);v++)vein(x0+rnd()*ts,y0+rnd()*ts,dir+(rnd()-.5)*.5,70+rnd()*80,(.6+rnd()*1.1)*k,o.va*(.35+rnd()*.3),1);
  for(let v=0;v<4;v++)vein(x0+rnd()*ts,y0+rnd()*ts,dir+(rnd()-.5)*1.2,20+rnd()*30,(.4+rnd()*.5)*k,o.va*.14,0);
  for(const ctx of [g,gh,gr])ctx.restore()}
 for(let i=0;i<=n;i++){const p=i*ts;g.fillStyle=o.inlay;g.fillRect(p-inl/2,0,inl,S);g.fillRect(0,p-inl/2,S,inl);gh.fillStyle='rgb(90,90,90)';gh.fillRect(p-inl,0,inl*2,S);gh.fillRect(0,p-inl,S,inl*2);gr.fillStyle=`rgb(0,70,255)`;gr.fillRect(p-inl/2,0,inl,S);gr.fillRect(0,p-inl/2,S,inl)}
 const nh=cv(S/2,S/2);nh.getContext('2d').drawImage(h,0,0,S/2,S/2);const rt=tex(r,rep,false);return{map:tex(c,rep),normalMap:tex(normalFrom(nh,1.4),rep,false),roughnessMap:rt,metalnessMap:rt}}
const MQ=isTouch?1024:2048;
const marbleDark=marbleSet(MQ,{tiles:4,base:'#15111f',cloudA:'rgba(80,62,130,.05)',cloudB:'rgba(0,0,0,.06)',vein:'rgba(236,228,255,A)',va:.6,inlay:'#c9a35a',rough:22},[40/4.8,44/4.8]);
const marbleLight=marbleSet(isTouch?512:1024,{tiles:2,base:'#cfc8d8',cloudA:'rgba(255,255,255,.18)',cloudB:'rgba(120,110,150,.08)',vein:'rgba(90,80,110,A)',va:.6,inlay:'#c9a35a',rough:40},[40/2.4,14/2.4]);
function woodSet(rep,boards=20){return pbr(TQ,(g,h,r,S)=>{const bw=S/boards;for(let i=0;i<boards;i++){const hue=30+rnd()*7,l=63+rnd()*10;g.fillStyle=`hsl(${hue},48%,${l}%)`;g.fillRect(i*bw,0,bw,S);h.fillStyle='rgb(140,140,140)';h.fillRect(i*bw,0,bw,S);
  for(let k=0;k<120;k++){const x=i*bw+rnd()*bw,y=rnd()*S,len=40+rnd()*260,w=.6+rnd()*1.4;g.fillStyle=`hsla(${hue-6},50%,${l-22}%,${.04+rnd()*.08})`;g.fillRect(x,y,w,len);h.fillStyle=`rgba(90,90,90,${.15+rnd()*.2})`;h.fillRect(x,y,w,len)}
  g.fillStyle='rgba(90,50,20,.35)';g.fillRect(i*bw,0,1.5,S);h.fillStyle='rgb(30,30,30)';h.fillRect(i*bw,0,2,S);const y=rnd()*S;g.fillRect(i*bw,y,bw,1.5);h.fillRect(i*bw,y,bw,2)}
 r.fillStyle='rgb(0,70,0)';r.fillRect(0,0,S,S);for(let i=0;i<boards;i++){r.fillStyle='rgb(0,170,0)';r.fillRect(i*bw,0,2,S)}},rep,1.6)}
const laneWood=woodSet([1,8],20),approachWood=woodSet([10,2],20);
const carpet=pbr(TQ,(g,h,r,S)=>{const k=S/1024;g.fillStyle='#2b2054';g.fillRect(0,0,S,S);const img=h.createImageData(S,S);for(let i=0;i<img.data.length;i+=4){const v=100+Math.random()*90;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255}h.putImageData(img,0,0);
 for(let i=0;i<14000*k*k;i++){g.fillStyle=rnd()<.5?`rgba(255,255,255,${.02+rnd()*.04})`:`rgba(10,5,30,${.05+rnd()*.06})`;g.fillRect(rnd()*S,rnd()*S,1,1+rnd()*2)}
 const cols=['rgba(255,143,196,.22)','rgba(127,240,200,.2)','rgba(143,210,255,.2)','rgba(255,224,138,.2)'];let n=0;for(let y=64*k;y<S;y+=128*k)for(let x=((y/(128*k))%2)*64*k+64*k;x<S;x+=128*k){g.fillStyle=cols[n++%4];star(g,x,y,13*k);g.beginPath();g.arc(x+64*k,y+20*k,4*k,0,7);g.fill()}
 r.fillStyle='rgb(0,250,0)';r.fillRect(0,0,S,S)},[10,3.5],1.2);
const wallSet=pbr(512,(g,h,r,S)=>{const gr=g.createLinearGradient(0,0,0,S);gr.addColorStop(0,'#241e4e');gr.addColorStop(1,'#19143c');g.fillStyle=gr;g.fillRect(0,0,S,S);h.fillStyle='rgb(150,150,150)';h.fillRect(0,0,S,S);
 const n=8,w=S/n;for(let i=0;i<n;i++){g.fillStyle=`rgba(${rnd()<.5?255:0},${rnd()<.5?255:0},255,${.015+rnd()*.02})`;g.fillRect(i*w,0,w,S);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(i*w,0,3,S);h.fillStyle='rgb(40,40,40)';h.fillRect(i*w,0,4,S);
  const hg=h.createLinearGradient(i*w,0,i*w+w,0);hg.addColorStop(0,'rgb(120,120,120)');hg.addColorStop(.5,'rgb(170,170,170)');hg.addColorStop(1,'rgb(120,120,120)');h.fillStyle=hg;h.fillRect(i*w+4,0,w-4,S)}
 r.fillStyle='rgb(0,215,0)';r.fillRect(0,0,S,S)},[16,4],1.5);
const brushed=(()=>{const h=cv(256,256),g=h.getContext('2d');g.fillStyle='#808080';g.fillRect(0,0,256,256);for(let i=0;i<1500;i++){g.fillStyle=`rgba(${rnd()<.5?255:0},${rnd()<.5?255:0},${rnd()<.5?255:0},.08)`;g.fillRect(0,rnd()*256,256,1)}return tex(normalFrom(h,.8),[4,4],false)})();
const rugTex=ctex(1024,512,(g,w,h)=>{g.fillStyle='#3a2368';g.fillRect(0,0,w,h);g.strokeStyle='#ffd864';g.lineWidth=10;g.strokeRect(24,24,w-48,h-48);g.strokeStyle='#ff8fc4';g.lineWidth=4;g.strokeRect(46,46,w-92,h-92);
 for(let i=0;i<9;i++)for(let j=0;j<4;j++){g.fillStyle=['#ff8fc4','#7ff0c8','#8fd2ff','#ffe08a'][(i+j)%4];g.globalAlpha=.55;star(g,110+i*100,110+j*96,16)}g.globalAlpha=1;for(let i=0;i<5000;i++){g.fillStyle=`rgba(0,0,0,${rnd()*.1})`;g.fillRect(rnd()*w,rnd()*h,1,2)}});

const std=(color,roughness=.6,metalness=0,o={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...o});
const phys=(color,o={})=>new THREE.MeshPhysicalMaterial({color,roughness:.35,clearcoat:.8,clearcoatRoughness:.15,...o});
const fabric=color=>new THREE.MeshPhysicalMaterial({color,roughness:.9,sheen:1,sheenRoughness:.6,sheenColor:new THREE.Color(color).lerp(new THREE.Color('#ffffff'),.4)});
const glowCache=new Map();
function glow(c,i=2.4){const k=c+'|'+i;if(!glowCache.has(k))glowCache.set(k,new THREE.MeshStandardMaterial({color:'#000000',emissive:c,emissiveIntensity:i}));return glowCache.get(k)}
const M={
 floor:new THREE.MeshPhysicalMaterial({...marbleDark,roughness:1,metalness:1,clearcoat:.4,clearcoatRoughness:.22,normalScale:new THREE.Vector2(.35,.35),envMapIntensity:1.4}),
 floor2:new THREE.MeshPhysicalMaterial({...marbleLight,roughness:1,metalness:1,clearcoat:.5,clearcoatRoughness:.1,normalScale:new THREE.Vector2(.3,.3)}),
 wall:new THREE.MeshStandardMaterial({...wallSet,roughness:1}),
 carpet:new THREE.MeshPhysicalMaterial({...carpet,roughness:1,sheen:.6,sheenRoughness:.8,sheenColor:new THREE.Color('#6a58b0'),normalScale:new THREE.Vector2(.8,.8)}),
 lane:new THREE.MeshPhysicalMaterial({...laneWood,roughness:1,clearcoat:1,clearcoatRoughness:.04,normalScale:new THREE.Vector2(.4,.4)}),
 approach:new THREE.MeshPhysicalMaterial({...approachWood,roughness:1,clearcoat:.4,clearcoatRoughness:.3,normalScale:new THREE.Vector2(.5,.5)}),
 dark:std('#18132e',.45,.2),bed:std('#120f24',.6),gutter:std('#2c2a3c',.28,.75,{normalMap:brushed}),
 metal:std('#d6d1f2',.28,.9,{normalMap:brushed}),chrome:std('#ffffff',.08,1),
 glass:new THREE.MeshPhysicalMaterial({color:'#cfe9ff',roughness:.04,metalness:0,transparent:true,opacity:.16,depthWrite:false}),
 cab:phys('#2b2263',{clearcoat:.8}),black:std('#07060d',1),white:phys('#f7f4ff',{roughness:.3}),rug:std('#ffffff',.95,0,{map:rugTex}),
};
