"use client";
import { PageSkeleton } from "@cp/ui";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  Calendar,
  Copy,
  Pencil,
  Ticket,
  Users,
  Wallet,
  Check,
  CheckCircle2,
  Armchair,
  Phone,
  User,
  Activity,
  CreditCard,
  ChevronRight,
  XCircle,
  Search,
  Printer,
} from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  id,
  Button,
  Card,
  Badge,
  Field,
  SeatSelector,
  useConfirm,
  toast,
  type Cell,
  fmtMoney,
  fmtDateTime,
  fmtTime,
  tripStatus,
  bookingStatus,
  genReference,
} from "@cp/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
} from "@cp/ui/shadcn";

const STATUSES = ["scheduled", "boarding", "departed", "arrived", "cancelled"];
const methodLabel = (m: string) =>
  (({ cash: "Espèces", mobile_money: "Mobile Money", card: "Carte" }) as Record<string, string>)[m] ??
  m.charAt(0).toUpperCase() + m.slice(1);

export default function TripViewPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const confirm = useConfirm();
  const params = useParams<{ id: string }>();
  const tripId = params.id;
  const currency = coop.currency ?? "MGA";
  const paymentMethods: string[] =
    Array.isArray(coop.paymentMethods) && coop.paymentMethods.length
      ? (coop.paymentMethods as string[])
      : ["cash", "mobile_money", "card"];

  const { data, isLoading } = db.useQuery({
    tripInstances: {
      $: { where: { id: tripId, "cooperative.id": coopId } },
      bookings: { tickets: {}, payments: {} },
      tickets: {},
      holds: {},
      route: {},
      vehicle: { seatMaps: {} },
    },
  });

  const trip = data?.tripInstances?.[0];
  const bookings = (trip?.bookings ?? []).filter((b: any) => b.status !== "cancelled");
  const tickets = trip?.tickets ?? [];
  const holds = trip?.holds ?? [];

  // Prefer the vehicle's current active seat map so the layout matches the
  // vehicle editor exactly; fall back to the booking-time snapshot.
  const vehicleId = trip?.vehicle?.id as string | undefined;
  const activeMap = (trip?.vehicle?.seatMaps ?? []).find((m: any) => m.isActive) ?? (trip?.vehicle?.seatMaps ?? [])[0];
  const layout: Cell[] = Array.isArray(activeMap?.layout)
    ? (activeMap.layout as Cell[])
    : Array.isArray(trip?.seatMapSnapshot) ? (trip!.seatMapSnapshot as Cell[]) : [];
  const takenSeats = useMemo(() => tickets.map((t: any) => t.seatLabel), [tickets]);
  const heldSeats = useMemo(
    () => holds.filter((h: any) => new Date(h.expiresAt).getTime() > Date.now()).map((h: any) => h.seatLabel),
    [holds],
  );

  // ----- anonymous reservation state -----
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState(paymentMethods[0] ?? "cash");
  const [booking, setBooking] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [mSearch, setMSearch] = useState("");

  const visibleBookings = useMemo(() => {
    const q = mSearch.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b: any) => {
      const inTickets = (b.tickets ?? []).some((t: any) =>
        `${t.passengerName ?? ""} ${t.passengerPhone ?? ""} ${t.seatLabel ?? ""}`.toLowerCase().includes(q),
      );
      return `${b.reference} ${b.contactName} ${b.contactPhone}`.toLowerCase().includes(q) || inTickets;
    });
  }, [bookings, mSearch]);

  const setBookingStatus = async (bId: string, status: string, extra: Record<string, any> = {}) => {
    try {
      await db.transact(db.tx.bookings[bId].update({ status, ...extra }));
      toast.success("Réservation mise à jour");
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  };
  const confirmBooking = async (b: any) => {
    if (await confirm({ title: "Confirmer la réservation ?", message: `${b.reference} · ${fmtMoney(b.totalAmount)}`, confirmLabel: "Confirmer" }))
      await setBookingStatus(b.id, "confirmed");
  };
  const markPaid = async (b: any) => {
    if (await confirm({ title: "Marquer comme payé ?", message: `${b.reference} · ${fmtMoney(b.totalAmount)}`, confirmLabel: "Marquer payé" }))
      await setBookingStatus(b.id, "paid");
  };
  const cancelBookingRow = async (b: any) => {
    if (await confirm({ title: "Annuler la réservation ?", message: `${b.reference} · ${fmtMoney(b.totalAmount)}`, confirmLabel: "Annuler", tone: "danger" }))
      await setBookingStatus(b.id, "cancelled", { cancelledAt: Date.now() });
  };

  const occupiedForSelector = useMemo(
    () => Array.from(new Set([...takenSeats, ...heldSeats])),
    [takenSeats, heldSeats],
  );

  const toggleSeat = (label: string) =>
    setSelected((s) => (s.includes(label) ? s.filter((x) => x !== label) : [...s, label]));

  const total = (trip?.price ?? 0) * selected.length;

  const changeStatus = async (next: string) => {
    setStatusSaving(true);
    try {
      await db.transact(db.tx.tripInstances[tripId].update({ status: next }));
      toast.success("Statut mis à jour");
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    } finally {
      setStatusSaving(false);
    }
  };

  const duplicate = async () => {
    if (!trip) return;
    setDuplicating(true);
    const newId = id();
    const d = new Date();
    d.setHours(d.getHours() + 1);
    const departureAt = d.getTime();
    const departDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    try {
      const tx = db.tx.tripInstances[newId]
        .update({
          originName: trip.originName,
          destName: trip.destName,
          routeName: trip.routeName,
          coopName: trip.coopName,
          vehicleName: trip.vehicleName,
          departDate,
          departureAt,
          status: "scheduled",
          price: trip.price,
          currency: trip.currency,
          seatMapSnapshot: trip.seatMapSnapshot,
          seatsTotal: trip.seatsTotal,
          seatsBooked: 0,
          createdAt: Date.now(),
        })
        .link({ cooperative: coopId });
      if (trip.route?.id) tx.link({ route: trip.route.id });
      if (trip.vehicle?.id) tx.link({ vehicle: trip.vehicle.id });
      await db.transact(tx);
      toast.success("Trajet dupliqué");
      router.push(`/${slug}/trips/${newId}`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setDuplicating(false);
    }
  };

  const checkIn = async (ticketId: string, current?: number) => {
    await db.transact(
      db.tx.tickets[ticketId].update({ checkedInAt: current ? undefined : Date.now() }),
    );
    toast.success(current ? "Pointage annulé" : "Passager enregistré");
  };

  const reserve = async () => {
    if (!trip) return;
    if (selected.length === 0) {
      toast.error("Sélectionnez au moins un siège");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      toast.error("Nom et téléphone du passager requis");
      return;
    }
    if (
      !(await confirm({
        title: "Confirmer la réservation ?",
        message: `${selected.length} place(s) · ${fmtMoney(total)}`,
        confirmLabel: "Réserver",
      }))
    ) {
      return;
    }
    setBooking(true);
    const bookingId = id();
    const paymentId = id();
    const price = trip.price ?? 0;
    const totalAmount = price * selected.length;

    try {
      const txs: any[] = [];
      txs.push(
        db.tx.bookings[bookingId]
          .update({
            reference: genReference(),
            source: "cooperative",
            contactName: name.trim(),
            contactPhone: phone.trim(),
            seatCount: selected.length,
            totalAmount,
            currency,
            status: "paid",
            createdAt: Date.now(),
          })
          .link({ cooperative: coopId, tripInstance: tripId }),
      );

      for (const seatLabel of selected) {
        txs.push(
          db.tx.tickets[id()]
            .update({
              seatKey: `${tripId}_${seatLabel}`,
              seatLabel,
              passengerName: name.trim(),
              passengerPhone: phone.trim(),
              price,
              qrToken: `${bookingId}_${seatLabel}_${Math.random().toString(36).slice(2, 10)}`,
              createdAt: Date.now(),
            })
            .link({ booking: bookingId, cooperative: coopId, tripInstance: tripId }),
        );
      }

      txs.push(
        db.tx.payments[paymentId]
          .update({
            method,
            provider: "manual",
            amount: totalAmount,
            currency,
            status: "paid",
            paidAt: Date.now(),
            createdAt: Date.now(),
          })
          .link({ cooperative: coopId, booking: bookingId }),
      );

      txs.push(
        db.tx.tripInstances[tripId].update({
          seatsBooked: (trip.seatsBooked ?? 0) + selected.length,
        }),
      );

      await db.transact(txs);
      toast.success(`Réservation créée (${selected.length} place(s))`);
      setSelected([]);
      setName("");
      setPhone("");
      setMethod(paymentMethods[0] ?? "cash");
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "siège déjà pris"));
    } finally {
      setBooking(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "trips", { role, permissions, isPlatformAdmin })}
      title="Détail du trajet"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Trajets</span>
          <ChevronRight size={12} />
          <span className="text-ink">Détail</span>
        </>
      }
      action={
        <div className="flex gap-2">
          <Link href={`/${slug}/trips`}>
            <Button size="sm" variant="outline">
              <ArrowLeft size={16} /> Retour
            </Button>
          </Link>
          {trip && (
            <Button size="sm" variant="outline" onClick={() => router.push(`/${slug}/trips/${tripId}/manifest`)}>
              <Printer size={16} /> Manifeste
            </Button>
          )}
          {trip && (
            <Button size="sm" variant="outline" onClick={duplicate} disabled={duplicating}>
              <Copy size={16} /> {duplicating ? "…" : "Dupliquer"}
            </Button>
          )}
          {trip && (
            <Button size="sm" onClick={() => router.push(`/${slug}/trips/${tripId}/edit`)}>
              <Pencil size={16} /> Modifier
            </Button>
          )}
        </div>
      }
    >
      {isLoading ? (
        <PageSkeleton />
      ) : !trip ? (
        <p className="text-ink-soft">Trajet introuvable.</p>
      ) : (
        <div className="grid gap-6">
          {/* ---- Header ---- */}
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
                  {trip.originName}
                  <ArrowRight size={20} className="text-laterite" />
                  {trip.destName}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-ink-soft">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={15} className="text-ink-soft/60" />
                    {fmtDateTime(trip.departureAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Bus size={15} className="text-ink-soft/60" />
                    {trip.vehicleName}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet size={15} className="text-ink-soft/60" />
                    {fmtMoney(trip.price)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={15} className="text-ink-soft/60" />
                    {trip.seatsBooked}/{trip.seatsTotal} places
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={(tripStatus[trip.status]?.tone) ?? "neutral"}>
                  {tripStatus[trip.status]?.label ?? trip.status}
                </Badge>
                <Select value={trip.status} onValueChange={changeStatus}>
                  <SelectTrigger className="h-9 w-44">
                    <span className="inline-flex items-center gap-2">
                      <Activity size={15} className="text-ink-soft/60" />
                      <SelectValue />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} disabled={statusSaving}>
                        {tripStatus[s]?.label ?? s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* ---- Seat map view ---- */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between gap-2 text-ink">
                <div className="flex items-center gap-2">
                  <Armchair size={18} className="text-laterite" />
                  <h3 className="font-display text-lg font-bold">Places occupées</h3>
                </div>
                {vehicleId && (
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/${slug}/vehicles/${vehicleId}/edit`)}>
                    <Bus size={14} /> Modifier le véhicule
                  </Button>
                )}
              </div>
              {layout.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  Aucun plan de sièges.{" "}
                  {vehicleId && (
                    <button onClick={() => router.push(`/${slug}/vehicles/${vehicleId}/edit`)} className="font-medium text-laterite underline">
                      Configurer le véhicule
                    </button>
                  )}
                </p>
              ) : (
                <div className="flex justify-center">
                  <SeatSelector
                    layout={layout}
                    taken={takenSeats}
                    held={heldSeats}
                    selected={selected}
                    onToggle={toggleSeat}
                  />
                </div>
              )}
            </Card>

            {/* ---- Anonymous reservation ---- */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2 text-ink">
                <Ticket size={18} className="text-laterite" />
                <h3 className="font-display text-lg font-bold">Réserver (passager au guichet)</h3>
              </div>
              {trip.status === "cancelled" ? (
                <p className="text-sm text-ink-soft">Ce trajet est annulé.</p>
              ) : (
                <div className="grid gap-4">
                  <div className="rounded-[--radius] border border-ink/8 bg-sand-deep/30 px-3 py-2.5 text-sm">
                    <span className="text-ink-soft">Sièges choisis: </span>
                    {selected.length === 0 ? (
                      <span className="text-ink-soft/50">aucun — sélectionnez sur le plan</span>
                    ) : (
                      <span className="font-mono font-semibold text-ink">{selected.join(", ")}</span>
                    )}
                  </div>
                  <Field label="Nom du passager">
                    <div className="relative">
                      <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                      <Input value={name} onChange={(e) => setName(e.target.value)} className="pl-9" placeholder="Nom complet" />
                    </div>
                  </Field>
                  <Field label="Téléphone">
                    <div className="relative">
                      <Phone size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" placeholder="034 00 000 00" />
                    </div>
                  </Field>
                  <Field label="Mode de paiement">
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger>
                        <span className="inline-flex items-center gap-2">
                          <CreditCard size={15} className="text-ink-soft/60" />
                          <SelectValue />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((m) => (
                          <SelectItem key={m} value={m}>
                            {methodLabel(m)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex items-center justify-between border-t border-ink/8 pt-3">
                    <span className="text-sm text-ink-soft">
                      Total ({selected.length} × {fmtMoney(trip.price)})
                    </span>
                    <span className="font-display text-xl font-bold text-ink">{fmtMoney(total)}</span>
                  </div>
                  <Button onClick={reserve} disabled={booking || selected.length === 0}>
                    <Ticket size={16} /> {booking ? "…" : "Créer la réservation"}
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* ---- Manifest ---- */}
          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-ink">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-laterite" />
                <h3 className="font-display text-lg font-bold">
                  Manifeste des réservations ({visibleBookings.length}/{bookings.length})
                </h3>
              </div>
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                <Input
                  value={mSearch}
                  onChange={(e) => setMSearch(e.target.value)}
                  placeholder="Référence, nom, téléphone, siège…"
                  className="h-9 w-72 pl-9"
                />
              </div>
            </div>
            {bookings.length === 0 ? (
              <p className="text-sm text-ink-soft">Aucune réservation pour ce trajet.</p>
            ) : visibleBookings.length === 0 ? (
              <p className="text-sm text-ink-soft">Aucune réservation ne correspond.</p>
            ) : (
              <div className="grid gap-4">
                {visibleBookings.map((b: any) => {
                  const bs = bookingStatus[b.status] ?? { label: b.status, tone: "neutral" as const };
                  const bTickets = b.tickets ?? [];
                  const done = b.status === "cancelled" || b.status === "refunded";
                  return (
                    <div key={b.id} className="rounded-[--radius] border border-ink/8">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 px-4 py-3">
                        <div>
                          <p className="font-mono text-sm font-semibold text-ink">{b.reference}</p>
                          <p className="text-sm text-ink-soft">
                            {b.contactName} · {b.contactPhone}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="text-ink-soft">{b.seatCount} place(s)</span>
                          <span className="font-semibold text-ink">{fmtMoney(b.totalAmount)}</span>
                          <Badge tone={bs.tone}>{bs.label}</Badge>
                          <div className="flex items-center gap-1">
                            {b.status === "pending" && (
                              <Button size="sm" variant="ghost" onClick={() => confirmBooking(b)}>
                                <Check size={14} /> Confirmer
                              </Button>
                            )}
                            {!done && b.status !== "paid" && (
                              <Button size="sm" variant="ghost" onClick={() => markPaid(b)}>
                                <Wallet size={14} /> Payé
                              </Button>
                            )}
                            {!done && (
                              <Button size="sm" variant="ghost" className="text-[#c42f2f] hover:bg-[#e23b3b]/10" onClick={() => cancelBookingRow(b)}>
                                <XCircle size={14} /> Annuler
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-1.5 px-4 py-3">
                        {bTickets.map((t: any) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between rounded-[--radius] px-2 py-1.5 text-sm hover:bg-ink/[.02]"
                          >
                            <span className="inline-flex items-center gap-2">
                              <span className="grid h-7 w-7 place-items-center rounded-md bg-laterite/10 font-mono text-xs font-semibold text-laterite">
                                {t.seatLabel}
                              </span>
                              {t.passengerName}
                              {t.passengerPhone && (
                                <span className="text-ink-soft/60">· {t.passengerPhone}</span>
                              )}
                            </span>
                            {t.checkedInAt ? (
                              <button
                                className="inline-flex items-center gap-1.5"
                                onClick={() => checkIn(t.id, t.checkedInAt)}
                                title="Annuler le pointage"
                              >
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
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
