'use strict';
window.ToyInstruments=(()=>{
 const rate=22050;
 function voice(instrument,midi,t){
  if(t<0)return 0;const f=440*2**((midi-69)/12),p=2*Math.PI*f*t,attack=Math.min(1,t/.004);
  if(instrument==='xylophone')return attack*(Math.sin(p)*Math.exp(-t*6)+.35*Math.sin(p*3.99)*Math.exp(-t*13)+.12*Math.sin(p*9.2)*Math.exp(-t*22))*.5;
  return attack*(Math.sin(p)*Math.exp(-t*2.6)+.4*Math.sin(p*2)*Math.exp(-t*4)+.18*Math.sin(p*3)*Math.exp(-t*6)+.08*Math.sin(p*4)*Math.exp(-t*8))*.45;
 }
 function samples(instrument,midi,duration=1.5){const data=new Float32Array(Math.ceil(rate*duration));for(let i=0;i<data.length;i++)data[i]=voice(instrument,midi,i/rate);return data}
 function wav(notes){
  if(!notes.length)throw Error('Play a few notes before saving your tune.');
  if(notes.length>256)throw Error('Please keep a tune to 256 notes or fewer.');
  const duration=Math.min(62,Math.max(...notes.map(n=>n.at))+1.5),data=new Float32Array(Math.ceil(duration*rate));
  for(const n of notes){const start=Math.round(n.at*rate),sound=samples(n.instrument,n.midi);for(let i=0;i<sound.length&&start+i<data.length;i++)data[start+i]+=sound[i]}
  let peak=1;for(const value of data)peak=Math.max(peak,Math.abs(value));
  const bytes=new ArrayBuffer(44+data.length*2),view=new DataView(bytes);const text=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i))};
  text(0,'RIFF');view.setUint32(4,36+data.length*2,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,data.length*2,true);
  for(let i=0;i<data.length;i++)view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,data[i]/peak)) *32767),true);
  return new Blob([bytes],{type:'audio/wav'});
 }
 return {rate,voice,samples,wav};
})();
window.InstrumentStudio=({sound,status,onSaved})=>{
 const el=id=>document.getElementById(id),names=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B','C'],keys=['a','w','s','e','d','f','t','g','y','h','u','j','k'];
 let instrument='piano',composing=false,notes=[],started=0,timer,busy=false;
 const state=()=>{el('tune-record').disabled=composing||busy;el('tune-save').disabled=!composing||busy;el('tune-discard').disabled=!composing||busy;el('tune-state').textContent=composing?'● Recording tune · '+notes.length+' notes':'Ready to play — no microphone needed.'};
 const draw=()=>{el('instrument-keys').className='instrument-keys '+instrument;document.querySelectorAll('[data-instrument]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.instrument===instrument)))};
 function play(i){sound.playNote(instrument,60+i);const b=el('note-'+i);b.classList.add('sounding');setTimeout(()=>b.classList.remove('sounding'),180);if(composing){notes.push({instrument,midi:60+i,at:(performance.now()-started)/1000});state();if(notes.length>=256)save()}}
 async function save(){if(!composing||busy)return;composing=false;busy=true;clearTimeout(timer);state();try{const name=el('tune-name').value.trim()||'Our '+instrument+' tune';const blob=ToyInstruments.wav(notes);await sound.add(name,blob);onSaved();status('Saved “'+name+'” — choose it for any game sound or music!')}catch(e){status('Could not save tune: '+e.message)}finally{busy=false;state()}}
 for(let i=0;i<names.length;i++){const b=document.createElement('button');b.id='note-'+i;b.className=names[i].includes('♯')?'accidental':'natural';b.innerHTML='<strong>'+names[i]+'</strong><small>'+keys[i].toUpperCase()+'</small>';b.setAttribute('aria-label',names[i]+' note '+(i===12?'5':'4'));b.onclick=()=>play(i);el('instrument-keys').append(b)}
 document.querySelectorAll('[data-instrument]').forEach(b=>b.onclick=()=>{instrument=b.dataset.instrument;draw()});
 document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;const i=keys.indexOf(e.key.toLowerCase());if(i>=0){e.preventDefault();play(i)}});
 el('tune-record').onclick=()=>{sound.stop();notes=[];started=performance.now();composing=true;state();status('Play your melody on the keys, then Stop & save tune.');timer=setTimeout(save,60000)};
 el('tune-save').onclick=save;el('tune-discard').onclick=()=>{clearTimeout(timer);composing=false;notes=[];sound.stop();state();status('Tune discarded — try another!')};
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&composing)save()});window.addEventListener('pagehide',()=>clearTimeout(timer));draw();state();
};
