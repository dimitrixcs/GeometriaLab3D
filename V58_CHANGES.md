# V58 — Cinematic World Polish

## Motor 3D preservado
- Mantém Three.js 0.151.3, `WebGLRenderer`, anti-aliasing, tone mapping ACES, pixel ratio, shadow-map PCF soft shadows e logarithmic depth buffer.
- A criação/configuração do renderer não foi modificada. O polimento utiliza materiais, texturas procedurais, geometria decorativa, paleta e iluminação da cena.

## Acabamento visual
- Texturas procedurais locais (sem downloads) para terreno/grama, rocha, pedra, concreto, madeira e folhagem, incluindo bump maps sutis.
- Iluminação com contraste mais cinematográfico e preenchimento frio; haze do mapa ajustado para profundidade.
- Falésias com camadas de erosão, árvores com troncos/galhos e copas em camadas, vegetação rasteira, rochas e flores instanciadas para limitar draw calls.
- Pontes com tábuas, detalhes metálicos e cabos arqueados, sem introduzir novos colisores nos elementos decorativos.
- Fachadas com materiais texturizados, marcos de janela mais escuros, janelas laterais, plintos e acabamentos de telhado.
- Paleta das seis regiões enriquecida, conservando a leitura por cores.

## Preservação de funcionalidades
- Mantém mapa clássico, Cidade da Geometria, Sandbox, Aprendizado, Combate, missões, XP, labirinto, caça às formas, parkour, personalização, Gemini e Netlify Functions.
- Não foram alterados os limites e o código do renderer ou a versão da biblioteca Three.js.
