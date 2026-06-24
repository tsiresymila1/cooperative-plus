"use client";
import { PageSkeleton } from "@cp/ui";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Wallet, Activity, Lock } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  Button,
  Card,
  FormSection,
  Field,
  toast,
  fmtMoney,
  tripStatus,
  toMoney,
  combineDateTime,
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
  TimePicker,
} from "@cp/ui/shadcn";

const dKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const STATUSES = ["scheduled", "boarding", "departed", "arrived", "cancelled"];

export default function EditTripPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tripId = params.id;

  const { data, isLoading } = db.useQuery({
    tripInstances: { $: { where: { id: tripId, "cooperative.id": coopId } }, bookings: {}, tag: {} },
    tags: { $: {}, cooperative: {} },
  });
  const trip = data?.tripInstances?.[0];
  const tags = (data?.tags ?? []).filter(notDeleted).filter((t: any) => t.isGlobal || t.cooperative?.id === coopId);
  const activeBookings = (trip?.bookings ?? []).filter(
    (b: any) => !["cancelled", "expired"].includes(b.status),
  );
  const hasActiveBookings = activeBookings.length > 0;

  const [status, setStatus] = useState("scheduled");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("06:00");
  const [price, setPrice] = useState("");
  const [tagId, setTagId] = useState("");
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (trip && !hydrated) {
      setStatus(trip.status ?? "scheduled");
      setDate(trip.departDate ?? "");
      const d = new Date(trip.departureAt);
      setTime(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      );
      setPrice(String(trip.price ?? ""));
      setTagId((trip as any).tag?.id ?? "");
      setHydrated(true);
    }
  }, [trip, hydrated]);

  const submit = async () => {
    if (!trip) return;
    setSaving(true);
    try {
      let chunk = db.tx.tripInstances[tripId].update({
        status,
        departDate: date,
        departureAt: combineDateTime(date, time),
        price: toMoney(price),
      });
      // `tag` is a one-link: linking replaces; unlink clears it.
      const prevTag = (trip as any).tag?.id ?? "";
      if (tagId) chunk = chunk.link({ tag: tagId });
      else if (prevTag) chunk = chunk.unlink({ tag: prevTag });
      await db.transact(chunk);
      toast.success("Trajet mis à jour");
      router.push(`/${slug}/trips`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "trips", { role, permissions, isPlatformAdmin })}
      title="Modifier le trajet"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Trajets</span>
          <ChevronRight size={12} />
          <span className="text-ink">Modifier</span>
        </>
      }
      action={
        <Link href={`/${slug}/trips`}>
          <Button size="sm" variant="outline">
            <ArrowLeft size={16} /> Retour
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <PageSkeleton />
      ) : !trip ? (
        <p className="text-ink-soft">Trajet introuvable.</p>
      ) : hasActiveBookings ? (
        <div className="mx-auto max-w-2xl">
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-laterite/10 text-laterite">
              <Lock size={22} />
            </div>
            <h3 className="font-display text-lg font-bold text-ink">
              Modification impossible
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
              Ce trajet a des réservations confirmées. Annulez-les avant de le modifier.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href={`/${slug}/trips/${tripId}`}>
                <Button size="sm">
                  <ArrowLeft size={16} /> Voir le trajet
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl">
          <FormSection index="01" title="Statut & départ" description={`${trip.originName} → ${trip.destName} · ${trip.vehicleName}`}>
          <div className="grid gap-4">
            <Field label="Statut">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <span className="inline-flex items-center gap-2">
                    <Activity size={15} className="text-ink-soft/60" />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {tripStatus[s]?.label ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date de départ">
                <DatePicker value={date ? new Date(date + "T00:00:00") : undefined} onChange={(d) => setDate(d ? dKey(d) : "")} />
              </Field>
              <Field label="Heure">
                <TimePicker value={time} onChange={setTime} />
              </Field>
            </div>
            <Field label="Prix (MGA)" hint={`Actuel: ${fmtMoney(trip.price)}`}>
              <div className="relative">
                <Wallet size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                <Input
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Tag (optionnel)" hint="Affiché en badge en haut à gauche du trajet.">
              <Select value={tagId || "none"} onValueChange={(v) => setTagId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucun —</SelectItem>
                  {tags.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          </FormSection>
          <div className="flex justify-end gap-2 pt-2">
            <Link href={`/${slug}/trips`}>
              <Button variant="outline" size="sm">
                Annuler
              </Button>
            </Link>
            <Button size="sm" onClick={submit} disabled={saving}>
              {saving ? "…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
