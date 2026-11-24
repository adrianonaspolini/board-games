// Fase 1 — "O Pátio": ensina passo cuidadoso, escalar, pulo correndo,
// placa e portão, e um primeiro duelo.
//
//          0         1         2
//          012345678901234567890123456789
export default {
  name: 'O Pátio',
  startDir: 1,
  map: [
    'WWWWWWWWWWWWWWWWWW.#p#.WWWWWWW', // 0
    'W.......#T####..########Gk#gEW', // 1
    'WS###^####W#h#######WWWWWWWWWW', // 2
  ],
  links: [{ plate: [20, 0], gates: [[24, 1]] }],
  guards: [{ hp: 2, skill: 0.15 }],
};
