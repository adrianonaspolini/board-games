import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_pt.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'gen/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[Locale('pt')];

  /// No description provided for @appTitle.
  ///
  /// In pt, this message translates to:
  /// **'Jogos de Tabuleiro'**
  String get appTitle;

  /// No description provided for @homeSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Jogos clássicos para jogar contra o computador ou com um amigo.'**
  String get homeSubtitle;

  /// No description provided for @comingSoon.
  ///
  /// In pt, this message translates to:
  /// **'Em breve'**
  String get comingSoon;

  /// No description provided for @gameOncaName.
  ///
  /// In pt, this message translates to:
  /// **'Jogo da Onça'**
  String get gameOncaName;

  /// No description provided for @gameOncaDescription.
  ///
  /// In pt, this message translates to:
  /// **'Uma onça contra 14 cachorros. A onça precisa capturar 5; os cachorros precisam encurralá-la.'**
  String get gameOncaDescription;

  /// No description provided for @gameTrilhaName.
  ///
  /// In pt, this message translates to:
  /// **'Trilha'**
  String get gameTrilhaName;

  /// No description provided for @gameRestaUmName.
  ///
  /// In pt, this message translates to:
  /// **'Resta Um'**
  String get gameRestaUmName;

  /// No description provided for @gameDamasName.
  ///
  /// In pt, this message translates to:
  /// **'Damas'**
  String get gameDamasName;

  /// No description provided for @gameAlquerqueName.
  ///
  /// In pt, this message translates to:
  /// **'Alquerque'**
  String get gameAlquerqueName;

  /// No description provided for @setupTitle.
  ///
  /// In pt, this message translates to:
  /// **'Nova partida'**
  String get setupTitle;

  /// No description provided for @modeLabel.
  ///
  /// In pt, this message translates to:
  /// **'Modo de jogo'**
  String get modeLabel;

  /// No description provided for @modeVsAi.
  ///
  /// In pt, this message translates to:
  /// **'Computador'**
  String get modeVsAi;

  /// No description provided for @modeTwoPlayers.
  ///
  /// In pt, this message translates to:
  /// **'2 jogadores'**
  String get modeTwoPlayers;

  /// No description provided for @sideLabel.
  ///
  /// In pt, this message translates to:
  /// **'Você joga com'**
  String get sideLabel;

  /// No description provided for @difficultyLabel.
  ///
  /// In pt, this message translates to:
  /// **'Dificuldade'**
  String get difficultyLabel;

  /// No description provided for @difficultyEasy.
  ///
  /// In pt, this message translates to:
  /// **'Fácil'**
  String get difficultyEasy;

  /// No description provided for @difficultyMedium.
  ///
  /// In pt, this message translates to:
  /// **'Médio'**
  String get difficultyMedium;

  /// No description provided for @difficultyHard.
  ///
  /// In pt, this message translates to:
  /// **'Difícil'**
  String get difficultyHard;

  /// No description provided for @rulesOptionsLabel.
  ///
  /// In pt, this message translates to:
  /// **'Regras'**
  String get rulesOptionsLabel;

  /// No description provided for @optionOncaStarts.
  ///
  /// In pt, this message translates to:
  /// **'A onça começa'**
  String get optionOncaStarts;

  /// No description provided for @optionMandatoryCapture.
  ///
  /// In pt, this message translates to:
  /// **'Captura obrigatória'**
  String get optionMandatoryCapture;

  /// No description provided for @optionMandatoryCaptureHint.
  ///
  /// In pt, this message translates to:
  /// **'A onça precisa capturar sempre que puder.'**
  String get optionMandatoryCaptureHint;

  /// No description provided for @optionRepetitionDraw.
  ///
  /// In pt, this message translates to:
  /// **'Empate por repetição'**
  String get optionRepetitionDraw;

  /// No description provided for @optionRepetitionDrawHint.
  ///
  /// In pt, this message translates to:
  /// **'A mesma posição 3 vezes empata a partida.'**
  String get optionRepetitionDrawHint;

  /// No description provided for @optionNoCaptureDraw.
  ///
  /// In pt, this message translates to:
  /// **'Empate sem capturas'**
  String get optionNoCaptureDraw;

  /// No description provided for @optionNoCaptureDrawHint.
  ///
  /// In pt, this message translates to:
  /// **'{moves} lances de cada lado sem captura empatam.'**
  String optionNoCaptureDrawHint(int moves);

  /// No description provided for @startGame.
  ///
  /// In pt, this message translates to:
  /// **'Começar'**
  String get startGame;

  /// No description provided for @howToPlayTitle.
  ///
  /// In pt, this message translates to:
  /// **'Como jogar'**
  String get howToPlayTitle;

  /// No description provided for @howToPlayOnca.
  ///
  /// In pt, this message translates to:
  /// **'Toque em uma peça para ver os lances possíveis e toque no destino para mover. As peças andam um ponto por vez, seguindo as linhas. A onça captura saltando sobre um cachorro vizinho para o ponto vazio logo depois, na mesma linha, e pode emendar várias capturas.'**
  String get howToPlayOnca;

  /// No description provided for @sideOnca.
  ///
  /// In pt, this message translates to:
  /// **'Onça'**
  String get sideOnca;

  /// No description provided for @sideDogs.
  ///
  /// In pt, this message translates to:
  /// **'Cachorros'**
  String get sideDogs;

  /// No description provided for @turnOnca.
  ///
  /// In pt, this message translates to:
  /// **'Vez da onça'**
  String get turnOnca;

  /// No description provided for @turnDogs.
  ///
  /// In pt, this message translates to:
  /// **'Vez dos cachorros'**
  String get turnDogs;

  /// No description provided for @yourTurn.
  ///
  /// In pt, this message translates to:
  /// **'Sua vez'**
  String get yourTurn;

  /// No description provided for @aiThinking.
  ///
  /// In pt, this message translates to:
  /// **'Computador pensando…'**
  String get aiThinking;

  /// No description provided for @chainInProgress.
  ///
  /// In pt, this message translates to:
  /// **'Capture de novo ou encerre a sequência'**
  String get chainInProgress;

  /// No description provided for @endChain.
  ///
  /// In pt, this message translates to:
  /// **'Encerrar capturas'**
  String get endChain;

  /// No description provided for @capturedCount.
  ///
  /// In pt, this message translates to:
  /// **'Cachorros capturados: {count}/{total}'**
  String capturedCount(int count, int total);

  /// No description provided for @undo.
  ///
  /// In pt, this message translates to:
  /// **'Desfazer'**
  String get undo;

  /// No description provided for @restart.
  ///
  /// In pt, this message translates to:
  /// **'Reiniciar'**
  String get restart;

  /// No description provided for @restartConfirmTitle.
  ///
  /// In pt, this message translates to:
  /// **'Reiniciar partida?'**
  String get restartConfirmTitle;

  /// No description provided for @restartConfirmBody.
  ///
  /// In pt, this message translates to:
  /// **'A partida atual será perdida.'**
  String get restartConfirmBody;

  /// No description provided for @cancel.
  ///
  /// In pt, this message translates to:
  /// **'Cancelar'**
  String get cancel;

  /// No description provided for @confirm.
  ///
  /// In pt, this message translates to:
  /// **'Reiniciar'**
  String get confirm;

  /// No description provided for @winnerOnca.
  ///
  /// In pt, this message translates to:
  /// **'A onça venceu!'**
  String get winnerOnca;

  /// No description provided for @winnerDogs.
  ///
  /// In pt, this message translates to:
  /// **'Os cachorros venceram!'**
  String get winnerDogs;

  /// No description provided for @youWon.
  ///
  /// In pt, this message translates to:
  /// **'Você venceu!'**
  String get youWon;

  /// No description provided for @youLost.
  ///
  /// In pt, this message translates to:
  /// **'Você perdeu'**
  String get youLost;

  /// No description provided for @draw.
  ///
  /// In pt, this message translates to:
  /// **'Empate'**
  String get draw;

  /// No description provided for @reasonCaptures.
  ///
  /// In pt, this message translates to:
  /// **'A onça capturou {count} cachorros.'**
  String reasonCaptures(int count);

  /// No description provided for @reasonTrapped.
  ///
  /// In pt, this message translates to:
  /// **'A onça ficou encurralada, sem nenhum movimento.'**
  String get reasonTrapped;

  /// No description provided for @reasonDogsBlocked.
  ///
  /// In pt, this message translates to:
  /// **'Os cachorros ficaram sem movimentos.'**
  String get reasonDogsBlocked;

  /// No description provided for @reasonNoCapture.
  ///
  /// In pt, this message translates to:
  /// **'Muitos lances seguidos sem nenhuma captura.'**
  String get reasonNoCapture;

  /// No description provided for @reasonRepetition.
  ///
  /// In pt, this message translates to:
  /// **'A mesma posição se repetiu 3 vezes.'**
  String get reasonRepetition;

  /// No description provided for @playAgain.
  ///
  /// In pt, this message translates to:
  /// **'Jogar de novo'**
  String get playAgain;

  /// No description provided for @backToMenu.
  ///
  /// In pt, this message translates to:
  /// **'Menu'**
  String get backToMenu;

  /// No description provided for @viewBoard.
  ///
  /// In pt, this message translates to:
  /// **'Ver tabuleiro'**
  String get viewBoard;

  /// No description provided for @boardSemantics.
  ///
  /// In pt, this message translates to:
  /// **'Tabuleiro do Jogo da Onça'**
  String get boardSemantics;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['pt'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'pt':
      return AppLocalizationsPt();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
