// Desenho no canvas: sala atual (tela fixa), personagens, HUD e mensagens.

import { ROOM_H, ROOM_W, TH, TW } from '../engine/constants.js';
import { T } from '../engine/tiles.js';
import { GUARD_PALETTE, HERO_PALETTE, drawFigure, poseFor } from './figures.js';

export const HUD_H = 16;
const FLOOR_H = 7;

const C = {
  back: '#3d2c1d',
  backBrick: '#4a3624',
  backMortar: '#33241a',
  floorTop: '#d8b47a',
  floor: '#b08953',
  floorEdge: '#7c5a33',
  wall: '#a7824f',
  wallLight: '#c49c62',
  wallDark: '#6f5230',
  gate: '#2a2a2e',
  plate: '#e0c28c',
  spike: '#d9d9d9',
  hudBg: '#120c08',
  hudText: '#f2e2bf',
  life: '#e2483d',
  lifeEmpty: '#4b2420',
  guardLife: '#9fb4c8',
};

/** Ruído determinístico por célula (para variar tijolos). */
const hash = (c, r, k = 0) => {
  let h = (c * 374761393 + r * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;
    this.vw = ROOM_W; // largura visível, em pixels do jogo
    this.vh = ROOM_H;
  }

  /** Ajusta a resolução interna ao tamanho exibido (nítido em telas retina). */
  resize(cssWidth, cssHeight) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);
    // Tela cheia: a sala inteira cabe; o espaço que sobra mostra o entorno.
    this.scale = Math.min(this.canvas.width / ROOM_W, this.canvas.height / ROOM_H);
    this.vw = this.canvas.width / this.scale;
    this.vh = this.canvas.height / this.scale;
  }

  begin() {
    const ctx = this.ctx;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.vw, this.vh);
  }

  drawGame(game, frame) {
    this.begin();
    const world = game.world;
    const { rx, ry } = world.heroRoom();
    const ctx = this.ctx;
    // A sala do herói fica centralizada; ao redor, as salas vizinhas.
    const ox = Math.round((this.vw - ROOM_W) / 2) - rx * ROOM_W;
    const oy = Math.round((this.vh - ROOM_H) / 2) - ry * ROOM_H;
    ctx.save();
    ctx.translate(ox, oy);
    const cA = Math.floor(-ox / TW) - 1;
    const cB = Math.ceil((this.vw - ox) / TW);
    const rA = Math.floor(-oy / TH);
    const rB = Math.ceil((this.vh - oy) / TH);
    for (let r = rA; r <= rB; r++) {
      for (let c = cA; c <= cB; c++) this.drawBack(world, c, r, frame);
    }
    for (let r = rA; r <= rB; r++) {
      for (let c = cA; c <= cB; c++) this.drawCellBehind(world, c, r, frame);
    }
    this.drawRubble(world);
    for (const g of world.guards) this.drawCharacter(g, GUARD_PALETTE, frame);
    this.drawCharacter(world.hero, HERO_PALETTE, frame);
    for (let r = rA; r <= rB; r++) {
      for (let c = cA; c <= cB; c++) this.drawCellFront(world, c, r, frame);
    }
    this.drawDebris(world);
    ctx.restore();

    this.drawHud(game);
    this.drawOverlay(game);
  }

  // ---- Cenário ------------------------------------------------------------

  drawBack(world, c, r, frame) {
    const ctx = this.ctx;
    const x = c * TW;
    const y = r * TH;
    const tile = world.level.tile(c, r);
    if (tile === T.WALL) {
      ctx.fillStyle = C.wall;
      ctx.fillRect(x, y, TW, TH);
      for (let i = 0; i < 4; i++) {
        const by = y + i * 16;
        const shift = (i % 2) * 16;
        ctx.fillStyle = hash(c, r, i) > 0.5 ? C.wallLight : C.wall;
        ctx.fillRect(x + 1, by + 1, TW - 2, 14);
        ctx.fillStyle = C.wallDark;
        ctx.fillRect(x, by + 15, TW, 1);
        ctx.fillRect(x + shift, by, 1, 16);
      }
      return;
    }
    ctx.fillStyle = C.back;
    ctx.fillRect(x, y, TW, TH);
    // Tijolos do fundo
    for (let i = 0; i < 5; i++) {
      const by = y + i * 13;
      const shift = (i % 2) * 11;
      for (let bx = -11 + shift; bx < TW; bx += 22) {
        if (hash(c, r, i * 7 + bx) < 0.45) {
          ctx.fillStyle = C.backBrick;
          ctx.fillRect(x + Math.max(0, bx) + 1, by + 1, Math.min(21, TW - bx) - 2, 11);
        }
      }
    }
    if (tile === T.COLUMN) {
      ctx.fillStyle = '#8a6a40';
      ctx.fillRect(x + 11, y + 4, 10, TH - 10);
      ctx.fillStyle = '#a7824f';
      ctx.fillRect(x + 12, y + 4, 4, TH - 10);
      ctx.fillStyle = '#6f5230';
      ctx.fillRect(x + 8, y + 2, 16, 4);
    }
    if (tile === T.TORCH) {
      const fx = x + 16;
      const fy = y + 20;
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(fx - 1.5, fy, 3, 10);
      const f = Math.sin(frame * 0.3 + c) * 1.5;
      const grad = ctx.createRadialGradient(fx, fy - 4, 1, fx, fy - 4, 22);
      grad.addColorStop(0, 'rgba(255,200,90,0.35)');
      grad.addColorStop(1, 'rgba(255,200,90,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(fx - 22, fy - 26, 44, 44);
      ctx.fillStyle = '#ffb02e';
      ctx.beginPath();
      ctx.ellipse(fx, fy - 4 + f * 0.3, 3, 6 + f, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff0b0';
      ctx.beginPath();
      ctx.ellipse(fx, fy - 2, 1.4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (tile === T.EXIT) this.drawExit(world, x, y);
  }

  drawExit(world, x, y) {
    const ctx = this.ctx;
    const top = y + 8;
    const h = TH - FLOOR_H - 8;
    ctx.fillStyle = '#1b130c';
    ctx.fillRect(x + 4, top, TW - 8, h);
    // Luz do lado de fora quando abre
    const open = world.exitOpen;
    if (open > 0) {
      ctx.fillStyle = `rgba(255,226,150,${0.25 + open * 0.5})`;
      ctx.fillRect(x + 4, top + h * (1 - open), TW - 8, h * open);
    }
    // Porta que sobe
    ctx.fillStyle = '#6b4a2b';
    ctx.fillRect(x + 4, top, TW - 8, h * (1 - open));
    ctx.fillStyle = '#4d331d';
    for (let i = 1; i < 4; i++) ctx.fillRect(x + 4 + i * 6, top, 1, h * (1 - open));
    // Moldura em arco
    ctx.strokeStyle = '#d8b47a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + TH - FLOOR_H);
    ctx.lineTo(x + 3, top + 4);
    ctx.quadraticCurveTo(x + TW / 2, top - 8, x + TW - 3, top + 4);
    ctx.lineTo(x + TW - 3, y + TH - FLOOR_H);
    ctx.stroke();
  }

  hasFloorTile(world, c, r) {
    const t = world.level.tile(c, r);
    return t !== T.WALL && world.level.floorAt(c, r);
  }

  drawCellBehind(world, c, r, frame) {
    const ctx = this.ctx;
    const level = world.level;
    const tile = level.tile(c, r);
    const x = c * TW;
    const y = r * TH;
    const fy = y + TH - FLOOR_H;
    if (!this.hasFloorTile(world, c, r)) return;

    let jitter = 0;
    const lf = world.loose.get(`${c},${r}`);
    if (tile === T.LOOSE) jitter = lf ? Math.sin(frame * 2.1) * 1.2 : 0;

    // Laje do piso
    ctx.fillStyle = C.floor;
    ctx.fillRect(x, fy + jitter, TW, FLOOR_H);
    ctx.fillStyle = C.floorTop;
    ctx.fillRect(x, fy + jitter, TW, 2);
    ctx.fillStyle = C.floorEdge;
    if (!this.hasFloorTile(world, c - 1, r)) ctx.fillRect(x, fy + jitter, 2, FLOOR_H);
    if (!this.hasFloorTile(world, c + 1, r)) ctx.fillRect(x + TW - 2, fy + jitter, 2, FLOOR_H);
    if (tile === T.LOOSE) {
      ctx.fillStyle = '#5c4126';
      ctx.fillRect(x + 9, fy + 2 + jitter, 1, 4);
      ctx.fillRect(x + 21, fy + 1 + jitter, 1, 5);
      ctx.fillRect(x + 9, fy + 4 + jitter, 12, 1);
    }

    if (tile === T.PLATE || tile === T.CLOSER || tile === T.EXIT_PLATE) {
      const plate = world.plates.get(`${c},${r}`);
      const down = plate && plate.down ? 1.5 : 0;
      ctx.fillStyle = tile === T.CLOSER ? '#9c6b5a' : tile === T.EXIT_PLATE ? '#e6cf8a' : C.plate;
      ctx.fillRect(x + 5, fy - 2 + down, TW - 10, 3 - down);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 5, fy + 1, TW - 10, 1);
    }

    if (tile === T.POTION || tile === T.BIG_POTION) {
      const px = x + 16;
      const py = fy;
      const color = tile === T.POTION ? '#e2483d' : '#4fbf6a';
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(px, py - 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d7e3ea';
      ctx.fillRect(px - 1.5, py - 13, 3, 3);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py - 5, tile === T.BIG_POTION ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
      const b = (frame * 0.05 + c) % 1;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(px - 1 + Math.sin(frame * 0.2) , py - 6 - b * 8, 1.2, 1.2);
    }

    if (tile === T.SPIKES) {
      const sp = world.spikes.get(`${c},${r}`);
      const ext = sp ? sp.ext : 0;
      ctx.fillStyle = C.spike;
      const h = 2 + ext * 11;
      for (let i = 0; i < 4; i++) {
        const sx = x + 4 + i * 7;
        ctx.beginPath();
        ctx.moveTo(sx, fy);
        ctx.lineTo(sx + 2.5, fy - h);
        ctx.lineTo(sx + 5, fy);
        ctx.fill();
      }
    }
  }

  drawCellFront(world, c, r, frame) {
    const ctx = this.ctx;
    const tile = world.level.tile(c, r);
    const x = c * TW;
    const y = r * TH;
    if (tile === T.GATE) {
      const gate = world.gates.get(`${c},${r}`);
      const open = gate ? gate.open : 0;
      const gx = x + TW / 2;
      const len = (TH - FLOOR_H) * (1 - open * 0.92);
      ctx.fillStyle = '#5b4a38';
      ctx.fillRect(gx - 5, y, 10, 3);
      ctx.fillStyle = C.gate;
      for (let i = -1; i <= 1; i++) ctx.fillRect(gx + i * 3 - 0.75, y, 1.5, len);
      for (let j = 8; j < len; j += 10) ctx.fillRect(gx - 4.5, y + j, 9, 1.5);
      ctx.fillRect(gx - 4.5, y + len - 2, 9, 2);
    }
    if (tile === T.BLADE) {
      const closed = world.bladeDeadly(c);
      const phase = (world.tick + c * 37) % 120;
      const gap = closed ? 0 : Math.min(9, phase < 24 ? (phase - 14) : 9);
      const bx = x + TW / 2;
      const top = y + 10;
      const bottom = y + TH - FLOOR_H;
      ctx.fillStyle = '#5b4a38';
      ctx.fillRect(bx - 3, top - 4, 6, 4);
      ctx.fillRect(bx - 3, bottom - 2, 6, 2);
      ctx.fillStyle = '#d6dbe0';
      const mid = (top + bottom) / 2;
      ctx.beginPath();
      ctx.moveTo(bx - 2, top);
      ctx.lineTo(bx + 2, top);
      ctx.lineTo(bx + 1, mid - gap);
      ctx.lineTo(bx - 3, mid - gap - 4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx - 2, bottom);
      ctx.lineTo(bx + 2, bottom);
      ctx.lineTo(bx + 3, mid + gap + 4);
      ctx.lineTo(bx - 1, mid + gap);
      ctx.fill();
      if (closed && world.hero.state === 'dead' && world.hero.deathCause === 'blade') {
        ctx.fillStyle = 'rgba(160,20,20,0.8)';
        ctx.fillRect(bx - 2, mid - 6, 4, 12);
      }
    }
    void frame;
  }

  drawRubble(world) {
    const ctx = this.ctx;
    for (const { c, r } of world.rubble) {
      const x = c * TW;
      const fy = r * TH + TH - FLOOR_H;
      ctx.fillStyle = '#8c6c42';
      for (let i = 0; i < 6; i++) {
        const w = 3 + hash(c, r, i) * 4;
        ctx.fillRect(x + 3 + i * 4.5, fy - 2 - hash(c, r, i + 9) * 2, w, 2.5);
      }
    }
  }

  drawDebris(world) {
    const ctx = this.ctx;
    for (const d of world.debris) {
      ctx.fillStyle = C.floor;
      ctx.fillRect(d.x - TW / 2, d.y - FLOOR_H, TW, FLOOR_H);
      ctx.fillStyle = C.floorTop;
      ctx.fillRect(d.x - TW / 2, d.y - FLOOR_H, TW, 2);
    }
  }

  // ---- Personagens -----------------------------------------------------------

  drawCharacter(ch, palette, frame) {
    const view = poseFor(ch, frame);
    const alpha = ch.state === 'enter' ? Math.max(0, 1 - ch.t / 40) : undefined;
    drawFigure(this.ctx, ch.x, ch.y - FLOOR_H + 1, ch.dir, view, palette, {
      flash: ch.flash > 0 && ch.flash % 4 < 2,
      alpha,
    });
    if (ch.state === 'dead' && ch.kind === 'hero' && ch.deathCause !== 'fall') {
      this.ctx.fillStyle = 'rgba(150,20,20,0.6)';
      this.ctx.fillRect(ch.x - 10, ch.y - FLOOR_H - 1, 20, 2);
    }
  }

  // ---- HUD e mensagens ----------------------------------------------------------

  /** HUD sobreposto no alto da tela. */
  drawHud(game) {
    const ctx = this.ctx;
    const W = this.vw;
    const grad = ctx.createLinearGradient(0, 0, 0, HUD_H + 8);
    grad.addColorStop(0, 'rgba(10,6,3,0.7)');
    grad.addColorStop(1, 'rgba(10,6,3,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, HUD_H + 8);
    const y = 9;
    const hero = game.world.hero;
    for (let i = 0; i < hero.maxHp; i++) {
      this.diamond(8 + i * 9, y, i < hero.hp ? C.life : C.lifeEmpty);
    }
    const g = game.world.guards.find((x) => x.state !== 'dead' && x.state !== 'idle' && x.row === hero.row);
    if (g) {
      for (let i = 0; i < g.maxHp; i++) {
        this.diamond(W - 8 - i * 9, y, i < g.hp ? C.guardLife : '#2a3440');
      }
    }
    const s = game.secondsLeft;
    const text = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    ctx.fillStyle = s < 60 ? '#ff8a7a' : C.hudText;
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Fase ${game.levelIndex + 1} · ${text}`, W / 2, y + 0.5);
  }

  diamond(x, y, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + 3.5, y);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(x - 3.5, y);
    ctx.fill();
  }

  banner(title, subtitle, alpha = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(10,6,3,0.72)';
    const cx = this.vw / 2;
    const cy = this.vh / 2;
    ctx.fillRect(0, cy - 26, this.vw, subtitle ? 52 : 34);
    ctx.fillStyle = '#f6dfa8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText(title, cx, cy - 9);
    if (subtitle) {
      ctx.font = '9px system-ui, sans-serif';
      ctx.fillStyle = '#e8d3a8';
      ctx.fillText(subtitle, cx, cy + 12);
    }
    ctx.restore();
  }

  drawOverlay(game) {
    const w = game.world;
    if (game.phase === 'playing' && w.tick < 150) {
      const a = Math.min(1, (150 - w.tick) / 30);
      this.banner(`Fase ${game.levelIndex + 1}`, w.level.name, a);
    }
    if (w.hero.state === 'dead') {
      this.banner(deathText(w.hero.deathCause), 'Tentando de novo…');
    }
    if (game.phase === 'levelDone') this.banner('Fase concluída!', 'Prepare-se para a próxima…');
    if (game.phase === 'won') this.banner('Você escapou da fortaleza!', 'Toque para jogar de novo');
    if (game.phase === 'timeUp') this.banner('O tempo acabou', 'Toque para tentar de novo');
  }

  drawTitle(frame) {
    this.begin();
    const ctx = this.ctx;
    const VIEW_W = ROOM_W;
    const VIEW_H = ROOM_H + 14;
    const fill = ctx.createLinearGradient(0, 0, 0, this.vh);
    fill.addColorStop(0, '#f0b45a');
    fill.addColorStop(0.55, '#c56a2c');
    fill.addColorStop(1, '#3a1f12');
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, this.vw, this.vh);
    ctx.save();
    ctx.translate((this.vw - VIEW_W) / 2, (this.vh - VIEW_H) / 2);
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, '#f0b45a');
    grad.addColorStop(0.55, '#c56a2c');
    grad.addColorStop(1, '#3a1f12');
    void grad;
    // Sol e dunas
    ctx.fillStyle = 'rgba(255,240,200,0.8)';
    ctx.beginPath();
    ctx.arc(250, 62, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a3f1c';
    ctx.beginPath();
    ctx.moveTo(0, 150);
    ctx.lineTo(-400, 150);
    for (let x = -400; x <= VIEW_W + 400; x += 10) ctx.lineTo(x, 150 + Math.sin(x / 40) * 8);
    ctx.lineTo(VIEW_W + 400, VIEW_H + 400);
    ctx.lineTo(-400, VIEW_H + 400);
    ctx.fill();
    // Fortaleza
    ctx.fillStyle = '#2d1a0f';
    ctx.fillRect(30, 92, 120, 62);
    for (let i = 0; i < 8; i++) ctx.fillRect(30 + i * 16, 86, 9, 8);
    ctx.fillRect(62, 60, 30, 40);
    for (let i = 0; i < 3; i++) ctx.fillRect(62 + i * 11, 54, 7, 7);
    ctx.fillStyle = '#ffcf6b';
    ctx.fillRect(74, 74, 6, 10);
    ctx.fillRect(48, 112, 5, 8);
    ctx.fillRect(118, 112, 5, 8);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2a140a';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText('A Fortaleza de Areia', VIEW_W / 2 + 1, 27);
    ctx.fillStyle = '#fff1cf';
    ctx.fillText('A Fortaleza de Areia', VIEW_W / 2, 26);
    const blink = Math.sin(frame * 0.08) > -0.3;
    if (blink) {
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = '#fff1cf';
      ctx.fillText('Toque para começar', VIEW_W / 2, 182);
    }
    // Herói na tela de título
    drawFigure(ctx, 200, 152, -1, poseFor({ state: 'stand', t: 0, kind: 'hero' }, frame), HERO_PALETTE);
    ctx.restore();
  }
}

function deathText(cause) {
  switch (cause) {
    case 'spikes': return 'Os espinhos foram fatais';
    case 'fall': return 'A queda foi alta demais';
    case 'blade': return 'A lâmina foi mais rápida';
    case 'sword': return 'Derrotado pelo guarda';
    case 'debris': return 'Atingido por pedras';
    default: return 'Você morreu';
  }
}
