"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, petcareApi } from "@/lib/api";
import { Icon } from "@/components/icon";
import type { UserSession } from "@/types/petcare";

export function LoginCard({
  onSessionCreated,
  onSwitchToRegister,
}: {
  onSessionCreated: (session: UserSession) => void;
  onSwitchToRegister: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");

    try {
      const response = await petcareApi.login({ email, password });
      onSessionCreated({
        accessToken: response.accessToken,
        userId: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
        providerId: response.user.provider?.id,
      });
      router.replace("/dashboard");
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 401
          ? "El correo o la contraseña no son correctos."
          : cause instanceof Error
            ? cause.message
            : "No se pudo iniciar sesión.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="brand auth-brand">
          <span className="brand-mark">✦</span>
          <span>
            pet<span>care</span>
          </span>
        </div>
        <p className="eyebrow">ACCESO A PETCARE</p>
        <h1 id="login-title">Bienvenido de nuevo.</h1>
        <p className="muted">
          Ingresa para administrar tus mascotas, reservas y servicios.
        </p>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              name="email"
              type="email"
              placeholder="tu@correo.com"
              autoComplete="email"
              required
              autoFocus
            />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              placeholder="Tu contraseña"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button full-button" disabled={saving}>
            {saving ? "Verificando…" : "Iniciar sesión"} <Icon name="arrow" />
          </button>
        </form>
        <p className="auth-switch">
          ¿Todavía no tienes una cuenta?{" "}
          <button type="button" onClick={onSwitchToRegister}>
            Crear cuenta
          </button>
        </p>
        <p className="auth-footnote">
          Tus contraseñas se verifican en el backend mediante hashes scrypt.
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
