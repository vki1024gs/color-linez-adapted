import { translate } from '../core/preferences.js';
import { getOpponentNoticeLabel, getRankTitleText } from '../game/ladder-state.js';

const NOTICE_DURATION_MS = 20_000;

let activeNotice = null;
let clearTimer = null;

function renderGameNotice() {
  const pane = document.getElementById('pane-score');
  if (!pane) return;
  if (!activeNotice) {
    pane.textContent = '';
    return;
  }
  const { key, params } = activeNotice;
  pane.textContent =
    key === 'noticeDefeated'
      ? translate(key, {
          opponent: getOpponentNoticeLabel(params.defeatedOpponent),
          title: getRankTitleText(params.defeatedOpponent.rankTitle),
        })
      : translate(key, params);
}

function clearGameNotice() {
  if (clearTimer !== null) {
    window.clearTimeout(clearTimer);
    clearTimer = null;
  }
  activeNotice = null;
  renderGameNotice();
}

function showGameNotice(key, params = {}) {
  if (typeof key !== 'string' || !key) return;
  if (clearTimer !== null) window.clearTimeout(clearTimer);
  activeNotice = { key, params: { ...params } };
  renderGameNotice();
  clearTimer = window.setTimeout(clearGameNotice, NOTICE_DURATION_MS);
}

function refreshGameNotice() {
  renderGameNotice();
}

function getGameNotice() {
  return activeNotice;
}

export { NOTICE_DURATION_MS, showGameNotice, clearGameNotice, refreshGameNotice, getGameNotice };
