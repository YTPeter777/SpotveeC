
// ================= TV: watch together, round-robin song requests, synced screens =================
// The room's TV host (smallest id in the room) owns the queue and broadcasts it; everyone else sends requests.
const YT_OK=!IN_CLAUDE;
const YTS={v:'',title:'',by:'',bid:'',t:0,p:false,at:0,d:0};const TVQ=[];let tvRev=0,ytPlayer=null,ytReady=false,ytOpen=false,tvVotes=new Set();
const ytNow=()=>YTS.p?YTS.t+(performance.now()-YTS.at)/1000:YTS.t;
function parseYT(s){s=String(s).trim();const m=s.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/);if(m)return m[1];return/^[A-Za-z0-9_-]{11}$/.test(s)?s:null}
const tvHost=()=>[MYID,...peers.keys()].sort()[0]===MYID;
function tvState(){return{now:{v:YTS.v,title:YTS.title,by:YTS.by,bid:YTS.bid,t:+ytNow().toFixed(1),p:YTS.p?1:0,d:YTS.d},q:TVQ.slice(0,30),rev:++tvRev}}
function tvBroadcast(){NET.emit('yt',tvState());tvRender()}
// fair order: each person's k-th waiting request plays in round k
function tvSort(){const cnt={};if(YTS.bid)cnt[YTS.bid]=1;const withR=TVQ.map((it,i)=>{const r=(cnt[it.bid]=(cnt[it.bid]||0)+1);return{it,r,i}});withR.sort((a,b)=>a.r-b.r||a.it.ts-b.it.ts);TVQ.splice(0,TVQ.length,...withR.map(x=>x.it))}
function tvNext(){const n=TVQ.shift();tvVotes.clear();if(n)Object.assign(YTS,{v:n.v,title:n.title,by:n.by,bid:n.bid,t:0,p:true,at:performance.now(),d:0});else Object.assign(YTS,{v:'',title:'',by:'',bid:'',t:0,p:false,at:performance.now(),d:0});tvBroadcast();applyYT()}
function hostHandle(d,from,name){if(!tvHost())return;const staff=from===MYID?isStaff():!!peers.get(from)?.rk,owner=from===MYID?ROOM.isOwner:fromOwner(from);
 if(d.t==='add'){const v=parseYT(d.v||'');if(!v)return;if(ACC.config.tv_lock&&!staff)return;const mine=TVQ.filter(x=>x.bid===from).length;if(mine>=3&&!staff)return;TVQ.push({id:Math.random().toString(36).slice(2,8),v,title:String(d.title||'').slice(0,90),by:String(name||'玩家').slice(0,12),bid:from,ts:Date.now()});tvSort();if(!YTS.v)tvNext();else tvBroadcast()}
 else if(d.t==='skip'){if(from===YTS.bid||owner||staff)tvNext()}
 else if(d.t==='vote'){tvVotes.add(from);if(tvVotes.size>=Math.ceil((peers.size+1)/2))tvNext();else tvBroadcast()}
 else if(d.t==='ended'&&d.v===YTS.v){tvNext()}
 else if(d.t==='dur'&&d.v===YTS.v&&Number.isFinite(d.d)){YTS.d=Math.min(36000,d.d)}
 else if(d.t==='pp'&&(from===YTS.bid||owner||staff)&&YTS.v){YTS.t=ytNow();YTS.at=performance.now();YTS.p=!YTS.p;tvBroadcast();applyYT()}
 else if(d.t==='rm'){const i=TVQ.findIndex(x=>x.id===d.id&&(x.bid===from||owner||staff));if(i>=0){TVQ.splice(i,1);tvBroadcast()}}
 else if(d.t==='clear'&&staff){TVQ.length=0;tvBroadcast()}
 else if(d.t==='sync')tvBroadcast()}
function tvSend(d){if(tvHost())hostHandle(d,MYID,myName);else NET.emit('ytq',d)}
onNet('ytq',(d,from)=>hostHandle(d,from,peers.get(from)?.name));
onNet('yt',(d,from)=>{if(!d.now)return;const n=d.now,v=n.v?parseYT(n.v):'';const changed=v!==YTS.v;Object.assign(YTS,{v:v||'',title:String(n.title||'').slice(0,90),by:String(n.by||'').slice(0,12),bid:String(n.bid||''),t:Math.max(0,+n.t||0)+.15,p:n.p===1,at:performance.now(),d:+n.d||0});
 TVQ.splice(0,TVQ.length,...(Array.isArray(d.q)?d.q:[]).filter(x=>x&&parseYT(x.v)).slice(0,30).map(x=>({id:String(x.id).slice(0,8),v:parseYT(x.v),title:String(x.title||'').slice(0,90),by:String(x.by||'').slice(0,12),bid:String(x.bid||''),ts:+x.ts||0})));
 if(changed&&v)notify({key:'tvnow',tone:'info',icon:'tv',text:`${YTS.by||'有人'} 點的影片開始播放了`,ms:3500,quiet:true});applyYT();tvRender()});
