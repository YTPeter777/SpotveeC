
// ================= mini-games =================
const gc=$('gc'),gx=gc.getContext('2d');let G=null,curGame='',curTarget=null;const best=store.get('best',{});
const GW=360,GH=540;
function gbg(g,a,b){const gr=g.createLinearGradient(0,0,0,GH);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,0,GW,GH)}
function gtext(g,t,x,y,size=20,col='#fff',w=800){g.font=`${w} ${size}px "Baloo 2","Noto Sans TC",sans-serif`;g.fillStyle=col;g.textAlign='center';g.textBaseline='middle';g.fillText(t,x,y)}
function setStats(){const box=$('cabs');if(!G)return;box.replaceChildren();
 if(G.vs){const v=document.createElement('div');v.className='vsb';v.append(pfEl(look));v.insertAdjacentHTML('beforeend',`<b>${G.score|0}</b><i>:</i><b>${G.oppScore|0}</b>`);const op=MATCH&&peers.get(MATCH.opp);if(op?.look)v.append(pfEl(op.look));box.append(v)}
 else box.insertAdjacentHTML('beforeend',`<div class="led"><small>SCORE</small><b>${String(G.score|0).padStart(4,'0')}</b></div><div class="led"><small>BEST</small><b>${String(best[curGame]||0).padStart(4,'0')}</b></div>`)}
function setTitle(k,mode){$('cabbox').style.setProperty('--gcol',GAMES[k].col);$('cabt').innerHTML=`${esc(GAMES[k].name)}<small>${mode==='vs'?'VERSUS · 雙人對戰':mode==='ai'?'VS CPU · 和電腦玩':mode==='lobby'?'2 PLAYERS':'ARCADE'}</small>`}
const PAD_ICON={'◀':'left','▶':'right','▲':'up','▼':'down'};
function buildPad(list,cols){const p=$('pad');p.replaceChildren();const rows=list?Math.ceil(list.length/(cols||list.length)):0;$('cabbox').style.setProperty('--padh',rows*68+'px');if(!list){p.hidden=true;return}p.hidden=false;p.style.gridTemplateColumns=`repeat(${cols||list.length},auto)`;
 for(const b of list){if(!b){p.append(document.createElement('span'));continue}const e=document.createElement('button');const ic=PAD_ICON[b.t];e.className='ab'+(ic?'':' go')+(/^l[0-3]$/.test(b.code)?' c'+b.code[1]:'');e.innerHTML=ic?`<svg class="i"><use href="#i-${ic}"/></svg>`:esc(b.t);e.setAttribute('aria-label',b.t);
  const dn=ev=>{ev.preventDefault();e.classList.add('down');G?.key?.(b.code,true)},up=()=>{e.classList.remove('down');G?.key?.(b.code,false)};e.addEventListener('pointerdown',dn);e.addEventListener('pointerup',up);e.addEventListener('pointerleave',up);e.addEventListener('pointercancel',up);p.append(e)}}
function gameOverSolo(score){if(score>(best[curGame]||0)){best[curGame]=score;store.set('best',best)}setStats();if(score>0)announce(`在${GAMES[curGame].name}拿到 ${score} 分`);sfx(score>0?'win':'lose')}
function drawOver(g,lines,sub='點一下再玩一次'){g.fillStyle='rgba(10,6,30,.7)';g.fillRect(0,0,GW,GH);g.shadowColor='#ff6fb1';g.shadowBlur=20;gtext(g,lines,GW/2,GH/2-30,lines.length>6?38:50,'#ff6fb1');g.shadowBlur=0;gtext(g,sub,GW/2,GH/2+26,18,'#fff',700)}
let swipe=null;const toG=e=>{const r=gc.getBoundingClientRect();return[(e.clientX-r.left)/r.width*GW,(e.clientY-r.top)/r.height*GH]};
gc.addEventListener('pointerdown',e=>{e.preventDefault();gc.setPointerCapture(e.pointerId);const[x,y]=toG(e);swipe={x:e.clientX,y:e.clientY};G?.down?.(x,y)});
gc.addEventListener('pointermove',e=>{if(!swipe&&e.pointerType!=='mouse')return;const[x,y]=toG(e);G?.move?.(x,y,!!swipe)});
gc.addEventListener('pointerup',e=>{const[x,y]=toG(e);G?.up?.(x,y);if(!swipe)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;swipe=null;if(Math.hypot(dx,dy)<24)return;G?.dir?.(Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)])});
function gameKey(code,down){G?.key?.(code,down)}
function setGame(ng){G=ng;buildPad(G.pad,G.padCols);setStats()}
// ---- opening / closing ----
function openGame(k,opt={}){curGame=k;curTarget=opt.target||null;me.mode='cab';document.body.classList.add('busy');$('cab').hidden=false;setTitle(k,opt.ctx?.mode);
 $('cabhint').textContent=GAMES[k].hint;$('lobby').hidden=true;G=makeGame(k,opt.ctx||{mode:'solo'});buildPad(G.pad,G.padCols);setStats();me.emote=G.pose||'play';me.et=clock.elapsedTime;emoteSeq++;
 if(curTarget?.obj)curTarget.obj.userData.busy=true;if(curTarget?.slotRef?.stand)me.y=curTarget.f+curTarget.slotRef.stand;sendPresence(true)}
function closeGame(){if(me.mode!=='cab')return;setTimeout(flushInvites,700);if(G?.vs&&!G.over)G.link?.send({k:'bye'});if(MATCH)endMatch();if(curTarget?.obj)curTarget.obj.userData.busy=false;
 me.mode='walk';me.pose='';document.body.classList.remove('busy');$('cab').hidden=true;G=null;me.emote='';if(me.slot){leaveStation()}me.y=groundAt(me.x,me.z,me.y+1);sendPresence(true)}
$('cabx').onclick=closeGame;
function gameTick(dt){if(!G||me.mode!=='cab')return;G.t+=dt;if(G.cd>0){G.cd-=dt;if(Math.ceil(G.cd)!==Math.ceil(G.cd+dt)&&G.cd>0)sfx('beep');if(G.cd<=0)sfx('go')}else G.update(dt);G.draw(gx);
 if(G.cd>0){gx.fillStyle='rgba(10,6,30,.55)';gx.fillRect(0,0,GW,GH);gtext(gx,Math.ceil(G.cd),GW/2,GH/2,120,'#ffd864')}if(G.vs)vsTick(dt)}
