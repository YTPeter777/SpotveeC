
// ================= Q-style animal avatars =================
const SPECIES=[{k:'cat',n:'貓咪',e:'🐱'},{k:'dog',n:'狗狗',e:'🐶'},{k:'bunny',n:'兔兔',e:'🐰'},{k:'bear',n:'熊熊',e:'🐻'},{k:'panda',n:'熊貓',e:'🐼'},{k:'fox',n:'狐狸',e:'🦊'},{k:'frog',n:'青蛙',e:'🐸'},{k:'penguin',n:'企鵝',e:'🐧'}];
const FURS=['#f6d7b0','#c98a5a','#9a93ad','#fffaf2','#ffb7d2','#ffbf66','#9fe0b9','#a8c8ff'];
const FUR_DEFAULT={cat:0,dog:1,bunny:3,bear:1,panda:3,fox:5,frog:6,penguin:2};
const OUTFIT=['#ff6fb1','#ff9a5c','#ffd864','#55eeb4','#62c9ff','#8f7bff','#f2efff','#463d6b'];
const ACCS=[{k:'none',n:'無'},{k:'bow',n:'蝴蝶結'},{k:'cap',n:'棒球帽'},{k:'glasses',n:'圓眼鏡'},{k:'crown',n:'小皇冠'},{k:'phones',n:'耳機'},{k:'flower',n:'花冠'},{k:'clip',n:'星星髮夾'},{k:'heart',n:'愛心眼鏡'},{k:'beret',n:'貝雷帽'},{k:'berry',n:'草莓帽'},{k:'scarf',n:'圍巾'},{k:'bag',n:'小背包'},{k:'ribbon',n:'大蝴蝶結'}];
const look=(()=>{const l=store.get('look',null)||{};const sp=clampI(l.sp,SPECIES.length,Math.floor(Math.random()*SPECIES.length));return{sp,fur:clampI(l.fur,FURS.length,FUR_DEFAULT[SPECIES[sp].k]),cl:clampI(l.cl,OUTFIT.length,Math.floor(Math.random()*6)),acc:clampI(l.acc,ACCS.length,0)}})();
const lookKey=l=>[l.sp,l.fur,l.cl,l.acc].join(',');
const parseLook=a=>Array.isArray(a)?{sp:clampI(a[0],SPECIES.length),fur:clampI(a[1],FURS.length),cl:clampI(a[2],OUTFIT.length),acc:clampI(a[3],ACCS.length)}:{sp:0,fur:0,cl:0,acc:0};
const AG={head:new THREE.SphereGeometry(.36,44,32),torso:new THREE.LatheGeometry([[0,0],[.19,0],[.22,.06],[.215,.2],[.18,.34],[.12,.42],[0,.45]].map(p=>new THREE.Vector2(p[0],p[1])),32),
 hood:new THREE.TorusGeometry(.17,.05,10,28),arm:new THREE.CapsuleGeometry(.058,.13,6,12),paw:new THREE.SphereGeometry(.07,18,12),leg:new THREE.CapsuleGeometry(.072,.08,6,12),foot:new THREE.SphereGeometry(.09,18,12),
 eye:new THREE.SphereGeometry(.055,22,16),shine:new THREE.SphereGeometry(.017,10,8),blush:new THREE.CircleGeometry(.052,20),nose:new THREE.SphereGeometry(.035,16,12),muzzle:new THREE.SphereGeometry(.13,24,16),
 smile:new THREE.TorusGeometry(.028,.008,8,16,Math.PI),cone:new THREE.ConeGeometry(.11,.22,20),ball:new THREE.SphereGeometry(.1,20,14),longEar:new THREE.CapsuleGeometry(.068,.3,8,14),flop:new THREE.SphereGeometry(.12,20,14),
 ring:new THREE.RingGeometry(.36,.43,44),halo:new THREE.RingGeometry(.45,.9,48),torus:new THREE.TorusGeometry(.065,.012,8,24),bowL:new THREE.ConeGeometry(.06,.1,12),
 tailCat:new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0,0,0],[0,.08,-.12],[0,.24,-.2],[.04,.36,-.14],[.02,.42,-.06]].map(p=>new THREE.Vector3(...p))),24,.03,10)};