function onAdminTV(op){if(!tvHost())return;if(op==='skip')tvNext();else if(op==='clear'){TVQ.length=0;tvBroadcast()}}
setInterval(()=>{if(!NET.ok||!tvHost()||!YTS.v)return;if(YTS.d&&YTS.p&&ytNow()>YTS.d+3)tvNext()},2000);
// ---- player ----
let ytApiP=null;function loadYTApi(){if(window.YT&&window.YT.Player)return Promise.resolve();if(ytApiP)return ytApiP;
 ytApiP=new Promise((res,rej)=>{const prev=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{prev?.();res()};const sc=document.createElement('script');sc.src='https://www.youtube.com/iframe_api';sc.onerror=()=>{ytApiP=null;rej()};document.head.append(sc);setTimeout(()=>rej(),15000)});return ytApiP}
async function openTV(){togglePop('people',false);togglePop('menu',false);togglePop('roompnl',false);$('tv').hidden=false;$('tv').classList.remove('mini');ytOpen=true;$('b-tv').setAttribute('aria-expanded','true');tvRender();if(NET.ok&&!tvHost())NET.emit('ytq',{t:'sync'});
 if(!YT_OK){$('tvempty').textContent='預覽頁不能嵌入 YouTube 播放器；在正式網站上就能一起看。點歌清單照常運作。';return}
 if(!ytPlayer){try{await loadYTApi()}catch(e){$('tvempty').textContent='YouTube 播放器載入失敗，請檢查網路後重開';return}
  ytPlayer=new window.YT.Player('ytp',{width:'100%',height:'100%',playerVars:{playsinline:1,rel:0,modestbranding:1},events:{onReady:()=>{ytReady=true;applyYT()},onStateChange:onYTState}})}else applyYT()}
function closeTV(){$('tv').hidden=true;ytOpen=false;$('b-tv').setAttribute('aria-expanded','false');if(ytReady)try{ytPlayer.pauseVideo()}catch(e){}}
function applyYT(){$('tvempty').hidden=!!YTS.v&&YT_OK;drawTV();if(!ytReady||!ytOpen)return;
 try{if(!YTS.v){ytPlayer.stopVideo();return}const cur=ytPlayer.getVideoData?.()?.video_id;if(cur!==YTS.v){if(YTS.p)ytPlayer.loadVideoById({videoId:YTS.v,startSeconds:ytNow()});else ytPlayer.cueVideoById({videoId:YTS.v,startSeconds:ytNow()});return}
  if(Math.abs(ytPlayer.getCurrentTime()-ytNow())>2)ytPlayer.seekTo(ytNow(),true);const s=ytPlayer.getPlayerState();if(YTS.p&&s!==1&&s!==3)ytPlayer.playVideo();if(!YTS.p&&s===1)ytPlayer.pauseVideo()}catch(e){}}
function onYTState(e){try{const d=ytPlayer.getVideoData();if(d&&d.video_id===YTS.v){if(d.title&&!YTS.title){YTS.title=d.title.slice(0,90);drawTV();tvRender()}const dur=ytPlayer.getDuration();if(dur>0&&!YTS.d){YTS.d=dur;tvSend({t:'dur',v:YTS.v,d:dur})}}if(e.data===0&&YTS.v)tvSend({t:'ended',v:YTS.v})}catch(x){}}
// ---- panel ----
function tvRender(){if($('tv').hidden)return;const can=YTS.bid===MYID||ROOM.isOwner||isStaff();
 $('tvnow').replaceChildren();if(YTS.v){const b=document.createElement('b');b.textContent=(YTS.p?'▶ ':'⏸ ')+(YTS.title||'youtu.be/'+YTS.v);const s=document.createElement('small');s.textContent=`${YTS.by} 點播`+(tvVotes.size?` · ${tvVotes.size} 人想跳過`:'');$('tvnow').append(b,s)}else $('tvnow').textContent='目前沒有影片，第一個點歌的人馬上播放';
 $('tv-play').disabled=!YTS.v||!can;$('tv-skip').disabled=!YTS.v;$('tv-skip').querySelector('span').textContent=can?'跳過':'投票跳過';
 const l=$('tvql');l.replaceChildren();if(!TVQ.length){const e=document.createElement('div');e.className='empty';e.textContent='待播清單是空的。大家輪流點，每人最多排 3 首。';l.append(e)}
 TVQ.forEach((it,i)=>{const r=document.createElement('div');r.className='tvi';const n=document.createElement('span');n.className='n';n.textContent=i+1;const t=document.createElement('div');t.className='tt';const b=document.createElement('b');b.textContent=it.title||'youtu.be/'+it.v;const s=document.createElement('small');s.textContent=it.by+' 點播';t.append(b,s);r.append(n,t);
  if(it.bid===MYID||ROOM.isOwner||isStaff()){const x=document.createElement('button');x.className='ib';x.setAttribute('aria-label','移除');x.innerHTML='<svg class="i sm"><use href="#i-close"/></svg>';x.onclick=()=>tvSend({t:'rm',id:it.id});r.append(x)}l.append(r)});
 $('tvlock').hidden=!ACC.config.tv_lock}
