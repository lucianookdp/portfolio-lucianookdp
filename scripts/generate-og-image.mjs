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
// infinity mark — the OG card should look like it belongs to the same brand
// as the site and the icon, not a separate design.
const COLOR_BG = '#0e0d0b';
const COLOR_TEXT = '#f3f1ea';
const COLOR_SECONDARY = '#9c988b';
const COLOR_ACCENT_GLOW = '#3ddc8f';
const COLOR_ACCENT_DEEP = '#146b3f';
// Same mark as the header wordmark and the favicon (src/components/layout/Header.astro).
const INFINITY_PATH =
  'M 25 10 C 10 10 10 40 25 40 C 35 40 40 30 50 25 C 60 20 65 10 75 10 C 90 10 90 40 75 40 C 65 40 60 30 50 25 C 40 20 35 10 25 10 Z';

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
          // Same infinity mark as the header wordmark and the favicon,
          // oversized and bleeding off the top-right corner, so the OG card
          // reads as the same brand instead of an unrelated decoration.
          type: 'svg',
          props: {
            width: 360,
            height: 164,
            viewBox: '4 4 92 42',
            style: { position: 'absolute', top: '-52px', right: '-45px' },
            children: [
              {
                type: 'defs',
                props: {
                  children: {
                    type: 'linearGradient',
                    props: {
                      id: 'ogMark',
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
              {
                type: 'path',
                props: {
                  d: INFINITY_PATH,
                  fill: 'none',
                  stroke: 'url(#ogMark)',
                  strokeWidth: 11,
                  strokeLinecap: 'round'
                }
              }
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
          // Same "lucian[infinity]kdp" wordmark treatment as the header logo
          // (src/components/layout/Header.astro), so the domain line reads as
          // the actual logo instead of a plain text label next to a dot.
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              fontFamily: 'Inter',
              fontWeight: 700,
              fontSize: '28px',
              color: COLOR_TEXT
            },
            children: [
              { type: 'div', props: { children: 'lucian' } },
              {
                type: 'svg',
                props: {
                  width: 34,
                  height: 15.5,
                  viewBox: '4 4 92 42',
                  style: { margin: '0 1px' },
                  children: [
                    {
                      type: 'defs',
                      props: {
                        children: {
                          type: 'linearGradient',
                          props: {
                            id: 'ogWordmark',
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
                    {
                      type: 'path',
                      props: {
                        d: INFINITY_PATH,
                        fill: 'none',
                        stroke: 'url(#ogWordmark)',
                        strokeWidth: 11,
                        strokeLinecap: 'round'
                      }
                    }
                  ]
                }
              },
              { type: 'div', props: { children: 'kdp.dev' } }
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
