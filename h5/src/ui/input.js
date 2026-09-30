import { isInsideBoard } from '../core/board.js';
import { translate } from '../core/preferences.js';
import { selectBoardCell, startNewGame } from '../game/controller.js';
import {
  BOARD_X,
  BOARD_Y,
  CELL_SIZE,
  CHALLENGER_FACE_CENTER_X,
  KING_CENTER,
  KING_FACE_CENTER_X,
  PLAYER_CENTER,
  PORTRAIT_HEIGHT,
  PORTRAIT_TOP,
  PORTRAIT_WIDTH,
} from '../layout.js';
import { gameState } from '../state.js';
import {
  closeDialog,
  renderHighScoresTable,
  showDialog,
  toggleColorStatistics,
  toggleNextPreview,
} from './dialogs.js';
import { gameCanvas, menubar } from './elements.js';
import { closeMenus } from './menu-state.js';
import { requestGameExit } from './session-actions.js';
import { editDefaultChallengerName } from './challenger-name.js';
import { acceptClick, isTouchClick, touchStartPoint } from './pointer-gestures.js';

function getCanvasPoint(e) {
  const rect = gameCanvas.getBoundingClientRect();
  const scaleX = rect.width / gameCanvas.offsetWidth,
    scaleY = rect.height / gameCanvas.offsetHeight;
  return {
    x: (e.clientX - rect.left) / scaleX - gameCanvas.clientLeft,
    y: (e.clientY - rect.top) / scaleY - gameCanvas.clientTop,
  };
}

function isOverOpponent({ x, y }) {
  const left = KING_CENTER - KING_FACE_CENTER_X;
  return (
    gameState.isOpponentVisible &&
    x >= left &&
    x < left + PORTRAIT_WIDTH &&
    y >= PORTRAIT_TOP + gameState.opponentPillarOffset &&
    y < PORTRAIT_TOP + PORTRAIT_HEIGHT + gameState.opponentPillarOffset
  );
}

function isOverChallenger({ x, y }) {
  const left = PLAYER_CENTER - CHALLENGER_FACE_CENTER_X;
  const top = PORTRAIT_TOP + gameState.challengerPillarOffset;
  return x >= left && x < left + PORTRAIT_WIDTH && y >= top && y < top + PORTRAIT_HEIGHT;
}

function bindGameInput() {
  gameCanvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') return;
    if (event.button !== 0 || gameState.activeDialog || gameState.isExited) return;
    activateCanvasTarget(getCanvasTarget(event));
  });
  gameCanvas.addEventListener('click', (event) => {
    if (!isTouchClick(event) || !acceptClick(event)) return;
    const target = getCanvasTarget(event);
    const start = touchStartPoint();
    if (!start) return;
    const startTarget = getCanvasTarget(start);
    if (
      target?.type !== startTarget?.type ||
      target?.row !== startTarget?.row ||
      target?.column !== startTarget?.column
    )
      return;
    activateCanvasTarget(target);
  });
  gameCanvas.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') return;
    const point = getCanvasPoint(event);
    const title =
      !gameState.activeDialog &&
      !gameState.isExited &&
      (isOverOpponent(point)
        ? translate('scores')
        : isOverChallenger(point) && !gameState.isGameOver
          ? translate('defaultNameTitle')
          : '');
    gameCanvas.style.cursor = title ? 'pointer' : 'default';
    gameCanvas.title = title || '';
  });
  bindKeyboardInput();
}

function getCanvasTarget(event) {
  const point = getCanvasPoint(event);
  if (isOverOpponent(point)) return { type: 'opponent' };
  if (isOverChallenger(point)) return { type: 'challenger' };
  const column = Math.floor((point.x - BOARD_X) / CELL_SIZE);
  const row = Math.floor((point.y - BOARD_Y) / CELL_SIZE);
  return isInsideBoard(row, column) ? { type: 'cell', row, column } : null;
}

function activateCanvasTarget(target) {
  if (
    gameState.activeDialog ||
    gameState.isExited ||
    (gameState.isGameOver && gameState.isAnimating)
  )
    return;
  if (menubar.querySelector('.open')) {
    closeMenus();
    return;
  }
  if (!target) return;
  if (target.type === 'opponent') {
    showDialog('dlg-scores', renderHighScoresTable);
    return;
  }
  if (target.type === 'challenger') {
    void editDefaultChallengerName();
    return;
  }
  void selectBoardCell(target.row, target.column);
}

function bindKeyboardInput() {
  window.addEventListener('keydown', (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.metaKey || e.ctrlKey) return;
    if (gameState.activeDialog) {
      const dlg = document.getElementById(gameState.activeDialog.id);
      if (
        e.key === 'Enter' &&
        e.repeat &&
        ['dlg-register', 'dlg-reset'].includes(gameState.activeDialog.id)
      ) {
        e.preventDefault();
        return;
      }
      if (e.key === 'Escape' || (e.key === 'F5' && gameState.activeDialog.id === 'dlg-colors')) {
        e.preventDefault();
        closeDialog(gameState.activeDialog.id);
        return;
      }
      if (e.key === 'Tab') {
        const controls = [
          ...dlg.querySelectorAll('button:not([disabled]), input:not([disabled])'),
        ].filter((control) => !control.hidden && !control.closest('[hidden]'));
        const at = controls.indexOf(document.activeElement);
        e.preventDefault();
        controls[(at + (e.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus();
      } else if (
        e.key === 'Enter' &&
        document.activeElement === document.getElementById('name-input')
      ) {
        e.preventDefault();
        document.getElementById('btn-name-ok').click();
      } else if (/^F[1-5]$/.test(e.key) || (e.altKey && e.key.toLowerCase() === 'x')) {
        e.preventDefault();
      }
      return;
    }
    if (gameState.isExited || (gameState.isGameOver && gameState.isAnimating)) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenus();
      return;
    }
    switch (e.key) {
      case 'F1':
        e.preventDefault();
        showDialog('dlg-rules');
        break;
      case 'F3':
        e.preventDefault();
        toggleNextPreview();
        break;
      case 'F4':
        e.preventDefault();
        if (!gameState.isAnimating) startNewGame();
        break;
      case 'F5':
        e.preventDefault();
        toggleColorStatistics();
        break;
      case 'x':
      case 'X':
        if (e.altKey) {
          e.preventDefault();
          requestGameExit();
        }
        break;
    }
  });
}

export { getCanvasPoint, isOverOpponent, bindGameInput };
