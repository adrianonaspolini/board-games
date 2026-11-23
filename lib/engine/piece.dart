/// Identificador de jogador (0 ou 1 em jogos de dois jogadores).
typedef PlayerId = int;

/// Adversário de [player] em jogos de dois jogadores.
PlayerId opponentOf(PlayerId player) => 1 - player;

/// Uma peça no tabuleiro.
///
/// [id] é uma identidade estável (útil para animações na UI); [type] e
/// [owner] definem a peça para as regras. Duas posições com as mesmas peças
/// nos mesmos pontos são equivalentes mesmo que os [id]s sejam diferentes.
class Piece {
  const Piece({required this.id, required this.owner, required this.type});

  final int id;
  final PlayerId owner;
  final String type;

  @override
  bool operator ==(Object other) =>
      other is Piece &&
      other.id == id &&
      other.owner == owner &&
      other.type == type;

  @override
  int get hashCode => Object.hash(id, owner, type);

  @override
  String toString() => '$type#$id(p$owner)';
}
