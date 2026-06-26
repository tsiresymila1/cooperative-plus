"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, ArrowLeft, Bus } from "lucide-react";
import { useCoop, db, FullSpinner, type Cell, fmtDateTime, fmtMoney, tripSlots, type Slot } from "@cp/ui";

const DEAD = ["cancelled", "expired", "refunded"];

export default function ManifestPage() {
  const { slug, coop, coopId } = useCoop();
  const params = useParams<{ id: string }>();
  const tripId = params.id;

  const { data, isLoading } = db.useQuery({
    tripInstances: {
      $: { where: { id: tripId, "cooperative.id": coopId } },
      tickets: { booking: {} },
      vehicle: { seatMaps: {} },
      route: {},
      tag: {},
      driver: {},
      vehicles: { tickets: { booking: {} }, driver: {}, vehicle: {} },
    },
  });
  const trip = data?.tripInstances?.[0];
  const slots = useMemo(() => (trip ? tripSlots(trip) : []), [trip]);

  // Which vehicle to print: a slot id, or "all". Defaults to the slot passed in
  // the `?vehicle=` param (the one selected on the trip detail), else first.
  const [sel, setSel] = useState<string>("");
  useEffect(() => {
    if (!slots.length) return;
    const want = new URLSearchParams(window.location.search).get("vehicle");
    if (want && slots.some((s) => s.id === want)) setSel(want);
    else if (!sel || (sel !== "all" && !slots.some((s) => s.id === sel))) setSel(slots[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  if (isLoading) return <FullSpinner />;
  if (!trip) return <div className="grid min-h-dvh place-items-center text-slate-500">Trajet introuvable.</div>;

  const shown = sel === "all" ? slots : slots.filter((s) => s.id === sel);

  return (
    <div className="min-h-dvh bg-slate-200 py-8 print:bg-white print:py-0">
      {/* toolbar (screen only) */}
      <div className="no-print mx-auto mb-5 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4">
        <a href={`/${slug}/trips/${tripId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900">
          <ArrowLeft size={16} /> Retour au trajet
        </a>
        {slots.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {slots.map((s) => (
              <button key={s.id} onClick={() => setSel(s.id)}
                className={s.id === sel
                  ? "inline-flex items-center gap-1.5 rounded-md bg-[#ff7a00] px-3 py-1.5 text-xs font-bold text-white"
                  : "inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"}>
                <Bus size={13} /> {s.label}
              </button>
            ))}
            <button onClick={() => setSel("all")}
              className={sel === "all"
                ? "rounded-md bg-[#0f2d5c] px-3 py-1.5 text-xs font-bold text-white"
                : "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"}>
              Toutes
            </button>
          </div>
        )}
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-[#0f2d5c] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Printer size={16} /> Imprimer{sel === "all" && slots.length > 1 ? ` (${slots.length} feuilles)` : ""}
        </button>
      </div>

      {/* A4 sheet(s): selected vehicle only, or all */}
      {shown.map((s, i) => (
        <VehicleSheet key={s.id} slot={s} trip={trip} coop={coop} index={i} count={shown.length} />
      ))}

      <style>{`@media print {
        @page { size: A4; margin: 12mm; }
        body { background: #fff; }
        .no-print { display: none !important; }
        thead { display: table-header-group; }
        tr { break-inside: avoid; }
        .avoid-break { break-inside: avoid; }
        .sheet-break { break-before: page; }
      }`}</style>
    </div>
  );
}

function VehicleSheet({ slot, trip, coop, index, count }: { slot: Slot; trip: any; coop: any; index: number; count: number }) {
  const tickets = (slot.tickets ?? []).filter((t: any) => !DEAD.includes(t.booking?.status));
  const bySeat = useMemo(() => {
    const m = new Map<string, any>();
    for (const t of tickets) m.set(t.seatLabel, t);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot]);

  // Slot seat map, with vehicle active map / trip snapshot as fallback (legacy virtual slot).
  const activeMap = (trip?.vehicle?.seatMaps ?? []).find((m: any) => m.isActive) ?? (trip?.vehicle?.seatMaps ?? [])[0];
  const layout: Cell[] = Array.isArray(slot.seatMapSnapshot) && slot.seatMapSnapshot.length
    ? (slot.seatMapSnapshot as Cell[])
    : Array.isArray(activeMap?.layout) ? (activeMap.layout as Cell[])
    : Array.isArray(trip?.seatMapSnapshot) ? (trip.seatMapSnapshot as Cell[]) : [];
  const rows = layout.length ? Math.max(...layout.map((c) => c.row)) + 1 : 0;
  const cols = layout.length ? Math.max(...layout.map((c) => c.col)) + 1 : 0;
  const at = (r: number, c: number) => layout.find((x) => x.row === r && x.col === c);
  const seatTickets = [...tickets].sort((a: any, b: any) => String(a.seatLabel).localeCompare(String(b.seatLabel), undefined, { numeric: true }));

  const driverName = slot.driver?.name ?? slot.driverName;
  const reg = slot.vehicle?.registrationNo ?? slot.registrationNo;
  const seatsTotal = slot.seatsTotal ?? 0;

  return (
    <div className={`mx-auto w-[210mm] bg-white p-[14mm] text-slate-900 shadow-lg print:w-auto print:p-0 print:shadow-none ${index > 0 ? "sheet-break mt-8 print:mt-0" : ""}`}>
      {/* header */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          {coop.logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={coop.logoUrl} alt="" className="h-12 w-12 rounded object-cover" />
            : <div className="grid h-12 w-12 place-items-center rounded bg-[#0f2d5c] text-sm font-bold text-white">CP</div>}
          <div>
            <p className="text-lg font-extrabold leading-tight">{coop.displayName}</p>
            <div className="flex items-center gap-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">Manifeste des passagers</p>
              {trip.tag && (
                <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white" style={{ backgroundColor: trip.tag.color || "#0f2d5c" }}>
                  {trip.tag.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-slate-600">
          <p className="font-mono">{fmtDateTime(trip.departureAt)}</p>
          <p>Émis le {fmtDateTime(Date.now())}</p>
          {count > 1 && <p className="mt-1 font-bold text-slate-800">Véhicule {index + 1} / {count}</p>}
        </div>
      </div>

      {/* trip facts */}
      <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
        <Fact label="Trajet" value={`${trip.originName} → ${trip.destName}`} />
        <Fact label="Véhicule" value={`${slot.label}${reg ? ` · ${reg}` : ""}`} />
        <Fact label="Prix" value={fmtMoney(trip.price)} />
        <Fact label="Occupation" value={`${seatTickets.length} / ${seatsTotal}`} />
      </div>

      {/* seat map */}
      {layout.length > 0 && (
        <div className="avoid-break mt-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Plan des sièges</p>
          <div className="inline-block rounded border border-slate-300 p-4">
            <div className="mb-2 flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-400">
              <span>Conducteur</span><span>↑ Avant</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-1.5">
                  {Array.from({ length: cols }).map((_, c) => {
                    const cell = at(r, c);
                    if (!cell || cell.type === "empty" || cell.type === "aisle") return <div key={c} className="h-12 w-16" />;
                    if (cell.type === "driver") return <div key={c} className="grid h-12 w-16 place-items-center rounded border border-slate-300 bg-slate-100 text-[9px] font-bold uppercase text-slate-400">Cond.</div>;
                    if (cell.type === "door") return <div key={c} className="grid h-12 w-16 place-items-center rounded border border-dashed border-slate-300 text-[9px] uppercase text-slate-400">Porte</div>;
                    const tk = bySeat.get(cell.label!);
                    return (
                      <div key={c} className={`flex h-12 w-16 flex-col justify-center rounded border px-1.5 ${tk ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}>
                        <span className="font-mono text-[10px] font-bold">{cell.label}</span>
                        {tk && <span className="truncate text-[8px] leading-tight text-slate-600">{tk.passengerName}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* passenger table */}
      <div className="mt-6">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Liste des passagers ({seatTickets.length})</p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="py-2 pr-2 w-8">#</th>
              <th className="py-2 pr-2 w-16">Siège</th>
              <th className="py-2 pr-2">Passager</th>
              <th className="py-2 pr-2">Téléphone</th>
              <th className="py-2 pr-2 w-24">Réf.</th>
              <th className="py-2 pr-2 w-24">Pointage</th>
              <th className="py-2 w-16 text-center">Signature</th>
            </tr>
          </thead>
          <tbody>
            {seatTickets.length === 0 ? (
              <tr><td colSpan={7} className="py-6 text-center text-slate-400">Aucun passager.</td></tr>
            ) : seatTickets.map((t: any, i: number) => (
              <tr key={t.id} className="border-b border-slate-200">
                <td className="py-2 pr-2 text-slate-400">{i + 1}</td>
                <td className="py-2 pr-2 font-mono font-bold">{t.seatLabel}</td>
                <td className="py-2 pr-2 font-medium">{t.passengerName}</td>
                <td className="py-2 pr-2 font-mono text-slate-600">{t.passengerPhone ?? "—"}</td>
                <td className="py-2 pr-2 font-mono text-[11px] text-slate-500">{t.booking?.reference ?? "—"}</td>
                <td className="py-2 pr-2 text-[11px] text-slate-600">{t.checkedInAt ? "✓ Pointé" : "☐"}</td>
                <td className="py-2" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* signature footer */}
      <div className="avoid-break mt-10 flex justify-between text-xs text-slate-500">
        <div>
          <p className="mb-6">Chauffeur: {driverName ?? "__________________________"}{slot.driver?.licenseNo ? ` (permis ${slot.driver.licenseNo})` : ""}</p>
          <p>Signature</p>
        </div>
        <div className="text-right">
          <p className="mb-6">Responsable: __________________________</p>
          <p>Signature & cachet</p>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}
