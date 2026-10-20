import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

// Renders the Icon Composer document to the touch icon in public/. Also draws its layers flat for the favicons and for
// the geometry module the app's BrandMark draws. Only Apple's renderer draws the squircle, its rim light and the glass on
// each slice, so this runs only on a Mac with Xcode installed.
const SOURCE = fileURLToPath(new URL('Energiekuchen.icon/', import.meta.url));
const PUBLIC = fileURLToPath(new URL('../../public/', import.meta.url));
const GEOMETRY = fileURLToPath(new URL('../../app/components/ui/brandMarkGeometry.ts', import.meta.url));
const ICTOOL = '/Applications/Xcode.app/Contents/Applications/Icon Composer.app/Contents/Executables/ictool';

// Every layer SVG draws on the document's 1024-point canvas.
const CANVAS = 1024;
// The icon is drawn at 2048 and resampled down: the rim light is a hairline that a render at the final size would alias.
const MASTER_SIZE = 2048;
const RENDER_SCALE = MASTER_SIZE / CANVAS;
const FAVICON_SIZES = [16, 32, 48];
const TOUCH_ICON_SIZE = 180;

// The renderer masks every export to the squircle. Enlarging a render by a quarter and cropping it back to size pushes
// the squircle's edge and rim light out of frame, leaving the background as the renderer lit it, full bleed.
const ENLARGEMENT = 1.25;

// The renderer writes Display P3, and both of the fill's gradient stops lie outside sRGB. Sharp converts every output to
// sRGB unless told otherwise, which would clip them. So each step derived from the render keeps the render's profile.
// The intermediates are decoded again right away, so they skip compression.
async function enlargedCenter(master: Buffer): Promise<Buffer> {
  const enlarged = Math.round(MASTER_SIZE * ENLARGEMENT);
  const inset = (enlarged - MASTER_SIZE) / 2;
  return sharp(master)
    .resize(enlarged)
    .extract({ left: inset, top: inset, width: MASTER_SIZE, height: MASTER_SIZE })
    .keepIccProfile()
    .png({ compressionLevel: 0 })
    .toBuffer();
}

function render(): Buffer {
  const scratch = mkdtempSync(join(tmpdir(), 'energiekuchen-icon-'));
  try {
    const output = join(scratch, 'master.png');
    execFileSync(ICTOOL, [
      SOURCE,
      '--export-image',
      '--output-file',
      output,
      '--platform',
      'iOS',
      '--rendition',
      'Default',
      '--width',
      String(CANVAS),
      '--height',
      String(CANVAS),
      '--scale',
      String(RENDER_SCALE),
      '--design-generation',
      '27',
    ]);
    return readFileSync(output);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

interface Slice {
  layer: string;
  transform: string;
  d: string;
  fill: string;
}

/**
 * An icon.json color as sRGB hex. A Display P3 color is clipped channel by channel, as Tailwind clips its oklch tokens
 * to their hex fallbacks.
 */
function srgbHex(color: string): string {
  const [space, channels] = color.split(':') as [string, string];
  const [r, g, b] = channels.split(',').map(Number) as [number, number, number];
  const decode = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const encode = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  let rgb = [r, g, b];
  if (space === 'display-p3') {
    const [lr, lg, lb] = rgb.map(decode) as [number, number, number];
    const linear = [1.2249401 * lr - 0.2249404 * lg, -0.0420569 * lr + 1.0420571 * lg, -0.0196376 * lr - 0.0786361 * lg + 1.0982735 * lb];
    rgb = linear.map(c => encode(Math.min(1, Math.max(0, c))));
  } else if (space !== 'srgb') {
    throw new Error(`Unsupported color space in ${color}`);
  }
  return `#${rgb
    .map(c =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
}

/**
 * The slices stacked back to front (icon.json lists layers front to back), each in its icon.json fill clipped to sRGB,
 * so a recolor in Icon Composer reaches every output. A white glass layer would vanish flat on a light page, so it keeps
 * the color its layer SVG draws instead.
 */
function slices(): Slice[] {
  type Layer = { 'image-name': string; fill: { solid: string } };
  const icon = JSON.parse(readFileSync(join(SOURCE, 'icon.json'), 'utf8')) as { groups: { layers: Layer[] }[] };
  return icon.groups
    .flatMap(({ layers }) => layers)
    .reverse()
    .map(({ 'image-name': file, fill }) => {
      const svg = readFileSync(join(SOURCE, 'Assets', file), 'utf8');
      const attribute = (name: string) => new RegExp(`<path[^>]*\\s${name}="([^"]*)"`).exec(svg)![1]!;
      const glass = srgbHex(fill.solid);
      return { layer: file.replace(/\.svg$/, ''), transform: attribute('transform'), d: attribute('d'), fill: glass === '#ffffff' ? attribute('fill') : glass };
    });
}

