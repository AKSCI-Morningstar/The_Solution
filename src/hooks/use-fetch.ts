"use client";

import { useCallback, useEffect, useState } from "react";

type FetchState<T> = {
  data: T | null;
  error: Error | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
};

/**
 * Lightweight fetch hook with automatic load on mount/url change.
 * Prefer feature-local loaders for complex query-parameter state.
 */
export function useFetch<T>(
  url: string | null,
  options?: { enabled?: boolean },
): FetchState<T> & { refetch: () => Promise<void> } {
  const enabled = options?.enabled ?? true;
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    isPending: Boolean(url) && enabled,
    isSuccess: false,
    isError: false,
  });

  const refetch = useCallback(async () => {
    if (!url || !enabled) {
      setState({ data: null, error: null, isPending: false, isSuccess: false, isError: false });
      return;
    }
    setState((prev) => ({
      ...prev,
      error: null,
      isPending: true,
      isSuccess: false,
      isError: false,
    }));
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${response.status}: ${response.statusText}`);
      }
      const data: T = await response.json();
      setState({ data, error: null, isPending: false, isSuccess: true, isError: false });
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setState({ data: null, error, isPending: false, isSuccess: false, isError: true });
    }
  }, [url, enabled]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  return { ...state, refetch };
}
