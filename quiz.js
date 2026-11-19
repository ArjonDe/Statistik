/**
 * quiz.js
 * ---------------------------------------------------------------
 * 1) SL.TaskPlayer   – zeigt eine Aufgabe mit allen Hilfe-Knöpfen:
 *                      Hinweis · Nächster Schritt · Noch einfacher erklären ·
 *                      Lösung zeigen · Videoartige Erklärung · Gemeinsam lösen
 * 2) SL.VideoPlayer  – spielt die Lösung Schritt für Schritt ab (mit Vorlesen)
 * 3) Quiz-Seite      – Schnell-Quiz, Schwächen-Training, Fehler wiederholen
 */
(function () {
  'use strict';
  const SL = (window.SL = window.SL || {});
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DIFF_LABEL = { easy: 'Leicht', medium: 'Mittel', hard: 'Schwer' };

  const PRAISE = ['Richtig! 🎉 Genau so geht das.', 'Stark! 💪 Das sitzt.', 'Perfekt gelöst! ⭐', 'Yes! Du hast es drauf. 🚀', 'Richtig – und zwar komplett selbst! 👏'];
  const COMFORT = [
    'Fast! Lass uns gemeinsam schauen. 🤝',
    'Noch nicht ganz – kein Problem, genau dafür üben wir. Lass uns gemeinsam schauen.',
    'Das ist ein typischer Stolperstein. Lass uns gemeinsam schauen, wo es hakt.',
  ];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const textOf = (html) => {
    const d = document.createElement('div');
    d.innerHTML = html;
    d.querySelectorAll('svg').forEach((s) => s.remove());
    return d.textContent.replace(/\s+/g, ' ').trim();
  };

  /* ======================================================
   * Video-Erklärung
   * ====================================================== */
  const VideoPlayer = {
    open(task) {
      const slides = [
        { title: 'Okay, wir schauen uns zuerst an, was überhaupt gefragt wird.', html: task.text },
        ...task.steps.map((s, i) => ({ title: `Schritt ${i + 1}: ${s.title}`, html: s.html })),
        { title: 'Fertig! 🎉', html: `<div class="video-final">${task.solution}</div>` },
      ];
      let idx = 0, playing = true, timer = null;
      const speechOk = 'speechSynthesis' in window;
      let speech = speechOk && SL.Store.state.settings.speech !== false;

      const m = SL.UI.modal({
        title: '🎬 Videoartige Erklärung',
        html: `<div class="video">
          <div class="video-screen"><div class="video-narrator"></div><div class="video-content"></div></div>
          <div class="video-progress">${slides.map(() => '<span><i></i></span>').join('')}</div>
          <div class="video-controls">
            <button class="btn btn-ghost" data-v="prev" aria-label="Zurück">⏮</button>
            <button class="btn btn-primary" data-v="play" aria-label="Pause">⏸</button>
            <button class="btn btn-ghost" data-v="next" aria-label="Weiter">⏭</button>
            ${speechOk ? `<button class="btn btn-ghost" data-v="speech" aria-pressed="${speech}" aria-label="Vorlesen umschalten">${speech ? '🔊' : '🔇'}</button>` : ''}
          </div></div>`,
        onClose: () => { clearTimeout(timer); if (speechOk) speechSynthesis.cancel(); },
      });
      const root = m.el;
      const content = root.querySelector('.video-content');
      const narrator = root.querySelector('.video-narrator');
      const bars = root.querySelectorAll('.video-progress span');

      function duration(s) {
        return Math.min(14000, Math.max(4500, textOf(s.html).length * 55));
      }
      function show(i) {
        clearTimeout(timer);
        if (speechOk) speechSynthesis.cancel();
        idx = Math.max(0, Math.min(slides.length - 1, i));
        const s = slides[idx];
        narrator.textContent = s.title;
        content.classList.remove('in');
        content.innerHTML = s.html;
        void content.offsetWidth;
        content.classList.add('in');
        bars.forEach((b, k) => {
          b.classList.toggle('done', k < idx);
          b.classList.toggle('active', k === idx);
          const fill = b.querySelector('i');
          fill.style.transition = 'none';
          fill.style.width = k < idx ? '100%' : '0%';
        });
        if (playing) schedule();
      }
      function schedule() {
        const s = slides[idx];
        const bar = bars[idx].querySelector('i');
        const ms = duration(s);
        const advance = () => { if (idx < slides.length - 1) show(idx + 1); else setPlaying(false); };
        requestAnimationFrame(() => { bar.style.transition = `width ${ms}ms linear`; bar.style.width = '100%'; });
        if (speech) {
          const u = new SpeechSynthesisUtterance(`${s.title}. ${textOf(s.html)}`);
          u.lang = 'de-DE';
          u.rate = 1;
          let done = false;
          u.onend = () => { if (!done && playing) { done = true; timer = setTimeout(advance, 600); } };
          speechSynthesis.speak(u);
          timer = setTimeout(() => { if (!done && !speechSynthesis.speaking) { done = true; advance(); } }, ms + 4000);
        } else timer = setTimeout(advance, ms);
      }
      function setPlaying(p) {
        playing = p;
        const btn = root.querySelector('[data-v="play"]');
        btn.textContent = p ? '⏸' : '▶';
        btn.setAttribute('aria-label', p ? 'Pause' : 'Abspielen');
        if (!p) {
          clearTimeout(timer);
          if (speechOk) speechSynthesis.cancel();
          const bar = bars[idx].querySelector('i');
          const w = getComputedStyle(bar).width;
          bar.style.transition = 'none';
          bar.style.width = w;
        } else show(idx);
      }
      root.querySelector('[data-v="prev"]').addEventListener('click', () => show(idx - 1));
      root.querySelector('[data-v="next"]').addEventListener('click', () => show(idx + 1));
      root.querySelector('[data-v="play"]').addEventListener('click', () => {
        if (!playing && idx === slides.length - 1) { playing = true; show(0); return; }
        setPlaying(!playing);
      });
      const sp = root.querySelector('[data-v="speech"]');
      if (sp) sp.addEventListener('click', () => {
        speech = !speech;
        SL.Store.setSetting('speech', speech);
        sp.textContent = speech ? '🔊' : '🔇';
        sp.setAttribute('aria-pressed', speech);
        show(idx);
      });
      show(0);
    },
  };

  /* ======================================================
   * Aufgaben-Player
   * ====================================================== */
  /**
   * opts: {
   *   task, positionLabel, progress (0..1),
   *   onPrev, onNext, onNewNumbers, onDone(result),
   *   startTutor (bool), compact (bool)
   * }
   */
  function mount(container, opts) {
    const task = opts.task;
    const state = { hints: 0, stepsShown: 0, simpleShown: false, solutionShown: false, recordedWrong: false, solved: false, tutor: false, start: Date.now() };

    container.innerHTML = `
      <article class="task-card" aria-labelledby="task-title">
        <header class="task-head">
          <div class="task-meta">
            <span class="badge diff-${task.diff}">${DIFF_LABEL[task.diff] || ''}</span>
            ${opts.positionLabel ? `<span class="task-pos">${esc(opts.positionLabel)}</span>` : ''}
            <span class="task-pts">${task.points} P.</span>
          </div>
          <h2 id="task-title">${esc(task.title)}</h2>
          ${opts.progress !== undefined ? `<div class="progress slim"><span style="width:${Math.round(opts.progress * 100)}%"></span></div>` : ''}
        </header>
        <div class="task-text">${task.text}</div>
        <form class="answers" novalidate>
          ${task.answers.map((a, i) => renderAnswer(a, i)).join('')}
          <div class="answer-actions">
            <button type="submit" class="btn btn-primary btn-lg">✔ Prüfen</button>
            <p class="feedback" role="status" aria-live="polite"></p>
          </div>
        </form>
        <div class="help-buttons" role="group" aria-label="Hilfen">
          <button class="btn btn-help" data-h="hint">💡 Hinweis</button>
          <button class="btn btn-help" data-h="step">👣 Nächster Schritt</button>
          <button class="btn btn-help" data-h="simple">🧸 Noch einfacher erklären</button>
          <button class="btn btn-help" data-h="video">🎬 Videoartige Erklärung</button>
          <button class="btn btn-help" data-h="tutor">🤝 Gemeinsam lösen</button>
          <button class="btn btn-help" data-h="solution">👀 Lösung zeigen</button>
          ${opts.onNewNumbers ? '<button class="btn btn-help" data-h="new">🎲 Neue Zahlen</button>' : ''}
        </div>
        <div class="help-area">
          <div class="hint-box" hidden></div>
          <div class="simple-box" hidden></div>
          <div class="tutor-box" hidden></div>
          <ol class="steps-box" hidden></ol>
          <div class="solution-box" hidden></div>
        </div>
        ${opts.onPrev || opts.onNext ? `<footer class="task-nav">
          <button class="btn btn-ghost" data-nav="prev" ${opts.onPrev ? '' : 'disabled'}>← Zurück</button>
          <button class="btn btn-secondary" data-nav="next" ${opts.onNext ? '' : 'disabled'}>Weiter →</button>
        </footer>` : ''}
      </article>`;

    const root = container.querySelector('.task-card');
    const form = root.querySelector('.answers');
    const feedback = root.querySelector('.feedback');
    const q = (sel) => root.querySelector(sel);

    // Auswahl-Antworten
    root.querySelectorAll('.choice-group').forEach((g) => {
      g.addEventListener('click', (e) => {
        const b = e.target.closest('.choice');
        if (!b || b.disabled) return;
        g.querySelectorAll('.choice').forEach((x) => { x.classList.remove('selected'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('selected');
        b.setAttribute('aria-checked', 'true');
        g.dataset.value = b.dataset.idx;
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      evaluate();
    });

    root.querySelector('.help-buttons').addEventListener('click', (e) => {
      const b = e.target.closest('[data-h]');
      if (!b) return;
      const h = b.dataset.h;
      if (h === 'hint') showHint();
      if (h === 'step') nextStep();
      if (h === 'simple') showSimple();
      if (h === 'video') { state.hints++; VideoPlayer.open(task); }
      if (h === 'tutor') startTutor();
      if (h === 'solution') showSolution();
      if (h === 'new' && opts.onNewNumbers) opts.onNewNumbers();
    });
    const prev = root.querySelector('[data-nav="prev"]');
    const next = root.querySelector('[data-nav="next"]');
    if (prev && opts.onPrev) prev.addEventListener('click', opts.onPrev);
    if (next && opts.onNext) next.addEventListener('click', opts.onNext);

    function readAnswer(i) {
      const a = task.answers[i];
      if (a.kind === 'choice') return root.querySelector(`.choice-group[data-i="${i}"]`).dataset.value;
      return root.querySelector(`input[data-i="${i}"]`).value;
    }

    function evaluate() {
      if (state.solved) return;
      let allOk = true, anyEmpty = false;
      task.answers.forEach((a, i) => {
        const res = SL.Tasks.check(a, readAnswer(i));
        const field = root.querySelector(`.answer[data-i="${i}"]`);
        field.classList.remove('ok', 'wrong');
        if (res.empty) { anyEmpty = true; allOk = false; return; }
        field.classList.add(res.ok ? 'ok' : 'wrong');
        if (!res.ok) allOk = false;
      });
      if (anyEmpty && !allOk) {
        feedback.className = 'feedback info';
        feedback.textContent = 'Trag bei jedem Feld eine Antwort ein – auch eine Schätzung ist okay. 🙂';
        return;
      }
      const seconds = (Date.now() - state.start) / 1000;
      if (allOk) {
        state.solved = true;
        feedback.className = 'feedback success';
        feedback.innerHTML = state.solutionShown ? 'Richtig eingetragen. Beim nächsten Mal schaffst du es ohne Lösung! 💪' : pick(PRAISE);
        root.classList.add('solved');
        form.querySelectorAll('input, .choice').forEach((x) => (x.disabled = true));
        if (!(state.solutionShown && state.recordedWrong)) {
          const res = SL.Store.recordAttempt({ chapter: task.chapter, diff: task.diff, index: task.index, correct: true, hints: state.hints, solutionShown: state.solutionShown, seconds, tutor: state.tutor });
          SL.UI.reward(res);
          if (!state.solutionShown) SL.UI.confetti();
        }
        if (opts.onDone) opts.onDone({ correct: !state.solutionShown, hints: state.hints });
        if (next && opts.onNext) next.focus();
      } else {
        feedback.className = 'feedback warn';
        feedback.innerHTML = `${pick(COMFORT)} <button type="button" class="link-btn" data-fb="step">👣 Zeig mir den nächsten Schritt</button> <button type="button" class="link-btn" data-fb="tutor">🤝 Gemeinsam lösen</button>`;
        feedback.querySelector('[data-fb="step"]').addEventListener('click', nextStep);
        feedback.querySelector('[data-fb="tutor"]').addEventListener('click', startTutor);
        if (!state.recordedWrong) {
          state.recordedWrong = true;
          SL.Store.recordAttempt({ chapter: task.chapter, diff: task.diff, index: task.index, correct: false, hints: state.hints, seconds });
          if (opts.onDone) opts.onDone({ correct: false, hints: state.hints });
        }
      }
    }

    function showHint() {
      const box = q('.hint-box');
      if (box.hidden) state.hints++;
      box.hidden = false;
      box.innerHTML = `<h3>💡 Hinweis</h3><p>${task.hint}</p>`;
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function showSimple() {
      const box = q('.simple-box');
      if (box.hidden) state.hints++;
      box.hidden = false;
      box.innerHTML = `<h3>🧸 Noch einfacher erklärt</h3><p>${task.simple}</p>`;
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function nextStep() {
      const box = q('.steps-box');
      box.hidden = false;
      if (state.stepsShown >= task.steps.length) {
        showSolution();
        return;
      }
      state.hints++;
      const s = task.steps[state.stepsShown];
      const li = document.createElement('li');
      li.className = 'step reveal';
      li.innerHTML = `<h4>${esc(s.title)}</h4><div>${s.html}</div>`;
      box.appendChild(li);
      state.stepsShown++;
      const btn = root.querySelector('[data-h="step"]');
      btn.textContent = state.stepsShown >= task.steps.length ? '👀 Zur Lösung' : `👣 Nächster Schritt (${state.stepsShown}/${task.steps.length})`;
      li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function showSolution() {
      if (!state.solutionShown) {
        state.solutionShown = true;
        if (!state.solved && !state.recordedWrong) {
          state.recordedWrong = true;
          SL.Store.recordAttempt({ chapter: task.chapter, diff: task.diff, index: task.index, correct: false, hints: state.hints, solutionShown: true, seconds: (Date.now() - state.start) / 1000 });
        }
      }
      const steps = q('.steps-box');
      steps.hidden = false;
      while (state.stepsShown < task.steps.length) {
        const s = task.steps[state.stepsShown++];
        const li = document.createElement('li');
        li.className = 'step';
        li.innerHTML = `<h4>${esc(s.title)}</h4><div>${s.html}</div>`;
        steps.appendChild(li);
      }
      const box = q('.solution-box');
      box.hidden = false;
      box.innerHTML = `<h3>✅ Lösung</h3><p>${task.solution}</p><ul class="answer-list">${task.answers.map((a) => `<li><span>${esc(a.label)}</span><strong>${esc(SL.Tasks.formatAnswer(a))}</strong></li>`).join('')}</ul><p class="muted">Tipp: Trag die Lösung jetzt selbst ein und klick auf „Prüfen“ – so bleibt sie besser hängen.</p>`;
      root.querySelector('[data-h="step"]').textContent = '👣 Alle Schritte gezeigt';
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /* ---------- Tutor-Modus: gemeinsam lösen ---------- */
    function startTutor() {
      if (state.tutor) { q('.tutor-box').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
      state.tutor = true;
      const box = q('.tutor-box');
      box.hidden = false;
      box.innerHTML = '<h3>🤝 Gemeinsam lösen</h3><div class="chat" aria-live="polite"></div>';
      const chat = box.querySelector('.chat');
      let i = 0;
      const bot = (html) => {
        const d = document.createElement('div');
        d.className = 'bubble bot';
        d.innerHTML = html;
        chat.appendChild(d);
        d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return d;
      };
      const me = (text) => {
        const d = document.createElement('div');
        d.className = 'bubble me';
        d.textContent = text;
        chat.appendChild(d);
      };
      bot('Okay, wir lösen das jetzt <strong>zusammen</strong>. Schritt für Schritt – du kannst nichts falsch machen. 🙂');

      function stepAt() {
        if (i >= task.steps.length) {
          bot('Fertig! 🎉 Du hast alle Schritte geschafft. Trag jetzt oben die Endergebnisse ein und klick auf <strong>„Prüfen“</strong>.');
          form.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        const s = task.steps[i];
        if (!s.ask) {
          const b = bot(`<strong>${esc(s.title)}</strong><div>${s.html}</div><button class="btn btn-secondary btn-sm" data-t="ok">Verstanden ✔</button>`);
          b.querySelector('[data-t="ok"]').addEventListener('click', (e) => {
            e.target.remove();
            me('Verstanden!');
            i++;
            stepAt();
          });
          return;
        }
        let tries = 0;
        const b = bot(`<strong>${esc(s.title)}</strong><p>Was bekommst du für <strong>${esc(s.ask.label)}</strong>?</p>
          <form class="tutor-form"><input type="text" inputmode="decimal" autocomplete="off" aria-label="${esc(s.ask.label)}" placeholder="Deine Antwort"><button class="btn btn-primary btn-sm">Prüfen</button><button type="button" class="link-btn" data-t="show">Zeig’s mir</button></form>`);
        const f = b.querySelector('form');
        const input = f.querySelector('input');
        input.focus({ preventScroll: true });
        const reveal = (msg) => {
          bot(`${msg}<div>${s.html}</div>`);
        };
        f.addEventListener('submit', (e) => {
          e.preventDefault();
          const val = input.value;
          if (!val.trim()) return;
          me(val);
          const ok = SL.Tasks.check(s.ask, val).ok;
          if (ok) {
            f.remove();
            bot(pick(['Genau! 👍', 'Richtig! 🎯', 'Super, stimmt! ✨']) + (tries === 0 ? '' : ' Siehst du – du kannst das.'));
            i++;
            setTimeout(stepAt, 350);
          } else {
            tries++;
            input.value = '';
            if (tries === 1) bot(`Lass uns gemeinsam schauen. 🤔 ${task.hint}`);
            else {
              reveal('Kein Problem – so rechnet man das:');
              bot('Trag den Wert jetzt einfach ab – so prägt er sich ein. ✍️');
            }
          }
        });
        f.querySelector('[data-t="show"]').addEventListener('click', () => {
          state.hints++;
          f.remove();
          reveal('Klar, hier ist der Rechenweg:');
          i++;
          setTimeout(stepAt, 400);
        });
      }
      stepAt();
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (opts.startTutor) startTutor();
    return { root, startTutor };
  }

  function renderAnswer(a, i) {
    if (a.kind === 'choice') {
      return `<div class="answer" data-i="${i}">
        <span class="answer-label" id="al-${i}">${esc(a.label)}</span>
        <div class="choice-group" data-i="${i}" role="radiogroup" aria-labelledby="al-${i}">
          ${a.options.map((o, k) => `<button type="button" class="choice" role="radio" aria-checked="false" data-idx="${k}">${esc(o)}</button>`).join('')}
        </div>
      </div>`;
    }
    const ph = a.kind === 'prob' ? 'z. B. 0,25 oder 25 %' : 'Zahl eingeben';
    return `<label class="answer" data-i="${i}">
      <span class="answer-label">${esc(a.label)}</span>
      <input type="text" inputmode="decimal" autocomplete="off" data-i="${i}" placeholder="${ph}">
    </label>`;
  }

  SL.TaskPlayer = { mount, renderAnswer };
  SL.VideoPlayer = VideoPlayer;

  /* ======================================================
   * Quiz-Seite
   * ====================================================== */
  function quizPage() {
    const main = document.getElementById('main');
    const Store = SL.Store;
    const chapters = SL.Data.theorie.chapters;
    const chapterById = (id) => chapters.find((c) => c.id === Number(id));
    let run = null;

    function menu() {
      const wrong = Store.wrongTasks();
      const sw = Store.strengthsWeaknesses();
      const weakest = sw.weaknesses[0];
      main.innerHTML = `
        <section class="page-head"><h1>🎯 Üben</h1><p class="lead">Wähle, wie du üben willst. Jede Aufgabe hat Hinweise und eine Schritt-für-Schritt-Lösung.</p></section>
        <section class="grid grid-2">
          <a class="action-tile big" href="#mix"><span>⚡</span><strong>Schnell-Quiz</strong><small>10 gemischte Aufgaben aus allen Kapiteln</small></a>
          <a class="action-tile big" href="#training/${weakest ? weakest.id : 10}/8"><span>🧩</span><strong>Schwächen-Training</strong><small>${weakest ? `8 Aufgaben zu ${esc(weakest.title)}` : '8 Aufgaben zu Bayes (Klausur-Klassiker)'}</small></a>
          <a class="action-tile big ${wrong.length ? '' : 'disabled'}" href="${wrong.length ? '#fehler' : '#'}"><span>🔁</span><strong>Fehler wiederholen</strong><small>${wrong.length ? `${wrong.length} Aufgabe(n) warten auf dich` : 'Noch keine falschen Aufgaben – super!'}</small></a>
          <a class="action-tile big" href="#exam-mix"><span>🏋️</span><strong>Klausur-Training</strong><small>5 schwere Aufgaben im Klausurstil</small></a>
        </section>
        <section class="card">
          <h2>📚 Gezielt ein Kapitel üben</h2>
          <div class="chapter-picker">
            ${chapters.map((c) => {
              const p = Store.chapterProgress(c.id);
              return `<a class="chapter-chip" href="#training/${c.id}/10"><span>${c.icon}</span><strong>${esc(c.title)}</strong><small>${p.solved}/60 gelöst</small></a>`;
            }).join('')}
          </div>
        </section>`;
    }

    function startRun(title, items) {
      if (!items.length) {
        main.innerHTML = `<div class="card"><h2>Nichts zu üben</h2><p>Hier gibt es gerade keine Aufgaben. <a href="#">Zurück zur Auswahl</a></p></div>`;
        return;
      }
      run = { title, items, pos: 0, results: [], variants: {} };
      showRunTask();
    }

    function showRunTask() {
      const it = run.items[run.pos];
      const variant = run.variants[run.pos] || 0;
      const task = SL.Tasks.get(it.chapter, it.diff, it.index, variant);
      const ch = chapterById(it.chapter);
      main.innerHTML = `<div class="run-head"><a href="#" class="link">✕ Beenden</a><strong>${esc(run.title)}</strong><span>${ch.icon} ${esc(ch.title)}</span></div><div id="player"></div>`;
      mount(document.getElementById('player'), {
        task,
        positionLabel: `Aufgabe ${run.pos + 1} von ${run.items.length}`,
        progress: run.pos / run.items.length,
        onPrev: run.pos > 0 ? () => { run.pos--; showRunTask(); } : null,
        onNext: () => {
          if (run.pos < run.items.length - 1) { run.pos++; showRunTask(); } else summary();
        },
        onNewNumbers: () => { run.variants[run.pos] = (run.variants[run.pos] || 0) + 1; showRunTask(); },
        onDone: (r) => { if (run.results[run.pos] === undefined || r.correct) run.results[run.pos] = r.correct; },
      });
      Store.setLastTask(it.chapter, it.diff, it.index, ch.title);
      window.scrollTo(0, 0);
    }

    function summary() {
      const correct = run.results.filter(Boolean).length;
      const total = run.items.length;
      const rate = correct / total;
      const rec = Store.recommendation();
      main.innerHTML = `
        <section class="card summary">
          <div class="summary-icon">${rate >= 0.8 ? '🏆' : rate >= 0.5 ? '💪' : '🌱'}</div>
          <h1>${esc(run.title)} geschafft!</h1>
          <p class="big">${correct} von ${total} richtig</p>
          <div class="progress"><span style="width:${Math.round(rate * 100)}%"></span></div>
          <p class="lead-sm">${rate >= 0.8 ? 'Wow, richtig stark! Du bist bereit für schwerere Aufgaben.' : rate >= 0.5 ? 'Gute Arbeit! Mit ein bisschen Wiederholung sitzt das bald perfekt.' : 'Jeder Fehler ist ein Lernschritt. Wiederhole die Aufgaben mit „Gemeinsam lösen“ – das hilft enorm.'}</p>
          ${rec ? `<p>💡 Du machst die meisten Fehler bei <strong>${esc(rec.title)}</strong>. Daher empfehlen wir ${rec.count} zusätzliche Übungen.</p>` : ''}
          <div class="hero-actions center">
            ${rec ? `<a class="btn btn-warning" href="#training/${rec.chapter}/${rec.count}">${rec.icon} ${rec.count} Übungen zu ${esc(rec.title)}</a>` : ''}
            <a class="btn btn-primary" href="#mix" data-again>⚡ Neues Schnell-Quiz</a>
            <a class="btn btn-secondary" href="#">Zur Auswahl</a>
          </div>
        </section>`;
      const again = main.querySelector('[data-again]');
      if (again) again.addEventListener('click', (e) => { if (location.hash === '#mix') { e.preventDefault(); SL.Router.go('mix'); } });
    }

    function randomItems(count, filter) {
      const items = [];
      const used = new Set();
      let guard = 0;
      while (items.length < count && guard++ < 500) {
        const c = filter.chapters[Math.floor(Math.random() * filter.chapters.length)];
        const diff = filter.diffs[Math.floor(Math.random() * filter.diffs.length)];
        const max = Store.TASKS_PER_DIFF[diff];
        const cp = Store.state.chapters[c];
        const solved = cp ? cp.tasks[diff].correct : [];
        let index = Math.floor(Math.random() * max);
        for (let k = 0; k < max && solved.includes(index); k++) index = (index + 1) % max;
        const key = `${c}-${diff}-${index}`;
        if (used.has(key)) continue;
        used.add(key);
        items.push({ chapter: c, diff, index });
      }
      return items;
    }

    SL.Router
      .add('', menu)
      .add('mix', () => startRun('Schnell-Quiz', randomItems(10, { chapters: chapters.map((c) => c.id), diffs: ['easy', 'easy', 'medium'] })))
      .add('exam-mix', () => startRun('Klausur-Training', randomItems(5, { chapters: [5, 10, 13, 14, 15, 16], diffs: ['hard'] })))
      .add('training/:chapter/:count', (p) => {
        const ch = chapterById(p.chapter);
        if (!ch) return menu();
        startRun(`Training: ${ch.title}`, randomItems(Math.min(20, Math.max(1, Number(p.count) || 8)), { chapters: [ch.id], diffs: ['easy', 'medium', 'medium', 'hard'] }));
      })
      .add('fehler', () => startRun('Fehler wiederholen', Store.wrongTasks().slice(0, 15)))
      .otherwise(menu)
      .start();
  }

  SL.ready(() => {
    if (document.body.dataset.page === 'quiz') quizPage();
  });
})();
