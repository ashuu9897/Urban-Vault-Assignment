import { QueryClient } from '@tanstack/react-query';

/** Retry only failures that might succeed next time: network errors and 5xx, never 4xx. */
function shouldRetry(failureCount, error) {
  const transient = error?.status === 0 || error?.status >= 500;
  return transient && failureCount < 2;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry },
      mutations: { retry: false },
    },
  });
}
