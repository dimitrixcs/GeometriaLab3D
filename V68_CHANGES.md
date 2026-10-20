# Geometria Lab 3D — V68: modelos sólidos e personagens refinados

## O que mudou

- **Construções geométricas:** o sólido `hemisphere` agora recebe uma base circular fechada, removendo a abertura que existia na parte inferior. As formas criadas com `ExtrudeGeometry` e os sólidos espaciais fechados mantêm suas superfícies completas. Toro e anel continuam com o furo central intencional, porque ele faz parte da definição matemática dessas formas.
- **Tripulante inspirado em Among Us:** proporções de cápsula, mochila volumétrica, visor arredondado em camadas e reflexos destacados.
- **Bomberman:** cabeça/capacete branco, olhos pretos separados e visíveis, traje branco, cinto com fivela, luvas e botas rosadas, além da antena característica.
- **Creeper:** quatro pernas curtas em vez de braços humanoides, corpo e cabeça cúbicos, rosto montado com blocos escuros e manchas quadradas verdes.
- **Pac-Man:** corpo esférico inteiro, boca tridimensional fechada em profundidade e projetada sobre a curvatura frontal, com bordas elevadas; removidos braços e sapatos humanos.
- **Yoshi:** olhos maiores com pupilas, focinho ampliado com narinas, pescoço, sela vermelha com borda e espinhos dorsais, e cauda mais visível.
- **Mario e Luigi:** olhos com íris individuais, nariz e bigode em peças 3D, além dos emblemas `M` e `L` em relevo nos bonés.
- O renderizador Three.js/WebGL e os arquivos de textura existentes não foram substituídos.

## Referências consultadas

- Minecraft, apresentação oficial do Creeper: https://www.minecraft.net/en-us/article/meet-creeper
- Innersloth, página oficial de Among Us: https://www.innersloth.com/games/among-us/
- Konami, personagens oficiais de Super Bomberman R Online: https://www.konami.com/games/bomberman/online/us/pt/character/
- PAC-MAN, página oficial de personagens: https://pacman.com/en/character/
- Nintendo, página oficial de Yoshi: https://www.nintendo.com/en-ca/explore/characters/mario/friends/
- Three.js, documentação de CylinderGeometry e da propriedade `openEnded`: https://threejs.org/docs/pages/CylinderGeometry.html

## Verificações

- `node --check game.v63.js`: passou.
- Sintaxe dos scripts inline não vazios em `index.html`: passou.
- Integridade do ZIP: verificada após criação.
- Tentativa de teste visual automatizado: o navegador bloqueou a navegação local com `ERR_BLOCKED_BY_ADMINISTRATOR`; por isso a renderização final ainda precisa de confirmação no navegador do utilizador.

## Correção — Professor Betinho (20/10/2026)
- Reposicionado na ilha principal, fora do eixo do monumento central para não ficar encoberto.
- Adicionado pedestal turquesa com aro dourado como ponto visual de referência.
- Nome e indicação “Aulas de Geometria” exibidos acima do personagem.
- Mantido o motor 3D e as demais mecânicas do projeto.
