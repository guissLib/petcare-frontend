import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CheckoutView } from "@/components/payments/checkout-view";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell>
      {params.bookingId ? (
        <CheckoutView bookingId={params.bookingId} />
      ) : (
        <main className="workspace-page">
          <section className="detail-panel">
            <h1>Checkout no disponible</h1>
            <p className="muted">
              Necesitas abrir el checkout desde una reserva pendiente de pago.
            </p>
            <Link className="primary-button" href="/bookings">
              Ver mis reservas
            </Link>
          </section>
        </main>
      )}
    </AppShell>
  );
}
