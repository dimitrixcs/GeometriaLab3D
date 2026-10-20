# Geometria Lab 3D V54 — Mais atividades

## Novidades
- Parque das Figuras com 10 formas geométricas colecionáveis, cada uma com geometria 3D própria.
- Recompensa de 35 XP ao encontrar cada forma e efeito visual de coleta.
- Circuito de parkour com 7 anéis/checkpoints coloridos em sequência, cronômetro e recompensa por conclusão.
- Painel HUD de exploração com contador de formas encontradas e instrução do parkour.
- Novas missões de exploração e parkour em todos os modos, com progresso e XP de conclusão.
- O jogo reinicia a coleção e o circuito quando uma nova sessão começa.

## Compatibilidade
- Preservado o motor Three.js 0.151.3 e a configuração existente do WebGLRenderer.
- Não foram alterados a versão do Three.js, renderer, tone mapping, sombras, câmera ou arquitetura de inicialização do motor.
- A versão clássica do mapa continua disponível.

## Validação
- `node --check game.v54.js`
- `node --check data.js`
- Verificação estática dos IDs usados pelo HUD e do caminho do script no HTML.
- Não equivale a um teste visual completo em navegador; recomenda-se testar após publicar no Netlify.
