
// ================= website, lobby & room flow =================
const PAGES=['home','about','rooms','faq','contact','terms','privacy','rules'];
const APP={page:'home',entered:false,roomsT:0,ownerGoneAt:0,closingNote:null,lastInput:performance.now(),afkNote:null};
const MAIN_ROOM=()=>({id:'main',name:'AVÉRA 大廳',cap:ACC.config.capacity||40,pub:true,has_pw:false,locked:false,perm:true,owner:null,owner_name:'AVÉRA',chan:'main',theme:ACC.config.theme||'neon',count:null,official:true});
const esc2=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ---------- generic dialog ----------
function dialog(o){return new Promise(res=>{const d=$('dlg');$('dlg-ic').innerHTML=`<svg class="i"><use href="#i-${o.icon||'info'}"/></svg>`;$('dlg-ic').style.setProperty('--tc',o.color||'var(--pink1)');
 $('dlg-t').textContent=o.title||'';$('dlg-p').textContent=o.text||'';const x=$('dlg-x');x.replaceChildren();let inp=null;
 if(o.input){inp=document.createElement('input');inp.className='fld';inp.type=o.input.type||'text';inp.maxLength=o.input.max||40;inp.placeholder=o.input.ph||'';inp.value=o.input.value||'';inp.autocomplete='off';x.append(inp);if(o.input.err){const e=document.createElement('div');e.className='fe';e.style.marginTop='8px';e.textContent=o.input.err;x.append(e)}}
 const bw=$('dlg-btns');bw.replaceChildren();const done=v=>{d.hidden=true;document.removeEventListener('keydown',kd,true);res(v)};
 const kd=e=>{if(e.key==='Escape'&&o.cancel!==false){e.stopPropagation();done(null)}if(e.key==='Enter'&&inp&&document.activeElement===inp){e.stopPropagation();done(inp.value)}};document.addEventListener('keydown',kd,true);
 for(const b of o.btns||[{t:'好',pri:true,v:true}]){const e=document.createElement('button');e.className='cb '+(b.pri?(b.danger?'pink':'pink'):'ghost');if(b.danger)e.style.setProperty('--c1','#ff7a8f'),e.style.setProperty('--c2','#ff4f6b'),e.style.setProperty('--cl','#a3243a');e.textContent=b.t;e.onclick=()=>done(inp&&b.pri?inp.value:b.v);bw.append(e)}
 d.hidden=false;setTimeout(()=>(inp||bw.lastChild)?.focus(),60)})}

