import { MAX_PLAYER_NAME_LENGTH } from './constants.js';

/** Returns a translation key, or an empty string when the trimmed name is valid. */
function getPlayerNameError(name, { allowEmpty = false } = {}) {
  if (!name) return allowEmpty ? '' : 'nameEmpty';
  if (Array.from(name).length > MAX_PLAYER_NAME_LENGTH) return 'nameLong';
  return /[\p{Cc}\p{Cf}]/u.test(name) ? 'nameInvalid' : '';
}

export { getPlayerNameError };
