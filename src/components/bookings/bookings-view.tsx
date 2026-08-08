"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { usePetcareSession } from "@/hooks/use-petcare-session";
import { petcareApi } from "@/lib/api";
import {
  formatCurrency,
  formatDate,
  serviceLabel,
  statusLabels,
} from "@/lib/format";
import type { Booking, Pet, Provider } from "@/types/petcare";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";

export function BookingsView({
  created = false,
  paymentPending = false,
  confirmationPending = false,
}: {
  created?: boolean;
  paymentPending?: boolean;
  confirmationPending?: boolean;
}) {
  const { session } = usePetcareSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const isProvider = session?.role === "provider";

  const loadBookings = useCallback(async (showLoading = true) => {
    if (!session) return;
    if (isProvider && !session.providerId) {
      setError("No encontramos el proveedor asociado a esta cuenta.");
      setLoading(false);
      return;
    }
    if (showLoading) {
      setLoading(true);
    }
    setError("");
    try {
      const petsRequest = isProvider
        ? Promise.resolve<Pet[]>([])
        : petcareApi.listPets(session.userId);
      const [nextBookings, nextPets, nextProviders] = await Promise.all([
        petcareApi.listBookings(
          isProvider
            ? { providerId: session.providerId }
            : { userId: session.userId },
        ),
        petsRequest,
        petcareApi.listProviders(),
      ]);
      setBookings(nextBookings);
      setPets(nextPets);
      setProviders(nextProviders);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron cargar tus reservas.",
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [isProvider, session]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBookings(), 0);
    return () => window.clearTimeout(timer);
  }, [loadBookings]);

  const hasPendingConfirmation = useMemo(
    () => bookings.some((booking) => booking.status === "pending-confirmation"),
    [bookings],
  );

  useEffect(() => {
    if (!session || !hasPendingConfirmation) return;
    const timer = window.setInterval(() => {
      void loadBookings(false);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [hasPendingConfirmation, loadBookings, session]);

  const visibleBookings = useMemo(
    () =>
      bookings
        .filter((booking) => filter === "all" || booking.status === filter)
        .sort(
          (first, second) =>
            new Date(second.scheduledAt).getTime() -
            new Date(first.scheduledAt).getTime(),
        ),
    [bookings, filter],
  );
  const petName = (petId: string) =>
    pets.find((pet) => pet.id === petId)?.name ?? "Mascota";
  const providerName = (providerId: string) =>
    providers.find((provider) => provider.id === providerId)?.name ??
    "Proveedor";

  async function updateStatus(bookingId: string, status: Booking["status"]) {
    setUpdatingId(bookingId);
    setError("");
    try {
      const updatedBooking = await petcareApi.updateBookingStatus(bookingId, {
        status,
        ...(status === "rejected"
          ? {
              reason:
                window.prompt("Motivo del rechazo") ||
                "Requisitos no cumplidos",
            }
          : {}),
      });
      setBookings((current) =>
        current.map((booking) =>
          booking.id === updatedBooking.id ? updatedBooking : booking,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo actualizar el estado de la reserva.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  if (loading) {
    return (
      <main className="workspace-page">
        <LoadingState label="Cargando tus reservas…" />
      </main>
    );
  }

  return (
    <main className="workspace-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MI ACTIVIDAD</p>
          <h1>Mis reservas</h1>
          <p className="muted">
            {isProvider
              ? "Revisa las reservas de tus clientes y actualiza el estado del servicio."
              : "Consulta fechas, pagos y estado de los servicios de tus mascotas."}
          </p>
        </div>
        {!isProvider && (
          <Link className="primary-button" href="/bookings/new">
            <Icon name="plus" /> Nueva reserva
          </Link>
        )}
      </div>

      {created && (
        <div className="success-banner" role="status">
          <Icon name="check" />
          <span>
            {paymentPending
              ? "Tu reserva fue creada. El pago se realizará en el local."
              : "Tu reserva fue creada correctamente."}
          </span>
        </div>
      )}

      {confirmationPending && (
        <div className="info-banner" role="status">
          <Icon name="clock" />
          <span>
            Tu pago fue aprobado. La reserva está pendiente de confirmación y
            se actualizará automáticamente cuando Booking procese el evento.
          </span>
        </div>
      )}

      {error && (
        <ErrorState message={error} onRetry={() => void loadBookings()} />
      )}

      {!error && bookings.length > 0 && (
        <div className="booking-toolbar">
          <span>{bookings.length} reservas</span>
          <label>
            Filtrar por estado
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">Todas</option>
              <option value="confirmed">Confirmadas</option>
              <option value="pending">Pendientes</option>
              <option value="pending-confirmation">
                Pendientes de confirmación
              </option>
              <option value="in-progress">En progreso</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="rejected">Rechazadas</option>
            </select>
          </label>
        </div>
      )}

      {!error && bookings.length === 0 && (
        <EmptyState
          emoji="📅"
          title={
            isProvider ? "Aún no tienes reservas" : "Aún no tienes reservas"
          }
          description={
            isProvider
              ? "Cuando un cliente reserve tus servicios, aparecerá aquí."
              : "Elige un proveedor y agenda el cuidado que necesita tu mascota."
          }
          action={
            !isProvider ? (
              <Link className="primary-button" href="/bookings/new">
                Crear mi primera reserva <Icon name="arrow" />
              </Link>
            ) : undefined
          }
        />
      )}

      {!error && bookings.length > 0 && visibleBookings.length === 0 && (
        <EmptyState
          emoji="🔎"
          title="No hay reservas con este estado"
          description="Selecciona otro filtro para consultar tu actividad."
        />
      )}

      {!error && visibleBookings.length > 0 && (
        <div className="booking-list">
          {visibleBookings.map((booking) => (
            <article
              className="booking-card booking-card-detailed"
              key={booking.id}
            >
              <div className="booking-card-icon">📅</div>
              <div className="booking-card-main">
                <div>
                  <p className="eyebrow">{formatDate(booking.scheduledAt)}</p>
                  <h2>{serviceLabel(booking.serviceType)}</h2>
                  <p>
                    {petName(booking.petId)} ·{" "}
                    {providerName(booking.providerId)}
                  </p>
                </div>
                <span className={`status status-${booking.status}`}>
                  {statusLabels[booking.status]}
                </span>
                <div className="booking-card-meta">
                  <span>
                    {booking.paymentMethod === "online"
                      ? "Pago en línea"
                      : "Pago en el local"}
                  </span>
                  <strong>{formatCurrency(booking.total)}</strong>
                  {booking.discountAmount > 0 && (
                    <del>{formatCurrency(booking.originalTotal)}</del>
                  )}
                </div>
                <small>
                  {booking.payment?.reference
                    ? `Referencia ${booking.payment.reference}`
                    : "Pago asociado a la reserva"}
                </small>
                <small>
                  {booking.payment?.status === "paid"
                    ? "Pago aprobado"
                    : booking.payment?.status === "failed"
                      ? "Pago rechazado"
                      : "Pago pendiente"}
                </small>
                {booking.status === "pending" &&
                  booking.paymentMethod === "online" && (
                    <Link
                      className="outline-button compact-button"
                      href={`/checkout?bookingId=${encodeURIComponent(booking.id)}`}
                    >
                      Continuar pago
                    </Link>
                  )}
                {booking.rejectionReason && (
                  <p className="rejection-note">
                    Motivo de rechazo: {booking.rejectionReason}
                  </p>
                )}
                {isProvider && (
                  <div className="booking-actions-inline">
                    {booking.status === "confirmed" && (
                      <>
                        <button
                          className="outline-button compact-button"
                          disabled={updatingId === booking.id}
                          onClick={() =>
                            void updateStatus(booking.id, "in-progress")
                          }
                        >
                          Iniciar servicio
                        </button>
                        <button
                          className="danger-button"
                          disabled={updatingId === booking.id}
                          onClick={() =>
                            void updateStatus(booking.id, "rejected")
                          }
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    {booking.status === "in-progress" && (
                      <button
                        className="primary-button compact-button"
                        disabled={updatingId === booking.id}
                        onClick={() =>
                          void updateStatus(booking.id, "completed")
                        }
                      >
                        Marcar completada
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
