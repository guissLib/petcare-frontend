import { AppShell } from "@/components/layout/app-shell";
import { BookingsView } from "@/components/bookings/bookings-view";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    payment?: string;
    confirmation?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <AppShell>
      <BookingsView
        created={params.created === "1"}
        paymentPending={params.payment === "pending"}
        confirmationPending={params.confirmation === "pending"}
      />
    </AppShell>
  );
}
