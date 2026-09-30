let seed = 0;

function seedRandom(initialSeed) {
  seed = initialSeed >>> 0;
}

function getRandomState() {
  return seed;
}

function randomInt(upperBound) {
  // original LCG
  seed = (Math.imul(seed, 0x41c64e6d) + 0x3039) >>> 0;
  return ((seed >>> 16) & 0x7fff) % upperBound;
}

export { seedRandom, randomInt, getRandomState };
