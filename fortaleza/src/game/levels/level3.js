// Fase 3 — "A Torre": subida em zigue-zague, placa que fecha o portão,
// três guardas e a saída no alto.
//
//          0         1         2
//          012345678901234567890123456789
export default {
  name: 'A Torre',
  startDir: 1,
  map: [
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // 0
    'W...............#H#..........W', // 1
    'WW.###|#..####^#####g###k##E#W', // 2
    'WW##^##..####.WWWWWWWWWWWWWWWW', // 3
    'WWWWWWW..WWW####h##g####B#~#.W', // 4
    'WS###^^###..####g#p##x#G#####W', // 5
  ],
  links: [
    { plate: [18, 5], gates: [[23, 5]] },
    { plate: [21, 5], gates: [[23, 5]] },
  ],
  // Na ordem em que aparecem no mapa (linha a linha).
  guards: [
    { hp: 4, skill: 0.5 },
    { hp: 3, skill: 0.4 },
    { hp: 3, skill: 0.3 },
  ],
};
