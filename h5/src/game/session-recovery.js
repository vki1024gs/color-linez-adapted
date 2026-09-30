import { settings } from '../core/preferences.js';
import { getRandomState, seedRandom } from '../core/random.js';
import {
  readInterruptedGame,
  writeInterruptedGame,
  clearInterruptedGame,
} from '../core/session-storage.js';
import { gameState } from '../state.js';
import { boardPresentation } from '../rendering/board-presentation.js';
import { PILLAR_HEIGHT } from '../layout.js';
import { VICTORY_SWING_COUNT } from './animation-timing.js';

let recoverableSessionId = -1;
let lastStoredRaw = null;
let lifecycleBound = false;
let manualRecovery = false;

function discardRecoveryCheckpoint() {
  recoverableSessionId = -1;
  manualRecovery = false;
  if (clearInterruptedGame(lastStoredRaw)) lastStoredRaw = readInterruptedGame().raw;
}

function beginRecoverySession() {
  lastStoredRaw = readInterruptedGame().raw;
  discardRecoveryCheckpoint();
}

function checkpointInterruptedGame({ force = false } = {}) {
  if (force) manualRecovery = true;
  if (
    (!settings.autoResume && !manualRecovery) ||
    recoverableSessionId !== gameState.sessionId ||
    gameState.isAnimating ||
    gameState.isGameOver ||
    gameState.registeredEntry
  )
    return false;
  const raw = writeInterruptedGame(
    {
      version: 1,
      ruleset: gameState.ruleset,
      board: Array.from(gameState.board),
      nextBalls: [...gameState.nextBalls],
      score: gameState.score,
      playerName: gameState.playerName,
      manual: manualRecovery,
      showPreview: gameState.showPreview,
      clearedByColor: Array.from(gameState.clearedByColor),
      randomState: getRandomState(),
      opponents: gameState.opponents,
      challengerRankTitle: gameState.challengerRankTitle,
    },
    lastStoredRaw,
  );
  if (raw === null) return false;
  lastStoredRaw = raw;
  return true;
}

function completeRecoveryCheckpoint(sessionId) {
  if (sessionId !== gameState.sessionId || gameState.isAnimating || gameState.isGameOver) return;
  recoverableSessionId = sessionId;
  checkpointInterruptedGame();
}

function restoreInterruptedGame() {
  const { raw, snapshot } = readInterruptedGame();
  if (!settings.autoResume && !snapshot?.manual) return false;
  if (!snapshot || gameState.activeDialog || gameState.isAnimating || gameState.isExited)
    return false;
  lastStoredRaw = raw;
  gameState.sessionId++;
  gameState.board.set(snapshot.board);
  gameState.nextBalls = snapshot.nextBalls;
  gameState.score = snapshot.score;
  gameState.playerName = snapshot.playerName;
  gameState.showPreview = snapshot.showPreview;
  gameState.clearedByColor.set(snapshot.clearedByColor);
  gameState.opponents = snapshot.opponents;
  gameState.challengerRankTitle = snapshot.challengerRankTitle;
  const nextOpponent = snapshot.opponents.findIndex((entry) => snapshot.score <= entry.score);
  gameState.isCrowned = nextOpponent === -1;
  gameState.opponentIndex = nextOpponent === -1 ? snapshot.opponents.length - 1 : nextOpponent;
  const opponentScore = snapshot.opponents[gameState.opponentIndex].score;
  gameState.opponentDisplayedScore = opponentScore;
  gameState.opponentFrame = gameState.isCrowned ? 6 : 0;
  gameState.opponentPillarOffset = 0;
  gameState.isOpponentVisible = true;
  gameState.challengerFrame = gameState.isCrowned ? 6 : 0;
  gameState.challengerPillarOffset =
    PILLAR_HEIGHT -
    Math.min(PILLAR_HEIGHT, Math.floor((snapshot.score * PILLAR_HEIGHT) / opponentScore));
  gameState.victoryElapsedMs = 0;
  gameState.victorySwingCount = gameState.isCrowned ? VICTORY_SWING_COUNT : 0;
  gameState.isGameOver = false;
  gameState.isAnimating = false;
  gameState.selectedCell = null;
  gameState.hopFrame = 3;
  gameState.registeredEntry = null;
  gameState.ladderAnimation = null;
  boardPresentation.motion = null;
  boardPresentation.removal = null;
  seedRandom(snapshot.randomState);
  completeRecoveryCheckpoint(gameState.sessionId);
  return true;
}

function applyAutoResumePreference() {
  if (settings.autoResume) checkpointInterruptedGame();
  else {
    lastStoredRaw = readInterruptedGame().raw;
    if (clearInterruptedGame(lastStoredRaw)) lastStoredRaw = readInterruptedGame().raw;
  }
}

function bindRecoveryLifecycle() {
  if (lifecycleBound) return;
  lifecycleBound = true;
  window.addEventListener('pagehide', checkpointInterruptedGame);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) checkpointInterruptedGame();
  });
}

export {
  beginRecoverySession,
  discardRecoveryCheckpoint,
  checkpointInterruptedGame,
  completeRecoveryCheckpoint,
  restoreInterruptedGame,
  applyAutoResumePreference,
  bindRecoveryLifecycle,
};
