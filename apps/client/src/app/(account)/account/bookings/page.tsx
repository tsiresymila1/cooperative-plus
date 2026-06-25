"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Ticket, X } from "lucide-react";
import { Badge, Button, Card, CoopLogo, TagBadge, useConfirm, toast } from "@cp/ui";
import { db } from "@cp/ui";
import { fmtMoney } from "@cp/ui";

// Cancellable only while not yet paid (cash bookings sit in "pending").
async function cancelOwnBooking(b: any, confirm: ReturnType<typeof useConfirm>) {
  if (b.status !== "pending") return;
  if (!(await confirm({ title: "Annuler la réservation ?", message: `${b.reference} · ${fmtMoney(b.totalAmount)}`, confirmLabel: "Annuler", tone: "danger" }))) return;
  try {
    await db.transact([
      db.tx.bookings[b.id].update({ status: "cancelled", cancelledAt: Date.now() }),
      ...(b.tickets ?? []).map((t: any) => db.tx.tickets[t.id].delete()),
    ]);
    toast.success("Réservation annulée");
  } catch (e: any) {
    toast.error(e?.message ?? "Échec de l'annulation.");
  }
}

const tone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  confirmed: "success",
  paid: "success",
  pending: "warning",
  cancelled: "danger",
  refunded: "danger",
  expired: "neutral",
  completed: "neutral",
  no_show: "danger",
};
const label: Record<string, string> = {
  confirmed: "confirmé",
  paid: "payé",
  pending: "en attente",
  cancelled: "annulé",
  refunded: "remboursé",
  expired: "expiré",
  completed: "terminé",
  no_show: "absent",
};
const PAGE_SIZE = 8;

export default function Bookings() {
  const { user } = db.useAuth();
  const confirm = useConfirm();
  const { data, isLoading } = db.useQuery(
    user
      ? {
          bookings: {
            $: {
              where: { "customer.id": user.id },
              order: { createdAt: "desc" },
            },
            tickets: {},
            tripInstance: { cooperative: {}, tag: {} },
          },
        }
      : null,
  );
  const bookings = data?.bookings ?? [];
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const shown = bookings.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className=" space-y-3">
      <h1 className="font-display text-2xl font-bold">Mes réservations</h1>
      {isLoading ? (
        [0, 1].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink/5" />
        ))
      ) : bookings.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Ticket className="text-ink-soft/40" />
          <p className="font-display text-lg font-bold">Aucune réservation</p>
          <Link href="/search">
            <Button size="sm">Réserver un trajet</Button>
          </Link>
        </Card>
      ) : (
        <div className="gap-2 flex flex-col">
          {shown.map((b) => {
            const ti: any = b.tripInstance;
            const tg = Array.isArray(ti?.tag) ? ti.tag[0] : ti?.tag;
            return (
            <Link className="" key={b.id} href={`/bookings/${b.reference}`}>
              <Card className="flex items-center gap-4 p-5 transition-colors hover:bg-ink/[.02]">
                <CoopLogo url={b.tripInstance?.cooperative?.logoUrl} name={b.tripInstance?.coopName} size={44} className="border border-ink/10" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-ink">
                      {b.tripInstance?.coopName ?? "Cooperative Plus"}
                    </span>
                    {tg && <TagBadge name={tg.name} color={tg.color} />}
                  </div>
                  <p className="mt-1 font-display text-lg font-bold">
                    {b.tripInstance?.originName} → {b.tripInstance?.destName}
                  </p>
                  <p className="truncate text-sm text-ink-soft">
                    {b.tripInstance
                      ? new Date(b.tripInstance.departureAt).toLocaleString("fr", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                      : ""}
                    {" · "}sièges{" "}
                    {(b.tickets ?? []).map((t) => t.seatLabel).sort().join(", ")}
                    {" · "}
                    <span className="font-mono text-orange-deep">{b.reference}</span>
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge tone={tone[b.status] ?? "neutral"}>{label[b.status] ?? b.status}</Badge>
                  <div className="flex items-center gap-2">
                    {b.status === "pending" && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); cancelOwnBooking(b, confirm); }}
                        className="grid h-8 w-8 place-items-center rounded-full text-ink-soft/50 transition-colors hover:bg-danger/10 hover:text-danger"
                        title="Annuler la réservation"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <p className="font-mono text-lg font-bold">{fmtMoney(b.totalAmount)}</p>
                    <ChevronRight size={18} className="text-ink-soft/50" />
                  </div>
                </div>
              </Card>
            </Link>
            );
          })}

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                <ChevronLeft size={16} /> Précédent
              </Button>
              <span className="px-2 text-sm text-ink-soft">Page {safePage + 1} / {pageCount}</span>
              <Button variant="outline" size="sm" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
                Suivant <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
