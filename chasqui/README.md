# Chasqui: O Caminho do Sol

Jogo de plataforma original em HTML5 (canvas) ambientado no Império Inca,
por volta de 1530, durante a guerra civil. Você é um **chasqui**, um
mensageiro que corre pelo Qhapaq Ñan levando um quipu até Cusco a tempo do
Inti Raymi:
- sobe terraços;
- atravessa pontes de corda;
- foge de pedras que despencam;
- enfrenta batedores rivais com a funda;
- administra o fôlego nas alturas.

Os controles são virtuais, na tela do celular: ◀ ▶ na mão esquerda e ▲ ▼ +
Ação na mão direita.

- Pesquisa histórica: [docs/pesquisa-inca.md](docs/pesquisa-inca.md)
- Mecânicas e legenda dos mapas: [docs/mecanicas.md](docs/mecanicas.md)

## Como rodar

```bash
npm install
```

```bash
npm run dev -- --host
```

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run build
```

O código segue a mesma estrutura de `../fortaleza`:
- `src/engine` e `src/game`: lógica pura e testável.
- `src/render`: desenho no canvas.
- `src/input`: controles.
- `src/audio`: sons.

`test/walkthroughs.js` vence as três fases usando só os comandos do jogador.
