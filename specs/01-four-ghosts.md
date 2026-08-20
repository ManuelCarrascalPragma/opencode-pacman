# SPEC 01 — Four Ghosts with Classic AI Behaviors

> **Status:** Approved
> **Depends on:** (none)
> **Date:** 2026-08-19
> **Objective:** Implement 4 ghosts (Blinky, Pinky, Inky, Clyde) with distinct classic Pac-Man behaviors, staggered release from the pen, scatter/chase mode cycles, and individual speeds.

## Scope

**In:**

- Four ghosts with unique kinds: `blinky` (aggressive chase), `pinky` (ambush — targets 4 tiles ahead of Pac-Man), `inky` (unpredictable — uses Blinky + Pac-Man positions), `clyde` (random when far, chases when close).
- Staggered release from ghost pen using timers (Blinky exits immediately, others after delays).
- Scatter/chase mode cycles with classic timings: 7s scatter, 20s chase, 7s scatter, 20s chase, 5s scatter, 20s chase, 5s scatter, then permanent chase.
- Scatter targets at classic home corners: Blinky top-right, Pinky top-left, Inky bottom-right, Clyde bottom-left.
- Individual speeds per ghost: Blinky 0.125, Pinky 0.11, Inky 0.1, Clyde 0.09 (cells/frame).
- Ghost kind stored on each ghost object; `decideGhost` dispatches to behavior functions.
- Mode timer and current mode (`scatter` | `chase`) stored on game state.

**Out of scope (for future specs):**

- Frightened mode (blue ghosts after power pellet).
- Eating ghosts for points.
- Ghost eyes returning to pen after being eaten.
- Level progression affecting ghost speed/behavior.
- Ghost house door animation.

## Data model

```js
// Game state additions
const game = {
  // ...existing fields...
  ghostMode: 'scatter',        // 'scatter' | 'chase'
  ghostModeTimer: 0,           // frames until next mode switch
  ghostModeSchedule: [         // classic timings in frames (60 fps)
    420, 1200, 420, 1200, 300, 1200, 300, Infinity
  ],
  ghostModeIndex: 0,
};

// Ghost object additions
const ghost = {
  // ...existing fields...
  kind: 'blinky' | 'pinky' | 'inky' | 'clyde',
  speed: 0.125 | 0.11 | 0.1 | 0.09,
  releaseTimer: 0,             // frames until ghost leaves pen (0 = already out)
  inPen: true,                 // true while waiting to be released
  scatterTarget: { x: 0, y: 0 }, // home corner for scatter mode
};

// GHOST_STARTS in maze.js becomes 4 entries with kind, position, speed, release delay
const GHOST_STARTS = [
  { x: 13, y: 14, kind: 'blinky', speed: 0.125, releaseDelay: 0 },      // top of pen
  { x: 13, y: 15, kind: 'pinky', speed: 0.11, releaseDelay: 240 },      // 4s delay
  { x: 14, y: 14, kind: 'inky', speed: 0.1, releaseDelay: 480 },        // 8s delay
  { x: 14, y: 15, kind: 'clyde', speed: 0.09, releaseDelay: 720 },      // 12s delay
];

// Scatter targets (tile coordinates)
const SCATTER_TARGETS = {
  blinky: { x: 25, y: 0 },   // top-right
  pinky: { x: 2, y: 0 },     // top-left
  inky: { x: 25, y: 30 },    // bottom-right
  clyde: { x: 2, y: 30 },    // bottom-left
};
```

## Implementation plan

