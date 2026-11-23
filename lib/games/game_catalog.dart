/// Catálogo de jogos do app. A UI traduz o [GameInfo.id] em nome e
/// descrição, e decide qual tela abrir.
class GameInfo {
  const GameInfo(this.id, {required this.available});

  final String id;
  final bool available;
}

abstract final class GameIds {
  static const onca = 'onca';
  static const trilha = 'trilha';
  static const restaUm = 'resta_um';
  static const damas = 'damas';
  static const alquerque = 'alquerque';
}

const gameCatalog = <GameInfo>[
  GameInfo(GameIds.onca, available: true),
  GameInfo(GameIds.trilha, available: false),
  GameInfo(GameIds.restaUm, available: false),
  GameInfo(GameIds.damas, available: false),
  GameInfo(GameIds.alquerque, available: false),
];
