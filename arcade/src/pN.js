
// ================= notifications: one stack, never overlapping =================
// Every message in the game goes through notify(). Items stack in one column; when the column is full the rest wait.
const NS={live:[],wait:[],seq:0,hold:false};
const N_ICON={info:'info',ok:'check',warn:'alert',err:'alert',ann:'megaphone',invite:'userplus',room:'clock',tip:'hand',zone:''};
function nMax(){return NS.hold?0:innerWidth<560||innerHeight<500?2:3}
function nPump(){while(NS.live.length<nMax()&&NS.wait.length)nShow(NS.wait.shift())}
function notify(o){o={tone:'info',ms:6000,btns:[],...o};
 if(o.key){const ex=NS.live.find(n=>n.key===o.key)||NS.wait.find(n=>n.key===o.key);if(ex){const id=ex.id,el=ex.el;Object.assign(ex,o);ex.id=id;ex.el=el;if(el){nRender(ex);nArm(ex)}return nHandle(ex)}}
 o.id=++NS.seq;
 if(NS.live.length>=(NS.hold&&o.prio?1:nMax())){
  if(o.drop)return nHandle(o);
  const z=NS.live.find(n=>n.drop)||(o.prio&&!NS.hold?NS.live.find(n=>!n.prio&&!(n.btns&&n.btns.length)):null);if(z){if(!z.drop&&z.ms){NS.wait.unshift({...z,el:null,id:++NS.seq})}nClose(z,true)}else{if(o.prio)NS.wait.unshift(o);else NS.wait.push(o);return nHandle(o)}}
 nShow(o);return nHandle(o)}
function nHandle(o){return Object.assign(()=>nClose(o),{close:()=>nClose(o),update:t=>{o.text=t;if(o.el)nRender(o)}})}
function nShow(o){const el=document.createElement('div');el.className='nt';o.el=el;nRender(o);
 const st=$('nstack');if(o.prio)st.prepend(el);else st.append(el);NS.live.push(o);nArm(o);
 if(o.tone!=='zone'&&!o.quiet)sfx(o.tone==='ann'||o.tone==='invite'?'chime':'beep')}
function nRender(o){const el=o.el;el.className='nt t-'+o.tone+(o.btns.length?' has-b':'');el.replaceChildren();
 if(o.tone==='zone'){if(o.tag){const f=document.createElement('span');f.className='fl';f.textContent=o.tag;el.append(f)}const t=document.createElement('span');t.textContent=o.text;el.append(t);return}
 if(o.lk)el.append(pfEl(o.lk));else{const ic=document.createElement('span');ic.className='ic';ic.innerHTML=`<svg class="i"><use href="#i-${o.icon||N_ICON[o.tone]||'info'}"/></svg>`;el.append(ic)}
 const tx=document.createElement('div');tx.className='tx';if(o.title){const b=document.createElement('b');b.textContent=o.title;tx.append(b)}
 const s=document.createElement('span');s.className='msg';s.textContent=o.count!=null?String(o.text).replace('{s}',Math.max(0,Math.ceil(o.left??o.count))):o.text;tx.append(s);el.append(tx);
 if(o.btns.length){const bw=document.createElement('div');bw.className='btns';for(const b of o.btns){const e=document.createElement('button');e.className='cb sm '+(b.pri?'pink':'ghost');e.textContent=b.t;e.onclick=()=>{nClose(o);b.fn?.()};bw.append(e)}el.append(bw)}
 if(o.ms||o.count!=null){const bar=document.createElement('i');bar.className='bar';el.append(bar)}}
function nArm(o){clearTimeout(o.tm);clearInterval(o.iv);const bar=o.el.querySelector('.bar');
 if(o.count!=null){o.left=o.left??o.count;const t0=performance.now(),L0=o.left;if(bar){bar.style.transition='none';bar.style.transform=`scaleX(${L0/o.count})`;void bar.offsetWidth;bar.style.transition=`transform ${L0}s linear`;bar.style.transform='scaleX(0)'}
  o.iv=setInterval(()=>{o.left=L0-(performance.now()-t0)/1000;const m=o.el.querySelector('.msg');if(m)m.textContent=String(o.text).replace('{s}',Math.max(0,Math.ceil(o.left)));if(o.left<=0){clearInterval(o.iv);nClose(o);o.onEnd?.()}},250);return}
 if(o.ms){if(bar){bar.style.transition='none';bar.style.transform='scaleX(1)';void bar.offsetWidth;bar.style.transition=`transform ${o.ms}ms linear`;bar.style.transform='scaleX(0)'}o.tm=setTimeout(()=>nClose(o),o.ms)}}
function nClose(o,fast){clearTimeout(o.tm);clearInterval(o.iv);const wi=NS.wait.indexOf(o);if(wi>=0){NS.wait.splice(wi,1);return}
 const i=NS.live.indexOf(o);if(i<0)return;NS.live.splice(i,1);const el=o.el;o.el=null;if(el){el.classList.add('out');setTimeout(()=>el.remove(),fast?0:220)}o.onClose?.();
 setTimeout(()=>{while(NS.live.length<nMax()&&NS.wait.length)nShow(NS.wait.shift())},fast?0:240)}
function clearNotes(filter){for(const o of [...NS.live,...NS.wait])if(!filter||filter(o))nClose(o,true)}
// keep the stack clear of whatever occupies the top of the screen right now
function layoutN(){const st=$('nstack');if(!st)return;let top=0;const mb=document.body.classList;
 const under=id=>{const e=$(id);if(e&&!e.hidden&&e.getClientRects().length){const r=e.getBoundingClientRect();if(r.height)top=Math.max(top,r.bottom)}};
 if(mb.contains('in-mach')){top=8}else{under('me-btn');under('tr');if(innerWidth<760){under('party-strip');under('talkers');under('loc')}under('score')}
 st.style.top=Math.round(top+10)+'px'}
