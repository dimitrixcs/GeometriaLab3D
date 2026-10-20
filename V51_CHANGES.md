# Geometria Lab 3D V51 — revisão geral

## Mantido
- Three.js 0.151.3/WebGL.
- Renderer, câmera base, cena, luzes e configuração do shadow map da V50 mantidos sem alterações.
- Modos, Cidade/Clássico, catálogo geométrico, missões, quiz, personagem, Gemini e UI original foram mantidos.

## Melhorias
- XP em chave canônica V51, migração do melhor valor válido anterior e escrita sem espelhar chaves legadas; nível e barra calculados a partir do XP total.
- Atalho Q corrigido (`KeyQ`), respostas do quiz protegidas contra chamadas duplicadas e timeout de prática não causa dano de combate.
- Persistência protegida de estatísticas e tolerância quando localStorage está indisponível.
- Movimento em passos curtos durante colisões para diminuir atravessamento e ajudar o deslizamento junto às paredes.
- Limite de 120 construções por jogador e 240 no mundo, caixa de colisão por objeto calculada uma vez por frame de física, e descarte de materiais/geometrias removidos.
- Preferência de câmera salva; F3 abre painel de diagnóstico com FPS, número de construções, Geo-Beasts vivos e mapa atual.
- Multiplayer conectado ao Netlify room relay, para código/senha informados no menu; envio de posição, construções e dano aos inimigos via eventos do relay.
- Reaproveitamento de código de sala quando o host está offline, sincronização de nome/cor dos avatares e de vida dos Geo-Beasts.
- Refinamentos de acessibilidade e feedback de botão; atualização de status da inicialização do motor.

## Observações
A validação local é sintática/estática. Multiplayer entre navegadores precisa de uma verificação publicada no Netlify com Functions e Blobs ativos.


> Consulte V52_CHANGES.md para o patch atual de movimento e colisões das pontes.
