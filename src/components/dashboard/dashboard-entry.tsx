"use client";

import { usePetcareSession } from "@/hooks/use-petcare-session";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { ProviderDashboardView } from "@/components/dashboard/provider-dashboard-view";

export function DashboardEntry() {
  const { session } = usePetcareSession();
  return session?.role === "provider" ? (
    <ProviderDashboardView />
  ) : (
    <DashboardView />
  );
}
