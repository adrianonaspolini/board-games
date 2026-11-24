// Legenda dos blocos usados nos mapas das fases (um caractere por célula).
//
// Cada célula tem um "piso" na parte de baixo. Um personagem "no andar r"
// pisa no piso da célula (c, r). Paredes (W) são maciças: bloqueiam a
// passagem e o topo delas serve de piso para a célula de cima.

export const T = Object.freeze({
  EMPTY: '.',
  FLOOR: '#',
  WALL: 'W',
  SPIKES: '^',
  LOOSE: '~',
  GATE: 'G',
  PLATE: 'p', // placa que abre portões
  CLOSER: 'x', // placa que fecha portões
  BLADE: 'B',
  POTION: 'h', // poção pequena: +1 de vida
  BIG_POTION: 'H', // poção grande: +1 de vida máxima
  EXIT: 'E',
  EXIT_PLATE: 'k', // placa que abre a saída
  START: 'S',
  GUARD: 'g',
  TORCH: 'T',
  COLUMN: '|',
});

const WITH_FLOOR = new Set([
  T.FLOOR, T.SPIKES, T.LOOSE, T.GATE, T.PLATE, T.CLOSER, T.BLADE, T.POTION,
  T.BIG_POTION, T.EXIT, T.EXIT_PLATE, T.START, T.GUARD, T.TORCH, T.COLUMN,
]);

export function tileHasFloor(ch) {
  return WITH_FLOOR.has(ch);
}

export function isKnownTile(ch) {
  return ch === T.EMPTY || ch === T.WALL || WITH_FLOOR.has(ch);
}
