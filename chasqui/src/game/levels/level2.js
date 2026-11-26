// Fase 2 — "A Ponte do Apurímac": ponte de corda com tábuas gastas sobre o
// desfiladeiro, pedras que despencam e um fundeiro na outra margem.
//
//          0         1         2
//          012345678901234567890123456789
export default {
  name: 'A Ponte do Apurímac',
  theme: 'gorge',
  altitude: 0.4,
  startDir: 1,
  map: [
    'W...F.................F......W', // 0
    'WS######RRRrRRRRrRRRC##^#g#kEW', // 1
    'WWWWWWWW............WWWWWWWWWW', // 2
  ],
  links: [],
  guards: [{ hp: 2, skill: 0.25, weapon: 'funda' }],
};
