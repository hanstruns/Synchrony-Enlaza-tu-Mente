'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
function env(){
 const memory=new Map(),sources=[],requests=[],vibrations=[];
 const param=()=>({value:0,setValueAtTime(v){this.value=v},setTargetAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},cancelScheduledValues(){}});
 class AudioContext{
 constructor(){this.currentTime=0;this.state='suspended';this.destination={}}
 async resume(){this.state='running'}
 createGain(){return {gain:param(),connect(){},disconnect(){}}}
 createBufferSource(){const s={connect(){},disconnect(){},start(){this.started=true},stop(){this.stopped=true}};sources.push(s);return s}
 async decodeAudioData(b){return {data:b}}
 }
 const c={window:{AudioContext},document:{hidden:false},navigator:{vibrate(p){vibrations.push(p);return true}},fetch:async p=>{requests.push(p);return{ok:true,arrayBuffer:async()=>new ArrayBuffer(4)}},sessionStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../audio.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../web-ads.js'),'utf8'),c);
 const store={get:k=>memory.get(k)??null,set:(k,v)=>memory.set(k,String(v))};
 return {c,memory,sources,requests,vibrations,audio:new c.window.SynchronyAudio(store)};
}
async function settle(){for(let i=0;i<8;i++)await new Promise(r=>setImmediate(r))}
test('no inicia audio sin interacción; menú y partida cambian una vez, no por cada carta',async()=>{
 const e=env();e.audio.setPhase(null);assert.equal(e.sources.length,0);await e.audio.unlock();await settle();assert.equal(e.audio.track.name,'menu');
 e.audio.setPhase('lobby');await settle();assert.equal(e.sources.length,1);
 e.audio.setPhase('countdown');await settle();assert.equal(e.audio.track.name,'partida');assert.equal(e.sources.length,2);
 for(const phase of ['playing','between','retry','won'])e.audio.setPhase(phase);await settle();assert.equal(e.sources.length,2);
 e.audio.setPhase(null);await settle();assert.equal(e.audio.track.name,'menu');assert.equal(e.requests.filter(x=>x.includes('/music/')).length,2);
});
test('segundo plano y anuncio silencian inmediatamente; conserva volumen y preferencias',async()=>{
 const e=env();await e.audio.unlock();await settle();e.audio.set('volume',.13);assert.equal(e.audio.track.gain.gain.value,.13);
 e.c.document.hidden=true;e.audio.sync();assert.equal(e.audio.master.gain.value,0);assert.equal(e.audio.track,null);
 e.c.document.hidden=false;await e.audio.unlock();await settle();assert.equal(e.audio.track.gain.gain.value,.13);
 e.audio.setBlocked(true);assert.equal(e.audio.master.gain.value,0);e.audio.setBlocked(false);await settle();assert.equal(e.audio.track.name,'menu');
 e.audio.set('musicOn',false);await settle();assert.equal(e.audio.track,null);assert.equal(e.memory.get('synchrony-music'),'false');
});
test('efectos independientes, vibración configurable y navegador sin vibración',async()=>{
 const e=env();await e.audio.unlock();await settle();const old=e.audio.track;e.audio.set('soundOn',true);await e.audio.cue('test');assert.equal(e.audio.track,old);
 e.audio.set('vibrationOn',false);assert.equal(e.audio.vibrate('card'),false);assert.equal(e.audio.vibrate('test',true),true);
 delete e.c.navigator.vibrate;assert.equal(e.audio.vibrate('test',true),false);
});
test('una carga tardía no arranca música después de ocultar la página',async()=>{
 const e=env();let release;e.c.fetch=()=>new Promise(r=>{release=r});await e.audio.unlock();await settle();
 e.c.document.hidden=true;e.audio.sync();release({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)});await settle();assert.equal(e.sources.length,0);
});
test('publicidad solo tras resultado final y una vez por jugador; silencia durante el anuncio',async()=>{
 const e=env(),ads=new e.c.window.SynchronyWebAds(e.audio);let count=0;ads.ready=true;
 ads.call=o=>{count++;o.beforeAd();assert.equal(e.audio.blocked,true);o.afterAd();o.adBreakDone({breakStatus:'viewed'})};
 const state={code:'aB123x',me:'p',players:[{id:'p',excluded:false}],phase:'between'};
 await ads.forResult(state);assert.equal(count,0);state.phase='won';await ads.forResult(state);assert.equal(count,1);assert.equal(e.audio.blocked,false);await ads.forResult(state);assert.equal(count,1);
 state.me='q';state.players=[{id:'q',excluded:true}];await ads.forResult(state);assert.equal(count,1);
});
