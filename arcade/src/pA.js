
// ================= AVÉRA account, rooms & backend =================
// One interface (BK), three backends:
//   supa  — the website: Supabase RPCs, every rule enforced server-side (sql/avera.sql)
//   doc   — claude.ai preview: the artifact `db` + `user` capabilities
//   doc   — ?local tests: a localStorage emulation of the same db API
const ROLE_RANK={player:0,mod:1,admin:2,owner:3};
const ROLE_NAME={player:'玩家',mod:'管理員',admin:'高級管理員',owner:'站長'};
const SPECIAL_ITEMS={
 crown:{n:'金色皇冠',slot:'hat'},halo:{n:'天使光環',slot:'hat'},tiara:{n:'星鑽髮冠',slot:'hat'},
 wings:{n:'霓虹翅膀',slot:'back'},cape:{n:'星空披風',slot:'back'},
 gold_tag:{n:'金色名牌',slot:'tag'},vip_tag:{n:'VIP 名牌',slot:'tag'},staff_tag:{n:'工作人員名牌',slot:'tag'},
 ufo:{n:'小幽浮寵物',slot:'pet'},chick:{n:'小雞寵物',slot:'pet'},
 stars:{n:'星星足跡',slot:'trail'},hearts:{n:'愛心足跡',slot:'trail'},aura:{n:'彩虹光暈',slot:'fx'}};
const SLOT_NAME={hat:'頭飾',back:'背飾',tag:'名牌',pet:'寵物',trail:'足跡',fx:'光效'};
const DEFAULT_SHOP={cola:{n:'霓虹可樂',p:15,k:'drink'},bubble:{n:'珍珠奶茶',p:25,k:'drink'},soda:{n:'彩虹汽水',p:18,k:'drink'},popcorn:{n:'焦糖爆米花',p:20,k:'eat'},hotdog:{n:'大熱狗',p:30,k:'eat'},fries:{n:'黃金薯條',p:20,k:'eat'},icecream:{n:'霜淇淋',p:22,k:'eat'},donut:{n:'糖霜甜甜圈',p:18,k:'eat'}};
const THEMES={neon:{n:'霓虹紫',a:'#a77bff',b:'#ff5fb8',c:'#5cc2ff'},sunset:{n:'夕陽橘',a:'#ff8a3d',b:'#ff4f7b',c:'#ffd25e'},ocean:{n:'海洋藍',a:'#2fb8ff',b:'#3d6bff',c:'#4fe3d0'},
 forest:{n:'森林綠',a:'#41e08f',b:'#b6f05a',c:'#2fd3b2'},sakura:{n:'櫻花粉',a:'#ff8cc4',b:'#ffb3d9',c:'#c79bff'},gold:{n:'午夜金',a:'#ffcf6b',b:'#ff9f4a',c:'#fff1c4'},mono:{n:'純白',a:'#e8e6ff',b:'#bfc3ff',c:'#ffffff'}};
const ACC={pid:null,name:'',look:null,role:'player',coins:0,items:[],equip:{},renames:[],mutedUntil:0,exists:false,session:null,since:0,joinedAt:Date.now(),
 config:{capacity:40,maintenance:false,maint_msg:'',motd:'',tv_lock:false,shop:DEFAULT_SHOP,theme:'neon'}};
