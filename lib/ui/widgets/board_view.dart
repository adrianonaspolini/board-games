import 'dart:math';

import 'package:flutter/material.dart';

import '../../engine/engine.dart';
import '../theme.dart';
import 'piece_view.dart';

/// Tabuleiro genérico: desenha o grafo com [CustomPainter] e as peças como
/// widgets animados por cima. Não contém regras: recebe o que destacar e
/// devolve toques em pontos por [onTapPoint].
class BoardView extends StatefulWidget {
  const BoardView({
    super.key,
    required this.board,
    required this.state,
    required this.onTapPoint,
    this.selected,
    this.targets = const {},
    this.captureTargets = const {},
    this.lastMove,
    this.highlightedArea,
    this.semanticsLabel,
  });

  final BoardGraph board;
  final GameState state;
  final ValueChanged<int> onTapPoint;
  final int? selected;
  final Set<int> targets;

  /// Subconjunto de [targets] que são capturas (destacados em outra cor).
  final Set<int> captureTargets;
  final Move? lastMove;

  /// Polígono (ids de pontos) pintado com fundo destacado (ex.: a toca).
  final List<int>? highlightedArea;
  final String? semanticsLabel;

  @override
  State<BoardView> createState() => _BoardViewState();
}

class _BoardViewState extends State<BoardView> {
  static const _moveDuration = Duration(milliseconds: 260);
  static const _captureDuration = Duration(milliseconds: 320);

  /// Último ponto conhecido de cada peça (para animar peças capturadas no
  /// lugar onde estavam e trazê-las de volta ao desfazer).
  final Map<int, int> _lastPoint = {};
  final Map<int, String> _types = {};

  @override
  Widget build(BuildContext context) {
    final cells = widget.state.cells;
    final onBoard = <int>{};
    for (var p = 0; p < cells.length; p++) {
      final piece = cells[p];
      if (piece == null) continue;
      _lastPoint[piece.id] = p;
      _types[piece.id] = piece.type;
      onBoard.add(piece.id);
    }

    return LayoutBuilder(builder: (context, constraints) {
      final geo = _BoardGeometry(widget.board, constraints.biggest);
      final pieceIds = _lastPoint.keys.toList()..sort();
      return Center(
        child: Semantics(
          label: widget.semanticsLabel,
          child: SizedBox(
            width: geo.size.width,
            height: geo.size.height,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTapUp: (d) {
                final p = geo.hitTest(d.localPosition);
                if (p != null) widget.onTapPoint(p);
              },
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Positioned.fill(
                    child: CustomPaint(
                      painter: _BoardPainter(
                        geo: geo,
                        selected: widget.selected,
                        targets: widget.targets,
                        lastMove: widget.lastMove,
                        area: widget.highlightedArea,
                      ),
                    ),
                  ),
                  for (final id in pieceIds)
                    _buildPiece(geo, id, onBoard.contains(id)),
                  // Destinos por cima das peças (capturas pousam em vazio).
                  for (final t in widget.targets)
                    _TargetMarker(
                        key: ValueKey('t$t'),
                        center: geo.offsetOf(t),
                        unit: geo.unit,
                        color: widget.captureTargets.contains(t)
                            ? BoardColors.captureTarget
                            : BoardColors.target),
                ],
              ),
            ),
          ),
        ),
      );
    });
  }

  Widget _buildPiece(_BoardGeometry geo, int id, bool alive) {
    final type = _types[id]!;
    final size = geo.unit * (type == 'onca' ? 0.66 : 0.54);
    final center = geo.offsetOf(_lastPoint[id]!);
    final isSelected = alive && widget.selected == _lastPoint[id];
    return AnimatedPositioned(
      key: ValueKey('piece$id'),
      duration: _moveDuration,
      curve: Curves.easeOutCubic,
      left: center.dx - size / 2,
      top: center.dy - size / 2,
      width: size,
      height: size,
      child: IgnorePointer(
        child: AnimatedOpacity(
          duration: _captureDuration,
          opacity: alive ? 1 : 0,
          child: AnimatedScale(
            duration: _captureDuration,
            curve: alive ? Curves.easeOutBack : Curves.easeIn,
            scale: alive ? (isSelected ? 1.12 : 1) : 0.2,
            child: PieceView(type: type, size: size),
          ),
        ),
      ),
    );
  }
}

class _TargetMarker extends StatelessWidget {
  const _TargetMarker({
    super.key,
    required this.center,
    required this.unit,
    required this.color,
  });

