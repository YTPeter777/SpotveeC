
// ================= photo booth: walk in, pose, 4-shot strip =================
const BTH={slot:0,busy:false,frame:0,pose:'heart',fov:0,shots:[]};
const BFRAMES=[['粉紅','#ff8cc4','#ffd1e8'],['星空','#5a3fd0','#a98bff'],['金色','#c9a35a','#fff1c4']],BPOSES=[['heart','💖'],['wave','👋'],['cheer','🙌'],['laugh','😆']];
function enterBooth(){if(me.mode!=='walk')return;const taken=new Set();for(const p of peers.values()){if(!p.av)continue;const x=p.av.position.x,z=p.av.position.z;if(Math.abs(x-BOOTH.x)<.9&&Math.abs(z-BOOTH.z)<.9){let bi=0,bd=9;BOOTH.slots.forEach((s,i)=>{const d=Math.abs(x-(BOOTH.x+s));if(d<bd){bd=d;bi=i}});taken.add(bi)}}
 const slot=[1,0,2].find(i=>!taken.has(i));if(slot==null){notify({tone:'warn',icon:'camera',text:'拍貼機裡已經擠滿了，等一下再來',ms:3000});return}
 BTH.slot=slot;me.mode='booth';me.booth=true;me.pose='sit';me.x=BOOTH.x+BOOTH.slots[slot];me.z=BOOTH.z-.74;me.y=.43;me.vy=0;myAv.rotation.y=0;BTH.fov=camera.fov;camera.fov=56;camera.updateProjectionMatrix();
 document.body.classList.add('busy');$('booth').hidden=false;$('b-res').hidden=true;renderBoothUI();sendPresence(true);sfx('pop')}
function leaveBooth(){if(me.mode!=='booth')return;me.mode='walk';me.booth=false;me.pose='';me.x=BOOTH.x+1.7;me.z=BOOTH.z;me.y=0;myAv.rotation.y=Math.PI/2;camera.fov=BTH.fov||camera.fov;camera.updateProjectionMatrix();
 document.body.classList.remove('busy');$('booth').hidden=true;$('b-res').hidden=true;sendPresence(true);setTimeout(flushInvites,600)}
function boothCam(){camera.position.set(BOOTH.x-.06,1.3,BOOTH.z+.9);camera.lookAt(BOOTH.x-.06,1.02,BOOTH.z-.74)}
function renderBoothUI(){const f=$('b-frames');f.replaceChildren();BFRAMES.forEach(([n,a,b],i)=>{const e=document.createElement('button');e.className='thm';e.style.background=`linear-gradient(135deg,${a},${b})`;e.title=n;e.setAttribute('aria-label','相框 '+n);e.setAttribute('aria-pressed',i===BTH.frame);e.onclick=()=>{BTH.frame=i;renderBoothUI()};f.append(e)});
 const p=$('b-poses');p.replaceChildren();BPOSES.forEach(([k,ic])=>{const e=document.createElement('button');e.className='bpose';e.textContent=ic;e.setAttribute('aria-pressed',k===BTH.pose);e.onclick=()=>{BTH.pose=k;doEmote(k);renderBoothUI()};p.append(e)})}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function boothShoot(){if(BTH.busy)return;BTH.busy=true;$('b-go').disabled=true;BTH.shots=[];const poses=[BTH.pose,...BPOSES.map(p=>p[0]).filter(k=>k!==BTH.pose)];
 for(let k=0;k<4;k++){for(const n of [3,2,1]){$('b-count').textContent=n;$('b-count').hidden=false;$('b-count').classList.remove('pop');void $('b-count').offsetWidth;$('b-count').classList.add('pop');sfx('beep');await wait(650)}
  $('b-count').hidden=true;me.emote=poses[k%poses.length];me.et=clock.elapsedTime-.55;emoteSeq++;sendMove(true);await wait(120);
  boothCam();animAvatar(myAv,clock.elapsedTime,0,0,me.emote,me.et,false,false,'sit');renderer.render(scene,camera);const c=cv(480,360),g=c.getContext('2d'),src=renderer.domElement,sw=src.width,sh=src.height,cw=Math.min(sw,sh*4/3),ch=cw*3/4;g.drawImage(src,(sw-cw)/2,(sh-ch)/2,cw,ch,0,0,480,360);BTH.shots.push(c);
  $('b-flash').classList.remove('on');void $('b-flash').offsetWidth;$('b-flash').classList.add('on');sfx('flash');await wait(700)}
 const strip=composeStrip();$('b-img').src=strip;$('b-dl').href=strip;$('b-res').hidden=false;BTH.busy=false;$('b-go').disabled=false;NET.emit('ann',{t:'在拍貼機拍了一組照片'})}
function composeStrip(){const[ , a,b]=BFRAMES[BTH.frame],W=420,PH=300,pad=22,H=pad+4*(PH+14)+150;const c=cv(W,H),g=c.getContext('2d');const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,0,W,H);
 for(let i=0;i<30;i++){g.fillStyle='rgba(255,255,255,.25)';star(g,Math.random()*W,Math.random()*H,4+Math.random()*8,4)}
 BTH.shots.forEach((s,i)=>{const y=pad+i*(PH+14);g.fillStyle='#fff';g.fillRect(pad-4,y-4,W-2*pad+8,PH+8);g.drawImage(s,pad,y,W-2*pad,PH)});
 const fy=pad+4*(PH+14)+20;drawWordmark(g,W/2,fy+30,46,{blur:.15,flat:BTH.frame===2?'#5a3d0a':'#ffffff',glow:false});g.fillStyle=BTH.frame===2?'#5a3d0a':'#ffffff';g.font='700 18px "Noto Sans TC",sans-serif';g.textAlign='center';g.textBaseline='middle';
 const names=[myName,...[...peers.values()].filter(p=>p.av&&Math.abs(p.av.position.x-BOOTH.x)<.9&&Math.abs(p.av.position.z-BOOTH.z)<.9).map(p=>p.name)].join('・');g.fillText(names.slice(0,30),W/2,fy+78);g.font='700 15px "Unbounded",sans-serif';g.fillText(new Date().toLocaleDateString('zh-TW')+' · '+(ROOM.name||'AVÉRA'),W/2,fy+106);
 try{return c.toDataURL('image/png')}catch(e){return''}}
$('b-go').onclick=()=>boothShoot();$('b-x').onclick=()=>leaveBooth();$('b-again').onclick=()=>{$('b-res').hidden=true};$('b-done').onclick=()=>leaveBooth();
