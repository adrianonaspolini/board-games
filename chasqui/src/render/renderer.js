// Desenho no canvas: paisagem andina, sala atual (tela fixa), personagens,
// HUD e telas de título e de chegada.

import { ROOM_COLS, ROOM_H, ROOM_ROWS, ROOM_W, TH, TW } from '../engine/constants.js';
import { T } from '../engine/tiles.js';
import { MAX_BREATH } from '../game/hero.js';
import { GUARD_PALETTE, HERO_PALETTE, drawFigure, poseFor } from './figures.js';

export const HUD_H = 14;
export const VIEW_W = ROOM_W;
export const VIEW_H = ROOM_H + HUD_H;
const FLOOR_H = 7;
const TAU = Math.PI * 2;

const C = {
  stone: '#8b8577',
  stoneLight: '#a59e8e',
  stoneDark: '#5e594f',
  joint: '#3f3b34',
  path: '#9b7d55',
  pathTop: '#c2a173',
  pathEdge: '#6b5236',
  grass: '#5f8a3c',
  grassLight: '#7fae4f',
  wood: '#8a5a32',
  woodDark: '#5c3a1f',
  rope: '#d9c38f',
  hudBg: '#14100c',
  hudText: '#f3e6c8',
  life: '#d8432f',
  lifeEmpty: '#4a221b',
  breath: '#7cc3e6',
  enemy: '#9fb0d8',
};

// Céu e montanhas de cada fase.
const THEMES = {
  valley: { sky: ['#9fd0ee', '#e7d6a6'], far: '#8fa6b8', near: '#6f8a5a', snow: '#f4f6f8' },
  gorge: { sky: ['#7fb6dc', '#d9c7a0'], far: '#7c8fa3', near: '#5b5146', snow: '#eef2f5' },
  peaks: { sky: ['#3d6ea8', '#c9d8e6'], far: '#7d93b0', near: '#55607a', snow: '#ffffff' },
};

