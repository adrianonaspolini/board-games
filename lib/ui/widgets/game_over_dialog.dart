import 'package:flutter/material.dart';

enum GameOverAction { viewBoard, playAgain, menu }

/// Diálogo de fim de partida (só apresentação).
class GameOverDialog extends StatelessWidget {
  const GameOverDialog({
    super.key,
    required this.title,
    required this.message,
    required this.icon,
    required this.viewBoardLabel,
    required this.playAgainLabel,
    required this.menuLabel,
  });

  final String title;
  final String message;
  final Widget icon;
  final String viewBoardLabel;
  final String playAgainLabel;
  final String menuLabel;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      icon: icon,
      title: Text(title, textAlign: TextAlign.center),
      content: Text(message, textAlign: TextAlign.center),
      actionsAlignment: MainAxisAlignment.center,
      actionsOverflowAlignment: OverflowBarAlignment.center,
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, GameOverAction.viewBoard),
          child: Text(viewBoardLabel),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context, GameOverAction.menu),
          child: Text(menuLabel),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(context, GameOverAction.playAgain),
          child: Text(playAgainLabel),
        ),
      ],
    );
  }
}
