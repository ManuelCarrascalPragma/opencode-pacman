# open-pacman Agent Guide

## Run
Open `src/index.html` directly in a browser. No build, no server.

## Project Structure
```
src/
├── index.html      # Entry point, loads scripts in order
├── css/style.css   # Styling
├── js/
│   ├── maze.js     # Maze data (MAZE, TUNNEL_ROW, PACMAN_START, GHOST_STARTS)
│   ├── game.js     # Game logic (createGame, update, movement, collision)
│   ├── render.js   # Canvas drawing (drawWalls, drawPacman, drawGhost, draw)
│   └── main.js     # Game loop, input, overlay screens
```

## Key Facts
- **Script load order matters**: maze → game → render → main (all attach globals to `window`)
- **No modules, no bundler, no tooling** — edit and refresh browser
- **Maze**: 28×31, level 1 accurate, parsed from strings in `maze.js`
- **Grid copy**: `game.grid` is a mutable copy of `MAZE` per game; dots eaten are removed
- **Movement**: Sub-tile with alignment checks (PACMAN_SPEED=0.125, GHOST_SPEED=0.1)
- **Tunnel wrap**: Row 14 (TUNNEL_ROW), wraps horizontally
- **Ghost AI**: One "hunter" (chases Pac-Man), one "random"
- **Controls**: Arrow keys; buffered turns via `pacman.nextDir`
- **States**: `start` → `playing` → `won` | `lost` (3 lives)
- **Comments/variable names in Spanish**

## Spec-Driven Development
Uses opencode skills:
- `spec` skill: design specs before implementing
- `spec-impl` skill: implement approved specs on a git branch

## Constants (maze.js)
```
MAZE            # pristine 31x28 numeric grid (1=wall, 2=dot, 3=door, 0=empty)
TUNNEL_ROW = 14
PACMAN_START = {x: 13, y: 23}
GHOST_STARTS = [{x: 13, y: 14, kind: 'hunter'}, {x: 14, y: 14, kind: 'random'}]
```

## Constants (game.js)
```
PACMAN_SPEED = 0.125  # 1/8 cell/frame
GHOST_SPEED  = 0.1    # 1/10 cell/frame
```