import {
  isBallQueue,
  createBallQueue,
  advanceBallQueue,
  replaceQueuedBall,
} from '../core/ball-queue.js';
import { randomInt } from '../core/random.js';
import { gameState } from '../state.js';
import { drawNextPreview } from '../rendering/renderer.js';
import { checkpointInterruptedGame } from './session-recovery.js';

function generationContext(reason) {
  return Object.freeze({
    reason,
    board: Object.freeze(Array.from(gameState.board)),
    score: gameState.score,
    ruleset: Object.freeze({ ...gameState.ruleset }),
  });
}

function initializeBallSupply() {
  gameState.nextBalls = createBallQueue(generationContext('initial'), randomInt);
}

function takeUpcomingBall(reason, index) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= gameState.board.length ||
    gameState.board[index] !== 0
  )
    throw new RangeError('Upcoming balls require an empty board cell');
  const context = generationContext(reason);
  const boardAfterPlacement = [...context.board];
  boardAfterPlacement[index] = gameState.nextBalls[0];
  const result = advanceBallQueue(
    gameState.nextBalls,
    { ...context, board: Object.freeze(boardAfterPlacement) },
    randomInt,
  );
  gameState.nextBalls = result.nextBalls;
  return result.ballId;
}

function replaceUpcomingBalls(nextBalls) {
  if (gameState.isAnimating || gameState.isGameOver || gameState.activeDialog || gameState.isExited)
    return false;
  if (!isBallQueue(nextBalls)) return false;
  gameState.nextBalls = [...nextBalls];
  checkpointInterruptedGame();
  drawNextPreview();
  return true;
}

function replaceUpcomingBall(index, ballId) {
  let nextBalls;
  try {
    nextBalls = replaceQueuedBall(gameState.nextBalls, index, ballId);
  } catch {
    return false;
  }
  return replaceUpcomingBalls(nextBalls);
}

export { initializeBallSupply, takeUpcomingBall, replaceUpcomingBall, replaceUpcomingBalls };
