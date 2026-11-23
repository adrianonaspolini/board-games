import 'package:flutter/material.dart';

/// Cores do tabuleiro (madeira clara), iguais nos temas claro e escuro.
abstract final class BoardColors {
  static const background = Color(0xFFF1E3C6);
  static const border = Color(0xFFB08B5A);
  static const line = Color(0xFF6B4E2E);
  static const den = Color(0x22A0522D);
  static const point = Color(0xFF6B4E2E);
  static const target = Color(0xFF2E7D32);
  static const captureTarget = Color(0xFFC62828);
  static const selected = Color(0xFF1565C0);
  static const lastMove = Color(0x553E2723);
  static const onca = Color(0xFFF2A33A);
  static const oncaDark = Color(0xFFC46E12);
  static const oncaSpot = Color(0xFF3E2723);
  static const dog = Color(0xFFFAFAFA);
  static const dogDark = Color(0xFF8D6E63);
}

ThemeData buildTheme(Brightness brightness) {
  final scheme = ColorScheme.fromSeed(
    seedColor: const Color(0xFF2E7D32),
    brightness: brightness,
  );
  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    cardTheme: const CardTheme(clipBehavior: Clip.antiAlias),
  );
}
