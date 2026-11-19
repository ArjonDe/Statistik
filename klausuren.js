/**
 * klausuren.js
 * ---------------------------------------------------------------
 * Klausurmodus (klausuren.html)
 *   #                → Auswahl: Mini (15 min), Probe (30 min), Komplett (90 min)
 *   #start/mini      → Startbildschirm mit Regeln
 *   #laufend         → laufende Klausur mit Timer (übersteht Neuladen)
 *   #ergebnis/3      → Auswertung: Punkte, Prozent, Note, Fehleranalyse
 */
(function () {
  'use strict';
  const SL = (window.SL = window.SL || {});
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function page() {
    const main = document.getElementById('main');
    const Store = SL.Store;
    const cfg = SL.Data.klausuren;
    const chapters = SL.Data.theorie.chapters;
    const chTitle = (id) => (chapters.find((c) => c.id === Number(id)) || { title: 'Kapitel ' + id }).title;
    const chIcon = (id) => (chapters.find((c) => c.id === Number(id)) || { icon: '📘' }).icon;
    let timer = null;

    const chapterOfTemplate = (id, fallback) => {
      const m = /^k(\d+)-/.exec(id);
      return m ? Number(m[1]) : fallback;
    };
    const grade = (p) => {
      for (const g of cfg.gradeScale) if (p >= g.min) return g.grade;
      return 5.0;
    };
    const fmtTime = (s) => {
      s = Math.max(0, Math.round(s));
      return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    function buildTasks(exam) {
      return exam.items.map((it) => SL.Tasks.byTemplate(it.templateId, it.seed, it.chapter, it.diff));
    }

    /* ---------- Übersicht ---------- */
    function overview() {
      stopTimer();
      const exams = Store.state.exams;
      const active = Store.state.activeExam;
      main.innerHTML = `
        <section class="page-head"><h1>📝 Klausurmodus</h1><p class="lead">Simuliere die echte Prüfung – mit Zeitlimit, Punkten, Note und Fehleranalyse. Jede Klausur hat neue Zahlen.</p></section>
        ${active ? `<div class="callout warn"><strong>Du hast eine laufende ${esc(cfg.modes[active.mode].title)}.</strong> <a class="btn btn-sm btn-warning" href="#laufend">▶ Fortsetzen</a></div>` : ''}
        <section class="grid grid-3">
          ${Object.entries(cfg.modes).map(([key, m]) => `
            <article class="card exam-card">
              <div class="exam-icon">${m.icon}</div>
              <h2>${esc(m.title)}</h2>
              <p class="exam-time">⏱ ${m.minutes} Minuten · ${m.items.length} Aufgaben</p>
              <p>${esc(m.description)}</p>
              <a class="btn btn-primary btn-block" href="#start/${key}">Starten</a>
            </article>`).join('')}
        </section>
        <section class="card">
          <h2>📈 Deine bisherigen Klausuren</h2>
          ${exams.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Datum</th><th>Modus</th><th>Punkte</th><th>Prozent</th><th>Note</th><th></th></tr></thead><tbody>
            ${exams.map((e, i) => ({ e, i })).reverse().slice(0, 15).map(({ e, i }) => `<tr><td>${new Date(e.date).toLocaleDateString('de-DE')}</td><td>${esc(e.title)}</td><td>${SL.Stat.fmt(e.points, 1)} / ${e.max}</td><td>${Math.round(e.percent)} %</td><td><span class="grade-chip ${e.passed ? 'ok' : 'bad'}">${SL.Stat.fmt(e.grade, 1, true)}</span></td><td><a href="#ergebnis/${i}">Ansehen</a></td></tr>`).join('')}
          </tbody></table></div>` : '<p class="muted">Noch keine Klausur geschrieben. Starte mit der Mini-Klausur – 15 Minuten, ganz entspannt.</p>'}
        </section>
        <section class="callout info"><strong>So wird bewertet:</strong> Ab ${cfg.passPercent} % bestanden (4,0). Ab 95 % gibt es eine 1,0. Zahlen dürfen mit Komma oder Punkt eingegeben werden, Wahrscheinlichkeiten als 0,25 oder 25 %. Kleine Rundungsunterschiede sind okay.</section>`;
    }

    /* ---------- Start ---------- */
    function start(modeKey) {
      stopTimer();
      const m = cfg.modes[modeKey];
      if (!m) return overview();
      const active = Store.state.activeExam;
      main.innerHTML = `
        <section class="card exam-start">
          <div class="exam-icon xl">${m.icon}</div>
          <h1>${esc(m.title)}</h1>
          <p class="lead-sm">${esc(m.description)}</p>
          <ul class="nice-list">
            <li>⏱ Zeit: <strong>${m.minutes} Minuten</strong> – der Timer läuft auch, wenn du die Seite neu lädst.</li>
            <li>📐 Formelsammlung und Taschenrechner sind erlaubt (Knopf oben in der Klausur).</li>
            <li>💾 Deine Antworten werden automatisch gespeichert.</li>
            <li>✅ Bewertung: Teilpunkte für jede richtige Teilaufgabe.</li>
          </ul>
          ${active ? '<div class="callout warn">Achtung: Eine bereits laufende Klausur wird dabei beendet.</div>' : ''}
          <div class="hero-actions center"><button class="btn btn-primary btn-lg" data-go>🚀 Klausur starten</button><a class="btn btn-ghost" href="#">Zurück</a></div>
        </section>`;
      main.querySelector('[data-go]').addEventListener('click', () => {
        const seedBase = Date.now() & 0x7fffffff;
        const items = m.items.map((it, i) => {
          const r = SL.Tasks.makeRng(seedBase + i * 977);
          const templateId = r.pick(it.pool);
          return { templateId, seed: (seedBase * 31 + i * 7919) >>> 0, chapter: chapterOfTemplate(templateId, it.chapter), diff: it.diff || 'hard', title: it.title || null };
        });
        Store.setActiveExam({ mode: modeKey, startedAt: Date.now(), minutes: m.minutes, items, answers: {} });
        SL.Router.go('laufend');
      });
    }

    /* ---------- Laufende Klausur ---------- */
    function running() {
      const exam = Store.state.activeExam;
      if (!exam) return overview();
      const m = cfg.modes[exam.mode];
      const tasks = buildTasks(exam);
      const totalPts = tasks.reduce((s, t) => s + t.points, 0);
      const totalFields = tasks.reduce((s, t) => s + t.answers.length, 0);
      main.innerHTML = `
        <div class="exam-bar" role="region" aria-label="Klausurstatus">
          <strong>${m.icon} ${esc(m.title)}</strong>
          <span class="exam-timer" aria-live="off">⏱ <span data-time></span></span>
          <span class="exam-answered"><span data-answered>0</span>/${totalFields} beantwortet</span>
          <button class="btn btn-sm btn-ghost" data-formeln>📐 Formeln</button>
          <button class="btn btn-sm btn-primary" data-submit>Abgeben</button>
        </div>
        <p class="muted">Gesamt: ${totalPts} Punkte. Viel Erfolg – du schaffst das! 🍀</p>
        ${tasks.map((t, i) => `
          <section class="card exam-task" id="ex-${i}">
            <header class="exam-task-head"><h2>${esc(exam.items[i].title || `Aufgabe ${i + 1}: ${t.title}`)}</h2><span class="chip">${t.points} Punkte</span></header>
            <div class="task-text">${t.text}</div>
            <div class="answers exam-answers">${t.answers.map((a, j) => SL.TaskPlayer.renderAnswer(a, `${i}-${j}`).replace(/<span class="answer-label"([^>]*)>/, `<span class="answer-label"$1><em class="pts">${a.pts} P.</em> `)).join('')}</div>
          </section>`).join('')}
        <div class="hero-actions center"><button class="btn btn-primary btn-lg" data-submit>✅ Klausur abgeben</button></div>`;

      // gespeicherte Antworten wiederherstellen
      Object.entries(exam.answers || {}).forEach(([k, v]) => {
        const input = main.querySelector(`input[data-i="${k}"]`);
        if (input) input.value = v;
        const group = main.querySelector(`.choice-group[data-i="${k}"]`);
        if (group && v !== '' && v !== undefined) {
          group.dataset.value = v;
          const b = group.querySelector(`[data-idx="${v}"]`);
          if (b) { b.classList.add('selected'); b.setAttribute('aria-checked', 'true'); }
        }
      });

      let saveT = null;
      const persist = () => {
        clearTimeout(saveT);
        saveT = setTimeout(() => Store.save(), 400);
        updateAnswered();
      };
      const updateAnswered = () => {
        const n = Object.values(exam.answers).filter((v) => v !== '' && v !== undefined && v !== null).length;
        main.querySelector('[data-answered]').textContent = n;
      };
      main.querySelectorAll('input[data-i]').forEach((inp) => inp.addEventListener('input', () => { exam.answers[inp.dataset.i] = inp.value; persist(); }));
      main.querySelectorAll('.choice-group').forEach((g) => g.addEventListener('click', (e) => {
        const b = e.target.closest('.choice');
        if (!b) return;
        g.querySelectorAll('.choice').forEach((x) => { x.classList.remove('selected'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('selected');
        b.setAttribute('aria-checked', 'true');
        g.dataset.value = b.dataset.idx;
        exam.answers[g.dataset.i] = b.dataset.idx;
        persist();
      }));
      updateAnswered();

      main.querySelectorAll('[data-submit]').forEach((b) => b.addEventListener('click', () => {
        const open = totalFields - Object.values(exam.answers).filter((v) => v !== '' && v !== undefined).length;
        SL.UI.modal({
          title: 'Klausur abgeben?',
          html: open > 0 ? `<p>Du hast noch <strong>${open}</strong> Feld(er) offen. Auch eine Schätzung kann Punkte bringen!</p>` : '<p>Alles beantwortet. Bereit für die Auswertung?</p>',
          actions: [{ label: '✅ Ja, abgeben', cls: 'btn-primary', onClick: () => submit(tasks) }, { label: 'Weiter bearbeiten', cls: 'btn-ghost' }],
        });
      }));
      main.querySelector('[data-formeln]').addEventListener('click', showFormulas);

      const end = exam.startedAt + exam.minutes * 60 * 1000;
      const tick = () => {
        const left = (end - Date.now()) / 1000;
        const el = main.querySelector('[data-time]');
        if (!el) return stopTimer();
        el.textContent = fmtTime(left);
        el.parentElement.classList.toggle('urgent', left < 120);
        if (left <= 0) {
          stopTimer();
          SL.UI.toast('⏰ Die Zeit ist um – deine Klausur wird automatisch abgegeben.', 'warn', 5000);
          submit(tasks);
        }
      };
      stopTimer();
      timer = setInterval(tick, 1000);
      tick();
    }

    function stopTimer() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    function showFormulas() {
      SL.UI.modal({
        title: '📐 Formelsammlung',
        drawer: true,
        html: SL.Data.formeln.groups.map((g) => `<h3>${esc(g.title)}</h3><dl class="formula-list compact">${g.items.map((i) => `<div><dt>${esc(i.name)}</dt><dd><code>${esc(i.formula)}</code></dd></div>`).join('')}</dl>`).join(''),
      });
    }

    function submit(tasks) {
      stopTimer();
      const exam = Store.state.activeExam;
      if (!exam) return overview();
      const m = cfg.modes[exam.mode];
      let points = 0, max = 0;
      const topics = {};
      tasks.forEach((t, i) => {
        t.answers.forEach((a, j) => {
          const given = exam.answers[`${i}-${j}`];
          const ok = given !== undefined && given !== '' && SL.Tasks.check(a, given).ok;
          max += a.pts;
          if (ok) points += a.pts;
          const ch = exam.items[i].chapter;
          topics[ch] = topics[ch] || { points: 0, max: 0, title: chTitle(ch) };
          topics[ch].max += a.pts;
          if (ok) topics[ch].points += a.pts;
        });
      });
      const percent = max ? (points / max) * 100 : 0;
      const g = grade(percent);
      const result = {
        date: Date.now(),
        mode: exam.mode,
        title: m.title,
        points,
        max,
        percent,
        grade: g,
        passed: percent >= cfg.passPercent,
        seconds: Math.round((Date.now() - exam.startedAt) / 1000),
        topics,
        items: exam.items,
        given: exam.answers,
      };
      const reward = Store.recordExam(result);
      if (result.passed) SL.UI.confetti();
      SL.UI.reward(reward);
      SL.Router.go(`ergebnis/${Store.state.exams.length - 1}`);
    }

    /* ---------- Ergebnis ---------- */
    function resultView(idx) {
      stopTimer();
      const e = Store.state.exams[Number(idx)];
      if (!e) return overview();
      const tasks = buildTasks(e);
      const weak = Object.entries(e.topics).filter(([, v]) => v.max && v.points / v.max < 0.6).sort((a, b) => a[1].points / a[1].max - b[1].points / b[1].max);
      const msg = e.percent >= 85 ? 'Hervorragend! Damit bist du richtig gut vorbereitet. 🏆'
        : e.percent >= 65 ? 'Stark! Du hast bestanden – mit etwas Feinschliff wird es noch besser. 💪'
          : e.percent >= 50 ? 'Bestanden! 🎉 Schau dir die Schwachstellen unten an, dann wird es sicherer.'
            : 'Diesmal noch nicht bestanden – aber jetzt weißt du genau, was du üben musst. Das ist wertvoll! 🌱';
      main.innerHTML = `
        <nav class="crumbs"><a href="#">📝 Klausurmodus</a> › <span>Ergebnis</span></nav>
        <section class="card result-hero ${e.passed ? 'good' : 'low'}">
          <div class="gauge" style="--p:${Math.round(e.percent)}"><strong>${Math.round(e.percent)}%</strong><span>erreicht</span></div>
          <div>
            <p class="eyebrow">${esc(e.title)} · ${new Date(e.date).toLocaleString('de-DE')}</p>
            <h1>Note ${SL.Stat.fmt(e.grade, 1, true)} – ${e.passed ? 'bestanden ✅' : 'nicht bestanden'}</h1>
            <p class="big">${SL.Stat.fmt(e.points, 1)} von ${e.max} Punkten</p>
            <p>${msg}</p>
            <p class="muted">Bearbeitungszeit: ${fmtTime(e.seconds)} min</p>
          </div>
        </section>
        <section class="grid grid-2">
          <article class="card">
            <h2>🔍 Fehleranalyse nach Themen</h2>
            <ul class="textbars">${Object.entries(e.topics).map(([ch, v]) => {
              const p = v.max ? Math.round((v.points / v.max) * 100) : 0;
              return `<li><a href="lernen.html#kapitel/${ch}"><span class="tb-title">${chIcon(ch)} ${esc(v.title)}</span><span class="tb-bar">${SL.Charts.textBar(p)}</span><span class="tb-pct">${SL.Stat.fmt(v.points, 1)}/${v.max}</span></a></li>`;
            }).join('')}</ul>
          </article>
          <article class="card">
            <h2>🧩 Schwachstellen</h2>
            ${weak.length ? `<p>Hier lohnt sich Üben am meisten:</p><div class="chips">${weak.map(([ch, v]) => `<a class="chip chip-warning" href="quiz.html#training/${ch}/8">${chIcon(ch)} ${esc(v.title)} · ${Math.round((v.points / v.max) * 100)}%</a>`).join('')}</div>
              <a class="btn btn-warning btn-block" href="quiz.html#training/${weak[0][0]}/8">8 Übungen zu ${esc(weak[0][1].title)}</a>` : '<p>Keine echten Schwachstellen – alle Themen über 60 %. Klasse! 🎉</p>'}
            <div class="hero-actions"><a class="btn btn-primary" href="#start/${e.mode}">🔁 Nochmal (neue Zahlen)</a><a class="btn btn-ghost" href="#">Übersicht</a></div>
          </article>
        </section>
        <h2 class="section-title">📋 Aufgaben im Detail</h2>
        ${tasks.map((t, i) => {
          const parts = t.answers.map((a, j) => {
            const given = e.given[`${i}-${j}`];
            const ok = given !== undefined && given !== '' && SL.Tasks.check(a, given).ok;
            const shown = given === undefined || given === '' ? '—' : a.kind === 'choice' ? a.options[Number(given)] : given;
            return `<li class="${ok ? 'ok' : 'wrong'}"><span>${ok ? '✅' : '❌'} ${esc(a.label)}</span><span>Deine Antwort: <strong>${esc(shown)}</strong></span><span>Richtig: <strong>${esc(SL.Tasks.formatAnswer(a))}</strong></span><span class="pts">${ok ? a.pts : 0}/${a.pts} P.</span></li>`;
          }).join('');
          return `<details class="card review" ${i === 0 ? 'open' : ''}>
            <summary><strong>${esc(e.items[i].title || `Aufgabe ${i + 1}: ${t.title}`)}</strong></summary>
            <div class="task-text">${t.text}</div>
            <ul class="review-list">${parts}</ul>
            <details class="steps-details"><summary>👣 Schritt-für-Schritt-Lösung anzeigen</summary><ol class="steps-box">${t.steps.map((s) => `<li class="step"><h4>${esc(s.title)}</h4><div>${s.html}</div></li>`).join('')}</ol></details>
          </details>`;
        }).join('')}`;
    }

    SL.Router
      .add('', overview)
      .add('start/:mode', (p) => start(p.mode))
      .add('laufend', running)
      .add('ergebnis/:idx', (p) => resultView(p.idx))
      .otherwise(overview)
      .start();
  }

  SL.ready(() => {
    if (document.body.dataset.page === 'klausuren') page();
  });
})();
