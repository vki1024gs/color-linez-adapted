/** Restore original rows once at startup; rendering continues to use the native dots. */
function unpackPixelGlyphs(encoded) {
  const bytes = atob(encoded);
  const glyphs = {};
  for (let offset = 0; offset < bytes.length;) {
    if (offset + 5 > bytes.length) throw Error('Truncated pixel glyph header');
    const codePoint =
      (bytes.charCodeAt(offset) << 16) |
      (bytes.charCodeAt(offset + 1) << 8) |
      bytes.charCodeAt(offset + 2);
    const width = bytes.charCodeAt(offset + 3);
    const height = bytes.charCodeAt(offset + 4);
    offset += 5;
    const byteCount = Math.ceil((width * height) / 8);
    if (!width || !height || offset + byteCount > bytes.length)
      throw Error('Invalid pixel glyph dimensions or payload');
    const rows = [];
    for (let y = 0; y < height; y++) {
      let row = '';
      for (let x = 0; x < width; x++) {
        const bit = y * width + x;
        row += (bytes.charCodeAt(offset + (bit >> 3)) >> (7 - (bit & 7))) & 1;
      }
      rows.push(row);
    }
    glyphs[String.fromCodePoint(codePoint)] = rows;
    offset += byteCount;
  }
  return glyphs;
}

export { unpackPixelGlyphs };
