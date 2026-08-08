export type UserRole = "pet-owner" | "provider" | "administrator";
export type PetSpecies = "dog" | "cat" | "bird" | "other";
export type ServiceType =
  | "grooming"
  | "walking"
  | "boarding"
  | "veterinary"
  | "home-visit"
  | "cleaning";
export type VisitMode = "pickup-dropoff" | "home-visit" | "at-location";
export type PaymentMethod = "online" | "at-location";
export type BookingStatus =
  | "pending"
  | "pending-confirmation"
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
  documentMimeType?: string;
  documentName?: string;
  documentSize?: number;
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
  userId?: string;
  method: PaymentMethod;
  status: "paid" | "pending" | "failed";
  amount: number;
  currency: string;
  provider: "mock";
  reference: string;
  createdAt: string;
  paidAt?: string;
  failureReason?: string;
  attempts: number;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: number;
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
  latitude?: number;
  longitude?: number;
  addressReference?: string;
  notes?: string;
  status: BookingStatus;
  total: number;
  originalTotal: number;
  discountAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentId: string;
  paymentExpiresAt?: string;
  idempotencyKey?: string;
  promotionId?: string;
  rejectionReason?: string;
  createdAt: string;
  payment?: Payment;
}

export interface BookingQuote {
  currency: string;
  serviceType: ServiceType;
  originalTotal: number;
  discountAmount: number;
  total: number;
  promotion?: Promotion;
  vaccinationRequired: boolean;
  vaccinationValid: boolean;
  vaccinationMessage?: string;
}

export interface MockPaymentCard {
  cardholderName: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
}

export type CheckoutFlowStatus =
  "idle" | "loading" | "processing" | "failed" | "expired";

export interface BookingPaymentResult {
  booking: Booking;
  payment: Payment;
  confirmationStatus?: "pending-confirmation" | "confirmed";
}

export interface MapGeocodeResult {
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  provider: string;
}

export interface MapConfig {
  provider: "google-maps";
  apiKey: string;
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
