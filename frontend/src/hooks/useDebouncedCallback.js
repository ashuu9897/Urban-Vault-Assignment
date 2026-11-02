import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a function that calls `callback` only after it has stopped being called for
 * `delayMs`. Always invokes the latest `callback`, and cancels a pending call on unmount.
 */
export function useDebouncedCallback(callback, delayMs) {
  const callbackRef = useRef(callback);
  const timerRef = useRef(undefined);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return useCallback(
    (...args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
    },
    [delayMs],
  );
}
