// Original 5x7 glyphs, shared by the DOM font and the canvas pixel renderer.
const opentype = require('opentype.js');
const source = require('./pixel-glyphs.json');
const glyphs = Object.fromEntries(
  Object.entries(source).map(([char, rows]) => {
    const points = rows.flatMap((row) => [...row].flatMap((bit, x) => (bit === '1' ? [x] : [])));
    // Fixed-width digits; compact punctuation and letters for dialog readability.
    const left = /[0-9 ]/.test(char) ? 0 : Math.min(...points);
    const right = /[0-9 ]/.test(char) ? 4 : Math.max(...points);
    return [char, rows.map((row) => row.slice(left, right + 1))];
  }),
);
const notdef = new opentype.Glyph({
  name: '.notdef',
  advanceWidth: 600,
  path: new opentype.Path(),
});
const font = new opentype.Font({
  familyName: 'Linez Pixel',
  styleName: 'Regular',
  unitsPerEm: 1000,
  ascender: 800,
  descender: -200,
  glyphs: [
    notdef,
    ...Object.entries(glyphs).map(([char, rows]) => {
      const outline = new opentype.Path();
      rows.forEach((row, y) => {
        // Merge adjacent pixels into strips, so outline rasterizers have no seams.
        for (let x = 0; x < row.length; x++) {
          if (row[x] !== '1') continue;
          const start = x;
          while (row[x + 1] === '1') x++;
          const x0 = start * 100,
            x1 = (x + 1) * 100,
            y0 = (6 - y) * 100;
          outline.moveTo(x0, y0);
          outline.lineTo(x1, y0);
          outline.lineTo(x1, y0 + 100);
          outline.lineTo(x0, y0 + 100);
          outline.close();
        }
      });
      return new opentype.Glyph({
        name: 'uni' + char.codePointAt(0).toString(16),
        unicode: char.codePointAt(0),
        advanceWidth: (rows[0].length + 1) * 100,
        path: outline,
      });
    }),
  ],
});
module.exports = {
  glyphs,
  css: `@font-face { font-family: "Linez Pixel"; src: url(data:font/otf;base64,${Buffer.from(font.toArrayBuffer()).toString('base64')}) format("opentype"); font-weight: 400; font-style: normal; font-display: block; }`,
};
