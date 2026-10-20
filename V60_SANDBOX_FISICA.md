# V60 — Física interativa no Sandbox

O motor 3D (Three.js), o renderer e os gráficos existentes foram preservados.

## Controles de física
- **G**: pegar o bloco/figura que estiver no centro da mira; G novamente solta.
- **Roda do mouse**: aproximar ou afastar o objeto segurado.
- **Clique esquerdo** enquanto segura: arremessar o objeto.
- **F** enquanto segura: congelar o objeto no lugar. Mire nele, pressione G e depois F para voltar a interagir com a física.
- **B**: entrar/sair do modo construção.
- No modo construção: clique esquerdo coloca, botão direito remove, R/F giram a prévia.

As construções continuam usando a simulação leve já existente: gravidade, empilhamento, colisões com o cenário e movimento/arremesso horizontal simplificado. Não é um solver físico completo como o Garry’s Mod, mas permite brincar com as peças sem adicionar outra engine.

## Segurança
O arquivo `.env` foi incluído com `GEMINI_API_KEY` vazio para não distribuir uma chave privada. Coloque sua chave localmente; para deploy, use as variáveis de ambiente do provedor.
