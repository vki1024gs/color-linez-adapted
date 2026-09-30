import { BALL_COLOR_COUNT, BOARD_CELL_COUNT, HIGH_SCORE_COUNT } from './constants.js';
import { isBallId } from './balls.js';
import { isBallQueue } from './ball-queue.js';
import { getPlayerNameError } from './player-name.js';
import { CURRENT_RULESET } from './ruleset.js';
import { isEpithet, isRankTitle, normalizeEpithet, rankTitleForPosition } from './ranks.js';
import { normalizeLegacyDefaultOpponent } from './default-opponents.js';

const isCount = (value) => Number.isSafeInteger(value) && value >= 0;
const isName = (value) =>
  typeof value === 'string' && value === value.trim() && !getPlayerNameError(value);

function decodeResumeSnapshot(raw) {
  if (typeof raw !== 'string' || raw.length > 16384) return null;
  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    return null;
  }
  const hasLegacyRankTitles =
    saved?.challengerRankTitle === 'baronet' ||
    (Array.isArray(saved?.opponents) &&
      saved.opponents.some((entry) => entry?.rankTitle === 'baronet'));
  const normalizeRankTitle = (title) =>
    hasLegacyRankTitles ? { knight: 'sergeant', baronet: 'knight' }[title] || title : title;
  if (
    saved?.version !== 1 ||
    saved.ruleset?.modeId !== CURRENT_RULESET.modeId ||
    saved.ruleset.rulesVersion !== CURRENT_RULESET.rulesVersion ||
    !Array.isArray(saved.board) ||
    saved.board.length !== BOARD_CELL_COUNT ||
    !saved.board.every((id) => isBallId(id, { allowEmpty: true })) ||
    !saved.board.includes(0) ||
    !isBallQueue(saved.nextBalls) ||
    !isCount(saved.score) ||
    !isName(saved.playerName) ||
    (saved.manual !== undefined && typeof saved.manual !== 'boolean') ||
    typeof saved.showPreview !== 'boolean' ||
    !Array.isArray(saved.clearedByColor) ||
    saved.clearedByColor.length !== BALL_COLOR_COUNT + 1 ||
    saved.clearedByColor[0] !== 0 ||
    !saved.clearedByColor.every(isCount) ||
    !Number.isInteger(saved.randomState) ||
    saved.randomState < 0 ||
    saved.randomState > 0xffffffff ||
    !Array.isArray(saved.opponents) ||
    !saved.opponents.length ||
    saved.opponents.length > HIGH_SCORE_COUNT ||
    !saved.opponents.every(
      (entry, index, entries) =>
        entry &&
        isName(entry.name) &&
        isCount(entry.score) &&
        entry.score > 0 &&
        (entry.rankTitle === undefined || isRankTitle(normalizeRankTitle(entry.rankTitle))) &&
        (entry.epithet === undefined || isEpithet(entry.epithet)) &&
        (index === 0 || entry.score >= entries[index - 1].score),
    ) ||
    (saved.challengerRankTitle !== undefined &&
      !isRankTitle(normalizeRankTitle(saved.challengerRankTitle)))
  )
    return null;
  return {
    version: 1,
    ruleset: { ...CURRENT_RULESET },
    board: [...saved.board],
    nextBalls: [...saved.nextBalls],
    score: saved.score,
    playerName: saved.playerName,
    manual: saved.manual === true,
    showPreview: saved.showPreview,
    clearedByColor: [...saved.clearedByColor],
    randomState: saved.randomState,
    opponents: saved.opponents
      .map((entry) =>
        hasLegacyRankTitles ? normalizeLegacyDefaultOpponent(entry, { updateScore: false }) : entry,
      )
      .map(({ name, score, rankTitle, epithet, date }, index) => ({
        name,
        score,
        rankTitle:
          normalizeRankTitle(rankTitle) || rankTitleForPosition(saved.opponents.length - 1 - index),
        ...(typeof epithet === 'string' ? { epithet: normalizeEpithet(epithet) } : {}),
        ...(typeof date === 'string' ? { date } : {}),
      })),
    challengerRankTitle: normalizeRankTitle(saved.challengerRankTitle) || 'novice',
  };
}

export { decodeResumeSnapshot };
