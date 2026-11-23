import 'dart:math';

import '../engine/game_outcome.dart';
import '../engine/game_rules.dart';
import '../engine/game_state.dart';
import '../engine/move.dart';
import '../engine/piece.dart';
import 'evaluator.dart';

/// IA genérica: minimax com poda alfa-beta.
///
/// * Funciona com qualquer [GameRules]. Lances em que o mesmo jogador joga
///   de novo (capturas encadeadas) são tratados naturalmente, pois o lado
///   que maximiza é decidido por `state.toMove` em cada nó.
/// * Busca de quiescência: além da profundidade nominal, continua só com
///   capturas, para não avaliar posições no meio de uma troca ou de uma
///   sequência de capturas.
/// * Vitórias mais rápidas (e derrotas mais demoradas) são preferidas.
class MinimaxAi {
  MinimaxAi({
    required this.rules,
    required this.evaluator,
    required this.depth,
    this.noise = 0,
    this.drawContempt = 30,
    Random? random,
  })  : assert(depth >= 1),
        _random = random ?? Random();

  final GameRules rules;
  final Evaluator evaluator;
  final int depth;
  final double noise;

  /// Quanto um empate vale a menos que zero para quem está buscando: faz a
  /// IA evitar empates (por repetição ou falta de capturas) quando a
  /// posição é equilibrada.
  final double drawContempt;

  final Random _random;

  /// Posições que, se alcançadas, empatam por repetição (fornecidas pela
  /// sessão, que conhece o histórico).
  Set<String> _drawingPositions = const {};

  static const winScore = 1000000.0;

  /// Profundidade máxima da busca de quiescência (só capturas).
  static const maxQuiescenceDepth = 6;

  /// Nós visitados na última busca (para testes e diagnóstico).
  int nodes = 0;

  /// Escolhe um lance para o jogador da vez, ou `null` se não houver.
  ///
  /// [drawingPositions] são chaves de posição (`GameState.positionKey`) que
  /// completariam o limite de repetição; a busca as trata como empate.
  Move? chooseMove(GameState state, {Set<String> drawingPositions = const {}}) {
    nodes = 0;
    _drawingPositions = drawingPositions;
    final moves = orderMoves(rules.legalMoves(state));
    if (moves.isEmpty) return null;
    if (moves.length == 1) return moves.single;

    final me = state.toMove;
    final best = <Move>[];
    var bestScore = double.negativeInfinity;
    for (final m in moves) {
      // Com ruído, cada lance precisa de valor exato (janela cheia). Sem
      // ruído, a janela começa logo abaixo do melhor valor, para que
      // empates sejam genuínos e possam ser sorteados.
      final alpha = noise > 0 ? double.negativeInfinity : bestScore - 0.5;
      var score = _search(
          rules.apply(state, m), depth - 1, alpha, double.infinity, me, 1);
      if (noise > 0) score += _random.nextDouble() * noise;
      if (score > bestScore) {
        bestScore = score;
        best
          ..clear()
          ..add(m);
      } else if (score == bestScore) {
        best.add(m);
      }
    }
    return best[_random.nextInt(best.length)];
  }

  double _search(
      GameState s, int depth, double alpha, double beta, PlayerId me, int ply) {
    nodes++;
    final outcome = rules.outcome(s);
    switch (outcome) {
      case Win(:final winner):
        return winner == me ? winScore - ply : -winScore + ply;
      case Draw():
        return -drawContempt;
      case Ongoing():
        break;
    }
    if (_drawingPositions.contains(s.positionKey)) return -drawContempt;
    final maximizing = s.toMove == me;
    var moves = orderMoves(rules.legalMoves(s));
    if (moves.isEmpty) return evaluator.evaluate(s, me);
    var value = maximizing ? double.negativeInfinity : double.infinity;

    if (depth <= 0) {
      // Quiescência: além do horizonte, só capturas (e encerrar uma
      // sequência). Quem joga pode "parar" e ficar com a avaliação estática.
      final standPat = evaluator.evaluate(s, me);
      if (depth <= -maxQuiescenceDepth) return standPat;
      moves = moves.where((m) => m is! StepMove).toList();
      if (moves.isEmpty) return standPat;
      if (s.chainPiece == null) {
        value = standPat;
        if (maximizing) {
          alpha = max(alpha, value);
        } else {
          beta = min(beta, value);
        }
        if (alpha >= beta) return value;
      }
    }
    for (final m in moves) {
      final child =
          _search(rules.apply(s, m), depth - 1, alpha, beta, me, ply + 1);
      if (maximizing) {
        value = max(value, child);
        alpha = max(alpha, value);
      } else {
        value = min(value, child);
        beta = min(beta, value);
      }
      if (alpha >= beta) break;
    }
    return value;
  }

  /// Capturas primeiro (melhoram muito a poda), depois o resto.
  static List<Move> orderMoves(List<Move> moves) => [
        ...moves.whereType<CaptureMove>(),
        ...moves.where((m) => m is! CaptureMove),
      ];
}
