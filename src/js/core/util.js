/* ROTVEIN — tiny math / random helpers shared by every module */

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const rnd = (a, b) => a + Math.random() * (b - a);
export const rndi = (a, b) => Math.floor(rnd(a, b + 1));
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const lerp = (a, b, t) => a + (b - a) * t;
export const chance = p => Math.random() < p;

/** frame-rate independent smoothing: 0 = never arrives, 1 = instant */
export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.pow(1 - rate, dt * 60));

/** shortest signed angle from a to b */
export function angleDelta(a, b) {
  return ((b - a + Math.PI * 3) % TAU) - Math.PI;
}

/** weighted pick — entries are [item, weight] pairs; weights may be 0 */
export function weighted(entries) {
  let total = 0;
  for (const e of entries) total += e[1];
  if (total <= 0) return entries.length ? entries[0][0] : null;
  let r = Math.random() * total;
  for (const e of entries) { r -= e[1]; if (r <= 0) return e[0]; }
  return entries[entries.length - 1][0];
}

/** shuffle a copy */
export const shuffled = a => a.slice().sort(() => Math.random() - 0.5);

export const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
export const MAX_ENEMIES = IS_TOUCH ? 62 : 118;
export const TILE = 230;                       // world wrap tile for endless scenery

/** format seconds as m:ss */
export function mmss(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
