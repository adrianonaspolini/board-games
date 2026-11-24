// Dimensões e parâmetros do mundo. Tudo em pixels lógicos e "ticks" (60/s).

export const TW = 32; // largura de um bloco
export const TH = 64; // altura de um andar
export const ROOM_COLS = 10;
export const ROOM_ROWS = 3;
export const ROOM_W = TW * ROOM_COLS; // 320
export const ROOM_H = TH * ROOM_ROWS; // 192
export const TICKS_PER_SECOND = 60;

export const HALF_WIDTH = 6; // meia largura do corpo (colisão com paredes)
export const HAND_REACH = 50; // distância dos pés até as mãos esticadas

export const RUN_SPEED = 2.2;
export const GRAVITY = 0.32;
export const MAX_FALL_SPEED = 9;

// Quedas, medidas da posição dos pés no início até a aterrissagem.
export const SAFE_FALL = TH * 1.3; // até ~1 andar: sem dano
export const HURT_FALL = TH * 2.3; // até ~2 andares: perde 1 de vida

// Tempo total do jogo.
export const TIME_LIMIT_SECONDS = 20 * 60;
