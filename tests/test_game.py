import ctypes,pathlib
j=ctypes.CDLL('libjavascriptcoregtk-4.1.so.0')
j.JSGlobalContextCreate.restype=ctypes.c_void_p
j.JSGlobalContextCreate.argtypes=[ctypes.c_void_p]
j.JSStringCreateWithUTF8CString.restype=ctypes.c_void_p
j.JSStringCreateWithUTF8CString.argtypes=[ctypes.c_char_p]
j.JSEvaluateScript.restype=ctypes.c_void_p
j.JSEvaluateScript.argtypes=[ctypes.c_void_p,ctypes.c_void_p,ctypes.c_void_p,ctypes.c_void_p,ctypes.c_int,ctypes.POINTER(ctypes.c_void_p)]
j.JSValueToStringCopy.restype=ctypes.c_void_p
j.JSValueToStringCopy.argtypes=[ctypes.c_void_p,ctypes.c_void_p,ctypes.c_void_p]
j.JSStringGetUTF8CString.argtypes=[ctypes.c_void_p,ctypes.c_char_p,ctypes.c_size_t]
c=j.JSGlobalContextCreate(None)
stub='''const noop=()=>{};const elements={};const context=new Proxy({},{get:()=>noop,set:()=>true});function element(){return {value:'',dataset:{},classList:{add:noop,toggle:noop},append:noop,focus:noop,getContext:()=>context,getBoundingClientRect:()=>({left:0,top:0,width:960,height:512}),setPointerCapture:noop};}const document={addEventListener:noop,getElementById:id=>elements[id]||(elements[id]=element()),createElement:element,querySelector:()=>element(),querySelectorAll:()=>[],activeElement:{tagName:'BODY'}};const soundCalls=[];const window={addEventListener:noop,GameSound:{stop:()=>soundCalls.push('stop'),unlock:noop,music:()=>soundCalls.push('music'),stopMusic:noop,effect:e=>soundCalls.push(e)}};const localStorage={getItem:()=>null,setItem:noop};const requestAnimationFrame=noop;const clearTimeout=noop;const setTimeout=noop;'''
dist=pathlib.Path(__file__).resolve().parents[1]/'dist'
source=(dist/'styles.js').read_text()+(dist/'game.js').read_text()
tests='''function assert(v,s){if(!v)throw Error(s)};assert(level.tiles.length===16,'height');playing=true;reset();for(let i=0;i<60;i++)step();assert(player.ground,'land on floor');const oldY=player.y;keys.Space=true;step();assert(player.y<oldY,'jump');keys={};reset();player.x=6*T+5;player.y=9*T;step();assert(player.score===1,'collect coin');reset();player.x=level.goal.x*T;player.y=14*T-player.h;step();assert(doorFade===40,'the finish house door leads inside');reset();player.y=700;step();assert(dead&&!$('game-over').hidden,'fall shows game over');reset();playing=false;draw();playing=true;draw();'Physics and rendering smoke checks passed';'''

tests+='''
setLevel(blank());level.tiles[11][5]='brick';playing=true;reset();player.small=false;player.x=5*T+5;player.y=12*T;player.vy=-7;keys.Space=true;step();assert(broken.has('5,11'),'head hit breaks brick');assert(!solid(5,11),'broken brick has no collision');assert(level.tiles[11][5]==='brick','builder preserves brick');assert(debris.length===4,'break fragments');draw();reset();assert(solid(5,11),'restart restores brick');
player.x=5*T+5;player.y=11*T-player.h-1;player.vy=3;keys={};step();assert(!broken.has('5,11')&&player.ground,'landing does not break brick');
level.tiles[11][5]='ground';reset();player.small=false;player.x=5*T+5;player.y=12*T;player.vy=-7;keys.Space=true;step();assert(!broken.has('5,11')&&player.vy===0,'ground stays intact');
function jumpDistance(sprint){setLevel(blank());playing=true;reset();for(let i=0;i<5;i++)step();const start=player.x;keys={ArrowRight:true,Space:true,ShiftLeft:sprint};step();for(let i=0;i<100&&!player.ground;i++)step();return player.x-start}
const walkJump=jumpDistance(false),sprintJump=jumpDistance(true);assert(sprintJump>walkJump*1.5,'sprint jumps farther');
keys={ArrowRight:true};step();assert(player.vx===3.9,'release sprint restores walking speed');keys.ShiftRight=true;step();assert(player.vx===6.2,'right shift sprints');
'Brick breaking, reset, landing, ground, sprint distance and release checks passed';
'''


tests+='''
function jumpHeight(sprint){setLevel(blank());playing=true;keys={};reset();for(let i=0;i<5;i++)step();const base=player.y;let top=base;keys={Space:true,ShiftLeft:sprint};step();top=Math.min(top,player.y);for(let i=0;i<100&&!player.ground;i++){step();top=Math.min(top,player.y)}return base-top}
const normalHeight=jumpHeight(false),sprintHeight=jumpHeight(true);assert(sprintHeight>normalHeight*1.5,'sprint jump is substantially higher');
'Sprint jump height verified: normal '+normalHeight+'px, sprint '+sprintHeight+'px';
'''

tests+='''
for(const [kind,reward] of [['treatbrick','treat'],['shieldbrick','shield'],['jumpbrick','boost']]){
 setLevel(blank());level.tiles[11][5]=kind;playing=true;keys={Space:true};reset();player.small=false;player.x=5*T+5;player.y=12*T;player.vy=-7;step();
 assert(broken.has('5,11')&&pickups.length===1&&pickups[0].kind===reward,'block releases '+reward);
 assert(level.tiles[11][5]===kind,'content preserved in builder');
 let item=pickups[0];item.x=player.x;item.y=player.y;item.vy=0;item.age=13;keys={};step();
 assert(pickups.length===0,'collect released item once');
 if(reward==='treat')assert(player.treats===1,'treat counted');
 if(reward==='shield')assert(player.shield===600,'shield activated');
 if(reward==='boost')assert(player.boost===720,'boost activated');
 draw();playing=false;draw();playing=true;reset();assert(pickups.length===0&&player.treats===0&&player.shield===0&&player.boost===0&&!broken.size,'restart clears powers and restores blocks');
}
setLevel(blank());playing=true;reset();keys={};player.shield=3;player.boost=3;step();step();step();assert(player.shield===0&&player.boost===0,'power timers expire');
player.x=5*T;player.y=13*T;level.tiles[13][5]='spike';player.shield=100;step();assert(player.x===5*T,'shield protects against spikes');
enemies=[{x:player.x,y:player.y,v:0,dead:false}];step();assert(enemies[0].dead,'shield defeats critters');
level.tiles[13][5]='';reset();for(let i=0;i<5;i++)step();player.boost=720;keys={Space:true};step();assert(player.vy===-13.5,'boost increases jump launch');
'All hidden item, collection, reset, power timer, shield protection and jump boost checks passed';
'''