const ROOM={id:null,name:'',owner:null,ownerName:'',cap:16,pub:true,hasPw:false,locked:false,perm:false,chan:'',theme:'neon',isOwner:false,closing:null};
const isStaff=(r=ACC.role)=>ROLE_RANK[r]>=1;
function featureOn(k){const f=ACC.config.features||{};return f[k]!==false||isStaff()}
const rhex=(n=16)=>[...crypto.getRandomValues(new Uint8Array(n))].map(b=>b.toString(16).padStart(2,'0')).join('');
async function sha(s){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return 'x'+h}}
const cleanName=t=>String(t||'').replace(/[\u0000-\u001f<>"`\\]/g,'').replace(/\s+/g,' ').trim().slice(0,12);
const cleanLook=l=>{const c=(v,m)=>Number.isInteger(v)&&v>=0&&v<=m?v:0;l=l||{};return{sp:c(l.sp,7),fur:c(l.fur,7),cl:c(l.cl,7),acc:c(l.acc,5)}};
const RESERVED=/(admin|管理|官方|av[eé]ra|客服|系統|\bgm\b|staff|\bmod\b)/i;
function renameState(){const now=Date.now(),recent=(ACC.renames||[]).map(t=>+new Date(t)).filter(t=>now-t<14*864e5).sort((a,b)=>a-b);return{left:Math.max(0,2-recent.length),next:recent.length>=2?recent[0]+14*864e5:null}}

// ---------- localStorage emulation of the artifact db API (tests / offline) ----------
function localDB(){const P='avdb:',subs=new Set();let bc=null;try{bc=new BroadcastChannel('avdb')}catch(e){}
 const read=k=>{try{const v=localStorage.getItem(P+k);return v==null?undefined:JSON.parse(v)}catch(e){return undefined}};
 const fire=k=>{for(const s of [...subs])try{s(k)}catch(e){}};
 const write=(k,v)=>{try{if(v===undefined)localStorage.removeItem(P+k);else localStorage.setItem(P+k,JSON.stringify(v))}catch(e){}bc?.postMessage(k);fire(k)};
 if(bc)bc.onmessage=e=>fire(e.data);
 const merge=(a,b)=>{const o={...a};for(const k in b){const v=b[k];o[k]=v&&typeof v==='object'&&!Array.isArray(v)&&o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k])?merge(o[k],v):v}return o};
 const snap=(path,v)=>({id:path.split('/').pop(),exists:v!==undefined,data:()=>v,metadata:{fromCache:false,hasPendingWrites:false}});
 const cmp=(a,op,b)=>op==='=='?a===b:op==='!='?a!==b:op==='<'?a<b:op==='<='?a<=b:op==='>'?a>b:op==='>='?a>=b:op==='in'?b.includes(a):op==='array-contains'?Array.isArray(a)&&a.includes(b):true;
 const docRef=path=>({id:path.split('/').pop(),path,get:async()=>snap(path,read(path)),set:async d=>write(path,JSON.parse(JSON.stringify(d))),
  update:async d=>{const c=read(path);if(c===undefined)throw{code:'invalid_argument'};write(path,merge(c,JSON.parse(JSON.stringify(d))))},delete:async()=>write(path,undefined),
  onSnapshot:fn=>{const h=k=>{if(k===path)fn(snap(path,read(path)))};subs.add(h);setTimeout(()=>fn(snap(path,read(path))));return()=>subs.delete(h)},collection:c=>colRef(path+'/'+c)});
 const colRef=(path,q={w:[],o:null,l:0})=>{const run=()=>{const pre=P+path+'/';let docs=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(pre)&&!k.slice(pre.length).includes('/'))docs.push(snap(path+'/'+k.slice(pre.length),read(k.slice(P.length))))}
   docs=docs.filter(d=>q.w.every(([f,op,v])=>cmp(d.data()?.[f],op,v)));const[of,od]=q.o||['',''];docs.sort((a,b)=>{if(!of)return a.id<b.id?-1:1;const x=a.data()[of],y=b.data()[of];return(x<y?-1:x>y?1:0)*(od==='desc'?-1:1)});if(q.l)docs=docs.slice(0,q.l);
   return{docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:{fromCache:false}}};
  return{path,where:(f,op,v)=>colRef(path,{...q,w:[...q.w,[f,op,v]]}),orderBy:(f,d='asc')=>colRef(path,{...q,o:[f,d]}),limit:n=>colRef(path,{...q,l:n}),get:async()=>run(),
   onSnapshot:fn=>{const h=k=>{if(k.startsWith(path+'/'))fn(run())};subs.add(h);setTimeout(()=>fn(run()));return()=>subs.delete(h)},doc:id=>docRef(path+'/'+(id||rhex(8))),add:async d=>{const r=docRef(path+'/'+rhex(8));await r.set(d);return r}}};
 return{doc:docRef,collection:colRef}}

