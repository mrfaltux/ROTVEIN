/* ROTVEIN — everything drawn in DOM rather than WebGL. */

import { G } from '../core/state.js';
import { t } from '../core/i18n.js';
import { clamp, mmss } from '../core/util.js';
import { ABIL, abCd, abilityName } from './abilities.js';

const $ = id => document.getElementById(id);
const el = {
  hpf: $('hpf'), hpt: $('hpt'), xpf: $('xpf'), lvl: $('lvl'), clock: $('clock'), kills: $('kills'),
  dock: $('dock'), hurt: $('hurt'), combo: $('combo'), warn: $('warn'), threat: $('threat'),
  bossw: $('bossw'), bossf: $('bossf'), bossn: $('bossn'), hint: $('hint'), status: $('status'),
};

export function svg(inner, cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none">${inner}</svg>`;
}

/* ---------------- transient messages ---------------- */
let flashT = 0, threatT = 0;
export function flash(msg) {
  el.warn.textContent = msg;
  el.warn.style.opacity = 1;
  clearTimeout(flashT);
  flashT = setTimeout(() => { el.warn.style.opacity = 0; }, 1500);
}
export function threat(msg) {
  el.threat.textContent = msg;
  el.threat.style.opacity = 1;
  clearTimeout(threatT);
  threatT = setTimeout(() => { el.threat.style.opacity = 0; }, 900);
}
export function hurtFlash(strength) {
  el.hurt.style.opacity = strength;
  setTimeout(() => { el.hurt.style.opacity = 0; }, 120);
}
export function bossBar(show, name) {
  el.bossw.style.opacity = show ? 1 : 0;
  if (name) el.bossn.textContent = name;
}
export function setHint(text) { el.hint.textContent = text; }

/* ---------------- ability dock ---------------- */
let selectHandler = () => {};
export function buildDock(onSelect) {
  if (onSelect) selectHandler = onSelect;
  el.dock.innerHTML = '';
  const n = Math.max(4, G.owned.length);
  for (let i = 0; i < n; i++) {
    const id = G.owned[i];
    const d = document.createElement('div');
    d.className = 'slot' + (id ? '' : ' empty') + (i === G.sel && id ? ' on' : '');
    if (id) {
      const a = ABIL[id];
      const rank = G.lvls[id] > 1 ? 'R' + G.lvls[id] : '';
      d.innerHTML =
        `<div class="cd" data-cd="${id}"></div>${svg(a.icon, 'glyph')}` +
        `<span class="k">${i + 1}</span><span class="lv">${rank}</span>` +
        `<span class="nm">${abilityName(id).split(' ')[0]}</span>`;
      d.onclick = () => selectHandler(i);
    } else {
      d.innerHTML = `<span class="k">${i + 1}</span><span class="nm">${t('ui.locked')}</span>`;
    }
    el.dock.appendChild(d);
  }
}

/* ---------------- per-frame ---------------- */
const GOOD_BUFFS = { power: 1, swift: 1, rage: 1, bark: 1 };

export function updateHUD() {
  el.hpf.style.transform = `scaleX(${clamp(G.hp / G.maxHp, 0, 1)})`;
  el.hpt.textContent = `${Math.ceil(G.hp)} / ${Math.round(G.maxHp)}`;
  el.xpf.style.transform = `scaleX(${clamp(G.xp / G.xpNext, 0, 1)})`;
  el.lvl.textContent = G.level;
  el.kills.textContent = G.kills;
  el.clock.textContent = mmss(G.time);

  document.querySelectorAll('.cd').forEach(c => {
    const id = c.dataset.cd;
    const k = clamp((G.cds[id] || 0) / abCd(id), 0, 1);
    c.style.transform = `scaleY(${k})`;
    c.parentElement.classList.toggle('ready', k <= 0);
  });

  if (G.boss) el.bossf.style.transform = `scaleX(${clamp(G.boss.hp / G.boss.max, 0, 1)})`;

  if (G.combo > 4) {
    el.combo.textContent = t('ui.combo', { n: G.combo });
    el.combo.style.opacity = clamp(G.comboT / 2.2, 0, 1);
  } else {
    el.combo.style.opacity = 0;
  }

  /* status pills — rebuilt only when the set of active effects changes */
  const ids = Object.keys(G.buffs);
  const key = ids.join(',');
  if (key !== updateHUD.key) {
    updateHUD.key = key;
    el.status.innerHTML = ids.map(id =>
      `<span class="pill ${GOOD_BUFFS[id] ? 'good' : 'bad'}" data-b="${id}">${t('status.' + id)}<b></b></span>`
    ).join('');
  }
  el.status.querySelectorAll('.pill').forEach(p => {
    const v = G.buffs[p.dataset.b];
    p.lastElementChild.textContent = v ? v.toFixed(1) : '';
  });
}
