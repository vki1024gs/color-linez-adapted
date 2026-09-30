import { randomInt } from './random.js';

const RANK_TITLES = Object.freeze([
  { key: 'novice' },
  { key: 'squire' },
  { key: 'sergeant' },
  { key: 'knight' },
  { key: 'baron' },
  { key: 'viscount' },
  { key: 'count' },
  { key: 'marquess' },
  { key: 'duke' },
  { key: 'grandDuke' },
  { key: 'king' },
]);

const SPECIAL_EPITHETS = Object.freeze([
  'wise',
  'fearless',
  'exceptional',
  'outstanding',
  'exalted',
  'great',
  'legendary',
]);
const VIRTUE_EPITHETS = Object.freeze([
  'steady',
  'composed',
  'resolute',
  'brave',
  'disciplined',
  'humble',
  'upright',
  'generous',
  'benevolent',
  'noble',
]);
const AFFINITY_EPITHETS = Object.freeze([
  'gentle',
  'friendly',
  'cheerful',
  'openhearted',
  'optimistic',
  'candid',
  'sincere',
  'patient',
  'attentive',
  'calm',
]);
const ABILITY_EPITHETS = Object.freeze([
  'agile',
  'nimble',
  'quickWitted',
  'intelligent',
  'focused',
  'diligent',
  'meticulous',
  'decisive',
  'strong',
  'learned',
]);
const LOWER_EPITHETS = Object.freeze([...AFFINITY_EPITHETS, ...ABILITY_EPITHETS]);
const DEFAULT_EPITHETS = Object.freeze([
  'legendary',
  'great',
  'wise',
  'noble',
  'resolute',
  'steady',
  'cheerful',
  'diligent',
  'patient',
  'calm',
]);

function rankTitleForPosition(position) {
  return RANK_TITLES[RANK_TITLES.length - 1 - position]?.key || 'novice';
}

function isRankTitle(value) {
  return RANK_TITLES.some((rank) => rank.key === value);
}

function normalizeEpithet(value) {
  return value === 'strategic' ? 'strong' : value;
}

function isEpithet(value) {
  return [...SPECIAL_EPITHETS, ...VIRTUE_EPITHETS, ...LOWER_EPITHETS].includes(
    normalizeEpithet(value),
  );
}

function defaultEpithetForPosition(position) {
  return DEFAULT_EPITHETS[Math.min(position, DEFAULT_EPITHETS.length - 1)] || 'steady';
}

function randomEpithetForPosition(position) {
  const pool = position < 3 ? SPECIAL_EPITHETS : position < 6 ? VIRTUE_EPITHETS : LOWER_EPITHETS;
  const accepted = 0x8000 - (0x8000 % pool.length);
  let draw;
  do {
    draw = randomInt(0x8000);
  } while (draw >= accepted);
  return pool[draw % pool.length];
}

function normalizeRankedEntries(entries) {
  return [...entries]
    .sort((a, b) => b.score - a.score)
    .map((entry, position) => ({
      ...entry,
      rankTitle: rankTitleForPosition(position),
      ...(isEpithet(entry.epithet)
        ? { epithet: normalizeEpithet(entry.epithet) }
        : { epithet: defaultEpithetForPosition(position) }),
    }));
}

export {
  RANK_TITLES,
  SPECIAL_EPITHETS,
  VIRTUE_EPITHETS,
  AFFINITY_EPITHETS,
  ABILITY_EPITHETS,
  LOWER_EPITHETS,
  rankTitleForPosition,
  isRankTitle,
  isEpithet,
  normalizeEpithet,
  defaultEpithetForPosition,
  randomEpithetForPosition,
  normalizeRankedEntries,
};
