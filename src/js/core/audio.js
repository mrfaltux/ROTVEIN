/* ROTVEIN — a whole sound design in one oscillator.
   Every cue is a short synth blip; nothing is loaded from the network. */

import { rnd } from './util.js';
import { PROFILE, saveProfile } from './state.js';

let AC = null;
export const audio = { get muted() { return PROFILE.muted; } };

function ctx() {
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}

export function sfx(freq, dur, type = 'square', vol = 0.06, slide = 0) {
  if (PROFILE.muted) return;
  const ac = ctx(); if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ac.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ac.currentTime + dur);
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(); o.stop(ac.currentTime + dur + 0.02);
}

/** filtered noise — used for dirt, wings and impacts */
export function noise(dur, vol = 0.05, freq = 900, q = 1) {
  if (PROFILE.muted) return;
  const ac = ctx(); if (!ac) return;
  const n = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ac.createBufferSource(); src.buffer = buf;
  const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = ac.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(ac.destination);
  src.start();
}

/* named cues so gameplay code reads like a script, not a synth patch */
export const SFX = {
  shoot:   () => sfx(660, 0.05, 'triangle', 0.026, -260),
  hit:     () => sfx(rnd(300, 380), 0.04, 'square', 0.02, -120),
  kill:    () => sfx(rnd(180, 260), 0.07, 'square', 0.045, -90),
  hurt:    () => sfx(160, 0.16, 'square', 0.07, -90),
  dash:    () => sfx(320, 0.16, 'sine', 0.05, 240),
  eat:     () => sfx(760, 0.16, 'triangle', 0.06, 320),
  rot:     () => sfx(120, 0.30, 'sawtooth', 0.07, -60),
  orb:     () => sfx(1100 + rnd(-80, 80), 0.04, 'sine', 0.02),
  level:   () => sfx(880, 0.25, 'triangle', 0.07, 420),
  choose:  () => sfx(520, 0.12, 'square', 0.05, 200),
  start:   () => sfx(440, 0.20, 'triangle', 0.06, 300),
  die:     () => sfx(90, 1.10, 'sawtooth', 0.10, -60),
  boss:    () => { sfx(70, 0.9, 'sawtooth', 0.12, -40); noise(0.7, 0.05, 300, 0.6); },
  emerge:  () => noise(0.28, 0.035, 420, 0.8),
  burrow:  () => noise(0.35, 0.045, 260, 0.7),
  charge:  () => sfx(90, 0.55, 'sawtooth', 0.07, 120),
  slam:    () => { sfx(60, 0.35, 'square', 0.10, -20); noise(0.3, 0.06, 200, 0.5); },
  hiss:    () => noise(0.4, 0.03, 3200, 3),
  wing:    () => noise(0.12, 0.012, 1400, 4),
  web:     () => sfx(240, 0.22, 'sawtooth', 0.04, -140),
  pop:     () => sfx(520, 0.10, 'square', 0.05, -300),
  blast:   () => { sfx(140, 0.4, 'sawtooth', 0.09, -100); noise(0.35, 0.07, 500, 0.6); },
  warn:    () => sfx(1200, 0.08, 'square', 0.03, -400),
};

export function toggleMute() {
  PROFILE.muted = !PROFILE.muted;
  saveProfile();
  return PROFILE.muted;
}
