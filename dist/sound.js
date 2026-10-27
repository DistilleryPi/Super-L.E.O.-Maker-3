'use strict';
// Shared by the game and the sound studio. Audio files stay in this browser.
window.GameSound=(()=>{
 const folder=window.FolderSave?.enabled?window.FolderSave:null;
 const events={music:'Background music',jump:'Jump',bump:'Brick bump',break:'Brick smash',pickup:'Treat / coin',grow:'Milk / grow',hurt:'Shrink',stomp:'Enemy stomp',win:'Course complete',death:'Game over'};
 let onError=()=>{},db,clips=[],settings={volume:.65,slots:{}},context,musicAudio,musicTimer,notes=0,active=new Set(),echoIn,pulses={};
 // Built-in music and effect sounds for each game style (styles.js). Tunes are original: MIDI note numbers,
 // one per step, 0 for a rest. 'storybook' is the first tune, still used outside the game page.
 const pulse25={wave:'pulse25',gain:.07},square={wave:'pulse50',gain:.06};
 const themes={
  storybook:{step:.35,hold:.6,lead:[60,64,67,72,69,67,64,62],leadVoice:{},fx:{}},
  classic:{step:.2,hold:.75,leadVoice:pulse25,bassVoice:{wave:'triangle',gain:.16},fx:pulse25,
   lead:[72,0,76,79,0,76,74,72, 74,0,77,81,0,79,77,76, 76,79,84,0,83,81,79,77, 76,0,74,0,72,0,0,0],
   bass:[48,0,55,0,48,0,55,0, 50,0,57,0,50,0,57,0, 53,0,60,0,53,0,60,0, 55,0,50,0,48,0,43,0]},
  adventure:{step:.19,hold:.7,leadVoice:square,bassVoice:{wave:'triangle',gain:.16},fx:square,
   lead:[67,72,0,72,74,76,0,72, 69,74,0,74,76,77,0,74, 76,0,79,77,76,74,72,74, 76,0,72,0,67,0,0,0],
   bass:[48,0,52,0,55,0,52,0, 53,0,57,0,60,0,57,0, 48,0,52,0,55,0,52,0, 55,0,59,0,55,0,0,0]},
  world:{step:.22,hold:.8,leadVoice:{wave:'sine',gain:.15,vibrato:true,echo:true},bassVoice:{wave:'triangle',gain:.14},fx:{wave:'triangle',echo:true},
   lead:[79,0,76,0,72,74,76,0, 77,0,74,0,71,72,74,0, 76,79,81,79,77,76,74,72, 74,0,79,0,72,0,0,0],
   bass:[48,0,55,0,52,0,55,0, 43,0,50,0,47,0,50,0, 45,0,52,0,53,0,50,0, 43,0,47,0,48,0,0,0]},
  modern:{step:.21,hold:.8,leadVoice:{wave:'triangle',gain:.16,echo:true},bassVoice:{wave:'sine',gain:.2},fx:{wave:'sine',gain:.17,echo:true},
   lead:[72,74,76,0,79,0,76,0, 77,76,74,0,72,0,69,0, 72,74,76,79,81,79,76,74, 76,0,74,0,72,0,0,0],
   bass:[48,0,48,0,52,0,55,0, 53,0,53,0,57,0,53,0, 45,0,45,0,48,0,52,0, 43,0,47,0,48,0,0,0]}};
 let theme=themes.storybook;
 const midi=n=>440*2**((n-69)/12);
 function config(){try{const s=folder?.read('soundSettings')||JSON.parse(localStorage.getItem('jumpWorkshopSound')||'{}');settings={volume:typeof s.volume==='number'?Math.max(0,Math.min(1,s.volume)):.65,slots:s.slots||{}}}catch{settings={volume:.65,slots:{}}}}
 // Another window saved sound choices: use them here too.
 if(typeof document!=='undefined')document.addEventListener('folderchange',e=>{if(e.detail?.keys?.includes('soundSettings'))config()});
 config();
 const browserReady=new Promise((resolve,reject)=>{if(!window.indexedDB){reject(Error('This browser cannot store audio. Try serving the game on localhost.'));return}const r=indexedDB.open('jumpWorkshopAudio',1);r.onupgradeneeded=()=>r.result.createObjectStore('clips',{keyPath:'id'});r.onsuccess=()=>{db=r.result;refreshBrowser().then(resolve,reject)};r.onerror=()=>reject(r.error)});
 const ready=browserReady.catch(e=>{if(folder)return [];throw e}).then(async legacy=>{if(!folder)return legacy;const disk=await folder.audio.list();if(!disk.length&&legacy.length){for(const clip of legacy)await folder.audio.put(clip.id,clip.name,clip.blob)}if(!folder.read('soundSettings'))folder.write('soundSettings',settings);return refresh()});
 ready.catch(()=>{});if(folder)folder.track(ready);
 async function refresh(){if(folder){const list=await folder.audio.list();clips=await Promise.all(list.map(async clip=>({...clip,blob:await folder.audio.get(clip)})));return clips}return refreshBrowser()}
 function refreshBrowser(){return new Promise((resolve,reject)=>{const r=db.transaction('clips').objectStore('clips').getAll();r.onsuccess=()=>{clips=r.result;resolve(clips)};r.onerror=()=>reject(r.error)})}
 function write(action,value){return new Promise((resolve,reject)=>{const tx=db.transaction('clips','readwrite');tx.objectStore('clips')[action](value);tx.oncomplete=()=>refreshBrowser().then(resolve,reject);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Audio storage is full'))})}
 function unlock(){try{context??=new(window.AudioContext||window.webkitAudioContext)();context.resume().catch(()=>{})}catch{}}
 // A pulse wave (like 8-bit consoles) with `duty` percent high, built from its harmonics.
 function pulseWave(duty){if(!context.createPeriodicWave)return null;if(!pulses[duty]){const n=32,real=new Float32Array(n),imag=new Float32Array(n);for(let i=1;i<n;i++)real[i]=2*Math.sin(Math.PI*i*duty/100)/(Math.PI*i);pulses[duty]=context.createPeriodicWave(real,imag)}return pulses[duty]}
 function echo(){if(!echoIn&&context.createDelay){const d=context.createDelay(1),feedback=context.createGain(),wet=context.createGain();d.delayTime.value=.24;feedback.gain.value=.3;wet.gain.value=.3;d.connect(feedback);feedback.connect(d);d.connect(wet);wet.connect(context.destination);echoIn=d}return echoIn}
 function tone(freq,duration,offset=0,voice={}){if(!context||settings.volume===0)return;const o=context.createOscillator(),g=context.createGain(),at=context.currentTime+offset,wave=voice.wave||'triangle',shape=wave.startsWith('pulse')?pulseWave(+wave.slice(5)):null;if(shape)o.setPeriodicWave(shape);else o.type=wave.startsWith('pulse')?'square':wave;o.frequency.value=freq;g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0001,settings.volume*(voice.gain||.15)),at+.01);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(context.destination);const delay=voice.echo&&echo();if(delay)g.connect(delay);
  let wobble;if(voice.vibrato){wobble=context.createOscillator();const depth=context.createGain();wobble.frequency.value=5.5;depth.gain.value=freq*.012;wobble.connect(depth);depth.connect(o.frequency);wobble.start(at);wobble.stop(at+duration+.02)}
  active.add(o);o.onended=()=>{active.delete(o);o.disconnect();g.disconnect();wobble?.disconnect()};o.start(at);o.stop(at+duration+.02)}
 function playNote(instrument,midi){unlock();if(!context){onError('Audio is unavailable in this browser.');return}const data=window.ToyInstruments.samples(instrument,midi),buffer=context.createBuffer(1,data.length,window.ToyInstruments.rate);buffer.copyToChannel(data,0);const src=context.createBufferSource(),gain=context.createGain();src.buffer=buffer;gain.gain.value=settings.volume*.65;src.connect(gain);gain.connect(context.destination);active.add(src);src.onended=()=>{active.delete(src);src.disconnect();gain.disconnect()};src.start();src.stop(context.currentTime+data.length/window.ToyInstruments.rate+.02)}
 function builtin(event){const tunes={jump:[330,550],bump:[160],break:[180,110,70],pickup:[660,880],grow:[330,440,660,880],hurt:[440,220],stomp:[130,240],win:[440,550,660,880],death:[440,370,294,196,130]};(tunes[event]||[]).forEach((f,i)=>tone(f,event==='death'?.24:.12,i*(event==='death'?.22:.09),theme.fx))}
 function custom(id,loop=false){const clip=clips.find(c=>c.id===id);if(!clip)return null;const url=URL.createObjectURL(clip.blob),a=new Audio(url);a.volume=settings.volume;a.loop=loop;active.add(a);let cleaned=false;const clean=()=>{if(cleaned)return;cleaned=true;active.delete(a);URL.revokeObjectURL(url)};a.addEventListener('ended',clean,{once:true});a.addEventListener('error',()=>{clean();onError('This audio file could not be played. Try an MP3, WAV, or a new browser recording.')},{once:true});a.cleanup=clean;a.play().catch(e=>{clean();onError('Audio could not start: '+e.message)});return a}
 function effect(event){const slot=settings.slots[event]||'builtin';if(slot==='mute')return;if(slot!=='builtin'&&custom(slot))return;builtin(event)}
 function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}if(musicAudio){musicAudio.pause();musicAudio.cleanup();musicAudio=null}}
 function music(){stopMusic();const slot=settings.slots.music||'builtin';if(slot==='mute')return;if(slot!=='builtin'){musicAudio=custom(slot,true);if(musicAudio)return}const tune=theme;notes=0;const tick=()=>{const i=notes++%tune.lead.length;if(tune.lead[i])tone(midi(tune.lead[i]),tune.step*tune.hold,0,tune.leadVoice);if(tune.bass?.[i])tone(midi(tune.bass[i]),tune.step*.85,0,tune.bassVoice)};tick();musicTimer=setInterval(tick,tune.step*1000)}
 function stop(){stopMusic();for(const a of [...active]){if(a instanceof HTMLMediaElement){a.pause();a.cleanup()}else{try{a.stop()}catch{}}}active.clear()}
 function save(){if(folder){try{localStorage.setItem('jumpWorkshopSound',JSON.stringify(settings))}catch{}folder.write('soundSettings',settings)}else localStorage.setItem('jumpWorkshopSound',JSON.stringify(settings))}
 return {set onError(fn){onError=fn},theme(id){theme=themes[id]||themes.storybook},events,ready,refresh,unlock,playNote,effect,music,stopMusic,stop,reload:config,get clips(){return clips},get settings(){return settings},setSlot(event,id){settings.slots[event]=id;save()},setVolume(v){settings.volume=v;save()},async add(name,blob){await ready;const id=crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);if(folder){await folder.audio.put(id,name.slice(0,80),blob);await refresh()}else await write('put',{id,name:name.slice(0,80),blob});return id},async remove(id){if(folder){await folder.audio.remove(id);await refresh()}else await write('delete',id);for(const k of Object.keys(settings.slots))if(settings.slots[k]===id)settings.slots[k]='builtin';save()},preview(id){stop();unlock();if(id==='music')music();else if(events[id])effect(id);else custom(id)}};
})();
