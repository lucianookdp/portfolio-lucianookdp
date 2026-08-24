import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = path.join(ROOT, 'public/og.png');

// Pulled from the real dictionary (not a hardcoded copy) so the OG image
// can't silently drift out of sync with the site's actual tagline again.
const pt = JSON.parse(await readFile(path.join(ROOT, 'src/i18n/pt.json'), 'utf-8'));
const TAGLINE = pt.hero.tagline;

const COLOR_BG = '#f7f5f0';
const COLOR_TEXT = '#141310';
const COLOR_SECONDARY = '#5c594f';
const COLOR_ACCENT = '#1e8e56';

async function loadFont(relativePath) {
  return readFile(path.join(ROOT, 'node_modules', relativePath));
}

async function main() {
  const [interRegular, interBold, frauncesBold] = await Promise.all([
    loadFont('@fontsource/inter/files/inter-latin-400-normal.woff'),
    loadFont('@fontsource/inter/files/inter-latin-700-normal.woff'),
    loadFont('@fontsource/fraunces/files/fraunces-latin-700-normal.woff')
  ]);

  const markup = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: COLOR_BG,
        backgroundImage: `radial-gradient(circle at 85% 15%, ${COLOR_ACCENT}33 0%, ${COLOR_BG} 55%)`,
        padding: '80px'
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '28px' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Fraunces',
                    fontWeight: 700,
                    fontSize: '92px',
                    color: COLOR_TEXT,
                    lineHeight: 1
                  },
                  children: 'Luciano K. Dal Pai'
                }
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontSize: '34px',
                    color: COLOR_SECONDARY,
                    maxWidth: '820px',
                    lineHeight: 1.4
                  },
                  children: TAGLINE
                }
              }
            ]
          }
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: '16px' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: '14px',
                    height: '14px',
                    borderRadius: '9999px',
                    backgroundColor: COLOR_ACCENT,
                    display: 'flex'
                  }
                }
              },
              {
                type: 'div',
                props: {
                  style: { fontFamily: 'Inter', fontWeight: 700, fontSize: '28px', color: COLOR_TEXT },
                  children: 'lucianookdp.github.io'
                }
              }
            ]
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
      { name: 'Fraunces', data: frauncesBold, weight: 700, style: 'normal' }
    ]
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const png = resvg.render().asPng();

  await writeFile(OUTPUT_PATH, png);
  console.log('[og-image] Generated public/og.png');
}

await main();
