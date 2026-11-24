import { describe, expect, it } from 'vitest';
import { hold, mk, until } from './helpers.js';

const arena = (guard = {}) => mk(['WS#####g#W'], { guards: [{ hp: 2, skill: 0, ...guard }] });

describe('combate', () => {
  it('o herói entra em guarda ao se aproximar do guarda', () => {
    const w = arena();
    until(w, 'R', (x) => x.hero.state === 'fight', 200);
    expect(w.hero.dir).toBe(1);
    expect(w.guards[0].state).not.toBe('idle');
  });

  it('golpes acertam e o guarda morre com a vida zerada', () => {
    const w = arena();
    until(w, 'R', (x) => x.hero.state === 'fight', 200);
    for (let i = 0; i < 40 && w.guards[0].state !== 'dead'; i++) {
      until(w, 'R', (x) => Math.abs(x.guards[0].x - x.hero.x) < 44 || x.guards[0].state === 'dead', 100);
      hold(w, 'A', 1);
      hold(w, '', 24);
    }
    expect(w.guards[0].state).toBe('dead');
    hold(w, '', 10);
    expect(w.hero.state).toBe('stand');
  });

  it('guarda habilidoso defende e o atacante recua', () => {
    const w = arena({ skill: 1, hp: 3 });
    until(w, 'R', (x) => x.hero.state === 'fight', 200);
    until(w, 'R', (x) => Math.abs(x.guards[0].x - x.hero.x) < 44, 200);
    let blocked = false;
    for (let i = 0; i < 6 && !blocked; i++) {
      hold(w, 'A', 1);
      for (let k = 0; k < 24; k++) {
        hold(w, '', 1);
        if (w.hero.state === 'blocked') blocked = true;
      }
    }
    expect(blocked).toBe(true);
    expect(w.guards[0].hp).toBe(3);
  });

  it('defender (cima) bloqueia o golpe do guarda', () => {
    const w = arena({ skill: 0.5, hp: 3 });
    until(w, 'R', (x) => x.hero.state === 'fight', 200);
    let parried = 0;
    for (let i = 0; i < 2000 && parried === 0; i++) {
      const g = w.guards[0];
      const keys = g.state === 'strike' && g.t >= 2 && g.t <= 4 ? 'U' : '';
      w.step({ left: false, right: false, up: keys === 'U', down: false, action: false });
      if (g.state === 'blocked') parried++;
    }
    expect(parried).toBe(1);
    expect(w.hero.hp).toBe(3);
  });

  it('sem reagir, o herói acaba derrotado', () => {
    const w = arena({ skill: 0.6, hp: 3 });
    until(w, 'R', (x) => x.hero.state === 'fight', 200);
    until(w, '', (x) => x.hero.state === 'dead', 3000);
    expect(w.hero.deathCause).toBe('sword');
  });
});