tests+='''
setLevel(blank());playing=true;keys={Space:true};reset();assert(player.small,'Elley-Oh starts small');
level.tiles[11][5]='brick';player.x=5*T+5;player.y=12*T;player.vy=-7;step();assert(solid(5,11)&&!broken.size&&!debris.length,'small hero cannot break brick');assert(bumps.has('5,11'),'brick visibly bumps');
for(const [kind,reward] of [['treatbrick','treat'],['shieldbrick','shield'],['jumpbrick','boost']]){
 setLevel(blank());level.tiles[11][5]=kind;playing=true;reset();keys={Space:true};player.x=5*T+5;player.y=12*T;player.vy=-7;step();
 assert(!broken.size&&solid(5,11)&&tileAt(5,11)==='emptybrick','reward leaves solid empty block');
 assert(pickups.length===1&&pickups[0].kind===reward&&pickups[0].y+20<11*T,'reward pops above block');
 player.y=12*T;player.vy=-7;step();assert(pickups.length===1,'second bump cannot duplicate reward');
 draw();playing=false;assert(tileAt(5,11)===kind,'builder retains original contents');draw();playing=true;reset();assert(!used.size&&tileAt(5,11)===kind,'restart refills block');
}
'All checks passed, including small Elley-Oh brick bumps, one-time rewards, and restored contents';
'''


tests+='''
setLevel(blank());level.tiles[11][5]='milkbrick';playing=true;reset();keys={Space:true};player.x=5*T+5;player.y=12*T;player.vy=-7;step();assert(pickups[0].kind==='milk'&&used.has('5,11'),'milk released by small bump');
player.x=8*T;player.y=14*T-player.h;keys={};pickups[0].x=player.x;pickups[0].y=player.y;pickups[0].vy=0;pickups[0].age=20;step();assert(!player.small&&player.h===48&&player.y+player.h===14*T,'milk grows with feet fixed');
level.tiles[11][8]='treatbrick';player.y=12*T;player.vy=-7;keys.Space=true;step();assert(broken.has('8,11')&&pickups.some(i=>i.kind==='treat'),'big hero smashes reward brick');
level.tiles[11][8]='';player.x=10*T;player.y=14*T-48;player.vy=0;keys={};enemies=[{x:player.x,y:14*T-24,v:0,dead:false}];step();assert(player.small&&player.h===28&&player.hurt===90,'enemy shrinks big hero');assert(player.y+player.h===14*T,'shrink keeps feet fixed');step();assert(player.hurt===89&&player.x===10*T,'grace period prevents immediate second hit');
player.hurt=0;step();assert(dead&&!$('game-over').hidden,'later small hit shows game over');
reset();player.x=5*T;player.y=14*T-28;level.tiles[12][5]='brick';player.pendingMilk=true;tryGrow();assert(player.small&&player.pendingMilk,'low ceiling delays growth');player.x=8*T;tryGrow();assert(!player.small&&!player.pendingMilk,'growth completes in open space');
reset();assert(player.small&&player.h===28&&!player.pendingMilk,'restart resets size');playing=false;tile('milkbrick',0,0);playing=true;draw();
'All gameplay checks passed, including milk growth, ceiling clearance, big brick breaking, shrinking and grace period';
'''


tests+='''
setLevel(blank());playing=true;reset();keys={};let milk={kind:'milk',x:5*T,y:14*T-20,w:20,h:20,vx:1.5,vy:0,age:0};pickups=[milk];step();assert(milk.x===5*T+1.5,'milk moves horizontally');
level.tiles[13][6]='brick';milk.x=6*T-milk.w;milk.y=13*T+5;milk.vx=1.5;milk.vy=0;step();assert(milk.vx<0&&milk.x+milk.w<=6*T,'milk turns at wall');
level.tiles[13][6]='';level.tiles[14][5]='';level.tiles[15][5]='';milk.x=5*T;milk.y=14*T-20;milk.vx=1.5;milk.vy=0;step();assert(milk.y>14*T-20,'milk falls off ledge');
const count=soundCalls.filter(e=>e==='death').length;die();const stopped=player.x;keys.ArrowRight=true;step();die();assert(player.x===stopped,'dead game freezes');assert(soundCalls.filter(e=>e==='death').length===count+1,'death sound plays once');assert(!$('game-over').hidden,'game over sign visible');$('try-again').onclick();assert(!dead&&$('game-over').hidden&&player.small,'try again resets run');assert(soundCalls.at(-1)==='music','retry starts music');
level.tiles[13][2]='spike';player.x=2*T;player.y=13*T;step();assert(dead,'spikes show game over');$('death-build').onclick();assert(!playing&&$('game-over').hidden,'game over can return to builder');
'All gameplay checks passed, including moving milk, wall turns, falling, game-over sound/sign, retry, and builder';
'''


