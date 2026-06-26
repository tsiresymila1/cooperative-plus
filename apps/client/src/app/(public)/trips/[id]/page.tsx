"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bus, MapPin, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, CoopLogo, Spinner, TagBadge } from "@cp/ui";
import { SeatSelector, type Cell, tripSlots, slotSeatKey } from "@cp/ui";
import { toast } from "@cp/ui";
import { db, id } from "@cp/ui";
import { useBookingDraft } from "@/lib/booking-store";
import { fmtMoney } from "@cp/ui";

const HOLD_MS = 5 * 60 * 1000;
const DEAD = ["cancelled", "expired", "refunded"];

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
      <>
        <SiteHeader />
        <main className="mx-auto grid max-w-6xl place-items-center px-5 py-20">
          <Spinner size={28} />
        </main>
      </>
    );
  if (!trip || (trip.cooperative as any)?.subscriptionStatus === "suspended")
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-5 py-20">
          Trajet introuvable.
        </main>
      </>
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
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 flex items-center gap-4">
          <CoopLogo
            url={trip.cooperative?.logoUrl}
            name={trip.coopName}
            size={56}
          />
          <div>
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <MapPin size={14} className="text-orange" />
              {trip.coopName} · {trip.vehicleName}
              {(trip as any).tag && (
                <TagBadge
                  name={(trip as any).tag.name}
                  color={(trip as any).tag.color}
                />
              )}
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold">
              {trip.originName} → {trip.destName}
            </h1>
            <div className="mt-1 flex items-center gap-4 font-mono text-ink-soft">
              <span className="text-lg font-semibold text-ink">
                {new Date(trip.departureAt).toLocaleString("fr", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              Chauffeur ·{" "}
              <span className="font-medium text-ink">
                {slot.driverName ?? "-"}
              </span>
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card className="p-6">
            <h2 className="mb-1 font-display text-lg font-bold">
              Choisissez vos sièges
            </h2>
            <p className="mb-4 text-sm text-ink-soft">
              Sélectionnez votre véhicule puis vos places. La connexion est
              demandée au moment de continuer.
            </p>
            {slots.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
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
                          ? "inline-flex items-center gap-1.5 rounded-md bg-strong px-3 py-1.5 text-xs font-bold text-white"
                          : "inline-flex items-center gap-1.5 rounded-md border border-ink/12 px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-ink/5"
                      }
                    >
                      <Bus size={13} /> {s.label} · {left} pl.
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
          </Card>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card className="p-5">
              <h3 className="font-display text-lg font-bold">Récapitulatif</h3>
              <div className="mt-3 space-y-2 text-sm">
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
              <div className="mt-4 flex items-end justify-between border-t border-ink/8 pt-4">
                <span className="text-sm text-ink-soft">Total</span>
                <span className="font-mono text-2xl font-bold">
                  {fmtMoney(total)}
                </span>
              </div>
              <Button
                className="mt-4 w-full text-white"
                disabled={!draft.seats.length || reserving}
                onClick={proceed}
              >
                {reserving
                  ? "Réservation…"
                  : !authed && draft.seats.length
                    ? "Se connecter pour continuer"
                    : "Continuer"}{" "}
                <ArrowRight size={16} />
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-soft/70">
                <ShieldCheck size={13} className="text-baobab" /> Siège garanti,
                zéro double-réservation
              </p>
            </Card>
            <div className="mt-3 flex justify-center">
              <Badge tone={available <= 3 ? "warning" : "success"}>
                {available} places restantes
                {slots.length > 1 ? ` · ${slot?.label}` : ""}
              </Badge>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
