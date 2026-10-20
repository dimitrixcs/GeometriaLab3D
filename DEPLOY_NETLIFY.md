# Deploy no Netlify — Geometria Lab 3D V61

1. Extraia o ZIP completo.
2. Faça deploy da pasta em que `index.html` está na raiz. Inclua `netlify.toml`, `package.json` e `netlify/functions/`.
3. Para Git, importe o repositório completo no Netlify; para terminal, execute `npm install` e `netlify deploy --prod` na pasta do projeto.
4. Configure `GEMINI_API_KEY` nas variáveis de ambiente do site se quiser usar as funções Gemini e então faça um novo deploy.
5. Após a publicação, use `Ctrl + F5` ou abra uma janela anônima.

O ZIP inclui `.env` e `.env.example` somente com texto de marcador. **Não substitua o arquivo incluído com sua chave real antes de publicar a pasta** e não envie uma chave real ao GitHub. Use a variável de ambiente do Netlify para produção.

O projeto requer Three.js 0.151.3, carregado pelo endereço CDN já referenciado no `index.html`; o motor gráfico não foi alterado nesta versão.
