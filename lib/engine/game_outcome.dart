import 'piece.dart';

/// Resultado de uma partida.
///
/// [reason] é um código estável definido por cada jogo (ex.: `'captures'`);
/// a UI traduz o código para texto.
sealed class GameOutcome {
  const GameOutcome();

  bool get isOver => this is! Ongoing;
}

final class Ongoing extends GameOutcome {
  const Ongoing();

  @override
  bool operator ==(Object other) => other is Ongoing;

  @override
  int get hashCode => 0;

  @override
  String toString() => 'Ongoing';
}

final class Win extends GameOutcome {
  const Win(this.winner, this.reason);

  final PlayerId winner;
  final String reason;

  @override
  bool operator ==(Object other) =>
      other is Win && other.winner == winner && other.reason == reason;

  @override
  int get hashCode => Object.hash(winner, reason);

  @override
  String toString() => 'Win(p$winner, $reason)';
}

final class Draw extends GameOutcome {
  const Draw(this.reason);

  final String reason;

  @override
  bool operator ==(Object other) => other is Draw && other.reason == reason;

  @override
  int get hashCode => reason.hashCode;

  @override
  String toString() => 'Draw($reason)';
}

/// Códigos de motivo genéricos, tratados pelo motor.
abstract final class OutcomeReasons {
  static const repetition = 'repetition';
}
