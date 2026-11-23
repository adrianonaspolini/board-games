import 'package:flutter/widgets.dart';

import '../ai/difficulty.dart';
import '../games/game_catalog.dart';
import '../l10n/gen/app_localizations.dart';

export '../l10n/gen/app_localizations.dart';

extension L10nContext on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}

extension L10nNames on AppLocalizations {
  String gameName(String id) => switch (id) {
        GameIds.onca => gameOncaName,
        GameIds.trilha => gameTrilhaName,
        GameIds.restaUm => gameRestaUmName,
        GameIds.damas => gameDamasName,
        GameIds.alquerque => gameAlquerqueName,
        _ => id,
      };

  String difficultyName(Difficulty d) => switch (d) {
        Difficulty.easy => difficultyEasy,
        Difficulty.medium => difficultyMedium,
        Difficulty.hard => difficultyHard,
      };
}
