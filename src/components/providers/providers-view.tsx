"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { petcareApi } from "@/lib/api";
import { serviceCatalog } from "@/lib/format";
import type { Provider, ServiceType } from "@/types/petcare";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";

export function ProvidersView({
  initialService = "",
}: {
  initialService?: string;
}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [city, setCity] = useState("");
  const [service, setService] = useState(initialService);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProviders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProviders(
        await petcareApi.listProviders({
          city: city || undefined,
          serviceType: (service || undefined) as ServiceType | undefined,
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron cargar los proveedores.",
      );
    } finally {
      setLoading(false);
    }
  }, [city, service]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProviders(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProviders]);

  return (
    <main className="workspace-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ENCUENTRA CUIDADO DE CONFIANZA</p>
          <h1>Proveedores</h1>
          <p className="muted">
            Explora servicios, horarios y disponibilidad cerca de ti.
          </p>
        </div>
        <Link className="primary-button" href="/bookings/new">
          <Icon name="plus" /> Nueva reserva
        </Link>
      </div>

      <div className="provider-filters">
        <label>
          <span>Ciudad</span>
          <select value={city} onChange={(event) => setCity(event.target.value)}>
            <option value="">Todas las ciudades</option>
            <option value="Bogotá">Bogotá</option>
            <option value="Medellín">Medellín</option>
          </select>
        </label>
        <label>
          <span>Servicio</span>
          <select value={service} onChange={(event) => setService(event.target.value)}>
            <option value="">Todos los servicios</option>
            {serviceCatalog.map((item) => (
              <option value={item.id} key={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button className="secondary-button" onClick={() => void loadProviders()}>
          <Icon name="search" /> Buscar
        </button>
      </div>

      {loading && <LoadingState label="Buscando proveedores…" />}
      {!loading && error && (
        <ErrorState message={error} onRetry={() => void loadProviders()} />
      )}
      {!loading && !error && providers.length === 0 && (
        <EmptyState
          emoji="🔎"
          title="No encontramos proveedores"
          description="Prueba con otra ciudad o selecciona todos los servicios."
        />
      )}
      {!loading && !error && providers.length > 0 && (
        <div className="provider-grid provider-grid-wide">
          {providers.map((provider, index) => (
            <article className="provider-card" key={provider.id}>
              <div className={`provider-image provider-image-${(index % 2) + 1}`}>
                <span>{index % 2 === 0 ? "🐕" : "🐈"}</span>
                <b>
                  <span aria-hidden="true">★</span> Verificado
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
                  <span className="verified" aria-label="Proveedor verificado">
                    <Icon name="check" />
                  </span>
                </div>
                <div className="provider-facts">
                  <span>
                    <Icon name="clock" /> Capacidad: {provider.capacity}
                  </span>
                  <span>
                    {provider.acceptsHomeVisits
                      ? "Visitas a domicilio"
                      : "Atención en sede"}
                  </span>
                </div>
                <div className="tags">
                  {provider.services.map((item) => (
                    <span key={item}>
                      {serviceCatalog.find((serviceItem) => serviceItem.id === item)
                        ?.shortLabel ?? item}
                    </span>
                  ))}
                </div>
                <Link className="outline-button" href={`/providers/${provider.id}`}>
                  Ver perfil y disponibilidad <Icon name="arrow" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
