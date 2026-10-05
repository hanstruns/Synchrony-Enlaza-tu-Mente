'use strict';
class SynchronyAudio {
  constructor(store, changed=()=>{}) {
    this.store=store; this.changed=changed; this.context=null; this.buffers=new Map();
    this.musicOn=store.get('synchrony-music')!=='false';
    this.soundOn=store.get('synchrony-sound')==='true';
    this.vibrationOn=store.get('synchrony-vibration')!=='false';
    const saved=store.get('synchrony-music-volume');
    this.volume=saved===null ? .22 : Math.max(0,Math.min(.5,Number(saved)||0));
    this.phase=null; this.track=null; this.revision=0; this.blocked=false;
    this.voices=new Set(); this.musicVoices=new Set(); this.status='Pulsa cualquier botón para iniciar la música.';
  }
  active(){return !document.hidden&&!this.blocked}
  async unlock(){
    if(!this.active())return;
    try {
      if(!this.context){
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio)throw Error('Este navegador no permite reproducir audio.');
        this.context=new Audio(); this.master=this.context.createGain();this.master.connect(this.context.destination);
        this.context.onstatechange=()=>this.changed();
      }
      await this.context.resume();
      if(this.context.state!=='running')return;
      if(!this.track)this.status='Audio preparado'; this.sync(); this.changed();
    }catch(e){this.status='Pulsa de nuevo para activar el audio.';this.changed()}
  }
  async buffer(path){
    if(!this.buffers.has(path))this.buffers.set(path,fetch(path).then(r=>{if(!r.ok)throw Error('No se encuentra '+path);return r.arrayBuffer()}).then(b=>this.context.decodeAudioData(b)).catch(e=>{this.buffers.delete(path);throw e}));
    return this.buffers.get(path);
  }
  setPhase(phase){this.phase=phase;this.sync()}
  setBlocked(value){this.blocked=value;this.sync();if(!value)this.unlock()}
  set(key,value){
    this[key]=value;
    const names={musicOn:'music',soundOn:'sound',vibrationOn:'vibration',volume:'music-volume'};
    this.store.set('synchrony-'+names[key],value);
    if(key==='volume'&&this.track&&this.context){const g=this.track.gain.gain;g.cancelScheduledValues(this.context.currentTime);g.setTargetAtTime(value,this.context.currentTime,.08)}
    this.sync();this.changed();
  }
  stopMusic(immediate=false){
    this.track=null;
    const now=this.context?.currentTime||0;
    for(const voice of this.musicVoices){
      voice.gain.gain.cancelScheduledValues(now);
      if(immediate){voice.gain.gain.setValueAtTime(0,now);try{voice.source.stop()}catch{}}
      else{voice.gain.gain.setTargetAtTime(0,now,.15);try{voice.source.stop(now+.8)}catch{}}
    }
  }
  sync(){
    if(!this.context)return;
    this.master.gain.setValueAtTime(this.active()?1:0,this.context.currentTime);
    if(!this.active()||!this.musicOn){++this.revision;this.stopMusic(true);if(!this.active()){for(const v of this.voices)try{v.stop()}catch{};if(navigator.vibrate)navigator.vibrate(0)}return}
    if(this.context.state!=='running')return;
    const name=!this.phase||this.phase==='lobby'?'menu':'partida';
    if(this.track?.name===name||this.loading===name)return;
    const revision=++this.revision; this.loading=name;
    this.stopMusic();
    this.buffer('assets/music/'+name+'.wav').then(buffer=>{
      if(revision!==this.revision||!this.active()||!this.musicOn)return;
      const source=this.context.createBufferSource(),gain=this.context.createGain();
      source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(this.master);
      gain.gain.setValueAtTime(0,this.context.currentTime);gain.gain.linearRampToValueAtTime(this.volume,this.context.currentTime+1.2);
      const voice={name,source,gain};this.track=voice;this.musicVoices.add(voice);
      source.onended=()=>{this.musicVoices.delete(voice);source.disconnect();gain.disconnect()};source.start();
      this.status=name==='menu'?'Umbral sereno · menú':'Mente en calma · partida';this.changed();
    }).catch(()=>{this.status='No se pudo cargar la música. Comprueba la carpeta assets.';this.changed()}).finally(()=>{if(this.loading===name)this.loading=null;if(revision!==this.revision&&this.active()&&this.musicOn)this.sync()});
  }
  async cue(name,force=false){
    if(!this.active()||(!this.soundOn&&!force))return;
    if(!['card','countdown','start','success','won','mistake','lost','test'].includes(name))return;
    await this.unlock();if(!this.context||this.context.state!=='running')return;
    try{const buffer=await this.buffer('assets/sounds/'+name+'.wav');if(!this.active()||(!force&&!this.soundOn))return;
      const source=this.context.createBufferSource();source.buffer=buffer;source.connect(this.master);this.voices.add(source);
      source.onended=()=>{this.voices.delete(source);source.disconnect()};source.start();
    }catch{this.status='No se pudo cargar el efecto de sonido.';this.changed()}
  }
  vibrate(name='card',force=false){
    if(!this.active()||(!this.vibrationOn&&!force))return false;
    if(!navigator.vibrate)return false;
    try{return navigator.vibrate(['mistake','lost'].includes(name)?[100,50,120]:name==='card'?40:120)}catch{return false}
  }
}
window.SynchronyAudio=SynchronyAudio;
