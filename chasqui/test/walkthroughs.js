// Roteiros que vencem cada fase, usando só os 5 comandos do jogador.
import { col, hold, settle, until } from './helpers.js';


/** Passos cuidadosos até a coluna c (ou até a borda). */
export function stepTo(w, c, max = 40) {
  const dirKey = c > col(w) ? 'R' : 'L';
  for (let i = 0; i < max && col(w) !== c; i++) {
    hold(w, `${dirKey}A`, 1);
    hold(w, '', 14);
  }
  settle(w);
}

/** Passos cuidadosos até a ponta do pé ficar na borda à frente. */
export function stepToEdge(w, max = 20) {
  const key = w.hero.dir > 0 ? 'R' : 'L';
  for (let i = 0; i < max; i++) {
    hold(w, `${key}A`, 1);
    if (w.hero.state === 'stepEdge') break;
    hold(w, '', 14);
  }
  settle(w);
}

/** Corre até a coluna c. */
export function runTo(w, c) {
  const dirKey = c > col(w) ? 'R' : 'L';
  until(w, dirKey, (x) => col(x) === c, 600);
  settle(w);
}

/** Pula para agarrar a borda acima e sobe. */
export function climbUp(w) {
  hold(w, 'U', 1);
  until(w, '', (x) => x.hero.state === 'hang', 40);
  until(w, 'U', (x) => x.hero.state === 'stand', 80);
}

/** Desce pela borda e solta. */
export function climbDownAndDrop(w) {
  hold(w, 'D', 1);
  until(w, '', (x) => x.hero.state === 'hang', 40);
  hold(w, 'D', 1);
  until(w, '', (x) => ['stand', 'dead'].includes(x.hero.state), 200);
}

/** Corre até o ponto de impulso e dá um pulo correndo. */
export function runningJump(w, takeoffX, dirKey = 'R') {
  until(w, dirKey, (x) => (dirKey === 'R' ? x.hero.x >= takeoffX : x.hero.x <= takeoffX), 400);
  hold(w, `${dirKey}U`, 1);
  until(w, `${dirKey}A`, (x) => !['jump', 'fall'].includes(x.hero.state), 200);
  settle(w);
}

/** Combate com a funda até os batedores do andar caírem, esquivando de
 * pedras e golpes de maça. */
export function duel(w, dirKey = 'R') {
  until(w, dirKey, (x) => x.hero.state === 'fight', 600);
  for (let i = 0; i < 3000; i++) {
    const h = w.hero;
    if (h.state === 'dead') throw new Error('o chasqui caiu no combate');
    const foes = w.guards.filter((g) => g.state !== 'dead' && g.row === h.row);
    if (!foes.length || h.state === 'stand') break;
    const g = foes.reduce((a, b) => (Math.abs(a.x - h.x) < Math.abs(b.x - h.x) ? a : b));
    const stone = w.projectiles.some((p) => p.owner === 'guard' && p.row === h.row &&
      Math.sign(h.x - p.x) === Math.sign(p.vx) && Math.abs(p.x - h.x) < 120);
    const mace = g.weapon === 'maca' && g.state === 'strike' && g.t <= 8 && Math.abs(g.x - h.x) < 56;
    const threat = stone || mace || (g.weapon === 'maca' && Math.abs(g.x - h.x) < 50 && g.state === 'fight');
    if (h.state === 'fight') {
      if (stone && w.projectiles.some((p) => p.owner === 'guard' && Math.abs(p.x - h.x) < 30)) {
        hold(w, 'U', 1);
      } else if (mace && g.t >= 3) {
        hold(w, 'U', 1);
      } else if (!threat) {
        hold(w, 'A', 1);
      } else {
        hold(w, '', 1);
      }
    } else {
      hold(w, '', 1);
    }
  }
  settle(w);
}

/** Espera a lâmina da coluna c abrir e passa correndo até a coluna alvo. */
export function passBlade(w, c, target) {
  until(w, '', (x) => (x.tick + c * 37) % 120 === 16, 200);
  runTo(w, target);
}

/** Bebe a poção em que o herói está. */
export function drink(w) {
  hold(w, 'A', 1);
  until(w, '', (x) => x.hero.state === 'stand', 80);
}

export function enterExit(w) {
  until(w, '', (x) => x.exitOpen >= 1, 200);
  hold(w, 'U', 1);
  until(w, '', (x) => x.status === 'won', 100);
}

export const WALKTHROUGHS = [
  // Fase 1 — Terraços do Vale
  (w) => {
    stepTo(w, 4);
    stepTo(w, 6); // espinheiro com cuidado
    runTo(w, 9);
    climbUp(w); // primeiro terraço
    runTo(w, 14); // passa correndo pela pedra solta
    climbUp(w); // segundo terraço
    runTo(w, 18);
    climbUp(w); // caminho de cima
    duel(w, 'R');
    runTo(w, 25); // placa que abre a saída
    runTo(w, 28);
    enterExit(w);
  },

  // Fase 2 — A Ponte do Apurímac
  (w) => {
    runTo(w, 20); // atravessa a ponte correndo (tábuas fracas)
    duel(w, 'R');
    stepTo(w, 22);
    stepTo(w, 24); // espinheiro
    runTo(w, 27);
    runTo(w, 28);
    enterExit(w);
  },

  // Fase 3 — Rumo a Cusco
  (w) => {
    runTo(w, 5);
    drink(w); // deixa uma pedra na apacheta: +1 de vida máxima
    runningJump(w, 8 * 32 + 20); // vão mortal
    duel(w, 'R');
    runTo(w, 20); // pisa na placa que abre o portão
    hold(w, 'RU', 3); // pulo parado por cima da placa que fecha
    until(w, '', (x) => x.hero.state === 'stand', 100);
    if (col(w) !== 22) throw new Error(`pulo parado caiu na coluna ${col(w)}`);
    until(w, '', (x) => x.gates.get('23,5').open >= 1, 200);
    runTo(w, 28);
    climbUp(w); // andar 4, virado para a esquerda
    runTo(w, 24); // passa pelo posto (coluna 25)
    stepTo(w, 23);
    stepTo(w, 21); // espinheiro
    duel(w, 'L'); // fundeiro
    runTo(w, 19);
    drink(w); // cancha
    runTo(w, 10); // corre sobre a pedra solta (coluna 12)
    climbUp(w); // andar 3
    stepTo(w, 6);
    stepTo(w, 4); // espinheiro
    runTo(w, 2);
    climbUp(w); // andar 2
    runningJump(w, 5 * 32 + 20);
    duel(w, 'R'); // batedor com maça
    duel(w, 'R'); // fundeiro
    runTo(w, 22); // placa da saída
    runTo(w, 27);
    enterExit(w);
  },
];
