import { resizeGameToViewport } from './viewport.js';

let fullscreenRequestPending = false;

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function updateFullscreenControl() {
  const button = document.querySelector('[data-cmd="fullscreen"]');
  const root = document.documentElement;
  const supported =
    (typeof root.requestFullscreen === 'function' && document.fullscreenEnabled !== false) ||
    (typeof root.webkitRequestFullscreen === 'function' &&
      document.webkitFullscreenEnabled !== false);
  button.setAttribute('aria-checked', String(!!getFullscreenElement()));
  button.disabled = fullscreenRequestPending || !supported;
}

async function toggleFullscreen() {
  if (fullscreenRequestPending) return;
  const root = document.documentElement;
  const fullscreenElement = getFullscreenElement();
  const target = fullscreenElement ? document : root;
  const action = fullscreenElement
    ? document.exitFullscreen || document.webkitExitFullscreen
    : root.requestFullscreen || root.webkitRequestFullscreen;
  if (typeof action !== 'function') return;
  fullscreenRequestPending = true;
  updateFullscreenControl();
  try {
    await action.call(target);
  } catch {
    // Browser denial leaves the control reflecting the actual fullscreen state.
  } finally {
    fullscreenRequestPending = false;
    updateFullscreenControl();
    resizeGameToViewport();
  }
}

function bindFullscreenEvents() {
  const syncFullscreen = () => {
    updateFullscreenControl();
    resizeGameToViewport();
  };
  document.addEventListener('fullscreenchange', syncFullscreen);
  document.addEventListener('webkitfullscreenchange', syncFullscreen);
  updateFullscreenControl();
}

export { updateFullscreenControl, toggleFullscreen, bindFullscreenEvents };
