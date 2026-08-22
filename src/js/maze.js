// maze.js
// Laberinto 28x31 fiel a la geometria del nivel 1 de Pac-Man.
// Se escribe como 31 strings de 28 chars (legible) y se parsea a numeros.
//   '#' pared(1) · '.' dot(2) · ' ' vacio transitable(0) · '-' puerta pen(3) · 'O' power pellet(4)
// Coordenadas: celda (x,y), origen arriba-izquierda. x in [0,27], y in [0,30].
// Simetrico respecto al eje vertical central (entre cols 13 y 14).

const MAZE_STR = [
  '############################', // 0  borde
  '#O...........##...........O#', // 1  power pellets en esquinas (1,1) y (26,1)
  '#.####.#####.##.#####.####.#', // 2
  '#.####.#####.##.#####.####.#', // 3
  '#.####.#####.##.#####.####.#', // 4
  '#..........................#', // 5
  '#.####.##.########.##.####.#', // 6
  '#.####.##.########.##.####.#', // 7
  '#......##....##....##......#', // 8
  '######.#####.##.#####.######', // 9
  '######.#####.##.#####.######', // 10
  '######.##..........##.######', // 11
  '######.##.###--###.##.######', // 12  puerta pen cols 13-14
  '######.##.#      #.##.######', // 13  interior pen
  '          #      #          ', // 14  tunel (extremos abiertos) + pen
  '######.##.#      #.##.######', // 15  interior pen
  '######.##.########.##.######', // 16  fondo pen
  '######.##..........##.######', // 17
  '######.#####.##.#####.######', // 18
  '######.#####.##.#####.######', // 19
  '#............##............#', // 20
  '#.####.#####.##.#####.####.#', // 21
  '#.####.#####.##.#####.####.#', // 22
  '#...##................##...#', // 23  fila inicio Pacman (13,23)
  '###.##.##.########.##.##.###', // 24
  '###.##.##.########.##.##.###', // 25
  '#......##....##....##......#', // 26
  '#.##########.##.##########.#', // 27
  '#.##########.##.##########.#', // 28
  '#O...........##...........O#', // 29  power pellets en esquinas (1,29) y (26,29)
  '############################', // 30  borde
];

function parseTile( ch ) {
  if ( ch === '#' ) return 1;
  if ( ch === '.' ) return 2;
  if ( ch === '-' ) return 3;
  if ( ch === 'O' ) return 4;
  return 0; // espacio = vacio transitable
}

// Matriz numerica pristina (no se muta; cada partida copia esto).
const MAZE = MAZE_STR.map( ( row ) => row.split( '' ).map( parseTile ) );

const TUNNEL_ROW = 14;
const PACMAN_START = { x: 13, y: 23 };
const GHOST_STARTS = [
  { x: 13, y: 14, kind: 'blinky', speed: 0.125, releaseDelay: 0 },
  { x: 13, y: 15, kind: 'pinky', speed: 0.11, releaseDelay: 240 },
  { x: 14, y: 14, kind: 'inky', speed: 0.1, releaseDelay: 480 },
  { x: 14, y: 15, kind: 'clyde', speed: 0.09, releaseDelay: 720 },
];

const SCATTER_TARGETS = {
  blinky: { x: 25, y: 0 },
  pinky: { x: 2, y: 0 },
  inky: { x: 25, y: 30 },
  clyde: { x: 2, y: 30 },
};

const POWER_PELLET = 4;

window.MAZE = MAZE;
window.TUNNEL_ROW = TUNNEL_ROW;
window.PACMAN_START = PACMAN_START;
window.GHOST_STARTS = GHOST_STARTS;
window.SCATTER_TARGETS = SCATTER_TARGETS;
window.POWER_PELLET = POWER_PELLET;
