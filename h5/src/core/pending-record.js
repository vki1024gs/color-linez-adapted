import { getPlayerNameError } from './player-name.js';
import { CURRENT_RULESET } from './ruleset.js';
import {
  listStoredKeys,
  readStoredValue,
  removeStoredValue,
  webStorageKey,
  writeStoredValue,
} from './storage.js';

const PENDING_RECORD_KEY = webStorageKey(
  `pending-record.${CURRENT_RULESET.modeId}.r${CURRENT_RULESET.rulesVersion}`,
);

function decodePendingRecord(raw) {
  if (!raw) return null;
  try {
    const record = JSON.parse(raw);
    if (
      record.version !== 1 ||
      record.ruleset?.modeId !== CURRENT_RULESET.modeId ||
      record.ruleset.rulesVersion !== CURRENT_RULESET.rulesVersion ||
      typeof record.id !== 'string' ||
      !/^[a-z0-9-]{12,64}$/.test(record.id) ||
      !Number.isSafeInteger(record.score) ||
      record.score <= 0 ||
      typeof record.name !== 'string' ||
      record.name !== record.name.trim() ||
      getPlayerNameError(record.name)
    )
      return null;
    return record;
  } catch {
    return null;
  }
}

function pendingRecordKeys() {
  return listStoredKeys(`${PENDING_RECORD_KEY}.`).concat(PENDING_RECORD_KEY);
}

function readPendingRecords() {
  return pendingRecordKeys()
    .map((key) => decodePendingRecord(readStoredValue(key)))
    .filter(Boolean);
}

function readPendingRecord() {
  return readPendingRecords()[0] || null;
}

function writePendingRecord(score, name) {
  const record = {
    version: 1,
    ruleset: CURRENT_RULESET,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    score,
    name,
  };
  const key = `${PENDING_RECORD_KEY}.${record.id}`;
  return writeStoredValue(key, JSON.stringify(record)) ? record : null;
}

function clearPendingRecord(id) {
  const key = `${PENDING_RECORD_KEY}.${id}`;
  const storedKey = decodePendingRecord(readStoredValue(key))?.id === id ? key : PENDING_RECORD_KEY;
  const current = decodePendingRecord(readStoredValue(storedKey));
  if (current?.id !== id) return false;
  return (
    removeStoredValue(storedKey) ||
    writeStoredValue(storedKey, JSON.stringify({ version: 1, completed: id }))
  );
}

export {
  PENDING_RECORD_KEY,
  readPendingRecord,
  readPendingRecords,
  writePendingRecord,
  clearPendingRecord,
};
