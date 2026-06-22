/** Client-side domain helpers: seat maps, references, dates. */

export type SeatCell = {
  row: number;
  col: number;
  type: "seat" | "aisle" | "door" | "driver" | "empty";
  label?: string;
};

/**
 * Normalize a tripInstance.seatMapSnapshot (json) into a typed cell array.
 * Falls back to a linear seat grid (labels "1".."N") when the snapshot is
 * missing or malformed, so the seat picker always renders something usable.
 */
export function parseSeatLayout(snapshot: unknown, seatsTotal: number): SeatCell[] {
  const cells = extractCells(snapshot);
  if (cells.length > 0) return cells;
  return defaultMinibusLayout(seatsTotal);
}

/**
 * Realistic taxi-brousse fallback when no snapshot is stored: driver up front
 * (right), then rows of 2 + aisle + 2 seats. Keeps absolute `col` so the
 * renderer can align the aisle correctly.
 */
export function defaultMinibusLayout(seatsTotal: number): SeatCell[] {
  const total = Math.max(seatsTotal, 0);
  const cells: SeatCell[] = [{ row: 0, col: 3, type: "driver" }];
  let n = 0;
  let row = 1;
  while (n < total) {
    // cols 0,1 | aisle col 2 | cols 3,4
    for (const col of [0, 1, 3, 4]) {
      if (n >= total) break;
      cells.push({ row, col, type: "seat", label: String(++n) });
    }
    if (row * 4 - 4 < total) cells.push({ row, col: 2, type: "aisle" });
    row += 1;
  }
  return cells;
}

/** Number of bookable seats in a layout. */
export function countSeats(cells: SeatCell[]): number {
  return cells.reduce((acc, c) => acc + (c.type === "seat" ? 1 : 0), 0);
}

function extractCells(snapshot: unknown): SeatCell[] {
  let raw: unknown = snapshot;
  // Snapshot may arrive as a JSON string — parse it so we use the real coop
  // layout instead of falling back to the generic grid.
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "layout" in raw) {
    raw = (raw as { layout: unknown }).layout;
  }
  if (!Array.isArray(raw)) return [];
  const out: SeatCell[] = [];
  for (const c of raw) {
    if (!c || typeof c !== "object") continue;
    const cell = c as Record<string, unknown>;
    const type = cell.type;
    if (
      typeof cell.row === "number" &&
      typeof cell.col === "number" &&
      (type === "seat" || type === "aisle" || type === "door" || type === "driver" || type === "empty")
    ) {
      out.push({
        row: cell.row,
        col: cell.col,
        type,
        label: typeof cell.label === "string" ? cell.label : undefined,
      });
    }
  }
  return out;
}

/** A bookable seat must be of type "seat" and carry a label. */
export function seatLabel(cell: SeatCell, fallbackIndex: number): string {
  return cell.label ?? String(fallbackIndex + 1);
}

export const seatKeyFor = (tripInstanceId: string, label: string) => `${tripInstanceId}_${label}`;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

function randomCode(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

/** Booking reference: CP-XXXXXX */
export const makeReference = () => `CP-${randomCode(6)}`;

/** Opaque per-ticket QR token. */
export const makeQrToken = () => `${randomCode(8)}${randomCode(8)}${Date.now().toString(36).toUpperCase()}`;

/** yyyy-mm-dd for a Date. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

/** "19 juin 2026" from yyyy-mm-dd. */
export function fmtDateKey(key: string): string {
  const parts = key.split("-");
  if (parts.length !== 3) return key;
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  if (Number.isNaN(m) || Number.isNaN(d) || m < 0 || m > 11) return key;
  return `${d} ${MONTHS_FR[m]} ${y}`;
}

/** "06:00" from an epoch-ms / ISO date value. */
export function fmtTime(value: number | string | undefined | null): string {
  if (value == null) return "--:--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--:--";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** mm:ss countdown from a millisecond remainder. */
export function fmtCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const HOLD_DURATION_MS = 5 * 60 * 1000;

export type BadgeTone = "neutral" | "success" | "warning" | "danger";

/** French label + badge tone for a booking status. */
export function bookingStatusFr(status: string): { label: string; tone: BadgeTone } {
  switch (status) {
    case "paid":
    case "succeeded":
      return { label: "Payé", tone: "success" };
    case "confirmed":
      return { label: "Confirmé", tone: "success" };
    case "pending":
      return { label: "À payer à bord", tone: "warning" };
    case "cancelled":
      return { label: "Annulé", tone: "danger" };
    case "expired":
      return { label: "Expiré", tone: "danger" };
    case "failed":
      return { label: "Échoué", tone: "danger" };
    case "refunded":
      return { label: "Remboursé", tone: "neutral" };
    case "partially_refunded":
      return { label: "Remb. partiel", tone: "neutral" };
    case "completed":
      return { label: "Terminé", tone: "neutral" };
    default:
      // Fallback: capitalize the raw value instead of showing a bare english key.
      return { label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "—", tone: "neutral" };
  }
}
