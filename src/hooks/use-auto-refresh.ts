"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Automatically calls router.refresh() on a set interval so server components
 * re-fetch their data without a full page reload.
 *
 * @param intervalMs - Polling interval in milliseconds (default: 30 seconds)
 */
export function useAutoRefresh(intervalMs = 30_000) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(id);
  }, [router, intervalMs]);
}
