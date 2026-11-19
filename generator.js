/**
 * generator.js
 * ---------------------------------------------------------------
 * Der Aufgabengenerator.
 *
 * Jede Aufgabe entsteht aus einer Vorlage (Template) und einem
 * Zufallsgenerator mit festem Startwert (Seed). Dadurch gilt:
 *   - „Aufgabe 12 von 30“ sieht beim nächsten Öffnen gleich aus.
 *   - „🎲 Neue Zahlen“ erzeugt dieselbe Aufgabe mit anderen Zahlen –
 *     gleiche Schwierigkeit, gleicher Lösungsweg.
 *
 * Welche Vorlagen zu welchem Kapitel/Schwierigkeitsgrad gehören,
 * steht in data/aufgaben.json.
 *
 * Aufbau einer erzeugten Aufgabe:
 * {
 *   title, text (HTML), data (HTML, optional),
 *   answers: [{label, kind:'num'|'prob'|'choice', value, alts, tol, options, correct, pts, unit}],
 *   hint, simple, steps:[{title, html, ask?}], solution
 * }
 */
(function () {
  'use strict';
  const SL = (window.SL = window.SL || {});
  const St = SL.Stat;
  const f = (x, d = 2) => St.fmt(x, d);
  const pc = (x, d = 2) => St.pct(x, d);

  /* ===================== Zufall ===================== */
  function hash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function makeRng(seed) {
    let a = seed >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r = {
      next,
      int: (a1, b1) => a1 + Math.floor(next() * (b1 - a1 + 1)),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      float: (a1, b1, d = 1) => St.round(a1 + next() * (b1 - a1), d),
      shuffle: (arr) => {
        const c = [...arr];
        for (let i = c.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [c[i], c[j]] = [c[j], c[i]];
        }
        return c;
      },
      sample: (arr, k) => r.shuffle(arr).slice(0, k),
      step: (a1, b1, s) => a1 + s * Math.floor(next() * (Math.floor((b1 - a1) / s) + 1)),
    };
    return r;
  }

  /* ===================== HTML-Helfer ===================== */
  const table = (head, rows, cls = '') =>
    `<div class="table-wrap"><table class="table ${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
      .join('')}</tbody></table></div>`;
  const fx = (html) => `<div class="formula">${html}</div>`;
  const box = (html, cls = 'tip') => `<div class="callout ${cls}">${html}</div>`;
  const frac = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
  const sqrt = (x) => `√<span class="sqrt">${x}</span>`;
  const xbar = 'x̄';

  /** Antwort-Bausteine */
  const num = (label, value, extra = {}) => ({ kind: 'num', label, value, ...extra });
  const prob = (label, value, extra = {}) => ({ kind: 'prob', label, value, ...extra });
  function choice(r, label, correctText, wrongTexts, extra = {}) {
    const options = r.shuffle([correctText, ...wrongTexts]);
    return { kind: 'choice', label, options, correct: options.indexOf(correctText), value: correctText, ...extra };
  }
  const ask = (label, value, extra = {}) => ({ kind: 'num', label, value, ...extra });
  const askProb = (label, value, extra = {}) => ({ kind: 'prob', label, value, ...extra });
  const step = (title, html, askObj) => (askObj ? { title, html, ask: askObj } : { title, html });

  const DECISION_REJECT = 'H₀ wird abgelehnt (verworfen)';
  const DECISION_KEEP = 'H₀ wird nicht abgelehnt (beibehalten)';

  /* ===================== Gemeinsame Datensätze ===================== */
  const SCENARIOS = [
    { ctx: 'Eine Hochschule befragt 200 ihrer 5.000 Studierenden nach ihrem monatlichen Budget.', gg: 'alle 5.000 Studierenden der Hochschule', sp: 'die 200 befragten Studierenden', mt: 'eine einzelne befragte Person (Studierende/r)', mm: 'das monatliche Budget', ap: '850 €' },
    { ctx: 'Ein Supermarkt misst bei 80 von 1.200 Kunden eines Tages die Wartezeit an der Kasse.', gg: 'alle 1.200 Kunden dieses Tages', sp: 'die 80 beobachteten Kunden', mt: 'ein einzelner Kunde', mm: 'die Wartezeit an der Kasse', ap: '4 Minuten' },
    { ctx: 'Ein Autohersteller prüft 50 Autos aus der Tagesproduktion von 900 Autos auf den Spritverbrauch.', gg: 'alle 900 an diesem Tag produzierten Autos', sp: 'die 50 geprüften Autos', mt: 'ein einzelnes Auto', mm: 'der Spritverbrauch', ap: '6,2 Liter pro 100 km' },
    { ctx: 'Ein Fitnessstudio fragt 120 seiner 2.000 Mitglieder, wie oft sie pro Woche trainieren.', gg: 'alle 2.000 Mitglieder des Studios', sp: 'die 120 befragten Mitglieder', mt: 'ein einzelnes Mitglied', mm: 'die Anzahl Trainings pro Woche', ap: '3 Trainings' },
    { ctx: 'Eine Firma will die Dauer dienstlicher Telefonate wissen und wertet 300 von 10.000 Gesprächen des Monats aus.', gg: 'alle 10.000 dienstlichen Telefonate des Monats', sp: 'die 300 ausgewerteten Telefonate', mt: 'ein einzelnes Telefonat', mm: 'die Gesprächsdauer', ap: '7,5 Minuten' },
    { ctx: 'Ein Streamingdienst befragt 1.000 von 80.000 Abonnenten nach ihrem Lieblingsgenre.', gg: 'alle 80.000 Abonnenten', sp: 'die 1.000 befragten Abonnenten', mt: 'ein einzelner Abonnent', mm: 'das Lieblingsgenre', ap: 'Komödie' },
    { ctx: 'Eine Bäckerei wiegt 40 von 600 Broten, die heute gebacken wurden.', gg: 'alle 600 heute gebackenen Brote', sp: 'die 40 gewogenen Brote', mt: 'ein einzelnes Brot', mm: 'das Gewicht', ap: '998 Gramm' },
    { ctx: 'Eine Stadt befragt 400 von 60.000 Haushalten nach der Anzahl der Personen im Haushalt.', gg: 'alle 60.000 Haushalte der Stadt', sp: 'die 400 befragten Haushalte', mt: 'ein einzelner Haushalt', mm: 'die Haushaltsgröße', ap: '2 Personen' },
    { ctx: 'Ein Online-Shop wertet 250 von 15.000 Bestellungen des Jahres nach der Zahlungsart aus.', gg: 'alle 15.000 Bestellungen des Jahres', sp: 'die 250 ausgewerteten Bestellungen', mt: 'eine einzelne Bestellung', mm: 'die Zahlungsart', ap: 'PayPal' },
    { ctx: 'Eine Klinik misst bei 60 von 900 Patienten des Quartals den Blutdruck.', gg: 'alle 900 Patienten des Quartals', sp: 'die 60 gemessenen Patienten', mt: 'ein einzelner Patient', mm: 'der Blutdruck', ap: '128 mmHg' },
  ];

  const FEATURES = [
    ['Haarfarbe', 'nominal'], ['Beruf', 'nominal'], ['Geschlecht', 'nominal'], ['Blutgruppe', 'nominal'], ['Lieblingsfarbe', 'nominal'],
    ['Studiengang', 'nominal'], ['Automarke', 'nominal'], ['Postleitzahl', 'nominal'], ['Familienstand', 'nominal'], ['Zahlungsart', 'nominal'],
    ['Religionszugehörigkeit', 'nominal'], ['Nationalität', 'nominal'],
    ['Schulnote (1 bis 6)', 'ordinal'], ['soziale Stellung', 'ordinal'], ['Qualität von Wein (gut/mittel/schlecht)', 'ordinal'], ['Kleidergröße (S/M/L/XL)', 'ordinal'],
    ['Hotelsterne', 'ordinal'], ['Zufriedenheit (sehr zufrieden … gar nicht)', 'ordinal'], ['Bildungsabschluss', 'ordinal'], ['Dienstgrad beim Militär', 'ordinal'],
    ['Platzierung im Rennen', 'ordinal'], ['Schmerzstärke (leicht/mittel/stark)', 'ordinal'],
    ['Einkommen in €', 'metrisch'], ['Körperlänge in cm', 'metrisch'], ['Alter in Jahren', 'metrisch'], ['Zahl der Kontobewegungen pro Monat', 'metrisch'],
    ['Gewicht in kg', 'metrisch'], ['Temperatur in °C', 'metrisch'], ['Wartezeit in Minuten', 'metrisch'], ['Umsatz in €', 'metrisch'],
    ['Anzahl der Kinder', 'metrisch'], ['Kilometerleistung pro Jahr', 'metrisch'], ['Preis eines Produkts', 'metrisch'], ['Mietdauer in Monaten', 'metrisch'],
  ];
  const SCALE_LABEL = { nominal: 'nominal', ordinal: 'ordinal', metrisch: 'metrisch (kardinal)' };

  /** Kontexte für klassierte Daten (Klassengrenzen + typische Fallzahlen). */
  const GROUPED = [
    { name: 'Jahresfahrleistung', unit: 'km', who: 'Autobesitzer', head: 'Kilometerleistung', bounds: [[0, 10000, 24000, 38000, 72000, 120000], [0, 10000, 25000, 40000, 80000, 120000]], counts: [[300, 420], [330, 470], [300, 450], [120, 220], [60, 120]], step: 10 },
    { name: 'Betriebszugehörigkeit', unit: 'Jahre', who: 'Arbeitnehmer', head: 'Betriebszugehörigkeit (Jahre)', bounds: [[0, 2, 4, 7, 12, 20]], counts: [[6, 14], [24, 40], [50, 80], [24, 40], [16, 30]], step: 2 },
    { name: 'Nettoeinkommen', unit: '€', who: 'Haushalte', head: 'Monatliches Nettoeinkommen (€)', bounds: [[0, 1000, 2000, 3000, 5000, 8000], [500, 1500, 2500, 3500, 5000, 9000]], counts: [[40, 90], [120, 200], [140, 220], [80, 140], [20, 60]], step: 10 },
    { name: 'Wartezeit', unit: 'Minuten', who: 'Kunden', head: 'Wartezeit (Minuten)', bounds: [[0, 5, 10, 20, 30, 60]], counts: [[60, 110], [80, 140], [70, 120], [30, 60], [10, 30]], step: 5 },
    { name: 'Alter', unit: 'Jahre', who: 'Vereinsmitglieder', head: 'Alter (Jahre)', bounds: [[18, 25, 35, 45, 60, 80]], counts: [[40, 70], [60, 100], [70, 110], [50, 90], [20, 40]], step: 5 },
  ];

  function genGrouped(r) {
    const ctx = r.pick(GROUPED);
    const b = r.pick(ctx.bounds);
    const classes = [];
    for (let i = 0; i < 5; i++) classes.push({ lo: b[i], hi: b[i + 1], n: r.step(ctx.counts[i][0], ctx.counts[i][1], ctx.step) });
    const g = St.grouped(classes);
    const unitFmt = (x) => `${f(x, ctx.unit === '€' || ctx.unit === 'km' ? 0 : 2)} ${ctx.unit}`;
    const label = (c, i) => (i === 0 ? `${c.lo === 0 ? 'bis' : f(c.lo, 0) + ' bis'} ${f(c.hi, 0)}` : `mehr als ${f(c.lo, 0)} bis ${f(c.hi, 0)}`);
    const dataTable = table([ctx.head, `Anzahl der ${ctx.who}`], classes.map((c, i) => [label(c, i), c.n]).concat([['<strong>Summe</strong>', `<strong>${g.n}</strong>`]]));
    return { ctx, classes, g, unitFmt, label, dataTable };
  }

  function groupedMeanSteps(G) {
    const { g, ctx } = G;
    return [
      step('Was ist gefragt?', `Wir sollen den Durchschnitt (arithmetisches Mittel) berechnen. Wir kennen aber nicht die einzelnen Werte – nur die <strong>Klassen</strong>. Deshalb tun wir so, als läge jeder Wert genau in der <strong>Klassenmitte</strong>.`),
      step('Klassenmitten bestimmen', `Klassenmitte = (Untergrenze + Obergrenze) / 2${table(['Klasse', 'Mitte mⱼ', 'nⱼ', 'mⱼ · nⱼ'], g.rows.map((rw, i) => [G.label(rw, i), f(rw.mid, 2), rw.n, f(rw.mid * rw.n, 2)]))}`),
      step('Formel', fx(`${xbar} = ${frac('Σ mⱼ · nⱼ', 'n')}`) + 'Wir addieren alle „Mitte mal Anzahl“ und teilen durch die Gesamtzahl.'),
      step('Einsetzen und rechnen', fx(`${xbar} = ${frac(f(St.sum(g.rows.map((rw) => rw.mid * rw.n)), 2), g.n)} = <strong>${f(g.mean, 2)}</strong>`), ask(`Mittelwert (${ctx.unit})`, g.mean)),
    ];
  }

  function groupedSdSteps(G) {
    const { g, ctx } = G;
    return [
      step('Idee', 'Die Standardabweichung sagt: <em>Wie weit liegen die Werte im Schnitt vom Mittelwert weg?</em> Bei Klassen rechnen wir wieder mit den Klassenmitten.'),
      step('Mittelwert zuerst', fx(`${xbar} = ${f(g.mean, 2)}`)),
      step('Abweichungen quadrieren', table(['Mitte mⱼ', 'mⱼ − x̄', '(mⱼ − x̄)²', 'nⱼ · (mⱼ − x̄)²'], g.rows.map((rw) => [f(rw.mid, 2), f(rw.mid - g.mean, 2), f((rw.mid - g.mean) ** 2, 2), f(rw.n * (rw.mid - g.mean) ** 2, 2)]))),
      step('Varianz', fx(`s² = ${frac('Σ nⱼ · (mⱼ − x̄)²', 'n')} = ${frac(f(g.variance * g.n, 2), g.n)} = ${f(g.variance, 2)}`), ask('Varianz', g.variance, { rel: 0.02 })),
      step('Wurzel ziehen', fx(`s = ${sqrt(f(g.variance, 2))} = <strong>${f(g.sd, 2)}</strong> ${ctx.unit}`), ask(`Standardabweichung (${ctx.unit})`, g.sd)),
    ];
  }

  function groupedQuantileSteps(G, pAbove) {
    const { g } = G;
    const p = 1 - pAbove;
    const q = g.quantile(p);
    const rw = q.row;
    return {
      value: q.value,
      steps: [
        step('Übersetzen', `„Wird von ${f(pAbove * 100, 0)} % überschritten“ heißt: <strong>${f(pAbove * 100, 0)} % liegen darüber</strong>, also liegen <strong>${f(p * 100, 0)} % darunter</strong>. Wir suchen den Wert, unter dem ${f(p * 100, 0)} % der Leute liegen.`),
        step('Wie viele Personen sind das?', fx(`${f(p, 2)} · ${g.n} = <strong>${f(q.target, 2)}</strong>`), ask('Gesuchte Position (Anzahl)', q.target)),
        step('Kumulierte Häufigkeiten', `Wir zählen von oben nach unten zusammen, bis wir ${f(q.target, 2)} überschreiten:${table(['Klasse', 'nⱼ', 'kumuliert'], g.rows.map((x, i) => [G.label(x, i), x.n, x === rw ? `<strong>${x.cumAbs}</strong> ← hier` : x.cumAbs]))}Der gesuchte Wert liegt in der Klasse <strong>${G.label(rw, g.rows.indexOf(rw))}</strong>.`),
        step('Formel (lineare Interpolation)', fx(`x = Untergrenze + ${frac('Position − kumuliert davor', 'nⱼ')} · Klassenbreite`) + 'Wir tun so, als wären die Personen in der Klasse gleichmäßig verteilt.'),
        step('Einsetzen', fx(`x = ${f(rw.lo, 2)} + ${frac(`${f(q.target, 2)} − ${rw.cumBefore}`, rw.n)} · ${f(rw.width, 2)} = <strong>${f(q.value, 2)}</strong>`), ask('Gesuchter Wert', q.value)),
      ],
    };
  }

  function groupedBetweenSteps(G, a, b) {
    const { g } = G;
    const Fa = g.F(a), Fb = g.F(b);
    const findRow = (x) => g.rows.find((rw) => x > rw.lo && x <= rw.hi) || g.rows[0];
    const ra = findRow(a), rb = findRow(b);
    const part = (x, rw, Fx) => fx(`F(${f(x, 0)}) = ${frac(`${rw.cumBefore} + ${frac(`${f(x, 0)} − ${f(rw.lo, 0)}`, f(rw.width, 0))} · ${rw.n}`, g.n)} = ${f(Fx, 4)}`);
    return {
      value: Fb - Fa,
      steps: [
        step('Was ist gefragt?', `Wir suchen den Anteil der Werte zwischen ${f(a, 0)} und ${f(b, 0)}. Trick: <strong>Anteil bis ${f(b, 0)}</strong> minus <strong>Anteil bis ${f(a, 0)}</strong>.`),
        step(`Anteil bis ${f(a, 0)}`, `${f(a, 0)} liegt in der Klasse ${G.label(ra, g.rows.indexOf(ra))}. Davor liegen ${ra.cumBefore} Personen. Dazu kommt der passende Teil der Klasse:` + part(a, ra, Fa), askProb(`Anteil bis ${f(a, 0)}`, Fa)),
        step(`Anteil bis ${f(b, 0)}`, `${f(b, 0)} liegt in der Klasse ${G.label(rb, g.rows.indexOf(rb))}. Davor liegen ${rb.cumBefore} Personen:` + part(b, rb, Fb), askProb(`Anteil bis ${f(b, 0)}`, Fb)),
        step('Differenz bilden', fx(`${f(Fb, 4)} − ${f(Fa, 4)} = <strong>${f(Fb - Fa, 4)}</strong> ≈ ${pc(Fb - Fa)}`), askProb('Anteil dazwischen', Fb - Fa)),
      ],
    };
  }

  function pickInside(r, g, minIdx, maxIdx) {
    const rw = g.rows[r.int(minIdx, maxIdx)];
    const w = rw.width;
    const unit = w >= 1000 ? 1000 : w >= 10 ? 1 : w >= 2 ? 1 : 0.5;
    let x = rw.lo + Math.round((w * r.float(0.2, 0.8, 2)) / unit) * unit;
    if (x <= rw.lo) x = rw.lo + unit;
    if (x >= rw.hi) x = rw.hi - unit;
    return x;
  }

  /* ===================== Vorlagen ===================== */
  const T = {};

  /* ---------- Kapitel 1: Grundbegriffe ---------- */
  const ROLE = {
    gg: { name: 'Grundgesamtheit', q: 'Was ist hier die <strong>Grundgesamtheit</strong>?', expl: 'Die Grundgesamtheit sind <em>alle</em>, über die wir eine Aussage machen wollen – nicht nur die Befragten.' },
    sp: { name: 'Stichprobe', q: 'Was ist hier die <strong>Stichprobe</strong>?', expl: 'Die Stichprobe ist der Teil der Grundgesamtheit, den wir uns wirklich anschauen.' },
    mt: { name: 'Merkmalsträger', q: 'Wer oder was ist hier ein <strong>Merkmalsträger</strong> (statistische Einheit)?', expl: 'Der Merkmalsträger ist das <em>einzelne</em> Objekt, an dem wir etwas messen.' },
    mm: { name: 'Merkmal', q: 'Was ist hier das <strong>Merkmal</strong>?', expl: 'Das Merkmal ist die Eigenschaft, die wir untersuchen – quasi die Frage im Fragebogen.' },
    ap: { name: 'Merkmalsausprägung', q: 'Was ist eine mögliche <strong>Merkmalsausprägung</strong>?', expl: 'Die Ausprägung ist ein konkreter Wert des Merkmals – quasi die Antwort im Fragebogen.' },
  };

  T['k1-rollen'] = {
    title: 'Grundbegriffe erkennen',
    gen(r) {
      const sc = r.pick(SCENARIOS);
      const role = r.pick(Object.keys(ROLE));
      const others = Object.keys(ROLE).filter((k) => k !== role);
      const a = choice(r, ROLE[role].name, sc[role], r.sample(others, 3).map((k) => sc[k]));
      return {
        text: `<p>${sc.ctx}</p><p>${ROLE[role].q}</p>`,
        answers: [a],
        hint: ROLE[role].expl,
        simple: 'Stell dir einen Fragebogen vor: Die <strong>Grundgesamtheit</strong> sind alle, die man fragen <em>könnte</em>. Die <strong>Stichprobe</strong> sind die, die man <em>wirklich</em> fragt. Jede einzelne befragte Person ist ein <strong>Merkmalsträger</strong>. Die <strong>Frage</strong> ist das Merkmal, die <strong>Antwort</strong> die Ausprägung.',
        steps: [
          step('Was ist gefragt?', `Gesucht ist die <strong>${ROLE[role].name}</strong>.`),
          step('Begriff klären', ROLE[role].expl),
          step('Im Text suchen', `Hier gilt:<ul><li>Grundgesamtheit: ${sc.gg}</li><li>Stichprobe: ${sc.sp}</li><li>Merkmalsträger: ${sc.mt}</li><li>Merkmal: ${sc.mm}</li><li>Ausprägung: z. B. ${sc.ap}</li></ul>`),
        ],
        solution: `<strong>${ROLE[role].name}:</strong> ${sc[role]}`,
      };
    },
  };

  const VOLL = [
    ['Bei der Bundestagswahl werden alle abgegebenen Stimmen ausgezählt.', 'Vollerhebung'],
    ['Ein Meinungsforschungsinstitut befragt 1.500 Wahlberechtigte.', 'Stichprobe'],
    ['Der Lehrer trägt die Noten aller 28 Schüler seiner Klasse ein.', 'Vollerhebung'],
    ['Eine Brauerei prüft 30 Flaschen aus einer Tagesproduktion von 20.000 Flaschen.', 'Stichprobe'],
    ['Beim Zensus werden alle Haushalte eines Landes erfasst.', 'Vollerhebung'],
    ['Ein Crashtest wird mit 5 Autos einer Serie durchgeführt.', 'Stichprobe'],
    ['Die Personalabteilung wertet die Gehälter aller 120 Mitarbeiter aus.', 'Vollerhebung'],
    ['Eine Ärztin testet ein Medikament an 400 Freiwilligen.', 'Stichprobe'],
    ['Ein Kino zählt alle verkauften Tickets eines Abends.', 'Vollerhebung'],
    ['Ein Labor untersucht 10 Proben aus einem See auf Bakterien.', 'Stichprobe'],
    ['Eine Firma prüft die Lebensdauer von 50 Festplatten einer Serie.', 'Stichprobe'],
    ['Die Inventur erfasst jeden Artikel im Lager.', 'Vollerhebung'],
  ];
  T['k1-vollerhebung'] = {
    title: 'Vollerhebung oder Stichprobe?',
    gen(r) {
      const [txt, sol] = r.pick(VOLL);
      const a = choice(r, 'Art der Erhebung', sol, [sol === 'Vollerhebung' ? 'Stichprobe' : 'Vollerhebung']);
      return {
        text: `<p>${txt}</p><p>Ist das eine <strong>Vollerhebung</strong> oder eine <strong>Stichprobe</strong>?</p>`,
        answers: [a],
        hint: 'Frag dich: Wird <em>wirklich jedes</em> Element angeschaut – oder nur ein Teil?',
        simple: 'Suppe probieren: Du isst nicht den ganzen Topf, um zu wissen, ob sie salzig ist – ein Löffel reicht. Der Löffel ist die <strong>Stichprobe</strong>. Den ganzen Topf essen wäre eine <strong>Vollerhebung</strong>.',
        steps: [
          step('Was ist gefragt?', 'Werden <em>alle</em> untersucht oder nur ein Teil?'),
          step('Hinschauen', sol === 'Vollerhebung' ? 'Hier werden wirklich <strong>alle</strong> erfasst.' : 'Hier wird nur ein <strong>Teil</strong> angeschaut – meistens, weil alles zu teuer, zu langsam oder (z. B. beim Crashtest) zerstörerisch wäre.'),
        ],
        solution: `<strong>${sol}</strong>`,
      };
    },
  };

  const DISCRETE = [
    ['Anzahl der Geschwister', 'diskret'], ['Anzahl verkaufter Autos pro Tag', 'diskret'], ['Zahl der Tore in einem Fußballspiel', 'diskret'], ['Anzahl Kontobewegungen pro Monat', 'diskret'],
    ['Anzahl der Kunden pro Stunde', 'diskret'], ['Augenzahl beim Würfeln', 'diskret'], ['Anzahl defekter Teile in einer Lieferung', 'diskret'],
    ['Körpergröße', 'stetig'], ['Gewicht eines Pakets', 'stetig'], ['Wartezeit an der Kasse', 'stetig'], ['Temperatur', 'stetig'], ['Fahrtzeit zur Arbeit', 'stetig'], ['Füllmenge einer Flasche', 'stetig'], ['Lebensdauer einer Glühbirne', 'stetig'],
  ];
  T['k1-diskret'] = {
    title: 'Diskret oder stetig?',
    gen(r) {
      const [m, sol] = r.pick(DISCRETE);
      const a = choice(r, 'Merkmalsart', sol, [sol === 'diskret' ? 'stetig' : 'diskret']);
      return {
        text: `<p>Das metrische Merkmal <strong>„${m}“</strong> – ist es <strong>diskret</strong> oder <strong>stetig</strong>?</p>`,
        answers: [a],
        hint: 'Kann man die Werte <em>abzählen</em> (0, 1, 2, …)? Dann diskret. Kann man beliebig fein messen (1,73 m … 1,7312 m)? Dann stetig.',
        simple: '<strong>Diskret</strong> = zählen (Treppenstufen: man steht auf Stufe 2 oder 3, nie auf 2,4). <strong>Stetig</strong> = messen (Rampe: jeder Zwischenwert ist möglich).',
        steps: [step('Zählen oder messen?', sol === 'diskret' ? `„${m}“ wird <strong>gezählt</strong> – es gibt nur ganze Werte.` : `„${m}“ wird <strong>gemessen</strong> – jeder Zwischenwert ist möglich.`)],
        solution: `<strong>${sol}</strong>`,
      };
    },
  };

  const STATEMENTS = [
    ['Eine Stichprobe ist immer ein Teil der Grundgesamtheit.', true],
    ['Das Merkmal „Haarfarbe“ hat die Ausprägungen blond, braun, schwarz, rot …', true],
    ['Der Merkmalsträger ist der gemessene Wert.', false],
    ['Eine Vollerhebung ist meistens billiger als eine Stichprobe.', false],
    ['Aus einer guten Zufallsstichprobe kann man auf die Grundgesamtheit schließen.', true],
    ['Die deskriptive Statistik beschreibt Daten, die induktive Statistik schließt von der Stichprobe auf die Grundgesamtheit.', true],
    ['Jede Person in einer Befragung ist ein Merkmal.', false],
    ['Eine Grundgesamtheit muss sachlich, räumlich und zeitlich abgegrenzt sein.', true],
    ['Bei einer Stichprobe werden immer alle Elemente untersucht.', false],
    ['„Alter“ ist ein Merkmal, „23 Jahre“ eine Ausprägung.', true],
  ];
  T['k1-aussage'] = {
    title: 'Stimmt das?',
    gen(r) {
      const [txt, ok] = r.pick(STATEMENTS);
      const a = choice(r, 'Aussage', ok ? 'richtig' : 'falsch', [ok ? 'falsch' : 'richtig']);
      return {
        text: `<p>Ist diese Aussage richtig oder falsch?</p><blockquote>${txt}</blockquote>`,
        answers: [a],
        hint: 'Denk an das Fragebogen-Bild: Frage = Merkmal, Antwort = Ausprägung, Person = Merkmalsträger.',
        simple: 'Grundgesamtheit = alle. Stichprobe = ein Teil davon. Merkmal = Eigenschaft. Ausprägung = konkreter Wert. Merkmalsträger = das einzelne Objekt.',
        steps: [step('Begriffe prüfen', `Die Aussage ist <strong>${ok ? 'richtig' : 'falsch'}</strong>.`)],
        solution: `Die Aussage ist <strong>${ok ? 'richtig' : 'falsch'}</strong>.`,
      };
    },
  };

  T['k1-komplett'] = {
    title: 'Erhebung komplett beschreiben',
    gen(r) {
      const sc = r.pick(SCENARIOS);
      const alt = r.sample(SCENARIOS.filter((s) => s !== sc), 3);
      const a1 = choice(r, 'Grundgesamtheit', sc.gg, [sc.sp, sc.mt, alt[0].gg], { pts: 2 });
      const a2 = choice(r, 'Merkmal', sc.mm, [sc.ap, sc.mt, alt[1].mm], { pts: 2 });
      const a3 = choice(r, 'Ausprägung', sc.ap, [sc.mm, sc.sp, alt[2].ap], { pts: 2 });
      return {
        text: `<p>${sc.ctx}</p><p>Bestimme <strong>Grundgesamtheit</strong>, <strong>Merkmal</strong> und eine mögliche <strong>Ausprägung</strong>.</p>`,
        answers: [a1, a2, a3],
        hint: 'Achtung Falle: Die Stichprobe ist <em>nicht</em> die Grundgesamtheit. Und eine Ausprägung ist ein <em>konkreter Wert</em>.',
        simple: 'Grundgesamtheit = alle, über die wir etwas wissen wollen. Merkmal = was wir wissen wollen. Ausprägung = eine konkrete Antwort.',
        steps: [
          step('Grundgesamtheit', `Über wen wollen wir etwas sagen? → <strong>${sc.gg}</strong>`),
          step('Merkmal', `Was wird gemessen/gefragt? → <strong>${sc.mm}</strong>`),
          step('Ausprägung', `Ein konkreter möglicher Wert → <strong>${sc.ap}</strong>`),
        ],
        solution: `Grundgesamtheit: ${sc.gg}<br>Merkmal: ${sc.mm}<br>Ausprägung: z. B. ${sc.ap}`,
      };
    },
  };

  /* ---------- Kapitel 2: Skalenniveaus ---------- */
  T['k2-skala'] = {
    title: 'Welches Skalenniveau?',
    gen(r) {
      const [m, sc] = r.pick(FEATURES);
      const a = choice(r, 'Skalenniveau', SCALE_LABEL[sc], Object.values(SCALE_LABEL).filter((x) => x !== SCALE_LABEL[sc]));
      return {
        text: `<p>Welches Skalenniveau hat das Merkmal <strong>„${m}“</strong>?</p>`,
        answers: [a],
        hint: 'Drei Fragen: 1) Kann man die Ausprägungen sinnvoll <em>sortieren</em>? 2) Kann man sinnvoll <em>Abstände/Differenzen</em> bilden?',
        simple: '<strong>Nominal</strong> = nur Namen (Haarfarbe). <strong>Ordinal</strong> = Reihenfolge, aber ungleiche Abstände (Schulnoten). <strong>Metrisch</strong> = echte Zahlen, mit denen man rechnen kann (Gewicht).',
        steps: [
          step('Sortierbar?', sc === 'nominal' ? `Bei „${m}“ gibt es keine natürliche Reihenfolge → <strong>nominal</strong>.` : `Ja, „${m}“ hat eine Reihenfolge.`),
          ...(sc !== 'nominal' ? [step('Abstände sinnvoll?', sc === 'ordinal' ? 'Die Abstände sind <strong>nicht</strong> gleich groß/interpretierbar → <strong>ordinal</strong>.' : 'Abstände kann man sinnvoll berechnen (z. B. „5 mehr als …“) → <strong>metrisch</strong>.')] : []),
        ],
        solution: `„${m}“ ist <strong>${SCALE_LABEL[sc]}</strong> skaliert.`,
      };
    },
  };

  T['k2-lagemass'] = {
    title: 'Welche Kennzahl ist erlaubt?',
    gen(r) {
      const [m, sc] = r.pick(FEATURES);
      const best = { nominal: 'nur der Modus', ordinal: 'Median (und Modus)', metrisch: 'arithmetisches Mittel (und Median, Modus)' }[sc];
      const a = choice(r, 'Sinnvollstes Lagemaß', best, Object.values({ nominal: 'nur der Modus', ordinal: 'Median (und Modus)', metrisch: 'arithmetisches Mittel (und Median, Modus)' }).filter((x) => x !== best));
      return {
        text: `<p>Für das Merkmal <strong>„${m}“</strong> soll ein Lagemaß berechnet werden. Welche Aussage passt?</p>`,
        answers: [a],
        hint: 'Erst das Skalenniveau bestimmen. Dann: nominal → Modus, ordinal → Median, metrisch → Mittelwert.',
        simple: 'Einen Durchschnitt von Haarfarben gibt es nicht („mittelblond“?). Bei Schulnoten kann man sortieren und die Mitte finden. Bei Gewicht kann man richtig rechnen.',
        steps: [step('Skalenniveau', `„${m}“ ist ${SCALE_LABEL[sc]}.`), step('Passende Kennzahl', `Daher: <strong>${best}</strong>.`)],
        solution: `<strong>${best}</strong>`,
      };
    },
  };

  T['k2-zusammenhang'] = {
    title: 'Welches Zusammenhangsmaß?',
    gen(r) {
      const f1 = r.pick(FEATURES);
      let f2 = r.pick(FEATURES);
      while (f2[0] === f1[0]) f2 = r.pick(FEATURES);
      const scales = [f1[1], f2[1]];
      const best = scales.includes('nominal') ? 'Kontingenzmaß (z. B. φ-Koeffizient / Kontingenzkoeffizient)' : scales.includes('ordinal') ? 'Rangkorrelation nach Spearman' : 'Korrelationskoeffizient nach Bravais-Pearson';
      const all = ['Kontingenzmaß (z. B. φ-Koeffizient / Kontingenzkoeffizient)', 'Rangkorrelation nach Spearman', 'Korrelationskoeffizient nach Bravais-Pearson'];
      return {
        text: `<p>Man möchte den Zusammenhang zwischen <strong>„${f1[0]}“</strong> und <strong>„${f2[0]}“</strong> messen.</p>`,
        answers: [
          choice(r, `Skala „${f1[0]}“`, SCALE_LABEL[f1[1]], Object.values(SCALE_LABEL).filter((x) => x !== SCALE_LABEL[f1[1]]), { pts: 1 }),
          choice(r, `Skala „${f2[0]}“`, SCALE_LABEL[f2[1]], Object.values(SCALE_LABEL).filter((x) => x !== SCALE_LABEL[f2[1]]), { pts: 1 }),
          choice(r, 'Passendes Maß', best, all.filter((x) => x !== best), { pts: 2 }),
        ],
        hint: 'Das <strong>schwächere</strong> Skalenniveau entscheidet!',
        simple: 'Eine Kette ist so stark wie ihr schwächstes Glied. Ist ein Merkmal nominal, darf man nur „nominale“ Methoden verwenden.',
        steps: [
          step('Skalen bestimmen', `„${f1[0]}“: ${SCALE_LABEL[f1[1]]}<br>„${f2[0]}“: ${SCALE_LABEL[f2[1]]}`),
          step('Schwächstes Niveau', 'nominal → Kontingenz (φ). Ordinal (beide mind. ordinal) → Spearman. Beide metrisch → Bravais-Pearson.'),
          step('Ergebnis', `<strong>${best}</strong>`),
        ],
        solution: `<strong>${best}</strong>`,
      };
    },
  };

  /* ---------- Kapitel 3: Häufigkeiten ---------- */
  const LIST_CTX = [
    { name: 'Anzahl der Kinder', unit: 'Kinder', vals: [0, 1, 2, 3, 4], w: [3, 4, 4, 2, 1] },
    { name: 'Klausurnote', unit: '', vals: [1, 2, 3, 4, 5], w: [2, 4, 5, 3, 2] },
    { name: 'Anzahl Bücher im Monat', unit: 'Bücher', vals: [0, 1, 2, 3, 4, 5], w: [2, 4, 4, 3, 2, 1] },
    { name: 'Alter (Jahre)', unit: 'Jahre', vals: [22, 23, 24, 25, 26, 27, 28], w: [1, 2, 4, 4, 3, 2, 1] },
    { name: 'Tore pro Spiel', unit: 'Tore', vals: [0, 1, 2, 3, 4, 5], w: [3, 5, 5, 3, 2, 1] },
  ];
  function genList(r, n, fixedCtx) {
    const c = fixedCtx || r.pick(LIST_CTX);
    const total = c.w.reduce((a, b) => a + b, 0);
    const vals = [];
    for (let i = 0; i < n; i++) {
      let u = r.next() * total, k = 0;
      while (u > c.w[k]) { u -= c.w[k]; k++; }
      vals.push(c.vals[Math.min(k, c.vals.length - 1)]);
    }
    return { c, vals };
  }

  T['k3-absolut'] = {
    title: 'Absolute & relative Häufigkeit',
    gen(r) {
      const n = r.pick([10, 12, 15, 20]);
      const { c, vals } = genList(r, n);
      const v = r.pick(vals);
      const h = vals.filter((x) => x === v).length;
      return {
        text: `<p>${n} Personen wurden nach „${c.name}“ gefragt:</p><p class="datalist">${vals.join('; ')}</p><p>Wie oft kommt der Wert <strong>${v}</strong> vor (absolute Häufigkeit), und wie groß ist die relative Häufigkeit?</p>`,
        answers: [num(`absolute Häufigkeit h(${v})`, h, { tol: 0 }), prob(`relative Häufigkeit f(${v})`, h / n)],
        hint: 'Absolute Häufigkeit = einfach zählen. Relative Häufigkeit = gezählt geteilt durch alle.',
        simple: 'Wenn 3 von 10 Leuten Pizza mögen, ist die absolute Häufigkeit 3 und die relative 3/10 = 0,3 = 30 %.',
        steps: [
          step('Zählen', `Wir markieren jede ${v}: ${vals.map((x) => (x === v ? `<mark>${x}</mark>` : x)).join('; ')}`, ask(`h(${v})`, h, { tol: 0 })),
          step('Relative Häufigkeit', fx(`f(${v}) = ${frac(`h(${v})`, 'n')} = ${frac(h, n)} = <strong>${f(h / n, 4)}</strong> = ${pc(h / n)}`), askProb(`f(${v})`, h / n)),
        ],
        solution: `h(${v}) = <strong>${h}</strong>, f(${v}) = <strong>${f(h / n, 4)}</strong> (${pc(h / n)})`,
      };
    },
  };

  T['k3-tabelle'] = {
    title: 'Häufigkeitstabelle lesen',
    gen(r) {
      const cats = r.pick([
        ['Bus', 'Bahn', 'Auto', 'Fahrrad', 'zu Fuß'],
        ['Komödie', 'Action', 'Drama', 'Horror', 'Doku'],
        ['PayPal', 'Kreditkarte', 'Rechnung', 'Lastschrift'],
        ['sehr zufrieden', 'zufrieden', 'neutral', 'unzufrieden'],
      ]);
      const hs = cats.map(() => r.int(5, 60));
      const n = St.sum(hs);
      const i = r.int(0, cats.length - 1);
      return {
        text: `<p>Eine Umfrage ergab folgende absolute Häufigkeiten:</p>${table(['Ausprägung', 'Anzahl'], cats.map((c, k) => [c, hs[k]]))}<p>Wie groß ist der Stichprobenumfang n, und wie viel Prozent entfallen auf <strong>„${cats[i]}“</strong>?</p>`,
        answers: [num('n', n, { tol: 0 }), prob(`relative Häufigkeit „${cats[i]}“`, hs[i] / n)],
        hint: 'n ist die Summe aller Anzahlen.',
        simple: 'Erst alle Antworten zusammenzählen. Dann: Teil durch Ganzes.',
        steps: [
          step('n berechnen', fx(`n = ${hs.join(' + ')} = <strong>${n}</strong>`), ask('n', n, { tol: 0 })),
          step('Anteil', fx(`f = ${frac(hs[i], n)} = ${f(hs[i] / n, 4)} = <strong>${pc(hs[i] / n)}</strong>`), askProb('relative Häufigkeit', hs[i] / n)),
        ],
        solution: `n = <strong>${n}</strong>; „${cats[i]}“: <strong>${pc(hs[i] / n)}</strong>`,
      };
    },
  };

  T['k3-kumuliert'] = {
    title: 'Kumulierte Häufigkeit',
    gen(r) {
      const n = r.pick([12, 15, 20, 25]);
      const { c, vals } = genList(r, n);
      const ft = St.freqTable(vals);
      const mode = r.pick(['hoechstens', 'mindestens']);
      const idx = r.int(0, ft.length - 2);
      const v = mode === 'hoechstens' ? ft[idx].value : ft[idx + 1].value;
      const share = mode === 'hoechstens' ? ft[idx].cumRel : 1 - ft[idx].cumRel;
      return {
        text: `<p>Erhoben wurde „${c.name}“ bei ${n} Personen:</p><p class="datalist">${vals.join('; ')}</p><p>Wie viel Prozent der Personen haben <strong>${mode === 'hoechstens' ? 'höchstens' : 'mindestens'} ${v}</strong>?</p>`,
        answers: [prob('Anteil', share)],
        hint: mode === 'hoechstens' ? '„Höchstens“ = der Wert selbst und alles darunter. Dafür gibt es die kumulierte relative Häufigkeit F(x).' : '„Mindestens“ = der Wert selbst und alles darüber. Trick: 1 − (alles darunter).',
        simple: '„Höchstens 2 Kinder“ heißt: 0, 1 oder 2 Kinder. Einfach diese Häufigkeiten zusammenzählen.',
        steps: [
          step('Häufigkeitstabelle', table(['x', 'h(x)', 'f(x)', 'F(x) kumuliert'], ft.map((x) => [x.value, x.abs, f(x.rel, 4), f(x.cumRel, 4)]))),
          step('Ablesen', mode === 'hoechstens'
            ? fx(`F(${v}) = <strong>${f(share, 4)}</strong> = ${pc(share)}`)
            : fx(`P(X ≥ ${v}) = 1 − F(${ft[idx].value}) = 1 − ${f(ft[idx].cumRel, 4)} = <strong>${f(share, 4)}</strong>`), askProb('Anteil', share)),
        ],
        solution: `<strong>${pc(share)}</strong>`,
      };
    },
  };

  T['k3-klassiert'] = {
    title: 'Anteil zwischen zwei Werten (klassiert)',
    gen(r) {
      const G = genGrouped(r);
      const a = pickInside(r, G.g, 0, 1);
      const b = pickInside(r, G.g, 2, 3);
      const B = groupedBetweenSteps(G, a, b);
      return {
        text: `<p>${G.g.n} ${G.ctx.who} wurden nach „${G.ctx.name}“ befragt:</p>${G.dataTable}<p>Wie viel Prozent liegen <strong>zwischen ${f(a, 0)} und ${f(b, 0)} ${G.ctx.unit}</strong>?</p>`,
        answers: [prob('Anteil', B.value, { pts: 7 })],
        hint: 'Rechne den Anteil <em>bis</em> zur oberen Grenze minus den Anteil <em>bis</em> zur unteren Grenze. Innerhalb einer Klasse wird linear aufgeteilt.',
        simple: 'Stell dir vor, die Leute einer Klasse stehen gleichmäßig verteilt auf einer Strecke. Liegt dein Wert bei 40 % der Strecke, nimmst du 40 % der Leute dieser Klasse.',
        steps: B.steps,
        solution: `Etwa <strong>${pc(B.value)}</strong> liegen zwischen ${f(a, 0)} und ${f(b, 0)} ${G.ctx.unit}.`,
      };
    },
  };

  /* ---------- Kapitel 4: Lagemaße ---------- */
  function genValues(r, n, lo, hi) {
    const v = [];
    for (let i = 0; i < n; i++) v.push(r.int(lo, hi));
    return v;
  }
  const VALUE_CTX = [
    { what: 'Alter von Kursteilnehmern', unit: 'Jahre', lo: 19, hi: 35 },
    { what: 'Punkte in einer Klausur', unit: 'Punkte', lo: 30, hi: 95 },
    { what: 'Pendelzeit zur Arbeit', unit: 'Minuten', lo: 10, hi: 60 },
    { what: 'Tagesumsatz eines Kiosks', unit: '€', lo: 180, hi: 420 },
    { what: 'Körpergröße', unit: 'cm', lo: 158, hi: 194 },
    { what: 'Anzahl Kunden pro Stunde', unit: 'Kunden', lo: 8, hi: 40 },
  ];

  T['k4-mittelwert'] = {
    title: 'Arithmetisches Mittel',
    gen(r) {
      const c = r.pick(VALUE_CTX);
      const n = r.int(5, 8);
      const v = genValues(r, n, c.lo, c.hi);
      const m = St.mean(v);
      return {
        text: `<p>${c.what} (in ${c.unit}):</p><p class="datalist">${v.join('; ')}</p><p>Berechne das <strong>arithmetische Mittel</strong>.</p>`,
        answers: [num(`x̄ (${c.unit})`, m)],
        hint: 'Alle Werte zusammenzählen und durch die Anzahl teilen.',
        simple: 'Stell dir vor, alle legen ihr Geld auf einen Haufen und verteilen es dann gerecht. Was jeder dann hat, ist der Mittelwert.',
        steps: [
          step('Was ist gefragt?', `Der Durchschnitt von ${n} Werten.`),
          step('Formel', fx(`${xbar} = ${frac('x₁ + x₂ + … + xₙ', 'n')}`)),
          step('Summe', fx(`${v.join(' + ')} = <strong>${St.sum(v)}</strong>`), ask('Summe', St.sum(v), { tol: 0 })),
          step('Teilen', fx(`${xbar} = ${frac(St.sum(v), n)} = <strong>${f(m, 2)}</strong>`), ask('x̄', m)),
        ],
        solution: `x̄ = <strong>${f(m, 2)} ${c.unit}</strong>`,
      };
    },
  };

  T['k4-median'] = {
    title: 'Median',
    gen(r) {
      const c = r.pick(VALUE_CTX);
      const n = r.int(5, 10);
      const v = genValues(r, n, c.lo, c.hi);
      const s = St.sorted(v);
      const med = St.median(v);
      const odd = n % 2 === 1;
      return {
        text: `<p>${c.what} (in ${c.unit}):</p><p class="datalist">${v.join('; ')}</p><p>Bestimme den <strong>Median</strong>.</p>`,
        answers: [num(`Median (${c.unit})`, med)],
        hint: 'Erst der Größe nach sortieren! Dann den mittleren Wert suchen.',
        simple: 'Stellt euch der Größe nach in eine Reihe. Wer genau in der Mitte steht, ist der Median. Bei einer geraden Anzahl stehen zwei in der Mitte – dann nimmt man deren Durchschnitt.',
        steps: [
          step('Sortieren', `<p class="datalist">${s.join('; ')}</p>`),
          step('Mitte finden', odd
            ? `n = ${n} ist ungerade → der Median ist der Wert an Position (n+1)/2 = ${(n + 1) / 2}.`
            : `n = ${n} ist gerade → der Median ist der Durchschnitt der Werte an Position ${n / 2} und ${n / 2 + 1}.`),
          step('Ablesen', odd ? fx(`Median = <strong>${f(med)}</strong>`) : fx(`Median = ${frac(`${s[n / 2 - 1]} + ${s[n / 2]}`, 2)} = <strong>${f(med)}</strong>`), ask('Median', med)),
        ],
        solution: `Median = <strong>${f(med)} ${c.unit}</strong>`,
      };
    },
  };

  T['k4-modus'] = {
    title: 'Modus',
    gen(r) {
      const n = r.pick([10, 12, 15]);
      const { c, vals } = genList(r, n);
      let md = St.modes(vals);
      let tries = 0;
      let data = vals;
      while (md.values.length > 1 && tries < 20) {
        data = genList(r, n, c).vals;
        md = St.modes(data);
        tries++;
      }
      if (md.values.length > 1) { data = [...data, md.values[0]]; md = St.modes(data); }
      return {
        text: `<p>„${c.name}“:</p><p class="datalist">${data.join('; ')}</p><p>Welcher Wert ist der <strong>Modus</strong>?</p>`,
        answers: [num('Modus', md.values[0], { tol: 0 })],
        hint: 'Der Modus ist der Wert, der am häufigsten vorkommt.',
        simple: 'Der Modus ist der „Lieblingswert“ – der, den die meisten haben.',
        steps: [
          step('Zählen', table(['Wert', 'Anzahl'], St.freqTable(data).map((x) => [x.value, x.abs]))),
          step('Größte Anzahl', `Der Wert <strong>${md.values[0]}</strong> kommt ${md.count}-mal vor – öfter als jeder andere.`, ask('Modus', md.values[0], { tol: 0 })),
        ],
        solution: `Modus = <strong>${md.values[0]}</strong>`,
      };
    },
  };

  T['k4-haeufigkeitstabelle'] = {
    title: 'Mittelwert aus Häufigkeitstabelle',
    gen(r) {
      const c = r.pick(LIST_CTX);
      const hs = c.vals.map(() => r.int(1, 12));
      const n = St.sum(hs);
      const s = St.sum(c.vals.map((x, i) => x * hs[i]));
      const m = s / n;
      return {
        text: `<p>Häufigkeitsverteilung für „${c.name}“:</p>${table(['x', ...c.vals.map(String)], [['Anzahl', ...hs]])}<p>Berechne das <strong>arithmetische Mittel</strong>.</p>`,
        answers: [num('x̄', m)],
        hint: 'Jeden Wert mit seiner Häufigkeit multiplizieren, alles addieren, durch n teilen.',
        simple: 'Wenn 3 Leute je 2 Kinder haben, sind das 3·2 = 6 Kinder. So zählst du alle Kinder zusammen und teilst durch die Anzahl der Leute.',
        steps: [
          step('Formel', fx(`${xbar} = ${frac('Σ xᵢ · hᵢ', 'n')}`)),
          step('Produkte', table(['x', 'h', 'x · h'], c.vals.map((x, i) => [x, hs[i], x * hs[i]]).concat([['Summe', n, s]]))),
          step('Teilen', fx(`${xbar} = ${frac(s, n)} = <strong>${f(m, 2)}</strong>`), ask('x̄', m)),
        ],
        solution: `x̄ = <strong>${f(m, 2)}</strong>`,
      };
    },
  };

  T['k4-quartile'] = {
    title: 'Quartile & Quartilsabstand',
    gen(r) {
      const c = r.pick(VALUE_CTX);
      const n = r.int(8, 12);
      const v = genValues(r, n, c.lo, c.hi);
      const s = St.sorted(v);
      const q1 = St.quantile(v, 0.25), q3 = St.quantile(v, 0.75);
      const expl = (p, q) => {
        const np = n * p;
        return Number.isInteger(np)
          ? `n · p = ${n} · ${f(p)} = ${np} ist ganzzahlig → Mittelwert aus Position ${np} und ${np + 1}: (${s[np - 1]} + ${s[np]}) / 2 = <strong>${f(q)}</strong>`
          : `n · p = ${n} · ${f(p)} = ${f(np)} ist nicht ganzzahlig → aufrunden auf Position ${Math.ceil(np)} → <strong>${f(q)}</strong>`;
      };
      return {
        text: `<p>${c.what} (in ${c.unit}):</p><p class="datalist">${v.join('; ')}</p><p>Bestimme das <strong>1. Quartil Q₀,₂₅</strong>, das <strong>3. Quartil Q₀,₇₅</strong> und den <strong>Quartilsabstand</strong>.</p>`,
        answers: [num('Q₀,₂₅', q1), num('Q₀,₇₅', q3), num('Quartilsabstand', q3 - q1)],
        hint: 'Sortieren. Dann Position n·p berechnen: ganzzahlig → Mittel aus dieser und der nächsten Position, sonst aufrunden.',
        simple: 'Die Quartile schneiden die sortierte Reihe in vier gleich große Stücke. Q₀,₂₅: ein Viertel liegt darunter. Q₀,₇₅: drei Viertel liegen darunter.',
        steps: [
          step('Sortieren', `<p class="datalist">${s.map((x, i) => `<span class="pos"><small>${i + 1}</small>${x}</span>`).join(' ')}</p>`),
          step('1. Quartil', expl(0.25, q1), ask('Q₀,₂₅', q1)),
          step('3. Quartil', expl(0.75, q3), ask('Q₀,₇₅', q3)),
          step('Quartilsabstand', fx(`IQR = Q₀,₇₅ − Q₀,₂₅ = ${f(q3)} − ${f(q1)} = <strong>${f(q3 - q1)}</strong>`), ask('IQR', q3 - q1)),
        ],
        solution: `Q₀,₂₅ = <strong>${f(q1)}</strong>, Q₀,₇₅ = <strong>${f(q3)}</strong>, Quartilsabstand = <strong>${f(q3 - q1)}</strong>`,
      };
    },
  };

  T['k4-harmonisch'] = {
    title: 'Durchschnittspreis (harmonisches Mittel)',
    gen(r) {
      const budget = r.pick([5, 6, 8, 10, 12]);
      const k = r.int(3, 4);
      const prices = [];
      for (let i = 0; i < k; i++) prices.push(r.pick([1, 1.2, 1.5, 2, 2.5, 3]));
      const qty = prices.map((p) => budget / p);
      const avg = (budget * k) / St.sum(qty);
      return {
        text: `<p>Ein Kind gibt auf ${k} Volksfesten jeweils <strong>${budget} €</strong> für gebrannte Mandeln aus. Die Tüte kostet nacheinander ${prices.map((p) => f(p) + ' €').join(', ')}.</p><p>Wie hoch war der <strong>Durchschnittspreis pro Tüte</strong>?</p>`,
        answers: [num('Durchschnittspreis (€)', avg, { tol: 0.01 })],
        hint: 'Nicht einfach die Preise mitteln! Bei gleichem Geldbetrag und unterschiedlichen Preisen kauft man unterschiedlich viele Tüten. Gesamtausgaben ÷ Gesamtzahl Tüten.',
        simple: 'Bei billigen Tüten kauft das Kind mehr – diese zählen also stärker. Ehrlich ist nur: Was habe ich insgesamt bezahlt, und wie viele Tüten habe ich insgesamt?',
        steps: [
          step('Tüten pro Fest', table(['Preis', 'Tüten = Budget / Preis'], prices.map((p, i) => [f(p) + ' €', f(qty[i], 2)]))),
          step('Gesamt', `Ausgaben: ${k} · ${budget} € = ${budget * k} €, Tüten: ${f(St.sum(qty), 2)}`),
          step('Durchschnittspreis', fx(`${frac(budget * k + ' €', f(St.sum(qty), 2))} = <strong>${f(avg, 3)} €</strong>`) + box('Das ist genau das <strong>harmonische Mittel</strong> der Preise.'), ask('Preis', avg, { tol: 0.01 })),
        ],
        solution: `Durchschnittspreis ≈ <strong>${f(avg, 2)} €</strong> (harmonisches Mittel)`,
      };
    },
  };

  T['k4-klassiert'] = {
    title: 'Mittelwert & Median klassierter Daten',
    gen(r) {
      const G = genGrouped(r);
      const Q = groupedQuantileSteps(G, 0.5);
      return {
        text: `<p>${G.g.n} ${G.ctx.who} wurden nach „${G.ctx.name}“ befragt:</p>${G.dataTable}<p>Berechne a) das <strong>arithmetische Mittel</strong> und b) den <strong>Median</strong>.</p>`,
        answers: [num(`a) x̄ (${G.ctx.unit})`, G.g.mean, { pts: 3 }), num(`b) Median (${G.ctx.unit})`, Q.value, { pts: 5 })],
        hint: 'Mittelwert: mit Klassenmitten rechnen. Median: der Wert, unter dem 50 % liegen – mit Interpolation in der richtigen Klasse.',
        simple: 'Mittelwert = „gerecht verteilen“ mit den Klassenmitten. Median = die Person in der Mitte der Schlange; wir suchen, in welcher Klasse sie steht, und schätzen ihre Position.',
        steps: [...groupedMeanSteps(G), ...Q.steps],
        solution: `a) x̄ = <strong>${f(G.g.mean, 2)}</strong> ${G.ctx.unit}<br>b) Median ≈ <strong>${f(Q.value, 2)}</strong> ${G.ctx.unit}`,
      };
    },
  };

  T['k4-ueberschritten'] = {
    title: 'Welcher Wert wird von p % überschritten?',
    gen(r) {
      const G = genGrouped(r);
      const pAbove = r.pick([0.1, 0.2, 0.25, 0.33, 0.4, 0.6, 0.67, 0.75, 0.8]);
      const Q = groupedQuantileSteps(G, pAbove);
      return {
        text: `<p>${G.g.n} ${G.ctx.who} wurden nach „${G.ctx.name}“ befragt:</p>${G.dataTable}<p>Welche ${G.ctx.name} wird von <strong>${f(pAbove * 100, 0)} %</strong> der ${G.ctx.who} <strong>überschritten</strong>?</p>`,
        answers: [num(`Wert (${G.ctx.unit})`, Q.value, { pts: 6 })],
        hint: `Überschritten von ${f(pAbove * 100, 0)} % = darunter liegen ${f(100 - pAbove * 100, 0)} %. Gesucht ist also das ${f(1 - pAbove, 2)}-Quantil.`,
        simple: `Stell dir alle ${G.g.n} Personen der Größe nach in einer Schlange vor. Wir suchen die Person, hinter der noch ${f(pAbove * 100, 0)} % stehen.`,
        steps: Q.steps,
        solution: `Etwa <strong>${f(Q.value, 2)} ${G.ctx.unit}</strong> werden von ${f(pAbove * 100, 0)} % überschritten.`,
      };
    },
  };

  /* ---------- Kapitel 5: Streuungsmaße ---------- */
  T['k5-spannweite'] = {
    title: 'Spannweite',
    gen(r) {
      const c = r.pick(VALUE_CTX);
      const v = genValues(r, r.int(6, 10), c.lo, c.hi);
      const R = St.range(v);
      return {
        text: `<p>${c.what} (in ${c.unit}):</p><p class="datalist">${v.join('; ')}</p><p>Berechne die <strong>Spannweite</strong>.</p>`,
        answers: [num('Spannweite R', R, { tol: 0 })],
        hint: 'Größter Wert minus kleinster Wert.',
        simple: 'Wie weit ist es vom Kleinsten zum Größten? Das ist die Spannweite.',
        steps: [step('Max & Min', `Max = ${Math.max(...v)}, Min = ${Math.min(...v)}`), step('Differenz', fx(`R = ${Math.max(...v)} − ${Math.min(...v)} = <strong>${R}</strong>`), ask('R', R, { tol: 0 }))],
        solution: `R = <strong>${R} ${c.unit}</strong>`,
      };
    },
  };

  function varianceSteps(v, unit) {
    const n = v.length;
    const m = St.mean(v);
    const sq = v.map((x) => (x - m) ** 2);
    const ss = St.sum(sq);
    return {
      m, ss, s2: ss / (n - 1), s: Math.sqrt(ss / (n - 1)), s2n: ss / n, sn: Math.sqrt(ss / n),
      steps: [
        step('Mittelwert', fx(`${xbar} = ${frac(St.sum(v), n)} = <strong>${f(m, 2)}</strong>`), ask('x̄', m)),
        step('Abweichungen quadrieren', table(['xᵢ', 'xᵢ − x̄', '(xᵢ − x̄)²'], v.map((x, i) => [x, f(x - m, 2), f(sq[i], 2)]).concat([['', 'Summe', `<strong>${f(ss, 2)}</strong>`]])), ask('Σ(xᵢ − x̄)²', ss)),
        step('Varianz', fx(`s² = ${frac('Σ(xᵢ − x̄)²', 'n − 1')} = ${frac(f(ss, 2), n - 1)} = <strong>${f(ss / (n - 1), 2)}</strong>`) + box(`Stichprobe → durch n − 1 teilen. (Für eine Grundgesamtheit teilt man durch n: ${f(ss / n, 2)}.)`, 'info'), ask('s²', ss / (n - 1), { alts: [ss / n] })),
        step('Standardabweichung', fx(`s = ${sqrt(f(ss / (n - 1), 2))} = <strong>${f(Math.sqrt(ss / (n - 1)), 2)}</strong> ${unit}`), ask('s', Math.sqrt(ss / (n - 1)), { alts: [Math.sqrt(ss / n)] })),
      ],
    };
  }

  T['k5-varianz'] = {
    title: 'Varianz & Standardabweichung',
    gen(r) {
      const c = r.pick(VALUE_CTX);
      const v = genValues(r, r.int(4, 6), c.lo, c.hi);
      const V = varianceSteps(v, c.unit);
      return {
        text: `<p>Eine Stichprobe: ${c.what} (in ${c.unit}):</p><p class="datalist">${v.join('; ')}</p><p>Berechne die <strong>Varianz</strong> und die <strong>Standardabweichung</strong> (Stichprobe, Teiler n − 1).</p>`,
        answers: [num('Varianz s²', V.s2, { alts: [V.s2n] }), num(`Standardabweichung s (${c.unit})`, V.s, { alts: [V.sn] })],
        hint: 'Vier Schritte: Mittelwert → Abweichungen → quadrieren und addieren → durch (n − 1) teilen. Die Wurzel daraus ist s.',
        simple: 'Wir messen, wie weit jeder Wert vom Durchschnitt entfernt ist. Damit sich Plus und Minus nicht aufheben, wird quadriert. Am Ende ziehen wir die Wurzel, um wieder in der normalen Einheit zu landen.',
        steps: V.steps,
        solution: `s² = <strong>${f(V.s2, 2)}</strong>, s = <strong>${f(V.s, 2)} ${c.unit}</strong>`,
      };
    },
  };

  T['k5-variationskoeffizient'] = {
    title: 'Variationskoeffizient vergleichen',
    gen(r) {
      const A = { name: r.pick(['Filiale Nord', 'Maschine A', 'Aktie X', 'Kurs Montag']), m: r.int(40, 200), s: 0 };
      const B = { name: r.pick(['Filiale Süd', 'Maschine B', 'Aktie Y', 'Kurs Freitag']), m: r.int(400, 2000), s: 0 };
      A.s = St.round(A.m * r.float(0.08, 0.3, 2), 1);
      B.s = St.round(B.m * r.float(0.05, 0.25, 2), 1);
      if (Math.abs(A.s / A.m - B.s / B.m) < 0.02) B.s = St.round(B.s * 1.4, 1);
      const va = A.s / A.m, vb = B.s / B.m;
      const more = va > vb ? A.name : B.name;
      return {
        text: `<p>Zwei Datenreihen:</p>${table(['', 'Mittelwert', 'Standardabweichung'], [[A.name, f(A.m), f(A.s)], [B.name, f(B.m), f(B.s)]])}<p>Berechne beide <strong>Variationskoeffizienten</strong>. Welche Reihe streut <strong>relativ</strong> stärker?</p>`,
        answers: [prob(`V (${A.name})`, va), prob(`V (${B.name})`, vb), choice(r, 'Relativ stärkere Streuung', more, [more === A.name ? B.name : A.name])],
        hint: 'V = s / x̄. Damit kann man Streuungen vergleichen, auch wenn die Zahlen ganz unterschiedlich groß sind.',
        simple: '10 € Schwankung ist bei einem Kaffee riesig, bei einem Auto egal. Der Variationskoeffizient sagt, wie groß die Schwankung <em>im Verhältnis</em> zum Durchschnitt ist.',
        steps: [
          step('Formel', fx(`V = ${frac('s', xbar)}`)),
          step(A.name, fx(`V = ${frac(f(A.s), f(A.m))} = <strong>${f(va, 4)}</strong> = ${pc(va)}`), askProb('V', va)),
          step(B.name, fx(`V = ${frac(f(B.s), f(B.m))} = <strong>${f(vb, 4)}</strong> = ${pc(vb)}`), askProb('V', vb)),
          step('Vergleich', `Größerer Variationskoeffizient → relativ stärkere Streuung: <strong>${more}</strong>.`),
        ],
        solution: `V(${A.name}) = ${pc(va)}, V(${B.name}) = ${pc(vb)} → <strong>${more}</strong> streut relativ stärker.`,
      };
    },
  };

  T['k5-klassiert'] = {
    title: 'Streuung klassierter Daten',
    gen(r) {
      const G = genGrouped(r);
      const g = G.g;
      return {
        text: `<p>${g.n} ${G.ctx.who} wurden nach „${G.ctx.name}“ befragt:</p>${G.dataTable}<p>Berechne a) das <strong>arithmetische Mittel</strong>, b) die <strong>Standardabweichung</strong> und c) den <strong>Variationskoeffizienten</strong>.</p>`,
        answers: [num(`a) x̄ (${G.ctx.unit})`, g.mean, { pts: 2 }), num(`b) s (${G.ctx.unit})`, g.sd, { pts: 4, rel: 0.015 }), prob('c) V', g.cv, { pts: 1 })],
        hint: 'Alles mit den Klassenmitten rechnen. Varianz = Σ nⱼ·(mⱼ − x̄)² / n.',
        simple: 'Wir tun so, als stünden alle Personen einer Klasse genau in der Klassenmitte. Dann rechnen wir wie mit normalen Zahlen.',
        steps: [...groupedMeanSteps(G), ...groupedSdSteps(G).slice(1), step('Variationskoeffizient', fx(`V = ${frac('s', xbar)} = ${frac(f(g.sd, 2), f(g.mean, 2))} = <strong>${f(g.cv, 4)}</strong> = ${pc(g.cv)}`), askProb('V', g.cv))],
        solution: `a) x̄ = <strong>${f(g.mean, 2)}</strong><br>b) s = <strong>${f(g.sd, 2)}</strong><br>c) V = <strong>${pc(g.cv)}</strong>`,
      };
    },
  };

  T['k5-klausur-deskriptiv'] = {
    title: 'Klausuraufgabe: Deskriptive Statistik',
    gen(r) {
      const G = genGrouped(r);
      const g = G.g;
      const pAbove = r.pick([0.2, 0.25, 0.33, 0.4, 0.67, 0.75]);
      const Q = groupedQuantileSteps(G, pAbove);
      const a = pickInside(r, g, 0, 1);
      const b = pickInside(r, g, 2, 3);
      const B = groupedBetweenSteps(G, a, b);
      return {
        text: `<p>${G.ctx.who} wurden nach „${G.ctx.name}“ befragt. Dabei erhielt man folgende Häufigkeitsverteilung (20 Punkte):</p>${G.dataTable}
          <ol class="parts"><li>Berechnen Sie das arithmetische Mittel! (2 P.)</li><li>Berechnen Sie die Standardabweichung! (4 P.)</li><li>Berechnen Sie den Variationskoeffizienten! (1 P.)</li><li>Welche ${G.ctx.name} wird von ${f(pAbove * 100, 0)} % überschritten? (6 P.)</li><li>Wie viel Prozent liegen zwischen ${f(a, 0)} und ${f(b, 0)} ${G.ctx.unit}? (7 P.)</li></ol>`,
        answers: [
          num(`a) x̄ (${G.ctx.unit})`, g.mean, { pts: 2 }),
          num(`b) s (${G.ctx.unit})`, g.sd, { pts: 4, rel: 0.015 }),
          prob('c) V', g.cv, { pts: 1 }),
          num(`d) Wert (${G.ctx.unit})`, Q.value, { pts: 6 }),
          prob('e) Anteil', B.value, { pts: 7 }),
        ],
        hint: 'Klassenmitten für a)–c). Für d) und e) mit kumulierten Häufigkeiten und linearer Interpolation arbeiten.',
        simple: 'Das ist eine typische 20-Punkte-Klausuraufgabe. Arbeite Teil für Teil ab – jeder Teil ist für sich machbar.',
        steps: [
          ...groupedMeanSteps(G),
          ...groupedSdSteps(G).slice(2),
          step('c) Variationskoeffizient', fx(`V = ${frac(f(g.sd, 2), f(g.mean, 2))} = <strong>${f(g.cv, 4)}</strong>`), askProb('V', g.cv)),
          ...Q.steps.map((s) => ({ ...s, title: 'd) ' + s.title })),
          ...B.steps.map((s) => ({ ...s, title: 'e) ' + s.title })),
        ],
        solution: `a) ${f(g.mean, 2)} · b) ${f(g.sd, 2)} · c) ${pc(g.cv)} · d) ${f(Q.value, 2)} · e) ${pc(B.value)}`,
      };
    },
  };

  /* ---------- Kapitel 6: Konzentration ---------- */
  function giniSteps(values, label) {
    const L = St.lorenz(values.map((v) => ({ count: 1, total: v })), true);
    const n = values.length;
    const rows = L.points.slice(1).map((p, i) => {
      const prev = L.points[i];
      return [f(L.sorted[i].total), f(p.k, 4), f(p.l, 4), f((p.k - prev.k) * (p.l + prev.l), 4)];
    });
    return {
      L,
      steps: [
        step('Sortieren', `Der Größe nach aufsteigend: ${L.sorted.map((g) => f(g.total)).join(' ≤ ')}. Summe = ${f(L.T)}.`),
        step('Kumulierte Anteile', `kᵢ = kumulierter Anteil der ${label}, lᵢ = kumulierter Anteil an der Summe:${table(['Wert', 'kᵢ', 'lᵢ', '(kᵢ − kᵢ₋₁)(lᵢ + lᵢ₋₁)'], rows.concat([['', '', 'Summe', `<strong>${f(L.sum, 4)}</strong>`]]))}`),
        step('Gini-Formel', fx(`G = 1 − Σ (kᵢ − kᵢ₋₁)(lᵢ + lᵢ₋₁) = 1 − ${f(L.sum, 4)} = <strong>${f(L.gini, 4)}</strong>`), ask('G (unkorrigiert)', L.gini, { tol: 0.005 })),
        step('Korrigieren', fx(`G* = ${frac('n', 'n − 1')} · G = ${frac(n, n - 1)} · ${f(L.gini, 4)} = <strong>${f(L.giniCorr, 4)}</strong>`) + box('Bei n Einzelwerten kann G höchstens (n−1)/n werden. Die Korrektur streckt G auf 0 bis 1.', 'info'), ask('G* (korrigiert)', L.giniCorr, { tol: 0.005 })),
      ],
    };
  }

  T['k6-anteil'] = {
    title: 'Lorenzkurve: Wer hat wie viel?',
    gen(r) {
      const n = r.pick([4, 5]);
      const v = [];
      for (let i = 0; i < n; i++) v.push(r.step(100, 900, 50));
      const s = St.sorted(v);
      const k = r.int(1, n - 2);
      const lowShare = St.sum(s.slice(0, k)) / St.sum(v);
      return {
        text: `<p>Die ${n} Filialen eines Unternehmens machen folgende Umsätze (in 1.000 €):</p>${table(['Filiale', ...v.map((_, i) => i + 1)], [['Umsatz', ...v]])}<p>Welchen Anteil am Gesamtumsatz haben die <strong>${k} umsatzschwächsten</strong> Filialen zusammen?</p>`,
        answers: [prob('Anteil', lowShare)],
        hint: 'Sortieren, die kleinsten Werte addieren und durch die Gesamtsumme teilen.',
        simple: 'Das ist genau ein Punkt der Lorenzkurve: „Die kleinsten X % besitzen Y % des Kuchens.“',
        steps: [
          step('Sortieren', s.join(' ≤ ')),
          step('Kleinste addieren', fx(`${s.slice(0, k).join(' + ')} = ${St.sum(s.slice(0, k))}`)),
          step('Anteil', fx(`${frac(St.sum(s.slice(0, k)), St.sum(v))} = <strong>${pc(lowShare)}</strong>`) + `→ Punkt der Lorenzkurve: (${pc(k / n, 0)} | ${pc(lowShare, 1)})`, askProb('Anteil', lowShare)),
        ],
        solution: `Die ${k} kleinsten Filialen (${pc(k / n, 0)}) haben <strong>${pc(lowShare)}</strong> des Umsatzes.`,
      };
    },
  };

  T['k6-gini'] = {
    title: 'Gini-Koeffizient (Einzelwerte)',
    gen(r) {
      const n = r.pick([4, 5]);
      const v = [];
      for (let i = 0; i < n; i++) v.push(r.step(100, 900, 100));
      const G = giniSteps(v, 'Filialen');
      return {
        text: `<p>Die ${n} Filialen eines Unternehmens weisen folgende Umsätze auf:</p>${table(['Filiale', ...v.map((_, i) => i + 1)], [['Umsatz', ...v]])}<p>Berechne den <strong>Gini-Koeffizienten</strong> (unkorrigiert und korrigiert).</p>`,
        answers: [num('G (unkorrigiert)', G.L.gini, { tol: 0.005 }), num('G* (korrigiert)', G.L.giniCorr, { tol: 0.005 })],
        hint: 'Aufsteigend sortieren, kumulierte Anteile kᵢ und lᵢ bilden, dann G = 1 − Σ (kᵢ − kᵢ₋₁)(lᵢ + lᵢ₋₁).',
        simple: 'Gini = 0: alle haben gleich viel. Gini nahe 1: einer hat fast alles. Die Formel misst die Fläche zwischen „gerecht“ (Diagonale) und der echten Lorenzkurve.',
        steps: G.steps,
        solution: `G = <strong>${f(G.L.gini, 4)}</strong>, korrigiert G* = <strong>${f(G.L.giniCorr, 4)}</strong>`,
      };
    },
  };

  T['k6-gini-klassiert'] = {
    title: 'Konzentration klassierter Daten',
    gen(r) {
      const bounds = r.pick([[0, 10, 50, 200, 500, 1000], [0, 20, 60, 150, 400, 800]]);
      const counts = [r.step(300, 600, 50), r.step(500, 900, 50), r.step(150, 300, 10), r.step(30, 60, 5), r.step(5, 15, 5)];
      const groups = counts.map((c, i) => ({ count: c, total: c * (bounds[i] + bounds[i + 1]) / 2, lo: bounds[i], hi: bounds[i + 1] }));
      const L = St.lorenz(groups, false);
      const rows = L.points.slice(1).map((p, i) => [`${bounds[i]} – ${bounds[i + 1]}`, groups[i].count, f(groups[i].total, 0), f(p.k, 4), f(p.l, 4), f((p.k - L.points[i].k) * (p.l + L.points[i].l), 4)]);
      return {
        text: `<p>Das Vermögen (in 1.000 €) einer Bevölkerungsgruppe ist so verteilt:</p>${table(['Vermögen', 'Personen'], groups.map((g) => [`${g.lo} bis unter ${g.hi}`, g.count]))}<p>Berechne den <strong>Gini-Koeffizienten</strong>. (Nimm für jede Klasse die Klassenmitte als Durchschnittsvermögen.)</p>`,
        answers: [num('G', L.gini, { tol: 0.01, pts: 8 })],
        hint: 'Vermögenssumme je Klasse = Personen × Klassenmitte. Dann kumulierte Anteile der Personen (kᵢ) und des Vermögens (lᵢ).',
        simple: 'Wir prüfen: Wie viel Prozent des Vermögens gehören den ärmsten 20 %, 50 %, 80 % …? Je ungleicher, desto größer der Gini.',
        steps: [
          step('Vermögenssummen', table(['Klasse', 'Personen', 'Mitte', 'Summe'], groups.map((g) => [`${g.lo}–${g.hi}`, g.count, (g.lo + g.hi) / 2, f(g.total, 0)]))),
          step('Kumulierte Anteile', table(['Klasse', 'nⱼ', 'Summe', 'kᵢ', 'lᵢ', '(kᵢ−kᵢ₋₁)(lᵢ+lᵢ₋₁)'], rows)),
          step('Gini', fx(`G = 1 − ${f(L.sum, 4)} = <strong>${f(L.gini, 4)}</strong>`), ask('G', L.gini, { tol: 0.01 })),
        ],
        solution: `G ≈ <strong>${f(L.gini, 4)}</strong> – ${L.gini > 0.5 ? 'deutliche' : 'mäßige'} Konzentration.`,
      };
    },
  };

  /* ---------- Kapitel 7: Kontingenztafeln ---------- */
  const PAIRS = [
    { a: ['Whisky schmeckt', 'Whisky schmeckt nicht'], b: ['Cognac schmeckt', 'Cognac schmeckt nicht'] },
    { a: ['Raucher', 'Nichtraucher'], b: ['Sportler', 'kein Sport'] },
    { a: ['Frauen', 'Männer'], b: ['kauft online', 'kauft im Laden'] },
    { a: ['Bayern', 'nicht Bayern'], b: ['mag den Riegel', 'mag ihn nicht'] },
    { a: ['Abitur', 'kein Abitur'], b: ['liest Zeitung', 'liest keine Zeitung'] },
  ];
  function gen2x2(r) {
    const p = r.pick(PAIRS);
    const t = [r.step(20, 220, 10), r.step(10, 120, 10), r.step(10, 120, 10), r.step(20, 200, 10)];
    return { p, t, n: St.sum(t) };
  }
  const t2x2 = (p, t, show = [true, true, true, true]) =>
    table(['', p.a[0], p.a[1], 'Summe'], [
      [p.b[0], show[0] ? t[0] : '?', show[1] ? t[1] : '?', t[0] + t[1]],
      [p.b[1], show[2] ? t[2] : '?', show[3] ? t[3] : '?', t[2] + t[3]],
      ['Summe', t[0] + t[2], t[1] + t[3], t[0] + t[1] + t[2] + t[3]],
    ]);

  T['k7-ergaenzen'] = {
    title: 'Vierfeldertafel ergänzen',
    gen(r) {
      const { p, t } = gen2x2(r);
      return {
        text: `<p>Ergänze die fehlenden Felder der Vierfeldertafel:</p>${t2x2(p, t, [true, true, false, false])}`,
        answers: [num(`„${p.b[1]}“ & „${p.a[0]}“`, t[2], { tol: 0 }), num(`„${p.b[1]}“ & „${p.a[1]}“`, t[3], { tol: 0 })],
        hint: 'Spaltensumme minus das bekannte Feld darüber.',
        simple: 'Eine Vierfeldertafel ist wie ein Sudoku: Jede Zeile und jede Spalte muss sich zur Summe addieren.',
        steps: [
          step('Spalte 1', fx(`${t[0] + t[2]} − ${t[0]} = <strong>${t[2]}</strong>`), ask('Feld unten links', t[2], { tol: 0 })),
          step('Spalte 2', fx(`${t[1] + t[3]} − ${t[1]} = <strong>${t[3]}</strong>`), ask('Feld unten rechts', t[3], { tol: 0 })),
        ],
        solution: `Unten links: <strong>${t[2]}</strong>, unten rechts: <strong>${t[3]}</strong>`,
      };
    },
  };

  T['k7-prozent'] = {
    title: 'Zeilenprozente / bedingte Anteile',
    gen(r) {
      const { p, t } = gen2x2(r);
      const col = r.int(0, 1);
      const share = t[col] / (t[col] + t[col + 2]);
      return {
        text: `${t2x2(p, t)}<p>Wie viel Prozent der Gruppe <strong>„${p.a[col]}“</strong> gehören zu <strong>„${p.b[0]}“</strong>?</p>`,
        answers: [prob('Anteil', share)],
        hint: `Bezugsgröße ist nur die Gruppe „${p.a[col]}“, also deren Spaltensumme – nicht n!`,
        simple: 'Erst den Kreis eingrenzen („nur diese Gruppe“), dann in diesem Kreis zählen.',
        steps: [
          step('Bezugsgröße', `Spaltensumme „${p.a[col]}“ = ${t[col] + t[col + 2]}`),
          step('Anteil', fx(`${frac(t[col], t[col] + t[col + 2])} = <strong>${pc(share)}</strong>`), askProb('Anteil', share)),
        ],
        solution: `<strong>${pc(share)}</strong>`,
      };
    },
  };

  function phiSteps(t) {
    const [a, b, c, d] = t;
    const phi = St.phi(a, b, c, d);
    return {
      phi,
      steps: [
        step('Formel', fx(`φ = ${frac('n₁₁ · n₂₂ − n₁₂ · n₂₁', `√(n₁. · n₂. · n.₁ · n.₂)`)}`) + box('Im Skript steht die Formel mit umgekehrtem Vorzeichen im Zähler. Für die Stärke zählt nur der <strong>Betrag</strong> |φ|.', 'info')),
        step('Zähler', fx(`${a} · ${d} − ${b} · ${c} = <strong>${a * d - b * c}</strong>`), ask('Zähler', a * d - b * c, { tol: 0, alts: [b * c - a * d] })),
        step('Nenner', fx(`${sqrt(`${a + b} · ${c + d} · ${a + c} · ${b + d}`)} = <strong>${f(Math.sqrt((a + b) * (c + d) * (a + c) * (b + d)), 2)}</strong>`)),
        step('φ', fx(`φ = ${frac(a * d - b * c, f(Math.sqrt((a + b) * (c + d) * (a + c) * (b + d)), 2))} = <strong>${f(phi, 4)}</strong>`), ask('|φ|', Math.abs(phi), { tol: 0.01, abs: true })),
        step('Deuten', `|φ| = ${f(Math.abs(phi), 3)} → <strong>${St.phiStrength(phi)}</strong>.<br><small>0–0,2 vernachlässigbar · 0,2–0,4 schwach · 0,4–0,6 mittel · 0,6–0,8 stark · 0,8–1 sehr stark</small>`),
      ],
    };
  }

  T['k7-phi'] = {
    title: 'φ-Koeffizient',
    gen(r) {
      const { p, t } = gen2x2(r);
      const P = phiSteps(t);
      const strengths = ['vernachlässigbarer Zusammenhang', 'schwacher Zusammenhang', 'mittlerer Zusammenhang', 'starker Zusammenhang', 'sehr starker Zusammenhang'];
      const s = St.phiStrength(P.phi);
      return {
        text: `${t2x2(p, t)}<p>Berechne den <strong>Zusammenhangskoeffizienten φ</strong> (Betrag) und beurteile die Stärke des Zusammenhangs.</p>`,
        answers: [num('|φ|', Math.abs(P.phi), { tol: 0.01, abs: true }), choice(r, 'Stärke', s, r.sample(strengths.filter((x) => x !== s), 3))],
        hint: 'φ = (n₁₁·n₂₂ − n₁₂·n₂₁) / √(Zeilensumme1 · Zeilensumme2 · Spaltensumme1 · Spaltensumme2)',
        simple: 'φ fragt: „Wenn ich das eine weiß, kann ich das andere besser raten?“ |φ| nahe 0: nein. Nahe 1: ja, sehr gut.',
        steps: P.steps,
        solution: `|φ| = <strong>${f(Math.abs(P.phi), 4)}</strong> → ${s}`,
      };
    },
  };

  T['k7-zusammenfassen'] = {
    title: 'Große Tafel → Vierfeldertafel',
    gen(r) {
      const regions = ['Bayern', 'Hessen', 'Niedersachsen'];
      const t = regions.map(() => [r.step(60, 220, 2), r.step(40, 160, 2), r.step(20, 320, 2)]);
      const a = t[0][0], b = t[0][1] + t[0][2], c = t[1][0] + t[2][0], d = t[1][1] + t[1][2] + t[2][1] + t[2][2];
      const P = phiSteps([a, b, c, d]);
      return {
        text: `<p>Marktforschung für einen neuen Müsliriegel:</p>${table(['', 'mögen', 'na ja', 'nicht'], regions.map((g, i) => [g, ...t[i]]))}<p>Fasse zu einer Vierfeldertafel zusammen (<strong>Bayern / nicht Bayern</strong> und <strong>mögen / nicht mögen (na ja + nicht)</strong>) und berechne |φ|.</p>`,
        answers: [num('Bayern & mögen', a, { tol: 0, pts: 1 }), num('nicht Bayern & nicht mögen', d, { tol: 0, pts: 2 }), num('|φ|', Math.abs(P.phi), { tol: 0.01, abs: true, pts: 4 })],
        hint: '„Nicht Bayern“ = Hessen + Niedersachsen. „Nicht mögen“ = na ja + nicht.',
        simple: 'Wir werfen Kategorien zusammen, bis nur noch 2 × 2 Felder übrig sind. Dann wie immer φ rechnen.',
        steps: [
          step('Zusammenfassen', table(['', 'mögen', 'nicht mögen', 'Summe'], [['Bayern', a, b, a + b], ['nicht Bayern', c, d, c + d], ['Summe', a + c, b + d, a + b + c + d]])),
          ...P.steps,
          step('Prozentuiert nach Regionen', table(['', 'mögen', 'nicht mögen'], [['Bayern', pc(a / (a + b), 1), pc(b / (a + b), 1)], ['nicht Bayern', pc(c / (c + d), 1), pc(d / (c + d), 1)]])),
        ],
        solution: `Vierfeldertafel: ${a} | ${b} | ${c} | ${d}; |φ| = <strong>${f(Math.abs(P.phi), 4)}</strong> (${St.phiStrength(P.phi)})`,
      };
    },
  };

  /* ---------- Kapitel 8: Kombinatorik ---------- */
  T['k8-fakultaet'] = {
    title: 'Reihenfolgen (Fakultät)',
    gen(r) {
      const n = r.int(3, 8);
      const ctx = r.pick([`${n} Bücher sollen nebeneinander ins Regal gestellt werden.`, `${n} Läufer laufen ins Ziel (keine Gleichstände).`, `${n} Gäste sollen auf ${n} Stühle verteilt werden.`, `${n} Songs sollen in eine Playlist-Reihenfolge gebracht werden.`]);
      return {
        text: `<p>${ctx}</p><p>Wie viele verschiedene <strong>Reihenfolgen</strong> gibt es?</p>`,
        answers: [num('Anzahl', St.fact(n), { tol: 0 })],
        hint: `Für den ersten Platz gibt es ${n} Möglichkeiten, für den zweiten noch ${n - 1}, …`,
        simple: 'Beim ersten Platz hast du alle zur Auswahl, beim nächsten einen weniger – und so weiter. Alles malnehmen!',
        steps: [
          step('Prinzip', `Platz 1: ${n} Möglichkeiten, Platz 2: ${n - 1}, …, letzter Platz: 1.`),
          step('Rechnen', fx(`${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(' · ')} = <strong>${f(St.fact(n), 0)}</strong>`), ask('n!', St.fact(n), { tol: 0 })),
        ],
        solution: `${n}! = <strong>${f(St.fact(n), 0)}</strong>`,
      };
    },
  };

  T['k8-haendedruck'] = {
    title: 'Händeschütteln (Kombination)',
    gen(r) {
      const n = r.int(5, 30);
      return {
        text: `<p>${n} Personen verabschieden sich voneinander, jeder schüttelt jedem einmal die Hand.</p><p>Wie viele <strong>Händedrücke</strong> gibt es?</p>`,
        answers: [num('Händedrücke', Stat2(n), { tol: 0 })],
        hint: 'Für einen Händedruck braucht man 2 Personen, die Reihenfolge ist egal → „n über 2“.',
        simple: `Jeder gibt ${n - 1} anderen die Hand: ${n} · ${n - 1}. Aber so wurde jeder Händedruck doppelt gezählt (A–B und B–A). Also durch 2 teilen.`,
        steps: [
          step('Modell', 'Ziehe 2 aus n, ohne Reihenfolge, ohne Wiederholung → Binomialkoeffizient.'),
          step('Rechnen', fx(`(${n} über 2) = ${frac(`${n} · ${n - 1}`, 2)} = <strong>${Stat2(n)}</strong>`), ask('Anzahl', Stat2(n), { tol: 0 })),
        ],
        solution: `<strong>${Stat2(n)}</strong> Händedrücke`,
      };
    },
  };
  function Stat2(n) { return (n * (n - 1)) / 2; }

  T['k8-kombination'] = {
    title: 'Auswählen ohne Reihenfolge',
    gen(r) {
      const n = r.int(8, 20), k = r.int(2, 5);
      const ctx = r.pick([`Aus ${n} Mitarbeitern wird ein Team aus ${k} Personen gebildet.`, `Aus ${n} Pizzabelägen darfst du ${k} verschiedene wählen.`, `Aus ${n} Bewerbern werden ${k} zum Gespräch eingeladen.`]);
      const res = St.nCk(n, k);
      return {
        text: `<p>${ctx}</p><p>Wie viele Möglichkeiten gibt es?</p>`,
        answers: [num('Anzahl', res, { tol: 0 })],
        hint: 'Reihenfolge egal, keine Wiederholung → Binomialkoeffizient „n über k“.',
        simple: 'Ein Team {Anna, Ben} ist dasselbe wie {Ben, Anna}. Deshalb teilen wir die Reihenfolgen wieder heraus.',
        steps: [
          step('Fragen klären', 'Reihenfolge wichtig? <strong>Nein.</strong> Wiederholung möglich? <strong>Nein.</strong> → Kombination ohne Wiederholung.'),
          step('Formel', fx(`(n über k) = ${frac('n!', 'k! · (n − k)!')}`)),
          step('Rechnen', fx(`(${n} über ${k}) = ${frac(`${n}!`, `${k}! · ${n - k}!`)} = <strong>${f(res, 0)}</strong>`), ask('Anzahl', res, { tol: 0 })),
        ],
        solution: `<strong>${f(res, 0)}</strong> Möglichkeiten`,
      };
    },
  };

  T['k8-variation'] = {
    title: 'Auswählen mit Reihenfolge',
    gen(r) {
      const n = r.int(6, 20);
      const type = r.pick(['podest', 'liga']);
      if (type === 'liga') {
        const res = n * (n - 1);
        return {
          text: `<p>In einer Liga spielen ${n} Mannschaften. Jede spielt gegen jede einmal zu Hause und einmal auswärts (Hin- und Rückrunde).</p><p>Wie viele <strong>Spiele</strong> finden statt?</p>`,
          answers: [num('Spiele', res, { tol: 0 })],
          hint: 'Heim gegen Gast ist etwas anderes als Gast gegen Heim → Reihenfolge zählt.',
          simple: `Jede der ${n} Mannschaften hat ${n - 1} Heimspiele. Fertig!`,
          steps: [step('Rechnen', fx(`${n} · ${n - 1} = <strong>${res}</strong>`), ask('Spiele', res, { tol: 0 }))],
          solution: `<strong>${res}</strong> Spiele`,
        };
      }
      const k = 3;
      const res = St.nPk(n, k);
      return {
        text: `<p>${n} Läufer starten. Wie viele Möglichkeiten gibt es für die Plätze <strong>Gold, Silber und Bronze</strong>?</p>`,
        answers: [num('Anzahl', res, { tol: 0 })],
        hint: 'Reihenfolge wichtig (Gold ≠ Silber), keine Wiederholung.',
        simple: `Für Gold gibt es ${n} Kandidaten, für Silber noch ${n - 1}, für Bronze ${n - 2}.`,
        steps: [step('Rechnen', fx(`${n} · ${n - 1} · ${n - 2} = <strong>${res}</strong>`), ask('Anzahl', res, { tol: 0 }))],
        solution: `<strong>${f(res, 0)}</strong> Möglichkeiten`,
      };
    },
  };

  T['k8-hypergeometrisch'] = {
    title: 'Ziehen ohne Zurücklegen',
    gen(r) {
      const blue = r.int(5, 10), yellow = r.int(4, 9);
      const N = blue + yellow, n = 4, k = 2;
      const p = St.hyperPmf(k, N, yellow, n);
      return {
        text: `<p>In einer Urne liegen ${blue} blaue und ${yellow} gelbe Kugeln. Es werden ${n} Kugeln <strong>ohne Zurücklegen</strong> gezogen.</p><p>Wie groß ist die Wahrscheinlichkeit für <strong>genau 2 gelbe und 2 blaue</strong> Kugeln?</p>`,
        answers: [prob('P', p)],
        hint: 'Günstige Möglichkeiten / alle Möglichkeiten. Günstig: (gelb über 2) · (blau über 2). Alle: (N über 4).',
        simple: 'Wie viele Arten gibt es, 2 gelbe zu greifen? Wie viele, 2 blaue zu greifen? Mal nehmen – und durch alle möglichen 4er-Griffe teilen.',
        steps: [
          step('Günstige Fälle', fx(`(${yellow} über 2) · (${blue} über 2) = ${St.nCk(yellow, 2)} · ${St.nCk(blue, 2)} = <strong>${St.nCk(yellow, 2) * St.nCk(blue, 2)}</strong>`), ask('günstige Fälle', St.nCk(yellow, 2) * St.nCk(blue, 2), { tol: 0 })),
          step('Mögliche Fälle', fx(`(${N} über 4) = <strong>${St.nCk(N, 4)}</strong>`), ask('mögliche Fälle', St.nCk(N, 4), { tol: 0 })),
          step('Wahrscheinlichkeit', fx(`P = ${frac(St.nCk(yellow, 2) * St.nCk(blue, 2), St.nCk(N, 4))} = <strong>${f(p, 4)}</strong>`), askProb('P', p)),
        ],
        solution: `P = <strong>${f(p, 4)}</strong> ≈ ${pc(p)}`,
      };
    },
  };

  T['k8-liga'] = {
    title: 'Liga-Aufgabe (komplett)',
    gen(r) {
      const n = r.int(10, 18);
      return {
        text: `<p>In einer Liga spielen <strong>${n} Mannschaften</strong>, darunter Pechstadt und Glückstein.</p><ol class="parts"><li>Wie viele Spiele gibt es in Hin- und Rückrunde?</li><li>Wie viele Abschlusstabellen sind möglich?</li><li>Wie viele Tabellen sind möglich, wenn Glückstein Erster und Pechstadt Letzter ist?</li></ol>`,
        answers: [num('a) Spiele', n * (n - 1), { tol: 0, pts: 2 }), num('b) Tabellen', St.fact(n), { rel: 0.001, pts: 2 }), num('c) Tabellen', St.fact(n - 2), { rel: 0.001, pts: 3 })],
        hint: 'b) Alle Mannschaften in eine Reihenfolge bringen. c) Zwei Plätze sind schon fest – nur noch der Rest wird sortiert.',
        simple: 'Eine Tabelle ist einfach eine Reihenfolge aller Mannschaften. Sind zwei Plätze fix, sortierst du nur noch die übrigen.',
        steps: [
          step('a) Spiele', fx(`${n} · ${n - 1} = <strong>${n * (n - 1)}</strong>`), ask('Spiele', n * (n - 1), { tol: 0 })),
          step('b) Tabellen', fx(`${n}! = <strong>${f(St.fact(n), 0)}</strong>`), ask('Tabellen', St.fact(n), { rel: 0.001 })),
          step('c) Mit festen Plätzen', fx(`(${n} − 2)! = ${n - 2}! = <strong>${f(St.fact(n - 2), 0)}</strong>`), ask('Tabellen', St.fact(n - 2), { rel: 0.001 })),
        ],
        solution: `a) ${n * (n - 1)} · b) ${f(St.fact(n), 0)} · c) ${f(St.fact(n - 2), 0)}`,
      };
    },
  };

  /* ---------- Kapitel 9: Wahrscheinlichkeiten ---------- */
  T['k9-laplace'] = {
    title: 'Laplace-Wahrscheinlichkeit',
    gen(r) {
      const type = r.pick(['wuerfel', 'urne', 'karten']);
      if (type === 'wuerfel') {
        const k = r.int(1, 5);
        const fav = 6 - k;
        return {
          text: `<p>Ein fairer Würfel wird einmal geworfen. Wie groß ist die Wahrscheinlichkeit für eine Augenzahl <strong>größer als ${k}</strong>?</p>`,
          answers: [prob('P', fav / 6)],
          hint: 'Günstige Ergebnisse zählen und durch alle 6 möglichen teilen.',
          simple: 'Welche Zahlen gewinnen? Abzählen. Dann: gewinnende / alle.',
          steps: [step('Günstige', `{${Array.from({ length: fav }, (_, i) => k + 1 + i).join(', ')}} → ${fav} Stück`), step('Laplace', fx(`P = ${frac(fav, 6)} = <strong>${f(fav / 6, 4)}</strong>`), askProb('P', fav / 6))],
          solution: `P = ${fav}/6 = <strong>${f(fav / 6, 4)}</strong>`,
        };
      }
      if (type === 'urne') {
        const rot = r.int(2, 9), blau = r.int(2, 9), gruen = r.int(1, 6);
        const N = rot + blau + gruen;
        return {
          text: `<p>Eine Urne enthält ${rot} rote, ${blau} blaue und ${gruen} grüne Kugeln. Eine Kugel wird gezogen. Wie groß ist die Wahrscheinlichkeit, dass sie <strong>nicht rot</strong> ist?</p>`,
          answers: [prob('P', (blau + gruen) / N)],
          hint: 'Nicht rot = blau oder grün. Oder: 1 − P(rot).',
          simple: 'Alle Kugeln, die nicht rot sind, zählen – geteilt durch alle Kugeln.',
          steps: [step('Gegenereignis', fx(`P(nicht rot) = 1 − ${frac(rot, N)} = ${frac(blau + gruen, N)} = <strong>${f((blau + gruen) / N, 4)}</strong>`), askProb('P', (blau + gruen) / N))],
          solution: `<strong>${f((blau + gruen) / N, 4)}</strong>`,
        };
      }
      const want = r.pick([['ein Herz', 13], ['ein Ass', 4], ['eine Bildkarte (B, D, K)', 12], ['eine rote Karte', 26]]);
      return {
        text: `<p>Aus einem Kartenspiel mit 52 Karten wird eine Karte gezogen. Wie wahrscheinlich ist <strong>${want[0]}</strong>?</p>`,
        answers: [prob('P', want[1] / 52)],
        hint: 'Wie viele dieser Karten gibt es im Spiel?',
        simple: 'Günstige Karten / alle 52 Karten.',
        steps: [step('Laplace', fx(`P = ${frac(want[1], 52)} = <strong>${f(want[1] / 52, 4)}</strong>`), askProb('P', want[1] / 52))],
        solution: `<strong>${f(want[1] / 52, 4)}</strong>`,
      };
    },
  };

  T['k9-muenze'] = {
    title: 'Münzwurf & Ergebnismenge',
    gen(r) {
      const n = r.int(2, 4);
      const k = r.int(1, n - 1);
      const p = St.nCk(n, k) / Math.pow(2, n);
      return {
        text: `<p>Eine faire Münze wird <strong>${n}-mal</strong> geworfen.</p><ol class="parts"><li>Wie viele Elemente hat die Ergebnismenge?</li><li>Wie groß ist die Wahrscheinlichkeit für <strong>genau ${k}-mal Kopf</strong>?</li></ol>`,
        answers: [num('a) |Ω|', Math.pow(2, n), { tol: 0 }), prob('b) P', p)],
        hint: `Jeder Wurf hat 2 Ausgänge → 2^${n} Ergebnisse. Dann abzählen, wo genau ${k}-mal Kopf vorkommt.`,
        simple: `Schreib alle Möglichkeiten wie KZK, ZZK … auf. Das sind 2·2·… = ${Math.pow(2, n)} Stück.`,
        steps: [
          step('Ergebnismenge', fx(`|Ω| = 2^${n} = <strong>${Math.pow(2, n)}</strong>`), ask('|Ω|', Math.pow(2, n), { tol: 0 })),
          step('Günstige', `Genau ${k}-mal K: (${n} über ${k}) = ${St.nCk(n, k)} Möglichkeiten`),
          step('Laplace', fx(`P = ${frac(St.nCk(n, k), Math.pow(2, n))} = <strong>${f(p, 4)}</strong>`), askProb('P', p)),
        ],
        solution: `a) ${Math.pow(2, n)} · b) <strong>${f(p, 4)}</strong>`,
      };
    },
  };

  T['k9-baum'] = {
    title: 'Baumdiagramm: zwei Ziehungen',
    gen(r) {
      const b = r.int(4, 9), y = r.int(3, 8), N = b + y;
      const pby = (b / N) * (y / (N - 1)), pyb = (y / N) * (b / (N - 1));
      const mixed = pby + pyb;
      return {
        text: `<p>Eine Urne enthält ${b} blaue und ${y} gelbe Kugeln. Zwei Kugeln werden <strong>ohne Zurücklegen</strong> gezogen.</p><ol class="parts"><li>P(2. Kugel gelb | 1. Kugel blau)?</li><li>P(eine gelbe und eine blaue, Reihenfolge egal)?</li></ol>`,
        answers: [prob('a) P', y / (N - 1)), prob('b) P', mixed)],
        hint: 'Nach dem ersten Zug ist eine Kugel weniger drin. Für b) beide Pfade (blau→gelb und gelb→blau) addieren.',
        simple: 'Male einen Baum: erste Verzweigung = 1. Zug, zweite = 2. Zug. Entlang eines Pfades multiplizieren, verschiedene Pfade addieren.',
        steps: [
          step('Baum', `<div class="tree">1. Zug: blau ${b}/${N}, gelb ${y}/${N}<br>→ nach blau: blau ${b - 1}/${N - 1}, gelb ${y}/${N - 1}<br>→ nach gelb: blau ${b}/${N - 1}, gelb ${y - 1}/${N - 1}</div>`),
          step('a) Bedingt', fx(`P = ${frac(y, N - 1)} = <strong>${f(y / (N - 1), 4)}</strong>`), askProb('a)', y / (N - 1))),
          step('b) Pfadregeln', fx(`${frac(b, N)} · ${frac(y, N - 1)} + ${frac(y, N)} · ${frac(b, N - 1)} = ${f(pby, 4)} + ${f(pyb, 4)} = <strong>${f(mixed, 4)}</strong>`), askProb('b)', mixed)),
        ],
        solution: `a) <strong>${f(y / (N - 1), 4)}</strong> · b) <strong>${f(mixed, 4)}</strong>`,
      };
    },
  };

  T['k9-mindestens'] = {
    title: '„Mindestens einmal“ & Unabhängigkeit',
    gen(r) {
      const type = r.pick(['bauteile', 'wuerfel']);
      if (type === 'bauteile') {
        const ps = [r.int(1, 6), r.int(2, 8), r.int(3, 9)];
        const ok = ps.reduce((acc, x) => acc * (1 - x / 100), 1);
        return {
          text: `<p>Ein Produkt besteht aus drei unabhängigen Teilen. Die Ausschusswahrscheinlichkeiten sind ${ps.join(' %, ')} %.</p><p>Wie groß ist die Wahrscheinlichkeit, dass das Endprodukt <strong>völlig einwandfrei</strong> ist?</p>`,
          answers: [prob('P(einwandfrei)', ok)],
          hint: 'Einwandfrei heißt: alle drei Teile sind ok. Unabhängig → multiplizieren.',
          simple: 'Damit eine Kette hält, müssen alle Glieder halten. Bei unabhängigen Gliedern multipliziert man ihre „Halte-Wahrscheinlichkeiten“.',
          steps: [step('Gegenwahrscheinlichkeiten', ps.map((x) => `1 − ${f(x / 100)} = ${f(1 - x / 100)}`).join('<br>')), step('Produkt', fx(`${ps.map((x) => f(1 - x / 100)).join(' · ')} = <strong>${f(ok, 4)}</strong>`), askProb('P', ok))],
          solution: `<strong>${f(ok, 4)}</strong> ≈ ${pc(ok)}`,
        };
      }
      const n = r.int(2, 6);
      const p = 1 - Math.pow(5 / 6, n);
      return {
        text: `<p>Ein Würfel wird <strong>${n}-mal</strong> geworfen. Wie groß ist die Wahrscheinlichkeit, <strong>mindestens einmal</strong> eine 6 zu werfen?</p>`,
        answers: [prob('P', p)],
        hint: 'Trick: Gegenereignis! „Mindestens einmal 6“ = 1 − „keine einzige 6“.',
        simple: '„Mindestens einmal“ ist kompliziert (1-mal, 2-mal, …). „Keinmal“ ist einfach. Also: 1 − keinmal.',
        steps: [step('Keinmal 6', fx(`(5/6)^${n} = ${f(Math.pow(5 / 6, n), 4)}`)), step('Gegenereignis', fx(`1 − ${f(Math.pow(5 / 6, n), 4)} = <strong>${f(p, 4)}</strong>`), askProb('P', p))],
        solution: `<strong>${f(p, 4)}</strong>`,
      };
    },
  };

  T['k9-additionssatz'] = {
    title: 'Additionssatz & Unabhängigkeit',
    gen(r) {
      const pa = r.step(0.5, 0.8, 0.05), pb = r.step(0.5, 0.85, 0.05);
      const indep = r.next() < 0.4;
      const pab = indep ? St.round(pa * pb, 4) : St.round(Math.min(pa, pb) - r.step(0.05, 0.15, 0.05), 2);
      const union = pa + pb - pab;
      const isIndep = Math.abs(pa * pb - pab) < 1e-9;
      return {
        text: `<p>Studierende bestehen Statistik mit P(S) = ${f(pa)} und Mathematik mit P(M) = ${f(pb)}. Beide werden mit P(S ∩ M) = ${f(pab, 4)} bestanden.</p><ol class="parts"><li>Sind die Ereignisse unabhängig?</li><li>Wie groß ist die Wahrscheinlichkeit, dass <strong>wenigstens eine</strong> Klausur bestanden wird?</li></ol>`,
        answers: [choice(r, 'a) Unabhängig?', isIndep ? 'ja, unabhängig' : 'nein, abhängig', [isIndep ? 'nein, abhängig' : 'ja, unabhängig'], { pts: 3 }), prob('b) P(S ∪ M)', union, { pts: 3 })],
        hint: 'Unabhängig, wenn P(S) · P(M) = P(S ∩ M). „Wenigstens eine“ = P(S ∪ M) = P(S) + P(M) − P(S ∩ M).',
        simple: 'Beim Addieren der beiden Kreise im Venn-Diagramm wird die Überschneidung doppelt gezählt – deshalb einmal abziehen.',
        steps: [
          step('a) Test auf Unabhängigkeit', fx(`P(S) · P(M) = ${f(pa)} · ${f(pb)} = ${f(pa * pb, 4)} ${isIndep ? '=' : '≠'} ${f(pab, 4)}`) + `→ <strong>${isIndep ? 'unabhängig' : 'abhängig'}</strong>`),
          step('b) Additionssatz', fx(`P(S ∪ M) = ${f(pa)} + ${f(pb)} − ${f(pab, 4)} = <strong>${f(union, 4)}</strong>`), askProb('P(S ∪ M)', union)),
        ],
        solution: `a) ${isIndep ? 'unabhängig' : 'abhängig'} · b) <strong>${f(union, 4)}</strong>`,
      };
    },
  };

  T['k9-wartezeit'] = {
    title: 'Wie oft muss man mindestens …?',
    gen(r) {
      const ev = r.pick([['eine gerade Augenzahl', 0.5], ['eine 6', 1 / 6], ['eine Zahl größer als 4', 1 / 3]]);
      const target = r.pick([0.9, 0.95, 0.99]);
      const n = Math.ceil(Math.log(1 - target) / Math.log(1 - ev[1]) - 1e-9);
      return {
        text: `<p>Wie oft muss ein fairer Würfel <strong>mindestens</strong> geworfen werden, damit die Wahrscheinlichkeit, mindestens einmal <strong>${ev[0]}</strong> zu werfen, mindestens <strong>${f(target)}</strong> beträgt?</p>`,
        answers: [num('n', n, { tol: 0 })],
        hint: '1 − (1 − p)ⁿ ≥ Ziel. Nach n auflösen mit dem Logarithmus.',
        simple: 'Wir suchen die kleinste Wurfzahl, bei der „keinmal“ unwahrscheinlicher als ' + f(1 - target) + ' ist.',
        steps: [
          step('Ansatz', fx(`1 − (${f(1 - ev[1], 4)})ⁿ ≥ ${f(target)} ⇔ (${f(1 - ev[1], 4)})ⁿ ≤ ${f(1 - target)}`)),
          step('Logarithmus', fx(`n ≥ ${frac(`ln(${f(1 - target)})`, `ln(${f(1 - ev[1], 4)})`)} = ${f(Math.log(1 - target) / Math.log(1 - ev[1]), 3)}`) + box('Achtung: Teilt man durch eine negative Zahl (ln von etwas < 1), dreht sich das Ungleichheitszeichen.', 'info')),
          step('Aufrunden', fx(`n = <strong>${n}</strong>`), ask('n', n, { tol: 0 })),
        ],
        solution: `Mindestens <strong>${n}</strong> Würfe`,
      };
    },
  };

  /* ---------- Kapitel 10: Bayes ---------- */
  function bayesNumbers(prev, sens, fp, N = 10000) {
    const sick = N * prev, healthy = N - sick;
    const tp = sick * sens, fn = sick - tp, fpos = healthy * fp, tn = healthy - fpos;
    return { N, sick, healthy, tp, fn, fpos, tn, pos: tp + fpos, ppv: tp / (tp + fpos) };
  }
  function bayesTreeHtml(B, labels = ['krank', 'gesund', 'positiv', 'negativ']) {
    return `<div class="nat-tree">
      <div class="nt-root">${f(B.N, 0)} Personen</div>
      <div class="nt-level"><div class="nt-node bad">${f(B.sick, 2)} ${labels[0]}</div><div class="nt-node good">${f(B.healthy, 2)} ${labels[1]}</div></div>
      <div class="nt-level four"><div class="nt-leaf hl">${f(B.tp, 2)} ${labels[2]}</div><div class="nt-leaf">${f(B.fn, 2)} ${labels[3]}</div><div class="nt-leaf hl2">${f(B.fpos, 2)} ${labels[2]}</div><div class="nt-leaf">${f(B.tn, 2)} ${labels[3]}</div></div>
    </div>`;
  }

  T['k10-haeufigkeiten'] = {
    title: 'Bayes mit 10.000 Personen (1)',
    gen(r) {
      const prev = r.pick([0.01, 0.02, 0.05, 0.1, 0.005]);
      const sens = r.pick([0.8, 0.9, 0.95, 0.98]);
      const fp = r.pick([0.02, 0.05, 0.1]);
      const B = bayesNumbers(prev, sens, fp);
      return {
        text: `<p>Eine Krankheit haben <strong>${pc(prev, 1)}</strong> der Bevölkerung. Ein Test erkennt Kranke mit <strong>${pc(sens, 0)}</strong> Wahrscheinlichkeit.</p><p>Wir denken uns <strong>10.000 Personen</strong>. Wie viele davon sind krank, und wie viele davon sind <strong>krank UND positiv getestet</strong>?</p>`,
        answers: [num('kranke Personen', B.sick, { tol: 0.5 }), num('krank & positiv', B.tp, { tol: 0.5 })],
        hint: `Kranke = 10.000 · ${f(prev, 3)}. Davon positiv = Kranke · ${f(sens)}.`,
        simple: 'Statt mit Prozenten rechnen wir mit echten Menschen. Das ist viel leichter vorzustellen!',
        steps: [
          step('Kranke', fx(`10.000 · ${f(prev, 3)} = <strong>${f(B.sick, 0)}</strong>`), ask('Kranke', B.sick, { tol: 0.5 })),
          step('Davon positiv', fx(`${f(B.sick, 0)} · ${f(sens)} = <strong>${f(B.tp, 2)}</strong>`), ask('krank & positiv', B.tp, { tol: 0.5 })),
          step('Bild', bayesTreeHtml(B)),
        ],
        solution: `Krank: <strong>${f(B.sick, 0)}</strong>, krank & positiv: <strong>${f(B.tp, 2)}</strong>`,
      };
    },
  };

  T['k10-falschpositiv'] = {
    title: 'Bayes mit 10.000 Personen (2)',
    gen(r) {
      const prev = r.pick([0.01, 0.02, 0.05, 0.001]);
      const fp = r.pick([0.01, 0.02, 0.03, 0.05]);
      const sens = r.pick([0.9, 0.95]);
      const B = bayesNumbers(prev, sens, fp);
      return {
        text: `<p>${pc(prev, 1)} der Menschen sind krank. Bei <strong>Gesunden</strong> schlägt der Test in <strong>${pc(fp, 0)}</strong> der Fälle fälschlich an. Kranke erkennt er zu ${pc(sens, 0)}.</p><p>Von 10.000 Personen: Wie viele sind <strong>gesund, aber positiv</strong> getestet? Wie viele Personen sind <strong>insgesamt positiv</strong>?</p>`,
        answers: [num('gesund & positiv', B.fpos, { tol: 0.5 }), num('positiv insgesamt', B.pos, { tol: 0.5 })],
        hint: 'Gesunde = 10.000 − Kranke. Davon falsch positiv = Gesunde · Fehlalarmrate. Positive insgesamt = richtig positive + falsch positive.',
        simple: 'Selbst ein kleiner Fehlalarm-Anteil trifft sehr viele Gesunde – weil es so viele Gesunde gibt!',
        steps: [
          step('Gesunde', fx(`10.000 − ${f(B.sick, 0)} = ${f(B.healthy, 0)}`)),
          step('Falsch positiv', fx(`${f(B.healthy, 0)} · ${f(fp)} = <strong>${f(B.fpos, 2)}</strong>`), ask('gesund & positiv', B.fpos, { tol: 0.5 })),
          step('Richtig positiv', fx(`${f(B.sick, 0)} · ${f(sens)} = ${f(B.tp, 2)}`)),
          step('Alle Positiven', fx(`${f(B.tp, 2)} + ${f(B.fpos, 2)} = <strong>${f(B.pos, 2)}</strong>`) + bayesTreeHtml(B), ask('positiv insgesamt', B.pos, { tol: 0.5 })),
        ],
        solution: `Falsch positiv: <strong>${f(B.fpos, 2)}</strong>, positiv insgesamt: <strong>${f(B.pos, 2)}</strong>`,
      };
    },
  };

  T['k10-totale'] = {
    title: 'Totale Wahrscheinlichkeit',
    gen(r) {
      const pm = r.step(0.3, 0.7, 0.05), rm = r.step(0.1, 0.6, 0.05), rf = r.step(0.1, 0.6, 0.05);
      const total = pm * rm + (1 - pm) * rf;
      return {
        text: `<p>${pc(rm, 0)} der Männer und ${pc(rf, 0)} der Frauen lesen Zeitung. Die Bevölkerung besteht zu ${pc(pm, 0)} aus Männern und zu ${pc(1 - pm, 0)} aus Frauen.</p><p>Wie groß ist die Wahrscheinlichkeit, dass eine zufällig ausgewählte Person <strong>Zeitung liest</strong>?</p>`,
        answers: [prob('P(Zeitung)', total)],
        hint: 'Alle Pfade im Baum, die bei „liest Zeitung“ enden, addieren: Männer-Pfad + Frauen-Pfad.',
        simple: 'Von 100 Personen sind ' + f(pm * 100, 0) + ' Männer. Wie viele davon lesen? Dasselbe für Frauen. Zusammenzählen!',
        steps: [
          step('Pfad Männer', fx(`${f(pm)} · ${f(rm)} = ${f(pm * rm, 4)}`)),
          step('Pfad Frauen', fx(`${f(1 - pm)} · ${f(rf)} = ${f((1 - pm) * rf, 4)}`)),
          step('Summe', fx(`P(Z) = ${f(pm * rm, 4)} + ${f((1 - pm) * rf, 4)} = <strong>${f(total, 4)}</strong>`), askProb('P(Z)', total)),
        ],
        solution: `P(Zeitung) = <strong>${f(total, 4)}</strong>`,
      };
    },
  };

  T['k10-bedingt-tabelle'] = {
    title: 'Bedingte Wahrscheinlichkeit aus Tabelle',
    gen(r) {
      const { p, t } = gen2x2(r);
      const n = St.sum(t);
      const pAB = t[0] / n, pA = (t[0] + t[2]) / n;
      return {
        text: `${t2x2(p, t)}<p>Eine Person wird zufällig ausgewählt. Sie gehört zu <strong>„${p.a[0]}“</strong>. Wie groß ist die Wahrscheinlichkeit, dass sie auch <strong>„${p.b[0]}“</strong> ist?</p>`,
        answers: [prob('P', t[0] / (t[0] + t[2]))],
        hint: 'P(B | A) = P(A ∩ B) / P(A). In der Tabelle: Feld / Spaltensumme.',
        simple: 'Wir wissen schon, dass die Person zur Spalte „' + p.a[0] + '“ gehört. Also schauen wir nur noch in diese Spalte.',
        steps: [
          step('Formel', fx(`P(B | A) = ${frac('P(A ∩ B)', 'P(A)')} = ${frac(f(pAB, 4), f(pA, 4))}`)),
          step('Oder direkt', fx(`${frac(t[0], t[0] + t[2])} = <strong>${f(t[0] / (t[0] + t[2]), 4)}</strong>`), askProb('P', t[0] / (t[0] + t[2]))),
        ],
        solution: `<strong>${f(t[0] / (t[0] + t[2]), 4)}</strong>`,
      };
    },
  };

  T['k10-bayes'] = {
    title: 'Klausuraufgabe: Satz von Bayes',
    gen(r) {
      const prev = r.pick([0.0005, 0.001, 0.002, 0.005, 0.01, 0.02]);
      const sens = r.pick([0.88, 0.9, 0.91, 0.92, 0.95, 0.98]);
      const fp = r.pick([0.01, 0.02, 0.03, 0.05]);
      const B = bayesNumbers(prev, sens, fp, 1000000);
      const pPos = prev * sens + (1 - prev) * fp;
      const post = (prev * sens) / pPos;
      return {
        text: `<p>Die Wahrscheinlichkeit, dass jemand eine bestimmte Krankheit hat, sei <strong>${f(prev, 4)}</strong>. Ein Test schlägt bei Kranken mit Wahrscheinlichkeit <strong>${f(sens, 2)}</strong> an. Bei Gesunden schlägt er in <strong>${pc(fp, 0)}</strong> der Fälle unberechtigt an.</p><p>Wie hoch ist die Wahrscheinlichkeit, dass eine positiv getestete Person <strong>tatsächlich krank</strong> ist? (10 Punkte)</p>`,
        answers: [prob('P(krank | positiv)', post, { pts: 10, tol: Math.max(0.0015, post * 0.03) })],
        hint: 'Erst P(positiv) mit der totalen Wahrscheinlichkeit, dann Bayes: P(K|+) = P(+|K)·P(K) / P(+). Oder mit 1.000.000 Personen rechnen!',
        simple: `Stell dir 1.000.000 Menschen vor. Nur ${f(B.sick, 0)} sind krank, davon ${f(B.tp, 0)} positiv. Aber von ${f(B.healthy, 0)} Gesunden sind ${f(B.fpos, 0)} auch positiv! Von allen Positiven sind also nur wenige wirklich krank.`,
        steps: [
          step('Was ist gefragt?', 'Gesucht ist P(krank | positiv): Unter allen <em>Positiven</em> – wie viele sind wirklich krank?'),
          step('Mit echten Menschen denken', bayesTreeHtml(B)),
          step('Totale Wahrscheinlichkeit', fx(`P(+) = ${f(prev, 4)} · ${f(sens)} + ${f(1 - prev, 4)} · ${f(fp)} = <strong>${f(pPos, 6)}</strong>`), askProb('P(+)', pPos, { tol: pPos * 0.02 })),
          step('Bayes', fx(`P(K | +) = ${frac(`${f(prev, 4)} · ${f(sens)}`, f(pPos, 6))} = ${frac(f(prev * sens, 6), f(pPos, 6))} = <strong>${f(post, 4)}</strong>`), askProb('P(K|+)', post, { tol: Math.max(0.0015, post * 0.03) })),
          step('Deuten', `Nur etwa <strong>${pc(post, 1)}</strong> der Positiven sind wirklich krank! Grund: Die Krankheit ist so selten, dass die vielen Fehlalarme bei Gesunden überwiegen.`),
        ],
        solution: `P(krank | positiv) ≈ <strong>${f(post, 4)}</strong> = ${pc(post)}`,
      };
    },
  };

  T['k10-maschinen'] = {
    title: 'Bayes: Woher kommt das defekte Teil?',
    gen(r) {
      const shares = r.pick([[0.5, 0.3, 0.2], [0.4, 0.35, 0.25], [0.6, 0.25, 0.15]]);
      const defects = [r.pick([0.01, 0.02, 0.03]), r.pick([0.02, 0.04, 0.05]), r.pick([0.05, 0.06, 0.08])];
      const pD = St.sum(shares.map((s, i) => s * defects[i]));
      const k = r.int(0, 2);
      const post = (shares[k] * defects[k]) / pD;
      const M = ['A', 'B', 'C'];
      return {
        text: `<p>Drei Maschinen produzieren Teile:</p>${table(['Maschine', 'Anteil Produktion', 'Ausschussquote'], M.map((m, i) => [m, pc(shares[i], 0), pc(defects[i], 0)]))}<p>Ein zufällig gezogenes Teil ist <strong>defekt</strong>. Mit welcher Wahrscheinlichkeit stammt es von <strong>Maschine ${M[k]}</strong>?</p>`,
        answers: [prob('P(Defekt)', pD, { pts: 4 }), prob(`P(${M[k]} | Defekt)`, post, { pts: 6 })],
        hint: 'Erst P(Defekt) als Summe aller Pfade. Dann den Pfad von Maschine ' + M[k] + ' durch P(Defekt) teilen.',
        simple: 'Von 10.000 Teilen: Wie viele defekte kommen von jeder Maschine? Dann: defekte von ' + M[k] + ' / alle defekten.',
        steps: [
          step('Pfade', table(['Maschine', 'Anteil · Ausschuss'], M.map((m, i) => [m, `${f(shares[i])} · ${f(defects[i])} = ${f(shares[i] * defects[i], 4)}`]))),
          step('P(Defekt)', fx(`P(D) = <strong>${f(pD, 4)}</strong>`), askProb('P(D)', pD)),
          step('Bayes', fx(`P(${M[k]} | D) = ${frac(f(shares[k] * defects[k], 4), f(pD, 4))} = <strong>${f(post, 4)}</strong>`), askProb('P', post)),
        ],
        solution: `P(D) = ${f(pD, 4)}; P(${M[k]} | D) = <strong>${f(post, 4)}</strong>`,
      };
    },
  };

  /* ---------- Kapitel 11: Zufallsvariablen ---------- */
  function genDist(r) {
    const xs = St.sorted(r.sample([0, 1, 2, 3, 4, 5, 6, 8, 9, 10], r.int(4, 5)));
    let ps = xs.map(() => r.int(1, 6));
    const sum = St.sum(ps);
    ps = ps.map((p) => St.round(p / sum, 2));
    const diff = St.round(1 - St.sum(ps), 2);
    ps[ps.length - 1] = St.round(ps[ps.length - 1] + diff, 2);
    if (ps.some((p) => p <= 0)) return { xs: [2, 3, 5, 8, 9], ps: [0.1, 0.4, 0.2, 0.1, 0.2] };
    return { xs, ps };
  }
  function evSteps(xs, ps, withVar) {
    const E = St.sum(xs.map((x, i) => x * ps[i]));
    const V = St.sum(xs.map((x, i) => (x - E) ** 2 * ps[i]));
    const steps = [
      step('Erwartungswert', fx(`E(X) = Σ xᵢ · p(xᵢ) = ${xs.map((x, i) => `${x}·${f(ps[i])}`).join(' + ')} = <strong>${f(E, 4)}</strong>`), ask('E(X)', E)),
    ];
    if (withVar) {
      steps.push(step('Varianz', table(['xᵢ', 'p', '(xᵢ − E)²', '· p'], xs.map((x, i) => [x, f(ps[i]), f((x - E) ** 2, 4), f((x - E) ** 2 * ps[i], 4)]))
        + fx(`Var(X) = Σ (xᵢ − E)² · p = <strong>${f(V, 4)}</strong>`), ask('Var(X)', V)));
      steps.push(step('Standardabweichung', fx(`σ = ${sqrt(f(V, 4))} = <strong>${f(Math.sqrt(V), 4)}</strong>`), ask('σ', Math.sqrt(V))));
    }
    return { E, V, sd: Math.sqrt(V), steps };
  }

  T['k11-erwartungswert'] = {
    title: 'Erwartungswert',
    gen(r) {
      const { xs, ps } = genDist(r);
      const R = evSteps(xs, ps, false);
      return {
        text: `<p>Eine Zufallsvariable X hat diese Wahrscheinlichkeitsfunktion:</p>${table(['xᵢ', ...xs], [['p(xᵢ)', ...ps.map((p) => f(p))]])}<p>Berechne den <strong>Erwartungswert E(X)</strong>.</p>`,
        answers: [num('E(X)', R.E)],
        hint: 'Jeden Wert mit seiner Wahrscheinlichkeit multiplizieren und alles addieren.',
        simple: 'Der Erwartungswert ist der Durchschnitt, den du bekommst, wenn du das Experiment sehr, sehr oft wiederholst.',
        steps: R.steps,
        solution: `E(X) = <strong>${f(R.E, 4)}</strong>`,
      };
    },
  };

  T['k11-varianz'] = {
    title: 'Varianz einer Zufallsvariablen',
    gen(r) {
      const { xs, ps } = genDist(r);
      const R = evSteps(xs, ps, true);
      return {
        text: `<p>Wahrscheinlichkeitsfunktion von X:</p>${table(['xᵢ', ...xs], [['p(xᵢ)', ...ps.map((p) => f(p))]])}<p>Berechne <strong>E(X)</strong> und die <strong>Standardabweichung σ(X)</strong>.</p>`,
        answers: [num('E(X)', R.E), num('σ(X)', R.sd)],
        hint: 'Erst E(X). Dann Var(X) = Σ (xᵢ − E)² · p(xᵢ). σ = Wurzel daraus.',
        simple: 'Wie bei der Standardabweichung von Daten – nur dass jeder Wert mit seiner Wahrscheinlichkeit gewichtet wird.',
        steps: R.steps,
        solution: `E(X) = <strong>${f(R.E, 4)}</strong>, σ = <strong>${f(R.sd, 4)}</strong>`,
      };
    },
  };

  T['k11-versicherung'] = {
    title: 'Erwartungswert: Versicherung',
    gen(r) {
      const premium = r.step(50, 300, 10), payout = r.step(5000, 50000, 1000), p = r.pick([0.0005, 0.0008, 0.001, 0.002, 0.004]);
      const E = premium - p * payout;
      return {
        text: `<p>Eine Feuerversicherung kostet <strong>${premium} €</strong> pro Jahr. Im Brandfall zahlt sie <strong>${f(payout, 0)} €</strong>. Die Brandwahrscheinlichkeit beträgt <strong>${f(p, 4)}</strong> pro Jahr.</p><p>Wie hoch ist der <strong>durchschnittliche Überschuss</strong> der Versicherung pro Vertrag und Jahr?</p>`,
        answers: [num('Überschuss (€)', E, { tol: 0.05 })],
        hint: 'Einnahme sicher: Prämie. Ausgabe nur mit Wahrscheinlichkeit p: p · Auszahlung.',
        simple: `Bei 10.000 Verträgen kassiert die Versicherung 10.000 · ${premium} €. Es brennt im Schnitt ${f(p * 10000, 0)}-mal. Was bleibt pro Vertrag übrig?`,
        steps: [
          step('Erwartete Auszahlung', fx(`${f(p, 4)} · ${f(payout, 0)} = ${f(p * payout, 2)} €`)),
          step('Überschuss', fx(`E = ${premium} − ${f(p * payout, 2)} = <strong>${f(E, 2)} €</strong>`), ask('Überschuss', E, { tol: 0.05 })),
        ],
        solution: `<strong>${f(E, 2)} €</strong> pro Vertrag und Jahr`,
      };
    },
  };

  T['k11-spiel'] = {
    title: 'Ist das Spiel fair?',
    gen(r) {
      const stake = r.pick([1, 2, 3, 5]);
      const prizes = [0, r.pick([2, 3, 4]), r.pick([6, 8, 10]), r.pick([20, 25, 50])];
      const p = [0, St.round(r.float(0.15, 0.3, 2), 2), St.round(r.float(0.05, 0.12, 2), 2), St.round(r.float(0.01, 0.04, 2), 2)];
      p[0] = St.round(1 - p[1] - p[2] - p[3], 2);
      const gains = prizes.map((x) => x - stake);
      const R = evSteps(gains, p, true);
      const fairText = Math.abs(R.E) < 0.005 ? 'fair' : R.E < 0 ? 'nicht fair – ungünstig für den Spieler' : 'nicht fair – günstig für den Spieler';
      return {
        text: `<p>Ein Glücksspiel kostet <strong>${stake} € Einsatz</strong>. Auszahlungen:</p>${table(['Auszahlung', ...prizes.map((x) => x + ' €')], [['Wahrscheinlichkeit', ...p.map((x) => f(x))]])}<p>Berechne den <strong>erwarteten Gewinn</strong> (Auszahlung − Einsatz) und dessen <strong>Standardabweichung</strong>. Ist das Spiel fair?</p>`,
        answers: [num('E(Gewinn) (€)', R.E, { tol: 0.01, pts: 3 }), num('σ (€)', R.sd, { pts: 4 }), choice(r, 'Fair?', fairText, ['fair', 'nicht fair – ungünstig für den Spieler', 'nicht fair – günstig für den Spieler'].filter((x) => x !== fairText), { pts: 2 })],
        hint: 'Gewinn = Auszahlung − Einsatz. Fair heißt: E(Gewinn) = 0.',
        simple: 'Wenn du das Spiel 1.000-mal spielst: Wie viel hast du am Ende im Schnitt pro Spiel gewonnen oder verloren?',
        steps: [step('Gewinne', table(['Auszahlung', 'Gewinn', 'p'], prizes.map((x, i) => [x, gains[i], f(p[i])]))), ...R.steps, step('Fair?', `E(Gewinn) = ${f(R.E, 2)} € → <strong>${fairText}</strong>`)],
        solution: `E = <strong>${f(R.E, 2)} €</strong>, σ = <strong>${f(R.sd, 2)} €</strong> → ${fairText}`,
      };
    },
  };

  /* ---------- Kapitel 12: Verteilungen ---------- */
  T['k12-binomial'] = {
    title: 'Binomialverteilung: genau k',
    gen(r) {
      const n = r.int(4, 10), p = r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8, 0.9]), k = r.int(0, Math.min(n, 5));
      const res = St.binomPmf(k, n, p);
      const ctx = r.pick([`Ein Basketballer trifft mit ${pc(p, 0)}. Er wirft ${n}-mal.`, `${pc(p, 0)} aller Kunden kaufen etwas. ${n} Kunden betreten den Laden.`, `Ein Bauteil ist mit ${pc(p, 0)} defekt. Es werden ${n} Teile geprüft.`]);
      return {
        text: `<p>${ctx}</p><p>Wie groß ist die Wahrscheinlichkeit für <strong>genau ${k} Treffer/Erfolge</strong>?</p>`,
        answers: [prob('P(X = ' + k + ')', res)],
        hint: `P(X = k) = (n über k) · pᵏ · (1 − p)ⁿ⁻ᵏ mit n = ${n}, p = ${f(p)}, k = ${k}.`,
        simple: 'Wie wahrscheinlich ist eine bestimmte Reihenfolge (z. B. erst Treffer, dann daneben …)? Und wie viele solche Reihenfolgen gibt es? Beides malnehmen.',
        steps: [
          step('Binomial?', `Feste Anzahl Versuche (n = ${n}), nur Erfolg/Misserfolg, immer gleiches p = ${f(p)} → <strong>Binomialverteilung</strong>.`),
          step('Formel', fx(`P(X = k) = (n über k) · pᵏ · (1 − p)ⁿ⁻ᵏ`)),
          step('Einsetzen', fx(`(${n} über ${k}) · ${f(p)}^${k} · ${f(1 - p)}^${n - k} = ${St.nCk(n, k)} · ${f(Math.pow(p, k), 6)} · ${f(Math.pow(1 - p, n - k), 6)} = <strong>${f(res, 4)}</strong>`), askProb('P', res)),
        ],
        solution: `P(X = ${k}) = <strong>${f(res, 4)}</strong>`,
      };
    },
  };

  T['k12-binomial-mind'] = {
    title: 'Binomialverteilung: mindestens k',
    gen(r) {
      const n = r.int(4, 6), p = r.pick([0.7, 0.8, 0.9, 0.95]), k = n - 1;
      const res = St.binomPmf(n - 1, n, p) + St.binomPmf(n, n, p);
      return {
        text: `<p>Ein Medikament hat eine Heilungschance von <strong>${pc(p, 0)}</strong>. Es werden ${n} Personen behandelt.</p><p>Wie wahrscheinlich werden <strong>mindestens ${k}</strong> gesund?</p>`,
        answers: [prob('P(X ≥ ' + k + ')', res)],
        hint: `Mindestens ${k} = genau ${k} ODER genau ${n}. Beide Wahrscheinlichkeiten addieren.`,
        simple: 'Zerlege „mindestens“ in einzelne Fälle und addiere sie.',
        steps: [
          step(`P(X = ${n - 1})`, fx(`(${n} über ${n - 1}) · ${f(p)}^${n - 1} · ${f(1 - p)} = ${f(St.binomPmf(n - 1, n, p), 4)}`)),
          step(`P(X = ${n})`, fx(`${f(p)}^${n} = ${f(St.binomPmf(n, n, p), 4)}`)),
          step('Addieren', fx(`<strong>${f(res, 4)}</strong>`), askProb('P', res)),
        ],
        solution: `<strong>${f(res, 4)}</strong>`,
      };
    },
  };

  T['k12-poisson'] = {
    title: 'Poissonverteilung',
    gen(r) {
      const lam = r.pick([0.5, 1, 1.5, 2, 2.5, 3, 4]);
      const k = r.int(0, 4);
      const res = St.poissonPmf(k, lam);
      const ctx = r.pick([`In einer Telefonzentrale gehen im Schnitt ${f(lam)} Anrufe pro Minute ein.`, `Auf einer Buchseite gibt es im Schnitt ${f(lam)} Tippfehler.`, `An einer Kreuzung passieren im Schnitt ${f(lam)} Unfälle pro Monat.`]);
      return {
        text: `<p>${ctx}</p><p>Wie wahrscheinlich sind <strong>genau ${k}</strong> Ereignisse?</p>`,
        answers: [prob(`P(X = ${k})`, res)],
        hint: 'P(X = k) = λᵏ / k! · e^(−λ)',
        simple: 'Poisson ist für „seltene Ereignisse pro Zeitraum“ – man kennt nur den Durchschnitt λ.',
        steps: [
          step('Poisson?', `Wir zählen Ereignisse in einem Zeitraum, kennen nur den Durchschnitt λ = ${f(lam)} → Poisson.`),
          step('Einsetzen', fx(`P(X = ${k}) = ${frac(`${f(lam)}^${k}`, `${k}!`)} · e^(−${f(lam)}) = ${frac(f(Math.pow(lam, k), 4), St.fact(k))} · ${f(Math.exp(-lam), 4)} = <strong>${f(res, 4)}</strong>`), askProb('P', res)),
        ],
        solution: `<strong>${f(res, 4)}</strong>`,
      };
    },
  };

  function normalCtx(r) {
    return r.pick([
      { what: 'Das Füllgewicht von Dosen', unit: 'g', mu: r.float(245, 255, 1), sigma: r.float(5, 12, 2), lo: 240 },
      { what: 'Die Länge von Bolzen', unit: 'mm', mu: r.pick([100, 100.05, 100.1]), sigma: 0.1, lo: 99.8, hi: 100.2 },
      { what: 'Die Flugzeit', unit: 'min', mu: r.int(430, 450), sigma: r.int(10, 20), lo: 420, hi: 460 },
      { what: 'Die Körpergröße von Männern', unit: 'cm', mu: r.int(175, 182), sigma: r.int(6, 9), lo: 170, hi: 190 },
      { what: 'Die Lebensdauer von Akkus', unit: 'h', mu: r.step(800, 1200, 50), sigma: r.step(50, 150, 10), lo: 700, hi: 1000 },
    ]);
  }

  T['k12-normal-unter'] = {
    title: 'Normalverteilung: P(X < x)',
    gen(r) {
      const c = normalCtx(r);
      const z = (c.lo - c.mu) / c.sigma;
      const zr = St.round(z, 2);
      const p = St.normCdf(zr);
      return {
        text: `<p>${c.what} ist normalverteilt mit μ = ${f(c.mu)} ${c.unit} und σ = ${f(c.sigma)} ${c.unit}.</p><p>Wie groß ist der Anteil mit <strong>weniger als ${f(c.lo)} ${c.unit}</strong>?</p>`,
        answers: [prob('P(X < ' + f(c.lo) + ')', p, { tol: 0.005 })],
        hint: 'Standardisieren: z = (x − μ) / σ. Dann in der Tabelle Φ(z) nachschlagen. Für negative z: Φ(−z) = 1 − Φ(z).',
        simple: 'Wir übersetzen den Wert in „Wie viele Standardabweichungen ist das vom Mittelwert weg?“. Mit dieser Zahl z liest man die Wahrscheinlichkeit aus einer Tabelle ab.',
        steps: [
          step('Standardisieren', fx(`z = ${frac(`${f(c.lo)} − ${f(c.mu)}`, f(c.sigma))} = <strong>${f(zr, 2)}</strong>`), ask('z', zr, { tol: 0.02 })),
          step('Tabelle', zr < 0 ? fx(`Φ(${f(zr)}) = 1 − Φ(${f(-zr)}) = 1 − ${f(St.normCdf(-zr), 4)} = <strong>${f(p, 4)}</strong>`) : fx(`Φ(${f(zr)}) = <strong>${f(p, 4)}</strong>`), askProb('P', p, { tol: 0.005 })),
          step('Bild', SL.Charts ? SL.Charts.normal({ mu: c.mu, sigma: c.sigma, shadeTo: c.lo, marks: [{ x: c.lo, label: f(c.lo) }], height: 200 }) : ''),
        ],
        solution: `P(X < ${f(c.lo)}) ≈ <strong>${f(p, 4)}</strong> = ${pc(p)}`,
      };
    },
  };

  T['k12-normal-zwischen'] = {
    title: 'Normalverteilung: P(a < X < b)',
    gen(r) {
      let c = normalCtx(r);
      while (c.hi === undefined) c = normalCtx(r);
      const za = St.round((c.lo - c.mu) / c.sigma, 2), zb = St.round((c.hi - c.mu) / c.sigma, 2);
      const p = St.normCdf(zb) - St.normCdf(za);
      return {
        text: `<p>${c.what} ist normalverteilt mit μ = ${f(c.mu)} ${c.unit} und σ = ${f(c.sigma)} ${c.unit}.</p><p>Wie wahrscheinlich liegt ein Wert <strong>zwischen ${f(c.lo)} und ${f(c.hi)} ${c.unit}</strong>?</p>`,
        answers: [prob('P', p, { tol: 0.006 })],
        hint: 'P(a < X < b) = Φ(z_b) − Φ(z_a).',
        simple: 'Fläche bis b minus Fläche bis a = Fläche dazwischen.',
        steps: [
          step('z-Werte', fx(`z_a = ${frac(`${f(c.lo)} − ${f(c.mu)}`, f(c.sigma))} = ${f(za)}, &nbsp; z_b = ${frac(`${f(c.hi)} − ${f(c.mu)}`, f(c.sigma))} = ${f(zb)}`)),
          step('Tabelle', fx(`Φ(${f(zb)}) − Φ(${f(za)}) = ${f(St.normCdf(zb), 4)} − ${f(St.normCdf(za), 4)} = <strong>${f(p, 4)}</strong>`), askProb('P', p, { tol: 0.006 })),
          step('Bild', SL.Charts ? SL.Charts.normal({ mu: c.mu, sigma: c.sigma, shadeFrom: c.lo, shadeTo: c.hi, marks: [{ x: c.lo, label: f(c.lo) }, { x: c.hi, label: f(c.hi) }], height: 200 }) : ''),
        ],
        solution: `<strong>${f(p, 4)}</strong> = ${pc(p)}`,
      };
    },
  };

  T['k12-normal-intervall'] = {
    title: 'Normalverteilung: symmetrisches Intervall',
    gen(r) {
      const mu = r.step(100, 300, 10), sigma = r.step(10, 40, 5), level = r.pick([0.9, 0.95, 0.99]);
      const z = St.zTwoSided(level);
      return {
        text: `<p>Die Zahl der Fluggäste pro Flug ist normalverteilt mit μ = ${mu} und σ = ${sigma}.</p><p>In welchem <strong>symmetrischen Intervall um μ</strong> liegt die Fluggastzahl mit <strong>${pc(level, 0)}</strong> Wahrscheinlichkeit?</p>`,
        answers: [num('Untergrenze', mu - z * sigma, { pts: 3 }), num('Obergrenze', mu + z * sigma, { pts: 3 })],
        hint: `Bei ${pc(level, 0)} in der Mitte bleiben je ${pc((1 - level) / 2, 1)} links und rechts übrig. Gesucht ist z mit Φ(z) = ${f(1 - (1 - level) / 2, 3)}.`,
        simple: 'Wir gehen vom Mittelwert z Standardabweichungen nach links und nach rechts.',
        steps: [
          step('z-Wert', fx(`Φ(z) = ${f(1 - (1 - level) / 2, 3)} → z = <strong>${f(z, 3)}</strong>`), ask('z', z, { tol: 0.01 })),
          step('Grenzen', fx(`${mu} ± ${f(z, 3)} · ${sigma} = [${f(mu - z * sigma, 2)}; ${f(mu + z * sigma, 2)}]`), ask('Untergrenze', mu - z * sigma)),
          step('Bild', SL.Charts ? SL.Charts.normal({ mu, sigma, shadeFrom: mu - z * sigma, shadeTo: mu + z * sigma, height: 200 }) : ''),
        ],
        solution: `[<strong>${f(mu - z * sigma, 2)}</strong>; <strong>${f(mu + z * sigma, 2)}</strong>]`,
      };
    },
  };

  T['k12-poisson-skaliert'] = {
    title: 'Poisson mit Zeitraum-Umrechnung',
    gen(r) {
      const lam1 = r.pick([0.5, 1, 1.5, 2]), t = r.int(3, 6), k = r.int(2, 8);
      const lam = lam1 * t;
      const p1 = St.poissonCdf(1, lam1);
      const pk = St.poissonPmf(k, lam);
      return {
        text: `<p>In einer Telefonzentrale gehen im Durchschnitt <strong>${f(lam1)} Anrufe pro Minute</strong> ein.</p><ol class="parts"><li>Wie wahrscheinlich gehen in einer Minute <strong>höchstens 1</strong> Anruf ein?</li><li>Wie wahrscheinlich sind es in <strong>${t} Minuten genau ${k}</strong> Anrufe?</li></ol>`,
        answers: [prob('a) P(X ≤ 1)', p1, { pts: 3 }), prob(`b) P(Y = ${k})`, pk, { pts: 4 })],
        hint: `a) P(0) + P(1). b) Neuer Zeitraum → neues λ = ${f(lam1)} · ${t}.`,
        simple: 'Wenn pro Minute im Schnitt 1 Anruf kommt, kommen in 5 Minuten im Schnitt 5 Anrufe. λ wächst mit dem Zeitraum mit.',
        steps: [
          step('a) Höchstens 1', fx(`P(0) + P(1) = e^(−${f(lam1)}) + ${f(lam1)} · e^(−${f(lam1)}) = <strong>${f(p1, 4)}</strong>`), askProb('a)', p1)),
          step('b) λ umrechnen', fx(`λ = ${f(lam1)} · ${t} = <strong>${f(lam)}</strong>`), ask('λ', lam)),
          step('b) Poisson', fx(`P(Y = ${k}) = ${frac(`${f(lam)}^${k}`, `${k}!`)} · e^(−${f(lam)}) = <strong>${f(pk, 4)}</strong>`), askProb('b)', pk)),
        ],
        solution: `a) <strong>${f(p1, 4)}</strong> · b) <strong>${f(pk, 4)}</strong>`,
      };
    },
  };

  T['k12-seltene'] = {
    title: 'Seltene Ereignisse (Poisson-Näherung)',
    gen(r) {
      const p = r.pick([0.0001, 0.0002, 0.0005]), n = r.step(5000, 30000, 1000), places = r.int(2, 5);
      const lam = n * p;
      const atLeast1 = 1 - Math.exp(-lam);
      const over = 1 - St.poissonCdf(places, lam);
      return {
        text: `<p>Die Wahrscheinlichkeit, sich im Urlaub eine seltene Krankheit einzufangen, ist p = ${f(p, 4)}. Es reisen <strong>${f(n, 0)} Personen</strong>.</p><ol class="parts"><li>Wie wahrscheinlich steckt sich <strong>mindestens einer</strong> an?</li><li>Erwartungswert und Standardabweichung der Anzahl Infizierter?</li><li>Wie wahrscheinlich reichen <strong>${places} Behandlungsplätze</strong> nicht aus?</li></ol>`,
        answers: [prob('a) P(X ≥ 1)', atLeast1, { pts: 3 }), num('b) E(X)', lam, { pts: 2 }), num('b) σ', Math.sqrt(lam), { pts: 2 }), prob(`c) P(X > ${places})`, over, { pts: 4 })],
        hint: `n groß, p klein → Poisson mit λ = n · p. Bei Poisson gilt: E = λ, Var = λ.`,
        simple: 'Wenn sehr viele Menschen ein sehr kleines Risiko haben, beschreibt Poisson die Anzahl der Fälle sehr gut.',
        steps: [
          step('λ', fx(`λ = n · p = ${f(n, 0)} · ${f(p, 4)} = <strong>${f(lam)}</strong>`), ask('λ', lam)),
          step('a) Mindestens 1', fx(`1 − P(0) = 1 − e^(−${f(lam)}) = <strong>${f(atLeast1, 4)}</strong>`), askProb('a)', atLeast1)),
          step('b) E und σ', fx(`E = λ = ${f(lam)}, &nbsp; σ = √λ = <strong>${f(Math.sqrt(lam), 4)}</strong>`), ask('σ', Math.sqrt(lam))),
          step('c) Zu wenig Plätze', fx(`P(X > ${places}) = 1 − P(X ≤ ${places}) = 1 − ${f(St.poissonCdf(places, lam), 4)} = <strong>${f(over, 4)}</strong>`), askProb('c)', over)),
        ],
        solution: `a) ${f(atLeast1, 4)} · b) E = ${f(lam)}, σ = ${f(Math.sqrt(lam), 4)} · c) ${f(over, 4)}`,
      };
    },
  };

  /* ---------- Kapitel 13: Konfidenzintervalle ---------- */
  const CI_CTX = [
    { what: 'die mittlere Lebensdauer von Bildröhren', unit: 'Stunden', mu: [1300, 1500], s: [40, 90] },
    { what: 'die mittlere Wartezeit in einer Hotline', unit: 'Sekunden', mu: [15, 40], s: [4, 10] },
    { what: 'das mittlere Jahreseinkommen von Ärzten', unit: '€', mu: [70000, 95000], s: [5000, 12000] },
    { what: 'die mittlere Nagellänge', unit: 'cm', mu: [6, 10], s: [0.3, 1] },
    { what: 'das mittlere Gewicht von Mehltüten', unit: 'g', mu: [490, 510], s: [3, 8] },
  ];
  function ciSteps(m, sd, n, level, known, unit) {
    const res = St.ciMean({ mean: m, n, level, sigma: known ? sd : null, s: known ? null : sd });
    const sym = known ? 'σ' : 's';
    return {
      res,
      steps: [
        step('Was ist gefragt?', `Ein Bereich, in dem der <strong>wahre Mittelwert μ</strong> der Grundgesamtheit mit ${pc(level, 0)} Vertrauen liegt.`),
        step('Welche Formel?', known
          ? `σ der Grundgesamtheit ist <strong>bekannt</strong> → z-Verteilung:${fx(`${xbar} ± z · ${frac('σ', '√n')}`)}`
          : `σ ist <strong>unbekannt</strong>, wir haben nur s aus der Stichprobe → t-Verteilung mit n − 1 = ${n - 1} Freiheitsgraden:${fx(`${xbar} ± t · ${frac('s', '√n')}`)}${n >= 30 ? box('Bei n ≥ 30 ist t fast gleich z – beide Wege werden akzeptiert.', 'info') : ''}`),
        step('Kritischer Wert', known ? fx(`z(${f(1 - (1 - level) / 2, 3)}) = <strong>${f(res.crit, 3)}</strong>`) : fx(`t(${n - 1}; ${f(1 - (1 - level) / 2, 3)}) = <strong>${f(res.crit, 3)}</strong>`), ask('kritischer Wert', res.crit, { rel: 0.04 })),
        step('Standardfehler', fx(`${frac(sym, '√n')} = ${frac(f(sd, 4), `√${n}`)} = <strong>${f(res.se, 4)}</strong>`), ask('Standardfehler', res.se)),
        step('Grenzen', fx(`${f(m, 4)} ± ${f(res.crit, 3)} · ${f(res.se, 4)} = ${f(m, 4)} ± ${f(res.e, 4)}`) + fx(`[<strong>${f(res.lo, 2)}</strong>; <strong>${f(res.hi, 2)}</strong>] ${unit}`), ask('Untergrenze', res.lo, { rel: 0.004 })),
        step('Deuten', `Mit ${pc(level, 0)} Vertrauen liegt der wahre Mittelwert zwischen ${f(res.lo, 2)} und ${f(res.hi, 2)} ${unit}. Würden wir sehr viele Stichproben ziehen, würden etwa ${pc(level, 0)} der Intervalle μ enthalten.`),
      ],
    };
  }

  T['k13-ki-sigma'] = {
    title: 'Konfidenzintervall (σ bekannt)',
    gen(r) {
      const c = r.pick(CI_CTX);
      const m = r.float(c.mu[0], c.mu[1], c.mu[1] > 1000 ? 0 : c.mu[1] > 50 ? 1 : 2);
      const sigma = r.float(c.s[0], c.s[1], c.s[1] > 1000 ? -2 : c.s[1] > 20 ? 0 : 1);
      const n = r.pick([25, 36, 49, 64, 100, 144]);
      const level = r.pick([0.9, 0.95, 0.99]);
      const C = ciSteps(m, sigma, n, level, true, c.unit);
      return {
        text: `<p>Gesucht ist ${c.what}. Die Standardabweichung der Grundgesamtheit ist <strong>bekannt: σ = ${f(sigma)} ${c.unit}</strong>. Eine Stichprobe von <strong>n = ${n}</strong> ergibt <strong>x̄ = ${f(m)} ${c.unit}</strong>.</p><p>Berechne das <strong>${pc(level, 0)}-Konfidenzintervall</strong> für μ.</p>`,
        answers: [num('Untergrenze', C.res.lo, { rel: 0.004, pts: 3 }), num('Obergrenze', C.res.hi, { rel: 0.004, pts: 3 })],
        hint: `x̄ ± z · σ/√n. Für ${pc(level, 0)} ist z = ${f(C.res.crit, 3)}.`,
        simple: 'Unsere Stichprobe trifft den wahren Wert nicht exakt. Darum geben wir einen „Sicherheitsbereich“ an: Mittelwert plus/minus ein Stück. Das Stück wird kleiner, je mehr Leute wir befragen.',
        steps: C.steps,
        solution: `[<strong>${f(C.res.lo, 2)}</strong>; <strong>${f(C.res.hi, 2)}</strong>] ${c.unit}`,
      };
    },
  };

  T['k13-ki-s'] = {
    title: 'Konfidenzintervall (σ unbekannt)',
    gen(r) {
      const c = r.pick(CI_CTX);
      const m = r.float(c.mu[0], c.mu[1], c.mu[1] > 1000 ? 0 : c.mu[1] > 50 ? 1 : 2);
      const s = r.float(c.s[0], c.s[1], c.s[1] > 1000 ? -2 : c.s[1] > 20 ? 0 : 1);
      const n = r.pick([10, 16, 20, 25, 40, 50, 100]);
      const level = r.pick([0.95, 0.99]);
      const C = ciSteps(m, s, n, level, false, c.unit);
      const z = St.ciMean({ mean: m, n, level, sigma: s });
      return {
        text: `<p>Gesucht ist ${c.what}. Eine Stichprobe von <strong>n = ${n}</strong> ergibt <strong>x̄ = ${f(m)} ${c.unit}</strong> und eine Stichproben-Standardabweichung von <strong>s = ${f(s)} ${c.unit}</strong>.</p><p>Berechne das <strong>${pc(level, 0)}-Konfidenzintervall</strong> für μ.</p>`,
        answers: [num('Untergrenze', C.res.lo, { rel: 0.004, alts: n >= 30 ? [z.lo] : [], pts: 3 }), num('Obergrenze', C.res.hi, { rel: 0.004, alts: n >= 30 ? [z.hi] : [], pts: 3 })],
        hint: `σ ist unbekannt → t-Verteilung mit ${n - 1} Freiheitsgraden: x̄ ± t · s/√n.`,
        simple: 'Weil wir σ nicht kennen, sind wir etwas unsicherer. Die t-Verteilung macht das Intervall deshalb ein bisschen breiter – vor allem bei kleinen Stichproben.',
        steps: C.steps,
        solution: `[<strong>${f(C.res.lo, 2)}</strong>; <strong>${f(C.res.hi, 2)}</strong>] ${c.unit}`,
      };
    },
  };

  T['k13-ki-anteil'] = {
    title: 'Konfidenzintervall für einen Anteil',
    gen(r) {
      const n = r.pick([100, 150, 200, 400, 500, 81]);
      const k = r.int(Math.round(n * 0.15), Math.round(n * 0.6));
      const p = k / n;
      const level = r.pick([0.95, 0.9545, 0.99]);
      const res = St.ciProp({ p, n, level });
      return {
        text: `<p>Bei einer Umfrage unter <strong>${n} Personen</strong> gaben <strong>${k}</strong> an, Partei A wählen zu wollen.</p><p>Bestimme das <strong>${pc(level, 2)}-Konfidenzintervall</strong> für den Stimmenanteil.</p>`,
        answers: [prob('Untergrenze', res.lo, { tol: 0.004, pts: 3 }), prob('Obergrenze', res.hi, { tol: 0.004, pts: 3 })],
        hint: 'p ± z · √(p(1 − p) / n). Zuerst p = k / n berechnen.',
        simple: 'Statt Mittelwerte schätzen wir hier einen Prozentsatz. Die Idee ist dieselbe: Schätzwert plus/minus Sicherheitsabstand.',
        steps: [
          step('Anteil', fx(`p = ${frac(k, n)} = <strong>${f(p, 4)}</strong>`), askProb('p', p)),
          step('Voraussetzung', `n·p = ${f(n * p, 1)} ≥ 5 und n·(1−p) = ${f(n * (1 - p), 1)} ≥ 5 ✔`),
          step('Standardfehler', fx(`${sqrt(frac(`${f(p, 4)} · ${f(1 - p, 4)}`, n))} = <strong>${f(res.se, 4)}</strong>`), ask('Standardfehler', res.se)),
          step('Grenzen', fx(`${f(p, 4)} ± ${f(res.crit, 3)} · ${f(res.se, 4)} = [<strong>${f(res.lo, 4)}</strong>; <strong>${f(res.hi, 4)}</strong>]`), askProb('Untergrenze', res.lo, { tol: 0.004 })),
        ],
        solution: `[<strong>${pc(res.lo)}</strong>; <strong>${pc(res.hi)}</strong>]`,
      };
    },
  };

  T['k13-stichprobenumfang'] = {
    title: 'Notwendiger Stichprobenumfang',
    gen(r) {
      const type = r.pick(['mittel', 'anteil']);
      const level = r.pick([0.9, 0.95, 0.99]);
      const z = St.zTwoSided(level);
      if (type === 'mittel') {
        const sigma = r.pick([1.2, 2, 6.4, 7.5, 3.9]), e = r.pick([0.2, 0.5, 1, 2]);
        const exact = (z * sigma / e) ** 2;
        const n = Math.ceil(exact - 1e-9);
        return {
          text: `<p>Die Standardabweichung beträgt erfahrungsgemäß <strong>${f(sigma)}</strong>. Das ${pc(level, 0)}-Konfidenzintervall soll höchstens <strong>±${f(e)}</strong> vom wahren Mittelwert abweichen (Breite ${f(2 * e)}).</p><p>Wie viele Personen müssen <strong>mindestens</strong> befragt werden?</p>`,
          answers: [num('n', n, { tol: 1 })],
          hint: 'Die halbe Breite ist e = z · σ / √n. Nach n auflösen: n = (z · σ / e)². Immer aufrunden!',
          simple: 'Je genauer wir sein wollen (kleines e), desto mehr Leute müssen wir fragen. Doppelt so genau heißt sogar viermal so viele Leute!',
          steps: [
            step('Formel', fx(`n ≥ (${frac('z · σ', 'e')})²`)),
            step('Einsetzen', fx(`n ≥ (${frac(`${f(z, 3)} · ${f(sigma)}`, f(e))})² = ${f(exact, 2)}`)),
            step('Aufrunden', fx(`n = <strong>${n}</strong>`), ask('n', n, { tol: 1 })),
          ],
          solution: `Mindestens <strong>${n}</strong> Personen`,
        };
      }
      const p = r.pick([0.2, 0.3, 0.375, 0.4, 0.5]), e = r.pick([0.02, 0.03, 0.05]);
      const exact = (z * z * p * (1 - p)) / (e * e);
      const n = Math.ceil(exact - 1e-9);
      return {
        text: `<p>Eine Vorumfrage ergab einen Anteil von <strong>${pc(p, 1)}</strong>. Wie viele Personen müssen befragt werden, um den Anteil mit ${pc(level, 0)} Sicherheit auf <strong>±${f(e * 100, 0)} Prozentpunkte</strong> genau zu schätzen?</p>`,
        answers: [num('n', n, { tol: 2 })],
        hint: 'n ≥ z² · p · (1 − p) / e²',
        simple: 'Gleiche Idee wie beim Mittelwert – nur steht statt σ² jetzt p · (1 − p).',
        steps: [step('Einsetzen', fx(`n ≥ ${frac(`${f(z, 3)}² · ${f(p, 3)} · ${f(1 - p, 3)}`, `${f(e)}²`)} = ${f(exact, 2)}`)), step('Aufrunden', fx(`n = <strong>${n}</strong>`), ask('n', n, { tol: 2 }))],
        solution: `Mindestens <strong>${n}</strong> Personen`,
      };
    },
  };

  /* ---------- Kapitel 14: Hypothesentests ---------- */
  const CLAIMS = [
    { claim: 'mindestens', obj: 'Eisbergsalat wiegt', unit: 'g', mu0: 1000, side: 'left' },
    { claim: 'höchstens', obj: 'Eine Maschine verbraucht', unit: 'Liter/h', mu0: 3, side: 'right' },
    { claim: 'genau', obj: 'Eine Abfüllanlage füllt', unit: 'ccm', mu0: 330, side: 'two' },
    { claim: 'mindestens', obj: 'Festplatten halten', unit: 'Stunden', mu0: 3500, side: 'left' },
    { claim: 'höchstens', obj: 'Die Lieferzeit beträgt', unit: 'Tage', mu0: 5, side: 'right' },
    { claim: 'mindestens', obj: 'Bildröhren halten', unit: 'Stunden', mu0: 1400, side: 'left' },
  ];
  const H = {
    left: { h0: 'H₀: μ ≥ μ₀', h1: 'H₁: μ < μ₀', name: 'linksseitig' },
    right: { h0: 'H₀: μ ≤ μ₀', h1: 'H₁: μ > μ₀', name: 'rechtsseitig' },
    two: { h0: 'H₀: μ = μ₀', h1: 'H₁: μ ≠ μ₀', name: 'beidseitig' },
  };

  T['k14-hypothesen'] = {
    title: 'Hypothesen aufstellen',
    gen(r) {
      const c = r.pick(CLAIMS);
      const h0 = H[c.side].h0.replace('μ₀', f(c.mu0));
      const opts = Object.values(H).map((x) => x.h0.replace('μ₀', f(c.mu0)));
      return {
        text: `<p>Ein Hersteller behauptet: „${c.obj} <strong>${c.claim} ${f(c.mu0)} ${c.unit}</strong>.“ Ein Prüfer will das mit einer Stichprobe testen.</p><p>Wie lautet die <strong>Nullhypothese</strong>, und welche Art Test ist das?</p>`,
        answers: [choice(r, 'Nullhypothese', h0, opts.filter((x) => x !== h0)), choice(r, 'Testart', H[c.side].name, Object.values(H).map((x) => x.name).filter((x) => x !== H[c.side].name))],
        hint: 'Die Behauptung des Herstellers (inkl. „=“) kommt in H₀. Wir versuchen, sie zu widerlegen. H₁ zeigt in die Richtung, in die der Prüfer Abweichungen vermutet.',
        simple: 'Wie vor Gericht: H₀ ist „unschuldig“ (der Hersteller hat recht). Nur bei starken Beweisen (Stichprobe) wird er „verurteilt“ (H₀ abgelehnt).',
        steps: [
          step('Behauptung', `„${c.claim} ${f(c.mu0)}“ → als Formel: ${h0.replace('H₀: ', '')}`),
          step('Gegenteil', `${H[c.side].h1.replace('μ₀', f(c.mu0))}`),
          step('Testart', `H₁ zeigt ${c.side === 'left' ? 'nach links (<)' : c.side === 'right' ? 'nach rechts (>)' : 'in beide Richtungen (≠)'} → <strong>${H[c.side].name}</strong>.`),
        ],
        solution: `<strong>${h0}</strong> gegen ${H[c.side].h1.replace('μ₀', f(c.mu0))} → ${H[c.side].name}`,
      };
    },
  };

  function testSteps({ mu0, xb, sd, n, alpha, side, known, unit }) {
    const se = sd / Math.sqrt(n);
    const stat = (xb - mu0) / se;
    const useZ = known;
    const df = n - 1;
    const q = side === 'two' ? 1 - alpha / 2 : 1 - alpha;
    const crit = useZ ? St.z(q) : St.tInv(q, df);
    let reject;
    if (side === 'left') reject = stat < -crit;
    else if (side === 'right') reject = stat > crit;
    else reject = Math.abs(stat) > crit;
    const sym = useZ ? 'z' : 't';
    const rule = side === 'left' ? `${sym} < −${f(crit, 3)}` : side === 'right' ? `${sym} > ${f(crit, 3)}` : `|${sym}| > ${f(crit, 3)}`;
    const chart = SL.Charts ? SL.Charts.normal({
      mu: 0, sigma: 1, from: -4, to: 4, height: 200,
      rejectLeft: side !== 'right' ? -crit : undefined,
      rejectRight: side !== 'left' ? crit : undefined,
      ticks: [-3, -2, -1, 0, 1, 2, 3].map((k) => ({ x: k, label: String(k) })),
      marks: [{ x: Math.max(-3.9, Math.min(3.9, stat)), label: `${sym} = ${f(stat, 2)}`, cls: 'mark-strong' }],
    }) : '';
    return {
      stat, crit, reject, se,
      steps: [
        step('Schritt 1 – Hypothesen', fx(`${H[side].h0.replace('μ₀', f(mu0))} &nbsp; gegen &nbsp; ${H[side].h1.replace('μ₀', f(mu0))}`)),
        step('Schritt 2 – Signifikanzniveau', `α = ${f(alpha)} – so groß ist das Risiko, H₀ fälschlich abzulehnen.`),
        step('Schritt 3 – Teststatistik wählen', useZ ? 'σ ist bekannt → <strong>z-Test</strong>.' : `σ ist unbekannt (nur s) → <strong>t-Test</strong> mit ${df} Freiheitsgraden.${n >= 30 ? ' (Bei n ≥ 30 ist t ≈ z.)' : ''}`),
        step('Schritt 4 – Kritischer Wert', fx(`${useZ ? `z(${f(q, 3)})` : `t(${df}; ${f(q, 3)})`} = <strong>${f(crit, 3)}</strong>`) + `Ablehnen, wenn <strong>${rule}</strong>.`, ask('kritischer Wert (Betrag)', crit, { rel: 0.05, abs: true })),
        step('Schritt 5 – Prüfgröße berechnen', fx(`${sym} = ${frac(`${xbar} − μ₀`, `${useZ ? 'σ' : 's'} / √n`)} = ${frac(`${f(xb, 4)} − ${f(mu0, 4)}`, `${f(sd, 4)} / √${n}`)} = ${frac(f(xb - mu0, 4), f(se, 4))} = <strong>${f(stat, 3)}</strong>`), ask(`Prüfgröße ${sym}`, stat, { rel: 0.02, tol: 0.03 })),
        step('Schritt 6 – Entscheidung', chart + `${f(stat, 3)} ${reject ? 'liegt im roten Ablehnungsbereich' : 'liegt NICHT im Ablehnungsbereich'} → <strong>${reject ? DECISION_REJECT : DECISION_KEEP}</strong>.`),
      ],
    };
  }

  T['k14-entscheidung'] = {
    title: 'z-Test durchführen',
    gen(r) {
      const c = r.pick(CLAIMS);
      const sigma = St.round(c.mu0 * r.float(0.02, 0.06, 3), c.mu0 > 100 ? 1 : 3);
      const n = r.pick([25, 30, 36, 49, 64, 100]);
      const shift = r.float(-2.8, 2.8, 2);
      let xb = c.mu0 + shift * sigma / Math.sqrt(n);
      if (c.side === 'left') xb = c.mu0 - Math.abs(shift) * sigma / Math.sqrt(n);
      if (c.side === 'right') xb = c.mu0 + Math.abs(shift) * sigma / Math.sqrt(n);
      xb = St.round(xb, c.mu0 > 100 ? 1 : 3);
      const alpha = r.pick([0.05, 0.01]);
      const R = testSteps({ mu0: c.mu0, xb, sd: sigma, n, alpha, side: c.side, known: true, unit: c.unit });
      return {
        text: `<p>Behauptung: „${c.obj} ${c.claim} ${f(c.mu0)} ${c.unit}.“ Die Standardabweichung ist bekannt: <strong>σ = ${f(sigma, 3)}</strong>. Eine Stichprobe von <strong>n = ${n}</strong> ergibt <strong>x̄ = ${f(xb, 3)}</strong>.</p><p>Teste auf dem Niveau <strong>α = ${f(alpha)}</strong>.</p>`,
        answers: [num('Prüfgröße z', R.stat, { rel: 0.02, tol: 0.03, pts: 4 }), choice(r, 'Entscheidung', R.reject ? DECISION_REJECT : DECISION_KEEP, [R.reject ? DECISION_KEEP : DECISION_REJECT], { pts: 4 })],
        hint: 'z = (x̄ − μ₀) / (σ / √n). Dann mit dem kritischen Wert vergleichen.',
        simple: 'Wir fragen: Ist der Stichproben-Mittelwert so weit weg von der Behauptung, dass das kaum noch Zufall sein kann? z misst diesen Abstand in „Standardfehlern“.',
        steps: R.steps,
        solution: `z = <strong>${f(R.stat, 3)}</strong>, kritischer Wert ${f(R.crit, 3)} → <strong>${R.reject ? DECISION_REJECT : DECISION_KEEP}</strong>`,
      };
    },
  };

  T['k14-anteil'] = {
    title: 'Test für einen Anteil',
    gen(r) {
      const pi0 = r.pick([0.1, 0.2, 0.25, 0.3, 0.4]);
      const n = r.pick([100, 150, 200, 400]);
      const k = Math.round(n * (pi0 + r.float(-0.02, 0.09, 3)));
      const p = k / n;
      const alpha = 0.05;
      const se = Math.sqrt((pi0 * (1 - pi0)) / n);
      const z = (p - pi0) / se;
      const crit = St.z(1 - alpha);
      const reject = z > crit;
      return {
        text: `<p>Bisher kannten <strong>${pc(pi0, 0)}</strong> der Bevölkerung ein Produkt. Nach einer Werbekampagne wurden <strong>${n}</strong> Personen befragt, <strong>${k}</strong> kennen es.</p><p>Hat sich der Bekanntheitsgrad <strong>signifikant erhöht</strong> (α = 0,05)?</p>`,
        answers: [num('Prüfgröße z', z, { tol: 0.03, pts: 4 }), choice(r, 'Entscheidung', reject ? DECISION_REJECT : DECISION_KEEP, [reject ? DECISION_KEEP : DECISION_REJECT], { pts: 4 })],
        hint: 'H₀: π ≤ π₀ gegen H₁: π > π₀. z = (p − π₀) / √(π₀(1 − π₀)/n).',
        simple: 'Ist der neue Anteil so viel größer, dass es kein Zufall mehr sein kann? Achtung: Im Nenner steht π₀ – der alte Wert aus H₀.',
        steps: [
          step('Hypothesen', fx(`H₀: π ≤ ${f(pi0)} &nbsp; gegen &nbsp; H₁: π > ${f(pi0)}`) + '(rechtsseitig, weil „erhöht“)'),
          step('Stichprobenanteil', fx(`p = ${frac(k, n)} = ${f(p, 4)}`)),
          step('Prüfgröße', fx(`z = ${frac(`${f(p, 4)} − ${f(pi0)}`, sqrt(frac(`${f(pi0)} · ${f(1 - pi0)}`, n)))} = ${frac(f(p - pi0, 4), f(se, 4))} = <strong>${f(z, 3)}</strong>`), ask('z', z, { tol: 0.03 })),
          step('Entscheidung', fx(`z = ${f(z, 3)} ${reject ? '>' : '≤'} ${f(crit, 3)}`) + `→ <strong>${reject ? DECISION_REJECT + ' – die Bekanntheit ist signifikant gestiegen.' : DECISION_KEEP + ' – eine Steigerung ist nicht nachweisbar.'}</strong>`),
        ],
        solution: `z = ${f(z, 3)} → <strong>${reject ? DECISION_REJECT : DECISION_KEEP}</strong>`,
      };
    },
  };

  T['k14-ttest'] = {
    title: 'Klausuraufgabe: t-Test',
    gen(r) {
      const c = r.pick(CLAIMS.filter((x) => x.side !== 'two'));
      const n = r.pick([7, 10, 15, 20, 30, 50]);
      const s = St.round(c.mu0 * r.float(0.01, 0.06, 3), c.mu0 > 100 ? 0 : 2);
      const shift = r.float(0.5, 3.5, 2) * (c.side === 'left' ? -1 : 1);
      const xb = St.round(c.mu0 + (shift * s) / Math.sqrt(n), c.mu0 > 100 ? 1 : 2);
      const alpha = 0.05;
      const giveVar = r.next() < 0.5;
      const R = testSteps({ mu0: c.mu0, xb, sd: s, n, alpha, side: c.side, known: false, unit: c.unit });
      return {
        text: `<p>Ein Hersteller gibt an: „${c.obj} <strong>${c.claim} ${f(c.mu0)} ${c.unit}</strong>.“ Ein Verbraucherinstitut zweifelt und testet <strong>${n}</strong> Stück. Ergebnis: Mittelwert <strong>${f(xb)} ${c.unit}</strong> bei einer Stichproben${giveVar ? `varianz von <strong>${f(s * s, 4)}</strong>` : `standardabweichung von <strong>${f(s)}</strong>`}.</p><p>Ist die Behauptung des Herstellers mit dem Stichprobenergebnis vereinbar? (α = 0,05) (15 Punkte)</p>`,
        answers: [
          num('Prüfgröße t', R.stat, { rel: 0.02, tol: 0.03, pts: 5 }),
          num('kritischer Wert (Betrag)', R.crit, { rel: 0.05, abs: true, pts: 4, alts: n >= 30 ? [St.z(1 - alpha)] : [] }),
          choice(r, 'Entscheidung', R.reject ? DECISION_REJECT : DECISION_KEEP, [R.reject ? DECISION_KEEP : DECISION_REJECT], { pts: 6 }),
        ],
        hint: `${giveVar ? 'Achtung: Gegeben ist die Varianz – erst die Wurzel ziehen! ' : ''}σ unbekannt → t-Test mit n − 1 Freiheitsgraden.`,
        simple: 'Wir prüfen, ob der Stichproben-Mittelwert „zu weit“ von der Behauptung weg ist. Der kritische Wert ist die Grenze für „zu weit“.',
        steps: [...(giveVar ? [step('Varianz → Standardabweichung', fx(`s = ${sqrt(f(s * s, 4))} = <strong>${f(s, 4)}</strong>`), ask('s', s))] : []), ...R.steps],
        solution: `t = <strong>${f(R.stat, 3)}</strong>, kritisch ${f(R.crit, 3)} → <strong>${R.reject ? DECISION_REJECT + ': Die Angabe des Herstellers ist nicht haltbar.' : DECISION_KEEP + ': Die Angabe ist mit der Stichprobe vereinbar.'}</strong>`,
      };
    },
  };

  T['k14-ki-test'] = {
    title: 'Klausuraufgabe: Schätzen und Testen',
    gen(r) {
      const mu0 = r.step(1200, 1600, 50), sigma = r.step(40, 90, 10), n = 100, n2 = r.pick([25, 30, 36]);
      const xb = mu0 - r.int(6, 18);
      const ci = St.ciMean({ mean: xb, n, level: 0.95, sigma });
      const R1 = testSteps({ mu0, xb, sd: sigma, n, alpha: 0.05, side: 'left', known: true, unit: 'h' });
      const R2 = testSteps({ mu0, xb, sd: sigma, n: n2, alpha: 0.05, side: 'left', known: true, unit: 'h' });
      return {
        text: `<p>Laut Hersteller halten Bildröhren im Mittel <strong>mindestens ${mu0} Stunden</strong>, die Standardabweichung beträgt <strong>${sigma} Stunden</strong>. Die Lebensdauer ist normalverteilt. Ein Prüfer testet <strong>${n}</strong> Röhren und erhält einen Mittelwert von <strong>${xb} Stunden</strong>. (15 Punkte)</p>
          <ol class="parts"><li>Berechnen Sie das 95%-Konfidenzintervall für die mittlere Lebensdauer. (6 P.)</li><li>Wird der Prüfer bei α = 0,05 dem Hersteller zustimmen? (6 P.)</li><li>Wie lautet die Entscheidung, wenn nur ${n2} Röhren getestet wurden? (3 P.)</li></ol>`,
        answers: [
          num('a) Untergrenze', ci.lo, { rel: 0.002, pts: 3 }),
          num('a) Obergrenze', ci.hi, { rel: 0.002, pts: 3 }),
          num('b) Prüfgröße z', R1.stat, { tol: 0.03, pts: 3 }),
          choice(r, 'b) Entscheidung', R1.reject ? DECISION_REJECT : DECISION_KEEP, [R1.reject ? DECISION_KEEP : DECISION_REJECT], { pts: 3 }),
          choice(r, `c) Entscheidung bei n = ${n2}`, R2.reject ? DECISION_REJECT : DECISION_KEEP, [R2.reject ? DECISION_KEEP : DECISION_REJECT], { pts: 3 }),
        ],
        hint: 'a) x̄ ± 1,96 · σ/√n. b) Linksseitiger z-Test (H₀: μ ≥ ' + mu0 + '). c) Gleicher Test, nur mit kleinerem n → größerer Standardfehler.',
        simple: 'Erst schätzen wir den Bereich für den wahren Mittelwert. Dann prüfen wir die Behauptung. Bei weniger Röhren sind wir unsicherer – dann reicht derselbe Abstand vielleicht nicht mehr für eine Ablehnung.',
        steps: [
          ...ciSteps(xb, sigma, n, 0.95, true, 'h').steps.slice(1, 5).map((s) => ({ ...s, title: 'a) ' + s.title })),
          ...R1.steps.map((s) => ({ ...s, title: 'b) ' + s.title })),
          step(`c) n = ${n2}`, fx(`z = ${frac(`${xb} − ${mu0}`, `${sigma} / √${n2}`)} = <strong>${f(R2.stat, 3)}</strong>`) + `${f(R2.stat, 3)} ${R2.reject ? '<' : '≥'} −1,645 → <strong>${R2.reject ? DECISION_REJECT : DECISION_KEEP}</strong>. ${R2.reject ? '' : 'Mit weniger Daten ist die Abweichung nicht mehr signifikant.'}`),
        ],
        solution: `a) [${f(ci.lo, 2)}; ${f(ci.hi, 2)}] · b) z = ${f(R1.stat, 3)} → ${R1.reject ? 'ablehnen (Prüfer stimmt nicht zu)' : 'nicht ablehnen (Prüfer stimmt zu)'} · c) z = ${f(R2.stat, 3)} → ${R2.reject ? 'ablehnen' : 'nicht ablehnen'}`,
      };
    },
  };

  /* ---------- Kapitel 15: Regression & Korrelation ---------- */
  T['k15-r-deuten'] = {
    title: 'Korrelationskoeffizient deuten',
    gen(r) {
      const rv = r.pick([-0.95, -0.82, -0.65, -0.45, -0.25, -0.05, 0.08, 0.3, 0.5, 0.7, 0.88, 0.97]);
      const s = St.rStrength(rv);
      const all = ['sehr starker positiver Zusammenhang', 'starker positiver Zusammenhang', 'mittlerer positiver Zusammenhang', 'schwacher positiver Zusammenhang', 'praktisch kein Zusammenhang', 'schwacher negativer Zusammenhang', 'mittlerer negativer Zusammenhang', 'starker negativer Zusammenhang', 'sehr starker negativer Zusammenhang'];
      return {
        text: `<p>Für Preis und Absatzmenge ergibt sich ein Korrelationskoeffizient von <strong>r = ${f(rv)}</strong>.</p><p>Wie ist das zu deuten?</p>`,
        answers: [choice(r, 'Deutung', s, r.sample(all.filter((x) => x !== s), 3))],
        hint: 'Vorzeichen = Richtung. Betrag = Stärke (nahe 1 = stark, nahe 0 = schwach).',
        simple: 'r = +1: Punkte liegen perfekt auf einer steigenden Linie. r = −1: perfekt auf einer fallenden Linie. r = 0: wilde Punktwolke.',
        steps: [step('Vorzeichen', rv < 0 ? 'Negativ → je mehr das eine, desto weniger das andere.' : 'Positiv → je mehr das eine, desto mehr das andere.'), step('Betrag', `|r| = ${f(Math.abs(rv))} → <strong>${s}</strong>`)],
        solution: `<strong>${s}</strong>`,
      };
    },
  };

  T['k15-prognose'] = {
    title: 'Prognose mit der Regressionsgeraden',
    gen(r) {
      const a = r.step(500, 3000, 50), b = -r.step(5, 40, 1), x = r.step(20, 60, 1);
      const y = a + b * x;
      return {
        text: `<p>Die Preis-Absatz-Funktion lautet <strong>ŷ = ${f(a)} ${b < 0 ? '−' : '+'} ${f(Math.abs(b))} · x</strong> (x = Preis in €, ŷ = Absatzmenge).</p><p>Welche Absatzmenge ist bei einem Preis von <strong>${x} €</strong> zu erwarten? Und was bedeutet b?</p>`,
        answers: [num('ŷ', y, { tol: 0.5 }), choice(r, 'Bedeutung von b', `Steigt der Preis um 1 €, sinkt der Absatz um ${f(Math.abs(b))} Stück`, [`Steigt der Preis um 1 €, steigt der Absatz um ${f(Math.abs(b))} Stück`, `Bei einem Preis von 0 € werden ${f(Math.abs(b))} Stück verkauft`, `Der Absatz sinkt um ${f(Math.abs(b))} %`])],
        hint: 'x einsetzen. b ist die Steigung: Änderung von ŷ, wenn x um 1 steigt.',
        simple: 'Die Gerade ist eine Rechenvorschrift: Preis rein, erwartete Menge raus.',
        steps: [step('Einsetzen', fx(`ŷ = ${f(a)} ${b < 0 ? '−' : '+'} ${f(Math.abs(b))} · ${x} = <strong>${f(y)}</strong>`), ask('ŷ', y, { tol: 0.5 })), step('Steigung', `b = ${f(b)}: Pro 1 € mehr sinkt der Absatz um ${f(Math.abs(b))} Stück.`)],
        solution: `ŷ = <strong>${f(y)}</strong>`,
      };
    },
  };

  function genRegData(r, k) {
    const base = r.step(40, 200, 10), step0 = r.pick([2, 5, 10]);
    const xs = r.shuffle(Array.from({ length: k }, (_, i) => base + i * step0 + r.pick([0, 0, step0 / 2]))).slice(0, k);
    const slope = -r.float(1, 8, 1);
    const a = Math.round(((base + k * step0) * Math.abs(slope) + r.step(100, 800, 50)) / 10) * 10;
    const ys = xs.map((x) => Math.max(5, Math.round((a + slope * x + r.int(-1, 1) * r.pick([5, 10, 20, 40])) / 5) * 5));
    if (St.regression(xs, ys).sxx === 0) return genRegData(r, k);
    return { xs, ys };
  }

  function regSteps(xs, ys, xl = 'x', yl = 'y') {
    const R = St.regression(xs, ys);
    const dx = xs.map((x) => x - R.xm), dy = ys.map((y) => y - R.ym);
    return {
      R,
      steps: [
        step('Mittelwerte', fx(`${xbar} = ${f(R.xm, 4)}, &nbsp; ȳ = ${f(R.ym, 4)}`), ask('x̄', R.xm)),
        step('Arbeitstabelle', table([xl, yl, 'x − x̄', 'y − ȳ', '(x − x̄)(y − ȳ)', '(x − x̄)²', '(y − ȳ)²'],
          xs.map((x, i) => [x, ys[i], f(dx[i], 2), f(dy[i], 2), f(dx[i] * dy[i], 2), f(dx[i] ** 2, 2), f(dy[i] ** 2, 2)])
            .concat([['Σ', '', '', '', `<strong>${f(R.sxy, 2)}</strong>`, `<strong>${f(R.sxx, 2)}</strong>`, `<strong>${f(R.syy, 2)}</strong>`]]))),
        step('Steigung b', fx(`b = ${frac('Σ(x − x̄)(y − ȳ)', 'Σ(x − x̄)²')} = ${frac(f(R.sxy, 2), f(R.sxx, 2))} = <strong>${f(R.b, 4)}</strong>`), ask('b', R.b, { rel: 0.01 })),
        step('Achsenabschnitt a', fx(`a = ȳ − b · ${xbar} = ${f(R.ym, 4)} − (${f(R.b, 4)}) · ${f(R.xm, 4)} = <strong>${f(R.a, 4)}</strong>`), ask('a', R.a, { rel: 0.01 })),
        step('Funktion', fx(`ŷ = ${f(R.a, 2)} ${R.b < 0 ? '−' : '+'} ${f(Math.abs(R.b), 4)} · x`) + (SL.Charts ? SL.Charts.scatter({ x: xs, y: ys, a: R.a, b: R.b, residuals: true, height: 240, xLabel: xl, yLabel: yl }) : '')),
        step('Korrelationskoeffizient r', fx(`r = ${frac('Σ(x − x̄)(y − ȳ)', '√(Σ(x − x̄)² · Σ(y − ȳ)²)')} = ${frac(f(R.sxy, 2), sqrt(`${f(R.sxx, 2)} · ${f(R.syy, 2)}`))} = <strong>${f(R.r, 4)}</strong>`), ask('r', R.r, { tol: 0.01 })),
        step('Deuten', `r = ${f(R.r, 3)} → <strong>${St.rStrength(R.r)}</strong>. Bestimmtheitsmaß R² = ${f(R.r2, 3)}: Etwa ${pc(R.r2, 0)} der Schwankung von ${yl} wird durch ${xl} erklärt.`),
      ],
    };
  }

  T['k15-korrelation'] = {
    title: 'Korrelationskoeffizient berechnen',
    gen(r) {
      const { xs, ys } = genRegData(r, 5);
      const G = regSteps(xs, ys, 'Preis', 'Menge');
      return {
        text: `<p>Preise und Absatzmengen in 5 Regionen:</p>${table(['Preis (€)', ...xs], [['Menge', ...ys]])}<p>Berechne den <strong>Korrelationskoeffizienten nach Bravais-Pearson</strong>.</p>`,
        answers: [num('r', G.R.r, { tol: 0.01 })],
        hint: 'r = Σ(x − x̄)(y − ȳ) / √(Σ(x − x̄)² · Σ(y − ȳ)²). Eine Arbeitstabelle hilft enorm!',
        simple: 'r misst, wie gut die Punkte auf einer geraden Linie liegen – und ob die Linie steigt oder fällt.',
        steps: [G.steps[0], G.steps[1], G.steps[5], G.steps[6]],
        solution: `r = <strong>${f(G.R.r, 4)}</strong> (${St.rStrength(G.R.r)})`,
      };
    },
  };

  T['k15-spearman'] = {
    title: 'Rangkorrelation nach Spearman',
    gen(r) {
      const n = r.int(6, 9);
      const rx = r.shuffle(Array.from({ length: n }, (_, i) => i + 1));
      const ry = rx.map((x) => x);
      for (let i = 0; i < Math.floor(n / 2); i++) {
        const a = r.int(0, n - 1), b = r.int(0, n - 1);
        [ry[a], ry[b]] = [ry[b], ry[a]];
      }
      if (r.next() < 0.4) for (let i = 0; i < n; i++) ry[i] = n + 1 - ry[i];
      const S = St.spearman(rx, ry);
      return {
        text: `<p>${n} Studierende wurden in Statistik und Jura in eine Rangfolge gebracht:</p>${table(['Student', ...rx.map((_, i) => i + 1)], [['Rang Statistik', ...rx], ['Rang Jura', ...ry]])}<p>Berechne den <strong>Rangkorrelationskoeffizienten nach Spearman</strong>.</p>`,
        answers: [num('ρ (Spearman)', S.rho, { tol: 0.01 })],
        hint: 'ρ = 1 − 6 · Σd² / (n · (n² − 1)), d = Rangdifferenz.',
        simple: 'Wir schauen, ob gute Statistiker auch gute Juristen sind. Sind die Ränge ähnlich, sind die Differenzen d klein und ρ nahe +1.',
        steps: [
          step('Differenzen', table(['Rang x', 'Rang y', 'd', 'd²'], rx.map((x, i) => [x, ry[i], x - ry[i], (x - ry[i]) ** 2]).concat([['', '', 'Σd²', `<strong>${S.d2}</strong>`]])), ask('Σd²', S.d2, { tol: 0 })),
          step('Formel', fx(`ρ = 1 − ${frac(`6 · ${S.d2}`, `${n} · (${n}² − 1)`)} = 1 − ${frac(6 * S.d2, n * (n * n - 1))} = <strong>${f(S.rho, 4)}</strong>`), ask('ρ', S.rho, { tol: 0.01 })),
          step('Deuten', `ρ = ${f(S.rho, 3)} → <strong>${St.rStrength(S.rho)}</strong>`),
        ],
        solution: `ρ = <strong>${f(S.rho, 4)}</strong>`,
      };
    },
  };

  T['k15-preis-absatz'] = {
    title: 'Klausuraufgabe: Preis-Absatz-Funktion',
    gen(r) {
      const k = r.pick([5, 6]);
      const { xs, ys } = genRegData(r, k);
      const G = regSteps(xs, ys, 'Preis', 'Menge');
      const s = St.rStrength(G.R.r);
      const rolePlays = Math.abs(G.R.r) >= 0.6 ? 'Ja – der Preis spielt eine große Rolle (starker Zusammenhang).' : Math.abs(G.R.r) >= 0.3 ? 'Eher schwach – der Preis spielt nur eine mäßige Rolle.' : 'Nein – kaum ein Zusammenhang zwischen Preis und Absatz.';
      const allRole = ['Ja – der Preis spielt eine große Rolle (starker Zusammenhang).', 'Eher schwach – der Preis spielt nur eine mäßige Rolle.', 'Nein – kaum ein Zusammenhang zwischen Preis und Absatz.'];
      return {
        text: `<p>Ein Unternehmen verkauft ein Produkt in verschiedenen Regionen zu unterschiedlichen Preisen (25 Punkte):</p>${table(['Region', ...xs.map((_, i) => String.fromCharCode(65 + i))], [['Preis (€)', ...xs], ['Menge', ...ys]])}
          <ol class="parts"><li>Ermitteln Sie die lineare Preis-Absatz-Funktion! (20 P.)</li><li>Beurteilen Sie mit einer geeigneten Kennzahl, inwieweit der Preis eine Rolle für den Absatz spielt! (5 P.)</li></ol>`,
        answers: [num('b (Steigung)', G.R.b, { rel: 0.01, pts: 10, alts: [G.R.sxy / G.R.syy] }), num('a (Achsenabschnitt)', G.R.a, { rel: 0.01, pts: 10, alts: [G.R.xm - (G.R.sxy / G.R.syy) * G.R.ym] }), num('r', G.R.r, { tol: 0.01, pts: 3 }), choice(r, 'Beurteilung', rolePlays, allRole.filter((x) => x !== rolePlays), { pts: 2 })],
        hint: 'Menge = a + b · Preis. Arbeitstabelle mit Abweichungen vom Mittelwert anlegen. Kennzahl: Korrelationskoeffizient r.',
        simple: 'Wir legen die „beste“ Gerade durch die Punktwolke. Die Steigung sagt, wie stark die Menge auf Preisänderungen reagiert. r sagt, wie gut die Gerade passt.',
        steps: G.steps.concat([step('Hinweis zur Schreibweise', box(`Manche Lehrbücher schreiben die Preis-Absatz-Funktion umgekehrt als <em>Preis = a + b · Menge</em>. Dann gilt b = ${f(G.R.sxy / G.R.syy, 4)} und a = ${f(G.R.xm - (G.R.sxy / G.R.syy) * G.R.ym, 2)}. Beide Varianten werden hier als richtig gewertet.`, 'info'))]),
        solution: `ŷ = <strong>${f(G.R.a, 2)} ${G.R.b < 0 ? '−' : '+'} ${f(Math.abs(G.R.b), 4)} · Preis</strong>; r = ${f(G.R.r, 4)} (${s})`,
      };
    },
  };

  /* ---------- Kapitel 16: Indexrechnung ---------- */
  T['k16-preisaenderung'] = {
    title: 'Messzahl & Preisänderung',
    gen(r) {
      const p0 = r.float(1, 80, 2), change = r.float(-0.2, 0.4, 3);
      const p1 = St.round(p0 * (1 + change), 2);
      const m = p1 / p0;
      return {
        text: `<p>Ein Produkt kostete im Basisjahr <strong>${f(p0)} €</strong>, im Berichtsjahr <strong>${f(p1)} €</strong>.</p><p>Berechne die <strong>Preismesszahl</strong> und die <strong>prozentuale Preisänderung</strong>.</p>`,
        answers: [num('Messzahl', m, { tol: 0.002 }), prob('Änderung', m - 1, { tol: 0.002, signed: true })],
        hint: 'Messzahl = neuer Preis / alter Preis. Änderung = Messzahl − 1.',
        simple: 'Messzahl 1,10 heißt: jetzt 110 % vom alten Preis → 10 % teurer.',
        steps: [step('Messzahl', fx(`${frac(f(p1), f(p0))} = <strong>${f(m, 4)}</strong>`), ask('Messzahl', m, { tol: 0.002 })), step('Änderung', fx(`${f(m, 4)} − 1 = <strong>${pc(m - 1)}</strong>`))],
        solution: `Messzahl ${f(m, 4)} → Änderung <strong>${pc(m - 1)}</strong>`,
      };
    },
  };

  T['k16-wachstum'] = {
    title: 'Durchschnittliches Wachstum',
    gen(r) {
      const years = r.int(4, 6);
      const vals = [r.step(400, 600, 10)];
      for (let i = 1; i < years; i++) vals.push(Math.round(vals[i - 1] * (1 + r.float(-0.1, 0.15, 3))));
      const g = Math.pow(vals[years - 1] / vals[0], 1 / (years - 1)) - 1;
      return {
        text: `<p>Umsatzreihe:</p>${table(['Jahr', ...vals.map((_, i) => i + 1)], [['Umsatz', ...vals]])}<p>Wie hoch ist das <strong>durchschnittliche Wachstum pro Jahr</strong>?</p>`,
        answers: [prob('Wachstumsrate', g, { tol: 0.002, signed: true })],
        hint: `Geometrisches Mittel: (Endwert / Anfangswert)^(1/${years - 1}) − 1. Achtung: ${years} Jahre = ${years - 1} Wachstumsschritte!`,
        simple: 'Wachstum ist ein „Mal-nehmen“-Prozess (Zinseszins). Deshalb nimmt man nicht das normale, sondern das geometrische Mittel.',
        steps: [
          step('Anzahl Schritte', `Von Jahr 1 bis Jahr ${years} sind es <strong>${years - 1}</strong> Wachstumsschritte.`),
          step('Formel', fx(`r = (${frac(vals[years - 1], vals[0])})^(1/${years - 1}) − 1`)),
          step('Rechnen', fx(`(${f(vals[years - 1] / vals[0], 4)})^(${f(1 / (years - 1), 4)}) − 1 = <strong>${pc(g)}</strong>`), askProb('r', g, { tol: 0.002, signed: true })),
        ],
        solution: `Durchschnittlich <strong>${pc(g)}</strong> pro Jahr`,
      };
    },
  };

  function genIndexData(r, k = 3) {
    const prods = [];
    for (let i = 0; i < k; i++) {
      const p0 = r.step(40, 160, 5), q0 = r.step(10, 220, 5);
      prods.push({ p0, q0, p1: Math.round(p0 * r.float(0.85, 1.4, 2)), q1: Math.max(5, Math.round(q0 * r.float(0.7, 1.6, 2) / 5) * 5) });
    }
    return prods;
  }
  function indexTable(P, y0, y1) {
    return table(['', `Preis ${y0}`, `Menge ${y0}`, `Preis ${y1}`, `Menge ${y1}`], P.map((x, i) => [`Produkt ${i + 1}`, x.p0, x.q0, x.p1, x.q1]));
  }
  function laspeyresSteps(P) {
    const num1 = St.sum(P.map((x) => x.p1 * x.q0)), den = St.sum(P.map((x) => x.p0 * x.q0));
    return {
      value: num1 / den,
      steps: [
        step('Idee Laspeyres', 'Laspeyres fragt: <em>Was kostet der <strong>alte</strong> Warenkorb (Mengen aus dem Basisjahr) heute im Vergleich zu damals?</em>'),
        step('Formel', fx(`P<sub>L</sub> = ${frac('Σ p₁ · q₀', 'Σ p₀ · q₀')}`)),
        step('Zähler & Nenner', table(['Produkt', 'p₁ · q₀', 'p₀ · q₀'], P.map((x, i) => [i + 1, `${x.p1}·${x.q0} = ${x.p1 * x.q0}`, `${x.p0}·${x.q0} = ${x.p0 * x.q0}`]).concat([['Σ', `<strong>${num1}</strong>`, `<strong>${den}</strong>`]]))),
        step('Index', fx(`P<sub>L</sub> = ${frac(num1, den)} = <strong>${f(num1 / den, 4)}</strong>`) + `→ Preise sind um ${pc(num1 / den - 1)} ${num1 >= den ? 'gestiegen' : 'gesunken'}.`, ask('P_L', num1 / den, { tol: 0.002 })),
      ],
    };
  }
  function paascheSteps(P) {
    const num1 = St.sum(P.map((x) => x.p1 * x.q1)), den = St.sum(P.map((x) => x.p0 * x.q1));
    return {
      value: num1 / den,
      steps: [
        step('Idee Paasche', 'Paasche fragt: <em>Was hätte der <strong>neue</strong> Warenkorb (Mengen aus dem Berichtsjahr) früher gekostet?</em>'),
        step('Formel', fx(`P<sub>P</sub> = ${frac('Σ p₁ · q₁', 'Σ p₀ · q₁')}`)),
        step('Zähler & Nenner', table(['Produkt', 'p₁ · q₁', 'p₀ · q₁'], P.map((x, i) => [i + 1, `${x.p1}·${x.q1} = ${x.p1 * x.q1}`, `${x.p0}·${x.q1} = ${x.p0 * x.q1}`]).concat([['Σ', `<strong>${num1}</strong>`, `<strong>${den}</strong>`]]))),
        step('Index', fx(`P<sub>P</sub> = ${frac(num1, den)} = <strong>${f(num1 / den, 4)}</strong>`), ask('P_P', num1 / den, { tol: 0.002 })),
      ],
    };
  }

  T['k16-laspeyres'] = {
    title: 'Preisindex nach Laspeyres',
    gen(r) {
      const P = genIndexData(r);
      const L = laspeyresSteps(P);
      return {
        text: `${indexTable(P, 2021, 2024)}<p>Berechne den <strong>Preisindex nach Laspeyres</strong>.</p>`,
        answers: [num('P_L', L.value, { tol: 0.002 })],
        hint: 'Neue Preise × alte Mengen, geteilt durch alte Preise × alte Mengen.',
        simple: 'Du kaufst denselben Einkaufskorb wie damals – nur zu heutigen Preisen. Wie viel teurer ist er geworden?',
        steps: L.steps,
        solution: `P<sub>L</sub> = <strong>${f(L.value, 4)}</strong>`,
      };
    },
  };

  T['k16-paasche'] = {
    title: 'Preisindex nach Paasche',
    gen(r) {
      const P = genIndexData(r);
      const Pa = paascheSteps(P);
      return {
        text: `${indexTable(P, 2021, 2024)}<p>Berechne den <strong>Preisindex nach Paasche</strong>.</p>`,
        answers: [num('P_P', Pa.value, { tol: 0.002 })],
        hint: 'Neue Preise × neue Mengen, geteilt durch alte Preise × neue Mengen.',
        simple: 'Du nimmst den heutigen Einkaufskorb und fragst: Was hätte genau dieser Korb früher gekostet?',
        steps: Pa.steps,
        solution: `P<sub>P</sub> = <strong>${f(Pa.value, 4)}</strong>`,
      };
    },
  };

  T['k16-klausur'] = {
    title: 'Klausuraufgabe: Indexrechnung',
    gen(r) {
      const P = genIndexData(r);
      const y0 = r.pick([2015, 2016, 2018]), y1 = r.pick([2022, 2023, 2024]);
      const L = laspeyresSteps(P), Pa = paascheSteps(P);
      const years = y1 - y0;
      const g = Math.pow(L.value, 1 / years) - 1;
      return {
        text: `<p>Gegeben sind folgende Mengen- und Preisdaten (15 Punkte):</p>${indexTable(P, y0, y1)}<ol class="parts"><li>Berechnen Sie den Preisindex nach Laspeyres! (6 P.)</li><li>Berechnen Sie den Preisindex nach Paasche! (6 P.)</li><li>Berechnen Sie die mittlere jährliche Preissteigerung in Prozent (auf Basis Laspeyres)! (3 P.)</li></ol>`,
        answers: [num('a) P_L', L.value, { tol: 0.002, pts: 6 }), num('b) P_P', Pa.value, { tol: 0.002, pts: 6 }), prob('c) mittlere Steigerung p. a.', g, { tol: 0.0015, pts: 3, signed: true })],
        hint: `c) Der Index gilt für ${years} Jahre. Jährliche Rate = P_L^(1/${years}) − 1 (geometrisches Mittel).`,
        simple: 'Erst zwei Einkaufskörbe vergleichen (alt und neu), dann die Gesamtsteigerung gleichmäßig auf die Jahre verteilen – mit dem geometrischen Mittel.',
        steps: [
          ...L.steps.map((s) => ({ ...s, title: 'a) ' + s.title })),
          ...Pa.steps.map((s) => ({ ...s, title: 'b) ' + s.title })),
          step('c) Mittlere jährliche Steigerung', fx(`${f(L.value, 4)}^(1/${years}) − 1 = <strong>${pc(g)}</strong>`) + box(`Von ${y0} bis ${y1} sind es ${years} Jahre.`, 'info'), askProb('c)', g, { tol: 0.0015, signed: true })),
        ],
        solution: `a) P<sub>L</sub> = ${f(L.value, 4)} · b) P<sub>P</sub> = ${f(Pa.value, 4)} · c) ${pc(g)} pro Jahr`,
      };
    },
  };

  /* ===================== Öffentliche API ===================== */
  const DIFF_PTS = { easy: 2, medium: 3, hard: 5 };

  function templatesFor(chapter, diff) {
    const cfg = SL.Data && SL.Data.aufgaben && SL.Data.aufgaben.chapters[String(chapter)];
    const list = cfg && cfg.templates && cfg.templates[diff];
    return (list || []).filter((id) => T[id]);
  }

  function finalize(task, meta) {
    task.answers.forEach((a) => {
      if (a.pts === undefined) a.pts = DIFF_PTS[meta.diff] || 3;
    });
    task.points = task.answers.reduce((s, a) => s + a.pts, 0);
    return Object.assign(task, meta);
  }

  /** Erzeugt Aufgabe Nr. index (0-basiert) eines Kapitels. variant > 0 = „Neue Zahlen“. */
  function get(chapter, diff, index, variant = 0) {
    const list = templatesFor(chapter, diff);
    if (!list.length) return null;
    const templateId = list[index % list.length];
    const seed = hash(`${chapter}|${diff}|${index}|${variant}`);
    const t = T[templateId];
    const task = t.gen(makeRng(seed));
    return finalize(task, { chapter: Number(chapter), diff, index, variant, templateId, title: t.title, seed });
  }

  /** Erzeugt eine Aufgabe direkt aus einer Vorlage (für Klausuren). */
  function byTemplate(templateId, seed, chapter, diff = 'hard') {
    const t = T[templateId];
    if (!t) return null;
    const task = t.gen(makeRng(seed >>> 0));
    return finalize(task, { chapter: Number(chapter), diff, templateId, title: t.title, seed });
  }

  /**
   * Prüft eine einzelne Antwort.
   * raw: Text (num/prob) oder Index (choice)
   * Rückgabe: {ok, empty, parsed}
   */
  function check(answer, raw) {
    if (answer.kind === 'choice') {
      if (raw === null || raw === undefined || raw === '') return { ok: false, empty: true };
      return { ok: Number(raw) === answer.correct, empty: false };
    }
    const p = St.parseNum(raw);
    if (!p) return { ok: false, empty: String(raw || '').trim() === '' };
    let v = p.value;
    const targets = [answer.value, ...(answer.alts || [])];
    if (answer.kind === 'prob') {
      const candidates = [p.percent ? v / 100 : v];
      if (!p.percent && Math.abs(v) > 1) candidates.push(v / 100);
      const ok = candidates.some((c) => targets.some((t) => withinProb(c, t, answer)));
      return { ok, empty: false, parsed: candidates[0] };
    }
    if (p.percent) v = v / 100;
    if (answer.abs) v = Math.abs(v);
    const ok = targets.some((t) => within(v, t, answer));
    return { ok, empty: false, parsed: v };
  }

  function within(v, t, a) {
    const tol = a.tol !== undefined ? a.tol : Math.max(Math.abs(t) * (a.rel !== undefined ? a.rel : 0.01), 0.01);
    const relTol = a.rel !== undefined ? Math.abs(t) * a.rel : 0;
    return Math.abs(v - t) <= Math.max(tol, relTol) + 1e-9;
  }
  function withinProb(v, t, a) {
    const tol = a.tol !== undefined ? a.tol : Math.max(0.0015, Math.abs(t) * 0.02);
    return Math.abs(v - t) <= tol + 1e-9;
  }

  /** Formatiert die richtige Antwort für die Anzeige. */
  function formatAnswer(a) {
    if (a.kind === 'choice') return a.options[a.correct];
    if (a.kind === 'prob') return `${f(a.value, 4)} (${pc(a.value)})`;
    const d = Math.abs(a.value) >= 1000 ? 2 : 4;
    return f(a.value, d);
  }

  SL.Tasks = { get, byTemplate, check, formatAnswer, templatesFor, templates: T, hash, makeRng };
})();
