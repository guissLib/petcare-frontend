import { AppShell } from "@/components/layout/app-shell";
import { ProviderDetailView } from "@/components/providers/provider-detail-view";

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  return (
    <AppShell>
      <ProviderDetailView providerId={providerId} />
    </AppShell>
  );
}
