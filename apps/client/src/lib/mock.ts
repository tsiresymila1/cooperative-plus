import type { Cell } from "@cp/ui";

export type Trip = {
  id: string; from: string; to: string; depart: string; arrive: string; dur: string;
  price: number; coop: string; vehicle: string; seatsTotal: number; seatsTaken: number;
};

export const cities = ["Antananarivo", "Mahajanga", "Toamasina", "Fianarantsoa", "Antsirabe", "Toliara", "Morondava"];

export const trips: Trip[] = [
  { id: "t1", from: "Antananarivo", to: "Mahajanga", depart: "06:00", arrive: "14:00", dur: "8h", price: 35000, coop: "Kofmad", vehicle: "Mercedes 18 places", seatsTotal: 18, seatsTaken: 6 },
  { id: "t2", from: "Antananarivo", to: "Mahajanga", depart: "07:30", arrive: "15:30", dur: "8h", price: 30000, coop: "Soatrans", vehicle: "Bus 30 places", seatsTotal: 30, seatsTaken: 27 },
  { id: "t3", from: "Antananarivo", to: "Mahajanga", depart: "13:00", arrive: "21:00", dur: "8h", price: 32000, coop: "Trans Betsileo", vehicle: "Hiace 15 places", seatsTotal: 15, seatsTaken: 4 },
  { id: "t4", from: "Antananarivo", to: "Mahajanga", depart: "18:00", arrive: "02:00", dur: "8h", price: 40000, coop: "Kofmad", vehicle: "Mercedes 18 places (VIP)", seatsTotal: 18, seatsTaken: 11 },
];

export const tripById = (id: string) => trips.find((t) => t.id === id) ?? trips[0]!;

/** 18-seat minibus: 5 rows (last row 4), 2+aisle+1, driver front-right. */
export function sampleLayout(): Cell[] {
  const rows: Cell[][] = [];
  let n = 0;
  const seat = (): Cell => ({ row: 0, col: 0, type: "seat", label: `${++n}` });
  const aisle = (): Cell => ({ row: 0, col: 0, type: "aisle" });
  const driver = (): Cell => ({ row: 0, col: 0, type: "driver" });
  const layoutRows = [
    [seat(), aisle(), driver()],
    [seat(), seat(), aisle(), seat()],
    [seat(), seat(), aisle(), seat()],
    [seat(), seat(), aisle(), seat()],
    [seat(), seat(), aisle(), seat()],
    [seat(), seat(), seat(), seat()],
  ];
  layoutRows.forEach((row, r) => row.forEach((cell, c) => rows.push([{ ...cell, row: r, col: c }])));
  return rows.flat();
}

export const takenSeats = ["1", "4", "5", "9", "12", "15"];

export type Booking = { ref: string; route: string; date: string; seats: string[]; total: number; status: "confirmé" | "en attente" | "annulé"; coop: string };
export const myBookings: Booking[] = [
  { ref: "CP-7F3K9Q", route: "Tana → Mahajanga", date: "19 juin · 06:00", seats: ["3A", "3B"], total: 70000, status: "confirmé", coop: "Kofmad" },
  { ref: "CP-2M8X1P", route: "Tana → Toamasina", date: "22 juin · 07:30", seats: ["2C"], total: 30000, status: "en attente", coop: "Soatrans" },
  { ref: "CP-9Q4R7Z", route: "Antsirabe → Toliara", date: "10 juin · 13:00", seats: ["1A"], total: 60000, status: "annulé", coop: "Sud Express" },
];
