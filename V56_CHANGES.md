# V56 — Parkour inspirado em mapas de Minecraft

O parkour de anéis foi substituído por um percurso físico em ilha própria: saltos de dificuldade crescente, viga estreita, checkpoints frequentes, placa slime com impulso, piso instável temporizado, trecho de gelo e arco de chegada. O percurso foi desenhado para ensinar cada obstáculo antes de aumentar a dificuldade, com retornos ao checkpoint em caso de queda. A chegada concede +10 XP uma vez por dia e teleporta o jogador ao lobby. F6 inicia a caça às formas no labirinto; F7 inicia o parkour. O motor, renderer, luzes, sombras e versão Three.js não foram alterados.

A ilha dos desafios tem um vão físico recortado no terreno: se o jogador errar um salto, cai e volta ao checkpoint. O percurso acrescenta degraus de dificuldade, viga, slime, plataforma que desaba, gelo, saltos de escada, teto baixo e chegada.

Correções adicionais de implementação: a ilha de desafios usa um recorte geométrico real no terreno (vão sem piso, não apenas textura), a plataforma de largada tem superfície física cadastrada, e o trecho de teto baixo limita o salto ao detectar colisão vertical por cima da cabeça.
