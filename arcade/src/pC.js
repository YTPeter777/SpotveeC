
// ================= settings =================
let setTab='gen';
document.querySelectorAll('.stabs button').forEach(b=>b.onclick=()=>{setTab=b.dataset.t;renderSettings();sfx('click')});
function renderSettings(){document.querySelectorAll('.stabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===setTab));document.querySelectorAll('.spane').forEach(p=>p.hidden=p.dataset.t!==setTab);
 if(setTab==='gen')renderGen();if(setTab==='snd')renderVols();if(setTab==='gfx')$('st-fps').textContent=Math.round(NETH.fps)+' FPS';if(setTab==='inv')renderInv();if(setTab==='acct')renderAcct()}
function profCard(){const c=document.createElement('div');c.className='profc';c.append(pfEl(look));const t=document.createElement('div');t.className='grow';const b=document.createElement('b');b.textContent=ACC.name||myName;const sm=document.createElement('small');sm.textContent=(isStaff()?ROLE_NAME[ACC.role]+' · ':'')+'ID '+String(ACC.pid||BK.uid||'').slice(0,8);t.append(b,sm);
 const cc=document.createElement('span');cc.className='coinchip';cc.innerHTML=`<svg class="i"><use href="#i-coin"/></svg>${ACC.coins|0}`;c.append(t,cc);return c}
function renderGen(){$('st-prof').replaceChildren(profCard());const rs=renameState();$('st-rn').textContent=isStaff()?'管理員不受次數限制':rs.left>0?`14 天內還能改 ${rs.left} 次`:`下次可改：${new Date(rs.next).toLocaleDateString('zh-TW')}`;$('b-rename').disabled=!isStaff()&&rs.left<=0}
$('b-rename').onclick=async()=>{let err='';for(;;){const rs=renameState();const v=await dialog({icon:'edit',title:'更改暱稱',text:isStaff()?'':`每 14 天最多改 2 次（剩 ${rs.left} 次）`,input:{value:ACC.name,max:12,ph:'2–12 個字',err},btns:[{t:'取消'},{t:'確定更改',pri:true}]});if(v==null)return;
 const r=await renameSelf(v);if(r.ok){myName=ACC.name;$('me-name').textContent=myName;lastInfoKey='';pushInfo(true);notify({tone:'ok',text:`暱稱已改為「${ACC.name}」`,ms:3000});renderSettings();return}
 err={invalid:'請輸入 2–12 個字',same:'跟現在的暱稱一樣',reserved:'包含保留字（管理員、官方、AVÉRA…），請換一個',limit:`14 天內已改過 2 次，${r.next?new Date(r.next).toLocaleDateString('zh-TW')+' 後':'之後'}才能再改`,net:'連線失敗，請稍後再試'}[r.error]||'更改失敗';if(r.error==='limit'){notify({tone:'warn',text:err});return}}};
$('b-tut').onclick=()=>{togglePop('menu',false);startTutorial(true)};
function renderVols(){$('s-sfx').value=Math.round(SFX.vol*100);$('s-voice').value=Math.round(VOICE.vol*100);const w=$('plvols');w.replaceChildren();
 const list=[...peers.values()].filter(p=>p.look);if(!list.length){const e=document.createElement('div');e.className='empty';e.textContent='包廂裡還沒有其他人。';w.append(e);return}
 for(const p of list){const r=document.createElement('div');const v=peerVol(p);r.className='pvol'+(v===0?' muted':'');r.append(pfEl(p.look,p.talk));const n=document.createElement('span');n.className='nm';n.textContent=p.name;
  const sl=document.createElement('input');sl.type='range';sl.min=0;sl.max=100;sl.value=Math.round(v*100);const lb=document.createElement('b');lb.textContent=sl.value+'%';
  const mu=document.createElement('button');mu.className='ib';mu.setAttribute('aria-label','靜音');mu.innerHTML=`<svg class="i"><use href="#i-${v===0?'volx':'volume'}"/></svg>`;
  const set=x=>{VOICE.pv[pvKey(p)]=x;store.set('pvol',VOICE.pv);sl.value=Math.round(x*100);lb.textContent=sl.value+'%';r.classList.toggle('muted',x===0);mu.firstElementChild.firstElementChild.setAttribute('href','#i-'+(x===0?'volx':'volume'))};
  sl.oninput=()=>set(sl.value/100);mu.onclick=()=>set(peerVol(p)===0?1:0);r.append(n,sl,lb,mu);w.append(r)}}
$('s-sfx').oninput=()=>{SFX.vol=$('s-sfx').value/100;store.set('sfxv',+$('s-sfx').value)};$('s-sfx').onchange=()=>sfx('click');
$('s-voice').oninput=()=>{VOICE.vol=$('s-voice').value/100;store.set('vvol',+$('s-voice').value)};
$('t-tags').setAttribute('aria-pressed',store.get('tags',true));document.body.classList.toggle('notags',!store.get('tags',true));
$('t-tags').onclick=()=>{const on=$('t-tags').getAttribute('aria-pressed')!=='true';$('t-tags').setAttribute('aria-pressed',on);store.set('tags',on);document.body.classList.toggle('notags',!on)};
function renderInv(){const w=$('st-inv');w.replaceChildren();const cc=profCard();w.append(cc);const own=(ACC.items||[]).filter(k=>SPECIAL_ITEMS[k]);
 if(!own.length){const e=document.createElement('div');e.className='empty';e.textContent='你還沒有特殊道具。特殊道具由 AVÉRA 管理員在活動或比賽中發放。';w.append(e);return}
 const g=document.createElement('div');g.className='invg';for(const k of own){const it=SPECIAL_ITEMS[k];const b=document.createElement('button');b.className='itm';const on=ACC.equip?.[it.slot]===k;b.setAttribute('aria-pressed',on);
  b.innerHTML=`<small></small><b></b><small>${on?'裝備中 · 點一下卸下':'點一下裝備'}</small>`;b.querySelector('small').textContent=SLOT_NAME[it.slot]||it.slot;b.querySelector('b').textContent=it.n;
  b.onclick=async()=>{const r=await equipItem(it.slot,on?null:k);if(r.error){notify({tone:'err',text:'裝備失敗'});return}applyEquip(myAv,ACC.equip);lastInfoKey='';pushInfo(true);renderInv()};g.append(b)}w.append(g)}
function renderAcct(){const w=$('st-acct');w.replaceChildren();w.append(profCard());const p=t=>{const e=document.createElement('p');e.className='note';e.style.margin='4px 4px';e.textContent=t;w.append(e);return e};
 p('一個帳號同一時間只能在一台裝置上遊玩；在另一台裝置進入時，這台會自動離線。');
 if(BK.mode==='supa'){const s=document.createElement('div');s.className='sec';s.innerHTML='<svg class="i sm"><use href="#i-key"/></svg><span>轉移到其他裝置</span>';w.append(s);
  const c=document.createElement('div');c.className='code';const f=document.createElement('input');f.className='fld';f.readOnly=true;f.type='password';f.value=BK.secret.match(/.{1,6}/g).join('-');const sh=document.createElement('button');sh.className='cb ghost sm';sh.textContent='顯示';sh.onclick=()=>{f.type=f.type==='password'?'text':'password';sh.textContent=f.type==='password'?'顯示':'隱藏'};
  const cp=document.createElement('button');cp.className='cb pink sm';cp.textContent='複製';cp.onclick=async()=>{try{await navigator.clipboard.writeText(f.value);notify({tone:'ok',text:'已複製轉移碼，請妥善保管，不要給別人',ms:4000})}catch(e){f.type='text';f.select()}};c.append(f,sh,cp);w.append(c);
  p('在新裝置的設定 → 帳號輸入這組轉移碼，就能用同一個帳號遊玩。轉移碼等於你的帳號，千萬不要給別人。');
  const u=document.createElement('button');u.className='cb ghost wide';u.innerHTML='<svg class="i"><use href="#i-link"/></svg><span>在這台裝置使用轉移碼</span>';u.onclick=async()=>{const v=await dialog({icon:'key',title:'輸入轉移碼',text:'這台裝置目前的帳號會被換掉（請先記下它的轉移碼）。',input:{ph:'xxxxxx-xxxxxx-…',max:80},btns:[{t:'取消'},{t:'使用',pri:true}]});
   const code=String(v||'').replace(/[^0-9a-f]/gi,'').toLowerCase();if(!code)return;if(code.length<24){notify({tone:'err',text:'轉移碼格式不正確'});return}try{localStorage.setItem('av-secret',code)}catch(e){}location.reload()};w.append(u);
  const s2=document.createElement('div');s2.className='sec';s2.innerHTML='<svg class="i sm"><use href="#i-shield"/></svg><span>管理員</span>';w.append(s2);
  if(!isStaff()){const k=document.createElement('button');k.className='cb ghost wide';k.innerHTML='<svg class="i"><use href="#i-key"/></svg><span>輸入站長金鑰</span>';k.onclick=async()=>{const v=await dialog({icon:'shield',title:'站長金鑰',text:'只有 AVÉRA 站長持有這組金鑰。',input:{type:'password',max:60},btns:[{t:'取消'},{t:'驗證',pri:true}]});if(!v)return;const r=await claimOwner(v);if(r.ok){notify({tone:'ok',text:'驗證成功，你現在是站長',ms:5000});lastInfoKey='';pushInfo(true);renderAcct()}else notify({tone:'err',text:'金鑰不正確'})};w.append(k)}}
 else p(IN_CLAUDE?'預覽版的帳號跟著你的 claude.ai 帳號，不需要轉移碼。':'這是本機測試帳號。');
 if(isStaff()){const a=document.createElement('button');a.className='cb lemon wide';a.innerHTML='<svg class="i"><use href="#i-shield"/></svg><span>開啟後台</span>';a.onclick=()=>{togglePop('menu',false);openAdmin()};w.append(a)}}
document.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>showDocModal(b.dataset.doc));
// report form
function openReport(kind,target){const f=$('repf');f.hidden=false;$('rp-kind').value=kind||'bug';$('repf-t').textContent=kind==='contact'?'聯絡我們':'回報問題';const s=$('rp-tgt');s.replaceChildren(new Option('（不指定）',''));for(const p of peers.values())if(p.look)s.append(new Option(p.name,p.name));if(target)s.value=target;$('rp-tgt-l').hidden=$('rp-kind').value!=='player';$('rp-body').value='';togglePop('menu',false)}
$('rp-kind').onchange=()=>$('rp-tgt-l').hidden=$('rp-kind').value!=='player';
$('b-report').onclick=()=>openReport('bug');$('b-contact').onclick=()=>openReport('contact');$('repf-x').onclick=()=>$('repf').hidden=true;
$('repf-f').addEventListener('submit',async e=>{e.preventDefault();const body=$('rp-body').value.trim();if(body.length<5){notify({tone:'warn',text:'內容至少 5 個字'});return}
 const r=await sendReport($('rp-kind').value,$('rp-tgt').value,body,{room:ROOM.id,roomName:ROOM.name,mode:me.mode,game:me.mode==='cab'?curGame:'',ping:net.self,fps:Math.round(NETH.fps),ua:navigator.userAgent.slice(0,120)});
 if(r.ok){$('repf').hidden=true;notify({tone:'ok',title:'已送出',text:'謝謝你！管理員會在後台查看並處理。',ms:5000})}else notify({tone:'err',text:{rate:'送出太頻繁了，請一小時後再試',length:'內容太短或太長',net:'連線失敗'}[r.error]||'送出失敗'})});
