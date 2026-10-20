# V64 — Expansão do mapa

## Novas regiões conectadas

- **Área de Neve:** ilha gelada com picos nevados e identidade visual fria.
- **Área Vulcânica:** montanha central, cratera emissiva e paleta rochosa quente.
- **Deserto:** terreno dourado e cactos.
- **Ruínas Flutuantes:** pilares antigos e detalhes violeta.
- **Arena Multiplayer:** plataforma circular com anel de corrida e centro destacado.

## Navegação e estrutura

- As novas regiões se conectam a ilhas existentes por pontes caminháveis com piso e rampas registrados no sistema de superfícies.
- As barreiras das bordas e os portões das ilhas incluem as cinco novas regiões.
- O limite do mapa foi ampliado para acomodar o arquipélago, e a miniatura do jogador usa uma escala adequada ao mapa maior.
- A região atual e o subtítulo do mapa reconhecem as novas áreas.

## Preservação

- Não foram alterados o motor Three.js/WebGL, as configurações do renderizador, as texturas existentes, nem os modelos/aparências dos personagens.
- O mapa clássico permanece separado e mantém seu limite próprio.

## Verificações

- `node --check game.v63.js` passou.
- Scripts inline do HTML e cache-busting dos arquivos revisados.
- A inspeção visual interativa completa precisa ser confirmada no navegador local.
