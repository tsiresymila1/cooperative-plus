"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, CoopLogo } from "@cp/ui";
import { SeatSelector, type Cell } from "@cp/ui";
import { toast } from "@cp/ui";
import { db, id } from "@cp/ui";
import { useBookingDraft } from "@/lib/booking-store";
import { fmtMoney } from "@cp/ui";

const HOLD_MS = 5 * 60 * 1000;

export default function TripDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id: instanceId } = use(params);
  const router = useRouter();
  const { user } = db.useAuth();
  const draft = useBookingDraft();
  const [reserving, setReserving] = useState(false);
  const authed = !!user && !(user as { isGuest?: boolean }).isGuest;

  const { data, isLoading } = db.useQuery({
    tripInstances: { $: { where: { id: instanceId } }, cooperative: {}, tickets: {}, holds: {}, vehicle: { seatMaps: {} } },
  });
  const trip = data?.tripInstances?.[0];

  const now = Date.now();
  const takenByOthers = [
    ...(trip?.tickets ?? []).map((t) => t.seatLabel),
    ...(trip?.holds ?? []).filter((h) => +new Date(h.expiresAt) > now).map((h) => h.seatLabel),
  ].filter((label) => !draft.seats.includes(label));

  useEffect(() => {
    if (trip) draft.setTrip({
      instanceId, coopId: trip.cooperative?.id ?? "", price: trip.price, currency: trip.currency,
      origin: trip.originName, dest: trip.destName, departureAt: +new Date(trip.departureAt),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id]);

  // Selecting is purely local — no login required to browse/pick.
  const toggle = (label: string) => { if (trip) draft.toggleSeat(label); };

  // Holds are created only when proceeding, and only once signed in.
  const proceed = async () => {
    if (!trip || !draft.seats.length) return;
    if (!authed) { router.push(`/sign-in?next=/trips/${instanceId}`); return; }
    setReserving(true);
    try {
      // Clear my own / expired holds on these seats first, so re-selecting the
      // same seat doesn't collide with the unique seatKey from a prior attempt.
      const nowMs = Date.now();
      const stale = (trip.holds ?? []).filter((h) =>
        draft.seats.includes(h.seatLabel) && (h.sessionToken === user!.id || +new Date(h.expiresAt) <= nowMs));
      if (stale.length) await db.transact(stale.map((h) => db.tx.seatHolds[h.id].delete()));

      const holds: Record<string, string> = {};
      const steps = draft.seats.map((label) => {
        const hid = id(); holds[label] = hid;
        return db.tx.seatHolds[hid].update({
          seatKey: `${instanceId}_${label}`, seatLabel: label, expiresAt: Date.now() + HOLD_MS, createdAt: Date.now(), sessionToken: user!.id,
        }).link({ tripInstance: instanceId, cooperative: trip.cooperative?.id ?? undefined, user: user!.id });
      });
      await db.transact(steps); // unique seatKey = real conflict only if held by someone else
      draft.setHolds(holds);
      router.push(`/trips/${instanceId}/checkout`);
    } catch {
      toast.error("Un siège vient d'être réservé. Vérifiez votre sélection.");
      setReserving(false);
    }
  };

  if (isLoading) return (<><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-20 text-ink-soft">Chargement…</main></>);
  // Hide trips from suspended coops (treat as not found).
  if (!trip || (trip.cooperative as any)?.subscriptionStatus === "suspended")
    return (<><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-20">Trajet introuvable.</main></>);

  // Same seat layout as the cooperative's vehicle editor; fallback to snapshot.
  const activeMap = (trip.vehicle?.seatMaps ?? []).find((m: any) => m.isActive) ?? (trip.vehicle?.seatMaps ?? [])[0];
  const layout = (Array.isArray(activeMap?.layout) ? activeMap.layout : (trip.seatMapSnapshot as Cell[])) ?? [];
  const available = trip.seatsTotal - takenByOthers.length;
  const total = trip.price * draft.seats.length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 flex items-center gap-4">
          <CoopLogo url={trip.cooperative?.logoUrl} name={trip.coopName} size={56} />
          <div>
            <div className="flex items-center gap-2 text-sm text-ink-soft"><MapPin size={14} className="text-orange" />{trip.coopName} · {trip.vehicleName}</div>
            <h1 className="mt-1 font-display text-3xl font-bold">{trip.originName} → {trip.destName}</h1>
            <div className="mt-1 flex items-center gap-4 font-mono text-ink-soft">
              <span className="text-lg font-semibold text-ink">{new Date(trip.departureAt).toLocaleString("fr", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card className="p-6">
            <h2 className="mb-1 font-display text-lg font-bold">Choisissez vos sièges</h2>
            <p className="mb-5 text-sm text-ink-soft">Sélectionnez vos places, puis validez. La connexion est demandée au moment de continuer.</p>
            <div className="flex justify-center">
              <SeatSelector layout={layout} taken={takenByOthers} selected={draft.seats} onToggle={toggle} max={6} />
            </div>
          </Card>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card className="p-5">
              <h3 className="font-display text-lg font-bold">Récapitulatif</h3>
              <div className="mt-3 space-y-2 text-sm">
                <Row label="Sièges" value={draft.seats.length ? [...draft.seats].sort((a, b) => +a - +b).join(", ") : "—"} />
                <Row label="Prix unitaire" value={fmtMoney(trip.price)} />
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-ink/8 pt-4">
                <span className="text-sm text-ink-soft">Total</span>
                <span className="font-mono text-2xl font-bold">{fmtMoney(total)}</span>
              </div>
              <Button className="mt-4 w-full" disabled={!draft.seats.length || reserving} onClick={proceed}>
                {reserving ? "Réservation…" : !authed && draft.seats.length ? "Se connecter pour continuer" : "Continuer"} <ArrowRight size={16} />
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-soft/70"><ShieldCheck size={13} className="text-baobab" /> Siège garanti, zéro double-réservation</p>
            </Card>
            <div className="mt-3 flex justify-center"><Badge tone={available <= 3 ? "warning" : "success"}>{available} places restantes</Badge></div>
          </div>
        </div>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-ink-soft">{label}</span><span className="font-medium text-ink">{value}</span></div>;
}
