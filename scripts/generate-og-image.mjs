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

// Dark theme tokens, matching src/styles/global.css .dark and the favicon's
// orb mark — the OG card should look like it belongs to the same brand as
// the site and the icon, not a separate light-only design.
const COLOR_BG = '#0e0d0b';
const COLOR_TEXT = '#f3f1ea';
const COLOR_SECONDARY = '#9c988b';
const COLOR_ACCENT_GLOW = '#3ddc8f';
const COLOR_ACCENT_DEEP = '#146b3f';
const ORB_PATH =
  'M64 22c23 0 41 15 41 37 0 21-15 36-34 41-5 1-9-3-8-8 3-11-5-18-16-21-15-5-22-18-15-32 6-11 18-17 32-17Z';

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
        padding: '80px',
        position: 'relative'
      },
      children: [
        {
          // Same orb mark as the favicon, oversized and bleeding off the
          // top-right corner, so the OG card reads as the same brand.
          type: 'svg',
          props: {
            width: 520,
            height: 520,
            viewBox: '0 0 128 128',
            style: { position: 'absolute', top: '-140px', right: '-140px' },
            children: [
              {
                type: 'defs',
                props: {
                  children: {
                    type: 'radialGradient',
                    props: {
                      id: 'orb',
                      cx: '32%',
                      cy: '28%',
                      r: '80%',
                      children: [
                        { type: 'stop', props: { offset: '0%', stopColor: COLOR_ACCENT_GLOW } },
                        { type: 'stop', props: { offset: '100%', stopColor: COLOR_ACCENT_DEEP } }
                      ]
                    }
                  }
                }
              },
              { type: 'path', props: { d: ORB_PATH, fill: 'url(#orb)' } }
            ]
          }
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative' },
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
            style: { display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: '14px',
                    height: '14px',
                    borderRadius: '9999px',
                    backgroundColor: COLOR_ACCENT_GLOW,
                    display: 'flex'
                  }
                }
              },
              {
                type: 'div',
                props: {
                  style: { fontFamily: 'Inter', fontWeight: 700, fontSize: '28px', color: COLOR_TEXT },
                  children: 'lucianookdp.dev'
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
