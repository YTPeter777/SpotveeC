#!/bin/bash
set -e
cd "$(dirname "$0")"
cat p0.html p1.js p2.js p3.js pN.js pA.js p4.js p5.js p6.js p7.js p8.js pW.js pC.js pT.js pD.js pS.js p9.js > index.html
node -e "const s=require('fs').readFileSync('index.html','utf8');const js=s.split('<script type=\"module\">')[1].split('</script>')[0];require('fs').writeFileSync('check.mjs',js.replace(/^import .*$/mg,''));"
node --check check.mjs
sed 's#https://cdn.jsdelivr.net/npm/three@0.170.0/#/t/package/#g' index.html > test.html
sed -i 's#^(function boot(){#window.__t={get G(){return G},me,peers,lanes,stations,NET,VOICE,PARTY,MYID,inviteParty,partyMates,setYaw:v=>camYaw=v,enterLane,openGame,stationInteract,bowlPress,bowlRelease,startLocal,targets,doEmote,scene,camera,renderer,applyQuality,near:()=>near,interact,simStep:(L,dt)=>simStep(L,dt),AIM,portrait,ACC,ROOM,BK,APP,tryJoin,leaveRoom,startPlay,notify,adminOp,listRooms};\n(function boot(){#' test.html
echo BUILD_OK $(wc -c < index.html)
