import { audio } from '../audio/audio-manager.js';
import { gameState } from '../state.js';
import { acceptClick, acceptRangeEvent } from './pointer-gestures.js';

function renderAudioSettings() {
  document
    .getElementById('btn-sound-toggle')
    .setAttribute('aria-pressed', String(!audio.settings.muted));
  const volume = Math.round(audio.settings.volume * 100);
  document.getElementById('sound-volume').value = String(volume);
  document.getElementById('sound-volume-value').textContent = `${volume}%`;
}

function bindAudioInput() {
  const unlock = (event) => {
    if (event.isTrusted && !event.repeat && !event.isComposing) void audio.unlock();
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('blur', () => audio.suspend());
  window.addEventListener('pagehide', () => audio.suspend());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.suspend();
  });
  document.getElementById('btn-sound-toggle').addEventListener('click', (event) => {
    if (!acceptClick(event)) return;
    if (gameState.activeDialog?.id !== 'dlg-audio') return;
    audio.setMuted(!audio.settings.muted);
    renderAudioSettings();
  });
  document.getElementById('sound-volume').addEventListener('input', (event) => {
    if (gameState.activeDialog?.id !== 'dlg-audio') return;
    if (!acceptRangeEvent(event)) {
      renderAudioSettings();
      return;
    }
    audio.setVolume(Number(event.target.value) / 100);
    renderAudioSettings();
  });
  document.getElementById('sound-volume').addEventListener('change', (event) => {
    if (
      !acceptRangeEvent(event) ||
      gameState.activeDialog?.id !== 'dlg-audio' ||
      audio.settings.muted ||
      audio.settings.volume === 0
    )
      return;
    audio.stopAll();
    void audio.playClear(5);
  });
  renderAudioSettings();
}

export { bindAudioInput, renderAudioSettings };
