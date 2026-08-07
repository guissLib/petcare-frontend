"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { usePetcareSession } from "@/hooks/use-petcare-session";
import { petcareApi } from "@/lib/api";
import {
  formatDate,
  serviceCatalog,
  serviceLabel,
  statusLabels,
} from "@/lib/format";
import type { Booking, Pet, Provider } from "@/types/petcare";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";

export function DashboardView() {
  const { session } = usePetcareSession();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const [nextProviders, nextPets, nextBookings] = await Promise.all([
        petcareApi.listProviders({ city: city || undefined }),
        petcareApi.listPets(session.userId),
        petcareApi.listBookings({ userId: session.userId }),
      ]);
      setProviders(nextProviders);
      setPets(nextPets);
      setBookings(nextBookings);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo cargar tu dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [city, session]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const filteredProviders = useMemo(
    () =>
      providers.filter(
        (provider) => !service || provider.services.includes(service as Provider["services"][number]),
      ),
    [providers, service],
  );

  const upcomingBooking = useMemo(
    () =>
      bookings
        .filter(
          (booking) =>
            new Date(booking.scheduledAt) >= new Date() &&
            !["cancelled", "rejected", "completed"].includes(booking.status),
        )
        .sort(
          (first, second) =>
            new Date(first.scheduledAt).getTime() -
            new Date(second.scheduledAt).getTime(),
        )[0],
    [bookings],
  );

  const petName = (petId: string) =>
    pets.find((pet) => pet.id === petId)?.name ?? "Tu mascota";

  if (loading) {
    return (
      <main className="content-wrap">
        <LoadingState label="Preparando tu espacio PetCare…" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="content-wrap">
        <ErrorState message={error} onRetry={() => void loadDashboard()} />
      </main>
    );
  }

  return (
    <main className="content-wrap">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">MI ESPACIO PETCARE</p>
          <h1>
            Buenos días, {session?.name} <span>👋</span>
          </h1>
          <p className="muted">
            Todo lo que tus mascotas necesitan, en un solo lugar.
          </p>
        </div>
        <Link className="primary-button" href="/bookings/new">
          <Icon name="plus" /> Nueva reserva
        </Link>
      </div>

      <section className="hero-card">
        <div className="hero-copy">
          <span className="pill">CUIDADO CON CONFIANZA</span>
          <h2>
            El bienestar de tu mascota
            <br />
            <em>empieza aquí.</em>
          </h2>
          <p>Encuentra servicios confiables y agenda en minutos.</p>
          <Link className="white-button" href="/providers">
            Explorar proveedores <Icon name="arrow" />
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun" />
          <div className="hero-paw">🐾</div>
          <div className="plant plant-one">✿</div>
          <div className="plant plant-two">❧</div>
        </div>
      </section>

      <section className="quick-stats" aria-label="Resumen de tu cuenta">
        <div className="stat">
          <span className="stat-icon peach-bg">📅</span>
          <div>
            <small>Próxima reserva</small>
            <strong>
              {upcomingBooking
                ? serviceLabel(upcomingBooking.serviceType)
                : "Sin reservas próximas"}
            </strong>
            <Link href="/bookings">
              {upcomingBooking
                ? formatDate(upcomingBooking.scheduledAt)
                : "Agendar ahora"}{" "}
              <Icon name="arrow" />
            </Link>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon blue-bg">🐶</span>
          <div>
            <small>Mascotas registradas</small>
            <strong>
              {pets.length} {pets.length === 1 ? "mascota" : "mascotas"}
            </strong>
            <Link href="/pets">
              Administrar <Icon name="arrow" />
            </Link>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon mint-bg">🎁</span>
          <div>
            <small>Promociones</small>
            <strong>Descuentos vigentes</strong>
            <Link href="/providers">
              Ver servicios <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      <section className="section-block" aria-labelledby="services-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CUIDADOS PARA ELLOS</p>
            <h2 id="services-title">¿Qué necesita tu mascota?</h2>
          </div>
          <Link className="text-button" href="/providers">
            Ver todos <Icon name="arrow" />
          </Link>
        </div>
        <div className="service-grid">
          {serviceCatalog.map((item) => (
            <Link
              className={`service-card ${item.color}`}
              href={`/providers?serviceType=${item.id}`}
              key={item.id}
            >
              <span className="service-emoji">{item.emoji}</span>
              <strong>{item.label}</strong>
              <small>
                Explorar <Icon name="arrow" />
              </small>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block provider-section" aria-labelledby="providers-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SERVICIOS CERCA DE TI</p>
            <h2 id="providers-title">Proveedores disponibles</h2>
          </div>
          <div className="filters">
            <label>
              <Icon name="pin" />
              <select value={city} onChange={(event) => setCity(event.target.value)}>
                <option value="">Todas las ciudades</option>
                <option value="Bogotá">Bogotá</option>
                <option value="Medellín">Medellín</option>
              </select>
            </label>
            <label>
              <Icon name="search" />
              <select value={service} onChange={(event) => setService(event.target.value)}>
                <option value="">Todos los servicios</option>
                {serviceCatalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.shortLabel}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="provider-grid">
          {filteredProviders.length ? (
            filteredProviders.slice(0, 4).map((provider, index) => (
              <article className="provider-card" key={provider.id}>
                <div className={`provider-image provider-image-${(index % 2) + 1}`}>
                  <span>{index % 2 === 0 ? "🐕" : "🐈"}</span>
                  <b>
                    <span aria-hidden="true">★</span> Proveedor verificado
                  </b>
                </div>
                <div className="provider-info">
                  <div className="provider-title">
                    <div>
                      <h3>{provider.name}</h3>
                      <p>
                        <Icon name="pin" /> {provider.address}, {provider.city}
                      </p>
                    </div>
                    <span className="verified" aria-label="Verificado">
                      <Icon name="check" />
                    </span>
                  </div>
                  <div className="tags">
                    {provider.services.slice(0, 3).map((item) => (
                      <span key={item}>{serviceCatalog.find((serviceItem) => serviceItem.id === item)?.shortLabel ?? item}</span>
                    ))}
                  </div>
                  <Link className="outline-button" href={`/providers/${provider.id}`}>
                    Ver disponibilidad <Icon name="arrow" />
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              emoji="🔎"
              title="No hay proveedores disponibles"
              description="Prueba con otra ciudad o servicio."
            />
          )}
        </div>
      </section>

      <section className="pets-banner">
        <div>
          <p className="eyebrow">TUS COMPAÑEROS</p>
          <h2>Cuida cada detalle de su salud.</h2>
          <p>
            {pets.length
              ? pets.map((pet) => pet.name).join(", ")
              : "Aún no tienes mascotas registradas."}
          </p>
          <Link className="dark-button" href="/pets">
            {pets.length ? "Ver mis mascotas" : "Agregar mascota"}{" "}
            <Icon name={pets.length ? "arrow" : "plus"} />
          </Link>
        </div>
        <div className="pet-stack" aria-hidden="true">
          <span>🐶</span>
          <span>🐱</span>
        </div>
      </section>

      {upcomingBooking && (
        <section className="next-booking-note">
          <div>
            <span className="eyebrow">TU PRÓXIMA CITA</span>
            <h2>{serviceLabel(upcomingBooking.serviceType)}</h2>
            <p>
              {petName(upcomingBooking.petId)} ·{" "}
              {statusLabels[upcomingBooking.status]}
            </p>
          </div>
          <strong>{formatDate(upcomingBooking.scheduledAt)}</strong>
        </section>
      )}
    </main>
  );
}
