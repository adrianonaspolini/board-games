// Fase 2 — "As Cisternas": piso solto, lâmina, descer com cuidado
// (soltar da borda em vez de pular) e um guarda mais firme.
//
//          0         1         2
//          012345678901234567890123456789
export default {
  name: 'As Cisternas',
  startDir: 1,
  map: [
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // 0
    'W......................#H#...W', // 1
    'WS####~####B#####.###########W', // 2
    'WWWWWWWWWWWWWWWWW.WWWWWWWWWWWW', // 3
    'WWWWWWWWWWWWWWWWW#~#h###gpkGEW', // 4
    'WWWWWWWWWWWWWWWWWW#WWWWWWWWWWW', // 5
  ],
  links: [{ plate: [25, 4], gates: [[27, 4]] }],
  guards: [{ hp: 3, skill: 0.3 }],
};
