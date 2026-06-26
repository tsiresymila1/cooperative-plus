/** Shared helpers for the cooperative back office & platform admin spaces. */
import type { Badge } from "../components/ui";

export const notDeleted = (r: { deletedAt?: number | string | null }) =>
  r.deletedAt === undefined || r.deletedAt === null;

/** Coerce a money text input (MGA, integer minor units) to a non-negative integer. */
export const toMoney = (v: string | number): number => {
  const n = typeof v === "number" ? v : parseInt(String(v).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

export const toInt = (v: string | number, fallback = 0): number => {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
};

export const toFloat = (v: string | number, fallback = 0): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

export type Tone = React.ComponentProps<typeof Badge>["tone"];

/* ---------- Status maps (French labels + brand tones) ---------- */

export const tripStatus: Record<string, { label: string; tone: Tone }> = {
  scheduled: { label: "programmé", tone: "neutral" },
  boarding: { label: "embarquement", tone: "warning" },
  departed: { label: "parti", tone: "success" },
  arrived: { label: "arrivé", tone: "success" },
  cancelled: { label: "annulé", tone: "danger" },
};

export const bookingStatus: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "en attente", tone: "warning" },
  confirmed: { label: "confirmé", tone: "success" },
  paid: { label: "payé", tone: "success" },
  cancelled: { label: "annulé", tone: "danger" },
  refunded: { label: "remboursé", tone: "neutral" },
  expired: { label: "expiré", tone: "neutral" },
};

export const paymentStatus: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "en attente", tone: "warning" },
  paid: { label: "payé", tone: "success" },
  succeeded: { label: "réussi", tone: "success" },
  failed: { label: "échoué", tone: "danger" },
  refunded: { label: "remboursé", tone: "neutral" },
  partially_refunded: { label: "remb. partiel", tone: "neutral" },
};

export const subStatus: Record<string, { label: string; tone: Tone }> = {
  active: { label: "actif", tone: "success" },
  trialing: { label: "essai", tone: "warning" },
  past_due: { label: "impayé", tone: "warning" },
  suspended: { label: "suspendu", tone: "danger" },
  cancelled: { label: "résilié", tone: "danger" },
};

export const vehicleStatus: Record<string, { label: string; tone: Tone }> = {
  active: { label: "actif", tone: "success" },
  maintenance: { label: "maintenance", tone: "warning" },
  inactive: { label: "inactif", tone: "neutral" },
};

export const routeStatus: Record<string, { label: string; tone: Tone }> = {
  active: { label: "actif", tone: "success" },
  inactive: { label: "inactif", tone: "neutral" },
};

export const vehicleTypeLabel: Record<string, string> = {
  minibus_15: "Minibus 15",
  minibus_18: "Minibus 18",
  bus_30: "Bus 30",
  bus_50: "Bus 50",
  taxi_brousse: "Taxi-brousse",
};

export const memberRole: Record<string, string> = {
  owner: "Propriétaire",
  assistant: "Assistant",
};

export const COOP_PERMISSIONS = [
  { key: "trips", label: "Trajets" },
  { key: "bookings", label: "Réservations" },
  { key: "vehicles", label: "Véhicules" },
  { key: "models", label: "Modèles" },
  { key: "drivers", label: "Chauffeurs" },
  { key: "routes", label: "Itinéraires" },
  { key: "payments", label: "Paiements" },
  { key: "team", label: "Équipe" },
  { key: "settings", label: "Paramètres" },
] as const;

/** yyyy-mm-dd for an <input type="date"> default of today. */
export const todayISO = () => new Date().toISOString().slice(0, 10);

/** Format a datetime stored as epoch ms or ISO string. */
export const fmtDateTime = (v: number | string) =>
  new Date(v).toLocaleString("fr", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtDate = (v: number | string) =>
  new Date(v).toLocaleDateString("fr", { day: "2-digit", month: "short", year: "numeric" });

export const fmtTime = (v: number | string) =>
  new Date(v).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" });

/** Build a booking reference like CP-7F3K2A. */
export const genReference = () =>
  "CP-" + Math.random().toString(36).slice(2, 8).toUpperCase();

/** Combine a yyyy-mm-dd date and HH:mm time into epoch ms (Madagascar tz offset). */
export const combineDateTime = (date: string, time: string): number => {
  // Use local time; the app's tz is Indian/Antananarivo (+03:00).
  const ms = new Date(`${date}T${time}:00+03:00`).getTime();
  return Number.isFinite(ms) ? ms : Date.now();
};
