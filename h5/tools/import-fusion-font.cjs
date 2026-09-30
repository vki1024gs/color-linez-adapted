// Import original BDF dots, without rasterization, resizing, or antialiasing.
// node tools/import-fusion-font.cjs <release-font-directory> <8|10> [output.json]
const fs = require('node:fs');
const path = require('node:path');
const locales = require('./locales.json');
const ascii = require('./pixel-glyphs.json');
const required = new Set(
  [...(JSON.stringify(locales) + '简体中文繁體中文')].filter(
    (ch) => ch.codePointAt(0) > 127 && !ascii[ch],
  ),
);
const [directory, sizeArg, outputArg] = process.argv.slice(2);
const size = Number(sizeArg);
if (!directory || ![8, 10].includes(size))
  throw Error('Provide a Fusion Pixel BDF directory and native size (8 or 10).');
const result = {
  font: 'Fusion Pixel',
  version: '2026.09.25',
  pixelSize: size,
  source: 'https://github.com/TakWolf/fusion-pixel-font/releases/tag/2026.09.25',
  glyphs: {},
};
for (const [locale, suffix] of [
  ['zh-Hans', 'zh_hans'],
  ['zh-Hant', 'zh_hant'],
]) {
  const file = path.join(directory, `fusion-pixel-${size}px-proportional-${suffix}.bdf`);
  const glyphs = {};
  for (const [, block] of fs
    .readFileSync(file, 'utf8')
    .matchAll(/STARTCHAR [^\n]+\n([\s\S]*?)ENDCHAR/g)) {
    const code = Number(block.match(/ENCODING (\d+)/)?.[1]);
    if (!Number.isInteger(code)) continue;
    const char = String.fromCodePoint(code);
    if (!required.has(char) && !/\p{Script=Han}/u.test(char)) continue;
    const [, w, h, left, bottom] = block.match(/BBX (-?\d+) (-?\d+) (-?\d+) (-?\d+)/).map(Number);
    const advance = Number(block.match(/DWIDTH (\d+)/)[1]);
    const rows = Array.from({ length: size }, () =>
      Array(Math.max(advance - 1, left + w)).fill('0'),
    );
    const hexRows = block
      .split(/BITMAP\r?\n/)[1]
      .trim()
      .split(/\r?\n/);
    const top = size - 1 - h - bottom;
    for (let y = 0; y < h; y++) {
      const bits = BigInt('0x' + hexRows[y])
        .toString(2)
        .padStart(hexRows[y].length * 4, '0')
        .slice(0, w);
      for (let x = 0; x < w; x++)
        if (bits[x] === '1') {
          if (!rows[top + y] || left + x < 0 || left + x >= rows[0].length)
            throw Error(`Glyph outside native cell: ${char} (${locale})`);
          rows[top + y][left + x] = '1';
        }
    }
    glyphs[char] = rows.map((row) => row.join(''));
  }
  for (const char of required) if (!glyphs[char]) throw Error(`Missing ${locale} glyph: ${char}`);
  result.glyphs[locale] = glyphs;
}
const output = outputArg || path.join(__dirname, 'fusion-pixel-glyphs.json');
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(`Imported native ${size}px interface and Chinese name glyphs into ${output}.`);
