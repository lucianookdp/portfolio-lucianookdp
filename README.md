# lucianookdp.dev

My personal site. Astro as the base, React only where state is needed, Tailwind
for the CSS and Three.js for the 3D laptop at the top. Content in Portuguese
and English.

Site: https://lucianookdp.dev

## Running

```bash
npm install
npm run dev
```

`npm run build` writes the site to `dist/`. Before that it also:

- fetches the GitHub data (needs `GITHUB_TOKEN` in the environment; without it,
  falls back to the cache in `src/data/github-stats.json`);
- generates the favicons from `public/favicon.svg`;
- generates the sharing images (`og.png` and `og-en.png`).

## Structure

```
src/
  components/hero/        the 3D laptop (LaptopScene.ts) and the hero
  components/sections/    about, projects, services, stack and contact
  components/islands/     React components (theme, language, ⌘K, e-mail)
  data/                   projects, stack and the GitHub cache
  i18n/                   copy in pt and en
  lib/                    smooth scroll, animations and utilities
scripts/                  icon, OG image and stats generation
```

The copy lives in `src/i18n/*.json` and the projects in
`src/data/projects.json`. To show a video or GIF for a project, drop the file
in `public/media/projects/<id>.mp4` (or `.webm`/`.gif`).

## Deploy

GitHub Pages, through the workflow in `.github/workflows/deploy.yml`, on every
push to `main`. A second workflow refreshes the GitHub cache daily.

## License

All rights reserved. The code is public for reference.
