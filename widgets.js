/**
 * widgets.js
 * ---------------------------------------------------------------
 * Interaktive Mini-Spiele und Visualisierungen für die Theorie.
 * Jedes Widget ist eine Funktion (container) => void und wird über
 * {"type":"widget","id":"..."} in data/theorie.json eingebunden.
 */
(function () {
  'use strict';
  const SL = (window.SL = window.SL || {});
  const St = SL.Stat;
  const C = SL.Charts;
  const f = (x, d = 2) => St.fmt(x, d);
  const pc = (x, d = 1) => St.pct(x, d);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (el, fallback = 0) => {
    const p = St.parseNum(el.value);
    return p ? p.value : fallback;
  };
  const W = {};

  /* ---------- Kapitel 1: Merkmale entdecken ---------- */
  W['merkmal-explorer'] = (el) => {
    const people = [['Anna', 21, 'blond', 2], ['Ben', 24, 'braun', 3], ['Cem', 22, 'schwarz', 1], ['Dana', 27, 'rot', 2]];
    const cols = ['Alter', 'Haarfarbe', 'Note'];
    el.innerHTML = `<div class="widget-box"><h4>🔍 Tipp auf einen Teil der Tabelle</h4>
      <div class="table-wrap"><table class="table clickable"><thead><tr><th>Person</th>${cols.map((c, i) => `<th data-col="${i}" tabindex="0">${c}</th>`).join('')}</tr></thead>
      <tbody>${people.map((p, r) => `<tr><th data-row="${r}" tabindex="0">${p[0]}</th>${p.slice(1).map((v, i) => `<td data-r="${r}" data-c="${i}" tabindex="0">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="widget-out callout tip">Klick auf einen <strong>Namen</strong>, eine <strong>Spaltenüberschrift</strong> oder einen <strong>Wert</strong>.</div>
      <button class="btn btn-sm btn-secondary" data-all>Und die ganze Tabelle?</button></div>`;
    const out = el.querySelector('.widget-out');
    const clear = () => el.querySelectorAll('.hl').forEach((x) => x.classList.remove('hl'));
    const handle = (t) => {
      clear();
      if (t.dataset.row !== undefined) {
        el.querySelectorAll(`tbody tr:nth-child(${Number(t.dataset.row) + 1}) > *`).forEach((x) => x.classList.add('hl'));
        out.innerHTML = `<strong>${t.textContent}</strong> ist ein <strong>Merkmalsträger</strong> (statistische Einheit): die Person, an der wir messen.`;
      } else if (t.dataset.col !== undefined) {
        el.querySelectorAll(`[data-c="${t.dataset.col}"]`).forEach((x) => x.classList.add('hl'));
        out.innerHTML = `„${t.textContent}“ ist ein <strong>Merkmal</strong> – die Eigenschaft, nach der wir fragen.`;
      } else if (t.dataset.r !== undefined) {
        t.classList.add('hl');
        out.innerHTML = `„${t.textContent}“ ist eine <strong>Ausprägung</strong> des Merkmals „${cols[t.dataset.c]}“ beim Merkmalsträger ${people[t.dataset.r][0]}.`;
      }
    };
    el.querySelector('table').addEventListener('click', (e) => { const t = e.target.closest('[data-row],[data-col],[data-r]'); if (t) handle(t); });
    el.querySelector('table').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const t = e.target.closest('[data-row],[data-col],[data-r]'); if (t) handle(t); } });
    el.querySelector('[data-all]').addEventListener('click', () => {
      clear();
      out.innerHTML = 'Diese 4 Personen sind eine <strong>Stichprobe</strong>. Die <strong>Grundgesamtheit</strong> wären z. B. alle Studierenden des Jahrgangs.';
    });
  };

  /* ---------- Kapitel 2: Drag & Drop Skalenniveaus ---------- */
  const DND_ITEMS = [
    ['Haarfarbe', 'nominal'], ['Postleitzahl', 'nominal'], ['Blutgruppe', 'nominal'], ['Beruf', 'nominal'], ['Automarke', 'nominal'],
    ['Schulnote', 'ordinal'], ['Kleidergröße S/M/L', 'ordinal'], ['Hotelsterne', 'ordinal'], ['Zufriedenheit', 'ordinal'], ['Platzierung im Rennen', 'ordinal'],
    ['Einkommen in €', 'metrisch'], ['Körpergröße', 'metrisch'], ['Alter', 'metrisch'], ['Wartezeit', 'metrisch'], ['Anzahl Kinder', 'metrisch'],
  ];
  W['skalen-dnd'] = (el) => {
    let selected = null;
    function round() {
      const items = [...DND_ITEMS].sort(() => Math.random() - 0.5).slice(0, 9);
      el.innerHTML = `<div class="widget-box dnd">
        <div class="dnd-pool" data-bucket="pool" aria-label="Merkmale">${items.map(([n, s], i) => `<button class="dnd-item" draggable="true" data-scale="${s}" data-id="${i}">${esc(n)}</button>`).join('')}</div>
        <div class="dnd-buckets">${['nominal', 'ordinal', 'metrisch'].map((b) => `<div class="dnd-bucket" data-bucket="${b}" tabindex="0" role="button" aria-label="Box ${b}"><h5>${b}</h5><div class="dnd-drop"></div></div>`).join('')}</div>
        <div class="row"><button class="btn btn-primary btn-sm" data-check>✔ Prüfen</button><button class="btn btn-ghost btn-sm" data-new>🔄 Neue Runde</button></div>
        <p class="widget-out" aria-live="polite"></p></div>`;
      const out = el.querySelector('.widget-out');
      const moveTo = (item, bucket) => {
        const target = bucket.dataset.bucket === 'pool' ? bucket : bucket.querySelector('.dnd-drop');
        target.appendChild(item);
        item.classList.remove('ok', 'wrong', 'selected');
        selected = null;
      };
      el.querySelectorAll('.dnd-item').forEach((it) => {
        it.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', it.dataset.id); it.classList.add('dragging'); });
        it.addEventListener('dragend', () => it.classList.remove('dragging'));
        it.addEventListener('click', (e) => {
          e.stopPropagation();
          el.querySelectorAll('.dnd-item.selected').forEach((x) => x.classList.remove('selected'));
          if (selected === it) { selected = null; return; }
          selected = it;
          it.classList.add('selected');
          out.textContent = `„${it.textContent}“ ausgewählt – jetzt auf eine Box tippen.`;
        });
      });
      el.querySelectorAll('[data-bucket]').forEach((b) => {
        b.addEventListener('dragover', (e) => { e.preventDefault(); b.classList.add('over'); });
        b.addEventListener('dragleave', () => b.classList.remove('over'));
        b.addEventListener('drop', (e) => {
          e.preventDefault();
          b.classList.remove('over');
          const it = el.querySelector(`.dnd-item[data-id="${e.dataTransfer.getData('text/plain')}"]`);
          if (it) moveTo(it, b);
        });
        const place = () => { if (selected) { moveTo(selected, b); out.textContent = ''; } };
        b.addEventListener('click', place);
        b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); place(); } });
      });
      el.querySelector('[data-check]').addEventListener('click', () => {
        let ok = 0, placed = 0;
        el.querySelectorAll('.dnd-bucket').forEach((b) => b.querySelectorAll('.dnd-item').forEach((it) => {
          placed++;
          const right = it.dataset.scale === b.dataset.bucket;
          it.classList.toggle('ok', right);
          it.classList.toggle('wrong', !right);
          if (right) ok++;
        }));
        if (placed < items.length) { out.textContent = `Noch ${items.length - placed} Merkmal(e) übrig. Ordne erst alle zu!`; return; }
        if (ok === items.length) {
          out.innerHTML = '🎉 <strong>Alles richtig!</strong> Du kannst Skalenniveaus.';
          SL.UI.reward(SL.Store.recordQuickCheck(2, 'dnd-skalen', true));
          SL.UI.confetti();
        } else out.innerHTML = `${ok} von ${items.length} richtig. Die roten nochmal anschauen: Kann man sortieren? Sind Abstände sinnvoll?`;
      });
      el.querySelector('[data-new]').addEventListener('click', round);
    }
    round();
  };

  /* ---------- Kapitel 3: Häufigkeitstabelle ---------- */
  W['haeufigkeit-tabelle'] = (el) => {
    el.innerHTML = `<div class="widget-box"><label class="field"><span>Deine Daten (mit Leerzeichen getrennt)</span>
      <textarea rows="2">25 28 23 24 27 24 22 32 24 26</textarea></label><div class="widget-out"></div></div>`;
    const ta = el.querySelector('textarea'), out = el.querySelector('.widget-out');
    const update = () => {
      const { values } = St.parseList(ta.value);
      if (values.length < 2) { out.innerHTML = '<p class="muted">Gib mindestens 2 Zahlen ein.</p>'; return; }
      const ft = St.freqTable(values);
      out.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr><th>x</th><th>h(x)</th><th>f(x)</th><th>H(x) kum.</th><th>F(x) kum.</th></tr></thead><tbody>
        ${ft.map((r) => `<tr><td>${f(r.value)}</td><td>${r.abs}</td><td>${f(r.rel, 3)}</td><td>${r.cumAbs}</td><td>${f(r.cumRel, 3)}</td></tr>`).join('')}
        <tr class="sum"><td>Σ</td><td>${values.length}</td><td>1</td><td></td><td></td></tr></tbody></table></div>
        ${C.bars({ labels: ft.map((r) => f(r.value)), values: ft.map((r) => r.abs), height: 220, valueFmt: (v) => f(v, 0) })}`;
    };
    ta.addEventListener('input', update);
    update();
  };

  /* ---------- Kapitel 4: Mittelwert vs. Median ---------- */
  W['lagemass-animation'] = (el) => {
    const base = [3, 5, 6, 7, 8];
    el.innerHTML = `<div class="widget-box"><label class="field"><span>Letzter Wert: <strong data-v>9</strong></span><input type="range" min="9" max="60" value="9"></label>
      <div class="dotplot"></div><div class="kpis"><div><span>Mittelwert x̄</span><strong data-mean></strong></div><div><span>Median</span><strong data-med></strong></div></div>
      <p class="widget-out muted"></p></div>`;
    const range = el.querySelector('input'), plot = el.querySelector('.dotplot');
    const update = () => {
      const last = Number(range.value);
      const data = [...base, last];
      const mean = St.mean(data), med = St.median(data);
      const max = 62;
      const X = (v) => 20 + (v / max) * 560;
      let s = `<svg class="chart" viewBox="0 0 600 130" role="img" aria-label="Punktdiagramm">`;
      s += `<line x1="20" x2="580" y1="80" y2="80" class="axisline"/>`;
      for (let t = 0; t <= 60; t += 10) s += `<text x="${X(t)}" y="100" class="axis" text-anchor="middle">${t}</text>`;
      data.forEach((v) => (s += `<circle cx="${X(v)}" cy="70" r="7" class="dot"/>`));
      s += `<g class="marker mean" style="transform:translateX(${X(mean)}px)"><polygon points="0,96 -8,112 8,112"/><text y="126" text-anchor="middle" class="mark-label">x̄</text></g>`;
      s += `<g class="marker median" style="transform:translateX(${X(med)}px)"><line y1="30" y2="80" x1="0" x2="0"/><text y="24" text-anchor="middle" class="mark-label">Median</text></g>`;
      plot.innerHTML = s + '</svg>';
      el.querySelector('[data-v]').textContent = last;
      el.querySelector('[data-mean]').textContent = f(mean, 2);
      el.querySelector('[data-med]').textContent = f(med, 2);
      el.querySelector('.widget-out').textContent = last > 20 ? 'Siehst du? Der Ausreißer zieht den Mittelwert weg – der Median bleibt robust.' : 'Zieh den Regler nach rechts und mach den letzten Wert zum Ausreißer.';
    };
    range.addEventListener('input', update);
    update();
  };

  /* ---------- Kapitel 5: Streuung sichtbar machen ---------- */
  W['streuung-vis'] = (el) => {
    const devs = [-3, -2, -1.2, -0.4, 0.3, 1, 1.6, 3.7];
    el.innerHTML = `<div class="widget-box"><label class="field"><span>Streuung: <strong data-k>1,0</strong></span><input type="range" min="0" max="3" step="0.1" value="1"></label>
      <div class="vis"></div><div class="kpis"><div><span>Mittelwert</span><strong>50</strong></div><div><span>Spannweite</span><strong data-r></strong></div><div><span>Standardabw. s</span><strong data-s></strong></div><div><span>Var.koeff. V</span><strong data-cv></strong></div></div></div>`;
    const range = el.querySelector('input'), vis = el.querySelector('.vis');
    const update = () => {
      const k = Number(range.value);
      const data = devs.map((d) => 50 + d * k * 3);
      const m = St.mean(data), s = St.sd(data);
      const X = (v) => 20 + ((v - 10) / 80) * 560;
      let svg = `<svg class="chart" viewBox="0 0 600 ${40 + data.length * 18}" role="img" aria-label="Streuung">`;
      svg += `<rect x="${X(m - s)}" y="10" width="${Math.max(0, X(m + s) - X(m - s))}" height="${data.length * 18 + 10}" class="band"/>`;
      svg += `<line x1="${X(m)}" x2="${X(m)}" y1="5" y2="${data.length * 18 + 25}" class="mark"/>`;
      data.forEach((v, i) => {
        const y = 22 + i * 18;
        svg += `<line x1="${X(m)}" x2="${X(v)}" y1="${y}" y2="${y}" class="dev"/><circle cx="${X(v)}" cy="${y}" r="6" class="dot"/>`;
      });
      vis.innerHTML = svg + '</svg>';
      el.querySelector('[data-k]').textContent = f(k, 1);
      el.querySelector('[data-r]').textContent = f(St.range(data), 1);
      el.querySelector('[data-s]').textContent = f(s, 2);
      el.querySelector('[data-cv]').textContent = pc(s / m);
    };
    range.addEventListener('input', update);
    update();
  };

  /* ---------- Kapitel 6: Lorenzkurve ---------- */
  W['lorenz'] = (el) => {
    el.innerHTML = `<div class="widget-box"><label class="field"><span>Umsätze / Vermögen (mit Leerzeichen getrennt)</span><input type="text" value="100 400 700 500 200"></label>
      <div class="split"><div class="lz-chart"></div><div class="lz-out"></div></div></div>`;
    const input = el.querySelector('input');
    const update = () => {
      const { values } = St.parseList(input.value);
      const v = values.filter((x) => x >= 0);
      if (v.length < 2 || St.sum(v) <= 0) { el.querySelector('.lz-out').innerHTML = '<p class="muted">Mindestens 2 nicht-negative Werte eingeben.</p>'; return; }
      const L = St.lorenz(v.map((x) => ({ count: 1, total: x })), true);
      el.querySelector('.lz-chart').innerHTML = C.lorenz(L.points, { width: 320, height: 320 });
      el.querySelector('.lz-out').innerHTML = `<div class="kpis"><div><span>Gini G</span><strong>${f(L.gini, 4)}</strong></div><div><span>korrigiert G*</span><strong>${f(L.giniCorr, 4)}</strong></div></div>
        <div class="table-wrap"><table class="table"><thead><tr><th>Wert</th><th>kᵢ</th><th>lᵢ</th></tr></thead><tbody>${L.points.slice(1).map((p, i) => `<tr><td>${f(L.sorted[i].total)}</td><td>${f(p.k, 3)}</td><td>${f(p.l, 4)}</td></tr>`).join('')}</tbody></table></div>
        <p class="muted">${L.giniCorr < 0.2 ? 'Ziemlich gleichmäßig verteilt.' : L.giniCorr < 0.5 ? 'Mäßige Konzentration.' : 'Starke Konzentration – wenige haben viel.'} Tipp: Setz alle Werte gleich – dann wird G = 0.</p>`;
    };
    input.addEventListener('input', update);
    update();
  };

  /* ---------- Kapitel 7: Vierfeldertafel ---------- */
  W['vierfelder'] = (el) => {
    const init = [200, 50, 30, 90];
    el.innerHTML = `<div class="widget-box"><div class="table-wrap"><table class="table vf"><thead><tr><th></th><th>Whisky schmeckt</th><th>schmeckt nicht</th><th>Σ</th></tr></thead><tbody>
      <tr><th>Cognac schmeckt</th><td><input data-i="0" value="${init[0]}" inputmode="numeric" aria-label="Feld 1 1"></td><td><input data-i="1" value="${init[1]}" inputmode="numeric" aria-label="Feld 1 2"></td><td data-s="r1"></td></tr>
      <tr><th>schmeckt nicht</th><td><input data-i="2" value="${init[2]}" inputmode="numeric" aria-label="Feld 2 1"></td><td><input data-i="3" value="${init[3]}" inputmode="numeric" aria-label="Feld 2 2"></td><td data-s="r2"></td></tr>
      <tr class="sum"><th>Σ</th><td data-s="c1"></td><td data-s="c2"></td><td data-s="n"></td></tr></tbody></table></div><div class="widget-out"></div></div>`;
    const inputs = el.querySelectorAll('input');
    const update = () => {
      const [a, b, c, d] = [...inputs].map((i) => Math.max(0, num(i)));
      const set = (k, v) => (el.querySelector(`[data-s="${k}"]`).textContent = f(v, 0));
      set('r1', a + b); set('r2', c + d); set('c1', a + c); set('c2', b + d); set('n', a + b + c + d);
      const denom = (a + b) * (c + d) * (a + c) * (b + d);
      const phi = denom > 0 ? St.phi(a, b, c, d) : 0;
      el.querySelector('.widget-out').innerHTML = `
        <p><strong>Zeilenprozente:</strong> Von denen, die Cognac mögen, mögen ${pc(a / (a + b || 1))} auch Whisky. Von denen, die Cognac nicht mögen, nur ${pc(c / (c + d || 1))}.</p>
        <div class="formula">φ = (${f(a, 0)}·${f(d, 0)} − ${f(b, 0)}·${f(c, 0)}) / √(${f(a + b, 0)}·${f(c + d, 0)}·${f(a + c, 0)}·${f(b + d, 0)}) = <strong>${f(phi, 4)}</strong></div>
        <p>|φ| = ${f(Math.abs(phi), 3)} → <strong>${St.phiStrength(phi)}</strong></p>`;
    };
    inputs.forEach((i) => i.addEventListener('input', update));
    update();
  };

  /* ---------- Kapitel 8: Kombinatorik-Rechner ---------- */
  W['kombinatorik'] = (el) => {
    el.innerHTML = `<div class="widget-box"><div class="row"><label class="field"><span>n (Anzahl insgesamt)</span><input type="number" min="1" max="60" value="10" data-n></label>
      <label class="field"><span>k (Anzahl ausgewählt)</span><input type="number" min="0" max="60" value="3" data-k></label></div><div class="combo-grid"></div></div>`;
    const update = () => {
      const n = Math.max(1, Math.min(60, Math.round(num(el.querySelector('[data-n]'), 10))));
      const k = Math.max(0, Math.min(n, Math.round(num(el.querySelector('[data-k]'), 3))));
      const big = (x) => (x > 1e15 ? x.toExponential(3).replace('.', ',') : f(x, 0));
      el.querySelector('.combo-grid').innerHTML = [
        ['Alle anordnen', `${n}!`, St.fact(n), 'Reihenfolge ✔ · alle werden benutzt'],
        ['Reihenfolge wichtig, ohne Wiederholung', `${n}!/(${n}−${k})!`, St.nPk(n, k), 'z. B. Podestplätze'],
        ['Reihenfolge egal, ohne Wiederholung', `(${n} über ${k})`, St.nCk(n, k), 'z. B. Team, Lotto'],
        ['Reihenfolge wichtig, mit Wiederholung', `${n}^${k}`, Math.pow(n, k), 'z. B. PIN-Code'],
      ].map(([t, form, v, ex]) => `<div class="combo-card"><span>${t}</span><code>${form}</code><strong>${big(v)}</strong><small>${ex}</small></div>`).join('');
    };
    el.querySelectorAll('input').forEach((i) => i.addEventListener('input', update));
    update();
  };

  /* ---------- Kapitel 9: Baumdiagramm ---------- */
  W['baum'] = (el) => {
    el.innerHTML = `<div class="widget-box"><div class="row"><label class="field"><span>🔵 blaue Kugeln</span><input type="number" min="1" max="20" value="7" data-b></label>
      <label class="field"><span>🟡 gelbe Kugeln</span><input type="number" min="1" max="20" value="6" data-y></label>
      <label class="field check"><input type="checkbox" data-back> mit Zurücklegen</label></div><div class="tree-svg"></div><div class="widget-out"></div></div>`;
    const update = () => {
      const b = Math.max(1, Math.round(num(el.querySelector('[data-b]'), 7)));
      const y = Math.max(1, Math.round(num(el.querySelector('[data-y]'), 6)));
      const back = el.querySelector('[data-back]').checked;
      const N = b + y, N2 = back ? N : N - 1;
      const p1 = { B: b / N, Y: y / N };
      const p2 = { BB: (back ? b : b - 1) / N2, BY: y / N2, YB: b / N2, YY: (back ? y : y - 1) / N2 };
      const fr = (z, n) => `${z}/${n}`;
      const leaves = [
        ['🔵🔵', p1.B * p2.BB, `${fr(b, N)} · ${fr(back ? b : b - 1, N2)}`],
        ['🔵🟡', p1.B * p2.BY, `${fr(b, N)} · ${fr(y, N2)}`],
        ['🟡🔵', p1.Y * p2.YB, `${fr(y, N)} · ${fr(b, N2)}`],
        ['🟡🟡', p1.Y * p2.YY, `${fr(y, N)} · ${fr(back ? y : y - 1, N2)}`],
      ];
      let s = '<svg class="chart tree" viewBox="0 0 600 270" role="img" aria-label="Baumdiagramm">';
      const root = [40, 135], l1 = [[230, 70], [230, 200]], l2 = [[440, 35], [440, 105], [440, 165], [440, 235]];
      const edge = (a, c, label) => `<line x1="${a[0]}" y1="${a[1]}" x2="${c[0]}" y2="${c[1]}" class="edge"/><text x="${(a[0] + c[0]) / 2}" y="${(a[1] + c[1]) / 2 - 6}" class="edge-label" text-anchor="middle">${label}</text>`;
      s += edge(root, l1[0], fr(b, N)) + edge(root, l1[1], fr(y, N));
      s += edge(l1[0], l2[0], fr(back ? b : b - 1, N2)) + edge(l1[0], l2[1], fr(y, N2)) + edge(l1[1], l2[2], fr(b, N2)) + edge(l1[1], l2[3], fr(back ? y : y - 1, N2));
      s += `<circle cx="${root[0]}" cy="${root[1]}" r="10" class="node"/>`;
      s += `<text x="${l1[0][0]}" y="${l1[0][1] + 5}" text-anchor="middle" class="node-label">🔵</text><text x="${l1[1][0]}" y="${l1[1][1] + 5}" text-anchor="middle" class="node-label">🟡</text>`;
      leaves.forEach((lf, i) => (s += `<text x="${l2[i][0]}" y="${l2[i][1] + 5}" class="node-label">${lf[0]}</text><text x="${l2[i][0] + 50}" y="${l2[i][1] + 5}" class="val">= ${f(lf[1], 4)}</text>`));
      el.querySelector('.tree-svg').innerHTML = s + '</svg>';
      el.querySelector('.widget-out').innerHTML = `<p><strong>Pfadregel</strong> (multiplizieren): P(🔵🟡) = ${leaves[1][2]} = ${f(leaves[1][1], 4)}</p>
        <p><strong>Summenregel</strong> (addieren): P(je eine Farbe) = ${f(leaves[1][1], 4)} + ${f(leaves[2][1], 4)} = <strong>${f(leaves[1][1] + leaves[2][1], 4)}</strong></p>`;
    };
    el.querySelectorAll('input').forEach((i) => i.addEventListener('input', update));
    update();
  };

  /* ---------- Kapitel 10: Bayes mit 10.000 Personen ---------- */
  W['bayes-10000'] = (el) => {
    el.innerHTML = `<div class="widget-box bayes">
      <div class="sliders">
        <label class="field"><span>Krank (Prävalenz): <strong data-o="prev"></strong></span><input type="range" min="1" max="200" value="10" data-s="prev"></label>
        <label class="field"><span>Test erkennt Kranke (Sensitivität): <strong data-o="sens"></strong></span><input type="range" min="50" max="100" value="90" data-s="sens"></label>
        <label class="field"><span>Fehlalarm bei Gesunden: <strong data-o="fp"></strong></span><input type="range" min="0" max="200" value="50" data-s="fp"></label>
      </div>
      <div class="bayes-grid-wrap"><canvas width="400" height="400" aria-label="10.000 Personen als Kästchen"></canvas>
        <ul class="legend"><li><i class="tp"></i>krank & positiv</li><li><i class="fn"></i>krank & negativ</li><li><i class="fpc"></i>gesund & positiv (Fehlalarm)</li><li><i class="tn"></i>gesund & negativ</li></ul>
        <label class="field check"><input type="checkbox" data-only> Nur die Positiven hervorheben</label></div>
      <div class="bayes-steps"></div>
      <div class="bayes-result"></div></div>`;
    const canvas = el.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    const update = () => {
      const prev = Number(el.querySelector('[data-s="prev"]').value) / 1000;
      const sens = Number(el.querySelector('[data-s="sens"]').value) / 100;
      const fp = Number(el.querySelector('[data-s="fp"]').value) / 1000;
      const only = el.querySelector('[data-only]').checked;
      el.querySelector('[data-o="prev"]').textContent = pc(prev, 1);
      el.querySelector('[data-o="sens"]').textContent = pc(sens, 0);
      el.querySelector('[data-o="fp"]').textContent = pc(fp, 1);
      const N = 10000;
      const sick = Math.round(N * prev), healthy = N - sick;
      const tp = Math.round(sick * sens), fn = sick - tp, fpos = Math.round(healthy * fp), tn = healthy - fpos;
      const colors = { tp: css('--error') || '#ef4444', fn: css('--warning-strong') || '#b45309', fp: css('--warning') || '#f59e0b', tn: css('--grid-dot') || '#cbd5e1' };
      const groups = [['tp', tp], ['fn', fn], ['fp', fpos], ['tn', tn]];
      ctx.clearRect(0, 0, 400, 400);
      let i = 0;
      groups.forEach(([k, count]) => {
        ctx.fillStyle = colors[k];
        ctx.globalAlpha = only && (k === 'fn' || k === 'tn') ? 0.18 : 1;
        for (let c = 0; c < count; c++, i++) ctx.fillRect((i % 100) * 4, Math.floor(i / 100) * 4, 3.4, 3.4);
      });
      ctx.globalAlpha = 1;
      const pos = tp + fpos;
      const ppv = pos ? tp / pos : 0;
      el.querySelector('.bayes-steps').innerHTML = `<ol class="step-list">
        <li>Wir nehmen <strong>10.000 Personen</strong>.</li>
        <li>${pc(prev, 1)} sind krank → <strong>${f(sick, 0)} Kranke</strong>, ${f(healthy, 0)} Gesunde.</li>
        <li>Der Test findet ${pc(sens, 0)} der Kranken → <strong>${f(tp, 0)} richtig Positive</strong>.</li>
        <li>Bei ${pc(fp, 1)} der Gesunden gibt es Fehlalarm → <strong>${f(fpos, 0)} falsch Positive</strong>.</li>
        <li>Positiv insgesamt: ${f(tp, 0)} + ${f(fpos, 0)} = <strong>${f(pos, 0)}</strong>.</li>
        <li>Davon wirklich krank: ${f(tp, 0)} / ${f(pos, 0)} = <strong>${pc(ppv, 1)}</strong>.</li></ol>
        <div class="nat-tree">
          <div class="nt-root">10.000 Personen</div>
          <div class="nt-level"><div class="nt-node bad">${f(sick, 0)} krank</div><div class="nt-node good">${f(healthy, 0)} gesund</div></div>
          <div class="nt-level four"><div class="nt-leaf hl">${f(tp, 0)} positiv</div><div class="nt-leaf">${f(fn, 0)} negativ</div><div class="nt-leaf hl2">${f(fpos, 0)} positiv</div><div class="nt-leaf">${f(tn, 0)} negativ</div></div>
        </div>`;
      el.querySelector('.bayes-result').innerHTML = `<div class="big-result ${ppv < 0.5 ? 'warn' : 'success'}">Positiv getestet → wirklich krank mit <strong>${pc(ppv, 1)}</strong></div>
        <p class="muted">${ppv < 0.5 ? 'Weniger als die Hälfte! Die vielen Gesunden erzeugen mehr Fehlalarme als es überhaupt Kranke gibt.' : 'Hier überwiegen die echten Treffer – weil die Krankheit häufiger oder der Test genauer ist.'}</p>`;
    };
    el.querySelectorAll('input').forEach((i) => i.addEventListener('input', update));
    update();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', update);
    document.getElementById('theme-toggle') && document.getElementById('theme-toggle').addEventListener('click', () => setTimeout(update, 50));
  };

  /* ---------- Kapitel 11: Erwartungswert ---------- */
  W['erwartungswert'] = (el) => {
    const rows = [[2, 0.1], [3, 0.4], [5, 0.2], [8, 0.1], [9, 0.2]];
    el.innerHTML = `<div class="widget-box"><div class="table-wrap"><table class="table ev"><thead><tr><th>xᵢ</th><th>p(xᵢ)</th><th>xᵢ · p</th></tr></thead><tbody>
      ${rows.map((r, i) => `<tr><td><input data-x="${i}" value="${r[0]}" inputmode="decimal" aria-label="x ${i + 1}"></td><td><input data-p="${i}" value="${f(r[1])}" inputmode="decimal" aria-label="p ${i + 1}"></td><td data-xp="${i}"></td></tr>`).join('')}
      </tbody></table></div><div class="widget-out"></div></div>`;
    const update = () => {
      const xs = rows.map((_, i) => num(el.querySelector(`[data-x="${i}"]`)));
      const ps = rows.map((_, i) => num(el.querySelector(`[data-p="${i}"]`)));
      xs.forEach((x, i) => (el.querySelector(`[data-xp="${i}"]`).textContent = f(x * ps[i], 3)));
      const sp = St.sum(ps);
      const E = St.sum(xs.map((x, i) => x * ps[i]));
      const V = St.sum(xs.map((x, i) => (x - E) ** 2 * ps[i]));
      el.querySelector('.widget-out').innerHTML = `${Math.abs(sp - 1) > 0.001 ? `<div class="callout warn">Die Wahrscheinlichkeiten ergeben ${f(sp, 3)} – sie müssen zusammen genau 1 ergeben!</div>` : ''}
        <div class="kpis"><div><span>E(X)</span><strong>${f(E, 3)}</strong></div><div><span>Var(X)</span><strong>${f(V, 3)}</strong></div><div><span>σ(X)</span><strong>${f(Math.sqrt(V), 3)}</strong></div></div>
        ${C.bars({ labels: xs.map((x) => f(x)), values: ps, height: 200, valueFmt: (v) => f(v, 2) })}`;
    };
    el.querySelectorAll('input').forEach((i) => i.addEventListener('input', update));
    update();
  };

  /* ---------- Kapitel 12: Verteilungen ---------- */
  W['verteilungen'] = (el) => {
    el.innerHTML = `<div class="widget-box"><div class="tabs" role="tablist">
        <button role="tab" class="active" data-t="binom">Binomial</button><button role="tab" data-t="poisson">Poisson</button><button role="tab" data-t="normal">Normal</button></div>
      <div class="tab-body"></div></div>`;
    const body = el.querySelector('.tab-body');
    let animTimer = null;
    const tabs = {
      binom() {
        body.innerHTML = `<div class="row"><label class="field"><span>n = <strong data-o="n"></strong></span><input type="range" min="1" max="30" value="10" data-s="n"></label>
          <label class="field"><span>p = <strong data-o="p"></strong></span><input type="range" min="1" max="99" value="30" data-s="p"></label>
          <label class="field"><span>k = <strong data-o="k"></strong></span><input type="range" min="0" max="10" value="3" data-s="k"></label></div><div class="chart-box"></div><div class="kpis"></div>`;
        const up = () => {
          const n = Number(body.querySelector('[data-s="n"]').value), p = Number(body.querySelector('[data-s="p"]').value) / 100;
          const kIn = body.querySelector('[data-s="k"]');
          kIn.max = n;
          const k = Math.min(n, Number(kIn.value));
          body.querySelector('[data-o="n"]').textContent = n; body.querySelector('[data-o="p"]').textContent = f(p); body.querySelector('[data-o="k"]').textContent = k;
          const vals = Array.from({ length: n + 1 }, (_, i) => St.binomPmf(i, n, p));
          body.querySelector('.chart-box').innerHTML = C.bars({ labels: vals.map((_, i) => String(i)), values: vals, highlight: [k], height: 220, showValues: n <= 12, valueFmt: (v) => f(v, 3) });
          body.querySelector('.kpis').innerHTML = `<div><span>P(X = ${k})</span><strong>${f(vals[k], 4)}</strong></div><div><span>P(X ≤ ${k})</span><strong>${f(St.binomCdf(k, n, p), 4)}</strong></div><div><span>E = n·p</span><strong>${f(n * p)}</strong></div><div><span>σ</span><strong>${f(Math.sqrt(n * p * (1 - p)), 3)}</strong></div>`;
        };
        body.querySelectorAll('input').forEach((i) => i.addEventListener('input', up));
        up();
      },
      poisson() {
        body.innerHTML = `<div class="row"><label class="field"><span>λ = <strong data-o="l"></strong></span><input type="range" min="1" max="100" value="20" data-s="l"></label>
          <label class="field"><span>k = <strong data-o="k"></strong></span><input type="range" min="0" max="15" value="2" data-s="k"></label></div><div class="chart-box"></div><div class="kpis"></div>`;
        const up = () => {
          const l = Number(body.querySelector('[data-s="l"]').value) / 10, k = Number(body.querySelector('[data-s="k"]').value);
          body.querySelector('[data-o="l"]').textContent = f(l, 1); body.querySelector('[data-o="k"]').textContent = k;
          const max = Math.max(8, Math.ceil(l + 4 * Math.sqrt(l)));
          const vals = Array.from({ length: max + 1 }, (_, i) => St.poissonPmf(i, l));
          body.querySelector('.chart-box').innerHTML = C.bars({ labels: vals.map((_, i) => String(i)), values: vals, highlight: [k], height: 220, showValues: max <= 12, valueFmt: (v) => f(v, 3) });
          body.querySelector('.kpis').innerHTML = `<div><span>P(X = ${k})</span><strong>${f(St.poissonPmf(k, l), 4)}</strong></div><div><span>P(X ≤ ${k})</span><strong>${f(St.poissonCdf(k, l), 4)}</strong></div><div><span>E = Var = λ</span><strong>${f(l, 1)}</strong></div>`;
        };
        body.querySelectorAll('input').forEach((i) => i.addEventListener('input', up));
        up();
      },
      normal() {
        body.innerHTML = `<div class="row"><label class="field"><span>μ = <strong data-o="mu"></strong></span><input type="range" min="50" max="150" value="100" data-s="mu"></label>
          <label class="field"><span>σ = <strong data-o="sg"></strong></span><input type="range" min="5" max="30" value="15" data-s="sg"></label></div>
          <div class="row"><label class="field"><span>von a</span><input type="text" inputmode="decimal" value="85" data-a></label><label class="field"><span>bis b</span><input type="text" inputmode="decimal" value="115" data-b></label>
          <button class="btn btn-primary btn-sm" data-anim>▶ 68-95-99,7 animieren</button></div><div class="chart-box"></div><div class="kpis"></div><p class="widget-out"></p>`;
        let override = null;
        const up = () => {
          const mu = Number(body.querySelector('[data-s="mu"]').value), sg = Number(body.querySelector('[data-s="sg"]').value);
          body.querySelector('[data-o="mu"]').textContent = mu; body.querySelector('[data-o="sg"]').textContent = sg;
          let a = num(body.querySelector('[data-a]'), mu - sg), b = num(body.querySelector('[data-b]'), mu + sg);
          if (override) { a = mu - override * sg; b = mu + override * sg; }
          if (b < a) [a, b] = [b, a];
          const p = St.normCdfX(b, mu, sg) - St.normCdfX(a, mu, sg);
          body.querySelector('.chart-box').innerHTML = C.normal({ mu, sigma: sg, from: mu - 4 * sg, to: mu + 4 * sg, shadeFrom: a, shadeTo: b, height: 230, ticks: [-3, -2, -1, 0, 1, 2, 3].map((k) => ({ x: mu + k * sg, label: k === 0 ? 'μ' : `${k > 0 ? '+' : '−'}${Math.abs(k)}σ`, sub: f(mu + k * sg, 0) })) });
          body.querySelector('.kpis').innerHTML = `<div><span>P(${f(a, 1)} ≤ X ≤ ${f(b, 1)})</span><strong>${pc(p, 2)}</strong></div><div><span>z(a)</span><strong>${f((a - mu) / sg, 2)}</strong></div><div><span>z(b)</span><strong>${f((b - mu) / sg, 2)}</strong></div>`;
          body.querySelector('.widget-out').innerHTML = override ? `Zwischen μ − ${override}σ und μ + ${override}σ liegen <strong>${pc(p, 1)}</strong> aller Werte.` : '';
        };
        body.querySelectorAll('input').forEach((i) => i.addEventListener('input', () => { override = null; up(); }));
        body.querySelector('[data-anim]').addEventListener('click', () => {
          clearTimeout(animTimer);
          let k = 1;
          const stepAnim = () => {
            override = k;
            up();
            k++;
            if (k <= 3) animTimer = setTimeout(stepAnim, 2200);
            else animTimer = setTimeout(() => { override = null; up(); }, 3500);
          };
          stepAnim();
        });
        up();
      },
    };
    el.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => {
      clearTimeout(animTimer);
      el.querySelectorAll('[data-t]').forEach((x) => x.classList.toggle('active', x === b));
      tabs[b.dataset.t]();
    }));
    tabs.binom();
  };

  /* ---------- Kapitel 13: Konfidenzintervall-Simulation ---------- */
  W['ki-simulation'] = (el) => {
    const MU = 100, SIGMA = 15;
    let total = 0, hits = 0;
    el.innerHTML = `<div class="widget-box"><p>Der <strong>wahre Mittelwert ist μ = 100</strong> (in Wirklichkeit kennt man ihn nicht!). Jede Linie ist ein Konfidenzintervall aus einer neuen Stichprobe.</p>
      <div class="row"><label class="field"><span>Stichprobengröße n = <strong data-o="n">25</strong></span><input type="range" min="5" max="200" value="25" data-n></label>
      <label class="field"><span>Niveau</span><select data-l><option value="0.9">90 %</option><option value="0.95" selected>95 %</option><option value="0.99">99 %</option></select></label>
      <button class="btn btn-primary" data-go>🎲 20 Stichproben ziehen</button></div>
      <div class="chart-box"></div><div class="kpis"></div></div>`;
    const randn = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const draw = () => {
      const n = Number(el.querySelector('[data-n]').value), level = Number(el.querySelector('[data-l]').value);
      const z = St.zTwoSided(level);
      const e = (z * SIGMA) / Math.sqrt(n);
      const ivs = [];
      for (let k = 0; k < 20; k++) {
        let s = 0;
        for (let i = 0; i < n; i++) s += MU + SIGMA * randn();
        const m = s / n;
        ivs.push({ lo: m - e, hi: m + e, m, hit: m - e <= MU && MU <= m + e });
      }
      const h = ivs.filter((x) => x.hit).length;
      total += 20; hits += h;
      const X = (v) => 30 + ((v - 80) / 40) * 540;
      let svg = `<svg class="chart" viewBox="0 0 600 ${20 * 14 + 40}" role="img" aria-label="20 Konfidenzintervalle">`;
      svg += `<line x1="${X(MU)}" x2="${X(MU)}" y1="5" y2="${20 * 14 + 15}" class="mark-strong"/><text x="${X(MU)}" y="${20 * 14 + 32}" class="axis" text-anchor="middle">μ = 100</text>`;
      ivs.forEach((iv, k) => {
        const y = 14 + k * 14;
        svg += `<line x1="${X(Math.max(80, iv.lo))}" x2="${X(Math.min(120, iv.hi))}" y1="${y}" y2="${y}" class="${iv.hit ? 'ci-hit' : 'ci-miss'}"/><circle cx="${X(Math.max(80, Math.min(120, iv.m)))}" cy="${y}" r="3.5" class="${iv.hit ? 'ci-hit-dot' : 'ci-miss-dot'}"/>`;
      });
      el.querySelector('.chart-box').innerHTML = svg + '</svg>';
      el.querySelector('.kpis').innerHTML = `<div><span>Diese Runde</span><strong>${h} / 20 treffen μ</strong></div><div><span>Insgesamt</span><strong>${hits} / ${total} = ${pc(hits / total, 1)}</strong></div><div><span>Halbe Breite</span><strong>±${f(e, 2)}</strong></div>`;
    };
    el.querySelector('[data-n]').addEventListener('input', (e) => (el.querySelector('[data-o="n"]').textContent = e.target.value));
    el.querySelector('[data-go]').addEventListener('click', draw);
    el.querySelector('[data-l]').addEventListener('change', () => { total = 0; hits = 0; draw(); });
    draw();
  };

  /* ---------- Kapitel 14: Test-Assistent ---------- */
  W['test-assistent'] = (el) => {
    el.innerHTML = `<div class="widget-box assistant">
      <form class="assistant-form">
        <div class="row">
          <label class="field"><span>Behauptung: Der Mittelwert ist …</span><select data-f="claim"><option value="min">mindestens</option><option value="max">höchstens</option><option value="eq">genau</option></select></label>
          <label class="field"><span>μ₀ (behaupteter Wert)</span><input data-f="mu0" value="3500" inputmode="decimal"></label>
        </div>
        <div class="row">
          <label class="field"><span>x̄ (Stichprobe)</span><input data-f="xb" value="3470" inputmode="decimal"></label>
          <label class="field"><span>n</span><input data-f="n" value="50" inputmode="numeric"></label>
          <label class="field"><span>Streuung</span><input data-f="sd" value="11" inputmode="decimal"></label>
        </div>
        <div class="row">
          <label class="field"><span>Die Streuung ist …</span><select data-f="known"><option value="s">s aus der Stichprobe (σ unbekannt)</option><option value="var">Stichprobenvarianz s²</option><option value="sigma">σ der Grundgesamtheit (bekannt)</option></select></label>
          <label class="field"><span>α</span><select data-f="alpha"><option>0,05</option><option>0,01</option><option>0,1</option></select></label>
        </div>
        <button class="btn btn-primary">🚀 Assistent starten</button>
      </form>
      <div class="wizard" hidden></div></div>`;
    const form = el.querySelector('form'), wiz = el.querySelector('.wizard');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const g = (k) => el.querySelector(`[data-f="${k}"]`);
      const claim = g('claim').value, mu0 = num(g('mu0')), xb = num(g('xb')), n = Math.max(2, Math.round(num(g('n'), 30)));
      const kind = g('known').value;
      let sd = num(g('sd'), 1);
      if (kind === 'var') sd = Math.sqrt(sd);
      const alpha = St.parseNum(g('alpha').value).value;
      const known = kind === 'sigma';
      const side = claim === 'min' ? 'left' : claim === 'max' ? 'right' : 'two';
      const q = side === 'two' ? 1 - alpha / 2 : 1 - alpha;
      const crit = known ? St.z(q) : St.tInv(q, n - 1);
      const se = sd / Math.sqrt(n);
      const stat = (xb - mu0) / se;
      const reject = side === 'left' ? stat < -crit : side === 'right' ? stat > crit : Math.abs(stat) > crit;
      const claimTxt = { min: 'mindestens', max: 'höchstens', eq: 'genau' }[claim];
      const h0 = { left: `μ ≥ ${f(mu0)}`, right: `μ ≤ ${f(mu0)}`, two: `μ = ${f(mu0)}` }[side];
      const h1 = { left: `μ < ${f(mu0)}`, right: `μ > ${f(mu0)}`, two: `μ ≠ ${f(mu0)}` }[side];
      const sym = known ? 'z' : 't';
      const steps = [
        ['Schritt 1: Welche Hypothese wird geprüft?', `Geprüft wird die Behauptung: <strong>„Der Mittelwert ist ${claimTxt} ${f(mu0)}.“</strong> Wir prüfen, ob die Stichprobe (x̄ = ${f(xb)}) dazu passt.`],
        ['Schritt 2: Welche Nullhypothese?', `Die Behauptung (mit Gleichheitszeichen) wird zur Nullhypothese:<div class="formula">H₀: ${h0}</div>`],
        ['Schritt 3: Welche Alternativhypothese?', `Das Gegenteil:<div class="formula">H₁: ${h1}</div>→ Das ist ein <strong>${{ left: 'linksseitiger', right: 'rechtsseitiger', two: 'beidseitiger' }[side]}</strong> Test.`],
        ['Schritt 4: Welcher Test?', `${known ? 'σ ist bekannt → <strong>z-Test</strong>.' : `σ ist unbekannt → <strong>t-Test</strong> mit ${n - 1} Freiheitsgraden.`}${kind === 'var' ? `<br>Achtung: Varianz gegeben → s = √${f(sd * sd, 4)} = ${f(sd, 4)}.` : ''}
          <div class="formula">${sym} = (x̄ − μ₀) / (${known ? 'σ' : 's'} / √n) = (${f(xb)} − ${f(mu0)}) / (${f(sd, 4)} / √${n}) = <strong>${f(stat, 3)}</strong></div>
          Kritischer Wert bei α = ${f(alpha)}: <strong>${side === 'left' ? '−' : side === 'two' ? '±' : ''}${f(crit, 3)}</strong>`],
        ['Schritt 5: Entscheidung', `${C.normal({ mu: 0, sigma: 1, from: -4, to: 4, height: 210, rejectLeft: side !== 'right' ? -crit : undefined, rejectRight: side !== 'left' ? crit : undefined, ticks: [-3, -2, -1, 0, 1, 2, 3].map((k) => ({ x: k, label: String(k) })), marks: [{ x: Math.max(-3.9, Math.min(3.9, stat)), label: `${sym} = ${f(stat, 2)}`, cls: 'mark-strong' }] })}
          <div class="big-result ${reject ? 'warn' : 'success'}">${reject ? 'H₀ wird abgelehnt' : 'H₀ wird nicht abgelehnt'}</div>
          <p>${reject ? `Die Prüfgröße liegt im roten Bereich. Die Stichprobe spricht deutlich gegen die Behauptung „${claimTxt} ${f(mu0)}“. Die Behauptung ist mit dem Stichprobenergebnis <strong>nicht vereinbar</strong>.` : `Die Prüfgröße liegt nicht im roten Bereich. Die Abweichung kann Zufall sein – die Behauptung „${claimTxt} ${f(mu0)}“ ist mit der Stichprobe <strong>vereinbar</strong>.`}</p>`],
      ];
      let shown = 0;
      wiz.hidden = false;
      wiz.innerHTML = `<div class="wizard-progress">${steps.map((_, i) => `<span>${i + 1}</span>`).join('')}</div><div class="wizard-steps"></div><button class="btn btn-primary" data-next>Nächster Schritt →</button>`;
      const box = wiz.querySelector('.wizard-steps'), btn = wiz.querySelector('[data-next]');
      const show = () => {
        const [t, h] = steps[shown];
        const d = document.createElement('div');
        d.className = 'wizard-step reveal';
        d.innerHTML = `<h4>${t}</h4><div>${h}</div>`;
        box.appendChild(d);
        wiz.querySelectorAll('.wizard-progress span').forEach((s, i) => s.classList.toggle('done', i <= shown));
        shown++;
        if (shown >= steps.length) btn.remove();
        d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      btn.addEventListener('click', show);
      show();
    });
  };

  /* ---------- Kapitel 15: Regression ---------- */
  W['regression'] = (el) => {
    const preset = { x: [180, 190, 210, 200, 220], y: [115, 100, 90, 90, 70] };
    let pts = { x: [...preset.x], y: [...preset.y] };
    el.innerHTML = `<div class="widget-box"><p class="muted">Tipp ins Diagramm, um einen Punkt hinzuzufügen. Beobachte, wie sich Gerade und r verändern.</p>
      <div class="chart-box clickable"></div><div class="row"><button class="btn btn-ghost btn-sm" data-undo>↩ Letzten Punkt entfernen</button><button class="btn btn-ghost btn-sm" data-reset>🔄 Klausurdaten</button><label class="field check"><input type="checkbox" data-res checked> Residuen zeigen</label></div>
      <div class="widget-out"></div></div>`;
    const box = el.querySelector('.chart-box');
    let bounds = null;
    const update = () => {
      const R = pts.x.length >= 2 ? St.regression(pts.x, pts.y) : null;
      const valid = R && Number.isFinite(R.b);
      bounds = { xmin: 150, xmax: 250, ymin: 40, ymax: 150 };
      box.innerHTML = C.scatter({ x: pts.x, y: pts.y, a: valid ? R.a : undefined, b: valid ? R.b : undefined, residuals: el.querySelector('[data-res]').checked, height: 300, xLabel: 'Preis (€)', yLabel: 'Menge', ...bounds });
      el.querySelector('.widget-out').innerHTML = valid
        ? `<div class="formula">ŷ = ${f(R.a, 2)} ${R.b < 0 ? '−' : '+'} ${f(Math.abs(R.b), 3)} · x</div><div class="kpis"><div><span>b (Steigung)</span><strong>${f(R.b, 3)}</strong></div><div><span>a</span><strong>${f(R.a, 2)}</strong></div><div><span>r</span><strong>${f(R.r, 3)}</strong></div><div><span>R²</span><strong>${f(R.r2, 3)}</strong></div></div><p>${St.rStrength(R.r)}.</p>`
        : '<p class="muted">Mindestens 2 Punkte mit unterschiedlichen x-Werten nötig.</p>';
    };
    box.addEventListener('click', (e) => {
      const svg = box.querySelector('svg');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const sx = ((e.clientX - rect.left) / rect.width) * vb.width;
      const sy = ((e.clientY - rect.top) / rect.height) * vb.height;
      const pl = Number(svg.dataset.pl), pt = Number(svg.dataset.pt), iw = Number(svg.dataset.iw), ih = Number(svg.dataset.ih);
      if (sx < pl || sx > pl + iw || sy < pt || sy > pt + ih) return;
      const x = bounds.xmin + ((sx - pl) / iw) * (bounds.xmax - bounds.xmin);
      const y = bounds.ymin + ((pt + ih - sy) / ih) * (bounds.ymax - bounds.ymin);
      pts.x.push(Math.round(x));
      pts.y.push(Math.round(y));
      update();
    });
    el.querySelector('[data-undo]').addEventListener('click', () => { pts.x.pop(); pts.y.pop(); update(); });
    el.querySelector('[data-reset]').addEventListener('click', () => { pts = { x: [...preset.x], y: [...preset.y] }; update(); });
    el.querySelector('[data-res]').addEventListener('change', update);
    update();
  };

  /* ---------- Kapitel 16: Index-Rechner ---------- */
  W['index'] = (el) => {
    const init = [[55, 200, 70, 180], [65, 50, 58, 80], [150, 15, 190, 25]];
    el.innerHTML = `<div class="widget-box"><div class="table-wrap"><table class="table idx"><thead><tr><th></th><th>p₀</th><th>q₀</th><th>p₁</th><th>q₁</th></tr></thead><tbody>
      ${init.map((r, i) => `<tr><th>Produkt ${i + 1}</th>${r.map((v, k) => `<td><input data-r="${i}" data-k="${k}" value="${v}" inputmode="decimal" aria-label="Produkt ${i + 1} Wert ${k + 1}"></td>`).join('')}</tr>`).join('')}
      </tbody></table></div><div class="widget-out"></div></div>`;
    const update = () => {
      const v = init.map((_, i) => [0, 1, 2, 3].map((k) => num(el.querySelector(`[data-r="${i}"][data-k="${k}"]`))));
      const p0 = v.map((r) => r[0]), q0 = v.map((r) => r[1]), p1 = v.map((r) => r[2]), q1 = v.map((r) => r[3]);
      const s = (a, b) => St.sum(a.map((x, i) => x * b[i]));
      const L = s(p1, q0) / s(p0, q0), P = s(p1, q1) / s(p0, q1);
      el.querySelector('.widget-out').innerHTML = `<div class="formula">P_L = Σp₁q₀ / Σp₀q₀ = ${f(s(p1, q0), 0)} / ${f(s(p0, q0), 0)} = <strong>${f(L, 4)}</strong> (${L >= 1 ? '+' : ''}${pc(L - 1)})</div>
        <div class="formula">P_P = Σp₁q₁ / Σp₀q₁ = ${f(s(p1, q1), 0)} / ${f(s(p0, q1), 0)} = <strong>${f(P, 4)}</strong> (${P >= 1 ? '+' : ''}${pc(P - 1)})</div>
        <p class="muted">Laspeyres bewertet den alten Warenkorb, Paasche den neuen. Ändern sich die Mengen nicht, sind beide gleich.</p>`;
    };
    el.querySelectorAll('input').forEach((i) => i.addEventListener('input', update));
    update();
  };

  SL.Widgets = W;
})();
