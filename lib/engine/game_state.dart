import 'piece.dart';

/// Estado imutável de uma partida.
///
/// É genérico o bastante para jogos de captura em grafo (Onça, Alquerque,
/// Damas, Resta Um). Jogos com informações extras (ex.: peças na mão na
/// Trilha) podem acrescentar campos estendendo esta classe ou usando [extra].
class GameState {
  GameState({
    required List<Piece?> cells,
    required this.toMove,
    List<int> capturedBy = const [0, 0],
    this.chainPiece,
    this.pliesSinceCapture = 0,
    this.ply = 0,
    Map<String, int> extra = const {},
  })  : cells = List.unmodifiable(cells),
        capturedBy = List.unmodifiable(capturedBy),
        extra = Map.unmodifiable(extra);

  /// Ocupação de cada ponto (índice = id do ponto).
  final List<Piece?> cells;

  /// Jogador da vez.
  final PlayerId toMove;

  /// Quantidade de peças capturadas por cada jogador.
  final List<int> capturedBy;

  /// Ponto da peça que está no meio de uma sequência de capturas, se houver.
  /// Enquanto não for nulo, só essa peça pode jogar (capturar de novo ou
  /// encerrar a sequência).
  final int? chainPiece;

  /// Jogadas consecutivas sem nenhuma captura.
  final int pliesSinceCapture;

  /// Número de jogadas (lances atômicos) desde o início.
  final int ply;

  /// Contadores extras específicos de cada jogo.
  final Map<String, int> extra;

  Piece? operator [](int point) => cells[point];

  bool isEmpty(int point) => cells[point] == null;

  /// Pontos ocupados por peças de [player].
  Iterable<int> pointsOf(PlayerId player) sync* {
    for (var i = 0; i < cells.length; i++) {
      if (cells[i]?.owner == player) yield i;
    }
  }

  int countOf(PlayerId player) => pointsOf(player).length;

  /// Chave da posição para detecção de repetição: considera tipo e dono
  /// das peças em cada ponto, o jogador da vez e a sequência em andamento,
  /// mas ignora a identidade ([Piece.id]) das peças.
  String get positionKey {
    final b = StringBuffer();
    for (final c in cells) {
      b.write(c == null ? '.' : '${c.owner}${c.type[0]}');
    }
    b
      ..write('|')
      ..write(toMove)
      ..write('|')
      ..write(chainPiece ?? '-');
    return b.toString();
  }

  GameState copyWith({
    List<Piece?>? cells,
    PlayerId? toMove,
    List<int>? capturedBy,
    int? Function()? chainPiece,
    int? pliesSinceCapture,
    int? ply,
    Map<String, int>? extra,
  }) {
    return GameState(
      cells: cells ?? this.cells,
      toMove: toMove ?? this.toMove,
      capturedBy: capturedBy ?? this.capturedBy,
      chainPiece: chainPiece != null ? chainPiece() : this.chainPiece,
      pliesSinceCapture: pliesSinceCapture ?? this.pliesSinceCapture,
      ply: ply ?? this.ply,
      extra: extra ?? this.extra,
    );
  }

  @override
  String toString() => 'GameState(ply: $ply, toMove: $toMove, '
      'captured: $capturedBy, chain: $chainPiece)';
}
