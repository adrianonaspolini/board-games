// Roteiros que vencem cada fase, usando só os 5 comandos do jogador.
import { col, hold, settle, until } from './helpers.js';

const at = (c, r) => (w) => col(w) === c && w.hero.row === r;

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

/** Luta até o guarda mais próximo cair. */
export function duel(w, dirKey = 'R') {
  until(w, dirKey, (x) => x.hero.state === 'fight', 300);
  for (let i = 0; i < 400; i++) {
    const g = w.guards.find((x) => x.state !== 'dead' && x.row === w.hero.row);
    if (!g) break;
    const dist = Math.abs(g.x - w.hero.x);
    if (g.state === 'strike' && g.t >= 2 && g.t <= 5) {
      hold(w, 'U', 1);
      hold(w, '', 5);
      hold(w, 'A', 1);
      hold(w, '', 20);
    } else if (dist > 42) {
      hold(w, w.hero.dir > 0 ? 'R' : 'L', 1);
      hold(w, '', 9);
    } else if (w.hero.state === 'fight') {
      hold(w, 'A', 1);
      hold(w, '', 22);
    } else {
      hold(w, '', 1);
    }
    if (w.hero.state === 'dead') throw new Error('herói morreu no duelo');
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
  // Fase 1
  (w) => {
    stepTo(w, 4); // até a beira dos espinhos
    stepTo(w, 6); // atravessa os espinhos com cuidado
    runTo(w, 7);
    climbUp(w); // sobe para o andar 1
    until(w, '', at(8, 1), 1);
    runningJump(w, 13 * 32 + 20); // salta o vão de 2 blocos
    runTo(w, 18);
    climbUp(w); // sobe para a placa
    runTo(w, 21); // pisa na placa e segue até a borda
    stepToEdge(w);
    climbDownAndDrop(w);
    runTo(w, 25); // passa o portão e pisa na placa da saída
    duel(w);
    runTo(w, 28);
    enterExit(w);
  },

  // Fase 2
  (w) => {
    runTo(w, 10); // passa correndo pelo piso solto (coluna 6)
    passBlade(w, 11, 13);
    runTo(w, 16);
    stepToEdge(w);
    climbDownAndDrop(w); // soltar da borda: 2 andares sem dano
    if (w.hero.hp !== 3) throw new Error('não deveria machucar');
    runTo(w, 20); // atravessa o piso solto da coluna 18
    drink(w);
    duel(w, 'R');
    runTo(w, 26);
    until(w, '', (x) => x.gates.get('27,4').open >= 1, 200);
    runTo(w, 28);
    enterExit(w);
  },

  // Fase 3
  (w) => {
    stepTo(w, 4);
    stepTo(w, 7); // espinhos com cuidado
    runTo(w, 8);
    runningJump(w, 9 * 32 + 20); // vão mortal
    duel(w, 'R');
    runTo(w, 20); // pisa na placa que abre o portão
    hold(w, 'RU', 3); // pulo parado por cima da placa que fecha
    until(w, '', (x) => x.hero.state === 'stand', 100);
    if (col(w) !== 22) throw new Error(`pulo parado caiu na coluna ${col(w)}`);
    until(w, '', (x) => x.gates.get('23,5').open >= 1, 200);
    runTo(w, 28);
    climbUp(w); // sobe para o andar 4, virado para a esquerda
    runTo(w, 25); // passa pelo piso solto (coluna 26)
    passBlade(w, 24, 23);
    duel(w, 'L');
    runTo(w, 16);
    drink(w);
    runTo(w, 13);
    climbUp(w); // andar 3
    runningJump(w, 9 * 32 + 10, 'L');
    stepTo(w, 5);
    stepTo(w, 3); // espinhos
    stepTo(w, 2);
    climbUp(w); // andar 2
    runningJump(w, 7 * 32 + 20);
    stepTo(w, 13);
    stepTo(w, 15); // espinhos
    climbUp(w); // poção grande
    runTo(w, 17);
    drink(w);
    runTo(w, 18);
    stepToEdge(w);
    climbDownAndDrop(w);
    duel(w, 'R');
    runTo(w, 24);
    runTo(w, 27);
    enterExit(w);
  },
];
