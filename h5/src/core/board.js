import { BOARD_CELL_COUNT, BOARD_SIZE, MINIMUM_LINE_LENGTH } from './constants.js';
import { getBallColor } from './balls.js';

const LINE_DIRECTIONS = [
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];
// Preserve the original tie-break order when several shortest routes exist.
const MOVEMENT_DIRECTIONS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

function isInsideBoard(row, column) {
  return (
    Number.isInteger(row) &&
    Number.isInteger(column) &&
    row >= 0 &&
    row < BOARD_SIZE &&
    column >= 0 &&
    column < BOARD_SIZE
  );
}

function countEmptyCells(board) {
  return board.reduce((count, color) => count + Number(color === 0), 0);
}

/** Find a zero-based empty-cell ordinal in row-major order; -1 means absent. */
function findNthEmptyCell(board, ordinal) {
  for (let index = 0; index < board.length; index++) {
    if (board[index] !== 0) continue;
    if (ordinal === 0) return index;
    ordinal--;
  }
  return -1;
}

/** Keep each contiguous line separate so crossings cannot change its length or direction. */
function findCompletedLines(board, row, column) {
  if (!isInsideBoard(row, column)) return [];
  const origin = row * BOARD_SIZE + column;
  const color = getBallColor(board[origin]);
  if (color === 0) return [];
  const lines = [];
  for (const [rowStep, columnStep] of LINE_DIRECTIONS) {
    const line = [origin];
    for (const direction of [1, -1]) {
      let nextRow = row + rowStep * direction;
      let nextColumn = column + columnStep * direction;
      while (isInsideBoard(nextRow, nextColumn)) {
        const index = nextRow * BOARD_SIZE + nextColumn;
        if (getBallColor(board[index]) !== color) break;
        line.push(index);
        nextRow += rowStep * direction;
        nextColumn += columnStep * direction;
      }
    }
    if (line.length >= MINIMUM_LINE_LENGTH)
      lines.push({ color, direction: { rowStep, columnStep }, cells: line });
  }
  return lines;
}

/** Breadth-first search through empty cells. Includes source and destination. */
function findMovementPath(board, fromRow, fromColumn, toRow, toColumn) {
  if (!isInsideBoard(fromRow, fromColumn) || !isInsideBoard(toRow, toColumn)) return null;
  const source = fromRow * BOARD_SIZE + fromColumn;
  const destination = toRow * BOARD_SIZE + toColumn;
  const previous = new Int16Array(BOARD_CELL_COUNT).fill(-1);
  const visited = new Uint8Array(BOARD_CELL_COUNT);
  const queue = [source];
  visited[source] = 1;
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    if (current === destination) {
      const path = [];
      for (let index = current; index !== source; index = previous[index]) path.push(index);
      return [source, ...path.reverse()];
    }
    const row = Math.floor(current / BOARD_SIZE),
      column = current % BOARD_SIZE;
    for (const [rowStep, columnStep] of MOVEMENT_DIRECTIONS) {
      const nextRow = row + rowStep,
        nextColumn = column + columnStep;
      if (!isInsideBoard(nextRow, nextColumn)) continue;
      const index = nextRow * BOARD_SIZE + nextColumn;
      if (visited[index] || board[index] !== 0) continue;
      visited[index] = 1;
      previous[index] = current;
      queue.push(index);
    }
  }
  return null;
}

export {
  LINE_DIRECTIONS,
  MOVEMENT_DIRECTIONS,
  isInsideBoard,
  countEmptyCells,
  findNthEmptyCell,
  findCompletedLines,
  findMovementPath,
};
