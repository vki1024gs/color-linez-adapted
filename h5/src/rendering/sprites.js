import PANEL_URL from '../assets/portraits.png';
import BALLS_URL from '../assets/tiles.png';
import { getBallDefinition } from '../core/balls.js';

const tileImage = new Image();

tileImage.src = BALLS_URL;

const portraitImage = new Image();

portraitImage.src = PANEL_URL;

const assetsReady = Promise.all(
  [tileImage, portraitImage].map((img) =>
    img.complete
      ? Promise.resolve()
      : new Promise((r) => {
          img.onload = r;
          img.onerror = r;
        }),
  ),
);

const BALL_PALETTES = [
  null,
  ['#0b3315', '#145a21', '#16872a', '#20b936', '#3be348', '#79f66b', '#bdffa0'],
  ['#480c16', '#771426', '#a61c34', '#d62b42', '#f44a5d', '#ff8190', '#ffc0c1'],
  ['#15174c', '#242777', '#343cb0', '#4757df', '#627bff', '#92afff', '#c9d9ff'],
  ['#4c3409', '#79560f', '#ac8018', '#d8ae27', '#f8d846', '#ffeb7d', '#fff5bb'],
  ['#083b45', '#0d6174', '#178eaa', '#23bad6', '#47def2', '#80f0fa', '#c2ffff'],
  ['#400f4b', '#6b1b78', '#9426a9', '#bf39d5', '#e45af0', '#f48cfa', '#fdc2ff'],
  ['#32150d', '#522719', '#763c20', '#9c542c', '#bf773e', '#dfa45d', '#f6cf88'],
];

function getDissipationNoise(x, y) {
  const seed = (Math.imul(x + 11, 0x045d9f3b) ^ Math.imul(y + 7, 0x0119de1f)) >>> 0;
  return (Math.imul(seed ^ (seed >>> 16), 0x27d4eb2d) >>> 0) % 100;
}

function buildCrispBallSheet() {
  const sheet = document.createElement('canvas');
  sheet.width = 288;
  sheet.height = 360;
  const ctx = sheet.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  // Width, height and top row for resting, hopping, spawning and destruction.
  const frames = [
    [26, 26, 5],
    [28, 23, 8],
    [26, 26, 3],
    [24, 28, 1],
    [26, 26, 2],
    [28, 24, 6],
    [12, 12, 12],
    [20, 20, 9],
    [26, 26, 5],
    [26, 26, 5],
  ];
  for (let frame = 0; frame < frames.length; frame++) {
    const [w, h, top] = frames[frame];
    const left = Math.floor((36 - w) / 2);
    const inside = (x, y) => {
      const nx = (x + 0.5 - w / 2) / (w / 2),
        ny = (y + 0.5 - h / 2) / (h / 2);
      return nx * nx + ny * ny <= 1;
    };
    for (let color = 1; color <= 7; color++) {
      const palette = BALL_PALETTES[color];
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (!inside(x, y)) continue;
          const noise =
            frame === 9 ? getDissipationNoise(x, y) : (x * 17 + y * 31 + x * y * 7) % 23;
          if ((frame === 8 && noise < 7) || (frame === 9 && noise < 74)) continue;
          const nx = (x + 0.5 - w / 2) / (w / 2),
            ny = (y + 0.5 - h / 2) / (h / 2);
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          const light = Math.max(0, -0.43 * nx - 0.55 * ny + 0.71 * nz);
          // Carry the ball's own lighting to its silhouette, without a dark ink outline.
          const shade = Math.min(6, 1 + Math.floor(light * 6));
          ctx.fillStyle = palette[shade];
          ctx.fillRect(color * 36 + left + x, frame * 36 + top + y, 1, 1);
        }
    }
  }
  return sheet;
}

function drawBall(g, ballId, f, x, y) {
  const ball = getBallDefinition(ballId);
  g.imageSmoothingEnabled = false;
  g.drawImage(tileImage, 0, 0, 36, 36, x, y, 36, 36);
  if (ball.kind !== 'empty' && assets.ballSheet)
    g.drawImage(assets.ballSheet, ball.spriteColumn * 36, f * 36, 36, 36, x, y, 36, 36);
}

const assets = { ballSheet: null };

export {
  tileImage,
  portraitImage,
  assetsReady,
  BALL_PALETTES,
  buildCrispBallSheet,
  drawBall,
  assets,
};
