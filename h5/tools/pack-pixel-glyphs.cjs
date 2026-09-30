function packPixelGlyphs(glyphs) {
  const records = [];
  for (const [character, rows] of Object.entries(glyphs)) {
    const width = rows[0]?.length;
    const height = rows.length;
    if (
      Array.from(character).length !== 1 ||
      !width ||
      width > 255 ||
      !height ||
      height > 255 ||
      rows.some((row) => row.length !== width || !/^[01]+$/.test(row))
    ) {
      throw Error(`Invalid pixel glyph: ${character}`);
    }
    // Each record: Unicode code point (3 bytes), width, height, then row-major bits.
    const record = Buffer.alloc(5 + Math.ceil((width * height) / 8));
    record.writeUIntBE(character.codePointAt(0), 0, 3);
    record[3] = width;
    record[4] = height;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bit = y * width + x;
        if (rows[y][x] === '1') record[5 + (bit >> 3)] |= 1 << (7 - (bit & 7));
      }
    }
    records.push(record);
  }
  return Buffer.concat(records).toString('base64');
}

function splitSharedGlyphs(simplified, traditional) {
  const shared = {};
  const simplifiedOnly = {};
  const traditionalOnly = {};
  for (const [character, rows] of Object.entries(simplified)) {
    if (JSON.stringify(rows) === JSON.stringify(traditional[character])) shared[character] = rows;
    else simplifiedOnly[character] = rows;
  }
  for (const [character, rows] of Object.entries(traditional)) {
    if (!Object.hasOwn(shared, character)) traditionalOnly[character] = rows;
  }
  return { shared, simplifiedOnly, traditionalOnly };
}

module.exports = { packPixelGlyphs, splitSharedGlyphs };