// ---- factory ----
function makeGame(k,ctx){const G={k,score:0,over:false,t:0,cd:0,vs:ctx.mode==='vs',ai:ctx.mode==='ai',link:ctx.link,host:!!ctx.host,oppName:ctx.oppName,oppScore:0,rng:mulberry(ctx.seed||((Math.random()*1e9)|0)),pose:'play'};
 const setS=s=>{G.score=s;setStats()};const restart=()=>{if(G.over&&!G.vs){const ng=makeGame(k,ctx);G2(ng);return true}return false};const G2=ng=>setGame(ng);
 const finish=()=>{if(G.over)return;G.over=true;if(G.vs){G.link?.send({k:'end',v:G.score});vsCheckEnd()}else gameOverSolo(G.score)};
 if(G.vs&&['racer','hoops','dance'].includes(k))G.cd=3.5;
 const sendScore=()=>{if(G.vs)G.link?.send({k:'sc',v:G.score})};
 if(k==='snake'){const C=18,R=27,cs=20;let sn=[[9,18],[9,19],[9,20]],d=[0,-1],nd=[0,-1],food=[9,8],acc=0,spd=.12;
  const place=()=>{do{food=[Math.floor(Math.random()*C),Math.floor(Math.random()*R)]}while(sn.some(s=>s[0]===food[0]&&s[1]===food[1]))};
  G.dir=v=>{if(restart())return;if(v[0]!==-d[0]||v[1]!==-d[1])nd=v};
  G.key=(c,dn)=>{if(!dn)return;const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0]}[c];if(m)G.dir(m);else if(c==='Space')restart()};
  G.down=()=>{if(G.over)restart()};G.pad=[null,{t:'▲',code:'ArrowUp'},null,{t:'◀',code:'ArrowLeft'},{t:'▼',code:'ArrowDown'},{t:'▶',code:'ArrowRight'}];G.padCols=3;
  G.update=dt=>{if(G.over)return;acc+=dt;while(acc>spd){acc-=spd;d=nd;const h=[sn[0][0]+d[0],sn[0][1]+d[1]];if(h[0]<0||h[1]<0||h[0]>=C||h[1]>=R||sn.some(s=>s[0]===h[0]&&s[1]===h[1])){finish();return}
   sn.unshift(h);if(h[0]===food[0]&&h[1]===food[1]){setS(G.score+10);sfx('coin');spd=Math.max(.06,spd-.003);place()}else sn.pop()}};
  G.draw=g=>{gbg(g,'#0c1a24','#0a0f1e');g.fillStyle='rgba(85,238,180,.06)';for(let i=0;i<C;i++)for(let j=0;j<R;j++)if((i+j)%2)g.fillRect(i*cs,j*cs,cs,cs);
   g.shadowColor='#ff6fb1';g.shadowBlur=16;g.fillStyle='#ff6fb1';g.beginPath();g.arc(food[0]*cs+10,food[1]*cs+10,6+Math.sin(G.t*8)*1.5,0,7);g.fill();g.shadowColor='#55eeb4';
   sn.forEach((s,i)=>{g.fillStyle=i?`hsl(${155-i*1.5},80%,${62-i*.5}%)`:'#c8ffe6';g.beginPath();g.roundRect(s[0]*cs+2,s[1]*cs+2,cs-4,cs-4,6);g.fill()});g.shadowBlur=0;
   const h=sn[0];g.fillStyle='#14202a';g.beginPath();g.arc(h[0]*cs+7,h[1]*cs+8,2.2,0,7);g.arc(h[0]*cs+13,h[1]*cs+8,2.2,0,7);g.fill();if(G.over)drawOver(g,'GAME OVER')}}
 if(k==='stack'){const C=9,rh=36,cw=38;let rows=[{x:2,w:5}],cur={x:0,w:5,dir:1},acc=0,spd=.16,flash=[];
  const drop=()=>{if(restart()||G.over)return;const p=rows[rows.length-1],l=Math.max(p.x,cur.x),r=Math.min(p.x+p.w,cur.x+cur.w);if(r<=l){finish();return}
   for(let x=cur.x;x<cur.x+cur.w;x++)if(x<l||x>=r)flash.push({x,y:rows.length,t:.6});rows.push({x:l,w:r-l});setS(rows.length-1);sfx(r-l===p.w?'coin':'hit');cur={x:0,w:r-l,dir:1};spd=Math.max(.05,spd*.94)};
  G.down=drop;G.key=(c,dn)=>{if(dn&&(c==='Space'||c==='Enter'||c==='drop'))drop()};G.pad=[{t:'放下',code:'drop',w:160}];
  G.update=dt=>{if(G.over)return;acc+=dt;while(acc>spd){acc-=spd;cur.x+=cur.dir;if(cur.x+cur.w>C||cur.x<0){cur.dir*=-1;cur.x+=cur.dir*2}}flash.forEach(f=>f.t-=dt);flash=flash.filter(f=>f.t>0)};
  G.draw=g=>{gbg(g,'#0f1736','#0a0b1e');const off=Math.max(0,rows.length-11),ox=(GW-C*cw)/2;const cell=(x,y,col)=>{const yy=GH-(y-off+1)*rh-8;g.fillStyle=col;g.shadowColor=col;g.shadowBlur=12;g.beginPath();g.roundRect(ox+x*cw+3,yy+3,cw-6,rh-6,7);g.fill()};
   rows.forEach((r,y)=>{for(let x=r.x;x<r.x+r.w;x++)cell(x,y,`hsl(${195+y*9},90%,64%)`)});if(!G.over)for(let x=cur.x;x<cur.x+cur.w;x++)cell(x,rows.length,'#ffffff');flash.forEach(f=>{g.globalAlpha=f.t/.6;cell(f.x,f.y,'#ff6fb1');g.globalAlpha=1});g.shadowBlur=0;if(G.over)drawOver(g,'GAME OVER')}}
 if(k==='mole'){const holes=Array.from({length:9},(_,i)=>({x:60+(i%3)*120,y:170+Math.floor(i/3)*130,up:0,hit:0}));let time=30,next=.5;
  G.down=(x,y)=>{if(restart())return;for(const h of holes)if(h.up>0&&!h.hit&&Math.hypot(x-h.x,y-(h.y+10))<58){h.hit=.3;setS(G.score+1);sfx('hit')}};
  G.key=(c,dn)=>{if(!dn)return;if(c==='Space'){restart();return}const m=/^(?:Digit|Numpad)([1-9])$/.exec(c);if(m){const h=holes[+m[1]-1];G.down(h.x,h.y+10)}};
  G.update=dt=>{if(G.over)return;time-=dt;if(time<=0){finish();return}next-=dt;if(next<=0){const free=holes.filter(h=>h.up<=0);if(free.length)free[Math.floor(Math.random()*free.length)].up=.6+Math.random()*.6;next=.35+Math.random()*.5*(time/30)}holes.forEach(h=>{if(h.up>0)h.up-=dt;if(h.hit>0){h.hit-=dt;if(h.hit<=0){h.up=0;h.hit=0}}})};
  G.draw=g=>{gbg(g,'#2a1f50','#1a1338');gtext(g,Math.max(0,time).toFixed(1)+'s',GW/2,70,30,'#ffd864');
   holes.forEach(h=>{g.fillStyle='#0d0a1e';g.beginPath();g.ellipse(h.x,h.y+30,46,16,0,0,7);g.fill();if(h.up>0){const kk=Math.min(1,h.up*4),yy=h.y+30-38*kk;g.save();g.beginPath();g.rect(h.x-52,h.y-70,104,100);g.clip();
    g.fillStyle=h.hit?'#ff6fb1':'#c48a5c';g.beginPath();g.ellipse(h.x,yy,32,36,0,0,7);g.fill();g.fillStyle='#f1c9a4';g.beginPath();g.ellipse(h.x,yy+10,18,14,0,0,7);g.fill();g.fillStyle='#1d1640';g.beginPath();g.arc(h.x-11,yy-8,4,0,7);g.arc(h.x+11,yy-8,4,0,7);g.fill();g.fillStyle='#ff8fb0';g.beginPath();g.arc(h.x,yy+3,5,0,7);g.fill();g.restore()}
    g.strokeStyle='rgba(255,216,100,.5)';g.lineWidth=3;g.beginPath();g.ellipse(h.x,h.y+30,46,16,0,0,7);g.stroke()});if(G.over)drawOver(g,'TIME UP')}}
 if(k==='brick'){let px=180,ball=null,lives=3,bricks=[];const reset=()=>{ball={x:px,y:470,vx:0,vy:0,stuck:true}};const build=()=>{bricks=[];for(let r=0;r<6;r++)for(let c=0;c<7;c++)bricks.push({x:14+c*48,y:70+r*24,w:44,h:18,col:`hsl(${r*45},85%,65%)`,on:true})};build();reset();
  const launch=()=>{if(restart())return;if(ball.stuck){ball.stuck=false;ball.vx=(Math.random()-.5)*160;ball.vy=-320}};let kl=0,kr=0;
  G.key=(c,dn)=>{if(c==='ArrowLeft'||c==='KeyA')kl=dn;else if(c==='ArrowRight'||c==='KeyD')kr=dn;else if(dn&&(c==='Space'||c==='go'))launch()};G.move=x=>{px=THREE.MathUtils.clamp(x,40,320)};G.down=x=>{px=THREE.MathUtils.clamp(x,40,320);launch()};
  G.pad=[{t:'◀',code:'ArrowLeft'},{t:'發球',code:'go',w:110},{t:'▶',code:'ArrowRight'}];
  G.update=dt=>{if(G.over)return;px=THREE.MathUtils.clamp(px+((kr?1:0)-(kl?1:0))*360*dt,40,320);if(ball.stuck){ball.x=px;ball.y=470;return}
   ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;if(ball.x<8||ball.x>352){ball.vx*=-1;ball.x=THREE.MathUtils.clamp(ball.x,8,352);sfx('click')}if(ball.y<8){ball.vy=Math.abs(ball.vy)}
   if(ball.y>482&&ball.y<498&&Math.abs(ball.x-px)<42&&ball.vy>0){ball.vy=-Math.abs(ball.vy)*1.02;ball.vx=(ball.x-px)*7;sfx('pop')}
   if(ball.y>545){lives--;sfx('lose');if(lives<=0){finish();return}reset()}
   for(const b of bricks)if(b.on&&ball.x>b.x-6&&ball.x<b.x+b.w+6&&ball.y>b.y-6&&ball.y<b.y+b.h+6){b.on=false;ball.vy*=-1;setS(G.score+10);sfx('hit');break}
   if(bricks.every(b=>!b.on)){build();reset();ball.vy*=1.1}};
  G.draw=g=>{gbg(g,'#1f1238','#0c0a1e');for(const b of bricks)if(b.on){g.fillStyle=b.col;g.shadowColor=b.col;g.shadowBlur=8;g.beginPath();g.roundRect(b.x,b.y,b.w,b.h,5);g.fill()}g.shadowBlur=0;
   g.fillStyle='#fff';g.beginPath();g.roundRect(px-40,488,80,12,6);g.fill();g.fillStyle='#ffd864';g.beginPath();g.arc(ball.x,ball.y,7,0,7);g.fill();gtext(g,'♥'.repeat(lives),40,24,18,'#ff6fb1');if(ball.stuck&&!G.over)gtext(g,'點一下或按發球',GW/2,420,16,'#d8d0ff',700);if(G.over)drawOver(g,'GAME OVER')}}
 if(k==='racer'){const LANE=[90,180,270];let lane=1,cx=180,obs=[],dist=0,speed=260,spawn=0,alive=true,shake=0,opp={d:0,alive:true,lane:1};G.opp=opp;
  const mv=d=>{if(restart())return;if(!alive)return;lane=THREE.MathUtils.clamp(lane+d,0,2);sfx('click')};G.key=(c,dn)=>{if(!dn)return;if(c==='ArrowLeft'||c==='KeyA')mv(-1);else if(c==='ArrowRight'||c==='KeyD')mv(1);else if(c==='Space')restart()};
  G.dir=v=>{if(v[0])mv(v[0])};G.down=x=>{if(G.over&&!G.vs){restart();return}mv(x<GW/2?-1:1)};G.pad=[{t:'◀',code:'ArrowLeft',w:90},{t:'▶',code:'ArrowRight',w:90}];G.pose='drive';
  G.update=dt=>{if(G.over)return;if(!alive)return;speed+=dt*9;dist+=speed*dt;cx+=(LANE[lane]-cx)*Math.min(1,dt*14);spawn-=dt*speed;
   if(spawn<=0){spawn=240+G.rng()*160;const l=Math.floor(G.rng()*3);obs.push({l,y:-60,c:`hsl(${G.rng()*360},80%,62%)`});if(G.rng()<.35)obs.push({l:(l+1+Math.floor(G.rng()*2))%3,y:-60-G.rng()*40,c:`hsl(${G.rng()*360},80%,62%)`})}
   for(const o of obs){o.y+=speed*dt;if(Math.abs(LANE[o.l]-cx)<44&&o.y>400&&o.y<500){alive=false;shake=.5;sfx('lose');setS(Math.floor(dist/10));finish();return}}obs=obs.filter(o=>o.y<600);G.sendT=(G.sendT||0)+dt;if(G.vs&&G.sendT>.5){G.sendT=0;G.link?.send({k:'sc',v:G.score,l:lane})}const s=Math.floor(dist/10);if(s!==G.score){G.score=s;if(s%20===0){setStats();sendScore()}}};
  const car=(g,x,y,c)=>{g.fillStyle=c;g.beginPath();g.roundRect(x-22,y-36,44,72,12);g.fill();g.fillStyle='rgba(20,20,40,.7)';g.beginPath();g.roundRect(x-16,y-22,32,22,6);g.fill();g.fillStyle='#111';[[-25,-22],[19,-22],[-25,12],[19,12]].forEach(([a,b])=>g.fillRect(x+a,y+b,6,16))};
  G.draw=g=>{gbg(g,'#262044','#140f2e');const off=(dist*1.4)%80;g.fillStyle='rgba(255,255,255,.5)';for(const lx of [135,225])for(let y=-80+off;y<GH;y+=80)g.fillRect(lx-3,y,6,44);g.fillStyle='#ff6178';g.fillRect(36,0,6,GH);g.fillRect(318,0,6,GH);
   for(const o of obs)car(g,LANE[o.l],o.y,o.c);if(G.vs){g.globalAlpha=.35;car(g,LANE[opp.lane]||180,450+Math.max(-200,Math.min(200,(G.score-opp.d)*1.2)),'#62c9ff');g.globalAlpha=1}car(g,cx,450,'#ffd864');
   gtext(g,`${G.score} m`,GW/2,30,26,'#fff');if(G.vs)gtext(g,`${(G.oppName||'對手').slice(0,6)} ${opp.d} m${opp.alive?'':'（撞車）'}`,GW/2,58,15,'#62c9ff',700);if(G.over&&!G.vs)drawOver(g,'CRASH!')}
  G.onMsg=m=>{if(m.k==='sc'){opp.d=m.v|0;G.oppScore=opp.d;if(Number.isInteger(m.l))opp.lane=m.l;setStats()}if(m.k==='end'){opp.alive=false;opp.d=m.v|0;G.oppScore=opp.d;setStats()}};
}
 if(k==='hoops'){let time=40,hx=180,hd=1,shots=[],combo=0,msg=null;
  G.down=()=>{if(restart()||G.over)return;if(shots.some(s=>s.t<.55))return;shots.push({t:0,x:180,done:false,in:false,dx:0});sfx('whoosh')};G.key=(c,dn)=>{if(dn&&(c==='Space'||c==='Enter'||c==='go'))G.down()};G.pad=[{t:'投籃',code:'go',w:160}];
  G.update=dt=>{if(G.over)return;time-=dt;if(time<=0){finish();return}const sp=90+(40-time)*4.5;hx+=hd*sp*dt;if(hx>290){hx=290;hd=-1}if(hx<70){hx=70;hd=1}
   for(const s of shots){s.t+=dt;if(!s.done&&s.t>=.55){s.done=true;const d=Math.abs(s.x-hx);if(d<26){s.in=true;combo++;const pts=(d<10?3:2)+(combo>2?1:0);setS(G.score+pts);sendScore();sfx('coin');msg={t:G.t,text:d<10?`SWISH +${pts}`:`+${pts}`}}else{combo=0;s.dx=Math.sign(s.x-hx||1)*140;msg={t:G.t,text:'MISS'}}}}shots=shots.filter(s=>s.t<1.2)};
  G.draw=g=>{gbg(g,'#2b1640','#140c26');gtext(g,Math.max(0,time).toFixed(1)+'s',GW/2,34,28,'#ffd864');if(G.vs)gtext(g,`${(G.oppName||'對手').slice(0,6)}：${G.oppScore}`,GW/2,62,16,'#62c9ff',700);
   g.fillStyle='#f7f4ff';g.beginPath();g.roundRect(hx-62,82,124,82,8);g.fill();g.strokeStyle='#ff6fb1';g.lineWidth=4;g.strokeRect(hx-24,114,48,36);
   const ball=(x,y,r)=>{g.fillStyle='#ff8a3c';g.beginPath();g.arc(x,y,r,0,7);g.fill();g.strokeStyle='#5a2a10';g.lineWidth=2;g.beginPath();g.arc(x,y,r,0,7);g.moveTo(x-r,y);g.lineTo(x+r,y);g.moveTo(x,y-r);g.lineTo(x,y+r);g.stroke()};
   for(const s of shots)if(s.t>.55&&s.in)ball(s.x,160+(s.t-.55)*420,15);g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=2;for(let i=0;i<6;i++){g.beginPath();g.moveTo(hx-26+i*10.4,162);g.lineTo(hx-16+i*6.4,206);g.stroke()}
   g.strokeStyle='#ff9a5c';g.lineWidth=6;g.beginPath();g.ellipse(hx,162,30,8,0,0,7);g.stroke();
   for(const s of shots){if(s.t<=.55){const p=s.t/.55;ball(s.x,470-p*308-Math.sin(p*Math.PI)*90,26-p*11)}else if(!s.in){const q=s.t-.55;ball(s.x+s.dx*q,162+q*q*900-q*200,15)}}
   if(!shots.some(s=>s.t<.55)&&!G.over)ball(180,470,26);if(msg&&G.t-msg.t<.9){g.globalAlpha=1-(G.t-msg.t)/.9;gtext(g,msg.text,GW/2,300-(G.t-msg.t)*40,34,msg.text==='MISS'?'#aca5d6':'#55eeb4');g.globalAlpha=1}
   if(combo>2)gtext(g,`COMBO ×${combo}`,GW/2,520,20,'#ff6fb1');if(G.over&&!G.vs)drawOver(g,'TIME UP')}
  G.onMsg=m=>{if(m.k==='sc'||m.k==='end'){G.oppScore=m.v|0;setStats()}}}
 if(k==='hockey'){const T={x0:24,x1:336,y0:24,y1:516},GL=[120,240];let pk={x:180,y:270,vx:0,vy:0},mp={x:180,y:440,px:180,py:440,vx:0,vy:0},op={x:180,y:100,px:180,py:100,vx:0,vy:0},tgt={x:180,y:440},sc=[0,0],flash=0,goalMsg='',kd={};G.pose='hockey';
  const toView=(x,y)=>G.vs&&!G.host?[GW-x,GH-y]:[x,y];
  G.down=(x,y)=>{if(G.over&&!G.vs){restart();return}tgt.x=x;tgt.y=y};G.move=(x,y,dr)=>{if(dr||!isTouch){tgt.x=x;tgt.y=y}};G.key=(c,dn)=>{kd[c]=dn};G.pad=null;
  const auth=!G.vs||G.host;
  const resetPuck=dir=>{pk={x:180,y:270,vx:(G.rng()-.5)*60,vy:dir*120}};
  const coll=(p)=>{const dx=pk.x-p.x,dy=pk.y-p.y,d=Math.hypot(dx,dy),m=38;if(d<m&&d>0){const nx=dx/d,ny=dy/d;pk.x=p.x+nx*m;pk.y=p.y+ny*m;const rel=(pk.vx-p.vx)*nx+(pk.vy-p.vy)*ny;if(rel<0){pk.vx-=1.9*rel*nx;pk.vy-=1.9*rel*ny}pk.vx+=p.vx*.35;pk.vy+=p.vy*.35;const s=Math.hypot(pk.vx,pk.vy);if(s>950){pk.vx*=950/s;pk.vy*=950/s}sfx('hit')}};
  G.update=dt=>{if(G.over)return;flash=Math.max(0,flash-dt);
   const kx=(kd.ArrowRight||kd.KeyD?1:0)-(kd.ArrowLeft||kd.KeyA?1:0),ky=(kd.ArrowDown||kd.KeyS?1:0)-(kd.ArrowUp||kd.KeyW?1:0);if(kx||ky){tgt.x=mp.x+kx*40;tgt.y=mp.y+ky*40}
   const mx=THREE.MathUtils.clamp(tgt.x,T.x0+24,T.x1-24),my=THREE.MathUtils.clamp(tgt.y,290,T.y1-24);const k1=Math.min(1,dt*18);mp.px=mp.x;mp.py=mp.y;mp.x+=(mx-mp.x)*k1;mp.y+=(my-mp.y)*k1;mp.vx=(mp.x-mp.px)/dt;mp.vy=(mp.y-mp.py)/dt;
   if(!G.vs){const def=pk.y>270||pk.vy>200,tx=def?180+(pk.x-180)*.45:pk.x,ty=def?80:Math.min(pk.y-20,240),sp=420*dt;op.px=op.x;op.py=op.y;op.x+=THREE.MathUtils.clamp(tx-op.x,-sp,sp);op.y+=THREE.MathUtils.clamp(ty-op.y,-sp,sp);op.y=THREE.MathUtils.clamp(op.y,T.y0+24,250);op.vx=(op.x-op.px)/dt;op.vy=(op.y-op.py)/dt}
   if(auth){pk.x+=pk.vx*dt;pk.y+=pk.vy*dt;pk.vx*=Math.pow(.6,dt);pk.vy*=Math.pow(.6,dt);
    if(pk.x<T.x0+14){pk.x=T.x0+14;pk.vx=Math.abs(pk.vx)}if(pk.x>T.x1-14){pk.x=T.x1-14;pk.vx=-Math.abs(pk.vx)}
    const inGoal=pk.x>GL[0]&&pk.x<GL[1];if(pk.y<T.y0+14){if(inGoal){sc[0]++;goal(0);return}pk.y=T.y0+14;pk.vy=Math.abs(pk.vy)}if(pk.y>T.y1-14){if(inGoal){sc[1]++;goal(1);return}pk.y=T.y1-14;pk.vy=-Math.abs(pk.vy)}
    coll(mp);coll(op)}
   else{pk.x+=pk.vx*dt;pk.y+=pk.vy*dt}
   G.score=sc[auth?0:1];G.oppScore=sc[auth?1:0]};
  function goal(who){flash=1;goalMsg=who===0?(G.vs?'GOAL!':'你得分！'):(G.vs?'失分':'電腦得分');sfx(who===0?'win':'lose');G.score=sc[0];G.oppScore=sc[1];setStats();resetPuck(who===0?-1:1);if(G.vs)G.link?.send({k:'gl',sc});if(sc[0]>=7||sc[1]>=7){G.over=true;if(G.vs){G.link?.send({k:'end',sc});vsResult(sc[0]>sc[1]?1:-1)}else{gameOverSolo(sc[0]>sc[1]?sc[0]*10:0)}}}
  G.net=()=>{if(!G.vs)return;if(G.host)G.link?.send({k:'s',p:[pk.x|0,pk.y|0,pk.vx|0,pk.vy|0],h:[mp.x|0,mp.y|0,mp.vx|0,mp.vy|0],sc});else G.link?.send({k:'g',x:GW-mp.x|0,y:GH-mp.y|0,vx:-mp.vx|0,vy:-mp.vy|0})};
  G.onMsg=m=>{if(G.host&&m.k==='g'){op.x=num(m.x,op.x);op.y=num(m.y,op.y);op.vx=num(m.vx);op.vy=num(m.vy)}
   if(!G.host&&m.k==='s'&&Array.isArray(m.p)){const[x,y,vx,vy]=m.p;pk.x=GW-x;pk.y=GH-y;pk.vx=-vx;pk.vy=-vy;if(Array.isArray(m.h)){op.x=GW-m.h[0];op.y=GH-m.h[1]}if(Array.isArray(m.sc)){sc[0]=m.sc[0];sc[1]=m.sc[1]}}
   if(!G.host&&(m.k==='gl'||m.k==='end')&&Array.isArray(m.sc)){const mine=m.sc[1],theirs=m.sc[0];if(mine>sc[1]){flash=1;goalMsg='GOAL!';sfx('win')}else{flash=1;goalMsg='失分';sfx('lose')}sc[0]=m.sc[0];sc[1]=m.sc[1];G.score=sc[1];G.oppScore=sc[0];setStats();if(m.k==='end'){G.over=true;vsResult(mine>theirs?1:-1)}}};
  G.draw=g=>{const S=G.vs&&!G.host?{me:sc[1],op:sc[0]}:{me:sc[0],op:sc[1]};g.fillStyle='#dff2ff';g.fillRect(0,0,GW,GH);g.fillStyle='#3b6cff';g.fillRect(0,0,GW,T.y0);g.fillRect(0,T.y1,GW,GH-T.y1);g.fillRect(0,0,T.x0,GH);g.fillRect(T.x1,0,GW-T.x1,GH);
   g.fillStyle='#ff6fb1';g.fillRect(GL[0],T.y0-6,GL[1]-GL[0],6);g.fillStyle='#55eeb4';g.fillRect(GL[0],T.y1,GL[1]-GL[0],6);g.strokeStyle='rgba(255,111,177,.5)';g.lineWidth=3;g.beginPath();g.moveTo(T.x0,270);g.lineTo(T.x1,270);g.stroke();g.beginPath();g.arc(180,270,50,0,7);g.stroke();
   g.fillStyle='rgba(98,201,255,.15)';for(let i=0;i<40;i++)g.fillRect(T.x0+((i*53)%300),T.y0+((i*97)%490),2,2);
   const dpk=G.vs&&!G.host?[pk.x,pk.y]:[pk.x,pk.y];g.fillStyle='#222';g.beginPath();g.arc(dpk[0],dpk[1],14,0,7);g.fill();
   const pad=(p,c)=>{g.fillStyle=c;g.shadowColor=c;g.shadowBlur=14;g.beginPath();g.arc(p.x,p.y,24,0,7);g.fill();g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.arc(p.x,p.y,10,0,7);g.fill()};pad(op,'#ff6fb1');pad(mp,'#55eeb4');
   gtext(g,`${S.op}`,GW-40,150,40,'rgba(255,111,177,.6)');gtext(g,`${S.me}`,GW-40,390,40,'rgba(85,238,180,.7)');if(flash>0){g.globalAlpha=flash;gtext(g,goalMsg,GW/2,GH/2,54,'#ff6fb1');g.globalAlpha=1}
   if(G.over&&!G.vs)drawOver(g,sc[0]>sc[1]?'YOU WIN!':'YOU LOSE')}}
 if(k==='dance'){const LX2=[66,138,210,282],ARW=['◀','▼','▲','▶'],BPM=124,BT=60/BPM,DUR=36,SPD=300,RY=96;let notes=[],songT=-.5,beat=-1,combo=0,judge=null,lit=[0,0,0,0];
  for(let b=4;b<DUR/BT-2;b++){if(G.rng()<.82){notes.push({t:b*BT,l:Math.floor(G.rng()*4),hit:false,miss:false});if(G.rng()<.14)notes.push({t:b*BT,l:Math.floor(G.rng()*4),hit:false,miss:false})}if(b>16&&G.rng()<.3)notes.push({t:(b+.5)*BT,l:Math.floor(G.rng()*4),hit:false,miss:false})}
  const press=l=>{if(G.over&&!G.vs){restart();return}lit[l]=.15;let bestN=null,bd=.16;for(const n of notes)if(!n.hit&&!n.miss&&n.l===l){const d=Math.abs(n.t-songT);if(d<bd){bd=d;bestN=n}}
   if(bestN){bestN.hit=true;combo++;const p=bd<.05?3:bd<.1?2:1;setS(G.score+p*(combo>10?2:1));sendScore();judge={t:G.t,txt:bd<.05?'PERFECT':bd<.1?'GREAT':'GOOD',c:bd<.05?'#ffd864':bd<.1?'#55eeb4':'#62c9ff'}}else{combo=0;judge={t:G.t,txt:'MISS',c:'#aca5d6'}}};
  G.key=(c,dn)=>{if(!dn)return;const m={ArrowLeft:0,KeyA:0,ArrowDown:1,KeyS:1,ArrowUp:2,KeyW:2,ArrowRight:3,KeyD:3,l0:0,l1:1,l2:2,l3:3}[c];if(m!=null)press(m)};G.down=x=>press(THREE.MathUtils.clamp(Math.floor(x/(GW/4)),0,3));
  G.pad=ARW.map((t,i)=>({t,code:'l'+i,w:64}));G.pose='step';
  G.update=dt=>{if(G.over)return;songT+=dt;const b=Math.floor(songT/BT);if(b!==beat&&songT>0){beat=b;sfx(b%2?'snare':'kick');if(b%1===0)sfx('hat')}lit=lit.map(v=>Math.max(0,v-dt));
   for(const n of notes)if(!n.hit&&!n.miss&&songT-n.t>.16){n.miss=true;combo=0;judge={t:G.t,txt:'MISS',c:'#aca5d6'}}if(songT>DUR){finish()}};
  G.draw=g=>{gbg(g,'#26114a','#0d0a24');const pulse=Math.max(0,1-((songT%BT)/BT)*3);g.fillStyle=`rgba(255,111,177,${.08*pulse})`;g.fillRect(0,0,GW,GH);
   LX2.forEach((x,i)=>{g.strokeStyle='rgba(255,255,255,.08)';g.beginPath();g.moveTo(x,0);g.lineTo(x,GH);g.stroke();g.fillStyle=lit[i]>0?'#fff':'rgba(255,255,255,.2)';g.font='800 40px "Baloo 2",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(ARW[i],x,RY)});
   const cols=['#ff6fb1','#62c9ff','#55eeb4','#ffd864'];for(const n of notes){if(n.hit)continue;const y=RY+(n.t-songT)*SPD;if(y<40||y>GH+30)continue;g.globalAlpha=n.miss?.25:1;g.fillStyle=cols[n.l];g.shadowColor=cols[n.l];g.shadowBlur=14;g.font='800 44px "Baloo 2",sans-serif';g.fillText(ARW[n.l],LX2[n.l],y);g.shadowBlur=0;g.globalAlpha=1}
   if(judge&&G.t-judge.t<.6)gtext(g,judge.txt,GW/2,200,34,judge.c);if(combo>2)gtext(g,`${combo} COMBO`,GW/2,240,20,'#fff');gtext(g,`${Math.max(0,DUR-songT).toFixed(0)}s`,GW/2,GH-24,18,'#d8d0ff',700);
   if(G.vs)gtext(g,`${(G.oppName||'對手').slice(0,6)}：${G.oppScore}`,GW/2,30,16,'#62c9ff',700);if(G.over&&!G.vs)drawOver(g,'FINISH!')}
  G.onMsg=m=>{if(m.k==='sc'||m.k==='end'){G.oppScore=m.v|0;setStats()}}}
 if(k==='c4'){const C=7,R=6;let bd=Array.from({length:C},()=>[]),turn=0,win=null,hover=3,last=null,drop=null;const meP=G.vs?(G.host?0:1):0;G.pose='play';
  const winner=b=>{const at=(c,r)=>b[c]?.[r];for(let c=0;c<C;c++)for(let r=0;r<R;r++){const v=at(c,r);if(v==null)continue;for(const[dc,dr]of[[1,0],[0,1],[1,1],[1,-1]]){let n=1;while(n<4&&at(c+dc*n,r+dr*n)===v)n++;if(n===4)return{v,cells:[0,1,2,3].map(i=>[c+dc*i,r+dr*i])}}}return b.every(col=>col.length>=R)?{v:-1}:null};
  const play=(col,who)=>{if(win||bd[col].length>=R||turn!==who)return false;bd[col].push(who);last=[col,bd[col].length-1];drop={c:col,r:bd[col].length-1,t:0};sfx('click');turn=1-turn;win=winner(bd);
   if(win){G.over=true;if(win.v===meP){setS(1)}if(G.vs)vsResult(win.v===-1?0:win.v===meP?1:-1);else{sfx(win.v===0?'win':'lose');if(win.v===0)announce('在四子棋贏了電腦')}}return true};
  const mine=col=>{if(G.over){if(!G.vs)restart();return}if(play(col,meP)&&G.vs)G.link?.send({k:'mv',c:col})};
  G.down=x=>{hover=THREE.MathUtils.clamp(Math.floor((x-12)/48),0,6);mine(hover)};G.move=x=>{hover=THREE.MathUtils.clamp(Math.floor((x-12)/48),0,6)};
  G.key=(c,dn)=>{if(!dn)return;if(c==='ArrowLeft')hover=Math.max(0,hover-1);else if(c==='ArrowRight')hover=Math.min(6,hover+1);else if(c==='Space'||c==='Enter')mine(hover);else{const m=/^Digit([1-7])$/.exec(c);if(m)mine(+m[1]-1)}};
  let aiT=0;G.update=dt=>{if(drop)drop.t+=dt;if(G.over||!G.ai||turn!==1)return;aiT+=dt;if(aiT<.55)return;aiT=0;
   const can=c=>bd[c].length<R,sim=(c,w)=>{bd[c].push(w);const r=winner(bd);bd[c].pop();return r&&r.v===w};let pick=-1;for(let c=0;c<C;c++)if(can(c)&&sim(c,1)){pick=c;break}if(pick<0)for(let c=0;c<C;c++)if(can(c)&&sim(c,0)){pick=c;break}
   if(pick<0){const order=[3,2,4,1,5,0,6].filter(can);const safe=order.filter(c=>{bd[c].push(1);const bad=[...Array(C).keys()].some(x=>can(x)&&sim(x,0));bd[c].pop();return!bad});const pool=safe.length?safe:order;pick=G.rng()<.7?pool[0]:pool[Math.floor(G.rng()*pool.length)]}play(pick,1)};
  G.onMsg=m=>{if(m.k==='mv'&&Number.isInteger(m.c))play(m.c,1-meP)};
  G.draw=g=>{gbg(g,'#1b2a6b','#0e1440');const ox=12,oy=150,cs=48;const cols=['#ff6fb1','#ffd864'];
   gtext(g,G.over?(win.v===-1?'平手':win.v===meP?'你贏了！':'輸了'):(turn===meP?'輪到你':G.vs?`${(G.oppName||'對手').slice(0,6)} 思考中…`:'電腦思考中…'),GW/2,50,24,G.over?'#ffd864':cols[turn]);
   if(!G.over&&turn===meP){g.fillStyle=cols[meP];g.globalAlpha=.8;g.beginPath();g.arc(ox+hover*cs+24,oy-28,18,0,7);g.fill();g.globalAlpha=1}
   g.fillStyle='#3b6cff';g.beginPath();g.roundRect(ox-6,oy-6,C*cs+12,R*cs+12,14);g.fill();
   for(let c=0;c<C;c++)for(let r=0;r<R;r++){const v=bd[c][r];let y=oy+(R-1-r)*cs+24;if(drop&&drop.c===c&&drop.r===r&&drop.t<.3){y=oy-30+(y-oy+30)*Math.min(1,(drop.t/.3)**2)}g.fillStyle=v==null?'#0e1440':cols[v];g.beginPath();g.arc(ox+c*cs+24,v==null?oy+(R-1-r)*cs+24:y,19,0,7);g.fill()}
   if(win&&win.cells){g.strokeStyle='#fff';g.lineWidth=4;win.cells.forEach(([c,r])=>{g.beginPath();g.arc(ox+c*cs+24,oy+(R-1-r)*cs+24,21,0,7);g.stroke()})}
   gtext(g,G.vs?`你是 ${meP?'黃':'粉紅'}色`:'你是粉紅色，先下',GW/2,470,15,'#d8d0ff',700);if(G.over&&!G.vs)gtext(g,'點一下再玩一次',GW/2,505,16,'#fff',700)}}
 if(k==='claw'){let cx=180,cy=60,state='move',tries=3,won=0,prizes=[],held=null,hint='',time=20,kl=0,kr=0;for(let i=0;i<16;i++)prizes.push({x:70+Math.random()*250,y:400+Math.random()*60,c:prizeCols[i%7],g:false});
  const grab=()=>{if(G.over){restart();return}if(state==='move')state='down'};G.key=(c,dn)=>{if(c==='ArrowLeft'||c==='KeyA')kl=dn;else if(c==='ArrowRight'||c==='KeyD')kr=dn;else if(dn&&(c==='Space'||c==='go'))grab()};
  G.down=(x)=>{if(state==='move'&&Math.abs(x-cx)<40)grab();else if(state==='move'){kl=x<cx;kr=x>cx}};G.up=()=>{kl=kr=0};G.pad=[{t:'◀',code:'ArrowLeft'},{t:'抓！',code:'go',w:110},{t:'▶',code:'ArrowRight'}];
  G.update=dt=>{if(G.over)return;if(state==='move'){cx=THREE.MathUtils.clamp(cx+((kr?1:0)-(kl?1:0))*150*dt,70,330);time-=dt;if(time<=0)state='down'}
   else if(state==='down'){cy+=260*dt;if(cy>=380){state='close';let bestP=null,bd=99;for(const p of prizes)if(!p.g){const d=Math.abs(p.x-cx);if(d<bd){bd=d;bestP=p}}if(bestP&&bd<36&&Math.random()<.85-bd/50){held=bestP;bestP.g=true;hint=''}else hint='沒抓到…'}}
   else if(state==='close'){cy-=200*dt;if(held){held.x=cx;held.y=cy+40}if(cy<=60){cy=60;state=held?'carry':'reset'}}
   else if(state==='carry'){cx-=150*dt;held.x=cx;held.y=cy+40;if(cx<=60){held.y=999;won++;setS(won);sfx('win');hint='夾到了！';held=null;state='reset'}}
   else if(state==='reset'){tries--;time=20;state=tries>0?'move':'end';if(tries<=0){G.over=true;gameOverSolo(won*100);if(won)announce(`夾到 ${won} 隻娃娃！`)}}};
  G.draw=g=>{gbg(g,'#ffd9ea','#ffc1dc');g.fillStyle='rgba(255,255,255,.4)';g.fillRect(20,40,320,460);g.fillStyle='#ad93ff';g.fillRect(20,470,320,40);g.fillStyle='#2b2263';g.fillRect(24,380,60,90);gtext(g,'出口',54,430,14,'#fff',700);
   for(const p of prizes){if(p.y>900)continue;g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,20,0,7);g.arc(p.x-13,p.y-17,7,0,7);g.arc(p.x+13,p.y-17,7,0,7);g.fill();g.fillStyle='#1d1640';g.beginPath();g.arc(p.x-6,p.y-3,2.5,0,7);g.arc(p.x+6,p.y-3,2.5,0,7);g.fill()}
   g.strokeStyle='#888';g.lineWidth=3;g.beginPath();g.moveTo(cx,40);g.lineTo(cx,cy);g.stroke();g.fillStyle='#c9c4e8';g.fillRect(cx-14,cy-6,28,12);const open=state==='move'||state==='down'?18:8;g.strokeStyle='#c9c4e8';g.lineWidth=5;g.beginPath();g.moveTo(cx-6,cy+4);g.lineTo(cx-open,cy+30);g.moveTo(cx+6,cy+4);g.lineTo(cx+open,cy+30);g.stroke();
   gtext(g,`剩 ${tries} 次 · 夾到 ${won}`,GW/2,20,16,'#2b2263');if(state==='move')gtext(g,`${Math.ceil(time)}s`,GW-40,20,16,'#2b2263');if(hint)gtext(g,hint,GW/2,GH/2-60,28,'#ff6fb1');if(G.over)drawOver(g,won?`夾到 ${won} 隻！`:'下次加油')}}
 if(k==='coin'){let coins=[],budget=15,pushY=90,pt=0,tm=0;for(let i=0;i<34;i++)coins.push({x:50+Math.random()*260,y:170+Math.random()*290,vx:0,vy:0});
  const drop=x=>{if(G.over){restart();return}if(budget<=0)return;budget--;coins.push({x:THREE.MathUtils.clamp(x,40,320),y:pushY+50,vx:0,vy:20});sfx('coin')};let aim=180;
  G.down=x=>drop(x);G.move=x=>{aim=x};G.key=(c,dn)=>{if(!dn)return;if(c==='ArrowLeft')aim=Math.max(40,aim-30);else if(c==='ArrowRight')aim=Math.min(320,aim+30);else if(c==='Space'||c==='go')drop(aim)};G.pad=[{t:'◀',code:'ArrowLeft'},{t:'投幣',code:'go',w:110},{t:'▶',code:'ArrowRight'}];
  G.update=dt=>{if(G.over)return;pt+=dt;const py0=pushY;pushY=110+Math.sin(pt*1.6)*55;const pv=(pushY-py0)/dt;
   for(const c of coins){if(c.y<pushY+50&&c.y>pushY-20&&pv>0){c.y=pushY+50;c.vy=Math.max(c.vy,pv)}c.x+=c.vx*dt;c.y+=c.vy*dt;c.vx*=Math.pow(.05,dt);c.vy*=Math.pow(.05,dt);c.x=THREE.MathUtils.clamp(c.x,36,324)}
   for(let i=0;i<coins.length;i++)for(let j=i+1;j<coins.length;j++){const a=coins[i],b=coins[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<30&&d>0){const o=(30-d)/2,nx=dx/d,ny=dy/d;a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;const rv=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(rv>0){a.vx-=rv*nx*.5;a.vy-=rv*ny*.5;b.vx+=rv*nx*.5;b.vy+=rv*ny*.5}}}
   const before=coins.length;coins=coins.filter(c=>c.y<500);if(coins.length<before){setS(G.score+(before-coins.length));sfx('coin')}
   if(budget<=0){tm+=dt;if(tm>4){G.over=true;gameOverSolo(G.score)}}};
  G.draw=g=>{gbg(g,'#3a2b70','#1d1440');g.fillStyle='#c9c4e8';g.fillRect(30,150,300,350);g.fillStyle='#ffd864';g.fillRect(30,496,300,6);g.fillStyle='#9a94c8';g.fillRect(30,0,300,pushY+50);g.fillStyle='rgba(0,0,0,.2)';g.fillRect(30,pushY+44,300,6);
   for(const c of coins){g.fillStyle='#ffd864';g.beginPath();g.arc(c.x,c.y,15,0,7);g.fill();g.strokeStyle='#c99a1a';g.lineWidth=2;g.beginPath();g.arc(c.x,c.y,10,0,7);g.stroke()}
   if(!G.over&&budget>0){g.globalAlpha=.6;g.fillStyle='#fff';g.beginPath();g.arc(aim,pushY+20,15,0,7);g.fill();g.globalAlpha=1}gtext(g,`硬幣 ${budget} · 推下 ${G.score}`,GW/2,24,18,'#fff');if(G.over)drawOver(g,`推下 ${G.score} 枚`)}}
 return G}