const MAT={skin:new Map()};
const matFor=(c,r=.62)=>{const k=c+r;if(!MAT.skin.has(k))MAT.skin.set(k,new THREE.MeshPhysicalMaterial({color:c,roughness:r,sheen:.5,sheenRoughness:.7,sheenColor:new THREE.Color(c).lerp(new THREE.Color('#fff'),.5)}));return MAT.skin.get(k)};
const eyeMat=std('#221a2e',.08),irisMat=new THREE.MeshBasicMaterial({color:'#8c6ad8',transparent:true,opacity:.75,depthWrite:false}),whiteMat=new THREE.MeshBasicMaterial({color:'#ffffff'}),blushMat=new THREE.MeshBasicMaterial({color:'#ff8fb0',transparent:true,opacity:.62,depthWrite:false}),
 pinkMat=std('#ff9cbc',.5),blackMat=std('#26222f',.55),noseBlack=std('#2a2230',.25),orangeMat=std('#ff9a3c',.45),goldMat=std('#ffd864',.25,.9),chromeMat=M.chrome;
const whiteMat2=std('#fffaf2',.6),starMat=new THREE.MeshStandardMaterial({color:'#ffd864',roughness:.4,emissive:'#ffb84a',emissiveIntensity:.25});
const starGeo=(()=>{const sh=new THREE.Shape();for(let i=0;i<10;i++){const a=i/10*Math.PI*2+Math.PI/2,r=i%2?.016:.036;i?sh.lineTo(Math.cos(a)*r,Math.sin(a)*r):sh.moveTo(Math.cos(a)*r,Math.sin(a)*r)}return new THREE.ExtrudeGeometry(sh,{depth:.006,bevelEnabled:false})})();
const glowSprite=ctex(128,128,(g,w,h)=>{const gr=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);gr.addColorStop(0,'rgba(85,238,180,.9)');gr.addColorStop(1,'rgba(85,238,180,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)});
function makeAnimal(lk,opt={}){
 const sp=SPECIES[lk.sp]?.k||'cat',fur=FURS[lk.fur]||FURS[0],oc=opt.outfit||OUTFIT[lk.cl]||OUTFIT[0];
 const furM=matFor(fur),furDark=matFor(new THREE.Color(fur).multiplyScalar(.72).getStyle()),cloth=fabric(oc),pants=fabric(new THREE.Color(oc).multiplyScalar(.45).getStyle());
 const light=matFor(sp==='fox'||sp==='dog'||sp==='bear'?'#fff6ea':new THREE.Color(fur).lerp(new THREE.Color('#ffffff'),.6).getStyle());
 const g=new THREE.Group(),root=new THREE.Group();g.add(root);
 const mk=(geo,mat,x,y,z,p=root,sh=true)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=sh;p.add(m);return m};
 // legs & feet
 const legs=[-1,1].map(s=>{const p=new THREE.Group();p.position.set(s*.09,.24,0);root.add(p);mk(AG.leg,sp==='penguin'?furM:pants,0,-.1,0,p);const f=mk(AG.foot,sp==='penguin'?orangeMat:sp==='panda'?blackMat:furM,0,-.19,.04,p);f.scale.set(1,.62,1.3);return p});
 // body
 const torso=mk(AG.torso,sp==='penguin'?furM:cloth,0,.2,0);
 if(sp==='penguin'){const belly=mk(AG.muzzle,light,0,.4,.1);belly.scale.set(1.25,1.6,.8);const bow=mk(AG.bowL,cloth,-.05,.62,.15);bow.rotation.z=Math.PI/2;const bow2=mk(AG.bowL,cloth,.05,.62,.15);bow2.rotation.z=-Math.PI/2}
 else{const hood=mk(AG.hood,cloth,0,.62,-.04);hood.rotation.x=Math.PI/2-.3;[-1,1].forEach(s=>{mk(new THREE.CylinderGeometry(.006,.006,.12,6),whiteMat2,s*.045,.53,.19,root,false);mk(new THREE.SphereGeometry(.014,8,6),whiteMat2,s*.045,.47,.195,root,false)});const st=mk(starGeo,starMat,.075,.42,.215,root,false);st.scale.setScalar(.9);const pocket=mk(new THREE.BoxGeometry(.2,.08,.02),pants,0,.36,.205,root,false);pocket.rotation.x=-.12}
 // arms
 const arms=[-1,1].map(s=>{const p=new THREE.Group();p.position.set(s*.2,.56,0);root.add(p);
  if(sp==='penguin'){const fl=mk(AG.arm,furM,0,-.1,0,p);fl.scale.set(.6,1.3,1.4)}else{mk(AG.arm,cloth,0,-.1,0,p);mk(AG.paw,sp==='panda'?blackMat:furM,0,-.2,0,p)}return p});
 // head
 const head=new THREE.Group();head.position.y=.6;root.add(head);const hm=mk(AG.head,furM,0,.34,0,head);hm.scale.set(1.08,.95,1);
 if(sp==='penguin'){const mask=mk(AG.head,light,0,.31,.07,head);mask.scale.set(.86,.78,.9)}
 if(sp==='panda')[-1,1].forEach(s=>{const p=mk(AG.muzzle,blackMat,s*.12,.33,.295,head,false);p.scale.set(.62,.8,.42);p.rotation.z=s*.5});
 if(['dog','bear','fox','panda'].includes(sp)){const mz=mk(AG.muzzle,light,0,.24,.27,head);mz.scale.set(sp==='fox'?1.05:1.15,.78,.72)}
 if(sp==='frog'){[-1,1].forEach(s=>{const b=mk(AG.ball,furM,s*.15,.62,.1,head);b.scale.setScalar(1.15)})}
 const eyeY=sp==='frog'?.65:.34,eyeZ=sp==='frog'?.205:sp==='penguin'?.355:.327;
 const eyes=[-1,1].map(s=>{const e=mk(AG.eye,eyeMat,s*(sp==='frog'?.15:.125),eyeY,eyeZ,head,false);e.scale.set(.92,1.22,.55);mk(AG.shine,whiteMat,s*(sp==='frog'?.15:.125)+.022,eyeY+.03,eyeZ+.028,head,false);mk(AG.shine,whiteMat,s*(sp==='frog'?.15:.125)-.014,eyeY-.025,eyeZ+.03,head,false).scale.setScalar(.55);return e});
 const ex=sp==='frog'?.15:.125;[-1,1].forEach(s=>{for(let i=0;i<3;i++){const l=mk(new THREE.BoxGeometry(.006,.034,.006),blackMat,s*(ex+.03+i*.016),eyeY+.058-i*.012,eyeZ+.012,head,false);l.rotation.z=-s*(.5+i*.38)}
  const ir=mk(new THREE.CircleGeometry(.03,18),irisMat,s*ex,eyeY-.028,eyeZ+.031,head,false);ir.scale.set(1,.7,1);mk(AG.shine,whiteMat,s*ex-.022,eyeY+.042,eyeZ+.029,head,false).scale.setScalar(.38)});
 [-1,1].forEach(s=>{const b=mk(AG.blush,blushMat,s*.205,.245,sp==='penguin'?.33:.29,head,false);b.rotation.y=s*.6;b.scale.setScalar(sp==='panda'||sp==='penguin'?.8:1.08)});
 if(sp==='penguin'){const bk=mk(AG.cone,orangeMat,0,.235,.395,head);bk.scale.set(.55,.5,.55);bk.rotation.x=Math.PI/2}
 else if(sp==='frog'){const sm=mk(AG.smile,blackMat,0,.25,.33,head,false);sm.scale.set(2.4,1.6,1);sm.rotation.z=Math.PI}
 else{const n=mk(AG.nose,(sp==='cat'||sp==='bunny')?pinkMat:noseBlack,0,['dog','bear','fox','panda'].includes(sp)?.28:.265,['dog','bear','fox','panda'].includes(sp)?.37:.335,head,false);n.scale.set(1.2,.85,.9);
  if(sp==='cat'){[-1,1].forEach(s=>{const m=mk(AG.smile,blackMat,s*.028,.225,.33,head,false);m.rotation.z=Math.PI});[-1,1].forEach(s=>[.0,.03].forEach(o=>{const w=mk(new THREE.CylinderGeometry(.003,.003,.16,4),blackMat,s*.2,.24+o,.27,head,false);w.rotation.z=Math.PI/2+s*(o?-.15:.1)}))}
  else{const m=mk(AG.smile,blackMat,0,['dog','bear','fox','panda'].includes(sp)?.2:.22,['dog','bear','fox','panda'].includes(sp)?.355:.33,head,false);m.rotation.z=Math.PI}}
 // ears
 const ears=[];
 if(sp==='cat'||sp==='fox')[-1,1].forEach(s=>{const p=new THREE.Group();p.position.set(s*.2,.62,-.02);p.rotation.z=-s*.32;head.add(p);mk(AG.cone,furM,0,.06,0,p).scale.set(1,sp==='fox'?1.25:1,.7);const i=mk(AG.cone,sp==='fox'?blackMat:pinkMat,0,sp==='fox'?.15:.04,.035,p,false);i.scale.set(sp==='fox'?.45:.55,sp==='fox'?.45:.65,.3);ears.push(p)});
 if(sp==='dog')[-1,1].forEach(s=>{const p=new THREE.Group();p.position.set(s*.3,.5,0);p.rotation.z=s*.35;head.add(p);const e=mk(AG.flop,furDark,0,-.1,0,p);e.scale.set(.5,1.15,.85);ears.push(p)});
 if(sp==='bunny')[-1,1].forEach(s=>{const p=new THREE.Group();p.position.set(s*.12,.66,-.02);p.rotation.z=-s*.14;head.add(p);mk(AG.longEar,furM,0,.2,0,p).scale.set(1,1,.7);const i=mk(AG.longEar,pinkMat,0,.2,.035,p,false);i.scale.set(.5,.8,.25);ears.push(p)});
 if(sp==='bear'||sp==='panda')[-1,1].forEach(s=>{const p=new THREE.Group();p.position.set(s*.25,.6,-.03);head.add(p);mk(AG.ball,sp==='panda'?blackMat:furM,0,0,0,p).scale.set(1,1,.7);if(sp==='bear')mk(AG.ball,light,0,0,.04,p,false).scale.set(.55,.55,.3);ears.push(p)});
 // tail
 let tail=null;const tp=new THREE.Group();tp.position.set(0,.26,-.2);root.add(tp);
 if(sp==='cat'){tail=mk(AG.tailCat,furM,0,0,0,tp)}
 else if(sp==='fox'){tail=mk(AG.muzzle,furM,0,.08,-.12,tp);tail.scale.set(.95,1.5,.95);tail.rotation.x=.9;mk(AG.ball,light,0,.2,-.28,tp).scale.setScalar(.7)}
 else if(sp==='bunny'){tail=mk(AG.ball,light,0,0,0,tp)}
 else if(sp==='dog'){tail=mk(AG.longEar,furM,0,.08,-.04,tp);tail.scale.set(.5,.45,.5);tail.rotation.x=-.8}
 else if(sp==='bear'||sp==='panda'){tail=mk(AG.ball,sp==='panda'?blackMat:furM,0,0,0,tp);tail.scale.setScalar(.6)}
 else if(sp==='penguin'){tail=mk(AG.cone,furM,0,-.02,-.02,tp);tail.scale.set(.6,.4,.3);tail.rotation.x=-1.9}
 // accessory
 const acc=ACCS[lk.acc]?.k;const top=sp==='frog'?.66:.7;const eared=['cat','fox','bear','panda','bunny'].includes(sp);
 // hats sit between the ears: smaller and pushed forward on eared species so nothing pokes through
 const hatS=sp==='bunny'?.58:eared?.82:1,hatZ=sp==='bunny'?.1:eared?.05:0;
 const hat=(y=top)=>{const c=new THREE.Group();c.position.set(0,y,hatZ);c.scale.setScalar(hatS);head.add(c);return c};
 if(acc==='bow'||acc==='ribbon'){const big=acc==='ribbon';const b=new THREE.Group();if(big){b.position.set(0,top+.01,-.08);b.scale.setScalar(1.7)}else{b.position.set(.27,.5,.13);b.rotation.set(0,.5,-.3)}head.add(b);const bm=big?matFor('#ff7eb6',.4):cloth;[-1,1].forEach(s=>{const c=mk(AG.bowL,bm,s*.055,0,0,b);c.rotation.z=s*Math.PI/2});mk(AG.shine,bm,0,0,0,b).scale.setScalar(2.2)}
 if(acc==='cap'){const c=hat(top-.02);const dome=mk(new THREE.SphereGeometry(.28,28,16,0,Math.PI*2,0,Math.PI/2),cloth,0,0,0,c);dome.scale.set(1,.7,1);const brim=mk(new THREE.CylinderGeometry(.2,.2,.02,24,1,false,-Math.PI/2,Math.PI),cloth,0,.005,.12,c);brim.scale.set(1.1,1,1.2);c.rotation.x=-.12}
 if(acc==='glasses'||acc==='heart'){const gg=new THREE.Group();gg.position.set(0,eyeY,eyeZ+.065);head.add(gg);const ex2=sp==='frog'?.15:.125;
  if(acc==='glasses'){[-1,1].forEach(s=>mk(AG.torus,chromeMat,s*ex2,0,0,gg,false));mk(new THREE.CylinderGeometry(.008,.008,.11,6),chromeMat,0,.01,0,gg,false).rotation.z=Math.PI/2}
  else{const hs=new THREE.Shape();hs.moveTo(0,-.05);hs.bezierCurveTo(-.09,.0,-.05,.07,0,.035);hs.bezierCurveTo(.05,.07,.09,0,0,-.05);const hg=new THREE.ExtrudeGeometry(hs,{depth:.012,bevelEnabled:false});const hm=new THREE.MeshPhysicalMaterial({color:'#ff6fb1',roughness:.2,transmission:.2,clearcoat:1});
   [-1,1].forEach(s=>{const m=mk(hg,hm,s*ex2,0,-.006,gg,false);m.scale.setScalar(1.15)});mk(new THREE.CylinderGeometry(.007,.007,.09,6),hm,0,.02,0,gg,false).rotation.z=Math.PI/2}}
 if(acc==='crown'){const c=hat(top+.03);mk(new THREE.CylinderGeometry(.13,.12,.08,20,1,true),goldMat,0,0,0,c);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const sp2=mk(AG.bowL,goldMat,Math.cos(a)*.12,.08,Math.sin(a)*.12,c);sp2.scale.set(.5,.8,.5)}mk(AG.shine,matFor('#ff6fb1',.2),0,.02,.13,c).scale.setScalar(1.6)}
 if(acc==='phones'){const h=new THREE.Group();h.position.set(0,.34,0);if(eared)h.rotation.x=-.5;head.add(h);mk(new THREE.TorusGeometry(.37,.025,8,32,Math.PI),cloth,0,.02,0,h);[-1,1].forEach(s=>{const cup=mk(new THREE.CylinderGeometry(.09,.09,.06,20),cloth,s*.37,0,0,h);cup.rotation.z=Math.PI/2})}
 if(acc==='flower'){const c=hat(top-.02);const pc=['#ffb3d1','#fff1a8','#c9b4ff','#a8e6ff','#ffc8a8'];for(let i=0;i<7;i++){const a=i/7*Math.PI*2,fx=Math.cos(a)*.17,fz=Math.sin(a)*.15;const fm=matFor(pc[i%5],.5);for(let k=0;k<5;k++){const b=k/5*Math.PI*2;mk(new THREE.SphereGeometry(.028,10,8),fm,fx+Math.cos(b)*.03,.01,fz+Math.sin(b)*.03,c,false)}mk(new THREE.SphereGeometry(.018,8,6),matFor('#ffd864',.4),fx,.025,fz,c,false)}}
 if(acc==='clip'){[-1,1].forEach(s=>{const m=mk(starGeo,starMat,s*.25,.52,.17,head,false);m.scale.setScalar(1.6);m.rotation.y=s*.6})}
 if(acc==='beret'){const c=hat(top-.01);const b=mk(new THREE.CylinderGeometry(.26,.22,.07,28),matFor('#ff8cc4',.7),0,0,0,c);c.rotation.z=.22;mk(new THREE.SphereGeometry(.025,8,6),matFor('#ff8cc4',.7),0,.05,0,c)}
 if(acc==='berry'){const c=hat(top-.02);const cone=mk(new THREE.SphereGeometry(.22,24,14,0,Math.PI*2,0,Math.PI/2),matFor('#ff5a78',.45),0,0,0,c);cone.scale.set(1,1.15,1);for(let i=0;i<14;i++){const a=i*2.4,h=.03+(i%5)*.035;mk(new THREE.SphereGeometry(.009,6,4),matFor('#fff1a8',.4),Math.cos(a)*(.2-h*.6),h,Math.sin(a)*(.2-h*.6),c,false)}
  for(let i=0;i<5;i++){const l=mk(AG.bowL,matFor('#5fcf8f',.6),Math.cos(i*1.26)*.05,.26,Math.sin(i*1.26)*.05,c);l.rotation.set(Math.sin(i*1.26)*1.1,0,-Math.cos(i*1.26)*1.1)}}
 if(acc==='scarf'){const sc=matFor('#ff9cc9',.85);const t=mk(new THREE.TorusGeometry(.16,.045,10,28),sc,0,.6,.02,root);t.rotation.x=Math.PI/2;const tl=mk(new THREE.BoxGeometry(.07,.2,.03),sc,.09,.5,.17,root);tl.rotation.z=.15}
 if(acc==='bag'){const bg=mk(RB(.2,.22,.1,.04),matFor('#ffd1e8',.6),0,.42,-.2,root);mk(new THREE.SphereGeometry(.03,10,8),starMat,0,.45,-.255,root,false);[-1,1].forEach(s=>{const st=mk(new THREE.TorusGeometry(.11,.012,6,16,Math.PI),matFor('#ff8cc4',.6),s*.1,.5,-.05,root,false);st.rotation.y=Math.PI/2})}
 const ring=new THREE.Mesh(AG.ring,new THREE.MeshBasicMaterial({color:oc,transparent:true,opacity:opt.npc?0:.75,toneMapped:false,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;g.add(ring);
 const halo=new THREE.Mesh(AG.halo,new THREE.MeshBasicMaterial({color:'#55eeb4',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));halo.rotation.x=-Math.PI/2;halo.position.y=.03;halo.visible=false;g.add(halo);
 const gs=new THREE.Sprite(new THREE.SpriteMaterial({map:glowSprite,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));gs.scale.set(1.8,2.2,1);gs.position.y=.75;gs.visible=false;g.add(gs);
 g.userData={root,head,eyes,legs,arms,torso,ears,tail,tp,halo,gs,ring,blink:Math.random()*4,sp,look:{...lk}};return g}
function animAvatar(a,t,dt,sp,em,et,air,talk,pose){const u=a.userData,s=Math.min(sp/4.6,1),ph=t*13,ago=t-et;
 const lx=Math.sin(ph)*.75*s,ax=Math.sin(ph)*.7*s;
 u.legs[0].rotation.set(lx,0,0);u.legs[1].rotation.set(-lx,0,0);u.arms[0].rotation.set(-ax,0,-.12);u.arms[1].rotation.set(ax,0,.12);
 u.root.position.set(0,Math.abs(Math.sin(ph))*.07*s,0);u.root.rotation.set(0,0,0);u.head.rotation.set(Math.sin(t*1.7)*.03,0,Math.sin(ph*.5)*.06*s);u.torso.scale.set(1,1+Math.sin(t*2.4)*.02,1);
 if(u.tail)u.tp.rotation.set(0,Math.sin(t*(u.sp==='dog'?14:3))*(u.sp==='dog'?.6:.3),0);
 u.ears.forEach((e,i)=>{e.rotation.x=Math.max(0,Math.sin(t*1.3+i*2+u.blink*3))**30*-.4});
 if(pose==='sit'||pose==='ride'){u.legs[0].rotation.x=u.legs[1].rotation.x=-1.45;u.root.position.y=-.2;u.legs.forEach((l,i)=>l.rotation.z=pose==='ride'?(i?-.6:.6):0);u.arms[0].rotation.set(-.5,0,-.15);u.arms[1].rotation.set(-.5,0,.15)}
 else u.legs.forEach(l=>l.rotation.z=0);
 if(air&&!pose){u.arms[0].rotation.z=-1.1;u.arms[1].rotation.z=1.1;u.legs[0].rotation.x=-.5;u.legs[1].rotation.x=.3}
 if(em==='wave'&&ago<2.6){u.arms[1].rotation.set(0,0,2.5+Math.sin(t*14)*.35);u.head.rotation.z=.12}
 else if(em==='dance'&&ago<8&&sp<.5){const b=t*10;u.root.rotation.y=Math.sin(t*5)*.6;u.root.position.y+=Math.abs(Math.sin(b))*.1;u.arms[0].rotation.set(0,0,-1.6-Math.sin(b)*.8);u.arms[1].rotation.set(0,0,1.6-Math.sin(b)*.8);if(!pose){u.legs[0].rotation.x=Math.sin(b)*.4;u.legs[1].rotation.x=-u.legs[0].rotation.x}u.head.rotation.z=Math.sin(t*5)*.2}
 else if(em==='cheer'&&ago<2.6){u.arms[0].rotation.set(0,0,-2.7);u.arms[1].rotation.set(0,0,2.7);u.root.position.y+=Math.abs(Math.sin(t*9))*.22}
 else if(em==='heart'&&ago<2.6){u.arms[0].rotation.set(-.3,0,-2.35);u.arms[1].rotation.set(-.3,0,2.35);u.head.rotation.z=Math.sin(t*4)*.1}
 else if(em==='spin'&&ago<1.1){const k=ago/1.1;u.root.rotation.y=k*Math.PI*2;u.root.position.y+=Math.sin(k*Math.PI)*.5}
 else if(em==='laugh'&&ago<2.4){u.root.rotation.x=Math.sin(t*16)*.06-.08;u.arms[0].rotation.set(-1.2,0,-.3);u.arms[1].rotation.set(-1.2,0,.3);u.head.rotation.x=-.2+Math.sin(t*16)*.08}
 else if((em==='drink'||em==='eat')&&ago<3){u.arms[1].rotation.set(-2.2+Math.sin(t*6)*.15,0,-.35);u.head.rotation.x=-.15}
 else if(em==='bowl'&&ago<1.2){const k=Math.min(1,ago/.4);u.arms[1].rotation.set(-1.5+k*2.7,0,.1);u.root.rotation.x=.15*k}
 else if(em==='play'){u.arms[0].rotation.set(-1.1+Math.sin(t*9)*.15,0,-.1);u.arms[1].rotation.set(-1.1+Math.cos(t*11)*.15,0,.1);u.head.rotation.x=-.08}
 else if(em==='drive'){u.arms[0].rotation.set(-1.25,0,-.1+Math.sin(t*2)*.1);u.arms[1].rotation.set(-1.25,0,.1+Math.sin(t*2)*.1)}
 else if(em==='hockey'){u.arms[1].rotation.set(-1+Math.sin(t*5)*.4,Math.sin(t*4)*.4,.2);u.root.rotation.x=.2}
 else if(em==='step'){const b=t*9;u.legs[0].rotation.x=Math.max(0,Math.sin(b))*.8;u.legs[1].rotation.x=Math.max(0,-Math.sin(b))*.8;u.root.position.y+=Math.abs(Math.sin(b))*.08;u.arms[0].rotation.set(0,0,-.8-Math.sin(b)*.4);u.arms[1].rotation.set(0,0,.8-Math.sin(b)*.4)}
 const bl=((t+u.blink)%3.8)<.12?.12:1;u.eyes[0].scale.y=u.eyes[1].scale.y=1.22*bl;
 const k=talk?.6+Math.sin(t*8)*.25:0,hm=u.halo.material;hm.opacity+=(k-hm.opacity)*Math.min(1,dt*10);u.halo.visible=hm.opacity>.01;u.halo.scale.setScalar(1+(talk?Math.sin(t*8)*.06:0));u.gs.material.opacity=hm.opacity*.45;u.gs.visible=u.halo.visible}
// floating hearts / drinks
const heartTex=ctex(128,128,(g)=>{g.fillStyle='#ff6fb1';g.shadowColor='#ff6fb1';g.shadowBlur=14;g.beginPath();g.moveTo(64,108);g.bezierCurveTo(10,70,14,22,46,22);g.bezierCurveTo(56,22,62,30,64,38);g.bezierCurveTo(66,30,72,22,82,22);g.bezierCurveTo(114,22,118,70,64,108);g.fill()});
const noteTex=ctex(128,128,(g)=>{g.fillStyle='#55eeb4';g.shadowColor='#55eeb4';g.shadowBlur=12;g.beginPath();g.ellipse(46,92,22,16,-.4,0,7);g.fill();g.fillRect(62,24,8,70);g.beginPath();g.moveTo(62,24);g.quadraticCurveTo(100,30,96,62);g.quadraticCurveTo(90,44,70,42);g.fill()});
const floaters=[];function spawnFloat(p,texr=heartTex,n=4){for(let i=0;i<n;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texr,transparent:true,depthWrite:false}));s.position.set(p.x+(Math.random()-.5)*.5,p.y+1.4,p.z+(Math.random()-.5)*.3);s.scale.setScalar(.25);scene.add(s);floaters.push({s,t:-i*.18})}}
function heldItem(a,kind){const u=a.userData;if(u.held){u.arms[1].remove(u.held);u.held=null}if(!kind)return;const g=new THREE.Group();
 if(kind==='drink'){const c=new THREE.Mesh(new THREE.CylinderGeometry(.045,.035,.12,12),std(OUTFIT[(Math.random()*6)|0],.4));const s=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.12,6),std('#fff',.4));s.position.set(.015,.08,0);g.add(c,s)}
 else{const c=new THREE.Mesh(new THREE.CylinderGeometry(.05,.035,.1,12),std('#c8102e',.5));const p=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),std('#fff6d8',.8));p.position.y=.06;g.add(c,p)}
 g.position.set(0,-.27,.03);u.arms[1].add(g);u.held=g}
