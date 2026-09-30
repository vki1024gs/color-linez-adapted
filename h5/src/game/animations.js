import { getCurrentOpponent } from './ladder-state.js';
import { PILLAR_HEIGHT } from '../layout.js';
import {
  drawChallengerPanel,
  drawOpponentPanel,
  drawScorePanels,
  drawBoard,
  drawBoardCell,
  renderGame,
} from '../rendering/renderer.js';
import { gameState } from '../state.js';
import { audio } from '../audio/audio-manager.js';
import {
  BALL_FRAME_INTERVAL_MS,
  BALL_POST_CLEAR_DELAY_MS,
  BALL_SPAWN_FRAMES,
  BALL_REMOVAL_FRAMES,
  PILLAR_RISE_INTERVAL_MS,
  OPPONENT_DEFEAT_INTERVAL_MS,
  OPPONENT_RETIRE_INTERVAL_MS,
  OPPONENT_ENTRANCE_DELAY_MS,
  OPPONENT_ENTRANCE_INTERVAL_MS,
  CORONATION_FRAME_INTERVAL_MS,
  VICTORY_SWING_INTERVAL_MS,
  VICTORY_SWING_COUNT,
} from './animation-timing.js';
import { boardPresentation } from '../rendering/board-presentation.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function animateBallSpawn(index, sessionId = gameState.sessionId) {
  if (sessionId !== gameState.sessionId) return;
  const motion = {
    index,
    hiddenIndex: index,
    ballId: gameState.board[index],
    frame: BALL_SPAWN_FRAMES[0],
  };
  boardPresentation.motion = motion;
  try {
    for (const frame of BALL_SPAWN_FRAMES) {
      motion.frame = frame;
      drawBoardCell(index);
      await delay(BALL_FRAME_INTERVAL_MS);
      if (sessionId !== gameState.sessionId) return;
    }
  } finally {
    if (sessionId === gameState.sessionId && boardPresentation.motion === motion) {
      boardPresentation.motion = null;
      drawBoard();
    }
  }
}

async function animateLineRemoval(
  groups,
  sessionId = gameState.sessionId,
  { frameIntervalMs = BALL_FRAME_INTERVAL_MS, postDelayMs = BALL_POST_CLEAR_DELAY_MS } = {},
) {
  if (sessionId !== gameState.sessionId) return;
  if (!groups.length) return;
  const removal = { groups, groupIndex: 0, balls: groups[0], frame: BALL_REMOVAL_FRAMES[0] };
  boardPresentation.removal = removal;
  try {
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      removal.groupIndex = groupIndex;
      removal.balls = groups[groupIndex];
      for (const frame of BALL_REMOVAL_FRAMES) {
        removal.frame = frame;
        drawBoard();
        await delay(frameIntervalMs);
        if (sessionId !== gameState.sessionId) return;
      }
    }
  } finally {
    if (sessionId === gameState.sessionId && boardPresentation.removal === removal) {
      boardPresentation.removal = null;
      drawBoard();
    }
  }
  if (sessionId === gameState.sessionId) await delay(postDelayMs);
}

async function animateBallMovement(path, ballId, sessionId = gameState.sessionId) {
  if (sessionId !== gameState.sessionId) return;
  const motion = { index: path[0], hiddenIndex: path.at(-1), ballId, frame: 0 };
  boardPresentation.motion = motion;
  try {
    for (let i = 1; i < path.length; i++) {
      if (sessionId !== gameState.sessionId) return;
      void audio.playMoveStep(i - 1);
      gameState.hopFrame = (gameState.hopFrame + 1) % 6;
      motion.index = path[i];
      motion.frame = gameState.hopFrame;
      drawBoardCell(path[i - 1]);
      drawBoardCell(path[i]);
      await delay(BALL_FRAME_INTERVAL_MS);
    }
  } finally {
    if (sessionId === gameState.sessionId && boardPresentation.motion === motion) {
      boardPresentation.motion = null;
      drawBoard();
    }
  }
}

