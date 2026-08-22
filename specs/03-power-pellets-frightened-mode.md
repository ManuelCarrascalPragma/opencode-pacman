# SPEC 03 — Power Pellets and Frightened Mode

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-08-21
> **Objective:** Add 4 Power Pellets (energizers) at the maze corners that trigger frightened mode, allowing Pac-Man to eat ghosts for bonus points; ghosts turn blue, slow down, reverse direction, and flee; eaten ghosts return to the pen as eyes and respawn after a delay.

## Scope

**In:**

- Add Power Pellet tile type (value \4\) to maze, rendered as larger flashing dots at 4 classic corner positions.
- Maze parse update: \'O'\ char → tile value \4\ in \maze.js\.
- Power Pellets give 50 points when eaten (vs 10 for regular dots).
- Frightened mode state on game: \rightenedTimer\ (frames), \rightenedMode\ boolean.
- When Pac-Man eats a Power Pellet: all ghosts enter frightened mode for 600 frames (~10s at 60fps).
- Frightened ghosts: turn blue, speed reduced to 0.05 (half normal), reverse direction immediately, choose directions that maximize distance from Pac-Man (flee behavior).
- Ghost flashing: last 2 seconds (120 frames) of frightened mode, ghosts alternate white/blue to signal expiry.
- Collision during frightened mode: Pac-Man eats ghost → ghost enters \eaten\ state, returns to pen as eyes, Pac-Man gets escalating points (200, 400, 800, 1600).
- Eaten ghost: \eaten: true\, \eyesOnly: true\, speed doubled (0.2) returning to pen, no collision with Pac-Man, enters pen at door (row 12), respawns after 240 frames (4s) with normal state.
- Ghost respawn: after eyes reach pen center, wait \
espawnTimer\, then \inPen = true\, \
eleaseTimer = 0\, \exitingPen = true\ (immediate exit up).
- Power Pellets do not respawn within a level; only on level restart / new game.
- Update \dotsRemaining\ to exclude Power Pellets from win condition (only regular dots count).

**Out of scope (for future specs):**

- Level progression affecting frightened duration / ghost speeds.
- Multiple Power Pellets eaten stacking/extending timer (only reset timer on new pellet).
- Fruit bonuses.
- Cutscenes / intermission animations.
- High score persistence.

## Data model

\\\js
// Maze tile values (maze.js)
const TILE = {
  EMPTY: 0,
  WALL: 1,
  DOT: 2,
  DOOR: 3,
  POWER_PELLET: 4,        // NEW
};

// Game state additions (game.js)
const game = {
  // ...existing fields...
  frightenedMode: false,        // true while any ghost is frightened
  frightenedTimer: 0,           // frames remaining
  FRIGHTENED_DURATION: 600,     // ~10s at 60fps
  FRIGHTENED_FLASH_START: 120,  // last 2s: flash white/blue
  eatenGhostScores: [200, 400, 800, 1600], // points per ghost eaten in one frightened session
  ghostsEatenThisFrightened: 0, // counter for escalating score
};

// Ghost object additions (extends SPEC 01/02)
const ghost = {
  // ...existing fields...
  frightened: false,            // true when in frightened mode
  eaten: false,                 // true when eaten, returning as eyes
  eyesOnly: false,              // true when only eyes visible (eaten state)
  respawnTimer: 0,              // frames until respawn from pen center
  baseSpeed: 0.1,               // store original speed for restore
};

// Constants
const FRIGHTENED_SPEED = 0.05;      // half of base ghost speed
const EYES_SPEED = 0.2;             // double speed returning to pen
const RESPAWN_DELAY = 240;          // 4s at 60fps
const PEN_CENTER = { x: 13.5, y: 14.5 }; // approximate pen center for eyes target
\\\

## Implementation plan

1. **Update \maze.js\ — Tile parsing and constants**:
   - Add \POWER_PELLET = 4\ to tile values.
   - Update \parseTile()\: \'O'\ → \4\.
   - Replace 4 corner dots with \'O'\ in \MAZE_STR\ at classic positions (top-left, top-right, bottom-left, bottom-right of playable area).
   - No new globals needed; \MAZE\ already exposed.

