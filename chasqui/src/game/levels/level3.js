// Fase 3 — "Rumo a Cusco" (altitude alta: o fôlego acaba rápido): apacheta,
// portão de uma fortaleza (pukara) com placas, quatro batedores e a
// chegada a Cusco.
//
//          0         1         2
//          012345678901234567890123456789
export default {
  name: 'Rumo a Cusco',
  theme: 'peaks',
  altitude: 1,
  startDir: 1,
  map: [
    'W............................W', // 0
    'W................F...........W', // 1
    'WW.###..##C##g########k#g##E#W', // 2
    'WW###^####.WWWWWWWWWWWWWWWWWWW', // 3
    'WWWWWWWWWW##~###g##h##^##C##.W', // 4
    'WS###H###..####g##p##x#G#####W', // 5
  ],
  links: [
    { plate: [18, 5], gates: [[23, 5]] },
    { plate: [21, 5], gates: [[23, 5]] },
  ],
  // Na ordem em que aparecem no mapa (linha a linha).
  guards: [
    { hp: 3, skill: 0.35, weapon: 'maca' },
    { hp: 3, skill: 0.45, weapon: 'funda' },
    { hp: 2, skill: 0.3, weapon: 'funda' },
    { hp: 2, skill: 0.25, weapon: 'maca' },
  ],
};
