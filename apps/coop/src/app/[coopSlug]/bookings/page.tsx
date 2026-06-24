"use client";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Ticket, ArrowRight, ChevronRight, ExternalLink, Check, CheckCircle2, Wallet, XCircle, Phone, MapPin, Calendar, Armchair } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Button,
  Badge,
  TagBadge,
  Card,
  Drawer,
  DataTable,
  FilterBar,
  useConfirm,
  toast,
  type Column,
  fmtMoney,
  fmtDate,
  fmtDateTime,
  fmtTime,
  bookingStatus,
  notDeleted,
} from "@cp/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
  DatePicker,
} from "@cp/ui/shadcn";

const dKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const STATUSES = ["pending", "confirmed", "paid", "cancelled", "refunded", "expired"];

export default function BookingsPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const confirm = useConfirm();

  const setStatus = async (id: string, status: string, extra: Record<string, any> = {}) => {
    try {
      await db.transact(db.tx.bookings[id].update({ status, ...extra }));
      toast.success("Réservation mise à jour");
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  };

  const confirmBooking = async (b: any) => {
    if (await confirm({ title: "Confirmer la réservation ?", message: `${b.reference} · ${fmtMoney(b.totalAmount)}`, confirmLabel: "Confirmer" }))
      await setStatus(b.id, "confirmed");
  };
  const markPaid = async (b: any) => {
    if (await confirm({ title: "Marquer comme payé ?", message: `${b.reference} · ${fmtMoney(b.totalAmount)}`, confirmLabel: "Marquer payé" }))
      await setStatus(b.id, "paid");
  };
  const cancelBooking = async (b: any) => {
    if (await confirm({ title: "Annuler la réservation ?", message: `${b.reference} · ${fmtMoney(b.totalAmount)}`, confirmLabel: "Annuler", tone: "danger" }))
      await setStatus(b.id, "cancelled", { cancelledAt: Date.now() });
  };
  const checkIn = async (ticketId: string, current?: number) => {
    await db.transact(db.tx.tickets[ticketId].update({ checkedInAt: current ? undefined : Date.now() }));
    toast.success(current ? "Pointage annulé" : "Passager enregistré");
  };

  const [selId, setSelId] = useState<string | null>(null);

  const { data, isLoading } = db.useQuery({
    bookings: {
      $: { where: { "cooperative.id": coopId } },
      tripInstance: { tag: {} },
      tickets: {},
      payments: {},
    },
  });

  const all = (data?.bookings ?? []).filter(notDeleted);
  const selected = selId ? all.find((b: any) => b.id === selId) : null;

  const sp = useSearchParams();
  const [search, setSearch] = useState(sp.get("q") ?? "");
  const [statusF, setStatusF] = useState("all");
  const [dateF, setDateF] = useState("");

  const rows = useMemo(() => {
    return all
      .filter((b: any) => {
        if (statusF !== "all" && b.status !== statusF) return false;
        if (dateF) {
          const d = new Date(b.createdAt).toISOString().slice(0, 10);
          if (d !== dateF) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          if (!`${b.reference} ${b.contactPhone} ${b.contactName}`.toLowerCase().includes(q))
            return false;
        }
        return true;
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [all, statusF, dateF, search]);

  const columns: Column<any>[] = [
    { key: "ref", header: "Référence", render: (r) => <span className="font-mono font-semibold">{r.reference}</span> },
    { key: "contact", header: "Client", render: (r) => `${r.contactName} · ${r.contactPhone}` },
    {
      key: "trip",
      header: "Trajet",
      render: (r) =>
        r.tripInstance ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${slug}/trips/${r.tripInstance.id}`);
            }}
            className="inline-flex items-center gap-1.5 text-laterite transition-colors hover:underline"
          >
            {r.tripInstance.originName} <ArrowRight size={13} className="text-ink-soft/50" /> {r.tripInstance.destName}
            <ExternalLink size={12} className="text-laterite/70" />
            {r.tripInstance.tag && <TagBadge name={r.tripInstance.tag.name} color={r.tripInstance.tag.color} />}
          </button>
        ) : (
          "—"
        ),
    },
    { key: "seats", header: "Places", render: (r) => r.seatCount },
    { key: "amount", header: "Montant", render: (r) => fmtMoney(r.totalAmount) },
    {
      key: "status",
      header: "Statut",
      render: (r) => {
        const s = bookingStatus[r.status] ?? { label: r.status, tone: "neutral" as const };
        return <Badge tone={s.tone}>{s.label}</Badge>;
      },
    },
    { key: "date", header: "Créée", render: (r) => fmtDate(r.createdAt) },
    {
      key: "actions",
      header: "",
      render: (r) => {
        const done = r.status === "cancelled" || r.status === "refunded";
        return (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {r.status === "pending" && (
              <Button size="sm" variant="ghost" onClick={() => confirmBooking(r)} title="Confirmer">
                <Check size={14} /> Confirmer
              </Button>
            )}
            {!done && r.status !== "paid" && (
              <Button size="sm" variant="ghost" onClick={() => markPaid(r)} title="Marquer payé">
                <Wallet size={14} /> Payé
              </Button>
            )}
            {!done && (
              <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => cancelBooking(r)} title="Annuler">
                <XCircle size={14} /> Annuler
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DashboardShell
      nav={coopNav(slug, "bookings", { role, permissions, isPlatformAdmin })}
      title="Réservations"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span className="text-ink">Réservations</span>
        </>
      }
    >
      <FilterBar>
        <Input
          placeholder="Réf. ou téléphone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-56"
        />
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {bookingStatus[s]?.label ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DatePicker
          value={dateF ? new Date(dateF + "T00:00:00") : undefined}
          onChange={(d) => setDateF(d ? dKey(d) : "")}
          placeholder="Date"
          className="h-9 w-40"
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        onRowClick={(r) => setSelId(r.id)}
        empty={
          <span className="inline-flex flex-col items-center gap-2 text-ink-soft/60">
            <Ticket size={28} className="text-ink-soft/30" />
            Aucune réservation.
          </span>
        }
      />

      <Drawer
        open={!!selected}
        onClose={() => setSelId(null)}
        eyebrow={selected ? `#${selected.reference}` : undefined}
        title="Détails de la réservation"
        footer={
          selected && (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => router.push(`/${slug}/bookings/${selected.id}`)}>
                <ExternalLink size={14} /> Fiche complète
              </Button>
              <div className="ml-auto flex gap-2">
                {selected.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => confirmBooking(selected)}><Check size={14} /> Confirmer</Button>
                )}
                {selected.status !== "paid" && selected.status !== "cancelled" && selected.status !== "refunded" && (
                  <Button size="sm" onClick={() => markPaid(selected)}><Wallet size={14} /> Marquer payé</Button>
                )}
                {selected.status !== "cancelled" && selected.status !== "refunded" && (
                  <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => cancelBooking(selected)}>
                    <XCircle size={14} /> Annuler
                  </Button>
                )}
              </div>
            </div>
          )
        }
      >
        {selected && <BookingDrawerBody b={selected} checkIn={checkIn} />}
      </Drawer>
    </DashboardShell>
  );
}

