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
stub='''const noop=()=>{};const elements={};const context=new Proxy({},{get:()=>noop,set:()=>true});function element(){return {value:'',dataset:{},classList:{add:noop,toggle:noop},append:noop,focus:noop,getContext:()=>context,getBoundingClientRect:()=>({left:0,top:0,width:960,height:512}),setPointerCapture:noop};}const document={addEventListener:noop,getElementById:id=>elements[id]||(elements[id]=element()),createElement:element,querySelector:()=>element(),querySelectorAll:()=>[],activeElement:{tagName:'BODY'}};const soundCalls=[];const window={addEventListener:noop,GameSound:{stop:()=>soundCalls.push('stop'),unlock:noop,music:()=>soundCalls.push('music'),stopMusic:noop,effect:e=>soundCalls.push(e)}};const localStorage={getItem:()=>null,setItem:noop};const requestAnimationFrame=noop;'''
source=(pathlib.Path(__file__).resolve().parents[1]/'dist/game.js').read_text()
tests='''function assert(v,s){if(!v)throw Error(s)};assert(level.tiles.length===16,'height');playing=true;reset();for(let i=0;i<60;i++)step();assert(player.ground,'land on floor');const oldY=player.y;keys.Space=true;step();assert(player.y<oldY,'jump');keys={};reset();player.x=6*T+5;player.y=9*T;step();assert(player.score===1,'collect coin');reset();player.x=level.goal.x*T;player.y=level.goal.y*T;step();assert(won,'finish');reset();player.y=700;step();assert(dead&&!$('game-over').hidden,'fall shows game over');reset();playing=false;draw();playing=true;draw();'Physics and rendering smoke checks passed';'''

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
setLevel(blank());playing=true;reset();player.x=castleDoor().x;player.y=castleDoor().y+12;step();assert(won,'castle door completes course');pinkCastle();
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

e=ctypes.c_void_p();s=j.JSStringCreateWithUTF8CString((stub+source+tests).encode());r=j.JSEvaluateScript(c,s,None,None,1,ctypes.byref(e));v=e.value or r;st=j.JSValueToStringCopy(c,v,None);buf=ctypes.create_string_buffer(4096);j.JSStringGetUTF8CString(st,buf,4096);print(buf.value.decode());raise SystemExit(1 if e.value else 0)
