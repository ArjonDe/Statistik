/**
 * statistik.js
 * ---------------------------------------------------------------
 * Die Mathe-Bibliothek der Plattform. Alle Berechnungen, die in
 * Aufgaben, Widgets, Klausuren und im Statistik-Rechner gebraucht
 * werden, stehen hier – an einer einzigen Stelle.
 *
 * Konventionen (passend zur Vorlesung):
 *  - Stichprobenvarianz:  s² = Σ(xᵢ − x̄)² / (n − 1)
 *  - Varianz der Grundgesamtheit / klassierter Verteilungen: / n
 *  - Quantil (Rohdaten): ist n·p ganzzahlig → Mittel aus x(np) und x(np+1),
 *    sonst → x(⌈np⌉)
 *  - Gini: G = 1 − Σ (kᵢ − kᵢ₋₁)(lᵢ + lᵢ₋₁),  G* = n/(n−1) · G
 *
 * Alles hängt an window.SL.Stat.
 */
(function () {
  'use strict';
  const SL = (window.SL = window.SL || {});

  const Stat = {};

  /* ---------- Grundfunktionen ---------- */
  Stat.sum = (a) => a.reduce((s, x) => s + x, 0);
  Stat.mean = (a) => (a.length ? Stat.sum(a) / a.length : NaN);
  Stat.sorted = (a) => [...a].sort((x, y) => x - y);
  Stat.round = (x, d = 2) => {
    const f = Math.pow(10, d);
    return Math.round((x + Number.EPSILON) * f) / f;
  };

  Stat.median = (a) => Stat.quantile(a, 0.5);

  /** Quantil nach der Schulregel (siehe Kopfkommentar). */
  Stat.quantile = (a, p) => {
    const s = Stat.sorted(a);
    const n = s.length;
    if (!n) return NaN;
    const np = n * p;
    if (Math.abs(np - Math.round(np)) < 1e-9) {
      const k = Math.round(np);
      if (k <= 0) return s[0];
      if (k >= n) return s[n - 1];
      return (s[k - 1] + s[k]) / 2;
    }
    return s[Math.ceil(np) - 1];
  };

  /** Liefert alle Werte, die am häufigsten vorkommen. */
  Stat.modes = (a) => {
    const counts = new Map();
    a.forEach((x) => counts.set(x, (counts.get(x) || 0) + 1));
    let max = 0;
    counts.forEach((c) => (max = Math.max(max, c)));
    const result = [];
    counts.forEach((c, v) => c === max && result.push(v));
    return { values: result.sort((x, y) => x - y), count: max };
  };

  Stat.variance = (a, sample = true) => {
    const m = Stat.mean(a);
    const q = Stat.sum(a.map((x) => (x - m) ** 2));
    return q / (sample ? a.length - 1 : a.length);
  };
  Stat.sd = (a, sample = true) => Math.sqrt(Stat.variance(a, sample));
  Stat.range = (a) => Math.max(...a) - Math.min(...a);
  Stat.cv = (a, sample = true) => Stat.sd(a, sample) / Stat.mean(a);

  /** Häufigkeitstabelle: Wert, absolute, relative und kumulierte Häufigkeiten. */
  Stat.freqTable = (a) => {
    const s = Stat.sorted(a);
    const n = s.length;
    const rows = [];
    let cum = 0;
    s.forEach((x) => {
      const last = rows[rows.length - 1];
      if (last && last.value === x) last.abs++;
      else rows.push({ value: x, abs: 1 });
    });
    rows.forEach((r) => {
      cum += r.abs;
      r.rel = r.abs / n;
      r.cumAbs = cum;
      r.cumRel = cum / n;
    });
    return rows;
  };

  /* ---------- Spezielle Mittelwerte ---------- */
  Stat.geoMean = (a) => Math.pow(a.reduce((p, x) => p * x, 1), 1 / a.length);
  Stat.harmMean = (a) => a.length / Stat.sum(a.map((x) => 1 / x));

  /* ---------- Klassierte Daten ----------
   * classes: [{lo, hi, n}]  (Klassen "mehr als lo bis hi")
   */
  Stat.grouped = (classes) => {
    const n = Stat.sum(classes.map((c) => c.n));
    const rows = [];
    let cum = 0;
    classes.forEach((c) => {
      const mid = (c.lo + c.hi) / 2;
      const width = c.hi - c.lo;
      cum += c.n;
      rows.push({ ...c, mid, width, rel: c.n / n, cumAbs: cum, cumRel: cum / n, cumBefore: cum - c.n });
    });
    const mean = Stat.sum(rows.map((r) => r.n * r.mid)) / n;
    const variance = Stat.sum(rows.map((r) => r.n * (r.mid - mean) ** 2)) / n;
    const sd = Math.sqrt(variance);

    /** Anteil der Werte ≤ x (lineare Interpolation in der Klasse). */
    const F = (x) => {
      if (x <= rows[0].lo) return 0;
      if (x >= rows[rows.length - 1].hi) return 1;
      for (const r of rows) {
        if (x <= r.hi) return (r.cumBefore + ((x - r.lo) / r.width) * r.n) / n;
      }
      return 1;
    };
    /** Wert, unter dem der Anteil p liegt. */
    const quantile = (p) => {
      const target = p * n;
      for (const r of rows) {
        if (target <= r.cumAbs + 1e-9) {
          return { value: r.lo + ((target - r.cumBefore) / r.n) * r.width, row: r, target };
        }
      }
      const last = rows[rows.length - 1];
      return { value: last.hi, row: last, target };
    };
    return { n, rows, mean, variance, sd, cv: sd / mean, F, quantile };
  };

  /* ---------- Kombinatorik ---------- */
  Stat.fact = (n) => {
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  };
  Stat.nCk = (n, k) => {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    let r = 1;
    for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
    return Math.round(r);
  };
  Stat.nPk = (n, k) => {
    let r = 1;
    for (let i = 0; i < k; i++) r *= n - i;
    return r;
  };

  /* ---------- Diskrete Verteilungen ---------- */
  Stat.binomPmf = (k, n, p) => Stat.nCk(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  Stat.binomCdf = (k, n, p) => {
    let s = 0;
    for (let i = 0; i <= k; i++) s += Stat.binomPmf(i, n, p);
    return Math.min(1, s);
  };
  Stat.poissonPmf = (k, lambda) => (Math.exp(-lambda) * Math.pow(lambda, k)) / Stat.fact(k);
  Stat.poissonCdf = (k, lambda) => {
    let s = 0;
    for (let i = 0; i <= k; i++) s += Stat.poissonPmf(i, lambda);
    return Math.min(1, s);
  };
  Stat.hyperPmf = (k, N, M, n) => (Stat.nCk(M, k) * Stat.nCk(N - M, n - k)) / Stat.nCk(N, n);

  /* ---------- Normalverteilung ---------- */
  /** Fehlerfunktion (Abramowitz & Stegun 7.1.26, Fehler < 1.5e-7). */
  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const y =
      1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
        t *
        Math.exp(-x * x);
    return sign * y;
  }
  Stat.normCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  Stat.normPdf = (x, mu = 0, sigma = 1) =>
    Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
  Stat.normCdfX = (x, mu, sigma) => Stat.normCdf((x - mu) / sigma);

  /** Inverse der Standardnormalverteilung (Acklam). */
  Stat.normInv = (p) => {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425;
    let q, r;
    if (p < pl) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p > 1 - pl) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    q = p - 0.5;
    r = q * q;
    return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  };

  /** Tabellenwerte, wie sie in der Klausur benutzt werden. */
  const Z_TABLE = { 0.9: 1.282, 0.95: 1.645, 0.975: 1.96, 0.99: 2.326, 0.995: 2.576 };
  /** z-Quantil z(p), mit gerundeten Tabellenwerten für typische p. */
  Stat.z = (p) => {
    const key = Math.round(p * 100000) / 100000;
    if (Z_TABLE[key] !== undefined) return Z_TABLE[key];
    if (p < 0.5) return -Stat.z(1 - p);
    return Stat.round(Stat.normInv(p), 3);
  };
  /** Kritischer z-Wert für ein zweiseitiges Konfidenzniveau (z.B. 0.95 → 1.96). */
  Stat.zTwoSided = (level) => {
    if (Math.abs(level - 0.9545) < 1e-6) return 2.0;
    if (Math.abs(level - 0.9973) < 1e-6) return 3.0;
    if (Math.abs(level - 0.6827) < 1e-6) return 1.0;
    return Stat.z(1 - (1 - level) / 2);
  };

  /* ---------- t-Verteilung ---------- */
  function gammaln(x) {
    const cof = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) ser += cof[j] / ++y;
    return -tmp + Math.log((2.5066282746310005 * ser) / x);
  }
  function betacf(a, b, x) {
    const FPMIN = 1e-300;
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 300; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  }
  function ibeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
    return 1 - (bt * betacf(b, a, 1 - x)) / b;
  }
  Stat.tCdf = (t, df) => {
    const x = df / (df + t * t);
    const p = 0.5 * ibeta(x, df / 2, 0.5);
    return t > 0 ? 1 - p : p;
  };
  /** t-Quantil t(df; p) per Bisektion, auf 3 Nachkommastellen gerundet. */
  Stat.tInv = (p, df) => {
    if (df > 1000) return Stat.z(p);
    let lo = -50, hi = 50;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (Stat.tCdf(mid, df) < p) lo = mid; else hi = mid;
    }
    return Stat.round((lo + hi) / 2, 3);
  };

  /* ---------- Konfidenzintervalle ---------- */
  /**
   * opts: {mean, n, level, sigma?, s?}  →  σ bekannt: z, sonst t(n−1)
   */
  Stat.ciMean = ({ mean, n, level = 0.95, sigma = null, s = null }) => {
    const known = sigma !== null && sigma !== undefined && sigma !== '';
    const sd = known ? sigma : s;
    const crit = known ? Stat.zTwoSided(level) : Stat.tInv(1 - (1 - level) / 2, n - 1);
    const se = sd / Math.sqrt(n);
    const e = crit * se;
    return { lo: mean - e, hi: mean + e, crit, se, e, dist: known ? 'z' : 't', df: n - 1 };
  };
  Stat.ciProp = ({ p, n, level = 0.95 }) => {
    const crit = Stat.zTwoSided(level);
    const se = Math.sqrt((p * (1 - p)) / n);
    return { lo: p - crit * se, hi: p + crit * se, crit, se, e: crit * se };
  };
  /** Notwendiger Stichprobenumfang für halbe Breite e. */
  Stat.sampleSize = ({ sigma, e, level = 0.95 }) => {
    const z = Stat.zTwoSided(level);
    return { z, exact: (z * sigma / e) ** 2, n: Math.ceil((z * sigma / e) ** 2 - 1e-9) };
  };

  /* ---------- Zusammenhang & Regression ---------- */
  Stat.regression = (x, y) => {
    const n = x.length;
    const xm = Stat.mean(x), ym = Stat.mean(y);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      sxy += (x[i] - xm) * (y[i] - ym);
      sxx += (x[i] - xm) ** 2;
      syy += (y[i] - ym) ** 2;
    }
    const b = sxy / sxx;
    const a = ym - b * xm;
    const r = sxy / Math.sqrt(sxx * syy);
    return { n, xm, ym, sxy, sxx, syy, a, b, r, r2: r * r, cov: sxy / n };
  };
  Stat.pearson = (x, y) => Stat.regression(x, y).r;

  /** Rangkorrelation nach Spearman (Formel mit d²). */
  Stat.spearman = (rx, ry) => {
    const n = rx.length;
    const d2 = Stat.sum(rx.map((r, i) => (r - ry[i]) ** 2));
    return { rho: 1 - (6 * d2) / (n * (n * n - 1)), d2, n };
  };

  /** Vierfeldertafel: φ-Koeffizient (Betrag ist entscheidend). */
  Stat.phi = (a, b, c, d) => (a * d - b * c) / Math.sqrt((a + b) * (c + d) * (a + c) * (b + d));
  Stat.phiStrength = (phi) => {
    const v = Math.abs(phi);
    if (v > 0.8) return 'sehr starker Zusammenhang';
    if (v > 0.6) return 'starker Zusammenhang';
    if (v > 0.4) return 'mittlerer Zusammenhang';
    if (v > 0.2) return 'schwacher Zusammenhang';
    return 'vernachlässigbarer Zusammenhang';
  };
  Stat.rStrength = (r) => {
    const v = Math.abs(r);
    const dir = r < 0 ? 'negativer' : 'positiver';
    if (v >= 0.8) return `sehr starker ${dir} Zusammenhang`;
    if (v >= 0.6) return `starker ${dir} Zusammenhang`;
    if (v >= 0.4) return `mittlerer ${dir} Zusammenhang`;
    if (v >= 0.2) return `schwacher ${dir} Zusammenhang`;
    return 'praktisch kein Zusammenhang';
  };

  /* ---------- Konzentration ---------- */
  /**
   * Lorenzkurve + Gini.
   * groups: [{count, total}] (bei Einzelwerten count=1, total=Wert)
   * Sortierung nach Durchschnitt pro Einheit aufsteigend.
   */
  Stat.lorenz = (groups, single = false) => {
    const g = [...groups].sort((p, q) => p.total / p.count - q.total / q.count);
    const N = Stat.sum(g.map((x) => x.count));
    const T = Stat.sum(g.map((x) => x.total));
    const points = [{ k: 0, l: 0 }];
    let ck = 0, cl = 0, sum = 0;
    g.forEach((x) => {
      const pk = ck, pl = cl;
      ck += x.count / N;
      cl += x.total / T;
      sum += (ck - pk) * (cl + pl);
      points.push({ k: ck, l: cl, shareK: x.count / N, shareL: x.total / T });
    });
    const G = 1 - sum;
    const n = g.length;
    return { points, gini: G, giniCorr: single && n > 1 ? (n / (n - 1)) * G : G, sorted: g, N, T, sum };
  };

  /* ---------- Indexzahlen ---------- */
  Stat.laspeyres = (p0, q0, p1) => Stat.sum(p1.map((p, i) => p * q0[i])) / Stat.sum(p0.map((p, i) => p * q0[i]));
  Stat.paasche = (p0, p1, q1) => Stat.sum(p1.map((p, i) => p * q1[i])) / Stat.sum(p0.map((p, i) => p * q1[i]));

  /* ---------- Zahlen formatieren & einlesen ---------- */
  /** Deutsche Zahl, z.B. 1234.5 → "1.234,5". */
  Stat.fmt = (x, d = 2, fixed = false) => {
    if (x === null || x === undefined || Number.isNaN(x)) return '–';
    if (!Number.isFinite(x)) return x > 0 ? '∞' : '−∞';
    const r = Stat.round(x, d);
    const s = r.toLocaleString('de-DE', {
      minimumFractionDigits: fixed ? d : 0,
      maximumFractionDigits: d,
    });
    return s.replace('-', '−');
  };
  /** Prozentdarstellung: 0.1234 → "12,34 %". */
  Stat.pct = (x, d = 2) => Stat.fmt(x * 100, d) + ' %';

  /**
   * Liest eine Benutzereingabe. Akzeptiert "12,5", "12.5", "1.234,5", "12 %", "1/4".
   * Rückgabe: {value, percent} oder null.
   */
  Stat.parseNum = (raw) => {
    if (raw === null || raw === undefined) return null;
    let s = String(raw).trim().replace(/\s+/g, '').replace(/−/g, '-').replace(/€|km|h/gi, '');
    if (!s) return null;
    let percent = false;
    if (s.endsWith('%')) { percent = true; s = s.slice(0, -1); }
    if (/^-?\d+\/\d+$/.test(s)) {
      const [z, n] = s.split('/').map(Number);
      return n ? { value: z / n, percent } : null;
    }
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
    else if (s.includes(',')) s = s.replace(',', '.');
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
    const v = parseFloat(s);
    return Number.isFinite(v) ? { value: v, percent } : null;
  };

  /** Liest eine Zahlenliste. Trennung: Leerzeichen, Semikolon, Zeilenumbruch oder "1,2,3". */
  Stat.parseList = (raw) => {
    const tokens = String(raw || '')
      .replace(/−/g, '-')
      .split(/[;\s]+/)
      .flatMap((t) => {
        t = t.replace(/,+$/, '');
        if ((t.match(/,/g) || []).length > 1) return t.split(',');
        return [t];
      })
      .filter(Boolean);
    const values = [];
    const invalid = [];
    tokens.forEach((t) => {
      const p = Stat.parseNum(t);
      if (p) values.push(p.value); else invalid.push(t);
    });
    return { values, invalid };
  };

  SL.Stat = Stat;
})();
