(() => {
  'use strict';
  // A slot describes the centre and maximum footprint of one intact print.
  // The order also defines the order in which the prints are placed on the page.
  const wide = {
    1:[[43,50,78,88,-2]],
    2:[[29,55,49,80,-5],[70,44,52,82,4]],
    3:[[19,56,35,76,-5],[49,43,41,85,2],[80,60,37,65,-3]],
    4:[[25,45,47,77,-4],[57,24,35,50,4],[78,61,42,67,-3],[43,75,34,47,3]],
    5:[[17,43,36,74,-4],[47,25,33,48,3],[78,34,38,61,-3],[39,73,36,51,3],[71,76,34,47,-4]],
    6:[[16,39,33,72,-4],[44,26,34,50,3],[76,32,38,58,-3],[23,79,32,39,3],[51,75,32,50,-3],[82,77,35,44,3]],
    7:[[15,31,30,58,-4],[42,23,31,45,2],[65,28,29,53,-3],[86,47,26,69,4],[18,76,32,46,2],[46,75,31,50,-3],[70,78,29,42,3]],
    8:[[15,29,31,55,-4],[41,25,28,47,3],[65,32,29,56,-3],[87,31,26,52,4],[14,78,29,45,2],[38,75,29,51,-3],[62,78,30,44,3],[86,76,27,47,-3]]
  };
  const narrow = {
    1:[[50,50,88,92,-2]],
    2:[[35,30,62,57,-5],[65,69,66,57,4]],
    3:[[28,33,52,56,-4],[72,37,54,64,3],[48,77,72,48,-3]],
    4:[[28,29,55,53,-4],[75,24,51,45,4],[27,73,49,51,3],[70,73,59,52,-3]],
    5:[[29,20,54,40,-4],[75,26,48,44,4],[27,55,55,43,3],[73,63,54,45,-4],[32,86,56,30,2]],
    6:[[27,18,54,36,-4],[75,19,49,36,3],[29,51,53,38,3],[74,52,51,40,-4],[28,84,53,31,-3],[73,84,54,34,3]],
    7:[[28,14,53,29,-4],[74,19,49,34,4],[28,42,53,31,3],[74,47,52,32,-3],[26,70,50,31,-4],[72,77,54,33,3],[32,90,58,21,2]],
    8:[[28,14,53,28,-4],[74,15,49,29,4],[28,39,53,29,3],[74,40,50,29,-3],[27,65,51,29,-4],[72,66,53,29,4],[28,89,54,24,2],[73,89,52,25,-3]]
  };

  const make = (tag, className) => {
    const element = document.createElement(tag);
    element.className = className;
    return element;
  };
  function setSlot(element, value, suffix) {
    ['x','y','w','h','turn'].forEach((key, i) => {
      element.style.setProperty('--'+key+suffix, value[i]+(i === 4 ? 'deg' : '%'));
    });
    // Use the stage's block dimension even when calculating the print's width.
    element.style.setProperty('--cap'+suffix, value[3]+'cqh');
  }
  function visualPlayer(item, entry, signal) {
    const holder = make('div','sc-clip-wrap');
    const clip = make('video','sc-photo');
    clip.src = item.src;
    if (item.poster) clip.poster = item.poster;
    clip.playsInline = true;
    clip.preload = 'metadata';
    clip.setAttribute('aria-label', entry.subtitle || entry.date);
    const play = make('button','sc-play');
    play.type = 'button';
    const update = () => {
      const label = clip.ended ? '重新播放' : clip.paused ? '播放影像' : '暂停影像';
      play.textContent = (clip.paused ? '▷　' : 'Ⅱ　') + label;
      play.setAttribute('aria-label', label);
    };
    play.addEventListener('click', () => {
      if (!clip.paused) return clip.pause();
      if (clip.ended) clip.currentTime = 0;
      clip.play().catch(update);
    }, {signal});
    for (const name of ['play','pause','ended']) clip.addEventListener(name, update, {signal});
    update();
    holder.append(clip, play);
    return holder;
  }

  window.mountSequence = function mountSequence(container, entry, {openPhoto} = {}) {
    const items = entry.media;
    const count = items.length;
    const controller = new AbortController();
    const signal = controller.signal;
    const root = make('section', 'sc-album');
    root.dataset.count = count;
    root.dataset.mood = entry.mood;
    root.dataset.stock = String((parseInt(entry.media[0]?.src.match(/\d+/)?.[0] || '0',10) + count) % 3);
    root.setAttribute('aria-label', '这一天的影像');
    const spread = make('div', 'sc-spread');
    const subtitle = make('p', 'sc-subtitle');
    const words = entry.subtitle || '';
    const clauses = words.match(/[^，。！？；、,!?]+[，。！？；、,!?]*|[，。！？；、,!?]+/gu) || (words ? [words] : []);
    let cursor = 0, elapsed = 0, start = 0, timer = 0;
    let externalPause = false, dead = false, selected = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cues = [];
    items.forEach((item, i) => {
      const print = make('figure','sc-print');
      setSlot(print, wide[count][i], '');
      setSlot(print, narrow[count][i], 'm');
      print.style.setProperty('--ratio', String(item.width / item.height));
      print.style.setProperty('--layer',String(i + 1));
      print.dataset.pin = ['tape','corners','clip','tape','plain'][i % 5];
      print.setAttribute('aria-hidden','true');
      print.inert = true;
      const mount = make('div','sc-mat');
      const content = item.type === 'video' ? visualPlayer(item, entry, signal) : make('button','sc-opener');
      if (item.type !== 'video') {
        content.type = 'button';
        content.setAttribute('aria-label','放大照片');
        const image = make('img','sc-photo');
        image.src = item.src;
        image.alt = item.line || entry.subtitle || entry.date;
        image.decoding = 'async';
        content.append(image);
        content.addEventListener('click', () => {
          selected = i;
          openPhoto?.(i);
        }, {signal});
      }
      mount.append(content);
      print.append(mount);
      spread.append(print);
      cues.push({at:i*394, show:() => {
        print.classList.add('sc-placed');
        print.inert = false;
        print.removeAttribute('aria-hidden');
      }});
    });
    subtitle.setAttribute('aria-label', words);
    let writingTime = 520;
    for (const clause of clauses) {
      const span = make('span','sc-words');
      span.setAttribute('aria-hidden', 'true');
      // Keep Latin words and closing punctuation together during the ink reveal.
      const beats = clause.match(/(?:[A-Za-z0-9]+|[^A-Za-z0-9])[，。！？；、,!?]*/gu) || [clause];
      beats.forEach((text, i) => {
        const unit = make('span','sc-ink-unit');
        unit.textContent = text;
        unit.style.setProperty('--ink-delay', Math.round(i / Math.max(1, beats.length - 1) * 490)+'ms');
        span.append(unit);
      });
      subtitle.append(span);
      cues.push({at:writingTime, show:() => span.classList.add('sc-written')});
      writingTime += Math.min(1250, Math.max(380, Array.from(clause).length * 80));
    }
    cues.sort((a,b) => a.at - b.at);
    root.append(spread,subtitle);
    container.replaceChildren(root);
    function stop() {
      if (!timer) return;
      elapsed += performance.now() - start;
      clearTimeout(timer);
      timer = 0;
    }
    function run() {
      stop();
      if (dead || externalPause || document.hidden) return;
      if (reduce.matches) elapsed = Infinity;
      while (cursor < cues.length && cues[cursor].at <= elapsed + 1) {
        cues[cursor++].show();
      }
      if (cursor >= cues.length) return;
      start = performance.now();
      timer = setTimeout(run, Math.max(0, cues[cursor].at - elapsed));
    }
    const pauseVideo = () => spread.querySelectorAll('video').forEach(v => v.pause());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseVideo();
      run();
    }, {signal});
    reduce.addEventListener('change', run, {signal});
    // The first image is already available on a hidden/offscreen document.
    if (cues.length && cues[0].at === 0) cues[cursor++].show();
    run();
    return {
      get index() { return selected; },
      select(i) {
        if (Number.isInteger(i) && i >= 0 && i < count) selected = i;
      },
      pause() { externalPause = true; stop(); root.classList.add('sc-paused'); pauseVideo(); },
      resume() { externalPause = false; root.classList.remove('sc-paused'); run(); },
      destroy() { dead = true; stop(); controller.abort(); pauseVideo(); root.remove(); }
    };
  };
})();
