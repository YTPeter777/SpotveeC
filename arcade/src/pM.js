
// ================= machine view: games are played on the real machine =================
// The live game canvas is shown on the machine's own screen (or table top) in 3D; the camera moves in to frame it,
// pointer input is ray-cast onto that surface. Works for every game; claw is fully 3D (pZ).
const MV={on:false,mesh:null,tex:null,cam:new THREE.Vector3(),look:new THREE.Vector3(),up:new THREE.Vector3(0,1,0),n:new THREE.Vector3(),w:0,h:0,fov:0,swipe:null};
const MVCFG={claw:{d:.52,y:1.5,h:1.3,tilt:.42},coin:{d:.56,y:1.5,h:.8},racer:{d:.98,y:1.35,h:.72,cy:1.12},dance:{d:1.25,y:2.05,h:.9},hoops:{d:2.6,y:1.95,h:.95,cy:1.6},hockey:{table:1.75,y:.835,h:1.95},c4:{d:.95,y:1.2,h:.78,cy:1.25}};
function mvPlace(k,t){const f=t.f||0;MV.tilt=0;let C=new THREE.Vector3(),N=new THREE.Vector3(),U=new THREE.Vector3(0,1,0),h,flat=false;
 if(t.cab){const{x,z,ry}=t.cab;const fx=Math.sin(ry),fz=Math.cos(ry);const tilt=Math.atan2(.12,.56);C.set(x+fx*.209,t.cab.f+1.346,z+fz*.209);N.set(fx*Math.cos(tilt),Math.sin(tilt),fz*Math.cos(tilt));U.set(-fx*Math.sin(tilt),Math.cos(tilt),-fz*Math.sin(tilt));h=.52}
 else{const c=MVCFG[k]||{d:1.2,y:1.6,h:.9};const face=t.slotRef?.face??t.face??0,fx=Math.sin(face),fz=Math.cos(face);const sx=t.slotRef?.x??t.x,sz=t.slotRef?.z??t.z;
  if(c.table){C.set(sx+fx*c.table,f+c.y+.004,sz+fz*c.table);N.set(0,1,0);U.set(fx,0,fz);h=c.h;flat=true}else{C.set(sx+fx*c.d,f+c.y,sz+fz*c.d);N.set(-fx,0,-fz);h=c.h}MV.tilt=c.tilt||0}
 return{C,N,U,h,w:h*GW/GH,flat}}
function mvOpen(k,t){if(!t)return;const p=mvPlace(k,t);MV.on=true;MV.flat=p.flat;MV.w=p.w;MV.h=p.h;MV.n.copy(p.N);MV.up.copy(p.U);
 if(!MV.tex){MV.tex=new THREE.CanvasTexture(gc);MV.tex.colorSpace=THREE.SRGBColorSpace;MV.tex.anisotropy=maxAniso}
 if(!MV.mesh){MV.mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:MV.tex,toneMapped:false}));MV.mesh.renderOrder=2;scene.add(MV.mesh)}
 MV.mesh.scale.set(p.w,p.h,1);MV.mesh.position.copy(p.C).addScaledVector(p.N,.006);const m=new THREE.Matrix4(),X=new THREE.Vector3().crossVectors(p.U,p.N).normalize();m.makeBasis(X,p.U,p.N);MV.mesh.quaternion.setFromRotationMatrix(m);MV.mesh.visible=k!=='claw';
 MV.look.copy(p.C);MV.fov=camera.fov;document.body.classList.add('in-mach');myAv.visible=false;mvFrame(true)}
function mvFrame(snap){if(!MV.on)return;const top=72,pad=($('pad').hidden?0:$('pad').offsetHeight)+($('cabfoot').offsetHeight||0)+28;const frac=Math.max(.35,(innerHeight-top-pad)/innerHeight),asp=innerWidth/innerHeight,tv=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
 let dir=MV.n.clone();if(MV.tilt)dir.multiplyScalar(Math.cos(MV.tilt)).add(new THREE.Vector3(0,Math.sin(MV.tilt),0)).normalize();if(MV.flat)dir=MV.n.clone().multiplyScalar(.82).addScaledVector(MV.up,-.58).normalize();
 const hEff=MV.flat?MV.h*.82:MV.h;const d=Math.max((hEff/2)/(tv*frac*.94),(MV.w/2)/(tv*asp*.9));MV.cam.copy(MV.look).addScaledVector(dir,d);
 camera.setViewOffset(innerWidth,innerHeight,0,(pad-top)/2,innerWidth,innerHeight);if(snap){camera.position.copy(MV.cam);camera.up.set(0,1,0);camera.lookAt(MV.look)}}
function mvClose(){if(!MV.on)return;MV.on=false;if(MV.mesh)MV.mesh.visible=false;document.body.classList.remove('in-mach');myAv.visible=true;camera.clearViewOffset();camera.up.set(0,1,0)}
function mvTick(dt){if(!MV.on)return;camera.position.lerp(MV.cam,1-Math.exp(-dt*8));camera.lookAt(MV.look);if(MV.tex&&MV.mesh.visible)MV.tex.needsUpdate=true}
addEventListener('resize',()=>MV.on&&mvFrame(false));
// pointer → game coordinates by ray-casting onto the screen surface
const mvRay=new THREE.Raycaster(),mvNdc=new THREE.Vector2();
function mvHit(e){if(!MV.mesh)return null;mvNdc.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);mvRay.setFromCamera(mvNdc,camera);const h=mvRay.intersectObject(MV.mesh,false)[0];if(!h||!h.uv)return null;return[h.uv.x*GW,(1-h.uv.y)*GH]}
const ml=$('mlayer');
ml.addEventListener('pointerdown',e=>{if(!G)return;e.preventDefault();ml.setPointerCapture(e.pointerId);MV.swipe={x:e.clientX,y:e.clientY};const p=mvHit(e);if(p)G.down?.(p[0],p[1]);else if(G.over&&!G.vs)G.down?.(GW/2,GH/2)});
ml.addEventListener('pointermove',e=>{if(!G)return;if(!MV.swipe&&e.pointerType!=='mouse')return;const p=mvHit(e);if(p)G.move?.(p[0],p[1],!!MV.swipe)});
ml.addEventListener('pointerup',e=>{if(!G)return;const p=mvHit(e);if(p)G.up?.(p[0],p[1]);if(!MV.swipe)return;const dx=e.clientX-MV.swipe.x,dy=e.clientY-MV.swipe.y;MV.swipe=null;if(Math.hypot(dx,dy)<24)return;G.dir?.(Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)])});
ml.addEventListener('pointercancel',()=>MV.swipe=null);
$('cab').append($('lobby'));
