"use strict";

const entries = window.MEMORIES;
const last = entries.length + 1;
const $ = id => document.getElementById(id);
const icon = (name, cls='') => '<svg aria-hidden="true" class="'+cls+'"><use href="#i-'+name+'"></use></svg>';
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let page = 0;
let mediaIndex = 0;
let sequence = null;
let delivery = null;
let musicEnabled = true;
let waitingForGesture = false;
let audioFailed = false;
let mood = 'warm';
let fadeFrame = 0;
let musicTicket = 0;
const tracks = {};
for (const name of ['warm','sad','reunion']) {
  const track = new Audio('assets/music/'+name+'.mp3');
  track.preload = name==='warm'?'auto':'none';
  track.loop = true;
  track.volume = 0;
  tracks[name] = track;
}
function updateMusicButton() {
  $('music').setAttribute('aria-pressed',String(musicEnabled));
  $('music').querySelector('span').textContent = audioFailed ? '重新播放音乐' : !musicEnabled ? '开启音乐' : waitingForGesture ? '点一下播放音乐' : '音乐已开';
}
function syncMusic() {
  const ticket = ++musicTicket;
  const hasVideo = [...document.querySelectorAll('video')].some(v=>!v.paused && !v.ended);
  const target = musicEnabled && !document.hidden && !hasVideo ? tracks[mood] : null;
  cancelAnimationFrame(fadeFrame);
  const from = Object.values(tracks).map(a=>a.volume);
  if (target && target.paused) {
    target.play().then(()=>{
      if(!musicEnabled || tracks[mood]!==target || target.paused) return;
      waitingForGesture=false; audioFailed=false; updateMusicButton();
    }).catch(error=>{
      if (ticket !== musicTicket || error.name==='AbortError') return;
      waitingForGesture=error.name==='NotAllowedError';
      audioFailed=!waitingForGesture;
      updateMusicButton();
    });
  }
  const start = performance.now();
  function fade(now) {
    const t = Math.min(1,(now-start)/(target ? 1250 : 350));
    Object.values(tracks).forEach((a,i)=>{
      const gain = a===target ? .55 : 0;
      a.volume = Math.max(0,Math.min(1,from[i]+(gain-from[i])*t));
      if (t===1 && !gain) a.pause();
    });
    if (t<1) fadeFrame = requestAnimationFrame(fade);
  }
  fadeFrame = requestAnimationFrame(fade);
}
$('music').onclick = ()=>{
  musicEnabled = waitingForGesture || audioFailed || !musicEnabled;
  audioFailed=false;
  waitingForGesture=false;
  updateMusicButton();
  syncMusic();
};
document.addEventListener('click',event=>{
  if(musicEnabled && waitingForGesture && !$('music').contains(event.target)) syncMusic();
}, true);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden) {
    cancelAnimationFrame(fadeFrame);
    ++musicTicket;
    for(const a of Object.values(tracks)) { a.pause(); a.volume=0; }
  } else syncMusic();
});
const stamp = '<div class="postmark" aria-hidden="true"><svg viewBox="0 0 218 100" fill="none" stroke="currentColor"><g opacity=".84"><circle cx="54" cy="50" r="44" stroke-width="1.7"/><circle cx="54" cy="50" r="39" stroke-width=".8"/><path d="M22 33h64M23 64h63" stroke-width=".8"/><g fill="currentColor" stroke="none" text-anchor="middle" font-family="Georgia,serif"><text x="54" y="28" font-size="9" letter-spacing="2">NOV 07</text><text x="54" y="58" font-size="28" font-style="italic">600</text><text x="54" y="79" font-size="10" letter-spacing="2">2026</text></g><g stroke-width="1.15"><path d="M91 34c19-10 28 9 49 0s28 8 48 0M96 43c19-10 28 9 49 0s28 8 48 0M98 52c19-10 28 9 49 0s28 8 48 0M96 61c19-10 28 9 49 0s28 8 48 0M92 70c19-10 28 9 49 0s28 8 48 0"/></g></g></svg></div>';
function cover() {
  return '<section class="cover screen"><div class="cover-text"><p class="dedication">写给龚煦</p><div class="big-day"><strong>600</strong><span>天</span><svg class="cover-ink" aria-hidden="true" viewBox="0 0 65 57"><path d="M21 46C12 34 2 22 7 13c4-8 15-6 20 9C39-3 61 0 57 17 55 27 41 39 20 50" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" pathLength="100"/></svg></div><h1>我们的回忆册</h1><div class="date-range"><span>2025.03.17</span><i></i><span>2026.11.07</span></div><p class="cover-note">2025年3月17日我们在一起了</p><button class="primary" id="begin">翻开回忆册 '+icon('arrow')+'</button></div><div class="board"><figure class="print rear"><img src="assets/media/p019.jpg" alt="你从西藏寄来的明信片"><figcaption>2025 · 07 · 14</figcaption></figure><figure class="print front"><img src="assets/media/p056.jpg" alt="我们在 PhotoWith 靠在一起的合照"><figcaption>2025 · 10 · 01</figcaption></figure>'+stamp+'</div></section>';
}
function changeBackdrop(entry) {
  const reel=$('reel');
  document.body.classList.toggle('cinema',Boolean(entry?.backdrop));
  const previous=reel.lastElementChild;
  if(entry?.backdrop) {
    const shot=document.createElement('div');
    shot.className='reel-shot';
    const field=document.createElement('div');
    field.style.backgroundImage="url('"+entry.backdrop+"')";
    shot.append(field);
    reel.append(shot);
  }
  if(previous) window.setTimeout(()=>previous.remove(),1100);
}
function chapter(entry) {
  const year=entry.date.slice(0,5), day=entry.date.slice(5);
  const date='<h1 class="scene-date"><small>'+esc(year)+'</small><b>'+esc(day)+'</b></h1>';
  if (!entry.media.length) {
    const clauses=entry.subtitle.match(/[^，。！？]+[，。！？]*|[，。！？]+/g)||[entry.subtitle];
    return '<article class="interlude screen"><div class="writing-paper">'+date+'<div class="silent-lines">'+
      clauses.map((line,i)=>'<span style="--beat:'+i+'">'+esc(line)+'</span>').join('')+
      '</div><div class="ink-rule"></div></div></article>';
  }
  return '<article class="moving-page screen">'+date+'<div id="sequence"></div></article>';
}
const messageParagraphs = [
  "龚煦，翻到第六百天，我想起的居然是你返校时给我带的麻薯，还有那首我到现在都舍不得删的《虫儿飞》。你可能只是唱了一次，我却听了好多次。",
  "以后换我也多记一点：记得你爱吃什么，记得好好听你说话，也记得在下雨的日子牵紧你的手。这本回忆册我还想一直写下去。等我们老了，再一起翻回来，看看那时候的我们有多喜欢对方。",
  "第六百天快乐，宝宝。明天这一页，也想和你一起过。"
];
function letter() {
  return '<article id="delivery" class="screen"></article>';
}
function footer() {
  if (!page) return '<div class="cover-foot"><span class="imprint">周玉焜 <b>×</b> 龚煦</span><span class="folio">2025 — 2026</span></div>';
  return '<nav class="pager" aria-label="翻页"><button id="prev">'+icon('arrow','flip')+(page===1?'回到封面':'上一页')+'</button><button id="next">'+(page===last?'回到封面':page===last-1?'读这封信':'下一页')+icon('arrow')+'</button></nav>';
}
function stopVideos(container) {
  for (const v of container.querySelectorAll('video')) v.pause();
}
function renderViewer() {
  const entry = entries[page-1];
  const items=entry.media, m = items[mediaIndex];
  $('view-title').textContent=entry.date;
  stopVideos($('view-media'));
  $('view-media').innerHTML=m.type==='video'?'<video src="'+m.src+'" poster="'+m.poster+'" playsinline controls></video>':'<img src="'+m.src+'" alt="'+esc(entry.date)+'的照片">';
  $('prev-media').disabled=mediaIndex===0;
  $('next-media').disabled=mediaIndex===items.length-1;
}
function openViewer(index) {
  sequence?.pause();
  mediaIndex=index;
  renderViewer();
  $('viewer').showModal();
}
function moveMedia(delta) {
  const next=mediaIndex+delta;
  if (next<0||next>=entries[page-1].media.length) return;
  mediaIndex=next;
  renderViewer();
}
$('prev-media').onclick=()=>moveMedia(-1);
$('next-media').onclick=()=>moveMedia(1);
$('viewer').addEventListener('close',()=>{
  stopVideos($('view-media'));
  $('view-media').replaceChildren();
  if (sequence && sequence.index!==mediaIndex) sequence.select(mediaIndex);
  sequence?.resume();
  syncMusic();
});
function go(nextPage, focus=true) {
  if(nextPage<0||nextPage>last) return;
  delivery?.destroy();
  delivery=null;
  stopVideos($('page'));
  sequence?.destroy();
  sequence=null;
  document.body.classList.toggle('backwards',nextPage<page);
  page=nextPage;
  mediaIndex=0;
  const entry=page>0 && page<last?entries[page-1]:null;
  mood=entry?entry.mood:page===last?'reunion':'warm';
  changeBackdrop(entry);
  document.body.classList.toggle('sad',mood==='sad');
  document.body.classList.toggle('reunion',mood==='reunion');
  $('page').innerHTML=page===0?cover():page===last?letter():chapter(entry);
  $('foot').innerHTML=footer();
  if(page===0) $('begin').onclick=()=>go(1);
  else {
    $('prev').onclick=()=>go(page-1);
    $('next').onclick=()=>go(page===last?0:page+1);
    if(page===last) delivery=mountLetter($('delivery'),{paragraphs:messageParagraphs,signature:'from周玉焜'});
    if(entry && entry.media.length) sequence=mountSequence($('sequence'),entry,{openPhoto:openViewer});
  }
  document.title=(entry?entry.date:page===last?'写在第六百天':'给龚煦的第 600 天')+' · 我们的回忆册';
  if (focus) { window.scrollTo(0,0); $('page').focus({preventScroll:true}); }
  syncMusic();
}
$('home').onclick=()=>go(0);
$('contents').onclick=()=>{
  const tocItems = [{date:'封面',subtitle:'我们的回忆册'},...entries,{date:'尾声',subtitle:'写在第六百天'}];
  $('toc-list').innerHTML=tocItems.map((item,i)=>'<button data-page="'+i+'" aria-current="'+(i===page)+'"><small>'+esc(item.date)+'</small><span>'+esc(item.subtitle)+'</span></button>').join('');
  sequence?.pause();
  $('toc').showModal();
  $('toc-list').querySelector('[aria-current=true]')?.scrollIntoView({block:'nearest'});
};
$('toc').addEventListener('close',()=>sequence?.resume());
$('toc-list').onclick=e=>{
  const b=e.target.closest('button');
  if(b){ $('toc').close(); go(Number(b.dataset.page)); }
};
for (const d of document.querySelectorAll('dialog')) {
  d.querySelector('[data-close]').onclick=()=>d.close();
  d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
}
for(const evt of ['play','pause','ended']) document.addEventListener(evt,e=>{ if(e.target.tagName==='VIDEO') syncMusic(); },true);
document.addEventListener('keydown',e=>{
  if (e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.target.tagName==='VIDEO'||$('toc').open) return;
  if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
  const dir=e.key==='ArrowLeft'?-1:1;
  e.preventDefault();
  if($('viewer').open) moveMedia(dir); else go(page+dir);
});
updateMusicButton();
go(0,false);
