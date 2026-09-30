import { DEFAULT_PLAYER_NAME } from '../core/constants.js';
import { getPlayerNameError } from '../core/player-name.js';
import { saveSettings, settings, translate } from '../core/preferences.js';
import { drawChallengerPanel } from '../rendering/renderer.js';
import { gameState } from '../state.js';
import { closeDialog, showDialog } from './dialogs.js';
import {
  setNameDialogDismissible,
  setNameDialogSubmit,
  setNameDialogTitle,
  setNameDialogValue,
} from './name-dialog.js';
import { acceptClick } from './pointer-gestures.js';
import { checkpointInterruptedGame } from '../game/session-recovery.js';

async function editDefaultChallengerName() {
  if (gameState.activeDialog || gameState.isExited || gameState.isGameOver) return;
  const sessionId = gameState.sessionId;
  const input = document.getElementById('name-input');
  const errorLabel = document.getElementById('name-err');
  const submitButton = document.getElementById('btn-name-ok');
  setNameDialogTitle('defaultNameTitle');
  setNameDialogSubmit('ok');
  setNameDialogValue(settings.defaultPlayerName);
  errorLabel.textContent = '';
  setNameDialogDismissible(true);
  submitButton.onclick = (event) => {
    if (!acceptClick(event) || gameState.activeDialog?.id !== 'dlg-name') return;
    const name = input.value.trim();
    const error = getPlayerNameError(name, { allowEmpty: true });
    if (error) {
      errorLabel.textContent = translate(error);
      return;
    }
    settings.defaultPlayerName = name;
    saveSettings();
    if (sessionId === gameState.sessionId && !gameState.registeredEntry) {
      gameState.playerName = name || DEFAULT_PLAYER_NAME;
      checkpointInterruptedGame();
      drawChallengerPanel();
    }
    closeDialog('dlg-name');
  };
  await showDialog('dlg-name');
  submitButton.onclick = null;
}

export { editDefaultChallengerName };
