const scaleShell = document.getElementById('scale-shell');

const pixelStage = document.getElementById('pixel-stage');

const gameWindow = document.getElementById('win');

const gameCanvas = document.getElementById('cv');

const canvasContext = gameCanvas.getContext('2d');

canvasContext.scale(2, 2);

canvasContext.imageSmoothingEnabled = false;

const menubar = document.getElementById('menubar');

export { scaleShell, pixelStage, gameWindow, gameCanvas, canvasContext, menubar };
