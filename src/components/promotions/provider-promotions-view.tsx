"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { petcareApi } from "@/lib/api";
import { usePetcareSession } from "@/hooks/use-petcare-session";
import { formatCurrency, serviceCatalog } from "@/lib/format";
import type { Promotion, Provider, ServiceType } from "@/types/petcare";
import { ErrorState, LoadingState } from "@/components/ui/states";

function dateValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function ProviderPromotionsView() {
  const { session } = usePetcareSession();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [provider, setProvider] = useState<Provider>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    "percent",
  );
  const [scope, setScope] = useState<Promotion["scope"]>("local");
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  const load = useCallback(async () => {
    if (!session?.providerId) return;
    setLoading(true);
    setError("");
    try {
      const [nextPromotions, nextProvider] = await Promise.all([
        petcareApi.listOwnPromotions(),
        petcareApi.getProvider(session.providerId),
      ]);
      setPromotions(nextPromotions);
      setProvider(nextProvider);
      setServiceTypes(nextProvider.services);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron cargar tus promociones.",
      );
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function createPromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!provider) return;
    setSaving(true);
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await petcareApi.createPromotion({
        name: String(form.get("name") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        discountType,
        discountValue: Number(form.get("discountValue")),
        scope,
        city: scope === "local" ? provider.city : undefined,
        serviceTypes,
        startsAt: String(form.get("startsAt")),
        endsAt: String(form.get("endsAt")),
      });
      formElement.reset();
      setPromotions(await petcareApi.listOwnPromotions());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo crear la promoción.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePromotion(promotion: Promotion) {
    try {
      const updated = await petcareApi.setPromotionActive(
        promotion.id,
        !promotion.active,
      );
      setPromotions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo cambiar el estado de la promoción.",
      );
    }
  }

  if (loading) {
    return <LoadingState label="Cargando tus promociones…" />;
  }

  if (!session?.providerId || !provider) {
    return (
      <ErrorState message="No encontramos el proveedor asociado a esta cuenta." />
    );
  }

  return (
    <main className="workspace-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">VENTAS DEL PROVEEDOR</p>
          <h1>Mis promociones</h1>
          <p className="muted">
            Crea descuentos para los servicios que realmente ofrece tu sede.
            Quedan activos inmediatamente.
          </p>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="provider-promotion-layout">
        <form
          className="detail-panel promotion-form"
          onSubmit={createPromotion}
        >
          <p className="eyebrow">NUEVA PROMOCIÓN</p>
          <h2>Incentiva nuevas reservas</h2>
          <label>
            Nombre
            <input name="name" placeholder="Ej. Semana de bienestar" required />
          </label>
          <label>
            Descripción
            <textarea
              name="description"
              rows={3}
              placeholder="Cuéntale al cliente qué incluye."
              required
            />
          </label>
          <div className="form-grid">
            <label>
              Tipo
              <select
                value={discountType}
                onChange={(event) =>
                  setDiscountType(event.target.value as "percent" | "fixed")
                }
              >
                <option value="percent">Porcentaje</option>
                <option value="fixed">Monto fijo</option>
              </select>
            </label>
            <label>
              Valor
              <input
                name="discountValue"
                type="number"
                min="1"
                max={discountType === "percent" ? 100 : undefined}
                required
              />
            </label>
          </div>
          <label>
            Alcance geográfico
            <select
              value={scope}
              onChange={(event) =>
                setScope(event.target.value as Promotion["scope"])
              }
            >
              <option value="local">
                Local · solo clientes de {provider.city}
              </option>
              <option value="national">Nacional · cualquier ciudad</option>
            </select>
          </label>
          <div className="form-grid">
            <label>
              Desde
              <input
                name="startsAt"
                type="date"
                defaultValue={dateValue()}
                required
              />
            </label>
            <label>
              Hasta
              <input
                name="endsAt"
                type="date"
                defaultValue={dateValue(30)}
                required
              />
            </label>
          </div>
          <fieldset>
            <legend>Servicios propios</legend>
            <div className="service-checkbox-grid">
              {(provider?.services ?? []).map((serviceType) => {
                const service = serviceCatalog.find(
                  (item) => item.id === serviceType,
                );
                return (
                  <label key={serviceType}>
                    <input
                      type="checkbox"
                      checked={serviceTypes.includes(serviceType)}
                      onChange={(event) =>
                        setServiceTypes((current) =>
                          event.target.checked
                            ? [...current, serviceType]
                            : current.filter((item) => item !== serviceType),
                        )
                      }
                    />
                    {service?.shortLabel ?? serviceType}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <button className="primary-button" disabled={saving}>
            {saving ? "Guardando…" : "Crear promoción"}
          </button>
        </form>

        <section className="detail-panel">
          <p className="eyebrow">PROMOCIONES PUBLICADAS</p>
          <h2>Solo administras las tuyas</h2>
          {promotions.length === 0 ? (
            <p className="inline-muted">Aún no has creado promociones.</p>
          ) : (
            <div className="promotion-list">
              {promotions.map((promotion) => (
                <article className="promotion-card" key={promotion.id}>
                  <div>
                    <strong>{promotion.name}</strong>
                    <p>{promotion.description}</p>
                    <small>
                      {promotion.discountType === "percent"
                        ? `-${promotion.discountValue}%`
                        : `-${formatCurrency(promotion.discountValue)}`}{" "}
                      ·{" "}
                      {promotion.scope === "national"
                        ? "Nacional"
                        : `Local · ${promotion.city ?? provider.city}`}{" "}
                      · {promotion.active ? "Activa" : "Inactiva"}
                    </small>
                  </div>
                  <button
                    className="outline-button compact-button"
                    type="button"
                    onClick={() => void togglePromotion(promotion)}
                  >
                    {promotion.active ? "Desactivar" : "Activar"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
