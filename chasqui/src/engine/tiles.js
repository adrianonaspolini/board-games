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
  POTION: 'h', // cancha (milho tostado): +1 de vida
  BIG_POTION: 'H', // apacheta: deixar uma pedra dá +1 de vida máxima
  APACHETA_DONE: 'a', // apacheta já usada (decoração)
  ROPE: 'R', // ponte de corda
  WEAK: 'r', // tábua fraca da ponte (desaba como o piso solto)
  ROCKFALL: 'F', // pedra solta na encosta acima: cai quando o herói passa
  POST: 'C', // posto de chasqui: ponto de retorno
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
  T.APACHETA_DONE, T.ROPE, T.WEAK, T.POST,
]);

/** Pisos que desabam depois de alguém pisar. */
export function isCrumbly(ch) {
  return ch === T.LOOSE || ch === T.WEAK;
}

export function tileHasFloor(ch) {
  return WITH_FLOOR.has(ch);
}

export function isKnownTile(ch) {
  return ch === T.EMPTY || ch === T.WALL || ch === T.ROCKFALL || WITH_FLOOR.has(ch);
}
