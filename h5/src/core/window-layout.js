function fitWindow({ width, height, nativeWidth, nativeHeight, preference, dpr = 1 }) {
  const limit = preference === '1' ? 1 : 2;
  const availableWidth = Math.max(1, width - 16);
  const availableHeight = Math.max(1, height - 16);
  const ideal = Math.min(limit, availableWidth / nativeWidth, availableHeight / nativeHeight);
  const scale = Math.floor(ideal * dpr * 64) / (dpr * 64) || ideal;
  return { scale, width: nativeWidth * scale, height: nativeHeight * scale };
}

export { fitWindow };
