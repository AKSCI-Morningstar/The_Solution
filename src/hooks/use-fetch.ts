"use client";

import { useCallback, useState } from "react";

type FetchState<T> = {
  data: T | null;
  error: Error | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
};

export function useFetch<T>(url: string): FetchState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    isPending: false,
    isSuccess: false,
    isError: false,
  });

  const refetch = useCallback(async () => {
    setState({ data: null, error: null, isPending: true, isSuccess: false, isError: false });
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data: T = await response.json();
      setState({ data, error: null, isPending: false, isSuccess: true, isError: false });
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setState({ data: null, error, isPending: false, isSuccess: false, isError: true });
    }
  }, [url]);

  return { ...state, refetch };
}
