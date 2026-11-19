/**
 * rechner.js
 * ---------------------------------------------------------------
 * Statistik-Rechner (statistik-rechner.html) mit „Wie wurde gerechnet?“
 *   Tab 1: Rohdaten → Mittelwert, Median, Modus, Quartile, Spannweite,
 *          Varianz, Standardabweichung, Variationskoeffizient, KI
 *   Tab 2: Konfidenzintervall aus Kennzahlen (Mittelwert oder Anteil)
 *   Tab 3: Normalverteilung P(a ≤ X ≤ b)
 *   Tab 4: Regression & Korrelation
 */
(function () {
  'use strict';
  const SL = (window.SL = window.SL || {});

  function page() {
    const St = SL.Stat;
    const f = (x, d = 4) => St.fmt(x, d);
    const main = document.getElementById('main');
    const num = (el, fb = NaN) => { const p = St.parseNum(el.value); return p ? p.value : fb; };
    const how = (title, steps) => `<details class="how" open><summary>🧮 Wie wurde gerechnet? – ${title}</summary><ol class="step-list">${steps.map((s) => `<li>${s}</li>`).join('')}</ol></details>`;

    main.innerHTML = `
      <section class="page-head"><h1>🧮 Statistik-Rechner</h1><p class="lead">Zahlen eingeben – Ergebnis und Rechenweg erscheinen sofort. Perfekt zum Kontrollieren deiner Hausaufgaben.</p></section>
      <div class="tabs big" role="tablist">
        <button role="tab" class="active" data-tab="roh">📋 Rohdaten</button>
        <button role="tab" data-tab="ki">🎯 Konfidenzintervall</button>
        <button role="tab" data-tab="nv">🔔 Normalverteilung</button>
        <button role="tab" data-tab="reg">📈 Regression</button>
      </div>
      <section class="card calc" data-panel="roh">
        <label class="field"><span>Deine Daten (Leerzeichen, Semikolon oder Zeilenumbruch trennen · Komma = Dezimalkomma)</span>
          <textarea rows="3" data-in="roh">25 28 23 24 27 24 22 32 24 26</textarea></label>
        <div class="row">
          <label class="field"><span>Konfidenzniveau</span><select data-in="lvl"><option value="0.9">90 %</option><option value="0.95" selected>95 %</option><option value="0.99">99 %</option></select></label>
          <label class="field"><span>Daten sind …</span><select data-in="typ"><option value="s">eine Stichprobe (n − 1)</option><option value="g">die Grundgesamtheit (n)</option></select></label>
        </div>
        <div data-out="roh"></div>
      </section>
      <section class="card calc" data-panel="ki" hidden>
        <div class="row">
          <label class="field"><span>Art</span><select data-in="kityp"><option value="m">Mittelwert</option><option value="p">Anteil</option></select></label>
          <label class="field"><span>Niveau</span><select data-in="kilvl"><option value="0.9">90 %</option><option value="0.95" selected>95 %</option><option value="0.9545">95,45 %</option><option value="0.99">99 %</option></select></label>
          <label class="field"><span>n</span><input data-in="kin" value="100" inputmode="numeric"></label>
        </div>
        <div class="row" data-group="m">
          <label class="field"><span>x̄</span><input data-in="kim" value="1388" inputmode="decimal"></label>
          <label class="field"><span>Standardabweichung</span><input data-in="kis" value="60" inputmode="decimal"></label>
          <label class="field"><span>Die Standardabweichung ist …</span><select data-in="kiknown"><option value="1">σ (bekannt) → z</option><option value="0">s (Stichprobe) → t</option></select></label>
        </div>
        <div class="row" data-group="p" hidden>
          <label class="field"><span>Anteil p (oder Anzahl Treffer)</span><input data-in="kip" value="0,375" inputmode="decimal"></label>
        </div>
        <div data-out="ki"></div>
      </section>
      <section class="card calc" data-panel="nv" hidden>
        <div class="row">
          <label class="field"><span>μ</span><input data-in="nvmu" value="249,2" inputmode="decimal"></label>
          <label class="field"><span>σ</span><input data-in="nvsg" value="11,37" inputmode="decimal"></label>
          <label class="field"><span>von a (leer = −∞)</span><input data-in="nva" value="" inputmode="decimal"></label>
          <label class="field"><span>bis b (leer = +∞)</span><input data-in="nvb" value="240" inputmode="decimal"></label>
        </div>
        <div data-out="nv"></div>
      </section>
      <section class="card calc" data-panel="reg" hidden>
        <div class="row">
          <label class="field"><span>x-Werte (z. B. Preis)</span><textarea rows="2" data-in="rx">180 190 210 200 220</textarea></label>
          <label class="field"><span>y-Werte (z. B. Menge)</span><textarea rows="2" data-in="ry">115 100 90 90 70</textarea></label>
        </div>
        <div data-out="reg"></div>
      </section>`;

    const $ = (s) => main.querySelector(s);

    /* --- Tab-Steuerung --- */
    main.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
      main.querySelectorAll('[data-tab]').forEach((x) => { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', x === b); });
      main.querySelectorAll('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.tab));
      try { localStorage.setItem('sl-rechner-tab', b.dataset.tab); } catch (e) { /* ohne Speicher weiter */ }
    }));
    try {
      const t = localStorage.getItem('sl-rechner-tab');
      if (t && main.querySelector(`[data-tab="${t}"]`)) main.querySelector(`[data-tab="${t}"]`).click();
    } catch (e) { /* ohne Speicher weiter */ }

    /* --- Rohdaten --- */
    function roh() {
      const out = $('[data-out="roh"]');
      const { values, invalid } = St.parseList($('[data-in="roh"]').value);
      if (values.length < 2) { out.innerHTML = '<p class="muted">Bitte mindestens 2 Zahlen eingeben.</p>'; return; }
      const sample = $('[data-in="typ"]').value === 's';
      const lvl = Number($('[data-in="lvl"]').value);
      const n = values.length, s = St.sorted(values), sum = St.sum(values), m = sum / n;
      const sq = St.sum(values.map((x) => (x - m) ** 2));
      const v = sq / (sample ? n - 1 : n), sd = Math.sqrt(v);
      const med = St.median(values), q1 = St.quantile(values, 0.25), q3 = St.quantile(values, 0.75);
      const mo = St.modes(values);
      const ci = St.ciMean({ mean: m, n, level: lvl, s: sd });
      const qExpl = (p, q) => {
        const np = n * p;
        return Number.isInteger(np) ? `n·p = ${n}·${f(p, 2)} = ${np} ganzzahlig → (x₍${np}₎ + x₍${np + 1}₎)/2 = (${f(s[np - 1])} + ${f(s[np])})/2 = <strong>${f(q)}</strong>` : `n·p = ${f(np, 2)} → aufrunden auf Position ${Math.ceil(np)} → <strong>${f(q)}</strong>`;
      };
      out.innerHTML = `${invalid.length ? `<div class="callout warn">Ignoriert: ${invalid.map((x) => SL.UI.esc(x)).join(', ')}</div>` : ''}
        <div class="kpi-grid small">
          <div class="kpi"><span>n</span><strong>${n}</strong></div>
          <div class="kpi"><span>Mittelwert x̄</span><strong>${f(m)}</strong></div>
          <div class="kpi"><span>Median</span><strong>${f(med)}</strong></div>
          <div class="kpi"><span>Modus</span><strong>${mo.count > 1 ? mo.values.map((x) => f(x)).join('; ') : 'keiner'}</strong></div>
          <div class="kpi"><span>Q₀,₂₅ / Q₀,₇₅</span><strong>${f(q1)} / ${f(q3)}</strong></div>
          <div class="kpi"><span>Spannweite</span><strong>${f(s[n - 1] - s[0])}</strong></div>
          <div class="kpi"><span>Varianz ${sample ? 's²' : 'σ²'}</span><strong>${f(v)}</strong></div>
          <div class="kpi"><span>Standardabw.</span><strong>${f(sd)}</strong></div>
          <div class="kpi"><span>Variationskoeff.</span><strong>${m !== 0 ? St.pct(sd / m) : '–'}</strong></div>
          <div class="kpi"><span>${St.pct(lvl, 0)}-KI für μ</span><strong>[${f(ci.lo, 3)}; ${f(ci.hi, 3)}]</strong></div>
        </div>
        ${how('Schritt für Schritt', [
          `Sortiert: ${s.map((x) => f(x)).join('; ')}`,
          `Mittelwert: Summe ${f(sum)} ÷ n = ${n} → x̄ = <strong>${f(m)}</strong>`,
          `Median: ${n % 2 ? `n ungerade → Position ${(n + 1) / 2} → <strong>${f(med)}</strong>` : `n gerade → (x₍${n / 2}₎ + x₍${n / 2 + 1}₎)/2 = (${f(s[n / 2 - 1])} + ${f(s[n / 2])})/2 = <strong>${f(med)}</strong>`}`,
          `Modus: ${mo.count > 1 ? `${mo.values.map((x) => f(x)).join('; ')} kommt ${mo.count}-mal vor` : 'jeder Wert kommt nur einmal vor → kein Modus'}`,
          `1. Quartil: ${qExpl(0.25, q1)}`,
          `3. Quartil: ${qExpl(0.75, q3)} · Quartilsabstand = ${f(q3 - q1)}`,
          `Varianz: Σ(xᵢ − x̄)² = ${f(sq)} ÷ ${sample ? `(n − 1) = ${n - 1}` : `n = ${n}`} = <strong>${f(v)}</strong>`,
          `Standardabweichung: √${f(v)} = <strong>${f(sd)}</strong>`,
          `Variationskoeffizient: ${f(sd)} ÷ ${f(m)} = <strong>${m !== 0 ? f(sd / m) : '–'}</strong>`,
          `Konfidenzintervall (σ unbekannt → t mit ${n - 1} FG): ${f(m)} ± ${f(ci.crit, 3)} · ${f(sd)}/√${n} = ${f(m)} ± ${f(ci.e)} → <strong>[${f(ci.lo)}; ${f(ci.hi)}]</strong>`,
        ])}
        ${SL.Charts.bars({ labels: St.freqTable(values).map((r) => f(r.value, 2)), values: St.freqTable(values).map((r) => r.abs), height: 200, valueFmt: (x) => f(x, 0) })}`;
    }

    /* --- Konfidenzintervall --- */
    function ki() {
      const out = $('[data-out="ki"]');
      const typ = $('[data-in="kityp"]').value;
      main.querySelector('[data-group="m"]').hidden = typ !== 'm';
      main.querySelector('[data-group="p"]').hidden = typ !== 'p';
      const n = Math.round(num($('[data-in="kin"]')));
      const lvl = Number($('[data-in="kilvl"]').value);
      if (!(n >= 2)) { out.innerHTML = '<p class="muted">n muss mindestens 2 sein.</p>'; return; }
      if (typ === 'm') {
        const m = num($('[data-in="kim"]')), sd = num($('[data-in="kis"]'));
        const known = $('[data-in="kiknown"]').value === '1';
        if (!Number.isFinite(m) || !(sd > 0)) { out.innerHTML = '<p class="muted">Bitte x̄ und eine positive Standardabweichung eingeben.</p>'; return; }
        const r = St.ciMean({ mean: m, n, level: lvl, sigma: known ? sd : null, s: known ? null : sd });
        out.innerHTML = `<div class="big-result success">[${f(r.lo, 4)}; ${f(r.hi, 4)}]</div>
          ${how('Konfidenzintervall für μ', [
            known ? 'σ bekannt → Standardnormalverteilung (z)' : `σ unbekannt → t-Verteilung mit n − 1 = ${n - 1} Freiheitsgraden`,
            `Kritischer Wert: ${known ? 'z' : 't'} = <strong>${f(r.crit, 3)}</strong>`,
            `Standardfehler: ${f(sd)} / √${n} = <strong>${f(r.se)}</strong>`,
            `Fehlerspanne: ${f(r.crit, 3)} · ${f(r.se)} = <strong>${f(r.e)}</strong>`,
            `Intervall: ${f(m)} ± ${f(r.e)} = <strong>[${f(r.lo)}; ${f(r.hi)}]</strong>`,
            `Bedeutung: Mit ${St.pct(lvl, 2)} Vertrauen liegt der wahre Mittelwert in diesem Bereich.`,
          ])}`;
      } else {
        let p = num($('[data-in="kip"]'));
        if (p > 1) p = p / n;
        if (!(p > 0 && p < 1)) { out.innerHTML = '<p class="muted">Bitte einen Anteil zwischen 0 und 1 (oder eine Trefferzahl) eingeben.</p>'; return; }
        const r = St.ciProp({ p, n, level: lvl });
        const okCond = n * p >= 5 && n * (1 - p) >= 5;
        out.innerHTML = `<div class="big-result success">[${f(r.lo, 4)}; ${f(r.hi, 4)}] = [${St.pct(r.lo)}; ${St.pct(r.hi)}]</div>
          ${how('Konfidenzintervall für einen Anteil', [
            `Voraussetzung n·p = ${f(n * p, 1)} und n·(1−p) = ${f(n * (1 - p), 1)} ${okCond ? '≥ 5 ✔' : '– mindestens ein Wert < 5, Näherung ungenau ⚠️'}`,
            `z = <strong>${f(r.crit, 3)}</strong>`,
            `Standardfehler: √(${f(p)} · ${f(1 - p)} / ${n}) = <strong>${f(r.se)}</strong>`,
            `Intervall: ${f(p)} ± ${f(r.crit, 3)} · ${f(r.se)} = <strong>[${f(r.lo)}; ${f(r.hi)}]</strong>`,
          ])}`;
      }
    }

    /* --- Normalverteilung --- */
    function nv() {
      const out = $('[data-out="nv"]');
      const mu = num($('[data-in="nvmu"]')), sg = num($('[data-in="nvsg"]'));
      const aRaw = $('[data-in="nva"]').value.trim(), bRaw = $('[data-in="nvb"]').value.trim();
      const a = aRaw ? num($('[data-in="nva"]')) : -Infinity, b = bRaw ? num($('[data-in="nvb"]')) : Infinity;
      if (!Number.isFinite(mu) || !(sg > 0) || Number.isNaN(a) || Number.isNaN(b)) { out.innerHTML = '<p class="muted">Bitte μ, ein positives σ und gültige Grenzen eingeben.</p>'; return; }
      const za = Number.isFinite(a) ? (a - mu) / sg : -Infinity, zb = Number.isFinite(b) ? (b - mu) / sg : Infinity;
      const Fa = Number.isFinite(za) ? St.normCdf(za) : 0, Fb = Number.isFinite(zb) ? St.normCdf(zb) : 1;
      const p = Math.max(0, Fb - Fa);
      out.innerHTML = `<div class="big-result success">P(${Number.isFinite(a) ? f(a) : '−∞'} ≤ X ≤ ${Number.isFinite(b) ? f(b) : '∞'}) = ${f(p)} = ${St.pct(p)}</div>
        ${SL.Charts.normal({ mu, sigma: sg, shadeFrom: Number.isFinite(a) ? a : undefined, shadeTo: Number.isFinite(b) ? b : undefined, height: 220 })}
        ${how('Standardisieren und ablesen', [
          Number.isFinite(a) ? `z(a) = (${f(a)} − ${f(mu)}) / ${f(sg)} = <strong>${f(za, 3)}</strong> → Φ = ${f(Fa)}` : 'Untere Grenze −∞ → Φ = 0',
          Number.isFinite(b) ? `z(b) = (${f(b)} − ${f(mu)}) / ${f(sg)} = <strong>${f(zb, 3)}</strong> → Φ = ${f(Fb)}` : 'Obere Grenze +∞ → Φ = 1',
          `P = Φ(z_b) − Φ(z_a) = ${f(Fb)} − ${f(Fa)} = <strong>${f(p)}</strong>`,
          'Bei negativem z: Φ(−z) = 1 − Φ(z) aus der Tabelle.',
        ])}`;
    }

    /* --- Regression --- */
    function reg() {
      const out = $('[data-out="reg"]');
      const x = St.parseList($('[data-in="rx"]').value).values, y = St.parseList($('[data-in="ry"]').value).values;
      if (x.length !== y.length || x.length < 2) { out.innerHTML = `<p class="muted">Gleich viele x- und y-Werte nötig (aktuell ${x.length} und ${y.length}).</p>`; return; }
      const R = St.regression(x, y);
      if (!(R.sxx > 0) || !(R.syy > 0)) { out.innerHTML = '<p class="muted">Die x- bzw. y-Werte dürfen nicht alle gleich sein.</p>'; return; }
      out.innerHTML = `<div class="big-result success">ŷ = ${f(R.a, 4)} ${R.b < 0 ? '−' : '+'} ${f(Math.abs(R.b), 4)} · x &nbsp;·&nbsp; r = ${f(R.r)}</div>
        ${SL.Charts.scatter({ x, y, a: R.a, b: R.b, residuals: true, height: 260 })}
        ${how('Kleinste-Quadrate-Methode', [
          `x̄ = ${f(R.xm)}, ȳ = ${f(R.ym)}`,
          `Σ(x − x̄)(y − ȳ) = ${f(R.sxy)}, Σ(x − x̄)² = ${f(R.sxx)}, Σ(y − ȳ)² = ${f(R.syy)}`,
          `b = ${f(R.sxy)} / ${f(R.sxx)} = <strong>${f(R.b)}</strong>`,
          `a = ȳ − b·x̄ = ${f(R.ym)} − (${f(R.b)})·${f(R.xm)} = <strong>${f(R.a)}</strong>`,
          `r = ${f(R.sxy)} / √(${f(R.sxx)} · ${f(R.syy)}) = <strong>${f(R.r)}</strong> → ${St.rStrength(R.r)}`,
          `R² = ${f(R.r2)} → ${St.pct(R.r2, 1)} der Streuung von y werden durch x erklärt`,
        ])}`;
    }

    const bind = (sel, fn) => main.querySelectorAll(sel).forEach((el) => { el.addEventListener('input', fn); el.addEventListener('change', fn); });
    bind('[data-panel="roh"] [data-in]', roh);
    bind('[data-panel="ki"] [data-in]', ki);
    bind('[data-panel="nv"] [data-in]', nv);
    bind('[data-panel="reg"] [data-in]', reg);
    roh(); ki(); nv(); reg();
  }

  SL.ready(() => {
    if (document.body.dataset.page === 'rechner') page();
  });
})();
