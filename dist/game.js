function goTo(url){if(window.FolderSave?.enabled)window.FolderSave.navigate(url);else location.href=url}
'use strict';
const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d'),T=32,W=60,H=16;
const types=[['ground','🟩','Ground'],['brick','🧱','Brick'],['treatbrick','🍬','Treat block'],['milkbrick','🥛','Milk block'],['shieldbrick','🛡️','Shield block'],['jumpbrick','🪽','Jump block'],['coin','🟡','Coin'],['enemy','🍫','Caramel chip'],['spike','🔺','Spikes'],['start','🧑‍🔧','Start'],['goal','🏰','Pink castle'],['erase','⌫','Eraser']];
let level,selected='ground',playing=false,cam=0,history=[],drag=false,lastCell='',player,coins,enemies,broken=new Set(),used=new Set(),bumps=new Map(),debris=[],pickups=[],won=false,dead=false,keys={},jumpHeld=false,stamp=0,acc=0;
const sound=window.GameSound,story=window.StoryWorld,styles=window.GameStyles;let chapterId=null,chapterNumber=null,saveTimer,dirty=false,tick=0;
function message(s){$('status').textContent=s}function snapshot(){history.push(JSON.stringify(level));if(history.length>50)history.shift()}
function blank(){return {version:1,title:'My new adventure',tiles:Array.from({length:H},(_,y)=>Array.from({length:W},()=>y>=14?'ground':'')),start:{x:2,y:13},goal:{x:56,y:13}}}
function starter(){let l=blank();l.title='Sunny-side adventure';for(let x=0;x<W;x++)if((x>=15&&x<=17)||(x>=35&&x<=37))l.tiles[14][x]=l.tiles[15][x]='';for(const [a,b,y] of [[6,10,10],[20,24,11],[29,32,8],[40,44,11],[48,51,9]])for(let x=a;x<=b;x++){l.tiles[y][x]='brick';l.tiles[y-1][x]='coin'}for(let x of [12,26,45])l.tiles[13][x]='enemy';return l}
function setLevel(l){level=l;showStyle();$('title').value=l.title;cam=0;$('camera').value=0;playing=false;dead=false;sound?.stop();updateMode();message('Ready to build')}
function updateMode(){$('chapter-complete').hidden=!won||!playing;$('game-over').hidden=!dead||!playing;$('mode').textContent=playing?'✎ Back to builder':'▶ Play your course';$('badge').textContent=playing?'▶ PLAY MODE':'✎ BUILD MODE';$('hint').textContent=playing?'← → / A D to move · Space / ↑ to jump · Hold Shift to sprint':'Click & drag to place · Right-click to erase';$('camera').disabled=playing;$('restart').disabled=!playing;for(const {b} of styleButtons.values())b.disabled=playing}
const toolIcons=[];for(const [id,icon,name]of types){let b=document.createElement('button'),pic=document.createElement('span');if(id==='erase')pic.textContent=icon;else{const c=document.createElement('canvas');c.width=c.height=32;c.setAttribute?.('aria-hidden','true');pic.append(c);toolIcons.push([id,c])}b.append(pic,name);b.title=name;b.dataset.tile=id;b.onclick=()=>{selected=id;document.querySelectorAll('[data-tile]').forEach(e=>e.classList.toggle('selected',e===b))};$('palette').append(b)}document.querySelector('[data-tile]').classList.add('selected');
// Game styles: each course picks the look (and music) of one era, like a course maker's style switch.
function art(){return styles.get(level?.style)}
const styleButtons=new Map();
for(const s of styles.list){const b=document.createElement('button'),icon=document.createElement('canvas'),label=document.createElement('span');icon.width=icon.height=40;b.className='style-choice';b.title=s.blurb;label.innerHTML=`<b>${s.name}</b><small>${s.era}</small>`;b.append(icon,label);b.onclick=()=>setStyle(s.id);$('styles').append(b);styleButtons.set(s.id,{b,icon});const g=icon.getContext('2d');g.fillStyle=s.swatch;g.fillRect(0,0,40,40);s.hero(g,9,8,{face:1})}
function showStyle(){const s=art();if(canvas.style)canvas.style.imageRendering=s.pixel?'pixelated':'auto';for(const [id,{b}] of styleButtons){b.classList.toggle('selected',id===s.id);b.setAttribute?.('aria-pressed',String(id===s.id))}sound?.theme?.(s.id);
 for(const [id,c] of toolIcons){const g=c.getContext('2d');g.clearRect(0,0,32,32);g.save();if(id==='start')s.hero(g,5,4,{face:1});else if(id==='goal'){g.translate(1,3);g.scale(.19,.19);s.home(g,{x:67,y:81,w:26,h:49})}else s.tile(g,id,0,0,{build:true,near:()=>''});g.restore()}}