// ---------- backend selection ----------
const BK={mode:'',db:null,user:null,uid:null,secret:null,sb:null,watch:[],ready:null};
let sbP=null;async function getSB(){if(BK.sb)return BK.sb;if(!sbP)sbP=(async()=>{const{createClient}=await import(SUPABASE_JS);BK.sb=createClient(SB_URL,SB_KEY,{auth:{persistSession:false},realtime:{params:{eventsPerSecond:25}}});return BK.sb})();return sbP}
async function rpc(fn,args){const sb=await getSB();const{data,error}=await sb.rpc(fn,args);if(error)return{error:'net',message:error.message};return data||{}}
async function initBackend(){if(BK.ready)return BK.ready;BK.ready=(async()=>{
 if(IN_CLAUDE){try{const[db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);if(db&&user){BK.mode='doc';BK.db=db;BK.user=user;BK.uid=await user.id().catch(()=>null)}}catch(e){}
  if(!BK.uid){BK.mode='doc';BK.db=localDB();BK.uid=store.get('lid',null)||(()=>{const v='g'+rhex(6);store.set('lid',v);return v})();BK.offline=true}}
 else if(LOCAL||!SB_URL){BK.mode='doc';BK.db=localDB();let id=new URLSearchParams(location.search).get('pid');if(!id){try{id=sessionStorage.getItem('av-lid')}catch(e){}}if(!id){id='l'+rhex(6);try{sessionStorage.setItem('av-lid',id)}catch(e){}}BK.uid=id}
 else{BK.mode='supa';BK.secret=localStorage.getItem('av-secret');if(!BK.secret){BK.secret=rhex(24);try{localStorage.setItem('av-secret',BK.secret)}catch(e){}}}
 await loadProfile();return true})();return BK.ready}
const D=p=>BK.db.doc(p);
async function dget(p){try{const s=await D(p).get();return s.exists?s.data():null}catch(e){return null}}
async function dset(p,v){try{await D(p).set(v);return true}catch(e){return false}}
async function dupd(p,v){try{await D(p).update(v);return true}catch(e){try{const c=await dget(p);await D(p).set({...(c||{}),...v});return true}catch(x){return false}}}

function applyProfile(p){if(!p)return;ACC.exists=true;ACC.pid=p.id||ACC.pid;ACC.name=p.name||ACC.name;if(p.look)ACC.look=cleanLook(p.look);ACC.role=p.role||ACC.role||'player';ACC.coins=p.coins??ACC.coins;ACC.items=Array.isArray(p.items)?p.items:[];ACC.equip=p.equip&&typeof p.equip==='object'?p.equip:{};ACC.renames=Array.isArray(p.renames)?p.renames:[];ACC.mutedUntil=p.muted_until?+new Date(p.muted_until):(p.mutedUntil||0)}
function applyConfig(c){if(!c)return;for(const k of ['capacity','maintenance','maint_msg','motd','tv_lock','shop','theme','features','cachev'])if(c[k]!==undefined)ACC.config[k]=c[k];onConfig?.()}
let onConfig=null,onProfile=null,onBackEvent=null;

async function loadProfile(){
 if(BK.mode==='supa'){const r=await rpc('avera_me',{p_secret:BK.secret});if(r.profile)applyProfile(r.profile);if(r.config)applyConfig(r.config);BK.netErr=r.error==='net';return}
 ACC.pid=BK.uid;const p=await dget('players/'+BK.uid);if(p)applyProfile({...p,id:BK.uid});const c=await dget('cfg/main');if(c)applyConfig(c);await loadRoleDoc()}
async function loadRoleDoc(){let role=(await dget('staff/'+BK.uid))?.role||'player';if(BK.user){try{if(await BK.user.isOwner())role='owner';else if(await BK.user.canEdit()&&ROLE_RANK[role]<2)role='admin'}catch(e){}}
 if(LOCAL&&new URLSearchParams(location.search).get('staff'))role=new URLSearchParams(location.search).get('staff');ACC.role=role}

