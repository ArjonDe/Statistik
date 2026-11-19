/**
 * storage.js
 * ---------------------------------------------------------------
 * Speichert den kompletten Lernstand dauerhaft im localStorage und
 * berechnet daraus alles, was die Plattform „weiß“:
 *   XP, Level, Badges, Stärken, Schwächen, Lernzeit,
 *   Klausurprognose, Empfehlungen, Export und Import.
 *
 * Öffentliche API: window.SL.Store und window.SL.Game
 */
(function () {
  'use strict';
  const SL = (window.SL = window.SL || {});

  const KEY = 'statistik-lernplattform-v1';
  const VERSION = 1;
  const TASKS_PER_DIFF = { easy: 30, medium: 20, hard: 10 };
  const DIFFS = ['easy', 'medium', 'hard'];
  const XP_PER_DIFF = { easy: 10, medium: 20, hard: 40 };

  /* ===================== Gamification ===================== */
  const LEVELS = [
    { level: 1, name: 'Statistik-Noob', xp: 0, icon: '🐣' },
    { level: 2, name: 'Überlebender', xp: 150, icon: '🧗' },
    { level: 3, name: 'Klausurkämpfer', xp: 400, icon: '⚔️' },
    { level: 4, name: 'Datenkrieger', xp: 800, icon: '🛡️' },
    { level: 5, name: 'Bayes-Meister', xp: 1400, icon: '🧙' },
    { level: 6, name: 'Regressionsprofi', xp: 2200, icon: '📈' },
    { level: 7, name: 'Statistik-Guru', xp: 3200, icon: '🧘' },
    { level: 8, name: 'Statistik-Gott', xp: 4500, icon: '⚡' },
  ];

  /** Badges: check(state) liefert true, sobald das Badge verdient ist. */
  const BADGES = [
    { id: 'erster-schritt', name: 'Erster Schritt', icon: '👣', desc: 'Die erste Aufgabe richtig gelöst.', check: (s) => totalCorrect(s) >= 1 },
    { id: 'mittelwert-meister', name: 'Mittelwert Meister', icon: '⚖️', desc: '10 Aufgaben zu Lagemaßen richtig.', check: (s) => chapterCorrect(s, 4) >= 10 },
    { id: 'std-held', name: 'Standardabweichungs Held', icon: '🦸', desc: '10 Aufgaben zu Streuungsmaßen richtig.', check: (s) => chapterCorrect(s, 5) >= 10 },
    { id: 'gini-gott', name: 'Gini Gott', icon: '🧞', desc: '5 Aufgaben zu Lorenzkurve & Gini richtig.', check: (s) => chapterCorrect(s, 6) >= 5 },
    { id: 'bayes-boss', name: 'Bayes Boss', icon: '🕵️', desc: '8 Aufgaben zu Bayes richtig.', check: (s) => chapterCorrect(s, 10) >= 8 },
    { id: 'konfidenz-koenig', name: 'Konfidenz König', icon: '👑', desc: '8 Aufgaben zu Konfidenzintervallen richtig.', check: (s) => chapterCorrect(s, 13) >= 8 },
    { id: 'hypothesentester', name: 'Hypothesentester', icon: '🔬', desc: '8 Aufgaben zu Hypothesentests richtig.', check: (s) => chapterCorrect(s, 14) >= 8 },
    { id: 'regressions-legende', name: 'Regressions Legende', icon: '🚀', desc: '5 Aufgaben zur Regression richtig.', check: (s) => chapterCorrect(s, 15) >= 5 },
    { id: 'klausur-bestanden', name: 'Klausur bestanden', icon: '🎓', desc: 'Eine Probe- oder Komplett-Klausur bestanden.', check: (s) => s.exams.some((e) => e.passed && e.mode !== 'mini') },
    { id: 'durchhalter', name: 'Durchhalter', icon: '🔥', desc: 'An 5 verschiedenen Tagen gelernt.', check: (s) => Object.keys(s.dailyTime).length >= 5 },
  ];

  function totalCorrect(s) {
    return Object.values(s.chapters).reduce((sum, c) => sum + DIFFS.reduce((a, d) => a + c.tasks[d].correct.length, 0), 0);
  }
  function chapterCorrect(s, id) {
    const c = s.chapters[id];
    if (!c) return 0;
    return DIFFS.reduce((a, d) => a + c.tasks[d].correct.length, 0);
  }

  /* ===================== Zustand ===================== */
  function emptyChapter() {
    return {
      theorySeen: false,
      quickChecks: [],
      tasks: {
        easy: { done: [], correct: [], wrong: [] },
        medium: { done: [], correct: [], wrong: [] },
        hard: { done: [], correct: [], wrong: [] },
      },
      lastTask: null,
    };
  }

  function emptyState() {
    return {
      version: VERSION,
      createdAt: Date.now(),
      xp: 0,
      badges: [],
      chapters: {},
      attempts: [],
      topicStats: {},
      exams: [],
      activeExam: null,
      dailyTime: {},
      totalSeconds: 0,
      sessions: [],
      lastActivity: 0,
      lastPosition: null,
      settings: { theme: 'auto', speech: true },
    };
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return emptyState();
      return normalize(JSON.parse(raw));
    } catch (e) {
      console.warn('Lernstand konnte nicht gelesen werden, starte neu.', e);
      return emptyState();
    }
  }

  /** Ergänzt fehlende Felder (z.B. nach einem Update oder Import). */
  function normalize(data) {
    const base = emptyState();
    const s = Object.assign(base, data || {});
    s.settings = Object.assign(emptyState().settings, s.settings || {});
    Object.keys(s.chapters || {}).forEach((id) => {
      const c = Object.assign(emptyChapter(), s.chapters[id]);
      DIFFS.forEach((d) => (c.tasks[d] = Object.assign({ done: [], correct: [], wrong: [] }, c.tasks[d] || {})));
      s.chapters[id] = c;
    });
    return s;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Speichern fehlgeschlagen', e);
    }
    listeners.forEach((fn) => {
      try { fn(state); } catch (err) { console.error(err); }
    });
  }

  const listeners = [];

  function chapter(id) {
    if (!state.chapters[id]) state.chapters[id] = emptyChapter();
    return state.chapters[id];
  }

  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const addUnique = (arr, v) => { if (!arr.includes(v)) arr.push(v); };
  const remove = (arr, v) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); };

  /* ===================== Level ===================== */
  function levelInfo(xp = state.xp) {
    let cur = LEVELS[0];
    LEVELS.forEach((l) => { if (xp >= l.xp) cur = l; });
    const next = LEVELS.find((l) => l.level === cur.level + 1) || null;
    const progress = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
    return { ...cur, next, progress, xp };
  }

  function addXp(amount) {
    const before = levelInfo().level;
    state.xp = Math.max(0, Math.round(state.xp + amount));
    const after = levelInfo().level;
    return after > before ? levelInfo() : null;
  }

  function checkBadges() {
    const fresh = [];
    BADGES.forEach((b) => {
      if (!state.badges.includes(b.id) && b.check(state)) {
        state.badges.push(b.id);
        fresh.push(b);
      }
    });
    return fresh;
  }

  /* ===================== Aufgaben ===================== */
  /**
   * Speichert einen Lösungsversuch.
   * info: {chapter, diff, index, correct, hints, solutionShown, seconds, tutor}
   * Rückgabe: {xp, levelUp, badges}
   */
  function recordAttempt(info) {
    const c = chapter(info.chapter);
    const t = c.tasks[info.diff];
    const firstSolve = info.correct && !t.correct.includes(info.index);
    addUnique(t.done, info.index);

    let xp = 0;
    if (info.correct && !info.solutionShown) {
      addUnique(t.correct, info.index);
      remove(t.wrong, info.index);
      if (firstSolve) {
        xp = XP_PER_DIFF[info.diff];
        if (info.hints > 0 || info.tutor) xp = Math.round(xp * 0.75);
      } else xp = 2;
    } else if (!info.correct) {
      if (!t.correct.includes(info.index)) addUnique(t.wrong, info.index);
    }

    const topic = (state.topicStats[info.chapter] = state.topicStats[info.chapter] || { correct: 0, wrong: 0, seconds: 0 });
    if (info.correct && !info.solutionShown) topic.correct++;
    else topic.wrong++;
    topic.seconds += Math.min(info.seconds || 0, 1800);

    state.attempts.push({
      t: Date.now(),
      chapter: info.chapter,
      diff: info.diff,
      index: info.index,
      correct: !!info.correct && !info.solutionShown,
      hints: info.hints || 0,
      seconds: Math.round(info.seconds || 0),
    });
    if (state.attempts.length > 3000) state.attempts = state.attempts.slice(-3000);

    const levelUp = xp ? addXp(xp) : null;
    const badges = checkBadges();
    save();
    return { xp, levelUp, badges };
  }

  function setLastTask(chapterId, diff, index, chapterTitle) {
    chapter(chapterId).lastTask = { diff, index };
    state.lastPosition = {
      type: 'task',
      chapter: chapterId,
      chapterTitle,
      diff,
      index,
      total: TASKS_PER_DIFF[diff],
      url: `lernen.html#kapitel/${chapterId}/aufgaben/${diff}/${index}`,
      time: Date.now(),
    };
    save();
  }

  function setLastTheory(chapterId, chapterTitle) {
    state.lastPosition = {
      type: 'theory',
      chapter: chapterId,
      chapterTitle,
      url: `lernen.html#kapitel/${chapterId}`,
      time: Date.now(),
    };
    save();
  }

  /** Theorie gelesen → einmalig 15 XP. */
  function markTheorySeen(chapterId) {
    const c = chapter(chapterId);
    if (c.theorySeen) return null;
    c.theorySeen = true;
    const levelUp = addXp(15);
    const badges = checkBadges();
    save();
    return { xp: 15, levelUp, badges };
  }

  function recordQuickCheck(chapterId, checkId, correct) {
    const c = chapter(chapterId);
    let xp = 0;
    if (correct && !c.quickChecks.includes(checkId)) {
      c.quickChecks.push(checkId);
      xp = 5;
    }
    const levelUp = xp ? addXp(xp) : null;
    save();
    return { xp, levelUp };
  }

  /* ===================== Klausuren ===================== */
  function recordExam(result) {
    state.exams.push(result);
    state.activeExam = null;
    const xp = Math.round(result.points / 2);
    const levelUp = addXp(xp);
    Object.entries(result.topics || {}).forEach(([ch, v]) => {
      const t = (state.topicStats[ch] = state.topicStats[ch] || { correct: 0, wrong: 0, seconds: 0 });
      const share = v.max ? v.points / v.max : 0;
      if (share >= 0.6) t.correct++; else t.wrong++;
    });
    const badges = checkBadges();
    save();
    return { xp, levelUp, badges };
  }

  function setActiveExam(exam) {
    state.activeExam = exam;
    save();
  }

  /* ===================== Lernzeit ===================== */
  const SESSION_GAP = 30 * 60 * 1000;
  /** Wird regelmäßig aufgerufen, solange die Seite sichtbar ist. */
  function tickTime(seconds) {
    const now = Date.now();
    const day = todayKey();
    state.dailyTime[day] = (state.dailyTime[day] || 0) + seconds;
    state.totalSeconds += seconds;
    const last = state.sessions[state.sessions.length - 1];
    if (!last || now - state.lastActivity > SESSION_GAP) {
      state.sessions.push({ start: now, end: now, seconds });
      if (state.sessions.length > 500) state.sessions = state.sessions.slice(-500);
    } else {
      last.end = now;
      last.seconds += seconds;
    }
    state.lastActivity = now;
    checkBadges();
    save();
  }

  /* ===================== Auswertung ===================== */
  function chapterProgress(id) {
    const c = state.chapters[id];
    if (!c) return { percent: 0, solved: 0, done: 0, total: 60, perDiff: { easy: 0, medium: 0, hard: 0 } };
    const perDiff = {};
    let solved = 0, done = 0;
    DIFFS.forEach((d) => {
      perDiff[d] = c.tasks[d].correct.length;
      solved += c.tasks[d].correct.length;
      done += c.tasks[d].done.length;
    });
    const percent = Math.min(100, Math.round((c.theorySeen ? 10 : 0) + (90 * solved) / 60));
    return { percent, solved, done, total: 60, perDiff, theorySeen: c.theorySeen };
  }

  function chapterIds() {
    return (SL.Data && SL.Data.theorie ? SL.Data.theorie.chapters : []).map((c) => c.id);
  }

  function overallProgress() {
    const ids = chapterIds();
    if (!ids.length) return 0;
    return Math.round(ids.reduce((s, id) => s + chapterProgress(id).percent, 0) / ids.length);
  }

  /** Beherrschung eines Kapitels 0..1 (geglättete Erfolgsquote × Abdeckung). */
  function mastery(id) {
    const t = state.topicStats[id];
    const prog = chapterProgress(id);
    if (!t || t.correct + t.wrong === 0) return prog.theorySeen ? 0.15 : 0;
    const rate = (t.correct + 1) / (t.correct + t.wrong + 2);
    const coverage = Math.min(1, (prog.solved + 1) / 8);
    return Math.max(0, Math.min(1, rate * (0.4 + 0.6 * coverage)));
  }

  /** Stärken & Schwächen: Kapitel mit genug Versuchen, sortiert nach Erfolgsquote. */
  function strengthsWeaknesses() {
    const chapters = SL.Data && SL.Data.theorie ? SL.Data.theorie.chapters : [];
    const rated = chapters
      .map((c) => {
        const t = state.topicStats[c.id];
        const n = t ? t.correct + t.wrong : 0;
        return { id: c.id, title: c.title, icon: c.icon, n, rate: n ? t.correct / n : 0, wrong: t ? t.wrong : 0, weight: c.examWeight || 0 };
      })
      .filter((x) => x.n >= 3);
    const strengths = rated.filter((x) => x.rate >= 0.75).sort((a, b) => b.rate - a.rate).slice(0, 4);
    const weaknesses = rated.filter((x) => x.rate < 0.6).sort((a, b) => a.rate - b.rate || b.wrong - a.wrong).slice(0, 4);
    return { strengths, weaknesses, rated };
  }

  /** Notenschlüssel (Prozent → Note). */
  function gradeFromPercent(p) {
    const scale = [[95, 1.0], [90, 1.3], [85, 1.7], [80, 2.0], [75, 2.3], [70, 2.7], [65, 3.0], [60, 3.3], [55, 3.7], [50, 4.0]];
    for (const [min, g] of scale) if (p >= min) return g;
    return 5.0;
  }

  /**
   * Klausurprognose: gewichtete Beherrschung der klausurrelevanten Kapitel,
   * vermischt mit den letzten Klausurergebnissen.
   */
  function forecast() {
    const chapters = SL.Data && SL.Data.theorie ? SL.Data.theorie.chapters : [];
    const weighted = chapters.filter((c) => c.examWeight > 0);
    const totalW = weighted.reduce((s, c) => s + c.examWeight, 0) || 1;
    const attempts = state.attempts.length;
    let expected = (weighted.reduce((s, c) => s + c.examWeight * mastery(c.id), 0) / totalW) * 100;
    const real = state.exams.filter((e) => e.mode !== 'mini').slice(-3);
    if (real.length) {
      const avg = real.reduce((s, e) => s + e.percent, 0) / real.length;
      expected = 0.35 * expected + 0.65 * avg;
    }
    const passProb = 1 / (1 + Math.exp(-(expected - 50) / 7));
    const hasData = attempts >= 5 || state.exams.length > 0;
    const improve = weighted
      .map((c) => ({ id: c.id, title: c.title, icon: c.icon, gap: c.examWeight * (1 - mastery(c.id)) }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 3);
    return {
      hasData,
      expected: Math.round(expected),
      passProb: Math.round(passProb * 100),
      grade: gradeFromPercent(expected),
      improve,
    };
  }

  /** Konkrete Empfehlung wie „Du machst die meisten Fehler bei …“. */
  function recommendation() {
    const { weaknesses } = strengthsWeaknesses();
    if (!weaknesses.length) return null;
    const w = weaknesses[0];
    const extra = Math.min(12, Math.max(5, Math.round(w.wrong * 1.5)));
    return { chapter: w.id, title: w.title, icon: w.icon, count: extra, rate: w.rate };
  }

  function stats() {
    const total = state.attempts.length;
    const correct = state.attempts.filter((a) => a.correct).length;
    const exams = state.exams;
    return {
      totalSeconds: state.totalSeconds,
      sessions: state.sessions.length,
      attempts: total,
      correct,
      successRate: total ? correct / total : 0,
      solvedUnique: totalCorrect(state),
      examsTaken: exams.length,
      examsPassed: exams.filter((e) => e.passed).length,
      avgExam: exams.length ? exams.reduce((s, e) => s + e.percent, 0) / exams.length : null,
      learningDays: Object.keys(state.dailyTime).length,
    };
  }

  /** Liste aller falsch gelösten (noch nicht korrigierten) Aufgaben. */
  function wrongTasks() {
    const list = [];
    Object.entries(state.chapters).forEach(([id, c]) => {
      DIFFS.forEach((d) => c.tasks[d].wrong.forEach((i) => list.push({ chapter: Number(id), diff: d, index: i })));
    });
    return list;
  }

  /* ===================== Export / Import ===================== */
  function exportJSON() {
    return JSON.stringify({ app: 'statistik-lernplattform', exportedAt: new Date().toISOString(), data: state }, null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    const data = parsed && parsed.data ? parsed.data : parsed;
    if (!data || typeof data !== 'object' || typeof data.xp !== 'number' || !data.chapters) {
      throw new Error('Diese Datei sieht nicht wie ein Lernstand dieser Plattform aus.');
    }
    state = normalize(data);
    save();
    return state;
  }

  function reset() {
    state = emptyState();
    save();
  }

  function setSetting(key, value) {
    state.settings[key] = value;
    save();
  }

  SL.Store = {
    KEY,
    TASKS_PER_DIFF,
    DIFFS,
    XP_PER_DIFF,
    get state() { return state; },
    save,
    onChange: (fn) => listeners.push(fn),
    chapter,
    recordAttempt,
    setLastTask,
    setLastTheory,
    markTheorySeen,
    recordQuickCheck,
    recordExam,
    setActiveExam,
    tickTime,
    chapterProgress,
    overallProgress,
    mastery,
    strengthsWeaknesses,
    gradeFromPercent,
    forecast,
    recommendation,
    stats,
    wrongTasks,
    exportJSON,
    importJSON,
    reset,
    setSetting,
    levelInfo,
    addXp: (n) => { const l = addXp(n); save(); return l; },
  };
  SL.Game = { LEVELS, BADGES };
})();