2. **Update \game.js — createGame()\**:
   - Count only regular dots (value \2\) for \dotsRemaining\ (exclude power pellets from win condition).
   - Initialize \rightenedMode: false\, \rightenedTimer: 0\, \ghostsEatenThisFrightened: 0\.
   - Add \aseSpeed\ to each ghost initialization (copy of \g.speed\).

3. **Update \game.js — movePacman()\**:
   - When Pac-Man lands on tile \4\ (Power Pellet): set \grid[y][x] = 0\, add 50 points, trigger \enterFrightenedMode(game)\.
   - \enterFrightenedMode(game)\: set \rightenedMode = true\, \rightenedTimer = FRIGHTENED_DURATION\, \ghostsEatenThisFrightened = 0\. For each ghost: if not \eaten\, set \rightened = true\, \speed = FRIGHTENED_SPEED\, reverse direction (\dir = OPPOSITE[dir]\).

4. **Update \game.js — update()\**:
   - Decrement \rightenedTimer\ each frame when > 0.
   - When \rightenedTimer\ reaches 0: call \exitFrightenedMode(game)\.
   - \exitFrightenedMode(game)\: \rightenedMode = false\. For each ghost: if \rightened\ and not \eaten\, set \rightened = false\, restore \speed = baseSpeed\.

5. **Update \game.js — decideGhost()\ / add \decideFrightened()\**:
   - New behavior function \decideFrightened(game, g, choices)\: pick direction that maximizes Manhattan distance to Pac-Man (flee), avoiding opposite of current dir unless dead end.
   - In \decideGhost()\: if \g.frightened\ and not \g.eaten\, call \decideFrightened()\ instead of kind-specific behavior.
   - If \g.eaten\ (eyes returning): target \PEN_CENTER\ using \pickBestDir\; when close enough (distance < 0.5), trigger respawn logic.

6. **Update \game.js — moveGhost()\**:
   - Handle \eaten\ state: move toward \PEN_CENTER\ at \EYES_SPEED\, ignore walls (doors passable), no collision with Pac-Man.
   - When \eaten\ ghost reaches pen center: set \eaten = false\, \eyesOnly = false\, \
espawnTimer = RESPAWN_DELAY\, \inPen = true\, \
eleaseTimer = 0\, \exitingPen = true\, \dir = 'up'\, \speed = baseSpeed\, \rightened = false\.
   - Decrement \
espawnTimer\ while \inPen\ and \
espawnTimer > 0\; when 0, normal pen exit logic applies (already handled by existing \exitingPen\ flow).
   - Flashing: no logic needed here; handled in render.

7. **Update \game.js — collision detection (update())\**:
   - In ghost collision loop: if \g.frightened\ and not \g.eaten\:
     - Pac-Man eats ghost: \g.eaten = true\, \g.eyesOnly = true\, \g.frightened = false\, \g.speed = EYES_SPEED\.
     - Score: \game.score += game.eatenGhostScores[game.ghostsEatenThisFrightened]\ (clamp to max index 3).
     - \game.ghostsEatenThisFrightened++\.
   - Else (normal collision): existing life loss logic.

8. **Update \
ender.js — drawDots()\ / add \drawPowerPellets()\**:
   - New function \drawPowerPellets(ctx, grid, frame)\: render tile value \4\ as larger circles (radius 6-8), flashing (sin wave on frame, period ~15 frames).
   - Call from \draw()\ after \drawDots()\.

