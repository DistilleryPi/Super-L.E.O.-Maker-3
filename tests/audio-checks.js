let done=false,failure='';function assert(v,s){if(!v)throw Error(s)}
(async()=>{
 await GameSound.ready;await tick();assert(!get('record').disabled,'record ready');
 await get('record').onclick();assert(micRequests===1&&get('record').disabled&&!get('stop-record').disabled,'record starts after click');
 get('stop-record').onclick();for(let i=0;i<8;i++)await tick();assert(GameSound.clips.length===1&&GameSound.clips[0].blob.size>0,'recording stored');assert(released>0,'microphone released');
 const recorded=GameSound.clips[0].id;GameSound.setSlot('death',recorded);GameSound.unlock();GameSound.effect('death');assert(media.at(-1).played,'death uses selected recording');
 GameSound.setSlot('music',recorded);GameSound.music();assert(media.at(-1).loop,'custom music loops');GameSound.stop();assert(media.at(-1).paused,'stop pauses music');
 GameSound.setSlot('jump','builtin');const before=oscillators;GameSound.effect('jump');assert(oscillators>before,'built in effect plays');GameSound.setSlot('jump','mute');const muted=oscillators;GameSound.effect('jump');assert(oscillators===muted,'silent assignment works');
 for(const event of ['throw','kick','swim','spin','freeze']){assert(GameSound.events[event]&&get('slot-'+event),'new effect appears in studio: '+event);GameSound.setSlot(event,'builtin');const beforeEffect=oscillators;GameSound.effect(event);assert(oscillators>beforeEffect,'built-in '+event+' plays')}
 GameSound.setSlot('throw',recorded);const beforeMedia=media.length;GameSound.effect('throw');assert(media.length===beforeMedia+1&&media.at(-1).played,'custom recording overrides throw');GameSound.setSlot('throw','builtin');
 GameSound.setSlot('music','builtin');GameSound.theme('classic');let notesBefore=oscillators;GameSound.music();assert(oscillators===notesBefore+2,'8-bit style music plays a tune and a bass line');
 GameSound.theme('classic','underwater');notesBefore=oscillators;GameSound.music();assert(oscillators===notesBefore+2,'underwater melody keeps style voice and bass');
 GameSound.theme('world');notesBefore=oscillators;GameSound.music();assert(oscillators===notesBefore+3,'16-bit style tune wobbles (vibrato)');
 GameSound.theme('missing');notesBefore=oscillators;GameSound.music();assert(oscillators===notesBefore+1,'unknown styles play the original tune');GameSound.stop();GameSound.setSlot('music',recorded);
 get('clip-name').value='Family music';const input={files:[new Blob(['song'],{type:'audio/wav'})],value:'audio'};await get('audio-upload').onchange({target:input});assert(GameSound.clips.length===2&&GameSound.clips[1].name==='Family music','uploaded music saved');
 const select=get('slot-music');select.value=GameSound.clips[1].id;select.onchange();assert(GameSound.settings.slots.music===select.value,'studio selection saved');GameSound.reload();assert(GameSound.settings.slots.music===select.value,'selection survives reload');
 get('volume').oninput({target:{value:'40'}});assert(GameSound.settings.volume===.4,'volume saved');
 await GameSound.remove(recorded);assert(GameSound.clips.length===1&&GameSound.settings.slots.death==='builtin','delete resets assigned effect');
 const count=GameSound.clips.length;await get('audio-upload').onchange({target:{files:[{size:21*1024*1024,type:'audio/wav'}],value:'x'}});assert(GameSound.clips.length===count&&get('audio-status').textContent.includes('smaller'),'oversized upload rejected');

 const piano=ToyInstruments.samples('piano',60),xylo=ToyInstruments.samples('xylophone',60);assert(piano.length===33075&&piano.some(v=>Math.abs(v)>.1),'piano produces notes');assert(piano[1000]!==xylo[1000],'instruments have distinct timbres');
 const beforeTune=GameSound.clips.length;get('tune-name').value='Our piano tune';get('tune-record').onclick();get('note-0').onclick();get('note-4').onclick();await get('tune-save').onclick();assert(GameSound.clips.length===beforeTune+1,'instrument tune saved to library');const tune=GameSound.clips.at(-1);assert(tune.blob.type==='audio/wav'&&tune.blob.size>44000,'tune is a WAV audio file');const header=new DataView(tune.blob.parts[0]);assert(header.getUint32(24,true)===22050&&header.getUint16(34,true)===16,'WAV sample rate and bit depth');assert(header.getUint32(40,true)===tune.blob.size-44,'WAV audio length');
 let rejected=false;try{ToyInstruments.wav([])}catch{rejected=true}assert(rejected,'empty tune cannot be saved');
 done=true;
})().catch(e=>{failure=String(e);done=true});
