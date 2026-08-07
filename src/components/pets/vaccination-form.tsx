"use client";

import { useState, type FormEvent } from "react";
import { petcareApi } from "@/lib/api";
import type { Pet } from "@/types/petcare";

export function VaccinationForm({
  petId,
  onUpdated,
}: {
  petId: string;
  onUpdated: (pet: Pet) => void;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const pet = await petcareApi.addVaccination(petId, {
        vaccine: String(form.get("vaccine") ?? "").trim(),
        administeredAt: String(form.get("administeredAt") ?? ""),
        expiresAt: String(form.get("expiresAt") ?? "") || undefined,
        documentUrl: String(form.get("documentUrl") ?? "").trim() || undefined,
      });
      onUpdated(pet);
      event.currentTarget.reset();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo registrar la vacuna.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="vaccination-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Vacuna
          <input name="vaccine" placeholder="Ej. Rabia" required />
        </label>
        <label>
          Fecha de aplicación
          <input name="administeredAt" type="date" required />
        </label>
        <label>
          Vence (opcional)
          <input name="expiresAt" type="date" />
        </label>
        <label>
          URL del documento (opcional)
          <input name="documentUrl" type="url" placeholder="https://…" />
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="outline-button compact-button" disabled={saving}>
        {saving ? "Registrando…" : "Guardar registro"}
      </button>
    </form>
  );
}
