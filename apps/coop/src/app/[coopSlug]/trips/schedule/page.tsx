"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, List, CalendarPlus, Users, CalendarClock, Bus, ArrowRight, ExternalLink, Activity, Calendar } from "lucide-react";
import {
  DashboardShell, coopNav, useCoop, db,
  Button, Card, Badge, KpiCard, Drawer, PageSkeleton,
  fmtTime, fmtMoney, fmtDateTime, tripStatus, toast, notDeleted,
} from "@cp/ui";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@cp/ui/shadcn";

const STATUSES = ["scheduled", "boarding", "departed", "arrived", "cancelled"];

type View = "day" | "week" | "month";
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const WD = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WD_LONG = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const dk = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const wdIdx = (d: Date) => (d.getDay() + 6) % 7; // Monday = 0
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d: Date) => addDays(d, -wdIdx(d));

const chipBg: Record<string, string> = {
  scheduled: "bg-strong text-white",
  boarding: "bg-laterite text-white",
  departed: "bg-sky text-white",
  arrived: "bg-success text-white",
  cancelled: "bg-ink/[.06] text-ink-soft line-through",
};

export default function SchedulePage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const now = new Date();
  const [view, setView] = useState<View>("day");
  const [cursor, setCursor] = useState<Date>(now);
  const todayKey = dk(now);

  const { data, isLoading } = db.useQuery({
    tripInstances: { $: { where: { "cooperative.id": coopId } }, tickets: {} },
  });
  const instances = (data?.tripInstances ?? []).filter(notDeleted);

  const [selId, setSelId] = useState<string | null>(null);
  const selected = selId ? instances.find((t: any) => t.id === selId) : null;
  const openTrip = (t: any) => setSelId(t.id);
  const setStatus = async (id: string, next: string) => {
    try { await db.transact(db.tx.tripInstances[id].update({ status: next })); toast.success("Statut mis à jour"); }
    catch (e: any) { toast.error("Erreur: " + (e?.message ?? "inconnue")); }
  };

  const byDay = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const t of instances) {
      const k = t.departDate ?? dk(new Date(t.departureAt));
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(t);
    }
    for (const arr of m.values()) arr.sort((a, b) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime());
    return m;
  }, [instances]);

  const move = (dir: number) => setCursor((c) => view === "day" ? addDays(c, dir) : view === "week" ? addDays(c, dir * 7) : new Date(c.getFullYear(), c.getMonth() + dir, 1));
  const goToday = () => setCursor(now);

  // visible period → title + trips for KPIs
  const weekStart = startOfWeek(cursor);
  const title = view === "day"
    ? `${WD_LONG[wdIdx(cursor)]} ${cursor.getDate()} ${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
    : view === "week"
      ? `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]} – ${addDays(weekStart, 6).getDate()} ${MONTHS[addDays(weekStart, 6).getMonth()]} ${addDays(weekStart, 6).getFullYear()}`
      : `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const periodKeys = useMemo(() => {
    if (view === "day") return [dk(cursor)];
    if (view === "week") return Array.from({ length: 7 }, (_, i) => dk(addDays(weekStart, i)));
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => dk(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)));
  }, [view, cursor, weekStart]);
  const periodTrips = periodKeys.flatMap((k) => byDay.get(k) ?? []);
  const periodPax = periodTrips.reduce((s: number, t: any) => s + (t.tickets?.length ?? 0), 0);

  // month grid (6 weeks)
  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => { const date = addDays(start, i); return { date, key: dk(date), inMonth: date.getMonth() === cursor.getMonth() }; });
  }, [cursor]);

  const Chip = ({ t }: { t: any }) => {
    const booked = t.tickets?.length ?? 0;
    const ratio = t.seatsTotal ? booked / t.seatsTotal : 0;
    return (
      <button onClick={() => openTrip(t)}
        className={`block w-full rounded-md px-1.5 py-1 text-left transition-opacity hover:opacity-90 ${chipBg[t.status] ?? "bg-strong text-white"}`}>
        <span className="block truncate text-[10.5px] font-bold leading-tight">{fmtTime(t.departureAt)} · {t.originName}→{t.destName}</span>
        <span className="mt-0.5 block h-0.5 w-full overflow-hidden rounded-full bg-white/25">
          <span className="block h-full rounded-full bg-white/80" style={{ width: `${Math.max(8, ratio * 100)}%` }} />
        </span>
      </button>
    );
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "trips", { role, permissions, isPlatformAdmin })}
      title={title}
      subtitle="Calendrier des départs."
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={<><span>{coop.displayName}</span><ChevronRight size={12} /><span>Trajets</span><ChevronRight size={12} /><span className="text-ink">Calendrier</span></>}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-ink/12 bg-paper p-0.5">
            <button onClick={() => move(-1)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-ink/5"><ChevronLeft size={16} /></button>
            <button onClick={goToday} className="rounded-lg px-3 py-1.5 text-xs font-bold text-ink hover:bg-ink/5">Aujourd'hui</button>
            <button onClick={() => move(1)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-ink/5"><ChevronRight size={16} /></button>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-ink/[.04] p-1">
            {([["day", "Jour"], ["week", "Semaine"], ["month", "Mois"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setView(v)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${view === v ? "bg-paper text-ink shadow-sm" : "text-ink-soft/70 hover:text-ink"}`}>{l}</button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => router.push(`/${slug}/trips`)}><List size={16} /> Liste</Button>
          <Button size="sm" onClick={() => router.push(`/${slug}/trips/new`)}><Plus size={16} /> Nouveau</Button>
        </div>
      }
    >
      {isLoading ? (
        <PageSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
          <div className="xl:col-span-3">
            {view === "day" && <DayView trips={byDay.get(dk(cursor)) ?? []} onOpen={openTrip} isToday={dk(cursor) === todayKey} />}

            {view === "week" && (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                <div className="grid min-w-[44rem] grid-cols-7">
                  {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d, i) => {
                    const k = dk(d); const trips = byDay.get(k) ?? []; const isToday = k === todayKey;
                    return (
                      <div key={i} className={`min-h-[60vh] border-r border-ink/[.06] last:border-r-0 ${k === todayKey ? "bg-laterite/[.03]" : ""}`}>
                        <div className="border-b border-ink/8 bg-ink/[.02] px-2 py-2 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft/55">{WD[i]}</p>
                          <p className={`mt-0.5 inline-grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-sm font-bold ${isToday ? "bg-laterite text-white" : "text-ink"}`}>{d.getDate()}</p>
                        </div>
                        <div className="space-y-1 p-1.5">
                          {trips.length === 0 && <p className="px-1 pt-2 text-[10px] text-ink-soft/40">—</p>}
                          {trips.map((t: any) => <Chip key={t.id} t={t} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              </Card>
            )}

            {view === "month" && (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                <div className="min-w-[44rem]">
                <div className="grid grid-cols-7 border-b border-ink/8 bg-ink/[.02]">
                  {WD.map((d) => <div key={d} className="px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft/55">{d}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {monthCells.map((c, i) => {
                    const trips = byDay.get(c.key) ?? []; const isToday = c.key === todayKey;
                    return (
                      <div key={i} className={`min-h-[118px] border-b border-r border-ink/[.06] p-1.5 ${i % 7 === 6 ? "border-r-0" : ""} ${c.inMonth ? "" : "bg-ink/[.015]"}`}>
                        <div className="mb-1 flex justify-end">
                          <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold ${isToday ? "bg-laterite text-white" : c.inMonth ? "text-ink" : "text-ink-soft/40"}`}>{c.date.getDate()}</span>
                        </div>
                        <div className="space-y-1">
                          {trips.slice(0, 3).map((t: any) => <Chip key={t.id} t={t} />)}
                          {trips.length > 3 && <button onClick={() => { setView("day"); setCursor(c.date); }} className="px-1.5 text-[10px] font-semibold text-ink-soft/70 hover:text-ink">+{trips.length - 3} de plus</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
                </div>
              </Card>
            )}
          </div>

          {/* right rail */}
          <div className="space-y-5">
            <KpiCard label={view === "day" ? "Trajets du jour" : view === "week" ? "Trajets (semaine)" : "Trajets (mois)"} value={String(periodTrips.length)} icon={<CalendarClock size={18} />} />
            <KpiCard label="Passagers" value={String(periodPax)} icon={<Users size={18} />} />
            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold text-ink">Légende</p>
              <div className="space-y-2 text-sm text-ink-soft">
                {[["bg-strong", "Programmé"], ["bg-laterite", "Embarquement"], ["bg-sky", "Parti"], ["bg-success", "Arrivé"], ["bg-ink/20", "Annulé"]].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-2"><span className={`h-3 w-3 rounded ${c}`} />{l}</span>
                ))}
              </div>
            </Card>
            <Button variant="outline" className="w-full" onClick={() => router.push(`/${slug}/trips/recurring`)}>
              <CalendarPlus size={16} /> Trajet récurrent
            </Button>
          </div>
        </div>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelId(null)}
        eyebrow={selected ? fmtDateTime(selected.departureAt) : undefined}
        title="Détails du trajet"
        footer={selected && (
          <Button variant="outline" size="sm" onClick={() => router.push(`/${slug}/trips/${selected.id}`)}>
            <ExternalLink size={14} /> Fiche complète
          </Button>
        )}
      >
        {selected && (() => {
          const booked = selected.tickets?.length ?? 0;
          const ratio = selected.seatsTotal ? booked / selected.seatsTotal : 0;
          const c = ratio >= 1 ? "bg-danger" : ratio >= 0.8 ? "bg-laterite" : "bg-success";
          const st = tripStatus[selected.status] ?? { label: selected.status, tone: "neutral" as const };
          return (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                  {selected.originName} <ArrowRight size={15} className="text-laterite" /> {selected.destName}
                </p>
                <Badge tone={st.tone}>{st.label}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Fact icon={<Calendar size={14} />} label="Départ" value={fmtDateTime(selected.departureAt)} />
                <Fact icon={<Bus size={14} />} label="Véhicule" value={selected.vehicleName} />
                <Fact icon={<Activity size={14} />} label="Prix" value={fmtMoney(selected.price)} />
                <Fact icon={<Users size={14} />} label="Places libres" value={`${(selected.seatsTotal ?? 0) - booked}/${selected.seatsTotal}`} />
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/55">Occupation</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/[.08]">
                    <div className={`h-full rounded-full ${c}`} style={{ width: `${Math.max(5, ratio * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-ink tabular-nums">{Math.round(ratio * 100)}%</span>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/55">Statut</p>
                <Select value={selected.status} onValueChange={(v) => setStatus(selected.id, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{tripStatus[s]?.label ?? s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })()}
      </Drawer>
    </DashboardShell>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/55">{icon} {label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function DayView({ trips, onOpen, isToday }: { trips: any[]; onOpen: (t: any) => void; isToday: boolean }) {
  if (trips.length === 0) {
    return (
      <Card className="grid place-items-center p-16 text-center">
        <CalendarClock size={34} className="text-ink-soft/25" />
        <p className="mt-4 font-display text-lg font-bold text-ink">Aucun départ {isToday ? "aujourd'hui" : "ce jour"}</p>
        <p className="mt-1 text-sm text-ink-soft/70">Sélectionnez une autre date ou créez un trajet.</p>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {trips.map((t: any) => {
        const booked = t.tickets?.length ?? 0;
        const ratio = t.seatsTotal ? booked / t.seatsTotal : 0;
        const c = ratio >= 1 ? "bg-danger" : ratio >= 0.8 ? "bg-laterite" : "bg-success";
        const st = tripStatus[t.status] ?? { label: t.status, tone: "neutral" as const };
        return (
          <Card key={t.id} className="flex cursor-pointer items-center gap-5 p-4 transition-colors hover:border-ink/15">
            <button onClick={() => onOpen(t)} className="flex flex-1 items-center gap-5 text-left">
              <div className="w-20 shrink-0 text-center">
                <p className="font-mono text-xl font-bold text-ink">{fmtTime(t.departureAt)}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft/55">départ</p>
              </div>
              <div className="h-12 w-px bg-ink/8" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-display text-base font-bold text-ink">
                  {t.originName} <ArrowRight size={14} className="text-laterite" /> {t.destName}
                </p>
                <p className="mt-1 inline-flex items-center gap-3 text-sm text-ink-soft">
                  <span className="inline-flex items-center gap-1.5"><Bus size={14} className="text-ink-soft/50" />{t.vehicleName}</span>
                  <span className="font-semibold text-ink">{fmtMoney(t.price)}</span>
                </p>
              </div>
              <div className="hidden w-40 shrink-0 md:block">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[.08]">
                    <div className={`h-full rounded-full ${c}`} style={{ width: `${Math.max(5, ratio * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-ink tabular-nums">{(t.seatsTotal ?? 0) - booked}/{t.seatsTotal}</span>
                </div>
              </div>
            </button>
            <Badge tone={st.tone}>{st.label}</Badge>
          </Card>
        );
      })}
    </div>
  );
}
