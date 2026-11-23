import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Garante que a lógica (engine, games, ai) continua em Dart puro.
void main() {
  test('engine, games e ai não importam Flutter', () {
    for (final dir in ['lib/engine', 'lib/games', 'lib/ai']) {
      final files = Directory(dir)
          .listSync(recursive: true)
          .whereType<File>()
          .where((f) => f.path.endsWith('.dart'));
      for (final f in files) {
        final src = f.readAsStringSync();
        expect(src.contains("package:flutter"), isFalse, reason: f.path);
        expect(src.contains("dart:ui"), isFalse, reason: f.path);
      }
    }
  });
}
