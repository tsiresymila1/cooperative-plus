import { create } from "zustand";
import { persist } from "zustand/middleware";

type Draft = {
  instanceId: string | null;
  coopId: string | null;
  price: number;
  currency: string;
  origin: string;
  dest: string;
  departureAt: number;
  seats: string[];               // selected seat labels (local, pre-hold)
  holds: Record<string, string>; // seatLabel -> holdId (after reserve)
  setTrip: (t: { instanceId: string; coopId: string; price: number; currency: string; origin: string; dest: string; departureAt: number }) => void;
  toggleSeat: (label: string) => void;
  setHolds: (holds: Record<string, string>) => void;
  reset: () => void;
};

const empty = { instanceId: null, coopId: null, price: 0, currency: "MGA", origin: "", dest: "", departureAt: 0, seats: [], holds: {} };

export const useBookingDraft = create<Draft>()(
  persist(
    (set) => ({
      ...empty,
      setTrip: (t) => set((s) => (s.instanceId === t.instanceId ? { ...s, ...t } : { ...empty, ...t })),
      toggleSeat: (label) => set((s) => ({
        seats: s.seats.includes(label) ? s.seats.filter((x) => x !== label) : [...s.seats, label],
      })),
      setHolds: (holds) => set({ holds }),
      reset: () => set({ ...empty }),
    }),
    { name: "cp-booking-draft" },
  ),
);