$('tvform').addEventListener('submit',e=>{e.preventDefault();const q=$('tvq').value.trim();if(!q)return;if(ACC.config.tv_lock&&!isStaff()){notify({tone:'warn',text:'管理員暫時鎖定了點歌'});return}const id=parseYT(q);
 if(id){$('tvq').value='';$('tvres').replaceChildren();addReq(id,'');return}searchYT(q)});
function addReq(id,title){const mine=TVQ.filter(x=>x.bid===MYID).length;if(mine>=3&&!isStaff()){notify({tone:'warn',text:'你已經排了 3 首，等播完再點'});return}tvSend({t:'add',v:id,title});notify({tone:'ok',icon:'tv',text:YTS.v?'已加入待播清單，輪到你時就會播放':'開始播放！',ms:2500,quiet:true});setTimeout(tvRender,300)}
async function searchYT(q){const box=$('tvres');box.replaceChildren();
 if(!YT_API_KEY){const a=document.createElement('a');a.href='https://www.youtube.com/results?search_query='+encodeURIComponent(q);a.target='_blank';a.rel='noopener';a.className='cb ghost wide';a.textContent=`到 YouTube 搜尋「${q}」↗`;const s=document.createElement('div');s.className='st';s.textContent='找到影片後複製網址，貼回上面的框框就能點播。';box.append(a,s);return}
 box.textContent='搜尋中…';try{const r=await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(q)}&key=${YT_API_KEY}`);const j=await r.json();box.replaceChildren();
  for(const it of j.items||[]){const id=it.id?.videoId;if(!id)continue;const b=document.createElement('button');b.className='res';const img=document.createElement('img');img.src=it.snippet.thumbnails?.default?.url||'';img.alt='';const tx=document.createElement('span');const ti=it.snippet.title.replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&');tx.textContent=ti;b.append(img,tx);b.onclick=()=>{box.replaceChildren();$('tvq').value='';addReq(id,ti.slice(0,90))};box.append(b)}
  if(!box.children.length)box.textContent='沒有找到影片'}catch(e){box.textContent='搜尋失敗，請直接貼上影片連結'}}
$('tv-play').onclick=()=>tvSend({t:'pp'});$('tv-skip').onclick=()=>{const can=YTS.bid===MYID||ROOM.isOwner||isStaff();tvSend({t:can?'skip':'vote'});if(!can)notify({tone:'info',text:'已投票跳過，超過一半的人同意就會換下一首',ms:3000,quiet:true})};
$('tv-sync').onclick=()=>{applyYT();notify({tone:'ok',text:'已對齊大家的播放進度',ms:2000,quiet:true})};
$('tv-min').onclick=()=>$('tv').classList.toggle('mini');$('tv-x').onclick=closeTV;$('b-tv').onclick=()=>$('tv').hidden?openTV():closeTV();
// ---- 3D screens: the lounge TV, a queue screen beside it, and repeater TVs around the hall ----
let tvThumb=null,tvThumbId='';const tvQC=cv(512,576),tvQTex=tex(tvQC);
{const add=(w,x,y,z,ry,map)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*(map===tvQTex?576/512:9/16)),new THREE.MeshBasicMaterial({map,toneMapped:false}));m.position.set(x,y,z);m.rotation.y=ry;scene.add(m);
  const fr=new THREE.Mesh(RB(w+.1,w*(map===tvQTex?576/512:9/16)+.1,.04,.02),std('#0b0a14',.3,.5));fr.position.set(x-Math.sin(ry)*.03,y,z-Math.cos(ry)*.03);fr.rotation.y=ry;scene.add(fr)};
 add(1.7,W.x0+.07,3.05,15.15,Math.PI/2,tvQTex);add(2.3,W.x0+.07,F2+2.2,15.6,Math.PI/2,tvTex);add(2.3,-13,4.7,W.z0+.07,0,tvTex)}
function drawTV(){const g=tvC.getContext('2d'),w=1024,h=576;const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#1d1450');gr.addColorStop(1,'#3a1d5c');g.fillStyle=gr;g.fillRect(0,0,w,h);
 if(YTS.v&&tvThumbId!==YTS.v){tvThumbId=YTS.v;tvThumb=null;const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{if(tvThumbId===YTS.v){tvThumb=im;drawTV()}};im.src=`https://i.ytimg.com/vi/${YTS.v}/hqdefault.jpg`}
 g.textAlign='center';g.textBaseline='middle';
 if(YTS.v){if(tvThumb)try{g.drawImage(tvThumb,0,-72,w,w*.75);g.fillStyle='rgba(10,6,30,.5)';g.fillRect(0,0,w,h)}catch(e){}
  g.fillStyle='#ff6fb1';g.font='800 40px "Unbounded","Baloo 2",sans-serif';g.fillText(YTS.p?'▶ NOW PLAYING':'❚❚ PAUSED',w/2,190);g.fillStyle='#fff';g.font='800 46px "Noto Sans TC",sans-serif';const t=YTS.title||('youtu.be/'+YTS.v);g.fillText(t.length>22?t.slice(0,21)+'…':t,w/2,270);
  g.fillStyle='#d8d0ff';g.font='600 30px "Noto Sans TC",sans-serif';g.fillText(`${YTS.by} 點播 · 到放映室一起看`,w/2,340);if(YTS.d){const k=Math.min(1,ytNow()/YTS.d);g.fillStyle='rgba(255,255,255,.2)';g.fillRect(212,400,600,8);g.fillStyle='#ff6fb1';g.fillRect(212,400,600*k,8)}}
 else{drawWordmark(g,w/2,220,110,{blur:.2});g.fillStyle='#fff';g.font='800 44px "Noto Sans TC",sans-serif';g.fillText('AVÉRA 放映室 · 一起點歌',w/2,340);g.fillStyle='#d8d0ff';g.font='600 30px "Noto Sans TC",sans-serif';g.fillText('到放映室打開點歌平板，搜尋或貼上連結',w/2,400)}
 tvTex.needsUpdate=true;drawTVQueue()}
