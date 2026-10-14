'use strict';
// Sin refrescos automáticos ni espacios publicitarios sobre las cartas.
// El consentimiento lo gestiona la CMP certificada configurada para el sitio.
document.addEventListener('DOMContentLoaded', () => {
  const c=window.SYNCHRONY_SIDE_ADS||{};
  const desktop=matchMedia('(min-width:1440px) and (pointer:fine)');
  if(!c.enabled||!/^ca-pub-\d{16}$/.test(c.publisher)||!/^\d+$/.test(c.leftSlot)||!/^\d+$/.test(c.rightSlot))return;
  const h5=window.SYNCHRONY_WEB_ADS||{};
  if(h5.enabled&&h5.publisher!==c.publisher){console.warn('Los anuncios laterales y H5 deben usar el mismo publisher.');return}
  let loaded=false;
  function sync(){
    document.body.classList.toggle('has-side-ads',desktop.matches);
    for(const side of ['left','right'])document.getElementById('ad-'+side).hidden=!desktop.matches;
    if(!desktop.matches||loaded)return;
    loaded=true;
    window.adsbygoogle=window.adsbygoogle||[];
    if(!document.querySelector('script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')){
      const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';
      script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(c.publisher);
      document.head.append(script);
    }
    for(const side of ['left','right']){
      const ad=document.createElement('ins');ad.className='adsbygoogle';ad.style.cssText='display:inline-block;width:160px;height:600px';
      ad.dataset.adClient=c.publisher;ad.dataset.adSlot=c[side+'Slot'];if(c.testMode)ad.dataset.adtest='on';
      document.getElementById('ad-'+side).append(ad);
      try{window.adsbygoogle.push({})}catch(error){console.warn('Anuncio lateral no disponible',error)}
    }
  }
  desktop.addEventListener('change',sync);sync();
});
