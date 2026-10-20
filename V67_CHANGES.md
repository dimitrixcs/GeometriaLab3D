# Geometria Lab 3D — V67 personagens e trilhas de geometria

## Melhorias de personagens
- Pac-Man agora usa uma esfera com um setor realmente removido e uma superfície interna curva escura, substituindo o triângulo plano que parecia um desenho 2D colado no corpo.
- Adicionados quatro personagens procedurais em 3D: Luigi, Yoshi, Toad e Creeper.
- Os modelos novos usam componentes 3D separados (chapéu, olhos, focinho, manchas, corpo e membros) e referências de membros para animações de movimento e salto.
- Os novos personagens ficam disponíveis na seleção inicial, no menu de personalização e nos avatares remotos do multiplayer.
- Nenhuma textura ou aparência de personagem existente foi substituída.

## Mais aprendizagem de geometria
- Novo painel **Trilhas de Geometria** acessível pelo menu de pausa.
- Quatro trilhas com cinco perguntas aleatórias por sessão: geometria plana, geometria espacial, desafio misto e fórmulas relâmpago.
- Cada pergunta tem cronômetro e feedback; respostas e conclusão concedem XP.
- O catálogo das 40 figuras continua acessível pelo painel e mantém a prática individual existente.

## Validações realizadas
- `node --check game.v63.js` passou.
- `node --check data.js` passou.
- Os três scripts JavaScript embutidos em `index.html` passaram em `node --check`.
- Não foram encontrados IDs HTML duplicados.
- Integridade do ZIP verificada após empacotamento.
- A verificação visual por Chromium não foi concluída neste ambiente; o navegador travou durante a inicialização, então a aparência final ainda deve ser conferida no navegador local.

## Preservação
- Motor Three.js/WebGL e renderizador não foram alterados.
- Texturas e arquivos de imagem existentes foram mantidos.
- Os novos personagens são montados proceduralmente com geometria 3D; nenhuma imagem externa foi aplicada a eles.
