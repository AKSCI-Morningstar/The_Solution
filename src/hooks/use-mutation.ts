import { useCallback, useState } from "react";

type MutationState<T> = {
  data: T | null;
  error: Error | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
};

export function useMutation<TData, TVariables>(
  mutateFn: (variables: TVariables) => Promise<TData>,
): MutationState<TData> & {
  mutate: (variables: TVariables) => Promise<void>;
  reset: () => void;
} {
  const [state, setState] = useState<MutationState<TData>>({
    data: null,
    error: null,
    isPending: false,
    isSuccess: false,
    isError: false,
  });

  const mutate = useCallback(
    async (variables: TVariables) => {
      setState({ data: null, error: null, isPending: true, isSuccess: false, isError: false });
      try {
        const data = await mutateFn(variables);
        setState({ data, error: null, isPending: false, isSuccess: true, isError: false });
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        setState({ data: null, error, isPending: false, isSuccess: false, isError: true });
      }
    },
    [mutateFn],
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, isPending: false, isSuccess: false, isError: false });
  }, []);

  return { ...state, mutate, reset };
}
