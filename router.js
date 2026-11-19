/**
 * router.js
 * ---------------------------------------------------------------
 * Ein sehr kleiner Hash-Router. Er funktioniert mit file:// und auf
 * GitHub Pages, weil nur der Teil nach dem "#" ausgewertet wird.
 *
 * Beispiel:
 *   SL.Router.add('kapitel/:id', (p) => zeigeKapitel(p.id));
 *   SL.Router.add('', zeigeUebersicht);
 *   SL.Router.start();
 */
(function () {
  'use strict';
  const SL = (window.SL = window.SL || {});

  const routes = [];
  let fallback = null;

  /** Registriert eine Route. Platzhalter beginnen mit ":". */
  function add(pattern, handler) {
    const parts = pattern.split('/').filter(Boolean);
    routes.push({ parts, handler });
    return api;
  }

  function otherwise(handler) {
    fallback = handler;
    return api;
  }

  function current() {
    return decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  }

  function resolve() {
    const segments = current().split('/').filter(Boolean);
    for (const r of routes) {
      if (r.parts.length !== segments.length) continue;
      const params = {};
      let ok = true;
      for (let i = 0; i < r.parts.length; i++) {
        const p = r.parts[i];
        if (p.startsWith(':')) params[p.slice(1)] = segments[i];
        else if (p !== segments[i]) { ok = false; break; }
      }
      if (ok) {
        r.handler(params);
        return;
      }
    }
    if (fallback) fallback();
  }

  function go(path) {
    const target = '#' + path.replace(/^#/, '');
    if (location.hash === target) resolve();
    else location.hash = target;
  }

  function start() {
    window.addEventListener('hashchange', () => {
      resolve();
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    });
    resolve();
  }

  const api = { add, otherwise, go, start, current };
  SL.Router = api;
})();
