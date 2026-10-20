# Geometria Lab 3D — V68

A V68 aprimora modelos procedurais de personagens clássicos, fecha a base do hemisfério usado nas construções geométricas e mantém o motor Three.js/WebGL e os arquivos de textura existentes.

## Novidades da V68 — modelos sólidos e personagens

- Creeper com quatro pernas, sem braços e rosto pixelado em blocos.
- Tripulante inspirado em Among Us com visor de vidro arredondado e mochila volumétrica.
- Bomberman com capacete branco, olhos separados, luvas, botas e antena.
- Pac-Man com boca volumétrica projetada sobre a curvatura da esfera.
- Yoshi com olhos maiores, focinho com narinas, sela e espinhos.
- Mario e Luigi com olhos, bigode e emblemas 3D melhor definidos.
- Hemisfério fechado por uma base circular para evitar uma abertura inferior.
- Toro e anel conservam o furo central intencional, necessário para representar essas formas corretamente.

Veja `V68_CHANGES.md` para detalhes e referências.

## Novidades anteriores da V67 — personagens e aprendizado

- Pac-Man com abertura de boca construída em geometria 3D e cavidade curva, em vez de um triângulo plano sobre a esfera.
- Novos personagens 3D procedurais: Luigi, Yoshi, Toad e Creeper, com braços/pernas articulados e poses de movimento/salto.
- Os quatro novos personagens estão disponíveis na seleção inicial, no estúdio de personalização e nas representações remotas do multiplayer.
- Novo painel **Trilhas de Geometria** com cinco perguntas por sessão: geometria plana, geometria espacial, desafio misto e fórmulas relâmpago. Respostas e conclusão concedem XP.
- Motor Three.js/WebGL, renderizador e texturas dos personagens que já existiam foram preservados.

## Novidades herdadas da V66 — vulcão e parkour

- **Vulcão reconstruído:** montanha facetada com crateras, lago de magma, rios de lava, rochas vulcânicas, espigões e fumaça.
- **Parkour mais legível:** plataformas maiores, dois trechos móveis, alvos em forma de aros luminosos e checkpoints destacados.
- **Melhor leitura do percurso:** guias baixas substituem as paredes sólidas junto ao fosso, a área inferior fica mais escura e os rótulos das plataformas ficam maiores.
- **Preservação:** motor 3D, renderizador, personagens, texturas e aparência dos personagens mantidos.

Veja `V67_CHANGES.md` para detalhes e verificações.
Veja também `V66_CHANGES.md` para as mudanças herdadas no vulcão e no parkour.

---

# Geometria Lab 3D — V65

Projeto web do Geometria Lab 3D. A V65 mantém o motor gráfico Three.js 0.151.3/WebGL, o renderizador, as texturas e a aparência dos personagens da base V64, adicionando objetivos interativos nas cinco novas ilhas.

## Novidades da V65 — ilhas com atividades

- **Área de Neve:** trilha de cinco cristais colecionáveis e manchas de gelo escorregadio que mudam o controlo do movimento.
- **Área Vulcânica:** cinco fragmentos de magma e três jatos de lava com ciclo de carga visível antes de disparar.
- **Deserto:** oito moedas colecionáveis e gêiseres de areia que podem lançar o jogador.
- **Ruínas Flutuantes:** três runas antigas desbloqueiam um baú secreto com recompensa de XP.
- **Arena Multiplayer:** circuito cronometrado com quatro portais em sequência, recorde guardado localmente e bônus por conclusão diária.
- **Recompensas:** os itens dão XP uma única vez por perfil, e conjuntos de cristais, magma e moedas concedem bônus ao completar a coleção.
- **Preservação:** nenhuma alteração no motor 3D, renderizador, texturas originais, aparência dos personagens ou física base do jogo.

Veja `V65_CHANGES.md` para a lista de alterações e verificações.

## Histórico da V64 — expansão do mapa

A V64 expandiu o arquipélago da base V63 com cinco novas regiões conectadas por pontes. A configuração do `WebGLRenderer`, as luzes, o sistema de sombras e o tone mapping permaneceram sem alterações.

## Novidades da V64

