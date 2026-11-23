import 'package:flutter/material.dart';

import '../theme.dart';

/// Desenho de uma peça a partir do seu tipo (`Piece.type`).
///
/// Para um novo jogo, acrescente aqui os tipos de peça dele.
class PieceView extends StatelessWidget {
  const PieceView({super.key, required this.type, required this.size});

  final String type;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox.square(
      dimension: size,
      child: CustomPaint(painter: _PiecePainter(type)),
    );
  }
}

class _PiecePainter extends CustomPainter {
  _PiecePainter(this.type);

  final String type;

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final r = size.shortestSide / 2;
    final isOnca = type == 'onca';
    final light = isOnca ? BoardColors.onca : BoardColors.dog;
    final dark = isOnca ? BoardColors.oncaDark : BoardColors.dogDark;

    canvas.drawCircle(
      c.translate(0, r * 0.08),
      r,
      Paint()
        ..color = Colors.black26
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, r * 0.12),
    );
    canvas.drawCircle(
      c,
      r,
      Paint()
        ..shader = RadialGradient(
          center: const Alignment(-0.35, -0.4),
          colors: [light, Color.lerp(light, dark, 0.55)!],
        ).createShader(Rect.fromCircle(center: c, radius: r)),
    );
    canvas.drawCircle(
      c,
      r * 0.94,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = r * 0.1
        ..color = dark,
    );

    if (isOnca) {
      // Pintas da onça.
      final spot = Paint()..color = BoardColors.oncaSpot;
      const spots = [
        (-0.38, -0.30, 0.13),
        (0.30, -0.38, 0.11),
        (0.05, 0.02, 0.15),
        (-0.30, 0.34, 0.11),
        (0.38, 0.28, 0.12),
        (-0.02, -0.55, 0.07),
        (0.00, 0.58, 0.07),
      ];
      for (final (dx, dy, sr) in spots) {
        final o = c.translate(dx * r, dy * r);
        canvas.drawCircle(o, sr * r, spot);
        canvas.drawCircle(o, sr * r * 0.45, Paint()..color = light);
      }
    } else {
      // Pata estilizada do cachorro.
      final paw = Paint()..color = dark;
      canvas.drawOval(
        Rect.fromCenter(
            center: c.translate(0, r * 0.18), width: r * 0.7, height: r * 0.55),
        paw,
      );
      for (final (dx, dy) in const [
        (-0.42, -0.18),
        (-0.15, -0.42),
        (0.15, -0.42),
        (0.42, -0.18),
      ]) {
        canvas.drawCircle(c.translate(dx * r, dy * r), r * 0.15, paw);
      }
    }
  }

  @override
  bool shouldRepaint(_PiecePainter old) => old.type != type;
}
