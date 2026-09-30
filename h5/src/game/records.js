import { formatRecordDate, loadHighScores, saveHighScores } from '../core/high-scores.js';
import { gameState } from '../state.js';
import { HIGH_SCORE_COUNT } from '../core/constants.js';
import { normalizeRankedEntries, randomEpithetForPosition } from '../core/ranks.js';

function qualifiesForHighScores() {
  return gameState.score > gameState.highScores[HIGH_SCORE_COUNT - 1].score;
}

function insertHighScore(name, score, recordId) {
  const latest = loadHighScores(gameState.ruleset);
  const alreadySaved = latest.find((entry) => entry.recordId === recordId && recordId);
  if (alreadySaved) {
    gameState.highScores = latest;
    return alreadySaved;
  }
  const entries = latest.map((entry) => ({ ...entry }));
  let position = 0;
  while (position < HIGH_SCORE_COUNT && latest[position].score >= score) position++;
  if (position === HIGH_SCORE_COUNT) return null;
  const entry = {
    name,
    score,
    date: formatRecordDate(),
    epithet: randomEpithetForPosition(position),
    ...(recordId ? { recordId } : {}),
  };
  entries.splice(position, 0, entry);
  entries.length = HIGH_SCORE_COUNT;
  const normalized = normalizeRankedEntries(entries);
  if (!saveHighScores(normalized, gameState.ruleset)) return null;
  gameState.highScores = normalized;
  return normalized[position];
}

function saveConfirmedRecord() {
  if (!gameState.registeredEntry) {
    gameState.registeredEntry = insertHighScore(
      gameState.playerName,
      gameState.score,
      gameState.pendingRecord?.id,
    );
    return !!gameState.registeredEntry;
  }
  return true;
}

export { qualifiesForHighScores, insertHighScore, saveConfirmedRecord };
