/**
 * fortschritt.js
 * ---------------------------------------------------------------
 * Lernstatistiken (fortschritt.html): Lernzeit, Sitzungen, Erfolgsquote,
 * Klausurtrend, Stärken/Schwächen, Prognose, Badges, Export/Import.
 */
(function () {
  'use strict';
  const SL = (window.SL = window.SL || {});
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function fmtDuration(sec) {
    const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
    return h ? `${h} h ${m} min` : `${m} min`;
  }

  function render() {
    const main = document.getElementById('main');
    const Store = SL.Store;
    const st = Store.state;
    const s = Store.stats();
    const fc = Store.forecast();
    const sw = Store.strengthsWeaknesses();
    const lvl = Store.levelInfo();
    const chapters = SL.Data.theorie.chapters;
    const fmt = SL.Stat.fmt;

    // Lernzeit der letzten 14 Tage
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ label: `${d.getDate()}.${d.getMonth() + 1}.`, min: Math.round((st.dailyTime[key] || 0) / 60) });
    }
    const exams = st.exams.slice(-12);

    main.innerHTML = `
      <section class="page-head"><h1>📊 Dein Fortschritt</h1><p class="lead">Alles wird automatisch auf diesem Gerät gespeichert. Mit „Daten exportieren“ sicherst du deinen Lernstand.</p></section>

      <section class="kpi-grid">
        <div class="kpi"><span>⏱ Lernzeit gesamt</span><strong>${fmtDuration(s.totalSeconds)}</strong></div>
        <div class="kpi"><span>🗓 Sitzungen</span><strong>${s.sessions}</strong></div>
        <div class="kpi"><span>✅ Erfolgsquote</span><strong>${Math.round(s.successRate * 100)} %</strong></div>
        <div class="kpi"><span>📝 Bearbeitete Übungen</span><strong>${s.attempts}</strong></div>
        <div class="kpi"><span>🧠 Gelöste Aufgaben</span><strong>${s.solvedUnique}</strong></div>
        <div class="kpi"><span>🎓 Klausuren bestanden</span><strong>${s.examsPassed} / ${s.examsTaken}</strong></div>
        <div class="kpi"><span>📈 Ø Klausurergebnis</span><strong>${s.avgExam === null ? '–' : Math.round(s.avgExam) + ' %'}</strong></div>
        <div class="kpi"><span>${lvl.icon} Level</span><strong>${lvl.level} · ${esc(lvl.name)}</strong></div>
      </section>

      <section class="card forecast ${fc.hasData ? (fc.passProb >= 80 ? 'good' : fc.passProb >= 50 ? 'mid' : 'low') : ''}">
        <div class="forecast-main">
          <div class="gauge" style="--p:${fc.hasData ? fc.passProb : 0}"><strong>${fc.hasData ? fc.passProb + '%' : '?'}</strong><span>Bestehens&shy;wahrscheinlichkeit</span></div>
          <div>
            <h2>🎓 Klausurprognose</h2>
            ${fc.hasData ? `<p>Bestehenswahrscheinlichkeit: <strong>${fc.passProb} %</strong></p><p>Geschätzte Note: <strong class="grade">${fmt(fc.grade, 1, true)}</strong></p>
              <p>Noch verbessern:</p><ul class="nice-list">${fc.improve.map((i) => `<li><a href="lernen.html#kapitel/${i.id}">${i.icon} ${esc(i.title)}</a></li>`).join('')}</ul>`
              : '<p>Für eine Prognose brauche ich noch ein paar gelöste Aufgaben (mindestens 5) oder eine Klausur.</p>'}
            <p class="muted small">Die Prognose gewichtet die Kapitel so, wie sie in der echten Klausur vorkommen (Regression, Tests, Indizes, Deskriptiv und Bayes zählen am meisten).</p>
          </div>
        </div>
      </section>

      <section>
        <article class="card"><h2>⏱ Lernzeit pro Tag (Minuten)</h2>${SL.Charts.bars({ labels: days.map((d) => d.label), values: days.map((d) => d.min), height: 240, valueFmt: (v) => fmt(v, 0) })}</article>
        <article class="card"><h2>📈 Punkteentwicklung (Klausuren)</h2>${exams.length ? SL.Charts.line({ labels: exams.map((e, i) => `#${st.exams.length - exams.length + i + 1}`), values: exams.map((e) => Math.round(e.percent)), min: 0, max: 100, height: 240, refLine: { value: 50, label: 'Bestehensgrenze' } }) : '<p class="muted">Noch keine Klausur geschrieben. <a href="klausuren.html#start/mini">Mini-Klausur starten →</a></p>'}</article>
      </section>

      <section class="card"><h2>📚 Kapitel-Fortschritt</h2>${SL.Charts.hbars(chapters.map((c) => {
        const p = Store.chapterProgress(c.id).percent;
        return { label: `${c.id}. ${c.title}`, value: p, cls: p >= 70 ? 'bar-ok' : p >= 30 ? 'bar' : 'bar-low' };
      }), { labelWidth: 250 })}</section>

      <section class="grid grid-2">
        <article class="card"><h2>💪 Stärken</h2>${sw.strengths.length ? `<div class="chips">${sw.strengths.map((x) => `<span class="chip chip-success">${x.icon} ${esc(x.title)} · ${Math.round(x.rate * 100)}%</span>`).join('')}</div>` : '<p class="muted">Noch keine Stärken erkannt – dafür braucht es mindestens 3 Versuche pro Kapitel.</p>'}</article>
        <article class="card"><h2>🧩 Schwächen</h2>${sw.weaknesses.length ? `<div class="chips">${sw.weaknesses.map((x) => `<a class="chip chip-warning" href="quiz.html#training/${x.id}/8">${x.icon} ${esc(x.title)} · ${Math.round(x.rate * 100)}%</a>`).join('')}</div>` : '<p class="muted">Keine Schwächen erkannt.</p>'}</article>
      </section>

      <section class="card"><h2>🏅 Badges</h2><div class="badge-grid">${SL.Game.BADGES.map((b) => {
        const has = st.badges.includes(b.id);
        return `<div class="badge-tile ${has ? 'earned' : ''}"><span>${has ? b.icon : '🔒'}</span><strong>${esc(b.name)}</strong><small>${esc(b.desc)}</small></div>`;
      }).join('')}</div></section>

      <section class="card"><h2>🪜 Levels</h2><ol class="level-list">${SL.Game.LEVELS.map((l) => `<li class="${lvl.level >= l.level ? 'reached' : ''} ${lvl.level === l.level ? 'current' : ''}"><span>${l.icon}</span><strong>Level ${l.level}: ${esc(l.name)}</strong><small>ab ${l.xp} XP</small></li>`).join('')}</ol></section>

      <section class="card data-card">
        <h2>💾 Daten sichern</h2>
        <p>Dein Lernstand liegt im Browser. Exportiere ihn als Datei, um ihn auf ein anderes Gerät mitzunehmen oder vor dem Löschen des Browserverlaufs zu sichern.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" data-export>⬇️ Daten exportieren</button>
          <label class="btn btn-secondary file-btn">⬆️ Daten importieren<input type="file" accept="application/json,.json" data-import hidden></label>
          <button class="btn btn-ghost danger" data-reset>🗑 Alles zurücksetzen</button>
        </div>
        <p class="muted small">Zuletzt aktiv: ${st.lastActivity ? new Date(st.lastActivity).toLocaleString('de-DE') : '–'}</p>
      </section>`;

    main.querySelector('[data-export]').addEventListener('click', () => {
      const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      const d = new Date();
      a.href = URL.createObjectURL(blob);
      a.download = `statistik-lernstand-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      SL.UI.toast('✅ Lernstand exportiert.', 'success');
    });
    main.querySelector('[data-import]').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        SL.UI.modal({
          title: 'Lernstand importieren?',
          html: '<p>Dein aktueller Lernstand auf diesem Gerät wird durch die Datei <strong>ersetzt</strong>.</p>',
          actions: [
            { label: 'Ja, importieren', cls: 'btn-primary', onClick: () => {
              try {
                Store.importJSON(reader.result);
                SL.UI.toast('✅ Lernstand importiert.', 'success');
                render();
              } catch (err) {
                SL.UI.toast(`❌ ${esc(err.message)}`, 'error', 5000);
              }
            } },
            { label: 'Abbrechen', cls: 'btn-ghost' },
          ],
        });
        e.target.value = '';
      };
      reader.readAsText(file);
    });
    main.querySelector('[data-reset]').addEventListener('click', () => {
      SL.UI.modal({
        title: 'Wirklich alles löschen?',
        html: '<p>XP, Badges, Fortschritt und Klausurergebnisse werden <strong>unwiderruflich</strong> gelöscht. Tipp: Exportiere vorher deine Daten.</p>',
        actions: [
          { label: 'Ja, alles löschen', cls: 'btn-danger', onClick: () => { Store.reset(); SL.UI.toast('Lernstand zurückgesetzt.', 'info'); render(); } },
          { label: 'Abbrechen', cls: 'btn-ghost' },
        ],
      });
    });
  }

  SL.ready(() => {
    if (document.body.dataset.page === 'fortschritt') render();
  });
})();
