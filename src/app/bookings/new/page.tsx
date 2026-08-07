import { AppShell } from "@/components/layout/app-shell";
import { BookingForm } from "@/components/bookings/booking-form";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ providerId?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell>
      <main className="workspace-page booking-page">
        <BookingForm initialProviderId={params.providerId} />
      </main>
    </AppShell>
  );
}
