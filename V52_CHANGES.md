# V52 — Movimento mais fluido e polimento

- **Pontes:** corrigida a colisão AABB demasiado ampla nas duas grades/corrimãos rotacionados das pontes. O broad-phase AABB só filtra; o teste final calcula círculo-vs-OBB. A passagem central da ponte agora está livre.
- **Movimentação:** integração diagonal de X/Z em conjunto evita os passos intermediários fora da pista em pontes diagonais; fallback por eixo é usado apenas para deslizar junto de paredes reais.
- **Colisões:** cheque vertical do corpo do jogador, colisão círculo-vs-caixa para limites comuns e orientados, teste OBB-vs-AABB na colocação de construções e suporte físico sem bounding boxes gigantes para os corrimãos.
- **Câmera:** amortecimento exponencial independente de FPS para as seis perspectivas.
- **Desempenho:** limite de 260 partículas simultâneas, descarte de recursos ao remover partículas.
- **Progresso:** a chave XP passa para `gl_profile_xp_v52`, migrando os valores anteriores e o perfil salvo V51 sem descartar progresso.
- **Visual de navegação:** faixa de orientação discreta adicionada sobre cada ponte (somente visual).
- **Motor:** versão Three.js, WebGLRenderer, cenário base, luzes e configuração de sombras não foram alterados.

- **Entradas das pontes no Centro:** movi dois prédios e redistribuí árvores/postes que estavam dentro das linhas de aproximação das pontes, para o jogador não bater em obstáculos antes mesmo de entrar na ponte.