// NPC staff
const npcs=[];
function npc(lk,x,f,z,ry,kind,name){const a=makeAnimal(lk,{outfit:'#3a2b70',npc:true});a.position.set(x,f,z);a.rotation.y=ry;scene.add(a);npcs.push({a,kind,ph:Math.random()*9,name});const cap=new THREE.Mesh(new THREE.CylinderGeometry(.19,.21,.1,20),fabric('#ff6fb1'));cap.position.y=.72;a.userData.head.add(cap);return a}
npc({sp:3,fur:1,cl:0,acc:0},7,.32,16.1,Math.PI,'clerk','熊店長');npc({sp:2,fur:3,cl:0,acc:0},15.4,.32,11,-Math.PI/2,'snack','兔兔店員');
npc({sp:5,fur:5,cl:0,acc:5},12.8,F2,17.62,Math.PI,'dj','DJ 狐狸');npc({sp:1,fur:0,cl:0,acc:2},-4.0,.2,-1.8,-Math.PI/2,'shoes','狗狗服務員');
function animNPCs(t,dt){for(const n of npcs){const k=n.kind;if(k==='dj')animAvatar(n.a,t,dt,0,'dance',t-1,false,false);else{const w=((t+n.ph)%9)<2.4;animAvatar(n.a,t,dt,0,w?'wave':'',w?t-((t+n.ph)%9):-9,false,false)}}}

