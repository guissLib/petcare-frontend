export type UserRole = "pet-owner" | "provider" | "administrator";
export type PetSpecies = "dog" | "cat" | "bird" | "other";
export type ServiceType =
  | "grooming"
  | "walking"
  | "boarding"
  | "veterinary"
  | "home-visit";
export type VisitMode = "pickup-dropoff" | "home-visit" | "at-location";
export type PaymentMethod = "online" | "at-location";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "in-progress"
  | "completed"
  | "cancelled";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role?: UserRole;
  providerId?: string;
  accessToken: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  city?: string;
  phone?: string;
  createdAt: string;
}

export interface UserRegistrationResponse extends User {
  provider?: Provider;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: UserRegistrationResponse;
}

export interface ProviderSchedule {
  dayOfWeek: number;
  start: string;
  end: string;
}

export interface Provider {
  id: string;
  name: string;
  type: "employee" | "contractor" | "franchise";
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  acceptsHomeVisits: boolean;
  services: ServiceType[];
  schedule: ProviderSchedule[];
}

export interface VaccinationRecord {
  id: string;
  vaccine: string;
  administeredAt: string;
  expiresAt?: string;
  documentUrl?: string;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  weightKg?: number;
  specialHandling?: string;
  vaccinationRecords: VaccinationRecord[];
}

export interface Payment {
  id: string;
  method: PaymentMethod;
  status: "paid" | "pending" | "failed";
  amount: number;
  currency: string;
  provider: "mock";
  reference: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discountPercent: number;
  scope: "national" | "local";
  city?: string;
  providerId?: string;
  serviceTypes?: ServiceType[];
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  petId: string;
  providerId: string;
  serviceType: ServiceType;
  visitMode: VisitMode;
  scheduledAt: string;
  address?: string;
  notes?: string;
  status: BookingStatus;
  total: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentId: string;
  promotionId?: string;
  rejectionReason?: string;
  createdAt: string;
  payment?: Payment;
}

export interface Availability {
  available: boolean;
  capacity: number;
  booked: number;
  slots: ProviderSchedule[];
}

export interface Notification {
  id: string;
  userId: string;
  bookingId?: string;
  type: "confirmation" | "reminder" | "completion" | "rejection";
  message: string;
  channel: "mock-push";
  sentAt: string;
  read: boolean;
}
