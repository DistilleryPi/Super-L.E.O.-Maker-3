'use strict';
window.FolderSave=(()=>{
 const boot=window.FolderBootstrap,enabled=!!boot?.enabled,pending=new Map(),assets=new Set(),inFlight=new Set(),keys=['world','soundSettings'];
 // The revision of each saved part this page is working from. The launcher refuses a save made from an older copy.
 const revisions={world:0,soundSettings:0,...boot?.revisions};
 let running=null,error='',conflict=false,retry,ticket=0,syncing=false;
 // Other tabs in this browser hear about each save as soon as it lands, so they keep editing the newest copy.
 const channel=enabled&&typeof BroadcastChannel==='function'?new BroadcastChannel('elley-folder-save'):null;
 function notice(){let el=document.getElementById('folder-save-status');if(!el){el=document.createElement('p');el.id='folder-save-status';el.setAttribute('role','status');document.querySelector('main')?.prepend(el)}if(!el)return;el.className='folder-status '+(error?'save-error':'');el.textContent=boot?.error||(!enabled?'Browser-only mode · use the game launcher to save into the game folder.':conflict?'Not saved — '+error:error?'Folder save failed — '+error+' Please keep this page open and try again.':pending.size||running||assets.size?'Saving to game folder…':'Saved in game folder · data/game.json')}
 async function request(path,options={}){const r=await fetch(path,{...options,headers:{'X-Game-Save':'1',...options.headers}});if(!r.ok){let problem;try{problem=(await r.json()).error}catch{}const failure=Error(problem||'The local game server could not save.');failure.conflict=r.status===409;throw failure}return r}
 function write(key,value){if(!enabled)return;boot[key]=value;pending.set(key,{value,version:++ticket});if(!conflict)error='';clearTimeout(retry);notice();pump()}
 function pump(){if(!enabled||conflict||running||!pending.size)return running||Promise.resolve();const batch=new Map(pending),patch=Object.fromEntries([...batch].map(([k,v])=>[k,v.value]));patch.base=Object.fromEntries([...batch.keys()].map(k=>[k,revisions[k]]));batch.forEach((_,k)=>inFlight.add(k));
  running=request('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)}).then(r=>r.json()).then(result=>{for(const [key,v]of batch){revisions[key]=result.revisions?.[key]??revisions[key]+1;if(pending.get(key)?.version===v.version)pending.delete(key);channel?.postMessage({key,value:v.value,revision:revisions[key]})}error=''})
   .catch(e=>{error=e.message;if(e.conflict)conflict=true;else retry=setTimeout(pump,3000)}).finally(()=>{running=null;inFlight.clear();notice();if(!error&&pending.size)pump()});return running}
 function adopt(changed,read){for(const k of changed){boot[k]=read(k).value;revisions[k]=read(k).revision}document.dispatchEvent(new CustomEvent('folderchange',{detail:{keys:changed}}))}
 // A save from another tab replaces this page's copy, unless this page has its own unsaved change to that part.
 if(channel)channel.onmessage=({data})=>{if(conflict||!keys.includes(data?.key)||!(data.revision>revisions[data.key])||pending.has(data.key)||inFlight.has(data.key))return;adopt([data.key],()=>data)};
 // Saves from another browser are picked up when this page is shown again.
 async function sync(){if(!enabled||conflict||syncing||pending.size||running||assets.size)return;syncing=true;try{const latest=await(await request('/api/revisions')).json();if(!keys.some(k=>latest[k]!==revisions[k]))return;const state=await(await request('/api/state')).json();if(conflict||pending.size||running)return;const changed=keys.filter(k=>(state.revisions?.[k]||0)!==revisions[k]);if(changed.length)adopt(changed,k=>({value:state[k],revision:state.revisions?.[k]||0}))}catch{}finally{syncing=false}}
 function track(promise){const watched=Promise.resolve(promise).catch(e=>{error=e.message;throw e}).finally(()=>{assets.delete(watched);notice()});assets.add(watched);watched.catch(()=>{});notice();return watched}
 async function flush(){if(!enabled)return;if(assets.size)await Promise.all([...assets]);clearTimeout(retry);while(pending.size||running){await(running||pump());if(error)throw Error(error)}}
 async function navigate(url){try{await flush();location.href=url}catch(e){notice();alert(conflict?e.message:'The folder save has not finished. Please keep this page open and try again. '+e.message)}}
 const audio={async list(){return (await request('/api/audio')).json()},async get(clip){return(await request('/api/audio/'+encodeURIComponent(clip.id))).blob()},async put(id,name,blob){await track(request('/api/audio/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':blob.type||'audio/webm','X-Clip-Name':encodeURIComponent(name)},body:blob}))},async remove(id){await track(request('/api/audio/'+encodeURIComponent(id),{method:'DELETE'}))}};
 document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!enabled||!a||e.button!==0||e.ctrlKey||e.metaKey||a.target||a.download||!pending.size&&!running&&!assets.size)return;const url=new URL(a.href,location.href);if(url.origin===location.origin){e.preventDefault();navigate(a.href)}});
 window.addEventListener('beforeunload',e=>{if(enabled&&!conflict&&(pending.size||running||assets.size)){e.preventDefault();e.returnValue=''}});
 window.addEventListener('focus',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});window.addEventListener('pageshow',e=>{if(e.persisted)sync()});
 notice();return {enabled,track,read:key=>enabled?boot[key]:null,write,flush,navigate,sync,audio,get pending(){return !!(pending.size||running||assets.size)},get conflict(){return conflict}};
})();
