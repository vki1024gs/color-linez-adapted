import {
  countEmptyCells,
  findMovementPath,
  findNthEmptyCell,
  isInsideBoard,
} from '../core/board.js';
import {
  BOARD_SIZE,
  DEFAULT_PLAYER_NAME,
  INITIAL_BALL_COUNT,
  NEXT_BALL_COUNT,
} from '../core/constants.js';
import { randomInt } from '../core/random.js';
import { settings } from '../core/preferences.js';
import {
  BALL_HOP_CONTACT_FRAME,
  BALL_PRE_CLEAR_DELAY_MS,
  GAME_OVER_REMOVAL_FRAME_MS,
  GAME_OVER_REMOVAL_HOLD_MS,
} from './animation-timing.js';
import {
  animateBallMovement,
  animateBallSpawn,
  animateLineRemoval,
  animateChallengerProgress,
  animateCoronation,
  animateOpponentDefeat,
  animateOpponentEntrance,
} from './animations.js';
import { getCurrentOpponent, resetOpponentLadder } from './ladder-state.js';
import {
  drawBoardCell,
  drawBoard,
  drawNextPreview,
  drawScorePanels,
  renderGame,
} from '../rendering/renderer.js';
import { gameState } from '../state.js';
import { audio } from '../audio/audio-manager.js';
import { showDialog } from '../ui/dialogs.js';
import { registerHighScore } from '../ui/record-registration.js';
import { qualifiesForHighScores } from './records.js';
import { settleClearAt } from './clear-settlement.js';
import { playPresentation } from './presentation-task.js';
import { boardPresentation } from '../rendering/board-presentation.js';
import { initializeBallSupply, takeUpcomingBall } from './ball-supply.js';
import { clearGameNotice, showGameNotice } from '../ui/game-notice.js';
import {
  readPendingRecords,
  writePendingRecord,
  clearPendingRecord,
} from '../core/pending-record.js';
import {
  beginRecoverySession,
  discardRecoveryCheckpoint,
  checkpointInterruptedGame,
  completeRecoveryCheckpoint,
} from './session-recovery.js';

async function spawnNextBall(sessionId = gameState.sessionId, reason = 'turn') {
  if (sessionId !== gameState.sessionId || gameState.isGameOver) return false;
  const free = countEmptyCells(gameState.board);
  if (free === 0) return false; // board full -> game over
  const idx = findNthEmptyCell(gameState.board, randomInt(free));
  gameState.board[idx] = takeUpcomingBall(reason, idx);
  await playPresentation(animateBallSpawn, idx, sessionId);
  if (sessionId !== gameState.sessionId) return false;
  /* if the spawned ball completes a line, remove it and retry */
  const resolution = await settleClearAt((idx / BOARD_SIZE) | 0, idx % BOARD_SIZE, sessionId, {
    pauseBeforeClearMs: BALL_PRE_CLEAR_DELAY_MS,
  });
  if (sessionId !== gameState.sessionId) return false;
  if (resolution) {
    drawScorePanels();
    drawNextPreview();
    return spawnNextBall(sessionId, 'replacement');
  }
  drawNextPreview();
  return true;
}

async function spawnBallsAfterMove(sessionId = gameState.sessionId) {
  if (sessionId !== gameState.sessionId || gameState.isGameOver) return;
  if (countEmptyCells(gameState.board) > 0) void audio.playSfx('spawn');
  for (let i = 0; i < NEXT_BALL_COUNT; i++) {
    const spawned = await spawnNextBall(sessionId);
    if (sessionId !== gameState.sessionId) return;
    if (!spawned) {
      await finishGame(sessionId);
      return;
    }
  }
  if (await finishGameIfBoardFull(sessionId)) return;
  await playPresentation(animateChallengerProgress, sessionId);
  if (sessionId !== gameState.sessionId) return;
  if (gameState.score > getCurrentOpponent().score) await advanceOpponentLadder();
}

