"use client";

import { useEffect, useState } from "react";
import type { UserSession } from "@/types/petcare";

const SESSION_KEY = "petcare-session";

export function usePetcareSession() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Partial<UserSession>;
          if (parsed.userId && parsed.accessToken) {
            setSession(parsed as UserSession);
          } else {
            window.localStorage.removeItem(SESSION_KEY);
          }
        } catch {
          window.localStorage.removeItem(SESSION_KEY);
        }
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const startSession = (nextSession: UserSession) => {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const endSession = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  return { session, ready, startSession, endSession };
}
