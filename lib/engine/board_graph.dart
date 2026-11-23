/// Grafo genérico de tabuleiro: pontos com coordenadas e linhas que os ligam.
///
/// O tabuleiro é descrito por [lines]: cada linha é uma sequência ordenada de
/// pontos em linha reta. Pontos consecutivos numa linha são adjacentes, e um
/// "salto" (captura) é sempre feito ao longo de uma mesma linha: de `a`,
/// passando por `b`, até `c`, onde `a, b, c` são consecutivos na linha.
///
/// Declarar linhas explicitamente (em vez de vetores de direção) evita
/// ambiguidades em tabuleiros irregulares, como a toca do Jogo da Onça.
library;

/// Um ponto do tabuleiro.
///
/// [x] e [y] são coordenadas lógicas usadas apenas para desenhar; as regras
/// usam somente [id] e as conexões do grafo.
class BoardPoint {
  const BoardPoint(this.id, this.x, this.y);

  final int id;
  final double x;
  final double y;

  @override
  String toString() => 'P$id($x,$y)';
}

/// Um salto ao longo de uma linha: de um ponto, sobre [over], até [landing].
class Jump {
  const Jump(this.over, this.landing);

  final int over;
  final int landing;

  @override
  bool operator ==(Object other) =>
      other is Jump && other.over == over && other.landing == landing;

  @override
  int get hashCode => Object.hash(over, landing);

  @override
  String toString() => 'Jump(over: $over, landing: $landing)';
}

class BoardGraph {
  BoardGraph({required List<BoardPoint> points, required List<List<int>> lines})
      : points = List.unmodifiable(points),
        lines = List.unmodifiable(lines.map(List<int>.unmodifiable)) {
    for (var i = 0; i < this.points.length; i++) {
      if (this.points[i].id != i) {
        throw ArgumentError('Os ids dos pontos devem ser 0..n-1 em ordem.');
      }
    }
    final adj = List.generate(this.points.length, (_) => <int>{});
    final jumps = List.generate(this.points.length, (_) => <Jump>{});
    for (final line in this.lines) {
      for (final id in line) {
        RangeError.checkValidIndex(id, this.points, 'id da linha');
      }
      for (var i = 0; i + 1 < line.length; i++) {
        adj[line[i]].add(line[i + 1]);
        adj[line[i + 1]].add(line[i]);
      }
      for (var i = 0; i + 2 < line.length; i++) {
        jumps[line[i]].add(Jump(line[i + 1], line[i + 2]));
        jumps[line[i + 2]].add(Jump(line[i + 1], line[i]));
      }
    }
    _adjacency = List.unmodifiable(
        adj.map((s) => List<int>.unmodifiable(s.toList()..sort())));
    _jumps = List.unmodifiable(jumps.map((s) => List<Jump>.unmodifiable(s)));
  }

  final List<BoardPoint> points;

  /// Linhas retas do tabuleiro (sequências ordenadas de ids de pontos).
  final List<List<int>> lines;

  late final List<List<int>> _adjacency;
  late final List<List<Jump>> _jumps;

  int get size => points.length;

  /// Pontos ligados diretamente a [id] por uma linha.
  List<int> neighbors(int id) => _adjacency[id];

  /// Saltos possíveis partindo de [id] (sem considerar ocupação).
  List<Jump> jumpsFrom(int id) => _jumps[id];

  bool areAdjacent(int a, int b) => _adjacency[a].contains(b);

  /// Todas as arestas (pares não ordenados, `a < b`).
  Iterable<(int, int)> get edges sync* {
    for (var a = 0; a < size; a++) {
      for (final b in _adjacency[a]) {
        if (a < b) yield (a, b);
      }
    }
  }
}
