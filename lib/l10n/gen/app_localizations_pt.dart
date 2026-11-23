import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Portuguese (`pt`).
class AppLocalizationsPt extends AppLocalizations {
  AppLocalizationsPt([String locale = 'pt']) : super(locale);

  @override
  String get appTitle => 'Jogos de Tabuleiro';

  @override
  String get homeSubtitle =>
      'Jogos clássicos para jogar contra o computador ou com um amigo.';

  @override
  String get comingSoon => 'Em breve';

  @override
  String get gameOncaName => 'Jogo da Onça';

  @override
  String get gameOncaDescription =>
      'Uma onça contra 14 cachorros. A onça precisa capturar 5; os cachorros precisam encurralá-la.';

  @override
  String get gameTrilhaName => 'Trilha';

  @override
  String get gameRestaUmName => 'Resta Um';

  @override
  String get gameDamasName => 'Damas';

  @override
  String get gameAlquerqueName => 'Alquerque';

  @override
  String get setupTitle => 'Nova partida';

  @override
  String get modeLabel => 'Modo de jogo';

  @override
  String get modeVsAi => 'Computador';

  @override
  String get modeTwoPlayers => '2 jogadores';

  @override
  String get sideLabel => 'Você joga com';

  @override
  String get difficultyLabel => 'Dificuldade';

  @override
  String get difficultyEasy => 'Fácil';

  @override
  String get difficultyMedium => 'Médio';

  @override
  String get difficultyHard => 'Difícil';

  @override
  String get rulesOptionsLabel => 'Regras';

  @override
  String get optionOncaStarts => 'A onça começa';

  @override
  String get optionMandatoryCapture => 'Captura obrigatória';

  @override
  String get optionMandatoryCaptureHint =>
      'A onça precisa capturar sempre que puder.';

  @override
  String get optionRepetitionDraw => 'Empate por repetição';

  @override
  String get optionRepetitionDrawHint =>
      'A mesma posição 3 vezes empata a partida.';

  @override
  String get optionNoCaptureDraw => 'Empate sem capturas';

  @override
  String optionNoCaptureDrawHint(int moves) {
    return '$moves lances de cada lado sem captura empatam.';
  }

  @override
  String get startGame => 'Começar';

  @override
  String get howToPlayTitle => 'Como jogar';

  @override
  String get howToPlayOnca =>
      'Toque em uma peça para ver os lances possíveis e toque no destino para mover. As peças andam um ponto por vez, seguindo as linhas. A onça captura saltando sobre um cachorro vizinho para o ponto vazio logo depois, na mesma linha, e pode emendar várias capturas.';

  @override
  String get sideOnca => 'Onça';

  @override
  String get sideDogs => 'Cachorros';

  @override
  String get turnOnca => 'Vez da onça';

  @override
  String get turnDogs => 'Vez dos cachorros';

  @override
  String get yourTurn => 'Sua vez';

  @override
  String get aiThinking => 'Computador pensando…';

  @override
  String get chainInProgress => 'Capture de novo ou encerre a sequência';

  @override
  String get endChain => 'Encerrar capturas';

  @override
  String capturedCount(int count, int total) {
    return 'Cachorros capturados: $count/$total';
  }

  @override
  String get undo => 'Desfazer';

  @override
  String get restart => 'Reiniciar';

  @override
  String get restartConfirmTitle => 'Reiniciar partida?';

  @override
  String get restartConfirmBody => 'A partida atual será perdida.';

  @override
  String get cancel => 'Cancelar';

  @override
  String get confirm => 'Reiniciar';

  @override
  String get winnerOnca => 'A onça venceu!';

  @override
  String get winnerDogs => 'Os cachorros venceram!';

  @override
  String get youWon => 'Você venceu!';

  @override
  String get youLost => 'Você perdeu';

  @override
  String get draw => 'Empate';

  @override
  String reasonCaptures(int count) {
    return 'A onça capturou $count cachorros.';
  }

  @override
  String get reasonTrapped => 'A onça ficou encurralada, sem nenhum movimento.';

  @override
  String get reasonDogsBlocked => 'Os cachorros ficaram sem movimentos.';

  @override
  String get reasonNoCapture => 'Muitos lances seguidos sem nenhuma captura.';

  @override
  String get reasonRepetition => 'A mesma posição se repetiu 3 vezes.';

  @override
  String get playAgain => 'Jogar de novo';

  @override
  String get backToMenu => 'Menu';

  @override
  String get viewBoard => 'Ver tabuleiro';

  @override
  String get boardSemantics => 'Tabuleiro do Jogo da Onça';
}
