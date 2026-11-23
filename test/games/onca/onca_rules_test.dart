import 'package:flutter_test/flutter_test.dart';
import 'package:jogos_tabuleiro/engine/engine.dart';
import 'package:jogos_tabuleiro/games/onca/onca_board.dart';
import 'package:jogos_tabuleiro/games/onca/onca_config.dart';
import 'package:jogos_tabuleiro/games/onca/onca_rules.dart';

import '../../helpers/onca_helpers.dart';

void main() {
  final rules = OncaRules();

  group('posição inicial', () {
    final s = rules.initialState();

    test('onça no centro e 14 cachorros', () {
      expect(s[OncaBoard.center]?.type, OncaPieces.onca);
      expect(s.countOf(OncaSides.dogs), 14);
      expect(s.countOf(OncaSides.onca), 1);
    });

    test('cachorros nas fileiras 0 e 1 e na fileira do meio sem o centro', () {
      final dogs = s.pointsOf(OncaSides.dogs).toSet();
      final expected = {
        for (var c = 0; c < 5; c++) ...[pt(0, c), pt(1, c)],
        pt(2, 0),
        pt(2, 1),
        pt(2, 3),
        pt(2, 4),
      };
      expect(dogs, expected);
    });

    test('fileiras 3, 4 e toca vazias', () {
      for (var id = 15; id < 31; id++) {
        expect(s.isEmpty(id), isTrue, reason: 'ponto $id');
      }
    });

    test('onça começa por padrão; configurável', () {
      expect(s.toMove, OncaSides.onca);
      final dogsFirst =
          OncaRules(const OncaConfig(firstPlayer: OncaSides.dogs));
      expect(dogsFirst.initialState().toMove, OncaSides.dogs);
    });

    test('lances iniciais da onça e dos cachorros', () {
      expect(rules.legalMoves(s).toSet(), {
        const StepMove(12, 16),
        const StepMove(12, 17),
        const StepMove(12, 18),
      });
      final dogsTurn = s.copyWith(toMove: OncaSides.dogs);
      expect(rules.legalMoves(dogsTurn).toSet(), {
        const StepMove(10, 15),
        const StepMove(10, 16),
        const StepMove(11, 16),
        const StepMove(13, 18),
        const StepMove(14, 18),
        const StepMove(14, 19),
      });
    });
  });

  group('movimento', () {
    test('só para pontos adjacentes vazios', () {
      final s = position(onca: pt(2, 1), dogs: [pt(2, 0)]);
      expect(rules.legalMoves(s).toSet(), {
        StepMove(pt(2, 1), pt(1, 1)),
        StepMove(pt(2, 1), pt(2, 2)),
        StepMove(pt(2, 1), pt(3, 1)),
      });
    });

    test('mover passa a vez e conta jogadas sem captura', () {
      final s = rules.apply(rules.initialState(), const StepMove(12, 17));
      expect(s.toMove, OncaSides.dogs);
      expect(s[17]?.type, OncaPieces.onca);
      expect(s.isEmpty(12), isTrue);
      expect(s.pliesSinceCapture, 1);
    });

    test('lance ilegal lança erro', () {
      final s = rules.initialState();
      expect(() => rules.apply(s, const StepMove(12, 24)), throwsArgumentError);
      expect(() => rules.apply(s, const StepMove(0, 5)), throwsArgumentError);
      final session = GameSession(rules);
      expect(() => session.play(const StepMove(12, 7)), throwsArgumentError);
    });
  });

  group('captura', () {
    test('salta sobre cachorro adjacente para o ponto vazio em linha', () {
      final s = position(onca: pt(2, 2), dogs: [pt(3, 2)]);
      expect(rules.legalMoves(s), contains(CaptureMove(12, 17, 22)));
      final after = rules.apply(s, CaptureMove(12, 17, 22));
      expect(after.isEmpty(17), isTrue);
      expect(after[22]?.type, OncaPieces.onca);
      expect(after.capturedBy[OncaSides.onca], 1);
      expect(after.countOf(OncaSides.dogs), 0);
      expect(after.pliesSinceCapture, 0);
    });

    test('não captura se o ponto de chegada estiver ocupado', () {
      final s = position(onca: pt(2, 2), dogs: [pt(3, 2), pt(4, 2)]);
      expect(rules.legalMoves(s).whereType<CaptureMove>(), isEmpty);
    });

    test('não captura fora das linhas (diagonal em ponto ímpar)', () {
      // (2,1) não tem diagonais; o cachorro em (3,2) não está em linha.
      final s = position(onca: pt(2, 1), dogs: [pt(3, 2)]);
      expect(rules.legalMoves(s).whereType<CaptureMove>(), isEmpty);
    });

    test('captura em diagonal e atravessando o vértice da toca', () {
      final diag = position(onca: pt(2, 2), dogs: [pt(3, 3)]);
      expect(rules.legalMoves(diag), contains(CaptureMove(12, 18, 24)));
      final apex = position(onca: pt(3, 3), dogs: [pt(4, 2)]);
      expect(rules.legalMoves(apex), contains(CaptureMove(18, 22, 25)));
      final vertical = position(onca: pt(3, 2), dogs: [pt(4, 2)]);
      expect(rules.legalMoves(vertical), contains(CaptureMove(17, 22, 26)));
    });

    test('captura dentro da toca', () {
      final s = position(onca: pt(5, 1), dogs: [pt(5, 2)]);
      expect(rules.legalMoves(s), contains(CaptureMove(25, 26, 27)));
      final s2 = position(onca: pt(4, 2), dogs: [pt(5, 1)]);
      expect(rules.legalMoves(s2), contains(CaptureMove(22, 25, 28)));
    });

    test('cachorros nunca capturam', () {
      final s =
          position(onca: pt(2, 2), dogs: [pt(1, 2)], toMove: OncaSides.dogs);
      final moves = rules.legalMoves(s);
      expect(moves.whereType<CaptureMove>(), isEmpty);
      expect(moves.every((m) => m is StepMove && m.from == pt(1, 2)), isTrue);
    });

    test('captura não é obrigatória por padrão', () {
      final s = position(onca: pt(2, 2), dogs: [pt(3, 2)]);
      expect(rules.legalMoves(s).whereType<StepMove>(), isNotEmpty);
    });

    test('captura obrigatória quando configurada', () {
      final strict = OncaRules(const OncaConfig(mandatoryCapture: true));
      final s = position(onca: pt(2, 2), dogs: [pt(3, 2)]);
      expect(strict.legalMoves(s), [CaptureMove(12, 17, 22)]);
    });
  });

  group('capturas encadeadas', () {
    // Onça em 12; cachorros em 17 e 23: 12×17→22, depois 22×23→24.
    final start = position(onca: 12, dogs: [17, 23]);

    test('após um salto com nova captura possível, a onça continua', () {
      final s = rules.apply(start, const CaptureMove(12, 17, 22));
      expect(s.chainPiece, 22);
      expect(s.toMove, OncaSides.onca);
      expect(rules.legalMoves(s).toSet(),
          {const CaptureMove(22, 23, 24), const EndChainMove()});
      expect(rules.outcome(s), const Ongoing());
    });

    test('o jogador pode parar a sequência', () {
      var s = rules.apply(start, const CaptureMove(12, 17, 22));
      s = rules.apply(s, const EndChainMove());
      expect(s.chainPiece, isNull);
      expect(s.toMove, OncaSides.dogs);
      expect(s.capturedBy[OncaSides.onca], 1);
    });

    test('o jogador pode continuar; sem novos saltos a vez passa', () {
      var s = rules.apply(start, const CaptureMove(12, 17, 22));
      s = rules.apply(s, const CaptureMove(22, 23, 24));
      expect(s.chainPiece, isNull);
      expect(s.toMove, OncaSides.dogs);
      expect(s.capturedBy[OncaSides.onca], 2);
    });

    test('durante a sequência não há passos simples', () {
      final s = rules.apply(start, const CaptureMove(12, 17, 22));
      expect(rules.legalMoves(s).whereType<StepMove>(), isEmpty);
      expect(() => rules.apply(s, const StepMove(22, 21)), throwsArgumentError);
    });

    test('sequência tripla, entrando na toca', () {
      // 12×17→22, 22×25→28, 28×29→30.
      var s = position(onca: 12, dogs: [17, 25, 29]);
      s = rules.apply(s, const CaptureMove(12, 17, 22));
      expect(s.chainPiece, 22);
      s = rules.apply(s, const CaptureMove(22, 25, 28));
      expect(s.chainPiece, 28);
      s = rules.apply(s, const CaptureMove(28, 29, 30));
      expect(s.chainPiece, isNull);
      expect(s.capturedBy[OncaSides.onca], 3);
      expect(s.toMove, OncaSides.dogs);
    });

    test('com captura obrigatória não é possível encerrar a sequência', () {
      final strict = OncaRules(const OncaConfig(mandatoryCapture: true));
      final s = strict.apply(start, const CaptureMove(12, 17, 22));
      expect(strict.legalMoves(s), [const CaptureMove(22, 23, 24)]);
      expect(() => strict.apply(s, const EndChainMove()), throwsArgumentError);
    });
  });

  group('fim de partida', () {
    test('a onça vence ao capturar 5 cachorros', () {
      final s = position(onca: 12, dogs: [17, 23, 0], captured: 4);
      final after = rules.apply(s, const CaptureMove(12, 17, 22));
      expect(after.capturedBy[OncaSides.onca], 5);
      expect(after.chainPiece, isNull, reason: 'a sequência para na vitória');
      expect(rules.outcome(after),
          const Win(OncaSides.onca, OncaReasons.captures));
      expect(rules.legalMoves(after), isEmpty);
    });

    test('os cachorros vencem quando a onça não tem lances', () {
      // Onça no canto da toca (28): vizinhos 25 e 29 ocupados e os saltos
      // (para 22 e 30) bloqueados.
      final s = position(onca: 28, dogs: [25, 29, 22, 30]);
      expect(rules.legalMoves(s), isEmpty);
      expect(rules.outcome(s), const Win(OncaSides.dogs, OncaReasons.trapped));
    });

    test('a onça não está presa se puder capturar', () {
      final s = position(onca: 28, dogs: [25, 29, 30]);
      expect(rules.legalMoves(s), [const CaptureMove(28, 25, 22)]);
      expect(rules.outcome(s), const Ongoing());
    });

    test('onça presa só conta na vez dela', () {
      final s =
          position(onca: 28, dogs: [25, 29, 22, 30], toMove: OncaSides.dogs);
      expect(rules.outcome(s), const Ongoing());
    });

    test('empate por jogadas sem captura (configurável)', () {
      final s = position(
          onca: 12,
          dogs: [0],
          pliesSinceCapture: rules.config.noCaptureDrawPlies!);
      expect(rules.outcome(s), const Draw(OncaReasons.noCapture));
      expect(rules.legalMoves(s), isEmpty);
      final off = OncaRules(const OncaConfig(noCaptureDrawPlies: null));
      expect(off.outcome(s), const Ongoing());
    });

    test('empate por repetição de posição 3 vezes', () {
      final session = GameSession(rules);
      void cycle() {
        session
          ..play(const StepMove(12, 17))
          ..play(const StepMove(11, 16))
          ..play(const StepMove(17, 12))
          ..play(const StepMove(16, 11));
      }

      cycle();
      expect(session.outcome, const Ongoing());
      cycle();
      expect(session.outcome, const Draw(OutcomeReasons.repetition));
      expect(session.legalMoves, isEmpty);
      session.undo();
      expect(session.outcome, const Ongoing());
    });
  });

  group('sessão', () {
    test('desfazer volta ao estado anterior', () {
      final session = GameSession(rules);
      final initial = session.state;
      session.play(const StepMove(12, 17));
      expect(session.canUndo, isTrue);
      expect(session.undo(), isTrue);
      expect(session.state, same(initial));
      expect(session.undo(), isFalse);
    });

    test('reiniciar limpa o histórico', () {
      final session = GameSession(rules)
        ..play(const StepMove(12, 17))
        ..play(const StepMove(11, 16));
      session.restart();
      expect(session.moves, isEmpty);
      expect(session.state.positionKey, rules.initialState().positionKey);
    });
  });
}
