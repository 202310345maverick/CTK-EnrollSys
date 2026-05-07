"use client";

import { useAutoRefresh } from "@/hooks/use-auto-refresh";

/**
 * Drop this into any server-component page to make it silently re-fetch data
 * on an interval without a full page reload.
 *
 * Usage:
 *   <AutoRefresh intervalMs={30000} />
 */
export default function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  useAutoRefresh(intervalMs);
  return null;
}
