import { BALL_COLOR_COUNT } from './constants.js';
import { isBallId } from './balls.js';

const SPAWN_REASONS = Object.freeze(['initial', 'turn', 'replacement']);

function generateNormalBall(_context, random) {
  return random(BALL_COLOR_COUNT) + 1;
}

function generateBall(context, random, strategy = generateNormalBall) {
  if (!SPAWN_REASONS.includes(context.reason)) throw new RangeError('Unknown spawn reason');
  const ballId = strategy(context, random);
  if (!isBallId(ballId)) throw new RangeError('Generator returned an unsupported ball');
  return ballId;
}

export { SPAWN_REASONS, generateNormalBall, generateBall };
