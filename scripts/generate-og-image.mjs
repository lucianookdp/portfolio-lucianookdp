import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Share card (Open Graph / Twitter): name and tagline on the left, the hero
// laptop on the right. One file per locale so previews match the page's
// language. Colours mirror the dark theme in src/styles/global.css.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUTS = [
  { locale: 'pt', file: 'public/og.png' },
  { locale: 'en', file: 'public/og-en.png' }
];

const COLOR_BG = '#08090c';
const COLOR_TEXT = '#e8eaf0';
const COLOR_SECONDARY = '#8b919f';
const COLOR_ACCENT = '#22b573';
const COLOR_ACCENT_GLOW = '#3ddc8f';
const COLOR_ACCENT_DEEP = '#136b45';
const INFINITY_PATH =
  'M 25 10 C 10 10 10 40 25 40 C 35 40 40 30 50 25 C 60 20 65 10 75 10 C 90 10 90 40 75 40 C 65 40 60 30 50 25 C 40 20 35 10 25 10 Z';

const loadFont = (relativePath) => readFile(path.join(ROOT, 'node_modules', relativePath));

const [interRegular, interBold, displayBold, laptopPng] = await Promise.all([
  loadFont('@fontsource/inter/files/inter-latin-400-normal.woff'),
  loadFont('@fontsource/inter/files/inter-latin-700-normal.woff'),
  loadFont('@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff'),
  readFile(path.join(ROOT, 'scripts/assets/og-laptop.png'))
]);
const laptopSrc = `data:image/png;base64,${laptopPng.toString('base64')}`;

function infinityMark(id, width, height) {
  return {
    type: 'svg',
    props: {
      width,
      height,
      viewBox: '4 4 92 42',
      children: [
        {
          type: 'defs',
          props: {
            children: {
              type: 'linearGradient',
              props: {
                id,
                x1: '0%',
                y1: '0%',
                x2: '100%',
                y2: '0%',
                children: [
                  { type: 'stop', props: { offset: '0%', stopColor: COLOR_ACCENT_GLOW } },
                  { type: 'stop', props: { offset: '100%', stopColor: COLOR_ACCENT_DEEP } }
                ]
              }
            }
          }
        },
        { type: 'path', props: { d: INFINITY_PATH, fill: 'none', stroke: `url(#${id})`, strokeWidth: 11, strokeLinecap: 'round' } }
      ]
    }
  };
}

async function render(dict, outputPath) {
  const markup = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        backgroundColor: COLOR_BG,
        backgroundImage:
          'radial-gradient(circle at 85% 40%, rgba(34,181,115,0.22), transparent 42%), radial-gradient(circle at 0% 100%, rgba(31,74,58,0.5), transparent 45%)',
        position: 'relative',
        fontFamily: 'Inter'
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '640px',
              padding: '72px 0 64px 72px'
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '20px',
                    color: COLOR_ACCENT,
                    letterSpacing: '3px'
                  },
                  children: [
                    { type: 'div', props: { style: { width: '10px', height: '10px', borderRadius: '10px', backgroundColor: COLOR_ACCENT_GLOW }, children: '' } },
                    { type: 'div', props: { children: dict.hero.role.toUpperCase() } }
                  ]
                }
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', gap: '22px' },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex', flexDirection: 'column', fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: '84px', lineHeight: 0.95, letterSpacing: '-4px' },
                        children: [
                          { type: 'div', props: { style: { color: COLOR_TEXT }, children: 'Luciano K.' } },
                          { type: 'div', props: { style: { color: COLOR_ACCENT_GLOW }, children: 'Dal Pai' } }
                        ]
                      }
                    },
                    { type: 'div', props: { style: { fontSize: '26px', color: COLOR_SECONDARY, lineHeight: 1.4, maxWidth: '540px' }, children: dict.hero.tagline } }
                  ]
                }
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '26px', color: COLOR_TEXT },
                  children: [
                    { type: 'div', props: { children: 'lucian' } },
                    infinityMark('wordmark', 32, 14.5),
                    { type: 'div', props: { children: 'kdp.dev' } }
                  ]
                }
              }
            ]
          }
        },
        {
          type: 'img',
          props: {
            src: laptopSrc,
            width: 640,
            height: 538,
            style: { position: 'absolute', right: '-40px', top: '60px' }
          }
        }
      ]
    }
  };

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
      { name: 'Bricolage Grotesque', data: displayBold, weight: 700, style: 'normal' }
    ]
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  await writeFile(outputPath, png);
  console.log(`[og-image] Generated ${path.relative(ROOT, outputPath)}`);
}

for (const { locale, file } of OUTPUTS) {
  const dict = JSON.parse(await readFile(path.join(ROOT, `src/i18n/${locale}.json`), 'utf-8'));
  await render(dict, path.join(ROOT, file));
}
