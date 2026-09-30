import { webStorageKey } from '../core/storage.js';
import { loadMigratedValue, saveVersionedDocument } from '../core/migrations.js';
import { SFX, playProceduralSfx } from './sfx.js';

const AUDIO_SETTINGS_KEY = webStorageKey('audio');
const DEFAULT_AUDIO_SETTINGS = Object.freeze({ volume: 0.8, muted: false });
const MAX_ACTIVE_SOUNDS = 12;

function normalizeAudioSettings(value) {
  return {
    volume:
      typeof value?.volume === 'number' && Number.isFinite(value.volume)
        ? Math.min(1, Math.max(0, value.volume))
        : DEFAULT_AUDIO_SETTINGS.volume,
    muted: typeof value?.muted === 'boolean' ? value.muted : false,
  };
}

function decodeAudioSettings(raw) {
  const value = JSON.parse(raw);
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    (value.version !== undefined && value.version !== 1)
  )
    return null;
  return normalizeAudioSettings(value);
}

function loadAudioSettings() {
  return (
    loadMigratedValue('audio', [webStorageKey('audio', 1)], decodeAudioSettings, (value) =>
      JSON.stringify({ version: 1, ...value }),
    ) || { ...DEFAULT_AUDIO_SETTINGS }
  );
}

class AudioManager {
  constructor() {
    this.context = null;
    this.sfxBus = null;
    this.settings = loadAudioSettings();
    this.history = new Map();
    this.voices = new Set();
    this.resumePromise = null;
    this.generation = 0;
    this.paused = false;
    this.backgrounded = false;
  }

  // Call only from a user gesture; game events never create or unlock a context.
  async unlock() {
    if (document.hidden) return false;
    this.backgrounded = false;
    try {
      if (!this.context || this.context.state === 'closed') {
        if (this.context) this.stopAll();
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) return false;
        this.context = new Context({ latencyHint: 'interactive' });
        this.sfxBus = this.context.createGain();
        this.sfxBus.connect(this.context.destination);
        this.applyVolume();
      }
      if (this.context.state !== 'running') {
        if (!this.resumePromise)
          this.resumePromise = this.context
            .resume()
            .then(
              () => true,
              () => false,
            )
            .finally(() => {
              this.resumePromise = null;
            });
        await this.resumePromise;
      }
      return this.context.state === 'running';
    } catch {
      return false;
    }
  }

  applyVolume() {
    if (!this.sfxBus) return;
    const now = this.context.currentTime;
    this.sfxBus.gain.cancelScheduledValues(now);
    this.sfxBus.gain.setTargetAtTime(this.settings.muted ? 0 : this.settings.volume, now, 0.005);
  }

  saveSettings() {
    return saveVersionedDocument(
      AUDIO_SETTINGS_KEY,
      { version: 1, ...this.settings },
      1,
      decodeAudioSettings,
    );
  }

  setVolume(value) {
    this.settings.volume = normalizeAudioSettings({ volume: value }).volume;
    if (this.settings.volume === 0) this.stopAll();
    this.applyVolume();
    this.saveSettings();
  }

  setMuted(value) {
    this.settings.muted = Boolean(value);
    if (this.settings.muted) this.stopAll();
    this.applyVolume();
    this.saveSettings();
  }

  stopAll() {
    this.generation++;
    for (const voice of this.voices) voice.playback.stop();
    this.voices.clear();
    this.history.clear();
  }

  setPaused(value) {
    this.paused = value;
    if (value) this.stopAll();
  }

  suspend() {
    this.backgrounded = true;
    this.stopAll();
    if (this.context?.state === 'running') this.context.suspend().catch(() => {});
  }

  async playSfx(id, frequency) {
    const definition = SFX[id];
    const generation = this.generation;
    if (
      !definition ||
      !this.context ||
      document.hidden ||
      this.backgrounded ||
      this.paused ||
      this.settings.muted ||
      this.settings.volume === 0
    )
      return false;
    if (this.resumePromise) await this.resumePromise;
    if (
      generation !== this.generation ||
      this.context.state !== 'running' ||
      document.hidden ||
      this.backgrounded ||
      this.paused ||
      this.settings.muted ||
      this.settings.volume === 0
    )
      return false;
    const now = this.context.currentTime * 1000;
    const last = this.history.get(id) ?? -Infinity;
    if (now - last < definition.cooldown || this.voices.size >= MAX_ACTIVE_SOUNDS) return false;
    if ([...this.voices].filter((voice) => voice.id === id).length >= definition.maxVoices)
      return false;
    const voice = { id, playback: null };
    try {
      voice.playback = playProceduralSfx(
        this.context,
        this.sfxBus,
        frequency === undefined ? definition : { ...definition, notes: [frequency] },
        () => this.voices.delete(voice),
      );
      this.voices.add(voice);
      this.history.set(id, now);
      return true;
    } catch {
      return false;
    }
  }

  playMoveStep(index) {
    return this.playSfx('move', SFX.move.pattern[index % SFX.move.pattern.length]);
  }

  playClear(count) {
    return this.playSfx(count >= 7 ? 'clear7plus' : count === 6 ? 'clear6' : 'clear');
  }
}

const audio = new AudioManager();

export { AUDIO_SETTINGS_KEY, DEFAULT_AUDIO_SETTINGS, AudioManager, audio, loadAudioSettings };
