"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { petcareApi } from "@/lib/api";
import { formatCurrency, formatShortDate, serviceCatalog } from "@/lib/format";
import type { Availability, Promotion, Provider } from "@/types/petcare";
import { ErrorState, LoadingState } from "@/components/ui/states";

export function ProviderDetailView({ providerId }: { providerId: string }) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");

  const loadProvider = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextProvider = await petcareApi.getProvider(providerId);
      const nextPromotions = await petcareApi.listPromotions({
        providerId,
      });
      setProvider(nextProvider);
      setPromotions(nextPromotions);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo cargar el proveedor.",
      );
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  const loadAvailability = useCallback(async () => {
    setAvailabilityLoading(true);
    setAvailabilityError("");
    try {
      setAvailability(await petcareApi.getAvailability(providerId, date));
    } catch (cause) {
      setAvailabilityError(
        cause instanceof Error
          ? cause.message
          : "No se pudo consultar la disponibilidad.",
      );
    } finally {
      setAvailabilityLoading(false);
    }
  }, [date, providerId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProvider(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProvider]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAvailability(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAvailability]);

  const services = useMemo(
    () =>
      provider?.services
        .map(
          (item) =>
            serviceCatalog.find((service) => service.id === item) ?? null,
        )
        .filter(Boolean),
    [provider],
  );

  if (loading) {
    return (
      <main className="workspace-page">
        <LoadingState label="Cargando información del proveedor…" />
      </main>
    );
  }

  if (error || !provider) {
    return (
      <main className="workspace-page">
        <ErrorState
          message={error || "Proveedor no encontrado."}
          onRetry={() => void loadProvider()}
        />
        <Link className="text-button back-link" href="/providers">
          <span aria-hidden="true">←</span> Volver a proveedores
        </Link>
      </main>
    );
  }

  return (
    <main className="workspace-page provider-detail-page">
      <Link className="text-button back-link" href="/providers">
        <span aria-hidden="true">←</span> Volver a proveedores
      </Link>
      <section className="provider-detail-hero">
        <div className="provider-detail-art" aria-hidden="true">
          🐕
        </div>
        <div>
          <span className="verified-label">
            <Icon name="check" /> Proveedor verificado
          </span>
          <h1>{provider.name}</h1>
          <p>
            <Icon name="pin" /> {provider.address}, {provider.city}
          </p>
          <div className="provider-facts">
            <span>
              <Icon name="clock" /> Capacidad diaria: {provider.capacity}
            </span>
            <span>
              {provider.acceptsHomeVisits
                ? "Disponible para visitas a domicilio"
                : "Servicio en sede"}
            </span>
          </div>
        </div>
      </section>

      <div className="provider-detail-grid">
        <section className="detail-panel">
          <p className="eyebrow">SERVICIOS</p>
          <h2>Cuidados disponibles</h2>
          <div className="detail-service-list">
            {services?.map(
              (service) =>
                service && (
                  <div
                    className={`detail-service ${service.color}`}
                    key={service.id}
                  >
                    <span>{service.emoji}</span>
                    <strong>{service.label}</strong>
                  </div>
                ),
            )}
          </div>
          <Link
            className="primary-button full-button"
            href={`/bookings/new?providerId=${provider.id}`}
          >
            Elegir este proveedor <Icon name="arrow" />
          </Link>
        </section>

        <section className="detail-panel">
          <p className="eyebrow">PROMOCIONES</p>
          <h2>Precios especiales</h2>
          {promotions.length ? (
            <div className="promotion-list">
              {promotions.map((promotion) => (
                <article className="promotion-card" key={promotion.id}>
                  <div>
                    <strong>{promotion.name}</strong>
                    <p>{promotion.description}</p>
                  </div>
                  <span className="promotion-discount">
                    {promotion.discountType === "percent"
                      ? `-${promotion.discountValue}%`
                      : `-${formatCurrency(promotion.discountValue)}`}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p className="inline-muted">
              Este proveedor no tiene promociones activas para mostrar.
            </p>
          )}
        </section>

        <section className="detail-panel availability-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AGENDA</p>
              <h2>Consulta disponibilidad</h2>
            </div>
            <Icon name="calendar" />
          </div>
          <label>
            Fecha
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          {availabilityLoading && <LoadingState label="Consultando…" />}
          {!availabilityLoading && availabilityError && (
            <ErrorState
              message={availabilityError}
              onRetry={() => void loadAvailability()}
            />
          )}
          {!availabilityLoading && !availabilityError && availability && (
            <>
              <div
                className={
                  availability.available
                    ? "availability-ok"
                    : "availability-full"
                }
              >
                <span>{availability.available ? "✓" : "!"}</span>
                <div>
                  <strong>
                    {availability.available
                      ? "Hay disponibilidad"
                      : "Cupo completo"}
                  </strong>
                  <small>
                    {availability.booked} de {availability.capacity} espacios
                    ocupados
                  </small>
                </div>
              </div>
              <div className="slot-list">
                {availability.slots.length ? (
                  availability.slots.map((slot) => (
                    <span key={`${slot.dayOfWeek}-${slot.start}`}>
                      {slot.start} – {slot.end}
                    </span>
                  ))
                ) : (
                  <p className="inline-muted">
                    No hay horarios configurados para el {formatShortDate(date)}
                    .
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