9. **Update \
ender.js — drawGhost()\**:
   - If \g.eaten\ / \g.eyesOnly\: draw only eyes (white with blue pupils), no body, at ghost position.
   - Else if \g.frightened\:
     - Determine color: if \game.frightenedTimer > FRIGHTENED_FLASH_START\ → blue (\#0000ff\); else flash: \Math.floor(frame / 8) % 2 === 0\ ? blue : white (\#ffffff\).
     - Draw ghost body with frightened color, eyes looking at Pac-Man (or straight ahead).
   - Else: normal color by kind (existing logic).

10. **Update \game.js — resetPositions()\**:
    - Reset \rightenedMode = false\, \rightenedTimer = 0\, \ghostsEatenThisFrightened = 0\.
    - For each ghost: \rightened = false\, \eaten = false\, \eyesOnly = false\, \
espawnTimer = 0\, \speed = baseSpeed\.

## Acceptance criteria

- [ ] 4 Power Pellets visible at maze corners (larger, flashing).
- [ ] Eating Power Pellet gives 50 points, triggers frightened mode (~10s).
- [ ] During frightened mode: all ghosts turn blue, move at half speed, reverse direction, flee from Pac-Man.
- [ ] Last 2 seconds of frightened mode: ghosts flash blue/white.
- [ ] Pac-Man colliding with frightened ghost: ghost eaten, eyes return to pen, Pac-Man gets 200/400/800/1600 points escalating.
- [ ] Eaten ghost returns to pen center as eyes (double speed), waits 4s, then exits pen upward and resumes normal AI.
- [ ] Collision with non-frightened ghost: lose life, reset positions (existing behavior).
- [ ] Power Pellets do not count toward \dotsRemaining\ / win condition.
- [ ] On life lost or level restart: all ghosts reset to pen with correct release timers, frightened mode cleared.
- [ ] No console errors during gameplay.

## Decisions

- **Yes:** Power Pellet tile value \4\, parsed from \'O'\ char. Distinct from dot (\2\) and door (\3\).
- **Yes:** 4 Power Pellets at classic corner positions. Authentic level 1 layout.
- **Yes:** Frightened mode duration 600 frames (~10s). User preference for slightly longer than classic 7s.
- **Yes:** Classic frightened behavior: blue, slower, reverse, flee. Maximum authenticity.
- **Yes:** Flashing warning in last 2 seconds (120 frames). Standard visual cue.
- **Yes:** Escalating scores 200/400/800/1600 per ghost eaten in one frightened session. Classic scoring.
- **Yes:** Eaten ghosts return as eyes to pen center, respawn after 4s. Full classic cycle.
- **Yes:** Eyes move at double speed (0.2), ignore walls/doors. Fast return matches arcade.
- **Yes:** Power Pellets not counted in \dotsRemaining\. Win condition = all regular dots eaten only.
- **No:** Stacking/extending frightened timer on multiple pellets. Timer resets to full duration on each pellet (simpler, matches many ports).
- **No:** Level-based frightened duration changes. Deferred to level progression spec.
- **Yes:** Store \aseSpeed\ on ghost to restore after frightened/eaten states. Clean restoration.
- **Yes:** \ghostsEatenThisFrightened\ counter on game state (not per ghost). Escalating score resets per frightened session.

## Risks

| Risk | Mitigation |
| --- | --- |
| Flee behavior may trap ghosts in dead ends | In \decideFrightened\, if all choices lead closer to Pac-Man, pick the one that maximizes distance anyway; dead-end reversal already handled by \choices\ fallback |
| Eyes returning to pen may get stuck on walls | Eyes mode ignores walls (\isWall\ returns false for actor='eyes' or special flag); only target pen center |
| Flashing timer desync between ghosts | Flash based on global \rame\ counter in render, not per-ghost timer; all ghosts flash in sync |
| Power Pellet positions may not align with "corners" in this maze | Verify positions in \MAZE_STR\ rows 1/29 and cols 1/26 have dots; replace those specific dots with 'O' |
| \dotsRemaining\ miscount if power pellets included | Explicitly count only \ === 2\ in \createGame\; power pellets (4) ignored for win condition |
| Ghost respawn timing conflicts with staggered release | Respawn uses \
eleaseTimer = 0\ + \exitingPen = true\ (immediate exit up), independent of original \
eleaseDelay\ |

## What is **not** in this spec

- Level progression (frightened duration, ghost speeds per level).
- Fruit bonuses.
- Multiple power pellets extending/stacking timer.
- High score saving.
- Cutscenes / intermission animations.
- Ghost house door animation (visual only).

---

*End of SPEC 03*
