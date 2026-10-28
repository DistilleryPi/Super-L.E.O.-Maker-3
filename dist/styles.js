'use strict';
// Game styles: the same course drawn in the look of a different era of platform games, like
// switching styles in a course maker. Each style sets pixel size, colours, outlines, scenery,
// the score bar and the music theme (see sound.js). All art here is original and drawn in code.
window.GameStyles=(()=>{
 const T=32,cache=new Map();
 function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
 function rect(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
 // Build sprite rows from a function of (x, y) that returns a palette letter or '.' (clear).
 // Pipes pair up from the left end of each run; an odd last column is a narrow pipe.
 function pipeHalf(near){let n=0;while(n<720&&near(-n-1,0)==='pipe')n++;return n%2?'right':near(1,0)==='pipe'?'left':'single'}
 // ON/OFF switch blocks. Red blocks are solid while the switch is ON, blue ones while it is OFF;
 // the inactive colour is drawn as a dashed outline you can pass through.
 function switchTile(ctx,t,x,y,on,pixel){const red=['#e0413a','#8c1f1c','#ff8a7a'],blue=['#3a6fe0','#1c3a8c','#8ab4ff'];
  if(t==='switch'){const [c,d,l]=on?red:blue;rect(ctx,x,y,32,32,'#2b2833');rect(ctx,x+2,y+2,28,28,d);rect(ctx,x+3,y+3,26,24,c);rect(ctx,x+3,y+3,26,3,l);const word=on?'ON':'OFF';
   if(pixel)pixelText(ctx,word,x+16-textWidth(word,1)/2,y+12,'#ffffff','#2b2833',1);else{ctx.save();ctx.font='900 11px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#2b2833';ctx.fillText(word,x+17,y+16);ctx.fillStyle='#ffffff';ctx.fillText(word,x+16,y+15);ctx.restore()}return}
  const [c,d,l]=t==='redblock'?red:blue,active=t==='redblock'?on:!on;
  if(active){rect(ctx,x,y,32,32,d);rect(ctx,x+2,y+2,28,28,c);rect(ctx,x+2,y+2,28,4,l);rect(ctx,x+2,y+2,4,28,l);if(pixel){rect(ctx,x+12,y+12,8,8,d);rect(ctx,x+14,y+14,4,4,l)}else{ctx.save();ctx.strokeStyle=d;ctx.lineWidth=2;ctx.strokeRect(x+11,y+11,10,10);ctx.restore()}return}
  for(let i=0;i<32;i+=8){rect(ctx,x+i,y,5,2,c);rect(ctx,x+i,y+30,5,2,c);rect(ctx,x,y+i,2,5,c);rect(ctx,x+30,y+i,2,5,c)}
 }
 // A bed box: a wooden crate with a tiny bed, a moon and a Z. Bump it and every critter on screen falls asleep.
 function bedBox(ctx,x,y){rect(ctx,x,y,32,32,'#4a2a18');rect(ctx,x+2,y+2,28,28,'#c08850');rect(ctx,x+2,y+2,28,3,'#e0b078');rect(ctx,x+19,y+5,7,7,'#fff0a0');rect(ctx,x+22,y+4,6,6,'#c08850');
  for(const [a,b,w] of [[8,7,5],[11,8,1],[10,9,1],[9,10,1],[8,11,5]])rect(ctx,x+a,y+b,w,1,'#4a2a18');
  rect(ctx,x+5,y+15,3,12,'#7a4a28');rect(ctx,x+24,y+19,3,8,'#7a4a28');rect(ctx,x+8,y+18,6,4,'#ffffff');rect(ctx,x+8,y+21,16,5,'#4a78d8');rect(ctx,x+14,y+19,10,3,'#6a98f0');rect(ctx,x+5,y+26,22,2,'#7a4a28')}
 // A dig spot: a little mound of loose earth with a twinkle, over a buried Daddo burger. Stand on it and press down to dig.
 function digSpot(ctx,x,y,tick){rect(ctx,x+7,y-3,18,4,'#6b4423');rect(ctx,x+10,y-5,12,3,'#8a5a2e');rect(ctx,x+12,y-6,4,1,'#a8763f');for(const [a,b] of [[9,4],[20,7],[14,10]])rect(ctx,x+a,y+b,3,3,'#00000033');if(Math.floor(tick/20)%3===0){rect(ctx,x+24,y-10,2,6,'#fff8c0');rect(ctx,x+22,y-8,6,2,'#fff8c0')}}
 function rows(w,h,fn){return Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>fn(x,y)).join(''))}
 // Draw sprite rows once, one canvas pixel per letter. `line` adds a one-pixel outline around it.
 function bake(key,art,pal,line){
  let s=cache.get(key);if(s)return s;
  const h=art.length,w=art[0].length,pad=line?1:0,c=surface(w+2*pad,h+2*pad),g=c.getContext('2d');
  const on=(x,y)=>y>=0&&y<h&&x>=0&&x<w&&art[y][x]!=='.';
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=art[y][x];if(k!=='.'){g.fillStyle=pal[k]||'#f0f';g.fillRect(x+pad,y+pad,1,1)}}
  if(line){g.fillStyle=line;for(let y=-1;y<=h;y++)for(let x=-1;x<=w;x++)if(!on(x,y)&&(on(x-1,y)||on(x+1,y)||on(x,y-1)||on(x,y+1)))g.fillRect(x+pad,y+pad,1,1)}
  s={c,w:w+2*pad,h:h+2*pad,pad};cache.set(key,s);return s;
 }
 // Draw a baked sprite at 2 screen pixels per sprite pixel, optionally mirrored (facing left).
 function blit(ctx,s,x,y,flip,scale=2){
  ctx.imageSmoothingEnabled=false;
  const w=s.w*scale,h=s.h*scale,dx=Math.round(x-s.pad*scale),dy=Math.round(y-s.pad*scale);
  if(flip){ctx.save();ctx.translate(dx+w,dy);ctx.scale(-1,1);ctx.drawImage(s.c,0,0,w,h);ctx.restore()}else ctx.drawImage(s.c,dx,dy,w,h);
 }
 // Round shapes for hills, bushes and clouds: circles, plus straight sides below `base` (to the floor).
 function blobArt(w,h,circles,base=h){
  const inside=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&(circles.some(([cx,cy,r])=>(x+.5-cx)**2+(y+.5-cy)**2<=r*r)||(y>=base&&circles.some(([cx,cy,r])=>y+.5>=cy&&Math.abs(x+.5-cx)<=r)));
  return rows(w,h,(x,y)=>!inside(x,y)?'.':!inside(x-1,y-1)||!inside(x,y-2)?'b':!inside(x+2,y)||!inside(x+1,y+2)?'d':'a');
 }

 // ---- Shared pixel sprites (16 pixels = one 32-pixel block). Letters are looked up in each style's palette.
 // ---- Playable characters. Every character uses the same letters: R main outfit, B second outfit colour, O shoes,
 // S skin, K eyes, H hair, W accent, Y gold. Powers recolour R, B and O, so each outfit changes with fire, ice, tail, burger and sword.
 // Elley-Oh! the electrician (faces right): C hard hat, c brim, Z lightning bolt, T tool belt, M mouth.
 const ELLEY_HEAD=[
  '.....CCCCCC.....',
  '....CCCZCCCC....',
  '...CCCZZCCCCC...',
  '..cccccccccccccc',
  '....HHSSSKSS....',
  '....HSSSSKSSS...',
  '....HSSSSSSSSS..',
  '.....SSSMMSS....'];
 // A raised arm beside the hat for jumping.
 const ELLEY_JUMP_HEAD=ELLEY_HEAD.map((r,i)=>i<2?r.slice(0,13)+'SS'+r.slice(15):r.slice(0,14)+'R'+r.slice(15));
 const SMALL={
  stand:[...ELLEY_HEAD,
  '.....RRRRRR.....',
  '....RRRRRRRR....',
  '...SRRRRWRRRS...',
  '...STTTTYTTTS...',
  '....BBBBBBBB....',
  '....BBB..BBB....',
  '....BBB..BBB....',
  '...OOOO..OOOO...'],
  walk1:[...ELLEY_HEAD,
  '.....RRRRRR.....',
  '....RRRRRRRRS...',
  '...SRRRRWRRRS...',
  '....TTTTYTTT....',
  '...BBBBBBBBBB...',
  '..BBBB...BBBB...',
  '.OOBB.....BBOO..',
  '.OOO.......OOO..'],
  walk2:[...ELLEY_HEAD,
  '.....RRRRRR.....',
  '....RRRRRRRR....',
  '....SRRRWRRS....',
  '....STTTYTTS....',
  '.....BBBBBB.....',
  '.....BBBBBB.....',
  '.....BBBOO......',
  '....OOOOOO......'],
  jump:[...ELLEY_JUMP_HEAD,
  '....RRRRRRRRRR..',
  '...RRRRRWRRRR...',
  '..SRRRRRRRR.....',
  '..STTTTYTTT.....',
  '...BBBBBBBBBB...',
  '..BBBB...BBBBOO.',
  '.OOBB.....BOOO..',
  '.OOO............']};
 const BIG={
  stand:[...ELLEY_HEAD,
  '.....RRRRRR.....',
  '....RRRRRRRR....',
  '...RRRRRRRRRR...',
  '..RRRRRRRWRRRR..',
  '..RRRRRRRRRRRR..',
  '..SRRRRRRRRRRS..',
  '..SSTTTTYTTTSS..',
  '...BBBBBBBBBB...',
  '...BBBBBBBBBB...',
  '...BBBB..BBBB...',
  '...BBBB..BBBB...',
  '...BBBB..BBBB...',
  '...BBBB..BBBB...',
  '...BBBB..BBBB...',
  '..OOOOO..OOOOO..',
  '..OOOOO..OOOOO..'],
  walk1:[...ELLEY_HEAD,
  '.....RRRRRR.....',
  '....RRRRRRRR....',
  '...RRRRRRRRRR...',
  '..RRRRRRRWRRRRS.',
  '.SRRRRRRRRRRRSS.',
  '.SSRRRRRRRRRR...',
  '....TTTTYTTTT...',
  '...BBBBBBBBBB...',
  '..BBBBBBBBBBBB..',
  '..BBBBB..BBBBB..',
  '.BBBBB....BBBBB.',
  '.BBBB......BBBB.',
  'BBBB........BBBB',
  'BBBB........BBBB',
  'OOOOO......OOOOO',
  'OOOO........OOOO'],
  walk2:[...ELLEY_HEAD,
  '.....RRRRRR.....',
  '....RRRRRRRR....',
  '...RRRRRRRRRR...',
  '...RRRRRRWRRR...',
  '...RRRRRRRRRR...',
  '...SSRRRRRRSS...',
  '...SSTTTYTTSS...',
  '....BBBBBBBB....',
  '....BBBBBBBB....',
  '.....BBBBBB.....',
  '.....BBBBBB.....',
  '.....BBBBBB.....',
  '.....BBBBBB.....',
  '.....BBBBBB.....',
  '....OOOOOOOO....',
  '....OOOOOOOO....'],
  jump:[...ELLEY_JUMP_HEAD,
  '....RRRRRRRRRR..',
  '...RRRRRRRRRR...',
  '..RRRRRRRWRRR...',
  '.SRRRRRRRRRRR...',
  '.SSRRRRRRRRRR...',
  '....TTTTYTTTT...',
  '...BBBBBBBBBB...',
  '..BBBBBBBBBBBB..',
  '..BBBBB..BBBBB..',
  '..BBBBB...BBBBOO',
  '.BBBBB.....BOOOO',
  '.BBBB.......OOOO',
  '.BBB............',
  'OOOO............',
  'OOOOO...........',
  '.OOO............']};
 // The royals face the viewer. Walking steps the feet apart and together and sways the hem; jumping raises both arms to cheer.
 function frontPoses(head,body){
  const last=body.length-1,put=(r,x,c)=>r.slice(0,x)+c+r.slice(x+1);
  const step=(row,l,r)=>{let out='.'.repeat(16);[...row].forEach((c,i)=>{const j=i+(i<8?l:r);if(c==='O'&&j>=0&&j<16)out=put(out,j,'O')});return out};
  const sway=(row,d)=>d>0?'.'+row.slice(0,15):row.slice(1)+'.';
  const walk=(l,r,d)=>[...head,...body.slice(0,last-1),sway(body[last-1],d),step(body[last],l,r)];
  const armsDown=body.map(r=>[...r].map((c,i)=>c==='S'&&(i<5||i>10)?(r[i<8?i+1:i-1]||'.'):c).join(''));
  const armsUp=head.map((r,i)=>i===3||i===4?put(put(r,1,'S'),14,'S'):i>4?[1,14].reduce((a,x)=>a[x]==='.'?put(a,x,'R'):a,r):r);
  return {stand:[...head,...body],walk1:walk(-1,1,1),walk2:walk(1,-1,-1),jump:[...armsUp,...armsDown.slice(0,last),step(body[last],-1,1)]};
 }
 // Big royals: the same head on a body twice as tall (arms and skirt rows repeat).
 const tall=body=>[0,0,1,1,2,2,3,3,4,4,5,5,6,6,6,7].map(i=>body[i]);
 // Princess Blyth: little tiara, auburn pigtails, purple dress. m mouth, M blush.
 const BLYTH_HEAD=[
  '.......YY.......',
  '......YWWY......',
  '....HHHHHHHH....',
  '...HHSSSSSSHH...',
  '..HHHSKSSKSHHH..',
  '..HHHMSSSSMHHH..',
  '.HH.HSSmmSSH.HH.',
  '.HH..SSSSSS..HH.'];
 const BLYTH_BODY=[
  '.....RRRRRR.....',
  '....SRRWWRRS....',
  '....SRRRRRRS....',
  '.....BBBBBB.....',
  '....BBBBBBBB....',
  '...BBBBBBBBBB...',
  '..BBBBBBBBBBBB..',
  '....OO....OO....'];
 // Queen Mom: gold crown, long brown hair and a pink gown.
 const MOM_HEAD=[
  '.....Y.YY.Y.....',
  '.....YYWWYY.....',
  '...HHHHHHHHHH...',
  '..HHHSSSSSSHHH..',
  '..HHHSKSSKSHHH..',
  '..HHHMSSSSMHHH..',
  '..HHHSSmmSSHHH..',
  '..HHHHSSSSHHHH..'];
 const MOM_BODY=[
  '..HHRRRRRRRRHH..',
  '..HSRRRWWRRRSH..',
  '...SRRRRRRRRS...',
  '....BBBBBBBB....',
  '....RRRRRRRR....',
  '...RRRRRRRRRR...',
  '..RRRRRRRRRRRR..',
  '....OO....OO....'];
 // King Dadderoons: tall crown, big brown beard, red robe with white fur, blue tunic and gold belt.
 const DAD_HEAD=[
  '....Y..YY..Y....',
  '....YYYWWYYY....',
  '...HHHHHHHHHH...',
  '...HHSSSSSSHH...',
  '...HSSKSSKSSH...',
  '...HSSSSSSSSH...',
  '...HHHHmmHHHH...',
  '...HHHHHHHHHH...'];
 const DAD_BODY=[
  '..WWHHHHHHHHWW..',
  '..RRWHHHHHHWRR..',
  '..RRRWBBBBWRRR..',
  '..SRRWBYYBWRRS..',
  '..RRRWBBBBWRRR..',
  '..RRRWBBBBWRRR..',
  '..RRRWWWWWWRRR..',
  '....OO....OO....'];
 const HEROES={elley:{small:SMALL,big:BIG},blyth:{small:frontPoses(BLYTH_HEAD,BLYTH_BODY),big:frontPoses(BLYTH_HEAD,tall(BLYTH_BODY))},mom:{small:frontPoses(MOM_HEAD,MOM_BODY),big:frontPoses(MOM_HEAD,tall(MOM_BODY))},dad:{small:frontPoses(DAD_HEAD,DAD_BODY),big:frontPoses(DAD_HEAD,tall(DAD_BODY))}};
 const LOOKS={
  elley:{C:'#f8c020',c:'#c88a10',Z:'#e05010',R:'#2a9ad0',W:'#ffe060',T:'#7a4a20',Y:'#f8d040',B:'#2c3e78',O:'#5a3418',H:'#6a3a1a',S:'#fcbc84',K:'#101010',M:'#c05040'},
  blyth:{Y:'#f8d040',W:'#60d0f0',H:'#b0502a',S:'#fcc8a0',K:'#241a1a',M:'#f49aa8',m:'#c8405e',R:'#9a5ad8',B:'#c890f0',O:'#6a3aa0'},
  mom:{Y:'#f8c838',W:'#3a9ad9',H:'#7a4426',S:'#f6c99f',K:'#241a1a',M:'#f49aa8',m:'#c8405e',R:'#ef74b2',B:'#ffd0e6',O:'#a8326a'},
  dad:{Y:'#f8c838',W:'#ffffff',H:'#7a4a26',S:'#f6c99f',K:'#241a1a',m:'#c8405e',R:'#c02838',B:'#3a5ac8',O:'#4a2a1a'}};
 const POWER_LOOK={fire:{R:'#fffaf0',B:'#d83d26',O:'#743726'},ice:{R:'#87e4fa',B:'#f6fbff',O:'#267caa'},tanuki:{R:'#9b653b',B:'#d7a46a',O:'#5b3727'},burger:{R:'#e8a040',B:'#7a3e1c',O:'#4a2410'},sword:{R:'#c8d0e0',B:'#3a4a7a',O:'#3a3a48'}};
 const heroes=[{id:'elley',name:'Elley-Oh!',short:'Elley-Oh!'},{id:'blyth',name:'Princess Blyth',short:'Blyth'},{id:'dad',name:'King Dadderoons',short:'Dadderoons'},{id:'mom',name:'Queen Mom',short:'Queen Mom'}];
 // Caramel chip critter: D chocolate edge, C caramel, c shine, W eyes, K pupils, F feet.
 const chipTop=[
  '.......DD.......',
  '......DcD.......',
  '.......DCD......',
  '......DCCCD.....',
  '.....DCcCCCD....',
  '....DCcCCCCCD...',
  '...DCcCCCCCCCD..',
  '..DCCWWCCCWWCCD.',
  '..DCCWKCCCWKCCD.',
  '.DCCCWKCCCWKCCCD',
  '.DCCCCCCCCCCCCCD',
  'DCCCCCCCCCCCCCCD',
  'DDDDDDDDDDDDDDDD'];
 const CHIP=[[...chipTop,'..FFF.....FFF...','.FFFFF...FFFFF..','.FFFFF...FFFFF..'],
             [...chipTop,'...FFF.....FFF..','..FFFFF...FFFFF.','..FFFFF...FFFFF.']];
 const CHIP_FLAT=[
  '.....DDDDDD.....',
  '..DDCCCCCCCCDD..',
  '.DCCWKKCCWKKCCD.',
  'DCCCCCCCCCCCCCCD',
  'DDDDDDDDDDDDDDDD',
  '.FFFFF....FFFFF.'];
 // Items, 13 pixels square: milk glass (L glass, W milk, w milk shade), treat (P, p), shield (A, a), jump wing (V, v).
 const ITEMS={
  milk:[
  '.............',
  '..LLLLLLLLL..',
  '..LlllllllL..',
  '..LWWWWWWWL..',
  '..LWWWWWWwL..',
  '..LWlWWWWwL..',
  '..LWlWWWWwL..',
  '..LWlWWWWwL..',
  '..LWWWWWWwL..',
  '...LWWWWwL...',
  '...LWWWWwL...',
  '...LLLLLLL...',
  '.............'],
  treat:[
  '.............',
  '.............',
  '.............',
  'pp.........pp',
  'ppp..PPP..ppp',
  'pppPPWPPPPppp',
  'ppPPWPPPPPPpp',
  'pppPPPPPPPppp',
  'ppp..PPP..ppp',
  'pp.........pp',
  '.............',
  '.............',
  '.............'],
  shield:[
  '.............',
  '.AAAAAAAAAAA.',
  '.AaaaaAAAAAA.',
  '.AaWWAAAAAAA.',
  '.AaWAAAAAAAA.',
  '.AaAAAAAAAAA.',
  '.AaAAAAAAAAA.',
  '..AaAAAAAAA..',
  '..AAAAAAAAA..',
  '...AAAAAAA...',
  '....AAAAA....',
  '.....AAA.....',
  '......A......'],
  boost:[
  '.............',
  '.........VVV.',
  '.......VVvvV.',
  '.....VVvvvvV.',
  '...VVvvvvvVV.',
  '.VVvvvvvvVV..',
  'VvvvvvvvVVV..',
  'VVVVVvvvVV...',
  '.VvvvVVVV....',
  '..VVVvvVV....',
  '...VvvVV.....',
  '....VVV......',
  '.............'],
  fire:rows(13,13,(x,y)=>{const dx=x-6,dy=y-6,r=Math.hypot(dx,dy);if(r<2.5)return 'Y';const a=Math.atan2(dy,dx),petal=Math.cos(a*5);return r<5.8&&petal>.15?(r<4?'F':'f'):'.'}),
  ice:rows(13,13,(x,y)=>{const dx=x-6,dy=y-6,r=Math.hypot(dx,dy);if(r<2.5)return 'W';return r<5.8&&Math.cos(Math.atan2(dy,dx)*5)>.15?(r<4?'A':'a'):'.'}),
  tanuki:rows(13,13,(x,y)=>y<3&&x>=3&&x<=9?'h':y<10&&x>=2&&x<=10?(x===2||x===10?'H':'h'):y>=10&&((x>=2&&x<=4)||(x>=8&&x<=10))?'H':'.'),
  // Daddo burger: b bun, n bun shade, W sesame, L lettuce, C cheese, P patty.
  burger:[
  '.............',
  '....bbbbb....',
  '..bbWbbbWbb..',
  '.bbbbbbWbbbb.',
  '.bbWbbbbbbbb.',
  '.nnnnnnnnnnn.',
  'LLLLLLLLLLLLL',
  '.CCCCCCCCCCC.',
  '.PPPPPPPPPPP.',
  '.PPPPPPPPPPP.',
  '.bbbbbbbbbbb.',
  '..nnnnnnnnn..',
  '.............'],
  // Sword pointing up and right: W blade, g blade edge, Y guard and pommel, h grip.
  sword:rows(13,13,(x,y)=>x-y===-4&&x>=2&&x<=6?'Y':x+y===12?(x>=5?'W':x===0?'Y':'h'):(x+y===11&&x>=5)||(x+y===13&&x>=6)?'g':'.')};
 const ITEM_PAL={burger:{b:'#e8a040',n:'#b86a20',W:'#fff8e0',L:'#58c040',C:'#f8d040',P:'#6a3418'},sword:{W:'#eef3fa',g:'#8a96a8',Y:'#f8c838',h:'#7a4a20'}};
 // Original four-legged turtle, snapper and round fish silhouettes, with style-specific colours.
 const TURTLE=rows(16,16,(x,y)=>{if(y>=12&&((x>=2&&x<=5)||(x>=9&&x<=12)))return 'h';if(y>=7&&y<=12&&x>=2&&x<=13)return y===7||x===2||x===13?'D':(x+y)%4===0?'s':'S';if(y>=8&&y<=11&&x>=13&&x<=15)return x===14&&y===9?'K':'h';if(y>=9&&y<=11&&x<3)return 'h';return '.'});
 const SHELL=rows(16,10,(x,y)=>{const wide=Math.max(0,7-Math.abs(y-6));return x>=8-wide&&x<=8+wide?(y===0||x===8-wide||x===8+wide?'D':(x+y)%4===0?'s':'S'):'.'});
 const PLANT=rows(16,16,(x,y)=>{if(y>=9)return x>=7&&x<=9?'S':x>=4&&x<=6&&y>=12?'s':'.';const left=(x-5)**2+(y-5)**2<24,right=(x-11)**2+(y-5)**2<24;if(!(left||right))return '.';if(y>=6&&x>=5&&x<=11)return 'D';if(y===5&&x>=5&&x<=11)return 'W';return y<4?'s':'S'});
 const FISH=rows(16,16,(x,y)=>{if(x<5&&Math.abs(y-8)<x/2+1)return 'f';const r=((x-9)/6)**2+((y-8)/5)**2;if(r>1)return '.';if(x===12&&y===6)return 'K';if(y>10)return 'f';return x<8?'F':'f'});
 // The Crumb Keeper is a round biscuit golem with berry glaze and little mitten arms.
 const BOSS=rows(16,16,(x,y)=>{if(y>=13&&((x>=3&&x<=5)||(x>=10&&x<=12)))return 'D';if(y>=8&&y<=11&&(x<=2||x>=13))return 'C';const body=((x-7.5)/6.3)**2+((y-8)/6.4)**2;if(body>1)return '.';if(y>=3&&y<=5&&((x+y)%4!==0))return 'P';if((x===5||x===10)&&y===8)return 'K';if(y===11&&x>=6&&x<=9)return 'D';if((x===4&&y===10)||(x===11&&y===6)||(x===7&&y===12))return 'W';return body>.7?'D':'C'});
 // A raccoon (faces right): grey body, black mask, ringed tail.
 const RACCOON=rows(16,16,(x,y)=>{if(y>=14&&[6,7,10,11].includes(x))return 'k';if((x===9||x===14)&&y<=1)return 'k';
  if((x-11.5)**2+(y-5)**2<12.5){if(y===4&&(x===10||x===13))return 'W';if(y===4||y===5)return 'K';if(x===15&&y===6)return 'K';return y>=6?'g':'G'}
  if(((x-8.5)/4.5)**2+((y-10.5)/3.6)**2<1)return y>=12&&x>=7&&x<=10?'g':'G';if(((x-2.5)/2.3)**2+((y-8)/4.3)**2<1)return y%3===0?'k':'g';return '.'});
 // The Crocodile Boss (faces right): long snout with teeth, ridged back, cream belly. `open` shows the burping jaws.
 const crocArt=open=>rows(24,14,(x,y)=>{if(y>=12&&[7,8,13,14].includes(x))return 'd';
  if(x<=6){const top=6+Math.round((6-x)/3),bot=10-Math.round((6-x)/4);return y>=top&&y<=bot?(y===top&&x%2===0?'d':'G'):'.'}
  if(x<=15)return ((x-11)/5.5)**2+((y-8.5)/4)**2<1?(y>=11?'c':y<=5&&x%2===0?'d':'G'):'.';
  const upTop=open?3:5,upBot=open?6:7,loTop=open?9:8,loBot=open?10:9;
  if(y===upTop-1&&(x===16||x===17))return 'G';if(y===upTop&&x===17)return 'K';if(y===upTop&&x===16)return 'Y';if(y===upTop&&x===23)return 'd';
  if(y>=upTop&&y<=upBot)return y===upBot&&x>=18&&x%2===1?'W':'G';if(open&&y>upBot&&y<loTop&&x<=22)return 'R';
  if(y>=loTop&&y<=loBot&&x<=22)return y===loTop&&x>=18&&x%2===0?'W':y===loBot?'c':'G';return '.'});
 const CROC=crocArt(false),CROC_OPEN=crocArt(true),ROCK=rows(6,6,(x,y)=>(x-2.5)**2+(y-2.5)**2<8?(x+y<5?'b':(x+y)%3===0?'a':'A'):'.');
 const TAIL=rows(8,12,(x,y)=>{const cx=4+Math.round(2*Math.sin(y/3));return Math.abs(x-cx)<=2?(y%4===0?'H':'h'):'.'});
 const EARS=rows(16,5,(x,y)=>((x>=2&&x<=5)||(x>=11&&x<=14))&&y>=Math.abs(x-(x<8?4:12))-1?'H':'.');
 const PIPE=kind=>rows(16,16,(x,y)=>{const top=kind.includes('top'),side=kind.includes('single')?'single':kind.includes('left')?'left':'right';if(top&&y<4)return x===0||x===15?'D':y===0?'l':y===3?'D':'L';if(side==='single')return x<3||x>12?'D':x<6?'l':'L';if(side==='left')return x===0?'D':x<3?'l':x===15?'D':'L';return x===15?'D':x>12?'l':x===0?'D':'L'});
 // An emptied block: I fill, i rivets and top-left shine, J edge.
 const USED=[
  '.JJJJJJJJJJJJJJ.',
  'JiiiiiiiiiiiiiiJ',
  'JiIIIIIIIIIIIIJJ',
  'JiIiJIIIIIIiJIJJ',
  'JiIJJIIIIIIJJIJJ',
  'JiIIIIIIIIIIIIJJ',
  'JiIIIIIIIIIIIIJJ',
  'JiIIIIIIIIIIIIJJ',
  'JiIIIIIIIIIIIIJJ',
  'JiIIIIIIIIIIIIJJ',
  'JiIIIIIIIIIIIIJJ',
  'JiIiJIIIIIIiJIJJ',
  'JiIJJIIIIIIJJIJJ',
  'JiIIIIIIIIIIIIJJ',
  'JJJJJJJJJJJJJJJJ',
  '.JJJJJJJJJJJJJJ.'];
 const BRICK_CLASSIC=[
  'eeeeeeeXeeeeeeeX',
  'EEEEEEEXeEEEEEEX',
  'EEEEEEEXeEEEEEEX',
  'XXXXXXXXXXXXXXXX',
  'eeeXeeeeeeeXeeee',
  'EEEXeEEEEEEXeEEE',
  'EEEXeEEEEEEXeEEE',
  'XXXXXXXXXXXXXXXX',
  'eeeeeeeXeeeeeeeX',
  'EEEEEEEXeEEEEEEX',
  'EEEEEEEXeEEEEEEX',
  'XXXXXXXXXXXXXXXX',
  'eeeXeeeeeeeXeeee',
  'EEEXeEEEEEEXeEEE',
  'EEEXeEEEEEEXeEEE',
  'XXXXXXXXXXXXXXXX'];
 const GROUND_CLASSIC=[
  'qqqqqqqqqqqqqqqZ',
  'qQQQQQQQZqQQQQQZ',
  'qQQQQQQQZqQQQQQZ',
  'qQQQQQQZqQQQQQQZ',
  'qQQQQQQZqQQQQQQZ',
  'qQQQQQZZqQQQQQQZ',
  'qQQZZZqqQQQQQQQZ',
  'qQZqqqQQQQQQQQQZ',
  'qQZqQQQQQQQQZZZZ',
  'qQZqQQQQQQQZqqqZ',
  'qQZqQQQQQQZqQQQZ',
  'qQZqQQQQQZqQQQQZ',
  'qQZqQQQQZqQQQQQZ',
  'qQZqQQQZqQQQQQQZ',
  'qQZqQQZqQQQQQQQZ',
  'ZZZZZZZZZZZZZZZZ'];
 const BRICK_ADVENTURE=[
  '.KKKKKKKKKKKKKK.',
  'KeeeeeeeeeeeeeeK',
  'KeEEEEEXeEEEEEEK',
  'KeEEEEEXeEEEEEEK',
  'KXXXXXXXXXXXXXXK',
  'KeEEXeEEEEEXeEEK',
  'KeEEXeEEEEEXeEEK',
  'KeEEXeEEEEEXeEEK',
  'KXXXXXXXXXXXXXXK',
  'KeEEEEEXeEEEEEEK',
  'KeEEEEEXeEEEEEEK',
  'KeEEEEEXeEEEEEEK',
  'KXXXXXXXXXXXXXXK',
  'KeEEXeEEEEEXeEEK',
  'KEEEXEEEEEEXEEEK',
  '.KKKKKKKKKKKKKK.'];
 // A turning panel block: bevelled, with an inset square.
 const BRICK_WORLD=rows(16,16,(x,y)=>{
  const edge=x===0||y===0||x===15||y===15;if(edge)return (x===0||x===15)&&(y===0||y===15)?'.':'K';
  if(x===1||y===1)return 'e';if(x===14||y===14)return 'X';
  const ix=x>=5&&x<=10&&y>=5&&y<=10;if(ix)return (x===5||y===5)?'X':(x===10||y===10)?'e':'E';
  return 'E';
 });
 // Ground tops (grass or a lip) and fill, built from patterns.
 const GROUND_ADVENTURE={
  top:rows(16,16,(x,y)=>y===0?'K':y<4?'q':y===4?'Z':((x+y)%8<2?'Z':'Q')),
  fill:rows(16,16,(x,y)=>(x+y)%8<2?'Z':'Q')};
 const dots=(x,y)=>((x*7+y*13)%23===0)?'Z':((x*5+y*11)%19===0)?'q':'Q';
 const GROUND_WORLD={
  top:rows(16,16,(x,y)=>{const wave=5+((x>>1)%2);return y===0?'K':y===1?'u':y<wave?'U':y===wave?'z':dots(x,y)}),
  fill:rows(16,16,dots)};

 // ---- Pixel font for the score bar: 5x7 letters, each row a base-32 digit.
 const FONT={A:'ehhvhhh',B:'uhhuhhu',C:'ehggghe',D:'uhhhhhu',E:'vgguggv',F:'vgguggg',G:'ehgnhhf',H:'hhhvhhh',I:'e44444e',J:'72222ic',K:'hikokih',L:'ggggggv',M:'hrllhhh',N:'hhpljhh',O:'ehhhhhe',P:'uhhuggg',Q:'ehhhlid',R:'uhhukih',S:'fgge11u',T:'v444444',U:'hhhhhhe',V:'hhhhha4',W:'hhhllla',X:'hha4ahh',Y:'hha4444',Z:'v1248gv',
  0:'ehjlphe',1:'4c4444e',2:'eh1248v',3:'v2421he',4:'26aiv22',5:'vgu11he',6:'68guhhe',7:'v124888',8:'ehhehhe',9:'ehhf12c','!':'4444404','-':'000v000','×':'0ha4ah0','.':'00000cc',':':'0cc0cc0',"'":'4480000','/':'11248gg'};
 function pixelText(ctx,text,x,y,color,shadow,scale=2){
  for(const pass of shadow?[shadow,color]:[color]){
   ctx.fillStyle=pass;let cx=x;const off=pass===shadow&&pass!==color?scale:0;
   for(const ch of String(text).toUpperCase()){const g=FONT[ch];if(g)for(let r=0;r<7;r++){const bits=parseInt(g[r],32);for(let b=0;b<5;b++)if(bits&(16>>b))ctx.fillRect(cx+b*scale+off,y+r*scale+off,scale,scale)}cx+=6*scale}
  }
 }
 const textWidth=(text,scale=2)=>String(text).length*6*scale-scale;

 // ---- The pink home at the finish, in pixels (2 screen pixels each). Matches castleDoor() in game.js.
 function pixelHome(ctx,door,p,line){
  const cx=Math.round((door.x+13)/2)*2,base=door.y+49,top=base-120,u=(x,y,w,h,c)=>rect(ctx,cx+x*2,top+y*2,w*2,h*2,c);
  const outlined=(x,y,w,h,c)=>{if(line)u(x-1,y-1,w+2,h+2,line);u(x,y,w,h,c)};
  outlined(-35,16,70,44,p.wall);u(-34,17,68,2,p.wallLight);
  for(let j=0;j<21;j++){const half=31+Math.floor(j*9/20);if(line&&j===0)u(-half-1,-5,half*2+2,1,line);u(-half,-4+j,half*2,1,j<2?p.roofTrim:p.roof);if(line){u(-half-1,-4+j,1,1,line);u(half,-4+j,1,1,line)}}
  for(const px of [-28,13])for(let j=0;j<11;j++){u(px-Math.floor(j/4),1+j,16,1,j%4===3?p.panelLine:p.panel);for(const k of [5,10])u(px+k-Math.floor(j/4),1+j,1,1,p.panelLine)}
  outlined(-14,20,28,40,p.gable);
  for(let j=0;j<15;j++){const half=Math.floor(j*15/14);u(-half-1,7+j,half*2+2,1,line||p.roof);if(half>0)u(-half+1,8+j,half*2-2,1,p.gable)}
  for(const wx of [-30,19]){outlined(wx,28,12,15,p.trim);u(wx+1,29,10,13,p.glass);u(wx+5,29,1,13,p.trim);u(wx+1,35,10,1,p.trim);u(wx+1,29,2,4,p.glassLight)}
  const d=(door.y+9-top)/2|0;u(-11,d-3,22,60-d+3,p.trim);u(-7,d-6,14,3,p.trim);u(-7,d-3,14,60-d+3,p.door);u(-5,d-5,10,2,p.door);u(4,52,1,2,p.knob);
  for(let y=d;y<60;y+=4){u(-11,y,4,1,p.brickLine);u(7,y,4,1,p.brickLine)}
  u(-4,d-1,8,6,p.doorLight);u(-18,60,36,2,p.step);u(-22,62,44,2,p.stepLight);
  pixelText(ctx,'HOME',cx-textWidth('HOME',1)/2,top+50,p.sign,null,1);
 }

 // Inside the pink house: striped wallpaper, wood panels, night windows, candles and a portrait of Queen Mom.
 function houseSky(ctx,cam,tick,id){const wall=id==='classic'?'#3c2a4d':id==='adventure'?'#4a3358':'#57406a',stripe=id==='classic'?'#46325a':id==='adventure'?'#553c66':'#634a78',dark='#2a1d33',p=cam*.5;
  rect(ctx,0,0,960,512,wall);for(let x=-((p%64)+64);x<1024;x+=64)rect(ctx,x,0,24,384,stripe);
  rect(ctx,0,384,960,8,dark);rect(ctx,0,392,960,64,'#6b4a33');for(let x=-((p%96)+96);x<1056;x+=96){rect(ctx,x+8,400,80,46,'#7d573c');rect(ctx,x+8,400,80,4,'#93694a')}
  for(let i=-1;i<5;i++){const x=Math.round(i*300-(p%300)+60);
   rect(ctx,x-4,116,80,128,dark);rect(ctx,x,120,72,120,'#1b2244');rect(ctx,x+4,124,64,112,'#28356a');rect(ctx,x+46,136,14,14,'#f4ecc0');rect(ctx,x+50,136,10,10,'#28356a');for(const [sx,sy]of [[14,150],[30,200],[20,222],[56,190]])rect(ctx,x+sx,sy,2,2,'#ffffff');rect(ctx,x+34,120,4,120,dark);rect(ctx,x,178,72,4,dark);rect(ctx,x-8,244,88,6,'#93694a');
   const c=x+165;rect(ctx,c-8,282,22,4,'#b8892e');rect(ctx,c,258,6,24,'#f4ecd8');const f=Math.floor(tick/6)%2;rect(ctx,c+1,248+f,4,10-f,'#ffb23f');rect(ctx,c+2,251+f,2,5-f,'#fff4b0');
   const fx=x+210;rect(ctx,fx,150,56,68,'#c49a3a');rect(ctx,fx+4,154,48,60,'#f6c8de');rect(ctx,fx+18,176,20,22,'#7a4426');rect(ctx,fx+21,180,14,14,'#f6c99f');rect(ctx,fx+20,168,16,6,'#f8c838');rect(ctx,fx+14,198,28,16,'#ef74b2')}
 }
 // Sea bands, drifting bubbles and original seaweed silhouettes are shared by the pixel eras.
 function underwaterSky(ctx,cam,tick,id){const bands=id==='classic'?['#184f98','#1a67ac','#2479b4','#3186af']:id==='adventure'?['#18638d','#237fa5','#3995ad','#5cabb6']:['#205c9d','#327db2','#529bc1','#83bfd0'];for(let i=0;i<4;i++)rect(ctx,0,i*128,960,128,bands[i]);const weed=bake(id+':underwater:weed',rows(10,34,(x,y)=>{const mid=5+Math.round(Math.sin(y/4)*2);return Math.abs(x-mid)<=1||y>29&&Math.abs(x-mid)<4?'W':'.'}),{W:id==='world'?'#3db98d':'#2aa275'},id==='classic'?null:'#155c68');for(let i=-1;i<10;i++){const x=i*150-cam*.23;blit(ctx,weed,x,444,false,2);blit(ctx,weed,x+70,470,false,1)}for(let i=0;i<24;i++){const x=((i*127-cam*.12)%1080+1080)%1080-40,y=((i*83-tick*(i%3+1)*.35)%560+560)%560;rect(ctx,x,y,i%3===0?6:4,i%3===0?6:4,'#c8faffaa')}}
 // ---- A pixel-art style: shared shapes, the style's own palette, blocks and scenery.
 function pixelStyle(o){
  const pal=o.pal,line=o.line;let currentTheme='ground';const k=(name)=>o.id+':'+currentTheme+':'+name;
  const sprite=(name,art,palette=pal,outline=line)=>bake(k(name),art,palette,outline);
  const creature=o.creature||{dark:pal.X,green:pal.U||'#3e9d67',light:pal.u||'#8de3a1',skin:pal.S,fish:pal.A,fin:pal.a},pipeColors=o.pipe||{dark:'#176947',main:'#3baf69',light:'#8ee0a0'},seabed=o.seabed||{base:'#bd9769',light:'#ead09b',dark:'#826951',coral:'#f4a88c'};
  const critterPal={...pal,D:creature.dark,S:creature.green,s:creature.light,h:creature.skin,H:creature.dark,F:creature.fish,f:creature.fin,K:'#151c28',W:'#ffffff'};
  const bossPal={...pal,C:o.id==='classic'?'#d9a35c':o.id==='adventure'?'#e6b577':o.id==='world'?'#e8b477':'#dfaa72',D:'#875331',P:o.id==='classic'?'#8b4b94':'#aa5b9c',K:'#242334',W:'#fff5d8'};
  const furPal={...pal,G:'#8e909c',g:'#c9cbd3',K:'#22222a',W:'#ffffff',k:'#4c4d57'},rockPal={A:'#8b8579',a:'#5f5a51',b:'#c2bcae'},crocPal={G:o.id==='classic'?'#2f9a3c':'#3a9a4e',d:'#1f5e30',c:'#e8dca0',K:'#1a1416',Y:'#ffd23a',W:'#ffffff',R:'#d8402c'};
  const pipePal={...pal,D:pipeColors.dark,L:pipeColors.main,l:pipeColors.light};
  const tailPal={H:'#5b3727',h:'#d7a46a'};
  const groundPal=()=>currentTheme==='underwater'?{...pal,Q:seabed.base,q:seabed.light,Z:seabed.dark,U:seabed.coral,u:seabed.light,z:seabed.dark}:currentTheme==='house'?{...pal,Q:'#6f6a80',q:'#9a94ad',Z:'#433f52',U:'#b0304a',u:'#d9506a',z:'#6e1a2c'}:pal;
  const coinFrame=(rx,color)=>sprite('coin'+rx+color,rows(10,14,(x,y)=>{
   const cx=5,cy=7,ry=6.6,dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,e=dx*dx+dy*dy;if(e>1)return '.';
   if(rx>3&&Math.abs(x+.5-cx-.5)<.6&&Math.abs(y+.5-cy)<3.6)return 'N';
   return e>.55?(dx<0?'G':'N'):(dx<-.2?'g':'G')}),{...pal,G:color||pal.G});
  const spike=()=>sprite('spike',rows(16,16,(x,y)=>{const t=(y+.5-2.5)/13,half=7*t,dx=x+.5-8;if(t<0||t>1||Math.abs(dx)>half)return '.';return y===15?'n':dx<-half+1.6?'m':dx<1?'M':'n'}),pal,line||o.spikeLine);
  function ground(ctx,x,y,near){
   const same=(dx,dy)=>['ground','burgerdirt'].includes(near?.(dx,dy));
   if(o.ground.fill===o.ground.top||!o.ground.top){blit(ctx,sprite('ground',o.ground.fill,groundPal(),null),x,y);return}
   blit(ctx,sprite(same(0,-1)?'groundFill':'groundTop',same(0,-1)?o.ground.fill:o.ground.top,groundPal(),null),x,y);
   if(!line)return;
   const top=!same(0,-1);
   if(!same(-1,0)){rect(ctx,x,y,2,32,line);rect(ctx,x+2,y+(top?2:0),2,top?30:32,groundPal().q)}
   if(!same(1,0)){rect(ctx,x+30,y,2,32,line);rect(ctx,x+28,y+(top?2:0),2,top?30:32,groundPal().Z)}
   if(!same(0,1))rect(ctx,x,y+30,32,2,line);
  }
  const style={
   id:o.id,name:o.name,era:o.era,blurb:o.blurb,grid:o.grid,swatch:o.swatch,pixel:true,
   setTheme(theme){currentTheme=['underwater','house'].includes(theme)?theme:'ground'},
   sky(ctx,cam,tick){if(currentTheme==='underwater')underwaterSky(ctx,cam,tick,o.id);else if(currentTheme==='house')houseSky(ctx,cam,tick,o.id);else o.sky(ctx,cam,tick,{bake:(n,a,p,l)=>bake(k(n),a,p,l),blit})},
   tile(ctx,t,x,y,opt={}){
    const reward={treatbrick:'treat',shieldbrick:'shield',jumpbrick:'boost',milkbrick:'milk',firebrick:'fire',icebrick:'ice',tanukibrick:'tanuki',swordbrick:'sword'}[t];
    if(reward){style.tile(ctx,'brick',x,y,opt);if(opt.build){rect(ctx,x+4,y+4,24,24,o.window);style.item(ctx,reward,x+3,y+3)}return}
    const tick=opt.tick||0;
    if(t==='ground')ground(ctx,x,y,opt.near);
    else if(t==='burgerdirt'){ground(ctx,x,y,opt.near);digSpot(ctx,x,y,tick);if(opt.build){rect(ctx,x+4,y+6,24,22,o.window);style.item(ctx,'burger',x+3,y+5)}}
    else if(t==='bedbox')bedBox(ctx,x,y);
    else if(t==='switch'||t==='redblock'||t==='blueblock')switchTile(ctx,t,x,y,opt.on!==false,true);
    else if(t==='brick')blit(ctx,sprite('brick',o.brick,pal,null),x,y);
    else if(t==='emptybrick')blit(ctx,sprite('used',USED,pal,null),x,y);
    else if(t==='coin'){
     if(o.coinSpin){const f=[4.6,3.2,1.6,0.6,1.6,3.2][Math.floor(tick/7)%6];blit(ctx,coinFrame(f),x+16-Math.round(f+(line?1:0))*2+(line?2:0),y+2)}
     else blit(ctx,coinFrame(4.6,o.coinFlash[Math.floor(tick/10)%o.coinFlash.length]),x+6,y+2);
    }
    else if(t==='spike')blit(ctx,spike(),x,y);
    else if(t==='pipe'){const near=opt.near||(()=>''),left=near(-1,0)==='pipe',right=near(1,0)==='pipe',half=pipeHalf(near),top=near(0,-1)!=='pipe';blit(ctx,sprite('pipe-'+half+(top?'-top':''),PIPE(half+(top?'-top':'')),pipePal,null),x,y)}
    else if(t==='enemy')style.enemy(ctx,x+3,y+8,{tick});
    else if(t==='plant')style.plant(ctx,x+4,y+3,{tick,exposure:24});
    else if(t==='turtle')style.turtle(ctx,x+3,y+6,{tick,dir:-1});
    else if(t==='fish')style.fish(ctx,x+3,y+4,{tick,dir:-1});
    else if(t==='raccoon')style.raccoon(ctx,x+2,y+4,{tick,dir:-1});
    else if(t==='boss')style.boss(ctx,x-16,y-28,{tick,hp:3});
   },
   hero(ctx,x,y,s={}){const who=HEROES[s.who]?s.who:'elley',set=HEROES[who][s.big?'big':'small'],art=set[s.pose]||set.stand,pp={...pal,...LOOKS[who],...POWER_LOOK[s.power]};if(s.power==='tanuki')blit(ctx,sprite('tail',TAIL,tailPal),x+(s.face<0?20:-8),y+(s.big?26:12),s.face<0);blit(ctx,sprite(who+(s.big?'-big-':'-small-')+(s.pose||'stand')+'-'+(s.power||''),art,pp),x-5,s.big?y:y-4,s.face<0);if(s.power==='tanuki')blit(ctx,sprite('ears',EARS,tailPal),x-5,y-(s.big?3:7),s.face<0)},
   enemy(ctx,x,y,s={}){if(s.flat)blit(ctx,sprite('chip-flat',CHIP_FLAT),x-3,y+12);else blit(ctx,sprite('chip'+(Math.floor((s.tick||0)/10)%2),CHIP[Math.floor((s.tick||0)/10)%2]),x-3,y-8,(s.dir||-1)>0)},
   plant(ctx,x,y,s={}){blit(ctx,sprite('plant',PLANT,critterPal),x-4,y-2,false,2)},
   turtle(ctx,x,y,s={}){blit(ctx,sprite(s.shell?'shell':'turtle',s.shell?SHELL:TURTLE,critterPal),x-3,y-(s.shell?0:4),s.dir>0)},
   fish(ctx,x,y,s={}){blit(ctx,sprite('fish',FISH,critterPal),x-3,y-4,s.dir>0)},
   // The one waiting in the castle (Queen Mom, or King Dadderoons when Queen Mom plays); (x, y) is the top-left of a 32 x 48 box.
   mom(ctx,x,y,s={}){style.hero(ctx,x+5,y,{who:s.who||'mom',big:true,face:s.face})},
   raccoon(ctx,x,y,s={}){blit(ctx,sprite('raccoon',RACCOON,furPal),x-2,y-4,s.dir<0);if(s.holding)blit(ctx,sprite('rock',ROCK,rockPal,null),x+8,y-10)},
   croc(ctx,x,y,s={}){if(s.hurt&&Math.floor(s.hurt/5)%2)return;blit(ctx,sprite(s.open?'croc-open':'croc',s.open?CROC_OPEN:CROC,crocPal),x-2,y-2,s.dir<0,4);for(let i=0;i<(s.hp||0);i++)rect(ctx,x+12+i*16,y-12,11,5,'#e77aa0')},
   hazard(ctx,h,tick){if(h.kind==='rock')blit(ctx,sprite('rock',ROCK,rockPal,null),h.x,h.y);else{for(let i=2;i>=0;i--)style.projectile(ctx,{kind:'fire',x:h.x+6-Math.sign(h.vx)*i*7,y:h.y+1+((tick+i*3)%6<3?1:-1)});style.projectile(ctx,{kind:'fire',x:h.x+8,y:h.y+1})}},
   boss(ctx,x,y,s={}){if(s.hurt&&Math.floor(s.hurt/5)%2)return;blit(ctx,sprite('boss',BOSS,bossPal),x-3,y-3,false,4);for(let i=0;i<(s.hp||0);i++)rect(ctx,x+7+i*16,y-9,11,5,'#e77aa0')},
   item(ctx,kind,x,y){if(ITEMS[kind])blit(ctx,sprite('item-'+kind,ITEMS[kind],{...pal,F:'#f05521',f:'#ffc047',Y:'#ffe06a',H:'#654020',h:'#bd8955',...ITEM_PAL[kind]}),x,y)},
   projectile(ctx,b){blit(ctx,sprite('ball-'+b.kind,rows(6,6,(x,y)=>(x-2.5)**2+(y-2.5)**2<8?(x<3?'a':'A'):'.'),{A:b.kind==='fire'?'#f05c24':'#a7f2ff',a:b.kind==='fire'?'#ffdb55':'#ffffff'},null),b.x,b.y,false,2)},
   frozen(ctx,x,y){blit(ctx,sprite('frozen',rows(16,16,(a,b)=>a===0||a===15||b===0||b===15?'A':(a+b)%7===0?'W':'a'),{A:'#49aad6',a:'#a7e9f4',W:'#ffffff'},null),x,y)},
   debris(ctx,d){rect(ctx,d.x,d.y,10,10,line||pal.X);rect(ctx,d.x+2,d.y+2,6,6,pal.E);rect(ctx,d.x+2,d.y+2,6,2,pal.e)},
   home(ctx,door){pixelHome(ctx,door,o.home,line)},
   hud(ctx,info){o.hud(ctx,info,{pixelText,textWidth,style})},
   shield(ctx,p,tick){ctx.strokeStyle=tick%8<4?o.shieldA:o.shieldB;ctx.lineWidth=2;ctx.strokeRect(Math.round(p.x)-6,Math.round(p.y)-6,p.w+12,p.h+12)},
  };
  return style;
 }

 // Classic HUD: four labelled columns of pixel text, like an arcade score line.
 function columnsHud(color,shadow){
  return (ctx,info,{pixelText})=>{
   const cols=[[info.name||'ELLEY-OH!',info.big?'BIG':'SMALL'],['COINS','×'+String(info.coins).padStart(2,'0')],['TREATS','×'+String(info.treats).padStart(2,'0')],['CHAPTER',info.chapter?String(info.chapter):'-']];
   cols.forEach(([a,b],i)=>{const x=40+i*230;pixelText(ctx,a,x,14,color,shadow);pixelText(ctx,b,x,34,color,shadow)});
   const power=[info.power?info.power.toUpperCase():'',info.shield?'SHIELD '+info.shield:'',info.boost?'JUMP '+info.boost:''].filter(Boolean).join('  ');
   if(power)pixelText(ctx,power,40,58,color,shadow);
  };
 }

 // ---- 8-bit (1985): flat colours, no outlines on sprites, a plain blue sky.
 const classic=pixelStyle({
  id:'classic',name:'8-bit',era:'1985',blurb:'Chunky pixels and a bright blue sky.',grid:'#ffffff2a',swatch:'#5c94fc',
  pal:{R:'#d82800',W:'#fcfcfc',H:'#7c3c00',S:'#fcbc74',K:'#000000',B:'#2050f0',Y:'#fcd800',O:'#7c3c00',
   D:'#7c3c00',C:'#e45c10',c:'#fca044',F:'#000000',G:'#fc9838',g:'#fcfcfc',N:'#c84c0c',
   L:'#3cbcfc',l:'#a4e4fc',w:'#bcbcbc',P:'#f878f8',p:'#fcbcfc',A:'#3cbcfc',a:'#a4e4fc',V:'#9878f8',v:'#d8b8f8',
   M:'#bcbcbc',m:'#fcfcfc',n:'#747474',E:'#c84c0c',e:'#fcbcb0',X:'#000000',Q:'#c84c0c',q:'#fcbcb0',Z:'#000000',
   I:'#c84c0c',i:'#fcbcb0',J:'#000000'},
  line:null,spikeLine:null,window:'#fcbcb0',coinFlash:['#fc9838','#fc9838','#c84c0c','#ac7c00'],
  brick:BRICK_CLASSIC,ground:{fill:GROUND_CLASSIC},shieldA:'#fcfcfc',shieldB:'#3cbcfc',
  home:{wall:'#fc74b4',wallLight:'#fcbcfc',roof:'#3c3c3c',roofTrim:'#000000',panel:'#0058f8',panelLine:'#3cbcfc',gable:'#f8b8f8',trim:'#fcfcfc',glass:'#3cbcfc',glassLight:'#a4e4fc',door:'#a80020',doorLight:'#d82800',knob:'#fcd800',brickLine:'#bcbcbc',step:'#bcbcbc',stepLight:'#fcfcfc',sign:'#a80020'},
  sky(ctx,cam,tick,{bake,blit}){
   rect(ctx,0,0,960,512,'#5c94fc');
   const hill=(w,h,r)=>bake('hill'+w,blobArt(w,h,[[w/2,r,r]],r),{a:'#00a800',b:'#00a800',d:'#00a800'},'#000000');
   const bush=bake('bush',blobArt(48,16,[[10,10,8],[24,8,9],[38,10,8]],10),{a:'#80d010',b:'#b8f818',d:'#00a800'},'#000000');
   const cloud=bake('cloud',blobArt(48,24,[[12,15,9],[24,11,11],[36,15,9]]),{a:'#fcfcfc',b:'#fcfcfc',d:'#3cbcfc'},'#000000');
   for(let i=-1;i<5;i++){const x=i*768-cam;blit(ctx,hill(80,48,38),x,416);blit(ctx,bush,x+370,416);blit(ctx,hill(48,32,23),x+540,448);blit(ctx,bush,x+680,416)}
   for(let i=-1;i<6;i++){const x=i*512-cam*.5;blit(ctx,cloud,x+120,70);blit(ctx,cloud,x+380,130)}
  },
  hud:columnsHud('#fcfcfc',null)});

 // ---- 8-bit deluxe (1988): black outlines, a paler sky, big bolted blocks in the background.
 const adventure=pixelStyle({
  id:'adventure',name:'8-bit deluxe',era:'1988',blurb:'Bold outlines and bolted blocks.',grid:'#0000001c',swatch:'#a4e4fc',
  pal:{R:'#d82800',W:'#fcfcfc',H:'#7c0800',S:'#fca044',K:'#000000',B:'#0058f8',Y:'#fcfcfc',O:'#7c0800',
   D:'#7c0800',C:'#e45c10',c:'#fcbc74',F:'#000000',G:'#fcbc3c',g:'#fcfcfc',N:'#e45c10',
   L:'#0078f8',l:'#a4e4fc',w:'#bcbcbc',P:'#f83898',p:'#fcbcfc',A:'#00a8a8',a:'#b8f8d8',V:'#6844fc',v:'#d8b8f8',
   M:'#bcbcbc',m:'#fcfcfc',n:'#747474',E:'#f8a800',e:'#fce0a8',X:'#c84c0c',Q:'#fcd8a8',q:'#fcfcfc',Z:'#e8a868',
   I:'#ac7c00',i:'#fce0a8',J:'#000000'},
  line:'#000000',window:'#fce0a8',coinSpin:true,brick:BRICK_ADVENTURE,ground:GROUND_ADVENTURE,shieldA:'#000000',shieldB:'#fcfcfc',
  home:{wall:'#f878f8',wallLight:'#fcbcfc',roof:'#585858',roofTrim:'#000000',panel:'#0058f8',panelLine:'#a4e4fc',gable:'#fcbcfc',trim:'#fcfcfc',glass:'#00a8a8',glassLight:'#b8f8d8',door:'#7c0800',doorLight:'#c84c0c',knob:'#fcbc3c',brickLine:'#bcbcbc',step:'#bcbcbc',stepLight:'#fcfcfc',sign:'#000000'},
  sky(ctx,cam,tick,{bake,blit}){
   rect(ctx,0,0,960,512,'#a4e4fc');
   const block=(c,l,w,h)=>bake('block'+c+w+h,rows(w,h,(x,y)=>((x===2||x===w-3)&&(y===2||y===h-3))?'z':x===0||y===0?'l':'a'),{a:c,l,z:'#000000'},'#000000');
   const cloud=bake('cloud',blobArt(40,20,[[11,12,8],[20,9,9],[29,12,8]]),{a:'#fcfcfc',b:'#fcfcfc',d:'#fcfcfc'},'#000000');
   const pieces=[['#f8b8f8','#fcdcfc',24,40,40],['#b8f818','#d8f878',30,26,190],['#fcfcfc','#fcfcfc',20,52,330],['#68a8fc','#a4e4fc',28,34,520],['#f8b800','#fce0a8',22,22,640]];
   for(let i=-1;i<4;i++){const x=i*800-cam*.6;for(const [c,l,w,h,dx] of pieces){const s=block(c,l,w,h);rect(ctx,x+dx+10,448-h*2+10,w*2+4,h*2,'#00000040');blit(ctx,s,x+dx,448-h*2)}}
   for(let i=-1;i<6;i++){const x=i*560-cam*.3;blit(ctx,cloud,x+60,60);blit(ctx,cloud,x+330,120)}
  },
  hud(ctx,info,{pixelText}){
   rect(ctx,8,8,944,52,'#000000');rect(ctx,12,12,936,44,'#fce0a8');rect(ctx,16,16,928,36,'#000000');
   const bits=[(info.name||'ELLEY-OH!')+' '+(info.big?'BIG':'SMALL'),'COINS ×'+String(info.coins).padStart(2,'0'),'TREATS ×'+String(info.treats).padStart(2,'0'),info.chapter?'CHAPTER '+info.chapter:''];
   bits.forEach((b,i)=>pixelText(ctx,b,32+i*232,27,'#fcfcfc',null));
   const power=[info.power?info.power.toUpperCase():'',info.shield?'SHIELD '+info.shield:'',info.boost?'JUMP '+info.boost:''].filter(Boolean).join('  ');
   if(power)pixelText(ctx,power,32,72,'#000000',null);
  }});

 // ---- 16-bit (1990): shaded sprites, a banded sky, rounded hills with eyes, grassy ground.
 const world=pixelStyle({
  id:'world',name:'16-bit',era:'1990',blurb:'Shaded sprites and rolling hills.',grid:'#0000001c',swatch:'#78b8f8',
  pal:{R:'#f83020',W:'#ffffff',H:'#683018',S:'#ffc890',K:'#101010',B:'#3070f8',Y:'#ffe048',O:'#804020',
   D:'#683018',C:'#d87830',c:'#ffc078',F:'#683018',G:'#f8d838',g:'#fffcc0',N:'#c88010',
   L:'#58a8f8',l:'#d0ecff',w:'#c8d8e8',P:'#f860a8',p:'#ffc0e0',A:'#30c8d8',a:'#c0f8ff',V:'#9060f8',v:'#e0d0ff',
   M:'#c8d0d8',m:'#ffffff',n:'#788090',E:'#f8c820',e:'#fff8a0',X:'#b07800',Q:'#c88848',q:'#f0c088',Z:'#905828',
   U:'#40b840',u:'#90e868',z:'#207020',I:'#a86830',i:'#e8b070',J:'#101010'},
  line:'#101010',window:'#fff8d0',coinSpin:true,brick:BRICK_WORLD,ground:GROUND_WORLD,shieldA:'#ffffff',shieldB:'#30c8d8',
  home:{wall:'#f890c0',wallLight:'#ffd0e8',roof:'#404858',roofTrim:'#101010',panel:'#2050b0',panelLine:'#80b0f0',gable:'#ffc0dc',trim:'#fff8f0',glass:'#58a8f8',glassLight:'#d0ecff',door:'#984060',doorLight:'#c86890',knob:'#ffe048',brickLine:'#d8d0c8',step:'#d8c8c0',stepLight:'#f8f0e8',sign:'#984060'},
  sky(ctx,cam,tick,{bake,blit}){
   const bands=['#5898f8','#68a8f8','#78b8f8','#88c8f8','#a0d8f8','#b8e8f8','#d0f0f8'];
   bands.forEach((c,i)=>rect(ctx,0,i*58,960,i===bands.length-1?512:58,c));
   const hill=(w,h,c,shade)=>bake('hill'+w+h+c,blobArt(w,h,[[w/2,w/2,w/2]],w/2),{a:c,b:shade,d:c},'#103010');
   const cloud=bake('cloud',blobArt(44,20,[[11,12,8],[22,9,10],[33,12,8]]),{a:'#ffffff',b:'#ffffff',d:'#d0e8f8'},'#5878a8');
   const eye=(x,y)=>{rect(ctx,x,y,4,10,'#103010');rect(ctx,x+10,y,4,10,'#103010')};
   for(let i=-1;i<5;i++){const x=i*700-cam*.25;
    const tall=hill(36,90,'#58c070','#88e090'),small=hill(28,50,'#48a860','#78d088');
    blit(ctx,tall,x+80,512-180);eye(x+80+29,512-180+40);blit(ctx,small,x+190,512-100);blit(ctx,tall,x+430,512-160);eye(x+430+29,512-160+40);blit(ctx,small,x+560,512-100);eye(x+560+21,512-100+30)}
   for(let i=-1;i<6;i++){const x=i*600-cam*.12;blit(ctx,cloud,x+100,50);blit(ctx,cloud,x+390,110)}
  },
  hud:columnsHud('#ffffff','#101010')});

 // ---- Modern: smooth shapes, gradients and soft layered hills (no pixel grid).
 function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
 function grad(ctx,y0,y1,stops){const g=ctx.createLinearGradient(0,y0,0,y1);if(!g)return stops[0];stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c));return g}
 function ellipse(ctx,x,y,rx,ry,c,rot=0){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,rot,0,Math.PI*2);ctx.fill()}
 function modernItem(ctx,kind,x,y){
  ctx.save();ctx.lineJoin='round';ctx.strokeStyle='#3a2a3a';ctx.lineWidth=2;
  if(kind==='milk'){roundRect(ctx,x+5,y+2,16,22,3);ctx.fillStyle='#d9f1fb';ctx.fill();ctx.stroke();roundRect(ctx,x+7,y+7,12,15,2);ctx.fillStyle='#ffffff';ctx.fill();rect(ctx,x+9,y+9,2,10,'#e8f4fa')}
  if(kind==='treat'){ctx.fillStyle='#f39ac8';ctx.beginPath();ctx.moveTo(x+1,y+7);ctx.lineTo(x+7,y+13);ctx.lineTo(x+1,y+19);ctx.closePath();ctx.moveTo(x+25,y+7);ctx.lineTo(x+19,y+13);ctx.lineTo(x+25,y+19);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(x+13,y+13,7.5,0,Math.PI*2);ctx.fillStyle='#ff6fb0';ctx.fill();ctx.stroke();ellipse(ctx,x+10.5,y+10.5,2.2,1.6,'#ffd6ea',-.6)}
  if(kind==='shield'){ctx.beginPath();ctx.moveTo(x+3,y+3);ctx.lineTo(x+23,y+3);ctx.lineTo(x+22,y+15);ctx.quadraticCurveTo(x+19,y+22,x+13,y+25);ctx.quadraticCurveTo(x+7,y+22,x+4,y+15);ctx.closePath();ctx.fillStyle=grad(ctx,y+3,y+25,['#9ef0ff','#2fb9d6']);ctx.fill();ctx.stroke();rect(ctx,x+8,y+6,3,9,'#ffffffcc')}
  if(kind==='boost'){ctx.beginPath();ctx.moveTo(x+24,y+3);ctx.quadraticCurveTo(x+8,y+3,x+2,y+15);ctx.quadraticCurveTo(x+8,y+13,x+9,y+15);ctx.quadraticCurveTo(x+12,y+18,x+8,y+23);ctx.quadraticCurveTo(x+20,y+20,x+24,y+3);ctx.fillStyle=grad(ctx,y+3,y+23,['#f2eaff','#a984f2']);ctx.fill();ctx.stroke();ctx.strokeStyle='#8a6ad6';ctx.lineWidth=1.2;for(const [a,b,c,d] of [[20,6,9,13],[21,10,11,17]]){ctx.beginPath();ctx.moveTo(x+a,y+b);ctx.lineTo(x+c,y+d);ctx.stroke()}}
  if(kind==='fire'||kind==='ice'){const hot=kind==='fire',outer=hot?'#f05b2e':'#62bdda',inner=hot?'#ffe16a':'#f5fcff';for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;ellipse(ctx,x+13+Math.cos(a)*7,y+13+Math.sin(a)*7,5.5,4,outer,a)}ellipse(ctx,x+13,y+13,4.3,4.3,inner);ctx.strokeStyle=hot?'#9c3827':'#348ba8';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x+13,y+13,4.3,0,Math.PI*2);ctx.stroke()}
  if(kind==='burger'){ctx.beginPath();ctx.ellipse(x+13,y+12,11,8,0,Math.PI,0);ctx.closePath();ctx.fillStyle=grad(ctx,y+4,y+12,['#f2b45a','#d98a34']);ctx.fill();ctx.stroke();for(const [a,b] of [[8,8],[13,6],[18,8]])ellipse(ctx,x+a,y+b,1.2,.8,'#fff4d6');
   ctx.fillStyle='#5cc04a';ctx.beginPath();ctx.moveTo(x+1,y+13);for(let i=0;i<=6;i++)ctx.lineTo(x+1+i*4,y+(i%2?16:13));ctx.lineTo(x+25,y+13);ctx.fill();rect(ctx,x+3,y+15,20,2,'#f8d040');roundRect(ctx,x+2,y+16,22,4,2);ctx.fillStyle='#6a3418';ctx.fill();ctx.stroke();roundRect(ctx,x+3,y+20,20,4,2);ctx.fillStyle='#d98a34';ctx.fill();ctx.stroke()}
  if(kind==='sword'){ctx.save();ctx.translate(x+13,y+13);ctx.rotate(-Math.PI/4);ctx.fillStyle='#eef3fa';ctx.beginPath();ctx.moveTo(-3,-2.5);ctx.lineTo(10,-2.5);ctx.lineTo(13,0);ctx.lineTo(10,2.5);ctx.lineTo(-3,2.5);ctx.closePath();ctx.fill();ctx.stroke();rect(ctx,-2,-.5,11,1,'#a8b4c4');roundRect(ctx,-5,-6,3,12,1);ctx.fillStyle='#f8c838';ctx.fill();ctx.stroke();roundRect(ctx,-11,-1.8,6,3.6,1);ctx.fillStyle='#7a4a20';ctx.fill();ctx.stroke();ctx.restore()}
  if(kind==='tanuki'){ctx.fillStyle='#a97546';roundRect(ctx,x+5,y+8,16,15,5);ctx.fill();ctx.stroke();ellipse(ctx,x+7,y+6,4,4,'#a97546');ellipse(ctx,x+19,y+6,4,4,'#a97546');ctx.beginPath();ctx.moveTo(x+21,y+18);ctx.quadraticCurveTo(x+29,y+15,x+27,y+7);ctx.strokeStyle='#a97546';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#5f3b2c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+25,y+12);ctx.lineTo(x+29,y+11);ctx.stroke()}
  ctx.restore();
 }
 const MODERN_POWER={fire:{main:'#fffaf0',second:'#d83d26',shoe:'#743726'},ice:{main:'#9fe7f6',second:'#f8fcff',shoe:'#387da5'},tanuki:{main:'#b47b4d',second:'#d5a16b',shoe:'#5a3727'},burger:{main:'#e8a040',second:'#7a3e1c',shoe:'#4a2410'},sword:{main:'#c8d0e0',second:'#3a4a7a',shoe:'#3a3a48'}};
 // Elley-Oh! the electrician in smooth shapes: yellow hard hat with a lightning bolt, blue work shirt, tool belt and navy trousers.
 function modernHero(ctx,x,y,s){
  if(s.who&&s.who!=='elley'&&ROYAL[s.who]){modernRoyal(ctx,x,y,s);return}
  const big=!!s.big,h=big?48:28,pose=s.pose||'stand',stride=pose==='walk1'?1:pose==='walk2'?-1:0,jump=pose==='jump';
  const leg=big?14:6,body=big?17:11,headY=-(leg+body+(big?9:8)),r=big?8.5:8,P=MODERN_POWER[s.power];
  const shirt=P?.main||'#2a9ad0',pants=P?.second||'#2c3e78',shoes=P?.shoe||'#5a3418',hat='#f8c020';
  ctx.save();ctx.translate(Math.round(x+11),Math.round(y+h));if(s.face<0)ctx.scale(-1,1);ctx.lineJoin='round';ctx.lineCap='round';
  const out='#2a1d1a';ctx.strokeStyle=out;ctx.lineWidth=1.6;
  if(s.power==='tanuki'){ctx.strokeStyle='#5a3727';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-6,-leg-7);ctx.bezierCurveTo(-20,-leg-12,-21,-leg-30,-10,-leg-29);ctx.stroke();ctx.strokeStyle='#d5a16b';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-6,-leg-7);ctx.bezierCurveTo(-20,-leg-12,-21,-leg-30,-10,-leg-29);ctx.stroke();ctx.strokeStyle=out;ctx.lineWidth=1.6}
  const swing=jump?5:stride*4;
  // Legs and boots.
  for(const side of [-1,1]){const lx=side*4+(side>0?swing:-swing)*.6,ly=jump&&side>0?-4:0;
   ctx.fillStyle=pants;roundRect(ctx,lx-3,-leg-3+ly,6,leg+1,2);ctx.fill();ctx.stroke();
   ctx.fillStyle=shoes;ctx.beginPath();ctx.ellipse(lx+1.5,-2.5+ly,5,3,0,0,Math.PI*2);ctx.fill();ctx.stroke()}
  // Back arm, shirt with a bolt on the pocket, tool belt, front arm.
  const armY=-leg-body+4,handBack=jump?[-9,armY+7]:[-8-swing*.6,armY+6],handFront=jump?[9,headY-6]:[8+swing*.6,armY+6];
  ctx.beginPath();ctx.moveTo(-5,armY);ctx.lineTo(handBack[0],handBack[1]);ctx.lineWidth=5.5;ctx.strokeStyle=shirt;ctx.stroke();ctx.lineWidth=1.6;ctx.strokeStyle=out;
  ellipse(ctx,handBack[0],handBack[1],2.8,2.8,'#ffcf9e');ctx.stroke();
  roundRect(ctx,-8,-leg-body,16,body,5);ctx.fillStyle=shirt;ctx.fill();ctx.stroke();
  const by=-leg-body+3;ctx.fillStyle='#ffe060';ctx.beginPath();ctx.moveTo(3,by);ctx.lineTo(0,by+4);ctx.lineTo(2,by+4);ctx.lineTo(1,by+8);ctx.lineTo(5,by+3);ctx.lineTo(3,by+3);ctx.closePath();ctx.fill();
  rect(ctx,-8,-leg-3,16,3,'#7a4a20');rect(ctx,-1.5,-leg-3,3,3,'#f8d040');roundRect(ctx,-10,-leg-2,5,6,1);ctx.fillStyle='#9a6a36';ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(5,armY);ctx.lineTo(handFront[0],handFront[1]);ctx.lineWidth=5.5;ctx.strokeStyle=shirt;ctx.stroke();ctx.lineWidth=1.6;ctx.strokeStyle=out;
  ellipse(ctx,handFront[0],handFront[1],2.8,2.8,'#ffcf9e');ctx.stroke();
  // Head: hair, face, ear, eye, nose and smile, then the hard hat.
  ellipse(ctx,-4.5,headY+2.5,4,5.5,'#6b3a22');ctx.stroke();
  ellipse(ctx,1.5,headY+1,r*.92,r*.92,'#ffcf9e');ctx.stroke();
  ellipse(ctx,-5,headY+3.5,2.6,3.4,'#6b3a22');
  ellipse(ctx,-2,headY+2,2,2.5,'#f4b47e');ctx.stroke();
  ellipse(ctx,4.5,headY-.5,1.3,2.3,'#1c1c2a');rect(ctx,4,headY-2.5,1,1,'#ffffff');
  ellipse(ctx,9,headY+2.5,2.6,2.2,'#ffbe86');ctx.stroke();
  ctx.beginPath();ctx.arc(5,headY+4.2,2.4,.35,Math.PI-.7);ctx.strokeStyle='#a8443a';ctx.stroke();ctx.strokeStyle=out;
  ctx.beginPath();ctx.ellipse(.5,headY-3,r+.8,r*.82,0,Math.PI,0);ctx.closePath();ctx.fillStyle=hat;ctx.fill();ctx.stroke();
  rect(ctx,-1,headY-3-r*.8,3,r*.8,'#ffe07a');
  ctx.beginPath();ctx.ellipse(2,headY-2.5,r+4.5,1.9,0,0,Math.PI*2);ctx.fillStyle='#d89a10';ctx.fill();ctx.stroke();
  ctx.fillStyle='#e05010';ctx.beginPath();ctx.moveTo(5,headY-9);ctx.lineTo(3,headY-6);ctx.lineTo(5,headY-6);ctx.lineTo(4,headY-3.5);ctx.lineTo(7,headY-7);ctx.lineTo(5.5,headY-7);ctx.closePath();ctx.fill();
  if(s.power==='tanuki'){ellipse(ctx,-6,headY-10,4.5,6,'#98623b');ellipse(ctx,5,headY-10,4.5,6,'#98623b');ellipse(ctx,-6,headY-10,2,3,'#d5a16b');ellipse(ctx,5,headY-10,2,3,'#d5a16b')}
  ctx.restore();
 }
 // The royals in smooth shapes: Princess Blyth, Queen Mom and King Dadderoons. Drawn as tall as Big Elley-Oh! and scaled down when small.
 const ROYAL={blyth:{hair:'#b0502a',main:'#9a5ad8',second:'#c890f0',shoe:'#6a3aa0',crown:'tiara',gem:'#60d0f0'},mom:{hair:'#7a4426',main:'#ef74b2',second:'#ffd0e6',shoe:'#a8326a',crown:'crown',gem:'#3a9ad9'},dad:{hair:'#7a4a26',main:'#c02838',second:'#3a5ac8',shoe:'#4a2a1a',crown:'king',gem:'#e8392c',beard:true}};
 function modernRoyal(ctx,x,y,s){
  const L={...ROYAL[s.who],...MODERN_POWER[s.power]},big=!!s.big,h=big?48:28,k=big?1:.6,pose=s.pose||'stand',jump=pose==='jump',step=pose==='walk1'?1:pose==='walk2'?-1:0,skin='#f6c99f',out=L.beard?'#3a1a14':'#4a1f38';
  ctx.save();ctx.translate(Math.round(x+11),Math.round(y+h));ctx.scale(s.face<0?-k:k,k);ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=1.6;ctx.strokeStyle=out;
  if(s.power==='tanuki'){ctx.strokeStyle='#5a3727';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-8,-10);ctx.bezierCurveTo(-22,-14,-23,-32,-12,-31);ctx.stroke();ctx.strokeStyle='#d5a16b';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle=out;ctx.lineWidth=1.6}
  for(const side of [-1,1]){ellipse(ctx,side*5+(jump?side*2:-step*side*2),-2,4.5,2.6,L.shoe);ctx.stroke()}
  if(!L.beard)ellipse(ctx,0,-31,11,14,L.hair);
  if(L.beard){roundRect(ctx,-12,-27,24,25,5);ctx.fillStyle=L.main;ctx.fill();ctx.stroke();rect(ctx,-5,-26,10,23,L.second);rect(ctx,-7,-26,3,23,'#ffffff');rect(ctx,4,-26,3,23,'#ffffff');rect(ctx,-12,-6,24,3,'#ffffff');rect(ctx,-5,-15,10,3,'#f8c838')}
  else{ctx.beginPath();ctx.moveTo(-7,-25);ctx.lineTo(7,-25);ctx.lineTo(14+step,-4);ctx.quadraticCurveTo(0,0,-14+step,-4);ctx.closePath();ctx.fillStyle=L.main;ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-13+step,-7);ctx.quadraticCurveTo(0,-3,13+step,-7);ctx.strokeStyle=L.second;ctx.lineWidth=2.5;ctx.stroke();ctx.strokeStyle=out;ctx.lineWidth=1.6;ellipse(ctx,0,-25,4,2.2,'#ffffff')}
  for(const side of [-1,1]){const hx=jump?side*13:side*(12+step),hy=jump?-44:-13;ctx.beginPath();ctx.moveTo(side*8,-23);ctx.lineTo(hx,hy);ctx.lineWidth=5;ctx.strokeStyle=L.beard?L.main:L.second;ctx.stroke();ctx.lineWidth=1.6;ctx.strokeStyle=out;ellipse(ctx,hx,hy,2.6,2.6,skin);ctx.stroke()}
  ctx.beginPath();ctx.ellipse(0,-35,8,9,0,0,Math.PI*2);ctx.fillStyle=skin;ctx.fill();ctx.stroke();
  ellipse(ctx,0,-42,9,4,L.hair);
  if(L.crown==='tiara')for(const side of [-1,1])ellipse(ctx,side*11,-32,3.5,5.5,L.hair);
  else if(!L.beard){ellipse(ctx,-7,-36,2.5,7,L.hair);ellipse(ctx,7,-36,2.5,7,L.hair)}
  ellipse(ctx,-3,-35,1.4,2.2,'#241a1a');ellipse(ctx,3,-35,1.4,2.2,'#241a1a');
  if(L.beard){ellipse(ctx,0,-28.5,8,5.5,L.hair);ellipse(ctx,0,-31,3,1.5,'#c8405e')}
  else{ellipse(ctx,-5,-31.5,1.8,1.1,'#f49aa8');ellipse(ctx,5,-31.5,1.8,1.1,'#f49aa8');ctx.beginPath();ctx.arc(0,-31,2.6,.2,Math.PI-.2);ctx.strokeStyle='#a83a52';ctx.stroke()}
  ctx.strokeStyle='#a0721a';ctx.fillStyle='#f8c838';
  if(L.crown==='tiara'){ctx.beginPath();ctx.moveTo(-5,-44);ctx.lineTo(-3,-48);ctx.lineTo(0,-46);ctx.lineTo(3,-48);ctx.lineTo(5,-44);ctx.closePath();ctx.fill();ctx.stroke();ellipse(ctx,0,-46,1.3,1.3,L.gem)}
  else{const t=L.crown==='king'?1.3:1;ctx.beginPath();ctx.moveTo(-7*t,-44);ctx.lineTo(-8*t,-44-8*t);ctx.lineTo(-4,-44-4*t);ctx.lineTo(0,-44-10*t);ctx.lineTo(4,-44-4*t);ctx.lineTo(8*t,-44-8*t);ctx.lineTo(7*t,-44);ctx.closePath();ctx.fill();ctx.stroke();ellipse(ctx,0,-47,1.6,1.6,L.gem)}
  if(s.power==='tanuki'){ellipse(ctx,-8,-46,3.5,5,'#98623b');ellipse(ctx,8,-46,3.5,5,'#98623b')}
  ctx.restore();
 }
 function modernChip(ctx,x,y,s={}){
  // x, y is the critter's hitbox (26 x 24); the drawing is 32 x 32 from (x-3, y-8).
  const ox=x-3,oy=y-8,step=Math.floor((s.tick||0)/10)%2;
  ctx.save();
  if(s.flat){ctx.translate(ox+16,oy+31);ctx.scale(1.15,.35);ctx.translate(-16,-31)}else ctx.translate(ox,oy);
  if((s.dir||-1)>0&&!s.flat){ctx.translate(32,0);ctx.scale(-1,1)}
  ctx.lineJoin='round';ctx.strokeStyle='#3b2214';ctx.lineWidth=1.6;
  ellipse(ctx,9+(step?-1:1),30,5,2.5,'#4a2a17');ellipse(ctx,23+(step?1:-1),30,5,2.5,'#4a2a17');
  ctx.fillStyle='#865025';ctx.beginPath();ctx.moveTo(3,28);ctx.bezierCurveTo(-1,19,9,14,14,9);ctx.quadraticCurveTo(19,4,17,1);ctx.bezierCurveTo(25,5,20,10,26,16);ctx.quadraticCurveTo(34,25,29,28);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=grad(ctx,7,26,['#e8ad5c','#c98a42']);ctx.beginPath();ctx.moveTo(5,25);ctx.quadraticCurveTo(4,20,15,12);ctx.lineTo(19,7);ctx.quadraticCurveTo(18,13,24,18);ctx.quadraticCurveTo(29,23,26,25);ctx.closePath();ctx.fill();
  ellipse(ctx,11,16,1.6,2.4,'#f7d394',-.5);
  for(const ex of [10.5,21.5]){ellipse(ctx,ex,22,3.4,4,'#fff6e4');ctx.stroke();ellipse(ctx,ex-1+(s.flat?0:0),22.5,1.6,2.4,'#2b1b14')}
  ctx.restore();
 }
 function modernPlant(ctx,x,y,s={}){ctx.save();ctx.strokeStyle='#216b55';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+12,y+28);ctx.quadraticCurveTo(x+10,y+16,x+12,y+10);ctx.stroke();ellipse(ctx,x+7,y+22,6,3,'#64ba72',-.6);ellipse(ctx,x+17,y+22,6,3,'#4cae68',.6);for(const side of [-1,1]){ctx.save();ctx.translate(x+12,y+9);ctx.rotate(side*.35+Math.sin((s.tick||0)/8)*.08);ellipse(ctx,side*5,-3,8,5,side<0?'#5baf8b':'#71c99a',side*.3);ellipse(ctx,side*5,-1,5,2,'#31546b',side*.3);ctx.restore()}ellipse(ctx,x+12,y+8,2,2,'#f5eec5');ctx.restore()}
 function modernTurtle(ctx,x,y,s={}){ctx.save();if(s.dir>0){ctx.translate(x+26,0);ctx.scale(-1,1);x=0}ctx.strokeStyle='#344f39';ctx.lineWidth=1.5;if(!s.shell){for(const lx of [4,20])for(const ly of [18,22])ellipse(ctx,x+lx,y+ly,3.5,5,'#75bb85');ellipse(ctx,x+24,y+13,5,5,'#a5d69d');ellipse(ctx,x+25,y+11,1,1.5,'#1b3542')}ellipse(ctx,x+13,y+14,12,s.shell?7:10,'#50896b');ellipse(ctx,x+13,y+12,8,s.shell?5:7,'#79ad77');ctx.beginPath();ctx.moveTo(x+8,y+10);ctx.lineTo(x+18,y+18);ctx.moveTo(x+18,y+10);ctx.lineTo(x+8,y+18);ctx.stroke();ctx.restore()}
 function modernFish(ctx,x,y,s={}){ctx.save();if(s.dir>0){ctx.translate(x+26,0);ctx.scale(-1,1);x=0}ctx.fillStyle='#48a9bb';ctx.beginPath();ctx.moveTo(x+6,y+12);ctx.lineTo(x,y+5);ctx.lineTo(x,y+19);ctx.closePath();ctx.fill();ellipse(ctx,x+14,y+12,10,8,'#77d1cf');ellipse(ctx,x+17,y+9,4,3,'#b6eee0');ellipse(ctx,x+20,y+10,1.5,1.5,'#234651');ctx.restore()}
 function modernBoss(ctx,x,y,s={}){if(s.hurt&&Math.floor(s.hurt/5)%2)return;ctx.save();for(const side of [-1,1]){ellipse(ctx,x+29+side*29,y+35,9,11,'#bc8659',side*.3);ellipse(ctx,x+29+side*17,y+55,8,5,'#8b5a38')}ellipse(ctx,x+29,y+28,28,29,'#795030');ellipse(ctx,x+28,y+26,25,26,'#dca96c');ellipse(ctx,x+25,y+10,18,7,'#ae689f');ellipse(ctx,x+38,y+14,12,6,'#ae689f');for(const [dx,dy]of [[13,28],[41,31],[31,47]])ellipse(ctx,x+dx,y+dy,3,2,'#f5d5a8');ellipse(ctx,x+20,y+28,3,4,'#2a2940');ellipse(ctx,x+38,y+28,3,4,'#2a2940');ctx.strokeStyle='#7a4b38';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+29,y+34,7,.15,Math.PI-.15);ctx.stroke();for(let i=0;i<(s.hp||0);i++)ellipse(ctx,x+12+i*18,y-7,6,3,'#e783ab');ctx.restore()}
 function modernPipe(ctx,x,y,opt={}){const near=opt.near||(()=>''),top=near(0,-1)!=='pipe',left=near(-1,0)==='pipe',right=near(1,0)==='pipe',half=pipeHalf(near);ctx.save();ctx.fillStyle=grad(ctx,y,y+32,['#5acb78','#278354']);ctx.fillRect(x,y,32,32);rect(ctx,x+3,y,5,32,'#9de4a0');rect(ctx,x+25,y,4,32,'#1d6a4b');if(top){roundRect(ctx,x,y,32,10,2);ctx.fillStyle='#3ea969';ctx.fill();rect(ctx,x+2,y+1,28,2,'#adeab0');rect(ctx,x,y+8,32,3,'#1d6a4b')}if(half==='single'){rect(ctx,x,y,3,32,'#1d6a4b');rect(ctx,x+29,y,3,32,'#1d6a4b')}else if(half==='left')rect(ctx,x,y,3,32,'#1d6a4b');else rect(ctx,x+29,y,3,32,'#1d6a4b');ctx.restore()}