tests+='''
setLevel(blank());playing=true;reset();keys={Space:true};player.small=false;player.x=8*T;player.y=12*T;player.vy=-7;for(let x=6;x<12;x++)level.tiles[11][x]='brick';level.tiles[11][8]='milkbrick';step();assert(pickups[0]?.kind==='milk','big character releases milk from brick row');const releasedMilk=pickups[0],releaseX=releasedMilk.x;assert(releasedMilk.y+releasedMilk.h<11*T,'milk emerges above neighboring bricks');player.x=2*T;player.y=14*T-player.h;keys={};for(let i=0;i<40;i++)step();assert(releasedMilk.x>releaseX+50,'milk keeps walking away from a row');
cam=300;const worldMilkX=releasedMilk.x;draw();assert(releasedMilk.x===worldMilkX,'camera drawing preserves milk world position');
setLevel(blank());playing=true;reset();player.x=castleDoor().x;player.y=14*T-player.h;player.ground=true;step();assert(doorFade===40&&!won,'the house door leads inside');for(let i=0;i<20;i++)step();assert(inside&&level.room&&critters.some(e=>e.kind==='boss'),'the boss room is inside the house');setLevel(blank());assert(!inside&&!level.room,'loading a course leaves the house');pinkCastle();
'Milk release, continuous movement, camera coordinates and castle finish checks passed';
'''

tests+='''
// A spike is drawn as a triangle (base corners 2,31 and 30,31, point 16,5) inside its 32 x 32 square.
// Only touching that triangle should end the run, not the empty corners of the square.
function spikeCase(x,y){setLevel(blank());level.tiles[13][5]='spike';playing=true;keys={};reset();player.x=x;player.y=y;player.vy=-.5;step();return dead}
const feetOnFloor=14*T-28;
assert(!spikeCase(5*T-22+6,13*T+10-28),'brushing the empty corner beside the spike point is safe');
assert(!spikeCase(5*T,13*T+4-28),'clearing the spike point is safe');
assert(!spikeCase(5*T-22+4,feetOnFloor),'a near miss at the left of the spike base is safe');
assert(!spikeCase(5*T+28,feetOnFloor),'a near miss at the right of the spike base is safe');
assert(spikeCase(5*T-22+7,feetOnFloor),'walking into the spike from the left is game over');
assert(spikeCase(5*T+26,feetOnFloor),'walking into the spike from the right is game over');
assert(spikeCase(5*T+5,13*T+20-28),'landing on the spike is game over');
'All gameplay checks passed, including spikes that hurt only where they are drawn';
'''

tests+='''
// Game styles: four looks with an 8-bit fallback; every style draws build and play mode with all parts.
assert(styles.list.length===4&&styles.get('nope').id==='classic','four styles, unknown ones fall back to 8-bit');
setLevel(blank());assert(art().id==='classic','courses saved before styles use the 8-bit style');
for(const id of styles.ids){
 setStyle(id);assert(art().id===id,'style chosen: '+id);
 playing=false;level.tiles[13][4]='enemy';level.tiles[12][6]='treatbrick';level.tiles[11][6]='coin';level.tiles[13][8]='spike';level.tiles[10][3]='emptybrick';draw();
 playing=true;reset();player.shield=10;player.boost=10;player.small=false;pickups.push({kind:'milk',x:100,y:100,w:20,h:20});debris.push({x:1,y:1,vx:0,vy:0,life:3});enemies.push({x:50,y:50,v:1,dead:true,flat:5});draw();playing=false;
}
const historyBefore=history.length;setStyle('classic');assert(level.style==='classic'&&history.length===historyBefore+1,'a style change can be undone');$('undo').onclick();assert(level.style==='modern','undo restores the previous style');
playing=true;setStyle('world');assert(level.style==='modern','the style cannot change while playing');playing=false;
setStyle('unknown');assert(level.style==='modern','unknown styles are ignored');
// Elley-Oh! faces the way he walks, swaps walking frames, and has a jumping pose.
setLevel(blank());playing=true;reset();keys={};for(let i=0;i<10;i++)step();assert(heroPose(player).pose==='stand'&&player.face===1,'stands facing right');
keys={ArrowLeft:true};const poses=new Set();for(let i=0;i<30;i++){step();poses.add(heroPose(player).pose)}
assert(player.face===-1&&poses.has('walk1')&&poses.has('walk2'),'walking left faces left and animates');
keys={Space:true};step();step();assert(heroPose(player).pose==='jump','jumping pose in the air');
// A stomped critter stays squashed for half a second, then disappears.
setLevel(blank());playing=true;reset();keys={};for(let i=0;i<10;i++)step();enemies=[{x:player.x,y:14*T-24,v:0,dead:false}];player.y=14*T-24-player.h-2;player.vy=4;step();
assert(enemies[0].dead&&enemies[0].flat===30,'stomp squashes the critter');for(let i=0;i<30;i++)step();assert(enemies[0].flat===0,'squashed critter disappears');
'All gameplay checks passed, including game styles, walking poses and squashed critters';
'''