1. **Update `maze.js`**: Replace `GHOST_STARTS` with 4 entries including kind, speed, and releaseDelay. Add `SCATTER_TARGETS` constant.
2. **Update `game.js` — createGame()**: Initialize `ghostMode`, `ghostModeTimer`, `ghostModeSchedule`, `ghostModeIndex`. Initialize each ghost with `kind`, `speed`, `releaseTimer`, `inPen`, `scatterTarget`.
3. **Update `game.js` — update()**: Add ghost mode timer logic. Decrement timer each frame; when zero, switch mode, advance schedule index, reset timer.
4. **Update `game.js` — moveGhost()**: Handle `inPen` state. If `releaseTimer > 0`, decrement and stay in pen. When timer reaches 0, set `inPen = false` and let ghost exit pen naturally.
5. **Update `game.js` — decideGhost()**: Dispatch to behavior functions based on `ghost.kind`. Pass `game.ghostMode` to behaviors so they target scatter corner in scatter mode.
6. **Add behavior functions in `game.js`**:
   - `decideBlinky(game, ghost)` — targets Pac-Man position in chase, scatter target in scatter.
   - `decidePinky(game, ghost)` — targets 4 tiles ahead of Pac-Man in chase, scatter target in scatter.
   - `decideInky(game, ghost)` — targets `2 * pacman - blinky` vector in chase, scatter target in scatter.
   - `decideClyde(game, ghost)` — if distance > 8 tiles, random; else chase Pac-Man. Scatter target in scatter.
7. **Update `render.js` — GHOST_COLORS**: Ensure 4 colors map to blinky (red), pinky (pink), inky (cyan), clyde (orange) by index.
8. **Update `resetPositions()`**: Reset `ghostMode` to scatter, timer to first schedule value, index to 0. Reset each ghost's `releaseTimer`, `inPen`, position, direction.

## Acceptance criteria

- [ ] Game loads without errors; 4 ghosts visible on screen.
- [ ] Blinky (red) exits pen immediately and chases Pac-Man aggressively.
- [ ] Pinky (pink) exits after ~4s and targets 4 tiles ahead of Pac-Man.
- [ ] Inky (cyan) exits after ~8s and uses Blinky+Pac-Man vector for targeting.
- [ ] Clyde (orange) exits after ~12s and behaves randomly when far, chases when close.
- [ ] Ghosts alternate scatter/chase per classic schedule (7s/20s/7s/20s/5s/20s/5s then permanent chase).
- [ ] During scatter, each ghost heads to its home corner (Blinky top-right, Pinky top-left, Inky bottom-right, Clyde bottom-left).
- [ ] Ghosts have distinct speeds: Blinky fastest, Clyde slowest.
- [ ] On life lost or level restart, all ghosts return to pen with correct release timers.
- [ ] No console errors during gameplay.

## Decisions

- **Yes:** Classic 4 ghost behaviors (Blinky/Pinky/Inky/Clyde). Authentic Pac-Man feel.
- **Yes:** Timer-based staggered release. Matches original arcade behavior.
- **Yes:** Classic scatter/chase timings (7/20/7/20/5/20/5 frames at 60fps). Authentic.
- **Yes:** Classic scatter corners. Well-known and tested.
- **Yes:** Individual speeds per ghost. Adds strategic depth.
- **No:** Frightened mode. Deferred to separate spec (power pellets not yet implemented).
- **No:** Ghost eaten animation/return to pen. Requires frightened mode first.
- **Yes:** Store `ghostMode` and timer on game state (not per ghost). Single global mode for all ghosts matches original.
- **Yes:** `releaseTimer` and `inPen` per ghost. Allows independent release timing.

## Risks

| Risk | Mitigation |
| --- | --- |
| Inky behavior needs Blinky position; Blinky may not exist yet during init | In `decideInky`, check if Blinky ghost exists; if not, fall back to chase Pac-Man directly |
| Ghosts getting stuck in pen if release logic has bug | Test each release delay individually; add debug logging for release timers |
| Scatter/chase timer drift over long games | Use integer frame counter; schedule is fixed array, not calculated |
| Pinky's "4 tiles ahead" target may be inside a wall | In `decidePinky`, validate target tile; if wall, fall back to Pac-Man position |

## What is **not** in this spec

- Frightened mode (blue ghosts after power pellet).
- Eating ghosts for bonus points.
- Ghost eyes returning to pen after being eaten.
- Level progression affecting ghost speed/behavior.
- Ghost house door animation.
- Power pellets / energizers.