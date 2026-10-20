# Configuração Gemini

O `.env` deste ZIP contém somente um marcador seguro:

```env
GEMINI_API_KEY=COLOQUE_SUA_CHAVE_AQUI
GEMINI_MODEL=gemini-3.8-flash
```

Para testes locais, substitua o marcador por sua chave e use o Netlify CLI para executar as Functions. Não publique esse `.env` nem comite a chave em repositórios. O `.gitignore` exclui `.env`. No Netlify, configure `GEMINI_API_KEY` em Environment variables e publique novamente.