tests+='''
// Pipe building fills two columns to the first solid tile and preserves the floor.
setLevel(blank());placePipe(4,10);assert(level.tiles[10][4]==='pipe'&&level.tiles[13][5]==='pipe'&&level.tiles[14][4]==='ground','pipe fills to floor');assert(solid(4,11),'pipe is solid');placePipe(59,11);assert(level.tiles[11][59]==='pipe'&&level.tiles[14][59]==='ground','last column makes a narrow pipe');
// A pipe snapper rises, pauses, sinks, and retreats when the player approaches.
setLevel(blank());level.tiles[13][8]='pipe';level.tiles[13][9]='pipe';level.tiles[12][8]='plant';playing=true;keys={};reset();player.x=15*T;const plant=critters.find(e=>e.kind==='plant');assert(plant.pipeTop===13*T,'snapper detects pipe');for(let i=0;i<85;i++)step();assert(plant.exposure>20,'snapper rises after hiding');player.x=plant.x;player.y=0;step();assert(plant.exposure===0,'snapper stays hidden near player');setLevel(blank());level.tiles[13][8]='plant';playing=true;reset();assert(critters[0].pipeTop===null,'unmounted snapper stands in place');
// A turtle becomes a still shell, can be kicked, and a moving shell can be stopped.
setLevel(blank());level.tiles[13][8]='turtle';playing=true;keys={};reset();const turtle=critters[0];player.x=turtle.x;player.y=turtle.y-player.h-2;player.vy=4;step();assert(turtle.state==='still'&&turtle.wake===360,'stomp makes a still shell');player.x=turtle.x-18;player.y=turtle.y-10;player.vy=0;step();assert(turtle.state==='moving'&&Math.abs(turtle.v)===6&&turtle.kickGrace>0,'touch kicks shell '+JSON.stringify({state:turtle.state,v:turtle.v,grace:turtle.kickGrace,p:{x:player.x,y:player.y,vy:player.vy},t:{x:turtle.x,y:turtle.y}}));player.x=turtle.x+4;player.y=turtle.y-player.h-2;player.vy=4;step();assert(turtle.state==='still','stomp stops moving shell');player.x=2*T;player.y=0;for(let i=0;i<361;i++)step();assert(turtle.state==='walk','still shell wakes after six seconds');
// Fish bob and swim without gravity; a ground-level stomp defeats one.
setLevel(blank());level.tiles[11][8]='fish';playing=true;reset();const fish=critters[0],fishX=fish.x,fishY=fish.y;step();assert(fish.x!==fishX&&Math.abs(fish.y-fishY)<4,'fish swims and bobs');player.x=fish.x;player.y=fish.y-player.h-2;player.vy=4;step();assert(fish.dead,'fish can be stomped on ground');
setLevel({...blank(),theme:'underwater'});playing=true;keys={};reset();player.x=10*T;player.y=100;player.vy=0;step();assert(Math.abs(player.vy-.15)<.001,'water gravity');keys.Space=true;step();assert(player.vy<-4,'first swim stroke');keys.Space=false;step();keys.Space=true;step();assert(player.vy<-4,'midwater swim stroke');player.y=1;player.vy=-8;keys.Space=false;step();assert(player.y===0,'water surface clamps player');
'Pipes, snapper, shell turtle, fish and underwater movement checks passed';
'''

tests+='''
// Each surprise block releases a stationary power. A small hero grows unless a ceiling blocks it.
for(const [block,power]of [['firebrick','fire'],['icebrick','ice'],['tanukibrick','tanuki']]){
 setLevel(blank());level.tiles[11][6]=block;playing=true;keys={};reset();player.x=6*T+5;player.y=12*T;player.vy=-7;step();assert(pickups.length===1&&pickups[0].kind===power&&pickups[0].vy===0,'surprise releases '+power);const item=pickups[0];item.x=player.x;item.y=player.y;item.age=13;player.y=14*T-player.h;player.vy=0;item.y=player.y;step();assert(player.power===power&&!player.small,'small hero grows with '+power);reset();assert(player.power===null&&player.small,'restart removes power')
}
setLevel(blank());playing=true;keys={};reset();for(let i=0;i<5;i++)step();player.power='fire';player.small=false;player.h=48;player.y=14*T-48;enemies=[{x:player.x,y:player.y+20,v:0,dead:false}];step();assert(player.power===null&&!player.small&&player.hurt>0,'hit removes power while keeping big size');
// Fire shots travel forward and defeat a critter; the limit is two.
setLevel(blank());playing=true;keys={};reset();for(let i=0;i<5;i++)step();player.power='fire';player.small=false;player.h=48;player.y=14*T-48;enemies=[{x:player.x+80,y:14*T-24,v:0,dead:false}];usePower();usePower();usePower();assert(projectiles.length===2,'at most two fireballs');for(let i=0;i<15;i++)step();assert(enemies[0].dead,'fire defeats chip');
// Ice freezes a critter into solid grid terrain, then the terrain shatters.
setLevel(blank());playing=true;keys={};reset();for(let i=0;i<5;i++)step();player.power='ice';player.small=false;player.h=48;player.y=14*T-48;enemies=[{x:player.x+80,y:14*T-24,v:0,dead:false}];usePower();for(let i=0;i<15;i++)step();assert(enemies[0].dead&&frozen.size===1,'ice freezes a critter');const frozenKey=[...frozen.keys()][0],cell=frozenKey.split(',').map(Number);assert(solid(cell[0],cell[1]),'frozen block is solid');frozen.set(frozenKey,1);updateProjectiles();assert(!frozen.size&&!solid(cell[0],cell[1]),'frozen block shatters after timer');
// Striped tail: float, spin beside a block, defeat a critter, charge and use flight.
setLevel(blank());playing=true;keys={};reset();player.power='tanuki';player.small=false;player.h=48;player.x=5*T+5;player.y=200;player.vy=8;keys.Space=true;step();assert(player.vy<=2.5,'held jump floats while falling');keys={};player.y=14*T-48;player.vy=0;player.ground=true;level.tiles[13][6]='brick';enemies=[{x:player.x+24,y:player.y+20,v:0,dead:false}];usePower();step();assert(enemies[0].dead&&broken.has('6,13'),'tail spin attacks critter and beside block');
setLevel(blank());playing=true;keys={ShiftLeft:true,ArrowRight:true};reset();player.power='tanuki';for(let i=0;i<64;i++)step();assert(player.run>=60,'ground sprint charges flight');keys.Space=true;step();assert(player.flight>200,'charged jump starts flight');keys.Space=false;step();keys.Space=true;step();assert(player.vy<=-5,'midflight jump pushes up');
'Fire, ice, striped tail, growth, damage and flight checks passed';
'''

