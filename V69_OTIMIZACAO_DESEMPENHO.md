# V69 — Otimização de desempenho

- Mantido o motor Three.js, a configuração do renderer, os gráficos, as texturas, a iluminação e as sombras.
- Adicionado índice espacial para colisões: consultas de colisão verificam apenas células próximas do jogador/inimigo, em vez de percorrer todos os colisores do mapa a cada teste.
- Adicionado índice espacial para pisos: a consulta de piso procura regiões próximas, preservando os testes originais para círculos, retângulos rotacionados, plataformas e áreas do parkour.
- Otimizada a atualização das plataformas móveis: atualiza diretamente seu colisor e os índices quando necessário, sem percorrer a lista inteira de colisores a cada quadro.
- Atualizada a versão da URL do JavaScript para evitar que o navegador use o arquivo antigo em cache.

As alterações são internas à lógica de consulta; não removem objetos nem reduzem a qualidade visual. Recomenda-se testar movimentos, colisões, parkour, mudança de mapa e construção no navegador de destino.
