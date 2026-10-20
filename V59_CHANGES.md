# V59 — Painéis compactos e desempenho

- O HUD da partida inicia com Objetivo Atual, Missões, Ilha dos Desafios e Guia de Navegação recolhidos; cada painel pode ser expandido pelo botão `+`.
- Ao iniciar uma nova partida, o estado compacto é reaplicado para que painéis abertos em sessões anteriores não voltem a ocupar a tela.
- A simulação e renderização são suspensas quando o jogo ainda está no menu inicial ou quando a aba do navegador está oculta. Em pausa, física, inimigos, plataformas e partículas ficam congelados, enquanto o cenário continua renderizando e a rede continua sendo consultada.
- Atualizações de texto da HUD (região e alvo) são limitadas a 10 vezes por segundo, mantendo o movimento independente dessa frequência.
- Caixas de colisão de construções já assentadas são armazenadas e reutilizadas; a física de construções retorna rapidamente quando nenhum objeto está caindo.
- Partículas reutilizam geometria e materiais por cor, reduzindo alocações repetidas de recursos GPU.
- Corrigido estado acessível (`aria-expanded`, rótulo e tooltip) do botão de minimizar Missões.
- O renderer Three.js/WebGL, os parâmetros do renderer, as texturas procedurais e seus materiais de superfície foram preservados.
