import 'package:flutter/material.dart';

import '../../ai/difficulty.dart';
import '../../engine/piece.dart';
import '../../games/onca/onca_config.dart';
import '../../games/onca/onca_evaluator.dart';
import '../../games/onca/onca_rules.dart';
import '../controllers/game_controller.dart';
import '../l10n.dart';
import 'onca_game_screen.dart';

class OncaSetupScreen extends StatefulWidget {
  const OncaSetupScreen({super.key});

  @override
  State<OncaSetupScreen> createState() => _OncaSetupScreenState();
}

class _OncaSetupScreenState extends State<OncaSetupScreen> {
  GameMode _mode = GameMode.vsAi;
  PlayerId _side = OncaSides.dogs;
  Difficulty _difficulty = Difficulty.medium;
  OncaConfig _config = const OncaConfig();

  static const _defaultNoCapture = 100;

  void _start() {
    final rules = OncaRules(_config);
    final controller = GameController(
      rules: rules,
      evaluator: OncaEvaluator(rules),
      mode: _mode,
      humanSide: _side,
      difficulty: _difficulty,
    );
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => OncaGameScreen(controller: controller),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    Widget section(String title) => Padding(
          padding: const EdgeInsets.only(top: 20, bottom: 8),
          child: Text(title, style: theme.textTheme.titleSmall),
        );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.gameOncaName)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            section(l10n.modeLabel),
            SegmentedButton<GameMode>(
              segments: [
                ButtonSegment(
                    value: GameMode.vsAi,
                    icon: const Icon(Icons.smart_toy_outlined),
                    label: Text(l10n.modeVsAi)),
                ButtonSegment(
                    value: GameMode.twoPlayers,
                    icon: const Icon(Icons.people_outline),
                    label: Text(l10n.modeTwoPlayers)),
              ],
              selected: {_mode},
              onSelectionChanged: (s) => setState(() => _mode = s.single),
            ),
            if (_mode == GameMode.vsAi) ...[
              section(l10n.sideLabel),
              SegmentedButton<PlayerId>(
                segments: [
                  ButtonSegment(
                      value: OncaSides.onca, label: Text(l10n.sideOnca)),
                  ButtonSegment(
                      value: OncaSides.dogs, label: Text(l10n.sideDogs)),
                ],
                selected: {_side},
                onSelectionChanged: (s) => setState(() => _side = s.single),
              ),
              section(l10n.difficultyLabel),
              SegmentedButton<Difficulty>(
                segments: [
                  for (final d in Difficulty.values)
                    ButtonSegment(
                        value: d, label: Text(l10n.difficultyName(d))),
                ],
                selected: {_difficulty},
                onSelectionChanged: (s) =>
                    setState(() => _difficulty = s.single),
              ),
            ],
            section(l10n.rulesOptionsLabel),
            Card(
              child: Column(
                children: [
                  SwitchListTile(
                    title: Text(l10n.optionOncaStarts),
                    value: _config.firstPlayer == OncaSides.onca,
                    onChanged: (v) => setState(() => _config = _config.copyWith(
                        firstPlayer: v ? OncaSides.onca : OncaSides.dogs)),
                  ),
                  SwitchListTile(
                    title: Text(l10n.optionMandatoryCapture),
                    subtitle: Text(l10n.optionMandatoryCaptureHint),
                    value: _config.mandatoryCapture,
                    onChanged: (v) => setState(
                        () => _config = _config.copyWith(mandatoryCapture: v)),
                  ),
                  SwitchListTile(
                    title: Text(l10n.optionRepetitionDraw),
                    subtitle: Text(l10n.optionRepetitionDrawHint),
                    value: _config.repetitionDrawCount != null,
                    onChanged: (v) => setState(() => _config = _config.copyWith(
                        repetitionDrawCount: () => v ? 3 : null)),
                  ),
                  SwitchListTile(
                    title: Text(l10n.optionNoCaptureDraw),
                    subtitle: Text(
                        l10n.optionNoCaptureDrawHint(_defaultNoCapture ~/ 2)),
                    value: _config.noCaptureDrawPlies != null,
                    onChanged: (v) => setState(() => _config = _config.copyWith(
                        noCaptureDrawPlies: () =>
                            v ? _defaultNoCapture : null)),
                  ),
                ],
              ),
            ),
            section(l10n.howToPlayTitle),
            Text(l10n.howToPlayOnca, style: theme.textTheme.bodyMedium),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _start,
              icon: const Icon(Icons.play_arrow),
              label: Text(l10n.startGame),
              style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(52)),
            ),
          ],
        ),
      ),
    );
  }
}