// create the profile (first visit): nickname is required, character is final
async function createProfile(name,lk){name=cleanName(name);if(name.length<2)return{error:'invalid'};if(RESERVED.test(name))return{error:'reserved'};lk=cleanLook(lk);
 if(BK.mode==='supa'){const r=await rpc('avera_join',{p_secret:BK.secret,p_name:name,p_look:lk});if(r.error)return r;applyProfile(r.profile);applyConfig(r.config);ACC.session=r.session;ACC.since=r.since;return{ok:true}}
 const p={name,look:lk,coins:5000,items:[],equip:{},renames:[],created:Date.now(),seen:Date.now(),dailyDay:new Date().toDateString()};if(!(await dset('players/'+BK.uid,p)))return{error:'write'};applyProfile({...p,id:BK.uid});return{ok:true}}

// enter: checks ban/maintenance and starts the device session
async function enterGame(){
 if(BK.mode==='supa'){const r=await rpc('avera_join',{p_secret:BK.secret,p_name:ACC.name,p_look:ACC.look});if(r.error)return r;applyProfile(r.profile);applyConfig(r.config);ACC.session=r.session;ACC.since=r.since;{const dl=await rpc('avera_daily',{p_secret:BK.secret});ACC.daily=dl.daily||0;if(dl.coins!=null)ACC.coins=dl.coins}startWatch();return{ok:true}}
 const ban=await dget('bans/'+BK.uid);if(ban&&ban.until&&ban.until>Date.now())return{error:'banned',until:ban.until,reason:ban.reason};if(ban?.muted)ACC.mutedUntil=ban.muted;
 if(ACC.config.maintenance&&!isStaff())return{error:'maintenance',msg:ACC.config.maint_msg};{const me0=(await dget('players/'+BK.uid))||{};const day=new Date().toDateString();if(me0.dailyDay!==day){ACC.coins=(me0.coins??ACC.coins)+1000;await dupd('players/'+BK.uid,{coins:ACC.coins,dailyDay:day});ACC.daily=1000}}ACC.session=rhex(8);ACC.joinedAt=Date.now();dupd('players/'+BK.uid,{seen:Date.now()});startWatch();return{ok:true}}

// ---------- live updates (events, profile, config, single device) ----------
let pollT=0,pollBusy=false,lastPoll=0;
function startWatch(){if(BK.watching)return;BK.watching=true;
 if(BK.mode==='supa'){const loop=async()=>{await pollNow();pollT=setTimeout(loop,12000)};pollT=setTimeout(loop,8000);return}
 const sub=(ref,fn)=>{try{BK.watch.push(ref.onSnapshot(fn,()=>{}))}catch(e){}};
 sub(D('players/'+BK.uid),s=>{if(s.exists){const before=JSON.stringify([ACC.name,ACC.look,ACC.items,ACC.coins,ACC.equip]);applyProfile({...s.data(),id:BK.uid});if(before!==JSON.stringify([ACC.name,ACC.look,ACC.items,ACC.coins,ACC.equip]))onProfile?.()}});
 sub(D('cfg/main'),s=>{if(s.exists)applyConfig(s.data())});
 sub(D('staff/'+BK.uid),()=>loadRoleDoc().then(()=>onProfile?.()));
 sub(D('bans/'+BK.uid),s=>{const b=s.exists?s.data():null;if(!b)return;if(b.until&&b.until>Date.now())onBackEvent?.({op:'ban',data:{reason:b.reason,until:b.until}});ACC.mutedUntil=b.muted||0});
 sub(BK.db.collection('evts').orderBy('t','desc').limit(25),q=>{for(const d of [...q.docs].reverse()){const e=d.data();if(!e||e.t<=ACC.joinedAt||BK.seenEv?.has(d.id))continue;(BK.seenEv||(BK.seenEv=new Set())).add(d.id);if(!e.target||e.target===BK.uid)onBackEvent?.({op:e.op,data:e.data||{},by:e.by})}})}
