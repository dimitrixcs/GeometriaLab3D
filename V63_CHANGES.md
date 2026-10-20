# V63 — Animações e personagens clássicos

## Personagens adicionados

- **Super Mario:** caminhada/corrida com braços e pernas alternados; pose com braços erguidos no salto.
- **Sonic:** ciclo de corrida mais rápido, com inclinação e balanço durante o salto.
- **Kirby:** balanço arredondado, braços mais abertos no ar e leve efeito de flutuação/squash.
- **Pac-Man:** balanço de corrida e animação contínua da boca.
- **Steve (Minecraft):** pernas e braços em movimento rígido, preservando a linguagem visual blocada.
- **Pikachu:** passadas curtas, orelhas com movimento e cauda oscilante.

Os personagens especiais existentes, Tripulante e Bomberman, também receberam referências de braços/pernas para animar as malhas já existentes sem trocar os materiais, formas ou cores de repouso.

## Implementação

- Novos personagens selecionáveis no formulário inicial e no estúdio de personalização.
- Animação de locomoção, repouso e salto no jogador local; os avatares remotos também animam as pernas/braços quando se movem.
- Os seis modelos clássicos são construídos com geometrias primitivas já disponíveis na versão Three.js do projeto. Não foram adicionados arquivos de textura.
- O motor/renderizador 3D, as configurações de iluminação/sombra/tone mapping, o CSS visual, as velocidades e a física de movimento não foram alterados.

## Pesquisa de movimentos

As referências serviram para guiar a linguagem das animações, não para copiar arquivos de animação de terceiros:

- Nintendo, comentários de desenvolvimento sobre poses icônicas de salto do Mario, braços estendidos e parada após correr: https://www.nintendo.com/us/whatsnew/ask-the-developer-vol-11-super-mario-bros-wonder-part-2/
- SEGA, descrição oficial do Spin Dash e movimento acelerado do Sonic: https://support.sega.com/hc/en-us/articles/39574768164625-How-do-I-perform-a-spin-dash
- Nintendo, manual de Kirby com pulo, hover e múltiplos movimentos no ar: https://csassets.nintendo.com/noaext/image/private/t_KA_PDF/DS_Kirby_Superstar
- Minecraft Creator documentation, animações como transformações de partes do modelo e estados de animação: https://learn.microsoft.com/en-us/minecraft/creator/documents/animations/animationsoverview?view=minecraft-bedrock-stable
- PAC-MAN Official, forma redonda clássica e ação de chomp: https://pacman.com/en/character/
- Pokémon, perfil de criação de Pikachu e notas sobre adaptar o corpo para facilitar atuação/animação: https://www.pokemon.com/us/pokemon-news/creator-profile-the-creators-of-pikachu

## Verificações realizadas

- Sintaxe JavaScript do arquivo principal validada com `node --check`.
- Scripts JavaScript embutidos no HTML validados com `node --check`.
- Teste isolado de construção/animação executado para os oito personagens especiais (Tripulante, Bomberman e os seis extras), em estado de caminhada e no ar.
- A execução visual completa no Chromium headless não terminou neste ambiente; por isso a verificação visual final no navegador ainda deve ser feita ao abrir o projeto localmente.
