"use client";
import { motion } from "motion/react";
import { DoorOpen, CircleDot, User, Clock, Coffee, Bath } from "lucide-react";
import { cn } from "../lib/cn";

export type CellType = "seat" | "aisle" | "door" | "driver" | "empty";
export type Cell = { row: number; col: number; type: CellType; label?: string };

const SEAT = "h-11 w-11 rounded-xl border text-[11px] font-mono font-bold flex items-center justify-center transition-all";

/* ---------- Selector (customer / staff booking) ----------
 * occupied (taken): navy + person · reserved (held): orange + clock ·
 * selected: solid orange · available: light · onToggle picks/unpicks. */
export function SeatSelector({ layout, taken, held = [], selected, onToggle, max = 99 }: {
  layout: Cell[]; taken: string[]; held?: string[]; selected: string[]; onToggle: (label: string) => void; max?: number;
}) {
  const rows = Math.max(...layout.map((c) => c.row)) + 1;
  const cols = Math.max(...layout.map((c) => c.col)) + 1;
  const at = (r: number, c: number) => layout.find((x) => x.row === r && x.col === c);

  return (
    <div className="inline-block">
      {/* Cabin shell */}
      <div className="relative rounded-[10px] border border-ink/12 bg-gradient-to-b from-paper to-sand-deep/40 p-5 pt-4 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
        {/* nose / driver row */}
        <div className="mb-4 flex items-center justify-between border-b border-dashed border-ink/12 pb-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink/[.05] text-ink-soft/60"><Coffee size={16} /></span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft/50">
            <CircleDot size={13} /> Conducteur
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex gap-2">
              {Array.from({ length: cols }).map((_, c) => {
                const cell = at(r, c);
                if (!cell || cell.type === "empty") return <div key={c} className="h-11 w-11" />;
                if (cell.type === "aisle") return <div key={c} className="grid h-11 w-11 place-items-center text-ink-soft/25">·</div>;
                if (cell.type === "driver") return <div key={c} className={cn(SEAT, "border-ink/15 bg-ink/5 text-ink-soft")}><CircleDot size={16} /></div>;
                if (cell.type === "door") return <div key={c} className={cn(SEAT, "border-dashed border-sky/40 text-sky/70")}><DoorOpen size={16} /></div>;
                const label = cell.label!;
                const isTaken = taken.includes(label);
                const isHeld = !isTaken && held.includes(label);
                const isSel = selected.includes(label);
                const disabled = isTaken || isHeld || (!isSel && selected.length >= max);
                return (
                  <motion.button key={c} whileTap={disabled ? undefined : { scale: 0.88 }} disabled={disabled}
                    onClick={() => onToggle(label)} title={`Siège ${label}`}
                    className={cn(SEAT,
                      isTaken ? "cursor-not-allowed border-ink bg-ink text-white"
                        : isHeld ? "cursor-not-allowed border-laterite bg-laterite text-white"
                          : isSel ? "border-laterite bg-laterite text-white"
                            : "border-ink/12 bg-paper text-ink-soft hover:border-laterite/60 hover:bg-laterite/[.06] hover:text-ink")}>
                    {isTaken ? <User size={15} /> : isHeld ? <Clock size={15} /> : label}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>

        {/* amenities footer */}
        <div className="mt-4 flex items-center justify-between border-t border-dashed border-ink/12 pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft/45">
          <span className="flex items-center gap-1.5"><Bath size={13} /> Lavabo</span>
          <span className="flex items-center gap-1.5"><Coffee size={13} /> Office</span>
        </div>
      </div>
      <Legend />
    </div>
  );
}

function Legend() {
  const items = [
    ["border-ink/12 bg-paper", "Libre"],
    ["border-laterite bg-laterite", "Choisi / réservé"],
    ["border-ink bg-ink", "Occupé"],
  ] as const;
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-medium text-ink-soft">
      {items.map(([cls, label]) => (
        <span key={label} className="flex items-center gap-1.5"><span className={cn("h-4 w-4 rounded-md border", cls)} />{label}</span>
      ))}
    </div>
  );
}

/* ---------- Editor (owner / vehicles) ---------- */
const PALETTE: CellType[] = ["seat", "aisle", "door", "driver", "empty"];
export function SeatEditor({ layout, onChange }: { layout: Cell[]; onChange: (l: Cell[]) => void }) {
  const rows = Math.max(...layout.map((c) => c.row)) + 1;
  const cols = Math.max(...layout.map((c) => c.col)) + 1;
  const at = (r: number, c: number) => layout.find((x) => x.row === r && x.col === c);

  const cycle = (cell: Cell) => {
    const next = PALETTE[(PALETTE.indexOf(cell.type) + 1) % PALETTE.length]!;
    let seatN = 0;
    const updated = layout.map((x) => (x.row === cell.row && x.col === cell.col ? { ...x, type: next } : x));
    // relabel seats sequentially
    const relabel = updated.map((x) => x.type === "seat" ? { ...x, label: `${++seatN}` } : { ...x, label: undefined });
    onChange(relabel);
  };
  const seatCount = layout.filter((c) => c.type === "seat").length;

  return (
    <div>
      <div className="inline-block rounded-2xl border border-ink/10 bg-sand-deep/40 p-4">
        <div className="flex flex-col gap-2">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex gap-2">
              {Array.from({ length: cols }).map((_, c) => {
                const cell = at(r, c)!;
                const styles: Record<CellType, string> = {
                  seat: "border-baobab/40 bg-baobab/10 text-baobab",
                  aisle: "border-dashed border-ink/15 text-ink-soft/40",
                  door: "border-dashed border-sky/40 text-sky",
                  driver: "border-ink/20 bg-ink/5 text-ink-soft",
                  empty: "border-ink/5 bg-transparent text-ink-soft/20",
                };
                return (
                  <button key={c} onClick={() => cycle(cell)} className={cn(SEAT, styles[cell.type])}>
                    {cell.type === "seat" ? cell.label : cell.type === "driver" ? <CircleDot size={15} /> : cell.type === "door" ? <DoorOpen size={15} /> : cell.type === "aisle" ? "·" : "+"}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-soft">Cliquez une case pour changer son type · <span className="font-semibold text-ink">{seatCount} sièges</span></p>
    </div>
  );
}

/** Build a default rows×cols layout (2+aisle+1 minibus style). */
export function buildLayout(rows: number, cols: number): Cell[] {
  const cells: Cell[] = [];
  let n = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const type: CellType = r === 0 && c === cols - 1 ? "driver" : "seat";
      cells.push({ row: r, col: c, type, label: type === "seat" ? `${++n}` : undefined });
    }
  return cells;
}
