const jobs=[],saved=new Map(),media=[],store=new Map();let serial=0,micRequests=0,released=0;
const window=globalThis;
const localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
const noop=()=>{};
const document={hidden:false,activeElement:{tagName:'BODY'},querySelectorAll:()=>[],addEventListener:noop,createElement:()=>makeElement(),getElementById:id=>get(id)};
const elements=new Map();function makeElement(){return {set id(v){elements.set(v,this)},value:'',disabled:false,dataset:{},classList:{add:noop,remove:noop},setAttribute:noop,textContent:'',files:[],children:[],append(...c){this.children.push(...c)},replaceChildren(){this.children=[]},click:noop}}function get(id){if(!elements.has(id))elements.set(id,makeElement());return elements.get(id)}
window.addEventListener=noop;
window.indexedDB={open(){const req={result:{createObjectStore:noop,transaction(){const tx={objectStore(){return {getAll(){const r={};jobs.push(()=>{r.result=[...store.values()];r.onsuccess()});return r},put(value){store.set(value.id,value);jobs.push(()=>tx.oncomplete())},delete(id){store.delete(id);jobs.push(()=>tx.oncomplete())}}}};return tx}}};jobs.push(()=>req.onsuccess());return req}};
class Blob{constructor(parts,options={}){this.parts=parts;this.type=options.type||'';this.size=parts.reduce((sum,p)=>sum+(p.size||p.byteLength||p.length||0),0)}}
const crypto={randomUUID:()=>`clip-${++serial}`};
const URL={createObjectURL:()=>`blob:${serial}`,revokeObjectURL:noop};
class HTMLMediaElement{}
class Audio extends HTMLMediaElement{constructor(url){super();this.url=url;this.events={};media.push(this)}addEventListener(name,fn){this.events[name]=fn}play(){this.played=true;return Promise.resolve()}pause(){this.paused=true}}
let oscillators=0;class AudioContext{constructor(){this.currentTime=0;this.destination={}}resume(){return Promise.resolve()}createOscillator(){oscillators++;return {frequency:{value:0},connect:noop,disconnect:noop,start:noop,stop:noop}}createBuffer(channels,length,rate){return {copyToChannel:noop}}createBufferSource(){return {connect:noop,disconnect:noop,start:noop,stop:noop}}createGain(){return {gain:{setValueAtTime:noop,exponentialRampToValueAtTime:noop},connect:noop,disconnect:noop}}}
let timers=new Map(),nextTimer=0;function setTimeout(fn){timers.set(++nextTimer,fn);return nextTimer}function clearTimeout(id){timers.delete(id)}function setInterval(fn){timers.set(++nextTimer,fn);return nextTimer}function clearInterval(id){timers.delete(id)}
const navigator={mediaDevices:{async getUserMedia(){micRequests++;return {getTracks:()=>[{stop:()=>released++}]}}}};
class MediaRecorder{constructor(){this.state='inactive';this.mimeType='audio/webm'}start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable({data:new Blob(['audio'])});this.onstop()}}
function confirm(){return true}
const drain=()=>{const batch=jobs.splice(0);batch.forEach(fn=>fn())};const tick=()=>new Promise(resolve=>jobs.push(resolve));
window.MediaRecorder=MediaRecorder;window.AudioContext=AudioContext;

const performance={now:()=>Date.now()};
