"use client";

import { useState } from "react";
import { LoginCard } from "@/components/auth/login-card";
import { RegisterCard } from "@/components/auth/register-card";
import type { UserSession } from "@/types/petcare";

export function AuthCard({
  onSessionCreated,
  initialMode = "register",
}: {
  onSessionCreated: (session: UserSession) => void;
  initialMode?: "login" | "register";
}) {
  const [mode, setMode] = useState(initialMode);

  return mode === "login" ? (
    <LoginCard
      onSessionCreated={onSessionCreated}
      onSwitchToRegister={() => setMode("register")}
    />
  ) : (
    <RegisterCard
      onSessionCreated={onSessionCreated}
      onSwitchToLogin={() => setMode("login")}
    />
  );
}
