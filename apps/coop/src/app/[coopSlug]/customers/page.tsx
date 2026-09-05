"use client";
import { useMemo, useState } from "react";
import { ChevronRight, Users, Wallet, Star, Phone, Search } from "lucide-react";
import {
  DashboardShell, coopNav, useCoop, db,
  Card, KpiCard, Drawer, Badge, DataTable, FilterBar,
  fmtMoney, fmtDate, fmtDateTime, notDeleted,
  type Column, type Tone,
} from "@cp/ui";
import { Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@cp/ui/shadcn";

type Customer = {
  key: string; name: string; phone: string; trips: number; spent: number;
  last: any; bookings: any[]; first: number;
};

const TIERS: { key: string; label: string; min: number; tone: Tone }[] = [
  { key: "platinum", label: "Platine", min: 500_000, tone: "success" },
  { key: "gold", label: "Or", min: 200_000, tone: "warning" },
  { key: "silver", label: "Argent", min: 50_000, tone: "neutral" },
  { key: "basic", label: "Base", min: 0, tone: "neutral" },
];
const tierOf = (spent: number) => TIERS.find((t) => spent >= t.min) ?? TIERS[TIERS.length - 1]!;

export default function CustomersPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const [search, setSearch] = useState("");
  const [tierF, setTierF] = useState("all");
  const [selKey, setSelKey] = useState<string | null>(null);

  const { data, isLoading } = db.useQuery({
    bookings: { $: { where: { "cooperative.id": coopId }, order: { createdAt: "desc" } }, tripInstance: {} },
  });
  const bookings = (data?.bookings ?? []).filter(notDeleted);

  const customers = useMemo(() => {
    const m = new Map<string, Customer>();
    for (const b of bookings) {
      const key = String(b.contactPhone || b.contactName || b.id).trim();
      const ca = +new Date(b.createdAt);
      const live = b.status !== "cancelled" && b.status !== "refunded";
      const e: Customer = m.get(key) ?? { key, name: b.contactName ?? "—", phone: b.contactPhone ?? "—", trips: 0, spent: 0, last: b, bookings: [], first: ca };
      e.bookings.push(b);
      if (live) { e.trips += 1; e.spent += b.totalAmount ?? 0; }
      if (ca > +new Date(e.last.createdAt)) e.last = b;
      if (ca < e.first) e.first = ca;
      if (b.contactName && e.name === "—") e.name = b.contactName;
      m.set(key, e);
    }
    return Array.from(m.values()).sort((a, b) => b.spent - a.spent);
  }, [bookings]);

  const now = Date.now();
  const newCount = customers.filter((c) => now - c.first < 30 * 86400_000).length;
  const loyal = customers.filter((c) => c.trips >= 3).length;
  const avgSpent = customers.length ? Math.round(customers.reduce((s, c) => s + c.spent, 0) / customers.length) : 0;

  const rows = customers.filter((c) => {
    if (tierF !== "all" && tierOf(c.spent).key !== tierF) return false;
    if (search) { const q = search.toLowerCase(); if (!`${c.name} ${c.phone}`.toLowerCase().includes(q)) return false; }
    return true;
  });

  const selected = selKey ? customers.find((c) => c.key === selKey) : null;

  const columns: Column<any>[] = [
    {
      key: "client",
      header: "Client",
      render: (c) => (
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-strong text-sm font-bold text-white">
            {(c.name?.[0] ?? "?").toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{c.name}</p>
            <p className="font-mono text-[11px] text-ink-soft/60">{fmtMoney(c.spent)} cumulé</p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (c) => <span className="inline-flex items-center gap-1.5 text-ink-soft"><Phone size={13} /> {c.phone}</span>,
    },
    {
      key: "trips",
      header: "Trajets",
      render: (c) => <span className="font-display text-base font-bold text-ink">{c.trips}</span>,
    },
    {
      key: "last",
      header: "Dernier trajet",
      render: (c) => (
        <div className="text-ink-soft">
          {c.last?.tripInstance ? `${c.last.tripInstance.originName} → ${c.last.tripInstance.destName}` : "—"}
          <span className="block text-[11px] text-ink-soft/55">{fmtDate(c.last.createdAt)}</span>
        </div>
      ),
    },
    {
      key: "tier",
      header: "Niveau",
      render: (c) => {
        const t = tierOf(c.spent);
        return <Badge tone={t.tone}>{t.label}</Badge>;
      },
    },
  ];

  return (
    <DashboardShell
      nav={coopNav(slug, "customers", { role, permissions, isPlatformAdmin })}
      title="Clients"
      subtitle="Relations, fidélité et historique de voyage."
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={<><span>{coop.displayName}</span><ChevronRight size={12} /><span className="text-ink">Clients</span></>}
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total clients" value={String(customers.length)} icon={<Users size={18} />} />
        <KpiCard label="Nouveaux (30j)" value={String(newCount)} trend="30 derniers jours" trendDir="up" />
        <KpiCard label="Dépense moyenne" value={fmtMoney(avgSpent)} icon={<Wallet size={18} />} />
        <KpiCard label="Clients fidèles" value={String(loyal)} pill={{ text: "≥ 3 trajets", tone: "neutral" }} icon={<Star size={18} />} />
      </div>

      <FilterBar>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom ou téléphone…" className="h-9 w-64 pl-9" />
        </div>
        <Select value={tierF} onValueChange={setTierF}>
          <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Tous niveaux" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous niveaux</SelectItem>
            {TIERS.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows.map((c) => ({ ...c, id: c.key }))}
        loading={isLoading}
        onRowClick={(c) => setSelKey(c.key)}
        empty={
          <span className="inline-flex flex-col items-center gap-2 text-ink-soft/60">
            <Users size={28} className="text-ink-soft/30" />
            Aucun client.
          </span>
        }
      />

      <Drawer
        open={!!selected}
        onClose={() => setSelKey(null)}
        eyebrow={selected ? selected.phone : undefined}
        title={selected?.name ?? "Client"}
        width="max-w-md"
      >
        {selected && (
          <div className="space-y-5">
            <Card className="flex items-center gap-3 p-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-strong text-lg font-bold text-white ring-4 ring-ink/10">
                {(selected.name?.[0] ?? "?").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-bold text-ink">{selected.name}</p>
                <p className="text-xs text-ink-soft">Client depuis {fmtDate(selected.first)}</p>
              </div>
              {(() => { const t = tierOf(selected.spent); return <Badge tone={t.tone}>{t.label}</Badge>; })()}
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft/55">Trajets</p><p className="mt-1 font-display text-2xl font-extrabold text-ink">{selected.trips}</p></Card>
              <Card className="p-4"><p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft/55">Valeur vie</p><p className="mt-1 font-display text-2xl font-extrabold text-ink">{fmtMoney(selected.spent)}</p></Card>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-ink-soft">Historique récent</p>
              <div className="grid gap-2">
                {selected.bookings.slice(0, 8).map((b: any) => {
                  const bs: Tone = b.status === "paid" ? "success" : b.status === "cancelled" || b.status === "refunded" ? "danger" : "warning";
                  return (
                    <div key={b.id} className="flex items-center justify-between rounded-xl border border-ink/8 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{b.tripInstance ? `${b.tripInstance.originName} → ${b.tripInstance.destName}` : b.reference}</p>
                        <p className="font-mono text-[11px] text-ink-soft/60">#{b.reference} · {fmtDateTime(b.createdAt)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{fmtMoney(b.totalAmount)}</span>
                        <Badge tone={bs}>{b.status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </DashboardShell>
  );
}
