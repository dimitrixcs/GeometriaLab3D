# V57 — Parkour de plataformas, paredes altas e geometria suavizada

- Motor 3D preservado: Three.js 0.151.3, configuração de `WebGLRenderer`, luzes, sombras e tone mapping idênticos à V56.
- Paredes do labirinto aumentadas para 7,6 unidades; corpos com bordas suavizadas, topo arredondado e duas linhas luminosas de orientação.
- Ilha de desafios maior e fosso ajustado para acomodar o percurso.
- Parkour reconstruído com 14 etapas: saltos iniciais, viga, checkpoint, slime de impulso, piso instável, checkpoint, viga estreita, plataforma móvel, gelo, escada de saltos, barreira que exige pulo e chegada.
- Plataforma móvel sincroniza posição visual, área caminhável e collider; carrega o jogador se estiver em cima.
- Plataformas e partes principais do cenário recebem geometria bevel/contornos arredondados.
- Curvas de ilha com mais amostras e tubos de costa mais suaves.
- Cache para geometrias suavizadas repetidas, reduzindo duplicação de buffers.
- Recomendações de aparência baseadas nas APIs documentadas oficialmente pelo Three.js: `Shape`/`ExtrudeGeometry`, `MeshStandardMaterial` (roughness/metalness) e `CatmullRomCurve3`.