function setStyle(id){if(playing||!styles.ids.includes(id)||art().id===id)return;snapshot();level.style=id;markEdited();showStyle();message(`${styles.get(id).name} style — blocks, characters and music all change`)}
function reset(){broken=new Set();used=new Set();bumps=new Map();debris=[];pickups=[];coins=new Set();enemies=[];level.tiles.forEach((row,y)=>row.forEach((t,x)=>{if(t==='coin')coins.add(`${x},${y}`);if(t==='enemy')enemies.push({x:x*T,y:y*T+8,v:-1,dead:false})}));player={x:level.start.x*T+5,y:level.start.y*T+4,w:22,h:28,small:true,pendingMilk:false,hurt:0,vx:0,vy:0,ground:false,score:0,treats:0,shield:0,boost:0,face:1,anim:0};won=false;dead=false;$('chapter-complete').hidden=true;$('game-over').hidden=true;jumpHeld=false;cam=0;message('Find the finish flag!')}
function startRun(){sound?.stop();sound?.unlock();sound?.theme?.(art().id);reset();sound?.music();sound?.ready?.then(()=>{if(playing&&!dead&&!won){sound.reload();sound.music()}}).catch(()=>{});canvas.focus()}
function requestPlay(){keys={};flushChapter();if(story&&chapterId){const w=story.get(),c=story.chapter(chapterId);$('intro-chapter').textContent='CHAPTER '+(w.levels.findIndex(x=>x.id===chapterId)+1);$('intro-title').textContent=c.level.title;$('intro-story').textContent=c.story;$('chapter-intro').showModal()}else{playing=true;startRun();updateMode()}}
$('begin-chapter').onclick=()=>{$('chapter-intro').close();playing=true;startRun();updateMode()};$('cancel-chapter').onclick=()=>$('chapter-intro').close();
$('mode').onclick=()=>{if(playing){playing=false;keys={};sound?.stop();updateMode()}else requestPlay()};$('restart').onclick=()=>{if(playing)startRun()};$('try-again').onclick=()=>{keys={};startRun()};$('death-build').onclick=()=>{playing=false;keys={};sound?.stop();updateMode()};
function finishChapter(){
 $('chapter-complete').hidden=false;let next=null;$('branch-choices').replaceChildren?.();
 if(story&&chapterId){try{flushChapter();story.complete(chapterId);next=story.next(chapterId);const exits=story.exits(chapterId);for(const id of exits.slice(1)){const button=document.createElement('button');button.textContent='→ '+story.chapter(id).level.title;button.onclick=()=>goTo('index.html?level='+encodeURIComponent(id)+'&mode=play');$('branch-choices').append(button)}const allDone=story.get().levels.every(c=>c.complete);$('finish-title').textContent=next?'Chapter complete!':allDone?'Your story is complete!':'Home at last!';$('finish-story').textContent=next?'The adventure continues in '+story.chapter(next).level.title+'.':allDone?'Elley-Oh! made it home. You finished every chapter in this journey!':'You made it home! Visit the map to finish the other chapters.'}catch(e){message('Course complete, but progress could not be saved: '+e.message)}}
 $('next-chapter').hidden=!next;$('next-chapter').onclick=()=>{flushChapter();goTo('index.html?level='+encodeURIComponent(next)+'&mode=play')};
}
$('finish-replay').onclick=()=>{keys={};startRun()};
function die(){if(dead)return;dead=true;keys={};sound?.stop();sound?.effect('death');$('game-over').hidden=false;message('Game over — try again!');$('try-again').focus()}
$('undo').onclick=()=>{if(playing)return;if(history.length){level=JSON.parse(history.pop());showStyle();$('title').value=level.title;markEdited();message('Undone')}};
function flushChapter(){clearTimeout(saveTimer);if(!story||!chapterId)return true;try{if(dirty){story.saveLevel(chapterId,level);dirty=false}return true}catch(e){message('Could not save chapter: '+e.message+' — use Export to keep a copy.');return false}}
function markEdited(){if(!story||!chapterId)return;dirty=true;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{if(flushChapter())message('Chapter saved automatically ✓')},350)}
$('title').oninput=()=>{level.title=$('title').value;markEdited()};$('save').onclick=()=>{if(story&&chapterId){dirty=true;if(flushChapter())message('Chapter saved to your story map ✓')}else{try{localStorage.setItem('jumpWorkshop',JSON.stringify(level));message('Saved in this browser ✓')}catch{message('Storage unavailable — use Export')}}};
$('export').onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(level,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='jump-workshop-course.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);message('Course exported')};
$('import').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>2*1024*1024)throw Error();const l=JSON.parse(await f.text());if(story){if(!story.validLevel(l))throw Error();if(!flushChapter())return;const id=story.add(l,'A new adventure joins the story.');goTo('index.html?level='+encodeURIComponent(id)+'&mode=build')}else{snapshot();setLevel(l)}message('Course imported as a new chapter ✓')}catch{message('That course could not be imported. Check the file and browser storage.')}e.target.value=''};
$('clear').onclick=()=>{if(confirm('Start a blank course? Export first to keep your current course.')){snapshot();setLevel({...blank(),style:level.style});markEdited()}};$('example').onclick=()=>{if(confirm('Load the starter course? Export first to keep your current course.')){snapshot();setLevel({...starter(),style:level.style});markEdited()}};$('help').onclick=()=>$('instructions').showModal();$('close').onclick=()=>$('instructions').close();$('camera').oninput=e=>cam=+e.target.value*T;
function paint(e){if(playing)return;const r=canvas.getBoundingClientRect(),x=Math.floor(((e.clientX-r.left)/r.width*canvas.width+cam)/T),y=Math.floor((e.clientY-r.top)/r.height*canvas.height/T);if(x<0||x>=W||y<0||y>=H)return;let k=`${x},${y}`;if(lastCell===k)return;lastCell=k;let tool=e.buttons===2?'erase':selected;if(tool==='start'||tool==='goal')level[tool]={x,y};else level.tiles[y][x]=tool==='erase'?'':tool;markEdited();message('Course edited')}
canvas.onpointerdown=e=>{if(playing)return;snapshot();drag=true;lastCell='';canvas.setPointerCapture(e.pointerId);paint(e)};canvas.onpointermove=e=>{if(drag)paint(e)};canvas.onpointerup=canvas.onpointercancel=()=>drag=false;canvas.oncontextmenu=e=>e.preventDefault();
function key(e,on){if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)||$('instructions').open||$('chapter-intro').open)return;if(playing&&['ArrowLeft','ArrowRight','ArrowUp','Space','KeyW','KeyA','KeyD','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys[e.code]=on}}window.addEventListener('keydown',e=>key(e,true));window.addEventListener('keyup',e=>key(e,false));window.onblur=()=>keys={};for(let b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys[b.dataset.key]=false}
function tileAt(x,y){if(playing&&broken.has(`${x},${y}`))return '';if(playing&&used.has(`${x},${y}`))return 'emptybrick';return level.tiles[y]?.[x]||''}function solid(x,y){return x<0||x>=W||['ground','brick','emptybrick','treatbrick','shieldbrick','jumpbrick','milkbrick'].includes(tileAt(x,y))}function collide(p){let a=[];for(let y=Math.floor(p.y/T);y<=Math.floor((p.y+p.h-.01)/T);y++)for(let x=Math.floor(p.x/T);x<=Math.floor((p.x+p.w-.01)/T);x++)if(solid(x,y))a.push({x:x*T,y:y*T});return a}function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function releaseReward(kind,block){
 // Always emerge above the brick, even when Big Elley-Oh! breaks a row of bricks.
 pickups.push({kind,x:block.x+6,y:block.y-22,w:20,h:20,vx:kind==='milk'?1.5:0,vy:-4,age:0});
}
function castleDoor(){const center=Math.max(80,Math.min(W*T-80,level.goal.x*T+16));return {x:center-13,y:(level.goal.y+1)*T-49,w:26,h:49}}
// The pink home at the finish, drawn in the course's style.
function pinkCastle(){art().home(ctx,castleDoor())}

// Spikes hurt only where the triangle is drawn (base 2..30 at y 31, point at 16,5), shrunk by a few
// pixels so a near miss counts as a miss. The empty corners of the 32 x 32 square are safe.
function touchesSpike(p,tx,ty){
 const grace=3,point=5+grace,base=31,halfBase=14-grace,left=p.x-tx*T,right=left+p.w,top=p.y-ty*T,feet=top+p.h;
 if(feet<=point||top>=base)return false;
 // The triangle is widest at the bottom, so check its width at the lowest part of the player inside it.
 const reach=halfBase*(Math.min(feet,base)-point)/(base-point);
 return left<16+reach&&right>16-reach;
}

function tryGrow(){
 if(!player.pendingMilk||!player.small)return;
 const grown={...player,y:player.y+player.h-48,h:48};
 if(!collide(grown).length){player.y=grown.y;player.h=48;player.small=false;player.pendingMilk=false;sound?.effect('grow');message('Milk makes Elley-Oh! BIG! Now you can smash bricks!')}
}
function shrink(){sound?.effect('hurt');const feet=player.y+player.h;player.small=true;player.h=28;player.y=feet-28;player.pendingMilk=false;player.hurt=90;message('Oops! Small again — find another glass of milk!')}
function step(){if(!playing||won||dead)return;const p=player;p.hurt=Math.max(0,p.hurt-1);tryGrow();p.shield=Math.max(0,p.shield-1);p.boost=Math.max(0,p.boost-1);const jump=keys.Space||keys.ArrowUp||keys.KeyW;const sprinting=!!(keys.ShiftLeft||keys.ShiftRight),speed=sprinting?6.2:3.9;p.vx=((keys.ArrowRight||keys.KeyD)?speed:0)-((keys.ArrowLeft||keys.KeyA)?speed:0);if(p.vx)p.face=Math.sign(p.vx);p.anim=p.vx?p.anim+Math.abs(p.vx):0;if(jump&&!jumpHeld&&p.ground){p.vy=(sprinting?-14.5:-11.5)-(p.boost>0?2.5:0);p.ground=false;sound?.effect('jump')}jumpHeld=!!jump;if(!jump&&p.vy<-4)p.vy=-4;p.vy=Math.min(p.vy+.5,12);p.x+=p.vx;for(const b of collide(p))p.x=p.vx>0?b.x-p.w:b.x+T;p.y+=p.vy;p.ground=false;
const verticalHits=collide(p),rising=p.vy<0;
if(verticalHits.length){
 if(rising){
  p.y=Math.max(...verticalHits.map(b=>b.y+T));
  for(const b of verticalHits){const tx=b.x/T,ty=b.y/T,kind=tileAt(tx,ty);if(['brick','emptybrick','treatbrick','shieldbrick','jumpbrick','milkbrick'].includes(kind)){
   const blockKey=`${tx},${ty}`;
   const reward={treatbrick:'treat',shieldbrick:'shield',jumpbrick:'boost',milkbrick:'milk'}[kind];
   if(p.small){
    bumps.set(blockKey,12);sound?.effect('bump');
    if(reward){used.add(blockKey);releaseReward(reward,b)}
   }else{
    broken.add(blockKey);sound?.effect('break');
    if(reward)releaseReward(reward,b);
    for(let i=0;i<4;i++)debris.push({x:b.x+(i%2)*16,y:b.y+Math.floor(i/2)*16,vx:i%2?2.4:-2.4,vy:-4-Math.floor(i/2)*2,life:32});
   }
  }}
 }else{p.y=Math.min(...verticalHits.map(b=>b.y-p.h));p.ground=true}
 p.vy=0;
}
for(const [key,time] of bumps){if(time<=1)bumps.delete(key);else bumps.set(key,time-1)}
for(const d of debris){d.x+=d.vx;d.y+=d.vy;d.vy+=.4;d.life--}debris=debris.filter(d=>d.life>0);
for(const item of pickups){
 item.age++;
 // Resolve falling first so a supporting platform never counts as a side wall.
 item.vy=Math.min(item.vy+.25,6);item.y+=item.vy;
 const hits=collide(item);if(hits.length){if(item.vy>0)item.y=Math.min(...hits.map(b=>b.y-item.h));else item.y=Math.max(...hits.map(b=>b.y+T));item.vy=0}
 if(item.kind==='milk'){
  item.vx??=1.5;item.x+=item.vx;
  const walls=collide(item);if(walls.length){const right=item.vx>0;item.x=right?Math.min(...walls.map(b=>b.x-item.w)):Math.max(...walls.map(b=>b.x+T));item.vx*=-1}
 }
 if(item.age>12&&overlap(p,item)){sound?.effect('pickup');
  if(item.kind==='milk'){if(p.small){p.pendingMilk=true;tryGrow();if(p.pendingMilk)message('Milk collected! Step into an open space to grow.')}else message('More milk! Elley-Oh! is already big.')}
  if(item.kind==='treat'){p.treats++;message('Yum! Hidden treat found! 🍬')}
  if(item.kind==='shield'){p.shield=600;message('Shield! Safe from critters and spikes for 10 seconds')}
  if(item.kind==='boost'){p.boost=720;message('Jump boost! Extra-high jumps for 12 seconds')}
  item.collected=true;
 }
}pickups=pickups.filter(item=>!item.collected&&item.y<H*T+80);
if(p.y>H*T+80){die();return}for(const k of coins){const [x,y]=k.split(',').map(Number);if(overlap(p,{x:x*T+7,y:y*T+5,w:18,h:24})){coins.delete(k);p.score++;sound?.effect('pickup')}}for(let y=Math.max(0,Math.floor(p.y/T));y<Math.min(H,Math.ceil((p.y+p.h)/T));y++)for(let x=Math.max(0,Math.floor(p.x/T));x<Math.min(W,Math.ceil((p.x+p.w)/T));x++)if(level.tiles[y][x]==='spike'&&p.shield===0&&touchesSpike(p,x,y)){die();return}for(const e of enemies){if(e.flat>0)e.flat--;if(e.dead)continue;let nx=e.x+e.v;if(solid(Math.floor((nx+(e.v>0?25:0))/T),Math.floor((e.y+10)/T))||!solid(Math.floor((nx+(e.v>0?25:0))/T),Math.floor((e.y+25)/T)))e.v*=-1;e.x+=e.v;if(overlap(p,{x:e.x,y:e.y,w:26,h:24})){if(p.shield>0){e.dead=true}else if(p.vy>0&&p.y+p.h<e.y+14){e.dead=true;e.flat=30;p.vy=-8;sound?.effect('stomp')}else if(p.hurt===0){if(!p.small)shrink();else{die();return}}}}if(overlap(p,castleDoor())){won=true;sound?.stopMusic();sound?.effect('win');message('Welcome home, Elley-Oh! 🎉');finishChapter()}cam=Math.max(0,Math.min(W*T-canvas.width,p.x-300));$('camera').value=cam/T}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function character(x,y){art().hero(ctx,x,y,{face:1})}
function rewardIcon(kind,x,y){art().item(ctx,kind,x,y)}
function tile(t,x,y,near=()=>''){art().tile(ctx,t,x,y,{build:!playing,tick,near})}
function heroPose(p){return {big:!p.small,face:p.face,pose:!p.ground?'jump':p.vx?(Math.floor(p.anim/20)%2?'walk1':'walk2'):'stand'}}
function draw(){const s=art();ctx.clearRect(0,0,960,512);s.sky(ctx,cam,tick);ctx.save();ctx.translate(-cam,0);
 for(let y=0;y<H;y++)for(let x=Math.floor(cam/T);x<Math.min(W,Math.ceil((cam+960)/T));x++){const t=tileAt(x,y),k=`${x},${y}`;if(!t||(playing&&(t==='enemy'||(t==='coin'&&!coins.has(k)))))continue;
  // Ground joins up with its neighbours; the course edges and the floor below count as more ground.
  tile(t,x*T,y*T-(playing&&bumps.has(k)?Math.sin(bumps.get(k)/12*Math.PI)*5:0),(dx,dy)=>x+dx<0||x+dx>=W||y+dy>=H?t:tileAt(x+dx,y+dy))}
 pinkCastle();
 if(playing){for(const item of pickups)s.item(ctx,item.kind,item.x-3,item.y-3);for(const d of debris)s.debris(ctx,d);for(const e of enemies)if(!e.dead||e.flat>0)s.enemy(ctx,e.x,e.y,{tick,dir:e.v,flat:e.dead});
  ctx.save();if(player.hurt>0&&Math.floor(player.hurt/6)%2)ctx.globalAlpha=.4;s.hero(ctx,player.x,player.y,heroPose(player));ctx.restore();
  if(player.shield>0)s.shield(ctx,player,tick);if(player.boost>0){rect(player.x-4,player.y+player.h-10,3,9,'#b18ce9');rect(player.x+player.w+3,player.y+player.h-10,3,9,'#b18ce9')}}
 else{s.hero(ctx,level.start.x*T+5,level.start.y*T+4,{face:1});ctx.strokeStyle=s.grid;ctx.lineWidth=1;for(let x=0;x<=W;x++){ctx.beginPath();ctx.moveTo(x*T+.5,0);ctx.lineTo(x*T+.5,512);ctx.stroke()}for(let y=0;y<=H;y++){ctx.beginPath();ctx.moveTo(cam,y*T+.5);ctx.lineTo(cam+960,y*T+.5);ctx.stroke()}}
 ctx.restore();
 if(playing)s.hud(ctx,{coins:player.score,treats:player.treats,big:!player.small,shield:Math.ceil(player.shield/60),boost:Math.ceil(player.boost/60),chapter:chapterNumber});
 $('score').textContent=playing?`ELLEY-OH! · ${player.small?'SMALL · ':'BIG · '}● ${player.score} COINS · 🍬 ${player.treats}${player.shield>0?' · SHIELD '+Math.ceil(player.shield/60)+'s':''}${player.boost>0?' · JUMP '+Math.ceil(player.boost/60)+'s':''}`:`60 × 16 BLOCKS · ${s.name.toUpperCase()} STYLE`}
function frame(t){if(!stamp)stamp=t;acc+=Math.min(t-stamp,100);stamp=t;while(acc>=1000/60){step();acc-=1000/60;tick++}draw();requestAnimationFrame(frame)}
setLevel(starter());
if(story){try{const w=story.load(level),params=new URLSearchParams(location.search),requested=params.get('level');chapterId=w.levels.some(c=>c.id===requested)?requested:(w.levels.some(c=>c.id===w.selected)?w.selected:w.levels[0].id);story.select(chapterId);setLevel(story.chapter(chapterId).level);chapterNumber=w.levels.findIndex(c=>c.id===chapterId)+1;$('chapter-label').textContent='CHAPTER '+chapterNumber+' · '+w.title;message('Chapter loaded · edits save automatically');if(params.get('mode')==='play')requestPlay()}catch(e){message('Story storage unavailable: '+e.message+' — use Export for a backup.')}}
else{try{const saved=localStorage.getItem('jumpWorkshop');if(saved){const l=JSON.parse(saved);if(l.version===1&&l.tiles?.length===H)setLevel(l)}}catch{}}
requestAnimationFrame(frame);

// Another window saved the story (for example, renamed this level). Show it, unless this page has unsaved edits.
document.addEventListener('storychange',()=>{if(!story||!chapterId||playing||dirty)return;try{const w=story.get();level=story.chapter(chapterId).level;showStyle();$('title').value=level.title;chapterNumber=w.levels.findIndex(c=>c.id===chapterId)+1;$('chapter-label').textContent='CHAPTER '+chapterNumber+' · '+w.title}catch{message('This chapter was removed in another window. Open World Maker to choose another.')}});

document.addEventListener('visibilitychange',()=>{if(document.hidden){keys={};sound?.stop()}else if(playing&&!dead&&!won){sound?.unlock();sound?.music()}});

window.addEventListener('pagehide',()=>{flushChapter();try{sessionStorage.setItem('jumpWorkshopDraft',JSON.stringify(level))}catch{}sound?.stop()});

window.addEventListener('beforeunload',e=>{if(dirty&&!flushChapter()){e.preventDefault();e.returnValue=''}});
