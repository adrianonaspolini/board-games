# Chasqui: mecânicas

O jogo usa o mesmo motor de "A Fortaleza de Areia": grade de 32 × 64 px,
salas de 10 × 3 células e simulação determinística a 60 passos por segundo.

## Legenda dos mapas

| Caractere | Significado |
|---|---|
| `.` | vazio |
| `#` | caminho |
| `W` | muro de pedra ou terraço |
| `^` | espinheiro |
| `~` | pedra solta |
| `R` | ponte de corda |
| `r` | tábua fraca |
| `F` | pedra na encosta que despenca |
| `C` | posto de chasqui |
| `h` | cancha (+1 de vida) |
| `H` | apacheta (+1 de vida máxima) |
| `G` | portão de troncos |
| `p` / `x` | placa que abre / placa que fecha |
| `k` | placa da saída |
| `E` | saída (portal trapezoidal) |
| `S` | início |
| `g` | batedor (configurado em `guards`: `weapon` = `maca` ou `funda`) |

## Controles

- **Mão esquerda:** ◀ ▶ (anda, corre e vira).
- **Mão direita:**
  - ▲ pula, sobe e agarra a borda de cima; com uma direção, pula para a
    frente; correndo, dá o pulo longo.
  - ▼ desce pela borda ou agacha.
  - Ação: segurada com ◀/▶, faz o passo cuidadoso; no ar, agarra a borda;
    parado sobre cancha ou apacheta, usa o item; em combate, gira a funda.
- **Em combate:** ▲ ou ▼ abaixa para esquivar. A maça e as pedras passam
  por cima.

## Regras

- **Fôlego:** correr, pular e escalar gastam fôlego proporcional à
  altitude da fase:
  - Vale: 0.
  - Ponte: 0,4.
  - Rumo a Cusco: 1.

  Sem fôlego, o chasqui para e arfa por 1,5 s. Andar devagar ou ficar
  parado recupera.
- **Quedas:** 1 andar não machuca, 2 andares tiram 1 de vida e 3 matam.
  Soltar-se pendurado numa borda conta menos.
- **Espinheiro:** mata quem corre ou cai nele; o passo cuidadoso passa.
- **Pedra solta e tábua fraca:** desabam cerca de 0,4 s depois de alguém
  pisar.
- **Pedras na encosta:** começam a tremer quando o chasqui chega perto e
  caem cerca de 0,6 s depois. Correndo, ele passa antes; parado embaixo,
  perde 1 de vida.
- **Postos de chasqui:** ao morrer, o chasqui volta ao último posto
  alcançado na fase. O relógio de 20 minutos continua correndo.
- **Funda:** a pedra sai no 12º quadro e voa até 220 px; para em muros e
  portões. Os batedores habilidosos se abaixam para desviar.
