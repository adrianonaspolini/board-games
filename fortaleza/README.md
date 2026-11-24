# A Fortaleza de Areia

Jogo de plataforma original em HTML5 (canvas), feito para celular, com
controles virtuais na tela: um direcional e um botão de ação. Um aventureiro
precisa atravessar as 3 fases de uma fortaleza no deserto, desviando de
armadilhas e vencendo guardas em duelos de espada, antes que o tempo acabe.

## Como rodar

Requisitos: Node 18 ou mais recente.

```bash
npm install
```

```bash
npm run dev
```

Abra o endereço mostrado no celular (mesma rede) ou no navegador. Para gerar
a versão estática em `dist/`, que pode ser publicada em qualquer
hospedagem:

```bash
npm run build
```

```bash
npm test
```

```bash
npm run lint
```

## Estrutura

```
src/
├── engine/   grade, colisão, constantes, RNG (lógica pura, sem DOM)
├── game/     herói, guardas, combate, armadilhas, mundo, fases e relógio
├── render/   desenho no canvas (personagens articulados, cenário, HUD)
├── input/    direcional e botão de ação (toque) + teclado
└── audio/    efeitos sintetizados com Web Audio
test/         Vitest: movimento, armadilhas, combate e roteiros que vencem cada fase
docs/         mecânicas e decisões
```

Toda a lógica (`engine/` e `game/`) é determinística e testável.
`test/walkthroughs.js` vence cada fase usando só os 5 comandos do jogador;
se uma mudança de fase ou de física deixar a fase impossível, o teste falha.

## Como criar uma fase

1. Copie `src/game/levels/level1.js`. O mapa precisa ter largura múltipla de
   10 e altura múltipla de 3 (veja a legenda em `docs/mecanicas.md`).
2. Ligue cada placa `p` ou `x` aos portões em `links`. Configure os guardas
   em `guards`, na ordem em que aparecem no mapa.
3. Registre a fase em `src/game/levels/index.js`.
4. Escreva o roteiro em `test/walkthroughs.js` e rode `npm test`.
