'use strict';
// Game styles: the same course drawn in the look of a different era of platform games, like
// switching styles in a course maker. Each style sets pixel size, colours, outlines, scenery,
// the score bar and the music theme (see sound.js). All art here is original and drawn in code.
window.GameStyles=(()=>{
 const T=32,cache=new Map();
 function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
 function rect(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
 // Build sprite rows from a function of (x, y) that returns a palette letter or '.' (clear).
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
 // Elley-Oh!: R cap and shirt, W cap badge, H hair and moustache, S skin, K eye, B overalls, Y buttons, O shoes.
 const head=[
  '.....RRRRRR.....',
  '....RRRRRWWRR...',
  '....RRRRRRRRRRR.',
  '....HHHSSKS.....',
  '...HSHSSSKSSS...',
  '...HSHHSSSSHSSS.',
  '...HHSSSSHHHHH..',
  '.....SSSSSSSS...'];
 const SMALL={
  stand:[...head,
  '....RRBRRRBR....',
  '...RRRBRRRBRRR..',
  '..RRRRBBBBBRRRR.',
  '..SSRBYBBBYBRSS.',
  '..SSSBBBBBBBSSS.',
  '..SSBBBBBBBBBSS.',
  '....BBB...BBB...',
  '...OOOO...OOOO..'],
  walk1:[...head,
  '....RRBRRRBR....',
  '..RRRRBRRRBRSS..',
  '.SSRRRBBBBBBSS..',
  '.SS.BBYBBBYBB...',
  '...BBBBBBBBBBB..',
  '..BBBBB...BBBB..',
  '.OOBBB.....BBOO.',
  '.OOOO.......OOOO'],
  walk2:[...head,
  '.....RBRRRBR....',
  '....RRBRRRBRR...',
  '....RRBBBBBRR...',
  '....SSYBBBYSS...',
  '....SSBBBBBSS...',
  '.....BBBBBBB....',
  '.....BBBOOO.....',
  '....OOOOOOO.....'],
  jump:[
  '.....RRRRRR..SS.',
  '....RRRRRWWRRSS.',
  '....RRRRRRRRRRR.',
  '....HHHSSKS..RR.',
  '...HSHSSSKSSSRR.',
  '...HSHHSSSSHSRR.',
  '...HHSSSSHHHHRR.',
  '.....SSSSSSSRR..',
  '..RRRRBRRRBRR...',
  '.SRRRRBRRRBRR...',
  'SSRRRRBBBBBB....',
  'SS..BBYBBBYBB...',
  '...BBBBBBBBBBB..',
  '..BBBBB...BBBBOO',
  '.OOBBB......BOOO',
  '.OOOO...........']};
 const bigTop=[...head,
  '....RRRBRRBR....',
  '...RRRRBRRBRR...',
  '..RRRRRBRRBRRR..',
  '.RRRRRRBBBBRRRR.',
  '.RRRRRBYBBYBRRR.'];
 const BIG={
  stand:[...bigTop,
  '.SSRRBBBBBBBBRSS',
  '.SSSBBBBBBBBBSSS',
  '.SSSBBBBBBBBBSSS',
  '...BBBBBBBBBBB..',
  '...BBBBB.BBBBB..',
  '...BBBB...BBBB..',
  '...BBBB...BBBB..',
  '...BBBB...BBBB..',
  '..OOOOO...OOOOO.',
  '.OOOOOO...OOOOOO',
  '.OOOOOO...OOOOOO'],
  walk1:[...bigTop,
  'SSSRRBBBBBBBBRSS',
  'SS..BBBBBBBBBSSS',
  '....BBBBBBBBB...',
  '...BBBBBBBBBBB..',
  '..BBBBBB.BBBBBB.',
  '..BBBBB...BBBBB.',
  '.BBBBB.....BBBB.',
  '.BBBB.......BBB.',
  'OOOOO.......OOOO',
  'OOOOO.......OOOO',
  '.OOO........OOOO'],
  walk2:[...bigTop,
  '...SSBBBBBBBSS..',
  '...SSBBBBBBBSS..',
  '....BBBBBBBBB...',
  '....BBBBBBBBB...',
  '.....BBBBBBB....',
  '.....BBBBBBB....',
  '.....BBBBBBB....',
  '.....BBBBBBB....',
  '....OOOOOOOO....',
  '...OOOOOOOOO....',
  '...OOOOOOOOO....'],
  jump:[
  '.....RRRRRR..SS.',
  '....RRRRRWWRRSS.',
  '....RRRRRRRRRRR.',
  '....HHHSSKS..RR.',
  '...HSHSSSKSSSRR.',
  '...HSHHSSSSHSRR.',
  '...HHSSSSHHHHRR.',
  '.....SSSSSSSRR..',
  '....RRRBRRBRR...',
  '..RRRRRBRRBRR...',
  '.RRRRRRBRRBRR...',
  'SRRRRRRBBBBRR...',
  'SSRRRRBYBBYBB...',
  'SS..BBBBBBBBB...',
  '....BBBBBBBBBB..',
  '...BBBBBBBBBBB..',
  '..BBBBBB.BBBBB..',
  '..BBBBB...BBBBOO',
  '.BBBBB.....BBOOO',
  '.BBBB.......OOOO',
  '.BBB............',
  'OOOO............',
  'OOOOO...........',
  '.OOO............']};
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
  '.............']};
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

 // ---- A pixel-art style: shared shapes, the style's own palette, blocks and scenery.
 function pixelStyle(o){
  const pal=o.pal,line=o.line,k=(name)=>o.id+':'+name;
  const sprite=(name,art,palette=pal,outline=line)=>bake(k(name),art,palette,outline);
  const coinFrame=(rx,color)=>sprite('coin'+rx+color,rows(10,14,(x,y)=>{
   const cx=5,cy=7,ry=6.6,dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,e=dx*dx+dy*dy;if(e>1)return '.';
   if(rx>3&&Math.abs(x+.5-cx-.5)<.6&&Math.abs(y+.5-cy)<3.6)return 'N';
   return e>.55?(dx<0?'G':'N'):(dx<-.2?'g':'G')}),{...pal,G:color||pal.G});
  const spike=()=>sprite('spike',rows(16,16,(x,y)=>{const t=(y+.5-2.5)/13,half=7*t,dx=x+.5-8;if(t<0||t>1||Math.abs(dx)>half)return '.';return y===15?'n':dx<-half+1.6?'m':dx<1?'M':'n'}),pal,line||o.spikeLine);
  function ground(ctx,x,y,near){
   const same=(dx,dy)=>near?.(dx,dy)==='ground';
   if(o.ground.fill===o.ground.top||!o.ground.top){blit(ctx,sprite('ground',o.ground.fill,pal,null),x,y);return}
   blit(ctx,sprite(same(0,-1)?'groundFill':'groundTop',same(0,-1)?o.ground.fill:o.ground.top,pal,null),x,y);
   if(!line)return;
   const top=!same(0,-1);
   if(!same(-1,0)){rect(ctx,x,y,2,32,line);rect(ctx,x+2,y+(top?2:0),2,top?30:32,pal.q)}
   if(!same(1,0)){rect(ctx,x+30,y,2,32,line);rect(ctx,x+28,y+(top?2:0),2,top?30:32,pal.Z)}
   if(!same(0,1))rect(ctx,x,y+30,32,2,line);
  }
  const style={
   id:o.id,name:o.name,era:o.era,blurb:o.blurb,grid:o.grid,swatch:o.swatch,pixel:true,
   sky(ctx,cam,tick){o.sky(ctx,cam,tick,{bake:(n,a,p,l)=>bake(k(n),a,p,l),blit})},
   tile(ctx,t,x,y,opt={}){
    const reward={treatbrick:'treat',shieldbrick:'shield',jumpbrick:'boost',milkbrick:'milk'}[t];
    if(reward){style.tile(ctx,'brick',x,y,opt);if(opt.build){rect(ctx,x+4,y+4,24,24,o.window);style.item(ctx,reward,x+3,y+3)}return}
    const tick=opt.tick||0;
    if(t==='ground')ground(ctx,x,y,opt.near);
    else if(t==='brick')blit(ctx,sprite('brick',o.brick,pal,null),x,y);
    else if(t==='emptybrick')blit(ctx,sprite('used',USED,pal,null),x,y);
    else if(t==='coin'){
     if(o.coinSpin){const f=[4.6,3.2,1.6,0.6,1.6,3.2][Math.floor(tick/7)%6];blit(ctx,coinFrame(f),x+16-Math.round(f+(line?1:0))*2+(line?2:0),y+2)}
     else blit(ctx,coinFrame(4.6,o.coinFlash[Math.floor(tick/10)%o.coinFlash.length]),x+6,y+2);
    }
    else if(t==='spike')blit(ctx,spike(),x,y);
    else if(t==='enemy')style.enemy(ctx,x+3,y+8,{tick});
   },
   hero(ctx,x,y,s={}){const set=s.big?BIG:SMALL,art=set[s.pose]||set.stand;blit(ctx,sprite((s.big?'big-':'small-')+(s.pose||'stand'),art),x-5,s.big?y:y-4,s.face<0)},
   enemy(ctx,x,y,s={}){if(s.flat)blit(ctx,sprite('chip-flat',CHIP_FLAT),x-3,y+12);else blit(ctx,sprite('chip'+(Math.floor((s.tick||0)/10)%2),CHIP[Math.floor((s.tick||0)/10)%2]),x-3,y-8,(s.dir||-1)>0)},
   item(ctx,kind,x,y){if(ITEMS[kind])blit(ctx,sprite('item-'+kind,ITEMS[kind]),x,y)},
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
   const cols=[['ELLEY-OH!',info.big?'BIG':'SMALL'],['COINS','×'+String(info.coins).padStart(2,'0')],['TREATS','×'+String(info.treats).padStart(2,'0')],['CHAPTER',info.chapter?String(info.chapter):'-']];
   cols.forEach(([a,b],i)=>{const x=40+i*230;pixelText(ctx,a,x,14,color,shadow);pixelText(ctx,b,x,34,color,shadow)});
   const power=[info.shield?'SHIELD '+info.shield:'',info.boost?'JUMP '+info.boost:''].filter(Boolean).join('  ');
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
   const bits=['ELLEY-OH! '+(info.big?'BIG':'SMALL'),'COINS ×'+String(info.coins).padStart(2,'0'),'TREATS ×'+String(info.treats).padStart(2,'0'),info.chapter?'CHAPTER '+info.chapter:''];
   bits.forEach((b,i)=>pixelText(ctx,b,32+i*232,27,'#fcfcfc',null));
   const power=[info.shield?'SHIELD '+info.shield:'',info.boost?'JUMP '+info.boost:''].filter(Boolean).join('  ');
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
  ctx.restore();
 }
 function modernHero(ctx,x,y,s){
  const big=!!s.big,h=big?48:28,pose=s.pose||'stand',stride=pose==='walk1'?1:pose==='walk2'?-1:0,jump=pose==='jump';
  const leg=big?14:6,body=big?17:11,headY=-(leg+body+(big?9:8)),r=big?8.5:8;
  ctx.save();ctx.translate(Math.round(x+11),Math.round(y+h));if(s.face<0)ctx.scale(-1,1);ctx.lineJoin='round';ctx.lineCap='round';
  const out='#2a1d1a';ctx.strokeStyle=out;ctx.lineWidth=1.6;
  const swing=jump?5:stride*4;
  // Legs and shoes.
  for(const side of [-1,1]){const lx=side*4+(side>0?swing:-swing)*.6,ly=jump&&side>0?-4:0;
   ctx.fillStyle='#2f6fdc';roundRect(ctx,lx-3,-leg-3+ly,6,leg+1,2);ctx.fill();ctx.stroke();
   ctx.fillStyle='#7a4526';ctx.beginPath();ctx.ellipse(lx+1.5,-2.5+ly,5,3,0,0,Math.PI*2);ctx.fill();ctx.stroke()}
  // Back arm, shirt, overalls, front arm.
  const armY=-leg-body+4,handBack=jump?[-9,armY+7]:[-8-swing*.6,armY+6],handFront=jump?[9,headY-6]:[8+swing*.6,armY+6];
  ctx.fillStyle='#e8392c';ctx.beginPath();ctx.moveTo(-5,armY);ctx.lineTo(handBack[0],handBack[1]);ctx.lineWidth=5.5;ctx.strokeStyle='#e8392c';ctx.stroke();ctx.lineWidth=1.6;ctx.strokeStyle=out;
  ellipse(ctx,handBack[0],handBack[1],2.8,2.8,'#ffcf9e');ctx.stroke();
  roundRect(ctx,-8,-leg-body,16,body-1,5);ctx.fillStyle='#e8392c';ctx.fill();ctx.stroke();
  roundRect(ctx,-7,-leg-body*.55,14,body*.55+1,4);ctx.fillStyle=grad(ctx,-leg-body*.55,-leg+1,['#4a8af0','#2659c4']);ctx.fill();ctx.stroke();
  rect(ctx,-6,-leg-body,3,body*.5,'#2f6fdc');rect(ctx,3,-leg-body,3,body*.5,'#2f6fdc');
  ellipse(ctx,-4.5,-leg-body*.55+2,1.4,1.4,'#ffd84a');ellipse(ctx,4.5,-leg-body*.55+2,1.4,1.4,'#ffd84a');
  ctx.beginPath();ctx.moveTo(5,armY);ctx.lineTo(handFront[0],handFront[1]);ctx.lineWidth=5.5;ctx.strokeStyle='#d8302a';ctx.stroke();ctx.lineWidth=1.6;ctx.strokeStyle=out;
  ellipse(ctx,handFront[0],handFront[1],2.8,2.8,'#ffcf9e');ctx.stroke();
  // Head: hair, face, ear, eye, nose, moustache, then the cap with its badge.
  ellipse(ctx,-4.5,headY+2.5,4,5.5,'#6b3a22');ctx.stroke();
  ellipse(ctx,1.5,headY+1,r*.92,r*.92,'#ffcf9e');ctx.stroke();
  ellipse(ctx,-5,headY+3.5,2.6,3.4,'#6b3a22');
  ellipse(ctx,-2,headY+2,2,2.5,'#f4b47e');ctx.stroke();
  ellipse(ctx,4.5,headY-.5,1.3,2.3,'#1c1c2a');rect(ctx,4,headY-2.5,1,1,'#ffffff');
  ellipse(ctx,9,headY+2.5,3,2.6,'#ffbe86');ctx.stroke();
  ellipse(ctx,5.5,headY+5.5,4.3,1.9,'#6b3a22');
  ctx.beginPath();ctx.ellipse(0,headY-3,r+.5,r*.75,0,Math.PI,0);ctx.closePath();ctx.fillStyle='#e8392c';ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.ellipse(6,headY-2.5,6.5,2,0,0,Math.PI*2);ctx.fillStyle='#c42a22';ctx.fill();ctx.stroke();
  ellipse(ctx,0,headY-7,3,3,'#ffffff');ctx.fillStyle='#e8392c';ctx.fillRect(-1,headY-9,1.2,4);ctx.fillRect(-1,headY-6,2.6,1.2);
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
 function modernGround(ctx,x,y,near){
  const same=(dx,dy)=>near?.(dx,dy)==='ground',top=!same(0,-1),left=!same(-1,0),right=!same(1,0),bottom=!same(0,1);
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
 const modern={
  id:'modern',name:'Modern',era:'HD',pixel:false,blurb:'Smooth, shiny and layered.',grid:'#2d5a7a22',swatch:'#9ad8ff',
  sky(ctx,cam,tick){
   ctx.fillStyle=grad(ctx,0,512,['#4fb2ff','#9ad8ff','#dff4ff']);ctx.fillRect(0,0,960,512);
   ellipse(ctx,820,84,54,54,'#fff6c22e');ellipse(ctx,820,84,40,40,'#fff6c255');ellipse(ctx,820,84,28,28,'#fff3b8');
   const cloud=(x,y,s)=>{for(const [dx,dy,r] of [[0,0,22],[24,-10,26],[50,0,22],[25,8,22]])ellipse(ctx,x+dx*s,y+dy*s+6,r*s,r*s*.8,'#c9e3f5');for(const [dx,dy,r] of [[0,0,22],[24,-10,26],[50,0,22],[25,8,22]])ellipse(ctx,x+dx*s,y+dy*s,r*s,r*s*.8,'#ffffff')};
   for(let i=-1;i<6;i++){const x=i*520-cam*.08;cloud(x+80,80,1);cloud(x+330,150,.7)}
   const hills=(f,base,amp,color,top,period,phase)=>{ctx.fillStyle=grad(ctx,base-amp*2,512,[top,color]);ctx.beginPath();ctx.moveTo(0,512);const off=cam*f+phase;for(let sx=0;sx<=960;sx+=12){const w=(sx+off)/period;ctx.lineTo(sx,base-amp*(.6+.4*Math.sin(w*Math.PI*2))-amp*.35*Math.sin(w*Math.PI*5.3))}ctx.lineTo(960,512);ctx.closePath();ctx.fill()};
   hills(.12,330,60,'#8fcfb8','#b7e6d2',520,0);hills(.3,390,50,'#55b56a','#86d98a',380,140);
  },
  tile(ctx,t,x,y,opt={}){
   const reward={treatbrick:'treat',shieldbrick:'shield',jumpbrick:'boost',milkbrick:'milk'}[t];
   if(reward){modern.tile(ctx,'brick',x,y,opt);if(opt.build){ctx.save();roundRect(ctx,x+3,y+3,26,26,6);ctx.fillStyle='#fff6e2e6';ctx.fill();ctx.restore();modernItem(ctx,reward,x+3,y+3)}return}
   const tick=opt.tick||0;
   if(t==='ground')modernGround(ctx,x,y,opt.near);
   if(t==='brick'){ctx.save();roundRect(ctx,x+1,y+1,30,30,4);ctx.fillStyle=grad(ctx,y,y+32,['#f0a35e','#c8703a']);ctx.fill();ctx.strokeStyle='#7d3f1e';ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle='#9a5128';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+2,y+16);ctx.lineTo(x+30,y+16);ctx.moveTo(x+16,y+2);ctx.lineTo(x+16,y+16);ctx.moveTo(x+9,y+16);ctx.lineTo(x+9,y+30);ctx.moveTo(x+24,y+16);ctx.lineTo(x+24,y+30);ctx.stroke();
    rect(ctx,x+4,y+4,10,2,'#ffd2a8');rect(ctx,x+18,y+4,10,2,'#ffd2a8');ctx.restore()}
   if(t==='emptybrick'){ctx.save();roundRect(ctx,x+1,y+1,30,30,5);ctx.fillStyle=grad(ctx,y,y+32,['#b98758','#8a5d38']);ctx.fill();ctx.strokeStyle='#4f3420';ctx.lineWidth=2;ctx.stroke();for(const [px,py] of [[7,7],[25,7],[7,25],[25,25]]){ellipse(ctx,x+px,y+py,2.2,2.2,'#5c3d24');ellipse(ctx,x+px-.6,y+py-.6,1,1,'#e2bd8e')}ctx.restore()}
   if(t==='coin'){const sx=Math.cos(tick/9);ctx.save();ctx.translate(x+16,y+16);ctx.scale(Math.max(.12,Math.abs(sx)),1);ellipse(ctx,0,0,9,12,'#b8820c');ellipse(ctx,0,0,7.5,10.5,sx>0?'#ffd84a':'#f6c331');ellipse(ctx,0,0,4.5,7.5,'#f2b51c');rect(ctx,-1,-6,2,12,'#fff3b0');ctx.restore()}
   if(t==='spike'){ctx.save();ctx.beginPath();ctx.moveTo(x+2,y+31);ctx.lineTo(x+16,y+5);ctx.lineTo(x+30,y+31);ctx.closePath();const g=ctx.createLinearGradient(x+2,0,x+30,0);if(g){g.addColorStop(0,'#f4f7fb');g.addColorStop(.5,'#b8c2cf');g.addColorStop(1,'#6f7b8a')}ctx.fillStyle=g||'#b8c2cf';ctx.fill();ctx.strokeStyle='#3c4552';ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();ctx.restore()}
   if(t==='enemy')modernChip(ctx,x+3,y+8,{tick});
  },
  hero:(ctx,x,y,s={})=>modernHero(ctx,x,y,s),
  enemy:(ctx,x,y,s)=>modernChip(ctx,x,y,s),
  item:(ctx,kind,x,y)=>modernItem(ctx,kind,x,y),
  debris(ctx,d){ctx.save();ctx.translate(d.x+5,d.y+5);ctx.rotate(d.life/5);roundRect(ctx,-5,-5,10,10,2);ctx.fillStyle='#e0884a';ctx.fill();ctx.strokeStyle='#7d3f1e';ctx.lineWidth=1.5;ctx.stroke();ctx.restore()},
  home:modernHome,
  shield(ctx,p,tick){ctx.save();ctx.strokeStyle='#51bfe4';ctx.lineWidth=3;ctx.globalAlpha=.7+.3*Math.sin(tick/5);ctx.beginPath();ctx.ellipse(p.x+p.w/2,p.y+p.h/2,p.w/2+10,p.h/2+9,0,0,Math.PI*2);ctx.stroke();ctx.restore()},
  hud(ctx,info){
   ctx.save();ctx.font='800 20px system-ui,sans-serif';ctx.textBaseline='middle';ctx.lineJoin='round';
   const pill=(x,w,text,icon)=>{roundRect(ctx,x,12,w,38,19);ctx.fillStyle='#0b2a4a99';ctx.fill();if(icon)icon(x+22,31);ctx.lineWidth=5;ctx.strokeStyle='#0b2a4a';ctx.strokeText(text,x+(icon?40:16),32);ctx.fillStyle='#ffffff';ctx.fillText(text,x+(icon?40:16),32)};
   pill(14,150,'Elley-Oh! '+(info.big?'⬆':''),null);
   pill(178,110,'× '+info.coins,(cx,cy)=>{ellipse(ctx,cx,cy,8,11,'#b8820c');ellipse(ctx,cx,cy,6.5,9.5,'#ffd84a');rect(ctx,cx-1,cy-5,2,10,'#fff3b0')});
   pill(302,110,'× '+info.treats,(cx,cy)=>{ellipse(ctx,cx,cy,7,7,'#ff6fb0');ellipse(ctx,cx-2,cy-2,2,1.5,'#ffd6ea')});
   if(info.chapter)pill(816,130,'Chapter '+info.chapter,null);
   const power=[info.shield?'🛡 '+info.shield:'',info.boost?'🪽 '+info.boost:''].filter(Boolean).join('   ');
   if(power)pill(426,140,power,null);
   ctx.restore();
  }};

 const list=[classic,adventure,world,modern];
 return {list,get:id=>list.find(s=>s.id===id)||classic,ids:list.map(s=>s.id),fallback:'classic',pixelText,textWidth};
})();
