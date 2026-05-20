/**
 * Thin wrapper over localStorage.
 * To migrate to Supabase, swap the get/set/remove implementations here —
 * nothing else in the codebase needs to change.
 */
export const storageAdapter = {
  /** @param {string} key @returns {any|null} */
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn(`[storage] get("${key}") failed:`, e);
      return null;
    }
  },

  /** @param {string} key @param {any} value */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[storage] set("${key}") failed:`, e);
    }
  },

  /** @param {string} key */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[storage] remove("${key}") failed:`, e);
    }
  },
};
