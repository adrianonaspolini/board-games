import 'package:flutter_test/flutter_test.dart';
import 'package:jogos_tabuleiro/engine/board_graph.dart';
import 'package:jogos_tabuleiro/games/onca/onca_board.dart';

import '../../helpers/onca_helpers.dart';

void main() {
  final board = OncaBoard.build();

  test('tem 31 pontos: 25 da grade e 6 da toca', () {
    expect(board.size, 31);
    expect(board.points.where((p) => p.y <= 4).length, 25);
    expect(board.points.where((p) => p.y > 4).length, 6);
  });

  test('cada ponto tem o número esperado de conexões', () {
    // Grau esperado, linha a linha (grade 5x5) e depois a toca.
    const expected = <int>[
      3, 3, 5, 3, 3, // linha 0
      3, 8, 4, 8, 3, // linha 1
      5, 4, 8, 4, 5, // linha 2
      3, 8, 4, 8, 3, // linha 3
      3, 3, 8, 3, 3, // linha 4 (22 = vértice da toca)
      3, 4, 3, // toca, linha 5
      2, 3, 2, // toca, linha 6
    ];
    for (var id = 0; id < 31; id++) {
      expect(board.neighbors(id).length, expected[id], reason: 'ponto $id');
    }
    expect(board.edges.length, 66);
  });

  test('diagonais só passam por pontos com linha + coluna par', () {
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 5; c++) {
        final diagonals = board
            .neighbors(pt(r, c))
            .map((n) => board.points[n])
            .where((p) => p.x != c && p.y != r);
        if ((r + c).isOdd) {
          expect(diagonals, isEmpty, reason: '($r,$c)');
        } else {
          expect(diagonals, isNotEmpty, reason: '($r,$c)');
        }
      }
    }
  });

  test('a toca se liga à grade só pelo vértice central da última fileira', () {
    expect(board.neighbors(OncaBoard.denApex),
        containsAll([pt(5, 1), pt(5, 2), pt(5, 3)]));
    for (final d in OncaBoard.denPoints) {
      for (final n in board.neighbors(d)) {
        final isDen = OncaBoard.denPoints.contains(n);
        expect(isDen || n == OncaBoard.denApex, isTrue,
            reason: '$d ligado a $n');
      }
    }
    expect(board.neighbors(pt(5, 1)), unorderedEquals([22, 26, 28]));
    expect(board.neighbors(pt(5, 2)), unorderedEquals([22, 25, 27, 29]));
    expect(board.neighbors(pt(5, 3)), unorderedEquals([22, 26, 30]));
    expect(board.neighbors(pt(6, 0)), unorderedEquals([25, 29]));
    expect(board.neighbors(pt(6, 2)), unorderedEquals([26, 28, 30]));
    expect(board.neighbors(pt(6, 4)), unorderedEquals([27, 29]));
  });

  test('saltos seguem linhas retas, inclusive atravessando o vértice', () {
    expect(board.jumpsFrom(pt(3, 3)), contains(const Jump(22, 25)));
    expect(board.jumpsFrom(pt(3, 1)), contains(const Jump(22, 27)));
    expect(board.jumpsFrom(pt(3, 2)), contains(const Jump(22, 26)));
    expect(board.jumpsFrom(pt(4, 2)), contains(const Jump(26, 29)));
    expect(board.jumpsFrom(pt(4, 2)), contains(const Jump(25, 28)));
    expect(board.jumpsFrom(pt(5, 1)), contains(const Jump(26, 27)));
    expect(board.jumpsFrom(pt(6, 0)), contains(const Jump(29, 30)));
    // Não há linha reta 21-22-25 nem 25-26-30.
    expect(board.jumpsFrom(pt(4, 1)).any((j) => j.landing == 25), isFalse);
    expect(board.jumpsFrom(25).any((j) => j.landing == 30), isFalse);
  });

  test('pontos colineares nas coordenadas de desenho', () {
    for (final line in board.lines) {
      final a = board.points[line.first];
      final b = board.points[line[1]];
      for (final id in line) {
        final p = board.points[id];
        final cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
        expect(cross, 0, reason: 'linha $line');
      }
    }
  });
}