// ================= 2-player stations & matches =================
let MATCH=null;
function peerName(id){return id===MYID?myName:(peers.get(id)?.name||'玩家')}
function stationInteract(t){const st=stations.get(t.st),other=st.occ[1-t.slot];if(st.occ[t.slot]&&st.occ[t.slot]!==MYID){toast(`${peerName(st.occ[t.slot])} 正在用這邊`,[],3000);return}
 me.slot={st:st.id,i:t.slot,w:'wait'};st.occ[t.slot]=MYID;const sr=st.slots[t.slot];me.x=sr.x;me.z=sr.z;if(sr.sit){me.pose='sit';me.y=sr.f+sr.sit-.42}if(sr.stand)me.y=sr.f+sr.stand;myAv.rotation.y=sr.face;
 const op=other&&peers.get(other);openGame(st.game,{target:{...t,slotRef:sr,obj:st.obj},ctx:{mode:'lobby'}});setTitle(st.game,'lobby');G.over=true;G.draw=g=>{gbg(g,'#1d1450','#0e0b22');gtext(g,GAMES[st.game].name,GW/2,GH/2-40,40,GAMES[st.game].col)};
 if(op&&op.sx&&op.sx.s===st.id&&op.sx.w==='wait'){showLobby('connect',st,other);NET.emit('mt',{t:'join',st:st.id,to:other,name:myName})}else showLobby('wait',st);pushInfo(true)}
