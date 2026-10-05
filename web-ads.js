'use strict';
class SynchronyWebAds {
  constructor(audio,changed=()=>{}){
    this.audio=audio;this.changed=changed;this.ready=false;this.showing=false;this.pending=false;
    this.status='Publicidad web sin configurar';this.seen=new Set();
    try{this.seen=new Set(JSON.parse(sessionStorage.getItem('synchrony-web-ad-results')||'[]'))}catch{}
  }
  init(){
    const c=window.SYNCHRONY_WEB_ADS||{};
    if(!c.enabled)return;
    if(!/^ca-pub-\d{16}$/.test(c.publisher)){this.status='Revisa el identificador de AdSense H5';this.changed();return}
    this.status=c.testMode?'Preparando anuncios web de prueba…':'Preparando anuncios web…';this.changed();
    window.adsbygoogle=window.adsbygoogle||[];
    this.call=o=>window.adsbygoogle.push(o);
    const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';
    script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(c.publisher);
    if(c.testMode)script.setAttribute('data-adbreak-test','on');
    script.onerror=()=>{this.status='No se ha cargado la publicidad web';this.changed()};
    this.call({preloadAdBreaks:'on',onReady:()=>{this.ready=true;this.status=c.testMode?'H5 preparado · modo de prueba':'H5 preparado';this.changed()}});
    document.head.append(script);
  }
  async forResult(state){
    const me=state?.players.find(p=>p.id===state.me);
    if(!state||!['won','lost'].includes(state.phase)||!me||me.excluded)return;
    const key=state.code+':'+state.me;
    if(this.seen.has(key)||this.pending)return;
    this.seen.add(key);try{sessionStorage.setItem('synchrony-web-ad-results',JSON.stringify([...this.seen].slice(-200)))}catch{}
    if(!this.ready)return;
    this.pending=true;
    try{await new Promise(resolve=>{
      const done=info=>{this.pending=false;this.showing=false;this.audio.setBlocked(false);this.status=info?.breakStatus==='viewed'?'Anuncio completado':'Pausa publicitaria finalizada';this.changed();resolve()};
      try{this.call({type:'browse',name:'fin-partida',beforeAd:()=>{this.showing=true;this.audio.setBlocked(true);this.changed()},afterAd:()=>{this.showing=false;this.audio.setBlocked(false)},adBreakDone:done})}catch{done()}
    })}finally{this.pending=false}
  }
}
window.SynchronyWebAds=SynchronyWebAds;
