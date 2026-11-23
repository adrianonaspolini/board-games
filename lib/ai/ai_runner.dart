import 'dart:isolate';
import 'dart:math';

import '../engine/game_rules.dart';
import '../engine/game_state.dart';
import '../engine/move.dart';
import 'difficulty.dart';
import 'evaluator.dart';
import 'minimax.dart';

/// Calcula o lance da IA em um isolate separado, sem travar a UI.
///
/// [rules], [evaluator] e [state] são objetos imutáveis de Dart puro e são
/// copiados para o isolate. [seed] permite resultados reproduzíveis.
Future<Move?> computeAiMove({
  required GameRules rules,
  required Evaluator evaluator,
  required GameState state,
  required Difficulty difficulty,
  Set<String> drawingPositions = const {},
  int? seed,
}) {
  return Isolate.run(() => chooseAiMove(
        rules: rules,
        evaluator: evaluator,
        state: state,
        difficulty: difficulty,
        drawingPositions: drawingPositions,
        seed: seed,
      ));
}

/// Versão síncrona (mesma thread), usada pelo isolate e pelos testes.
Move? chooseAiMove({
  required GameRules rules,
  required Evaluator evaluator,
  required GameState state,
  required Difficulty difficulty,
  Set<String> drawingPositions = const {},
  int? seed,
}) {
  return MinimaxAi(
    rules: rules,
    evaluator: evaluator,
    depth: difficulty.depth,
    noise: difficulty.noise,
    random: Random(seed),
  ).chooseMove(state, drawingPositions: drawingPositions);
}
