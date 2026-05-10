import { useState, useEffect } from "react";

const STORAGE_VERSION = "v1";

/**
 * useState replacement that persists to localStorage.
 * Key is namespaced automatically with app version prefix.
 * Falls back to defaultValue silently if parsing fails or storage is unavailable.
 */
export function useLocalStorage(key, defaultValue) {
  const storageKey = `finfast_${STORAGE_VERSION}_${key}`;

  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // localStorage full or unavailable — silently ignore
    }
  }, [storageKey, state]);

  return [state, setState];
}

/**
 * Clear all app keys from localStorage (for a full reset).
 */
export function clearAppStorage() {
  const prefix = `finfast_${STORAGE_VERSION}_`;
  Object.keys(localStorage)
    .filter((k) => k.startsWith(prefix))
    .forEach((k) => localStorage.removeItem(k));
}
