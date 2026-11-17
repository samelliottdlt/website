import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type QueryParamValue = string | number | boolean;

export interface QueryParamConfig<T extends QueryParamValue> {
  key: string;
  defaultValue: T;
  serialize: (value: T) => string;
  /** Receives `null` when the parameter is absent from the URL. */
  deserialize: (value: string | null) => T;
}

/** A serialized query parameter; `null` removes it from the URL. */
export interface QueryParamEntry {
  key: string;
  value: string | null;
}

/** Serializes `value`, omitting defaults to keep URLs clean. */
export function toQueryParamEntry<T extends QueryParamValue>(
  config: QueryParamConfig<T>,
  value: T,
): QueryParamEntry {
  return {
    key: config.key,
    value: value === config.defaultValue ? null : config.serialize(value),
  };
}

/**
 * Returns the query string that represents `entries`, preserving unrelated
 * parameters from `current`.
 */
export function buildQueryString(
  current: URLSearchParams,
  entries: QueryParamEntry[],
): string {
  const params = new URLSearchParams(current);

  for (const { key, value } of entries) {
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  return params.toString();
}

/**
 * Replaces the URL whenever `entries` serialize to a different query string.
 * Comparing serialized strings (rather than deserialized values) guarantees the
 * effect converges after a single replace.
 */
function useSyncQueryString(entries: QueryParamEntry[]) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentQuery = searchParams.toString();
  const nextQuery = buildQueryString(searchParams, entries);

  useEffect(() => {
    if (nextQuery === currentQuery) return;

    router.replace(nextQuery ? `?${nextQuery}` : window.location.pathname, {
      scroll: false,
    });
  }, [currentQuery, nextQuery, router]);
}

/**
 * Custom hook for managing a URL query parameter with automatic synchronization.
 * Provides a state value and setter that automatically updates the URL when changed.
 * `config` should be stable (for example, defined at module scope).
 */
export function useQueryParam<T extends QueryParamValue>(
  config: QueryParamConfig<T>,
): [T, (value: T) => void] {
  const searchParams = useSearchParams();
  const [value, setValue] = useState<T>(() =>
    config.deserialize(searchParams.get(config.key)),
  );

  useSyncQueryString([toQueryParamEntry(config, value)]);

  return [value, setValue];
}

/**
 * Custom hook for managing multiple query parameters at once.
 * Useful when you need to update multiple parameters together to avoid multiple URL updates.
 * `configs` should be stable (for example, defined at module scope).
 */
export function useQueryParams<
  T extends Record<string, QueryParamValue>,
>(configs: {
  [K in keyof T]: QueryParamConfig<T[K]>;
}): [T, (updates: Partial<T>) => void] {
  const searchParams = useSearchParams();
  const keys = Object.keys(configs) as (keyof T)[];

  const [values, setValues] = useState<T>(() => {
    const initial = {} as T;
    for (const key of keys) {
      const config = configs[key];
      initial[key] = config.deserialize(searchParams.get(config.key));
    }
    return initial;
  });

  useSyncQueryString(
    keys.map((key) => toQueryParamEntry(configs[key], values[key])),
  );

  const updateValues = useCallback((updates: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...updates }));
  }, []);

  return [values, updateValues];
}

// Helper functions for common parameter types. Each deserializer only falls
// back to the default when the parameter is missing or invalid, so every
// serialized value (including "" and "0") round-trips through the URL.
export const stringParam = (
  key: string,
  defaultValue: string = "",
): QueryParamConfig<string> => ({
  key,
  defaultValue,
  serialize: (value) => value,
  deserialize: (value) => value ?? defaultValue,
});

export const numberParam = (
  key: string,
  defaultValue: number = 0,
): QueryParamConfig<number> => ({
  key,
  defaultValue,
  serialize: (value) => value.toString(),
  deserialize: (value) => {
    if (value === null || value.trim() === "") return defaultValue;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  },
});

export const booleanParam = (
  key: string,
  defaultValue: boolean = false,
): QueryParamConfig<boolean> => ({
  key,
  defaultValue,
  serialize: (value) => (value ? "true" : "false"),
  deserialize: (value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return defaultValue;
  },
});
