
// ================= website camera, venue themes, equipment =================
const SHOTS=[[[9,4.6,11],[0,1.2,-1]],[[-2.5,3.4,1.5],[-13,.8,-7]],[[4.5,2.9,-1.5],[0,1.5,-11]],[[-5,3.2,9],[-14,1.4,7]],[[10,3.6,3],[15,1.2,10]],[[2,8.5,6],[0,4.5,-6]]];
const _sp=new THREE.Vector3(),_st=new THREE.Vector3(),_a=new THREE.Vector3(),_b=new THREE.Vector3();
function siteCam(t,dt){const per=13,n=SHOTS.length,k=(t/per)%n,i=Math.floor(k),f=k-i,e=f<.72?0:((f-.72)/.28),s=e*e*(3-2*e);const A=SHOTS[i],B=SHOTS[(i+1)%n];
 _sp.fromArray(A[0]).lerp(_a.fromArray(B[0]),s);_st.fromArray(A[1]).lerp(_b.fromArray(B[1]),s);const drift=f*1.2;_sp.x+=Math.sin(t*.13)*.6+drift*.4;_sp.y+=Math.sin(t*.21)*.15;
 camera.position.lerp(_sp,1-Math.exp(-dt*3));camT.lerp(_st,1-Math.exp(-dt*3));camera.lookAt(camT);
 const w=innerWidth,h=innerHeight,home=APP.page==='home'&&!document.body.classList.contains('creating');if(home&&w>760)camera.setViewOffset(w,h,-w*.17,0,w,h);else if(home)camera.setViewOffset(w,h,0,h*.14,w,h);else camera.clearViewOffset()}
// venue lighting themes: world code registers hooks that recolour LEDs / neon / accent lights
const themeHooks=[];let THEME=THEMES.neon,themeKey='neon';
function applyTheme(k){if(!THEMES[k])k='neon';themeKey=k;THEME=THEMES[k];worldTheme(THEME);for(const f of themeHooks)try{f(THEME,k)}catch(e){console.warn(e)}}
function applyEquip(av,eq){}

