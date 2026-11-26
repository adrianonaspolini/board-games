import { describe, expect, it } from 'vitest';
import { hold, mk, until } from './helpers.js';

const arena = (guard = {}) => mk(['WS#######g'.padEnd(10, '#') + '#########W'], {
  guards: [{ hp: 2, skill: 0, ...guard }],
});

/** Gira a funda e espera a pedra terminar o voo. */
function sling(w) {
  hold(w, 'A', 1);
  hold(w, '', 40);
}

describe('combate', () => {
  it('o chasqui prepara a funda ao ver um batedor', () => {
    const w = arena();
    until(w, 'R', (x) => x.hero.state === 'fight', 300);
    expect(w.hero.dir).toBe(1);
  });

  it('pedras de funda derrubam o batedor à distância', () => {
    const w = arena({ weapon: 'maca' });
    until(w, 'R', (x) => x.hero.state === 'fight', 300);
    for (let i = 0; i < 10 && w.guards[0].state !== 'dead'; i++) sling(w);
    expect(w.guards[0].state).toBe('dead');
    hold(w, '', 10);
    expect(w.hero.state).toBe('stand');
  });

  it('a pedra para na parede', () => {
    const w = mk(['WS##W#####'], {});
    w.hero.state = 'fight';
    hold(w, 'A', 1);
    hold(w, '', 30);
    expect(w.projectiles).toHaveLength(0);
  });

  it('batedor habilidoso se abaixa e a pedra passa por cima', () => {
    const w = arena({ skill: 1, hp: 3 });
    until(w, 'R', (x) => x.hero.state === 'fight', 300);
    let dodged = false;
    for (let i = 0; i < 4; i++) {
      hold(w, 'A', 1);
      for (let k = 0; k < 40; k++) {
        hold(w, '', 1);
        if (w.guards[0].state === 'parry') dodged = true;
      }
    }
    expect(dodged).toBe(true);
    expect(w.guards[0].hp).toBe(3);
  });

  it('abaixar (cima) desvia da maça', () => {
    const w = arena({ skill: 0.5, hp: 9 });
    until(w, 'R', (x) => x.hero.state === 'fight', 300);
    let dodges = 0;
    for (let i = 0; i < 4000 && dodges === 0; i++) {
      const g = w.guards[0];
      const up = g.state === 'strike' && g.t >= 3 && g.t <= 5;
      w.step({ up });
      if (g.state === 'strike' && g.t === 11 && w.hero.state === 'parry') dodges++;
    }
    expect(dodges).toBe(1);
    expect(w.hero.hp).toBe(3);
  });

  it('pedras do fundeiro também acertam o chasqui, e abaixar desvia', () => {
    const w = arena({ weapon: 'funda', skill: 0.6, hp: 9 });
    until(w, 'R', (x) => x.hero.state === 'fight', 300);
    const t0 = w.tick;
    until(w, '', (x) => x.hero.hp < 3, 3000);
    expect(w.tick).toBeGreaterThan(t0);
    // agora esquiva toda pedra que chega
    const hp = w.hero.hp;
    for (let i = 0; i < 1500; i++) {
      const danger = w.projectiles.some((p) => p.owner === 'guard' && Math.abs(p.x - w.hero.x) < 30);
      w.step({ up: danger && w.hero.state === 'fight' });
    }
    expect(w.hero.hp).toBe(hp);
  });

  it('sem reagir, o chasqui acaba derrotado', () => {
    const w = arena({ skill: 0.6, hp: 3 });
    until(w, 'R', (x) => x.hero.state === 'fight', 300);
    until(w, '', (x) => x.hero.state === 'dead', 4000);
    expect(w.hero.deathCause).toBe('mace');
  });
});
