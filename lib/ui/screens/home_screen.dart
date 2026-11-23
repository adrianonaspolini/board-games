import 'package:flutter/material.dart';

import '../../games/game_catalog.dart';
import '../l10n.dart';
import '../widgets/piece_view.dart';
import 'onca_setup_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  void _open(BuildContext context, GameInfo game) {
    final Widget screen = switch (game.id) {
      GameIds.onca => const OncaSetupScreen(),
      _ => throw UnimplementedError(game.id),
    };
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.appTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(l10n.homeSubtitle, style: theme.textTheme.bodyLarge),
          const SizedBox(height: 16),
          for (final game in gameCatalog)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Card(
                child: ListTile(
                  enabled: game.available,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  leading: game.id == GameIds.onca
                      ? const PieceView(type: 'onca', size: 44)
                      : Icon(Icons.grid_on,
                          size: 40, color: theme.disabledColor),
                  title: Text(l10n.gameName(game.id),
                      style: theme.textTheme.titleMedium),
                  subtitle:
                      game.available ? Text(l10n.gameOncaDescription) : null,
                  trailing: game.available
                      ? const Icon(Icons.chevron_right)
                      : Chip(label: Text(l10n.comingSoon)),
                  onTap: game.available ? () => _open(context, game) : null,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