async function finishGameIfBoardFull(sessionId) {
  if (sessionId !== gameState.sessionId) return true;
  if (countEmptyCells(gameState.board) > 0) return false;
  await finishGame(sessionId);
  return true;
}

function advanceOpponentLadder() {
  if (gameState.ladderAnimation) return gameState.ladderAnimation;
  if (gameState.isCrowned || gameState.score <= getCurrentOpponent().score)
    return Promise.resolve();
  const token = gameState.sessionId,
    wasBusy = gameState.isAnimating;
  gameState.isAnimating = true;
  gameState.selectedCell = null;
  gameState.ladderAnimation = (async () => {
    await playPresentation(animateChallengerProgress, token);
    while (
      token === gameState.sessionId &&
      !gameState.isCrowned &&
      gameState.score > getCurrentOpponent().score
    ) {
      const hasNextOpponent = gameState.opponentIndex + 1 < gameState.opponents.length;
      const defeatedOpponent = getCurrentOpponent();
      await playPresentation(animateOpponentDefeat, token, { retire: hasNextOpponent });
      if (token !== gameState.sessionId) return;
      showGameNotice('noticeDefeated', {
        defeatedOpponent,
      });
      gameState.challengerRankTitle = defeatedOpponent.rankTitle || 'squire';
      if (hasNextOpponent) {
        void audio.playSfx('rankup');
        gameState.opponentIndex++;
        await playPresentation(animateOpponentEntrance, token);
        if (token !== gameState.sessionId) return;
        await playPresentation(animateChallengerProgress, token);
      } else {
        gameState.challengerRankTitle = 'king';
        await playPresentation(animateCoronation, token);
        if (token !== gameState.sessionId) return;
        gameState.isCrowned = true;
        gameState.challengerFrame = 6;
        gameState.victoryElapsedMs = 0;
        gameState.victorySwingCount = 0;
      }
    }
  })().finally(() => {
    if (token === gameState.sessionId) {
      gameState.ladderAnimation = null;
      gameState.isAnimating = wasBusy;
      renderGame();
    }
  });
  return gameState.ladderAnimation;
}

async function finishGame(sessionId = gameState.sessionId) {
  if (sessionId !== gameState.sessionId || gameState.isGameOver) return;
  gameState.isGameOver = true;
  if (qualifiesForHighScores()) {
    gameState.pendingRecord = writePendingRecord(gameState.score, gameState.playerName);
    if (gameState.pendingRecord) discardRecoveryCheckpoint();
  } else discardRecoveryCheckpoint();
  const fullBoardBalls =
    countEmptyCells(gameState.board) === 0
      ? Array.from(gameState.board, (ballId, index) => ({ index, ballId }))
      : [];
  gameState.isAnimating = fullBoardBalls.length > 0;
  gameState.selectedCell = null;
  audio.stopAll();
  void audio.playSfx('gameover');
  if (fullBoardBalls.length) {
    gameState.board.fill(0);
    boardPresentation.motion = null;
    await playPresentation(animateLineRemoval, [fullBoardBalls], sessionId, {
      frameIntervalMs: GAME_OVER_REMOVAL_FRAME_MS,
      postDelayMs: GAME_OVER_REMOVAL_HOLD_MS,
    });
    if (sessionId !== gameState.sessionId) return;
    gameState.isAnimating = false;
  }
  renderGame();
  await showDialog('dlg-over', null, true);
  if (sessionId !== gameState.sessionId) return;
  const registered = await registerHighScore();
  if (registered && sessionId === gameState.sessionId) return startNewGame();
}

async function resumePendingRecord() {
  const records = readPendingRecords();
  if (!records.length) return false;
  let pending = null;
  for (const record of records) {
    if (gameState.highScores.some((entry) => entry.recordId === record.id))
      clearPendingRecord(record.id);
    else {
      pending = record;
      break;
    }
  }
  if (!pending) {
    await startNewGame();
    return true;
  }
  gameState.pendingRecord = pending;
  gameState.registeredEntry = null;
  gameState.score = pending.score;
  gameState.playerName = pending.name;
  gameState.isGameOver = true;
  renderGame();
  if (await registerHighScore()) {
    if (!(await resumePendingRecord())) await startNewGame();
  }
  return true;
}

