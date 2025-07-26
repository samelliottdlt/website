import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type QueryParamValue = string | number | boolean;

interface QueryParamConfig<T extends QueryParamValue> {
  key: string;
  defaultValue: T;
  serialize: (value: T) => string;
  deserialize: (value: string | null) => T;
}

/**
 * Custom hook for managing URL query parameters with automatic synchronization.
 * Provides a state value and setter that automatically updates the URL when changed.
 */
export function useQueryParam<T extends QueryParamValue>(
  config: QueryParamConfig<T>,
): [T, (value: T) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize state with URL value or default
  const initialValue = config.deserialize(searchParams.get(config.key));
  const [value, setValue] = useState<T>(initialValue);

  // Update URL when value changes
  useEffect(() => {
    const currentUrlValue = config.deserialize(searchParams.get(config.key));

    if (value !== currentUrlValue) {
      const params = new URLSearchParams(searchParams);

      if (value === config.defaultValue) {
        // Remove param if it's the default value to keep URLs clean
        params.delete(config.key);
      } else {
        params.set(config.key, config.serialize(value));
      }

      const queryString = params.toString();
      router.replace(
        queryString ? `?${queryString}` : window.location.pathname,
        {
          scroll: false,
        },
      );
    }
  }, [value, config, router, searchParams]);

  return [value, setValue];
}

/**
 * Custom hook for managing multiple query parameters at once.
 * Useful when you need to update multiple parameters together to avoid multiple URL updates.
 */
export function useQueryParams<
  T extends Record<string, QueryParamValue>,
>(configs: { [K in keyof T]: QueryParamConfig<T[K]> }): [
  T,
  (updates: Partial<T>) => void,
] {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize state with URL values or defaults
  const initialState = Object.entries(configs).reduce((acc, [key, config]) => {
    const typedConfig = config as QueryParamConfig<T[keyof T]>;
    acc[key as keyof T] = typedConfig.deserialize(
      searchParams.get(typedConfig.key),
    );
    return acc;
  }, {} as T);

  const [values, setValues] = useState<T>(initialState);

  // Update URL when any value changes
  useEffect(() => {
    const params = new URLSearchParams();
    let hasChanges = false;

    // Check if any value differs from current URL params
    for (const [key, config] of Object.entries(configs)) {
      const typedConfig = config as QueryParamConfig<T[keyof T]>;
      const currentValue = values[key as keyof T];
      const urlValue = typedConfig.deserialize(
        searchParams.get(typedConfig.key),
      );

      if (currentValue !== urlValue) {
        hasChanges = true;
      }

      if (currentValue !== typedConfig.defaultValue) {
        params.set(typedConfig.key, typedConfig.serialize(currentValue));
      }
    }

    if (hasChanges) {
      const queryString = params.toString();
      router.replace(
        queryString ? `?${queryString}` : window.location.pathname,
        {
          scroll: false,
        },
      );
    }
  }, [values, configs, router, searchParams]);

  const updateValues = (updates: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...updates }));
  };

  return [values, updateValues];
}

// Helper functions for common parameter types
export const stringParam = (
  key: string,
  defaultValue: string = "",
): QueryParamConfig<string> => ({
  key,
  defaultValue,
  serialize: (value) => value,
  deserialize: (value) => value || defaultValue,
});

export const numberParam = (
  key: string,
  defaultValue: number = 0,
): QueryParamConfig<number> => ({
  key,
  defaultValue,
  serialize: (value) => value.toString(),
  deserialize: (value) => Number(value) || defaultValue,
});

export const booleanParam = (
  key: string,
  defaultValue: boolean = false,
): QueryParamConfig<boolean> => ({
  key,
  defaultValue,
  serialize: (value) => (value ? "true" : "false"),
  deserialize: (value) => value === "true",
});
