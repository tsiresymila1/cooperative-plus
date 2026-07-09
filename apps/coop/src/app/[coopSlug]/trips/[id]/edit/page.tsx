"use client";
import { PageSkeleton } from "@cp/ui";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  logActivity,
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

const schema = z.object({
  status: z.string(),
  date: z.string().trim().min(1, "Date de départ requise"),
  time: z.string().trim().min(1, "Heure requise"),
  price: z
    .string()
    .trim()
    .min(1, "Prix requis")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Prix invalide"),
  tagId: z.string(),
});
type Values = z.infer<typeof schema>;

export default function EditTripPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin, userId } = useCoop();
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

  const [hydrated, setHydrated] = useState(false);

  const { handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { status: "scheduled", date: "", time: "06:00", price: "", tagId: "" },
  });
  const status = watch("status");
  const date = watch("date");
  const time = watch("time");
  const price = watch("price");
  const tagId = watch("tagId");

  useEffect(() => {
    if (trip && !hydrated) {
      const d = new Date(trip.departureAt);
      reset({
        status: trip.status ?? "scheduled",
        date: trip.departDate ?? "",
        time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
        price: String(trip.price ?? ""),
        tagId: (trip as any).tag?.id ?? "",
      });
      setHydrated(true);
    }
  }, [trip, hydrated, reset]);

  const submit = handleSubmit(async (v) => {
    if (!trip) return;
    try {
      let chunk = db.tx.tripInstances[tripId].update({
        status: v.status,
        departDate: v.date,
        departureAt: combineDateTime(v.date, v.time),
        price: toMoney(v.price),
      });
      // `tag` is a one-link: linking replaces; unlink clears it.
      const prevTag = (trip as any).tag?.id ?? "";
      if (v.tagId) chunk = chunk.link({ tag: v.tagId });
      else if (prevTag) chunk = chunk.unlink({ tag: prevTag });
      await db.transact(chunk);
      logActivity({ coopId, actorId: userId, action: "update", entityType: "trip", entityId: tripId, label: `${trip.originName ?? ""} → ${trip.destName ?? ""}`.trim() || "Trajet" });
      toast.success("Trajet mis à jour");
      router.push(`/${slug}/trips`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  });

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
              <Select value={status} onValueChange={(v) => setValue("status", v, { shouldValidate: true })}>
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
              <Field label="Date de départ" error={errors.date?.message}>
                <DatePicker value={date ? new Date(date + "T00:00:00") : undefined} onChange={(d) => setValue("date", d ? dKey(d) : "", { shouldValidate: true })} />
              </Field>
              <Field label="Heure" error={errors.time?.message}>
                <TimePicker value={time} onChange={(v) => setValue("time", v, { shouldValidate: true })} />
              </Field>
            </div>
            <Field label="Prix (MGA)" error={errors.price?.message} hint={`Actuel: ${fmtMoney(trip.price)}`}>
              <div className="relative">
                <Wallet size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                <Input
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setValue("price", e.target.value, { shouldValidate: true })}
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Tag (optionnel)" hint="Affiché en badge en haut à gauche du trajet.">
              <Select value={tagId || "none"} onValueChange={(v) => setValue("tagId", v === "none" ? "" : v)}>
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
            <Button size="sm" onClick={submit} disabled={isSubmitting}>
              {isSubmitting ? "…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