setInterval(layoutN,300);addEventListener('resize',layoutN);
// legacy helpers route here
function toast(text,btns=[],ms=15000,lk){return notify({text,lk,ms:btns.length?ms:Math.min(ms,6000),tone:btns.length?'invite':'info',btns:btns.map(b=>({t:String(b.t).replace(/^[\p{Extended_Pictographic}️‍\s]+/u,''),pri:b.pri,fn:b.fn})),prio:btns.length>0})}
function showZone(t){const[a,b]=t.includes(' · ')?t.split(' · '):['',t];$('loc-f').textContent=a;$('loc-f').hidden=!a;$('loc-t').textContent=b;const l=$('loc');l.classList.remove('flash');void l.offsetWidth;l.classList.add('flash')}

// ================= who is talking (top-left) =================
let talkKey='';
function updateTalkers(){const list=[];if(me.talk)list.push({name:myName,look});for(const p of peers.values())if(p.talk&&p.look)list.push({name:p.name,look:p.look});
 const key=list.map(x=>x.name).join('|');if(key===talkKey)return;talkKey=key;const el=$('talkers');el.hidden=!list.length;if(!list.length)return;el.replaceChildren();
 const w=document.createElement('span');w.className='wv';w.innerHTML='<i></i><i></i><i></i>';el.append(w);
 for(const x of list.slice(0,4)){const pf=pfEl(x.look,true);el.append(pf)}
 const t=document.createElement('span');t.className='who';t.textContent=(list.length>2?list.slice(0,2).map(x=>x.name).join('、')+` 等 ${list.length} 人`:list.map(x=>x.name).join('、'))+' 正在說話';el.append(t)}
setInterval(()=>{if(document.body.classList.contains('playing'))updateTalkers()},200);

// ================= mic waveform (bottom-right) =================
const micBars=[...document.querySelectorAll('#a-mic .wave i')];let micLvl=0;
function micWave(level,on){const b=$('a-mic');b.classList.toggle('talking',!!on);if(!on){micLvl=0;return}micLvl+= (level-micLvl)*.5;const t=performance.now()/1000;
 micBars.forEach((e,i)=>{const k=[.55,.85,1,.8,.6][i];const v=Math.max(.18,Math.min(1,micLvl*k*(.75+.25*Math.sin(t*14+i*1.7))));e.style.transform=`scaleY(${v.toFixed(3)})`})}

// ================= network quality =================
const NETH={samples:[],fps:60,ft:0,fn:0};
function netSample(){NETH.samples.push(net.self);if(NETH.samples.length>40)NETH.samples.shift()}
setInterval(netSample,1500);
const netLabel=v=>v==null?'連線中':v<60?'極佳':v<120?'良好':v<250?'普通':'不穩定';
function netJitter(){const s=NETH.samples.filter(v=>v!=null);if(s.length<3)return null;let d=0;for(let i=1;i<s.length;i++)d+=Math.abs(s[i]-s[i-1]);return Math.round(d/(s.length-1))}
const QCOL={'q-g':[79,227,176],'q-y':[255,210,94],'q-r':[255,97,120],'q-n':[163,155,210]};
function drawSpark(c,q){const g=c.getContext('2d'),w=c.width,h=c.height;g.clearRect(0,0,w,h);const s=NETH.samples;if(s.length<2)return;const mx=Math.max(120,...s.filter(v=>v!=null))*1.15;
 g.lineWidth=2*devicePixelRatio;g.lineJoin='round';const rgb=QCOL[q]||QCOL['q-n'],col=`rgb(${rgb})`;const grd=g.createLinearGradient(0,0,0,h);grd.addColorStop(0,`rgba(${rgb},.35)`);grd.addColorStop(1,'rgba(0,0,0,0)');
 const X=i=>i/(39)*w,Y=v=>h-4-(v/mx)*(h-8);g.beginPath();let first=true;s.forEach((v,i)=>{if(v==null)return;const x=X(i+40-s.length),y=Y(v);if(first){g.moveTo(x,y);first=false}else g.lineTo(x,y)});
 g.strokeStyle=col;g.stroke();g.lineTo(w,h);g.lineTo(X(40-s.length),h);g.closePath();g.fillStyle=grd;g.fill()}
function netCard(){const v=net.self,c=document.createElement('div');c.className='netcard q-bg-'+qc(v).slice(2);
 const mode=NET.mode==='supabase'?'AVÉRA 亞太伺服器':NET.mode==='claude'?'預覽連線':NET.mode==='local'?'本機測試':'未連線';
 const j=netJitter();c.innerHTML=`<div class="nc-top"><span class="sig ${qc(v)} ${lvlOf(v)}"><i></i><i></i><i></i><i></i></span><b class="${qc(v)}">${v==null?'—':v}<small>ms</small></b><span class="nc-l ${qc(v)}">${netLabel(v)}</span></div><canvas class="${qc(v)}" width="${280*devicePixelRatio|0}" height="${44*devicePixelRatio|0}"></canvas><div class="nc-g"><span>抖動<b>${j==null?'—':j+'ms'}</b></span><span>語音<b>${VOICE.joined?latTxt(net.voice):'未加入'}</b></span><span>畫面<b>${Math.round(NETH.fps)} FPS</b></span><span>線路<b>${mode}</b></span></div>`;
 drawSpark(c.querySelector('canvas'),qc(v));return c}
