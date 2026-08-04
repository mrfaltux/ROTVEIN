/* ROTVEIN — the DOM screens: title, language picker, bestiary, level-up,
   pause and results. Everything here is rebuilt when the language changes. */

import { G, PROFILE } from '../core/state.js';
import { t, LANGS, setLang, lang, onLang, applyStatic } from '../core/i18n.js';
import { ETYPES } from '../data/enemies.js';
import { IS_TOUCH, mmss } from '../core/util.js';
import { setHint, svg } from './hud.js';
import { SFX } from '../core/audio.js';

const $ = id => document.getElementById(id);
const screens = {
  start: $('start'), levelup: $('levelup'), bestiary: $('bestiary'),
  pause: $('pause'), gameover: $('gameover'),
};

export function show(name) {
  for (const k in screens) screens[k].classList.toggle('show', k === name);
}
export function hideAll() {
  for (const k in screens) screens[k].classList.remove('show');
}
export const isShowing = name => screens[name].classList.contains('show');

/* ---------------- static text ---------------- */
function buildControls() {
  const c = 'controls.';
  const rows = IS_TOUCH
    ? [['tHold', 'tHoldD'], ['tTap', 'tTapD'], ['tSecond', 'tSecondD'], ['tAuto', 'tAutoD'],
       ['kGood', 'good'], ['kBad', 'bad']]
    : [['kMove', 'move'], ['kCast', 'cast'], ['kSwitch', 'switch'], ['kDash', 'dash'],
       ['kAim', 'aim'], ['kPause', 'pause'], ['kGood', 'good'], ['kBad', 'bad']];
  $('ctrls').innerHTML = rows.map(([k, v]) => `<b>${t(c + k)}</b><span>${t(c + v)}</span>`).join('');
  setHint(t(IS_TOUCH ? 'controls.hintTouch' : 'controls.hintDesk'));
}

function buildLangs() {
  const box = $('langs');
  box.innerHTML = '';
  for (const l of LANGS) {
    const b = document.createElement('button');
    b.className = 'lang' + (l.id === lang() ? ' on' : '');
    b.textContent = l.label;
    b.onclick = async () => { await setLang(l.id); SFX.choose(); };
    box.appendChild(b);
  }
}

function buildBest() {
  const list = $('bestlist');
  list.innerHTML = '';
  for (const key in ETYPES) {
    const d = ETYPES[key];
    const card = document.createElement('div');
    card.className = 'beast' + (d.boss ? ' boss' : '');
    const glyph = `<g stroke="#${d.acc.toString(16).padStart(6, '0')}" stroke-width="1.4" fill="none" stroke-linecap="round">${d.glyph}</g>`;
    card.innerHTML =
      `${svg(glyph, '')}` +
      `<div><h4>${t(`enemies.${key}.name`)}</h4>` +
      `<div class="tac">${t(`tactics.${d.tactic}`)}</div>` +
      `<p>${t(`enemies.${key}.desc`)}</p>` +
      `<div class="num"><span>${t('bestiary.hp')} ${d.hp}</span>` +
      `<span>${t('bestiary.spd')} ${d.spd.toFixed(1)}</span>` +
      `<span>${t('bestiary.dmg')} ${d.dmg}</span>` +
      `<span>${t('bestiary.from', { time: mmss(d.unlock) })}</span></div></div>`;
    list.appendChild(card);
  }
}

function buildBestScore() {
  const el = $('startsub');
  const base = t('start.sub');
  el.textContent = PROFILE.bestTime > 5
    ? `${base} · ${t('start.best', { time: mmss(PROFILE.bestTime), level: PROFILE.bestLevel, kills: PROFILE.bestKills })}`
    : base;
}

export function refreshText() {
  applyStatic();
  buildControls();
  buildLangs();
  buildBest();
  buildBestScore();
}

/* ---------------- wiring ---------------- */
export function initScreens(handlers) {
  $('play').onclick = () => { SFX.start(); handlers.onPlay(); };
  $('again').onclick = () => handlers.onPlay();
  $('resume').onclick = () => handlers.onResume();
  $('quit').onclick = () => handlers.onQuit();
  $('openbest').onclick = () => { show('bestiary'); screens.bestiary.dataset.from = 'start'; };
  $('pausebest').onclick = () => { show('bestiary'); screens.bestiary.dataset.from = 'pause'; };
  $('bestclose').onclick = () => show(screens.bestiary.dataset.from === 'pause' ? 'pause' : 'start');
  onLang(refreshText);
  refreshText();
}

/* ---------------- level up ---------------- */
let cur = [], chooser = null;

export function showLevelUp(cards, onChoose) {
  cur = cards;
  chooser = onChoose;
  const box = $('cards');
  box.innerHTML = '';
  cards.forEach((c, i) => {
    const d = document.createElement('div');
    d.className = 'card ' + (c.cls || '');
    d.innerHTML =
      `<span class="n">${i + 1}</span><div class="kind">${c.kind}</div>` +
      `${svg(c.ic, 'ic')}<h3>${c.name}</h3><p>${c.desc}</p>`;
    d.onclick = () => chooseCard(i);
    box.appendChild(d);
  });
  show('levelup');
}

export function chooseCard(i) {
  if (!isShowing('levelup') || !cur[i]) return;
  const card = cur[i];
  cur = [];
  hideAll();
  card.run();
  SFX.choose();
  if (chooser) chooser();
}

/* ---------------- results ---------------- */
export function showGameOver() {
  $('stats').innerHTML =
    `<div><i>${mmss(G.time)}</i><span>${t('ui.survived')}</span></div>` +
    `<div><i>${G.level}</i><span>${t('ui.level')}</span></div>` +
    `<div><i>${G.kills}</i><span>${t('ui.kills')}</span></div>`;
  $('killedby').textContent = G.killedBy
    ? t('gameover.by', { name: t(`enemies.${G.killedBy}.name`) })
    : t('gameover.byNothing');
  buildBestScore();
  show('gameover');
}
