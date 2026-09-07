# AGENTS.md

Vanilla JS Asteroids clone. No build, no dependencies, no tests, no lint/typecheck setup — do not invent commands or add tooling without being asked.

## Run

Open `index.html` directly in a browser, or `npx serve .` (README documents port 3000). No install step.

## Architecture

- All game code lives in `game.js` (loaded by `index.html`); keep it single-file.
- Canvas is fixed 800×600. The `W`/`H` constants in `game.js` must stay in sync with the `width`/`height` attributes of the `<canvas>` element in `index.html` — there is no code path that syncs them.
- Fixed-step-free loop: `requestAnimationFrame` with dt capped at 0.05s (`loop()`); all physics are dt-based px/s. Don't introduce frame-count assumptions.
- Game state machine: `'playing' | 'dead' | 'gameover'` module-level `state` var, with `deadTimer` gating respawn.
- Entities (`Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`, `ShootingStar`) follow the same pattern: `dead` flag, `update(dt)`, `draw()`, then arrays are filtered each frame. New entities should match this.
- Screen edges are toroidal — positions go through `wrap(v, max)`, including bullets. Exception: `ShootingStar` (estrella fugaz) crosses the screen once and exits without wrapping.
- Input: `keys` for held keys, `pressed(code)` for edge detection. `pressed()` is consume-on-read (clears `justPressed[code]`); call it once per frame per key. Keys are matched by `e.code` (`'ArrowLeft'`, `'Space'`), not `e.key`.

## Conventions

- Comments, UI strings (HUD, overlays), and README are in Spanish — keep new user-facing text in Spanish.
- Style: single quotes, 2-space indent, `──` section header comments in `game.js`.
- Ship/asteroid collision uses a forgiveness factor (`a.radius * 0.82`); asteroid sizes/speeds/points are table-driven via the `RADII`/`SPEEDS`/`POINTS` arrays indexed by size 1–3.
