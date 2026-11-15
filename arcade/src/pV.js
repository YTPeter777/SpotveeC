
// ================= world v2: reflective marble, LED strips, AVÉRA branding, themes =================
// ---- planar reflection for the 1F marble (ultra quality): the scene is rendered mirrored into a half-res HDR target
const REFL={on:false,rt:null,cam:new THREE.PerspectiveCamera(),tm:new THREE.Matrix4(),sh:null,frame:0,
 n:new THREE.Vector3(0,1,0),mp:new THREE.Vector3(),cp:new THREE.Vector3(),rot:new THREE.Matrix4(),la:new THREE.Vector3(),tgt:new THREE.Vector3(),view:new THREE.Vector3(),plane:new THREE.Plane(),cplane:new THREE.Vector4(),q:new THREE.Vector4()};
M.floor.onBeforeCompile=sh=>{REFL.sh=sh;sh.uniforms.tRefl={value:null};sh.uniforms.reflMat={value:REFL.tm};sh.uniforms.reflOn={value:0};
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform mat4 reflMat;\nvarying vec4 vRefl;').replace('#include <project_vertex>','#include <project_vertex>\nvRefl = reflMat * modelMatrix * vec4( transformed, 1.0 );');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tRefl;\nuniform float reflOn;\nvarying vec4 vRefl;').replace('#include <opaque_fragment>',`
 if(reflOn>0.5){vec2 ruv=vRefl.xy/vRefl.w+normal.xy*0.018;vec2 px=vec2(0.0035,0.0);
  vec3 rc=texture2D(tRefl,ruv).rgb*0.4+(texture2D(tRefl,ruv+px).rgb+texture2D(tRefl,ruv-px).rgb+texture2D(tRefl,ruv+px.yx*1.6).rgb+texture2D(tRefl,ruv-px.yx*1.6).rgb)*0.15;
  float fres=0.22+0.6*pow(1.0-clamp(abs(dot(normalize(vViewPosition),normal)),0.0,1.0),3.0);float gloss=clamp(1.0-roughnessFactor*2.2,0.0,1.0);
  outgoingLight+=rc*fres*gloss*0.85;}
 #include <opaque_fragment>`)};
M.floor.customProgramCacheKey=()=>'avera-floor';
function setReflection(on){REFL.on=on;if(on&&!REFL.rt){REFL.rt=new THREE.WebGLRenderTarget(16,16,{type:THREE.HalfFloatType});REFL.rt.texture.generateMipmaps=false}if(REFL.sh){REFL.sh.uniforms.reflOn.value=on?1:0;REFL.sh.uniforms.tRefl.value=REFL.rt?.texture||null}if(on)sizeReflection()}
function sizeReflection(){if(!REFL.rt)return;const pr=renderer.getPixelRatio();REFL.rt.setSize(Math.max(64,innerWidth*pr*.5|0),Math.max(64,innerHeight*pr*.5|0))}
addEventListener('resize',()=>REFL.on&&sizeReflection());
function renderReflection(){if(!REFL.on||!FLOOR1||!REFL.sh)return;REFL.sh.uniforms.tRefl.value=REFL.rt.texture;REFL.sh.uniforms.reflOn.value=1;
 const R=REFL,cam=camera,vc=R.cam;R.mp.set(0,0,0);R.cp.setFromMatrixPosition(cam.matrixWorld);if(R.cp.y<0.05)return;
 R.rot.extractRotation(cam.matrixWorld);R.view.subVectors(R.mp,R.cp).reflect(R.n).negate().add(R.mp);
 R.la.set(0,0,-1).applyMatrix4(R.rot).add(R.cp);R.tgt.subVectors(R.mp,R.la).reflect(R.n).negate().add(R.mp);
 vc.position.copy(R.view);vc.up.set(0,1,0).applyMatrix4(R.rot).reflect(R.n);vc.lookAt(R.tgt);vc.far=cam.far;vc.updateMatrixWorld();vc.projectionMatrix.copy(cam.projectionMatrix);
 R.tm.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);
 // oblique near plane so nothing below the floor leaks into the reflection
 R.plane.setFromNormalAndCoplanarPoint(R.n,R.mp).applyMatrix4(vc.matrixWorldInverse);R.cplane.set(R.plane.normal.x,R.plane.normal.y,R.plane.normal.z,R.plane.constant);const pm=vc.projectionMatrix;
 R.q.x=(Math.sign(R.cplane.x)+pm.elements[8])/pm.elements[0];R.q.y=(Math.sign(R.cplane.y)+pm.elements[9])/pm.elements[5];R.q.z=-1;R.q.w=(1+pm.elements[10])/pm.elements[14];R.cplane.multiplyScalar(2/R.cplane.dot(R.q));
 pm.elements[2]=R.cplane.x;pm.elements[6]=R.cplane.y;pm.elements[10]=R.cplane.z+1;pm.elements[14]=R.cplane.w;
 const prevT=renderer.getRenderTarget(),au=renderer.shadowMap.autoUpdate,ptm=renderer.toneMapping;FLOOR1.visible=false;renderer.shadowMap.autoUpdate=false;
 renderer.setRenderTarget(R.rt);renderer.clear();renderer.render(scene,vc);renderer.setRenderTarget(prevT);renderer.shadowMap.autoUpdate=au;FLOOR1.visible=true}