function drawTVQueue(){const g=tvQC.getContext('2d'),w=512,h=576;g.fillStyle='#120d2e';g.fillRect(0,0,w,h);g.fillStyle='#ffd27a';g.font='800 34px "Noto Sans TC",sans-serif';g.textAlign='left';g.textBaseline='middle';g.fillText('待播清單',30,46);g.fillStyle='#a39bd2';g.font='700 18px "Unbounded",sans-serif';g.textAlign='right';g.fillText('UP NEXT',w-30,48);
 g.fillStyle='rgba(255,255,255,.08)';g.fillRect(30,80,w-60,2);g.textAlign='left';if(!TVQ.length){g.fillStyle='#d8d0ff';g.font='600 26px "Noto Sans TC",sans-serif';g.fillText('還沒有人點歌',30,140);g.fillText('輪流點播，每人最多 3 首',30,184)}
 TVQ.slice(0,6).forEach((it,i)=>{const y=120+i*74;g.fillStyle=i===0?'#ff6fb1':'#3a2b70';g.beginPath();g.roundRect(30,y-24,48,48,12);g.fill();g.fillStyle='#fff';g.font='800 26px "Unbounded",sans-serif';g.textAlign='center';g.fillText(i+1,54,y+1);g.textAlign='left';
  const t=it.title||'youtu.be/'+it.v;g.font='800 24px "Noto Sans TC",sans-serif';g.fillStyle='#fff';g.fillText(t.length>14?t.slice(0,13)+'…':t,96,y-9);g.font='600 18px "Noto Sans TC",sans-serif';g.fillStyle='#a39bd2';g.fillText(it.by+' 點播',96,y+17)});
 if(TVQ.length>6){g.fillStyle='#a39bd2';g.font='700 20px "Noto Sans TC",sans-serif';g.fillText(`還有 ${TVQ.length-6} 首…`,30,h-30)}tvQTex.needsUpdate=true}
setInterval(()=>{if(YTS.v&&YTS.d)drawTV()},2000);
