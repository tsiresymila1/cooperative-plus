"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ChevronRight,
  Route as RouteIcon,
  Bus,
  Wallet,
  Repeat,
  Clock,
  Plus,
  X,
  Trash2,
  CalendarX,
  CalendarDays,
  IdCard,
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
  FormSection,
  Field,
  toast,
  useConfirm,
  fmtMoney,
  notDeleted,
  toMoney,
  combineDateTime,
  todayISO,
  useCoopPlan,
  logActivity,
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

const dKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (s: string, n: number) => {
  const d = new Date(`${s}T00:00:00`);
  d.setDate(d.getDate() + n);
  return dKey(d);
};

// 0 = Dim … 6 = Sam (matches Date.getDay())
const weekdayOf = (dateStr: string) => new Date(`${dateStr}T00:00:00`).getDay();

// UI ordering: Lun…Dim → getDay() value
const WEEKDAYS: { label: string; value: number }[] = [
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mer", value: 3 },
  { label: "Jeu", value: 4 },
  { label: "Ven", value: 5 },
  { label: "Sam", value: 6 },
  { label: "Dim", value: 0 },
];

const MAX_TRIPS = 200;
const BATCH_SIZE = 50;

type Freq = "daily" | "weekly" | "dates";
const FREQ_OPTIONS: { value: Freq; label: string }[] = [
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "dates", label: "Dates précises" },
];