async function pollNow(){if(BK.mode!=='supa'||pollBusy||!ACC.session)return;if(performance.now()-lastPoll<1500)return;pollBusy=true;lastPoll=performance.now();
 try{const r=await rpc('avera_poll',{p_secret:BK.secret,p_session:ACC.session,p_since:ACC.since,p_room:ROOM.id});
  if(r.replaced){onBackEvent?.({op:'replaced'});return}if(r.error==='banned'){onBackEvent?.({op:'ban',data:{reason:r.reason,until:r.until}});return}
  if(r.ok){const before=JSON.stringify([ACC.name,ACC.look,ACC.items,ACC.coins,ACC.equip,ACC.role]);applyProfile(r.profile);applyConfig(r.config);if(before!==JSON.stringify([ACC.name,ACC.look,ACC.items,ACC.coins,ACC.equip,ACC.role]))onProfile?.();ACC.since=r.since;for(const e of r.events||[])onBackEvent?.(e)}}
 finally{pollBusy=false}}

// ---------- player actions ----------
async function renameSelf(name){name=cleanName(name);if(name.length<2)return{error:'invalid'};if(name===ACC.name)return{error:'same'};if(!isStaff()&&RESERVED.test(name))return{error:'reserved'};
 if(BK.mode==='supa'){const r=await rpc('avera_rename',{p_secret:BK.secret,p_name:name});if(r.ok)applyProfile(r.profile);return r}
 const rs=renameState();if(rs.left<=0&&!isStaff())return{error:'limit',next:rs.next};const recent=(ACC.renames||[]).filter(t=>Date.now()-+new Date(t)<14*864e5);const renames=[...recent,Date.now()];
 if(!(await dupd('players/'+BK.uid,{name,renames})))return{error:'write'};ACC.name=name;ACC.renames=renames;return{ok:true}}
async function sendReport(kind,target,body,ctx){body=String(body||'').trim();if(body.length<2)return{error:'length'};
 if(BK.mode==='supa')return rpc('avera_report',{p_secret:BK.secret,p_kind:kind,p_target:target||null,p_body:body.slice(0,1000),p_ctx:ctx||null});
 const cur=(await dget('reports/'+BK.uid))||{items:[]};const hour=(cur.items||[]).filter(x=>Date.now()-x.t<36e5).length;if(hour>=6)return{error:'rate'};
 const items=[...(cur.items||[]),{id:rhex(4),kind,target:target||'',body:body.slice(0,1000),ctx:ctx||null,t:Date.now(),status:'open',name:ACC.name||'訪客'}].slice(-30);
 return(await dset('reports/'+BK.uid,{items,name:ACC.name||'訪客'}))?{ok:true}:{error:'write'}}
async function earnCoins(game,n){n=Math.max(0,Math.min(40,n|0));if(!n||!ACC.exists)return;
 if(BK.mode==='supa'){const r=await rpc('avera_earn',{p_secret:BK.secret,p_game:game,p_amount:n});if(r.ok){ACC.coins=r.coins;if(r.earned)coinFx(r.earned)}return}
 const day=new Date().toDateString(),me0=(await dget('players/'+BK.uid))||{};const today=me0.earnDay===day?me0.earnToday||0:0;const amt=Math.min(n,800-today);if(amt<=0)return;
 ACC.coins=(me0.coins??ACC.coins)+amt;await dupd('players/'+BK.uid,{coins:ACC.coins,earnDay:day,earnToday:today+amt});coinFx(amt)}
async function buyItem(key){const it=(ACC.config.shop||DEFAULT_SHOP)[key];if(!it||it.off)return{error:'item'};
 if(BK.mode==='supa'){const r=await rpc('avera_buy',{p_secret:BK.secret,p_item:key});if(r.ok)ACC.coins=r.coins;return r}
 const cur=(await dget('players/'+BK.uid))||{};const c=cur.coins??ACC.coins;if(c<it.p)return{error:'coins'};ACC.coins=c-it.p;await dupd('players/'+BK.uid,{coins:ACC.coins});return{ok:true,coins:ACC.coins}}
async function equipItem(slot,item){if(item&&!ACC.items.includes(item))return{error:'not_owned'};
 if(BK.mode==='supa'){const r=await rpc('avera_equip',{p_secret:BK.secret,p_slot:slot,p_item:item||null});if(r.ok)applyProfile(r.profile);return r}
 const equip={...ACC.equip};if(item)equip[slot]=item;else delete equip[slot];ACC.equip=equip;await dupd('players/'+BK.uid,{equip});return{ok:true}}
