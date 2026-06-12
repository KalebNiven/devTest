import { useState, useEffect } from "react";
import { fetchSales, fetchSummary } from "../utils/api";

// BUG (intentional): Infinite re-render loop
// The filters object is recreated on every render (new reference), which triggers
// the useEffect, which updates state, which causes a re-render, which creates
// a new filters object... infinite loop.
//
// The fix: memoize the filters object, or use individual filter values as deps,
// or compare filters deeply before triggering a fetch.
export function useSalesData(filters) {
  const [salesData, setSalesData] = useState({ data: [], pagination: {} });
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // BUG: `filters` is a new object reference on every render → infinite loop
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [sales, summary] = await Promise.all([
          fetchSales(filters),
          fetchSummary(filters),
        ]);

        if (!cancelled) {
          setSalesData(sales);
          setSummaryData(summary);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [filters]); // BUG: filters is a new object every render

  return { salesData, summaryData, loading, error };
}
