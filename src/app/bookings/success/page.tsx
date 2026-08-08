import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Icon } from "@/components/icon";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell>
      <main className="workspace-page success-page">
        <section className="detail-panel success-card">
          <div className="success-icon">
            <Icon name="check" />
          </div>
          <p className="eyebrow">RESERVA EXITOSA</p>
          <h1>Tu reserva está confirmada.</h1>
          <p className="muted">
            El pago fue aprobado y el proveedor recibió la confirmación de la
            reserva.
          </p>
          {params.bookingId && (
            <p className="success-reference">
              Referencia: <strong>{params.bookingId}</strong>
            </p>
          )}
          <div className="form-actions">
            <Link className="primary-button" href="/bookings">
              Ver mis reservas <Icon name="arrow" />
            </Link>
            <Link className="secondary-button" href="/dashboard">
              Ir al inicio
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