/** Ruído determinístico por célula (para variar pedras). */
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
  }

  /** Ajusta a resolução interna ao tamanho exibido (nítido em telas retina). */
  resize(cssWidth, cssHeight) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);
    this.scale = this.canvas.width / VIEW_W;
  }

  begin() {
    const ctx = this.ctx;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  drawGame(game, frame) {
    this.begin();
    const world = game.world;
    const { rx, ry } = world.heroRoom();
    const ctx = this.ctx;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, ROOM_W, ROOM_H);
    ctx.clip();
    this.drawSky(world.level.def.theme ?? 'valley', rx, ry, frame);
    ctx.translate(-rx * ROOM_W, -ry * ROOM_H);
    const c0 = rx * ROOM_COLS;
    const r0 = ry * ROOM_ROWS;
    const each = (fn) => {
      for (let r = r0; r < r0 + ROOM_ROWS; r++) {
        for (let c = c0 - 1; c <= c0 + ROOM_COLS; c++) fn(c, r);
      }
    };
    each((c, r) => this.drawBack(world, c, r, frame));
    each((c, r) => this.drawCellBehind(world, c, r, frame));
    this.drawRubble(world);
    for (const g of world.guards) this.drawCharacter(g, { ...GUARD_PALETTE, weapon: g.weapon }, frame);
    this.drawCharacter(world.hero, HERO_PALETTE, frame);
    each((c, r) => this.drawCellFront(world, c, r, frame));
    this.drawDebris(world);
    this.drawProjectiles(world);
    ctx.restore();

    this.drawHud(game);
    this.drawOverlay(game, frame);
  }

  // ---- Paisagem ----------------------------------------------------------

  drawSky(themeName, rx, ry, frame) {
    const ctx = this.ctx;
    const th = THEMES[themeName] ?? THEMES.valley;
    const g = ctx.createLinearGradient(0, 0, 0, ROOM_H);
    g.addColorStop(0, th.sky[0]);
    g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ROOM_W, ROOM_H);
    // Montanhas distantes (os Apus), com leve paralaxe entre as salas.
    const shift = rx * 60 + ry * 20;
    const ridge = (base, amp, color, seed, snow) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, ROOM_H);
      const pts = [];
      for (let x = -40; x <= ROOM_W + 40; x += 20) {
        const k = Math.floor((x + shift * seed) / 20);
        const y = base - hash(k, seed, 3) * amp - (k % 3 === 0 ? amp * 0.5 : 0);
        pts.push([x - ((shift * seed) % 20), y]);
      }
      for (const [x, y] of pts) ctx.lineTo(x, y);
      ctx.lineTo(ROOM_W, ROOM_H);
      ctx.fill();
      if (snow) {
        ctx.fillStyle = snow;
        for (let i = 1; i < pts.length - 1; i++) {
          const [x, y] = pts[i];
          if (y < base - amp * 0.85) {
            ctx.beginPath();
            ctx.moveTo(x - 7, y + 7);
            ctx.lineTo(x, y);
            ctx.lineTo(x + 7, y + 7);
            ctx.fill();
          }
        }
      }
    };
    ridge(ROOM_H * 0.62, 60, th.far, 1, th.snow);
    ridge(ROOM_H * 0.85, 34, th.near, 2, null);
    // Um condor ao longe.
    const bx = (frame * 0.25 + rx * 90) % (ROOM_W + 60) - 30;
    const by = 30 + Math.sin(frame * 0.01) * 6;
    ctx.strokeStyle = 'rgba(30,30,40,0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx - 7, by - 1);
    ctx.quadraticCurveTo(bx - 3, by - 3, bx, by);
    ctx.quadraticCurveTo(bx + 3, by - 3, bx + 7, by - 1);
    ctx.stroke();
  }

  /** Muro de pedras poligonais encaixadas, típico da arquitetura inca. */
  drawMasonry(c, r, x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = C.joint;
    ctx.fillRect(x, y, TW, TH);
    const rows = 3;
    const h = TH / rows;
    for (let i = 0; i < rows; i++) {
      const split = 8 + hash(c, r, i) * 16; // junta vertical irregular
      const blocks = [[0, split], [split, TW]];
      for (const [a, b] of blocks) {
        const j = (k) => (hash(c, r, i * 13 + k + a) - 0.5) * 3;
        const x0 = x + a + 0.8;
        const x1 = x + b - 0.8;
        const y0 = y + i * h + 0.8;
        const y1 = y + (i + 1) * h - 0.8;
        ctx.fillStyle = hash(c, r, i * 7 + a) > 0.55 ? C.stoneLight : C.stone;
        ctx.beginPath();
        ctx.moveTo(x0 + 2, y0 + j(1));
        ctx.lineTo(x1 - 2, y0 + j(2));
        ctx.quadraticCurveTo(x1, y0, x1 + j(3) * 0.3, y0 + 3);
        ctx.lineTo(x1, y1 - 2);
        ctx.quadraticCurveTo(x1, y1, x1 - 2, y1);
        ctx.lineTo(x0 + 2, y1);
        ctx.quadraticCurveTo(x0, y1, x0, y1 - 2);
        ctx.lineTo(x0, y0 + 3);
        ctx.quadraticCurveTo(x0, y0, x0 + 2, y0 + j(1));
        ctx.fill();
        // Sombra embaixo: as pedras incas têm as bordas "almofadadas".
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x0 + 1, y1 - 2.5, x1 - x0 - 2, 2);
      }
    }
  }

  drawBack(world, c, r, frame) {
    const ctx = this.ctx;
    const level = world.level;
    const x = c * TW;
    const y = r * TH;
    const tile = level.tile(c, r);
    if (tile === T.WALL) {
      this.drawMasonry(c, r, x, y);
      // Terraço: grama no topo quando a célula de cima está livre.
      if (level.inside(c, r - 1) && !level.isWall(c, r - 1)) {
        ctx.fillStyle = C.grass;
        ctx.fillRect(x, y, TW, 3);
        ctx.fillStyle = C.grassLight;
        for (let i = 0; i < 5; i++) ctx.fillRect(x + 2 + i * 6 + hash(c, r, i) * 3, y - 2, 1.5, 3);
      }
      return;
    }
    if (tile === T.COLUMN) {
      // Nicho trapezoidal na parede.
      ctx.fillStyle = C.stone;
      ctx.fillRect(x + 4, y + 8, TW - 8, TH - 16);
      ctx.fillStyle = '#3b352d';
      ctx.beginPath();
      ctx.moveTo(x + 11, y + 14);
      ctx.lineTo(x + 21, y + 14);
      ctx.lineTo(x + 24, y + TH - 12);
      ctx.lineTo(x + 8, y + TH - 12);
      ctx.fill();
    }
    if (tile === T.TORCH) this.drawTorch(x, y, c, frame);
    if (tile === T.POST) this.drawPost(world, c, r, x, y, frame);
    if (tile === T.EXIT) this.drawExit(world, x, y);
    if (tile === T.ROCKFALL) this.drawRockSource(world, c, r, x, y, frame);
  }

  drawTorch(x, y, c, frame) {
    const ctx = this.ctx;
    const fx = x + 16;
    const fy = y + 22;
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(fx - 1.5, fy, 3, 10);
    const f = Math.sin(frame * 0.3 + c) * 1.5;
    ctx.fillStyle = '#ffb02e';
    ctx.beginPath();
    ctx.ellipse(fx, fy - 4 + f * 0.3, 3, 6 + f, 0, 0, TAU);
    ctx.fill();
  }

  /** Posto de chasqui (tambo): casinha de pedra com teto de palha. */
  drawPost(world, c, r, x, y, frame) {
    const ctx = this.ctx;
    const base = y + TH - FLOOR_H;
    ctx.fillStyle = C.stoneDark;
    ctx.fillRect(x + 3, base - 22, TW - 6, 22);
    ctx.fillStyle = '#2a241d';
    ctx.beginPath();
    ctx.moveTo(x + 12, base);
    ctx.lineTo(x + 13.5, base - 13);
    ctx.lineTo(x + 18.5, base - 13);
    ctx.lineTo(x + 20, base);
    ctx.fill();
    ctx.fillStyle = '#c9a85a';
    ctx.beginPath();
    ctx.moveTo(x, base - 21);
    ctx.lineTo(x + TW / 2, base - 36);
    ctx.lineTo(x + TW, base - 21);
    ctx.fill();
    ctx.strokeStyle = '#a3853f';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 8, base - 21);
      ctx.lineTo(x + TW / 2, base - 35);
      ctx.stroke();
    }
    const cp = world.checkpoint;
    if (cp && cp[0] === c && cp[1] === r) {
      // Fumaça: o posto está ativo (ponto de retorno).
      for (let i = 0; i < 3; i++) {
        const k = (frame * 0.4 + i * 14) % 40;
        ctx.fillStyle = `rgba(240,240,235,${0.5 - k / 80})`;
        ctx.beginPath();
        ctx.arc(x + TW / 2 + Math.sin((frame + i * 20) * 0.05) * 3, base - 38 - k, 2 + k / 12, 0, TAU);
        ctx.fill();
      }
    }
  }

  /** Saída: portal trapezoidal, a forma típica das portas incas. */
  drawExit(world, x, y) {
    const ctx = this.ctx;
    const base = y + TH - FLOOR_H;
    const top = y + 6;
    this.drawMasonry(99, 99, x - 4, y);
    ctx.fillStyle = '#1b1612';
    ctx.beginPath();
    ctx.moveTo(x + 9, top + 4);
    ctx.lineTo(x + 23, top + 4);
    ctx.lineTo(x + 27, base);
    ctx.lineTo(x + 5, base);
    ctx.fill();
    const open = world.exitOpen;
    if (open > 0) {
      ctx.fillStyle = `rgba(255,214,110,${0.25 + open * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(x + 9, top + 4);
      ctx.lineTo(x + 23, top + 4);
      ctx.lineTo(x + 27, base);
      ctx.lineTo(x + 5, base);
      ctx.fill();
    }
    // Esteira de junco que sobe ao abrir.
    const h = (base - top - 4) * (1 - open);
    ctx.fillStyle = '#b08d4e';
    ctx.fillRect(x + 7, top + 4, 18, h);
    ctx.fillStyle = '#8a6a33';
    for (let i = 0; i < h; i += 4) ctx.fillRect(x + 7, top + 4 + i, 18, 1);
  }

  drawRockSource(world, c, r, x, y, frame) {
    const rf = world.rockfalls.find((k) => k.c === c && k.r === r);
    if (rf && rf.state === 'cooldown' && rf.t < 200) return; // ainda caindo/rolou
    const ctx = this.ctx;
    const shake = rf && rf.state === 'shaking' ? Math.sin(frame * 2.3) * 1.3 : 0;
    // Saliência da encosta com pedras soltas.
    ctx.fillStyle = C.stoneDark;
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + TW + 4, y);
    ctx.lineTo(x + TW - 2, y + 6);
    ctx.lineTo(x + 2, y + 6);
    ctx.fill();
    ctx.fillStyle = C.stone;
    ctx.beginPath();
    ctx.arc(x + TW / 2 + shake, y + 11, 7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = C.stoneLight;
    ctx.beginPath();
    ctx.arc(x + TW / 2 - 2 + shake, y + 9, 3, 0, TAU);
    ctx.fill();
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

    const lf = world.loose.get(`${c},${r}`);
    const jitter = lf ? Math.sin(frame * 2.1) * 1.2 : 0;

    if (tile === T.ROPE || tile === T.WEAK) {
      // Ponte de corda: tábuas, cordas de apoio e corrimões.
      const sag = Math.sin(((c % 12) / 12) * Math.PI) * 2;
      ctx.fillStyle = tile === T.WEAK ? '#6e4a2a' : C.wood;
      for (let i = 0; i < 4; i++) {
        if (tile === T.WEAK && i === 2) continue;
        ctx.fillRect(x + i * 8 + 0.5, fy + sag + jitter, 7, 3.5);
      }
      ctx.strokeStyle = C.rope;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, fy + 3.5 + sag);
      ctx.lineTo(x + TW, fy + 3.5 + sag);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, fy - 24 + sag);
      ctx.lineTo(x + TW, fy - 24 + sag);
      ctx.stroke();
      ctx.lineWidth = 0.6;
      for (let i = 0; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 16, fy - 24 + sag);
        ctx.lineTo(x + i * 16, fy + sag);
        ctx.stroke();
      }
      return;
    }

    // Caminho de terra batida sobre pedra.
    ctx.fillStyle = C.path;
    ctx.fillRect(x, fy + jitter, TW, FLOOR_H);
    ctx.fillStyle = C.pathTop;
    ctx.fillRect(x, fy + jitter, TW, 2);
    ctx.fillStyle = C.pathEdge;
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
      ctx.fillStyle = tile === T.CLOSER ? '#8c6a5a' : tile === T.EXIT_PLATE ? '#e3cf8e' : '#b9b19c';
      ctx.fillRect(x + 5, fy - 2 + down, TW - 10, 3 - down);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(x + TW / 2, fy - 0.5 + down, 1.6, 0, TAU);
      ctx.fill();
    }

    if (tile === T.POTION) {
      // Bolsinha tecida com cancha (milho tostado).
      const px = x + 16;
      ctx.fillStyle = '#b8332a';
      ctx.beginPath();
      ctx.moveTo(px - 5, fy);
      ctx.lineTo(px - 4, fy - 8);
      ctx.lineTo(px + 4, fy - 8);
      ctx.lineTo(px + 5, fy);
      ctx.fill();
      ctx.fillStyle = '#f2e6c8';
      ctx.fillRect(px - 4.5, fy - 5, 9, 1.2);
      ctx.fillStyle = '#e8b33c';
      for (let i = 0; i < 4; i++) ctx.fillRect(px - 3 + i * 2, fy - 10 + (i % 2), 1.6, 1.6);
    }

    if (tile === T.BIG_POTION || tile === T.APACHETA_DONE) {
      // Apacheta: monte de pedras deixadas pelos viajantes.
      const px = x + 16;
      const extra = tile === T.APACHETA_DONE ? 1 : 0;
      const stones = [[-8, 0, 4], [0, 0, 4.5], [8, 0, 4], [-4, -6, 4], [4, -6, 4], [0, -12, 3.5]];
      if (extra) stones.push([0, -17, 2.8]);
      for (const [dx, dy, rr] of stones) {
        ctx.fillStyle = hash(c, dx + 10, dy + 20) > 0.5 ? C.stoneLight : C.stone;
        ctx.beginPath();
        ctx.ellipse(px + dx, fy - 3 + dy, rr + 0.5, rr, 0, 0, TAU);
        ctx.fill();
      }
      if (!extra) {
        const glow = 0.3 + Math.sin(frame * 0.08) * 0.15;
        ctx.fillStyle = `rgba(255,230,150,${glow})`;
        ctx.beginPath();
        ctx.arc(px, fy - 10, 13, 0, TAU);
        ctx.fill();
      }
    }

    if (tile === T.SPIKES) {
      // Espinheiro: arbusto de espinhos que se eriça.
      const sp = world.spikes.get(`${c},${r}`);
      const ext = sp ? sp.ext : 0;
      ctx.fillStyle = '#5d6b45';
      ctx.beginPath();
      ctx.ellipse(x + 16, fy - 3, 13, 4 + ext * 2, 0, Math.PI, TAU);
      ctx.fill();
      ctx.strokeStyle = '#e8e2cf';
      ctx.lineWidth = 1;
      const len = 3 + ext * 9;
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + (i + 0.5) * (Math.PI / 7);
        const bx = x + 16 + Math.cos(a) * 10;
        const by = fy - 3 + Math.sin(a) * 4;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(a) * len, by + Math.sin(a) * len);
        ctx.stroke();
      }
    }
  }

  drawCellFront(world, c, r) {
    const ctx = this.ctx;
    const tile = world.level.tile(c, r);
    const x = c * TW;
    const y = r * TH;
    if (tile === T.GATE) {
      // Portão de troncos amarrados com corda.
      const gate = world.gates.get(`${c},${r}`);
      const open = gate ? gate.open : 0;
      const gx = x + TW / 2;
      const len = (TH - FLOOR_H) * (1 - open * 0.92);
      ctx.fillStyle = C.stoneDark;
      ctx.fillRect(gx - 7, y, 14, 4);
      for (let i = -1; i <= 1; i++) {
        ctx.fillStyle = i === 0 ? C.wood : C.woodDark;
        ctx.fillRect(gx + i * 4 - 2, y, 4, len);
      }
      ctx.fillStyle = C.rope;
      for (let j = 10; j < len; j += 18) ctx.fillRect(gx - 6, y + j, 12, 1.5);
    }
  }

  drawRubble(world) {
    const ctx = this.ctx;
    for (const { c, r } of world.rubble) {
      const x = c * TW;
      const fy = r * TH + TH - FLOOR_H;
      ctx.fillStyle = C.stone;
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(x + 3 + i * 4.5, fy - 2 - hash(c, r, i + 9) * 2, 3 + hash(c, r, i) * 4, 2.5);
      }
    }
  }

  drawDebris(world) {
    const ctx = this.ctx;
    for (const d of world.debris) {
      if (d.kind === 'rock') {
        ctx.fillStyle = C.stone;
        ctx.beginPath();
        ctx.arc(d.x, d.y - 6, 7, 0, TAU);
        ctx.fill();
        ctx.fillStyle = C.stoneLight;
        ctx.beginPath();
        ctx.arc(d.x - 2, d.y - 8, 3, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = C.path;
        ctx.fillRect(d.x - TW / 2, d.y - FLOOR_H, TW, FLOOR_H);
      }
    }
  }

  drawProjectiles(world) {
    const ctx = this.ctx;
    for (const p of world.projectiles) {
      const y = (p.row + 1) * TH - FLOOR_H - 34;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * 3, y);
      ctx.lineTo(p.x, y);
      ctx.stroke();
      ctx.fillStyle = '#6f675c';
      ctx.beginPath();
      ctx.arc(p.x, y, 2.2, 0, TAU);
      ctx.fill();
    }
  }

  // ---- Personagens ---------------------------------------------------------

  drawCharacter(ch, palette, frame) {
    const view = poseFor(ch, frame);
    const alpha = ch.state === 'enter' ? Math.max(0, 1 - ch.t / 40) : undefined;
    drawFigure(this.ctx, ch.x, ch.y - FLOOR_H + 1, ch.dir, view, palette, {
      flash: ch.flash > 0 && ch.flash % 4 < 2,
      alpha,
    });
  }

  // ---- HUD e mensagens -------------------------------------------------------

  drawHud(game) {
    const ctx = this.ctx;
    const y = ROOM_H;
    ctx.fillStyle = C.hudBg;
    ctx.fillRect(0, y, VIEW_W, HUD_H);
    // Faixa de tocapu no topo do HUD.
    for (let i = 0; i < VIEW_W / 4; i++) {
      ctx.fillStyle = i % 2 ? '#b4472c' : '#e9d9b0';
      ctx.fillRect(i * 4, y, 4, 1.5);
    }
    const world = game.world;
    const hero = world.hero;
    for (let i = 0; i < hero.maxHp; i++) {
      this.diamond(5 + i * 9, y + 8, i < hero.hp ? C.life : C.lifeEmpty);
    }
    let right = VIEW_W - 6;
    const g = world.guards.find((x) => x.state !== 'dead' && x.state !== 'idle' && x.row === hero.row);
    if (g) {
      for (let i = 0; i < g.maxHp; i++) {
        this.diamond(right - i * 9, y + 8, i < g.hp ? C.enemy : '#2a3046');
      }
      right -= g.maxHp * 9 + 6;
    }
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 8.5px system-ui, sans-serif';
    if (world.altitude > 0) {
      // Fôlego
      const bx = 9 + hero.maxHp * 9;
      const w = 46;
      ctx.fillStyle = '#26323a';
      ctx.fillRect(bx, y + 5.5, w, 5);
      ctx.fillStyle = hero.breath < 25 ? '#e6a07c' : C.breath;
      ctx.fillRect(bx, y + 5.5, (w * hero.breath) / MAX_BREATH, 5);
    }
    const s = game.secondsLeft;
    const text = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    ctx.fillStyle = s < 60 ? '#ff8a7a' : C.hudText;
    ctx.textAlign = 'center';
    ctx.fillText(`Fase ${game.levelIndex + 1} · ${text}`, VIEW_W / 2 + 18, y + 8.5);
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
    ctx.fillStyle = 'rgba(20,14,10,0.74)';
    ctx.fillRect(0, ROOM_H / 2 - 26, ROOM_W, subtitle ? 52 : 34);
    ctx.fillStyle = '#f6e2ad';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText(title, ROOM_W / 2, ROOM_H / 2 - 9);
    if (subtitle) {
      ctx.font = '9px system-ui, sans-serif';
      ctx.fillStyle = '#eadbb6';
      ctx.fillText(subtitle, ROOM_W / 2, ROOM_H / 2 + 12);
    }
    ctx.restore();
  }

  drawOverlay(game, frame) {
    const w = game.world;
    if (game.phase === 'won') {
      this.drawFinale(frame);
      return;
    }
    if (game.phase === 'playing' && w.tick < 150) {
      const a = Math.min(1, (150 - w.tick) / 30);
      this.banner(`Fase ${game.levelIndex + 1}`, w.level.name, a);
    }
    if (w.hero.state === 'dead') {
      this.banner(deathText(w.hero.deathCause), w.checkpoint ? 'Voltando ao posto de chasqui…' : 'Tentando de novo…');
    }
    if (game.phase === 'levelDone') this.banner('Mensagem passada adiante!', 'O próximo trecho do caminho espera…');
    if (game.phase === 'timeUp') this.banner('A mensagem não chegou a tempo', 'Toque para tentar de novo');
  }

  /** Chegada a Cusco durante o Inti Raymi. */
  drawFinale(frame) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, ROOM_H);
    g.addColorStop(0, '#f6b04a');
    g.addColorStop(1, '#a8452a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ROOM_W, ROOM_H);
    const sx = ROOM_W / 2;
    const sy = 70;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(frame * 0.004);
    ctx.fillStyle = '#ffd86b';
    for (let i = 0; i < 16; i++) {
      ctx.rotate(TAU / 16);
      ctx.beginPath();
      ctx.moveTo(-4, 26);
      ctx.lineTo(0, 44 + (i % 2) * 8);
      ctx.lineTo(4, 26);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#ffe9a0';
    ctx.beginPath();
    ctx.arc(sx, sy, 24, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e0a73a';
    ctx.beginPath();
    ctx.arc(sx - 7, sy - 3, 2.5, 0, TAU);
    ctx.arc(sx + 7, sy - 3, 2.5, 0, TAU);
    ctx.fill();
    // Praça de Cusco com muros de pedra e gente dançando.
    ctx.fillStyle = '#4d2a1c';
    ctx.fillRect(0, 150, ROOM_W, 42);
    for (let i = 0; i < 14; i++) {
      const px = 14 + i * 22;
      const hop = Math.abs(Math.sin(frame * 0.08 + i)) * 4;
      ctx.fillStyle = i % 3 === 0 ? '#b4472c' : i % 3 === 1 ? '#2f3d6e' : '#e3b23c';
      ctx.fillRect(px - 3, 136 - hop, 6, 10);
      ctx.fillStyle = '#c98a58';
      ctx.beginPath();
      ctx.arc(px, 132 - hop, 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#4d2a1c';
      ctx.fillRect(px - 3, 146 - hop, 2, 4);
      ctx.fillRect(px + 1, 146 - hop, 2, 4);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff4d6';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText('A mensagem chegou a Cusco!', ROOM_W / 2, 164);
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillText('A cidade celebra o Inti Raymi. Toque para jogar de novo.', ROOM_W / 2, 180);
  }

  drawTitle(frame) {
    this.begin();
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_W, VIEW_H);
    ctx.clip();
    this.drawSky('peaks', 0, 0, frame);
    // Caminho em zigue-zague subindo a montanha.
    ctx.strokeStyle = '#d9c08a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, VIEW_H);
    ctx.lineTo(120, 170);
    ctx.lineTo(60, 150);
    ctx.lineTo(150, 128);
    ctx.lineTo(110, 112);
    ctx.lineTo(180, 98);
    ctx.stroke();
    ctx.fillStyle = 'rgba(10,20,40,0.35)';
    ctx.fillRect(0, 0, VIEW_W, 56);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff4d6';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillText('Chasqui', VIEW_W / 2, 22);
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillText('O Caminho do Sol', VIEW_W / 2, 42);
    if (Math.sin(frame * 0.08) > -0.3) {
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('Toque para começar', VIEW_W / 2, 190);
    }
    const run = { state: 'run', t: frame, kind: 'hero' };
    drawFigure(ctx, 230, 172, 1, poseFor(run, frame), HERO_PALETTE);
    ctx.restore();
  }
}

function deathText(cause) {
  switch (cause) {
    case 'spikes': return 'Os espinhos foram fatais';
    case 'fall': return 'A queda foi alta demais';
    case 'rock': return 'Atingido por uma pedra da encosta';
    case 'mace': return 'Derrubado por um golpe de maça';
    case 'stone': return 'Atingido por uma pedra de funda';
    case 'debris': return 'Atingido por pedras';
    default: return 'O chasqui caiu';
  }
}
