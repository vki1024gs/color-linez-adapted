import { saveSettings, settings, translate } from '../core/preferences.js';
import { startNewGame } from '../game/controller.js';
import { LOCALES } from '../generated/fonts.js';
import { rasterizeUiText } from '../rendering/pixel-text.js';
import { drawChallengerPanel, drawHeader, drawOpponentPanel } from '../rendering/renderer.js';
import { gameState } from '../state.js';
import {
  renderHighScoresTable,
  showAboutDialog,
  showDialog,
  toggleColorStatistics,
  toggleNextPreview,
} from './dialogs.js';
import { menubar, pixelStage } from './elements.js';
import { closeMenus, fitOpenMenus } from './menu-state.js';
import { requestGameExit } from './session-actions.js';
import { resizeGameToViewport } from './viewport.js';
import { renderAudioSettings } from './audio.js';
import { acceptClick } from './pointer-gestures.js';
import { applyAutoResumePreference } from '../game/session-recovery.js';
import { refreshGameNotice } from './game-notice.js';
import { toggleFullscreen } from './fullscreen.js';

function updatePreferenceChecks() {
  menubar
    .querySelector('[data-cmd="auto-resume"]')
    .setAttribute('aria-checked', String(settings.autoResume));
  for (const button of menubar.querySelectorAll('[data-scale]'))
    button.setAttribute('aria-checked', String(button.dataset.scale === settings.scale));
  for (const button of menubar.querySelectorAll('[data-language]'))
    button.setAttribute('aria-checked', String(button.dataset.language === settings.language));
}

function applyInterfaceLanguage() {
  document.documentElement.lang = settings.language;
  for (const element of document.querySelectorAll('[data-i18n]'))
    element.textContent = translate(element.getAttribute('data-i18n'));
  for (const element of document.querySelectorAll('[data-i18n-title]'))
    element.title = translate(element.getAttribute('data-i18n-title'));
  for (const element of document.querySelectorAll('[data-i18n-aria-label]'))
    element.setAttribute('aria-label', translate(element.getAttribute('data-i18n-aria-label')));
  updatePreferenceChecks();
  // Repaint only translated areas, so a ball already in motion keeps its frame.
  drawHeader();
  drawOpponentPanel();
  drawChallengerPanel();
  rasterizeUiText(pixelStage);
  refreshGameNotice();
  resizeGameToViewport();
}

function changePreference(key, value) {
  if (key === 'autoResume' && typeof value !== 'boolean') return;
  if (key === 'scale' && !['auto', '1', '2'].includes(value)) return;
  if (key === 'language' && !Object.hasOwn(LOCALES, value)) return;
  if (!['scale', 'language', 'autoResume'].includes(key)) return;
  settings[key] = value;
  saveSettings();
  if (key === 'autoResume') {
    applyAutoResumePreference();
    updatePreferenceChecks();
  } else if (key === 'language') applyInterfaceLanguage();
  else {
    updatePreferenceChecks();
    resizeGameToViewport();
  }
  closeMenus();
  menubar.querySelector('[data-menu="options"] .menu-trigger').focus();
}

function bindMenuInput() {
  menubar.addEventListener('click', (e) => {
    if (!acceptClick(e)) return;
    if (gameState.activeDialog || gameState.isExited) return;
    if (e.target.closest('[data-cmd], [data-scale], [data-language]')) return;
    const item = e.target.closest('.menu-item');
    if (!item) return;
    const was = item.classList.contains('open');
    closeMenus();
    if (!was) {
      item.classList.add('open');
      item.querySelector('.menu-trigger').setAttribute('aria-expanded', 'true');
      fitOpenMenus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!acceptClick(e)) return;
    if (!e.target.closest('.menu-item')) closeMenus();
    const setting = e.target.closest('[data-scale], [data-language]');
    if (setting) {
      if (gameState.activeDialog || gameState.isExited) return;
      if (setting.dataset.scale) changePreference('scale', setting.dataset.scale);
      else changePreference('language', setting.dataset.language);
      return;
    }
    const cmd = e.target.closest('[data-cmd]');
    if (cmd) {
      if (gameState.activeDialog || gameState.isExited) return;
      closeMenus();
      switch (cmd.dataset.cmd) {
        case 'fullscreen':
          void toggleFullscreen();
          break;
        case 'auto-resume':
          changePreference('autoResume', !settings.autoResume);
          break;
        case 'new':
          if (!gameState.isAnimating) startNewGame();
          break;
        case 'scores':
          showDialog('dlg-scores', renderHighScoresTable);
          break;
        case 'exit':
          requestGameExit();
          break;
        case 'next':
          toggleNextPreview();
          break;
        case 'colors':
          toggleColorStatistics();
          break;
        case 'audio':
          showDialog('dlg-audio', renderAudioSettings);
          break;
        case 'rules':
          showDialog('dlg-rules');
          break;
        case 'about':
          showAboutDialog();
          break;
      }
    }
  });
}

export { updatePreferenceChecks, applyInterfaceLanguage, changePreference, bindMenuInput };
