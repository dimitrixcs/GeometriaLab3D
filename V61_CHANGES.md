# V61 — Sandbox, parkour e controles

- Mantido o motor Three.js 0.151.3/WebGL e a configuração do renderer da base V60.
- Adicionado painel de remapeamento de controles pelo menu de pausa, com persistência local e restauração dos padrões.
- Primeira pessoa permite inclinar a visão mais para baixo e para cima.
- Adicionado botão para ativar/desativar a física apenas das construções próprias; objetos continuam sólidos com física desligada.
- Inventário rápido mais informativo, com descrições acessíveis e botão direto para o catálogo de 40 figuras.
- Mantida caça às formas no labirinto, circuito de parkour com obstáculos/checkpoints, recompensa de conclusão limitada por dia e retorno ao lobby. A placa inicial não concede XP.
- O arquivo `.env` distribuído contém somente marcadores, nunca credenciais. Configure a chave real localmente e nas variáveis de ambiente do Netlify.
- A recompensa de +35 XP das formas colecionáveis é registrada uma única vez por figura, evitando farming ao reiniciar o modo.
- O menu de controles inclui também a tecla de rotação da peça; os atalhos visíveis na HUD acompanham as remapeações.


## Correções posteriores (V61 corrigida)
- Captura de teclas passa a usar a fase de captura e troca automaticamente duas funções quando a tecla escolhida já está ocupada.
- Modelos 3D especiais adicionais: tripulante vermelho e bombardeiro branco, com prévias visuais na tela inicial e no editor.
- Atualização da aparência dos personagens especiais também no multiplayer.
