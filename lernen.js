/**
 * lernen.js
 * ---------------------------------------------------------------
 * Der Lernbereich (lernen.html):
 *   #                                   → Kapitelübersicht
 *   #kapitel/4                          → Theorie mit Widgets und Kurz-Checks
 *   #kapitel/4/aufgaben/easy/12         → Aufgabe 13 von 30 (leicht)
 *   #tutor/4                            → Gemeinsam-lernen-Modus
 *   #formeln                            → Formelsammlung
 */
(function () {
  'use strict';
  const SL = (window.SL = window.SL || {});
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DIFF_LABEL = { easy: 'Leicht', medium: 'Mittel', hard: 'Schwer' };
  const DIFF_ICON = { easy: '🌱', medium: '🌿', hard: '🌳' };

  function page() {
    const main = document.getElementById('main');
    const Store = SL.Store;
    const chapters = SL.Data.theorie.chapters;
    const byId = (id) => chapters.find((c) => c.id === Number(id));
    let observer = null;

    /* ---------- Übersicht ---------- */
    function overview() {
      main.innerHTML = `
        <section class="page-head">
          <h1>📚 Kapitelübersicht</h1>
          <p class="lead">16 Kapitel, jedes mit kurzer Erklärung, Mini-Spielen und 60 Aufgaben. Fang einfach vorne an – oder spring direkt zu dem, was dich gerade quält.</p>
          <div class="hero-actions"><a class="btn btn-secondary" href="#formeln">📐 Formelsammlung</a><a class="btn btn-secondary" href="quiz.html#mix">⚡ Schnell-Quiz</a></div>
        </section>
        <section class="chapter-grid">
          ${chapters.map((c) => {
            const p = Store.chapterProgress(c.id);
            return `<a class="chapter-card ${p.percent >= 100 ? 'done' : ''}" href="#kapitel/${c.id}">
              <span class="chapter-num">Kapitel ${c.id}</span>
              <span class="chapter-icon">${c.icon}</span>
              <strong>${esc(c.title)}</strong>
              <small>${esc(c.short)}</small>
              <span class="chapter-foot"><span class="tb-bar" aria-hidden="true">${SL.Charts.textBar(p.percent)}</span><span>${p.percent}%</span></span>
              <span class="chapter-tags">${c.examWeight >= 10 ? '<span class="chip chip-hot">🔥 Klausur-relevant</span>' : ''}<span class="chip">⏱ ${c.minutes} min</span>${p.theorySeen ? '<span class="chip chip-success">✔ gelesen</span>' : ''}</span>
            </a>`;
          }).join('')}
        </section>`;
    }

    /* ---------- Theorie ---------- */
    function renderBlock(b, ch) {
      switch (b.type) {
        case 'p': return `<p>${b.html}</p>`;
        case 'list': return `<ul class="nice-list">${b.items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
        case 'steps': return `<ol class="step-list">${b.items.map((i) => `<li>${i}</li>`).join('')}</ol>`;
        case 'example': return `<div class="callout example"><h4>📝 ${esc(b.title)}</h4><div>${b.html}</div></div>`;
        case 'tip': return `<div class="callout tip"><strong>💡 Tipp:</strong> ${b.html}</div>`;
        case 'warn': return `<div class="callout warn"><strong>⚠️ Achtung:</strong> ${b.html}</div>`;
        case 'exam': return `<div class="callout exam"><strong>🎓 Klausur-Tipp:</strong> ${b.html}</div>`;
        case 'formula': return `<div class="formula">${b.html}${b.legend ? `<small>${b.legend}</small>` : ''}</div>`;
        case 'widget': return `<div class="widget" data-widget="${esc(b.id)}"></div>`;
        case 'check': {
          const done = Store.chapter(ch.id).quickChecks.includes(b.id);
          return `<div class="quickcheck ${done ? 'done' : ''}" data-check="${esc(b.id)}" data-correct="${b.correct}">
            <h4>✋ Kurz-Check ${done ? '<span class="chip chip-success">✔ geschafft</span>' : ''}</h4>
            <p>${b.q}</p>
            <div class="choice-group">${b.options.map((o, i) => `<button type="button" class="choice" data-idx="${i}">${o}</button>`).join('')}</div>
            <p class="qc-feedback" hidden><span class="qc-prefix"></span>${b.explain}</p>
          </div>`;
        }
        default: return '';
      }
    }

    function chapterView(id) {
      const ch = byId(id);
      if (!ch) return overview();
      const idx = chapters.indexOf(ch);
      const prevCh = chapters[idx - 1], nextCh = chapters[idx + 1];
      const p = Store.chapterProgress(ch.id);
      main.innerHTML = `
        <nav class="crumbs"><a href="#">📚 Kapitel</a> › <span>${esc(ch.title)}</span></nav>
        <section class="chapter-hero">
          <span class="chapter-icon xl">${ch.icon}</span>
          <div>
            <p class="eyebrow">Kapitel ${ch.id} · ⏱ ca. ${ch.minutes} Minuten</p>
            <h1>${esc(ch.title)}</h1>
            <p class="lead-sm">${esc(ch.short)}</p>
            <div class="progress"><span style="width:${p.percent}%"></span></div>
            <p class="muted">${p.percent}% · ${p.solved} von 60 Aufgaben gelöst</p>
          </div>
          <a class="btn btn-primary" href="#ueben-${ch.id}" data-jump>🎯 Direkt zu den Aufgaben</a>
        </section>
        <nav class="toc" aria-label="Inhalt">${ch.sections.map((s, i) => `<a href="#sec-${i}" data-sec="${i}">${i + 1}. ${esc(s.title)}</a>`).join('')}</nav>
        <div class="theory">
          ${ch.sections.map((s, i) => `<section class="card theory-section" id="sec-${i}"><h2>${esc(s.title)}</h2>${s.blocks.map((b) => renderBlock(b, ch)).join('')}</section>`).join('')}
        </div>
        <div id="theory-end" aria-hidden="true"></div>
        <section class="card practice" id="ueben-${ch.id}">
          <h2>🎯 Jetzt üben</h2>
          <p>Fang leicht an. Bei jeder Aufgabe gibt es Hinweise, Schritt-für-Schritt-Lösungen und den „Gemeinsam lösen“-Modus.</p>
          <div class="grid grid-3">
            ${SL.Store.DIFFS.map((d) => {
              const total = Store.TASKS_PER_DIFF[d];
              const solved = p.perDiff[d];
              const c = Store.state.chapters[ch.id];
              const doneList = c ? c.tasks[d].correct : [];
              let nextIdx = 0;
              while (doneList.includes(nextIdx) && nextIdx < total - 1) nextIdx++;
              return `<a class="diff-card diff-${d}" href="#kapitel/${ch.id}/aufgaben/${d}/${nextIdx}">
                <span class="diff-icon">${DIFF_ICON[d]}</span><strong>${DIFF_LABEL[d]}</strong>
                <span>${solved} / ${total} gelöst</span>
                <span class="progress slim"><span style="width:${Math.round((solved / total) * 100)}%"></span></span>
                <span class="btn btn-sm ${solved ? 'btn-secondary' : 'btn-primary'}">${solved ? 'Weiter üben' : 'Starten'}</span>
              </a>`;
            }).join('')}
          </div>
          <a class="btn btn-tutor btn-block" href="#tutor/${ch.id}">🤝 Gemeinsam lernen (Tutor-Modus)</a>
        </section>
        <nav class="chapter-nav">
          ${prevCh ? `<a class="btn btn-ghost" href="#kapitel/${prevCh.id}">← ${prevCh.icon} ${esc(prevCh.title)}</a>` : '<span></span>'}
          ${nextCh ? `<a class="btn btn-secondary" href="#kapitel/${nextCh.id}">${nextCh.icon} ${esc(nextCh.title)} →</a>` : ''}
        </nav>`;

      // Anker innerhalb der Seite ohne Router-Wechsel
      main.querySelectorAll('[data-sec], [data-jump]').forEach((a) => a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = a.dataset.jump !== undefined ? document.getElementById(`ueben-${ch.id}`) : document.getElementById(`sec-${a.dataset.sec}`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));

      // Widgets starten
      main.querySelectorAll('[data-widget]').forEach((el) => {
        const fn = SL.Widgets && SL.Widgets[el.dataset.widget];
        if (fn) {
          try { fn(el); } catch (err) { console.error(err); el.innerHTML = '<p class="muted">Dieses Mini-Spiel konnte nicht geladen werden.</p>'; }
        }
      });

      // Kurz-Checks
      main.querySelectorAll('.quickcheck').forEach((qc) => {
        qc.querySelector('.choice-group').addEventListener('click', (e) => {
          const b = e.target.closest('.choice');
          if (!b) return;
          const correct = Number(b.dataset.idx) === Number(qc.dataset.correct);
          qc.querySelectorAll('.choice').forEach((x) => x.classList.remove('ok', 'wrong'));
          b.classList.add(correct ? 'ok' : 'wrong');
          const fb = qc.querySelector('.qc-feedback');
          fb.hidden = false;
          fb.className = 'qc-feedback ' + (correct ? 'success' : 'warn');
          fb.querySelector('.qc-prefix').textContent = correct ? '✔ Richtig! ' : 'Fast – lass uns gemeinsam schauen: ';
          if (correct) {
            qc.classList.add('done');
            SL.UI.reward(Store.recordQuickCheck(ch.id, qc.dataset.check, true));
          }
        });
      });

      // Theorie gelesen, sobald das Ende sichtbar wird
      if (observer) observer.disconnect();
      const end = document.getElementById('theory-end');
      if ('IntersectionObserver' in window && end) {
        observer = new IntersectionObserver((entries) => {
          if (entries.some((en) => en.isIntersecting)) {
            const res = Store.markTheorySeen(ch.id);
            if (res) {
              SL.UI.toast(`📖 Kapitel „${esc(ch.title)}“ gelesen!`, 'success');
              SL.UI.reward(res);
            }
            observer.disconnect();
          }
        });
        observer.observe(end);
      }
      Store.setLastTheory(ch.id, ch.title);
    }

    /* ---------- Aufgaben ---------- */
    const variants = {};
    function taskView(id, diff, index) {
      const ch = byId(id);
      if (!ch || !Store.DIFFS.includes(diff)) return overview();
      const total = Store.TASKS_PER_DIFF[diff];
      index = Math.max(0, Math.min(total - 1, Number(index) || 0));
      const key = `${id}-${diff}-${index}`;
      const task = SL.Tasks.get(ch.id, diff, index, variants[key] || 0);
      const c = Store.state.chapters[ch.id];
      const t = c ? c.tasks[diff] : { correct: [], wrong: [], done: [] };

      main.innerHTML = `
        <nav class="crumbs"><a href="#">📚 Kapitel</a> › <a href="#kapitel/${ch.id}">${ch.icon} ${esc(ch.title)}</a> › <span>${DIFF_LABEL[diff]}</span></nav>
        <div class="diff-tabs" role="tablist">
          ${Store.DIFFS.map((d) => `<a role="tab" aria-selected="${d === diff}" class="${d === diff ? 'active' : ''}" href="#kapitel/${ch.id}/aufgaben/${d}/0">${DIFF_ICON[d]} ${DIFF_LABEL[d]}</a>`).join('')}
        </div>
        <div class="task-dots" aria-label="Aufgabenübersicht">
          ${Array.from({ length: total }, (_, i) => `<a href="#kapitel/${ch.id}/aufgaben/${diff}/${i}" class="${i === index ? 'current' : ''} ${t.correct.includes(i) ? 'ok' : t.wrong.includes(i) ? 'wrong' : t.done.includes(i) ? 'seen' : ''}" aria-label="Aufgabe ${i + 1}">${i + 1}</a>`).join('')}
        </div>
        <div id="player"></div>`;

      SL.TaskPlayer.mount(document.getElementById('player'), {
        task,
        positionLabel: `Aufgabe ${index + 1} von ${total}`,
        progress: t.correct.length / total,
        onPrev: index > 0 ? () => SL.Router.go(`kapitel/${ch.id}/aufgaben/${diff}/${index - 1}`) : null,
        onNext: index < total - 1 ? () => SL.Router.go(`kapitel/${ch.id}/aufgaben/${diff}/${index + 1}`) : () => SL.Router.go(`kapitel/${ch.id}`),
        onNewNumbers: () => { variants[key] = (variants[key] || 0) + 1; taskView(id, diff, index); },
        onDone: () => {
          const dot = main.querySelector(`.task-dots a:nth-child(${index + 1})`);
          const cc = Store.state.chapters[ch.id].tasks[diff];
          if (dot) dot.className = `current ${cc.correct.includes(index) ? 'ok' : 'wrong'}`;
        },
      });
      Store.setLastTask(ch.id, diff, index, ch.title);
    }

    /* ---------- Tutor-Modus ---------- */
    function tutorView(id) {
      const ch = byId(id);
      if (!ch) return overview();
      const c = Store.chapter(ch.id);
      let diff = 'easy', index = 0;
      const findOpen = (d) => {
        for (let i = 0; i < Store.TASKS_PER_DIFF[d]; i++) if (!c.tasks[d].correct.includes(i)) return i;
        return -1;
      };
      for (const d of ['easy', 'medium', 'hard']) {
        const i = findOpen(d);
        if (i >= 0) { diff = d; index = i; break; }
      }
      const task = SL.Tasks.get(ch.id, diff, index);
      main.innerHTML = `
        <nav class="crumbs"><a href="#">📚 Kapitel</a> › <a href="#kapitel/${ch.id}">${ch.icon} ${esc(ch.title)}</a> › <span>Gemeinsam lernen</span></nav>
        <section class="tutor-intro card">
          <h1>🤝 Gemeinsam lernen</h1>
          <p>Wir lösen die Aufgabe <strong>zusammen</strong>. Ich stelle dir kleine Zwischenfragen. Wenn etwas nicht klappt, schauen wir es gemeinsam an – ganz ohne Druck.</p>
        </section>
        <div id="player"></div>`;
      SL.TaskPlayer.mount(document.getElementById('player'), {
        task,
        positionLabel: `${DIFF_LABEL[diff]} · Aufgabe ${index + 1}`,
        startTutor: true,
        onNext: () => tutorView(id),
      });
      Store.setLastTask(ch.id, diff, index, ch.title);
    }

    /* ---------- Formelsammlung ---------- */
    function formulas() {
      const groups = SL.Data.formeln.groups;
      main.innerHTML = `
        <nav class="crumbs"><a href="#">📚 Kapitel</a> › <span>Formelsammlung</span></nav>
        <section class="page-head"><h1>📐 Formelsammlung</h1><p class="lead">Alle wichtigen Formeln auf einen Blick – mit dem Hinweis, wann du sie brauchst.</p>
          <button class="btn btn-secondary" onclick="window.print()">🖨️ Drucken</button></section>
        ${groups.map((g) => `<section class="card"><div class="card-head"><h2>${esc(g.title)}</h2><a class="link" href="#kapitel/${g.chapter}">Zum Kapitel →</a></div>
          <dl class="formula-list">${g.items.map((i) => `<div><dt>${esc(i.name)}</dt><dd><code>${esc(i.formula)}</code>${i.when ? `<small>${esc(i.when)}</small>` : ''}</dd></div>`).join('')}</dl></section>`).join('')}`;
    }

    SL.Router
      .add('', overview)
      .add('formeln', formulas)
      .add('kapitel/:id', (p) => chapterView(p.id))
      .add('kapitel/:id/aufgaben/:diff/:index', (p) => taskView(p.id, p.diff, p.index))
      .add('tutor/:id', (p) => tutorView(p.id))
      .otherwise(overview)
      .start();
  }

  SL.ready(() => {
    if (document.body.dataset.page === 'lernen') page();
  });
})();
