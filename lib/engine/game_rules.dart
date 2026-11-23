import 'board_graph.dart';
import 'game_outcome.dart';
import 'game_state.dart';
import 'move.dart';

/// Contrato que cada jogo implementa. Toda regra de jogo fica aqui (e nunca
/// na UI). As implementações devem ser Dart puro e sem estado mutável, para
/// poderem ser enviadas a um isolate.
abstract interface class GameRules {
  BoardGraph get board;

  GameState initialState();

  /// Lances legais no estado (vazio se a partida acabou).
  List<Move> legalMoves(GameState state);

  /// Aplica um lance legal, devolvendo um novo estado.
  GameState apply(GameState state, Move move);

  /// Resultado considerando apenas o estado (sem histórico).
  GameOutcome outcome(GameState state);

  /// Quantas ocorrências da mesma posição empatam a partida (`null` = nunca).
  /// Verificado pelo `GameSession`, que conhece o histórico.
  int? get repetitionDrawCount;
}