async function claimOwner(key){if(BK.mode!=='supa')return{error:'mode'};const r=await rpc('avera_claim',{p_secret:BK.secret,p_key:key});if(r.ok)applyProfile(r.profile);return r}
function coinFx(n){notify({key:'coins',tone:'ok',icon:'coin',text:`獲得 ${n} 枚 AVÉRA 代幣（共 ${ACC.coins}）`,ms:2600,quiet:true});sfx('coin')}

// ---------- rooms (包廂) ----------
async function listRooms(){
 if(BK.mode==='supa'){const r=await rpc('avera_rooms',{p_secret:BK.secret});const l=r.rooms||[];l.mainCount=r.main_count??null;return l}
 const now=Date.now();const[rs,ins]=await Promise.all([BK.db.collection('rooms').get().catch(()=>({docs:[]})),BK.db.collection('inroom').where('t','>',now-75000).get().catch(()=>({docs:[]}))]);
 const cnt={},ownerOn={};for(const d of ins.docs){const v=d.data();if(v?.room){cnt[v.room]=(cnt[v.room]||0)+1;if(v.owner)ownerOn[v.room]=true}}
 const out=rs.docs.map(d=>({id:d.id,...d.data()})).filter(r=>!r.closed&&(r.perm||ownerOn[r.id]||r.owner===BK.uid||now-(r.created||0)<60000)&&(!r.closesAt||r.closesAt>now)).filter(r=>r.pub||r.owner===BK.uid||isStaff())
  .map(r=>({id:r.id,name:r.name,cap:r.cap,count:cnt[r.id]||0,locked:!!r.locked,has_pw:!!r.pwh,perm:!!r.perm,pub:!!r.pub,owner_name:r.ownerName||'',theme:r.theme||'neon',mine:r.owner===BK.uid}))
  .sort((a,b)=>(b.perm-a.perm)||(b.count-a.count));out.mainCount=cnt.main||0;return out}
async function createRoom(o){const name=cleanName(o.name)||`${ACC.name} 的包廂`;const cap=Math.max(2,Math.min(40,o.cap|0||12));
 if(BK.mode==='supa'){const r=await rpc('avera_room_create',{p_secret:BK.secret,p_name:name,p_cap:cap,p_pub:!!o.pub,p_pw:o.pw||null});return r}
 if(o.perm&&!isStaff())return{error:'forbidden'};const id=o.perm?'p'+rhex(4):BK.uid;const room={name,cap,pub:!!o.pub,pwh:o.pw?await sha('avera:'+o.pw):'',locked:false,perm:!!o.perm,owner:o.perm?null:BK.uid,ownerName:o.perm?'AVÉRA':ACC.name,chan:rhex(8),theme:o.theme||'neon',created:Date.now(),closesAt:0,closed:false};
 if(!(await dset('rooms/'+id,room)))return{error:'write'};return{ok:true,room:{id,...room}}}
async function joinRoom(id,pw){
 if(BK.mode==='supa'){return rpc('avera_room_join',{p_secret:BK.secret,p_id:id,p_pw:pw||null})}
 const r=await dget('rooms/'+id);if(!r||r.closed||(r.closesAt&&r.closesAt<Date.now()))return{error:'gone'};const mine=r.owner===BK.uid,staff=isStaff();
 if(r.locked&&!mine&&!staff)return{error:'locked'};if(r.pwh&&!mine&&!staff){if(!pw)return{error:'password'};if(await sha('avera:'+pw)!==r.pwh)return{error:'password_wrong'}}
 const ins=await BK.db.collection('inroom').where('room','==',id).get().catch(()=>({docs:[]}));const count=ins.docs.filter(d=>d.data()?.t>Date.now()-75000&&d.id!==BK.uid).length;
 return{ok:true,room:{id,name:r.name,cap:r.cap,pub:r.pub,has_pw:!!r.pwh,locked:r.locked,perm:r.perm,owner:r.owner,owner_name:r.ownerName,chan:r.chan,theme:r.theme||'neon',is_owner:mine},count,full:count>=r.cap&&!mine&&!staff}}
