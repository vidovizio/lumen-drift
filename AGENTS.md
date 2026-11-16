# Lumen Drift — build brief

You are building an entry for make.fun's "Make the best game" bounty
(slug `best-game-01`, program/v1). Work only inside this repository directory.
Node 24 is installed here; the grader runs `main.ts` with Node 22, standard
library only, no network, no installs. TypeScript must use erasable syntax
only (no enums, no namespaces, no parameter properties).

## The kit (source of truth for the rules)

The unpacked kit is at `../best-game-01-kit/`. Read its `RULES.txt` (at least
"The task", "The gate", "The dossier" and "Getting started") and look at
`starter/` — a working baseline entry (Block Dodger). Your game must be
clearly different from the starter's game. The kit files you must reuse
byte-for-byte:

- `../best-game-01-kit/starter/vendor/makefun-game.ts` → copy to
  `vendor/makefun-game.ts` (do not edit it, do not move it elsewhere).
- `../best-game-01-kit/starter/LICENSE` → copy to `LICENSE`.

Everything else you write yourself, in your own structure and words.

## The game: LUMEN DRIFT (original neon arena survival shooter)

A complete, original 2D arena game on an HTML canvas, 1280x720 logical
playfield, dark starfield backdrop, neon vector art drawn in code (no image
assets, no external fonts, no network requests at all).

- **Goal**: pilot the last Wisp — a small luminous ship — and survive all
  8 waves of Drifters in the arena, then face the wave-8 "Maw" (a large
  enemy with much more health). Clear wave 8 to WIN.
- **Controls**: WASD / arrow keys move; the mouse aims; holding the mouse
  button or Space fires lumen bolts toward the aim. P or Esc pauses.
  M mutes. On the title screen, click or press Enter to start. On the
  game-over and victory screens, click or press R / Enter to restart.
- **Enemies** (all chase or pressure the player; contact and their shots
  damage the hull):
  - Drifter — a magenta diamond that homes in on the player.
  - Weaver — an orange crescent that approaches on a sine path and fires
    slow bolts at the player from wave 3 on.
  - Bulwark — a large slow teal hexagon with high health from wave 4 on;
    splits into two Drifters when destroyed.
  - The Maw — wave 8's oversized Bulwark-class enemy with a health bar.
- **Scoring**: destroying enemies scores points; they drop Lumen shards
  (cyan orbs) that drift toward the player when close (magnet). Collecting
  shards raises a combo multiplier (x1 up to x8) that decays when you stop
  collecting; score gains use the multiplier. Every 20 shards restores a
  little hull. Floating score text shows gains.
- **Lose**: hull reaches 0 → game over screen with final score, wave
  reached, best score, and a restart prompt.
- **HUD**: hull bar, score, combo meter, wave number, enemies remaining,
  shard count — always visible during play, plus a wave banner between
  waves and a low-hull warning flash.
- **Feel**: particle bursts on explosions and pickups, brief screen shake
  on player damage, muzzle flash, hit flashes, a subtle grid/starfield
  that parallaxes with movement. Sound is synthesized with WebAudio
  (shoot, explosion, pickup, hurt, wave start, win, lose) — no audio
  files; start audio only after the first user gesture.
- **Determinism**: all randomness flows through one seeded RNG
  (mulberry32-style) in `game/src/random.js`. Normal play seeds from the
  clock; the screenshot scenes seed from the URL.

## Screenshot scenes (required)

`screenshots/` must hold 4 JPEGs rendered from the real game in a browser.
Support deterministic scenes through the URL query, exactly like the
starter does with its `shots.js`:

- `?shot=start&seed=7` — title screen over a gently simulated ambient arena.
- `?shot=play&seed=7` — mid wave-3 action, steered by a simple autopilot
  that plays the real rules forward (aim at the nearest enemy, kite away
  from danger), HUD full of life.
- `?shot=late&seed=7` — wave-6 action, denser and more dramatic, combo up.
- `?shot=end&seed=7` — a reckless autopilot (short lookahead, no kiting)
  plays until the hull is gone: the game-over screen with score + restart.

Write `shots.json` at the repo root listing the 4 files and their queries:
`1-title.jpg`, `2-play.jpg`, `3-late.jpg`, `4-end.jpg`. The staged scene
must be the state the page draws (freeze the staged frame; do not start
the normal interactive loop in shot mode).

## Layout (one clear job per file — the judge reads the file outline)

