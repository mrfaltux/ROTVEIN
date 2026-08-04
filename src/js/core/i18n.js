/* ROTVEIN — localisation.
   English lives in code and is always complete; other locales are JSON files
   fetched on demand and merged over the top. Any key a translator skipped
   simply falls through to English, so a half-finished locale still runs. */

import { EN } from '../data/strings.en.js';
import { PROFILE, saveProfile } from './state.js';

export const LANGS = [
  { id: 'en', label: 'ENGLISH' },
  { id: 'nl', label: 'NEDERLANDS' },
  { id: 'de', label: 'DEUTSCH' },
  { id: 'fr', label: 'FRANÇAIS' },
  { id: 'es', label: 'ESPAÑOL' },
  { id: 'pt', label: 'PORTUGUÊS' },
  { id: 'ja', label: '日本語' },
];

const loaded = { en: EN };
let cur = 'en';
const subs = [];

export const lang = () => cur;
export const onLang = fn => { subs.push(fn); return fn; };

/** dotted lookup with {placeholder} interpolation and English fallback */
export function t(path, vars) {
  let v = dig(loaded[cur], path);
  if (v === undefined) v = dig(EN, path);
  if (v === undefined) return path;
  if (vars) for (const k in vars) v = v.split('{' + k + '}').join(vars[k]);
  return v;
}

function dig(obj, path) {
  let o = obj;
  for (const part of path.split('.')) {
    if (o == null) return undefined;
    o = o[part];
  }
  return o;
}

export async function setLang(id) {
  if (!LANGS.some(l => l.id === id)) id = 'en';
  if (!loaded[id]) {
    try {
      const url = new URL(`../../locales/${id}.json`, import.meta.url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      loaded[id] = await res.json();
    } catch (e) {
      console.warn('[i18n] could not load', id, e);
      loaded[id] = {};                       // fall through to English
    }
  }
  cur = id;
  PROFILE.lang = id;
  saveProfile();
  applyStatic();
  for (const fn of subs) fn(id);
}

/** rewrite every element carrying data-i18n="some.key" */
export function applyStatic() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.documentElement.lang = cur;
}

/** best guess on first ever visit */
export function detectLang() {
  if (PROFILE.lang) return PROFILE.lang;
  const want = (navigator.languages || [navigator.language || 'en']).map(s => s.slice(0, 2).toLowerCase());
  for (const w of want) if (LANGS.some(l => l.id === w)) return w;
  return 'en';
}