async function startNewGame() {
  audio.stopAll();
  clearGameNotice();
  beginRecoverySession();
  gameState.sessionId++;
  const sessionId = gameState.sessionId;
  boardPresentation.removal = null;
  boardPresentation.motion = null;
  gameState.board.fill(0);
  gameState.clearedByColor.fill(0);
  gameState.score = 0;
  gameState.pendingRecord = null;
  gameState.selectedCell = null;
  gameState.hopFrame = 3;
  gameState.playerName = settings.defaultPlayerName || DEFAULT_PLAYER_NAME;
  gameState.isGameOver = false;
  resetOpponentLadder();
  initializeBallSupply();
  renderGame();
  gameState.isAnimating = true;
  void audio.playSfx('spawn');
  for (let i = 0; i < INITIAL_BALL_COUNT; i++) {
    const spawned = await spawnNextBall(sessionId, 'initial');
    if (sessionId !== gameState.sessionId) return;
    if (!spawned) {
      await finishGame(sessionId);
      return;
    }
  }
  gameState.isAnimating = false;
  renderGame();
  completeRecoveryCheckpoint(sessionId);
}

/** Select a ball or play one complete move; DOM events only translate coordinates. */
async function selectBoardCell(r, c) {
  if (gameState.isAnimating || gameState.isGameOver || gameState.activeDialog || gameState.isExited)
    return;
  if (!isInsideBoard(r, c)) return;
  const v = gameState.board[r * BOARD_SIZE + c];
  if (gameState.selectedCell && gameState.selectedCell.r === r && gameState.selectedCell.c === c) {
    // same ball: deselect
    gameState.selectedCell = null;
    drawBoard();
    return;
  }
  if (v !== 0) {
    // select a ball
    gameState.selectedCell = { r, c };
    gameState.hopFrame = BALL_HOP_CONTACT_FRAME;
    drawBoard();
    void audio.playSfx('select');
    return;
  }
  if (!gameState.selectedCell) return;

  const path = findMovementPath(
    gameState.board,
    gameState.selectedCell.r,
    gameState.selectedCell.c,
    r,
    c,
  );
  if (!path) {
    void audio.playSfx('error');
    return;
  } // no route: beep

  const mySession = gameState.sessionId; // invalidated by startNewGame()
  const ballId = gameState.board[gameState.selectedCell.r * BOARD_SIZE + gameState.selectedCell.c];
  const from = gameState.selectedCell.r * BOARD_SIZE + gameState.selectedCell.c;
  checkpointInterruptedGame();
  gameState.isAnimating = true;
  gameState.selectedCell = null;
  gameState.board[from] = 0;
  gameState.board[r * BOARD_SIZE + c] = ballId;
  await playPresentation(animateBallMovement, path, ballId, mySession);
  if (mySession !== gameState.sessionId) return;
  // Settle the moved ball BEFORE waiting for the three new balls to spawn.
  drawBoardCell(r * BOARD_SIZE + c);
  void audio.playSfx('land');
  const resolution = await settleClearAt(r, c, mySession);
  if (mySession !== gameState.sessionId) return;
  if (resolution) {
    drawScorePanels();
    await playPresentation(animateChallengerProgress, mySession);
    if (mySession !== gameState.sessionId) return;
    if (gameState.score > getCurrentOpponent().score) await advanceOpponentLadder();
  } else {
    await spawnBallsAfterMove(mySession);
  }
  if (mySession === gameState.sessionId && !gameState.isGameOver) {
    gameState.isAnimating = false;
    renderGame();
    completeRecoveryCheckpoint(mySession);
  }
}

export {
  spawnNextBall,
  spawnBallsAfterMove,
  advanceOpponentLadder,
  finishGame,
  resumePendingRecord,
  startNewGame,
  selectBoardCell,
};
