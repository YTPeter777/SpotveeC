
// ================= chat safety, reports with device info, logs for admins =================
const BADW=['幹你','幹妳','幹他','幹死','幹拎','靠北','靠腰','操你','操妳','他媽的','你媽的','媽的','雞掰','機掰','肏','屌你','賤人','婊子','白癡','智障','腦殘','去死','廢物','垃圾人','陰莖','陰道','性交','做愛','約炮','約砲','色情','裸照','口交','強姦','奶子','屁眼','打手槍','自慰','援交','18禁','成人片','a片','fuck','shit','bitch','cunt','dick','pussy','porn','nude','rape','slut','whore','asshole','motherfucker','nsfw','xxx'];
const normC=t=>String(t).toLowerCase().replace(/[\s._\-*~!@#$%^&()+=|\\/,'"?:;。，、！？…]/g,'');
function chatBad(t){const n=normC(t);return BADW.some(w=>n.includes(w))}
function chatMask(t){let s=String(t);for(const w of BADW){const re=new RegExp(w.split('').map(c=>c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('[\\s._\\-*~]*'),'gi');s=s.replace(re,m=>'＊'.repeat(Math.min(4,m.length)))}return s}
const CHATG={sent:[],last:'',lastT:0,strikes:0};
function chatCheck(t){if(!featureOn('chat'))return'聊天室目前維護中';const now=Date.now();CHATG.sent=CHATG.sent.filter(x=>now-x<8000);if(CHATG.sent.length>=4)return'說太快了，休息幾秒再說';
 if(t===CHATG.last&&now-CHATG.lastT<20000)return'請不要重複發送一樣的訊息';if(/(.)\1{7,}/u.test(t))return'請不要洗版';if(chatBad(t)){CHATG.strikes++;if(CHATG.strikes>=3)flagCheat('chat',0,{why:'profanity_repeat',msg:t.slice(0,80),maxSec:0,rate:0,dur:0,taps:0});return'訊息包含不適當的字詞（含 18+ 內容），已被攔截'}
 CHATG.sent.push(now);CHATG.last=t;CHATG.lastT=now;return''}
async function logChat(t){const row={t:Date.now(),room:ROOM.id||'',rn:ROOM.name||'',msg:t.slice(0,90)};if(BK.mode==='supa'){rpc('avera_chat',{p_secret:BK.secret,p_room:row.room,p_msg:row.msg});return}
 const cur=(await dget('chat/'+BK.uid))||{items:[]};dset('chat/'+BK.uid,{name:ACC.name,items:[...(cur.items||[]),row].slice(-80)})}
function deviceInfo(){let gpu='';try{const gl=renderer.getContext(),dbg=gl.getExtension('WEBGL_debug_renderer_info');gpu=dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):''}catch(e){}
 return{ua:navigator.userAgent.slice(0,160),plat:navigator.userAgentData?.platform||navigator.platform||'',lang:navigator.language,scr:`${screen.width}x${screen.height}@${devicePixelRatio}`,mem:navigator.deviceMemory||null,cpu:navigator.hardwareConcurrency||null,net:navigator.connection?.effectiveType||'',gpu:String(gpu).slice(0,80),touch:isTouch,tz:Intl.DateTimeFormat().resolvedOptions().timeZone}}
const _sendReport=sendReport;sendReport=async function(kind,target,body,ctx){return _sendReport(kind,target,body,{...(ctx||{}),dev:deviceInfo()})};
// incoming chat: filtered, with a report button on each message
onNet('chat',(d,id)=>{const p=peers.get(id);let t=String(d.t||'').slice(0,90);if(!t)return;t=chatMask(t);feed('',p?.name||'玩家',t,p?.color,p?.look);const el=$('feed').lastElementChild;
 if(el&&p){const b=document.createElement('button');b.className='rep-b';b.title='檢舉這則訊息';b.setAttribute('aria-label','檢舉這則訊息');b.innerHTML='<svg class="i sm"><use href="#i-flagr"/></svg>';b.onclick=()=>openReport('chat',p.name,`檢舉訊息：「${t}」`,{msg:t,from:p.pid});el.append(b)}
 if(p)p.bubble={text:t,t:clock.elapsedTime};if(d.v===1&&VOICE.ttsOn&&VOICE.tts)(VOICE.tts.add?VOICE.tts.add([{text:t.replace('🎙 ','')}]):VOICE.tts.speak(t)).catch(()=>{})});
// login + activity logs (admin can read them)
async function logLogin(){const row={t:Date.now(),dev:deviceInfo(),room:ROOM.id||''};if(BK.mode==='supa'){rpc('avera_login_log',{p_secret:BK.secret,p_dev:row.dev});return}
 const cur=(await dget('logins/'+BK.uid))||{items:[]};dset('logins/'+BK.uid,{name:ACC.name,items:[...(cur.items||[]),row].slice(-40)})}
async function logAct(what,extra){if(BK.mode==='supa'){rpc('avera_flag',{p_secret:BK.secret,p_kind:'act',p_data:{what,...(extra||{}),room:ROOM.id}});return}
 const cur=(await dget('act/'+BK.uid))||{items:[]};dset('act/'+BK.uid,{name:ACC.name,items:[...(cur.items||[]),{t:Date.now(),what,room:ROOM.name||'',...(extra||{})}].slice(-60)})}
// room status for the admin dashboard (written by the room's TV host)
setInterval(()=>{if(!ROOM.id||!NET.ok||!tvHost())return;const st={id:ROOM.id,name:ROOM.name,count:peers.size+1,cap:ROOM.cap,music:YTS.v?(YTS.title||YTS.v):'',by:YTS.by||'',queue:TVQ.length,theme:ROOM.theme,t:Date.now()};
 if(BK.mode==='supa')rpc('avera_room_stat',{p_secret:BK.secret,p_stat:st});else dset('rstat/'+String(ROOM.id).replace(/[^A-Za-z0-9_-]/g,''),st)},20000);
