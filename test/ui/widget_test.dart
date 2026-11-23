import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jogos_tabuleiro/games/onca/onca_config.dart';
import 'package:jogos_tabuleiro/games/onca/onca_evaluator.dart';
import 'package:jogos_tabuleiro/games/onca/onca_rules.dart';
import 'package:jogos_tabuleiro/ui/app.dart';
import 'package:jogos_tabuleiro/ui/controllers/game_controller.dart';
import 'package:jogos_tabuleiro/ui/l10n.dart';
import 'package:jogos_tabuleiro/ui/screens/onca_game_screen.dart';
import 'package:jogos_tabuleiro/ui/widgets/board_view.dart';

import '../helpers/onca_helpers.dart';

Widget wrap(Widget child) => MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      locale: const Locale('pt'),
      home: child,
    );

void main() {
  testWidgets('tela inicial lista os jogos e abre a configuração',
      (tester) async {
    await tester.pumpWidget(const JogosApp());
    await tester.pumpAndSettle();
    expect(find.text('Jogo da Onça'), findsOneWidget);
    expect(find.text('Trilha'), findsOneWidget);
    expect(find.text('Em breve'), findsWidgets);

    await tester.tap(find.text('Jogo da Onça'));
    await tester.pumpAndSettle();
    expect(find.text('Computador'), findsOneWidget);
    expect(find.text('Dificuldade'), findsOneWidget);

    await tester.tap(find.text('2 jogadores'));
    await tester.pumpAndSettle();
    expect(find.text('Dificuldade'), findsNothing);

    await tester.scrollUntilVisible(find.text('Começar'), 200);
    await tester.tap(find.text('Começar'));
    await tester.pumpAndSettle();
    expect(find.byType(BoardView), findsOneWidget);
    expect(find.text('Vez da onça'), findsOneWidget);
  });

  testWidgets('tocar no destino move a onça', (tester) async {
    final rules = OncaRules();
    final c = GameController(
        rules: rules,
        evaluator: OncaEvaluator(rules),
        mode: GameMode.twoPlayers);
    await tester.pumpWidget(wrap(OncaGameScreen(controller: c)));
    await tester.pumpAndSettle();

    // Ponto 17 = (coluna 2, linha 3). O tabuleiro (4x6 unidades + margem
    // de 0,6) é centralizado dentro do BoardView.
    final box = tester.getRect(find.byType(BoardView));
    final unit =
        [box.width / 5.2, box.height / 7.2].reduce((a, b) => a < b ? a : b);
    final origin = box.center - Offset(5.2 * unit / 2, 7.2 * unit / 2);
    final p17 = origin + Offset((2 + 0.6) * unit, (3 + 0.6) * unit);
    await tester.tapAt(p17);
    await tester.pumpAndSettle();
    expect(c.state[17]?.type, OncaPieces.onca);
    expect(find.text('Vez dos cachorros'), findsOneWidget);
  });

  testWidgets('fim de partida mostra o diálogo', (tester) async {
    final rules = OncaRules();
    final c = GameController(
      rules: rules,
      evaluator: OncaEvaluator(rules),
      mode: GameMode.twoPlayers,
      initialState:
          position(onca: 28, dogs: [25, 26, 22, 30, 0], toMove: OncaSides.dogs),
    );
    await tester.pumpWidget(wrap(OncaGameScreen(controller: c)));
    await tester.pumpAndSettle();
    c
      ..tapPoint(26)
      ..tapPoint(29); // prende a onça
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();
    expect(
        find.descendant(
            of: find.byType(AlertDialog),
            matching: find.text('Os cachorros venceram!')),
        findsOneWidget);
    await tester.tap(find.text('Jogar de novo').last);
    await tester.pumpAndSettle();
    expect(c.session.moves, isEmpty);
  });
}
