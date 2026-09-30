import { BALL_COLOR_COUNT } from './constants.js';

const BALL_DEFINITIONS = Object.freeze(
  Array.from({ length: BALL_COLOR_COUNT + 1 }, (_, id) =>
    Object.freeze({ id, kind: id === 0 ? 'empty' : 'normal', color: id, spriteColumn: id }),
  ),
);

function isBallId(id, { allowEmpty = false } = {}) {
  return Number.isInteger(id) && id >= (allowEmpty ? 0 : 1) && id < BALL_DEFINITIONS.length;
}

function getBallDefinition(id) {
  if (!isBallId(id, { allowEmpty: true })) throw new RangeError('Unknown ball identity');
  return BALL_DEFINITIONS[id];
}

function getBallColor(id) {
  return getBallDefinition(id).color;
}

export { BALL_DEFINITIONS, isBallId, getBallDefinition, getBallColor };
