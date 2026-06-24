"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, ArrowRightLeft, Bus, Calendar, Clock, MapPin, Search, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, CoopLogo, Spinner, TagBadge, cn, db, fmtMoney, notDeleted } from "@cp/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

function toDate(s: string | null) {
  if (!s) return new Date();
  const d = new Date(s + "T00:00:00");
  return isNaN(+d) ? new Date() : d;
}
// local Y-M-D (NOT toISOString — that shifts to UTC and breaks the day in +03:00)
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function SearchInner() {
  const sp = useSearchParams();
  const [from, setFrom] = useState(sp.get("from") || "Antananarivo");
  const [to, setTo] = useState(sp.get("to") || "Mahajanga");
  const [date, setDate] = useState<Date | undefined>(toDate(sp.get("date")));
  const [pax, setPax] = useState(Number(sp.get("pax")) || 1);
  const [sort, setSort] = useState<"depart" | "price" | "seats">("depart");

  // destination options (real, from DB)
  const { data: destData } = db.useQuery({ destinations: { $: { where: { isGlobal: true }, order: { name: "asc" } } } });
  // Dedupe by name — duplicate destination records would otherwise show twice
  // and both match the same Select value (concatenated label + double check).
  const cities = [...new Set((destData?.destinations ?? []).filter(notDeleted).map((d) => d.name))];

  const dk = date ? dateKey(date) : "";
  // live results react to from/to/date
  const { data, isLoading } = db.useQuery({
    tripInstances: {
      $: { where: { originName: from, destName: to, departDate: dk, status: "scheduled" }, order: { departureAt: "asc" } },
      route: {}, cooperative: {}, tickets: {}, holds: {}, tag: {},
    },
  });

  const now = Date.now();
  const results = useMemo(() => {
    const rows = (data?.tripInstances ?? [])
      .filter((t) => (t.cooperative as any)?.subscriptionStatus !== "suspended")
      .map((t) => {
        const held = (t.holds ?? []).filter((h) => +new Date(h.expiresAt) > now).length;
        const taken = (t.tickets ?? []).length + held;
        return { ...t, avail: Math.max(0, t.seatsTotal - taken) };
      }).filter((t) => t.avail >= pax);
    return [...rows].sort((a, b) =>
      sort === "price" ? a.price - b.price
        : sort === "seats" ? b.avail - a.avail
          : +new Date(a.departureAt) - +new Date(b.departureAt));
  }, [data, pax, sort, now]);

  const swap = () => { setFrom(to); setTo(from); };

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="mb-5 font-display text-3xl font-bold">Rechercher un trajet</h1>

      {/* Search panel — same controls as home */}
      <Card className="p-2.5">
        <div className="flex flex-col gap-1 md:flex-row md:items-stretch">
          <Cell label="Départ" icon={<MapPin size={15} />}>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-base font-semibold shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
              <SelectContent>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Cell>
          <div className="relative flex items-center justify-center md:w-0">
            <button onClick={swap} aria-label="Inverser"
              className="z-10 grid h-10 place-items-center  border-ink/12 bg-paper text-ink-soft transition-all hover:rotate-180 hover:border-orange hover:text-orange">
              <ArrowRightLeft size={14} />
            </button>
          </div>
          <Cell label="Arrivée" icon={<MapPin size={15} className="text-orange" />}>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-base font-semibold shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
              <SelectContent>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Cell>
          <div className="mx-1 hidden w-px self-center bg-ink/8 md:block md:h-10" />
          <Cell label="Date">
            <DatePicker value={date} onChange={setDate} className="h-7 border-0 p-0 text-base font-semibold shadow-none focus:ring-0" />
          </Cell>
          <div className="mx-1 hidden w-px self-center bg-ink/8 md:block md:h-10" />
          <Cell label="Voyageurs" icon={<Users size={15} />}>
            <input type="number" min={1} max={20} value={pax} onChange={(e) => setPax(Math.max(1, +e.target.value))}
              className="h-7 w-full bg-transparent text-base font-semibold text-ink outline-none" />
          </Cell>
        </div>
      </Card>

      {/* Results header */}
      <div className="mb-3 mt-7 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {isLoading ? "Recherche…" : `${results.length} trajet${results.length > 1 ? "s" : ""} · ${from} → ${to}`}
        </p>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="depart">Heure de départ</SelectItem>
            <SelectItem value="price">Prix croissant</SelectItem>
            <SelectItem value="seats">Places disponibles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-ink/5" />)}</div>
      ) : results.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center">
          <Search className="text-ink-soft/40" />
          <p className="font-display text-lg font-bold">Aucun trajet</p>
          <p className="text-sm text-ink-soft">Essayez une autre date ou destination.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative">
              {(t as any).tag && (
                <div className="absolute -top-2 right-4 z-20">
                  <TagBadge name={(t as any).tag.name} color={(t as any).tag.color} className="shadow-md" />
                </div>
              )}
              <Card className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <CoopLogo url={t.cooperative?.logoUrl} name={t.coopName} size={44} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{t.coopName}</p>
                    <p className="flex items-center gap-1.5 text-xs text-ink-soft/70"><Bus size={12} /> {t.vehicleName}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-2">
                    <span className="font-mono flex gap-1 font-display text-sm font-bold leading-none"><Calendar size={13} />{new Date(t.departureAt).toLocaleDateString("fr")}</span>
                      <p className="mt-1.5 flex items-center gap-1 text-sm font-bold leading-none"><Clock size={13} />{new Date(t.departureAt).toLocaleTimeString("fr", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <Badge tone={t.avail <= 3 ? "warning" : "success"}>{t.avail} place{t.avail > 1 ? "s" : ""}</Badge>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-ink/8 pt-4">
                  <span className="font-mono text-md font-bold">{fmtMoney(t.price)}</span>
                  <Link href={`/trips/${t.id}`}><Button size="sm">Choisir <ArrowRight size={16} /></Button></Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}

function Cell({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex-1 cursor-pointer rounded-xl px-4 py-3 transition-colors hover:bg-ink/[.025]">
      <span className={cn("flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60")}>{icon}{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function SearchPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<div className="grid place-items-center px-5 py-20"><Spinner size={28} /></div>}>
        <SearchInner />
      </Suspense>
    </>
  );
}
