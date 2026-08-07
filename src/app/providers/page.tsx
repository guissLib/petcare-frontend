import { AppShell } from "@/components/layout/app-shell";
import { ProvidersView } from "@/components/providers/providers-view";

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ serviceType?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell>
      <ProvidersView initialService={params.serviceType} />
    </AppShell>
  );
}
