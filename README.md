# ROTVEIN — Jungle Swarm Survivor

A 3D third-person open-world jungle survival game. You auto-attack, you dodge by moving, you eat
the right things and grow. Sixteen creatures hunt you, and no two of them hunt the same way.

**Play:** [add your GitHub Pages link here after deploying]

```bash
python3 tools/serve.py     # then open http://localhost:8000
```

ES modules cannot be loaded over `file://`, so open the game through the dev server (or any static
server) rather than double-clicking `index.html`.

## What's in it

- **Endless jungle.** The world wraps around you, so you can run in any direction forever — trees,
  ferns, bushes, rocks, glowing fungus and old bones recycle seamlessly ahead of you.
- **Sixteen creatures, sixteen tactics.** Nothing simply walks at you. See the table below.
- **Everything rises out of the soil.** Creatures break the ground squashed and flat, then grow up
  into full size over about a second — short first, big after.
- **Everything is slower than you.** No creature can win a foot race. They close the distance with
  dives, charges, leaps, lunges, pounces and ambushes, and every one of those is telegraphed on the
  floor before it lands.
- **Seven powers**, each cast manually and upgradable: Thorn Volley, Spore Nova, Storm Call,
  Ember Wave, Strangle Vine, Ring of Thorns, Root Quake.
- **Level-up mutations.** Pick 1 of 3 cards every level — damage, split shot, pierce, crit, regen,
  magnet, lifesteal, armour, spines, cooldowns and more.
- **Ground that turns against you.** Acid pools, spore clouds and silk mats outlive the creature
  that made them.
- **Two bosses** on rotation, the Apex Organism and the Broodmother, each with phases that change
  how the fight works as it dies.
- **Seven languages**, switchable on the title screen and mid-run: English, Nederlands, Deutsch,
  Français, Español, Português, 日本語.

## The bestiary

| Creature | Tactic | What it actually does |
|---|---|---|
| Roach Crawler | swarm | Walks straight at you. Dangerous only in numbers. |
| Blood Tick | parasite | Pounces the last stretch, rides you and drains until you dash it off. |
| Hornet | dive bomb | Orbits out of reach, then commits to one straight dive. |
| Ember Fly | suicide blast | Glows brighter as it closes, then detonates — and on death too. |
| Acid Spitter | artillery | Never closes; lobs arcing acid that leaves a burning pool. |
| Silk Spider | trapper | Webs you to a crawl, lays silk mats, keeps its distance. |
| Spore Moth | area denial | Drifts overhead trailing poison clouds across your escape routes. |
| Blade Mantis | duellist | Circle-strafes at knife range, rears up, lunges with both blades. |
| Toxin Toad | leaper | Long readable arcs; splashes toxin over the landing zone. |
| Rot Centipede | serpentine rush | Weaves as it charges so your shots lead into empty jungle. |
| Rhino Beetle | charger | Plants its feet, charges a locked lane, then staggers if it misses. |
| Bark Scorpion | ambusher | Burrows (untouchable), tracks you, erupts under your feet. |
| Vine Serpent | lunger | Coils at range, crosses the whole gap in one strike, recoils. |
| Larva Sac | breeder | Barely moves, keeps birthing crawlers, bursts into more on death. |
| Apex Organism | boss | Charges, summons, then floods the clearing with spore fire. |
| Broodmother | boss | Never fights directly — webs the ground and births the fight. |

## Controls

| | Desktop | Mobile |
|---|---|---|
| Move | WASD / Arrows | Hold anywhere — invisible joystick |
| Aim | Mouse | Auto-aims at nearest enemy |
| Cast | Space or left click | Tap the power on screen |
| Switch power | 1 – 7 | Tap the power on screen |
| Dodge dash | Shift or right click | Second finger anywhere |
| Pause | P or Esc | Pause button, top right |
| Restart | R | Tap Grow Again |

## Deploy as a page

The repository *is* the site: no build step, no bundler, no npm dependencies. `index.html` loads
plain ES modules from `src/`, and Three.js comes from a CDN.

**Automatic (recommended).** `.github/workflows/pages.yml` verifies the locales and parses every
module, then publishes on every push to `main`. Enable it once under
**Settings → Pages → Source: GitHub Actions**.

**Manual.** **Settings → Pages → Deploy from a branch → `main` / `root`.** `.nojekyll` is already
in the repo so `src/` is served untouched.

Either way the game lands at `https://YOUR-NAME.github.io/rotvein/`.

## Layout

```
index.html              markup + HUD shell only
src/css/                base · hud · screens
src/js/
  core/                 state, input, audio, i18n, pooling, maths
  world/                renderer, ground, endless scenery
  entities/             player, enemies, tactics, projectiles, hazards, pickups, orbs
  systems/              combat, abilities, upgrades, director, hud, screens
  fx/                   particles, telegraphs
  data/                 enemy table, English strings
src/locales/            nl · de · fr · es · pt · ja
tools/                  dev server (Python) + checks (Node)
```

`docs/ARCHITECTURE.md` walks through how a frame is actually executed.

## Tuning it

| What | Where |
|---|---|
| Creature stats, speed, size, unlock time, spawn weight | `src/js/data/enemies.js` |
| How a creature behaves | `src/js/entities/tactics.js` |
| What a creature looks like | `src/js/entities/enemyMeshes.js` |
| Your starting stats | `src/js/core/state.js` |
| Powers | `src/js/systems/abilities.js` |
| Level-up card pool | `src/js/systems/upgrades.js` |
| Spawn curve, set-piece waves, boss timing | `src/js/systems/director.js` |
| Ground hazards | `src/js/entities/hazards.js` |
| Text, in any language | `src/js/data/strings.en.js` and `src/locales/*.json` |

Enemy cap is `MAX_ENEMIES` in `src/js/core/util.js` (62 on touch devices, 118 on desktop).

## Checks

```bash
npm run check          # both of the below
npm run check:syntax   # parses every module, resolves every relative import
npm run check:locales  # every locale against the English base
```

Adding a language: drop `src/locales/xx.json` in, add `{ id: 'xx', label: '…' }` to `LANGS` in
`src/js/core/i18n.js`, and run `npm run check:locales`. Partial translations are fine — anything
missing falls back to English.
