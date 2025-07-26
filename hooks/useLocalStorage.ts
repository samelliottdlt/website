import { useState, useEffect } from 'react';

/**
 * Custom hook for managing localStorage with automatic synchronization
 * @param key - The localStorage key
 * @param initialValue - The initial value to use if no stored value exists
 * @returns [value, setValue] - Current value and setter function
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Always start with the initial value to avoid hydration mismatches
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Load value from localStorage after component mounts
  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Save to localStorage whenever value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
