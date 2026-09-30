import { readStoredValue, writeStoredValue, removeStoredValue, webStorageKey } from './storage.js';
import { CURRENT_RULESET } from './ruleset.js';
import { decodeResumeSnapshot } from './resume-snapshot.js';

const RESUME_KEY = webStorageKey(
  'interrupted.' + CURRENT_RULESET.modeId + '.r' + CURRENT_RULESET.rulesVersion,
);
const writerId = Math.random().toString(36).slice(2);

function canReplaceResumeRecord(raw) {
  if (raw === null) return true;
  try {
    const saved = JSON.parse(raw);
    return (
      (saved?.version === undefined || saved.version === 1) &&
      (!saved?.ruleset ||
        (saved.ruleset.modeId === CURRENT_RULESET.modeId &&
          saved.ruleset.rulesVersion === CURRENT_RULESET.rulesVersion))
    );
  } catch {
    return true;
  }
}

function readInterruptedGame() {
  const raw = readStoredValue(RESUME_KEY);
  return { raw, snapshot: decodeResumeSnapshot(raw) };
}

function writeInterruptedGame(snapshot, expectedRaw) {
  const current = readStoredValue(RESUME_KEY);
  if (current !== expectedRaw || !canReplaceResumeRecord(current)) return null;
  const normalized = decodeResumeSnapshot(JSON.stringify(snapshot));
  if (!normalized) return null;
  const raw = JSON.stringify({ ...normalized, writer: writerId });
  return writeStoredValue(RESUME_KEY, raw) ? raw : null;
}

function clearInterruptedGame(expectedRaw) {
  const current = readStoredValue(RESUME_KEY);
  if (current !== expectedRaw || !canReplaceResumeRecord(current)) return false;
  return (
    removeStoredValue(RESUME_KEY) ||
    writeStoredValue(
      RESUME_KEY,
      JSON.stringify({ version: 1, ruleset: CURRENT_RULESET, ended: true }),
    )
  );
}

export { RESUME_KEY, readInterruptedGame, writeInterruptedGame, clearInterruptedGame };
