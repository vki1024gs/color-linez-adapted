const WEB_STORAGE_VERSION = 2;

function webStorageKey(area, version = WEB_STORAGE_VERSION) {
  return `linez.web.v${version}.${area}`;
}

// Storage may be blocked for local files/private browsing. Gameplay remains usable.
function readStoredValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStoredValue(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function listStoredKeys(prefix) {
  try {
    return Array.from({ length: localStorage.length }, (_, index) =>
      localStorage.key(index),
    ).filter((key) => key?.startsWith(prefix));
  } catch {
    return [];
  }
}

export {
  WEB_STORAGE_VERSION,
  webStorageKey,
  readStoredValue,
  writeStoredValue,
  removeStoredValue,
  listStoredKeys,
};
