import { webStorageKey } from './storage.js';
import { loadMigratedValue, saveVersionedDocument } from './migrations.js';
import { LOCALES } from '../generated/fonts.js';
import { getPlayerNameError } from './player-name.js';
import { WEB_RELEASE } from './release.js';

const SETTINGS_KEY = webStorageKey('settings');
const LEGACY_SETTINGS_KEYS = ['linez.settings.v2', 'linez.settings.v1'];

function detectPreferredLanguage() {
  const language = (window.navigator?.language || 'en').toLowerCase();
  if (/^zh-(hant|tw|hk|mo)(-|$)/.test(language)) return 'zh-Hant';
  return language.startsWith('zh') ? 'zh-Hans' : 'en';
}

function decodeSettings(raw) {
  const saved = JSON.parse(raw);
  if (
    !saved ||
    typeof saved !== 'object' ||
    Array.isArray(saved) ||
    (saved.version !== undefined && saved.version !== 1)
  )
    return null;
  return normalizeSettings(saved);
}

function normalizeSettings(saved) {
  const defaultPlayerName =
    typeof saved?.defaultPlayerName === 'string' ? saved.defaultPlayerName.trim() : '';
  const normalized = {
    autoResume: typeof saved?.autoResume === 'boolean' ? saved.autoResume : true,
    defaultPlayerName: getPlayerNameError(defaultPlayerName) ? '' : defaultPlayerName,
    scale:
      saved?.scale === '3' ? '2' : ['auto', '1', '2'].includes(saved?.scale) ? saved.scale : 'auto',
    language: Object.hasOwn(LOCALES, saved?.language) ? saved.language : detectPreferredLanguage(),
  };
  return normalized;
}

function loadSettings() {
  return (
    loadMigratedValue(
      'settings',
      [webStorageKey('settings', 1), ...LEGACY_SETTINGS_KEYS],
      decodeSettings,
      (value) => JSON.stringify({ version: 1, ...value }),
    ) || normalizeSettings(null)
  );
}

const settings = loadSettings();

function saveSettings() {
  return saveVersionedDocument(SETTINGS_KEY, { version: 1, ...settings }, 1, decodeSettings);
}

function translate(key, values = {}) {
  values = { webRelease: WEB_RELEASE, ...values };
  return (LOCALES[settings.language][key] || LOCALES.en[key] || key).replace(
    /\{(\w+)\}/g,
    (match, name) => values[name] ?? match,
  );
}

export {
  SETTINGS_KEY,
  LEGACY_SETTINGS_KEYS,
  detectPreferredLanguage,
  loadSettings,
  settings,
  saveSettings,
  translate,
};
