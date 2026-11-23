/// Geometria do tabuleiro do Jogo da Onça (31 pontos).
///
/// ```text
///  coluna:  0   1   2   3   4
///  linha 0  o---o---o---o---o        ids  0  1  2  3  4
///           | \ | / | \ | / |
///  linha 1  o---o---o---o---o             5  6  7  8  9
///           | / | \ | / | \ |
///  linha 2  o---o---O---o---o            10 11 12 13 14    (12 = centro)
///           | \ | / | \ | / |
///  linha 3  o---o---o---o---o            15 16 17 18 19
///           | / | \ | / | \ |
///  linha 4  o---o---o---o---o            20 21 22 23 24    (22 = vértice da toca)
///                 / | \
///  linha 5       o--o--o                   25 26 27        (colunas 1, 2, 3)
///               /   |   \
///  linha 6     o----o----o                28 29 30         (colunas 0, 2, 4)
/// ```
///
/// * Grade 5x5 com linhas horizontais e verticais.
/// * Diagonais no padrão alquerque: só passam pelos pontos em que
///   `linha + coluna` é par.
/// * A toca é um triângulo acoplado embaixo, com vértice no ponto central da
///   última fileira da grade (linha 4, coluna 2). Tem 6 pontos em duas
///   fileiras de 3, ligados por:
///   - a vertical central, que continua a coluna 2 até a base (22-26-29);
///   - as horizontais de cada fileira (25-26-27 e 28-29-30);
///   - as laterais do triângulo (22-25-28 e 22-27-30).
/// * As laterais do triângulo estão alinhadas com as diagonais da grade que
///   chegam ao vértice: 14-18-22-25-28 e 10-16-22-27-30 são linhas retas.
///   Por isso a onça pode capturar "atravessando" o vértice (ex.: de 18,
///   sobre 22, até 25). Ver docs/regras-onca.md.
///
/// As coordenadas (x = coluna, y = linha) são usadas só para desenhar.
library;

import '../../engine/board_graph.dart';

abstract final class OncaBoard {
  static const gridSize = 5;

  /// Id de um ponto da grade 5x5.
  static int gridId(int row, int col) => row * gridSize + col;

  static const center = 12;
  static const denApex = 22;

  /// Pontos da toca (fora da grade), na ordem dos ids.
  static const denPoints = [25, 26, 27, 28, 29, 30];

  static const _denCoords = <(int, int)>[
    (5, 1), (5, 2), (5, 3), // 25 26 27
    (6, 0), (6, 2), (6, 4), // 28 29 30
  ];

  static BoardGraph build() {
    final points = <BoardPoint>[
      for (var r = 0; r < gridSize; r++)
        for (var c = 0; c < gridSize; c++)
          BoardPoint(gridId(r, c), c.toDouble(), r.toDouble()),
      for (var i = 0; i < _denCoords.length; i++)
        BoardPoint(
            25 + i, _denCoords[i].$2.toDouble(), _denCoords[i].$1.toDouble()),
    ];

    final lines = <List<int>>[
      // Horizontais da grade.
      for (var r = 0; r < gridSize; r++)
        [for (var c = 0; c < gridSize; c++) gridId(r, c)],
      // Verticais da grade (a coluna 2 continua pela toca).
      for (var c = 0; c < gridSize; c++)
        [
          for (var r = 0; r < gridSize; r++) gridId(r, c),
          if (c == 2) ...[26, 29],
        ],
      // Diagonais "\" (linha - coluna constante), só onde linha+coluna é par.
      [2, 8, 14],
      [0, 6, 12, 18, 24],
      [10, 16, 22, 27, 30], // continua pela lateral direita da toca
      // Diagonais "/" (linha + coluna constante).
      [2, 6, 10],
      [4, 8, 12, 16, 20],
      [14, 18, 22, 25, 28], // continua pela lateral esquerda da toca
      // Horizontais da toca.
      [25, 26, 27],
      [28, 29, 30],
    ];

    return BoardGraph(points: points, lines: lines);
  }
}
