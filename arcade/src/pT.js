
// ================= first-time tutorial (once per account/device) =================
const TUT=[
 {t:'走路與視角',d:()=>isTouch?'用左下角的搖桿走路，推到底就是跑步。用手指拖曳畫面可以轉視角，兩指縮放。':'用 W A S D 或方向鍵走路，按住 Shift 跑步。拖曳畫面轉視角，滾輪縮放。',el:()=>isTouch?'joy':null},
 {t:'開始玩',d:()=>`走到發光的機台、球道或沙發前面，頭上會出現提示，${isTouch?'點右下角「互動」':'按 E'} 就能開始。`,el:()=>null},
 {t:'誰在線上',d:()=>'點左上角自己的名字：看包廂裡有誰、每個人的網路延遲，也可以邀請組隊。有人說話時，這裡會顯示是誰在說話。',el:()=>'me-btn'},
 {t:'包廂',d:()=>'右上角的門：複製邀請連結給朋友。如果你是版主，也可以改人數、設密碼、上鎖和換燈光主題。',el:()=>'b-room'},
 {t:'聊天與語音',d:()=>'右下角：聊天、表情、麥克風。講話時麥克風會變成跳動的聲波，大家都看得到。',el:()=>'acts'},
 {t:'設定',d:()=>'右上角設定：改暱稱（14 天 2 次）、調整每個人的音量、看條款、回報問題。',el:()=>'b-menu'}];
let tutI=-1;
function startTutorial(force){if(!force&&store.get('tut2',false))return;if(!document.body.classList.contains('playing'))return;tutI=0;NS.hold=true;$('tut').hidden=false;tutShow()}
function tutShow(){const s=TUT[tutI];$('tut-t').textContent=s.t;$('tut-d').textContent=s.d();$('tut-n').textContent=`${tutI+1} / ${TUT.length}`;$('tut-prev').hidden=tutI===0;$('tut-next').textContent=tutI===TUT.length-1?'開始玩吧！':'下一步';
 $('tut-dots').replaceChildren(...TUT.map((_,i)=>{const d=document.createElement('i');if(i===tutI)d.className='on';return d}));tutPlace()}
function tutPlace(){if(tutI<0)return;const id=TUT[tutI].el(),ring=$('tut-ring'),card=$('tut-card');const e=id&&$(id);
 if(e&&e.getClientRects().length){const r=e.getBoundingClientRect(),pad=8;Object.assign(ring.style,{left:r.left-pad+'px',top:r.top-pad+'px',width:r.width+pad*2+'px',height:r.height+pad*2+'px',borderRadius:Math.min(r.height/2+pad,28)+'px'});ring.hidden=false;
  const cw=Math.min(360,innerWidth-28),ch=card.offsetHeight||180;let x=r.left+r.width/2-cw/2,y=r.bottom+18;if(y+ch>innerHeight-12)y=r.top-ch-18;x=Math.max(14,Math.min(innerWidth-cw-14,x));y=Math.max(14,Math.min(innerHeight-ch-14,y));Object.assign(card.style,{left:x+'px',top:y+'px',transform:'none'})}
 else{ring.hidden=true;Object.assign(card.style,{left:'50%',top:'50%',transform:'translate(-50%,-50%)'})}}
function tutEnd(){tutI=-1;$('tut').hidden=true;store.set('tut2',true);store.set('coached',true);NS.hold=false;nPump();notify({tone:'ok',text:'設定裡可以隨時重看教學。祝你玩得開心！',ms:4000})}
$('tut-next').onclick=()=>{if(tutI>=TUT.length-1)tutEnd();else{tutI++;tutShow()}sfx('click')};$('tut-prev').onclick=()=>{if(tutI>0){tutI--;tutShow()}};$('tut-skip').onclick=tutEnd;
addEventListener('resize',()=>tutPlace());
