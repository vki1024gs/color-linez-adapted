// Transient sprite snapshots are separate from the settled game board.
/** @typedef {{index: number, ballId: number, color: number}} RemovedBall */
/** @typedef {{groups: RemovedBall[][], groupIndex: number, balls: RemovedBall[], frame: number}} RemovalPresentation */
/** @typedef {{index: number, hiddenIndex: number, ballId: number, frame: number}} MotionPresentation */
const boardPresentation = { removal: null, motion: null };

export { boardPresentation };
