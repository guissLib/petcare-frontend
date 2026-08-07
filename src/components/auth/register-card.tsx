"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, petcareApi } from "@/lib/api";
import { Icon } from "@/components/icon";
import { serviceCatalog } from "@/lib/format";
import type { ServiceType, UserSession } from "@/types/petcare";

export function RegisterCard({
  onSessionCreated,
  onSwitchToLogin,
}: {
  onSessionCreated: (session: UserSession) => void;
  onSwitchToLogin: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [accountType, setAccountType] = useState<"pet-owner" | "provider">(
    "pet-owner",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");
    const city = String(data.get("city") ?? "").trim();
    const role = String(data.get("role") ?? "pet-owner") as
      | "pet-owner"
      | "provider";
    const services = data.getAll("services") as ServiceType[];
    const address = String(data.get("address") ?? "").trim();

    if (role === "provider" && (!address || services.length === 0)) {
      setError("Los proveedores deben indicar dirección y al menos un servicio.");
      setSaving(false);
      return;
    }

    try {
      await petcareApi.createUser({
        name,
        email,
        password,
        city,
        role,
        provider:
          role === "provider"
            ? {
                type: data.get("providerType") as
                  | "employee"
                  | "contractor"
                  | "franchise",
                address,
                services,
                capacity: data.get("capacity")
                  ? Number(data.get("capacity"))
                  : undefined,
                acceptsHomeVisits: data.get("acceptsHomeVisits") === "on",
              }
            : undefined,
      });
      const auth = await petcareApi.login({ email, password });
      onSessionCreated({
        accessToken: auth.accessToken,
        userId: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
        role: auth.user.role,
        providerId: auth.user.provider?.id,
      });
      router.replace("/dashboard");
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "No se pudo crear tu cuenta.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="register-title">
        <div className="brand auth-brand">
          <span className="brand-mark">✦</span>
          <span>
            pet<span>care</span>
          </span>
        </div>
        <p className="eyebrow">TU ESPACIO PETCARE</p>
        <h1 id="register-title">Cuida lo que más quieres.</h1>
        <p className="muted">
          {accountType === "provider"
            ? "Registra tu sede para recibir reservas y actualizar el estado de tus servicios."
            : "Crea tu perfil para registrar mascotas, encontrar proveedores y reservar servicios."}
        </p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Tipo de cuenta
            <select
              name="role"
              value={accountType}
              onChange={(event) =>
                setAccountType(event.target.value as "pet-owner" | "provider")
              }
            >
              <option value="pet-owner">Dueño de mascota</option>
              <option value="provider">Proveedor de servicios</option>
            </select>
          </label>
          <label>
            Nombre completo
            <input name="name" placeholder="Ej. Ana Pérez" required />
          </label>
          <label>
            Correo electrónico
            <input
              name="email"
              type="email"
              placeholder="ana@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              minLength={12}
              placeholder="Mínimo 12 caracteres"
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            Ciudad
            <select name="city" defaultValue="Bogotá" required>
              <option value="Bogotá">Bogotá</option>
              <option value="Medellín">Medellín</option>
            </select>
          </label>
          {accountType === "provider" && (
            <div className="provider-registration">
              <label>
                Tipo de proveedor
                <select name="providerType" defaultValue="employee" required>
                  <option value="employee">Empleado</option>
                  <option value="contractor">Contratista</option>
                  <option value="franchise">Franquicia</option>
                </select>
              </label>
              <label>
                Dirección
                <input name="address" placeholder="Calle 100 # 12-30" required />
              </label>
              <div>
                <span className="field-label">Servicios ofrecidos</span>
                <div className="checkbox-grid">
                  {serviceCatalog.map((service) => (
                    <label className="checkbox-label" key={service.id}>
                      <input type="checkbox" name="services" value={service.id} />
                      <span>{service.emoji}</span>
                      {service.shortLabel}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-grid">
                <label>
                  Capacidad diaria
                  <input name="capacity" type="number" min="1" defaultValue="5" />
                </label>
                <label className="switch-label">
                  <input type="checkbox" name="acceptsHomeVisits" />
                  <span>Acepto visitas a domicilio</span>
                </label>
              </div>
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button full-button" disabled={saving}>
            {saving ? "Creando tu cuenta…" : "Comenzar en PetCare"}
            <Icon name="arrow" />
          </button>
        </form>
        <p className="auth-footnote">
          ¿Ya tienes una cuenta?{" "}
          <button type="button" onClick={onSwitchToLogin}>
            Iniciar sesión
          </button>
          <a href="http://localhost:3005/api-docs" target="_blank" rel="noreferrer">
            Ver documentación de la API
          </a>
        </p>
      </section>
      <aside className="auth-art" aria-hidden="true">
        <span className="auth-orb" />
        <span className="auth-paw">🐾</span>
        <span className="auth-leaf">✿</span>
      </aside>
    </main>
  );
}
