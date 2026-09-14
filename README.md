# lucianookdp.dev

Meu site pessoal. Astro na base, React só onde precisa de estado, Tailwind
para o CSS e Three.js no notebook 3D do topo. Conteúdo em português e inglês.

Site: https://lucianookdp.dev

## Rodando

```bash
npm install
npm run dev
```

`npm run build` gera o site em `dist/`. Antes disso ele também:

- busca os dados do GitHub (precisa de `GITHUB_TOKEN` no ambiente; sem ele,
  usa o cache em `src/data/github-stats.json`);
- gera os favicons a partir de `public/favicon.svg`;
- gera as imagens de compartilhamento (`og.png` e `og-en.png`).

## Estrutura

```
src/
  components/hero/        notebook 3D (LaptopScene.ts) e o hero
  components/sections/    sobre, projetos, serviços, stack e contato
  components/islands/     componentes React (tema, idioma, ⌘K, e-mail)
  data/                   projetos, stack e cache do GitHub
  i18n/                   textos em pt e en
  lib/                    scroll suave, animações e utilidades
scripts/                  geração de ícones, OG e stats
```

Os textos ficam em `src/i18n/*.json` e os projetos em
`src/data/projects.json`. Para mostrar um vídeo ou GIF de um projeto, basta
colocar o arquivo em `public/media/projects/<id>.mp4` (ou `.webm`/`.gif`).

## Deploy

GitHub Pages, pelo workflow em `.github/workflows/deploy.yml`, a cada push na
`main`. Um segundo workflow atualiza o cache do GitHub todo dia.

## Licença

Todos os direitos reservados. O código é público para consulta.
