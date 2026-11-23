import 'package:flutter/material.dart';

import '../../engine/engine.dart';
import '../../games/onca/onca_board.dart';
import '../../games/onca/onca_config.dart';
import '../../games/onca/onca_rules.dart';
import '../controllers/game_controller.dart';
import '../l10n.dart';
import '../widgets/board_view.dart';
import '../widgets/game_over_dialog.dart';
import '../widgets/piece_view.dart';

class OncaGameScreen extends StatefulWidget {
  const OncaGameScreen({super.key, required this.controller});

  /// O controller pertence à tela e é descartado com ela.
  final GameController controller;

  @override
  State<OncaGameScreen> createState() => _OncaGameScreenState();
}

class _OncaGameScreenState extends State<OncaGameScreen> {
  GameController get _c => widget.controller;
  bool _dialogShown = false;

  OncaRules get _rules => _c.rules as OncaRules;

  @override
  void initState() {
    super.initState();
    _c.addListener(_onChange);
    WidgetsBinding.instance.addPostFrameCallback((_) => _c.start());
  }

  @override
  void dispose() {
    _c.removeListener(_onChange);
    _c.dispose();
    super.dispose();
  }

  void _onChange() {
    if (!_c.outcome.isOver) {
      _dialogShown = false;
    } else if (!_dialogShown) {
      _dialogShown = true;
      // Espera a animação do último lance antes de mostrar o resultado.
      Future<void>.delayed(const Duration(milliseconds: 600), () {
        if (mounted && _c.outcome.isOver) _showGameOver();
      });
    }
  }

  Future<void> _showGameOver() async {
    final l10n = context.l10n;
    final outcome = _c.outcome;
    final action = await showDialog<GameOverAction>(
      context: context,
      builder: (_) => GameOverDialog(
        title: _resultTitle(l10n, outcome),
        message: _reasonText(l10n, outcome),
        icon: switch (outcome) {
          Win(:final winner) => PieceView(
              type: winner == OncaSides.onca ? OncaPieces.onca : OncaPieces.dog,
              size: 48),
          _ => const Icon(Icons.handshake_outlined, size: 40),
        },
        viewBoardLabel: l10n.viewBoard,
        playAgainLabel: l10n.playAgain,
        menuLabel: l10n.backToMenu,
      ),
    );
    if (!mounted) return;
    switch (action) {
      case GameOverAction.playAgain:
        _c.restart();
      case GameOverAction.menu:
        Navigator.of(context).popUntil((r) => r.isFirst);
      case GameOverAction.viewBoard || null:
        break;
    }
  }