function BookingDrawerBody({ b, checkIn }: { b: any; checkIn: (id: string, cur?: number) => void }) {
  const s = bookingStatus[b.status] ?? { label: b.status, tone: "neutral" as const };
  const tickets = b.tickets ?? [];
  const payments = b.payments ?? [];
  return (
    <div className="space-y-5">
      {/* passenger */}
      <Card className="flex items-center gap-3 p-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-strong text-base font-bold text-white">
          {(b.contactName?.[0] ?? "?").toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold text-ink">{b.contactName ?? "—"}</p>
          <p className="inline-flex items-center gap-1.5 text-sm text-ink-soft"><Phone size={13} /> {b.contactPhone ?? "—"}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge tone={s.tone}>{s.label}</Badge>
          {b.tripInstance?.tag && <TagBadge name={b.tripInstance.tag.name} color={b.tripInstance.tag.color} />}
        </div>
      </Card>

      {/* facts */}
      <div className="grid grid-cols-2 gap-4">
        <Fact icon={<MapPin size={14} />} label="Trajet" value={b.tripInstance ? `${b.tripInstance.originName} → ${b.tripInstance.destName}` : "—"} />
        <Fact icon={<Calendar size={14} />} label="Départ" value={b.tripInstance ? fmtDateTime(b.tripInstance.departureAt) : "—"} />
        <Fact icon={<Armchair size={14} />} label="Places" value={String(b.seatCount ?? tickets.length)} />
        <Fact icon={<Wallet size={14} />} label="Montant" value={fmtMoney(b.totalAmount)} />
      </div>

      {/* payment box */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-soft">Paiement</p>
          <Badge tone={b.status === "paid" ? "success" : "warning"}>{b.status === "paid" ? "Payé" : "En attente"}</Badge>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-ink/8 pt-3">
          <span className="font-display text-lg font-bold text-ink">Total</span>
          <span className="font-display text-lg font-bold text-ink tabular-nums">{fmtMoney(b.totalAmount)}</span>
        </div>
        {payments.length > 0 && (
          <p className="mt-1 text-xs text-ink-soft/70">{payments.length} paiement(s) · {payments.map((p: any) => p.method).join(", ")}</p>
        )}
      </Card>

      {/* tickets + check-in */}
      <div>
        <p className="mb-2 text-sm font-semibold text-ink-soft">Billets ({tickets.length})</p>
        <div className="grid gap-2">
          {tickets.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl border border-ink/8 px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-laterite/10 font-mono text-xs font-bold text-laterite">{t.seatLabel}</span>
                <span className="text-ink">{t.passengerName}</span>
              </span>
              {t.checkedInAt ? (
                <button onClick={() => checkIn(t.id, t.checkedInAt)} title="Annuler le pointage">
                  <Badge tone="success"><CheckCircle2 size={13} /> {fmtTime(t.checkedInAt)}</Badge>
                </button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => checkIn(t.id)}><Check size={14} /> Pointer</Button>
              )}
            </div>
          ))}
          {tickets.length === 0 && <p className="text-sm text-ink-soft">Aucun billet.</p>}
        </div>
      </div>

      {b.cancelledAt && (
        <p className="rounded-xl bg-danger/8 px-3 py-2 text-sm text-danger">Annulée le {fmtDateTime(b.cancelledAt)}</p>
      )}
    </div>
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
