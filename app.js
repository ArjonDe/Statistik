/**
 * app.js
 * ---------------------------------------------------------------
 * Das „Gerüst“ jeder Seite:
 *   - lädt die Inhalte (data/*.json bzw. data/data.js)
 *   - zeichnet Kopfzeile, Navigation und Fortschrittsanzeige
 *   - Dark Mode, Toasts, Popups, Belohnungen (XP, Level, Badges)
 *   - „Willkommen zurück“-Popup und Lernzeit-Messung
 *   - das Dashboard der Startseite
 */
(function () {
  'use strict';
  const SL = (window.SL = window.SL || {});
  const Store = SL.Store;
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ===================== Daten laden ===================== */
  const FILES = ['theorie', 'aufgaben', 'klausuren', 'formeln'];

  /**
   * Auf GitHub Pages (http/https) werden die JSON-Dateien geladen.
   * Beim direkten Öffnen (file://) blockiert der Browser fetch() –
   * dann wird das identische Paket aus data/data.js benutzt.
   */
  async function loadData() {
    const bundle = window.STAT_DATA || null;
    // Flache Upload-Version (alle Dateien in einem Ordner): Paket aus data.js nutzen.
    if (bundle && !document.querySelector('script[src^="data/"]')) return bundle;
    if (location.protocol.startsWith('http')) {
      try {
        const loaded = await Promise.all(
          FILES.map((f) => fetch(`data/${f}.json`, { cache: 'no-cache' }).then((r) => {
            if (!r.ok) throw new Error(f);
            return r.json();
          }))
        );
        const data = {};
        FILES.forEach((f, i) => (data[f] = loaded[i]));
        return data;
      } catch (e) {
        if (bundle) return bundle;
        throw e;
      }
    }
    if (bundle) return bundle;
    throw new Error('Keine Lerninhalte gefunden (data/data.js fehlt).');
  }

  /* ===================== Theme ===================== */
  function applyTheme() {
    const t = Store.state.settings.theme;
    const dark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.textContent = dark ? '☀️' : '🌙';
      btn.setAttribute('aria-label', dark ? 'Hellen Modus einschalten' : 'Dunklen Modus einschalten');
    }
  }
  function toggleTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    Store.setSetting('theme', dark ? 'light' : 'dark');
    applyTheme();
  }

  /* ===================== Navigation ===================== */
  const NAV = [
    { page: 'start', href: 'index.html', icon: '🏠', label: 'Start' },
    { page: 'lernen', href: 'lernen.html', icon: '📚', label: 'Lernen' },
    { page: 'quiz', href: 'quiz.html', icon: '🎯', label: 'Üben' },
    { page: 'klausuren', href: 'klausuren.html', icon: '📝', label: 'Klausur' },
    { page: 'fortschritt', href: 'fortschritt.html', icon: '📊', label: 'Fortschritt' },
    { page: 'rechner', href: 'statistik-rechner.html', icon: '🧮', label: 'Rechner' },
  ];

  function renderShell() {
    const page = document.body.dataset.page;
    const header = document.getElementById('app-header');
    if (header) {
      header.className = 'app-header';
      header.innerHTML = `
        <div class="header-inner">
          <a class="brand" href="index.html" aria-label="Zur Startseite">
            <span class="brand-logo">σ</span><span class="brand-text">Statistik<span>leicht</span></span>
          </a>
          <nav class="topnav" aria-label="Hauptnavigation">
            ${NAV.map((n) => `<a href="${n.href}" class="${n.page === page ? 'active' : ''}" ${n.page === page ? 'aria-current="page"' : ''}>${n.icon} ${n.label}</a>`).join('')}
          </nav>
          <div class="header-tools">
            <button class="level-chip" id="progress-open" aria-label="Fortschritt anzeigen">
              <span class="ring" id="hdr-ring"></span>
              <span class="level-meta"><strong id="hdr-level"></strong><span class="xpbar"><span id="hdr-xpfill"></span></span><small id="hdr-xp"></small></span>
            </button>
            <a class="icon-btn only-mobile" href="statistik-rechner.html" aria-label="Statistik-Rechner">🧮</a>
            <button class="icon-btn" id="theme-toggle" aria-label="Dunklen Modus umschalten">🌙</button>
          </div>
        </div>`;
      document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
      document.getElementById('progress-open').addEventListener('click', openProgressDrawer);
    }
    const tabbar = document.getElementById('tabbar');
    if (tabbar) {
      tabbar.className = 'tabbar';
      tabbar.setAttribute('aria-label', 'Navigation');
      tabbar.innerHTML = NAV.filter((n) => n.page !== 'rechner')
        .map((n) => `<a href="${n.href}" class="${n.page === page ? 'active' : ''}"><span>${n.icon}</span>${n.label}</a>`)
        .join('');
    }
    updateHeader();
    applyTheme();
  }

  function updateHeader() {
    const lvl = Store.levelInfo();
    const overall = Store.overallProgress();
    const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
    set('hdr-level', (el) => (el.textContent = `${lvl.icon} Lv ${lvl.level} · ${lvl.name}`));
    set('hdr-xp', (el) => (el.textContent = lvl.next ? `${lvl.xp} / ${lvl.next.xp} XP · ${overall}% gesamt` : `${lvl.xp} XP · ${overall}% gesamt`));
    set('hdr-xpfill', (el) => (el.style.width = `${Math.round(lvl.progress * 100)}%`));
    set('hdr-ring', (el) => {
      el.style.setProperty('--p', overall);
      el.textContent = `${overall}%`;
    });
  }

  /** Seitenleiste mit allen Kapitel-Fortschritten (auf jeder Seite erreichbar). */
  function openProgressDrawer() {
    const chapters = SL.Data.theorie.chapters;
    const lvl = Store.levelInfo();
    const html = `
      <div class="drawer-stats">
        <div><strong>${Store.overallProgress()}%</strong><span>Gesamt</span></div>
        <div><strong>${lvl.xp}</strong><span>XP</span></div>
        <div><strong>${lvl.level}</strong><span>${esc(lvl.name)}</span></div>
      </div>
      <ul class="textbars">
        ${chapters.map((c) => {
          const p = Store.chapterProgress(c.id).percent;
          return `<li><a href="lernen.html#kapitel/${c.id}"><span class="tb-title">${c.icon} ${esc(c.title)}</span><span class="tb-bar" aria-hidden="true">${SL.Charts.textBar(p)}</span><span class="tb-pct">${p}%</span></a></li>`;
        }).join('')}
      </ul>
      <a class="btn btn-primary btn-block" href="fortschritt.html">📊 Alle Lernstatistiken</a>`;
    modal({ title: 'Dein Fortschritt', html, drawer: true });
  }

  /* ===================== Toasts & Popups ===================== */
  function toast(message, type = 'info', ms = 3200) {
    let wrap = document.getElementById('toasts');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toasts';
      wrap.className = 'toasts';
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = message;
    wrap.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 400);
    }, ms);
  }

  /**
   * Universelles Popup.
   * opts: {title, html, actions:[{label, cls, onClick, href}], drawer, onClose, dismissable}
   */
  function modal(opts) {
    const back = document.createElement('div');
    back.className = 'modal-back' + (opts.drawer ? ' drawer' : '');
    back.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(opts.title || 'Hinweis')}">
        <div class="modal-head">
          <h2>${esc(opts.title || '')}</h2>
          ${opts.dismissable === false ? '' : '<button class="icon-btn modal-close" aria-label="Schließen">✕</button>'}
        </div>
        <div class="modal-body">${opts.html || ''}</div>
        ${opts.actions && opts.actions.length ? `<div class="modal-actions">${opts.actions.map((a, i) => a.href
          ? `<a class="btn ${a.cls || 'btn-secondary'}" href="${a.href}" data-i="${i}">${a.label}</a>`
          : `<button class="btn ${a.cls || 'btn-secondary'}" data-i="${i}">${a.label}</button>`).join('')}</div>` : ''}
      </div>`;
    const close = () => {
      back.classList.remove('show');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => back.remove(), 250);
      if (opts.onClose) opts.onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape' && opts.dismissable !== false) close(); };
    back.addEventListener('click', (e) => {
      if (e.target === back && opts.dismissable !== false) close();
    });
    const x = back.querySelector('.modal-close');
    if (x) x.addEventListener('click', close);
    (opts.actions || []).forEach((a, i) => {
      const b = back.querySelector(`[data-i="${i}"]`);
      b.addEventListener('click', (e) => {
        if (a.onClick) {
          const keep = a.onClick(e, close);
          if (keep !== true && !a.href) close();
        } else if (!a.href) close();
      });
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(back);
    requestAnimationFrame(() => back.classList.add('show'));
    const focusable = back.querySelector('.modal-actions .btn, .modal-close');
    if (focusable) focusable.focus({ preventScroll: true });
    return { close, el: back };
  }

  /** Zeigt XP, Level-Aufstieg und neue Badges an. */
  function reward(result) {
    if (!result) return;
    if (result.xp > 0) toast(`<strong>+${result.xp} XP</strong> – stark! 💪`, 'success', 2200);
    (result.badges || []).forEach((b, i) => setTimeout(() => toast(`${b.icon} <strong>Neues Badge:</strong> ${esc(b.name)}`, 'badge', 4200), 600 + i * 700));
    if (result.levelUp) {
      const l = result.levelUp;
      setTimeout(() => {
        confetti();
        modal({
          title: 'Level-Aufstieg! 🎉',
          html: `<div class="levelup"><div class="levelup-icon">${l.icon}</div><p>Du bist jetzt <strong>Level ${l.level}: ${esc(l.name)}</strong>.</p><p>Du lernst wirklich etwas – das ist kein Zufall. Weiter so!</p></div>`,
          actions: [{ label: 'Weiter geht’s', cls: 'btn-primary' }],
        });
      }, 500);
    }
    updateHeader();
  }

  /** Kleine Konfetti-Animation ohne Bibliothek. */
  function confetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const wrap = document.createElement('div');
    wrap.className = 'confetti';
    const colors = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.4 + 's';
      p.style.animationDuration = 1.6 + Math.random() * 1.2 + 's';
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      wrap.appendChild(p);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 3200);
  }

  /* ===================== Willkommen zurück ===================== */
  function welcomeBack() {
    const page = document.body.dataset.page;
    if (!['start', 'lernen'].includes(page)) return;
    if (location.hash && page === 'lernen') return;
    let shown = false;
    try { shown = sessionStorage.getItem('sl-welcome') === '1'; sessionStorage.setItem('sl-welcome', '1'); } catch (e) { shown = false; }
    const pos = Store.state.lastPosition;
    if (shown || !pos) return;
    const where = pos.type === 'task'
      ? `<p class="where"><span>Kapitel:</span> <strong>${esc(pos.chapterTitle)}</strong><br><span>Aufgabe:</span> <strong>${pos.index + 1} von ${pos.total}</strong> (${diffLabel(pos.diff)})</p>`
      : `<p class="where"><span>Kapitel:</span> <strong>${esc(pos.chapterTitle)}</strong><br><span>Theorie</span></p>`;
    modal({
      title: 'Willkommen zurück. 👋',
      html: `<p>Schön, dass du wieder da bist! Du warst zuletzt bei:</p>${where}`,
      actions: [
        { label: '▶ Weiterlernen', cls: 'btn-primary', href: pos.url },
        { label: '📚 Kapitelübersicht', cls: 'btn-secondary', href: 'lernen.html' },
      ],
    });
  }

  const diffLabel = (d) => ({ easy: 'leicht', medium: 'mittel', hard: 'schwer' }[d] || d);

  /* ===================== Lernzeit ===================== */
  function startTimeTracking() {
    const STEP = 20;
    setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastInput < 5 * 60 * 1000) {
        Store.tickTime(STEP);
      }
    }, STEP * 1000);
  }
  let lastInput = Date.now();
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => (lastInput = Date.now()), { passive: true }));

  /* ===================== Start ===================== */
  const readyCallbacks = [];
  let isReady = false;
  function ready(fn) {
    if (isReady) fn();
    else readyCallbacks.push(fn);
  }

  async function boot() {
    applyTheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    try {
      SL.Data = await loadData();
    } catch (e) {
      const main = document.getElementById('main');
      if (main) main.innerHTML = `<div class="card warn"><h2>Inhalte konnten nicht geladen werden</h2><p>${esc(e.message)}</p></div>`;
      return;
    }
    renderShell();
    Store.onChange(updateHeader);
    isReady = true;
    readyCallbacks.forEach((fn) => fn());
    welcomeBack();
    startTimeTracking();
  }

  /* ===================== Dashboard (Startseite) ===================== */
  function renderDashboard() {
    const main = document.getElementById('main');
    const chapters = SL.Data.theorie.chapters;
    const lvl = Store.levelInfo();
    const overall = Store.overallProgress();
    const st = Store.state;
    const fc = Store.forecast();
    const sw = Store.strengthsWeaknesses();
    const rec = Store.recommendation();
    const nextChapter = chapters.find((c) => Store.chapterProgress(c.id).percent < 50) || chapters[chapters.length - 1];
    const pos = st.lastPosition;
    const isNew = st.attempts.length === 0 && !Object.values(st.chapters).some((c) => c.theorySeen);

    const verdict = !fc.hasData
      ? 'Löse ein paar Aufgaben – dann kann ich dir sagen, wie gut deine Chancen stehen.'
      : fc.passProb >= 80
        ? 'Nach aktuellem Stand würdest du die Klausur mit hoher Wahrscheinlichkeit bestehen. 🎉'
        : fc.passProb >= 50
          ? `Du bist auf einem guten Weg. Du solltest noch ${fc.improve.slice(0, 2).map((i) => i.title).join(' und ')} üben.`
          : `Noch wird es knapp – aber das ist normal am Anfang. Starte mit ${fc.improve.slice(0, 2).map((i) => i.title).join(' und ')}.`;

    main.innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <p class="eyebrow">${lvl.icon} Level ${lvl.level} · ${esc(lvl.name)}</p>
          <h1>${isNew ? 'Statistik bestehen. Schritt für Schritt.' : 'Schön, dass du da bist!'}</h1>
          <p class="lead">${isNew ? 'Keine Professorensprache, keine Panik. Wir gehen jede Aufgabe gemeinsam durch – so lange, bis es klick macht.' : verdict}</p>
          <div class="hero-actions">
            ${pos ? `<a class="btn btn-primary btn-lg" href="${pos.url}">▶ Weiterlernen</a>` : `<a class="btn btn-primary btn-lg" href="lernen.html#kapitel/${chapters[0].id}">▶ Jetzt starten</a>`}
            <a class="btn btn-secondary btn-lg" href="klausuren.html">📝 Klausur üben</a>
          </div>
        </div>
        <div class="hero-ring" style="--p:${overall}">
          <div class="ring-big"><strong>${overall}%</strong><span>Gesamtfortschritt</span></div>
        </div>
      </section>

      ${isNew ? `
      <section class="card onboarding">
        <h2>So funktioniert’s – in 3 Schritten</h2>
        <ol class="howto">
          <li><span>1</span><div><strong>Kapitel lesen</strong><p>Kurze Erklärungen mit Bildern und Mini-Spielen.</p></div></li>
          <li><span>2</span><div><strong>Aufgaben lösen</strong><p>Mit Hinweisen, „Noch einfacher erklären“ und Schritt-für-Schritt-Lösungen.</p></div></li>
          <li><span>3</span><div><strong>Klausur simulieren</strong><p>Echte Prüfungsaufgaben mit Note und Fehleranalyse.</p></div></li>
        </ol>
        <p class="muted">Dein Fortschritt wird automatisch auf diesem Gerät gespeichert.</p>
      </section>` : ''}

      <section class="grid grid-3">
        <article class="card stat-card">
          <h3>⭐ XP & Level</h3>
          <p class="big">${lvl.xp} XP</p>
          <div class="progress"><span style="width:${Math.round(lvl.progress * 100)}%"></span></div>
          <p class="muted">${lvl.next ? `Noch ${lvl.next.xp - lvl.xp} XP bis <strong>${esc(lvl.next.name)}</strong>` : 'Höchstes Level erreicht!'}</p>
        </article>
        <article class="card stat-card">
          <h3>➡️ Nächstes Kapitel</h3>
          <p class="big small-big">${nextChapter.icon} ${esc(nextChapter.title)}</p>
          <div class="progress"><span style="width:${Store.chapterProgress(nextChapter.id).percent}%"></span></div>
          <a class="btn btn-primary btn-block" href="lernen.html#kapitel/${nextChapter.id}">Kapitel öffnen</a>
        </article>
        <article class="card stat-card">
          <h3>🕒 Letzte Aufgabe</h3>
          ${pos ? `<p class="big small-big">${esc(pos.chapterTitle)}</p><p class="muted">${pos.type === 'task' ? `Aufgabe ${pos.index + 1} von ${pos.total} · ${diffLabel(pos.diff)}` : 'Theorie'}</p><a class="btn btn-secondary btn-block" href="${pos.url}">Fortsetzen</a>` : '<p class="muted">Noch keine Aufgabe bearbeitet.</p><a class="btn btn-secondary btn-block" href="lernen.html">Zur Kapitelübersicht</a>'}
        </article>
      </section>

      <section class="card forecast ${fc.hasData ? (fc.passProb >= 80 ? 'good' : fc.passProb >= 50 ? 'mid' : 'low') : ''}">
        <div class="forecast-main">
          <div class="gauge" style="--p:${fc.hasData ? fc.passProb : 0}"><strong>${fc.hasData ? fc.passProb + '%' : '?'}</strong><span>Bestehens&shy;wahrscheinlichkeit</span></div>
          <div>
            <h2>🎓 Klausurprognose</h2>
            <p class="lead-sm">${verdict}</p>
            ${fc.hasData ? `<p>Geschätzte Note: <strong class="grade">${SL.Stat.fmt(fc.grade, 1, true)}</strong> · erwartete Punkte: <strong>${fc.expected}%</strong></p>` : ''}
            ${fc.hasData ? `<p class="muted">Noch verbessern: ${fc.improve.map((i) => `<a class="chip" href="lernen.html#kapitel/${i.id}">${i.icon} ${esc(i.title)}</a>`).join(' ')}</p>` : ''}
          </div>
        </div>
      </section>

      ${rec ? `
      <section class="card recommendation">
        <h2>💡 Persönliche Empfehlung</h2>
        <p>Du machst die meisten Fehler bei <strong>${esc(rec.title)}</strong> (${Math.round(rec.rate * 100)}% richtig).</p>
        <p>Daher empfehlen wir <strong>${rec.count} zusätzliche Übungen</strong> – mit Hinweisen, ganz in Ruhe.</p>
        <a class="btn btn-warning" href="quiz.html#training/${rec.chapter}/${rec.count}">${rec.icon} ${rec.count} Übungen starten</a>
      </section>` : ''}

      <section class="grid grid-2">
        <article class="card">
          <h3>💪 Stärken</h3>
          ${sw.strengths.length ? `<div class="chips">${sw.strengths.map((s) => `<span class="chip chip-success">${s.icon} ${esc(s.title)} · ${Math.round(s.rate * 100)}%</span>`).join('')}</div>` : '<p class="muted">Sobald du ein paar Aufgaben gelöst hast, siehst du hier, was du schon richtig gut kannst.</p>'}
        </article>
        <article class="card">
          <h3>🧩 Schwächen</h3>
          ${sw.weaknesses.length ? `<div class="chips">${sw.weaknesses.map((s) => `<a class="chip chip-warning" href="quiz.html#training/${s.id}/8">${s.icon} ${esc(s.title)} · ${Math.round(s.rate * 100)}%</a>`).join('')}</div>` : '<p class="muted">Keine Schwächen erkannt. Entweder du bist super – oder du hast noch nicht genug geübt. 😉</p>'}
        </article>
      </section>

      <section class="card">
        <div class="card-head"><h2>📚 Kapitel-Fortschritt</h2><a href="lernen.html" class="link">Alle Kapitel →</a></div>
        <ul class="textbars">
          ${chapters.map((c) => {
            const p = Store.chapterProgress(c.id).percent;
            return `<li><a href="lernen.html#kapitel/${c.id}"><span class="tb-title">${c.icon} ${esc(c.title)}</span><span class="tb-bar" aria-hidden="true">${SL.Charts.textBar(p)}</span><span class="tb-pct">${p}%</span></a></li>`;
          }).join('')}
        </ul>
      </section>

      <section class="grid grid-3 quick-actions">
        <a class="action-tile" href="quiz.html#mix"><span>🎯</span><strong>Schnell-Quiz</strong><small>10 gemischte Aufgaben</small></a>
        <a class="action-tile" href="klausuren.html#start/mini"><span>⏱️</span><strong>Mini-Klausur</strong><small>15 Minuten</small></a>
        <a class="action-tile" href="statistik-rechner.html"><span>🧮</span><strong>Statistik-Rechner</strong><small>mit Rechenweg</small></a>
      </section>`;
  }

  SL.UI = { esc, toast, modal, reward, confetti, updateHeader, diffLabel, openProgressDrawer };
  SL.ready = ready;
  SL.Dashboard = { render: renderDashboard };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
