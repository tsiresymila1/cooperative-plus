"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, ArrowRight, ChevronRight, ExternalLink } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Badge,
  DataTable,
  FilterBar,
  type Column,
  fmtMoney,
  fmtDate,
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
  const { coopId, slug, coop } = useCoop();
  const router = useRouter();

  const { data, isLoading } = db.useQuery({
    bookings: {
      $: { where: { "cooperative.id": coopId } },
      tripInstance: {},
      tickets: {},
      payments: {},
    },
  });

  const all = (data?.bookings ?? []).filter(notDeleted);

  const [search, setSearch] = useState("");
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
  ];

  return (
    <DashboardShell
      nav={coopNav(slug, "bookings")}
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
        onRowClick={(r) => router.push(`/${slug}/bookings/${r.id}`)}
        empty={
          <span className="inline-flex flex-col items-center gap-2 text-ink-soft/60">
            <Ticket size={28} className="text-ink-soft/30" />
            Aucune réservation.
          </span>
        }
      />
    </DashboardShell>
  );
}
