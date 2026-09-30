import { settings } from '../core/preferences.js';
import { fitWindow } from '../core/window-layout.js';
import { gameWindow, pixelStage, scaleShell } from './elements.js';
import { invalidatePointerGesture } from './pointer-gestures.js';
import { fitOpenMenus } from './menu-state.js';

function readViewport() {
  const visual = window.visualViewport;
  const insets = window.getComputedStyle?.(document.getElementById('safe-area'));
  const top = parseFloat(insets?.paddingTop) || 0;
  const right = parseFloat(insets?.paddingRight) || 0;
  const bottom = parseFloat(insets?.paddingBottom) || 0;
  const left = parseFloat(insets?.paddingLeft) || 0;
  return {
    width: Math.max(1, (visual?.width || window.innerWidth) - left - right),
    height: Math.max(1, (visual?.height || window.innerHeight) - top - bottom),
    left: (visual?.offsetLeft || 0) + left,
    top: (visual?.offsetTop || 0) + top,
    zoom: visual?.scale || 1,
  };
}

function resizeGameToViewport() {
  invalidatePointerGesture();
  const viewport = readViewport();
  // Let browser pinch zoom magnify the existing window without counter-scaling it.
  if (viewport.zoom > 1.05) return;
  const nativeWidth = gameWindow.offsetWidth;
  const nativeHeight = gameWindow.offsetHeight;
  const dpr = window.devicePixelRatio || 1;
  const layout = fitWindow({
    ...viewport,
    nativeWidth,
    nativeHeight,
    preference: settings.scale,
    dpr,
  });
  pixelStage.style.width = `${nativeWidth}px`;
  pixelStage.style.height = `${nativeHeight}px`;
  pixelStage.style.setProperty('--ui-scale', String(layout.scale));
  pixelStage.style.setProperty('--viewport-bottom', String(viewport.top + viewport.height));
  scaleShell.style.width = `${layout.width}px`;
  scaleShell.style.height = `${layout.height}px`;
  scaleShell.style.marginLeft = `${viewport.left + Math.max(0, Math.floor(((viewport.width - layout.width) * dpr) / 2) / dpr)}px`;
  scaleShell.style.marginTop = `${viewport.top + Math.max(0, Math.floor(((viewport.height - layout.height) * dpr) / 2) / dpr)}px`;
  fitOpenMenus();
}

function bindViewportEvents() {
  window.addEventListener('resize', resizeGameToViewport);
  window.visualViewport?.addEventListener('resize', resizeGameToViewport);
  window.visualViewport?.addEventListener('scroll', resizeGameToViewport);
}

export { readViewport, resizeGameToViewport, bindViewportEvents };
