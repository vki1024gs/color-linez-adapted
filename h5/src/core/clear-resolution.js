import { findCompletedLines, isInsideBoard } from './board.js';
import { BALL_COLOR_COUNT, BOARD_SIZE, MINIMUM_LINE_LENGTH } from './constants.js';
import { CURRENT_RULESET } from './ruleset.js';
import { getBallColor } from './balls.js';

function cellIndex(row, column) {
  return row * BOARD_SIZE + column;
}

function coordinates(index) {
  return [Math.floor(index / BOARD_SIZE), index % BOARD_SIZE];
}

function orderFromTrigger(cells, triggerIndex) {
  const [triggerRow, triggerColumn] = coordinates(triggerIndex);
  return [...cells].sort((a, b) => {
    const [aRow, aColumn] = coordinates(a);
    const [bRow, bColumn] = coordinates(b);
    const aDistance = Math.max(Math.abs(aRow - triggerRow), Math.abs(aColumn - triggerColumn));
    const bDistance = Math.max(Math.abs(bRow - triggerRow), Math.abs(bColumn - triggerColumn));
    return aDistance - bDistance || a - b;
  });
}

function collectAxisCells(triggerIndex, direction) {
  const [row, column] = coordinates(triggerIndex);
  const indexes = [triggerIndex];
  for (const sign of [1, -1]) {
    let nextRow = row + direction.rowStep * sign;
    let nextColumn = column + direction.columnStep * sign;
    while (isInsideBoard(nextRow, nextColumn)) {
      indexes.push(cellIndex(nextRow, nextColumn));
      nextRow += direction.rowStep * sign;
      nextColumn += direction.columnStep * sign;
    }
  }
  return indexes;
}

function pointsForLine(ballCount) {
  if (ballCount < MINIMUM_LINE_LENGTH) return 0;
  return 2 * (ballCount - MINIMUM_LINE_LENGTH) ** 2 + 10;
}

/**
 * @typedef {Object} ClearResolution
 * @property {import('./ruleset.js').Ruleset} ruleset
 * @property {Uint8Array} boardAfter Independent settled board.
 * @property {number[]} matchedCells Unique original matches, zero-based indexes.
 * @property {{index: number, ballId: number, color: number}[]} removedBalls Actual occupied cells, ordered for playback.
 * @property {{index: number, ballId: number, color: number}[][]} animationGroups Each group plays simultaneously.
 * @property {number} scoreDelta Base line score plus one point per extra ball.
 * @property {Int32Array} clearedByColorDelta Counts indexed by color 1..7.
 * @property {number} soundTier Longest matched line, capped at 7.
 */
/** @returns {ClearResolution|null} A snapshot without mutating the input, or null if no line completes. */
function resolveClear(board, row, column, ruleset = CURRENT_RULESET) {
  if (
    ruleset.modeId !== CURRENT_RULESET.modeId ||
    ruleset.rulesVersion !== CURRENT_RULESET.rulesVersion
  )
    throw new Error('Unsupported game rules');
  const lines = findCompletedLines(board, row, column);
  if (!lines.length) return null;
  const triggerIndex = cellIndex(row, column);
  const triggerLength = Math.max(...lines.map((line) => line.cells.length));
  const effectType = triggerLength >= 7 ? 'color' : triggerLength === 6 ? 'sweep' : 'line';
  const effectIndexes =
    effectType === 'color'
      ? Array.from(board.keys()).filter((index) => getBallColor(board[index]) === lines[0].color)
      : effectType === 'sweep'
        ? lines
            .filter((line) => line.cells.length === 6)
            .flatMap((line) => collectAxisCells(triggerIndex, line.direction))
        : lines.flatMap((line) => line.cells);
  const matchedCells = [...new Set(lines.flatMap((line) => line.cells))];
  const orderedCells =
    effectType === 'color'
      ? effectIndexes.filter((index) => board[index] !== 0)
      : orderFromTrigger(
          [...new Set(effectIndexes.concat(matchedCells))].filter((index) => board[index] !== 0),
          triggerIndex,
        );
  const affectedCells = orderedCells;
  const removedBalls = orderedCells.map((index) => ({
    index,
    ballId: board[index],
    color: getBallColor(board[index]),
  }));
  const extraBallCount = removedBalls.length - matchedCells.length;
  const boardAfter = board.slice();
  const clearedByColorDelta = new Int32Array(BALL_COLOR_COUNT + 1);
  for (const { index, color } of removedBalls) {
    boardAfter[index] = 0;
    clearedByColorDelta[color]++;
  }
  return {
    ruleset,
    lines,
    triggerIndex,
    triggerLength,
    effectType,
    matchedCells,
    affectedCells,
    removedBalls,
    animationGroups: effectType === 'color' ? [removedBalls] : removedBalls.map((ball) => [ball]),
    boardAfter,
    clearedByColorDelta,
    scoreDelta: pointsForLine(matchedCells.length) + extraBallCount,
    soundTier: Math.min(7, triggerLength),
  };
}

export { pointsForLine, resolveClear };
