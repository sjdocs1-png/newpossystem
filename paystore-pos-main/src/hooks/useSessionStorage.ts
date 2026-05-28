import { useState, useEffect, useCallback } from 'react';

const isBrowser = typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

const getStorage = (): Storage | undefined => {
  return isBrowser ? window.sessionStorage : undefined;
};

const safeParse = <T>(value: string | null): T | null => {
  if (value === null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
};

export const getSessionStorageValue = <T = string>(key: string): T | null => {
  if (!isBrowser) return null;
  try {
    return safeParse<T>(window.sessionStorage.getItem(key));
  } catch {
    return null;
  }
};

export const setSessionStorageValue = (key: string, value: unknown): void => {
  if (!isBrowser) return;
  try {
    const rawValue = typeof value === 'string' ? value : JSON.stringify(value);
    window.sessionStorage.setItem(key, rawValue);
  } catch {
    // ignore session storage write failures
  }
};

export const removeSessionStorageValue = (key: string): void => {
  if (!isBrowser) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
};

export const clearSessionStorage = (): void => {
  if (!isBrowser) return;
  try {
    window.sessionStorage.clear();
  } catch {
    // ignore
  }
};

export const useSessionStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = getSessionStorageValue<T>(key);
    return item !== null ? item : initialValue;
  });

  useEffect(() => {
    const item = getSessionStorageValue<T>(key);
    if (item !== null) {
      setStoredValue(item);
    }
  }, [key]);

  const setValue = useCallback((value: T | ((prevValue: T) => T)) => {
    setStoredValue((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;
      setSessionStorageValue(key, newValue);
      return newValue;
    });
  }, [key]);

  const removeValue = useCallback(() => {
    removeSessionStorageValue(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return { value: storedValue, setValue, removeValue };
};