function modernHouseSky(ctx,cam,tick){const p=cam*.5;ctx.fillStyle=grad(ctx,0,390,['#664a80','#46325a']);ctx.fillRect(0,0,960,390);for(let x=-((p%64)+64);x<1024;x+=64){ctx.fillStyle='#ffffff0d';ctx.fillRect(x,0,26,384)}
  ctx.fillStyle=grad(ctx,384,456,['#8a6040','#5e3f2a']);ctx.fillRect(0,384,960,72);rect(ctx,0,382,960,6,'#a77a52');
  for(let i=-1;i<5;i++){const x=i*300-(p%300)+60;ctx.save();roundRect(ctx,x,116,72,128,34);ctx.fillStyle=grad(ctx,116,244,['#1c2350','#33438a']);ctx.fill();ctx.strokeStyle='#2a1d33';ctx.lineWidth=6;ctx.stroke();ellipse(ctx,x+50,148,8,8,'#f6efc6');ctx.restore();
   const c=x+165,glow=.25+.08*Math.sin(tick/7+i);ctx.save();ctx.globalAlpha=glow;ellipse(ctx,c+3,252,26,26,'#ffcf6a');ctx.restore();roundRect(ctx,c,258,7,24,2);ctx.fillStyle='#f4ecd8';ctx.fill();ellipse(ctx,c+3.5,251,3,6+Math.sin(tick/4+i),'#ffad3a');ellipse(ctx,c+3.5,253,1.5,3,'#fff4b0');rect(ctx,c-7,282,21,4,'#c9a04a');
   const fx=x+210;ctx.save();roundRect(ctx,fx,150,56,68,4);ctx.fillStyle='#d4a940';ctx.fill();roundRect(ctx,fx+5,155,46,58,3);ctx.fillStyle='#f7cfe2';ctx.fill();ellipse(ctx,fx+28,184,10,12,'#7a4426');ellipse(ctx,fx+28,186,7,8,'#f6c99f');ctx.fillStyle='#f8c838';ctx.fillRect(fx+21,170,14,5);ellipse(ctx,fx+28,210,14,8,'#ef74b2');ctx.restore()}
 }
 // A raccoon in smooth shapes: grey body, black mask and a ringed tail. Faces right; dir < 0 mirrors it.
 function modernRaccoon(ctx,x,y,s={}){const ox=x;ctx.save();if(s.dir<0){ctx.translate(x+28,0);ctx.scale(-1,1);x=0}ctx.lineWidth=1.5;ctx.strokeStyle='#2b2c33';
  for(let i=0;i<4;i++)ellipse(ctx,x+5-i*.5,y+19-i*4,4.5,3,i%2?'#3a3b44':'#c4c6ce',-.4);
  ellipse(ctx,x+9,y+28,3,2,'#3a3b44');ellipse(ctx,x+19,y+28,3,2,'#3a3b44');ctx.beginPath();ctx.ellipse(x+14,y+20,9,7.5,0,0,Math.PI*2);ctx.fillStyle='#8e909c';ctx.fill();ctx.stroke();ellipse(ctx,x+15,y+23,5,4,'#d3d5dc');
  for(const ex of [17,25])ellipse(ctx,x+ex,y+3,2.5,3,'#3a3b44');ctx.beginPath();ctx.ellipse(x+21,y+10,7.5,7,0,0,Math.PI*2);ctx.fillStyle='#9a9ca8';ctx.fill();ctx.stroke();
  ellipse(ctx,x+21,y+9,7,2.6,'#22222a');ellipse(ctx,x+18.5,y+8.6,1.6,1.6,'#ffffff');ellipse(ctx,x+24,y+8.6,1.6,1.6,'#ffffff');ellipse(ctx,x+25,y+13,4,2.6,'#e2e3e8');ellipse(ctx,x+28.4,y+12.4,1.5,1.3,'#22222a');
  ctx.restore();if(s.holding){ellipse(ctx,ox+14,y-4,6,5.5,'#8b8579');ellipse(ctx,ox+12,y-6,2.5,2,'#c2bcae')}}
 // The Crocodile Boss in smooth shapes; (x, y) is the top-left of a 68 x 40 box (drawn 1.38 times bigger in play). Faces right unless dir < 0.
 function modernCroc(ctx,x,y,s={}){if(s.hurt&&Math.floor(s.hurt/5)%2)return;ctx.save();if(s.dir<0){ctx.translate(x+68,0);ctx.scale(-1,1);x=0}ctx.lineJoin='round';ctx.strokeStyle='#1d4f2c';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x,y+26);ctx.quadraticCurveTo(x+12,y+14,x+24,y+16);ctx.lineTo(x+24,y+34);ctx.quadraticCurveTo(x+10,y+34,x,y+26);ctx.fillStyle='#3f9a52';ctx.fill();ctx.stroke();
  for(const lx of [24,40])ellipse(ctx,x+lx,y+37,5,3.5,'#2e7a41');ctx.beginPath();ctx.ellipse(x+33,y+24,15,12,0,0,Math.PI*2);ctx.fillStyle=grad(ctx,y+12,y+36,['#55b866','#2f8045']);ctx.fill();ctx.stroke();ellipse(ctx,x+33,y+32,11,4,'#eadfa6');
  for(let i=0;i<4;i++)ellipse(ctx,x+24+i*6,y+13,2.4,2,'#2a6b3a');
  const open=s.open?7:0;ctx.beginPath();ctx.moveTo(x+44,y+12-open);ctx.lineTo(x+68,y+16-open);ctx.lineTo(x+68,y+21-open);ctx.lineTo(x+44,y+22);ctx.closePath();ctx.fillStyle='#4aaa5c';ctx.fill();ctx.stroke();
  if(s.open){ctx.beginPath();ctx.moveTo(x+46,y+22);ctx.lineTo(x+67,y+21-open);ctx.lineTo(x+66,y+26);ctx.closePath();ctx.fillStyle='#d8402c';ctx.fill()}
  ctx.beginPath();ctx.moveTo(x+44,y+23);ctx.lineTo(x+66,y+26);ctx.lineTo(x+64,y+30);ctx.lineTo(x+44,y+31);ctx.closePath();ctx.fillStyle='#4aaa5c';ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffffff';for(let i=0;i<4;i++){const tx=x+50+i*4;ctx.beginPath();ctx.moveTo(tx,y+21-open*(i+1)/5);ctx.lineTo(tx+2,y+24-open*(i+1)/5);ctx.lineTo(tx+4,y+21-open*(i+1)/5);ctx.fill()}
  ellipse(ctx,x+47,y+10-open,5,5,'#4aaa5c');ellipse(ctx,x+48,y+9-open,3,3,'#ffd23a');ellipse(ctx,x+49,y+9-open,1.2,2,'#1a1416');ctx.restore();
  for(let i=0;i<(s.hp||0);i++)ellipse(ctx,(s.dir<0?x:x)+16+i*18,y-10,6,3,'#e783ab')}
 function modernHazard(ctx,h,tick){if(h.kind==='rock'){ellipse(ctx,h.x+6,h.y+6,6,5.5,'#8b8579');ellipse(ctx,h.x+4,h.y+4,2.5,2,'#c2bcae');return}
  ctx.save();for(let i=3;i>=0;i--){const r=7-i*1.4;ellipse(ctx,h.x+12-Math.sign(h.vx)*i*6,h.y+7+Math.sin(tick/3+i)*1.5,r+2,r,i?'#f2802c':'#ffd24a')}ellipse(ctx,h.x+12,h.y+7,3,2.5,'#fff6c0');ctx.restore()}
 function modernHome(ctx,door){
  // The original smooth pink home (drawn by game.js before styles existed).
  const cx=door.x+13,base=door.y+49,x=cx-76,top=base-120;
  ctx.save();ctx.fillStyle='#00000022';ctx.beginPath();ctx.ellipse(cx,base+6,92,8,0,0,Math.PI*2);ctx.fill();
  rect(ctx,x+6,top+31,140,89,'#e8a2bb');rect(ctx,x+13,top+38,126,80,'#f3b8cf');
  ctx.fillStyle='#262c37';ctx.beginPath();ctx.moveTo(cx-63,top-7);ctx.lineTo(cx+63,top-7);ctx.lineTo(cx+80,top+33);ctx.lineTo(cx-80,top+33);ctx.closePath();ctx.fill();
  rect(ctx,cx-64,top-9,128,4,'#121b25');
  for(const px of [cx-58,cx+27]){ctx.fillStyle='#1b405e';ctx.beginPath();ctx.moveTo(px,top+1);ctx.lineTo(px+26,top+1);ctx.lineTo(px+32,top+23);ctx.lineTo(px-6,top+23);ctx.closePath();ctx.fill();ctx.strokeStyle='#7196af';ctx.lineWidth=1;ctx.stroke();
   for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(px+i*9,top+2);ctx.lineTo(px-3+i*12,top+22);ctx.stroke()}
   for(const yy of [top+8,top+15]){ctx.beginPath();ctx.moveTo(px-2,yy);ctx.lineTo(px+29,yy);ctx.stroke()}}
  rect(ctx,cx-29,top+40,58,80,'#eaa4bf');ctx.fillStyle='#f6c6d7';ctx.beginPath();ctx.moveTo(cx-31,top+43);ctx.lineTo(cx,top+14);ctx.lineTo(cx+31,top+43);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#252c36';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(cx-34,top+44);ctx.lineTo(cx,top+12);ctx.lineTo(cx+34,top+44);ctx.stroke();
  for(const wx of [cx-60,cx+38]){rect(ctx,wx-3,top+55,28,34,'#fff4e5');rect(ctx,wx,top+58,22,28,'#79afc5');rect(ctx,wx+10,top+58,2,28,'#fff4e5');rect(ctx,wx,top+71,22,2,'#fff4e5');rect(ctx,wx-5,top+88,32,4,'#fff4e5')}
  const spring=door.y+9;
  ctx.fillStyle='#92516d';ctx.beginPath();ctx.arc(cx,spring,13,Math.PI,0);ctx.lineTo(cx+13,base);ctx.lineTo(cx-13,base);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#fff8ed';ctx.lineWidth=8;ctx.beginPath();ctx.arc(cx,spring,18,Math.PI,0);ctx.stroke();
  rect(ctx,cx-22,spring,8,base-spring,'#fff8ed');rect(ctx,cx+14,spring,8,base-spring,'#fff8ed');
  ctx.strokeStyle='#d4c9c3';ctx.lineWidth=1;
  for(let i=0;i<=8;i++){const angle=Math.PI+i*Math.PI/8;ctx.beginPath();ctx.moveTo(cx+14*Math.cos(angle),spring+14*Math.sin(angle));ctx.lineTo(cx+22*Math.cos(angle),spring+22*Math.sin(angle));ctx.stroke()}
  for(let yy=spring+7;yy<base;yy+=8){rect(ctx,cx-22,yy,8,1,'#d4c9c3');rect(ctx,cx+14,yy,8,1,'#d4c9c3')}
  rect(ctx,cx-8,spring+4,16,12,'#dba9c1');rect(ctx,cx+7,base-18,3,3,'#ffd16a');rect(ctx,cx-36,base,72,4,'#dbc4be');rect(ctx,cx-43,base+4,86,4,'#ecdbcf');
  ctx.textAlign='center';ctx.fillStyle='#754257';ctx.font='bold 9px system-ui';ctx.fillText('HOME',cx,top+57);ctx.restore();
 }
 function modernGround(ctx,x,y,near,theme='ground'){
  const same=(dx,dy)=>['ground','burgerdirt'].includes(near?.(dx,dy)),top=!same(0,-1),left=!same(-1,0),right=!same(1,0),bottom=!same(0,1);
  if(theme==='house'){ctx.fillStyle=grad(ctx,y,y+32,['#8d87a0','#5f5a72']);ctx.fillRect(x,y,32,32);ctx.strokeStyle='#4a4559';ctx.lineWidth=1.5;ctx.strokeRect(x+1,y+1,30,15);ctx.strokeRect(x+1,y+16,15,15);ctx.strokeRect(x+16,y+16,15,15);if(top){ctx.fillStyle=grad(ctx,y,y+8,['#e0566e','#9e2840']);ctx.fillRect(x,y,32,8);rect(ctx,x,y+8,32,2,'#e9c46a')}return}
  if(theme==='underwater'){ctx.fillStyle=grad(ctx,y,y+32,['#e4c49a','#bb916f']);ctx.fillRect(x,y,32,32);for(const [px,py]of [[6,14],[20,24],[27,8]])ellipse(ctx,x+px,y+py,2,1.4,'#93715f');if(top){rect(ctx,x,y+2,32,5,'#f4d7a8');for(const px of [4,19,27])ellipse(ctx,x+px,y+6,3,2,'#ed9f8e')}if(left)rect(ctx,x,y,2,32,'#9b7863');if(right)rect(ctx,x+30,y,2,32,'#9b7863');if(bottom)rect(ctx,x,y+30,32,2,'#9b7863');return}
  ctx.fillStyle=grad(ctx,y,y+32,['#c98a4e','#a8693a']);ctx.fillRect(x,y,32,32);
  for(const [px,py,r] of [[8,14,2.2],[22,24,1.8],[26,10,1.4],[12,27,1.3]])ellipse(ctx,x+px,y+py,r*1.4,r,'#8d5530');
  for(const [px,py] of [[7,13],[21,23]])ellipse(ctx,x+px,y+py,1,.7,'#e2ab72');
  if(left){rect(ctx,x,y,3,32,'#7c4a28')}if(right){rect(ctx,x+29,y,3,32,'#7c4a28')}if(bottom)rect(ctx,x,y+29,32,3,'#7c4a28');
  if(top){
   ctx.fillStyle=grad(ctx,y,y+12,['#7fdc5a','#3fa83a']);ctx.beginPath();ctx.moveTo(x,y+2);ctx.lineTo(x+32,y+2);ctx.lineTo(x+32,y+9);
   for(let i=3;i>=0;i--){const bx=x+i*8;ctx.quadraticCurveTo(bx+4,y+16,bx,y+9)}
   ctx.closePath();ctx.fill();rect(ctx,x,y,32,3,'#a6ef7e');rect(ctx,x,y+2,32,1,'#c8f7a4');
   if(left){ctx.fillStyle='#3fa83a';ctx.beginPath();ctx.arc(x+3,y+7,4,Math.PI*.5,Math.PI*1.5);ctx.fill()}
   if(right){ctx.fillStyle='#3fa83a';ctx.beginPath();ctx.arc(x+29,y+7,4,-Math.PI*.5,Math.PI*.5);ctx.fill()}
  }
 }
 let modernTheme='ground';const modern={
  id:'modern',name:'Modern',era:'HD',pixel:false,blurb:'Smooth, shiny and layered.',grid:'#2d5a7a22',swatch:'#9ad8ff',
  setTheme(theme){modernTheme=['underwater','house'].includes(theme)?theme:'ground'},
  sky(ctx,cam,tick){
   if(modernTheme==='house'){modernHouseSky(ctx,cam,tick);return}
   if(modernTheme==='underwater'){ctx.fillStyle=grad(ctx,0,512,['#12618b','#288faf','#73c4c9']);ctx.fillRect(0,0,960,512);ctx.fillStyle='#d6faff19';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(i*230-80,0);ctx.lineTo(i*230+15,0);ctx.lineTo(i*230+180,512);ctx.lineTo(i*230+60,512);ctx.closePath();ctx.fill()}for(let i=0;i<16;i++){const x=((i*137-cam*.18)%1080+1080)%1080-40,y=480;ctx.strokeStyle='#337e77';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+10,y-55,x+Math.sin(tick/30+i)*12,y-90);ctx.stroke();for(let j=0;j<4;j++)ellipse(ctx,x+Math.sin(tick/30+i)*j*3,y-20-j*16,8,3,'#53a889',j%2?.4:-.4)}for(let i=0;i<26;i++){const x=((i*139-cam*.12)%1080+1080)%1080-40,y=((i*89-tick*(i%3+1)*.3)%550+550)%550;ctx.strokeStyle='#d5fbff99';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,i%3+3,0,Math.PI*2);ctx.stroke()}return}
   ctx.fillStyle=grad(ctx,0,512,['#4fb2ff','#9ad8ff','#dff4ff']);ctx.fillRect(0,0,960,512);
   ellipse(ctx,820,84,54,54,'#fff6c22e');ellipse(ctx,820,84,40,40,'#fff6c255');ellipse(ctx,820,84,28,28,'#fff3b8');
   const cloud=(x,y,s)=>{for(const [dx,dy,r] of [[0,0,22],[24,-10,26],[50,0,22],[25,8,22]])ellipse(ctx,x+dx*s,y+dy*s+6,r*s,r*s*.8,'#c9e3f5');for(const [dx,dy,r] of [[0,0,22],[24,-10,26],[50,0,22],[25,8,22]])ellipse(ctx,x+dx*s,y+dy*s,r*s,r*s*.8,'#ffffff')};
   for(let i=-1;i<6;i++){const x=i*520-cam*.08;cloud(x+80,80,1);cloud(x+330,150,.7)}
   const hills=(f,base,amp,color,top,period,phase)=>{ctx.fillStyle=grad(ctx,base-amp*2,512,[top,color]);ctx.beginPath();ctx.moveTo(0,512);const off=cam*f+phase;for(let sx=0;sx<=960;sx+=12){const w=(sx+off)/period;ctx.lineTo(sx,base-amp*(.6+.4*Math.sin(w*Math.PI*2))-amp*.35*Math.sin(w*Math.PI*5.3))}ctx.lineTo(960,512);ctx.closePath();ctx.fill()};
   hills(.12,330,60,'#8fcfb8','#b7e6d2',520,0);hills(.3,390,50,'#55b56a','#86d98a',380,140);
  },
  tile(ctx,t,x,y,opt={}){
   const reward={treatbrick:'treat',shieldbrick:'shield',jumpbrick:'boost',milkbrick:'milk',firebrick:'fire',icebrick:'ice',tanukibrick:'tanuki',swordbrick:'sword'}[t];
   if(reward){modern.tile(ctx,'brick',x,y,opt);if(opt.build){ctx.save();roundRect(ctx,x+3,y+3,26,26,6);ctx.fillStyle='#fff6e2e6';ctx.fill();ctx.restore();modernItem(ctx,reward,x+3,y+3)}return}
   const tick=opt.tick||0;
   if(t==='ground')modernGround(ctx,x,y,opt.near,modernTheme);
   if(t==='burgerdirt'){modernGround(ctx,x,y,opt.near,modernTheme);digSpot(ctx,x,y,tick);if(opt.build){ctx.save();roundRect(ctx,x+3,y+5,26,24,6);ctx.fillStyle='#fff6e2e6';ctx.fill();ctx.restore();modernItem(ctx,'burger',x+3,y+4)}}
   if(t==='bedbox')bedBox(ctx,x,y);
   if(t==='pipe')modernPipe(ctx,x,y,opt);
   if(t==='switch'||t==='redblock'||t==='blueblock')switchTile(ctx,t,x,y,opt.on!==false,false);
   if(t==='brick'){ctx.save();roundRect(ctx,x+1,y+1,30,30,4);ctx.fillStyle=grad(ctx,y,y+32,['#f0a35e','#c8703a']);ctx.fill();ctx.strokeStyle='#7d3f1e';ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle='#9a5128';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+2,y+16);ctx.lineTo(x+30,y+16);ctx.moveTo(x+16,y+2);ctx.lineTo(x+16,y+16);ctx.moveTo(x+9,y+16);ctx.lineTo(x+9,y+30);ctx.moveTo(x+24,y+16);ctx.lineTo(x+24,y+30);ctx.stroke();
    rect(ctx,x+4,y+4,10,2,'#ffd2a8');rect(ctx,x+18,y+4,10,2,'#ffd2a8');ctx.restore()}
   if(t==='emptybrick'){ctx.save();roundRect(ctx,x+1,y+1,30,30,5);ctx.fillStyle=grad(ctx,y,y+32,['#b98758','#8a5d38']);ctx.fill();ctx.strokeStyle='#4f3420';ctx.lineWidth=2;ctx.stroke();for(const [px,py] of [[7,7],[25,7],[7,25],[25,25]]){ellipse(ctx,x+px,y+py,2.2,2.2,'#5c3d24');ellipse(ctx,x+px-.6,y+py-.6,1,1,'#e2bd8e')}ctx.restore()}
   if(t==='coin'){const sx=Math.cos(tick/9);ctx.save();ctx.translate(x+16,y+16);ctx.scale(Math.max(.12,Math.abs(sx)),1);ellipse(ctx,0,0,9,12,'#b8820c');ellipse(ctx,0,0,7.5,10.5,sx>0?'#ffd84a':'#f6c331');ellipse(ctx,0,0,4.5,7.5,'#f2b51c');rect(ctx,-1,-6,2,12,'#fff3b0');ctx.restore()}
   if(t==='spike'){ctx.save();ctx.beginPath();ctx.moveTo(x+2,y+31);ctx.lineTo(x+16,y+5);ctx.lineTo(x+30,y+31);ctx.closePath();const g=ctx.createLinearGradient(x+2,0,x+30,0);if(g){g.addColorStop(0,'#f4f7fb');g.addColorStop(.5,'#b8c2cf');g.addColorStop(1,'#6f7b8a')}ctx.fillStyle=g||'#b8c2cf';ctx.fill();ctx.strokeStyle='#3c4552';ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();ctx.restore()}
   if(t==='enemy')modernChip(ctx,x+3,y+8,{tick});
   if(t==='plant')modernPlant(ctx,x+4,y+3,{tick,exposure:24});
   if(t==='turtle')modernTurtle(ctx,x+3,y+6,{tick,dir:-1});
   if(t==='fish')modernFish(ctx,x+3,y+4,{tick,dir:-1});
   if(t==='raccoon')modernRaccoon(ctx,x+2,y+4,{tick,dir:-1});
   if(t==='boss')modernBoss(ctx,x-16,y-28,{tick,hp:3});
  },
  hero:(ctx,x,y,s={})=>modernHero(ctx,x,y,s),
  enemy:(ctx,x,y,s)=>modernChip(ctx,x,y,s),
  plant:(ctx,x,y,s)=>modernPlant(ctx,x,y,s),
  turtle:(ctx,x,y,s)=>modernTurtle(ctx,x,y,s),
  fish:(ctx,x,y,s)=>modernFish(ctx,x,y,s),
  boss:(ctx,x,y,s)=>modernBoss(ctx,x,y,s),
  mom:(ctx,x,y,s={})=>modernHero(ctx,x+5,y,{who:s.who||'mom',big:true,face:s.face}),
  raccoon:(ctx,x,y,s)=>modernRaccoon(ctx,x,y,s),
  croc(ctx,x,y,s={}){ctx.save();ctx.translate(x,y);ctx.scale(1.38,1.38);modernCroc(ctx,0,0,{...s,hp:0});ctx.restore();if(!(s.hurt&&Math.floor(s.hurt/5)%2))for(let i=0;i<(s.hp||0);i++)ellipse(ctx,x+20+i*18,y-10,6,3,'#e783ab')},
  hazard:(ctx,h,tick)=>modernHazard(ctx,h,tick),
  item:(ctx,kind,x,y)=>modernItem(ctx,kind,x,y),
  projectile(ctx,b){ellipse(ctx,b.x+5,b.y+5,5,5,b.kind==='fire'?'#f26328':'#8fe4f5');ellipse(ctx,b.x+3,b.y+3,2,2,'#ffffff')},
  frozen(ctx,x,y){ctx.fillStyle='#9ee7efcc';roundRect(ctx,x+1,y+1,30,30,4);ctx.fill();ctx.strokeStyle='#48a7c3';ctx.lineWidth=2;ctx.stroke();rect(ctx,x+6,y+4,5,18,'#ffffff88')},
  debris(ctx,d){ctx.save();ctx.translate(d.x+5,d.y+5);ctx.rotate(d.life/5);roundRect(ctx,-5,-5,10,10,2);ctx.fillStyle='#e0884a';ctx.fill();ctx.strokeStyle='#7d3f1e';ctx.lineWidth=1.5;ctx.stroke();ctx.restore()},
  home:modernHome,
  shield(ctx,p,tick){ctx.save();ctx.strokeStyle='#51bfe4';ctx.lineWidth=3;ctx.globalAlpha=.7+.3*Math.sin(tick/5);ctx.beginPath();ctx.ellipse(p.x+p.w/2,p.y+p.h/2,p.w/2+10,p.h/2+9,0,0,Math.PI*2);ctx.stroke();ctx.restore()},
  hud(ctx,info){
   ctx.save();ctx.font='800 20px system-ui,sans-serif';ctx.textBaseline='middle';ctx.lineJoin='round';
   const pill=(x,w,text,icon)=>{roundRect(ctx,x,12,w,38,19);ctx.fillStyle='#0b2a4a99';ctx.fill();if(icon)icon(x+22,31);ctx.lineWidth=5;ctx.strokeStyle='#0b2a4a';ctx.strokeText(text,x+(icon?40:16),32);ctx.fillStyle='#ffffff';ctx.fillText(text,x+(icon?40:16),32)};
   pill(14,160,(info.short||'Elley-Oh!')+' '+(info.big?'⬆':''),null);
   pill(178,110,'× '+info.coins,(cx,cy)=>{ellipse(ctx,cx,cy,8,11,'#b8820c');ellipse(ctx,cx,cy,6.5,9.5,'#ffd84a');rect(ctx,cx-1,cy-5,2,10,'#fff3b0')});
   pill(302,110,'× '+info.treats,(cx,cy)=>{ellipse(ctx,cx,cy,7,7,'#ff6fb0');ellipse(ctx,cx-2,cy-2,2,1.5,'#ffd6ea')});
   if(info.chapter)pill(816,130,'Chapter '+info.chapter,null);
   const power=[info.power?info.power.toUpperCase():'',info.shield?'🛡 '+info.shield:'',info.boost?'🪽 '+info.boost:''].filter(Boolean).join('   ');
   if(power)pill(426,370,power,null);
   ctx.restore();
  }};

 const list=[classic,adventure,world,modern];
 return {list,heroes,get:id=>list.find(s=>s.id===id)||classic,ids:list.map(s=>s.id),fallback:'classic',pixelText,textWidth};
})();
