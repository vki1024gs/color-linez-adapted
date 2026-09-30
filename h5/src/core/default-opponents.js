const DEFAULT_LADDER_VERSION = 1;
const DEFAULT_OPPONENTS = Object.freeze([
  { name: 'King', score: 1000 },
  { name: 'Grand Duke', score: 800 },
  { name: 'Duke', score: 600 },
  { name: 'Marquess', score: 500 },
  { name: 'Count', score: 400 },
  { name: 'Viscount', score: 300 },
  { name: 'Baron', score: 250 },
  { name: 'Knight', score: 200 },
  { name: 'Sergeant', score: 150 },
  { name: 'Squire', score: 100 },
]);
const LEGACY_DEFAULT_OPPONENTS = Object.freeze([
  ...DEFAULT_OPPONENTS.map(({ name }, position) => ({
    name,
    score: 1000 - position * 100,
    replacement: name,
  })),
  { name: 'Baronet', score: 300, replacement: 'Knight' },
  { name: 'Knight', score: 200, replacement: 'Sergeant' },
]);

function isDefaultOpponent(entry) {
  if (entry.date || entry.recordId) return false;
  return [...DEFAULT_OPPONENTS, ...LEGACY_DEFAULT_OPPONENTS].some(
    (opponent) => entry.name === opponent.name && entry.score === opponent.score,
  );
}

function normalizeLegacyDefaultOpponent(entry, { updateScore = true } = {}) {
  if (entry.date || entry.recordId) return entry;
  const legacy = LEGACY_DEFAULT_OPPONENTS.find(
    (opponent) => entry.name === opponent.name && entry.score === opponent.score,
  );
  if (!legacy) return entry;
  const replacement = DEFAULT_OPPONENTS.find((opponent) => opponent.name === legacy.replacement);
  return { ...entry, name: replacement.name, score: updateScore ? replacement.score : entry.score };
}

export {
  DEFAULT_LADDER_VERSION,
  DEFAULT_OPPONENTS,
  isDefaultOpponent,
  normalizeLegacyDefaultOpponent,
};