async function animateChallengerProgress(sessionId = gameState.sessionId) {
  if (gameState.isCrowned) return;
  const k = getCurrentOpponent().score || 1;
  let target =
    PILLAR_HEIGHT - Math.min(PILLAR_HEIGHT, Math.floor((gameState.score * PILLAR_HEIGHT) / k));
  if (gameState.score >= k) target = 0;
  while (gameState.challengerPillarOffset !== target) {
    if (sessionId !== gameState.sessionId) return;
    gameState.challengerPillarOffset +=
      Math.sign(target - gameState.challengerPillarOffset) *
      Math.min(4, Math.abs(target - gameState.challengerPillarOffset));
    drawChallengerPanel();
    await delay(PILLAR_RISE_INTERVAL_MS);
  }
}

async function animateOpponentDefeat(token, { retire = true } = {}) {
  // Original six frames show the crown falling and the defeated king collapsing.
  for (let frame = 1; frame <= 6 && token === gameState.sessionId; frame++) {
    gameState.opponentFrame = frame;
    drawOpponentPanel();
    await delay(OPPONENT_DEFEAT_INTERVAL_MS);
  }
  // Only intermediate opponents leave the pedestal. The beaten champion stays slumped.
  if (!retire) return;
  while (gameState.opponentPillarOffset < PILLAR_HEIGHT && token === gameState.sessionId) {
    gameState.opponentPillarOffset = Math.min(PILLAR_HEIGHT, gameState.opponentPillarOffset + 5);
    drawOpponentPanel();
    await delay(OPPONENT_RETIRE_INTERVAL_MS);
  }
  if (token === gameState.sessionId) {
    gameState.isOpponentVisible = false;
    drawOpponentPanel();
  }
}

async function animateOpponentEntrance(token) {
  gameState.opponentFrame = 0;
  gameState.opponentPillarOffset = PILLAR_HEIGHT;
  gameState.opponentDisplayedScore = 0;
  gameState.isOpponentVisible = true;
  drawOpponentPanel();
  drawScorePanels();
  await delay(OPPONENT_ENTRANCE_DELAY_MS);
  if (token !== gameState.sessionId) return;
  const target = getCurrentOpponent().score;
  // Ten-point increments for ordinary scores; bound very large-record entrances.
  const steps = Math.min(60, Math.ceil(target / 10));
  const increment = Math.ceil(target / steps / 10) * 10;
  for (let step = 1; step <= steps && token === gameState.sessionId; step++) {
    gameState.opponentPillarOffset = Math.round(PILLAR_HEIGHT * (1 - step / steps));
    gameState.opponentDisplayedScore = Math.min(target, step * increment);
    drawOpponentPanel();
    drawScorePanels();
    await delay(OPPONENT_ENTRANCE_INTERVAL_MS);
  }
}

async function animateCoronation(token) {
  if (token !== gameState.sessionId) return;
  void audio.playSfx('crown');
  for (let frame = 1; frame <= 6 && token === gameState.sessionId; frame++) {
    gameState.challengerFrame = frame;
    drawChallengerPanel();
    await delay(CORONATION_FRAME_INTERVAL_MS);
  }
  if (token !== gameState.sessionId) return;
  renderGame();
}

// Frames 5 and 6 are the crowned sword poses. Play three complete swings, then hold up.
function advanceVictoryAnimation(elapsedMs) {
  if (!gameState.isCrowned || gameState.isGameOver || gameState.isExited || gameState.activeDialog)
    return;
  if (gameState.victorySwingCount >= VICTORY_SWING_COUNT) return;
  gameState.victoryElapsedMs += elapsedMs;
  gameState.victorySwingCount = Math.min(
    VICTORY_SWING_COUNT,
    Math.floor(gameState.victoryElapsedMs / VICTORY_SWING_INTERVAL_MS),
  );
  const frame =
    gameState.victorySwingCount >= VICTORY_SWING_COUNT ||
    gameState.victoryElapsedMs % VICTORY_SWING_INTERVAL_MS < VICTORY_SWING_INTERVAL_MS / 2
      ? 6
      : 5;
  if (gameState.challengerFrame === frame) return;
  gameState.challengerFrame = frame;
  drawChallengerPanel();
}

export {
  delay,
  animateBallSpawn,
  animateLineRemoval,
  animateBallMovement,
  animateChallengerProgress,
  animateOpponentDefeat,
  animateOpponentEntrance,
  animateCoronation,
  advanceVictoryAnimation,
};
