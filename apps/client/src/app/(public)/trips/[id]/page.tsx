"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bus, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { CoopLogo, TagBadge } from "@cp/ui";
import { SeatSelector, type Cell, tripSlots, slotSeatKey } from "@cp/ui";
import { toast } from "@cp/ui";
import { db, id } from "@cp/ui";
import { useBookingDraft } from "@/lib/booking-store";
import { fmtMoney } from "@cp/ui";

const HOLD_MS = 5 * 60 * 1000;
const DEAD = ["cancelled", "expired", "refunded"];

const btnGold =
  "inline-flex h-14 w-full items-center justify-center gap-2 px-6 font-display text-[15px] font-semibold uppercase tracking-[0.5px] transition-colors duration-200 bg-gold text-navy hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gold disabled:hover:text-navy";

export default function TripDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: instanceId } = use(params);
  const router = useRouter();
  const { user } = db.useAuth();
  const draft = useBookingDraft();
  const [reserving, setReserving] = useState(false);
  const authed = !!user && !(user as { isGuest?: boolean }).isGuest;

  const { data, isLoading } = db.useQuery({
    tripInstances: {
      $: { where: { id: instanceId } },
      cooperative: {},
      tickets: { booking: {} },
      holds: {},
      vehicle: { seatMaps: {} },
      tag: {},
      driver: {},
      vehicles: { tickets: { booking: {} }, holds: {}, model: {} },
    },
  });
  const trip = data?.tripInstances?.[0];

  useEffect(() => {
    if (!trip) return;
    draft.setTrip({
      instanceId,
      coopId: trip.cooperative?.id ?? "",
      price: trip.price,
      currency: trip.currency,
      origin: trip.originName,
      dest: trip.destName,
      departureAt: +new Date(trip.departureAt),
    });
    const ss = tripSlots(trip);
    if (ss.length && !ss.some((s) => s.id === draft.slotId))
      draft.setSlot({
        id: ss[0].id,
        label: ss[0].label,
        isVirtual: ss[0].isVirtual,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id]);

  const toggle = (label: string) => {
    if (trip) draft.toggleSeat(label);
  };

  if (isLoading)
    return (
      <main className="grid min-h-[60vh] place-items-center pt-[100px]">
        <Loader2 className="animate-spin text-gold" size={32} />
      </main>
    );
  if (!trip || (trip.cooperative as any)?.subscriptionStatus === "suspended")
    return (
      <main className="pt-[100px]">
        <div className="mx-auto max-w-content px-[15px] py-24 text-center">
          <p className="font-display text-3xl font-semibold uppercase text-navy">
            Trajet introuvable
          </p>
        </div>
      </main>
    );

  const slots = tripSlots(trip);
  const slot = slots.find((s) => s.id === draft.slotId) ?? slots[0];
  const now = Date.now();

  const takenByOthers = [
    ...(slot?.tickets ?? [])
      .filter((t: any) => !DEAD.includes(t.booking?.status))
      .map((t: any) => t.seatLabel),
    ...(slot?.holds ?? [])
      .filter((h: any) => +new Date(h.expiresAt) > now)
      .map((h: any) => h.seatLabel),
  ].filter((label: string) => !draft.seats.includes(label));

  // Selected slot layout (vehicle active map fallback for legacy virtual slots).
  const activeMap =
    (trip.vehicle?.seatMaps ?? []).find((m: any) => m.isActive) ??
    (trip.vehicle?.seatMaps ?? [])[0];
  const layout: Cell[] =
    Array.isArray(slot?.seatMapSnapshot) && slot.seatMapSnapshot.length
      ? (slot.seatMapSnapshot as Cell[])
      : ((Array.isArray(activeMap?.layout)
          ? activeMap.layout
          : (trip.seatMapSnapshot as Cell[])) ?? []);
  const available = (slot?.seatsTotal ?? 0) - takenByOthers.length;
  const total = trip.price * draft.seats.length;

  const pickSlot = (s: any) =>
    draft.setSlot({ id: s.id, label: s.label, isVirtual: s.isVirtual });

  const proceed = async () => {
    if (!trip || !slot || !draft.seats.length) return;
    if (!authed) {
      router.push(`/sign-in?next=/trips/${instanceId}`);
      return;
    }
    setReserving(true);
    try {
      // Clear my own / expired holds on these seats (same slot) first.
      const nowMs = Date.now();
      const stale = (slot.holds ?? []).filter(
        (h: any) =>
          draft.seats.includes(h.seatLabel) &&
          (h.sessionToken === user!.id || +new Date(h.expiresAt) <= nowMs),
      );
      if (stale.length)
        await db.transact(
          stale.map((h: any) => db.tx.seatHolds[h.id].delete()),
        );

      const holds: Record<string, string> = {};
      const steps = draft.seats.map((label) => {
        const hid = id();
        holds[label] = hid;
        return db.tx.seatHolds[hid]
          .update({
            seatKey: slotSeatKey(slot.id, label),
            seatLabel: label,
            expiresAt: Date.now() + HOLD_MS,
            createdAt: Date.now(),
            sessionToken: user!.id,
          })
          .link({
            tripInstance: instanceId,
            cooperative: trip.cooperative?.id ?? undefined,
            user: user!.id,
            ...(slot.isVirtual ? {} : { tripVehicle: slot.id }),
          });
      });
      await db.transact(steps);
      draft.setHolds(holds);
      router.push(`/trips/${instanceId}/checkout`);
    } catch {
      toast.error("Un siège vient d'être réservé. Vérifiez votre sélection.");
      setReserving(false);
    }
  };

  return (
    <main className="pt-[100px]">
      <div className="mx-auto max-w-content px-[15px] py-10 lg:py-14">
        {/* Trip header */}
        <div className="mb-8 flex items-start gap-4 border-b border-navy/10 pb-8">
          <CoopLogo
            url={trip.cooperative?.logoUrl}
            name={trip.coopName}
            size={60}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2 font-body text-[13px] font-medium uppercase tracking-[1px] text-navy/50">
              <MapPin size={14} className="text-gold" />
              {trip.coopName} · {trip.vehicleName}
              {(trip as any).tag && (
                <TagBadge
                  name={(trip as any).tag.name}
                  color={(trip as any).tag.color}
                />
              )}
            </div>
            <h1 className="mt-2 font-display text-[38px] font-semibold uppercase leading-none tracking-[-1px] text-navy lg:text-[52px]">
              {trip.originName} <span className="text-gold">→</span>{" "}
              {trip.destName}
            </h1>
            <p className="mt-3 font-body text-[15px] font-medium text-navy">
              {new Date(trip.departureAt).toLocaleString("fr", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="mt-1 font-body text-sm font-light text-navy/60">
              Chauffeur ·{" "}
              <span className="font-medium text-navy">
                {slot.driverName ?? "-"}
              </span>
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="border border-navy/10 bg-white p-6">
            <h2 className="font-display text-2xl font-semibold uppercase tracking-[-0.5px] text-navy">
              Choisissez vos sièges
            </h2>
            <p className="mb-5 mt-1 font-body text-sm font-light text-navy/60">
              Sélectionnez votre véhicule puis vos places. La connexion est
              demandée au moment de continuer.
            </p>
            {slots.length > 1 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {slots.map((s) => {
                  const taken = new Set([
                    ...(s.tickets ?? [])
                      .filter((t: any) => !DEAD.includes(t.booking?.status))
                      .map((t: any) => t.seatLabel),
                    ...(s.holds ?? [])
                      .filter((h: any) => +new Date(h.expiresAt) > now)
                      .map((h: any) => h.seatLabel),
                  ]).size;
                  const left = (s.seatsTotal ?? 0) - taken;
                  return (
                    <button
                      key={s.id}
                      onClick={() => pickSlot(s)}
                      className={
                        s.id === slot?.id
                          ? "inline-flex items-center gap-1.5 bg-navy px-4 py-2 font-display text-[13px] font-semibold uppercase tracking-[0.5px] text-white"
                          : "inline-flex items-center gap-1.5 border border-navy/15 px-4 py-2 font-display text-[13px] font-semibold uppercase tracking-[0.5px] text-navy/70 transition-colors hover:bg-mist"
                      }
                    >
                      <Bus size={14} /> {s.label} · {left} pl.
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-center">
              <SeatSelector
                layout={layout}
                taken={takenByOthers}
                selected={draft.seats}
                onToggle={toggle}
                max={6}
              />
            </div>
          </div>

          <div className="lg:sticky lg:top-[120px] lg:self-start">
            <div className="border border-navy/10 bg-white p-6">
              <h3 className="font-display text-xl font-semibold uppercase tracking-[-0.5px] text-navy">
                Récapitulatif
              </h3>
              <div className="mt-4 space-y-2.5">
                {slots.length > 1 && (
                  <Row label="Véhicule" value={slot?.label ?? "—"} />
                )}
                <Row
                  label="Sièges"
                  value={
                    draft.seats.length
                      ? [...draft.seats].sort((a, b) => +a - +b).join(", ")
                      : "—"
                  }
                />
                <Row label="Prix unitaire" value={fmtMoney(trip.price)} />
              </div>
              <div className="mt-5 flex items-end justify-between border-t border-navy/10 pt-4">
                <span className="font-body text-[11px] font-semibold uppercase tracking-[2px] text-navy/50">
                  Total
                </span>
                <span className="font-display text-3xl font-semibold text-gold">
                  {fmtMoney(total)}
                </span>
              </div>
              <button
                className={`mt-5 ${btnGold}`}
                disabled={!draft.seats.length || reserving}
                onClick={proceed}
              >
                {reserving
                  ? "Réservation…"
                  : !authed && draft.seats.length
                    ? "Se connecter pour continuer"
                    : "Continuer"}{" "}
                <ArrowRight size={16} />
              </button>
              <p className="mt-4 flex items-center justify-center gap-1.5 font-body text-xs font-light text-navy/50">
                <ShieldCheck size={14} className="text-gold" /> Siège garanti,
                zéro double-réservation
              </p>
            </div>
            <div className="mt-3 flex justify-center">
              <span
                className={
                  "inline-flex items-center border px-3 py-1.5 font-display text-[12px] font-semibold uppercase tracking-[0.5px] " +
                  (available <= 3
                    ? "border-sale/30 bg-sale/10 text-sale"
                    : "border-navy/15 bg-navy/[.04] text-navy/70")
                }
              >
                {available} places restantes
                {slots.length > 1 ? ` · ${slot?.label}` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between font-body text-sm">
      <span className="font-light text-navy/60">{label}</span>
      <span className="font-medium text-navy">{value}</span>
    </div>
  );
}
