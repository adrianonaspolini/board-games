import '../engine/game_state.dart';
import '../engine/piece.dart';

/// Função de avaliação heurística, específica de cada jogo.
///
/// Deve devolver um valor do ponto de vista de [perspective] (maior = melhor
/// para ele) para estados ainda não terminados. Estados terminais são
/// tratados pelo [MinimaxAi] usando `GameRules.outcome`.
abstract interface class Evaluator {
  double evaluate(GameState state, PlayerId perspective);
}
