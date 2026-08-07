import type {
  Availability,
  AuthResponse,
  Booking,
  Notification,
  Payment,
  Pet,
  Promotion,
  Provider,
  ServiceType,
  UserRegistrationResponse,
} from "@/types/petcare";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3005/api";

function storedAccessToken() {
  if (typeof window === "undefined") return undefined;
  try {
    const stored = window.localStorage.getItem("petcare-session");
    if (!stored) return undefined;
    const session = JSON.parse(stored) as { accessToken?: string };
    return session.accessToken;
  } catch {
    return undefined;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const accessToken = storedAccessToken();
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con PetCare. Verifica que el backend esté activo.",
      0,
    );
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body.message === "string"
        ? body.message
        : Array.isArray(body?.message)
          ? body.message.join(", ")
          : "La solicitud no pudo completarse.";
    throw new ApiError(message, response.status);
  }
  return body as T;
}

function queryString(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const petcareApi = {
  login(payload: { email: string; password: string }) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  createUser(payload: {
    name: string;
    email: string;
    password: string;
    role: "pet-owner" | "provider";
    city: string;
    phone?: string;
    provider?: {
      type: "employee" | "contractor" | "franchise";
      address: string;
      services: ServiceType[];
      capacity?: number;
      acceptsHomeVisits?: boolean;
    };
  }) {
    return request<UserRegistrationResponse>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  listProviders(filters?: { city?: string; serviceType?: ServiceType }) {
    return request<Provider[]>(
      `/providers${queryString({
        city: filters?.city,
        serviceType: filters?.serviceType,
      })}`,
    );
  },

  getProvider(providerId: string) {
    return request<Provider>(`/providers/${providerId}`);
  },

  getAvailability(providerId: string, date: string) {
    return request<Availability>(
      `/providers/${providerId}/availability?date=${encodeURIComponent(date)}`,
    );
  },

  listPets(userId: string) {
    return request<Pet[]>(`/users/${userId}/pets`);
  },

  createPet(
    userId: string,
    payload: {
      name: string;
      species: Pet["species"];
      breed?: string;
      weightKg?: number;
      specialHandling?: string;
    },
  ) {
    return request<Pet>(`/users/${userId}/pets`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  addVaccination(
    petId: string,
    payload: {
      vaccine: string;
      administeredAt: string;
      expiresAt?: string;
      documentUrl?: string;
    },
  ) {
    return request<Pet>(`/pets/${petId}/vaccinations`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  listBookings(filters?: {
    userId?: string;
    providerId?: string;
    status?: string;
    paymentId?: string;
  }) {
    return request<Booking[]>(
      `/bookings${queryString({
        userId: filters?.userId,
        providerId: filters?.providerId,
        status: filters?.status,
        paymentId: filters?.paymentId,
      })}`,
    );
  },

  createPayment(payload: { amount: number; method: Payment["method"] }) {
    return request<Payment>("/payments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  createBooking(
    userId: string,
    payload: {
      petId: string;
      providerId: string;
      serviceType: ServiceType;
      visitMode: Booking["visitMode"];
      scheduledAt: string;
      paymentMethod: Payment["method"];
      total: number;
      paymentId: string;
      address?: string;
      notes?: string;
    },
  ) {
    return request<Booking>(`/users/${userId}/bookings`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateBookingStatus(
    bookingId: string,
    payload: {
      status: Booking["status"];
      reason?: string;
    },
  ) {
    return request<Booking>(`/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  listPromotions(filters?: {
    city?: string;
    providerId?: string;
    serviceType?: ServiceType;
  }) {
    return request<Promotion[]>(
      `/promotions${queryString({
        city: filters?.city,
        providerId: filters?.providerId,
        serviceType: filters?.serviceType,
      })}`,
    );
  },

  geocode(address: string, city: string) {
    return request<{ latitude: number; longitude: number }>("/maps/geocode", {
      method: "POST",
      body: JSON.stringify({ address, city }),
    });
  },

  listNotifications(userId: string) {
    return request<Notification[]>(`/users/${userId}/notifications`);
  },
};
