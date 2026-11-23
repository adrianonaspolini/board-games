import '../../engine/piece.dart';

/// Lados do Jogo da Onça.
abstract final class OncaSides {
  static const PlayerId onca = 0;
  static const PlayerId dogs = 1;
}

/// Tipos de peça.
abstract final class OncaPieces {
  static const onca = 'onca';
  static const dog = 'cachorro';
}

/// Códigos de motivo de fim de partida.
abstract final class OncaReasons {
  /// A onça capturou cachorros suficientes.
  static const captures = 'captures';

  /// A onça ficou sem movimentos.
  static const trapped = 'trapped';

  /// Os cachorros ficaram sem movimentos (caso raro).
  static const dogsBlocked = 'dogsBlocked';

  /// Muitas jogadas sem captura.
  static const noCapture = 'noCapture';
}

/// Variantes configuráveis. Os padrões seguem a variante mais comum
/// (ver docs/regras-onca.md).
class OncaConfig {
  const OncaConfig({
    this.firstPlayer = OncaSides.onca,
    this.mandatoryCapture = false,
    this.capturesToWin = 5,
    this.repetitionDrawCount = 3,
    this.noCaptureDrawPlies = 100,
  });

  /// Quem começa a partida.
  final PlayerId firstPlayer;

  /// Se verdadeiro, a onça é obrigada a capturar quando puder, inclusive
  /// continuar uma sequência de capturas até não haver mais saltos.
  final bool mandatoryCapture;

  /// Cachorros que a onça precisa capturar para vencer.
  final int capturesToWin;

  /// Ocorrências da mesma posição que empatam (`null` desativa).
  final int? repetitionDrawCount;

  /// Jogadas seguidas sem captura que empatam (`null` desativa).
  /// O padrão (100) equivale a 50 lances de cada lado.
  final int? noCaptureDrawPlies;

  OncaConfig copyWith({
    PlayerId? firstPlayer,
    bool? mandatoryCapture,
    int? capturesToWin,
    int? Function()? repetitionDrawCount,
    int? Function()? noCaptureDrawPlies,
  }) {
    return OncaConfig(
      firstPlayer: firstPlayer ?? this.firstPlayer,
      mandatoryCapture: mandatoryCapture ?? this.mandatoryCapture,
      capturesToWin: capturesToWin ?? this.capturesToWin,
      repetitionDrawCount: repetitionDrawCount != null
          ? repetitionDrawCount()
          : this.repetitionDrawCount,
      noCaptureDrawPlies: noCaptureDrawPlies != null
          ? noCaptureDrawPlies()
          : this.noCaptureDrawPlies,
    );
  }
}