// ================= 3D portraits for the HUD =================
const PORT={scene:new THREE.Scene(),cam:new THREE.PerspectiveCamera(30,1,.1,20),rt:null,cache:new Map(),S:160,lut:null};
// lights at half strength: the target has no tone mapping, so ACES is applied in JS on readback (x2 exposure)
{const h=new THREE.HemisphereLight('#ffffff','#6a58b0',.75);const d=new THREE.DirectionalLight('#fff1e2',1.5);d.position.set(-1.2,2.4,3);const f=new THREE.DirectionalLight('#cfe0ff',.45);f.position.set(2,.6,2.5);const r=new THREE.DirectionalLight('#ff8fd0',1.3);r.position.set(1.6,1.4,-2.2);PORT.scene.add(h,d,f,r);PORT.scene.environmentIntensity=.22}
function portraitTone(px){if(!PORT.lut){PORT.lut=new Float32Array(256);for(let i=0;i<256;i++){const c=i/255;PORT.lut[i]=c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)}}
 const L=PORT.lut,E=2.5*1.05/.6,enc=x=>{x=x<0?0:x>1?1:x;return 255*(x<=.0031308?x*12.92:1.055*Math.pow(x,1/2.4)-.055)},fit=v=>(v*(v+.0245786)-.000090537)/(v*(.983729*v+.432951)+.238081);
 for(let i=0;i<px.length;i+=4){if(!px[i+3])continue;const r=L[px[i]]*E,g=L[px[i+1]]*E,b=L[px[i+2]]*E;
  const R=fit(.59719*r+.35458*g+.04823*b),G=fit(.076*r+.90834*g+.01566*b),B=fit(.0284*r+.13383*g+.83777*b);
  px[i]=enc(1.60475*R-.53108*G-.07367*B);px[i+1]=enc(-.10208*R+1.10813*G-.00605*B);px[i+2]=enc(-.00327*R-.07276*G+1.07602*B)}}
