#!/usr/bin/env node
// Renders the extension icon (16x16 pixel art) to icons/icon-{16,32,48,128}.png.
// Run: npm run icons
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { encodePNG } = require('./lib');

// A share bubble holding one square per tier color, in Krillion's palette.
// '.' is transparent.
const ART = [
  '.cccccccccccccc.',
  'cnnnnnnnnnnnnnnc',
  'cnnnnnnnnnnnnnnc',
  'cnnnnnnnnnnnnnnc',
  'cnnyynnppnnrrnnc',
  'cnnyynnppnnrrnnc',
  'cnnnnnnnnnnnnnnc',
  'cnnoonnssnnllnnc',
  'cnnoonnssnnllnnc',
  'cnnnnnnnnnnnnnnc',
  'cnnnnnnnnnnnnnnc',
  'cnnnnnnnnnnnnnnc',
  '.ccnncccccccccc.',
  '..cnc...........',
  '..cc............',
  '................',
];

const PALETTE = {
  c: '#4de3ff', // lumen cyan (border)
  n: '#101d33', // shallow (fill)
  y: '#ffd166', // one in a krillion
  p: '#9d7bff', // deep cut
  r: '#ff5252', // rare
  o: '#ff9f43', // too clever
  s: '#4de3ff', // schooler
  l: '#8fa3c4', // plankton
};

if (ART.length !== 16 || ART.some((row) => row.length !== 16)) throw new Error('ART must be 16x16');

function rgba(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

/** Nearest-neighbour scale of ART into a size x size canvas, centred. */
function render(size, scale) {
  const art = ART.length * scale;
  const pad = Math.floor((size - art) / 2);
  const px = new Uint8Array(size * size * 4);
  for (let y = 0; y < ART.length; y++) {
    for (let x = 0; x < ART[y].length; x++) {
      const key = ART[y][x];
      if (key === '.') continue;
      const color = rgba(PALETTE[key]);
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = ((pad + y * scale + dy) * size + pad + x * scale + dx) * 4;
          px.set(color, i);
        }
      }
    }
  }
  return encodePNG(size, size, px);
}

// The Web Store wants the 128px icon's artwork at 96x96 with 16px of
// transparent padding; the smaller sizes are drawn full-bleed.
const SIZES = [
  { size: 16, scale: 1 },
  { size: 32, scale: 2 },
  { size: 48, scale: 3 },
  { size: 128, scale: 6 },
];

const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });
for (const { size, scale } of SIZES) {
  const file = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(file, render(size, scale));
  console.log(`wrote ${path.relative(process.cwd(), file)}`);
}