// The slices flat, without the glass. The viewBox is the smallest square around the mark, centered on it.
async function flatMark(mark: Slice[]): Promise<{ viewBox: string; svg: string }> {
  const paths = mark.map(({ transform, d, fill }) => `<path transform="${transform}" d="${d}" fill="${fill}" />`);
  const canvas = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}">${paths.join('')}</svg>`;
  const { info } = await sharp(Buffer.from(canvas), { density: 72 * RENDER_SCALE })
    .trim()
    .toBuffer({ resolveWithObject: true });
  // Sharp reports the trim offsets as the negated position of the crop.
  const side = Math.max(info.width, info.height) / RENDER_SCALE;
  const centerX = (-info.trimOffsetLeft! + info.width / 2) / RENDER_SCALE;
  const centerY = (-info.trimOffsetTop! + info.height / 2) / RENDER_SCALE;
  const viewBox = [centerX - side / 2, centerY - side / 2, side, side].map(value => +value.toFixed(2)).join(' ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n  ${paths.join('\n  ')}\n</svg>\n`;
  return { viewBox, svg };
}

/** An ICO whose entries are PNGs, which every browser that still asks for `favicon.ico` reads. */
function ico(entries: { size: number; png: Buffer }[]): Buffer {
  const directory = Buffer.alloc(6 + 16 * entries.length);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(entries.length, 4);
  let offset = directory.length;
  entries.forEach(({ size, png }, index) => {
    const entry = 6 + 16 * index;
    directory.writeUInt8(size, entry);
    directory.writeUInt8(size, entry + 1);
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(png.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([directory, ...entries.map(({ png }) => png)]);
}

function geometryModule(viewBox: string, mark: Slice[]): string {
  // Laid out as oxfmt prints it, so a re-render leaves the file unchanged.
  const entries = mark.map(({ layer, transform, d, fill }) =>
    [`  {`, `    layer: '${layer}',`, `    transform: '${transform}',`, `    d: '${d}',`, `    fill: '${fill}',`, `  },`].join('\n')
  );
  return [
    '// Generated by `pnpm icon` from tools/brand/Energiekuchen.icon. Edit the document, not this file.',
    `export const BRAND_MARK_VIEWBOX = '${viewBox}';`,
    '',
    'export const BRAND_MARK_SLICES = [',
    ...entries,
    '] as const;',
    '',
  ].join('\n');
}

const master = render();
// iOS masks a touch icon itself and paints a transparent corner black. So the master is laid over its own enlarged
// center, whose corners carry the background as the renderer lit it.
const backed = await sharp(await enlargedCenter(master))
  .composite([{ input: master }])
  .removeAlpha()
  .keepIccProfile()
  .png({ compressionLevel: 0 })
  .toBuffer();
await sharp(backed).resize(TOUCH_ICON_SIZE).keepIccProfile().png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(join(PUBLIC, 'apple-touch-icon.png'));

// A browser tab shows the flat mark, not the app icon: the squircle and its glass blur away at 16px.
const mark = slices();
const { viewBox, svg } = await flatMark(mark);
writeFileSync(join(PUBLIC, 'favicon.svg'), svg);
// Sharp draws an SVG at its resize target, so each size renders straight from the vector rather than from a raster.
const favicons = await Promise.all(FAVICON_SIZES.map(async size => ({ size, png: await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer() })));
writeFileSync(join(PUBLIC, 'favicon.ico'), ico(favicons));

writeFileSync(GEOMETRY, geometryModule(viewBox, mark));

console.log(`Rendered apple-touch-icon.png, favicon.svg, and favicon.ico into ${PUBLIC}, and wrote ${GEOMETRY}`);