function showLobby(kind,st,other){const L=$('lobby');L.hidden=false;L.replaceChildren();const g=GAMES[st.game];
 const vsrow=(a,b)=>{const r=document.createElement('div');r.className='vsrow';const v=document.createElement('b');v.textContent='VS';r.append(a,v,b);return r};const waitEl=()=>{const w=document.createElement('div');w.className='wait';w.textContent='?';return w};
 const h=document.createElement('h4'),p=document.createElement('p'),stack=document.createElement('div');stack.className='stack';
 const btn=(t,cls,fn,icon)=>{const b=document.createElement('button');b.className='cb wide '+cls;b.innerHTML=(icon?`<svg class="i"><use href="#i-${icon}"/></svg>`:'')+`<span>${esc(t)}</span>`;b.onclick=fn;stack.append(b);return b};
 const opp=other&&peers.get(other)||(MATCH&&peers.get(MATCH.opp));
 if(kind==='wait'){L.append(vsrow(pfEl(look),waitEl()));h.textContent='等待對手';p.textContent=`請朋友走到${g.name}的另一邊按 E，就會開始對戰。`;L.append(h,p,stack);
  if(g.ai)btn('先和電腦玩','pink',()=>startLocal('ai',st),'game');else btn('自己先玩','pink',()=>startLocal('solo',st),'game');
  const mates=partyMates().filter(id=>peers.has(id));if(mates.length)btn('邀請隊友來對戰','ghost',()=>{mates.forEach(id=>NET.emit('mt',{t:'call',st:st.id,to:id}));toast('已邀請隊友',[],2500)},'userplus')}
 else if(kind==='connect'){L.append(vsrow(pfEl(look),opp?.look?pfEl(opp.look):waitEl()));h.textContent='連線中…';p.textContent=`正在加入 ${peerName(other)} 的對戰`;L.append(h,p)}
 else if(kind==='result'){L.append(vsrow(pfEl(look),opp?.look?pfEl(opp.look):waitEl()));h.textContent=other>0?'你贏了！':other<0?'輸了，再接再厲':'平手';if(other>0)h.style.color='var(--lemon)';p.textContent=`${G?.score??0} : ${G?.oppScore??0}`;p.style.font='800 28px var(--disp)';L.append(h,p,stack);
  if(MATCH){const b=btn('再來一局','pink',()=>{MATCH.link.send({k:'again'});MATCH.again=true;b.querySelector('span').textContent='等對方確認…';if(MATCH.oppAgain)rematch()},'sync')}}}