async function updateRoom(patch){if(!ROOM.id)return{error:'no_room'};
 if(BK.mode==='supa')return rpc('avera_room_update',{p_secret:BK.secret,p_id:ROOM.id,p_patch:patch});
 const up={};if(patch.name!=null)up.name=cleanName(patch.name)||ROOM.name;if(patch.cap!=null)up.cap=Math.max(2,Math.min(40,patch.cap|0));if(patch.pub!=null)up.pub=!!patch.pub;if(patch.locked!=null)up.locked=!!patch.locked;if(patch.theme&&THEMES[patch.theme])up.theme=patch.theme;
 if(patch.pw!=null)up.pwh=patch.pw?await sha('avera:'+patch.pw):'';return(await dupd('rooms/'+ROOM.id,up))?{ok:true}:{error:'write'}}
async function closeRoomRemote(id,delay){if(BK.mode==='supa')return rpc('avera_room_close',{p_secret:BK.secret,p_id:id,p_delay:delay|0});
 return(await dupd('rooms/'+id,delay?{closesAt:Date.now()+delay*1000}:{closed:true,closesAt:Date.now()}))?{ok:true}:{error:'write'}}
let beatT=0;function roomBeat(){clearInterval(beatT);if(!ROOM.id)return;const beat=()=>{if(BK.mode==='supa')pollNow();else dset('inroom/'+BK.uid,{room:ROOM.id,t:Date.now(),name:ACC.name,owner:ROOM.isOwner})};beat();beatT=setInterval(beat,BK.mode==='supa'?12000:25000)}
function roomBeatStop(){clearInterval(beatT);if(BK.mode==='supa')rpc('avera_room_leave',{p_secret:BK.secret});else if(BK.db)D('inroom/'+BK.uid).delete().catch(()=>{})}

