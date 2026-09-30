import { readStoredValue, webStorageKey, writeStoredValue } from './storage.js';

function decodeSafely(raw, decode) {
  try {
    return raw === null ? null : decode(raw);
  } catch {
    return null;
  }
}

// Each destination is its own checkpoint. A failed write remains retryable next launch.
function loadMigratedValue(area, legacyKeys, decode, encode = JSON.stringify) {
  const destination = webStorageKey(area);
  const current = readStoredValue(destination);
  if (current !== null) return decodeSafely(current, decode);
  for (const source of legacyKeys) {
    const value = decodeSafely(readStoredValue(source), decode);
    if (value === null) continue;
    writeStoredValue(destination, encode(value));
    return value;
  }
  return null;
}

// Keep the first damaged value for recovery; never overwrite an unknown schema.
function saveVersionedDocument(key, document, version, decode) {
  const raw = readStoredValue(key);
  if (raw !== null) {
    try {
      const existing = JSON.parse(raw);
      if (existing?.version !== undefined && existing.version !== version) return false;
    } catch {
      // The raw value is backed up below before replacement.
    }
    if (decodeSafely(raw, decode) === null) {
      const backupKey = `${key}.recovery`;
      const backup = readStoredValue(backupKey);
      if (backup === null && !writeStoredValue(backupKey, raw)) return false;
    }
  }
  return writeStoredValue(key, JSON.stringify(document));
}

export { decodeSafely, loadMigratedValue, saveVersionedDocument };