- **Mapa expandido:** cinco novas regiões conectadas por pontes: Área de Neve, Área Vulcânica, Deserto, Ruínas Flutuantes e Arena Multiplayer.
- **Novos marcos visuais:** picos nevados, cone vulcânico, crateras emissivas, cactos, pilares antigos e arena circular.
- **Limites e navegação ampliados:** maior raio de exploração, neblina ajustada para a nova escala, localização atualizada e mini mapa adaptado ao arquipélago expandido.
- **Preservação da base:** motor Three.js/WebGL, renderizador, texturas existentes, personagens e animações mantidos.

## Novidades da V63

- **Seis personagens clássicos extras:** Super Mario, Sonic, Kirby, Pac-Man, Steve (Minecraft) e Pikachu, disponíveis na seleção inicial e no estúdio de personalização.
- **Animações de personagem:** ciclos próprios de caminhada/corrida, poses no salto e movimento no ar; Kirby tem balanço mais flutuante, Mario levanta os braços no salto, Sonic usa um ciclo de corrida mais veloz, Steve mantém balanços rígidos e Pikachu mexe as orelhas e a cauda. Pac-Man ganha uma animação de boca.
- **Modelos e materiais dos extras preservados durante a animação:** os movimentos são aplicados por transformações; não foram adicionados mapas de textura nem alteradas as imagens existentes.
- **Motor gráfico preservado:** Three.js 0.151.3/WebGL, configuração do `WebGLRenderer`, luzes, sombras e tone mapping permanecem sem alterações. A física e as velocidades de movimento/salto também não foram alteradas.
- **Multiplayer:** os avatares remotos também aplicam animações de movimento e recebem o estado básico do salto.

Veja `V63_CHANGES.md` para os detalhes e as fontes consultadas sobre os movimentos dos personagens.

## Novidades da V61

- **Controles personalizáveis:** abra `ESC → MODIFICAR CONTROLES`, selecione um comando e pressione a nova tecla. As configurações ficam salvas neste navegador; há opção para restaurar os padrões.
- **Primeira pessoa:** a câmera pode inclinar para baixo e observar o chão.
- **Física das construções:** no Sandbox, use o botão `FÍSICA: LIGADA/DESLIGADA` ou a tecla `T`. Desligada, suas peças ficam imóveis, mas continuam sólidas e colidíveis; ligada, podem cair e se mover. A mudança afeta as construções do próprio jogador.
- **Inventário rápido:** slots mais claros, descrição da peça selecionada e botão direto para o catálogo das 40 figuras.
- **Atividades mantidas:** caça às formas dentro do labirinto e circuito de parkour com plataformas variadas, checkpoints e retorno ao lobby após a chegada. A placa de partida não dá XP; a recompensa é concedida pela conclusão do percurso e limitada para impedir repetição abusiva.
- **Multiplayer:** mensagens de colocação de objetos também transportam o estado da física.

## Testar localmente

É necessário servir os arquivos por HTTP; não abra `index.html` com duplo clique.

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`. Para testar as Netlify Functions localmente, use o Netlify CLI (`npm install` e `netlify dev`).

## Publicar no Netlify

Publique o conteúdo completo desta pasta, com `index.html` na raiz e a pasta `netlify/functions/`. Não misture scripts de versões diferentes. A página carrega `game.v63.js?v=68.0`; depois do deploy, faça `Ctrl + F5` ou teste em janela anônima.

## Gemini e credenciais

O arquivo `.env` deste pacote é **apenas um modelo com marcador**, não contém a chave real. Insira a sua chave no `.env` local apenas para testes locais e não publique esse arquivo em repositórios. Para o site publicado, defina `GEMINI_API_KEY` nas variáveis de ambiente do Netlify e faça novo deploy. O `.gitignore` exclui `.env`.


## Correção V61 — controles e personagens

Consulte `V61_CORRECOES_CONTROLES_PERSONAGENS.md` para as correções de remapeamento de teclas e os dois modelos de personagem adicionados. O motor Three.js permaneceu na versão 0.151.3.


## Versão e compatibilidade

A V66 refina o vulcão e o parkour sobre a base V65. O nome `game.v63.js` foi mantido para compatibilidade com a estrutura existente; use sempre o `index.html` e o script deste pacote juntos.


A V67 se baseia na V66. O nome `game.v63.js` permanece por compatibilidade com a estrutura legada; publique todos os arquivos deste pacote juntos.
