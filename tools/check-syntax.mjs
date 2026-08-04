#!/usr/bin/env node
/* ROTVEIN — parse every module without running it.
   There is no bundler in this project, so this is the closest thing to a
   build step: `node --check` parses each file as ESM (package.json sets
   "type": "module"), and every relative import is resolved on disk. */

import { readdir, readFile, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative } from 'node:path';

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(p));
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) out.push(p);
  }
  return out;
}

const files = [...await walk(join(root, 'src', 'js')), ...await walk(join(root, 'tools'))].sort();
let errors = 0;

console.log(`ROTVEIN modules — checking ${files.length} files\n`);

for (const file of files) {
  const rel = relative(root, file);
  let ok = true;

  try {
    await run(process.execPath, ['--check', file]);
  } catch (e) {
    console.error(`  ✗ ${rel}\n${(e.stderr || e.message).trim().split('\n').slice(0, 4).map(l => '      ' + l).join('\n')}`);
    errors++;
    ok = false;
  }

  const code = await readFile(file, 'utf8');
  const specs = [...code.matchAll(/(?:^|\s)(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  for (const s of specs) {
    if (!s.startsWith('.')) continue;
    try {
      await access(resolve(dirname(file), s));
    } catch {
      console.error(`  ✗ ${rel}: import not found — ${s}`);
      errors++;
      ok = false;
    }
  }

  if (ok) console.log(`  ✓ ${rel}`);
}

console.log(`\n${errors} problem(s).`);
process.exit(errors ? 1 : 0);
