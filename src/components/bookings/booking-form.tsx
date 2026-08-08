"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { HomeVisitMap } from "@/components/bookings/home-visit-map";
import { usePetcareSession } from "@/hooks/use-petcare-session";
import { petcareApi } from "@/lib/api";
import { formatCurrency, serviceCatalog, servicePrices } from "@/lib/format";
import type {
  BookingQuote,
  MapConfig,
  Pet,
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

export function BookingForm({
  initialProviderId = "",
}: {
  initialProviderId?: string;
}) {
  const router = useRouter();
  const { session } = usePetcareSession();
  const [pets, setPets] = useState<Pet[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState(initialProviderId);
  const [petId, setPetId] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("grooming");
  const [visitMode, setVisitMode] = useState<VisitMode>("at-location");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "at-location">(
    "online",
  );
  const [date, setDate] = useState(() => dateInputValue(1));
  const [today] = useState(() => dateInputValue());
  const [time, setTime] = useState("10:00");
  const [address, setAddress] = useState("");
  const [addressReference, setAddressReference] = useState("");
  const [latitude, setLatitude] = useState<number>();
  const [longitude, setLongitude] = useState<number>();
  const [notes, setNotes] = useState("");
  const [mapConfig, setMapConfig] = useState<MapConfig>();
  const [mapSearching, setMapSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<BookingQuote>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKeyRef = useRef<string | null>(null);

  const provider = providers.find((item) => item.id === providerId);
  const selectedPet = pets.find((item) => item.id === petId);
  const availableServices = useMemo(() => provider?.services ?? [], [provider]);
  const selectedService = availableServices.includes(serviceType)
    ? serviceType
    : (availableServices[0] ?? serviceType);
  const fallbackAmount = servicePrices[selectedService];

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
    if (visitMode !== "home-visit" || !session) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void petcareApi
        .mapConfig()
        .then((config) => {
          if (active) setMapConfig(config);
        })
        .catch(() => {
          if (active) setMapConfig(undefined);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [session, visitMode]);

  const bookingPayload = useMemo(
    () => ({
      petId,
      providerId: provider?.id ?? "",
      serviceType: selectedService,
      visitMode,
      scheduledAt: `${date}T${time}:00`,
      paymentMethod,
      notes: notes.trim() || undefined,
      ...(visitMode === "home-visit"
        ? {
            address: address.trim(),
            latitude,
            longitude,
            addressReference: addressReference.trim(),
          }
        : {}),
    }),
    [
      address,
      addressReference,
      date,
      latitude,
      paymentMethod,
      petId,
      provider,
      selectedService,
      notes,
      time,
      visitMode,
      longitude,
    ],
  );

  const canQuote =
    Boolean(session && provider && petId && date && selectedService) &&
    (visitMode !== "home-visit" ||
      Boolean(
        address.trim() &&
        addressReference.trim() &&
        latitude !== undefined &&
        longitude !== undefined,
      ));

  useEffect(() => {
    if (!session || !canQuote) {
      const timer = window.setTimeout(() => setQuote(undefined), 0);
      return () => window.clearTimeout(timer);
    }
    let active = true;
    const timer = window.setTimeout(() => {
      setQuoteLoading(true);
      setError("");
      void petcareApi
        .quoteBooking(session.userId, bookingPayload)
        .then((nextQuote) => {
          if (active) setQuote(nextQuote);
        })
        .catch((cause) => {
          if (active) {
            setQuote(undefined);
            setError(
              cause instanceof Error
                ? cause.message
                : "No se pudo calcular el precio.",
            );
          }
        })
        .finally(() => {
          if (active) setQuoteLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [bookingPayload, canQuote, session]);

  async function searchAddress() {
    if (!provider || !address.trim()) return;
    setMapSearching(true);
    setError("");
    try {
      const result = await petcareApi.geocode(address.trim(), provider.city);
      setAddress(result.address);
      setLatitude(result.latitude);
      setLongitude(result.longitude);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo encontrar esa dirección en Bolivia.",
      );
    } finally {
      setMapSearching(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !provider || !selectedPet || !quote) return;
    if (quote.vaccinationRequired && !quote.vaccinationValid) {
      setError(
        "Para este servicio es obligatorio adjuntar el carnet de vacunación.",
      );
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (paymentMethod === "online" && !idempotencyKeyRef.current) {
        idempotencyKeyRef.current =
          window.crypto?.randomUUID?.() ??
          `checkout_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      }
      const booking = await petcareApi.createBooking(session.userId, {
        ...bookingPayload,
        ...(paymentMethod === "online"
          ? { idempotencyKey: idempotencyKeyRef.current ?? undefined }
          : {}),
      });
      if (paymentMethod === "online" && booking.status === "pending") {
        router.push(`/checkout?bookingId=${encodeURIComponent(booking.id)}`);
      } else {
        router.replace(
          paymentMethod === "at-location"
            ? "/bookings?created=1&payment=pending"
            : "/bookings?created=1",
        );
      }
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
          El precio se calcula en el backend antes de pagar. Allí también se
          validan capacidad, vacunas y reglas del servicio.
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
            <select
              value={petId}
              onChange={(event) => setPetId(event.target.value)}
              required
            >
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
            <Link href={`/providers/${provider.id}`}>Ver perfil</Link>
          </div>
        )}
      </div>

      <div className="booking-form-section">
        <div className="form-section-title">
          <span>2</span>
          <div>
            <h2>Define el servicio</h2>
            <p>
              Guardería, limpieza y peluquería requieren carnet PDF vigente.
            </p>
          </div>
        </div>
        <div className="service-choice-grid">
          {serviceCatalog
            .filter((item) => availableServices.includes(item.id))
            .map((item) => (
              <label
                className={
                  selectedService === item.id
                    ? "service-choice selected"
                    : "service-choice"
                }
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
              onChange={(event) =>
                setVisitMode(event.target.value as VisitMode)
              }
              required
            >
              <option value="at-location">En el local</option>
              <option value="pickup-dropoff">Recogida y entrega</option>
              {provider?.acceptsHomeVisits && (
                <option value="home-visit">Visita a domicilio</option>
              )}
            </select>
          </label>
        </div>
        {visitMode === "home-visit" && (
          <HomeVisitMap
            apiKey={
              mapConfig?.apiKey ||
              process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
              ""
            }
            address={address}
            addressReference={addressReference}
            latitude={latitude}
            longitude={longitude}
            searching={mapSearching}
            onAddressChange={setAddress}
            onAddressReferenceChange={setAddressReference}
            onSearch={() => void searchAddress()}
            onPositionChange={(nextLatitude, nextLongitude) => {
              setLatitude(nextLatitude);
              setLongitude(nextLongitude);
            }}
          />
        )}
      </div>

      <div className="booking-form-section">
        <div className="form-section-title">
          <span>3</span>
          <div>
            <h2>Elige fecha y pago</h2>
            <p>El pago se registra únicamente con el importe cotizado.</p>
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
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>

      <aside className="booking-summary">
        <div>
          <span className="eyebrow">RESUMEN</span>
          <h2>
            {serviceCatalog.find((item) => item.id === selectedService)?.label}
          </h2>
          <p>
            {selectedPet?.name} · {provider?.name ?? "Proveedor"}
          </p>
        </div>
        <div className="summary-price">
          {quoteLoading ? (
            <small>Calculando precio…</small>
          ) : quote ? (
            <>
              {quote.promotion && (
                <small>
                  {quote.promotion.name} ·{" "}
                  {quote.promotion.discountType === "percent"
                    ? `-${quote.promotion.discountValue}%`
                    : `-${formatCurrency(quote.promotion.discountValue)}`}
                </small>
              )}
              <del>{formatCurrency(quote.originalTotal)}</del>
              <strong>{formatCurrency(quote.total)}</strong>
            </>
          ) : (
            <strong>{formatCurrency(fallbackAmount)}</strong>
          )}
        </div>
      </aside>

      {quote?.vaccinationRequired && !quote.vaccinationValid && selectedPet && (
        <div className="form-error" role="alert">
          <p>{quote.vaccinationMessage}</p>
          <Link className="text-button" href={`/pets#pet-${selectedPet.id}`}>
            Subir Carnet de Vacunación <Icon name="arrow" />
          </Link>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions booking-actions">
        <Link className="secondary-button" href="/providers">
          Cancelar
        </Link>
        <button
          className="primary-button"
          disabled={
            saving ||
            quoteLoading ||
            !quote ||
            (quote.vaccinationRequired && !quote.vaccinationValid)
          }
        >
          {saving
            ? paymentMethod === "online"
              ? "Preparando pago…"
              : "Procesando reserva…"
            : paymentMethod === "online"
              ? "Proceder al pago"
              : "Confirmar y reservar"}{" "}
          <Icon name="arrow" />
        </button>
      </div>
      <p className="secure-note">
        <Icon name="shield" /> El backend valida el importe final y no acepta
        totales enviados desde el navegador.
      </p>
    </form>
  );
}