tests+='''
// Remaining timing and collision edges: snapper's full cycle, shell danger, fish in water.
setLevel(blank());level.tiles[13][8]='pipe';level.tiles[13][9]='pipe';level.tiles[12][8]='plant';playing=true;keys={};reset();player.x=20*T;const timedPlant=critters[0];for(let i=0;i<59;i++)updateCritters();assert(timedPlant.exposure===0,'plant hidden for 60 frames');for(let i=0;i<21;i++)updateCritters();assert(timedPlant.exposure===24,'plant finishes rising');for(let i=0;i<60;i++)updateCritters();assert(timedPlant.exposure===24,'plant stays up');for(let i=0;i<20;i++)updateCritters();assert(timedPlant.exposure===0,'plant sinks');
setLevel(blank());level.tiles[13][8]='turtle';playing=true;keys={};reset();const dangerous=critters[0];dangerous.state='moving';dangerous.v=6;dangerous.kickGrace=20;dangerous.y=14*T-18;dangerous.h=18;player.x=dangerous.x+5;player.y=14*T-28;updateCritters();assert(!dead,'newly kicked shell gives grace');dangerous.x=player.x;dangerous.kickGrace=0;updateCritters();assert(dead,'moving shell hurts after grace');
setLevel({...blank(),theme:'underwater'});level.tiles[11][8]='fish';playing=true;keys={};reset();const waterFish=critters[0];player.x=waterFish.x;player.y=waterFish.y-player.h+2;player.vy=4;updateCritters();assert(dead&&!waterFish.dead,'fish cannot be stomped underwater');
// A low ceiling delays growth while keeping the chosen power, then growth completes in open space.
setLevel(blank());level.tiles[12][2]='ground';playing=true;keys={};reset();player.x=2*T+5;player.y=14*T-28;pickups=[{kind:'fire',x:player.x,y:player.y,w:20,h:20,age:13,vy:0}];step();assert(player.power==='fire'&&player.small&&player.pendingMilk,'low ceiling delays powered growth');player.x=5*T;step();assert(!player.small&&!player.pendingMilk,'growth resumes in open space');
// Ice cannot create a solid block inside an existing tile or the player.
setLevel(blank());playing=true;reset();const occupied={x:8*T,y:14*T-24,w:26,h:24,dead:false};level.tiles[13][8]='ground';freezeCritter(occupied);assert(occupied.dead&&frozen.size===0,'occupied ice cell defeats without block');
'Critter timing, shell danger, water fish and low-ceiling checks passed';
'''

tests+='''
// A kicked shell rebounds from a wall, falls off a gap, and clears another critter.
setLevel(blank());level.tiles[13][10]='brick';level.tiles[13][8]='turtle';playing=true;keys={};reset();player.x=2*T;const rolling=critters[0];rolling.state='moving';rolling.x=9*T+3;rolling.y=14*T-18;rolling.h=18;rolling.v=6;rolling.kickGrace=20;for(let i=0;i<4;i++)updateCritters();assert(rolling.v<0,'moving shell bounces off wall');
setLevel(blank());level.tiles[13][8]='turtle';for(let x=10;x<=12;x++)level.tiles[14][x]='';playing=true;reset();const falling=critters[0];falling.state='moving';falling.x=9*T+20;falling.y=14*T-18;falling.h=18;falling.v=6;falling.kickGrace=20;const shellY=falling.y;for(let i=0;i<12;i++)updateCritters();assert(falling.y>shellY,'moving shell falls from edge');
setLevel(blank());level.tiles[13][8]='turtle';level.tiles[13][10]='plant';playing=true;reset();const shell=critters.find(e=>e.kind==='turtle'),target=critters.find(e=>e.kind==='plant');shell.state='moving';shell.y=14*T-18;shell.h=18;shell.v=6;shell.kickGrace=20;for(let i=0;i<20;i++)updateCritters();assert(target.dead,'kicked shell defeats snapper');
// Power keys trigger once per press; holding Shift continues to sprint.
setLevel(blank());playing=true;keys={};reset();player.power='fire';const powerKey={code:'ShiftLeft',preventDefault:()=>{}};key(powerKey,true);assert(projectiles.length===1&&keys.ShiftLeft,'Shift press throws and holds sprint');key(powerKey,true);assert(projectiles.length===1,'held Shift does not repeat throw');key(powerKey,false);key({code:'KeyX',preventDefault:()=>{}},true);assert(projectiles.length===2,'X activates a second shot');key({code:'KeyF',preventDefault:()=>{}},true);assert(projectiles.length===2,'fireball limit also applies to F');
'Shell rebound, falling, critter defeat and power-key checks passed';
'''

tests+='''
// Every new tile and item has art in each era and theme, in both editor and play states.
const newTiles=['pipe','plant','turtle','fish','firebrick','icebrick','tanukibrick'];
for(const id of styles.ids)for(const theme of ['ground','underwater']){const style=styles.get(id);style.setTheme(theme);style.sky(context,0,10);for(const tileName of newTiles)for(const build of [true,false])style.tile(context,tileName,64,96,{build,tick:10,near:()=>''});for(const power of ['fire','ice','tanuki']){style.hero(context,100,100,{big:true,power,face:-1,pose:'jump'});style.item(context,power,100,100)}style.plant(context,100,100,{tick:10,exposure:24});style.turtle(context,100,100,{tick:10,shell:true});style.fish(context,100,100,{tick:10});style.projectile(context,{kind:'fire',x:100,y:100});style.frozen(context,100,100)}
'All gameplay checks passed, including new critters, powers and four-style rendering';
'''

