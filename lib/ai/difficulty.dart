/// Níveis de dificuldade: profundidade de busca (em jogadas) e um ruído
/// aleatório somado à avaliação de cada lance na raiz, que deixa os níveis
/// mais fáceis menos previsíveis e mais propensos a errar.
enum Difficulty {
  easy(depth: 1, noise: 150),
  medium(depth: 3, noise: 15),
  hard(depth: 6, noise: 0);

  const Difficulty({required this.depth, required this.noise});

  final int depth;
  final double noise;
}