// ---- wall dressing: fluted wainscot, LED strips with light spill, LED pillars, AVÉRA signage ----
const TH={a:[],b:[],c:[],flow:[],beams:[],lights:[]};
function thMat(role,i){const m=new THREE.MeshStandardMaterial({color:'#000000',emissive:{a:'#a77bff',b:'#ff5fb8',c:'#5cc2ff'}[role],emissiveIntensity:i});TH[role].push(m);return m}
const fluteSet=pbr(256,(g,h,r,S)=>{g.fillStyle='#1c1638';g.fillRect(0,0,S,S);const n=8,w=S/n;for(let i=0;i<n;i++){const hg=h.createLinearGradient(i*w,0,i*w+w,0);hg.addColorStop(0,'rgb(40,40,40)');hg.addColorStop(.18,'rgb(150,150,150)');hg.addColorStop(.5,'rgb(200,200,200)');hg.addColorStop(.82,'rgb(150,150,150)');hg.addColorStop(1,'rgb(40,40,40)');h.fillStyle=hg;h.fillRect(i*w,0,w,S);
  const cg=g.createLinearGradient(i*w,0,i*w+w,0);cg.addColorStop(0,'rgba(0,0,0,.35)');cg.addColorStop(.5,'rgba(255,255,255,.05)');cg.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=cg;g.fillRect(i*w,0,w,S)}r.fillStyle='rgb(0,120,0)';r.fillRect(0,0,S,S)},[1,1],3);
const spillTex=ctex(8,128,(g,w,h)=>{const gr=g.createLinearGradient(0,h,0,0);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(.25,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)});
const flowTex=ctex(8,256,(g,w,h)=>{for(let y=0;y<h;y++){const v=Math.pow(.5+.5*Math.sin(y/h*Math.PI*6),3);g.fillStyle=`rgba(255,255,255,${(.25+.75*v).toFixed(3)})`;g.fillRect(0,y,w,1)}});flowTex.wrapT=THREE.RepeatWrapping;
{const flutes=[],leds=[],spills=[];const wallH=2.3,off=.035;
 // [x,z,len,rotY,floorY] for each wall run (1F around the hall, 2F on the mezzanine walls)
 const runs=[[0,W.z0+off,40,0,0],[0,W.z1-off,40,Math.PI,0],[W.x0+off,-4,44,Math.PI/2,0],[W.x1-off,-11,30,-Math.PI/2,0],
  [W.x0+off,(MZ+W.z1)/2,W.z1-MZ,Math.PI/2,F2],[W.x1-off,(MZ+W.z1)/2,W.z1-MZ,-Math.PI/2,F2],[0,W.z1-off-.01,40,Math.PI,F2]];
 for(const[x,z,len,ry,fy]of runs){const fg=new THREE.BoxGeometry(len,wallH,.05);const uv=fg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*len/.48);fg.rotateY(ry);fg.translate(x,fy+wallH/2,z);flutes.push(fg);
  const lg=new THREE.BoxGeometry(len,.035,.06);lg.rotateY(ry);lg.translate(x,fy+wallH+.02,z);leds.push(lg);
  const sp=new THREE.PlaneGeometry(len,.9);sp.translate(0,.45,0);sp.rotateY(ry);sp.translate(x+Math.sin(ry)*.02,fy+wallH+.03,z+Math.cos(ry)*.02);spills.push(sp)}
 const fm=new THREE.MeshStandardMaterial({...fluteSet,roughness:.7,metalness:.15});fm.map.wrapS=fm.normalMap.wrapS=fm.roughnessMap.wrapS=THREE.RepeatWrapping;
 const fmesh=new THREE.Mesh(mergeGeometries(flutes),fm);fmesh.receiveShadow=true;scene.add(fmesh);
 scene.add(new THREE.Mesh(mergeGeometries(leds),thMat('a',3)));
 const sm=new THREE.MeshBasicMaterial({map:spillTex,color:'#a77bff',transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});TH.a.push({spill:sm});scene.add(new THREE.Mesh(mergeGeometries(spills),sm))}