tests+='''
// A legacy course can grow without losing its tiles; new courses span 720 tiles.
assert(blank().tiles[0].length===720&&starter().goal.x===716,'new courses are 12 times longer');assert(starter().tiles[13][712]==='','exit pipe has clear approach');
const old=blank();old.tiles=old.tiles.map(row=>row.slice(0,60));old.goal.x=56;old.tiles[11][8]='brick';setLevel(old);assert(W===60&&$('camera').max===30,'old course keeps its width');extendCourse();assert(W===720&&level.goal.x===716&&level.tiles[11][8]==='brick'&&level.tiles[14][700]==='ground','extend preserves blocks and moves the finish');$('camera-next').onclick();assert(cam===20*T,'section button scrolls');$('undo').onclick();assert(W===60&&level.goal.x===56&&level.tiles[11][8]==='brick','undo restores short course');
setLevel(blank());playing=true;keys={};reset();player.power='fire';const fixedX=player.x;pauseGame();const shieldAtPause=player.shield=33;keys.ArrowRight=true;step();usePower();assert(paused&&player.x===fixedX&&player.shield===shieldAtPause&&projectiles.length===0,'pause freezes movement, timers and powers');setStyle('world');assert(level.style==='world'&&$('pause-style').value==='world','era changes while paused');resumeGame();assert(!paused&&$('pause-menu').hidden,'resume closes menu');step();assert(player.x>fixedX||player.shield===32,'resume advances the run');setStyle('classic');assert(level.style==='world','era cannot change during active play');key({code:'Escape',preventDefault:()=>{}},true);assert(paused,'Escape pauses');key({code:'KeyP',preventDefault:()=>{}},true);assert(!paused,'P resumes');
// The final guardian takes three distinct hits; all eras draw it and the pipe portals.
setLevel(blank());playing=true;reset();const guardian={kind:'boss',x:8*T,y:14*T-58,w:58,h:58,v:0,hp:3,hurt:0,dead:false};critters=[guardian];player.x=guardian.x+8;player.y=guardian.y-player.h+3;player.vy=5;updateCritters();assert(guardian.hp===2&&!guardian.dead&&player.vy<0,'stomp hurts guardian and bounces');defeat(guardian);assert(guardian.hp===2,'guardian ignores repeated hits during grace');guardian.hurt=0;freezeCritter(guardian);assert(guardian.hp===1&&!frozen.size,'ice hurts guardian without trapping it');guardian.hurt=0;defeat(guardian);assert(guardian.dead,'third hit opens the house');
for(const id of styles.ids)for(const theme of ['ground','underwater']){const s=styles.get(id);s.setTheme(theme);s.boss(context,100,100,{hp:3,tick:10});s.tile(context,'boss',100,100,{build:true});drawPortal(s,64,96)}
for(const id of styles.ids)for(const theme of ['ground','underwater']){const s=styles.get(id);s.setTheme(theme);s.mom(context,100,100,{tick:5,face:-1});speech(s,['THANK YOU,','ELLEY-OH!'],200,100)}heart(10,10,.5);pipeArrow(10,10);
// A snapper sits in the middle of its two-wide pipe, whichever column it was placed on and wherever the pipe starts.
setLevel(blank());placePipe(5,12);level.tiles[11][6]='plant';playing=true;keys={};reset();let snap=critters.filter(e=>e.kind==='plant');assert(snap.length===1&&snap[0].x+12===6*T,'snapper on right column is centred');
setLevel(blank());placePipe(5,12);level.tiles[11][5]='plant';level.tiles[11][6]='plant';playing=true;reset();snap=critters.filter(e=>e.kind==='plant');assert(snap.length===1&&snap[0].x+12===6*T,'two snappers on one pipe become one, centred');
setLevel(blank());placePipe(4,12);placePipe(6,12);level.tiles[11][7]='plant';playing=true;reset();snap=critters.find(e=>e.kind==='plant');assert(snap.x+12===7*T,'a pipe beside another pipe pairs from its own left edge');
setLevel(blank());placePipe(5,12);placePipe(7,12);placePipe(9,12);level.tiles[11][9]='plant';playing=true;reset();snap=critters.find(e=>e.kind==='plant');assert(pipeUnder(9,11).w===2&&snap.x+12===10*T,'pipe runs pair from their left end');
// Make 12x longer adds varied obstacles after the original part and keeps the end clear for the finish.
setLevel({...blank(),title:'Test grove',tiles:blank().tiles.map(r=>r.slice(0,60)),goal:{x:56,y:13}});extendCourse();const made=JSON.stringify(level.tiles),counts={};for(let y=0;y<14;y++)for(let x=63;x<696;x++){const t=level.tiles[y][x];if(t)counts[t]=(counts[t]||0)+1}
assert(['pipe','plant','spike','brick','coin','enemy','turtle','raccoon','switch','blueblock','ground'].every(t=>counts[t]>0)&&level.tiles[14].includes('redblock'),'extension adds varied obstacles: '+JSON.stringify(counts));let holes=0;for(let x=63;x<696;x++)if(!level.tiles[14][x])holes++;assert(holes>=10,'extension adds gaps');
for(let y=0;y<14;y++)for(let x=696;x<720;x++)assert(!level.tiles[y][x],'finish approach stays clear');for(let x=696;x<720;x++)assert(level.tiles[14][x]==='ground','finish has a floor');
let longestGap=0,run=0;for(let x=0;x<720;x++){run=level.tiles[14][x]?0:run+1;longestGap=Math.max(longestGap,run)}assert(longestGap<=8,'gaps stay jumpable or have platforms');
$('undo').onclick();assert(W===60,'undo removes the extension');extendCourse();assert(JSON.stringify(level.tiles)===made,'the same course always extends the same way');
setLevel({...blank(),title:'Test grove',tiles:blank().tiles.map(r=>r.slice(0,60)),goal:{x:56,y:13},theme:'underwater'});extendCourse();let waterKinds=new Set(level.tiles.flat());assert(waterKinds.has('fish')&&!waterKinds.has('enemy')&&!waterKinds.has('turtle')&&!waterKinds.has('raccoon'),'underwater extension uses fish');
// Raccoons face Elley-Oh! and throw rocks in an arc; rocks hurt on contact and break on blocks.
setLevel(blank());level.tiles[13][10]='raccoon';playing=true;keys={};reset();const coon=critters.find(e=>e.kind==='raccoon');player.x=2*T;player.y=14*T-player.h;for(let i=0;i<5;i++)step();assert(coon.dir===-1,'raccoon faces Elley-Oh!');
coon.timer=30;step();assert(coon.holding,'raccoon lifts a rock before throwing');coon.timer=1;step();let rock=hazards.find(h=>h.kind==='rock');assert(rock&&rock.vx<0&&rock.vy<0&&soundCalls.includes('throw'),'raccoon throws a rock toward Elley-Oh!');
const rockY=rock.y;for(let i=0;i<8;i++)step();assert(rock.y<rockY,'the rock flies up first');for(let i=0;i<120&&!rock.dead&&!dead;i++)step();assert(rock.dead,'the rock lands or hits');
reset();player.x=6*T;player.y=14*T-player.h;hazards=[{kind:'rock',x:player.x+4,y:player.y+4,w:12,h:12,vx:0,vy:1,age:0}];updateHazards();assert(dead&&!hazards.length,'a rock hurts Elley-Oh!');
reset();player.x=6*T;player.y=14*T-player.h;player.shield=60;hazards=[{kind:'rock',x:player.x+4,y:player.y+4,w:12,h:12,vx:0,vy:1,age:0}];updateHazards();assert(!dead&&!hazards.length,'a shield brushes rocks away');
reset();hazards=[{kind:'rock',x:3*T,y:14*T-8,w:12,h:12,vx:0,vy:3,age:0}];updateHazards();assert(!hazards.length&&debris.some(d=>d.rock),'rocks break on the ground');
reset();const coon2=critters.find(e=>e.kind==='raccoon');player.x=coon2.x;player.y=coon2.y-player.h+3;player.vy=4;updateRaccoon(coon2);assert(coon2.dead,'stomping a raccoon defeats it');
for(const id of styles.ids)for(const theme of ['ground','underwater','house']){const s=styles.get(id);s.setTheme(theme);s.raccoon(context,100,100,{tick:3,dir:-1,holding:true});s.hazard(context,{kind:'rock',x:10,y:10,vx:-2},3);s.hazard(context,{kind:'flame',x:10,y:10,vx:-3},3);s.croc(context,100,100,{tick:3,hp:2,dir:-1,open:true});s.croc(context,100,100,{tick:3,hp:1,hurt:4,dir:1});s.sky(context,40,5);s.tile(context,'ground',0,0,{near:()=>''});s.tile(context,'raccoon',0,0,{build:true})}styles.get('classic').setTheme('ground');
// ON/OFF switches: red blocks are solid while ON, blue while OFF. Head bumps, shells, fire, ice and tail spins flip them.
setLevel(blank());level.tiles[10][5]='switch';level.tiles[12][9]='redblock';level.tiles[12][10]='blueblock';playing=true;keys={};reset();assert(switchOn&&solid(5,10)&&solid(9,12)&&!solid(10,12),'runs start ON: red solid, blue outlined');
player.x=5*T+5;player.y=11*T+2;player.vy=-6;keys={Space:true};step();assert(!switchOn&&!solid(9,12)&&solid(10,12)&&solid(5,10),'a head bump flips the switch');hitBlock(5,10,{x:5*T,y:10*T});assert(!switchOn,'one hit cannot flip it twice');for(let i=0;i<15;i++)step();
keys={};player.x=2*T;player.y=14*T-player.h;player.vy=0;for(let i=0;i<15;i++)step();const wasOn=switchOn;projectiles=[{kind:'fire',x:5*T-12,y:10*T+10,w:10,h:10,vx:5,vy:0,age:0}];updateProjectiles();assert(switchOn!==wasOn,'fire flips the switch');
for(let i=0;i<15;i++)step();const before=switchOn;projectiles=[{kind:'ice',x:5*T+34,y:10*T+10,w:10,h:10,vx:-5,vy:0,age:0}];updateProjectiles();assert(switchOn!==before,'ice flips the switch');
setLevel(blank());level.tiles[13][8]='switch';playing=true;keys={};reset();player.x=2*T;player.y=14*T-player.h;const kicked={kind:'turtle',x:8*T-27,y:14*T-18,w:26,h:18,v:6,vy:0,state:'moving',kickGrace:20,wake:0,dead:false};critters=[kicked];updateCritters();assert(!switchOn&&kicked.v<0,'a kicked shell flips the switch and bounces back');
setLevel(blank());level.tiles[13][6]='switch';playing=true;keys={};reset();player.x=5*T+10;player.y=12*T+4;player.face=1;player.power='tanuki';player.small=false;player.h=48;player.y=14*T-48;usePower();for(let i=0;i<3;i++)step();assert(!switchOn,'a tail spin flips the switch');
setLevel(blank());level.tiles[13][4]='blueblock';level.tiles[10][8]='switch';playing=true;keys={};reset();player.x=4*T+4;player.y=14*T-player.h;flipSwitch(8,10);assert(!switchOn&&player.y+player.h<=13*T,'a block turning solid lifts Elley-Oh! on top');reset();assert(switchOn,'restart turns the switch back ON');
for(const id of styles.ids){const s=styles.get(id);for(const on of [true,false])for(const t of ['switch','redblock','blueblock'])s.tile(context,t,0,0,{build:false,on,near:()=>''})}playing=false;draw();
'Long course, pause menu, era change, guardian, portal, Queen Mom, snapper, extension, raccoon, rock and switch checks passed';
'''

