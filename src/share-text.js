// Pure share-text builder. Loaded as a content script (attaches to globalThis)
// and required directly by the node tests.
(function (root) {
  'use strict';

  // Mirrors the site's TIERS table (module 86062). Colors are the live
  // dark-theme values of the --tier-* CSS variables; the card prefers the
  // page's computed values when it can read them.
  const TIERS = {
    plankton: { name: 'Plankton', score: 10, emoji: '🫧', depth: 0.08, color: '#8fa3c4' },
    tooclever: { name: 'Too Clever', score: 15, emoji: '🤡', depth: 0.18, color: '#ff9f43' },
    schooler: { name: 'Schooler', score: 30, emoji: '🐟', depth: 0.36, color: '#4de3ff' },
    rare: { name: 'Rare', score: 60, emoji: '🦑', depth: 0.6, color: '#ff5252' },
    deepcut: { name: 'Deep Cut', score: 85, emoji: '🏮', depth: 0.82, color: '#9d7bff' },
    krillion: { name: 'One in a Krillion', score: 100, emoji: '🌟', depth: 0.97, color: '#ffd166' },
    miss: { name: 'Miss', score: 0, emoji: '⬛', depth: 0, color: '#3d4f6e' },
  };

  const SCORE_BANDS = [
    { min: 0, tier: 'plankton', verdict: 'Plankton. Plenty of ocean left down there.' },
    { min: 151, tier: 'schooler', verdict: 'Schooler. Swimming with the school.' },
    { min: 251, tier: 'rare', verdict: 'Rare. Below the thermocline. Nice.' },
    { min: 351, tier: 'deepcut', verdict: 'Deep cut. Seriously deep dive.' },
    { min: 450, tier: 'krillion', verdict: 'One in a krillion. Trench dweller. Absurd.' },
  ];

  const MAX_DAY_SCORE = 700;

  // Spoiler syntaxes, keyed by platform. Add more entries here and they show
  // up in the format picker automatically.
  const SPOILER_FORMATS = {
    discord: {
      label: 'Discord',
      // Escape Discord markdown so answers like "*NSYNC" or "A|B" don't break
      // out of the spoiler or pick up formatting.
      wrap: (s) => '||' + String(s).replace(/([\\*_~`|>])/g, '\\$1') + '||',
    },
  };

  const DEFAULT_OPTIONS = Object.freeze({
    includeQuestions: false,
    includeAnswers: true,
    includePercentile: false,
    spoiler: true,
    spoilerFormat: 'discord',
  });

  const NO_ANSWER = '(no answer)';

  function tierOf(id) {
    return TIERS[id] || TIERS.miss;
  }

  function bandFor(score) {
    let band = SCORE_BANDS[0];
    for (const b of SCORE_BANDS) if (score >= b.min) band = b;
    return band;
  }

  /**
   * @param {object} dive  { dayNumber, score, betterThan: string|null,
   *                         rounds: [{ prompt, answer: string|null, tier }] }
   * @param {object} opts  see DEFAULT_OPTIONS
   */
  function buildShareText(dive, opts) {
    const o = Object.assign({}, DEFAULT_OPTIONS, opts);
    const rounds = dive.rounds || [];

    let scoreLine = String(dive.score);
    if (o.includePercentile && dive.betterThan != null) {
      scoreLine += ` · better than ${dive.betterThan}% of today's players`;
    }

    // Header + emoji row match the site's own buildShareText exactly so the
    // result still reads as a normal Krillion share.
    const lines = [
      `Krillion #${dive.dayNumber} 🦐`,
      scoreLine,
      '',
      rounds.map((r) => tierOf(r.tier).emoji).join(''),
    ];

    if (o.includeQuestions || o.includeAnswers) {
      const fmt = o.spoiler ? SPOILER_FORMATS[o.spoilerFormat] || SPOILER_FORMATS.discord : null;
      const wrap = (s) => (fmt ? fmt.wrap(s) : s);
      lines.push('');
      for (const r of rounds) {
        const parts = [];
        if (o.includeQuestions) parts.push(wrap(r.prompt));
        if (o.includeAnswers) parts.push(r.answer ? wrap(r.answer) : NO_ANSWER);
        lines.push(`${tierOf(r.tier).emoji} ${parts.join(' → ')}`);
      }
    }

    return lines.join('\n');
  }

  const api = {
    TIERS,
    SCORE_BANDS,
    MAX_DAY_SCORE,
    SPOILER_FORMATS,
    DEFAULT_OPTIONS,
    tierOf,
    bandFor,
    buildShareText,
  };

  root.KrillionShare = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
