// Fase 1 — "Terraços do Vale" (altitude baixa): espinheiros, subir os
// terraços, pedra solta, posto de chasqui e o primeiro batedor rival.
//
//          0         1         2
//          012345678901234567890123456789
export default {
  name: 'Terraços do Vale',
  theme: 'valley',
  altitude: 0,
  startDir: 1,
  map: [
    'W............................W', // 0
    'W.......................F....W', // 1
    'W..................###C##khgEW', // 2
    'W..............####WWWWWWWWWWW', // 3
    'W.........##~##WWWWWWWWWWWWWWW', // 4
    'WS###^####WW#WWWWWWWWWWWWWWWWW', // 5
  ],
  links: [],
  guards: [{ hp: 2, skill: 0.15, weapon: 'maca' }],
};
