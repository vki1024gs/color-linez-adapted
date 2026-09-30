import { NEXT_BALL_COUNT } from './constants.js';
import { isBallId } from './balls.js';
import { generateBall } from './ball-generation.js';

function isBallQueue(queue) {
  return (
    Array.isArray(queue) &&
    queue.length === NEXT_BALL_COUNT &&
    Array.from(queue).every((id) => isBallId(id))
  );
}

function createBallQueue(context, random, strategy) {
  const queue = [];
  while (queue.length < NEXT_BALL_COUNT) {
    queue.push(
      generateBall(
        Object.freeze({ ...context, nextBalls: Object.freeze([...queue]) }),
        random,
        strategy,
      ),
    );
  }
  return queue;
}

function advanceBallQueue(queue, context, random, strategy) {
  if (!isBallQueue(queue)) throw new RangeError('Invalid upcoming ball queue');
  const nextBalls = queue.slice(1);
  nextBalls.push(
    generateBall(
      Object.freeze({ ...context, nextBalls: Object.freeze([...nextBalls]) }),
      random,
      strategy,
    ),
  );
  return { ballId: queue[0], nextBalls };
}

function replaceQueuedBall(queue, index, ballId) {
  if (
    !isBallQueue(queue) ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= NEXT_BALL_COUNT ||
    !isBallId(ballId)
  )
    throw new RangeError('Invalid upcoming ball replacement');
  return queue.map((current, position) => (position === index ? ballId : current));
}

export { isBallQueue, createBallQueue, advanceBallQueue, replaceQueuedBall };
