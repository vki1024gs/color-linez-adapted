const CANVAS_WIDTH = 612,
  CANVAS_HEIGHT = 381;

const BOARD_X = 144,
  BOARD_Y = 50,
  CELL_SIZE = 36;

const KING_CENTER = 72,
  PLAYER_CENTER = 540;

const KING_FACE_CENTER_X = (26.5 + 32.5) / 2,
  CHALLENGER_FACE_CENTER_X = (35.5 + 41.5) / 2;

// Measured between the eyes, not the image edges (weapons add asymmetric margins).
// The 45px caps painted into both portraits share their respective facial axes.
const PORTRAIT_WIDTH = 72,
  PORTRAIT_HEIGHT = 100,
  PORTRAIT_TOP = 73;
const PILLAR_HEIGHT = 125,
  PILLAR_WIDTH = 45;
const PILLAR_BASE_Y = PORTRAIT_TOP + PORTRAIT_HEIGHT + PILLAR_HEIGHT;
// Sprite-sheet coordinates stay separate from destination coordinates.
const PORTRAIT_SHEET = {
  opponent: { x: 1, y: 0, frameStride: 73 },
  challenger: { x: 1, y: 100 },
  crownPatch: { x: 23, y: 100, frameStride: 51, width: 50, height: 65, offsetY: 6 },
  pillar: { x: 420, y: 100 },
  base: { x: 1, y: 201, width: 58, height: 9, axisX: 29.5 },
};

const OPPONENT_SCORE_BOX = { x: KING_CENTER - 32, y: 14, w: 64, h: 16 };

const CHALLENGER_SCORE_BOX = { x: PLAYER_CENTER - 32, y: 14, w: 64, h: 16 };

const PREVIEW_X = 252,
  PREVIEW_Y = 5;

const HEADER_HEIGHT = 44;

export {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BOARD_X,
  BOARD_Y,
  CELL_SIZE,
  KING_CENTER,
  PLAYER_CENTER,
  KING_FACE_CENTER_X,
  CHALLENGER_FACE_CENTER_X,
  PORTRAIT_WIDTH,
  PORTRAIT_HEIGHT,
  PORTRAIT_TOP,
  PILLAR_HEIGHT,
  PILLAR_WIDTH,
  PILLAR_BASE_Y,
  PORTRAIT_SHEET,
  OPPONENT_SCORE_BOX,
  CHALLENGER_SCORE_BOX,
  PREVIEW_X,
  PREVIEW_Y,
  HEADER_HEIGHT,
};
