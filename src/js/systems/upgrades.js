/* ROTVEIN — the level-up card pool and the roll that builds a hand of three. */

import { G } from '../core/state.js';
import { t } from '../core/i18n.js';
import { ABIL, ABIL_KEYS, abilityName, abilityDesc, grantAbility, lockedAbilities } from './abilities.js';
import { shuffled, pick, chance } from '../core/util.js';

/** each entry: id (locale key), an SVG path, and the mutation itself */
export const UPGRADES = [
  { id: 'dmg',     ic: 'M4 20 L20 4 M14 4h6v6',                          apply() { G.dmg *= 1.22; } },
  { id: 'spd',     ic: 'M12 2v20 M5 9l7-7 7 7',                          apply() { G.atkSpd *= 1.18; } },
  { id: 'legs',    ic: 'M4 20h16 M8 20V8 M16 20V12',                     apply() { G.speed *= 1.1; } },
  { id: 'hp',      ic: 'M12 3l8 4v6c0 5-4 7-8 8-4-1-8-3-8-8V7z',         apply() { G.maxHp += 28; G.hp += 28; } },
  { id: 'split',   ic: 'M12 20V10 M12 10L5 4 M12 10l7-6',                apply() { G.shots++; } },
  { id: 'pier',    ic: 'M3 12h18 M15 6l6 6-6 6',                         apply() { G.pierce++; } },
  { id: 'rng',     ic: 'M12 5c6 0 10 7 10 7s-4 7-10 7S2 12 2 12s4-7 10-7z', apply() { G.range *= 1.28; } },
  { id: 'mag',     ic: 'M6 4v8a6 6 0 0012 0V4 M6 4h4 M14 4h4',           apply() { G.magnet *= 1.7; } },
  { id: 'reg',     ic: 'M12 22V8 M12 8c0-4 4-6 7-6 0 4-3 6-7 6z',        apply() { G.regen += 1.4; } },
  { id: 'crit',    ic: 'M12 4l3 5 5 3-5 3-3 5-3-5-5-3 5-3z',             apply() { G.crit += 0.09; } },
  { id: 'critdmg', ic: 'M12 3v6 M12 15v6 M4 12h6 M14 12h6',              apply() { G.critMul += 0.45; } },
  { id: 'cd',      ic: 'M12 2v20 M4 7l16 10 M20 7L4 17',                 apply() { G.cdMul *= 0.84; } },
  { id: 'dash',    ic: 'M4 12h12 M11 7l5 5-5 5 M18 6v12',                apply() { G.dashCd *= 0.72; } },
  { id: 'velo',    ic: 'M3 12h14 M13 7l5 5-5 5 M20 5v14',                apply() { G.projSpd *= 1.3; } },
  { id: 'leech',   ic: 'M12 21s-7-5-7-10a7 7 0 0114 0c0 5-7 10-7 10z',   apply() { G.lifesteal += 0.04; } },
  { id: 'armor',   ic: 'M12 2l8 4v7c0 5-4 8-8 9-4-1-8-4-8-9V6z M9 12l2 2 4-4', apply() { G.dr = Math.min(0.7, G.dr + 0.14); } },
  { id: 'thorns',  ic: 'M12 3v18 M12 8l5-3 M12 14l-5-3 M12 11l5 3',      apply() { G.thorns += 9; } },
  { id: 'greed',   ic: 'M12 3v18 M8 7h6a3 3 0 010 6H9a3 3 0 000 6h7',    apply() { G.xpMul *= 1.25; } },
];

export const upgradeName = id => t(`upgrades.${id}.name`);
export const upgradeDesc = id => t(`upgrades.${id}.desc`);

/** build a hand of three: a new power, a rank-up, then stat adaptations */
export function rollCards() {
  const out = [];

  const locked = lockedAbilities();
  if (locked.length && (G.owned.length < 2 || chance(0.4))) {
    const id = pick(locked);
    out.push({
      kind: t('cardKind.power'), cls: 'new',
      name: abilityName(id), desc: abilityDesc(id), ic: ABIL[id].icon,
      run: () => grantAbility(id),
    });
  }

  for (const id of shuffled(G.owned)) {
    if (out.length >= 2) break;
    if (chance(0.42)) {
      const lv = (G.lvls[id] || 1) + 1;
      out.push({
        kind: t('cardKind.rank', { n: lv }), cls: 'rank',
        name: abilityName(id), desc: t('abilities.rankUp'), ic: ABIL[id].icon,
        run: () => { G.lvls[id] = lv; },
      });
    }
  }

  for (const u of shuffled(UPGRADES)) {
    if (out.length >= 3) break;
    const name = upgradeName(u.id);
    if (out.some(o => o.name === name)) continue;
    out.push({
      kind: t('cardKind.stat'), cls: '',
      name, desc: upgradeDesc(u.id),
      ic: `<path d="${u.ic}" stroke="#ffb020" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      run: u.apply,
    });
  }

  return out.slice(0, 3);
}

export { ABIL_KEYS };