e=ctypes.c_void_p();s=j.JSStringCreateWithUTF8CString((stub+source+tests).encode());r=j.JSEvaluateScript(c,s,None,None,1,ctypes.byref(e));v=e.value or r;st=j.JSValueToStringCopy(c,v,None);buf=ctypes.create_string_buffer(4096);j.JSStringGetUTF8CString(st,buf,4096);print(buf.value.decode())
if e.value:raise SystemExit(1)

# A second JSCore world checks the actual linked-chapter transition and arrival token.
world_stub='''const location={search:'',href:''},sessionValues=new Map(),sessionStorage={getItem:k=>sessionValues.get(k)||null,setItem:(k,v)=>sessionValues.set(k,v),removeItem:k=>sessionValues.delete(k)};globalThis.sessionStorage=sessionStorage;class URLSearchParams{get(){return null}};let demoWorld;window.StoryWorld={load(l){demoWorld={title:'Test world',selected:'first',levels:[{id:'first',level:l,story:'',complete:false},{id:'second',level:JSON.parse(JSON.stringify(l)),story:'',complete:false}]};return demoWorld},get(){return demoWorld},chapter(id){return demoWorld.levels.find(c=>c.id===id)},select(id){demoWorld.selected=id},next(id){return id==='first'?'second':null},exits(id){return id==='first'?['second']:[]},complete(id){demoWorld.levels.find(c=>c.id===id).complete=true},saveLevel(id,l){demoWorld.levels.find(c=>c.id===id).level=l}};'''
world_tests='''assert(nextChapterId()==='second','first chapter has a pipe exit');playing=true;reset();pauseGame();setStyle('modern');assert(demoWorld.levels[0].level.style==='modern','pause era saves chapter');resumeGame();const door=portalDoor();assert(solid(level.goal.x,level.goal.y)&&solid(level.goal.x+1,level.goal.y-1),'exit pipe is solid');player.x=door.x-player.w-2;player.y=14*T-player.h;keys={ArrowRight:true};for(let i=0;i<10;i++)step();assert(!transition&&player.x+player.w<=door.x,'walking into the exit pipe is blocked');player.x=door.x+20;player.y=door.y-player.h;keys={};step();assert(onExitPipe()&&!transition,'standing on the exit pipe waits for down');keys={ArrowDown:true};step();assert(transition===32,'pressing down on the exit pipe starts slide');const beforeSlide=player.y;step();assert(player.y>beforeSlide,'player slides downward');for(let i=0;i<31;i++)step();assert(location.href.includes('level=second')&&demoWorld.levels[0].complete,'slide completes and navigates');assert(sessionStorage.getItem('jumpWorkshopPipeArrival')==='second','arrival token saved');chapterId='second';setLevel(demoWorld.levels[1].level);playing=true;startRun();assert(hadArrival&&arrival===42&&player.y===66,'next chapter starts under sky pipe');assert(sessionStorage.getItem('jumpWorkshopPipeArrival')===null,'arrival token consumed once');assert(!critters.some(e=>e.kind==='boss'),'the boss waits inside the house');assert(!solid(level.goal.x,level.goal.y),'final chapter has no exit pipe');
arrival=0;const outdoorWidth=W;player.x=castleDoor().x;player.y=14*T-player.h;player.vy=0;player.ground=true;step();assert(doorFade===40,'the house door leads inside');for(let i=0;i<20;i++)step();assert(inside&&level.room&&level.theme==='house'&&W===30,'Elley-Oh! is inside the house');assert(solid(GATE_X,12)&&solid(GATE_X,2),'a gate holds Queen Mom');
die();$('try-again').onclick();assert(inside&&level.room&&critters.some(e=>e.kind==='boss'),'try again restarts the boss room');
pauseGame();setStyle('world');resumeGame();assert(demoWorld.levels[1].level.style==='world'&&demoWorld.levels[1].level.tiles[0].length===outdoorWidth&&!demoWorld.levels[1].level.room,'era change inside saves the outdoor chapter, not the room');
let keeper=critters.find(e=>e.kind==='boss');assert(keeper.croc,'the house boss is the Crocodile Boss');player.x=5*T;player.y=14*T-player.h;player.face=1;player.shield=600;const keeperStart=keeper.x;for(let i=0;i<40;i++)step();assert(keeper.x!==keeperStart&&keeper.y===keeper.baseY,'the crocodile paces along the floor');
keeper.timer=30;step();assert(keeper.open&&keeper.dir===-1,'the crocodile opens its jaws toward Elley-Oh! before burping');hazards=[];keeper.timer=1;step();const flame=hazards.find(h=>h.kind==='flame');assert(flame&&flame.vx<0&&hazards.length===1,'the crocodile burps fire toward Elley-Oh!');const flameX=flame.x;step();assert(flame.x<flameX,'the flame travels');
hazards=[];keeper.hp=1;keeper.timer=1;crocBurp(keeper);assert(hazards.length===2&&hazards[1].y<hazards[0].y&&keeper.timer===80,'when hurt it burps sooner, and two flames on its last hit');keeper.hp=3;
player.shield=0;player.hurt=0;hazards=[{kind:'flame',x:player.x,y:player.y+4,w:24,h:14,vx:-3,vy:0,age:0}];updateHazards();assert(dead,'boss fire hurts Elley-Oh!');$('try-again').onclick();assert(inside&&!dead,'try again stays in the boss room');keeper=critters.find(e=>e.kind==='boss');player.x=5*T;player.y=14*T-player.h;
for(let hit=0;hit<3;hit++){keeper.hurt=0;defeat(keeper)}assert(keeper.dead&&rescue&&rescue.phase==='walk'&&!solid(GATE_X,12),'defeating the Raccoon Boss opens the gate');assert(!hazards.length,'its flames go out');
keys={ArrowLeft:true};step();assert(player.vx===0,'player waits during the rescue');keeper.dead=false;keeper.x=player.x;keeper.y=player.y;keeper.hurt=0;critters=[keeper];hurtPlayer();assert(!player.hurt&&player.small,'critters cannot hurt during the rescue');critters=[];
let walked=0;while(rescue.phase==='walk'&&walked++<900)step();assert(rescue.phase==='talk'&&Math.abs(rescue.x+16-player.x-player.w/2)<50,'Queen Mom walks to Elley-Oh!');draw();assert(!won,'thank-you scene plays before the finish');
for(let i=0;i<220&&!won;i++)step();assert(won&&$('finish-title').textContent==='Queen Mom is saved!','rescue completes the story');assert(demoWorld.selected==='first'&&!$('next-chapter').hidden&&$('next-chapter').textContent.includes('Chapter 1'),'final chapter offers a fresh start at chapter 1');
$('next-chapter').onclick();assert(location.href.includes('level=first')&&sessionStorage.getItem('jumpWorkshopPipeArrival')===null,'start over opens chapter 1');
$('finish-replay').onclick();assert(!inside&&!level.room&&W===outdoorWidth&&!won,'play again restarts the whole chapter');'Linked pipe and sky arrival checks passed';'''
c2=j.JSGlobalContextCreate(None);e2=ctypes.c_void_p();s2=j.JSStringCreateWithUTF8CString((stub+world_stub+source+"function assert(v,s){if(!v)throw Error(s)};"+world_tests).encode());r2=j.JSEvaluateScript(c2,s2,None,None,1,ctypes.byref(e2));st2=j.JSValueToStringCopy(c2,e2.value or r2,None);buf2=ctypes.create_string_buffer(4096);j.JSStringGetUTF8CString(st2,buf2,4096);print(buf2.value.decode());raise SystemExit(1 if e2.value else 0)
