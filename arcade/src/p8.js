
// ================= voice =================
// site/local: real WebRTC voice (mesh, Supabase signalling). claude.ai preview: speech → text (+ optional read-aloud).
const ICE=[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'}];
const VOICE={vol:store.get('vvol',100)/100,pv:store.get('pvol',{}),joined:false,stream:null,track:null,micOn:false,ctx:null,an:null,buf:null,pcs:new Map(),spatial:store.get('spatial',true),needTap:false,talkUntil:0,dict:null,tts:null,ttsOn:false};
const RTC_OK=!IN_CLAUDE&&!!window.RTCPeerConnection;
function updVoiceUI(){const b=$('a-mic');b.classList.toggle('on',VOICE.micOn);b.classList.toggle('muted',VOICE.joined&&!VOICE.micOn);b.setAttribute('aria-pressed',VOICE.micOn);$('mic-i').firstElementChild.setAttribute('href',VOICE.joined&&!VOICE.micOn?'#i-micoff':'#i-mic');
 b.title=!VOICE.joined?(IN_CLAUDE?'語音輸入（V）':'加入語音並開麥克風（V）'):VOICE.micOn?'麥克風開著（V 關閉）':'麥克風關著（V 打開）';
 $('b-leavevc').hidden=!RTC_OK;$('b-leavevc').querySelector('span').textContent=VOICE.joined?'離開語音':'只收聽語音（不開麥）';$('r-sp').hidden=!RTC_OK;$('t-sp').setAttribute('aria-pressed',VOICE.spatial);$('r-tts').hidden=!IN_CLAUDE;$('t-tts').setAttribute('aria-pressed',VOICE.ttsOn)}
async function joinVoice(){if(VOICE.joined)return true;if(!RTC_OK){feed('sys','','這個瀏覽器不支援語音通話');return false}
 try{VOICE.ctx=new(window.AudioContext||window.webkitAudioContext)();VOICE.ctx.resume().catch(()=>{})}catch(e){}
 VOICE.joined=true;updVoiceUI();pushInfo(true);for(const[id,p]of peers)if(p.vc)maybeConnect(id);feed('sys','','🎧 已加入語音，聽得到其他加入語音的人');return true}
function leaveVoice(){for(const id of [...VOICE.pcs.keys()])closePc(id);if(VOICE.stream)VOICE.stream.getTracks().forEach(t=>t.stop());Object.assign(VOICE,{joined:false,stream:null,track:null,micOn:false,an:null});me.talk=false;updVoiceUI();pushInfo(true);feed('sys','','已離開語音')}
async function toggleMic(){if(!VOICE.micOn&&ACC.mutedUntil>Date.now()){notify({key:'muted',tone:'warn',icon:'volx',text:'你目前被禁言，暫時不能開麥克風'});return}if(IN_CLAUDE)return toggleDictation();if(!VOICE.joined&&!(await joinVoice()))return;
 if(!VOICE.track){if(!navigator.mediaDevices?.getUserMedia){feed('sys','','這個瀏覽器不能使用麥克風');return}
  try{VOICE.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}catch(e){feed('sys','','沒有拿到麥克風權限，請在網址列旁邊允許麥克風');updVoiceUI();return}
  VOICE.track=VOICE.stream.getAudioTracks()[0];VOICE.track.enabled=false;
  if(VOICE.ctx){try{const s=VOICE.ctx.createMediaStreamSource(VOICE.stream);VOICE.an=VOICE.ctx.createAnalyser();VOICE.an.fftSize=512;VOICE.buf=new Uint8Array(VOICE.an.fftSize);s.connect(VOICE.an)}catch(e){}}
  for(const v of VOICE.pcs.values())v.sender?.replaceTrack(VOICE.track).catch(()=>{})}
 VOICE.micOn=!VOICE.micOn;VOICE.track.enabled=VOICE.micOn;updVoiceUI();sfx('click');if(!VOICE.micOn&&me.talk){me.talk=false;sendMove(true)}}
function waitIce(pc){return new Promise(res=>{if(pc.iceGatheringState==='complete')return res();const f=()=>{if(pc.iceGatheringState==='complete'){pc.removeEventListener('icegatheringstatechange',f);res()}};pc.addEventListener('icegatheringstatechange',f);setTimeout(res,2500)})}
function newPc(id){closePc(id);const pc=new RTCPeerConnection({iceServers:ICE});const v={pc,sender:null,audio:null,an:null,buf:null,prev:null};VOICE.pcs.set(id,v);
 pc.ontrack=e=>{const st=e.streams[0]||new MediaStream([e.track]);if(!v.audio){v.audio=document.createElement('audio');v.audio.autoplay=true;v.audio.setAttribute('playsinline','');v.audio.hidden=true;document.body.append(v.audio)}v.audio.srcObject=st;v.audio.play().catch(()=>needTap());
  if(VOICE.ctx){try{const s=VOICE.ctx.createMediaStreamSource(st);v.an=VOICE.ctx.createAnalyser();v.an.fftSize=512;v.buf=new Uint8Array(v.an.fftSize);s.connect(v.an)}catch(e){}}};
 pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'){closePc(id);if(MYID<id&&VOICE.joined&&peers.get(id)?.vc)setTimeout(()=>maybeConnect(id),3000)}};return v}
function closePc(id){const v=VOICE.pcs.get(id);if(!v)return;try{v.pc.close()}catch(e){}if(v.audio){v.audio.srcObject=null;v.audio.remove()}VOICE.pcs.delete(id);const p=peers.get(id);if(p){p.rtt=null;p.vlat=null}}
async function maybeConnect(id){if(!RTC_OK||!VOICE.joined||!NET.ok||VOICE.pcs.has(id)||!peers.get(id)?.vc||!(MYID<id))return;
 const v=newPc(id);const tr=v.pc.addTransceiver('audio',{direction:'sendrecv'});v.sender=tr.sender;if(VOICE.track)await v.sender.replaceTrack(VOICE.track).catch(()=>{});
 try{await v.pc.setLocalDescription(await v.pc.createOffer());await waitIce(v.pc);if(VOICE.pcs.get(id)!==v)return;NET.emit('rtc',{to:id,ty:'offer',sdp:v.pc.localDescription.sdp})}catch(e){closePc(id)}}
onNet('rtc',async(d,from)=>{if(d.to!==MYID||typeof d.sdp!=='string'||d.sdp.length>20000)return;
 if(d.ty==='dco'&&typeof d.mid==='string'){if(DC_LINKS.has(d.mid))answerDC(d.mid,from,d.sdp);else DC_PENDING.set(d.mid,{from,sdp:d.sdp});return}
 if(d.ty==='dca'&&typeof d.mid==='string'){const lk=DC_LINKS.get(d.mid);if(lk&&lk.pc.signalingState==='have-local-offer')lk.pc.setRemoteDescription({type:'answer',sdp:d.sdp}).catch(()=>{});return}
 if(!RTC_OK)return;
 if(d.ty==='offer'){if(!VOICE.joined)return;const v=newPc(from);try{await v.pc.setRemoteDescription({type:'offer',sdp:d.sdp});const tr=v.pc.getTransceivers()[0];if(tr){tr.direction='sendrecv';v.sender=tr.sender;if(VOICE.track)await tr.sender.replaceTrack(VOICE.track).catch(()=>{})}
  await v.pc.setLocalDescription(await v.pc.createAnswer());await waitIce(v.pc);if(VOICE.pcs.get(from)!==v)return;NET.emit('rtc',{to:from,ty:'answer',sdp:v.pc.localDescription.sdp})}catch(e){closePc(from)}}
 else if(d.ty==='answer'){const v=VOICE.pcs.get(from);if(v&&v.pc.signalingState==='have-local-offer')v.pc.setRemoteDescription({type:'answer',sdp:d.sdp}).catch(()=>closePc(from))}});
function needTap(){if(VOICE.needTap)return;VOICE.needTap=true;toast('點一下畫面就能聽到大家的聲音',[],6000);const f=()=>{VOICE.needTap=false;VOICE.ctx?.resume().catch(()=>{});for(const v of VOICE.pcs.values())v.audio?.play().catch(()=>{});removeEventListener('pointerdown',f,true)};addEventListener('pointerdown',f,true)}
function level(an,buf){an.getByteTimeDomainData(buf);let s=0;for(let i=0;i<buf.length;i+=2){const x=(buf[i]-128)/128;s+=x*x}return Math.sqrt(s/(buf.length/2))}
let talkHintShown=false;
function voiceTick(t,frameN){
 if(RTC_OK){let lv=0;if(VOICE.an&&VOICE.micOn){lv=level(VOICE.an,VOICE.buf);if(lv>.03)VOICE.talkUntil=t+.35}const talk=VOICE.micOn&&VOICE.talkUntil>t;micWave(Math.min(1,lv*7),talk);if(talk!==me.talk){me.talk=talk;sendMove(true)}}
 else micWave(VOICE.micOn?.35+Math.random()*.6:0,me.talk);
 for(const[id,v]of VOICE.pcs){const p=peers.get(id);if(!p)continue;if(v.an&&level(v.an,v.buf)>.03)p.talkLocal=t+.35;
  if(frameN%10===0&&v.audio){let vol=1;if(VOICE.spatial&&p.av){const d=p.av.position.distanceTo(myAv.position);vol=THREE.MathUtils.clamp(1-(d-5)/24,.12,1)*(Math.abs(p.av.position.y-me.y)>3?.55:1)}v.audio.volume=Math.max(0,Math.min(1,vol*VOICE.vol*peerVol(p)))}}
 if(!talkHintShown&&RTC_OK&&!VOICE.joined&&frameN%30===0){for(const p of peers.values())if(p.talkNet&&p.av&&p.av.position.distanceTo(myAv.position)<12){talkHintShown=true;toast(`${p.name} 正在用語音說話`,[{t:'先不要'},{t:'🎧 加入語音',pri:true,fn:()=>joinVoice()}],12000);break}}}
setInterval(async()=>{if(!VOICE.joined)return;const lat=[];for(const[id,v]of VOICE.pcs){try{const st=await v.pc.getStats();let rtt=null,jbD=0,jbN=0;
  st.forEach(r=>{if(r.type==='candidate-pair'&&r.state==='succeeded'&&(r.nominated||r.selected)&&r.currentRoundTripTime!=null)rtt=r.currentRoundTripTime*1000;if(r.type==='inbound-rtp'&&r.kind==='audio'){jbD=r.jitterBufferDelay||0;jbN=r.jitterBufferEmittedCount||0}});
  let jb=null;if(v.prev&&jbN>v.prev.n)jb=(jbD-v.prev.d)/(jbN-v.prev.n)*1000;else if(jbN>0)jb=jbD/jbN*1000;v.prev={d:jbD,n:jbN};
  const p=peers.get(id);if(p&&rtt!=null){p.rtt=Math.round(rtt);p.vlat=Math.round(rtt/2+(jb??40)+20);lat.push(p.vlat)}}catch(e){}}net.voice=lat.length?Math.round(lat.reduce((a,b)=>a+b,0)/lat.length):null},2000);
$('b-leavevc').onclick=()=>{togglePop('menu',false);VOICE.joined?leaveVoice():joinVoice()};
$('t-sp').onclick=()=>{VOICE.spatial=!VOICE.spatial;store.set('spatial',VOICE.spatial);updVoiceUI()};
const pvKey=p=>p.pid||('n:'+p.name);function peerVol(p){const v=VOICE.pv[pvKey(p)];return v==null?1:v}
$('t-tts').onclick=async()=>{if(!VOICE.tts&&IN_CLAUDE)VOICE.tts=await window.claude.use('tts').catch(()=>null);if(!VOICE.tts){toast('這個瀏覽器不支援朗讀',[],3000);return}VOICE.ttsOn=!VOICE.ttsOn;updVoiceUI();if(VOICE.ttsOn)VOICE.tts.speak('朗讀已開啟').catch(()=>{})};
// claude.ai preview: dictation → chat line
let dictReady=null;async function toggleDictation(){if(!dictReady)dictReady=window.claude.use('dictation').catch(()=>null);const d=VOICE.dict||await dictReady;
 if(!d){toast('這個瀏覽器不支援語音輸入，請用打字聊天',[],3500);return}
 if(!VOICE.dict){VOICE.dict=d;let lastP=0;d.onState(({state,reason})=>{const on=state==='listening'||state==='starting';VOICE.micOn=on;me.talk=state==='listening';updVoiceUI();sendMove(true);if(state==='idle'&&reason==='not_granted')toast('麥克風沒有開啟，可以從頁面的權限選單允許',[],4000)});
  d.onPartial(({text})=>{lastP=performance.now();if(text)myBubble={text:'🎙 '+text,t:clock.elapsedTime}});
  d.onFinal(({text})=>{text=String(text||'').trim();if(!text)return;net.voice=Math.round(Math.min(3000,performance.now()-lastP)+(net.self||0)/2);feed('',myName+' 🎙',text,OUTFIT[look.cl],look);myBubble={text:'🎙 '+text,t:clock.elapsedTime};NET.emit('chat',{t:'🎙 '+text,v:1})})}
 if(d.active())d.stop().catch(()=>{});else d.start().catch(e=>{if(e?.code==='not_granted')toast('需要允許麥克風才能說話',[],3000)})}
onNet('chat',(d,id)=>{const p=peers.get(id);const t=String(d.t||'').slice(0,90);if(!t)return;feed('',p?.name||'玩家',t,p?.color,p?.look);if(p)p.bubble={text:t,t:clock.elapsedTime};if(d.v===1&&VOICE.ttsOn&&VOICE.tts)(VOICE.tts.add?VOICE.tts.add([{text:t.replace('🎙 ','')}]):VOICE.tts.speak(t)).catch(()=>{})});
updVoiceUI();

