import 'package:flutter_test/flutter_test.dart';
import 'package:jogos_tabuleiro/ai/ai_runner.dart';
import 'package:jogos_tabuleiro/ai/difficulty.dart';
import 'package:jogos_tabuleiro/engine/engine.dart';
import 'package:jogos_tabuleiro/games/onca/onca_config.dart';
import 'package:jogos_tabuleiro/games/onca/onca_evaluator.dart';
import 'package:jogos_tabuleiro/games/onca/onca_rules.dart';

/// Joga uma partida completa IA × IA e devolve a sessão final.
GameSession playOut(OncaRules rules, Difficulty onca, Difficulty dogs, int seed,
    {int maxPlies = 600}) {
  final evaluator = OncaEvaluator(rules);
  final session = GameSession(rules);
  var i = 0;
  while (!session.outcome.isOver) {
    expect(i++, lessThan(maxPlies), reason: 'partida não terminou');
    final state = session.state;
    final level = state.toMove == OncaSides.onca ? onca : dogs;
    final move = chooseAiMove(
      rules: rules,
      evaluator: evaluator,
      state: state,
      difficulty: level,
      drawingPositions: session.drawingPositions,
      seed: seed + i,
    );
    expect(move, isNotNull);
    session.play(move!); // play() valida a legalidade do lance
  }
  return session;
}

void main() {
  test('partidas completas IA × IA terminam sem erro', () {
    final rules = OncaRules();
    final results = <String>[];
    for (final (onca, dogs, seed) in [
      (Difficulty.easy, Difficulty.easy, 1),
      (Difficulty.medium, Difficulty.easy, 2),
      (Difficulty.easy, Difficulty.medium, 3),
      (Difficulty.medium, Difficulty.medium, 4),
      (Difficulty.hard, Difficulty.medium, 5),
    ]) {
      final s = playOut(rules, onca, dogs, seed);
      results.add('${onca.name}×${dogs.name}: ${s.outcome} '
          'em ${s.moves.length} jogadas');
    }
    // ignore: avoid_print
    print(results.join('\n'));
  }, timeout: const Timeout(Duration(minutes: 5)));

  test('partida com onça começando depois e captura obrigatória', () {
    final rules = OncaRules(
        const OncaConfig(firstPlayer: OncaSides.dogs, mandatoryCapture: true));
    final s = playOut(rules, Difficulty.easy, Difficulty.easy, 99);
    expect(s.outcome.isOver, isTrue);
  });

  test('vitória e derrota são alcançáveis', () {
    final rules = OncaRules();
    final dogsWin = playOut(rules, Difficulty.easy, Difficulty.hard, 11);
    expect(dogsWin.outcome,
        isA<Win>().having((w) => w.winner, 'vencedor', OncaSides.dogs));
    final oncaWin = playOut(rules, Difficulty.medium, Difficulty.easy, 12);
    expect(oncaWin.outcome,
        isA<Win>().having((w) => w.winner, 'vencedor', OncaSides.onca));
  });
}
