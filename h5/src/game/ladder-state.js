import { DEFAULT_PLAYER_NAME } from '../core/constants.js';
import { DEFAULT_HIGH_SCORES, isDefaultHighScore } from '../core/high-scores.js';
import { normalizeEpithet, normalizeRankedEntries } from '../core/ranks.js';
import { settings, translate } from '../core/preferences.js';
import { PILLAR_HEIGHT } from '../layout.js';
import { gameState } from '../state.js';

function getChallengerName() {
  return !gameState.registeredEntry &&
    !settings.defaultPlayerName &&
    gameState.playerName === DEFAULT_PLAYER_NAME
    ? translate('pretender')
    : gameState.playerName;
}

function getOpponentName() {
  return getCurrentOpponent().name;
}

function getRankTitleText(title) {
  const key = typeof title === 'string' && title ? title : 'novice';
  return translate(`rank${key[0].toUpperCase()}${key.slice(1)}`);
}

function getEpithetText(epithet) {
  const key = typeof epithet === 'string' && epithet ? normalizeEpithet(epithet) : 'calm';
  return translate(`epithet${key[0].toUpperCase()}${key.slice(1)}`);
}

function getOpponentLabelLines() {
  const opponent = getCurrentOpponent();
  const title = getRankTitleText(opponent.rankTitle);
  return isDefaultHighScore(opponent)
    ? [title]
    : [title, `${getEpithetText(opponent.epithet)} ${opponent.name}`];
}

function getOpponentNoticeLabel(opponent) {
  const title = getRankTitleText(opponent?.rankTitle);
  if (!opponent || isDefaultHighScore(opponent)) return title;
  return `${title} ${getEpithetText(opponent.epithet)} ${opponent.name}`;
}

function getChallengerLabelLines() {
  const title = getRankTitleText(gameState.challengerRankTitle);
  return [title, getChallengerName()];
}

function resetOpponentLadder() {
  // Freeze this run's opponents: saving a new record must not move the goalposts.
  gameState.opponents = normalizeRankedEntries(gameState.highScores)
    .filter((entry) => entry.score > 0 && Number.isFinite(entry.score))
    .map((entry) => ({ ...entry }))
    .reverse();
  if (!gameState.opponents.length) gameState.opponents = [{ ...DEFAULT_HIGH_SCORES[0] }];
  gameState.opponentIndex = 0;
  gameState.isCrowned = false;
  gameState.isOpponentVisible = true;
  gameState.opponentFrame = 0;
  gameState.challengerFrame = 0;
  gameState.opponentPillarOffset = 0;
  gameState.challengerPillarOffset = PILLAR_HEIGHT;
  gameState.opponentDisplayedScore = gameState.opponents[0].score;
  gameState.victoryElapsedMs = 0;
  gameState.victorySwingCount = 0;
  gameState.registeredEntry = null;
  gameState.challengerRankTitle = 'novice';
  gameState.ladderAnimation = null;
}

function getCurrentOpponent() {
  // The left opponent keeps its identity even after the player wins the crown.
  return gameState.opponents[gameState.opponentIndex];
}

export {
  getChallengerName,
  getOpponentName,
  getOpponentLabelLines,
  getOpponentNoticeLabel,
  getChallengerLabelLines,
  getRankTitleText,
  getEpithetText,
  resetOpponentLadder,
  getCurrentOpponent,
};
