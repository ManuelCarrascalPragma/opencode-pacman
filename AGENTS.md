# open-pacman Agent Guide

## Run the Game
Open `src/index.html` directly in a browser. No build step, no server required.

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

## Architecture Notes
- All JS files attach globals to `window` (no modules, no bundler)
- Script load order in `index.html` matters: maze → game → render → main
- `game.grid` is a mutable copy of `MAZE` per game; dots eaten are removed from grid
- Ghost AI: one "hunter" (chases Pac-Man), one "random"

## Spec-Driven Development
This repo uses opencode skills for spec-driven development:
- `spec` skill: design specs before implementing
- `spec-impl` skill: implement approved specs on a git branch

## No Tooling
- No package.json, no npm, no build, no lint, no typecheck, no tests
- No CI/CD configuration
- Edit files directly and refresh browser to test

## Key Conventions
- Spanish comments and variable names in code
- Arcade-accurate maze geometry (28×31, level 1)
- Sub-tile movement with alignment checks (PACMAN_SPEED=0.125, GHOST_SPEED=0.1)
- Tunnel wrap at row 14