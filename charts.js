/**
 * charts.js
 * ---------------------------------------------------------------
 * Kleine SVG-Diagramm-Helfer ohne externe Bibliothek.
 * Alle Farben kommen aus CSS-Variablen, damit Hell- und Dunkelmodus
 * automatisch passen.
 *
 * Jede Funktion gibt einen SVG-String zurück.
 */
(function () {
  'use strict';
  const SL = (window.SL = window.SL || {});
  const fmt = (x, d = 2) => (SL.Stat ? SL.Stat.fmt(x, d) : String(x));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function niceMax(v) {
    if (v <= 0) return 1;
    const e = Math.pow(10, Math.floor(Math.log10(v)));
    const m = v / e;
    const n = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
    return n * e;
  }

  /**
   * Säulendiagramm.
   * opts: {labels, values, width, height, color, valueFmt, highlight:[idx], yLabel}
   */
  function bars(opts) {
    const W = opts.width || 600, H = opts.height || 260;
    const pad = { l: 46, r: 12, t: 16, b: 42 };
    const n = opts.values.length || 1;
    const max = niceMax(Math.max(...opts.values, 0) * 1.05);
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const bw = (iw / n) * 0.72;
    const vf = opts.valueFmt || ((v) => fmt(v, 2));
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.title || 'Säulendiagramm')}">`;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + ih - (ih * i) / 4;
      s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" class="grid"/>`;
      s += `<text x="${pad.l - 6}" y="${y + 4}" class="axis" text-anchor="end">${vf((max * i) / 4)}</text>`;
    }
    opts.values.forEach((v, i) => {
      const x = pad.l + (iw / n) * i + (iw / n - bw) / 2;
      const h = (ih * v) / max;
      const hl = opts.highlight && opts.highlight.includes(i);
      s += `<rect x="${x}" y="${pad.t + ih - h}" width="${bw}" height="${Math.max(0, h)}" rx="4" class="${hl ? 'bar-hl' : 'bar'}" style="${opts.color ? 'fill:' + opts.color : ''}"><title>${esc(opts.labels[i])}: ${vf(v)}</title></rect>`;
      if (opts.showValues !== false && n <= 16) s += `<text x="${x + bw / 2}" y="${pad.t + ih - h - 5}" class="val" text-anchor="middle">${vf(v)}</text>`;
      const step = Math.ceil(n / 14);
      if (i % step === 0) s += `<text x="${x + bw / 2}" y="${H - pad.b + 18}" class="axis" text-anchor="middle">${esc(opts.labels[i])}</text>`;
    });
    if (opts.yLabel) s += `<text x="12" y="${pad.t + ih / 2}" class="axis" transform="rotate(-90 12 ${pad.t + ih / 2})" text-anchor="middle">${esc(opts.yLabel)}</text>`;
    return s + '</svg>';
  }

  /**
   * Liniendiagramm.
   * opts: {labels, values, width, height, min, max, refLine:{value,label}}
   */
  function line(opts) {
    const W = opts.width || 600, H = opts.height || 240;
    const pad = { l: 46, r: 16, t: 16, b: 40 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const min = opts.min !== undefined ? opts.min : Math.min(...opts.values);
    const max = opts.max !== undefined ? opts.max : niceMax(Math.max(...opts.values));
    const n = opts.values.length;
    const X = (i) => pad.l + (n === 1 ? iw / 2 : (iw * i) / (n - 1));
    const Y = (v) => pad.t + ih - ((v - min) / (max - min || 1)) * ih;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.title || 'Liniendiagramm')}">`;
    for (let i = 0; i <= 4; i++) {
      const v = min + ((max - min) * i) / 4;
      s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/>`;
      s += `<text x="${pad.l - 6}" y="${Y(v) + 4}" class="axis" text-anchor="end">${fmt(v, 0)}</text>`;
    }
    if (opts.refLine) {
      s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(opts.refLine.value)}" y2="${Y(opts.refLine.value)}" class="ref"/>`;
      s += `<text x="${W - pad.r}" y="${Y(opts.refLine.value) - 6}" class="axis" text-anchor="end">${esc(opts.refLine.label)}</text>`;
    }
    if (n) {
      s += `<polyline points="${opts.values.map((v, i) => `${X(i)},${Y(v)}`).join(' ')}" class="line"/>`;
      opts.values.forEach((v, i) => {
        s += `<circle cx="${X(i)}" cy="${Y(v)}" r="5" class="dot"><title>${esc(opts.labels[i])}: ${fmt(v, 1)}</title></circle>`;
        if (n <= 12) s += `<text x="${X(i)}" y="${H - pad.b + 18}" class="axis" text-anchor="middle">${esc(opts.labels[i])}</text>`;
      });
    }
    return s + '</svg>';
  }

  /**
   * Normalverteilungskurve mit schattierter Fläche.
   * opts: {mu, sigma, from, to, shadeFrom, shadeTo, marks:[{x,label,cls}], width, height, rejectLeft, rejectRight}
   */
  function normal(opts) {
    const W = opts.width || 600, H = opts.height || 240;
    const pad = { l: 16, r: 16, t: 14, b: 40 };
    const mu = opts.mu || 0, sg = opts.sigma || 1;
    const from = opts.from !== undefined ? opts.from : mu - 4 * sg;
    const to = opts.to !== undefined ? opts.to : mu + 4 * sg;
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const peak = SL.Stat.normPdf(mu, mu, sg);
    const X = (x) => pad.l + ((x - from) / (to - from)) * iw;
    const Y = (y) => pad.t + ih - (y / peak) * ih * 0.95;
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const x = from + ((to - from) * i) / 200;
      pts.push([x, SL.Stat.normPdf(x, mu, sg)]);
    }
    const area = (a, b, cls) => {
      a = Math.max(a, from); b = Math.min(b, to);
      if (b <= a) return '';
      const seg = pts.filter((p) => p[0] >= a && p[0] <= b);
      const d = [`M${X(a)},${Y(0)}`, `L${X(a)},${Y(SL.Stat.normPdf(a, mu, sg))}`]
        .concat(seg.map((p) => `L${X(p[0])},${Y(p[1])}`))
        .concat([`L${X(b)},${Y(SL.Stat.normPdf(b, mu, sg))}`, `L${X(b)},${Y(0)}`, 'Z']);
      return `<path d="${d.join(' ')}" class="${cls}"/>`;
    };
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Normalverteilung">`;
    (opts.areas || []).forEach((a) => (s += area(a.from, a.to, a.cls || 'area')));
    if (opts.shadeFrom !== undefined || opts.shadeTo !== undefined) {
      s += area(opts.shadeFrom !== undefined ? opts.shadeFrom : from, opts.shadeTo !== undefined ? opts.shadeTo : to, 'area');
    }
    if (opts.rejectLeft !== undefined) s += area(from, opts.rejectLeft, 'area-reject');
    if (opts.rejectRight !== undefined) s += area(opts.rejectRight, to, 'area-reject');
    s += `<polyline points="${pts.map((p) => `${X(p[0])},${Y(p[1])}`).join(' ')}" class="curve"/>`;
    s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(0)}" y2="${Y(0)}" class="axisline"/>`;
    const ticks = opts.ticks || [-3, -2, -1, 0, 1, 2, 3].map((k) => ({ x: mu + k * sg, label: k === 0 ? 'μ' : (k > 0 ? 'μ+' : 'μ−') + Math.abs(k) + 'σ' }));
    ticks.forEach((t) => {
      if (t.x < from || t.x > to) return;
      s += `<line x1="${X(t.x)}" x2="${X(t.x)}" y1="${Y(0)}" y2="${Y(0) + 5}" class="axisline"/>`;
      s += `<text x="${X(t.x)}" y="${Y(0) + 18}" class="axis" text-anchor="middle">${esc(t.label)}</text>`;
      if (t.sub) s += `<text x="${X(t.x)}" y="${Y(0) + 32}" class="axis small" text-anchor="middle">${esc(t.sub)}</text>`;
    });
    (opts.marks || []).forEach((m) => {
      if (m.x < from || m.x > to) return;
      s += `<line x1="${X(m.x)}" x2="${X(m.x)}" y1="${pad.t}" y2="${Y(0)}" class="${m.cls || 'mark'}"/>`;
      s += `<text x="${X(m.x)}" y="${pad.t + 12}" class="mark-label" text-anchor="${X(m.x) > W - 80 ? 'end' : X(m.x) < 80 ? 'start' : 'middle'}">${esc(m.label)}</text>`;
    });
    return s + '</svg>';
  }

  /**
   * Streudiagramm mit optionaler Regressionsgeraden.
   * opts: {x, y, a, b, width, height, xLabel, yLabel, residuals}
   */
  function scatter(opts) {
    const W = opts.width || 600, H = opts.height || 300;
    const pad = { l: 54, r: 16, t: 16, b: 44 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const xs = opts.x, ys = opts.y;
    const xmin0 = Math.min(...xs), xmax0 = Math.max(...xs), ymin0 = Math.min(...ys), ymax0 = Math.max(...ys);
    const dx = (xmax0 - xmin0) || 1, dy = (ymax0 - ymin0) || 1;
    const xmin = opts.xmin !== undefined ? opts.xmin : xmin0 - dx * 0.1;
    const xmax = opts.xmax !== undefined ? opts.xmax : xmax0 + dx * 0.1;
    const ymin = opts.ymin !== undefined ? opts.ymin : ymin0 - dy * 0.15;
    const ymax = opts.ymax !== undefined ? opts.ymax : ymax0 + dy * 0.15;
    const X = (v) => pad.l + ((v - xmin) / (xmax - xmin)) * iw;
    const Y = (v) => pad.t + ih - ((v - ymin) / (ymax - ymin)) * ih;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Streudiagramm" data-xmin="${xmin}" data-xmax="${xmax}" data-ymin="${ymin}" data-ymax="${ymax}" data-pl="${pad.l}" data-pt="${pad.t}" data-iw="${iw}" data-ih="${ih}">`;
    for (let i = 0; i <= 4; i++) {
      const yv = ymin + ((ymax - ymin) * i) / 4;
      const xv = xmin + ((xmax - xmin) * i) / 4;
      s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${Y(yv)}" y2="${Y(yv)}" class="grid"/>`;
      s += `<text x="${pad.l - 6}" y="${Y(yv) + 4}" class="axis" text-anchor="end">${fmt(yv, 1)}</text>`;
      s += `<text x="${X(xv)}" y="${H - pad.b + 18}" class="axis" text-anchor="middle">${fmt(xv, 1)}</text>`;
    }
    if (opts.a !== undefined && opts.b !== undefined && Number.isFinite(opts.b)) {
      if (opts.residuals) {
        xs.forEach((xv, i) => {
          s += `<line x1="${X(xv)}" x2="${X(xv)}" y1="${Y(ys[i])}" y2="${Y(opts.a + opts.b * xv)}" class="resid"/>`;
        });
      }
      s += `<line x1="${X(xmin)}" y1="${Y(opts.a + opts.b * xmin)}" x2="${X(xmax)}" y2="${Y(opts.a + opts.b * xmax)}" class="regline"/>`;
    }
    xs.forEach((xv, i) => (s += `<circle cx="${X(xv)}" cy="${Y(ys[i])}" r="6" class="dot"><title>(${fmt(xv)} | ${fmt(ys[i])})</title></circle>`));
    if (opts.xLabel) s += `<text x="${pad.l + iw / 2}" y="${H - 6}" class="axis" text-anchor="middle">${esc(opts.xLabel)}</text>`;
    if (opts.yLabel) s += `<text x="14" y="${pad.t + ih / 2}" class="axis" transform="rotate(-90 14 ${pad.t + ih / 2})" text-anchor="middle">${esc(opts.yLabel)}</text>`;
    return s + '</svg>';
  }

  /** Lorenzkurve: points [{k,l}] */
  function lorenz(points, opts = {}) {
    const W = opts.width || 360, H = opts.height || 360;
    const pad = 40;
    const iw = W - 2 * pad, ih = H - 2 * pad;
    const X = (k) => pad + k * iw, Y = (l) => H - pad - l * ih;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Lorenzkurve">`;
    for (let i = 0; i <= 4; i++) {
      s += `<line x1="${X(i / 4)}" x2="${X(i / 4)}" y1="${Y(0)}" y2="${Y(1)}" class="grid"/>`;
      s += `<line x1="${X(0)}" x2="${X(1)}" y1="${Y(i / 4)}" y2="${Y(i / 4)}" class="grid"/>`;
      s += `<text x="${X(i / 4)}" y="${H - pad + 18}" class="axis" text-anchor="middle">${i * 25}%</text>`;
      s += `<text x="${pad - 6}" y="${Y(i / 4) + 4}" class="axis" text-anchor="end">${i * 25}%</text>`;
    }
    const curve = points.map((p) => `${X(p.k)},${Y(p.l)}`).join(' ');
    s += `<polygon points="${X(0)},${Y(0)} ${X(1)},${Y(1)} ${points.slice().reverse().map((p) => `${X(p.k)},${Y(p.l)}`).join(' ')}" class="area"/>`;
    s += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(1)}" y2="${Y(1)}" class="ref"/>`;
    s += `<polyline points="${curve}" class="line"/>`;
    points.forEach((p) => (s += `<circle cx="${X(p.k)}" cy="${Y(p.l)}" r="4.5" class="dot"><title>${fmt(p.k * 100, 1)} % besitzen ${fmt(p.l * 100, 1)} %</title></circle>`));
    s += `<text x="${pad + iw / 2}" y="${H - 4}" class="axis" text-anchor="middle">Anteil Merkmalsträger</text>`;
    s += `<text x="12" y="${H / 2}" class="axis" transform="rotate(-90 12 ${H / 2})" text-anchor="middle">Anteil Merkmalssumme</text>`;
    return s + '</svg>';
  }

  /**
   * Horizontale Balken (z. B. Kapitel-Fortschritt).
   * items: [{label, value (0..100), cls}]
   */
  function hbars(items, opts = {}) {
    const W = opts.width || 600;
    const rowH = 30;
    const H = items.length * rowH + 10;
    const lw = opts.labelWidth || 190;
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.title || 'Balken')}">`;
    items.forEach((it, i) => {
      const y = 6 + i * rowH;
      const w = ((W - lw - 56) * Math.max(0, Math.min(100, it.value))) / 100;
      s += `<text x="${lw - 8}" y="${y + 17}" class="axis" text-anchor="end">${esc(it.label)}</text>`;
      s += `<rect x="${lw}" y="${y + 4}" width="${W - lw - 56}" height="18" rx="9" class="track"/>`;
      s += `<rect x="${lw}" y="${y + 4}" width="${w}" height="18" rx="9" class="${it.cls || 'bar'}"/>`;
      s += `<text x="${W - 6}" y="${y + 17}" class="val" text-anchor="end">${Math.round(it.value)}%</text>`;
    });
    return s + '</svg>';
  }

  /** Textbalken wie "██████░░░░ 60%". */
  function textBar(percent, len = 10) {
    const full = Math.round((Math.max(0, Math.min(100, percent)) / 100) * len);
    return '█'.repeat(full) + '░'.repeat(len - full);
  }

  SL.Charts = { bars, line, normal, scatter, lorenz, hbars, textBar, esc };
})();
