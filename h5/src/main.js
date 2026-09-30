import { seedRandom } from './core/random.js';
import { resumePendingRecord, startNewGame } from './game/controller.js';
import { readPendingRecord } from './core/pending-record.js';
import { resetOpponentLadder } from './game/ladder-state.js';
import { observePixelText } from './rendering/pixel-text.js';
import { assets, assetsReady, buildCrispBallSheet } from './rendering/sprites.js';
import { bindDialogInput } from './ui/dialogs.js';
import { bindGameInput } from './ui/input.js';
import { applyInterfaceLanguage, bindMenuInput } from './ui/menus.js';
import { bindSessionActions } from './ui/session-actions.js';
import { resizeGameToViewport, bindViewportEvents } from './ui/viewport.js';
import { bindAudioInput } from './ui/audio.js';
import { startAmbientAnimation, stopAmbientAnimation } from './rendering/ambient-animation.js';
import { bindPointerGestures } from './ui/pointer-gestures.js';
import { bindRecoveryLifecycle, restoreInterruptedGame } from './game/session-recovery.js';
import { renderGame } from './rendering/renderer.js';
import { gameState } from './state.js';
import { bindFullscreenEvents } from './ui/fullscreen.js';

let interfaceInitialized = false;

function initializeInterface() {
  if (interfaceInitialized) return;
  interfaceInitialized = true;
  resetOpponentLadder();
  bindPointerGestures();
  bindAudioInput();
  bindGameInput();
  bindMenuInput();
  bindDialogInput();
  bindSessionActions();
  bindRecoveryLifecycle();
  startAmbientAnimation();
  bindViewportEvents();
  bindFullscreenEvents();
  window.addEventListener('pagehide', stopAmbientAnimation);
  window.addEventListener('pageshow', startAmbientAnimation);
  resizeGameToViewport();
}
function startOrResumeGame() {
  if (readPendingRecord()) return resumePendingRecord();
  if (!restoreInterruptedGame()) return startNewGame();
  document.getElementById('chk-next').style.visibility = gameState.showPreview
    ? 'visible'
    : 'hidden';
  renderGame();
}

function startApplication() {
  initializeInterface();
  assetsReady.then(() => {
    assets.ballSheet = buildCrispBallSheet();
    applyInterfaceLanguage();
    observePixelText();
    seedRandom(Date.now() & 0xffffffff);
    startOrResumeGame();
  });
  document.fonts.ready.then(resizeGameToViewport);
}

export { initializeInterface, startApplication, startOrResumeGame };
