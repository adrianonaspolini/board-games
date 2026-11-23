import 'package:flutter_test/flutter_test.dart';
import 'package:jogos_tabuleiro/engine/board_graph.dart';

void main() {
  BoardGraph line(int n) => BoardGraph(
        points: [for (var i = 0; i < n; i++) BoardPoint(i, i.toDouble(), 0)],
        lines: [
          [for (var i = 0; i < n; i++) i],
        ],
      );

  test('pontos consecutivos numa linha são adjacentes', () {
    final g = line(4);
    expect(g.neighbors(0), [1]);
    expect(g.neighbors(1), [0, 2]);
    expect(g.areAdjacent(2, 3), isTrue);
    expect(g.areAdjacent(0, 2), isFalse);
    expect(g.edges.length, 3);
  });

  test('saltos nos dois sentidos da linha', () {
    final g = line(3);
    expect(g.jumpsFrom(0), [const Jump(1, 2)]);
    expect(g.jumpsFrom(2), [const Jump(1, 0)]);
    expect(g.jumpsFrom(1), isEmpty);
  });

  test('rejeita ids fora de ordem ou linhas inválidas', () {
    expect(
      () => BoardGraph(points: [const BoardPoint(1, 0, 0)], lines: []),
      throwsArgumentError,
    );
    expect(
      () => BoardGraph(points: [
        const BoardPoint(0, 0, 0)
      ], lines: [
        [0, 5],
      ]),
      throwsRangeError,
    );
  });
}
