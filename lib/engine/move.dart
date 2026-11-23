/// Um lance atômico.
///
/// Capturas em sequência são representadas como vários [CaptureMove]
/// seguidos do mesmo jogador; [EndChainMove] encerra a sequência
/// voluntariamente.
sealed class Move {
  const Move();
}

/// Move uma peça de [from] para o ponto adjacente [to].
final class StepMove extends Move {
  const StepMove(this.from, this.to);

  final int from;
  final int to;

  @override
  bool operator ==(Object other) =>
      other is StepMove && other.from == from && other.to == to;

  @override
  int get hashCode => Object.hash('step', from, to);

  @override
  String toString() => 'Step($from→$to)';
}

/// Salta de [from] sobre [captured] até [to], removendo a peça capturada.
final class CaptureMove extends Move {
  const CaptureMove(this.from, this.captured, this.to);

  final int from;
  final int captured;
  final int to;

  @override
  bool operator ==(Object other) =>
      other is CaptureMove &&
      other.from == from &&
      other.captured == captured &&
      other.to == to;

  @override
  int get hashCode => Object.hash('capture', from, captured, to);

  @override
  String toString() => 'Capture($from×$captured→$to)';
}

/// Encerra uma sequência de capturas, passando a vez.
final class EndChainMove extends Move {
  const EndChainMove();

  @override
  bool operator ==(Object other) => other is EndChainMove;

  @override
  int get hashCode => 'endChain'.hashCode;

  @override
  String toString() => 'EndChain';
}

extension MoveEndpoints on Move {
  /// Ponto de origem da peça movida, ou `null` para [EndChainMove].
  int? get origin => switch (this) {
        StepMove(:final from) => from,
        CaptureMove(:final from) => from,
        EndChainMove() => null,
      };

  /// Ponto de destino da peça movida, ou `null` para [EndChainMove].
  int? get destination => switch (this) {
        StepMove(:final to) => to,
        CaptureMove(:final to) => to,
        EndChainMove() => null,
      };
}
