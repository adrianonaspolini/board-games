# Jogo da Onça: regras adotadas

Este documento registra as regras implementadas em `lib/games/onca/` e as
decisões tomadas onde a descrição tradicional é ambígua. Tudo o que está
marcado como **configurável** fica em `OncaConfig`
(`lib/games/onca/onca_config.dart`).

## Tabuleiro (31 pontos)

```text
 coluna:  0   1   2   3   4
 linha 0  o---o---o---o---o        ids  0  1  2  3  4
          | \ | / | \ | / |
 linha 1  o---o---o---o---o             5  6  7  8  9
          | / | \ | / | \ |
 linha 2  o---o---O---o---o            10 11 12 13 14    (12 = centro)
          | \ | / | \ | / |
 linha 3  o---o---o---o---o            15 16 17 18 19
          | / | \ | / | \ |
 linha 4  o---o---o---o---o            20 21 22 23 24    (22 = vértice da toca)
                / | \
 linha 5       o--o--o                   25 26 27
              /   |   \
 linha 6     o----o----o                28 29 30
```

- Grade 5x5 com linhas horizontais e verticais.
- Diagonais no padrão alquerque: só passam pelos pontos em que
  `linha + coluna` é par.
- A toca é um triângulo acoplado ao lado de baixo, com vértice no ponto 22
  (centro da última fileira). Ela tem 6 pontos em duas fileiras de 3, ligados
  pela vertical central (22-26-29), pelas horizontais (25-26-27 e 28-29-30)
  e pelas laterais do triângulo (22-25-28 e 22-27-30).
- Ao todo são 31 pontos e 66 ligações. O teste
  `test/games/onca/onca_board_test.dart` confere o número de ligações de cada
  ponto.

## Peças e posição inicial

- 1 onça e 14 cachorros.
- A onça começa no centro (ponto 12).
- Os cachorros ocupam as linhas 0 e 1 (10 pontos) e a linha 2, exceto o
  centro (4 pontos).
- **A onça joga primeiro**. Isso é configurável (`firstPlayer`).

## Movimento e captura

- Cada jogador move uma peça por vez, para um ponto vizinho vazio, seguindo
  as linhas.
- Só a onça captura: ela salta em linha reta sobre um cachorro vizinho e
  cai no ponto vazio logo depois, na mesma linha. O cachorro saltado sai do
  jogo.
- A onça pode encadear capturas na mesma jogada, e o jogador escolhe se
  continua ou para.
- **A captura não é obrigatória** por padrão. Isso é configurável
  (`mandatoryCapture`).

## Fim de partida

- A onça vence ao capturar **5 cachorros** (configurável: `capturesToWin`).
- Os cachorros vencem quando a onça, na vez dela, não tem nenhum movimento
  nem captura possível.
- Empates, ambos ativados por padrão e configuráveis:
  - repetição da mesma posição 3 vezes (`repetitionDrawCount`);
  - 100 jogadas seguidas sem captura, ou seja, 50 lances de cada lado
    (`noCaptureDrawPlies`).

## Decisões tomadas onde a regra é ambígua

1. **As laterais da toca continuam as diagonais da grade.** As linhas
   14-18-22-25-28 e 10-16-22-27-30 são retas, então a onça pode capturar
   "atravessando" o vértice (por exemplo, de 18 sobre 22 até 25). A coluna
   central também continua pela toca (… 17-22-26-29). Essa é a forma mais
   comum de desenhar o tabuleiro, com o triângulo alinhado às diagonais.
2. **Capturas em sequência.** Cada salto é um lance separado. Depois de um
   salto, se houver outro possível, só a mesma onça pode continuar, e o
   jogador pode tocar em "Encerrar capturas". Uma sequência que não tem mais
   saltos termina sozinha. Com captura obrigatória, não é possível encerrar
   a sequência antes da hora.
3. **A sequência para ao atingir 5 capturas**, porque a partida termina ali.
4. **Cachorros sem movimento.** É um caso raro, que a tradição não define.
   Adotamos que a onça vence (motivo `dogsBlocked`).
5. **Repetição.** A posição conta as peças em cada ponto, o jogador da vez e
   a sequência de capturas em andamento. Desfazer um lance também desfaz a
   contagem.
6. **Contagem para o empate sem captura.** Contamos jogadas individuais (de
   qualquer lado). Encerrar uma sequência não zera o contador, mas qualquer
   captura zera.
7. **Os cachorros começando (opção).** Nesse caso, qualquer primeiro lance
   dos cachorros abre uma captura para a onça. Isso é consequência da
   posição inicial e foi mantido.
