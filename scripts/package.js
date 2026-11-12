#!/usr/bin/env node
// Builds the Chrome Web Store upload: dist/better-krillion-share-<version>.zip
// containing only manifest.json, src/ and icons/ (manifest at the zip root).
// Run: npm run package
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createZip } = require('./lib');

const ROOT = path.join(__dirname, '..');
const INCLUDE_DIRS = ['src', 'icons'];

function fail(msg) {
  console.error(`package: ${msg}`);
  process.exit(1);
}

function walk(dir) {
  return fs
    .readdirSync(path.join(ROOT, dir), { withFileTypes: true })
    .filter((e) => !e.name.startsWith('.'))
    .flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
}

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

// Catch the mistakes the Web Store would reject the upload for.
if (!/^\d+(\.\d+){0,3}$/.test(manifest.version)) fail(`invalid version "${manifest.version}"`);
if ((manifest.description || '').length > 132) fail('description is over 132 characters');
if (!manifest.icons || !manifest.icons['128']) fail('manifest needs a 128px icon');

const files = ['manifest.json', ...INCLUDE_DIRS.flatMap(walk)].sort();
const referenced = [
  ...Object.values(manifest.icons),
  ...(manifest.content_scripts || []).flatMap((cs) => [...(cs.js || []), ...(cs.css || [])]),
];
for (const ref of referenced) if (!files.includes(ref)) fail(`manifest references missing file ${ref}`);

const zip = createZip(files.map((name) => ({ name, data: fs.readFileSync(path.join(ROOT, name)) })));
const outDir = path.join(ROOT, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `better-krillion-share-${manifest.version}.zip`);
fs.writeFileSync(out, zip);

console.log(`${path.relative(process.cwd(), out)} (${(zip.length / 1024).toFixed(1)} KB)`);
for (const f of files) console.log(`  ${f}`);
