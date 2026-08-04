#!/usr/bin/env node
/* ROTVEIN — locale linter.
   English (src/js/data/strings.en.js) is the contract. Every JSON locale is
   checked against it: missing keys are warnings (they fall back at runtime),
   unknown keys and broken {placeholders} are errors. */

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { EN } from '../src/js/data/strings.en.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const localeDir = join(root, 'src', 'locales');

/** flatten to { "a.b.c": "value" } */
function flat(obj, prefix = '', out = {}) {
  for (const k in obj) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, key, out);
    else out[key] = v;
  }
  return out;
}

const vars = s => (String(s).match(/\{[a-z]+\}/gi) || []).sort().join(',');

const base = flat(EN);
const baseKeys = Object.keys(base);

let errors = 0, warnings = 0;
const files = (await readdir(localeDir)).filter(f => f.endsWith('.json')).sort();

console.log(`ROTVEIN locales — base: ${baseKeys.length} keys (en)\n`);

for (const file of files) {
  const id = file.replace(/\.json$/, '');
  let data;
  try {
    data = JSON.parse(await readFile(join(localeDir, file), 'utf8'));
  } catch (e) {
    console.error(`  ✗ ${id}: invalid JSON — ${e.message}`);
    errors++;
    continue;
  }

  const cur = flat(data);
  const keys = Object.keys(cur);
  const missing = baseKeys.filter(k => !(k in cur));
  const unknown = keys.filter(k => !(k in base));
  const badVars = keys.filter(k => k in base && vars(cur[k]) !== vars(base[k]));
  const empty = keys.filter(k => typeof cur[k] === 'string' && !cur[k].trim());

  const pct = Math.round(((baseKeys.length - missing.length) / baseKeys.length) * 100);
  const ok = !unknown.length && !badVars.length && !empty.length;
  console.log(`  ${ok ? '✓' : '✗'} ${id.padEnd(4)} ${String(pct).padStart(3)}% translated  (${keys.length} keys)`);

  for (const k of unknown) { console.error(`      unknown key: ${k}`); errors++; }
  for (const k of badVars) {
    console.error(`      placeholder mismatch in ${k}: expected ${vars(base[k]) || '(none)'}, got ${vars(cur[k]) || '(none)'}`);
    errors++;
  }
  for (const k of empty) { console.error(`      empty string: ${k}`); errors++; }
  if (missing.length) {
    warnings += missing.length;
    console.warn(`      ${missing.length} missing key(s), falling back to English:`);
    for (const k of missing.slice(0, 8)) console.warn(`        · ${k}`);
    if (missing.length > 8) console.warn(`        · … and ${missing.length - 8} more`);
  }
}

console.log(`\n${errors} error(s), ${warnings} missing key(s).`);
process.exit(errors ? 1 : 0);
