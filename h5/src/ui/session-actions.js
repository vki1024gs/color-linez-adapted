import { DEFAULT_HIGH_SCORES, saveHighScores } from '../core/high-scores.js';
import { startNewGame } from '../game/controller.js';
import { gameState } from '../state.js';
import { closeDialog, renderHighScoresTable, showDialog } from './dialogs.js';
import { gameWindow, pixelStage } from './elements.js';
import { audio } from '../audio/audio-manager.js';
import { saveSettings, settings, translate } from '../core/preferences.js';
import { acceptClick } from './pointer-gestures.js';
import { checkpointInterruptedGame } from '../game/session-recovery.js';
import { clearGameNotice } from './game-notice.js';

async function resetHighScores() {
  if (
    gameState.isAnimating ||
    gameState.isGameOver ||
    gameState.activeDialog?.id !== 'dlg-scores' ||
    gameState.activeDialog.mandatory
  )
    return;
  const sessionId = gameState.sessionId;
  closeDialog('dlg-scores');
  if (!(await showDialog('dlg-reset', null, true))) {
    if (sessionId !== gameState.sessionId) return;
    showDialog('dlg-scores', renderHighScoresTable);
    return;
  }
  if (sessionId !== gameState.sessionId) return;
  const entries = DEFAULT_HIGH_SCORES.map((entry) => ({ ...entry }));
  if (!saveHighScores(entries, gameState.ruleset)) {
    await showDialog(
      'dlg-notice',
      () => {
        document.getElementById('notice-text').textContent = translate('resetRetry');
      },
      true,
    );
    if (sessionId !== gameState.sessionId) return;
    showDialog('dlg-scores', renderHighScoresTable);
    return;
  }
  gameState.highScores = entries;
  settings.defaultPlayerName = '';
  saveSettings();
  startNewGame();
  showDialog('dlg-scores', renderHighScoresTable);
}

function requestGameExit() {
  if (
    gameState.activeDialog ||
    gameState.isExited ||
    (gameState.isGameOver && gameState.isAnimating)
  )
    return;
  clearGameNotice();
  checkpointInterruptedGame({ force: true });
  gameState.isExited = true;
  audio.setPaused(true);
  gameWindow.inert = true;
  pixelStage.classList.add('exited');
  document.getElementById('btn-resume').focus();
}

function bindSessionActions() {
  document.getElementById('btn-close').addEventListener('click', (event) => {
    if (acceptClick(event)) void requestGameExit();
  });
  document.getElementById('btn-reset-scores').addEventListener('click', (event) => {
    if (acceptClick(event)) void resetHighScores();
  });
  document.getElementById('btn-resume').addEventListener('click', (event) => {
    if (!acceptClick(event) || !gameState.isExited || gameState.activeDialog) return;
    gameState.isExited = false;
    audio.setPaused(false);
    gameWindow.inert = false;
    pixelStage.classList.remove('exited');
    document.querySelector('.menu-trigger').focus();
  });
}

export { resetHighScores, requestGameExit, bindSessionActions };
