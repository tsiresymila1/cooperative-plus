import { createContext, useContext, useState, type ReactNode } from "react";

export type HeldSeat = { holdId: string; seatLabel: string; seatKey: string };

export type Selection = {
  tripInstanceId: string;
  tripVehicleId?: string | null; // chosen vehicle slot (null = legacy mono-vehicle trip)
  coopName: string;
  routeName: string;
  originName: string;
  destName: string;
  departDate: string;
  departureAt: number | string | null;
  price: number;
  currency: string;
  cooperativeId?: string;
  seats: HeldSeat[];
  holdExpiresAt: number; // epoch ms
};

type Ctx = {
  selection: Selection | null;
  setSelection: (s: Selection | null) => void;
};

const SelectionContext = createContext<Ctx>({ selection: null, setSelection: () => {} });

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  return (
    <SelectionContext.Provider value={{ selection, setSelection }}>
      {children}
    </SelectionContext.Provider>
  );
}

export const useSelection = () => useContext(SelectionContext);
