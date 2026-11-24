# A Fortaleza de Areia: mecânicas e decisões

Jogo original de plataforma "cinematográfico". Usa mecânicas comuns ao gênero:
movimento em grade, bordas, quedas com dano, armadilhas e duelos de espada.
Personagens, fases, arte (desenhada por código) e sons (sintetizados) foram
criados para este projeto.

## Mundo

- A fase é uma grade de células de 32 × 64 px. Cada tela (sala) mostra
  10 × 3 células, e a câmera troca de sala quando o herói sai dela.
- Cada célula tem um piso embaixo. O topo de uma parede (`W`) também serve
  de piso.
- A simulação roda a 60 passos por segundo, sempre igual (determinística).
  Isso permite testes que jogam a fase inteira.

### Legenda dos mapas

| Caractere | Significado |
|---|---|
| `.` | vazio (sem piso) |
| `#` | piso |
| `W` | parede maciça |
| `^` | espinhos |
| `~` | piso solto |
| `G` | portão |
| `p` | placa que abre portões |
| `x` | placa que fecha portões |
| `k` | placa que abre a saída |
| `E` | saída |
| `B` | lâmina |
| `h` | poção pequena |
| `H` | poção grande |
| `S` | início do herói |
| `g` | guarda |
| `T` | tocha (decoração) |
| `\|` | coluna (decoração) |

## Controles (5 comandos)

| Comando | Em pé | No ar | Pendurado | Em duelo |
|---|---|---|---|---|
| ← / → | corre (ou vira) | — | — | avança / recua |
| ação + ← / → | passo cuidadoso (para na beira) | — | — | — |
| ↑ | pula para agarrar a borda de cima; entra na saída aberta | — | sobe | defende |
| ↑ + direção | pulo parado para a frente | — | — | — |
| ↑ correndo | pulo correndo | — | — | — |
| ↓ | desce pela borda (se houver vão perto) ou agacha | — | solta | — |
| ação | bebe a poção | segurar: agarra a borda | — | ataca |

No computador, as setas e espaço/Shift também funcionam.

## Regras

- **Quedas**, medidas da altura dos pés:
  - 1 andar: sem dano.
  - 2 andares: perde 1 de vida.
  - 3 ou mais: morte.
  - Soltar-se de uma borda conta menos. Por isso descer pendurado e soltar
    para 2 andares abaixo não machuca.
- **Espinhos** matam quem corre ou cai sobre eles. Com o passo cuidadoso,
  dá para atravessá-los.
- **Piso solto** treme e desaba cerca de 0,4 s depois de alguém pisar nele,
  se pendurar nele ou bater a cabeça por baixo. O entulho machuca quem está
  embaixo e prende para sempre uma placa em que cair.
- **Portões** abrem enquanto alguém pisa na placa `p` e ficam abertos por
  6 s depois disso. A placa `x` fecha o portão de uma vez.
- **Lâminas** fecham a cada 2 s.
- **Poções**: a pequena cura 1 de vida. A grande aumenta a vida máxima, e
  esse aumento continua nas fases seguintes.
- **Duelos**: o herói saca a espada quando um guarda está perto, no mesmo
  andar e sem parede no meio.
  - O golpe acerta no 10º quadro, com alcance de 48 px.
  - Defender (↑) bloqueia um golpe recebido de frente e permite um
    contra-ataque rápido.
  - Recuar perto de um vão pode derrubar o personagem.
- **Tempo total**: 20 minutos para as 3 fases. Ao morrer, a fase recomeça,
  mas o relógio continua.

## Decisões

- **Agarrar no ar exige segurar "ação".** Assim, um pulo comum não prende o
  herói em bordas por acidente. Também não dá para agarrar uma borda mais de
  meio andar acima do ponto do pulo.
- **Pendurado, o herói não cai sozinho.** Basta tocar ↓ para soltar ou ↑
  para subir. Isso evita segurar dois botões no celular.
- **Toque na ponta do pé.** Num pulo que chega rente à borda, o herói pousa
  se a ponta do pé alcançar o piso. É mais tolerante no toque.
