# SPEC 02 — Ghost Pen Exit and Grid Alignment Fix

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-08-20
> **Objective:** Fix ghosts getting stuck in the pen on release by adding an automatic UP movement state, and fix ghost visual misalignment to grid by tightening alignment tolerance and ensuring proper grid snapping.

## Scope

**In:**

- Add `exitingPen` state to ghost objects: when `releaseTimer` reaches 0, ghost enters `exitingPen` mode and moves UP automatically until it clears the pen area (reaches row 11 or above), then transitions to normal AI.
- Apply pen exit fix to all 4 ghosts (Blinky, Pinky, Inky, Clyde).
- Tighten `aligned()` tolerance from `1e-3` to `1e-6` to prevent premature direction decisions at fractional positions.
- Ensure ghosts snap to exact integer grid coordinates when aligned before making movement decisions.
- Fix potential floating-point accumulation by rounding position after each move step when aligned.

**Out of scope (for future specs):**

- Ghost house door animation (visual only).
- Frightened mode interactions with pen exit.
- Ghost eyes returning to pen after being eaten.

## Data model

```js
// Ghost object additions (extends SPEC 01)
const ghost = {
  // ...existing fields from SPEC 01...
  inPen: true,                 // true while waiting in pen (releaseTimer > 0)
  exitingPen: false,           // NEW: true when moving UP out of pen automatically
};

// GHOST_STARTS in maze.js unchanged (positions, speeds, releaseDelays same as SPEC 01)
// Pen geometry constants (derived from maze layout)
const PEN_EXIT_ROW = 11;       // Row above the door (door is at row 12); ghost clears pen when y <= 11
```

## Implementation plan

1. **Update `game.js` — Ghost object initialization in `createGame()`**: Add `exitingPen: false` to each ghost. Initially `false`; set to `true` when `releaseTimer` reaches 0.

2. **Update `game.js` — `moveGhost()` function**: 
   - When `g.inPen` and `g.releaseTimer === 0`: set `g.inPen = false`, `g.exitingPen = true`, `g.dir = 'up'`.
   - When `g.exitingPen`: move UP at ghost's speed without calling `decideGhost()`. Check if `g.y <= PEN_EXIT_ROW` (cleared pen); if so, set `g.exitingPen = false`, snap `g.y = Math.round(g.y)`, then resume normal AI.
   - Normal AI path (`!exitingPen`): keep existing logic but with tighter alignment.

3. **Update `game.js` — `aligned()` function**: Change tolerance from `1e-3` to `1e-6` for stricter grid alignment check.

4. **Update `game.js` — `moveGhost()` alignment logic**: When aligned, snap `g.x = Math.round(g.x)`, `g.y = Math.round(g.y)` BEFORE calling `decideGhost()`. This ensures decisions are made from exact grid positions.

5. **Update `game.js` — `movePacman()` for consistency**: Apply same tighter alignment (`1e-6`) and snap-before-decide pattern (though Pac-Man already works correctly, this prevents future drift).

6. **Update `resetPositions()`**: Reset `exitingPen: false` for all ghosts along with other state.

## Acceptance criteria

- [ ] Blinky (releaseDelay=0) exits pen immediately on game start, moves UP through door, then begins chase behavior.
- [ ] Pinky (releaseDelay=240) waits ~4s in pen, then moves UP through door, then begins ambush behavior.
- [ ] Inky (releaseDelay=480) waits ~8s in pen, then moves UP through door, then begins unpredictable behavior.
- [ ] Clyde (releaseDelay=720) waits ~12s in pen, then moves UP through door, then begins random/close-chase behavior.
- [ ] No ghost gets stuck in pen or wanders inside pen after release.
- [ ] Ghosts visually align perfectly to grid cells (no fractional pixel offsets between tiles).
- [ ] Ghosts never appear to walk through walls or between wall corners.
- [ ] On life lost / level restart, all ghosts return to pen with correct release timers and exit properly again.
- [ ] No console errors during gameplay.

## Decisions

- **Yes:** Automatic UP movement when exiting pen. Matches original Pac-Man behavior exactly; ghosts don't "search" for the door.
- **Yes:** `exitingPen` flag separate from `inPen`. Clean state machine: `inPen` (waiting) → `exitingPen` (moving up) → normal AI.
- **Yes:** Pen exit detected at `y <= 11` (row above door at row 12). Door is at row 12; ghost clears pen when it reaches row 11.
- **Yes:** Tighter alignment tolerance (`1e-6`). Prevents direction decisions at fractional positions that cause visual misalignment.
- **Yes:** Snap to grid before `decideGhost()`. Ensures pathfinding always operates from exact tile centers.
- **No:** Pathfinding to find door. Over-engineered; original game uses fixed UP exit.
- **No:** Visual door animation. Purely cosmetic; deferred.

## Risks

| Risk | Mitigation |
| --- | --- |
| Ghost exits pen but immediately hits wall above door | Door at row 12 cols 13-14 is open (tile 3 = door, passable for ghosts). Row 11 above door is empty. Verified in maze layout. |
| `exitingPen` ghost collides with Pac-Man in tunnel row | Tunnel row is 14; pen exit goes UP from row 14→13→12→11. No overlap with tunnel. |
| Tighter alignment breaks movement at low frame rates | Tolerance `1e-6` is still far below single-frame movement (0.1 cells). Alignment triggers correctly. |
| Floating-point drift accumulates over long games | Snap to integer on every alignment check; position never drifts more than one frame's movement. |

## What is **not** in this spec

- Ghost house door animation (visual only).
- Frightened mode (blue ghosts) — requires power pellets spec first.
- Ghost eaten / eyes return to pen.
- Level progression affecting ghost speed/behavior.
