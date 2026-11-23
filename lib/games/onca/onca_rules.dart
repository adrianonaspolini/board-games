import '../../engine/board_graph.dart';
import '../../engine/game_outcome.dart';
import '../../engine/game_rules.dart';
import '../../engine/game_state.dart';
import '../../engine/move.dart';
import '../../engine/piece.dart';
import 'onca_board.dart';
import 'onca_config.dart';

/// Regras do Jogo da Onça.
class OncaRules implements GameRules {
  OncaRules([this.config = const OncaConfig()]) : board = OncaBoard.build();

  final OncaConfig config;

  @override
  final BoardGraph board;

  @override
  int? get repetitionDrawCount => config.repetitionDrawCount;

  /// Pontos iniciais dos cachorros: as duas fileiras opostas à toca (linhas
  /// 0 e 1) e a fileira do meio (linha 2) exceto o centro.
  static final List<int> initialDogPoints = List.unmodifiable([
    for (var id = 0; id < 15; id++)
      if (id != OncaBoard.center) id,
  ]);

  @override
  GameState initialState() {
    final cells = List<Piece?>.filled(board.size, null);
    cells[OncaBoard.center] =
        const Piece(id: 0, owner: OncaSides.onca, type: OncaPieces.onca);
    var nextId = 1;
    for (final p in initialDogPoints) {
      cells[p] =
          Piece(id: nextId++, owner: OncaSides.dogs, type: OncaPieces.dog);
    }
    return GameState(cells: cells, toMove: config.firstPlayer);
  }

  /// Ponto onde está a onça (sempre existe: a onça nunca é capturada).
  int oncaPoint(GameState state) {
    for (var i = 0; i < state.cells.length; i++) {
      if (state.cells[i]?.type == OncaPieces.onca) return i;
    }
    throw StateError('Onça não encontrada no tabuleiro.');
  }

  /// Capturas disponíveis para a onça em [from], independentemente da vez.
  List<CaptureMove> capturesFrom(GameState state, int from) => [
        for (final j in board.jumpsFrom(from))
          if (state[j.over]?.owner == OncaSides.dogs &&
              state.isEmpty(j.landing))
            CaptureMove(from, j.over, j.landing),
      ];

  List<StepMove> stepsFrom(GameState state, int from) => [
        for (final n in board.neighbors(from))
          if (state.isEmpty(n)) StepMove(from, n),
      ];

  /// Lances da onça em [state], ignorando de quem é a vez (útil para a IA
  /// medir a mobilidade da onça).
  List<Move> oncaMoves(GameState state) {
    final from = oncaPoint(state);
    final captures = capturesFrom(state, from);
    if (config.mandatoryCapture && captures.isNotEmpty) return captures;
    return [...captures, ...stepsFrom(state, from)];
  }

  List<Move> dogMoves(GameState state) => [
        for (final p in state.pointsOf(OncaSides.dogs)) ...stepsFrom(state, p),
      ];

  bool _decidedWithoutMoves(GameState state) {
    if (state.capturedBy[OncaSides.onca] >= config.capturesToWin) return true;
    final limit = config.noCaptureDrawPlies;
    return state.chainPiece == null &&
        limit != null &&
        state.pliesSinceCapture >= limit;
  }

  List<Move> _movesIgnoringOutcome(GameState state) {
    final chain = state.chainPiece;
    if (chain != null) {
      return [
        ...capturesFrom(state, chain),
        if (!config.mandatoryCapture) const EndChainMove(),
      ];
    }
    return state.toMove == OncaSides.onca ? oncaMoves(state) : dogMoves(state);
  }

  @override
  List<Move> legalMoves(GameState state) {
    if (_decidedWithoutMoves(state)) return const [];
    return _movesIgnoringOutcome(state);
  }

  @override
  GameState apply(GameState state, Move move) {
    switch (move) {
      case StepMove(:final from, :final to):
        _require(
            state.chainPiece == null, 'sequência de capturas em andamento');
        _require(state[from]?.owner == state.toMove, 'peça não é da vez');
        _require(board.areAdjacent(from, to) && state.isEmpty(to),
            'destino inválido');
        final cells = [...state.cells];
        cells[to] = cells[from];
        cells[from] = null;
        return state.copyWith(
          cells: cells,
          toMove: opponentOf(state.toMove),
          pliesSinceCapture: state.pliesSinceCapture + 1,
          ply: state.ply + 1,
        );

      case CaptureMove(:final from, :final captured, :final to):
        _require(state.toMove == OncaSides.onca, 'só a onça captura');
        _require(state[from]?.type == OncaPieces.onca, 'peça não é a onça');
        _require(state.chainPiece == null || state.chainPiece == from,
            'a sequência deve continuar com a mesma peça');
        _require(board.jumpsFrom(from).contains(Jump(captured, to)),
            'salto fora de linha');
        _require(state[captured]?.owner == OncaSides.dogs && state.isEmpty(to),
            'captura inválida');
        final cells = [...state.cells];
        cells[to] = cells[from];
        cells[from] = null;
        cells[captured] = null;
        final capturedBy = [...state.capturedBy];
        capturedBy[OncaSides.onca]++;
        final afterJump = state.copyWith(
          cells: cells,
          capturedBy: capturedBy,
          pliesSinceCapture: 0,
          ply: state.ply + 1,
        );
        final won = capturedBy[OncaSides.onca] >= config.capturesToWin;
        final canContinue = !won && capturesFrom(afterJump, to).isNotEmpty;
        return canContinue
            ? afterJump.copyWith(chainPiece: () => to)
            : afterJump.copyWith(
                chainPiece: () => null,
                toMove: opponentOf(state.toMove),
              );

      case EndChainMove():
        _require(state.chainPiece != null, 'não há sequência para encerrar');
        _require(!config.mandatoryCapture, 'captura obrigatória');
        return state.copyWith(
          chainPiece: () => null,
          toMove: opponentOf(state.toMove),
          ply: state.ply + 1,
        );
    }
  }

  @override
  GameOutcome outcome(GameState state) {
    if (state.capturedBy[OncaSides.onca] >= config.capturesToWin) {
      return const Win(OncaSides.onca, OncaReasons.captures);
    }
    if (state.chainPiece != null) return const Ongoing();
    if (_movesIgnoringOutcome(state).isEmpty) {
      return state.toMove == OncaSides.onca
          ? const Win(OncaSides.dogs, OncaReasons.trapped)
          : const Win(OncaSides.onca, OncaReasons.dogsBlocked);
    }
    final limit = config.noCaptureDrawPlies;
    if (limit != null && state.pliesSinceCapture >= limit) {
      return const Draw(OncaReasons.noCapture);
    }
    return const Ongoing();
  }

  static void _require(bool condition, String message) {
    if (!condition) throw ArgumentError('Lance inválido: $message');
  }
}