const schema = z.object({
  routeId: z.string().min(1, "Sélectionnez un itinéraire"),
  price: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export default function RecurringTripPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin, userId } = useCoop();
  const { usage, max } = useCoopPlan(coopId);
  const router = useRouter();
  const confirm = useConfirm();
  const currency = coop.currency ?? "MGA";
  const today = todayISO();
  const tomorrow = addDays(today, 1);

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
  const seatsOf = (m: any) => Array.isArray(m?.layout) ? m.layout.filter((c: any) => c.type === "seat").length : (m?.seatCount ?? 0);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { routeId: "", price: "" },
  });
  const routeId = watch("routeId");

  // 01 Trajet & véhicules
  type SlotInput = { model: string; driver: string; vehicle: string };
  const [slots, setSlots] = useState<SlotInput[]>([{ model: "", driver: "", vehicle: "" }]);
  const [slotError, setSlotError] = useState("");
  const [tagId, setTagId] = useState("");
  const [timeError, setTimeError] = useState("");
  const [dateError, setDateError] = useState("");

  // 02 Récurrence
  const [freq, setFreq] = useState<Freq>("weekly");
  const [activeWeekdays, setActiveWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startDate, setStartDate] = useState(tomorrow);
  const [endDate, setEndDate] = useState("");
  const [exactPick, setExactPick] = useState(tomorrow);
  const [exactDates, setExactDates] = useState<string[]>([]);

  // End date auto-follows the start + frequency (daily → same day, weekly → +7).
  // Re-derived when freq/start change; the user can still override afterwards.
  useEffect(() => {
    if (freq === "dates") return;
    setEndDate(addDays(startDate, freq === "weekly" ? 7 : 0));
  }, [freq, startDate]);

  // 03 Heures de départ
  const [timeDraft, setTimeDraft] = useState("06:00");
  const [times, setTimes] = useState<string[]>([]);

  // 04 Exclusions
  const [excludedWeekdays, setExcludedWeekdays] = useState<number[]>([]);
  const [excludePick, setExcludePick] = useState("");
  const [excludedDates, setExcludedDates] = useState<string[]>([]);

  const route = routes.find((r: any) => r.id === routeId);
  const chosen = slots.map((s) => models.find((m: any) => m.id === s.model)).filter(Boolean) as any[];
  const totalSeats = chosen.reduce((s, m) => s + seatsOf(m), 0);
  const setSlot = (i: number, patch: Partial<SlotInput>) => {
    setSlotError("");
    setSlots((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };
  const addSlot = () => {
    setSlotError("");
    setSlots((s) => [...s, { model: "", driver: "", vehicle: "" }]);
  };
  const removeSlot = (i: number) => {
    setSlotError("");
    setSlots((s) => s.filter((_, j) => j !== i));
  };

  const toggle = (arr: number[], v: number, set: (n: number[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const addTime = () => {
    if (!timeDraft) return;
    setTimeError("");
    setTimes((prev) => (prev.includes(timeDraft) ? prev : [...prev, timeDraft].sort()));
  };
  const addExact = () => {
    if (!exactPick) return;
    setDateError("");
    setExactDates((prev) => (prev.includes(exactPick) ? prev : [...prev, exactPick].sort()));
    setExactPick("");
  };
  const addExclude = () => {
    if (!excludePick) return;
    setExcludedDates((prev) => (prev.includes(excludePick) ? prev : [...prev, excludePick].sort()));
    setExcludePick("");
  };

  // Build the list of valid dates (local, recalculated live).
  const validDates = useMemo(() => {
    let base: string[] = [];
    if (freq === "dates") {
      base = [...exactDates];
    } else if (startDate && endDate && startDate <= endDate) {
      const cur = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      while (cur.getTime() <= end.getTime()) {
        const key = dKey(cur);
        if (freq === "daily") {
          base.push(key);
        } else if (freq === "weekly" && activeWeekdays.includes(cur.getDay())) {
          base.push(key);
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    // Apply exclusions
    return base.filter(
      (d) => !excludedWeekdays.includes(weekdayOf(d)) && !excludedDates.includes(d),
    );
  }, [freq, exactDates, startDate, endDate, activeWeekdays, excludedWeekdays, excludedDates]);

  // Aperçu rows: (date × heure)
  const previewRows = useMemo(() => {
    const rows: { date: string; time: string }[] = [];
    for (const d of validDates) {
      for (const t of times) {
        rows.push({ date: d, time: t });
      }
    }
    return rows;
  }, [validDates, times]);

  const total = previewRows.length;

  const submit = handleSubmit(async (v) => {
    setSlotError("");
    setTimeError("");
    setDateError("");
    if (!route) return;
    if (chosen.length === 0) { setSlotError("Ajoutez au moins un véhicule (modèle)"); return; }
    if (times.length === 0) {
      setTimeError("Ajoutez au moins une heure de départ");
      return;
    }
    if (validDates.length === 0) {
      setDateError("Aucune date valide — vérifiez la période et les exclusions");
      return;
    }
    if (total > MAX_TRIPS) {
      toast.error(`Trop de trajets (${total}). Réduisez la période ou les heures (max ${MAX_TRIPS}).`);
      return;
    }
    // Plan quota: all these trips are created now → all count against this month.
    if (max.trips && max.trips > 0 && usage.trips + total > max.trips) {
      toast.error(`Limite du plan atteinte : ${usage.trips}/${max.trips} trajets ce mois, vous en ajoutez ${total}. Changez de plan dans Abonnement.`);
      return;
    }

    if (
      !(await confirm({
        title: `Créer ${total} trajets ?`,
        message: `${route.origin?.name ?? ""} → ${route.destination?.name ?? ""} · ${chosen.length} véhicule(s) · ${totalSeats} places`,
        confirmLabel: `Créer ${total} trajets`,
      }))
    )
      return;

    const first = chosen[0];
    const priceVal = v.price ? toMoney(v.price) : route.basePrice;
    const now = Date.now();

    try {
      // tripTemplate (config for future regeneration)
      const templateTx = db.tx.tripTemplates[id()]
        .update({
          recurrenceType: freq,
          startDate: freq === "dates" ? exactDates[0] ?? today : startDate,
          ...(freq !== "dates" && endDate ? { endDate } : {}),
          departureTime: times[0],
          excludedDates: {
            weekdays: excludedWeekdays,
            dates: excludedDates,
            times,
          },
          isActive: true,
          createdAt: now,
        })
        .link({ cooperative: coopId, route: routeId });

      // tripInstances (+ one tripVehicle slot per chosen model)
      const instanceTxs = previewRows.flatMap((row) => {
        const tId = id();
        const txs: any[] = [
          db.tx.tripInstances[tId]
            .update({
              originName: route.origin?.name ?? "",
              destName: route.destination?.name ?? "",
              departDate: row.date,
              departureAt: combineDateTime(row.date, row.time),
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
        slots.forEach((sl) => {
          const m = models.find((x: any) => x.id === sl.model);
          if (!m) return;
          vi += 1;
          const drv = drivers.find((d: any) => d.id === sl.driver);
          const veh = vehicles.find((v: any) => v.id === sl.vehicle);
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
              .link({ tripInstance: tId, model: m.id, ...(drv ? { driver: drv.id } : {}), ...(veh ? { vehicle: veh.id } : {}) }),
          );
        });
        return txs;
      });

      // Batch ≤ 50 steps each (template counts as a step in the first chunk)
      const allTxs = [templateTx, ...instanceTxs];
      for (let i = 0; i < allTxs.length; i += BATCH_SIZE) {
        await db.transact(allTxs.slice(i, i + BATCH_SIZE));
      }

      logActivity({ coopId, actorId: userId, action: "create", entityType: "trip", label: `${total} trajets récurrents · ${route.name ?? ""}`.trim() });
      toast.success(`${total} trajets créés`);
      router.push(`/${slug}/trips`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    }
  });

  return (
    <DashboardShell
      nav={coopNav(slug, "trips", { role, permissions, isPlatformAdmin })}
      title="Trajet récurrent"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Trajets</span>
          <ChevronRight size={12} />
          <span className="text-ink">Récurrent</span>
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
      <div className="mx-auto max-w-4xl">
        {/* 01 Trajet & véhicule */}
        <FormSection
          index="01"
          title="Itinéraire & véhicule"
          description="L'itinéraire et le véhicule définissent le plan de sièges réservable."
        >
          <div className="grid gap-4">
            <Field label="Itinéraire" error={errors.routeId?.message}>
              <Select value={routeId} onValueChange={(v) => setValue("routeId", v, { shouldValidate: true })}>
                <SelectTrigger>
                  <span className="inline-flex items-center gap-2">
                    <RouteIcon size={15} className="text-ink-soft/60" />
                    <SelectValue placeholder="Sélectionner…" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {routes.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Véhicules" error={slotError} hint="Modèle(s) appliqués à chaque trajet généré. Chauffeur et immatriculation optionnels.">
              <div className="grid gap-3">
                {slots.map((s, i) => {
                  const slotVehicles = vehicles.filter((v: any) => !s.model || (v.model as any)?.id === s.model);
                  return (
                    <div key={i} className="rounded-[--radius] border border-ink/8 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft/55">Voiture {i + 1}</span>
                        {slots.length > 1 && <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={() => removeSlot(i)}><X size={14} /></Button>}
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
                  <Button variant="outline" size="sm" onClick={addSlot}><Plus size={14} /> Ajouter un véhicule</Button>
                  {totalSeats > 0 && <Badge tone="neutral">{totalSeats} places</Badge>}
                </div>
                {models.length === 0 && <p className="text-xs text-warning">Aucun modèle. Créez-en dans <Link href={`/${slug}/models`} className="underline">Modèles</Link>.</p>}
              </div>
            </Field>
            <Field label="Tag (optionnel)" hint="Appliqué à tous les trajets générés.">
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
            <Field
              label="Prix (MGA)"
              hint={
                route
                  ? `Prix de base: ${fmtMoney(route.basePrice)}`
                  : "Laissez vide pour le prix de base de l'itinéraire"
              }
            >
              <div className="relative">
                <Wallet
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60"
                />
                <Input
                  inputMode="numeric"
                  placeholder={route ? String(route.basePrice) : "0"}
                  {...register("price")}
                  className="pl-9"
                />
              </div>
            </Field>
          </div>
        </FormSection>

        {/* 02 Récurrence */}
        <FormSection
          index="02"
          title="Récurrence"
          description="Définissez la fréquence et la période de génération des trajets."
        >
          <div className="grid gap-4">
            <Field label="Fréquence">
              <Select value={freq} onValueChange={(v) => { setDateError(""); setFreq(v as Freq); }}>
                <SelectTrigger>
                  <span className="inline-flex items-center gap-2">
                    <Repeat size={15} className="text-ink-soft/60" />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {FREQ_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {freq === "weekly" && (
              <Field label="Jours actifs">
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((d) => {
                    const on = activeWeekdays.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggle(activeWeekdays, d.value, setActiveWeekdays)}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                          on
                            ? "border-laterite bg-laterite/10 text-laterite"
                            : "border-ink/10 text-ink-soft hover:bg-ink/5"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}

            {freq === "dates" && (
              <Field label="Dates précises" error={dateError}>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <DatePicker
                      value={exactPick ? new Date(exactPick + "T00:00:00") : undefined}
                      onChange={(d) => setExactPick(d ? dKey(d) : "")}
                      placeholder="Choisir une date"
                    />
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addExact}>
                    <Plus size={15} /> Ajouter
                  </Button>
                </div>
                {exactDates.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {exactDates.map((d) => (
                      <Badge key={d} tone="neutral">
                        <span className="inline-flex items-center gap-1.5">
                          {d}
                          <button
                            type="button"
                            onClick={() => setExactDates((p) => p.filter((x) => x !== d))}
                            className="text-ink-soft/60 hover:text-danger"
                          >
                            <Trash2 size={12} />
                          </button>
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>
            )}

            {freq !== "dates" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date de début" error={dateError}>
                  <DatePicker
                    value={startDate ? new Date(startDate + "T00:00:00") : undefined}
                    onChange={(d) => { setDateError(""); setStartDate(d ? dKey(d) : ""); }}
                  />
                </Field>
                <Field label="Date de fin">
                  <DatePicker
                    value={endDate ? new Date(endDate + "T00:00:00") : undefined}
                    onChange={(d) => { setDateError(""); setEndDate(d ? dKey(d) : ""); }}
                  />
                </Field>
              </div>
            )}
          </div>
        </FormSection>

        {/* 03 Heures de départ */}
        <FormSection
          index="03"
          title="Heures de départ"
          description="Chaque heure génère un trajet par date valide. Au moins une est requise."
        >
          <div className="grid gap-4">
            <Field label="Ajouter une heure" error={timeError}>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <TimePicker value={timeDraft} onChange={setTimeDraft} />
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addTime}>
                  <Plus size={15} /> Ajouter
                </Button>
              </div>
            </Field>
            {times.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {times.map((t) => (
                  <Badge key={t} tone="neutral">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={12} /> {t}
                      <button
                        type="button"
                        onClick={() => { setTimeError(""); setTimes((p) => p.filter((x) => x !== t)); }}
                        className="text-ink-soft/60 hover:text-danger"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-soft/60">Aucune heure ajoutée.</p>
            )}
          </div>
        </FormSection>

        {/* 04 Exclusions */}
        <FormSection
          index="04"
          title="Exclusions"
          description="Retirez certains jours de la semaine ou des dates spécifiques."
        >
          <div className="grid gap-4">
            <Field label="Jours de semaine à exclure">
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => {
                  const on = excludedWeekdays.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggle(excludedWeekdays, d.value, setExcludedWeekdays)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        on
                          ? "border-danger bg-danger/10 text-danger"
                          : "border-ink/10 text-ink-soft hover:bg-ink/5"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Exclure une date">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <DatePicker
                    value={excludePick ? new Date(excludePick + "T00:00:00") : undefined}
                    onChange={(d) => setExcludePick(d ? dKey(d) : "")}
                    placeholder="Choisir une date"
                  />
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addExclude}>
                  <Plus size={15} /> Ajouter
                </Button>
              </div>
              {excludedDates.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {excludedDates.map((d) => (
                    <Badge key={d} tone="danger">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarX size={12} /> {d}
                        <button
                          type="button"
                          onClick={() => setExcludedDates((p) => p.filter((x) => x !== d))}
                          className="hover:text-danger"
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    </Badge>
                  ))}
                </div>
              )}
            </Field>
          </div>
        </FormSection>

        {/* Aperçu */}
        <Card className="mt-2 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
              <CalendarDays size={17} className="text-laterite" /> Aperçu
            </h3>
            <Badge tone={total > MAX_TRIPS ? "danger" : total > 0 ? "success" : "neutral"}>
              {total} trajet{total > 1 ? "s" : ""} seront créés
            </Badge>
          </div>
          {total > MAX_TRIPS && (
            <p className="mb-3 text-sm text-danger">
              Trop de trajets, réduisez la période ou les heures (max {MAX_TRIPS}).
            </p>
          )}
          {previewRows.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-ink/10">
              <table className="w-full text-sm">
                <thead className="bg-ink/[0.03] text-left text-xs uppercase text-ink-soft/70">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 10).map((r, i) => (
                    <tr key={`${r.date}-${r.time}-${i}`} className="border-t border-ink/5">
                      <td className="px-3 py-2 font-medium text-ink">{r.date}</td>
                      <td className="px-3 py-2 font-mono text-ink-soft">{r.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewRows.length > 10 && (
                <p className="bg-ink/[0.02] px-3 py-2 text-xs text-ink-soft/60">
                  + {previewRows.length - 10} autres…
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-soft/60">
              Configurez la récurrence et les heures pour voir l'aperçu.
            </p>
          )}
        </Card>

        <div className="flex justify-end gap-2 pt-4">
          <Link href={`/${slug}/trips`}>
            <Button variant="outline" size="sm">
              Annuler
            </Button>
          </Link>
          <Button size="sm" onClick={submit} disabled={isSubmitting || total === 0}>
            {isSubmitting ? "…" : `Créer ${total > 0 ? total : ""} trajet${total > 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
