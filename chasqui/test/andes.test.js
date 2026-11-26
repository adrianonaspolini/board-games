import { describe, expect, it } from 'vitest';
import { col, hold, mk, settle, until } from './helpers.js';

describe('fôlego na altitude', () => {
  it('no vale, correr não cansa', () => {
    const w = mk(['WS##################W'.slice(0, 20)], { altitude: 0 });
    until(w, 'R', (x) => col(x) >= 15, 400);
    expect(w.hero.breath).toBe(100);
  });

  it('no alto, correr muito deixa o chasqui sem fôlego', () => {
    const row = 'WS' + '#'.repeat(37) + 'W';
    const w = mk([row], { altitude: 1 });
    until(w, 'R', (x) => x.hero.state === 'gasp', 600);
    expect(w.hero.breath).toBe(0);
    hold(w, 'R', 30);
    expect(w.hero.state).toBe('gasp'); // não consegue correr enquanto arfa
    until(w, '', (x) => x.hero.state === 'stand', 200);
    hold(w, '', 120);
    expect(w.hero.breath).toBeGreaterThan(50);
  });
});

describe('ponte de corda', () => {
  it('a tábua fraca arrebenta sob o chasqui', () => {
    const w = mk(['WS#RRrRR##', 'W.........', 'W#########']);
    until(w, 'RA', (x) => col(x) === 5, 400);
    until(w, '', (x) => x.hero.state === 'fall' || x.hero.state === 'land', 100);
    expect(w.level.tile(5, 0)).toBe('.');
  });

  it('correndo, dá para atravessar antes de a tábua cair', () => {
    const w = mk(['WS#RRrRR##', 'W.........', 'W#########']);
    until(w, 'R', (x) => col(x) === 8, 300);
    expect(w.hero.row).toBe(0);
  });
});

describe('pedras que despencam', () => {
  it('a pedra cai quando o chasqui passa embaixo e machuca', () => {
    const w = mk(['W...F.....', 'WS########']);
    until(w, 'RA', (x) => col(x) === 4, 400);
    settle(w);
    hold(w, '', 80);
    expect(w.hero.hp).toBe(2);
  });

  it('correndo, passa antes da pedra cair', () => {
    const w = mk(['W...F.....', 'WS########']);
    until(w, 'R', (x) => col(x) === 8, 300);
    hold(w, '', 80);
    expect(w.hero.hp).toBe(3);
  });
});

describe('postos e apachetas', () => {
  it('o posto de chasqui vira ponto de retorno', () => {
    const w = mk(['WS##C#####']);
    until(w, 'R', (x) => col(x) === 6, 300);
    expect(w.checkpoint).toEqual([4, 2]);
  });

  it('deixar uma pedra na apacheta dá +1 de vida máxima', () => {
    const w = mk(['WS#H######']);
    until(w, 'RA', (x) => col(x) === 3, 300);
    settle(w);
    hold(w, 'A', 1);
    hold(w, '', 50);
    expect(w.hero.maxHp).toBe(4);
    expect(w.level.tile(3, 2)).toBe('a');
  });
});