function portrait(lk){const k=lookKey(lk);const hit=PORT.cache.get(k);if(hit)return hit;const S=PORT.S,W=S*2;
 if(!PORT.rt){PORT.rt=new THREE.WebGLRenderTarget(W,W);PORT.rt.texture.colorSpace=THREE.SRGBColorSpace;PORT.scene.environment=scene.environment}
 const a=makeAnimal(lk,{npc:true});a.userData.ring.visible=false;a.rotation.y=-.22;PORT.scene.add(a);const tall=SPECIES[lk.sp]?.k==='bunny'?.1:0;
 PORT.cam.position.set(.34,1.05+tall,2.08+tall*1.6);PORT.cam.lookAt(0,.95+tall*.7,0);
 const prevT=renderer.getRenderTarget(),prevC=renderer.getClearColor(new THREE.Color()),prevA=renderer.getClearAlpha(),sh=renderer.shadowMap.enabled;renderer.shadowMap.enabled=false;
 renderer.setRenderTarget(PORT.rt);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(PORT.scene,PORT.cam);
 const px=new Uint8Array(W*W*4);renderer.readRenderTargetPixels(PORT.rt,0,0,W,W,px);renderer.setRenderTarget(prevT);renderer.setClearColor(prevC,prevA);renderer.shadowMap.enabled=sh;PORT.scene.remove(a);
 portraitTone(px);const big=cv(W,W),bg=big.getContext('2d'),img=bg.createImageData(W,W);for(let y=0;y<W;y++)img.data.set(px.subarray((W-1-y)*W*4,(W-y)*W*4),y*W*4);bg.putImageData(img,0,0);
 const c=cv(S,S),g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(big,0,0,S,S);
 let url='';try{url=c.toDataURL('image/png')}catch(e){}PORT.cache.set(k,url);return url}
function pfEl(lk,talk){const s=document.createElement('span');s.className='pf'+(talk?' talk':'');s.style.setProperty('--pc',OUTFIT[lk.cl]||'#ff8cc4');const im=document.createElement('img');im.alt='';im.src=portrait(lk);s.append(im);return s}
