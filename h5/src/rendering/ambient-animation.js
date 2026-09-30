import { advanceVictoryAnimation } from '../game/animations.js';
import { BALL_HOP_CONTACT_FRAME, BALL_HOP_FRAME_INTERVAL_MS } from '../game/animation-timing.js';
import { gameState } from '../state.js';
import { audio } from '../audio/audio-manager.js';
import { BOARD_SIZE } from '../core/constants.js';
import { drawBoardCell } from './renderer.js';

let intervalId = null;

function advanceAmbientAnimation() {
  if (document.hidden || gameState.isExited || gameState.activeDialog || gameState.isGameOver)
    return;
  advanceVictoryAnimation(BALL_HOP_FRAME_INTERVAL_MS);
  if (gameState.isAnimating || !gameState.selectedCell) return;
  gameState.hopFrame = (gameState.hopFrame + 1) % 6;
  drawBoardCell(gameState.selectedCell.r * BOARD_SIZE + gameState.selectedCell.c);
  if (gameState.hopFrame === BALL_HOP_CONTACT_FRAME) void audio.playSfx('select');
}

function startAmbientAnimation() {
  if (intervalId === null)
    intervalId = setInterval(advanceAmbientAnimation, BALL_HOP_FRAME_INTERVAL_MS);
}

function stopAmbientAnimation() {
  if (intervalId !== null) clearInterval(intervalId);
  intervalId = null;
}

export { startAmbientAnimation, stopAmbientAnimation };
