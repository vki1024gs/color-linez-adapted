import { BALL_COLOR_COUNT, BOARD_CELL_COUNT } from '../core/constants.js';
import { getBallColor } from '../core/balls.js';
import { translate } from '../core/preferences.js';
import { drawNextPreview } from '../rendering/renderer.js';
import { assets } from '../rendering/sprites.js';
import { gameState } from '../state.js';
import { gameWindow } from './elements.js';
import { closeMenus } from './menu-state.js';
import { acceptClick, invalidatePointerGesture } from './pointer-gestures.js';
import { checkpointInterruptedGame } from '../game/session-recovery.js';
import { getEpithetText, getRankTitleText } from '../game/ladder-state.js';
import { defaultEpithetForPosition, rankTitleForPosition } from '../core/ranks.js';
import { isDefaultHighScore } from '../core/high-scores.js';

function toggleNextPreview() {
  gameState.showPreview = !gameState.showPreview;
  checkpointInterruptedGame();
  document.getElementById('chk-next').style.visibility = gameState.showPreview
    ? 'visible'
    : 'hidden';
  drawNextPreview();
}

function toggleColorStatistics() {
  if (gameState.activeDialog?.id === 'dlg-colors') closeDialog('dlg-colors');
  else showDialog('dlg-colors', renderColorStatistics);
}

function closeDialog(id, result = false) {
  if (gameState.activeDialog?.id !== id) return;
  if (result === false && !gameState.activeDialog.dismissible) return;
  invalidatePointerGesture();
  const current = gameState.activeDialog;
  gameState.activeDialog = null;
  document.getElementById(id).classList.remove('show');
  gameWindow.inert = gameState.isExited;
  document.getElementById('chk-colors').style.visibility = 'hidden';
  current.resolve(result);
  if (current.parent && !gameState.isExited) {
    gameState.activeDialog = current.parent;
    document.getElementById(current.parent.id).classList.add('show');
    if (current.parent.builder) current.parent.builder();
    gameWindow.inert = true;
    document.getElementById('chk-colors').style.visibility =
      current.parent.id === 'dlg-colors' ? 'visible' : 'hidden';
    current.restoreFocus?.focus();
  } else if (!gameState.isExited) current.returnFocus?.focus();
}

function showDialog(
  id,
  builder,
  mandatory = false,
  { preserveCurrent = false, dismissible = true } = {},
) {
  if (gameState.isGameOver && gameState.isAnimating) return Promise.resolve(false);
  if (gameState.activeDialog?.id === id) return gameState.activeDialog.promise;
  if (gameState.activeDialog?.mandatory && !mandatory) return Promise.resolve(false);
  invalidatePointerGesture();
  const parent = preserveCurrent ? gameState.activeDialog : null;
  const restoreFocus = parent ? document.activeElement : null;
  if (parent) document.getElementById(parent.id).classList.remove('show');
  if (gameState.activeDialog && !preserveCurrent) closeDialog(gameState.activeDialog.id);
  const returnFocus = document.activeElement;
  closeMenus();
  if (builder) builder();
  const dlg = document.getElementById(id);
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  gameState.activeDialog = {
    id,
    resolve,
    promise,
    mandatory,
    dismissible,
    returnFocus,
    builder,
    parent,
    restoreFocus,
  };
  if (id === 'dlg-scores')
    document.getElementById('btn-reset-scores').disabled =
      gameState.isAnimating || gameState.isGameOver || mandatory;
  dlg.classList.add('show');
  gameWindow.inert = true;
  document.getElementById('chk-colors').style.visibility =
    id === 'dlg-colors' ? 'visible' : 'hidden';
  (
    dlg.querySelector('input') ||
    dlg.querySelector('[data-dialog-initial-focus]:not([disabled])') ||
    dlg.querySelector('.dlg-body button:not([disabled])') ||
    dlg.querySelector('button:not([disabled])')
  )?.focus();
  return promise;
}

function renderHighScoresTable() {
  const entries = gameState.highScores;
  document.getElementById('dlg-scores-title').textContent = translate('scores');
  document.getElementById('btn-reset-scores').disabled =
    gameState.isAnimating || gameState.isGameOver;
  const table = document.getElementById('hs-table');
  table.replaceChildren();
  const head = document.createElement('tr');
  for (const key of ['rankColumn', 'nameColumn', 'scoreColumn', 'dateColumn']) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = translate(key);
    head.appendChild(cell);
  }
  table.appendChild(head);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const row = document.createElement('tr');
    const rankTitle = e.rankTitle || rankTitleForPosition(i);
    const epithet = e.epithet || defaultEpithetForPosition(i);
    // Default opponents have no player name; keep the title in its own column.
    const displayName = isDefaultHighScore(e) ? '-' : `${getEpithetText(epithet)} ${e.name}`;
    for (const value of [
      getRankTitleText(rankTitle),
      displayName,
      String(e.score),
      e.date || '-',
    ]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    }
    table.appendChild(row);
  }
}

function renderColorStatistics() {
  const counts = new Int32Array(BALL_COLOR_COUNT + 1);
  for (const ballId of gameState.board) counts[getBallColor(ballId)]++;
  const body = document.getElementById('colors-body');
  let html = '<div style="display:flex; flex-direction:column; gap:2px; margin:2px 4px;">';
  for (let c = 1; c <= BALL_COLOR_COUNT; c++) {
    const percentage = Math.floor((counts[c] * 100) / BOARD_CELL_COUNT);
    html += `<div class="color-stat-row">
      <canvas class="mini-ball" data-c="${c}" width="18" height="18" style="image-rendering:pixelated;"></canvas>
      <span class="color-stat-count">${counts[c]}</span>
      <span>(${percentage}%)</span>
      <span class="cleared-count"></span></div>`;
  }
  html += '</div>';
  body.innerHTML = html;
  for (const mc of body.querySelectorAll('.mini-ball')) {
    const c = +mc.dataset.c;
    mc.parentElement.querySelector('.cleared-count').textContent = translate('clearedCount', {
      count: gameState.clearedByColor[c],
    });
    const mg = mc.getContext('2d');
    mg.imageSmoothingEnabled = false;
    if (assets.ballSheet) mg.drawImage(assets.ballSheet, c * 36, 0, 36, 36, 0, 0, 18, 18);
  }
}

function showAboutDialog() {
  showDialog('dlg-about');
}

function bindDialogInput() {
  document.addEventListener('click', (e) => {
    if (!acceptClick(e)) return;
    const button = e.target.closest('[data-close]');
    if (
      button?.dataset.result === 'true' &&
      ['dlg-register', 'dlg-reset'].includes(button.dataset.close) &&
      e.detail > 1
    )
      return;
    if (button)
      closeDialog(
        button.dataset.close,
        button.dataset.edit === 'true' ? 'edit' : button.dataset.result === 'true',
      );
  });
}

export {
  toggleNextPreview,
  toggleColorStatistics,
  closeDialog,
  showDialog,
  renderHighScoresTable,
  renderColorStatistics,
  showAboutDialog,
  bindDialogInput,
};
