import { saveSettings, settings, translate } from '../core/preferences.js';
import { DEFAULT_PLAYER_NAME } from '../core/constants.js';
import { getPlayerNameError } from '../core/player-name.js';
import { qualifiesForHighScores, saveConfirmedRecord } from '../game/records.js';
import { drawChallengerPanel, drawOpponentPanel } from '../rendering/renderer.js';
import { gameState } from '../state.js';
import { closeDialog, showDialog } from './dialogs.js';
import {
  setNameDialogSubmit,
  setNameDialogTitle,
  setNameDialogValue,
  setNameDialogDismissible,
  setRegistrationDialogTitle,
} from './name-dialog.js';
import { acceptClick } from './pointer-gestures.js';
import { clearPendingRecord } from '../core/pending-record.js';
import { LOCALES } from '../generated/fonts.js';

function isSystemDefaultName(name) {
  const normalized = String(name || '')
    .trim()
    .toLocaleLowerCase();
  return [
    DEFAULT_PLAYER_NAME,
    'challenger',
    ...Object.values(LOCALES).map((locale) => locale.pretender),
  ].some((value) => normalized === value.toLocaleLowerCase());
}

function getInitialRecordName() {
  const name = gameState.playerName.trim();
  const systemDefault = isSystemDefaultName(name);
  return {
    value: systemDefault && !settings.defaultPlayerName ? '' : name,
    requiresEntry: systemDefault,
  };
}

async function requestRecordName(sessionId, initialName, { keepInitialOnCancel = false } = {}) {
  const nameInput = document.getElementById('name-input');
  const errorLabel = document.getElementById('name-err');
  const submitButton = document.getElementById('btn-name-ok');
  setNameDialogTitle('recordNameTitle');
  setNameDialogSubmit('continue');
  setNameDialogValue(initialName);
  errorLabel.textContent = '';
  const canReturnToConfirmation = keepInitialOnCancel;
  setNameDialogDismissible(canReturnToConfirmation);
  submitButton.onclick = (event) => {
    if (!acceptClick(event) || gameState.activeDialog?.id !== 'dlg-name') return;
    const value = nameInput.value.trim();
    const error = getPlayerNameError(value);
    if (error) {
      errorLabel.textContent = translate(error);
      return;
    }
    closeDialog('dlg-name', value);
  };
  const value = await showDialog('dlg-name', null, true, {
    preserveCurrent: true,
    dismissible: canReturnToConfirmation,
  });
  submitButton.onclick = null;
  if (sessionId !== gameState.sessionId) return null;
  if (value) return value;
  return keepInitialOnCancel && initialName ? initialName : null;
}

async function confirmRecordName(sessionId, name) {
  let recordSaveFailed = false;
  while (sessionId === gameState.sessionId) {
    setRegistrationDialogTitle('registerTitle');
    const confirmed = await showDialog(
      'dlg-register',
      () => {
        document.getElementById('register-summary').textContent = translate('registerSummary', {
          name,
          score: gameState.score,
        });
        const placeholder = isSystemDefaultName(name);
        document.getElementById('register-warning').textContent = translate(
          recordSaveFailed
            ? 'recordRetry'
            : placeholder
              ? 'defaultNameWarning'
              : gameState.isCrowned
                ? 'crownedNotice'
                : 'registerNotice',
        );
      },
      true,
      { dismissible: false },
    );
    if (sessionId !== gameState.sessionId) return 'cancel';
    if (confirmed === 'edit') return 'edit';
    if (!confirmed) return 'cancel';
    gameState.playerName = name;
    if (!saveConfirmedRecord()) {
      recordSaveFailed = true;
      continue;
    }
    if (gameState.pendingRecord) clearPendingRecord(gameState.pendingRecord.id);
    gameState.pendingRecord = null;
    settings.defaultPlayerName = name;
    saveSettings();
    drawOpponentPanel();
    drawChallengerPanel();
    return 'saved';
  }
  return 'cancel';
}

async function registerHighScore() {
  const sessionId = gameState.sessionId;
  if (!gameState.pendingRecord && !qualifiesForHighScores()) return true;
  const initial = getInitialRecordName();
  let name = initial.value;
  let requiresEntry = initial.requiresEntry;
  while (sessionId === gameState.sessionId) {
    if (requiresEntry) {
      name = await requestRecordName(sessionId, name);
      if (!name) return false;
      requiresEntry = false;
    }
    const result = await confirmRecordName(sessionId, name);
    if (result === 'saved') return true;
    if (result === 'cancel') return false;
    name = await requestRecordName(sessionId, name, { keepInitialOnCancel: true });
    if (!name) return false;
  }
  return false;
}

export { isSystemDefaultName, registerHighScore };
