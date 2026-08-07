"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import { petcareApi } from "@/lib/api";
import type { Pet } from "@/types/petcare";

export function PetForm({
  userId,
  onCreated,
  onCancel,
}: {
  userId: string;
  onCreated: (pet: Pet) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const pet = await petcareApi.createPet(userId, {
        name: String(form.get("name") ?? "").trim(),
        species: form.get("species") as Pet["species"],
        breed: String(form.get("breed") ?? "").trim() || undefined,
        weightKg: form.get("weightKg")
          ? Number(form.get("weightKg"))
          : undefined,
        specialHandling:
          String(form.get("specialHandling") ?? "").trim() || undefined,
      });
      onCreated(pet);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la mascota.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-panel form-stack" onSubmit={handleSubmit}>
      <div className="form-panel-heading">
        <div>
          <p className="eyebrow">NUEVA MASCOTA</p>
          <h2>Agrega a tu compañero</h2>
        </div>
        <button className="close-button" type="button" onClick={onCancel} aria-label="Cerrar">
          <Icon name="close" />
        </button>
      </div>
      <div className="form-grid">
        <label>
          Nombre
          <input name="name" placeholder="Ej. Luna" required />
        </label>
        <label>
          Especie
          <select name="species" defaultValue="dog" required>
            <option value="dog">Perro</option>
            <option value="cat">Gato</option>
            <option value="bird">Ave</option>
            <option value="other">Otro</option>
          </select>
        </label>
        <label>
          Raza (opcional)
          <input name="breed" placeholder="Ej. Mestizo" />
        </label>
        <label>
          Peso en kg (opcional)
          <input name="weightKg" type="number" min="0.1" step="0.1" placeholder="8.5" />
        </label>
      </div>
      <label>
        Manejo especial (opcional)
        <textarea
          name="specialHandling"
          rows={3}
          placeholder="Cuéntanos algo que el proveedor deba saber."
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button" disabled={saving}>
          {saving ? "Guardando…" : "Guardar mascota"} <Icon name="arrow" />
        </button>
      </div>
    </form>
  );
}
