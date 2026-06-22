"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wallet, Undo2, ChevronRight } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Button,
  Badge,
  DataTable,
  FilterBar,
  type Column,
  fmtMoney,
  fmtDate,
  paymentStatus,
} from "@cp/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DatePicker,
} from "@cp/ui/shadcn";

const dKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const METHODS = ["cash", "mobile_money", "card", "bank_transfer"];
const METHOD_LABEL: Record<string, string> = {
  cash: "Espèces",
  mobile_money: "Mobile money",
  card: "Carte",
  bank_transfer: "Virement",
};
const STATUSES = ["pending", "paid", "succeeded", "failed", "refunded", "partially_refunded"];

export default function PaymentsPage() {
  const { coopId, slug, coop } = useCoop();
  const router = useRouter();

  const { data, isLoading } = db.useQuery({
    payments: { $: { where: { "cooperative.id": coopId } }, booking: {}, refunds: {} },
  });

  const all = data?.payments ?? [];

  const [methodF, setMethodF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [dateF, setDateF] = useState("");

  const rows = useMemo(() => {
    return all
      .filter((p: any) => {
        if (methodF !== "all" && p.method !== methodF) return false;
        if (statusF !== "all" && p.status !== statusF) return false;
        if (dateF) {
          const d = new Date(p.createdAt).toISOString().slice(0, 10);
          if (d !== dateF) return false;
        }
        return true;
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [all, methodF, statusF, dateF]);

  const columns: Column<any>[] = [
    { key: "date", header: "Date", render: (r) => fmtDate(r.createdAt) },
    { key: "amount", header: "Montant", render: (r) => <span className="font-semibold">{fmtMoney(r.amount)}</span> },
    { key: "method", header: "Méthode", render: (r) => METHOD_LABEL[r.method] ?? r.method },
    { key: "ref", header: "Réf. réservation", render: (r) => r.booking?.reference ?? "—" },
    {
      key: "status",
      header: "Statut",
      render: (r) => {
        const s = paymentStatus[r.status] ?? { label: r.status, tone: "neutral" as const };
        return <Badge tone={s.tone}>{s.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.status === "paid" || r.status === "succeeded" ? (
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => router.push(`/${slug}/payments/${r.id}/refund`)}>
              <Undo2 size={14} /> Rembourser
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <DashboardShell
      nav={coopNav(slug, "payments")}
      title="Paiements"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span className="text-ink">Paiements</span>
        </>
      }
      action={
        <Button size="sm" onClick={() => router.push(`/${slug}/payments/new`)}>
          <Plus size={16} /> Enregistrer un paiement
        </Button>
      }
    >
      <FilterBar>
        <Select value={methodF} onValueChange={setMethodF}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="Toutes méthodes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes méthodes</SelectItem>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {METHOD_LABEL[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {paymentStatus[s]?.label ?? s}
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
        empty={
          <span className="inline-flex flex-col items-center gap-2 text-ink-soft/60">
            <Wallet size={28} className="text-ink-soft/30" />
            Aucun paiement.
          </span>
        }
      />
    </DashboardShell>
  );
}
