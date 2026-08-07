import { AppShell } from "@/components/layout/app-shell";
import { BookingsView } from "@/components/bookings/bookings-view";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell>
      <BookingsView created={params.created === "1"} />
    </AppShell>
  );
}
