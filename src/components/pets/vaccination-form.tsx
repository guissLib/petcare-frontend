"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { petcareApi } from "@/lib/api";
import type { Pet, VaccinationRecord } from "@/types/petcare";

const INVALID_PDF_MESSAGE =
  "Formato no válido. Por favor, suba el documento únicamente en formato PDF.";

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
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("document");
    try {
      if (!(file instanceof File) || file.type !== "application/pdf") {
        throw new Error(INVALID_PDF_MESSAGE);
      }
      const payload = new FormData();
      payload.append("vaccine", String(form.get("vaccine") ?? "").trim());
      payload.append(
        "administeredAt",
        String(form.get("administeredAt") ?? ""),
      );
      const expiresAt = String(form.get("expiresAt") ?? "").trim();
      if (expiresAt) payload.append("expiresAt", expiresAt);
      payload.append("document", file);
      onUpdated(await petcareApi.addVaccination(petId, payload));
      formElement.reset();
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
      <p className="inline-muted">Subir Carnet de Vacunación (solo PDF)</p>
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
          Documento PDF
          <input
            name="document"
            type="file"
            accept="application/pdf,.pdf"
            required
          />
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="outline-button compact-button" disabled={saving}>
        {saving ? "Guardando…" : "Guardar carnet"}
      </button>
    </form>
  );
}

export function VaccinationDocumentActions({
  petId,
  record,
  onUpdated,
}: {
  petId: string;
  record: VaccinationRecord;
  onUpdated: (pet: Pet) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function replace(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError(INVALID_PDF_MESSAGE);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = new FormData();
      payload.append("document", file);
      onUpdated(
        await petcareApi.replaceVaccinationDocument(
          petId,
          record.id,
          payload,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo reemplazar el PDF.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true);
    setError("");
    try {
      const blob = await petcareApi.downloadVaccinationDocument(
        petId,
        record.id,
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = record.documentName || "carnet-vacunacion.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo descargar el PDF.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="vaccination-document-actions">
      {record.documentMimeType === "application/pdf" && (
        <button
          className="text-button"
          type="button"
          onClick={() => void download()}
          disabled={busy}
        >
          Descargar PDF
        </button>
      )}
      <label className="text-button">
        {busy ? "Procesando…" : "Reemplazar PDF"}
        <input
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(event) => void replace(event)}
          disabled={busy}
        />
      </label>
      {error && (
        <small className="form-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
