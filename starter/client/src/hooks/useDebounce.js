import { useState, useEffect, useCallback } from "react";

// BUG (intentional): Stale closure in debounced callback
// When the user types quickly, the debounced function captures the value from
// when the timer was SET, not when it FIRES. This means fast typing can result
// in search results for an intermediate (stale) query rather than the final one.
//
// The fix: use a ref to track the latest value, or cancel previous timers properly.
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// BUG (intentional): This debounced callback has a stale closure issue.
// The callback passed in is captured at the time of the first render,
// so it always uses stale state values from that initial render.
export function useDebouncedCallback(callback, delay = 300) {
  const [timer, setTimer] = useState(null);

  // BUG: callback is captured in this closure and never updated.
  // Even if the parent re-renders with new props/state, this function
  // still calls the OLD callback with the OLD closure values.
  const debouncedFn = useCallback(
    (...args) => {
      if (timer) {
        clearTimeout(timer);
      }

      const newTimer = setTimeout(() => {
        callback(...args);
      }, delay);

      setTimer(newTimer);
    },
    // BUG: callback is missing from deps — intentionally causes stale closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay]
  );

  return debouncedFn;
}
