import { BOARD_SIZE, NEXT_BALL_COUNT } from '../core/constants.js';
import { translate } from '../core/preferences.js';
import { getChallengerLabelLines, getOpponentLabelLines } from '../game/ladder-state.js';
import {
  BOARD_X,
  BOARD_Y,
  CELL_SIZE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CHALLENGER_FACE_CENTER_X,
  CHALLENGER_SCORE_BOX,
  HEADER_HEIGHT,
  KING_CENTER,
  KING_FACE_CENTER_X,
  OPPONENT_SCORE_BOX,
  PILLAR_BASE_Y,
  PILLAR_HEIGHT,
  PILLAR_WIDTH,
  PLAYER_CENTER,
  PORTRAIT_HEIGHT,
  PORTRAIT_SHEET,
  PORTRAIT_TOP,
  PORTRAIT_WIDTH,
  PREVIEW_X,
  PREVIEW_Y,
} from '../layout.js';
import { drawPixelText, measurePixelText } from './pixel-text.js';
import { drawBall, portraitImage } from './sprites.js';
import { gameState } from '../state.js';
import { canvasContext } from '../ui/elements.js';
import { boardPresentation } from './board-presentation.js';

function clearCanvas() {
  canvasContext.fillStyle = '#000';
  canvasContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawHeaderBackground() {
  /* #f0f0f0 field with etched top/bottom lines, as in the original */
  canvasContext.fillStyle = '#f0f0f0';
  canvasContext.fillRect(0, 0, CANVAS_WIDTH, HEADER_HEIGHT);
  canvasContext.fillStyle = '#a0a0a0';
  canvasContext.fillRect(0, 0, CANVAS_WIDTH, 1);
  canvasContext.fillRect(0, HEADER_HEIGHT - 1, CANVAS_WIDTH, 1);
  canvasContext.fillStyle = '#fff';
  canvasContext.fillRect(0, 1, CANVAS_WIDTH, 1);
  canvasContext.fillRect(0, HEADER_HEIGHT - 2, CANVAS_WIDTH, 1);
}

function drawScoreBox(box, value) {
  canvasContext.fillStyle = '#000';
  canvasContext.fillRect(box.x, box.y, box.w, box.h);
  const fullText = String(value);
  const text = measurePixelText(fullText).width <= box.w - 4 ? fullText : value.toExponential(1);
  drawPixelText(canvasContext, text, box.x + box.w / 2, box.y + (box.h - 7) / 2, '#fff', 'center');
}

function drawHeaderLabel(text, x, alignLeft) {
  drawPixelText(
    canvasContext,
    text,
    x,
    22 - measurePixelText(text).height / 2,
    '#000',
    alignLeft ? 'left' : 'right',
  );
}

function drawNextPreview() {
  /* three tiles directly on the band, no frame (as in the original) */
  for (let i = 0; i < NEXT_BALL_COUNT; i++) {
    const c = gameState.showPreview ? gameState.nextBalls[i] : 0;
    drawBall(canvasContext, c, 6, PREVIEW_X + i * CELL_SIZE, PREVIEW_Y);
  }
}

function fitNameplateText(text, maxWidth) {
  if (measurePixelText(text).width <= maxWidth) return text;
  const characters = Array.from(text);
  const suffix = '...';
  while (characters.length && measurePixelText(characters.join('') + suffix).width > maxWidth)
    characters.pop();
  return characters.join('') + suffix;
}

function drawNameplate(lines, centerX, maxWidth) {
  const fitted = lines.map((line) => fitNameplateText(line, maxWidth));
  const heights = fitted.map((line) => measurePixelText(line).height);
  const gap = fitted.length > 1 ? 2 : 0;
  let y = 318 + (24 - heights.reduce((sum, height) => sum + height, 0) - gap) / 2;
  for (let index = 0; index < fitted.length; index++) {
    drawPixelText(canvasContext, fitted[index], centerX, y, '#fff', 'center');
    y += heights[index] + gap;
  }
}

function drawOpponentPanel() {
  canvasContext.fillStyle = '#000';
  canvasContext.fillRect(0, HEADER_HEIGHT, BOARD_X - 2, CANVAS_HEIGHT - HEADER_HEIGHT);
  if (!gameState.isOpponentVisible) return;
  /* king emblem */
  const py = PORTRAIT_TOP + gameState.opponentPillarOffset;
  const source = PORTRAIT_SHEET.opponent;
  canvasContext.drawImage(
    portraitImage,
    source.x + gameState.opponentFrame * source.frameStride,
    source.y,
    PORTRAIT_WIDTH,
    PORTRAIT_HEIGHT,
    KING_CENTER - KING_FACE_CENTER_X,
    py,
    PORTRAIT_WIDTH,
    PORTRAIT_HEIGHT,
  );
  drawPedestal(KING_CENTER, gameState.opponentPillarOffset);
  drawNameplate(getOpponentLabelLines(), KING_CENTER, 136);
}

function drawChallengerPanel() {
  canvasContext.fillStyle = '#000';
  canvasContext.fillRect(474, HEADER_HEIGHT, CANVAS_WIDTH - 474, CANVAS_HEIGHT - HEADER_HEIGHT);
  /* pedestal + challenger avatar; avatar climbs as score nears the king */
  const py = PORTRAIT_TOP + gameState.challengerPillarOffset;
  drawChallenger(PLAYER_CENTER - CHALLENGER_FACE_CENTER_X, py, gameState.challengerFrame);
  drawPedestal(PLAYER_CENTER, gameState.challengerPillarOffset);
  drawNameplate(getChallengerLabelLines(), PLAYER_CENTER, 128);
}

function drawChallenger(x, y, frame) {
  const source = PORTRAIT_SHEET.challenger,
    patch = PORTRAIT_SHEET.crownPatch;
  canvasContext.drawImage(
    portraitImage,
    source.x,
    source.y,
    PORTRAIT_WIDTH,
    PORTRAIT_HEIGHT,
    x,
    y,
    PORTRAIT_WIDTH,
    PORTRAIT_HEIGHT,
  );
  if (frame > 0)
    canvasContext.drawImage(
      portraitImage,
      patch.x + frame * patch.frameStride,
      patch.y,
      patch.width,
      patch.height,
      x,
      y + patch.offsetY,
      patch.width,
      patch.height,
    );
}

function drawPedestal(centerX, pillarOffset) {
  const height = PILLAR_HEIGHT - pillarOffset;
  const { pillar, base } = PORTRAIT_SHEET;
  if (height > 0)
    canvasContext.drawImage(
      portraitImage,
      pillar.x,
      pillar.y,
      PILLAR_WIDTH,
      height,
      centerX - PILLAR_WIDTH / 2,
      PILLAR_BASE_Y - height,
      PILLAR_WIDTH,
      height,
    );
  canvasContext.drawImage(
    portraitImage,
    base.x,
    base.y,
    base.width,
    base.height,
    centerX - base.axisX,
    PILLAR_BASE_Y,
    base.width,
    base.height,
  );
}

function drawBoard() {
  /* 2px etched block border around the tile field:
     white+black on top/left, black+dark-gray on bottom/right */
  const bx = BOARD_X - 2,
    by = BOARD_Y - 2;
  canvasContext.fillStyle = '#fff';
  canvasContext.fillRect(bx, by, 328, 1);
  canvasContext.fillRect(bx, by, 1, 328);
  canvasContext.fillStyle = '#000';
  canvasContext.fillRect(bx, by + 1, 328, 1);
  canvasContext.fillRect(bx + 1, by, 1, 328);
  canvasContext.fillRect(bx + 326, by, 1, 328);
  canvasContext.fillRect(bx, by + 326, 328, 1);
  canvasContext.fillStyle = '#555';
  canvasContext.fillRect(bx + 327, by, 1, 328);
  canvasContext.fillRect(bx, by + 327, 328, 1);
  for (let index = 0; index < gameState.board.length; index++) drawBoardCell(index);
  drawBallRemoval();
}

function drawBoardCell(index) {
  const row = Math.floor(index / BOARD_SIZE),
    column = index % BOARD_SIZE;
  const motion = boardPresentation.motion;
  let ballId = motion?.hiddenIndex === index ? 0 : gameState.board[index];
  let frame =
    !gameState.isAnimating &&
    gameState.selectedCell?.r === row &&
    gameState.selectedCell.c === column
      ? gameState.hopFrame % 6
      : 0;
  if (motion?.index === index) {
    ballId = motion.ballId;
    frame = motion.frame;
  }
  drawBall(
    canvasContext,
    ballId,
    ballId ? frame : 0,
    BOARD_X + column * CELL_SIZE,
    BOARD_Y + row * CELL_SIZE,
  );
}

function drawBallRemoval() {
  const removal = boardPresentation.removal;
  if (!removal) return;
  for (let groupIndex = removal.groupIndex; groupIndex < removal.groups.length; groupIndex++) {
    const frame = groupIndex === removal.groupIndex ? removal.frame : 0;
    for (const { index, ballId } of removal.groups[groupIndex])
      drawBall(
        canvasContext,
        ballId,
        frame,
        BOARD_X + (index % BOARD_SIZE) * CELL_SIZE,
        BOARD_Y + Math.floor(index / BOARD_SIZE) * CELL_SIZE,
      );
  }
}

function renderGame() {
  clearCanvas();
  drawHeader();
  drawBoard();
  drawOpponentPanel();
  drawChallengerPanel();
  const resetButton = document.getElementById('btn-reset-scores');
  if (resetButton)
    resetButton.disabled =
      gameState.isAnimating || gameState.isGameOver || !!gameState.activeDialog?.mandatory;
}

function drawHeader() {
  drawHeaderBackground();
  drawScorePanels();
  drawHeaderLabel(translate('next'), PREVIEW_X - 16, false);
  drawHeaderLabel(translate('previewColors'), 377, true);
  drawNextPreview();
}

function drawScorePanels() {
  drawScoreBox(OPPONENT_SCORE_BOX, gameState.opponentDisplayedScore);
  drawScoreBox(CHALLENGER_SCORE_BOX, gameState.score);
}

export {
  clearCanvas,
  drawHeaderBackground,
  drawScoreBox,
  drawHeaderLabel,
  drawNextPreview,
  drawOpponentPanel,
  drawChallengerPanel,
  drawChallenger,
  drawPedestal,
  drawBoard,
  drawBoardCell,
  drawBallRemoval,
  renderGame,
  drawHeader,
  drawScorePanels,
};
