// Simula partidas IA × IA em todos os níveis (uso: dart run tool/simulate.dart [n]).
// ignore_for_file: avoid_print
import 'package:jogos_tabuleiro/ai/ai_runner.dart';
import 'package:jogos_tabuleiro/ai/difficulty.dart';
import 'package:jogos_tabuleiro/engine/engine.dart';
import 'package:jogos_tabuleiro/games/onca/onca_config.dart';
import 'package:jogos_tabuleiro/games/onca/onca_evaluator.dart';
import 'package:jogos_tabuleiro/games/onca/onca_rules.dart';

void main(List<String> args) {
  final rules = OncaRules();
  final ev = OncaEvaluator(rules);
  final n = int.parse(args.isEmpty ? '4' : args[0]);
  for (final o in Difficulty.values) {
    for (final d in Difficulty.values) {
      final tally = <String, int>{};
      var plies = 0;
      final sw = Stopwatch()..start();
      for (var g = 0; g < n; g++) {
        final s = GameSession(rules);
        var i = 0;
        while (!s.outcome.isOver) {
          final st = s.state;
          final m = chooseAiMove(
              rules: rules,
              evaluator: ev,
              state: st,
              difficulty: st.toMove == OncaSides.onca ? o : d,
              seed: g * 1000 + i++,
              drawingPositions: s.drawingPositions);
          s.play(m!);
        }
        plies += s.moves.length;
        tally['${s.outcome}'] = (tally['${s.outcome}'] ?? 0) + 1;
      }
      print(
          'onça ${o.name} × cães ${d.name}: $tally média ${plies ~/ n} jogadas, ${sw.elapsedMilliseconds ~/ plies} ms/jogada');
    }
  }
}
