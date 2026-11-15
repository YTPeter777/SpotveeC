
// ================= notification styles, seats, account page, admin page =================
// ---- notification preferences: on/off, template, accent colour, animation ----
const NOTI={on:store.get('noti_on',true),tpl:store.get('noti_tpl','candy'),col:store.get('noti_col','#ff8cc4'),anim:store.get('noti_anim','pop')};
const NTPL=[['candy','糖果'],['glass','透明玻璃'],['neon','霓虹框'],['mini','極簡']],NANIM=[['pop','彈跳'],['slide','滑入'],['fade','淡入'],['none','不動']],NCOLS=['#ff8cc4','#7fd2ff','#4fe3b0','#ffd25e','#c9b4ff','#ff9a5c'];
function applyNoti(){const b=document.body;for(const[k]of NTPL)b.classList.toggle('nt-'+k,NOTI.tpl===k);for(const[k]of NANIM)b.classList.toggle('na-'+k,NOTI.anim===k);document.documentElement.style.setProperty('--ntc',NOTI.col)}
applyNoti();
const _notify=notify;notify=function(o){if(!NOTI.on&&!o.prio&&!['ann','room','err','warn'].includes(o.tone||'info')&&!(o.btns&&o.btns.length))return nHandle({...o,el:null});return _notify(o)};
function renderNotiSettings(){const w=$('st-noti');w.replaceChildren();const row=document.createElement('div');row.className='mrow';row.innerHTML='<svg class="i"><use href="#i-megaphone"/></svg><span class="grow">一般通知<small>關掉後仍會顯示公告、邀請與重要提醒</small></span><button class="tog"></button>';const tg=row.querySelector('.tog');tg.setAttribute('aria-pressed',NOTI.on);tg.onclick=()=>{NOTI.on=!NOTI.on;store.set('noti_on',NOTI.on);renderNotiSettings()};w.append(row);
 const seg=(title,list,key)=>{const l=document.createElement('div');l.className='slab';l.textContent=title;const g=document.createElement('div');g.className='seg';g.style.gridTemplateColumns=`repeat(${list.length},1fr)`;for(const[k,n]of list){const b=document.createElement('button');b.textContent=n;b.setAttribute('aria-pressed',NOTI[key]===k);b.onclick=()=>{NOTI[key]=k;store.set('noti_'+key,k);applyNoti();renderNotiSettings();notify({tone:'info',text:'這是通知的樣子',ms:2500})};g.append(b)}w.append(l,g)};
 seg('樣式',NTPL,'tpl');seg('動畫',NANIM,'anim');const cl=document.createElement('div');cl.className='slab';cl.textContent='顏色';const cg=document.createElement('div');cg.className='thms';for(const c of NCOLS){const b=document.createElement('button');b.className='thm';b.style.background=c;b.setAttribute('aria-pressed',NOTI.col===c);b.onclick=()=>{NOTI.col=c;store.set('noti_col',c);applyNoti();renderNotiSettings()};cg.append(b)}w.append(cl,cg)}
// ---- seats: one animal per seat ----
const _sitDown=sitDown;sitDown=function(t){const sx=t.seat.x,sz=t.seat.z;for(const p of peers.values()){if(p.pose==='sit'&&p.av&&Math.hypot(p.av.position.x-sx,p.av.position.z-sz)<.35){notify({key:'seat',tone:'info',icon:'sofa',text:'這個位子有人坐了，換一個吧',ms:2500,quiet:true});return}}_sitDown(t)};
// ---- website account page: nickname change (14 days / 2 times) ----
function renderAccountPage(){const w=$('acct-body');if(!w)return;w.replaceChildren();if(!ACC.exists){const b=document.createElement('button');b.className='cb pink';b.textContent='建立角色';b.onclick=()=>openCreator();w.append(b);return}
 w.append(profCard());const rs=renameState();const r=document.createElement('div');r.className='mrow';r.innerHTML=`<svg class="i"><use href="#i-edit"/></svg><span class="grow">暱稱：<b></b><small>${isStaff()?'管理員不受次數限制':rs.left>0?`14 天內還能改 ${rs.left} 次`:'下次可改：'+new Date(rs.next).toLocaleDateString('zh-TW')}</small></span>`;r.querySelector('b').textContent=ACC.name;const bt=document.createElement('button');bt.className='cb ghost sm';bt.textContent='更改';bt.onclick=()=>$('b-rename').click();r.append(bt);w.append(r);
 const n=document.createElement('p');n.className='note';n.textContent='角色外觀建立後無法自行更改；代幣、道具與排行榜都跟著這個帳號。';w.append(n)}
// ---- dedicated admin page: strangers see a 404, admins need a password every 8 hours ----
const ADMPAGE=typeof ADMIN_PAGE!=='undefined'||location.hash.startsWith('#/admin');
async function adminGate(){document.body.classList.add('adminpage');$('site').hidden=true;me.mode='site';await initBackend();
 if(!isStaff()){$('nf').hidden=false;flagProbe();return}
 const tok=store.get('admtok',null);if(tok&&tok.exp>Date.now()&&tok.id===(ACC.pid||BK.uid)){openAdmin();$('adm-x').hidden=true;return}
 const hasPw=await adminPw('has');const v=await dialog({icon:'shield',title:hasPw?'後台登入':'第一次使用：設定後台密碼',text:hasPw?'請輸入後台密碼（每 8 小時需要重新登入）':'請設定至少 8 個字元的後台密碼',input:{type:'password',max:64},cancel:false,btns:[{t:hasPw?'登入':'設定並進入',pri:true}]});
 if(!v||v.length<(hasPw?1:8)){location.reload();return}const ok=await adminPw(hasPw?'check':'set',v);if(!ok){flagProbe('wrong_password');await dialog({icon:'ban',title:'密碼錯誤',text:'這次嘗試已被記錄。',cancel:false});location.reload();return}
 store.set('admtok',{exp:Date.now()+8*36e5,id:ACC.pid||BK.uid});openAdmin();$('adm-x').hidden=true}
async function adminPw(op,pw){if(BK.mode==='supa'){const r=await rpc('avera_admin_pw',{p_secret:BK.secret,p_op:op,p_pw:pw||null});return op==='has'?!!r.has:!!r.ok}
 const cur=(await dget('staff/'+BK.uid))||{};if(op==='has')return!!cur.pwh;const h=await sha('avera-admin:'+pw);if(op==='set'){await dset('staff/'+BK.uid,{...cur,role:cur.role||ACC.role,pwh:h});return true}return cur.pwh===h}
function flagProbe(why='admin_probe'){const data={why,dev:deviceInfo(),url:location.href.slice(0,120)};if(BK.mode==='supa')rpc('avera_flag',{p_secret:BK.secret||'probe-'+rhex(12),p_kind:'admin_probe',p_data:data});else{dget('reports/'+BK.uid).then(cur=>{cur=cur||{items:[]};dset('reports/'+BK.uid,{name:ACC.name||'訪客',items:[...(cur.items||[]),{id:rhex(4),kind:'cheat',target:'後台',body:`嘗試進入後台（${why}）`,ctx:data,t:Date.now(),status:'open',name:ACC.name||'訪客'}].slice(-30)})})}}
