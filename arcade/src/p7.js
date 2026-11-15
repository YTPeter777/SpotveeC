
// ================= networking: claude room | supabase realtime | ?local =================
const MYID=(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36)).replace(/-/g,'').slice(0,12);
const peers=new Map();const net={self:null,voice:null};
const NET={ok:false,mode:'',emit(){},track(){},handlers:{},room:null,lobby:null,sb:null,ch:null,chan:'',gen:0,waiting:false,jt:0,queue:[],clean:[]};
function onNet(ev,fn){NET.handlers[ev]=fn}
function netEvent(ev,data,from){const f=NET.handlers[ev];if(f&&data&&typeof data==='object'&&typeof from==='string'&&from!==MYID)try{f(data,from)}catch(e){console.warn(e)}}
// each room (包廂) is its own channel; `waiting` = in the room's queue, not yet in the world
async function connectNet(chan,waiting){disconnectNet();const gen=++NET.gen;NET.chan=chan;NET.waiting=!!waiting;NET.jt=Date.now();
 if(BK.mode==='doc'&&!IN_CLAUDE){if('BroadcastChannel' in window)connectLocal(chan);return}
 if(IN_CLAUDE){const lobby=await getLobby();if(gen!==NET.gen)return;if(!lobby){notify({tone:'warn',text:'目前是單人模式（預覽頁沒有開啟多人連線）'});return}
  let r=null;try{r=await lobby.join('r-'+chan.toLowerCase().replace(/[^a-z0-9_.-]/g,'').slice(0,40))}catch(e){}if(gen!==NET.gen){r?.leave().catch(()=>{});return}
  if(!r){notify({tone:'warn',text:'連不上這個包廂的多人連線，先以單人模式遊玩'});return}return connectClaude(r)}
 let sb;try{sb=await getSB()}catch(e){notify({tone:'err',text:'連線元件載入失敗，先以單人模式遊玩'});return}if(gen!==NET.gen)return;NET.sb=sb;
 const ch=sb.channel('av-'+chan,{config:{broadcast:{self:false,ack:false},presence:{key:MYID}}});NET.ch=ch;
 ch.on('presence',{event:'sync'},()=>{if(gen!==NET.gen)return;const st=ch.presenceState(),list=[];for(const id in st){const m=st[id],meta=m&&m[m.length-1];if(id!==MYID&&meta)list.push([id,meta])}syncPeers(list)});
 ch.on('presence',{event:'join'},({key})=>{if(key!==MYID&&!NET.waiting)setTimeout(()=>{sendMove(true,true);requeryLanes()},150+Math.random()*500)});
 for(const ev of ['mv','chat','ann','rtc','yt','ytq','ln','mt','pty','rm','adm','sq','pb'])ch.on('broadcast',{event:ev},({payload})=>{if(gen===NET.gen)netEvent(ev,payload,payload&&payload.i)});
 NET.emit=(ev,data)=>{if(!NET.ok||gen!==NET.gen)return;if(NET.waiting&&ev!=='rm')return;data.i=MYID;ch.send({type:'broadcast',event:ev,payload:data}).catch(()=>{})};
 NET.track=o=>{if(NET.ok&&gen===NET.gen)ch.track(o).catch(()=>{})};
 let everOk=false;
 ch.subscribe(st=>{if(gen!==NET.gen)return;if(st==='SUBSCRIBED'){NET.ok=true;NET.mode='supabase';lastInfoKey='';pushInfo(true);if(!NET.waiting)sendMove(true,true);if(!everOk){everOk=true;onConnected()}else notify({key:'net',tone:'ok',text:'已重新連線',ms:2500})}
  else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'){if(NET.ok)notify({key:'net',tone:'warn',text:'連線中斷，正在重新連線…',ms:5000});else if(!everOk)notify({key:'net',tone:'warn',text:'暫時連不上多人伺服器，會自動重試',ms:6000});NET.ok=false}else if(st==='CLOSED')NET.ok=false});
 if(!NET.pc){const pc=sb.channel('av-ping-'+MYID,{config:{broadcast:{ack:true,self:false}}});NET.pc=pc;
  pc.subscribe(st=>{if(st!=='SUBSCRIBED'||pc._p)return;pc._p=1;const ping=async()=>{const t0=performance.now();try{const r=await pc.send({type:'broadcast',event:'p',payload:{}});if(r==='ok')net.self=Math.round(performance.now()-t0)}catch(e){}};ping();setInterval(ping,5000)})}}
function disconnectNet(){NET.gen++;NET.ok=false;NET.emit=()=>{};NET.track=()=>{};for(const f of NET.clean.splice(0))try{f()}catch(e){}
 if(NET.ch&&NET.sb){try{NET.sb.removeChannel(NET.ch)}catch(e){}}NET.ch=null;if(NET.room&&NET.room!==NET.lobby){NET.room.leave?.().catch(()=>{})}NET.room=null;
 for(const id of [...peers.keys()])dropPeer(id);NET.queue=[];lastInfoKey='';$('n-on').textContent='1'}
let lobbyP=null;function getLobby(){if(!lobbyP)lobbyP=window.claude.use('room').catch(()=>null).then(r=>{NET.lobby=r;return r});return lobbyP}
function onConnected(){if(NET.waiting)return;NET.emit('ytq',{t:'sync'});requeryLanes();renderPeople()}
function requeryLanes(){NET.emit('ln',{t:'q'})}
function connectLocal(chan){const gen=NET.gen;const bc=new BroadcastChannel('avera-'+chan),seen=new Map();let info=null;
 NET.emit=(ev,data)=>{if(gen!==NET.gen)return;if(NET.waiting&&ev!=='rm')return;data.i=MYID;bc.postMessage({k:'ev',ev,data})};NET.track=o=>{info=o;bc.postMessage({k:'pr',id:MYID,o})};
 const list=()=>syncPeers([...seen].map(([id,v])=>[id,v.o]));
 bc.onmessage=({data:m})=>{if(!m||gen!==NET.gen)return;if(m.k==='ev')netEvent(m.ev,m.data,m.data&&m.data.i);
  else if(m.k==='pr'){const isNew=!seen.has(m.id);seen.set(m.id,{o:m.o,t:Date.now()});if(isNew){if(info)bc.postMessage({k:'pr',id:MYID,o:info});if(!NET.waiting)setTimeout(()=>{sendMove(true,true);requeryLanes()},120)}list()}else if(m.k==='bye'){seen.delete(m.id);list()}};
 const iv=setInterval(()=>{if(info)bc.postMessage({k:'pr',id:MYID,o:info});const now=Date.now();let c=false;for(const[id,v]of seen)if(now-v.t>6500){seen.delete(id);c=true}if(c)list()},2000);
 const bye=()=>bc.postMessage({k:'bye',id:MYID});addEventListener('pagehide',bye);const iv2=setInterval(()=>{net.self=1+Math.round(Math.random()*2)},5000);net.self=1;
 NET.clean.push(()=>{bye();clearInterval(iv);clearInterval(iv2);removeEventListener('pagehide',bye);bc.close()});
 NET.ok=true;NET.mode='local';pushInfo(true);if(!NET.waiting)sendMove(true,true);onConnected()}
function connectClaude(room){const gen=NET.gen;NET.room=room;NET.mode='claude';const pings=new Map();let lastMvRaw=new Map();
 // everything is keyed by our own MYID (carried inside presence and event data) so ids match across features
 NET.emit=(ev,data)=>{if(gen!==NET.gen)return;if(NET.waiting&&ev!=='rm')return;if(ev==='mv'){room.presence({m:data}).catch(()=>{});return}room.emit(ev,{...data,i:MYID}).catch(()=>{})};
 NET.track=o=>{if(gen===NET.gen)room.presence({i:{...o,id:MYID}}).catch(()=>{})};
 room.onPeers(ch=>{if(gen!==NET.gen)return;const list=[];for(const pr of ch.peers){if(pr.sameTab||pr.kind!=='viewer')continue;const s=pr.presence||{};const id=s.i&&typeof s.i.id==='string'&&s.i.id.length<20?s.i.id:null;if(!id)continue;list.push([id,s.i]);if(s.m&&s.m!==lastMvRaw.get(id)){lastMvRaw.set(id,s.m);onMove(s.m,id)}}syncPeers(list)});
 for(const ev of ['chat','ann','ln','mt','pty','rm','yt','ytq','sq','pb'])room.on(ev,m=>{if(gen===NET.gen&&!m.sameTab&&m.data)netEvent(ev,m.data,m.data.i)},()=>{});
 room.on('ping',m=>{const id=m.data?.id;if(typeof id!=='string')return;if(m.sameTab){const t0=pings.get(id);if(t0!=null){net.self=Math.round(performance.now()-t0);pings.delete(id)}}},()=>{});
 const iv=setInterval(()=>{if(!room.connected())return;const id=Math.random().toString(36).slice(2,10);if(pings.size>20)pings.clear();pings.set(id,performance.now());room.emit('ping',{id}).catch(()=>{})},5000);NET.clean.push(()=>clearInterval(iv));
 room.onConnection(c=>{if(gen!==NET.gen)return;NET.ok=c;if(c){lastInfoKey='';pushInfo(true);if(!NET.waiting)sendMove(true,true)}});NET.ok=room.connected();pushInfo(true);if(!NET.waiting)sendMove(true,true);onConnected()}

// ---- peers ----
function getPeer(id){let p=peers.get(id);if(!p){p={id,av:null,tag:makeTag(),cur:new THREE.Vector3(),base:new THREE.Vector3(),vel:new THREE.Vector3(),tgt:new THREE.Vector3(),yaw:0,lk:'',look:null,name:'玩家',emote:'',et:-9,bubble:{text:'',t:-99},speed:0,lane:-1,talk:false,talkNet:false,talkLocal:0,ping:null,rtt:null,vlat:null,act:'walk',game:'',color:OUTFIT[0],air:false,vc:false,lastMv:0,pt:null,sx:null,pose:''};p.tag.hidden=true;peers.set(id,p)}return p}
function dropPeer(id){const p=peers.get(id);if(!p)return;if(p.av)scene.remove(p.av);p.tag.remove();closePc(id);peers.delete(id);
 for(const L of lanes){const st=L.state;if(!st||!sessionHas(st,id))continue;st.ps=st.ps.filter(q=>q[0]!==id);if(!st.ps.length){L.state=null;resetLane(L);continue}
  if(st.host===id){st.host=st.ps[0][0]}if(st.host===MYID){st.turn=Math.min(st.turn,st.ps.length-1);st.seq++;broadcastLane(L)}}
 if(MATCH&&MATCH.opp===id&&G&&!G.over){toast(`${p.name} 離開了`,[],3000);G.over=true;showLobby('result',stations.get(me.slot?.st),1)}}
function spawnPeerAvatar(p){if(p.av||!p.look||!p.lastMv)return;p.av=makeAnimal(p.look);p.hpK=null;p.eqK=null;p.cur.copy(p.base);p.av.position.copy(p.base);p.av.rotation.y=p.yaw;scene.add(p.av)}
function syncPeers(list){const ids=new Set(),q=[];for(const[id,o]of list){if(!o||typeof o!=='object'||typeof id!=='string'||id===MYID)continue;
  if(o.pid&&o.pid===ACC.pid&&(o.jt|0)>NET.jt&&!LOCAL){onBackEvent?.({op:'replaced'});return}
  if(o.q===1){q.push({id,jt:o.jt|0,n:String(o.n||'').slice(0,12)});continue}ids.add(id);applyInfo(getPeer(id),id,o)}
 NET.queue=q;queueCheck(ids.size);
 for(const id of [...peers.keys()])if(!ids.has(id))dropPeer(id);$('n-on').textContent=ids.size+1;refreshStations();renderPeople()}
function applyInfo(p,id,o){p.name=String(o.n||'玩家').slice(0,12);const lk=parseLook(o.lk);p.look=lk;p.color=OUTFIT[lk.cl];
 const key=lookKey(lk);if(p.lk!==key){p.lk=key;if(p.av){const pos=p.av.position.clone(),ry=p.av.rotation.y;scene.remove(p.av);p.av=makeAnimal(lk);p.av.position.copy(pos);p.av.rotation.y=ry;scene.add(p.av)}}
 spawnPeerAvatar(p);p.act=['walk','bowl','cab','sit'].includes(o.a)?o.a:'walk';p.game=typeof o.g==='string'&&GAMES[o.g]?o.g:'';p.lane=Number.isInteger(o.L)&&o.L>=0&&o.L<4?o.L:-1;
 p.sq=Number.isFinite(o.sq)?o.sq:0;p.hid=o.hid===1&&!isStaff();if(p.av)p.av.visible=!p.hid;const hp=typeof o.hp==='string'&&PROPS[o.hp]?o.hp:'';const eqk=JSON.stringify(o.eq||{})+(o.rk||'');if(p.av&&(p.hpK!==hp||p.eqK!==eqk)){p.hpK=hp;p.eqK=eqk;setProp(p.av,hp);applyEquip(p.av,o.eq,!!o.rk)}
 if(o.rk&&!p.rkSeen&&!p.hid){p.rkSeen=1;if(p.lastMv||peers.size)notify({tone:'ann',icon:'shield',title:'管理員加入了包廂',text:`${String(o.n||'管理員').slice(0,12)}（${ROLE_NAME[o.rk]||'管理員'}）來巡視了`,ms:5000})}p.tag.classList.toggle('staff',!!o.rk);p.tag.dataset.tag=(o.eq&&o.eq.tag)||'';p.ping=Number.isFinite(o.pg)?Math.round(o.pg):null;p.pid=typeof o.pid==='string'?o.pid.slice(0,40):null;p.ro=o.ro===1;p.rk=['mod','admin','owner'].includes(o.rk)?o.rk:'';p.eq=o.eq&&typeof o.eq==='object'?o.eq:{};p.pt=typeof o.pt==='string'&&o.pt.length<20?o.pt:null;
 p.sx=o.sx&&typeof o.sx==='object'&&stations.has(o.sx.s)&&(o.sx.i===0||o.sx.i===1)?{s:o.sx.s,i:o.sx.i,w:['wait','play','ai','solo'].includes(o.sx.w)?o.sx.w:'play'}:null;p.stState=p.sx?.w;
 const vc=o.vc===1;if(vc!==p.vc){p.vc=vc;if(vc)maybeConnect(id);else closePc(id)}}
function onMove(d,id){if(typeof id!=='string'||id===MYID||!d||typeof d!=='object')return;const p=getPeer(id);p.lastMv=performance.now();
 p.base.set(num(d.x),num(d.y),num(d.z));p.vel.set(THREE.MathUtils.clamp(num(d.vx),-9,9),0,THREE.MathUtils.clamp(num(d.vz),-9,9));p.yaw=num(d.r);p.air=d.air===1;p.talkNet=d.k===1;p.pose=d.po==='sit'||d.po==='ride'?d.po:'';
 if(d.e!==p.emoteRaw||d.et!==p.etRaw){p.emoteRaw=d.e;p.etRaw=d.et;p.emote=typeof d.e==='string'?d.e.slice(0,8):'';p.et=clock.elapsedTime;if(p.av){if(p.emote==='heart')spawnFloat(p.av.position);if(p.emote==='dance')spawnFloat(p.av.position,noteTex,3);heldItem(p.av,p.emote==='drink'?'drink':p.emote==='eat'?'eat':null)}}
 spawnPeerAvatar(p)}
onNet('mv',(d,id)=>onMove(d,id));
onNet('chat',(d,id)=>{const p=peers.get(id);const t=String(d.t||'').slice(0,80);if(!t)return;feed('',p?.name||'玩家',t,p?.color,p?.look);if(p)p.bubble={text:t,t:clock.elapsedTime}});
onNet('ann',(d,id)=>{const p=peers.get(id);const t=String(d.t||'').slice(0,60);if(t)feed('ann','',`${p?.name||'玩家'} ${t}`)});
// ---- presence out ----
let lastInfoKey='',lastInfoT=-1e9,infoTimer=null;
function infoObj(){return{hp:me.prop||'',hid:ADMP.hidden?1:0,sq:me.sq||0,pid:ACC.pid,q:NET.waiting?1:0,jt:NET.jt,ro:ROOM.isOwner?1:0,rk:ROLE_RANK[ACC.role]>0?ACC.role:'',eq:ACC.equip,n:myName,lk:[look.sp,look.fur,look.cl,look.acc],a:me.mode,g:me.mode==='cab'?curGame:'',L:me.mode==='bowl'?myLane:-1,vc:VOICE.joined?1:0,pg:net.self,vl:net.voice,pt:PARTY.id,sx:me.slot?{s:me.slot.st,i:me.slot.i,w:me.slot.w}:null}}
function pushInfo(force){if(!NET.ok||(me.mode==='preview'&&!NET.waiting)||me.mode==='site'&&!NET.waiting)return;const o=infoObj();const key=JSON.stringify({...o,pg:0,vl:0}),now=performance.now(),changed=key!==lastInfoKey;
 if(!changed&&!force&&now-lastInfoT<20000)return;const gap=NET.mode==='claude'?200:1500;
 if(now-lastInfoT<gap){clearTimeout(infoTimer);infoTimer=setTimeout(()=>pushInfo(true),gap+50-(now-lastInfoT));return}lastInfoKey=key;lastInfoT=now;NET.track(o)}
let lastMvT=0,lastMvKey='',mvTimer=null;
function sendMove(force,beat){if(!NET.ok||NET.waiting||me.mode==='preview'||me.mode==='site')return;const now=performance.now(),n=peers.size+1;
 const gap=NET.mode==='claude'||NET.mode==='local'?60:(n<=1?5000:1000/Math.min(6,Math.max(.6,60/(n*n))));
 const o={x:+me.x.toFixed(2),y:+me.y.toFixed(2),z:+me.z.toFixed(2),r:+myAv.rotation.y.toFixed(2),vx:+me.vx.toFixed(2),vz:+me.vz.toFixed(2),e:me.emote,et:emoteSeq,air:me.air?1:0,k:me.talk?1:0,po:me.pose||''};
 const key=JSON.stringify(o),changed=key!==lastMvKey;
 if(!beat){if(!changed&&now-lastMvT<4000)return;const minGap=force?Math.min(gap,150):gap;if(now-lastMvT<minGap){if(!mvTimer)mvTimer=setTimeout(()=>{mvTimer=null;sendMove(true)},minGap-(now-lastMvT)+5);return}}
 lastMvKey=key;lastMvT=now;NET.emit('mv',o)}
function sendPresence(force){pushInfo();sendMove(force)}

// ---- party ----
const PARTY={id:store.get('pt',null)};PARTY.id=null;
function partyMates(){if(!PARTY.id)return[];return[...peers.values()].filter(p=>p.pt===PARTY.id).map(p=>p.id)}
function inviteParty(id){if(!PARTY.id){PARTY.id=Math.random().toString(36).slice(2,10);pushInfo(true)}if(partyMates().length>=3){toast('隊伍最多 4 人',[],2500);return}NET.emit('pty',{t:'inv',to:id,pid:PARTY.id});toast(`已邀請 ${peerName(id)} 加入隊伍`,[],2500);renderPeople()}
function leaveParty(){PARTY.id=null;pushInfo(true);renderPeople();feed('sys','','已離開隊伍')}
onNet('pty',(d,from)=>{if(d.t==='inv'&&d.to===MYID&&typeof d.pid==='string'&&d.pid.length<20){const pid=d.pid;inviteIn(from,()=>toast(`${peerName(from)} 邀請你加入隊伍`,[{t:'略過'},{t:'加入',pri:true,fn:()=>{const n=[...peers.values()].filter(p=>p.pt===pid).length;if(n>=4){toast('隊伍已經滿了',[],2500);return}PARTY.id=pid;pushInfo(true);NET.emit('pty',{t:'hi',pid});feed('sys','',`加入了 ${peerName(from)} 的隊伍`);renderPeople()}}],15000,peers.get(from)?.look))}
 else if(d.t==='hi'&&d.pid===PARTY.id){feed('sys','',`🎉 ${peerName(from)} 加入了隊伍`);sfx('coin');renderPeople()}});
// ---- lanes over the network ----
const validLaneState=(st)=>st&&Array.isArray(st.ps)&&st.ps.length>0&&st.ps.length<=4&&st.ps.every(p=>Array.isArray(p)&&typeof p[0]==='string'&&typeof p[1]==='string')&&st.rolls&&typeof st.rolls==='object'&&Number.isInteger(st.turn)&&Number.isInteger(st.seq);
onNet('ln',(d,from)=>{const i=d.lane;const L=Number.isInteger(i)&&lanes[i];
 if(d.t==='q'){for(const l of lanes)if(l.state&&l.state.host===MYID)broadcastLane(l);return}if(!L)return;
 if(d.t==='state'){const st={lane:i,host:String(d.host),ps:d.ps,turn:d.turn,rolls:{},stand:(d.stand|0)&1023,rr:!!d.rr,phase:d.phase==='done'?'done':'aim',seq:d.seq,fx:String(d.fx||'').slice(0,8)};if(!validLaneState(st)||st.host!==from)return;
  st.ps=st.ps.map(p=>[p[0].slice(0,16),p[1].slice(0,12)]);for(const[id]of st.ps){const r=d.rolls[id];st.rolls[id]=Array.isArray(r)?r.filter(v=>Number.isInteger(v)&&v>=0&&v<=10).slice(0,21):[]}
  if(L.state&&L.state.host===MYID&&from!==MYID&&L.state.seq>=st.seq)return;applyLaneState(L,st,!L.state);if(myLane===i&&!sessionHas(st,MYID)&&st.host!==MYID){}return}
 if(d.t==='throw'){startSim(L,{...d,i:from});return}
 if(d.t==='res'){if(L.state&&L.state.host===MYID)hostApplyRes(L,d.k|0,d.s|0,from);return}
 if(d.t==='join'){const st=L.state;if(st&&st.host===MYID&&!sessionHas(st,from)&&st.ps.length<4){st.ps.push([from,String(d.name||peerName(from)).slice(0,12)]);st.rolls[from]=[];st.seq++;broadcastLane(L);feed('sys','',`🎳 ${peerName(from)} 加入第 ${i+1} 道`)}return}
 if(d.t==='leave'){const st=L.state;if(st&&st.host===MYID&&sessionHas(st,from)){const idx=st.ps.findIndex(p=>p[0]===from);st.ps.splice(idx,1);if(st.turn>idx||st.turn>=st.ps.length)st.turn=Math.max(0,st.turn-(st.turn>idx?1:0))%Math.max(1,st.ps.length);st.seq++;broadcastLane(L)}return}
 if(d.t==='close'){if(L.state&&L.state.host===from){L.state=null;resetLane(L);if(myLane===i){toast('房主結束了這條球道',[],3000);leaveLane()}}return}
 if(d.t==='inv'&&d.to===MYID){inviteIn(from,()=>toast(`${peerName(from)} 邀你一起打第 ${i+1} 道保齡球`,[{t:'略過'},{t:'加入',pri:true,fn:()=>{if(me.mode==='cab')closeGame();if(me.mode==='bowl'&&myLane!==i)leaveLane();if(me.mode==='sit')standUp();enterLane(i)}}],20000,peers.get(from)?.look))}});
// ---- stations / matches over the network ----
function refreshStations(){for(const st of stations.values())st.occ=[null,null];for(const p of peers.values())if(p.sx){const st=stations.get(p.sx.s);if(st)st.occ[p.sx.i]=p.id}if(me.slot){const st=stations.get(me.slot.st);if(st)st.occ[me.slot.i]=MYID}}
onNet('mt',(d,from)=>{
 if(d.t==='join'&&d.to===MYID&&me.slot&&me.slot.st===d.st){const st=stations.get(d.st);const go=()=>{const mid=Math.random().toString(36).slice(2,10),seed=(Math.random()*1e9)|0;NET.emit('mt',{t:'go',st:d.st,mid,seed,a:MYID,b:from});beginMatch({mid,st:d.st,a:MYID,b:from,seed})};
  if(me.slot.w==='wait')go();else toast(`${peerName(from)} 想和你玩${GAMES[st.game].name}對戰`,[{t:'不要'},{t:'開打！',pri:true,fn:go}],15000,peers.get(from)?.look);return}
 if(d.t==='go'&&d.b===MYID&&me.slot&&me.slot.st===d.st&&typeof d.mid==='string'){beginMatch({mid:d.mid.slice(0,12),st:d.st,a:from,b:MYID,seed:d.seed|0});return}
 if(d.t==='call'&&d.to===MYID&&stations.has(d.st)){inviteIn(from,()=>toast(`${peerName(from)} 找你去玩${GAMES[stations.get(d.st).game].name}對戰，走過去按 E！`,[{t:'好'}],12000,peers.get(from)?.look))}});
const DC_LINKS=new Map(),DC_PENDING=new Map();
function openLink(mid,opp){const hs=[];const L={fast:true,send(){},on(f){hs.push(f)},close(){}};const deliver=m=>{for(const f of hs)f(m)};
 if(NET.mode==='local'||!NET.mode){const bc=new BroadcastChannel('na3-m-'+mid);bc.onmessage=e=>{if(e.data&&e.data.f!==MYID)deliver(e.data.m)};L.send=m=>bc.postMessage({f:MYID,m});L.close=()=>bc.close();return L}
 if(NET.mode==='claude'){let r=null;const q=[];(NET.lobby||NET.room).join('m-'+mid).then(nr=>{r=nr;nr.on('m',msg=>{if(!msg.sameTab)deliver(msg.data)},()=>{});q.splice(0).forEach(m=>nr.emit('m',m).catch(()=>{}))}).catch(()=>{L.fast=false});
  L.send=m=>{if(r)r.emit('m',m).catch(()=>{});else if(q.length<60)q.push(m)};L.close=()=>{r?.leave().catch(()=>{})};return L}
 const ch=NET.sb.channel('na-m-'+mid,{config:{broadcast:{self:false}}});let chOk=false;ch.on('broadcast',{event:'m'},({payload})=>{if(payload&&payload.f!==MYID)deliver(payload.m)});ch.subscribe(s=>{chOk=s==='SUBSCRIBED'});
 L.fast=false;let dc=null;const pc=new RTCPeerConnection({iceServers:ICE});const d=pc.createDataChannel('g',{negotiated:true,id:7});d.onopen=()=>{dc=d;L.fast=true};d.onclose=()=>{dc=null;L.fast=false};d.onmessage=e=>{try{deliver(JSON.parse(e.data))}catch(x){}};
 DC_LINKS.set(mid,{pc,opp});
 if(MYID<opp)(async()=>{try{await pc.setLocalDescription(await pc.createOffer());await waitIce(pc);NET.emit('rtc',{to:opp,ty:'dco',mid,sdp:pc.localDescription.sdp})}catch(e){}})();
 else{const pend=DC_PENDING.get(mid);if(pend){DC_PENDING.delete(mid);answerDC(mid,pend.from,pend.sdp)}}
 L.send=m=>{if(dc&&dc.readyState==='open')dc.send(JSON.stringify(m));else if(chOk)ch.send({type:'broadcast',event:'m',payload:{f:MYID,m}}).catch(()=>{})};
 L.close=()=>{try{pc.close()}catch(e){}try{NET.sb.removeChannel(ch)}catch(e){}DC_LINKS.delete(mid)};return L}
async function answerDC(mid,from,sdp){const lk=DC_LINKS.get(mid);if(!lk)return;try{await lk.pc.setRemoteDescription({type:'offer',sdp});await lk.pc.setLocalDescription(await lk.pc.createAnswer());await waitIce(lk.pc);NET.emit('rtc',{to:from,ty:'dca',mid,sdp:lk.pc.localDescription.sdp})}catch(e){}}

// ---- people panel ----
const latTxt=v=>v==null?'—':v+'ms';const qc=v=>v==null?'q-n':v<80?'q-g':v<200?'q-y':'q-r';
const statusText=(mode,y,lane,game)=>mode==='bowl'?`保齡球 ${lane+1} 道`:mode==='cab'?`${GAMES[game]?.name||'機台'}`:mode==='sit'?'休息中':y>3?'2F 閒逛':'1F 閒逛';
const lvlOf=v=>v==null?'l0':v<60?'l4':v<120?'l3':v<250?'l2':'l1';
function sigEl(v){const s=document.createElement('span');s.className='sig '+qc(v)+' '+lvlOf(v);s.innerHTML='<i></i><i></i><i></i><i></i>';return s}
function badge(lk,talk){return pfEl(lk,talk)}
function renderPeople(){updateMeBar();const w=$('people');if(w.hidden)return;w.replaceChildren();const mates=partyMates();
 const sec=(icon,t,extra)=>{const s=document.createElement('div');s.className='sec';s.innerHTML=`<svg class="i sm"><use href="#i-${icon}"/></svg>`;const sp=document.createElement('span');sp.textContent=t;const g=document.createElement('span');g.className='grow';s.append(sp,g);if(extra)s.append(extra);w.append(s)};
 const row=(name,lk,status,ping,vl,talk,vc,extra,mate)=>{const d=document.createElement('div');d.className='prow'+(talk?' talk':'');d.append(pfEl(lk,talk));const mid=document.createElement('div');mid.className='mid';
  const n=document.createElement('div');n.className='nm';if(mate)n.insertAdjacentHTML('beforeend','<svg class="i f star"><use href="#i-star"/></svg>');const ns=document.createElement('span');ns.textContent=name;n.append(ns);
  if(talk)n.insertAdjacentHTML('beforeend','<svg class="i" style="color:var(--mint)"><use href="#i-mic"/></svg>');else if(vc)n.insertAdjacentHTML('beforeend','<svg class="i" style="color:var(--dim)"><use href="#i-headphones"/></svg>');
  const s=document.createElement('div');s.className='st';s.append(document.createTextNode(status));const d1=document.createElement('span');d1.className='dsep';s.append(d1,sigEl(ping));const pt=document.createElement('span');pt.className=qc(ping);pt.textContent=latTxt(ping);s.append(pt);
  if(vc){const d2=document.createElement('span');d2.className='dsep';const vt=document.createElement('span');vt.className=qc(vl);vt.textContent='語音 '+latTxt(vl);s.append(d2,vt)}mid.append(n,s);d.append(mid);if(extra)d.append(extra);w.append(d)};
 if(PARTY.id&&mates.length){const lb=document.createElement('button');lb.className='cb ghost sm';lb.textContent='離開';lb.onclick=leaveParty;sec('flag',`我的隊伍 ${mates.length+1}/4`,lb)}
 sec('signal','連線狀態');w.append(netCard());
 sec('users',`在線 ${peers.size+1} 人`);
 row(myName+'（你）',look,statusText(me.mode,me.y,myLane,curGame),net.self,net.voice,me.talk,VOICE.joined,null,PARTY.id&&mates.length);
 for(const p of peers.values()){if(!p.look)continue;const mate=!!(PARTY.id&&p.pt===PARTY.id);let btn=null;if(!mate){btn=document.createElement('button');btn.className='cb pink sm';btn.innerHTML='<svg class="i sm"><use href="#i-userplus"/></svg>組隊';btn.onclick=()=>inviteParty(p.id)}
  row(p.name,p.look,statusText(p.act,p.cur.y,p.lane,p.game),p.ping,p.vlat,p.talk,p.vc,btn,mate)}
 if(!peers.size){const e=document.createElement('div');e.className='empty';e.textContent=!NET.ok&&NET.mode!=='local'?(IN_CLAUDE?'分享這個頁面給朋友，大家同時打開就能一起玩。':'正在連線多人伺服器…'):'現在只有你在這裡。把網址傳給朋友，一起來玩吧！';w.append(e)}}
function updateMeBar(){const v=net.self;$('me-bars').className='sig '+lvlOf(v);$('me-net').className='netp '+qc(v);$('me-ms').textContent=v==null?(NET.ok?'…':'離線'):v+'ms';$('me-btn').title=`網路延遲 ${latTxt(v)}`;$('me-pf').classList.toggle('talk',!!me.talk);
 const mates=partyMates();const ps=$('party-strip');ps.hidden=!mates.length;if(mates.length){ps.replaceChildren();ps.insertAdjacentHTML('beforeend','<svg class="i f sm"><use href="#i-star"/></svg>');ps.append(pfEl(look,me.talk));for(const id of mates){const p=peers.get(id);if(p?.look)ps.append(pfEl(p.look,p.talk))}const t=document.createElement('span');t.textContent='隊伍';ps.append(t)}}
setInterval(()=>{updateMeBar();if(!$('people').hidden)renderPeople()},1500);

// ---- invites while busy: tell the sender why, show it here once the game is over ----
const DEFER=[];
function busyWhy(){if(me.mode==='cab')return`正在玩${GAMES[curGame]?.name||'機台'}`;if(me.mode==='bowl')return`正在打保齡球（第 ${myLane+1} 道）`;if(me.booth)return'正在拍貼';return''}
function inviteIn(from,show){const why=busyWhy();if(why){NET.emit('rm',{t:'busy',to:from,why});if(DEFER.length<6)DEFER.push(show);return}show()}
function flushInvites(){if(busyWhy())return;const n=DEFER.length;while(DEFER.length)DEFER.shift()();if(n)notify({tone:'info',text:`你玩遊戲時收到 ${n} 個邀請`,ms:3000,quiet:true})}
