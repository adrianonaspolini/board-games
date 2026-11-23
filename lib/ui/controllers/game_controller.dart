import 'package:flutter/foundation.dart';

import '../../ai/ai_runner.dart';
import '../../ai/difficulty.dart';
import '../../ai/evaluator.dart';
import '../../engine/engine.dart';

enum GameMode { vsAi, twoPlayers }

/// Assinatura da função que calcula o lance da IA (injetável em testes).
typedef AiMoveFn = Future<Move?> Function({
  required GameRules rules,
  required Evaluator evaluator,
  required GameState state,
  required Difficulty difficulty,
  Set<String> drawingPositions,
  int? seed,
});

/// Estado de tela de uma partida: seleção, destaques e vez da IA.
///
/// Por que `ChangeNotifier` (e não Riverpod): o estado de UI é pequeno e
/// local a uma tela, toda a lógica já vive no motor (Dart puro) e assim o
/// app não precisa de dependências nem de conceitos extras. Se o app
/// crescer (perfis, estatísticas, configurações globais), este controller
/// pode ser exposto por um provider sem mudanças nas regras.
class GameController extends ChangeNotifier {
  GameController({
    required this.rules,
    required this.evaluator,
    required this.mode,
    this.humanSide = 0,
    this.difficulty = Difficulty.medium,
    AiMoveFn? aiMove,
    this.minAiDelay = const Duration(milliseconds: 450),
    GameState? initialState,
  })  : _aiMove = aiMove ?? computeAiMove,
        session = GameSession(rules, initial: initialState);

  final GameRules rules;
  final Evaluator evaluator;
  final GameMode mode;

  /// Lado do jogador humano no modo contra a IA.
  final PlayerId humanSide;
  final Difficulty difficulty;

  /// Tempo mínimo entre o lance anterior e o da IA (deixa a animação
  /// terminar e torna o lance da IA perceptível).
  final Duration minAiDelay;

  final AiMoveFn _aiMove;
  final GameSession session;

  int? _selected;
  bool _aiThinking = false;
  int _aiToken = 0;
  bool _disposed = false;

  GameState get state => session.state;
  GameOutcome get outcome => session.outcome;
  Move? get lastMove => session.lastMove;
  bool get aiThinking => _aiThinking;

  bool isAi(PlayerId player) => mode == GameMode.vsAi && player != humanSide;

  bool get isHumanTurn => !outcome.isOver && !isAi(state.toMove);

  List<Move> get _humanMoves => isHumanTurn ? session.legalMoves : const [];

  /// Pontos com peças que o jogador da vez pode mover.
  Set<int> get selectablePoints => {
        for (final m in _humanMoves)
          if (m.origin case final int origin) origin,
      };

  /// Peça selecionada. Se só uma peça pode jogar (ex.: a onça, ou uma
  /// sequência de capturas), ela é selecionada automaticamente.
  int? get selected {
    final chain = state.chainPiece;
    if (chain != null && isHumanTurn) return chain;
    if (_selected != null && selectablePoints.contains(_selected)) {
      return _selected;
    }
    final selectable = selectablePoints;
    return selectable.length == 1 ? selectable.single : null;
  }

  /// Destinos válidos da peça selecionada.
  Set<int> get targets {
    final from = selected;
    if (from == null) return const {};
    return {
      for (final m in _humanMoves)
        if (m.origin == from) m.destination!,
    };
  }

  /// Destinos da peça selecionada que resultam em captura.
  Set<int> get captureTargets {
    final from = selected;
    if (from == null) return const {};
    return {
      for (final m in _humanMoves)
        if (m is CaptureMove && m.from == from) m.to,
    };
  }

  bool get canEndChain => _humanMoves.contains(const EndChainMove());

  /// Desfazer volta até a última vez do jogador humano (no modo contra a
  /// IA) ou um lance (2 jogadores).
  bool get canUndo {
    if (mode == GameMode.twoPlayers) return session.canUndo;
    final states = session.states;
    for (var i = 0; i < states.length - 1; i++) {
      if (states[i].toMove == humanSide) return true;
    }
    return false;
  }

  /// Inicia a partida (a IA joga se for a vez dela).
  void start() => _maybeRunAi();

  void tapPoint(int point) {
    if (!isHumanTurn) return;
    final from = selected;
    if (from != null && targets.contains(point)) {
      final move = _humanMoves
          .firstWhere((m) => m.origin == from && m.destination == point);
      _play(move);
      return;
    }
    if (state.chainPiece != null) return;
    _selected =
        (selectablePoints.contains(point) && point != _selected) ? point : null;
    _notify();
  }

  void endChain() {
    if (canEndChain) _play(const EndChainMove());
  }

  void undo() {
    if (!canUndo) return;
    _cancelAi();
    session.undo();
    if (mode == GameMode.vsAi) {
      while (session.canUndo && state.toMove != humanSide) {
        session.undo();
      }
    }
    _selected = null;
    _notify();
    _maybeRunAi();
  }

  void restart() {
    _cancelAi();
    session.restart();
    _selected = null;
    _notify();
    _maybeRunAi();
  }

  void _play(Move move) {
    session.play(move);
    _selected = null;
    _notify();
    _maybeRunAi();
  }

  void _cancelAi() {
    _aiToken++;
    _aiThinking = false;
  }

  Future<void> _maybeRunAi() async {
    if (_aiThinking || outcome.isOver || !isAi(state.toMove)) return;
    final token = ++_aiToken;
    _aiThinking = true;
    _notify();
    final started = DateTime.now();
    final move = await _aiMove(
      rules: rules,
      evaluator: evaluator,
      state: state,
      difficulty: difficulty,
      drawingPositions: session.drawingPositions,
    );
    final remaining = minAiDelay - DateTime.now().difference(started);
    if (remaining > Duration.zero) await Future<void>.delayed(remaining);
    if (_disposed || token != _aiToken) return;
    _aiThinking = false;
    if (move != null) {
      session.play(move);
    }
    _notify();
    _maybeRunAi(); // continua uma sequência de capturas da IA
  }

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _aiToken++;
    super.dispose();
  }
}
