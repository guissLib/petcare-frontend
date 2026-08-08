import type {
  Availability,
  AuthResponse,
  Booking,
  BookingPaymentResult,
  BookingQuote,
  MapConfig,
  MapGeocodeResult,
  MockPaymentCard,
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

function requestHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const accessToken = storedAccessToken();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return headers;
}

function errorMessage(body: unknown) {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    Array.isArray(body.message)
  ) {
    return body.message.join(", ");
  }
  return "La solicitud no pudo completarse.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: requestHeaders(init),
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con PetCare. Verifica que el backend esté activo.",
      0,
    );
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(errorMessage(body), response.status);
  }
  return body as T;
}

async function requestBlob(path: string) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: requestHeaders(),
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con PetCare. Verifica que el backend esté activo.",
      0,
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(errorMessage(body), response.status);
  }
  return response.blob();
}

function queryString(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

type BookingPayload = {
  petId: string;
  providerId: string;
  serviceType: ServiceType;
  visitMode: Booking["visitMode"];
  scheduledAt: string;
  paymentMethod: Payment["method"];
  paymentId?: string;
  idempotencyKey?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  addressReference?: string;
  notes?: string;
};

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

  addVaccination(petId: string, payload: FormData) {
    return request<Pet>(`/pets/${petId}/vaccinations`, {
      method: "POST",
      body: payload,
    });
  },

  replaceVaccinationDocument(
    petId: string,
    vaccinationId: string,
    payload: FormData,
  ) {
    return request<Pet>(
      `/pets/${petId}/vaccinations/${vaccinationId}/document`,
      {
        method: "PUT",
        body: payload,
      },
    );
  },

  async downloadVaccinationDocument(petId: string, vaccinationId: string) {
    return requestBlob(`/pets/${petId}/vaccinations/${vaccinationId}/document`);
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

  getBooking(bookingId: string) {
    return request<Booking>(`/bookings/${bookingId}`);
  },

  payBooking(bookingId: string, card: MockPaymentCard) {
    return request<BookingPaymentResult>(
      `/bookings/${bookingId}/payments/mock`,
      {
        method: "POST",
        body: JSON.stringify(card),
      },
    );
  },

  quoteBooking(userId: string, payload: BookingPayload) {
    return request<BookingQuote>(`/users/${userId}/bookings/quote`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  createBooking(userId: string, payload: BookingPayload) {
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

  listOwnPromotions() {
    return request<Promotion[]>("/promotions/mine");
  },

  createPromotion(payload: {
    name: string;
    description: string;
    discountType: Promotion["discountType"];
    discountValue: number;
    scope: Promotion["scope"];
    city?: string;
    serviceTypes?: ServiceType[];
    startsAt: string;
    endsAt: string;
  }) {
    return request<Promotion>("/promotions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updatePromotion(promotionId: string, payload: Partial<Promotion>) {
    return request<Promotion>(`/promotions/${promotionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  setPromotionActive(promotionId: string, active: boolean) {
    return request<Promotion>(`/promotions/${promotionId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    });
  },

  geocode(address: string, city: string) {
    return request<MapGeocodeResult>("/maps/geocode", {
      method: "POST",
      body: JSON.stringify({ address, city }),
    });
  },

  mapConfig() {
    return request<MapConfig>("/maps/config");
  },

  listNotifications(userId: string) {
    return request<Notification[]>(`/users/${userId}/notifications`);
  },
};