- `game/index.html` — the page: canvas, stylesheet link, one module script.
- `game/style.css` — page chrome only (the game itself is canvas-drawn).
- `game/src/config.js` — every tuning number, wave table and colour.
- `game/src/random.js` — the seeded RNG.
- `game/src/input.js` — keyboard + mouse state.
- `game/src/audio.js` — the WebAudio synth (all sound effects, mute).
- `game/src/world.js` — the simulation: player, enemies, bolts, shards,
  particles, waves, collisions, score/combo/hull. No DOM in here.
- `game/src/render.js` — every canvas drawing: arena, entities, HUD,
  title / pause / game-over / victory screens.
- `game/src/shots.js` — the deterministic screenshot scenes + autopilots.
- `game/src/main.js` — boot, the fixed-step loop, screen state machine.
- `main.ts` (repo root) — hands the game in: copies `game/` and
  `screenshots/` from beside itself to the output dir
  (`MAKEFUN_OUTPUT_DIR` or `/output`) and writes `dossier.json` with
  `buildDossier` from `./vendor/makefun-game.ts`, using the starter's caps
  (`text_max_bytes: 163840`, screenshots `{ max: 4, max_bytes: 262144 }`,
  `game_max_files: 993`, `game_max_bytes: 50331648`,
  `game_path_max_bytes: 1000`). Write it in your own words (the starter's
  main.ts is the pattern, not a text to copy), and add one authored touch:
  after copying, verify the output holds `game/index.html` and at least 3
  screenshots, and throw a clear error naming what is missing otherwise.
- `serve.ts` (repo root) — your own tiny static server for `game/`
  (Node stdlib only, port 8080), so the game can be played locally.
- `screenshots/` — create the directory with a `.gitkeep` for now; the
  real screenshots are rendered afterwards and replace it.
- `.makefun/owner.json` — exactly `{"wallet": "CgjRoLX5thwqBjS2jA6zj1X8Td1NbPKDr5Bic4FDLGBU"}`.
- `README.md` — the make.fun README: title, the three badges
  (`https://make.fun/badge/best-game-01.svg`,
  `https://make.fun/badge/best-game-01/vidovizio/lumen-drift/rank.svg`,
  `https://make.fun/badge/best-game-01/vidovizio/lumen-drift/reward.svg`,
  each as an image linking to the matching make.fun bounty page),
  a short description of the game and its controls, a "Run it" section
  (`node serve.ts`, then open http://localhost:8080; and
  `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` to build the
  entry output), and the footer line from the kit's readme template in
  RULES.txt / requirements (`Entered on make.fun …` with referral link
  https://make.fun/?ref=quick-robin-90&utm_source=github&utm_medium=readme&utm_campaign=best-game-01).

## Hard rules

- No network: the game loads only files under `game/` (relative paths) or
  `data:` URIs. No CDN, no webfonts, no fetch.
- Every `.js` file must parse as an ES module; use only relative imports.
- `main.ts` must be deterministic: two runs write byte-identical output.
- Do not run git commands, do not commit, do not touch anything outside
  this repository directory except reading the kit at `../best-game-01-kit/`.
- Keep the whole game source comfortably under 160 KB of text in total.

## Verify before you finish

1. `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` succeeds and
   `out/` holds `game/`, `screenshots/` and `dossier.json`.
2. Run it a second time into `out2/` and confirm the two `dossier.json`
   files are byte-identical (`cmp`).
3. Parse-check every game module (e.g. `node --check` will not work for
   modules with imports of `.ts`; instead import `game/src/main.js` is
   browser code — at minimum run a syntax pass with
   `node --input-type=module --check` equivalents or a tiny node script
   using `new Function`? No: use `node -e` with `vm.SourceTextModule` if
   available, or simply open each file's syntax via
   `npx --yes acorn`? Nothing may be installed. Use
   `node --experimental-vm-modules` with `vm.SourceTextModule` to parse
   each `.js` file and report any syntax error.)
4. Serve `game/` briefly with `node serve.ts --port 8902` in the
   background, `curl` the page and each module to confirm 200s, then stop
   the server.

Then, as a separate final step in this same session, do one polish pass:
re-read `game/src/world.js` and `game/src/render.js`, and improve one real
thing you notice (balance, a drawing detail, or a HUD clarity fix) with a
small edit, and note in your final summary what you changed. Finish with a
short summary of the files you wrote and the checks you ran.
