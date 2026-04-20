import { useCallback, useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function serverSnapshot(): string | null {
  return null;
}

/**
 * Custom hook for managing localStorage with automatic synchronization.
 * Uses useSyncExternalStore so values hydrate safely under SSR without
 * triggering setState inside an effect.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const getSnapshot = useCallback((): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);

  let value = initialValue;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`Error parsing localStorage key "${key}":`, error);
    }
  }

  const setValue = useCallback(
    (val: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(val));
        // `storage` events don't fire in the same window, so nudge our own listener.
        window.dispatchEvent(new StorageEvent("storage", { key }));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key],
  );

  return [value, setValue];
}