  Future<void> _confirmRestart() async {
    final l10n = context.l10n;
    if (_c.session.moves.isEmpty) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.restartConfirmTitle),
        content: Text(l10n.restartConfirmBody),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(l10n.cancel)),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(l10n.confirm)),
        ],
      ),
    );
    if (ok == true) _c.restart();
  }

  String _resultTitle(AppLocalizations l10n, GameOutcome outcome) {
    switch (outcome) {
      case Win(:final winner):
        if (_c.mode == GameMode.vsAi) {
          return winner == _c.humanSide ? l10n.youWon : l10n.youLost;
        }
        return winner == OncaSides.onca ? l10n.winnerOnca : l10n.winnerDogs;
      case Draw():
        return l10n.draw;
      case Ongoing():
        return '';
    }
  }

  String _reasonText(AppLocalizations l10n, GameOutcome outcome) {
    final reason = switch (outcome) {
      Win(:final reason) => reason,
      Draw(:final reason) => reason,
      Ongoing() => '',
    };
    final text = switch (reason) {
      OncaReasons.captures => l10n.reasonCaptures(_rules.config.capturesToWin),
      OncaReasons.trapped => l10n.reasonTrapped,
      OncaReasons.dogsBlocked => l10n.reasonDogsBlocked,
      OncaReasons.noCapture => l10n.reasonNoCapture,
      OutcomeReasons.repetition => l10n.reasonRepetition,
      _ => '',
    };
    if (outcome is Win && _c.mode == GameMode.vsAi) {
      final who =
          outcome.winner == OncaSides.onca ? l10n.winnerOnca : l10n.winnerDogs;
      return '$who $text';
    }
    return text;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return ListenableBuilder(
      listenable: _c,
      builder: (context, _) => Scaffold(
        appBar: AppBar(
          title: Text(l10n.gameOncaName),
          actions: [
            IconButton(
              tooltip: l10n.undo,
              icon: const Icon(Icons.undo),
              onPressed: _c.canUndo ? _c.undo : null,
            ),
            IconButton(
              tooltip: l10n.restart,
              icon: const Icon(Icons.refresh),
              onPressed: _c.session.moves.isEmpty ? null : _confirmRestart,
            ),
          ],
        ),
        body: SafeArea(
          child: Column(
            children: [
              _StatusPanel(
                  controller: _c,
                  rules: _rules,
                  resultTitle: _resultTitle(l10n, _c.outcome)),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 4, 12, 4),
                  child: BoardView(
                    board: _rules.board,
                    state: _c.state,
                    selected: _c.selected,
                    targets: _c.targets,
                    captureTargets: _c.captureTargets,
                    lastMove: _c.lastMove,
                    highlightedArea: const [
                      OncaBoard.denApex,
                      28,
                      30,
                    ],
                    semanticsLabel: l10n.boardSemantics,
                    onTapPoint: _c.tapPoint,
                  ),
                ),
              ),
              SizedBox(
                height: 64,
                child: Center(
                  child: _c.canEndChain
                      ? FilledButton.icon(
                          onPressed: _c.endChain,
                          icon: const Icon(Icons.check),
                          label: Text(l10n.endChain),
                        )
                      : _c.outcome.isOver
                          ? FilledButton.icon(
                              onPressed: _c.restart,
                              icon: const Icon(Icons.replay),
                              label: Text(l10n.playAgain),
                            )
                          : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusPanel extends StatelessWidget {
  const _StatusPanel({
    required this.controller,
    required this.rules,
    required this.resultTitle,
  });

  final GameController controller;
  final OncaRules rules;
  final String resultTitle;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final c = controller;
    final state = c.state;
    final over = c.outcome.isOver;
    final oncaTurn = state.toMove == OncaSides.onca;

    final title =
        over ? resultTitle : (oncaTurn ? l10n.turnOnca : l10n.turnDogs);
    final String? subtitle;
    if (over) {
      subtitle = null;
    } else if (c.aiThinking) {
      subtitle = l10n.aiThinking;
    } else if (state.chainPiece != null && c.isHumanTurn) {
      subtitle = l10n.chainInProgress;
    } else if (c.mode == GameMode.vsAi && c.isHumanTurn) {
      subtitle = l10n.yourTurn;
    } else {
      subtitle = null;
    }

    final captured = state.capturedBy[OncaSides.onca];
    final total = rules.config.capturesToWin;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: PieceView(
                      key: ValueKey(oncaTurn),
                      type: oncaTurn ? OncaPieces.onca : OncaPieces.dog,
                      size: 32,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: theme.textTheme.titleMedium),
                        if (subtitle != null)
                          Text(subtitle, style: theme.textTheme.bodySmall),
                      ],
                    ),
                  ),
                  if (c.aiThinking)
                    const SizedBox.square(
                        dimension: 20,
                        child: CircularProgressIndicator(strokeWidth: 2)),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: Text(l10n.capturedCount(captured, total),
                        style: theme.textTheme.bodyMedium),
                  ),
                  for (var i = 0; i < total; i++)
                    Padding(
                      padding: const EdgeInsets.only(left: 4),
                      child: AnimatedOpacity(
                        duration: const Duration(milliseconds: 300),
                        opacity: i < captured ? 1 : 0.18,
                        child: const PieceView(type: OncaPieces.dog, size: 18),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
