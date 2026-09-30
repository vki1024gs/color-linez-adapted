import { pixelStage } from '../ui/elements.js';
import { settings } from '../core/preferences.js';
import { CJK_GLYPHS, CJK_TRADITIONAL_GLYPHS, PIXEL_GLYPHS } from '../generated/fonts.js';

function measurePixelText(text, locale = settings.language) {
  const letters = Array.from(String(text), (ch) => getPixelGlyph(ch, locale));
  return {
    letters,
    height: Math.max(7, ...letters.map((rows) => rows.length)),
    width: Math.max(0, letters.reduce((sum, rows) => sum + rows[0].length + 1, 0) - 1),
  };
}

function drawPixelText(ctx, text, x, y, color, align = 'left', locale = settings.language) {
  const { letters, height, width } = measurePixelText(text, locale);
  if (align === 'right') x -= width;
  if (align === 'center') x -= width / 2;
  x = Math.round(x * 2) / 2;
  y = Math.round(y * 2) / 2;
  ctx.fillStyle = color;
  for (const rows of letters) {
    const top = Math.floor((height - rows.length) / 2);
    rows.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++)
        if (row[dx] === '1') ctx.fillRect(x + dx, y + dy + top, 1, 1);
    });
    x += rows[0].length + 1;
  }
}

function getPixelGlyph(ch, locale = settings.language) {
  const cjk = locale === 'zh-Hant' ? CJK_TRADITIONAL_GLYPHS : CJK_GLYPHS;
  return PIXEL_GLYPHS[ch] || cjk[ch] || PIXEL_GLYPHS['?'];
}

function createPixelTextCanvas(text, locale = settings.language) {
  const canvas = document.createElement('canvas');
  canvas.className = 'pixel-text';
  canvas.setAttribute('aria-hidden', 'true');
  const metrics = measurePixelText(text, locale),
    width = Math.max(1, metrics.width + 1),
    height = Math.max(10, metrics.height + 2);
  canvas.width = width * 2;
  canvas.height = height * 2;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  drawPixelText(ctx, text, 0, Math.floor((height - metrics.height) / 2), '#000', 'left', locale);
  return canvas;
}

function rasterizeUiText(root) {
  if (
    root.nodeType === 1 &&
    root.closest('script, style, canvas, .pixel-word, .pixel-input, .sr-only')
  )
    return;
  for (const node of [...root.childNodes]) {
    if (node.nodeType === 3 && node.textContent.trim()) {
      const fragment = document.createDocumentFragment();
      const locale = node.parentNode.closest('[lang]')?.getAttribute('lang') || settings.language;
      // Individual CJK glyphs provide normal line-break opportunities without spaces.
      for (const word of node.textContent.match(
        /[\u2e80-\u9fff\uff00-\uffef]|[^\s\u2e80-\u9fff\uff00-\uffef]+|\s+/gu,
      ) || []) {
        if (!word) continue;
        if (!word.trim()) {
          fragment.appendChild(document.createTextNode(word));
          continue;
        }
        const span = document.createElement('span');
        span.className =
          'pixel-word' + (Array.from(word).some((ch) => CJK_GLYPHS[ch]) ? ' cjk-word' : '');
        const label = document.createElement('span');
        label.className = 'sr-only';
        label.textContent = word;
        span.appendChild(label);
        span.appendChild(createPixelTextCanvas(word, locale));
        fragment.appendChild(span);
      }
      node.replaceWith(fragment);
    } else if (node.nodeType === 1) rasterizeUiText(node);
  }
}

let observingText = false;

function observePixelText() {
  if (observingText) return;
  observingText = true;
  for (const input of document.querySelectorAll('input.field')) {
    const wrapper = document.createElement('span');
    wrapper.className = 'pixel-input';
    input.replaceWith(wrapper);
    wrapper.appendChild(input);
    const redrawInput = () => {
      wrapper.querySelector('canvas')?.remove();
      wrapper.appendChild(createPixelTextCanvas(input.value || ' '));
    };
    input.addEventListener('input', redrawInput);
    input.addEventListener('compositionend', redrawInput);
    input.addEventListener('focus', redrawInput);
    redrawInput();
  }
  rasterizeUiText(pixelStage);
  const observer = new MutationObserver((records) => {
    observer.disconnect();
    const roots = new Set(
      records.map((record) =>
        record.target.nodeType === 3 ? record.target.parentNode : record.target,
      ),
    );
    for (const root of roots) if (root?.isConnected) rasterizeUiText(root);
    observer.observe(pixelStage, { childList: true, subtree: true, characterData: true });
  });
  observer.observe(pixelStage, { childList: true, subtree: true, characterData: true });
}

export {
  measurePixelText,
  drawPixelText,
  getPixelGlyph,
  createPixelTextCanvas,
  rasterizeUiText,
  observePixelText,
};
