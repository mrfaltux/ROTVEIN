# ROTVEIN — Jungle Swarm Survivor

A 3D third-person open-world jungle survival game. You auto-attack, you dodge by moving, you eat the right things and grow. Runs in any browser from a single file.

**Play:** [add your GitHub Pages link here after deploying]

## What's in it

- **Endless jungle.** The world wraps around you, so you can run in any direction forever — trees, ferns, bushes and rocks recycle seamlessly ahead of you.
- **Auto-attack.** Your character fires at the nearest bug on its own. Your job is positioning.
- **Movement is the dodge.** Plus a dash with i-frames on Shift / right-click / second finger.
- **Eat and grow.** Gold and glowing pickups buff you. Purple spiked fungus damages, poisons or weakens you. Spore Crystals grant new powers.
- **Five powers**, each cast manually and upgradable: Thorn Volley, Spore Nova, Storm Call, Ember Wave, Strangle Vine.
- **Level-up mutations.** Pick 1 of 3 cards every level — damage, split shot, pierce, crit, regen, magnet, cooldowns and more.
- **Escalation.** Crawlers → wasps → spitters → brutes → an Apex boss at 2:55, then every ~3 minutes. Everything scales with time survived.

## Controls

| | Desktop | Mobile |
|---|---|---|
| Move | WASD / Arrows | Hold anywhere — invisible joystick |
| Aim | Mouse | Auto-aims at nearest enemy |
| Cast | Space or left click | Tap the power on screen |
| Switch power | 1 – 5 | Tap the power on screen |
| Dodge dash | Shift or right click | Second finger anywhere |
| Restart | R | Tap Grow Again |

## Deploy to GitHub Pages

```bash
git init
git add index.html README.md .nojekyll
git commit -m "ROTVEIN"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/rotvein.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `root` → Save.**
Your game goes live at `https://YOUR-NAME.github.io/rotvein/` in about a minute.

No build step, no npm, no bundler. `index.html` is the whole game; Three.js loads from a CDN.

## Tuning it

All balance numbers live in a few obvious places near the top of the `<script>`:

- `ETYPES` — enemy health, speed, damage, size, XP per kill.
- `G` (the game state object) — your starting damage, attack speed, range, move speed, magnet radius.
- `ABIL` — each power's cooldown, damage formula and scaling per rank.
- `UPGRADES` — the level-up card pool.
- `director()` — spawn rate curve, elite waves, boss timing, pickup frequency.

Enemy cap is `MAX_ENEMIES` (85 on touch devices, 165 on desktop). Raise it if your machine can take it.
