import {
  BALL_COLOR_COUNT,
  BOARD_CELL_COUNT,
  DEFAULT_PLAYER_NAME,
  NEXT_BALL_COUNT,
} from './core/constants.js';
import { CURRENT_RULESET } from './core/ruleset.js';
import { loadHighScores } from './core/high-scores.js';
import { settings } from './core/preferences.js';
import { PILLAR_HEIGHT } from './layout.js';

/** Shared run state. Rendering reads it; game actions and UI handlers own mutations. */
const gameState = {
  // Board cells hold ball identities; 0 is empty.
  board: new Uint8Array(BOARD_CELL_COUNT),
  nextBalls: Array(NEXT_BALL_COUNT).fill(1),
  score: 0,
  clearedByColor: new Float64Array(BALL_COLOR_COUNT + 1),
  selectedCell: null,
  hopFrame: 3,
  isAnimating: false,
  showPreview: true,
  isGameOver: false,
  // Ceremony: pillar offsets count downward from full height, 0..PILLAR_HEIGHT.
  opponentFrame: 0,
  challengerFrame: 0,
  opponentPillarOffset: 0,
  challengerPillarOffset: PILLAR_HEIGHT,
  playerName: settings.defaultPlayerName || DEFAULT_PLAYER_NAME,
  challengerRankTitle: 'novice',
  ruleset: CURRENT_RULESET,
  highScores: loadHighScores(CURRENT_RULESET),
  opponents: [],
  opponentIndex: 0,
  isCrowned: false,
  isOpponentVisible: true,
  opponentDisplayedScore: 100,
  victoryElapsedMs: 0,
  victorySwingCount: 0,
  registeredEntry: null,
  pendingRecord: null,
  // Async work captures sessionId and checks it after awaits before touching a new run.
  ladderAnimation: null,
  sessionId: 0,
  // Modal and exit state are owned by UI controllers, never by canvas rendering.
  activeDialog: null,
  isExited: false,
};

export { gameState };
