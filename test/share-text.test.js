const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../src/share-text.js');

const dive = {
  dayNumber: 119,
  score: 445,
  betterThan: '95',
  rounds: [
    { prompt: 'Name a country where at least 50% of people speak English', answer: 'Saint Kitts and Nevis', tier: 'deepcut' },
    { prompt: 'Name a bodily function', answer: 'Peristalsis', tier: 'rare' },
    { prompt: 'Name a one-word animal that starts with T', answer: null, tier: 'miss' },
  ],
};

test('all options off reproduces the site share text exactly', () => {
  const t = K.buildShareText(dive, { includeQuestions: false, includeAnswers: false, includePercentile: false });
  assert.equal(t, 'Krillion #119 🦐\n445\n\n🏮🦑⬛');
});

test('defaults: answers with Discord spoilers', () => {
  assert.equal(
    K.buildShareText(dive, {}),
    'Krillion #119 🦐\n445\n\n🏮🦑⬛\n\n🏮 ||Saint Kitts and Nevis||\n🦑 ||Peristalsis||\n⬛ (no answer)'
  );
});

test('questions + answers without spoilers', () => {
  const t = K.buildShareText(dive, { includeQuestions: true, spoiler: false });
  assert.match(t, /\n🏮 Name a country where at least 50% of people speak English → Saint Kitts and Nevis\n/);
  assert.match(t, /\n⬛ Name a one-word animal that starts with T → \(no answer\)$/);
});

test('questions + answers spoilered separately', () => {
  const t = K.buildShareText(dive, { includeQuestions: true });
  assert.match(t, /🦑 \|\|Name a bodily function\|\| → \|\|Peristalsis\|\|/);
});

test('percentile appended to score line only when available', () => {
  assert.match(K.buildShareText(dive, { includePercentile: true }), /^Krillion #119 🦐\n445 · better than 95% of today's players\n/);
  const noPct = K.buildShareText({ ...dive, betterThan: null }, { includePercentile: true });
  assert.match(noPct, /^Krillion #119 🦐\n445\n/);
});

test('discord spoiler escapes markdown/pipe characters', () => {
  const d = { ...dive, rounds: [{ prompt: 'p', answer: '*NSYNC | A_B', tier: 'rare' }] };
  assert.match(K.buildShareText(d, {}), /🦑 \|\|\\\*NSYNC \\\| A\\_B\|\|$/);
});

test('bandFor matches the site bands', () => {
  assert.equal(K.bandFor(0).tier, 'plankton');
  assert.equal(K.bandFor(150).tier, 'plankton');
  assert.equal(K.bandFor(151).tier, 'schooler');
  assert.equal(K.bandFor(445).tier, 'deepcut');
  assert.equal(K.bandFor(450).tier, 'krillion');
});
