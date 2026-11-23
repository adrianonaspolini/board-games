import 'package:flutter_test/flutter_test.dart';
import 'package:jogos_tabuleiro/ai/ai_runner.dart';
import 'package:jogos_tabuleiro/ai/difficulty.dart';
import 'package:jogos_tabuleiro/ai/evaluator.dart';
import 'package:jogos_tabuleiro/engine/engine.dart';
import 'package:jogos_tabuleiro/games/onca/onca_config.dart';
import 'package:jogos_tabuleiro/games/onca/onca_evaluator.dart';
import 'package:jogos_tabuleiro/games/onca/onca_rules.dart';
import 'package:jogos_tabuleiro/ui/controllers/game_controller.dart';

import '../helpers/onca_helpers.dart';

/// IA síncrona (sem isolate) para testes.
Future<Move?> syncAi({
  required GameRules rules,
  required Evaluator evaluator,
  required GameState state,
  required Difficulty difficulty,
  Set<String> drawingPositions = const {},
  int? seed,
}) async =>
    chooseAiMove(
        rules: rules,
        evaluator: evaluator,
        state: state,
        difficulty: Difficulty.easy,
        drawingPositions: drawingPositions,
        seed: 1);

GameController controller(GameMode mode, {int human = OncaSides.dogs}) {
  final rules = OncaRules();
  return GameController(
    rules: rules,
    evaluator: OncaEvaluator(rules),
    mode: mode,
    humanSide: human,
    aiMove: syncAi,
    minAiDelay: Duration.zero,
  );
}

Future<void> settle() => Future<void>.delayed(const Duration(milliseconds: 20));

void main() {
  test('a onça é selecionada automaticamente e mostra destinos', () {
    final c = controller(GameMode.twoPlayers);
    expect(c.selected, 12);
    expect(c.targets, {16, 17, 18});
  });

  test('selecionar cachorro, destacar e mover', () {
    final c = controller(GameMode.twoPlayers);
    c.tapPoint(17); // onça 12 → 17
    expect(c.state.toMove, OncaSides.dogs);
    expect(c.selected, isNull);
    c.tapPoint(11);
    expect(c.selected, 11);
    expect(c.targets, {12, 16});
    c.tapPoint(12);
    expect(c.state[12]?.type, OncaPieces.dog);
    expect(c.state.toMove, OncaSides.onca);
  });

  test('toque em ponto inválido não faz nada', () {
    final c = controller(GameMode.twoPlayers);
    c.tapPoint(24);
    expect(c.session.moves, isEmpty);
  });

  test('desfazer em 2 jogadores volta um lance', () {
    final c = controller(GameMode.twoPlayers)..tapPoint(17);
    expect(c.canUndo, isTrue);
    c.undo();
    expect(c.session.moves, isEmpty);
  });

  test('contra a IA: a IA responde e desfazer volta para a vez humana',
      () async {
    final c = controller(GameMode.vsAi, human: OncaSides.dogs)..start();
    await settle();
    // A onça (IA) começa.
    expect(c.session.moves, hasLength(1));
    expect(c.isHumanTurn, isTrue);
    expect(c.canUndo, isFalse, reason: 'nenhum lance humano ainda');
    final dog = c.selectablePoints.first;
    c.tapPoint(dog);
    c.tapPoint(c.targets.first);
    expect(c.aiThinking, isTrue);
    await settle();
    expect(c.aiThinking, isFalse);
    expect(c.session.moves.length, greaterThanOrEqualTo(3));
    c.undo();
    expect(c.session.moves, hasLength(1));
    expect(c.isHumanTurn, isTrue);
  });

  test('sequência de capturas humana: continuar ou encerrar', () {
    final rules = OncaRules();
    GameController make() => GameController(
          rules: rules,
          evaluator: OncaEvaluator(rules),
          mode: GameMode.twoPlayers,
          initialState: position(onca: 12, dogs: [17, 23, 0]),
        );
    final c = make();
    expect(c.targets, contains(22));
    expect(c.captureTargets, {22});
    c.tapPoint(22);
    expect(c.state.chainPiece, 22);
    expect(c.selected, 22);
    expect(c.targets, {24});
    expect(c.canEndChain, isTrue);
    c.tapPoint(0); // não dá para trocar de peça no meio da sequência
    expect(c.selected, 22);
    c.endChain();
    expect(c.state.toMove, OncaSides.dogs);
    expect(c.state.capturedBy[OncaSides.onca], 1);

    final c2 = make()
      ..tapPoint(22)
      ..tapPoint(24);
    expect(c2.state.capturedBy[OncaSides.onca], 2);
    expect(c2.state.toMove, OncaSides.dogs);
    expect(c2.canEndChain, isFalse);
  });

  test('reiniciar volta à posição inicial', () async {
    final c = controller(GameMode.twoPlayers)..tapPoint(17);
    c.restart();
    expect(c.session.moves, isEmpty);
    expect(c.selected, 12);
  });
}