// LED pillars with light running up them (tall 1F walls)
{const geos=[];const add=(x,z,ry,y0,y1)=>{const g=new THREE.BoxGeometry(.12,y1-y0,.05);g.rotateY(ry);g.translate(x,(y0+y1)/2,z);geos.push(g)};
 for(const z of [-24,-20,-16,-8,-4,0])add(W.x0+.06,z,Math.PI/2,4.2,11.4);for(const z of [-24,-20,-16])add(W.x1-.06,z,-Math.PI/2,4.2,11.4);for(const x of [-19,19])add(x,W.z0+.06,0,3,11.4);
 const mat=new THREE.MeshBasicMaterial({map:flowTex,color:new THREE.Color('#a77bff').multiplyScalar(2.2),toneMapped:false});flowTex.repeat.set(1,3);TH.flow.push(mat);scene.add(new THREE.Mesh(mergeGeometries(geos),mat));
 anims.push((t,dt)=>{flowTex.offset.y-=dt*.18})}
// AVÉRA signage
function logoSign(w,x,y,z,ry,sub){const H=sub?.36:.28;const t=textTex(1600,Math.round(1600*H),(g,cw,ch)=>{g.clearRect(0,0,cw,ch);drawWordmark(g,cw/2,sub?ch*.4:ch/2,ch*(sub?.5:.62),{blur:.22});if(sub){g.font=`700 ${Math.round(ch*.14)}px "Noto Sans TC","Unbounded",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#f3e9ff';g.shadowColor='#ff6fb1';g.shadowBlur=ch*.05;g.fillText(sub,cw/2,ch*.83)}});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*H),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false,depthWrite:false}));m.material.color.setScalar(1.55);m.position.set(x,y,z);m.rotation.y=ry||0;scene.add(m);
 const back=new THREE.Mesh(RB(w*1.04,w*H*.92,.08,.04),std('#0c0a18',.4,.5));back.position.set(x-Math.sin(ry||0)*.06,y,z-Math.cos(ry||0)*.06);back.rotation.y=ry||0;scene.add(back);return m}
logoSign(8.4,-2.2,10.6,W.z0+.12,0,'一起玩，就在 AVÉRA');
logoSign(5.2,0,4.35,W.z1-.12,Math.PI,'WELCOME · 歡迎光臨');
logoSign(4.2,W.x0+.12,9.6,-10,Math.PI/2);
// theme recolouring: LEDs, trims, beams and coloured point lights follow the room's theme
{const ptl=[];scene.traverse(o=>{if(o.isPointLight)ptl.push([o,'#'+o.color.getHexString()]);if(o.isMesh&&o.material?.map===beamTex)TH.beams.push(o.material)});TH.lights=ptl}
const HEMI=scene.children.find(o=>o.isHemisphereLight);
function worldTheme(t){if(HEMI)HEMI.intensity=.9*(t.amb||1);key.intensity=t.key||1.45;CLUB.on=t.anim==='club';const set=(m,c)=>m&&(m.emissive?m.emissive.set(c):m.color.set(c));
 for(const r of ['a','b','c'])for(const m of TH[r]){if(m.spill)m.spill.color.set(t[r]);else set(m,t[r])}
 for(const m of TH.flow)m.color.set(t.a).multiplyScalar(2.2);
 [['#ad93ff|1.6','a'],['#ff6fb1|2','b'],['#62c9ff|1.4','c'],['#62c9ff|2.2','c'],['#62c9ff|1.5','c']].forEach(([k,r])=>{const m=glowCache.get(k);if(m)m.emissive.set(t[r])});
 TH.beams.forEach((m,i)=>m.color.set(t[['a','b','c'][i%3]]));
 const map={'#ff6fb1':'b','#62c9ff':'c','#ad93ff':'a','#55eeb4':'c'};for(const[l,orig]of TH.lights){const r=map[orig];if(r)l.color.set(t[r])}}
// ---- centre of the hall: info island with seating, planters and an LED halo overhead ----
{const g=new THREE.Group();const cx=3,cz=0;
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.62,.46,48),phys('#231b4f',{clearcoat:1}));base.position.y=.23;g.add(base);
 const cushion=new THREE.Mesh(new THREE.TorusGeometry(1.38,.17,16,64),fabric('#ff8cc4'));cushion.rotation.x=Math.PI/2;cushion.position.y=.5;g.add(cushion);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.62,.022,8,96),thMat('a',2.6));ring.rotation.x=Math.PI/2;ring.position.y=.05;g.add(ring);
 const pot=new THREE.Mesh(new THREE.CylinderGeometry(.75,.62,.9,40),phys('#f4eefc',{roughness:.25}));pot.position.y=.9;g.add(pot);
 const lm=std('#4fc98b',.75);[[0,1.75,0,.7],[.45,1.6,.2,.45],[-.4,1.65,-.25,.5],[.05,2.25,.05,.45],[-.2,1.95,.4,.38]].forEach(([a,b,c,r])=>{const l=new THREE.Mesh(new THREE.IcosahedronGeometry(r,3),lm);l.position.set(a,b,c);g.add(l)});
 const post=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.6,16),M.metal);post.position.set(0,2.3,0);g.add(post);
 const ds=new THREE.Mesh(RB(1.5,.62,.08,.04),std('#0c0a18',.4,.5));ds.position.set(0,3.35,0);g.add(ds);
 const dtex=textTex(768,320,(c,w,h)=>{c.fillStyle='#0c0a18';c.fillRect(0,0,w,h);drawWordmark(c,w/2,h*.36,92,{blur:.2});c.font='700 44px "Noto Sans TC",sans-serif';c.fillStyle='#e9dcff';c.textAlign='center';c.textBaseline='middle';c.fillText('保齡球 ← · → 街機 · ↑ 2F',w/2,h*.76)});
 for(const s of [1,-1]){const p=new THREE.Mesh(new THREE.PlaneGeometry(1.44,.6),new THREE.MeshBasicMaterial({map:dtex,toneMapped:false}));p.position.set(0,3.35,s*.042);if(s<0)p.rotation.y=Math.PI;p.material.color.setScalar(1.3);g.add(p)}
 put(g,cx,0,cz);solid(base,0,.05);camBlock.push(post,ds);
 // seat targets around the island
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.3,x=cx+Math.cos(a)*1.45,z=cz+Math.sin(a)*1.45;targets.push({type:'sit',x:x+Math.cos(a)*.55,z:z+Math.sin(a)*.55,f:0,y:1.4,face:Math.atan2(Math.cos(a),Math.sin(a)),label:'坐一下',seat:{x,z,y:.46,face:Math.atan2(Math.cos(a),Math.sin(a))}})}
 // LED halo chandelier
 const halo=new THREE.Group();halo.position.set(cx,8.6,cz);for(const[r,h]of [[3.2,0],[2.4,.5],[1.6,1]]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,.05,10,128),thMat(h===.5?'b':'a',3.2));t.rotation.x=Math.PI/2;t.position.y=h;halo.add(t)}
 for(let i=0;i<4;i++){const w=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,CEIL-8.6,4),M.metal);const a=i/4*Math.PI*2;w.position.set(Math.cos(a)*3.2,(CEIL-8.6)/2,Math.sin(a)*3.2);halo.add(w)}
 scene.add(halo);anims.push(t=>{halo.rotation.y=t*.08;halo.children[1].position.y=.5+Math.sin(t*.9)*.12})}

// nightclub mode: colours sweep, beams speed up
const CLUB={on:false,c:new THREE.Color()};
anims.push(t=>{if(!CLUB.on)return;for(const[r,ph]of [['a',0],['b',.33],['c',.66]]){CLUB.c.setHSL((t*.12+ph)%1,1,.55);for(const m of TH[r]){if(m.spill)m.spill.color.copy(CLUB.c);else(m.emissive||m.color).copy(CLUB.c)}}for(const m of TH.flow)m.color.setHSL((t*.12)%1,1,.6).multiplyScalar(2.2);TH.beams.forEach((m,i)=>m.color.setHSL((t*.25+i*.17)%1,1,.6));if(HEMI)HEMI.intensity=.32+Math.max(0,Math.sin(t*8))*.1});
