import 'package:jogos_tabuleiro/engine/engine.dart';
import 'package:jogos_tabuleiro/games/onca/onca_board.dart';
import 'package:jogos_tabuleiro/games/onca/onca_config.dart';

/// Id de um ponto a partir de (linha, coluna), incluindo a toca.
int pt(int row, int col) {
  if (row < OncaBoard.gridSize) return OncaBoard.gridId(row, col);
  const den = {
    (5, 1): 25,
    (5, 2): 26,
    (5, 3): 27,
    (6, 0): 28,
    (6, 2): 29,
    (6, 4): 30,
  };
  return den[(row, col)] ?? (throw ArgumentError('Ponto inexistente'));
}

/// Monta um estado com a onça em [onca] e cachorros em [dogs].
GameState position({
  required int onca,
  required List<int> dogs,
  int toMove = OncaSides.onca,
  int captured = 0,
  int? chainPiece,
  int pliesSinceCapture = 0,
}) {
  final cells = List<Piece?>.filled(31, null);
  cells[onca] =
      const Piece(id: 0, owner: OncaSides.onca, type: OncaPieces.onca);
  var id = 1;
  for (final d in dogs) {
    cells[d] = Piece(id: id++, owner: OncaSides.dogs, type: OncaPieces.dog);
  }
  return GameState(
    cells: cells,
    toMove: toMove,
    capturedBy: [captured, 0],
    chainPiece: chainPiece,
    pliesSinceCapture: pliesSinceCapture,
  );
}
