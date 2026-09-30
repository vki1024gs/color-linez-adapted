import { playPresentation } from './presentation-task.js';
import { resolveClear } from '../core/clear-resolution.js';
import { gameState } from '../state.js';
import { audio } from '../audio/audio-manager.js';
import { animateLineRemoval, delay } from './animations.js';
import { showGameNotice } from '../ui/game-notice.js';

async function settleClearAt(row, column, sessionId, { pauseBeforeClearMs = 0 } = {}) {
  if (sessionId !== gameState.sessionId || gameState.isGameOver) return null;
  const resolution = resolveClear(gameState.board, row, column, gameState.ruleset);
  if (!resolution) return null;
  if (pauseBeforeClearMs > 0) {
    await delay(pauseBeforeClearMs);
    if (sessionId !== gameState.sessionId || gameState.isGameOver) return null;
  }

  gameState.board.set(resolution.boardAfter);
  gameState.score = Math.min(Number.MAX_SAFE_INTEGER, gameState.score + resolution.scoreDelta);
  for (let color = 1; color < resolution.clearedByColorDelta.length; color++)
    gameState.clearedByColor[color] += resolution.clearedByColorDelta[color];

  if (resolution.triggerLength === 6) showGameNotice('noticeClearSix');
  else if (resolution.triggerLength >= 7) showGameNotice('noticeClearSeven');

  void audio.playClear(resolution.soundTier);
  await playPresentation(animateLineRemoval, resolution.animationGroups, sessionId);
  return resolution;
}

export { settleClearAt };
