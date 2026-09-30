import { readStoredValue, webStorageKey } from './storage.js';
import { HIGH_SCORE_COUNT } from './constants.js';
import { getPlayerNameError } from './player-name.js';
import { decodeSafely, saveVersionedDocument } from './migrations.js';
import { CURRENT_RULESET } from './ruleset.js';
import { normalizeRankedEntries } from './ranks.js';
import {
  DEFAULT_LADDER_VERSION,
  DEFAULT_OPPONENTS,
  isDefaultOpponent,
  normalizeLegacyDefaultOpponent,
} from './default-opponents.js';

function highScoresStorageKey(ruleset = CURRENT_RULESET) {
  return webStorageKey(`highscores.${ruleset.modeId}.r${ruleset.rulesVersion}`);
}

const HIGH_SCORES_KEY = highScoresStorageKey();

const DEFAULT_HIGH_SCORES = normalizeRankedEntries(DEFAULT_OPPONENTS);

function isDefaultHighScore(entry) {
  return isDefaultOpponent(entry);
}

function decodeStoredScores(stored) {
  if (typeof stored !== 'string' || !stored.trim().startsWith('{')) return null;
  const saved = JSON.parse(stored);
  if (
    saved?.version !== 2 ||
    (saved.defaultLadderVersion !== undefined &&
      saved.defaultLadderVersion !== DEFAULT_LADDER_VERSION) ||
    !Array.isArray(saved.entries) ||
    saved.entries.length !== HIGH_SCORE_COUNT ||
    !saved.entries.every(
      (entry) =>
        entry &&
        typeof entry.name === 'string' &&
        entry.name.trim().length > 0 &&
        !getPlayerNameError(entry.name) &&
        Number.isSafeInteger(entry.score) &&
        entry.score > 0,
    )
  )
    return null;
  return normalizeRankedEntries(
    saved.entries
      .map((entry) =>
        saved.defaultLadderVersion === undefined ? normalizeLegacyDefaultOpponent(entry) : entry,
      )
      .map((entry) => ({
        name: entry.name,
        score: entry.score,
        ...(typeof entry.date === 'string' && isRecordDate(entry.date) ? { date: entry.date } : {}),
        ...(typeof entry.epithet === 'string' ? { epithet: entry.epithet } : {}),
        ...(typeof entry.recordId === 'string' && /^[a-z0-9-]{12,64}$/.test(entry.recordId)
          ? { recordId: entry.recordId }
          : {}),
      })),
  );
}

/** @typedef {{name: string, score: number, date?: string}} HighScore */
function decodeCurrentScores(raw, ruleset) {
  const saved = JSON.parse(raw);
  if (
    saved?.ruleset?.modeId !== ruleset.modeId ||
    saved.ruleset.rulesVersion !== ruleset.rulesVersion
  )
    return null;
  return decodeStoredScores(raw);
}

function loadHighScores(ruleset = CURRENT_RULESET) {
  return (
    decodeSafely(readStoredValue(highScoresStorageKey(ruleset)), (raw) =>
      decodeCurrentScores(raw, ruleset),
    ) || DEFAULT_HIGH_SCORES.map((entry) => ({ ...entry }))
  );
}

function saveHighScores(entries, ruleset = CURRENT_RULESET) {
  const document = {
    version: 2,
    defaultLadderVersion: DEFAULT_LADDER_VERSION,
    ruleset,
    entries: normalizeRankedEntries(entries),
  };
  if (!decodeSafely(JSON.stringify(document), (raw) => decodeCurrentScores(raw, ruleset)))
    return false;
  const key = highScoresStorageKey(ruleset);
  const existing = decodeSafely(readStoredValue(key), JSON.parse);
  if (
    existing?.defaultLadderVersion !== undefined &&
    existing.defaultLadderVersion !== DEFAULT_LADDER_VERSION
  )
    return false;
  if (
    existing?.ruleset &&
    (existing.ruleset.modeId !== ruleset.modeId ||
      existing.ruleset.rulesVersion !== ruleset.rulesVersion)
  )
    return false;
  return saveVersionedDocument(key, document, 2, (raw) => decodeCurrentScores(raw, ruleset));
}

function isRecordDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function formatRecordDate() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
}

export {
  HIGH_SCORES_KEY,
  highScoresStorageKey,
  DEFAULT_HIGH_SCORES,
  isDefaultHighScore,
  loadHighScores,
  saveHighScores,
  formatRecordDate,
};
