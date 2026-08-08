import type { BookingStatus, PetSpecies, ServiceType } from "@/types/petcare";

export const serviceCatalog: Array<{
  id: ServiceType;
  label: string;
  shortLabel: string;
  emoji: string;
  color: string;
}> = [
  {
    id: "grooming",
    label: "Baño y peluquería",
    shortLabel: "Peluquería",
    emoji: "✂️",
    color: "peach",
  },
  {
    id: "veterinary",
    label: "Veterinaria",
    shortLabel: "Veterinaria",
    emoji: "🩺",
    color: "blue",
  },
  {
    id: "walking",
    label: "Paseos",
    shortLabel: "Paseos",
    emoji: "🦮",
    color: "mint",
  },
  {
    id: "boarding",
    label: "Guardería",
    shortLabel: "Guardería",
    emoji: "🏡",
    color: "lavender",
  },
  {
    id: "home-visit",
    label: "Visita a domicilio",
    shortLabel: "Domicilio",
    emoji: "🏠",
    color: "peach",
  },
  {
    id: "cleaning",
    label: "Limpieza",
    shortLabel: "Limpieza",
    emoji: "🧼",
    color: "mint",
  },
];

export const speciesLabels: Record<PetSpecies, string> = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  other: "Otro",
};

export const statusLabels: Record<BookingStatus, string> = {
  pending: "Pendiente de pago",
  "pending-confirmation": "Pendiente de confirmación",
  confirmed: "Confirmada",
  rejected: "Rechazada",
  "in-progress": "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
};

export const servicePrices: Record<ServiceType, number> = {
  grooming: 50000,
  veterinary: 70000,
  walking: 30000,
  boarding: 60000,
  "home-visit": 60000,
  cleaning: 45000,
};

export function serviceLabel(serviceType: string) {
  return (
    serviceCatalog.find((service) => service.id === serviceType)?.label ??
    serviceType
  );
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "PC"
  );
}
