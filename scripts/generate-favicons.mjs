import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Renders public/favicon.svg into every raster icon the site links to, so
// the SVG is the single source of truth for the brand mark.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');

const svg = await readFile(path.join(PUBLIC, 'favicon.svg'), 'utf-8');

function renderPng(size) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  return resvg.render().asPng();
}

// ICO container wrapping PNG-encoded images (supported by every modern browser).
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const directory = Buffer.alloc(16 * entries.length);
  let offset = 6 + directory.length;
  entries.forEach(({ size, png }, index) => {
    const base = index * 16;
    directory.writeUInt8(size >= 256 ? 0 : size, base);
    directory.writeUInt8(size >= 256 ? 0 : size, base + 1);
    directory.writeUInt8(0, base + 2); // palette
    directory.writeUInt8(0, base + 3); // reserved
    directory.writeUInt16LE(1, base + 4); // planes
    directory.writeUInt16LE(32, base + 6); // bpp
    directory.writeUInt32LE(png.length, base + 8);
    directory.writeUInt32LE(offset, base + 12);
    offset += png.length;
  });

  return Buffer.concat([header, directory, ...entries.map((e) => e.png)]);
}

const png48 = renderPng(48);
const png180 = renderPng(180);
const png32 = renderPng(32);
const png16 = renderPng(16);

await Promise.all([
  writeFile(path.join(PUBLIC, 'favicon-48.png'), png48),
  writeFile(path.join(PUBLIC, 'apple-touch-icon.png'), png180),
  writeFile(
    path.join(PUBLIC, 'favicon.ico'),
    buildIco([
      { size: 16, png: png16 },
      { size: 32, png: png32 },
      { size: 48, png: png48 }
    ])
  )
]);

console.log('[favicons] Generated favicon.ico, favicon-48.png and apple-touch-icon.png');