// ---------- routing ----------
function route(){const h=location.hash.replace(/^#\/?/,'');const[a,b]=h.split('/');
 if(a==='r'&&b){if(ROOM.id===b&&document.body.classList.contains('in-room'))return;APP.pendingRoom=b;if(document.body.classList.contains('in-room'))leaveRoom('switch',{silent:true});startPlay();return}
 if(document.body.classList.contains('in-room')){if(PAGES.includes(a)&&a!=='rooms'){location.hash='#/r/'+ROOM.id;showDocModal(a);return}leaveRoom('user',{fromNav:true});}
 showPage(PAGES.includes(a)?a:'home')}
function showPage(pg){APP.page=pg;$('creator').hidden=true;document.body.classList.remove('creating');$('site').hidden=false;
 document.querySelectorAll('#pages .pg').forEach(s=>s.hidden=s.dataset.pg!==pg);document.querySelectorAll('#navl a').forEach(a=>a.toggleAttribute('aria-current',a.dataset.r===pg));if(document.querySelector('#navl a[aria-current]'))document.querySelector('#navl a[aria-current]').setAttribute('aria-current','page');
 $('site').classList.toggle('solid',pg!=='home');$('nav').classList.remove('open');$('site').scrollTop=0;siteMode();
 clearInterval(APP.roomsT);if(pg==='rooms'){if(!ACC.exists){openCreator();return}renderLobby();APP.roomsT=setInterval(renderLobby,10000)}
 document.title=pg==='home'?'AVÉRA · Q 版 3D 遊戲場':`${{about:'介紹',rooms:'包廂',faq:'常見問題',contact:'聯絡我們',terms:'服務條款',privacy:'隱私權政策',rules:'社群守則'}[pg]} · AVÉRA`}
function siteMode(){if(me.mode==='walk'||me.mode==='bowl'||me.mode==='cab'||me.mode==='sit')return;me.mode='site';myAv.visible=false;camera.clearViewOffset()}
addEventListener('hashchange',route);
$('nav-burger').onclick=()=>{const o=$('nav').classList.toggle('open');$('nav-burger').setAttribute('aria-expanded',o)};
$('nav-play').onclick=e=>{e.preventDefault();startPlay()};
document.querySelectorAll('#site a[href="#/rooms"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();startPlay()}));
function startPlay(){if(!ACC.exists){openCreator();return}if(APP.pendingRoom){const r=APP.pendingRoom;APP.pendingRoom=null;tryJoin(r);return}if(location.hash!=='#/rooms')location.hash='#/rooms';else showPage('rooms')}
function showDocModal(pg){const sec=document.querySelector(`#pages .pg[data-pg="${pg}"] .wrap`);if(!sec)return;const m=$('docm');$('docm-b').replaceChildren(sec.cloneNode(true));m.hidden=false}
$('docm-x').onclick=()=>$('docm').hidden=true;

// ---------- character creator (first visit only) ----------
function openCreator(){$('site').hidden=true;$('creator').hidden=false;document.body.classList.add('creating');me.mode='preview';myAv.visible=true;$('nick-err').hidden=true;
 if(!$('nick').value)$('nick').value='';setTimeout(()=>{if(!isTouch)$('nick').focus()},200);updatePicks()}
$('cr-x').onclick=()=>{location.hash='#/';showPage('home')};
$('go').onclick=async()=>{const n=cleanName($('nick').value);const err=t=>{$('nick-err').textContent=t;$('nick-err').hidden=false;$('nick').focus();sfx('beep')};
 if(n.length<2)return err('請輸入 2–12 個字的匿名暱稱');if(RESERVED.test(n))return err('這個暱稱包含保留字（例如 管理員、官方、AVÉRA），請換一個');
 $('go').disabled=true;$('ldg').textContent='建立中…';const r=await createProfile(n,{...look});$('go').disabled=false;$('ldg').textContent='';
 if(r.error){const m={need_name:'請輸入暱稱',reserved:'這個暱稱包含保留字，請換一個',invalid:'暱稱格式不正確',net:'連線失敗，請稍後再試',write:'儲存失敗，請稍後再試'}[r.error]||'建立失敗：'+r.error;return err(m)}
 store.set('nick',n);sfx('go');notify({tone:'ok',icon:'gift',title:'角色建立完成',text:`歡迎來到 AVÉRA，${ACC.name}！送你 5000 枚新手代幣`,ms:5000});startPlay()};

// ---------- lobby ----------
async function renderLobby(){const box=$('rooms-list');if(!box.children.length)box.innerHTML='<div class="empty">正在讀取包廂…</div>';
 const me0=$('lobby-me');me0.replaceChildren();const mc=document.createElement('div');mc.className='mecard';mc.append(pfEl(ACC.look||look));const t=document.createElement('div');t.className='grow';
 const b=document.createElement('b');b.textContent=ACC.name;const sm=document.createElement('small');sm.textContent=(isStaff()?ROLE_NAME[ACC.role]+' · ':'')+'匿名玩家 · 一次只能在一台裝置上遊玩';t.append(b,sm);
 const cc=document.createElement('span');cc.className='coinchip';cc.innerHTML=`<svg class="i"><use href="#i-coin"/></svg>${ACC.coins|0}`;mc.append(t,cc);
 if(isStaff()){const ab=document.createElement('button');ab.className='cb lemon sm';ab.innerHTML='<svg class="i sm"><use href="#i-shield"/></svg>後台';ab.onclick=()=>openAdmin?.();mc.append(ab)}me0.append(mc);
 let list=[];try{list=await listRooms()}catch(e){}if(APP.page!=='rooms')return;
 if(!list.some(r=>r.perm)){const m=MAIN_ROOM();m.count=list.mainCount??null;list.unshift(m)}box.replaceChildren();
 for(const r of list){const th=THEMES[r.theme]||THEMES.neon;const c=document.createElement('button');c.className='room';c.style.setProperty('--tc',th.a);c.style.setProperty('--tc2',th.b);
  const cnt=r.count==null?'—':r.count,full=r.count!=null&&r.count>=r.cap;
  c.innerHTML=`<div class="rt"><svg class="i"><use href="#i-${r.perm?'crown':'door'}"/></svg><span></span></div><div class="ro"></div><div class="tags"></div><div class="cap${full?' full':''}"><svg class="i sm"><use href="#i-users"/></svg><span>${cnt} / ${r.cap}</span><span class="bar"><i style="width:${r.count==null?0:Math.min(100,r.count/r.cap*100)}%"></i></span></div><span class="cb ${full?'ghost':'pink'} sm go">${full?'排隊進入':'進入'}</span>`;
  c.querySelector('.rt span').textContent=r.name;c.querySelector('.ro').textContent=r.perm?'官方包廂 · 永久開放':`版主 ${r.owner_name||'—'}${r.mine?'（你）':''}`;
  const tg=c.querySelector('.tags');const tag=(cls,ic,tx)=>{const s=document.createElement('span');s.className='tag2 '+cls;s.innerHTML=`<svg class="i"><use href="#i-${ic}"/></svg>`;s.append(tx);tg.append(s)};
  if(r.perm)tag('gold','crown','官方');if(!r.pub)tag('','link','私人');if(r.has_pw)tag('','key','密碼');if(r.locked)tag('red','lock','上鎖');tag('',`palette`,(THEMES[r.theme]||THEMES.neon).n);
  c.onclick=()=>tryJoin(r.id,null,r);box.append(c)}
 $('home-live-t').textContent='遊戲場營業中 · '+list.length+' 個包廂開放'}
$('lb-new').onclick=()=>openCreateRoom();
$('lb-code').onclick=async()=>{const v=await dialog({icon:'link',title:'輸入邀請碼',text:'貼上朋友給你的邀請連結或包廂代碼',input:{ph:'例如 https://…#/r/ab12cd34 或 ab12cd34',max:300},btns:[{t:'取消'},{t:'加入',pri:true}]});
 if(!v)return;const m=String(v).match(/#\/r\/([A-Za-z0-9_-]{2,40})/)||String(v).trim().match(/^([A-Za-z0-9_-]{2,40})$/);if(!m){notify({tone:'err',text:'看不懂這個邀請碼，請確認連結是否完整'});return}tryJoin(m[1])};
async function openCreateRoom(){const f=$('roomf');f.hidden=false;$('rf-name').value=`${ACC.name} 的包廂`;$('rf-cap').value=12;$('rf-capv').textContent='12';$('rf-pub').setAttribute('aria-pressed','true');$('rf-pw').value='';
 $('rf-perm-row').hidden=!(ROLE_RANK[ACC.role]>=2);$('rf-perm').setAttribute('aria-pressed','false');renderThemePick($('rf-theme'),'neon')}
function renderThemePick(el,cur){el.replaceChildren();el.dataset.v=cur;for(const[k,t]of Object.entries(THEMES)){const b=document.createElement('button');b.type='button';b.className='thm';b.style.background=`linear-gradient(135deg,${t.a},${t.b})`;b.title=t.n;b.setAttribute('aria-label',t.n);b.setAttribute('aria-pressed',k===cur);b.onclick=()=>{el.dataset.v=k;[...el.children].forEach(x=>x.setAttribute('aria-pressed',x===b))};el.append(b)}}
$('rf-cap').oninput=()=>$('rf-capv').textContent=$('rf-cap').value;
document.querySelectorAll('#roomf .tog').forEach(t=>t.onclick=()=>t.setAttribute('aria-pressed',t.getAttribute('aria-pressed')!=='true'));
$('rf-x').onclick=()=>$('roomf').hidden=true;
$('rf-go').onclick=async()=>{const o={name:$('rf-name').value,cap:+$('rf-cap').value,pub:$('rf-pub').getAttribute('aria-pressed')==='true',pw:$('rf-pw').value.trim(),theme:$('rf-theme').dataset.v,perm:$('rf-perm').getAttribute('aria-pressed')==='true'};
 $('rf-go').disabled=true;const r=o.perm?await adminOp('room_create',o):await createRoom(o);$('rf-go').disabled=false;
 if(r.error){notify({tone:'err',text:'建立包廂失敗：'+({forbidden:'沒有權限',write:'儲存失敗',net:'連線失敗'}[r.error]||r.error)});return}
 $('roomf').hidden=true;if(o.perm){notify({tone:'ok',text:'已建立官方包廂'});renderLobby();return}const room=r.room;if(o.pw)ROOM.pwCache=o.pw;tryJoin(room.id,o.pw||null)};

// ---------- joining ----------
async function ensureSession(){if(APP.entered)return true;const r=await enterGame();if(r.error){gate(r);return false}APP.entered=true;logLogin();if(ACC.daily)notify({tone:'ok',icon:'gift',title:'每日登入獎勵',text:`獲得 ${ACC.daily} 枚 AVÉRA 代幣（共 ${ACC.coins}）`,ms:6000});return true}
async function tryJoin(id,pw,hint){if(!ACC.exists){APP.pendingRoom=id;openCreator();return}if(!(await ensureSession()))return;
 if(id==='main'){enterRoom(MAIN_ROOM(),false);return}
 const r=await joinRoom(id,pw);
 if(r.error==='password'||r.error==='password_wrong'){const v=await dialog({icon:'key',title:'這個包廂有密碼',text:hint?.name||'',input:{type:'password',ph:'輸入包廂密碼',max:32,err:r.error==='password_wrong'?'密碼不正確，再試一次':''},btns:[{t:'取消'},{t:'進入',pri:true}]});if(v)tryJoin(id,v,hint);else if(location.hash.startsWith('#/r/'))location.hash='#/rooms';return}
 if(r.error){const m={locked:['lock','包廂已上鎖','版主暫時不讓新的人進來，晚點再試試看。'],gone:['door','包廂已關閉','這個包廂已經不存在了，換一個包廂吧。'],no_player:['user','找不到你的角色','請重新整理頁面再試一次。'],net:['signal','連線失敗','請檢查網路後再試一次。']}[r.error]||['alert','無法進入',String(r.error)];
  await dialog({icon:m[0],title:m[1],text:m[2]});if(APP.page!=='rooms'||location.hash!=='#/rooms')location.hash='#/rooms';else renderLobby();return}
 enterRoom(r.room,!!r.full)}
function enterRoom(room,waiting){clearInterval(APP.roomsT);Object.assign(ROOM,{id:room.id,name:room.name,owner:room.owner||null,ownerName:room.owner_name||'',cap:room.cap||12,pub:room.pub!==false,hasPw:!!room.has_pw,locked:!!room.locked,perm:!!room.perm,chan:room.chan||room.id,theme:room.theme||'neon',
  isOwner:!!(room.is_owner||room.mine||(room.owner&&room.owner===ACC.pid))});
 document.body.classList.add('in-room');$('site').hidden=true;$('creator').hidden=true;if(location.hash!=='#/r/'+room.id)history.replaceState(null,'','#/r/'+room.id);
 applyTheme(ROOM.theme);
 if(waiting){showQueue(true);connectNet(ROOM.chan,true)}else roomLoading(ROOM.name,async step=>{connectNet(ROOM.chan,false);step('準備場館…');warmUp();await new Promise(r=>setTimeout(r,250));step('同步玩家…');startPlaying()})}
function startPlaying(){showQueue(false);staffUI();NET.waiting=false;Object.assign(look,ACC.look||look);myName=ACC.name;$('me-name').textContent=myName;
 const so=SFX.on;SFX.on=false;refreshLook();SFX.on=so;myAv.visible=true;
 document.body.classList.add('playing');me.mode='walk';me.x=SPAWN.x+(Math.random()-.5)*2;me.z=SPAWN.z+(Math.random()-.5)*1.4;me.y=0;camera.clearViewOffset();camYaw=0;camCur=camDist;myAv.rotation.y=Math.PI;sfx('go');
 lastInfoKey='';pushInfo(true);sendMove(true,true);requeryLanes();roomBeat();APP.lastInput=performance.now();APP.ownerGoneAt=0;
 notify({key:'welcome',tone:'ok',icon:ROOM.perm?'crown':'door',title:ROOM.name,text:ROOM.isOwner?'你是這個包廂的版主，可以在右上角「包廂」管理設定與邀請朋友。':'歡迎進來！右上角「包廂」可以複製邀請連結。',ms:6000});
 if(ACC.config.motd)notify({key:'motd',tone:'ann',title:'公告',text:ACC.config.motd,ms:10000});
 showZone('1F · 大廳');setTimeout(()=>startTutorial?.(),900)}
// queue: everyone in the room's channel sees who is waiting; the earliest waiters fill free seats
function queueCheck(inCount){if(!NET.waiting){$('rp-cnt')&&renderRoomPanel(true);return}const ahead=NET.queue.filter(q=>q.jt<NET.jt||(q.jt===NET.jt&&q.id<MYID)).length;
 if(inCount+ahead<ROOM.cap){startPlaying();return}$('qu-pos').textContent=ahead+1;$('qu-cnt').textContent=`${inCount} / ${ROOM.cap}`;$('qu-ahead').textContent=ahead?`前面還有 ${ahead} 人`:'你是下一位'}
function showQueue(on){$('queue').hidden=!on;if(on){$('qu-name').textContent=ROOM.name;$('qu-pos').textContent='…';$('qu-cnt').textContent=`— / ${ROOM.cap}`;$('qu-ahead').textContent='正在確認人數…'}}
$('qu-x').onclick=()=>leaveRoom('cancel',{silent:true});

// ---------- leaving ----------
async function leaveRoom(reason,o={}){if(!ROOM.id)return;const was={...ROOM};
 if(reason==='user'&&ROOM.isOwner&&!ROOM.perm&&!o.confirmed&&!o.fromNav){const ok=await dialog({icon:'door',title:'離開並關閉包廂？',text:'你是版主。你離開後，包廂會在 30 秒後自動關閉，大家都會回到大廳。',btns:[{t:'留下來'},{t:'離開',pri:true,danger:true,v:true}]});if(!ok)return;}
 if(ROOM.isOwner&&!ROOM.perm&&['user','afk','switch'].includes(reason)){NET.emit('rm',{t:'closing',sec:30});closeRoomRemote(ROOM.id,30)}
 try{if(me.mode==='cab')closeGame();if(me.mode==='bowl')leaveLane();if(me.mode==='sit')standUp()}catch(e){}
 try{closeTV?.()}catch(e){}if(VOICE.joined)leaveVoice(true);
 disconnectNet();roomBeatStop();clearNotes(n=>n.key!=='coins');togglePop('people',false);togglePop('menu',false);togglePop('emopop',false);$('roompnl').hidden=true;$('queue').hidden=true;
 Object.assign(ROOM,{id:null,isOwner:false,closing:null});APP.ownerGoneAt=0;APP.closingNote=null;APP.afkNote?.close();APP.afkNote=null;
 document.body.classList.remove('in-room','playing','chatting');me.mode='site';myAv.visible=false;
 if(!o.fromNav&&reason!=='switch')location.hash='#/rooms';
 const msg={closed:['door','包廂已關閉','版主離開了，包廂已經關閉。'],kick:['door','你被請出包廂','版主請你離開這個包廂。'],afk:['clock','閒置太久','你太久沒有動作，已自動離開包廂。'],staff_kick:['shield','已被管理員移出包廂',o.why?'原因：'+o.why:'']}[reason];
 if(msg&&!o.silent)dialog({icon:msg[0],title:msg[1],text:msg[2]})}

// ---------- in-room messages (room owner) ----------
const fromOwner=from=>{const p=peers.get(from);return!!(p&&(p.ro||(ROOM.owner&&p.pid===ROOM.owner)))};
onNet('rm',(d,from)=>{if(!ROOM.id)return;
 if(d.t==='closing'&&fromOwner(from)&&!ROOM.isOwner){startClosing(Math.max(5,Math.min(60,d.sec|0)),'版主已離開，包廂將在 {s} 秒後關閉')}
 else if(d.t==='cfg'&&fromOwner(from)){for(const k of ['name','cap','pub','locked','hasPw'])if(d[k]!=null)ROOM[k]=k==='cap'?Math.max(2,Math.min(40,d.cap|0)):k==='name'?cleanName(d.name)||ROOM.name:!!d[k];if(d.theme&&THEMES[d.theme]&&d.theme!==ROOM.theme){ROOM.theme=d.theme;applyTheme(d.theme)}
  notify({key:'rcfg',tone:'info',icon:'door',text:'版主更新了包廂設定',ms:3000});renderRoomPanel(true)}
 else if(d.t==='kick'&&d.to===MYID&&fromOwner(from)){if(isStaff()){notify({tone:'info',icon:'shield',text:'版主試著請你離開，但管理員不受包廂踢除影響',ms:3000,quiet:true});return}leaveRoom('kick')}
 else if(d.t==='theme'&&peers.get(from)?.rk&&THEMES[d.theme]){applyTheme(d.theme)}
 else if(d.t==='busy'&&d.to===MYID){notify({tone:'info',lk:peers.get(from)?.look,text:`${peerName(from)} ${String(d.why||'正在忙').slice(0,40)}，等他忙完就會看到你的邀請`,ms:6000})}});
function startClosing(sec,text){if(APP.closingNote)return;APP.closingNote=notify({key:'closing',tone:'room',prio:true,text,count:sec,onEnd:()=>{APP.closingNote=null;leaveRoom('closed')},btns:[{t:'現在回大廳',fn:()=>{APP.closingNote=null;leaveRoom('closed',{silent:true})}}]})}
setInterval(()=>{if(!ROOM.id||!document.body.classList.contains('playing')||ROOM.perm||ROOM.isOwner||!NET.ok)return;const here=[...peers.values()].some(p=>p.ro||(ROOM.owner&&p.pid===ROOM.owner));
 if(here){APP.ownerGoneAt=0;if(APP.closingNote&&APP.closingNote.reason==='gone'){APP.closingNote.close();APP.closingNote=null;notify({tone:'ok',text:'版主回來了，包廂不會關閉',ms:3000})}return}
 if(!APP.ownerGoneAt)APP.ownerGoneAt=performance.now();else if(performance.now()-APP.ownerGoneAt>15000&&!APP.closingNote){startClosing(30,'版主已離線，包廂將在 {s} 秒後關閉');if(APP.closingNote)APP.closingNote.reason='gone'}},3000);

// ---------- AFK ----------
for(const ev of ['keydown','pointerdown','touchstart','wheel'])addEventListener(ev,()=>{APP.lastInput=performance.now();if(APP.afkNote){APP.afkNote.close();APP.afkNote=null}},{passive:true,capture:true});
setInterval(()=>{if(!document.body.classList.contains('playing'))return;if(typeof ytOpen!=='undefined'&&ytOpen&&YTS.p)APP.lastInput=performance.now();
 const idle=(performance.now()-APP.lastInput)/1000;if(idle>480&&!APP.afkNote){APP.afkNote=notify({key:'afk',tone:'warn',prio:true,icon:'clock',title:'你還在嗎？',text:'你已經 8 分鐘沒有動作，{s} 秒後會自動離開包廂',count:120,btns:[{t:'我還在',pri:true,fn:()=>{APP.lastInput=performance.now();APP.afkNote=null}}],onEnd:()=>{APP.afkNote=null;leaveRoom('afk')}})}},5000);

// ---------- account-level events (bans, kicks, announcements, profile changes) ----------
onBackEvent=ev=>{const d=ev.data||{};switch(ev.op){
 case 'replaced':gate({error:'replaced'});break;
 case 'ban':gate({error:'banned',reason:d.reason,until:d.until});break;
 case 'kick':if(ROOM.id)leaveRoom('staff_kick',{why:d.reason});break;
 case 'mute':ACC.mutedUntil=d.minutes?Date.now()+d.minutes*6e4:0;notify({tone:d.minutes?'warn':'ok',icon:d.minutes?'volx':'mic',title:d.minutes?'你已被禁言':'禁言已解除',text:d.minutes?`${d.minutes} 分鐘內無法聊天與使用麥克風`:'可以正常聊天了',ms:7000});if(d.minutes&&VOICE.micOn)toggleMic();break;
 case 'announce':notify({tone:'ann',prio:true,title:'官方公告'+(d.by?' · '+d.by:''),text:d.text,ms:14000});break;
 case 'profile':loadProfile().then(()=>{applyMyProfile();const w={rename:`管理員把你的暱稱改成「${ACC.name}」`,look:'管理員調整了你的角色外觀',grant:`你獲得了特殊道具「${SPECIAL_ITEMS[d.item]?.n||d.item}」！到設定 →「道具」裝備`,revoke:`道具「${SPECIAL_ITEMS[d.item]?.n||d.item}」已被收回`,coins:`代幣 ${d.delta>0?'+':''}${d.delta}（現在 ${ACC.coins}）`,role:`你的身分變更為「${ROLE_NAME[d.role]||d.role}」`}[d.why];if(w)notify({tone:d.why==='grant'?'ok':'info',icon:d.why==='grant'?'gift':'user',text:w,ms:8000})});break;
 case 'config':loadProfile();break;
 case 'tv':onAdminTV?.(d.op);break}};
onProfile=()=>{applyMyProfile();staffUI()};
onConfig=()=>{const cv=ACC.config.cachev;if(cv&&store.get('cachev',0)!==cv){const was=store.get('cachev',0);store.set('cachev',cv);if(was){const keep=['av-secret','na3-lid','na3-tut2','na3-look','na3-nick','na3-cachev'];try{for(const k of Object.keys(localStorage))if(!keep.includes(k)&&!k.startsWith('avdb:'))localStorage.removeItem(k)}catch(e){}try{caches?.keys().then(ks=>ks.forEach(k=>caches.delete(k)))}catch(e){}notify({tone:'warn',icon:'sync',text:'管理員更新了 AVÉRA，正在重新載入…',ms:3000});setTimeout(()=>location.reload(),1800);return}}
 featureUI();if(ACC.config.maintenance&&!isStaff()&&ROOM.id)gate({error:'maintenance',msg:ACC.config.maint_msg});if(!ROOM.id||ROOM.id==='main')applyTheme(ROOM.id==='main'?ACC.config.theme||'neon':ROOM.theme)};
function applyMyProfile(){if(!ACC.exists)return;const lk=lookKey(ACC.look||look),changed=lk!==lookKey(look)||myName!==ACC.name;Object.assign(look,ACC.look||{});if(ROOM.id){myName=ACC.name;$('me-name').textContent=myName}
 if(changed){const so=SFX.on;SFX.on=false;refreshLook();SFX.on=so;if(me.mode==='site')myAv.visible=false;lastInfoKey='';pushInfo(true)}applyEquip(myAv,ACC.equip,isStaff());setProp(myAv,me.prop)}
let gated=false;async function gate(r){if(gated)return;gated=true;if(ROOM.id){NET.emit('rm',{t:'bye'});disconnectNet();roomBeatStop();ROOM.id=null}
 document.body.classList.remove('in-room','playing');me.mode='site';myAv.visible=false;clearInterval(pollT);
 const until=r.until&&+new Date(r.until)<8e15?new Date(r.until).toLocaleString('zh-TW'):'';
 const m={replaced:['user','已在其他裝置登入','你的帳號剛剛在另一台裝置進入 AVÉRA。\n一個帳號同時只能在一台裝置上遊玩。','在這台繼續'],
  banned:['ban','帳號已被停權',`原因：${r.reason||'違反社群守則'}\n${until?'解除時間：'+until:'停權期限：永久'}\n如有疑問請透過網站「聯絡我們」申訴。`,'回到首頁'],
  maintenance:['gear','維護中',String(r.msg||ACC.config.maint_msg||'AVÉRA 正在維護中，請稍後再回來。'),'回到首頁']}[r.error]||['alert','無法進入',String(r.error),'回到首頁'];
 await dialog({icon:m[0],title:m[1],text:m[2],cancel:false,btns:[{t:m[3],pri:true,v:true}]});if(r.error==='replaced')location.reload();else{location.hash='#/';location.reload()}}

// ---------- room panel (top-right) ----------
function inviteLink(){return location.href.split('#')[0]+'#/r/'+ROOM.id}
function renderRoomPanel(onlyIfOpen){const w=$('roompnl');if(onlyIfOpen&&w.hidden)return;w.replaceChildren();const canEdit=ROOM.isOwner||isStaff();
 const h=document.createElement('div');h.className='mh';h.innerHTML='<b></b><button class="ib" style="width:36px;height:36px" aria-label="關閉"><svg class="i"><use href="#i-close"/></svg></button>';h.querySelector('b').textContent=ROOM.name;h.querySelector('button').onclick=()=>togglePop('roompnl',false);w.append(h);
 const tg=document.createElement('div');tg.className='tags rp-tags';const tag=(cls,ic,tx)=>{const s=document.createElement('span');s.className='tag2 '+cls;s.innerHTML=`<svg class="i"><use href="#i-${ic}"/></svg>`;s.append(tx);tg.append(s)};
 if(ROOM.perm)tag('gold','crown','官方包廂');else tag('','user','版主 '+(ROOM.isOwner?'你':ROOM.ownerName||'—'));tag('mint','users',`${peers.size+1} / ${ROOM.cap}`);if(!ROOM.pub)tag('','link','私人');if(ROOM.hasPw)tag('','key','密碼');if(ROOM.locked)tag('red','lock','上鎖');w.append(tg);
 const inv=document.createElement('div');inv.className='invite';const fld=document.createElement('input');fld.className='fld';fld.readOnly=true;fld.value=inviteLink();const cp=document.createElement('button');cp.className='cb pink sm';cp.innerHTML='<svg class="i sm"><use href="#i-copy"/></svg>複製';
 cp.onclick=async()=>{try{await navigator.clipboard.writeText(fld.value);notify({tone:'ok',text:'已複製邀請連結'+(ROOM.hasPw?'（記得也告訴朋友密碼）':''),ms:3000})}catch(e){fld.select();notify({tone:'info',text:'請長按連結手動複製',ms:3000})}};inv.append(fld,cp);
 if(navigator.share){const sh=document.createElement('button');sh.className='cb ghost sm';sh.innerHTML='<svg class="i sm"><use href="#i-share"/></svg>';sh.setAttribute('aria-label','分享');sh.onclick=()=>navigator.share({title:'AVÉRA · '+ROOM.name,text:`來 AVÉRA 的「${ROOM.name}」一起玩！`,url:fld.value}).catch(()=>{});inv.append(sh)}
 const il=document.createElement('div');il.className='sec';il.innerHTML='<svg class="i sm"><use href="#i-link"/></svg><span>邀請連結</span>';w.append(il,inv);
 if(canEdit&&ROOM.id!=='main'){const s=document.createElement('div');s.className='sec';s.innerHTML='<svg class="i sm"><use href="#i-gear"/></svg><span>包廂設定</span>';w.append(s);
  const f=document.createElement('div');f.className='rpform';f.innerHTML=`<label>名稱<input class="fld" id="rp-name" maxlength="12"></label>
   <label>人數上限 <b id="rp-capv"></b><input type="range" id="rp-cap" min="2" max="40"></label>
   <div class="mrow"><svg class="i"><use href="#i-link"/></svg><span class="grow">列在大廳（公開）</span><button class="tog" id="rp-pub"></button></div>
   <div class="mrow"><svg class="i"><use href="#i-lock"/></svg><span class="grow">上鎖（不讓新的人進來）</span><button class="tog" id="rp-lock"></button></div>
   <label>密碼 <small id="rp-pwst"></small><input class="fld" id="rp-pw" type="password" maxlength="32" placeholder="留空 = 不更改"></label>
   <label>燈光主題<div class="thms" id="rp-theme"></div></label>
   <div class="rpbtns">${ROOM.hasPw?'<button class="cb ghost sm" id="rp-nopw">移除密碼</button>':''}<button class="cb pink sm" id="rp-save">儲存設定</button></div>`;w.append(f);
  $('rp-name').value=ROOM.name;$('rp-cap').value=ROOM.cap;$('rp-capv').textContent=ROOM.cap;$('rp-cap').oninput=()=>$('rp-capv').textContent=$('rp-cap').value;
  $('rp-pub').setAttribute('aria-pressed',ROOM.pub);$('rp-lock').setAttribute('aria-pressed',ROOM.locked);$('rp-pwst').textContent=ROOM.hasPw?'（目前有密碼）':'（目前沒有）';
  for(const id of ['rp-pub','rp-lock'])$(id).onclick=()=>$(id).setAttribute('aria-pressed',$(id).getAttribute('aria-pressed')!=='true');renderThemePick($('rp-theme'),ROOM.theme);
  const save=async(extra={})=>{const patch={name:$('rp-name').value,cap:+$('rp-cap').value,pub:$('rp-pub').getAttribute('aria-pressed')==='true',locked:$('rp-lock').getAttribute('aria-pressed')==='true',theme:$('rp-theme').dataset.v,...extra};const pw=$('rp-pw').value.trim();if(pw&&extra.pw==null)patch.pw=pw;
   const r=await updateRoom(patch);if(r.error){notify({tone:'err',text:'儲存失敗：'+r.error});return}
   Object.assign(ROOM,{name:cleanName(patch.name)||ROOM.name,cap:Math.max(2,Math.min(40,patch.cap)),pub:patch.pub,locked:patch.locked});if(patch.pw!=null)ROOM.hasPw=!!patch.pw;if(patch.theme!==ROOM.theme){ROOM.theme=patch.theme;applyTheme(patch.theme)}
   NET.emit('rm',{t:'cfg',name:ROOM.name,cap:ROOM.cap,pub:ROOM.pub,locked:ROOM.locked,hasPw:ROOM.hasPw,theme:ROOM.theme});notify({tone:'ok',text:'包廂設定已更新',ms:2500});renderRoomPanel()};
  $('rp-save').onclick=()=>save();if($('rp-nopw'))$('rp-nopw').onclick=()=>save({pw:''})}
 const ms=document.createElement('div');ms.className='sec';ms.innerHTML=`<svg class="i sm"><use href="#i-users"/></svg><span id="rp-cnt">成員 ${peers.size+1} 人</span>`;w.append(ms);
 const lst=document.createElement('div');lst.className='rpm';const mrow=(name,lk,tag,btn)=>{const r=document.createElement('div');r.className='prow';r.append(pfEl(lk));const n=document.createElement('div');n.className='mid';const nm=document.createElement('div');nm.className='nm';const sp=document.createElement('span');sp.textContent=name;nm.append(sp);if(tag){const t=document.createElement('span');t.className='tag2 gold';t.textContent=tag;nm.append(t)}n.append(nm);r.append(n);if(btn)r.append(btn);lst.append(r)};
 mrow(myName+'（你）',look,ROOM.isOwner?'版主':ROLE_RANK[ACC.role]?ROLE_NAME[ACC.role]:'');
 for(const p of peers.values()){if(!p.look)continue;let b=null;if(ROOM.isOwner&&!p.rk){b=document.createElement('button');b.className='cb ghost sm';b.textContent='請離開';b.onclick=async()=>{const ok=await dialog({icon:'door',title:`請 ${p.name} 離開包廂？`,text:'對方會回到大廳，之後仍可以重新進來（除非你上鎖或設密碼）。',btns:[{t:'取消'},{t:'請離開',pri:true,danger:true,v:true}]});if(ok){NET.emit('rm',{t:'kick',to:p.id});notify({tone:'info',text:`已請 ${p.name} 離開`,ms:2500})}}}
  mrow(p.name,p.look,p.ro?'版主':p.rk?ROLE_NAME[p.rk]:'',b)}w.append(lst);
 const lv=document.createElement('button');lv.className='cb ghost wide';lv.innerHTML='<svg class="i"><use href="#i-exit"/></svg><span></span>';lv.querySelector('span').textContent=ROOM.isOwner&&!ROOM.perm?'離開並關閉包廂':'離開包廂';lv.onclick=()=>leaveRoom('user');w.append(lv)}
$('b-room').onclick=()=>togglePop('roompnl');
onNet('adm',()=>pollNow());
function staffUI(){$('b-admin').hidden=!isStaff()}

// ---------- boot into the website ----------
async function siteBoot(){$('ldg').textContent='';myAv.visible=false;if(me.mode==='preview')me.mode='site';
 try{await initBackend()}catch(e){console.warn(e)}
 if(ACC.exists){Object.assign(look,ACC.look||look);const so=SFX.on;SFX.on=false;refreshLook();SFX.on=so;myAv.visible=false;$('nav-me').hidden=false;$('nav-me').replaceChildren(pfEl(look),Object.assign(document.createElement('span'),{textContent:ACC.name}));$('nav-play').textContent='進入包廂'}
 if(BK.netErr)notify({tone:'warn',text:'暫時連不上 AVÉRA 伺服器，部分功能可能無法使用',ms:8000});
 route()}
$('contact-f').addEventListener('submit',async e=>{e.preventDefault();const body=$('cf-body').value.trim();if(body.length<5){notify({tone:'warn',text:'內容至少 5 個字'});return}await initBackend();
 const r=await sendReport($('cf-kind').value,$('cf-target').value.trim(),body,{from:'website',ua:navigator.userAgent.slice(0,120)});
 if(r.ok){$('cf-body').value='';$('cf-target').value='';$('cf-cnt').textContent='0 / 1000';dialog({icon:'check',title:'已送出',text:'謝謝你！管理員會在後台查看並處理。',color:'var(--mint)'})}else notify({tone:'err',text:{rate:'送出太頻繁了，請一小時後再試',length:'內容太短或太長',net:'連線失敗，請稍後再試'}[r.error]||'送出失敗'})});
$('cf-body').oninput=()=>$('cf-cnt').textContent=$('cf-body').value.length+' / 1000';

function featureUI(){$('b-tv').hidden=!featureOn('tv');$('a-chat').hidden=!featureOn('chat');$('a-mic').hidden=!featureOn('voice');$('lb-new').hidden=!featureOn('rooms');if(!featureOn('chat')&&!$('chatbar').hidden)closeChat()}
