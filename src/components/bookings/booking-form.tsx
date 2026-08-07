"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { usePetcareSession } from "@/hooks/use-petcare-session";
import { petcareApi } from "@/lib/api";
import {
  formatCurrency,
  serviceCatalog,
  servicePrices,
} from "@/lib/format";
import type {
  Pet,
  Promotion,
  Provider,
  ServiceType,
  VisitMode,
} from "@/types/petcare";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";

function dateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function BookingForm({ initialProviderId = "" }: { initialProviderId?: string }) {
  const router = useRouter();
  const { session } = usePetcareSession();
  const [pets, setPets] = useState<Pet[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState(initialProviderId);
  const [petId, setPetId] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("grooming");
  const [visitMode, setVisitMode] = useState<VisitMode>("at-location");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "at-location">("online");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [date, setDate] = useState(() => dateInputValue(1));
  const [today] = useState(() => dateInputValue());
  const [time, setTime] = useState("10:00");
  const [loading, setLoading] = useState(true);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const provider = providers.find((item) => item.id === providerId);
  const availableServices = useMemo(() => provider?.services ?? [], [provider]);
  const selectedService = availableServices.includes(serviceType)
    ? serviceType
    : (availableServices[0] ?? serviceType);
  const activePromotion = promotions[0];
  const baseAmount = servicePrices[selectedService];
  const discountAmount = activePromotion
    ? Math.round((baseAmount * activePromotion.discountPercent) / 100)
    : 0;
  const finalAmount = baseAmount - discountAmount;

  const loadFormData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const [nextPets, nextProviders] = await Promise.all([
        petcareApi.listPets(session.userId),
        petcareApi.listProviders(),
      ]);
      setPets(nextPets);
      setProviders(nextProviders);
      setPetId(nextPets[0]?.id ?? "");
      const firstProvider =
        nextProviders.find((item) => item.id === initialProviderId) ??
        nextProviders[0];
      setProviderId(firstProvider?.id ?? "");
      const firstService = firstProvider?.services[0];
      if (firstService) setServiceType(firstService);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo preparar el formulario de reserva.",
      );
    } finally {
      setLoading(false);
    }
  }, [initialProviderId, session]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFormData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadFormData]);

  useEffect(() => {
    if (!provider) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setPromotionLoading(true);
      void petcareApi
        .listPromotions({
          city: provider.city,
          providerId: provider.id,
          serviceType: selectedService,
        })
        .then((nextPromotions) => {
          if (active) setPromotions(nextPromotions);
        })
        .catch(() => {
          if (active) setPromotions([]);
        })
        .finally(() => {
          if (active) setPromotionLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [provider, selectedService]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !provider || !petId || !date) return;
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const address = String(form.get("address") ?? "").trim() || undefined;
    const notes = String(form.get("notes") ?? "").trim() || undefined;
    try {
      if (visitMode === "home-visit" && !address) {
        throw new Error("Las visitas a domicilio requieren una dirección.");
      }
      if (visitMode === "home-visit" && address) {
        await petcareApi.geocode(address, provider.city);
      }
      const payment = await petcareApi.createPayment({
        amount: finalAmount,
        method: paymentMethod,
      });
      await petcareApi.createBooking(session.userId, {
        petId,
        providerId: provider.id,
        serviceType: selectedService,
        visitMode,
        scheduledAt: `${date}T${time}:00`,
        paymentMethod,
        total: baseAmount,
        paymentId: payment.id,
        address,
        notes,
      });
      router.replace("/bookings?created=1");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo crear la reserva.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState label="Preparando tu reserva…" />;
  }

  if (error && (!pets.length || !providers.length)) {
    return <ErrorState message={error} onRetry={() => void loadFormData()} />;
  }

  if (!pets.length) {
    return (
      <EmptyState
        emoji="🐾"
        title="Primero registra una mascota"
        description="Necesitamos saber para quién es el servicio antes de crear una reserva."
        action={
          <Link className="primary-button" href="/pets">
            Ir a mis mascotas <Icon name="arrow" />
          </Link>
        }
      />
    );
  }

  if (!providers.length) {
    return (
      <EmptyState
        emoji="🏡"
        title="No hay proveedores disponibles"
        description="Vuelve a intentarlo más tarde para consultar la disponibilidad."
        action={
          <Link className="secondary-button" href="/providers">
            Ver proveedores
          </Link>
        }
      />
    );
  }

  return (
    <form className="booking-form-panel" onSubmit={handleSubmit}>
      <div className="booking-form-intro">
        <p className="eyebrow">NUEVA RESERVA</p>
        <h1>Agenda el cuidado que necesita.</h1>
        <p className="muted">
          Selecciona un proveedor, horario y forma de pago. El backend validará
          capacidad, vacunas y reglas del servicio.
        </p>
      </div>

      <div className="booking-form-section">
        <div className="form-section-title">
          <span>1</span>
          <div>
            <h2>¿Para quién es la reserva?</h2>
            <p>Elige tu mascota y el proveedor que prefieras.</p>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Mascota
            <select value={petId} onChange={(event) => setPetId(event.target.value)} required>
              {pets.map((pet) => (
                <option value={pet.id} key={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Proveedor
            <select
              value={providerId}
              onChange={(event) => setProviderId(event.target.value)}
              required
            >
              {providers.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} · {item.city}
                </option>
              ))}
            </select>
          </label>
        </div>
        {provider && (
          <div className="selected-provider">
            <span className="selected-provider-art">🐕</span>
            <div>
              <strong>{provider.name}</strong>
              <small>
                <Icon name="pin" /> {provider.address}, {provider.city}
              </small>
            </div>
            <a href={`/providers/${provider.id}`}>Ver perfil</a>
          </div>
        )}
      </div>

      <div className="booking-form-section">
        <div className="form-section-title">
          <span>2</span>
          <div>
            <h2>Define el servicio</h2>
            <p>Los servicios veterinarios y de guardería requieren vacunas vigentes.</p>
          </div>
        </div>
        <div className="service-choice-grid">
          {serviceCatalog
            .filter((item) => availableServices.includes(item.id))
            .map((item) => (
              <label
                className={serviceType === item.id ? "service-choice selected" : "service-choice"}
                key={item.id}
              >
                <input
                  type="radio"
                  name="serviceType"
                  value={item.id}
                  checked={selectedService === item.id}
                  onChange={() => setServiceType(item.id)}
                />
                <span>{item.emoji}</span>
                <strong>{item.shortLabel}</strong>
              </label>
            ))}
        </div>
        <div className="form-grid">
          <label>
            Modalidad
            <select
              value={visitMode}
              onChange={(event) => setVisitMode(event.target.value as VisitMode)}
              required
            >
              <option value="at-location">En el local</option>
              <option value="pickup-dropoff">Recogida y entrega</option>
              {provider?.acceptsHomeVisits && (
                <option value="home-visit">Visita a domicilio</option>
              )}
            </select>
          </label>
          {visitMode === "home-visit" && (
            <label>
              Dirección de la visita
              <input name="address" placeholder="Calle, número y barrio" required />
            </label>
          )}
        </div>
        {visitMode === "home-visit" && (
          <p className="form-hint">
            <Icon name="pin" /> Verificaremos la dirección con el servicio de
            mapas antes de crear la reserva.
          </p>
        )}
      </div>

      <div className="booking-form-section">
        <div className="form-section-title">
          <span>3</span>
          <div>
            <h2>Elige fecha y pago</h2>
            <p>Tu pago se registra antes de confirmar la reserva.</p>
          </div>
        </div>
        <div className="form-grid three-columns">
          <label>
            Fecha
            <input
              type="date"
              value={date}
              min={today}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>
          <label>
            Hora
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              required
            />
          </label>
          <label>
            Forma de pago
            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as "online" | "at-location")
              }
              required
            >
              <option value="online">Pago en línea</option>
              <option value="at-location">Pagar en el local</option>
            </select>
          </label>
        </div>
        <label>
          Notas para el proveedor (opcional)
          <textarea
            name="notes"
            rows={3}
            placeholder="Cuéntanos algo importante sobre la visita."
          />
        </label>
      </div>

      <aside className="booking-summary">
        <div>
          <span className="eyebrow">RESUMEN</span>
          <h2>{serviceCatalog.find((item) => item.id === selectedService)?.label}</h2>
          <p>
            {pets.find((pet) => pet.id === petId)?.name} ·{" "}
            {provider?.name ?? "Proveedor"}
          </p>
        </div>
        <div className="summary-price">
          {promotionLoading ? (
            <small>Calculando promoción…</small>
          ) : (
            <>
              {activePromotion && (
                <small>
                  {activePromotion.name} · -{activePromotion.discountPercent}%
                </small>
              )}
              <strong>{formatCurrency(finalAmount)}</strong>
              {discountAmount > 0 && <del>{formatCurrency(baseAmount)}</del>}
            </>
          )}
        </div>
      </aside>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions booking-actions">
        <Link className="secondary-button" href="/providers">
          Cancelar
        </Link>
        <button className="primary-button" disabled={saving || promotionLoading}>
          {saving ? "Procesando pago y reserva…" : "Confirmar y reservar"}{" "}
          <Icon name="arrow" />
        </button>
      </div>
      <p className="secure-note">
        <Icon name="shield" /> Pago simulado seguro. La API utiliza referencias
        MOCK para esta iteración.
      </p>
    </form>
  );
}