  final Offset center;
  final double unit;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final size = unit * 0.34;
    return Positioned(
      left: center.dx - size / 2,
      top: center.dy - size / 2,
      width: size,
      height: size,
      child: IgnorePointer(
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: 1),
          duration: const Duration(milliseconds: 180),
          builder: (context, t, _) => Transform.scale(
            scale: t,
            child: DecoratedBox(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: color.withValues(alpha: 0.55),
                border: Border.all(color: color, width: 2),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Converte coordenadas lógicas dos pontos em pixels, mantendo a proporção.
class _BoardGeometry {
  _BoardGeometry(this.board, Size available) {
    final xs = board.points.map((p) => p.x);
    final ys = board.points.map((p) => p.y);
    _minX = xs.reduce(min);
    _minY = ys.reduce(min);
    final w = xs.reduce(max) - _minX + 2 * _margin;
    final h = ys.reduce(max) - _minY + 2 * _margin;
    unit = min(available.width / w, available.height / h);
    size = Size(w * unit, h * unit);
  }

  static const _margin = 0.6;

  final BoardGraph board;
  late final double _minX;
  late final double _minY;
  late final double unit;
  late final Size size;

  Offset offsetOf(int id) {
    final p = board.points[id];
    return Offset(
        (p.x - _minX + _margin) * unit, (p.y - _minY + _margin) * unit);
  }

  int? hitTest(Offset pos) {
    int? best;
    var bestDist = double.infinity;
    for (final p in board.points) {
      final d = (offsetOf(p.id) - pos).distance;
      if (d < bestDist) {
        bestDist = d;
        best = p.id;
      }
    }
    return bestDist <= unit * 0.5 ? best : null;
  }
}

class _BoardPainter extends CustomPainter {
  _BoardPainter({
    required this.geo,
    required this.selected,
    required this.targets,
    required this.lastMove,
    required this.area,
  });

  final _BoardGeometry geo;
  final int? selected;
  final Set<int> targets;
  final Move? lastMove;
  final List<int>? area;

  @override
  void paint(Canvas canvas, Size size) {
    final u = geo.unit;
    final rect = Offset.zero & size;
    canvas.drawRRect(
      RRect.fromRectAndRadius(rect, Radius.circular(u * 0.25)),
      Paint()..color = BoardColors.background,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          rect.deflate(u * 0.03), Radius.circular(u * 0.23)),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = u * 0.06
        ..color = BoardColors.border,
    );

    final area = this.area;
    if (area != null && area.length >= 3) {
      final path = Path()
        ..moveTo(geo.offsetOf(area.first).dx, geo.offsetOf(area.first).dy);
      for (final id in area.skip(1)) {
        final o = geo.offsetOf(id);
        path.lineTo(o.dx, o.dy);
      }
      canvas.drawPath(path..close(), Paint()..color = BoardColors.den);
    }

    final linePaint = Paint()
      ..color = BoardColors.line
      ..strokeWidth = max(1.5, u * 0.045)
      ..strokeCap = StrokeCap.round;
    for (final line in geo.board.lines) {
      canvas.drawLine(
          geo.offsetOf(line.first), geo.offsetOf(line.last), linePaint);
    }

    final last = lastMove;
    if (last != null && last.origin != null) {
      final from = geo.offsetOf(last.origin!);
      final to = geo.offsetOf(last.destination!);
      final trail = Paint()
        ..color = BoardColors.lastMove
        ..strokeWidth = u * 0.12
        ..strokeCap = StrokeCap.round;
      canvas.drawLine(from, to, trail);
      canvas.drawCircle(from, u * 0.14, Paint()..color = BoardColors.lastMove);
    }

    final pointPaint = Paint()..color = BoardColors.point;
    for (final p in geo.board.points) {
      canvas.drawCircle(geo.offsetOf(p.id), u * 0.075, pointPaint);
    }

    final sel = selected;
    if (sel != null) {
      canvas.drawCircle(
        geo.offsetOf(sel),
        u * 0.4,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = u * 0.07
          ..color = BoardColors.selected,
      );
    }
  }

  @override
  bool shouldRepaint(_BoardPainter old) =>
      old.geo.unit != geo.unit ||
      old.selected != selected ||
      old.lastMove != lastMove ||
      !setEquals(old.targets, targets);

  static bool setEquals(Set<int> a, Set<int> b) =>
      a.length == b.length && a.containsAll(b);
}
