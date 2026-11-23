import '../../ai/evaluator.dart';
import '../../engine/game_state.dart';
import '../../engine/piece.dart';
import 'onca_board.dart';
import 'onca_config.dart';
import 'onca_rules.dart';

/// Avaliação heurística do Jogo da Onça, calculada do ponto de vista da
/// onça e invertida para os cachorros. Escala: 1 cachorro capturado = 100.
///
/// * cachorros capturados (o objetivo da onça);
/// * mobilidade da onça (quanto menos, mais perto de ser encurralada);
/// * cachorros ameaçados (que a onça poderia capturar já);
/// * território da onça: pontos vazios que ela alcança andando (os
///   cachorros querem encolhê-lo até prendê-la);
/// * avanço dos cachorros em direção à toca (empurrar a onça para baixo);
/// * onça dentro da toca (onde é mais fácil prendê-la).
///
/// Os termos são centrados para a posição inicial valer perto de zero, de
/// modo que empate (0) não pareça vantajoso para nenhum dos lados.
class OncaEvaluator implements Evaluator {
  const OncaEvaluator(this.rules);

  final OncaRules rules;

  static const captureWeight = 100.0;
  static const mobilityWeight = 6.0;
  static const threatWeight = 25.0;
  static const threatOnTurnBonus = 20.0;
  static const nearlyTrappedPenalty = 60.0;
  static const territoryWeight = 6.0;
  static const dogAdvanceWeight = 3.0;
  static const oncaInDenPenalty = 15.0;

  // Valores de referência da posição inicial, usados para centrar a nota.
  static const _baseMobility = 3;
  static const _baseTerritory = 17;
  static const _baseDogRows = 13.0;

  @override
  double evaluate(GameState state, PlayerId perspective) {
    final onca = rules.oncaPoint(state);
    final captures = rules.capturesFrom(state, onca);
    final steps = rules.stepsFrom(state, onca);
    final threatened = {for (final c in captures) c.captured}.length;
    final mobility = steps.length + captures.length;

    var score = state.capturedBy[OncaSides.onca] * captureWeight;
    score += (mobility - _baseMobility) * mobilityWeight;
    score += (_territory(state, onca) - _baseTerritory) * territoryWeight;
    score += threatened * threatWeight;
    if (threatened > 0 && state.toMove == OncaSides.onca) {
      score += threatOnTurnBonus;
    }
    if (mobility <= 1) score -= nearlyTrappedPenalty;
    if (OncaBoard.denPoints.contains(onca)) score -= oncaInDenPenalty;

    var dogRows = 0.0;
    for (final d in state.pointsOf(OncaSides.dogs)) {
      dogRows += rules.board.points[d].y;
    }
    score -= (dogRows - _baseDogRows) * dogAdvanceWeight;

    return perspective == OncaSides.onca ? score : -score;
  }

  /// Pontos vazios alcançáveis pela onça andando (busca em largura).
  int _territory(GameState state, int from) {
    final board = rules.board;
    final seen = List<bool>.filled(board.size, false)..[from] = true;
    final queue = <int>[from];
    var count = 0;
    for (var i = 0; i < queue.length; i++) {
      for (final n in board.neighbors(queue[i])) {
        if (!seen[n] && state.isEmpty(n)) {
          seen[n] = true;
          count++;
          queue.add(n);
        }
      }
    }
    return count;
  }
}
