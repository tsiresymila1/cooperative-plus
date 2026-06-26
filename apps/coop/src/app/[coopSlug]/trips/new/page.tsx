"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ChevronRight, Route as RouteIcon, Bus, Wallet, Plus, X, IdCard } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  id,
  Button,
  FormSection,
  Field,
  Badge,
  toast,
  fmtMoney,
  notDeleted,
  toMoney,
  combineDateTime,
  todayISO,
} from "@cp/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Combobox,
  Input,
  DatePicker,
  TimePicker,
} from "@cp/ui/shadcn";

const dKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// Next full hour as HH:00 (8:15 → 09:00; 9:00 stays 09:00). Caps at 23:00.
const nextHour = () => {
  const d = new Date();
  const h = d.getMinutes() > 0 ? d.getHours() + 1 : d.getHours();
  return `${String(Math.min(h, 23)).padStart(2, "0")}:00`;
};
const seatsOf = (m: any) =>
  Array.isArray(m?.layout) ? m.layout.filter((c: any) => c.type === "seat").length : (m?.seatCount ?? 0);

const schema = z.object({
  routeId: z.string().min(1, "Sélectionnez un itinéraire"),
  date: z.string().min(1, "Date de départ requise"),
  time: z.string().min(1, "Heure requise"),
  price: z.string().optional(),
  tagId: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function NewTripPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const currency = coop.currency ?? "MGA";

  const { data } = db.useQuery({
    routes: { $: { where: { "cooperative.id": coopId } }, origin: {}, destination: {} },
    vehicleModels: { $: { where: { "cooperative.id": coopId } } },
    drivers: { $: { where: { "cooperative.id": coopId } } },
    vehicles: { $: { where: { "cooperative.id": coopId } }, model: {} },
    tags: { $: {}, cooperative: {} },
  });
  const routes = (data?.routes ?? []).filter(notDeleted);
  const models = (data?.vehicleModels ?? []).filter(notDeleted);
  const drivers = (data?.drivers ?? []).filter(notDeleted);
  const vehicles = (data?.vehicles ?? []).filter(notDeleted);
  const tags = (data?.tags ?? []).filter(notDeleted).filter((t: any) => t.isGlobal || t.cooperative?.id === coopId);

  type SlotInput = { model: string; driver: string; vehicle: string };
  const [slots, setSlots] = useState<SlotInput[]>([{ model: "", driver: "", vehicle: "" }]);
  const [slotError, setSlotError] = useState("");

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { routeId: "", date: todayISO(), time: nextHour(), price: "", tagId: "" },
  });
  const routeId = watch("routeId");
  const date = watch("date");
  const time = watch("time");
  const tagId = watch("tagId") ?? "";

  const route = routes.find((r: any) => r.id === routeId);
  const chosen = slots.map((s) => models.find((m: any) => m.id === s.model)).filter(Boolean) as any[];
  const totalSeats = chosen.reduce((s, m) => s + seatsOf(m), 0);

  const setSlot = (i: number, patch: Partial<SlotInput>) => {
    setSlotError("");
    setSlots((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };
  const addSlot = () => setSlots((s) => [...s, { model: "", driver: "", vehicle: "" }]);
  const removeSlot = (i: number) => setSlots((s) => s.filter((_, j) => j !== i));

  const submit = handleSubmit(async (v) => {
    if (!route) return;
    if (chosen.length === 0) { setSlotError("Ajoutez au moins un véhicule (modèle)."); return; }
    setSlotError("");

    const priceVal = v.price ? toMoney(v.price) : route.basePrice;
    const departureAt = combineDateTime(v.date, v.time);
    const now = Date.now();
    const tripId = id();
    const first = chosen[0];

    try {
      const txs: any[] = [
        db.tx.tripInstances[tripId]
          .update({
            originName: route.origin?.name ?? "",
            destName: route.destination?.name ?? "",
            departDate: date,
            departureAt,
            routeName: route.name,
            coopName: coop.displayName,
            vehicleName: chosen.length > 1 ? `${chosen.length} véhicules` : first.name,
            status: "scheduled",
            price: priceVal,
            currency,
            seatMapSnapshot: first.layout ?? [],
            seatsTotal: totalSeats,
            seatsBooked: 0,
            createdAt: now,
          })
          .link({ cooperative: coopId, route: routeId, ...(tagId ? { tag: tagId } : {}) }),
      ];
      let vi = 0;
      slots.forEach((s) => {
        const m = models.find((x: any) => x.id === s.model);
        if (!m) return;
        vi += 1;
        const drv = drivers.find((d: any) => d.id === s.driver);
        const veh = vehicles.find((v: any) => v.id === s.vehicle);
        txs.push(
          db.tx.tripVehicles[id()]
            .update({
              label: `Voiture ${vi}`,
              seatMapSnapshot: m.layout ?? [],
              seatsTotal: seatsOf(m),
              seatsBooked: 0,
              vehicleName: veh?.name ?? m.name,
              registrationNo: veh?.registrationNo ?? null,
              driverName: drv?.name ?? null,
              driverPhone: drv?.phone ?? null,
              createdAt: now,
            })
            .link({ tripInstance: tripId, model: m.id, ...(drv ? { driver: drv.id } : {}), ...(veh ? { vehicle: veh.id } : {}) }),
        );
      });
      await db.transact(txs);
      toast.success("Trajet créé");
      router.push(`/${slug}/trips`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  });

  return (
    <DashboardShell
      nav={coopNav(slug, "trips", { role, permissions, isPlatformAdmin })}
      title="Nouveau trajet"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={<><span>{coop.displayName}</span><ChevronRight size={12} /><span>Trajets</span><ChevronRight size={12} /><span className="text-ink">Nouveau</span></>}
      action={<Link href={`/${slug}/trips`}><Button size="sm" variant="outline"><ArrowLeft size={16} /> Retour</Button></Link>}
    >
      <div className="mx-auto max-w-4xl">
        <FormSection index="01" title="Itinéraire & véhicules" description="Déclarez le(s) véhicule(s) par modèle. Chauffeur et immatriculation sont optionnels — assignables maintenant ou plus tard.">
          <div className="grid gap-4">
            <Field label="Itinéraire" error={errors.routeId?.message}>
              <Select value={routeId} onValueChange={(v) => setValue("routeId", v, { shouldValidate: true })}>
                <SelectTrigger>
                  <span className="inline-flex items-center gap-2"><RouteIcon size={15} className="text-ink-soft/60" /><SelectValue placeholder="Sélectionner…" /></span>
                </SelectTrigger>
                <SelectContent>
                  {routes.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Véhicules du trajet" error={slotError} hint="Un ou plusieurs véhicules. Les places connues viennent du modèle.">
              <div className="grid gap-3">
                {slots.map((s, i) => {
                  const slotVehicles = vehicles.filter((v: any) => !s.model || (v.model as any)?.id === s.model);
                  return (
                    <div key={i} className="rounded-[--radius] border border-ink/8 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft/55">Voiture {i + 1}</span>
                        {slots.length > 1 && (
                          <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={() => removeSlot(i)}><X size={14} /></Button>
                        )}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Select value={s.model} onValueChange={(v) => setSlot(i, { model: v, vehicle: "" })}>
                          <SelectTrigger>
                            <span className="inline-flex items-center gap-2"><Bus size={15} className="text-ink-soft/60" /><SelectValue placeholder="Modèle…" /></span>
                          </SelectTrigger>
                          <SelectContent>
                            {models.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name} · {seatsOf(m)} places</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Combobox
                          value={s.driver}
                          onValueChange={(v) => setSlot(i, { driver: v })}
                          options={[{ value: "", label: "— Chauffeur (option) —" }, ...drivers.map((d: any) => ({ value: d.id, label: d.name, hint: d.phone }))]}
                          placeholder="Chauffeur" searchPlaceholder="Rechercher chauffeur…"
                          icon={<IdCard size={15} className="text-ink-soft/60" />}
                        />
                        <Combobox
                          value={s.vehicle}
                          onValueChange={(v) => setSlot(i, { vehicle: v })}
                          disabled={!s.model}
                          options={[{ value: "", label: "— Véhicule (option) —" }, ...slotVehicles.map((v: any) => ({ value: v.id, label: v.name, hint: v.registrationNo }))]}
                          placeholder="Immatriculation" searchPlaceholder="Rechercher véhicule…"
                          icon={<Bus size={15} className="text-ink-soft/60" />}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={addSlot} className="self-start"><Plus size={14} /> Ajouter un véhicule</Button>
                  {totalSeats > 0 && <Badge tone="neutral">{totalSeats} places au total</Badge>}
                </div>
                {models.length === 0 && (
                  <p className="text-xs text-warning">Aucun modèle. Créez-en d&apos;abord dans <Link href={`/${slug}/models`} className="underline">Modèles</Link>.</p>
                )}
              </div>
            </Field>
          </div>
        </FormSection>

        <FormSection index="02" title="Départ & tarif" description="Date, heure de départ et prix du billet pour cette instance.">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date de départ" error={errors.date?.message}>
                <DatePicker value={date ? new Date(date + "T00:00:00") : undefined} onChange={(d) => setValue("date", d ? dKey(d) : "", { shouldValidate: true })} />
              </Field>
              <Field label="Heure" error={errors.time?.message}><TimePicker value={time} onChange={(t) => setValue("time", t, { shouldValidate: true })} /></Field>
            </div>
            <Field label="Prix (MGA)" hint={route ? `Prix de base: ${fmtMoney(route.basePrice)}` : "Laissez vide pour le prix de base de l'itinéraire"}>
              <div className="relative">
                <Wallet size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                <Input inputMode="numeric" placeholder={route ? String(route.basePrice) : "0"} {...register("price")} className="pl-9" />
              </div>
            </Field>
            <Field label="Tag (optionnel)" hint="Affiché en badge en haut à gauche du trajet.">
              <Select value={tagId || "none"} onValueChange={(v) => setValue("tagId", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucun —</SelectItem>
                  {tags.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FormSection>

        <div className="flex justify-end gap-2 pt-2">
          <Link href={`/${slug}/trips`}><Button variant="outline" size="sm">Annuler</Button></Link>
          <Button size="sm" onClick={submit} disabled={isSubmitting}>{isSubmitting ? "…" : "Créer le trajet"}</Button>
        </div>
      </div>
    </DashboardShell>
  );
}
