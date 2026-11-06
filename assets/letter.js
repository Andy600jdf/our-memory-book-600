/* The beak and the envelope share one moving anchor until the delivery. */
(()=>{
  'use strict';
  let serial = 0;
  const clamp = n=>Math.min(1,Math.max(0,n));
  const lerp = (a,b,t)=>a+(b-a)*t;
  const smooth = p=>{const t=clamp(p);return t*t*(3-2*t);};
  const portion = (t,a,b)=>clamp((t-a)/(b-a));
  function curve(p,a,b,c,d) {
    const u=1-p;
    return a*u*u*u+3*b*u*u*p+3*c*u*p*p+d*p*p*p;
  }
  function envelope(id) {
    return `<div class="lf-envelope" aria-hidden="true">
      <svg class="lf-cord" viewBox="0 0 100 42" preserveAspectRatio="none"><path d="M21 40Q39 20 50 1Q61 20 79 40" fill="none" stroke="#805c46" stroke-width="2"/></svg>
      <div class="lf-wallet"></div>
      <svg class="lf-front" viewBox="0 0 480 272" preserveAspectRatio="none">
        <defs><linearGradient id="${id}pocket" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f7ecd2"/><stop offset=".55" stop-color="#f3e6c9"/><stop offset="1" stop-color="#d9c7a6"/></linearGradient></defs>
        <path d="M1 1L240 155L479 1V271H1Z" fill="url(#${id}pocket)" stroke="#b9a584" stroke-width="1.3"/>
        <path d="M1 271L181 119Q214 145 240 153Q269 143 297 119L479 271" fill="#f1e4c9" stroke="#c4b08c" stroke-width="1.3"/>
        <path d="M12 260L169 128M311 129L468 260M12 264H468" fill="none" stroke="#dfcdae" stroke-width="1"/>
      </svg>
      <div class="lf-flap"><svg viewBox="0 0 480 165" preserveAspectRatio="none"><path d="M1 1H479L262 152Q240 168 218 152Z" fill="#efe2c6" stroke="#b9a483" stroke-width="1.5"/><path d="M17 6L224 146Q240 157 256 146L463 6" fill="none" stroke="#d3c09e" stroke-width="1"/></svg></div>
      <svg class="lf-seal" viewBox="0 0 80 80">
        <defs><radialGradient id="${id}wax" cx="37%" cy="27%" r="78%"><stop stop-color="#b86e55"/><stop offset=".47" stop-color="#a05742"/><stop offset="1" stop-color="#733a2e"/></radialGradient></defs>
        <path d="M42 4q11-2 17 6 10 0 12 13 9 6 5 18 4 9-6 18-1 11-14 13-8 8-19 4-10 4-20-4-13-2-13-13-6-8-2-18-4-12 5-20 2-11 14-12Q32 1 42 4z" fill="url(#${id}wax)" stroke="#884d39" stroke-width="2"/>
        <circle cx="40" cy="40" r="27" fill="none" stroke="#ca866b" stroke-width="1.6"/>
        <text x="40" y="48" text-anchor="middle" fill="#e5af86" font-family="Georgia,serif" font-size="22" font-style="italic">600</text>
      </svg>
    </div>`;
  }

  window.mountLetter = function mountLetter(container,{paragraphs,signature}) {
    const uid='lf'+ (++serial);
    const section=document.createElement('article');
    section.className='lf-finale';
    section.innerHTML=`<div class="lf-table">
      <div class="lf-atmosphere" aria-hidden="true"></div>
      <div class="lf-dove" aria-hidden="true"><img src="assets/letter-dove.png" alt="" width="1536" height="1024" decoding="sync"></div>
      ${envelope(uid)}
      <div class="lf-paper" aria-label="给龚煦的信">
        <div class="lf-papertop"><time datetime="2026-11-07">2026.11.07</time><span aria-hidden="true">❧</span></div>
        <div class="lf-lines"></div><div class="lf-sign"></div>
      </div>
    </div>
    <div class="lf-actions"><button type="button"></button></div>`;
    container.replaceChildren(section);
    const within=sel=>section.querySelector(sel);
    const table=within('.lf-table'), bird=within('.lf-dove'), packet=within('.lf-envelope');
    const flap=within('.lf-flap'), seal=within('.lf-seal'), cord=within('.lf-cord');
    const paper=within('.lf-paper'), action=within('.lf-actions button');
    for(const line of paragraphs) {
      const p=document.createElement('p'); p.textContent=line; within('.lf-lines').append(p);
    }
    within('.lf-sign').textContent=signature;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    let mode='travel', frame=0, started=performance.now(), active=true, elapsed=0;
    let size;
    function measure(){
      size={w:table.clientWidth,h:table.clientHeight,ew:packet.offsetWidth,eh:packet.offsetHeight,
        ph:paper.offsetHeight};
    }
    function draw(t) {
      const {w,h,ew,eh,ph}=size;
      const perchX=w*(w<600?.68:.57), perchY=Math.min(h*.48,240);
      const fly=portion(t,.05,3.95);
      const exit=portion(t,3.95,5.9);
      const glide=1-Math.pow(1-fly,1.4);
      let x=curve(glide,-w*.13,w*.23,w*.42,perchX);
      let y=curve(glide,h*.38,h*.21,perchY-32,perchY)+4*Math.sin(fly*4*Math.PI)*Math.sin(fly*Math.PI);
      let angle=lerp(-4,3,fly)+.9*Math.sin(fly*3*Math.PI);
      if(exit>0){
        x=curve(exit,perchX,w*.67,w*.97,w+260);
        y=curve(exit,perchY,perchY-15,-40,-90);
        angle=lerp(3,-9,smooth(exit));
      }
      bird.style.transform=`translate(${x}px,${y}px) rotate(${angle}deg) translate(-94%,-55.5%)`;
      bird.style.opacity=String(t>5.94?0:1);
      const landing=smooth(portion(t,3.95,4.95));
      const grow=smooth(portion(t,4.95,6.8));
      const opening=smooth(portion(t,6.9,8.4));
      const lifting=smooth(portion(t,7.95,10.3));
      const small=Math.min(.21,(w<600?45:62)/ew);
      const envelopeScale=lerp(small,1,grow);
      const slide=smooth(portion(t,8.4,10.3));
      const envX=t<3.95?x:lerp(perchX,w*.5,grow);
      const smallY=perchY+22;
      const envY=t<3.95?y:lerp(lerp(perchY,smallY,landing),h*.5-eh*.5,grow)+slide*eh*.8;
      const tilt=(t<3.95?Math.sin(fly*11)*8:(1-landing)*Math.sin(11)*8);
      packet.style.transform=`translate(${envX-ew/2}px,${envY}px) rotate(${tilt}deg) scale(${envelopeScale})`;
      packet.style.opacity=String((1-smooth(portion(t,9,10.3)))*smooth(portion(t,0,.15)));
      cord.style.opacity=String(1-landing);
      flap.style.transform=`rotateX(${158*opening}deg)`;
      seal.style.opacity=String(1-smooth(portion(t,6.8,7.5)));
      seal.style.transform=`translate(-50%,-50%) rotate(${-6-12*opening}deg) scale(${1+.12*opening})`;
      paper.style.opacity=String(lifting>0?1:0);
      // Cut along the envelope's mouth while the sheet slips out.
      paper.style.clipPath=`inset(0 0 ${(1-lifting)*100}% 0)`;
      paper.style.transform=`translateY(${(1-lifting)*Math.max(40,(ph-eh)*.5+43)}px) scale(${lerp(.85,1,lifting)})`;
    }
    function showPaper(focus=false) {
      cancelAnimationFrame(frame); mode='reading'; section.dataset.mode=mode;
      draw(11); paper.removeAttribute('aria-hidden');
      action.textContent='收好这封信';
      if(focus) action.focus({preventScroll:true});
    }
    function storeLetter(){
      mode='storing'; section.dataset.mode=mode; paper.setAttribute('aria-hidden','true');
      action.disabled=true;
      const start=performance.now();
      function store(now) {
        if(!active)return;
        const p=reduce.matches?1:smooth((now-start)/1100);
        paper.style.opacity=String(1-p);
        paper.style.transform=`perspective(800px) translateY(${p*40}px) rotateX(${-10*p}deg) scale(${1-p*.055})`;
        const {w,h,ew,eh}=size;
        packet.style.opacity=String(p);
        packet.style.transform=`translate(${w*.5-ew*.5}px,${h/2-eh*.5+28*(1-p)}px) scale(${.84+.06*p})`;
        flap.style.transform=`rotateX(${(1-p)*115}deg)`; seal.style.opacity=String(p);
        if(p<1) frame=requestAnimationFrame(store);
        else {mode='stored';section.dataset.mode=mode;action.disabled=false;action.textContent='再读一次';action.focus({preventScroll:true});}
      }
      frame=requestAnimationFrame(store);
    }
    function animate(now){
      if(!active || mode!=='travel')return;
      elapsed=Math.max(0,(now-started)/1000);
      draw(elapsed);
      if(elapsed<10.35)frame=requestAnimationFrame(animate); else showPaper();
    }
    function startTravel(){
      cancelAnimationFrame(frame); mode='travel';section.dataset.mode=mode;paper.setAttribute('aria-hidden','true');
      action.disabled=false;action.textContent='直接读信';elapsed=0;started=performance.now();
      if(reduce.matches) showPaper(); else {draw(0);frame=requestAnimationFrame(animate);}
    }
    function interact(){
      if(mode==='travel')showPaper(true);
      else if(mode==='reading')storeLetter();
      else if(mode==='stored')startTravel();
    }
    function reduced(){ if(reduce.matches&&mode==='travel')showPaper(); }
    measure();
    const observer=new ResizeObserver(()=>{
      if(!active)return;
      measure();
      if(mode==='travel')draw(elapsed);
      else if(mode==='reading')draw(11);
      else if(mode==='stored'){
        const {w,h,ew,eh}=size;
        packet.style.transform=`translate(${w*.5-ew*.5}px,${h/2-eh*.5}px) scale(.9)`;
      }
    });
    observer.observe(table); observer.observe(paper);
    action.addEventListener('click',interact);
    reduce.addEventListener('change',reduced);
    startTravel();
    return {destroy(){
      active=false;cancelAnimationFrame(frame);observer.disconnect();
      action.removeEventListener('click',interact);reduce.removeEventListener('change',reduced);
      section.remove();
    }};
  };
})();
