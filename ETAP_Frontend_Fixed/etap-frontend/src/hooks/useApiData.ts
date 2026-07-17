import { useCallback, useEffect, useState } from "react";

/**
 * Runs an API-or-fallback loader (see src/lib/api/client.ts withFallback) on
 * mount and exposes { data, loading, isDemo, refetch }. Every page uses this
 * instead of importing mock arrays directly, so switching VITE_API_URL to a
 * real backend lights the whole app up with live data automatically.
 */
export function useApiData<T>(loader: () => Promise<{ data: T; usedFallback: boolean }>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loader().then((result) => {
      if (cancelled) return;
      setData(result.data);
      setIsDemo(result.usedFallback);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { data, loading, isDemo, refetch };
}