// ---------- staff actions (admin panel) ----------
async function adminOp(op,a={}){if(!isStaff())return{error:'forbidden'};
 if(BK.mode==='supa'){const r=await rpc('avera_admin',{p_secret:BK.secret,p_op:op,p_a:a});if(r.ok&&r.event)NET.emit?.('adm',{e:r.event});return r}
 const ev=async(target,op2,data)=>{const t=Date.now();await dset('evts/'+t+rhex(2),{t,target:target||null,op:op2,data:data||{},by:ACC.name});};
 const tgt=a.id;const rank=ROLE_RANK[ACC.role];
 if(['ban','unban','rename','look','grant','revoke','coins','config','theme_default'].includes(op)&&rank<2)return{error:'forbidden'};if(op==='role'&&rank<3)return{error:'forbidden'};
 if(tgt&&['kick','mute','ban'].includes(op)&&tgt===BK.uid)return{error:'self'};
 if(tgt&&!['players','stats','reports','resolve','rooms','audit'].includes(op)){const tr=(await dget('staff/'+tgt))?.role||'player';if(tgt!==BK.uid&&ROLE_RANK[tr]>=rank)return{error:'rank'}}
 switch(op){
  case 'players':{const q=String(a.q||'').trim().toLowerCase();const s=await BK.db.collection('players').orderBy('seen','desc').limit(200).get().catch(()=>({docs:[]}));const staff=await BK.db.collection('staff').get().catch(()=>({docs:[]}));const bans=await BK.db.collection('bans').get().catch(()=>({docs:[]}));
   const roles=Object.fromEntries(staff.docs.map(d=>[d.id,d.data()?.role]));const bn=Object.fromEntries(bans.docs.map(d=>[d.id,d.data()]));
   return{ok:true,players:s.docs.map(d=>({id:d.id,...d.data(),role:roles[d.id]||'player',last_seen:d.data().seen,banned_until:bn[d.id]?.until>Date.now()?bn[d.id].until:null,ban_reason:bn[d.id]?.reason,muted_until:bn[d.id]?.muted>Date.now()?bn[d.id].muted:null})).filter(p=>!q||String(p.name||'').toLowerCase().includes(q)||p.id===q).slice(0,60)}}
  case 'stats':{const s=await BK.db.collection('players').get().catch(()=>({docs:[]}));const r=await BK.db.collection('reports').get().catch(()=>({docs:[]}));const now=Date.now();
   return{ok:true,players:s.size,active_today:s.docs.filter(d=>now-(d.data().seen||0)<864e5).length,online:(await BK.db.collection('inroom').where('t','>',now-75000).get().catch(()=>({size:0}))).size,open_reports:r.docs.reduce((n,d)=>n+(d.data().items||[]).filter(x=>x.status==='open').length,0)}}
  case 'reports':{const r=await BK.db.collection('reports').get().catch(()=>({docs:[]}));const st=a.status||'open';const out=[];for(const d of r.docs)for(const x of d.data().items||[])if(st==='all'||x.status===st)out.push({...x,rid:d.id+'/'+x.id,player_name:x.name,created_at:x.t});out.sort((x,y)=>y.t-x.t);return{ok:true,reports:out.slice(0,100)}}
  case 'resolve':{const[uid,id]=String(a.rid).split('/');const cur=await dget('reports/'+uid);if(!cur)return{error:'gone'};cur.items=(cur.items||[]).map(x=>x.id===id?{...x,status:a.status||'done',note:a.note||''}:x);await dset('reports/'+uid,cur);break}
  case 'announce':{const text=String(a.text||'').trim().slice(0,200);if(!text)return{error:'empty'};await ev(null,'announce',{text,by:ACC.name});break}
  case 'tv':await ev(null,'tv',{op:a.op});if(a.op==='lock'||a.op==='unlock')await dupd('cfg/main',{tv_lock:a.op==='lock'});break;
  case 'kick':await ev(tgt,'kick',{reason:a.reason||''});break;
  case 'mute':{const until=a.minutes?Date.now()+a.minutes*6e4:0;await dupd('bans/'+tgt,{muted:until});await ev(tgt,'mute',{minutes:a.minutes|0});break}
  case 'ban':{const until=a.hours?Date.now()+a.hours*36e5:8.64e15;await dupd('bans/'+tgt,{until,reason:a.reason||''});await ev(tgt,'ban',{hours:a.hours|0,reason:a.reason||''});break}
  case 'unban':await dupd('bans/'+tgt,{until:0,reason:''});break;
  case 'rename':{const n=cleanName(a.name);if(n.length<1)return{error:'invalid'};await dupd('players/'+tgt,{name:n});await ev(tgt,'profile',{why:'rename'});break}
  case 'look':await dupd('players/'+tgt,{look:cleanLook(a.look)});await ev(tgt,'profile',{why:'look'});break;
  case 'grant':case 'revoke':{if(!/^[a-z0-9_]{2,24}$/.test(a.item||''))return{error:'item'};const p=(await dget('players/'+tgt))||{};let items=(p.items||[]).filter(x=>x!==a.item);const equip={...(p.equip||{})};if(op==='grant')items.push(a.item);else for(const k in equip)if(equip[k]===a.item)delete equip[k];await dupd('players/'+tgt,{items,equip});await ev(tgt,'profile',{why:op,item:a.item});break}
  case 'coins':{const p=(await dget('players/'+tgt))||{};await dupd('players/'+tgt,{coins:Math.max(0,(p.coins||0)+(a.delta|0))});await ev(tgt,'profile',{why:'coins',delta:a.delta|0});break}
  case 'role':if(!['player','mod','admin'].includes(a.role))return{error:'role'};await dset('staff/'+tgt,{role:a.role});await ev(tgt,'profile',{why:'role',role:a.role});break;
  case 'config':if(!['capacity','maintenance','maint_msg','motd','shop','theme'].includes(a.k))return{error:'key'};await dupd('cfg/main',{[a.k]:a.v});break;
  case 'rooms':{const rs=await BK.db.collection('rooms').get().catch(()=>({docs:[]}));return{ok:true,rooms:rs.docs.map(d=>({id:d.id,...d.data(),has_pw:!!d.data().pwh}))}}
  case 'room_create':return createRoom({...a,perm:true,pub:a.pub!==false});
  case 'room_close':await dupd('rooms/'+a.rid,{closed:true,closesAt:Date.now()});break;
  case 'audit':return{ok:true,audit:[]};
  default:return{error:'bad_op'}}
 return{ok:true}}
