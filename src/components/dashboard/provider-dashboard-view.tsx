"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { usePetcareSession } from "@/hooks/use-petcare-session";
import { petcareApi } from "@/lib/api";
import { formatDate, serviceLabel, statusLabels } from "@/lib/format";
import type { Booking, Provider } from "@/types/petcare";
import { ErrorState, LoadingState } from "@/components/ui/states";

export function ProviderDashboardView() {
  const { session } = usePetcareSession();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProviderDashboard = useCallback(async () => {
    if (!session?.providerId) {
      setError("No encontramos el perfil de proveedor asociado a esta cuenta.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [nextProvider, nextBookings] = await Promise.all([
        petcareApi.getProvider(session.providerId),
        petcareApi.listBookings({ providerId: session.providerId }),
      ]);
      setProvider(nextProvider);
      setBookings(nextBookings);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo cargar el resumen del proveedor.",
      );
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProviderDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProviderDashboard]);

  const nextBooking = useMemo(
    () =>
      bookings
        .filter((booking) => !["cancelled", "rejected", "completed"].includes(booking.status))
        .sort(
          (first, second) =>
            new Date(first.scheduledAt).getTime() -
            new Date(second.scheduledAt).getTime(),
        )[0],
    [bookings],
  );

  if (loading) {
    return (
      <main className="content-wrap">
        <LoadingState label="Cargando el panel del proveedor…" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="content-wrap">
        <ErrorState message={error} onRetry={() => void loadProviderDashboard()} />
      </main>
    );
  }

  const confirmed = bookings.filter((booking) => booking.status === "confirmed").length;
  const inProgress = bookings.filter((booking) => booking.status === "in-progress").length;
  const completed = bookings.filter((booking) => booking.status === "completed").length;

  return (
    <main className="content-wrap">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">PANEL DEL PROVEEDOR</p>
          <h1>{provider?.name ?? session?.name} 👋</h1>
          <p className="muted">
            Revisa las reservas de tus clientes y actualiza el estado del servicio.
          </p>
        </div>
        <Link className="primary-button" href="/bookings">
          Gestionar reservas <Icon name="arrow" />
        </Link>
      </div>

      <section className="provider-hero-summary">
        <div>
          <span className="verified-label">
            <Icon name="check" /> Perfil activo
          </span>
          <h2>{provider?.address}</h2>
          <p>
            {provider?.city} · Capacidad diaria: {provider?.capacity}
          </p>
        </div>
        <div className="provider-service-summary">
          {provider?.services.map((service) => (
            <span key={service}>{serviceLabel(service)}</span>
          ))}
        </div>
      </section>

      <section className="provider-stats" aria-label="Resumen de reservas">
        <div>
          <small>Por atender</small>
          <strong>{confirmed}</strong>
          <span>confirmadas</span>
        </div>
        <div>
          <small>En servicio</small>
          <strong>{inProgress}</strong>
          <span>en progreso</span>
        </div>
        <div>
          <small>Finalizadas</small>
          <strong>{completed}</strong>
          <span>completadas</span>
        </div>
      </section>

      {nextBooking ? (
        <section className="next-booking-note provider-next-booking">
          <div>
            <span className="eyebrow">SIGUIENTE RESERVA</span>
            <h2>{serviceLabel(nextBooking.serviceType)}</h2>
            <p>{statusLabels[nextBooking.status]}</p>
          </div>
          <strong>{formatDate(nextBooking.scheduledAt)}</strong>
        </section>
      ) : (
        <div className="state-card empty-page">
          <div>📅</div>
          <h2>No hay reservas próximas</h2>
          <p>Cuando un cliente reserve tus servicios, aparecerá aquí.</p>
        </div>
      )}
    </main>
  );
}
