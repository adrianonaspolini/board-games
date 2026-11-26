// Personagens desenhados como esqueletos articulados (poses interpoladas),
// para dar movimento fluido sem usar imagens.

const TAU = Math.PI * 2;

// Ângulos em radianos: 0 = para baixo; positivo = gira para a frente.
const POSES = {
  stand: { lean: 0, hip: 0, lt: 0.06, ls: 0, rt: -0.06, rs: 0, la: 0.12, lf: 0.25, ra: -0.08, rf: 0.2 },
  crouch: { lean: 0.35, hip: -11, lt: 1.4, ls: -1.9, rt: 1.0, rs: -1.7, la: 0.5, lf: 0.6, ra: 0.3, rf: 0.6 },
  stepA: { lean: 0.05, hip: 0, lt: 0.35, ls: -0.1, rt: -0.25, rs: -0.3, la: 0.35, lf: 0.5, ra: 0.1, rf: 0.4 },
  run0: { lean: 0.18, hip: -1, lt: 0.75, ls: -0.3, rt: -0.6, rs: -1.1, la: -0.6, lf: 1.2, ra: 0.7, rf: 0.9 },
  run1: { lean: 0.2, hip: -3, lt: 0.2, ls: -1.4, rt: 0.1, rs: -0.2, la: 0.1, lf: 1.2, ra: 0.0, rf: 1.0 },
  run2: { lean: 0.18, hip: -1, lt: -0.6, ls: -1.1, rt: 0.75, rs: -0.3, la: 0.7, lf: 0.9, ra: -0.6, rf: 1.2 },
  run3: { lean: 0.2, hip: -3, lt: 0.1, ls: -0.2, rt: 0.2, rs: -1.4, la: 0.0, lf: 1.0, ra: 0.1, rf: 1.2 },
  jump: { lean: 0.15, hip: 0, lt: 0.9, ls: -1.2, rt: -0.4, rs: -0.9, la: 2.6, lf: 0.2, ra: 2.3, rf: 0.3 },
  fall: { lean: -0.1, hip: 0, lt: 0.3, ls: -0.5, rt: -0.2, rs: -0.4, la: 2.8, lf: -0.3, ra: -2.6, rf: 0.4 },
  reachUp: { lean: 0, hip: 0, lt: 0.05, ls: 0, rt: -0.05, rs: 0, la: 3.0, lf: 0.05, ra: 2.9, rf: 0.1 },
  hang: { lean: 0, hip: 0, lt: 0.1, ls: -0.15, rt: -0.05, rs: -0.25, la: 3.1, lf: 0.0, ra: 3.0, rf: 0.05 },
  fight: { lean: 0.05, hip: -4, lt: 0.55, ls: -0.6, rt: -0.4, rs: -0.4, la: 1.25, lf: 0.25, ra: -0.3, rf: 1.4 },
  lunge: { lean: 0.25, hip: -6, lt: 0.95, ls: -0.8, rt: -0.7, rs: -0.2, la: 1.6, lf: 0.0, ra: -0.6, rf: 0.6 },
  windup: { lean: -0.1, hip: -4, lt: 0.4, ls: -0.6, rt: -0.4, rs: -0.4, la: 2.4, lf: 0.6, ra: -0.3, rf: 1.4 },
  parry: { lean: -0.05, hip: -4, lt: 0.45, ls: -0.6, rt: -0.4, rs: -0.4, la: 2.0, lf: -0.9, ra: -0.3, rf: 1.4 },
  hurt: { lean: -0.35, hip: -2, lt: 0.2, ls: -0.3, rt: -0.5, rs: -0.2, la: 1.0, lf: 0.5, ra: -1.0, rf: 0.5 },
  drink: { lean: 0, hip: 0, lt: 0.06, ls: 0, rt: -0.06, rs: 0, la: 2.2, lf: 2.0, ra: -0.08, rf: 0.2 },
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mix(p, q, t) {
  const out = {};
  for (const k in p) out[k] = lerp(p[k], q[k], t);
  return out;
}

const smooth = (t) => t * t * (3 - 2 * t);

/** Pose, deslocamento e estilo de um personagem no estado atual. */
export function poseFor(ch, tick) {
  const t = ch.t;
  let pose = POSES.stand;
  let dx = 0;
  let dy = 0;
  let sword = ch.kind === 'guard' || ['fight', 'advance', 'retreat', 'strike', 'parry', 'hurt', 'blocked'].includes(ch.state);
  let swordAngle = null; // relativo ao antebraço
  let spin = null; // ângulo da funda girando sobre a cabeça
  let flip = 1;
  let lying = false;

  switch (ch.state) {
    case 'turn':
      flip = Math.cos((t / 7) * Math.PI);
      break;
    case 'startRun': {
      const p = Math.min(1, t / 6);
      pose = mix(POSES.stand, POSES.run0, smooth(p));
      break;
    }
    case 'run': {
      const frames = [POSES.run0, POSES.run1, POSES.run2, POSES.run3];
      const f = (t / 5) % 4;
      const i = Math.floor(f);
      pose = mix(frames[i], frames[(i + 1) % 4], smooth(f - i));
      break;
    }
    case 'stopRun':
      pose = mix(POSES.run0, POSES.crouch, smooth(Math.min(1, t / 8)) * 0.6);
      break;
    case 'bump':
      pose = mix(POSES.hurt, POSES.stand, smooth(Math.min(1, t / 10)));
      break;
    case 'step': {
      const p = Math.sin((Math.min(t, 12) / 12) * Math.PI);
      pose = mix(POSES.stand, POSES.stepA, p);
      break;
    }
    case 'stepEdge': {
      // Balança na beira.
      const w = Math.sin(t * 0.9) * 0.25 * (1 - t / 14);
      pose = { ...POSES.stand, lean: w, la: 1.2 + w, ra: -1.0 + w };
      break;
    }
    case 'crouch':
    case 'standJumpPrep':
      pose = mix(POSES.stand, POSES.crouch, smooth(Math.min(1, t / 5)));
      break;
    case 'land': {
      const dur = ch.landHard ? 18 : 7;
      pose = mix(POSES.crouch, POSES.stand, smooth(Math.min(1, t / dur)));
      break;
    }
    case 'jump':
      pose = ch.vy < 0 ? mix(POSES.crouch, POSES.jump, smooth(Math.min(1, t / 6))) : POSES.jump;
      break;
    case 'fall':
      pose = mix(POSES.jump, POSES.fall, smooth(Math.min(1, t / 12)));
      break;
    case 'jumpUp': {
      if (t < 5) pose = mix(POSES.stand, POSES.crouch, smooth(t / 5) * 0.6);
      else {
        const p = (t - 5) / 17;
        pose = POSES.reachUp;
        dy = -Math.sin(Math.min(1, p) * Math.PI) * 12;
      }
      break;
    }
    case 'hang':
      pose = POSES.hang;
      dy = Math.sin(t * 0.12) * 0.5;
      break;
    case 'climbUp': {
      // Sobe da posição pendurada até ficar agachado em cima da borda.
      const p = smooth(Math.min(1, t / 24));
      pose = p < 0.6 ? mix(POSES.hang, POSES.crouch, p / 0.6) : mix(POSES.crouch, POSES.stand, (p - 0.6) / 0.4);
      dy = -p * 50;
      dx = p * 16 * ch.dir;
      break;
    }
    case 'climbDown': {
      const p = smooth(Math.min(1, t / 16));
      pose = p < 0.4 ? mix(POSES.stand, POSES.crouch, p / 0.4) : mix(POSES.crouch, POSES.hang, (p - 0.4) / 0.6);
      dy = p * 50;
      dx = -p * 16 * ch.dir;
      break;
    }
    case 'drink':
      pose = mix(POSES.stand, POSES.drink, Math.sin(Math.min(1, t / 40) * Math.PI));
      break;
    case 'idle':
      pose = ch.kind === 'guard' ? POSES.fight : POSES.stand;
      if (ch.kind === 'guard') swordAngle = 0.6;
      break;
    case 'fight':
    case 'advance':
    case 'retreat': {
      const bob = ch.state === 'fight' ? Math.sin(tick * 0.08) * 0.05 : Math.sin(t * 0.7) * 0.15;
      pose = { ...POSES.fight, lt: POSES.fight.lt + bob, rt: POSES.fight.rt - bob };
      swordAngle = 0.15;
      break;
    }
    case 'strike': {
      const impact = ch.kind === 'hero' ? 12 : 11;
      if (ch.kind === 'hero' || ch.weapon === 'funda') {
        // Funda: gira sobre a cabeça e arremessa.
        if (t < impact) {
          pose = mix(POSES.fight, POSES.windup, smooth(Math.min(1, t / 4)));
          spin = t * 0.9;
        } else {
          pose = mix(POSES.lunge, POSES.fight, smooth(Math.min(1, (t - impact) / 10)));
        }
        break;
      }
      if (t < impact - 4) pose = mix(POSES.fight, POSES.windup, smooth(t / (impact - 4)));
      else if (t < impact) pose = mix(POSES.windup, POSES.lunge, smooth((t - impact + 4) / 4));
      else pose = mix(POSES.lunge, POSES.fight, smooth(Math.min(1, (t - impact) / 12)));
      swordAngle = -0.1;
      break;
    }
    case 'parry':
      // Esquiva: abaixa o corpo.
      pose = mix(POSES.fight, POSES.crouch, smooth(Math.min(1, t / 3)) * (t < 16 ? 1 : 1 - (t - 16) / 4));
      swordAngle = 0.6;
      break;
    case 'gasp': {
      // Sem fôlego: curvado, mãos nos joelhos.
      const b = Math.sin(t * 0.25) * 0.05;
      pose = { ...POSES.crouch, hip: -4, lt: 0.5, ls: -0.7, rt: 0.3, rs: -0.6, lean: 0.7 + b, la: 0.4, lf: 0.1, ra: 0.3, rf: 0.1 };
      break;
    }
    case 'hurt':
    case 'blocked':
      pose = mix(POSES.hurt, POSES.fight, smooth(Math.min(1, t / 14)));
      swordAngle = 0.2;
      break;
    case 'dead':
      lying = true;
      pose = POSES.stand;
      sword = false;
      break;
    case 'enter':
      pose = POSES.stand;
      break;
    default:
      break;
  }
  return { pose, dx, dy, sword, swordAngle, flip, lying, spin };
}

/**
 * Desenha um personagem com os pés em (x, y).
 * palette: { skin, hair, top, legs, sash, boots, helmet? }
 */
export function drawFigure(ctx, x, y, dir, view, palette, opts = {}) {
  const { pose, dx, dy, sword, swordAngle, flip, lying, spin } = view;
  ctx.save();
  ctx.translate(x + dx, y + dy);
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  if (lying) {
    ctx.translate(0, -3);
    ctx.rotate(-dir * Math.PI / 2);
    ctx.translate(0, 0);
  }
  ctx.scale(dir * flip, 1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const hipY = -24 + pose.hip;
  const hip = { x: 0, y: hipY };
  const torsoLen = 16;
  const shoulder = {
    x: hip.x + Math.sin(pose.lean) * torsoLen,
    y: hip.y - Math.cos(pose.lean) * torsoLen,
  };

  const limb = (from, a1, l1, a2, l2) => {
    const k = { x: from.x + Math.sin(a1) * l1, y: from.y + Math.cos(a1) * l1 };
    const e = { x: k.x + Math.sin(a1 + a2) * l2, y: k.y + Math.cos(a1 + a2) * l2 };
    return [k, e];
  };
  const seg = (a, b, w, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };

  const back = { leg: limb(hip, pose.rt, 12, pose.rs, 12), arm: limb(shoulder, pose.ra, 9, pose.rf, 9) };
  const front = { leg: limb(hip, pose.lt, 12, pose.ls, 12), arm: limb(shoulder, pose.la, 9, pose.lf, 9) };
  const shade = palette.shade ?? 'rgba(0,0,0,0.25)';

  // Perna e braço de trás (mais escuros)
  seg(hip, back.leg[0], 5, palette.legs);
  seg(back.leg[0], back.leg[1], 4.2, palette.legs);
  seg(back.leg[0], back.leg[1], 4.2, shade);
  seg(back.leg[1], { x: back.leg[1].x + 3.5, y: back.leg[1].y }, 3, palette.boots);
  seg(shoulder, back.arm[0], 3.4, palette.top);
  seg(back.arm[0], back.arm[1], 3, palette.skin);
  seg(back.arm[0], back.arm[1], 3, shade);

  // Tronco
  seg(hip, shoulder, 8, palette.top);
  // Faixa de tocapu (quadradinhos) na túnica.
  const band = { x: lerp(hip.x, shoulder.x, 0.3), y: lerp(hip.y, shoulder.y, 0.3) };
  for (let i = -1; i <= 1; i++) {
    ctx.fillStyle = (i + 2) % 2 ? palette.sash : palette.band ?? palette.sash;
    ctx.fillRect(band.x + i * 2.6 - 1.3, band.y - 1.3, 2.6, 2.6);
  }

  // Cabeça
  const headC = {
    x: shoulder.x + Math.sin(pose.lean) * 6,
    y: shoulder.y - Math.cos(pose.lean) * 6 - 1,
  };
  ctx.fillStyle = palette.skin;
  ctx.beginPath();
  ctx.arc(headC.x, headC.y, 5, 0, TAU);
  ctx.fill();
  if (palette.headdress === 'cap') {
    // Gorro de lã com abas.
    ctx.fillStyle = palette.cap;
    ctx.beginPath();
    ctx.arc(headC.x, headC.y - 0.5, 5.6, Math.PI * 1.02, TAU * 0.99);
    ctx.fill();
    ctx.fillRect(headC.x - 5.6, headC.y - 1.5, 2.4, 6);
    ctx.fillStyle = palette.sash;
    ctx.fillRect(headC.x - 5, headC.y - 3, 10, 1.2);
  } else {
    // Cabelo e penacho branco do chasqui.
    ctx.fillStyle = palette.hair;
    ctx.beginPath();
    ctx.arc(headC.x - 0.8, headC.y - 1, 5.2, Math.PI * 0.95, TAU * 0.98);
    ctx.fill();
    ctx.fillRect(headC.x - 5.8, headC.y - 2, 2.6, 6);
    ctx.strokeStyle = palette.sash;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(headC.x - 5, headC.y - 2.2);
    ctx.lineTo(headC.x + 4.6, headC.y - 2.6);
    ctx.stroke();
    ctx.strokeStyle = '#f7f4ea';
    ctx.lineWidth = 1.8;
    for (const [ax, ay] of [[-7, -9], [-4, -11], [-1, -10]]) {
      ctx.beginPath();
      ctx.moveTo(headC.x - 1.5, headC.y - 3.5);
      ctx.quadraticCurveTo(headC.x + ax * 0.4, headC.y + ay * 0.8, headC.x + ax, headC.y + ay);
      ctx.stroke();
    }
  }
  // Olho
  ctx.fillStyle = '#1a120c';
  ctx.fillRect(headC.x + 2.2, headC.y - 0.8, 1.2, 1.4);

  // Perna e braço da frente
  seg(hip, front.leg[0], 5, palette.legs);
  seg(front.leg[0], front.leg[1], 4.2, palette.legs);
  seg(front.leg[1], { x: front.leg[1].x + 3.5, y: front.leg[1].y }, 3, palette.boots);
  seg(shoulder, front.arm[0], 3.4, palette.top);
  seg(front.arm[0], front.arm[1], 3, palette.skin);

  if (sword) {
    const hand = front.arm[1];
    const weapon = palette.weapon ?? 'funda';
    const angle = pose.la + pose.lf + (swordAngle ?? 0.4);
    const dirX = Math.sin(angle);
    const dirY = Math.cos(angle);
    if (weapon === 'maca') {
      // Maça: cabo de madeira com cabeça de pedra em estrela.
      const tip = { x: hand.x + dirX * 15, y: hand.y + dirY * 15 };
      seg(hand, tip, 1.8, '#7a5230');
      ctx.fillStyle = '#9a9488';
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        const rr = i % 2 ? 2.2 : 4;
        ctx.lineTo(tip.x + Math.cos(a) * rr, tip.y + Math.sin(a) * rr);
      }
      ctx.fill();
    } else if (spin !== null) {
      // Funda girando sobre a cabeça.
      const cx = shoulder.x + 1;
      const cy = shoulder.y - 12;
      ctx.strokeStyle = 'rgba(240,230,200,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 11, 4, 0, 0, TAU);
      ctx.stroke();
      const px = cx + Math.cos(spin) * 11;
      const py = cy + Math.sin(spin) * 4;
      seg(hand, { x: px, y: py }, 1, palette.cord ?? '#e8dcc0');
      ctx.fillStyle = '#6b6258';
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, TAU);
      ctx.fill();
    } else {
      // Funda pendurada na mão.
      const end = { x: hand.x + dirX * 5, y: hand.y + 11 };
      seg(hand, end, 1, palette.cord ?? '#e8dcc0');
      ctx.fillStyle = palette.cord ?? '#e8dcc0';
      ctx.fillRect(end.x - 1.5, end.y - 1, 3, 2.5);
    }
  }
  if (opts.flash) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(-30, -70, 60, 75);
  }
  ctx.restore();
}

// Chasqui: túnica (unku) vermelho-terra com faixa de tocapu, pernas de fora,
// sandálias e penacho branco.
export const HERO_PALETTE = {
  skin: '#c98a58',
  hair: '#17110c',
  top: '#b4472c',
  legs: '#c98a58',
  sash: '#f1e6cc',
  band: '#1f1a16',
  boots: '#4a3020',
  headdress: 'plume',
  weapon: 'funda',
  cord: '#e8dcc0',
};

// Batedores do exército rival: túnica índigo e gorro de lã.
export const GUARD_PALETTE = {
  skin: '#b57a4c',
  hair: '#111',
  top: '#2f3d6e',
  legs: '#b57a4c',
  sash: '#e0b23c',
  band: '#8e2a22',
  boots: '#2b1d12',
  headdress: 'cap',
  cap: '#5a2a24',
  weapon: 'maca',
  cord: '#d8c9a3',
};
