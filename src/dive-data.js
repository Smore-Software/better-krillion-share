// Reads the finished daily dive from the page: answers/prompts from the
// game's own localStorage, tiers and percentile from the rendered results DOM
// (the DOM reflects any server-side re-tiering the site applied after play).
(function (root) {
  'use strict';

  const K = root.KrillionShare;
  const STATS_KEY = 'krillion:stats:v1';

  function readStats() {
    try {
      return JSON.parse(localStorage.getItem(STATS_KEY)) || null;
    } catch {
      return null;
    }
  }

  /** The results screen is identified by its "Copy result" button. */
  function findDoneView() {
    const copyBtn = Array.from(document.querySelectorAll('button.btn-descend')).find((b) =>
      /copy result|copied/i.test(b.textContent || '')
    );
    if (!copyBtn) return null;
    const scope = copyBtn.closest('.ds-done-inner') || document.body;
    const m = (scope.textContent || '').match(/dive\s*#\s*(\d+)\s*complete/i);
    if (!m) return null; // archive/unlimited/pack result screens use other wording
    return { copyBtn, scope, dayNumber: Number(m[1]) };
  }

  function readPercentile(scope, score) {
    const svg = scope.querySelector('svg[aria-label^="Score distribution"]');
    if (!svg) return { betterThan: null, chart: null };
    const label = svg.getAttribute('aria-label') || '';
    const pm = label.match(/beats\s+([\d.]+)%/);
    const paths = Array.from(svg.querySelectorAll('path'));
    const area = paths.find((p) => (p.getAttribute('fill') || '').startsWith('url('));
    const line = paths.find((p) => p.getAttribute('fill') === 'none');
    const rect = svg.querySelector('clipPath rect');
    const dot = svg.querySelector('circle');
    let chart = null;
    if (area && line) {
      const youX = Number(rect && rect.getAttribute('width'));
      chart = {
        area: area.getAttribute('d'),
        line: line.getAttribute('d'),
        youX: Number.isFinite(youX) && youX > 0 ? youX : (Math.min(score, K.MAX_DAY_SCORE) / K.MAX_DAY_SCORE) * 320,
        youY: dot ? Number(dot.getAttribute('cy')) : 78,
      };
    }
    return { betterThan: pm ? pm[1] : null, chart };
  }

  /** "The Catch" rows: one button per round with the tier icon. */
  function readCatchRows(scope) {
    const rows = [];
    for (const b of scope.querySelectorAll('button[aria-expanded]')) {
      const num = b.querySelector('span');
      const n = num ? Number((num.textContent || '').trim()) : NaN;
      if (!Number.isInteger(n) || n < 1 || n > 20) continue;
      const img = b.querySelector('img[src*="/tiers/"]');
      const tm = img && (img.getAttribute('src') || '').match(/\/tiers\/([a-z]+)\.png/);
      const ps = b.querySelectorAll('p');
      rows[n - 1] = {
        tier: tm && K.TIERS[tm[1]] ? tm[1] : 'miss',
        prompt: ps[0] ? ps[0].textContent.trim() : '',
        answer: ps[1] ? ps[1].textContent.trim() : null,
      };
    }
    return rows;
  }

  function clean(s) {
    if (s == null) return null;
    const t = String(s).trim();
    return t ? t : null;
  }

  function readDive(view) {
    view = view || findDoneView();
    if (!view) return null;

    const stats = readStats();
    const history = (stats && stats.history) || {};
    const date = Object.keys(history).find((d) => history[d] && history[d].dayNumber === view.dayNumber) || null;
    const entry = date ? history[date] : null;
    const rows = readCatchRows(view.scope);
    const results = (entry && entry.results) || [];
    const count = Math.max(results.length, rows.length);
    if (!count) return null;

    const rounds = [];
    for (let i = 0; i < count; i++) {
      const res = results[i] || {};
      const row = rows[i] || {};
      const tier = row.tier || res.tier || 'miss';
      rounds.push({
        n: i + 1,
        prompt: clean(res.promptText) || clean(row.prompt) || '',
        answer: clean(res.answer) || clean(res.rawAnswer) || clean(row.answer),
        tier: K.TIERS[tier] ? tier : 'miss',
      });
    }
    const score = rounds.reduce((sum, r) => sum + K.tierOf(r.tier).score, 0);
    const pct = readPercentile(view.scope, score);

    return {
      date,
      dayNumber: view.dayNumber,
      score,
      betterThan: pct.betterThan,
      chart: pct.chart,
      rounds,
    };
  }

  root.KrillionData = { findDoneView, readDive };
})(globalThis);
