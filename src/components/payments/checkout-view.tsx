"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { usePetcareSession } from "@/hooks/use-petcare-session";
import { petcareApi } from "@/lib/api";
import { formatCurrency, formatDate, serviceLabel } from "@/lib/format";
import type {
  Booking,
  CheckoutFlowStatus,
  MockPaymentCard,
} from "@/types/petcare";

function formatRemaining(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

export function CheckoutView({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { session } = usePetcareSession();
  const [booking, setBooking] = useState<Booking>();
  const [status, setStatus] = useState<CheckoutFlowStatus>("loading");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void petcareApi
        .getBooking(bookingId)
        .then((nextBooking) => {
          if (!active) return;
          setBooking(nextBooking);
          if (nextBooking.status !== "pending") {
            setStatus("failed");
            setError(
              "Esta reserva ya no está pendiente de pago. Revisa su estado en Mis reservas.",
            );
          } else {
            setStatus("idle");
          }
        })
        .catch((cause) => {
          if (!active) return;
          setStatus("failed");
          setError(
            cause instanceof Error
              ? cause.message
              : "No se pudo cargar la reserva.",
          );
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [bookingId, session]);

  useEffect(() => {
    if (!booking?.paymentExpiresAt) return;
    const updateRemaining = () => {
      const remaining = Math.max(
        0,
        Math.floor(
          (new Date(booking.paymentExpiresAt ?? "").getTime() - Date.now()) /
            1000,
        ),
      );
      setSecondsLeft(remaining);
      if (remaining === 0 && status !== "processing") {
        setStatus("expired");
        setError("El tiempo para completar el pago ha expirado.");
      }
    };
    const initialTimer = window.setTimeout(updateRemaining, 0);
    const interval = window.setInterval(updateRemaining, 1000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [booking?.paymentExpiresAt, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!booking || status === "expired") return;
    const data = new FormData(event.currentTarget);
    const card: MockPaymentCard = {
      cardholderName: String(data.get("cardholderName") ?? ""),
      cardNumber: String(data.get("cardNumber") ?? ""),
      expiryMonth: Number(data.get("expiryMonth")),
      expiryYear: Number(data.get("expiryYear")),
      cvv: String(data.get("cvv") ?? ""),
    };
    setStatus("processing");
    setError("");
    try {
      const result = await petcareApi.payBooking(booking.id, card);
      setBooking(result.booking);
      if (result.payment.status !== "paid") {
        setStatus("failed");
        setError(
          result.payment.failureReason ??
            "El pago no fue aprobado. Puedes revisar los datos e intentarlo nuevamente.",
        );
        return;
      }
      router.replace(`/bookings/success?bookingId=${booking.id}`);
    } catch (cause) {
      setStatus("failed");
      setError(
        cause instanceof Error ? cause.message : "No se pudo procesar el pago.",
      );
    }
  }

  if (!session) {
    return <ErrorState message="Debes iniciar sesión para pagar la reserva." />;
  }

  if (status === "loading") {
    return <LoadingState label="Cargando checkout seguro…" />;
  }

  if (!booking) {
    return <ErrorState message={error || "Reserva no encontrada."} />;
  }

  const disabled =
    status === "processing" ||
    status === "expired" ||
    booking.status !== "pending";

  return (
    <main className="workspace-page checkout-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CHECKOUT SEGURO</p>
          <h1>Completa tu pago</h1>
          <p className="muted">
            No almacenamos el número de tarjeta, el CVV ni la fecha de
            expiración.
          </p>
        </div>
        <div className="checkout-countdown" role="status">
          <small>Tiempo restante</small>
          <strong>{formatRemaining(secondsLeft)}</strong>
        </div>
      </div>

      <div className="checkout-layout">
        <section className="detail-panel checkout-summary">
          <p className="eyebrow">RESUMEN DE RESERVA</p>
          <h2>{serviceLabel(booking.serviceType)}</h2>
          <p>{formatDate(booking.scheduledAt)}</p>
          <p className="muted">Referencia {booking.id}</p>
          <div className="checkout-total">
            <span>Total a pagar</span>
            <strong>{formatCurrency(booking.total)}</strong>
          </div>
          {booking.originalTotal > booking.total && (
            <p className="muted">
              Precio original:{" "}
              <del>{formatCurrency(booking.originalTotal)}</del>
            </p>
          )}
        </section>

        <section className="detail-panel checkout-form-panel">
          <div className="form-section-title">
            <span>
              <Icon name="shield" />
            </span>
            <div>
              <h2>Datos de la tarjeta</h2>
              <p>Pago simulado para el MVP.</p>
            </div>
          </div>
          <form className="form-stack" onSubmit={handleSubmit}>
            <label>
              Nombre en la tarjeta
              <input
                name="cardholderName"
                autoComplete="cc-name"
                placeholder="Ana Pérez"
                required
              />
            </label>
            <label>
              Número de tarjeta
              <input
                name="cardNumber"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                minLength={13}
                maxLength={19}
                required
              />
            </label>
            <div className="form-grid">
              <label>
                Mes de expiración
                <input
                  name="expiryMonth"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="12"
                  autoComplete="cc-exp-month"
                  required
                />
              </label>
              <label>
                Año de expiración
                <input
                  name="expiryYear"
                  type="number"
                  min={new Date().getFullYear()}
                  placeholder="2028"
                  autoComplete="cc-exp-year"
                  required
                />
              </label>
              <label>
                CVV
                <input
                  name="cvv"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  minLength={3}
                  maxLength={4}
                  required
                />
              </label>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <Link className="secondary-button" href="/bookings">
                Cancelar
              </Link>
              <button className="primary-button" disabled={disabled}>
                {status === "processing"
                  ? "Procesando…"
                  : status === "expired"
                    ? "Pago expirado"
                    : "Pagar y confirmar reserva"}
              </button>
            </div>
          </form>
          <p className="secure-note">
            <Icon name="shield" /> Para probar un rechazo usa una tarjeta con
            número terminado en 0002.
          </p>
        </section>
      </div>
    </main>
  );
}
