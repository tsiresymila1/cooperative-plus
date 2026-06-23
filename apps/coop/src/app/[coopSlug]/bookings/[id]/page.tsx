"use client";
import { PageSkeleton } from "@cp/ui";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Ticket,
  Wallet,
  Check,
  CheckCircle2,
  User,
  Phone,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Button,
  Card,
  Badge,
  useConfirm,
  toast,
  fmtMoney,
  fmtDateTime,
  fmtTime,
  bookingStatus,
  paymentStatus,
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

export default function BookingViewPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const confirm = useConfirm();
  const params = useParams<{ id: string }>();
  const bookingId = params.id;

  const { data, isLoading } = db.useQuery({
    bookings: {
      $: { where: { id: bookingId, "cooperative.id": coopId } },
      tripInstance: {},
      tickets: {},
      payments: {},
    },
  });
  const booking = data?.bookings?.[0];

  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const tickets = booking?.tickets ?? [];
  const payments = booking?.payments ?? [];

  const setStatus = async (status: string, extra: Record<string, any> = {}) => {
    setBusy(true);
    try {
      await db.transact(db.tx.bookings[bookingId].update({ status, ...extra }));
      toast.success("Réservation mise à jour");
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    } finally {
      setBusy(false);
    }
  };

  const confirmAction = async () => {
    if (
      await confirm({
        title: "Confirmer la réservation ?",
        message: booking ? `${booking.reference} · ${fmtMoney(booking.totalAmount)}` : undefined,
        confirmLabel: "Confirmer",
      })
    ) {
      await setStatus("confirmed");
    }
  };

  const markPaid = async () => {
    if (
      await confirm({
        title: "Marquer comme payé ?",
        message: booking ? `${booking.reference} · ${fmtMoney(booking.totalAmount)}` : undefined,
        confirmLabel: "Marquer comme payé",
      })
    ) {
      await setStatus("paid");
    }
  };

  const cancelBooking = async () => {
    if (
      await confirm({
        title: "Annuler la réservation ?",
        message: booking ? `${booking.reference} · ${fmtMoney(booking.totalAmount)}` : undefined,
        confirmLabel: "Annuler la réservation",
        tone: "danger",
      })
    ) {
      await setStatus("cancelled", { cancelledAt: Date.now(), cancelReason: reason });
    }
  };

  const checkIn = async (ticketId: string, current?: number) => {
    await db.transact(
      db.tx.tickets[ticketId].update({ checkedInAt: current ? undefined : Date.now() }),
    );
    toast.success(current ? "Pointage annulé" : "Passager enregistré");
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "bookings", { role, permissions, isPlatformAdmin })}
      title="Détail de la réservation"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Réservations</span>
          <ChevronRight size={12} />
          <span className="text-ink">Détail</span>
        </>
      }
      action={
        <Link href={`/${slug}/bookings`}>
          <Button size="sm" variant="outline">
            <ArrowLeft size={16} /> Retour
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <PageSkeleton />
      ) : !booking ? (
        <p className="text-ink-soft">Réservation introuvable.</p>
      ) : (
        <div className="grid gap-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">{booking.reference}</h2>
                {booking.tripInstance && (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <p className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
                      {booking.tripInstance.originName}
                      <ArrowRight size={14} className="text-ink-soft/50" />
                      {booking.tripInstance.destName} · {fmtDateTime(booking.tripInstance.departureAt)}
                    </p>
                    <Link href={`/${slug}/trips/${booking.tripInstance.id}`}>
                      <Button size="sm" variant="outline">
                        <ExternalLink size={14} /> Voir le trajet
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              <Badge tone={(bookingStatus[booking.status]?.tone) ?? "neutral"}>
                {bookingStatus[booking.status]?.label ?? booking.status}
              </Badge>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Info icon={<User size={14} />} label="Client" value={booking.contactName} />
              <Info icon={<Phone size={14} />} label="Téléphone" value={booking.contactPhone} />
              <Info icon={<Ticket size={14} />} label="Places" value={String(booking.seatCount)} />
              <Info icon={<Wallet size={14} />} label="Montant" value={fmtMoney(booking.totalAmount)} />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink/8 pt-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Motif d'annulation"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-9 w-48"
                />
                <Button
                  size="sm"
                  className="bg-[#e23b3b] text-white hover:bg-[#c42f2f]"
                  disabled={busy || booking.status === "cancelled"}
                  onClick={cancelBooking}
                >
                  Annuler
                </Button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={confirmAction}>
                  Confirmer
                </Button>
                <Button size="sm" disabled={busy} onClick={markPaid}>
                  Marquer payé
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <div className="mb-3 flex items-center gap-2 text-ink">
                <Ticket size={18} className="text-laterite" />
                <h3 className="font-display text-lg font-bold">Billets ({tickets.length})</h3>
              </div>
              <div className="grid gap-2">
                {tickets.length === 0 && <p className="text-sm text-ink-soft">Aucun billet.</p>}
                {tickets.map((t: any) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-[--radius] border border-ink/8 px-3 py-2 text-sm"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-laterite/10 font-mono text-xs font-semibold text-laterite">
                        {t.seatLabel}
                      </span>
                      {t.passengerName}
                    </span>
                    {t.checkedInAt ? (
                      <button onClick={() => checkIn(t.id, t.checkedInAt)} title="Annuler le pointage">
                        <Badge tone="success">
                          <CheckCircle2 size={13} /> {fmtTime(t.checkedInAt)}
                        </Badge>
                      </button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => checkIn(t.id)}>
                        <Check size={14} /> Pointer
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-3 flex items-center gap-2 text-ink">
                <Wallet size={18} className="text-laterite" />
                <h3 className="font-display text-lg font-bold">Paiements ({payments.length})</h3>
              </div>
              <div className="grid gap-2">
                {payments.length === 0 && <p className="text-sm text-ink-soft">Aucun paiement.</p>}
                {payments.map((p: any) => {
                  const s = paymentStatus[p.status] ?? { label: p.status, tone: "neutral" as const };
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-[--radius] border border-ink/8 px-3 py-2 text-sm"
                    >
                      <span>
                        {fmtMoney(p.amount)} · {p.method}
                      </span>
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 text-xs text-ink-soft/60">
        {icon} {label}
      </p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  );
}