function startLocal(mode,st){$('lobby').hidden=true;me.slot.w=mode==='ai'?'ai':'solo';G=makeGame(st.game,{mode});buildPad(G.pad,G.padCols);setStats();setTitle(st.game,mode);pushInfo(true)}
function leaveStation(){const s=me.slot;if(!s)return;const st=stations.get(s.st);if(st&&st.occ[s.i]===MYID)st.occ[s.i]=null;me.slot=null;me.pose='';pushInfo(true)}
function vsResult(r){if(!G)return;G.over=true;sfx(r>0?'win':r<0?'lose':'click');showLobby('result',stations.get(me.slot?.st)||{game:curGame},r);if(r>0)announce(`在${GAMES[curGame].name}對戰贏了 ${G.oppName||''}`)}
function vsCheckEnd(){if(!G||!G.vs)return;if(G.over&&G.oppDone){const r=G.score>G.oppScore?1:G.score<G.oppScore?-1:0;vsResult(r)}else if(G.over)$('cabhint').textContent='等對手完成…'}
let vsSendT=0;function vsTick(dt){if(!MATCH)return;vsSendT+=dt;const rate=MATCH.link.fast?1/15:1/6;if(vsSendT>rate&&G.net&&!G.over){vsSendT=0;G.net()}if(performance.now()-MATCH.lastRx>9000&&!MATCH.gone){MATCH.gone=true;toast('對手好像斷線了',[],4000);if(!G.over){G.over=true;showLobby('result',stations.get(me.slot?.st),1)}}}
function beginMatch(m){// m={mid,st,a,b,seed}
 const st=stations.get(m.st);const host=m.a===MYID,opp=host?m.b:m.a;closeLink();const link=openLink(m.mid,opp);MATCH={...m,host,opp,link,lastRx:performance.now(),again:false,oppAgain:false};me.slot.w='play';pushInfo(true);
 link.on(msg=>{if(!msg||typeof msg!=='object')return;MATCH.lastRx=performance.now();if(msg.k==='bye'){toast(`${peerName(opp)} 離開了對戰`,[],3000);if(G&&!G.over){G.over=true;showLobby('result',st,1)}return}
  if(msg.k==='again'){MATCH.oppAgain=true;if(MATCH.again)rematch();return}if(msg.k==='hi')return;if(msg.k==='end'&&G&&G.vs&&curGame!=='hockey'){G.oppDone=true;G.oppScore=num(msg.v,G.oppScore);setStats();vsCheckEnd()}G?.onMsg?.(msg)});
 const hi=setInterval(()=>{if(!MATCH||MATCH.link!==link){clearInterval(hi);return}link.send({k:'hi'})},2000);
 $('lobby').hidden=true;G=makeGame(st.game,{mode:'vs',host,seed:m.seed,link,oppName:peerName(opp)});buildPad(G.pad,G.padCols);setStats();setTitle(st.game,'vs');sfx('go')}
function rematch(){if(!MATCH)return;const m={...MATCH,seed:(MATCH.seed*16807)%2147483647||7};MATCH.again=MATCH.oppAgain=false;beginMatch(m)}
function endMatch(){if(!MATCH)return;try{MATCH.link.send({k:'bye'})}catch(e){}closeLink();MATCH=null}
function closeLink(){if(MATCH&&MATCH.link)try{MATCH.link.close()}catch(e){}}
