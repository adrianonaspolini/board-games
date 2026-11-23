import 'game_outcome.dart';
import 'game_rules.dart';
import 'game_state.dart';
import 'move.dart';

/// Partida em andamento: histórico de estados imutáveis, desfazer e
/// detecção de repetição de posição.
class GameSession {
  /// [initial] permite começar de uma posição específica (testes,
  /// problemas); por padrão usa `rules.initialState()`.
  GameSession(this.rules, {GameState? initial}) : _initial = initial {
    restart();
  }

  final GameRules rules;
  final GameState? _initial;

  final List<GameState> _states = [];
  final List<Move> _moves = [];
  final Map<String, int> _repetitions = {};

  GameState get state => _states.last;

  List<GameState> get states => List.unmodifiable(_states);

  List<Move> get moves => List.unmodifiable(_moves);

  Move? get lastMove => _moves.isEmpty ? null : _moves.last;

  bool get canUndo => _moves.isNotEmpty;

  GameOutcome get outcome {
    final base = rules.outcome(state);
    if (base.isOver) return base;
    final limit = rules.repetitionDrawCount;
    if (limit != null && (_repetitions[state.positionKey] ?? 0) >= limit) {
      return const Draw(OutcomeReasons.repetition);
    }
    return base;
  }

  /// Chaves de posições que, se alcançadas mais uma vez, empatam por
  /// repetição. Útil para a IA evitar (ou buscar) o empate.
  Set<String> get drawingPositions {
    final limit = rules.repetitionDrawCount;
    if (limit == null) return const {};
    return {
      for (final e in _repetitions.entries)
        if (e.value >= limit - 1) e.key,
    };
  }

  List<Move> get legalMoves =>
      outcome.isOver ? const [] : rules.legalMoves(state);

  /// Aplica [move]; lança [ArgumentError] se o lance não for legal.
  void play(Move move) {
    if (!legalMoves.contains(move)) {
      throw ArgumentError('Lance ilegal: $move');
    }
    final next = rules.apply(state, move);
    _states.add(next);
    _moves.add(move);
    _count(next, 1);
  }

  /// Desfaz o último lance. Retorna `false` se não houver o que desfazer.
  bool undo() {
    if (!canUndo) return false;
    _count(_states.removeLast(), -1);
    _moves.removeLast();
    return true;
  }

  void restart() {
    _states
      ..clear()
      ..add(_initial ?? rules.initialState());
    _moves.clear();
    _repetitions.clear();
    _count(state, 1);
  }

  void _count(GameState s, int delta) {
    final key = s.positionKey;
    final n = (_repetitions[key] ?? 0) + delta;
    if (n <= 0) {
      _repetitions.remove(key);
    } else {
      _repetitions[key] = n;
    }
  }
}
