"use client";

import { useCallback, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

const parsedIdleTimeout = Number.parseInt(
  process.env.NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES ?? "30",
  10
);
const IDLE_TIMEOUT_MINUTES =
  Number.isFinite(parsedIdleTimeout) && parsedIdleTimeout > 0
    ? parsedIdleTimeout
    : 30;
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

export default function SessionTimeout() {
  const { status } = useSession();
  const timeoutRef = useRef<number | null>(null);

  const clearExistingTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearExistingTimer();
    timeoutRef.current = window.setTimeout(() => {
      void signOut({ callbackUrl: "/login?reason=session-expired" });
    }, IDLE_TIMEOUT_MS);
  }, [clearExistingTimer]);

  useEffect(() => {
    if (status !== "authenticated") {
      clearExistingTimer();
      return;
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleUserActivity = () => {
      resetTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetTimer();
      }
    };

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resetTimer();

    return () => {
      clearExistingTimer();
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, handleUserActivity);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearExistingTimer, resetTimer, status]);

  return null;
}
