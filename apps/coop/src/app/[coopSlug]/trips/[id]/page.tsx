"use client";
import { PageSkeleton } from "@cp/ui";
import { BoardingScanner } from "@/components/boarding-scanner";
import { useEffect, useMemo, useState } from "react";
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
  QrCode,
  IdCard,
  Plus,
  Trash2,
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
  TagBadge,
  Field,
  SeatSelector,
  Dialog,
  useConfirm,
  toast,
  type Cell,
  fmtMoney,
  fmtDateTime,
  fmtTime,
  tripStatus,
  bookingStatus,
  genReference,
  notDeleted,
  tripSlots,
  slotSeatKey,
  isValidPhone,
} from "@cp/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Combobox,
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
      tickets: { booking: {} },
      holds: {},
      route: {},
      vehicle: { seatMaps: {} },
      tag: {},
      driver: {},
      vehicles: { tickets: { booking: {} }, holds: {}, model: {}, vehicle: {}, driver: {} },
    },
    vehicles: { $: { where: { "cooperative.id": coopId } }, seatMaps: {}, model: {} },
    drivers: { $: { where: { "cooperative.id": coopId } } },
    vehicleModels: { $: { where: { "cooperative.id": coopId } } },
  });

  const trip = data?.tripInstances?.[0];
  const bookings = (trip?.bookings ?? []).filter((b: any) => !["cancelled", "expired", "refunded"].includes(b.status));
  const tickets = trip?.tickets ?? [];
  const holds = trip?.holds ?? [];

  // Resolve the vehicle from the link; fall back to matching by name (repairs
  // older duplicated trips whose vehicle link was lost).
  const vehicle = trip?.vehicle
    ?? (trip?.vehicleName ? (data?.vehicles ?? []).find((v: any) => v.name === trip.vehicleName) : undefined);
  const drivers = (data?.drivers ?? []).filter(notDeleted);

  const assignDriver = async (driverId: string) => {
    if (!trip) return;
    const d = drivers.find((x: any) => x.id === driverId);
    let chunk = db.tx.tripInstances[tripId].update({ driverName: d?.name ?? null, driverPhone: d?.phone ?? null });
    chunk = driverId ? chunk.link({ driver: driverId }) : (trip.driver?.id ? chunk.unlink({ driver: trip.driver.id }) : chunk);
    try {
      await db.transact(chunk);
      toast.success(driverId ? "Chauffeur assigné." : "Chauffeur retiré.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec.");
    }
  };

  // Per-slot assignment (driver + physical vehicle). Falls back to trip-level
  // for legacy virtual slots (mono-vehicle trips with no tripVehicle row).
  const assignSlotDriver = async (driverId: string) => {
    if (!slot) return;
    if (slot.isVirtual) return assignDriver(driverId);
    const d = drivers.find((x: any) => x.id === driverId);
    let chunk = db.tx.tripVehicles[slot.id].update({ driverName: d?.name ?? null, driverPhone: d?.phone ?? null });
    chunk = driverId ? chunk.link({ driver: driverId }) : (slot.driver?.id ? chunk.unlink({ driver: slot.driver.id }) : chunk);
    try { await db.transact(chunk); toast.success(driverId ? "Chauffeur assigné." : "Chauffeur retiré."); }
    catch (e: any) { toast.error(e?.message ?? "Échec."); }
  };
  const assignSlotVehicle = async (vId: string) => {
    if (!slot) return;
    const v = (data?.vehicles ?? []).find((x: any) => x.id === vId);
    if (slot.isVirtual) {
      let chunk = db.tx.tripInstances[tripId].update({ vehicleName: v?.name ?? trip?.vehicleName });
      chunk = vId ? chunk.link({ vehicle: vId }) : (trip?.vehicle?.id ? chunk.unlink({ vehicle: trip.vehicle.id }) : chunk);
      try { await db.transact(chunk); toast.success(vId ? "Véhicule assigné." : "Véhicule retiré."); } catch (e: any) { toast.error(e?.message ?? "Échec."); }
      return;
    }
    let chunk = db.tx.tripVehicles[slot.id].update({ vehicleName: v?.name ?? null, registrationNo: v?.registrationNo ?? null });
    chunk = vId ? chunk.link({ vehicle: vId }) : (slot.vehicle?.id ? chunk.unlink({ vehicle: slot.vehicle.id }) : chunk);
    try { await db.transact(chunk); toast.success(vId ? "Véhicule assigné." : "Véhicule retiré."); }
    catch (e: any) { toast.error(e?.message ?? "Échec."); }
  };

  // Add / remove a vehicle slot (only on trips that already use real slots).
  const tripModels = (data?.vehicleModels ?? []).filter(notDeleted);
  const seatsOfModel = (m: any) => Array.isArray(m?.layout) ? m.layout.filter((c: any) => c.type === "seat").length : (m?.seatCount ?? 0);

  const addSlot = async () => {
    const m = tripModels.find((x: any) => x.id === addModelId);
    if (!m) { toast.error("Choisissez un modèle."); return; }
    const seats = seatsOfModel(m);
    try {
      await db.transact([
        db.tx.tripVehicles[id()].update({ label: `Voiture ${slots.length + 1}`, seatMapSnapshot: m.layout ?? [], seatsTotal: seats, seatsBooked: 0, vehicleName: m.name, createdAt: Date.now() }).link({ tripInstance: tripId, model: m.id }),
        db.tx.tripInstances[tripId].update({ seatsTotal: (trip?.seatsTotal ?? 0) + seats }),
      ]);
      toast.success("Véhicule ajouté."); setAddOpen(false); setAddModelId("");
    } catch (e: any) { toast.error(e?.message ?? "Échec."); }
  };
  const removeSlot = async (s: any) => {
    if (slots.length <= 1) { toast.error("Au moins un véhicule requis."); return; }
    const liveT = (s.tickets ?? []).filter((t: any) => !DEAD.includes(t.booking?.status)).length;
    const liveH = (s.holds ?? []).filter((h: any) => +new Date(h.expiresAt) > Date.now()).length;
    if (liveT || liveH) { toast.error("Ce véhicule a des réservations ou holds en cours."); return; }
    if (!(await confirm({ title: "Retirer ce véhicule ?", message: s.label, confirmLabel: "Retirer", tone: "danger" }))) return;
    try {
      await db.transact([
        db.tx.tripVehicles[s.id].update({ deletedAt: Date.now() }),
        db.tx.tripInstances[tripId].update({ seatsTotal: Math.max(0, (trip?.seatsTotal ?? 0) - (s.seatsTotal ?? 0)) }),
      ]);
      if (slotId === s.id) setSlotId(slots.find((x: any) => x.id !== s.id)?.id ?? "");
      toast.success("Véhicule retiré.");
    } catch (e: any) { toast.error(e?.message ?? "Échec."); }
  };

  // ── Vehicle slots (Phase 2). New trips have real tripVehicles; legacy trips
  // fall back to one virtual slot whose id === tripId (so seatKey is unchanged).
  const slots = useMemo(() => tripSlots(trip), [trip]);
  const [slotId, setSlotId] = useState<string>("");
  useEffect(() => { if (slots.length && !slots.some((s) => s.id === slotId)) setSlotId(slots[0].id); }, [slots, slotId]);
  const slot = slots.find((s) => s.id === slotId) ?? slots[0];
  const hasRealSlots = slots.length > 0 && !slots[0]?.isVirtual;

  // Physical vehicles assignable to the active slot = those of the slot's model
  // (legacy virtual slots have no model → allow any vehicle).
  const slotModelId = (slot?.model as any)?.id;
  const slotVehicles = (data?.vehicles ?? [])
    .filter(notDeleted)
    .filter((v: any) => !slotModelId || (v.model as any)?.id === slotModelId);

  const vehicleId = vehicle?.id as string | undefined;
  const activeMap = (vehicle?.seatMaps ?? []).find((m: any) => m.isActive) ?? (vehicle?.seatMaps ?? [])[0];
  const layout: Cell[] = Array.isArray(slot?.seatMapSnapshot) && slot.seatMapSnapshot.length
    ? (slot.seatMapSnapshot as Cell[])
    : Array.isArray(activeMap?.layout) ? (activeMap.layout as Cell[])
      : Array.isArray(trip?.seatMapSnapshot) ? (trip!.seatMapSnapshot as Cell[]) : [];

  const DEAD = ["cancelled", "expired", "refunded"];
  // Occupancy for the ACTIVE slot only.
  const takenSeats = useMemo(
    () => (slot?.tickets ?? []).filter((t: any) => !DEAD.includes(t.booking?.status)).map((t: any) => t.seatLabel),
    [slot],
  );
  const heldSeats = useMemo(
    () => (slot?.holds ?? []).filter((h: any) => new Date(h.expiresAt).getTime() > Date.now()).map((h: any) => h.seatLabel),
    [slot],
  );

  // Self-heal: purge orphan tickets (dead booking) across all slots so their
  // unique seatKey frees up — customers/mobile can't delete others' tickets.
  useEffect(() => {
    const orphans = slots.flatMap((s) => (s.tickets ?? []) as any[]).filter((t) => t.booking && DEAD.includes(t.booking.status));
    if (orphans.length) db.transact(orphans.map((t) => db.tx.tickets[t.id].delete())).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, slots.reduce((n, s) => n + (s.tickets?.length ?? 0), 0)]);

  // ----- anonymous reservation state -----
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState(paymentMethods[0] ?? "cash");
  const [booking, setBooking] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addModelId, setAddModelId] = useState("");
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

  // Group reservations by vehicle slot. A booking is within ONE vehicle, so its
  // slot = the slot prefix of any of its tickets' seatKey (`${slotId}_${label}`).
  const bookingGroups = useMemo(() => {
    const slotOf = (b: any) => ((b.tickets ?? [])[0]?.seatKey ?? "").split("_")[0];
    const groups = slots.map((s) => ({ slot: s, items: visibleBookings.filter((b: any) => slotOf(b) === s.id) }));
    const known = new Set(slots.map((s) => s.id));
    const orphans = visibleBookings.filter((b: any) => !known.has(slotOf(b)));
    if (orphans.length && groups[0]) groups[0].items = [...groups[0].items, ...orphans]; // legacy tickets w/o slot match
    return groups.filter((g) => g.items.length);
  }, [slots, visibleBookings]);

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
    if (await confirm({ title: "Annuler la réservation ?", message: `${b.reference} · ${fmtMoney(b.totalAmount)}`, confirmLabel: "Annuler", tone: "danger" })) {
      try {
        // Free the seats: delete the tickets (seat occupancy is derived from tickets).
        await db.transact([
          db.tx.bookings[b.id].update({ status: "cancelled", cancelledAt: Date.now() }),
          ...(b.tickets ?? []).map((t: any) => db.tx.tickets[t.id].delete()),
        ]);
        toast.success("Réservation annulée");
      } catch (e: any) {
        toast.error("Erreur: " + (e?.message ?? "inconnue"));
      }
    }
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
      const links: Record<string, string> = { cooperative: coopId };
      if (trip.route?.id) links.route = trip.route.id;
      if (vehicle?.id) links.vehicle = vehicle.id;
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
        .link(links);
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

  const renderBooking = (b: any) => {
    const bs = bookingStatus[b.status] ?? { label: b.status, tone: "neutral" as const };
    const bTickets = b.tickets ?? [];
    const done = b.status === "cancelled" || b.status === "refunded";
    return (
      <div key={b.id} className="rounded-[--radius] border border-ink/8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/8 px-4 py-3">
          <div>
            <p className="font-mono text-sm font-semibold text-ink">{b.reference}</p>
            <p className="text-sm text-ink-soft">{b.contactName} · {b.contactPhone}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-ink-soft">{b.seatCount} place(s)</span>
            <span className="font-semibold text-ink">{fmtMoney(b.totalAmount)}</span>
            <Badge tone={bs.tone}>{bs.label}</Badge>
            <div className="flex items-center gap-1">
              {b.status === "pending" && (
                <Button size="sm" variant="ghost" onClick={() => confirmBooking(b)}><Check size={14} /> Confirmer</Button>
              )}
              {!done && b.status !== "paid" && (
                <Button size="sm" variant="ghost" onClick={() => markPaid(b)}><Wallet size={14} /> Payé</Button>
              )}
              {!done && (
                <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => cancelBookingRow(b)}><XCircle size={14} /> Annuler</Button>
              )}
            </div>
          </div>
        </div>
        <div className="grid gap-1.5 px-4 py-3">
          {bTickets.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between rounded-[--radius] px-2 py-1.5 text-sm hover:bg-ink/[.02]">
              <span className="inline-flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-laterite/10 font-mono text-xs font-semibold text-laterite">{t.seatLabel}</span>
                {t.passengerName}
                {t.passengerPhone && <span className="text-ink-soft/60">· {t.passengerPhone}</span>}
              </span>
              {t.checkedInAt ? (
                <button className="inline-flex items-center gap-1.5" onClick={() => checkIn(t.id, t.checkedInAt)} title="Annuler le pointage">
                  <Badge tone="success"><CheckCircle2 size={13} /> {fmtTime(t.checkedInAt)}</Badge>
                </button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => checkIn(t.id)}><Check size={14} /> Pointer</Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const reserve = async () => {
    if (!trip || !slot) return;
    if (selected.length === 0) {
      toast.error("Sélectionnez au moins un siège");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      toast.error("Nom et téléphone du passager requis");
      return;
    }
    if (!isValidPhone(phone)) {
      toast.error("Numéro de téléphone invalide");
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

      // Free seatKey (unique) held by orphan tickets on THIS slot — those of a
      // cancelled/expired/refunded booking, or with no booking — for chosen seats.
      const selectedSet = new Set(selected);
      for (const tk of (slot.tickets ?? []) as any[]) {
        const st = tk.booking?.status;
        if (selectedSet.has(tk.seatLabel) && (!tk.booking || DEAD.includes(st))) {
          txs.push(db.tx.tickets[tk.id].delete());
        }
      }

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
              seatKey: slotSeatKey(slot.id, seatLabel),
              seatLabel,
              passengerName: name.trim(),
              passengerPhone: phone.trim(),
              price,
              qrToken: `${bookingId}_${seatLabel}_${Math.random().toString(36).slice(2, 10)}`,
              createdAt: Date.now(),
            })
            .link({ booking: bookingId, cooperative: coopId, tripInstance: tripId, ...(slot.isVirtual ? {} : { tripVehicle: slot.id }) }),
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

      txs.push(db.tx.tripInstances[tripId].update({ seatsBooked: (trip.seatsBooked ?? 0) + selected.length }));
      if (!slot.isVirtual) {
        txs.push(db.tx.tripVehicles[slot.id].update({ seatsBooked: (slot.seatsBooked ?? 0) + selected.length }));
      }

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
            <Button size="sm" variant="outline" onClick={() => setScanOpen(true)}>
              <QrCode size={16} /> Embarquement
            </Button>
          )}
          {trip && (
            <Button size="sm" variant="outline" onClick={() => router.push(`/${slug}/trips/${tripId}/manifest${slot && !slot.isVirtual ? `?vehicle=${slot.id}` : ""}`)}>
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
                  {(trip as any).tag && <TagBadge name={(trip as any).tag.name} color={(trip as any).tag.color} />}
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
                {slot?.seatsTotal ? <Badge tone="neutral">{new Set(takenSeats).size}/{slot.seatsTotal}</Badge> : null}
              </div>
              {(slots.length > 1 || hasRealSlots) && (
                <div className="mb-4 flex flex-wrap items-center gap-1.5">
                  {slots.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSlotId(s.id); setSelected([]); }}
                      className={s.id === slotId
                        ? "inline-flex items-center gap-1.5 rounded-md bg-laterite px-3 py-1.5 text-xs font-bold text-white"
                        : "inline-flex items-center gap-1.5 rounded-md border border-ink/12 px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-ink/5"}
                    >
                      <Bus size={13} /> {s.label}
                    </button>
                  ))}
                  {hasRealSlots && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}><Plus size={13} /> Véhicule</Button>
                      {slots.length > 1 && slot && (
                        <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={() => removeSlot(slot)}><Trash2 size={13} /> Retirer</Button>
                      )}
                    </>
                  )}
                </div>
              )}
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

              {/* Per-slot assignment: driver + physical vehicle (registration). */}
              {layout.length > 0 && (
                <div className="mt-5 grid gap-3 border-t border-ink/8 pt-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/55">Chauffeur · {slot?.label}</p>
                    <Combobox
                      value={slot?.driver?.id ?? ""}
                      onValueChange={(v) => assignSlotDriver(v)}
                      options={[{ value: "", label: "— Aucun —" }, ...drivers.map((d: any) => ({ value: d.id, label: d.name, hint: d.phone }))]}
                      placeholder="Assigner" searchPlaceholder="Rechercher chauffeur…"
                      icon={<IdCard size={14} className="text-ink-soft/60" />}
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft/55">Véhicule (immatriculation)</p>
                    <Combobox
                      value={slot?.vehicle?.id ?? ""}
                      onValueChange={(v) => assignSlotVehicle(v)}
                      options={[{ value: "", label: "— Aucun —" }, ...slotVehicles.map((v: any) => ({ value: v.id, label: v.name, hint: v.registrationNo }))]}
                      placeholder="Assigner" searchPlaceholder="Rechercher véhicule…"
                      empty="Aucun véhicule pour ce modèle."
                      icon={<Bus size={14} className="text-ink-soft/60" />}
                    />
                  </div>
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
            ) : slots.length > 1 ? (
              <div className="grid gap-6">
                {bookingGroups.map((g) => (
                  <div key={g.slot.id} className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-laterite/10 px-2.5 py-1 text-xs font-bold text-laterite">
                        <Bus size={13} /> {g.slot.label}
                      </span>
                      <span className="text-xs text-ink-soft">{g.items.length} réservation(s)</span>
                    </div>
                    <div className="grid gap-4">{g.items.map(renderBooking)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4">{visibleBookings.map(renderBooking)}</div>
            )}
          </Card>
        </div>
      )}

      <Dialog
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        title="Embarquement"
        description={trip ? `${trip.originName} → ${trip.destName} · seuls les billets de ce trajet sont acceptés.` : undefined}
        size="xl"
      >
        {scanOpen && <BoardingScanner coopId={coopId} tripId={tripId} />}
      </Dialog>

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Ajouter un véhicule"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={addSlot} disabled={!addModelId}>Ajouter</Button>
          </div>
        }
      >
        <Field label="Modèle">
          <Select value={addModelId} onValueChange={setAddModelId}>
            <SelectTrigger><SelectValue placeholder="Choisir un modèle…" /></SelectTrigger>
            <SelectContent>
              {tripModels.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name} · {seatsOfModel(m)} places</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </Dialog>
    </DashboardShell>
  );
}
