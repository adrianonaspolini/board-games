import { describe, expect, it } from 'vitest';
import { GATE_OPEN_TICKS } from '../src/game/world.js';
import { col, hold, mk, settle, until } from './helpers.js';

const steps = (w, n) => {
  for (let i = 0; i < n; i++) {
    hold(w, 'RA', 1);
    hold(w, '', 14);
  }
};

describe('espinhos', () => {
  it('correr sobre os espinhos mata', () => {
    const w = mk(['WS##^####W']);
    until(w, 'R', (x) => x.hero.state === 'dead', 200);
    expect(w.hero.deathCause).toBe('spikes');
  });

  it('passo cuidadoso atravessa os espinhos', () => {
    const w = mk(['WS##^####W']);
    steps(w, 16);
    expect(w.hero.state).not.toBe('dead');
    expect(col(w)).toBeGreaterThanOrEqual(5);
  });

  it('cair em cima dos espinhos mata', () => {
    const w = mk(['WS#.......', 'W##^######']);
    until(w, 'R', (x) => ['dead', 'land'].includes(x.hero.state), 200);
    expect(w.hero.state).toBe('dead');
  });
});

describe('placas e portões', () => {
  const map = () => mk(['WS#p##G##W'], { links: [{ plate: [3, 2], gates: [[6, 2]] }] });

  it('portão fechado bloqueia a passagem', () => {
    const w = mk(['WS####G##W'], { links: [] });
    until(w, 'R', (x) => x.hero.state === 'bump', 200);
    expect(col(w)).toBe(6);
    expect(w.hero.x).toBeLessThan(6 * 32 + 16);
  });

  it('a placa abre o portão, que fecha depois de um tempo', () => {
    const w = map();
    until(w, 'R', (x) => x.gates.get('6,2').open >= 1, 300);
    // passa pelo portão aberto
    until(w, 'R', (x) => col(x) >= 7, 200);
    settle(w);
    hold(w, '', GATE_OPEN_TICKS + 200);
    expect(w.gates.get('6,2').open).toBe(0);
  });

  it('placa de fechar bate o portão', () => {
    const w = mk(['WS#p#x#G#W'], {
      links: [{ plate: [3, 2], gates: [[7, 2]] }, { plate: [5, 2], gates: [[7, 2]] }],
    });
    until(w, 'RA', (x) => col(x) === 3, 300);
    hold(w, '', 60);
    expect(w.gates.get('7,2').open).toBeGreaterThan(0.9);
    until(w, 'RA', (x) => col(x) === 5, 300);
    hold(w, '', 12);
    expect(w.gates.get('7,2').open).toBe(0);
  });

  it('placa sem portão ligado é erro de fase', () => {
    expect(() => mk(['WS#p#G###W'])).toThrow(/sem portão/);
  });
});

describe('piso solto', () => {
  it('desaba sob o herói, que cai para o andar de baixo', () => {
    const w = mk(['WS#~##....', 'W#########']);
    until(w, 'RA', (x) => col(x) === 3, 300);
    until(w, '', (x) => x.hero.state === 'land' || x.hero.state === 'fall', 100);
    settle(w);
    expect(w.hero.row).toBe(2);
    expect(w.level.tile(3, 1)).toBe('.');
  });

  it('pular embaixo derruba o piso solto, e o entulho prende a placa', () => {
    const w = mk(['W..~......', 'WS#p###G##'], { links: [{ plate: [3, 2], gates: [[7, 2]] }] });
    until(w, 'RA', (x) => col(x) === 2, 300);
    settle(w);
    hold(w, 'U', 1);
    hold(w, '', 80);
    expect(w.level.tile(3, 1)).toBe('.');
    expect(w.plates.get('3,2').rubble).toBe(true);
    hold(w, '', GATE_OPEN_TICKS + 300);
    expect(w.gates.get('7,2').open).toBe(1);
  });

  it('entulho que cai na cabeça machuca', () => {
    const w = mk(['W..~......', 'WS########']);
    // Fica exatamente embaixo e bate no teto com um pulo.
    until(w, 'RA', (x) => col(x) === 3 && x.hero.x > 3 * 32 + 10, 400);
    settle(w);
    hold(w, 'U', 1);
    hold(w, '', 80);
    expect(w.hero.hp).toBe(2);
  });
});

describe('lâminas', () => {
  it('passar na hora errada mata; na hora certa, não', () => {
    const w = mk(['WS##B####W']);
    until(w, 'R', (x) => x.hero.state === 'dead' || col(x) >= 7, 300);
    // Com tempo fixo é determinístico: verificamos os dois casos
    // esperando a lâmina abrir antes de passar.
    const w2 = mk(['WS##B####W']);
    steps(w2, 5);
    until(w2, '', (x) => !x.bladeDeadly(4) && (x.tick + 4 * 37) % 120 === 20, 300);
    until(w2, 'R', (x) => col(x) >= 6 || x.hero.state === 'dead', 100);
    expect(w2.hero.state).not.toBe('dead');
  });
});

describe('poções e saída', () => {
  it('poção pequena cura 1; grande aumenta a vida máxima', () => {
    const w = mk(['WSh#H####W'], { opts: { hp: 1, maxHp: 3 } });
    until(w, 'RA', (x) => col(x) === 2, 300);
    settle(w);
    hold(w, 'A', 1);
    hold(w, '', 50);
    expect(w.hero.hp).toBe(2);
    expect(w.level.tile(2, 2)).toBe('#');
    until(w, 'RA', (x) => col(x) === 4, 300);
    settle(w);
    hold(w, 'A', 1);
    hold(w, '', 50);
    expect(w.hero.maxHp).toBe(4);
    expect(w.hero.hp).toBe(4);
  });

  it('a placa abre a saída e o herói entra', () => {
    const w = mk(['WS#k##E##W']);
    until(w, 'R', (x) => col(x) === 6, 300);
    until(w, '', (x) => x.hero.state === 'stand', 60);
    hold(w, '', 100);
    expect(w.exitOpen).toBe(1);
    hold(w, 'U', 1);
    hold(w, '', 60);
    expect(w.status).toBe('won');
  });

  it('saída fechada: cima só pula', () => {
    const w = mk(['WS###E###W']);
    until(w, 'R', (x) => col(x) === 5, 300);
    settle(w);
    hold(w, 'U', 1);
    hold(w, '', 60);
    expect(w.status).toBe('playing');
  });
});
