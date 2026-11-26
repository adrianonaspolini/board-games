import { describe, expect, it } from 'vitest';
import { Level } from '../src/engine/level.js';
import { col, hold, mk, settle, until } from './helpers.js';

describe('mapa', () => {
  it('topo de parede serve de piso e o mapa precisa de múltiplos de 10x3', () => {
    const lv = new Level({
      name: 't',
      map: ['..........', '.....W....', '#####W####'],
    });
    expect(lv.floorAt(5, 0)).toBe(true);
    expect(lv.floorAt(4, 0)).toBe(false);
    expect(lv.floorAt(5, 1)).toBe(false);
    expect(lv.floorAt(4, 2)).toBe(true);
    expect(() => new Level({ name: 't', map: ['###'] })).toThrow();
    expect(() => new Level({ name: 't', map: ['?'.repeat(10), '#'.repeat(10), '#'.repeat(10)] })).toThrow();
  });
});

describe('andar e correr', () => {
  it('corre para a direita e para ao bater na parede', () => {
    const w = mk(['WS#######W']);
    until(w, 'R', (x) => x.hero.state === 'bump', 200);
    expect(col(w)).toBe(8);
    settle(w);
    expect(w.hero.state).toBe('stand');
  });

  it('vira para o outro lado', () => {
    const w = mk(['WS#######W']);
    hold(w, 'L', 10);
    settle(w);
    expect(w.hero.dir).toBe(-1);
  });

  it('passo cuidadoso para na borda sem cair', () => {
    const w = mk([
      'WS##......',
      'W#########',
    ]);
    for (let i = 0; i < 8; i++) {
      hold(w, 'RA', 1);
      hold(w, '', 16);
    }
    expect(w.hero.state).not.toBe('fall');
    expect(w.hero.row).toBe(w.level.rows - 2);
    expect(col(w)).toBe(3);
    expect(w.hero.x).toBeGreaterThan(3 * 32 + 26);
  });
});

describe('quedas', () => {
  const pit = (depth) => {
    const rows = ['WS#.......'];
    for (let i = 0; i < depth - 1; i++) rows.push('W##.......');
    rows.push('##########');
    return mk(rows.length % 3 ? rows : rows, {});
  };

  it('cair 1 andar não machuca', () => {
    const w = pit(1);
    until(w, 'R', (x) => x.hero.state === 'land', 300);
    settle(w);
    expect(w.hero.hp).toBe(3);
  });

  it('cair 2 andares tira 1 de vida', () => {
    const w = pit(2);
    until(w, 'R', (x) => x.hero.state === 'land', 300);
    settle(w);
    expect(w.hero.hp).toBe(2);
  });

  it('cair 3 andares mata', () => {
    const w = pit(3);
    until(w, 'R', (x) => x.hero.state === 'dead', 300);
    expect(w.hero.deathCause).toBe('fall');
    hold(w, '', 120);
    expect(w.status).toBe('dead');
  });
});

describe('bordas', () => {
  const ledge = () => mk([
    'W....####W',
    'W.S######W',
  ]);

  it('pula, agarra a borda de cima e sobe', () => {
    const w = ledge();
    // Anda até debaixo da beirada (coluna 4, que fica sob o vão).
    until(w, 'RA', (x) => col(x) === 4, 300);
    settle(w);
    hold(w, 'U', 1);
    until(w, '', (x) => x.hero.state === 'hang', 30);
    until(w, 'U', (x) => x.hero.state === 'stand', 60);
    expect(w.hero.row).toBe(w.level.rows - 2);
    expect(col(w)).toBe(5);
  });

  it('desce pela borda e solta', () => {
    const w = ledge();
    until(w, 'RA', (x) => col(x) === 4, 300);
    settle(w);
    hold(w, 'U', 1);
    until(w, 'U', (x) => x.hero.state === 'stand' && x.hero.row === 1, 120);
    // Agora no andar de cima, na coluna 5, com o vão atrás (coluna 4).
    hold(w, 'D', 1);
    until(w, '', (x) => x.hero.state === 'hang', 40);
    hold(w, 'D', 1);
    until(w, '', (x) => x.hero.state === 'stand', 80);
    expect(w.hero.row).toBe(2);
    expect(w.hero.hp).toBe(3);
  });

  it('sem borda acima, só pula no lugar', () => {
    const w = mk(['WS#######W']);
    hold(w, 'U', 1);
    hold(w, '', 30);
    expect(w.hero.state).toBe('stand');
    expect(col(w)).toBe(1);
  });
});

describe('pulos', () => {
  it('pulo correndo atravessa um vão de 2 blocos', () => {
    const w = mk([
      'WS####..##',
      'W#########',
    ]);
    // corre e pula ao chegar na coluna 5
    until(w, 'R', (x) => col(x) === 5 && x.hero.x > 5 * 32 + 8, 200);
    hold(w, 'RU', 1);
    until(w, 'R', (x) => x.hero.state === 'land' || x.hero.state === 'fall', 120);
    until(w, '', (x) => x.hero.state !== 'jump', 60);
    settle(w);
    expect(w.hero.row).toBe(1);
    expect(col(w)).toBeGreaterThanOrEqual(8);
  });

  it('pulo parado atravessa um vão de 1 bloco', () => {
    const w = mk([
      'WS###.####',
      'W#########',
    ]);
    for (let i = 0; i < 12; i++) {
      hold(w, 'RA', 1);
      hold(w, '', 16);
    }
    expect(col(w)).toBe(4);
    expect(w.hero.x).toBeGreaterThan(4 * 32 + 26);
    hold(w, 'RU', 3);
    hold(w, '', 60);
    settle(w);
    expect(w.hero.row).toBe(1);
    expect(col(w)).toBeGreaterThanOrEqual(6);
  });

  it('pulo curto: segurando ação, agarra a borda do outro lado', () => {
    const w = mk([
      'WS###...##',
      'W####...##',
      'W#########',
    ]);
    until(w, 'R', (x) => col(x) === 4 && x.hero.x > 4 * 32 + 16, 200);
    hold(w, 'RU', 1);
    until(w, 'A', (x) => ['hang', 'land', 'dead'].includes(x.hero.state), 120);
    expect(w.hero.state).toBe('hang');
    until(w, 'U', (x) => x.hero.state === 'stand', 60);
    expect(w.hero.row).toBe(0);
    expect(col(w)).toBe(8);
  });
});
