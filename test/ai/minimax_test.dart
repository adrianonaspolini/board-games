import 'dart:math';

import 'package:flutter_test/flutter_test.dart';
import 'package:jogos_tabuleiro/ai/ai_runner.dart';
import 'package:jogos_tabuleiro/ai/difficulty.dart';
import 'package:jogos_tabuleiro/ai/minimax.dart';
import 'package:jogos_tabuleiro/engine/engine.dart';
import 'package:jogos_tabuleiro/games/onca/onca_config.dart';
import 'package:jogos_tabuleiro/games/onca/onca_evaluator.dart';
import 'package:jogos_tabuleiro/games/onca/onca_rules.dart';

import '../helpers/onca_helpers.dart';

void main() {
  final rules = OncaRules();
  final evaluator = OncaEvaluator(rules);

  MinimaxAi ai(int depth) => MinimaxAi(
      rules: rules, evaluator: evaluator, depth: depth, random: Random(1));

  test('a onça faz a captura que vence a partida', () {
    final s = position(onca: 12, dogs: [17, 0, 1, 2], captured: 4);
    expect(ai(2).chooseMove(s), const CaptureMove(12, 17, 22));
  });

  test('a onça continua a sequência de capturas quando vale a pena', () {
    var s = position(onca: 12, dogs: [17, 23, 0, 1]);
    s = rules.apply(s, const CaptureMove(12, 17, 22));
    expect(ai(3).chooseMove(s), const CaptureMove(22, 23, 24));
  });

  test('os cachorros fecham a última saída da onça', () {
    // Onça em 28 (canto da toca); 25, 22 e 30 ocupados. Cachorro em 26
    // pode ir para 29 e prendê-la.
    final s =
        position(onca: 28, dogs: [25, 22, 30, 26, 0], toMove: OncaSides.dogs);
    expect(ai(2).chooseMove(s), const StepMove(26, 29));
  });

  test('os cachorros evitam deixar um cachorro capturável', () {
    // Depois do primeiro lance da onça (12→17), há lances seguros.
    final s = rules.apply(rules.initialState(), const StepMove(12, 17));
    final move = ai(2).chooseMove(s)!;
    final after = rules.apply(s, move);
    final captures = rules.legalMoves(after).whereType<CaptureMove>();
    expect(captures, isEmpty, reason: 'lance escolhido: $move');
  });

  test('trata posições de repetição como empate e as evita', () {
    final s = position(onca: 12, dogs: [0]);
    final a = ai(2);
    final first = a.chooseMove(s)!;
    final key = rules.apply(s, first).positionKey;
    final second = a.chooseMove(s, drawingPositions: {key});
    expect(second, isNot(first));
  });

  test('sem lances, devolve null', () {
    final s = position(onca: 28, dogs: [25, 29, 22, 30]);
    expect(ai(3).chooseMove(s), isNull);
  });

  test('roda em isolate', () async {
    final move = await computeAiMove(
      rules: rules,
      evaluator: evaluator,
      state: rules.initialState(),
      difficulty: Difficulty.medium,
      seed: 7,
    );
    expect(rules.legalMoves(rules.initialState()), contains(move));
  });

  test('profundidade do difícil responde em tempo razoável', () {
    final sw = Stopwatch()..start();
    final s = rules.apply(rules.initialState(), const StepMove(12, 17));
    final a = ai(Difficulty.hard.depth);
    a.chooseMove(s);
    // ignore: avoid_print
    print('difícil: ${a.nodes} nós em ${sw.elapsedMilliseconds} ms');
    expect(sw.elapsed, lessThan(const Duration(seconds: 10)));
  });
}
