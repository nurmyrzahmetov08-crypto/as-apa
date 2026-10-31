/* ===== Асқа шақыру — скрипт ===== */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var EVENT_UTC = Date.UTC(2026, 10, 14, 7, 0, 0);      // 14 қараша 2026, 12:00 (Алматы, UTC+5)
  var EVENT_END_UTC = Date.UTC(2026, 10, 14, 10, 0, 0); // шамамен 15:00
  var TITLE = 'Хамзақызы Құлжанның жылдық асы';
  var PLACE = 'Лермонтова 18, Ayaulym hall';
  var STORE_KEY = 'as-kulzhan-rsvp';
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $ = function (id) { return document.getElementById(id); };
  var store = {
    get: function () { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; } },
    set: function (v) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch (e) {} },
    clear: function () { try { localStorage.removeItem(STORE_KEY); } catch (e) {} }
  };

  /* ---------- 1. Жеке шақыру: ?g=Айгүл апа ---------- */
  var params = new URLSearchParams(location.search);
  var guest = (params.get('g') || params.get('name') || '').trim().slice(0, 60);
  if (guest) {
    $('guestName').textContent = guest;
    var fn = $('fullname');
    if (fn && !fn.value) fn.value = guest;
  }

  /* ---------- 2. Музыка ---------- */
  var audio = $('bgm');
  var musicBtn = $('musicBtn');
  var TARGET_VOL = 0.55;
  var fadeTimer = null;
  var userPaused = false;

  function fadeTo(vol, ms, done) {
    clearInterval(fadeTimer);
    var start = audio.volume, steps = Math.max(1, Math.round(ms / 50)), i = 0;
    fadeTimer = setInterval(function () {
      i++;
      audio.volume = Math.min(1, Math.max(0, start + (vol - start) * (i / steps)));
      if (i >= steps) { clearInterval(fadeTimer); if (done) done(); }
    }, 50);
  }
  function playMusic() {
    audio.volume = 0;
    var p = audio.play();
    var ok = function () { musicBtn.classList.add('on'); fadeTo(TARGET_VOL, 3500); };
    if (p && p.then) p.then(ok).catch(function () { musicBtn.classList.remove('on'); });
    else ok();
  }
  function pauseMusic() {
    musicBtn.classList.remove('on');
    fadeTo(0, 600, function () { audio.pause(); });
  }
  musicBtn.addEventListener('click', function () {
    if (audio.paused || !musicBtn.classList.contains('on')) { userPaused = false; playMusic(); }
    else { userPaused = true; pauseMusic(); }
  });
  // Телефонда басқа қосымшаға өткенде әуенді тоқтату
  document.addEventListener('visibilitychange', function () {
    if (!musicBtn.classList.contains('on') && !audio.paused) return;
    if (document.hidden) { if (!audio.paused) audio.pause(); }
    else if (!userPaused && musicBtn.classList.contains('on')) { audio.play().catch(function () {}); }
  });

  /* ---------- 3. Шақыруды ашу ---------- */
  var intro = $('intro');
  function openInvite() {
    playMusic();
    intro.classList.add('opening');
    musicBtn.hidden = false;
    setTimeout(function () {
      document.body.classList.remove('locked');
      document.body.classList.remove('pre');
    }, reduceMotion ? 0 : 900);
    setTimeout(function () { intro.classList.add('gone'); startDust(); }, reduceMotion ? 0 : 1700);
  }
  $('openBtn').addEventListener('click', openInvite);

  /* ---------- 4. Алтын тозаң (hero) ---------- */
  function startDust() {
    var cv = $('dust');
    if (!cv || reduceMotion || !cv.getContext) return;
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    var parts = [], running = true, raf;
    function size() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function make(initial) {
      return {
        x: Math.random() * W, y: initial ? Math.random() * H : H + 10,
        r: 0.6 + Math.random() * 1.8, vy: 0.12 + Math.random() * 0.35, vx: (Math.random() - 0.5) * 0.15,
        a: Math.random() * Math.PI * 2, tw: 0.01 + Math.random() * 0.03
      };
    }
    size();
    var N = Math.round(Math.min(60, W * H / 9000));
    for (var i = 0; i < N; i++) parts.push(make(true));
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= p.vy; p.x += p.vx + Math.sin(p.a) * 0.12; p.a += p.tw;
        if (p.y < -10) parts[i] = p = make(false);
        var alpha = 0.35 + 0.45 * Math.abs(Math.sin(p.a));
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, 'rgba(232,201,140,' + alpha + ')');
        g.addColorStop(1, 'rgba(232,201,140,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var vis = es[0].isIntersecting;
        if (vis && !running) { running = true; frame(); }
        if (!vis) { running = false; cancelAnimationFrame(raf); }
      }).observe(cv);
    }
    frame();
  }

  /* ---------- 5. Айналдырғанда пайда болу ---------- */
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 6. Кері санақ ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var d = EVENT_UTC - Date.now();
    if (d <= 0) { $('countWrap').hidden = true; return; }
    var s = Math.floor(d / 1000);
    $('cd').textContent = Math.floor(s / 86400);
    $('ch').textContent = pad(Math.floor(s % 86400 / 3600));
    $('cm').textContent = pad(Math.floor(s % 3600 / 60));
    $('cs').textContent = pad(s % 60);
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();

  /* ---------- 7. Күнтізбеге қосу ---------- */
  function icsDate(t) { return new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  $('gcalLink').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent(TITLE) +
    '&dates=' + icsDate(EVENT_UTC) + '/' + icsDate(EVENT_END_UTC) +
    '&location=' + encodeURIComponent(PLACE) +
    '&details=' + encodeURIComponent('Аяулы анамыз Хамзақызы Құлжанның жылдық асы. ' + location.href.split('?')[0]);
  $('icsBtn').addEventListener('click', function () {
    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//as-apa//kk', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:as-kulzhan-20261114@as-apa',
      'DTSTAMP:' + icsDate(Date.now()),
      'DTSTART:' + icsDate(EVENT_UTC),
      'DTEND:' + icsDate(EVENT_END_UTC),
      'SUMMARY:' + TITLE,
      'LOCATION:' + PLACE.replace(/,/g, '\\,'),
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Ертең ас', 'END:VALARM',
      'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:2 сағаттан кейін ас', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'as-14-qarasha.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  });

  /* ---------- 8. Анкета ---------- */
  var form = $('rsvp'), err = $('err'), block = $('guestsBlock'), guests = $('guests'),
      out = $('countOut'), btn = $('submit'), n = 1;

  function setN(v) { n = Math.max(1, Math.min(20, v)); guests.value = n; out.textContent = n; }
  $('minus').addEventListener('click', function () { setN(n - 1); });
  $('plus').addEventListener('click', function () { setN(n + 1); });

  function isYes() { var r = form.querySelector('input[name=attend]:checked'); return r && r.value === 'Келемін'; }
  form.querySelectorAll('input[name=attend]').forEach(function (r) {
    r.addEventListener('change', function () { block.hidden = !isYes(); guests.value = isYes() ? n : 0; });
  });

  function showDone(name, yes, count) {
    form.hidden = true; $('done').hidden = false;
    $('doneTitle').textContent = 'Рақмет, ' + name + '!';
    $('doneText').textContent = yes
      ? (count > 1 ? count + ' адамды ' : '') + '14 қараша, сағат 12:00-де Ayaulym hall-да күтеміз.'
      : 'Хабарлағаныңызға рақмет. Анамызды дұғаңызда еске алыңыз.';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault(); err.textContent = '';
    var name = $('fullname').value.trim();
    if (name.length < 2) { err.textContent = 'Аты-жөніңізді жазыңыз.'; $('fullname').focus(); return; }
    var checked = form.querySelector('input[name=attend]:checked');
    if (!checked) { err.textContent = '«Келемін» немесе «Келе алмаймын» таңдаңыз.'; return; }
    var yes = checked.value === 'Келемін';
    guests.value = yes ? n : 0;

    btn.disabled = true; btn.textContent = 'Жіберілуде…';
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      store.set({ name: name, yes: yes, count: yes ? n : 0 });
      showDone(name, yes, yes ? n : 0);
      $('card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(function () {
      err.textContent = 'Жіберу мүмкін болмады. Интернетті тексеріп, қайта көріңіз.';
    }).then(function () {
      btn.disabled = false; btn.textContent = 'Жауапты жіберу';
    });
  });

  $('again').addEventListener('click', function () {
    store.clear();
    form.reset(); setN(1); block.hidden = true;
    if (guest) $('fullname').value = guest;
    form.hidden = false; $('done').hidden = true;
  });

  // Бұрын жауап берген болса — соны көрсету
  var prev = store.get();
  if (prev && prev.name) showDone(prev.name, prev.yes, prev.count);
})();
