"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { usePetcareSession } from "@/hooks/use-petcare-session";
import { petcareApi } from "@/lib/api";
import { formatShortDate, speciesLabels } from "@/lib/format";
import type { Pet } from "@/types/petcare";
import { PetForm } from "@/components/pets/pet-form";
import {
  VaccinationDocumentActions,
  VaccinationForm,
} from "@/components/pets/vaccination-form";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";

function petEmoji(species: Pet["species"]) {
  return species === "cat"
    ? "🐱"
    : species === "bird"
      ? "🐦"
      : species === "dog"
        ? "🐶"
        : "🐾";
}

export function PetsView() {
  const { session } = usePetcareSession();
  const [pets, setPets] = useState<Pet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPets = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      setPets(await petcareApi.listPets(session.userId));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron cargar tus mascotas.",
      );
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPets(), 0);
    return () => window.clearTimeout(timer);
  }, [loadPets]);

  if (loading) {
    return (
      <main className="workspace-page">
        <LoadingState label="Cargando tus mascotas…" />
      </main>
    );
  }

  return (
    <main className="workspace-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">TUS COMPAÑEROS</p>
          <h1>Mis mascotas</h1>
          <p className="muted">
            Registra sus datos y mantén sus vacunas listas para cada servicio.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setShowForm((current) => !current)}
        >
          <Icon name={showForm ? "close" : "plus"} />{" "}
          {showForm ? "Cerrar" : "Agregar mascota"}
        </button>
      </div>

      {showForm && session && (
        <PetForm
          userId={session.userId}
          onCancel={() => setShowForm(false)}
          onCreated={(pet) => {
            setPets((current) => [...current, pet]);
            setShowForm(false);
          }}
        />
      )}

      {error && <ErrorState message={error} onRetry={() => void loadPets()} />}

      {!error && pets.length === 0 && (
        <EmptyState
          emoji="🐾"
          title="Aún no tienes mascotas"
          description="Agrega tu primera mascota para poder reservar servicios y guardar sus vacunas."
          action={
            <button className="primary-button" onClick={() => setShowForm(true)}>
              <Icon name="plus" /> Agregar mascota
            </button>
          }
        />
      )}

      {pets.length > 0 && (
        <div className="pet-list pet-list-detailed">
          {pets.map((pet) => (
            <article className="pet-detail-card" id={`pet-${pet.id}`} key={pet.id}>
              <div className={`pet-card-avatar pet-${pet.species}`}>
                {petEmoji(pet.species)}
              </div>
              <div className="pet-detail-main">
                <div className="pet-detail-heading">
                  <div>
                    <h2>{pet.name}</h2>
                    <p>
                      {speciesLabels[pet.species]} ·{" "}
                      {pet.breed || "Raza no especificada"}
                    </p>
                  </div>
                  <span className="pet-health-badge">
                    <Icon name="shield" />{" "}
                    {pet.vaccinationRecords?.length ?? 0} vacunas
                  </span>
                </div>
                <div className="pet-meta">
                  {pet.weightKg && <span>{pet.weightKg} kg</span>}
                  {pet.specialHandling && (
                    <span title={pet.specialHandling}>Manejo especial</span>
                  )}
                </div>
                <details className="vaccination-details">
                  <summary>
                    <span>Registros de vacunación</span>
                    <Icon name="chevron" />
                  </summary>
                  {pet.vaccinationRecords?.length ? (
                    <div className="vaccination-list">
                      {pet.vaccinationRecords.map((record) => (
                        <div className="vaccination-row" key={record.id}>
                          <div>
                            <strong>{record.vaccine}</strong>
                            <small>
                              Aplicada el {formatShortDate(record.administeredAt)}
                            </small>
                          </div>
                          {record.expiresAt && (
                            <small>Vence {formatShortDate(record.expiresAt)}</small>
                          )}
                          {record.documentUrl && (
                            <VaccinationDocumentActions
                              petId={pet.id}
                              record={record}
                              onUpdated={(updatedPet) =>
                                setPets((current) =>
                                  current.map((currentPet) =>
                                    currentPet.id === updatedPet.id
                                      ? updatedPet
                                      : currentPet,
                                  ),
                                )
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="inline-muted">
                      No hay vacunas registradas todavía.
                    </p>
                  )}
                  <VaccinationForm
                    petId={pet.id}
                    onUpdated={(updatedPet) =>
                      setPets((current) =>
                        current.map((currentPet) =>
                          currentPet.id === updatedPet.id ? updatedPet : currentPet,
                        ),
                      )
                    }
                  />
                </details>
                <Link className="text-button" href="/bookings/new">
                  Reservar para {pet.name} <Icon name="arrow" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
