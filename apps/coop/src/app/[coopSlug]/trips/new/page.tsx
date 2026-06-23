"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Route as RouteIcon, Bus, Wallet } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  id,
  Button,
  FormSection,
  Field,
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
  Input,
  DatePicker,
  TimePicker,
} from "@cp/ui/shadcn";

const dKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function NewTripPage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const currency = coop.currency ?? "MGA";

  const { data } = db.useQuery({
    routes: { $: { where: { "cooperative.id": coopId } }, origin: {}, destination: {} },
    vehicles: { $: { where: { "cooperative.id": coopId } }, seatMaps: {} },
  });
  const routes = (data?.routes ?? []).filter(notDeleted);
  const vehicles = (data?.vehicles ?? []).filter(notDeleted);

  const [routeId, setRouteId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("06:00");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const route = routes.find((r: any) => r.id === routeId);
  const vehicle = vehicles.find((v: any) => v.id === vehicleId);

  const submit = async () => {
    if (!route || !vehicle) {
      toast.error("Sélectionnez un itinéraire et un véhicule");
      return;
    }
    const activeMap =
      (vehicle.seatMaps ?? []).find((m: any) => m.isActive) ?? (vehicle.seatMaps ?? [])[0];
    if (!activeMap) {
      toast.error("Ce véhicule n'a pas de plan de sièges");
      return;
    }
    const layout = activeMap.layout ?? [];
    const seatsTotal = Array.isArray(layout)
      ? layout.filter((c: any) => c.type === "seat").length
      : vehicle.seatCount ?? 0;

    const priceVal = price ? toMoney(price) : route.basePrice;
    const departureAt = combineDateTime(date, time);

    setSaving(true);
    try {
      await db.transact(
        db.tx.tripInstances[id()]
          .update({
            originName: route.origin?.name ?? "",
            destName: route.destination?.name ?? "",
            departDate: date,
            departureAt,
            routeName: route.name,
            coopName: coop.displayName,
            vehicleName: vehicle.name,
            status: "scheduled",
            price: priceVal,
            currency,
            seatMapSnapshot: layout,
            seatsTotal,
            seatsBooked: 0,
            createdAt: Date.now(),
          })
          .link({ cooperative: coopId, route: routeId, vehicle: vehicleId }),
      );
      toast.success("Trajet créé");
      router.push(`/${slug}/trips`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "trips", { role, permissions, isPlatformAdmin })}
      title="Nouveau trajet"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Trajets</span>
          <ChevronRight size={12} />
          <span className="text-ink">Nouveau</span>
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
        <FormSection index="01" title="Itinéraire & véhicule" description="L'itinéraire et le véhicule définissent le plan de sièges réservable.">
          <div className="grid gap-4">
          <Field label="Itinéraire">
            <Select value={routeId} onValueChange={setRouteId}>
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
          <Field label="Véhicule">
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <span className="inline-flex items-center gap-2">
                  <Bus size={15} className="text-ink-soft/60" />
                  <SelectValue placeholder="Sélectionner…" />
                </span>
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} ({v.registrationNo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          </div>
        </FormSection>

        <FormSection index="02" title="Départ & tarif" description="Date, heure de départ et prix du billet pour cette instance.">
          <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date de départ">
              <DatePicker value={date ? new Date(date + "T00:00:00") : undefined} onChange={(d) => setDate(d ? dKey(d) : "")} />
            </Field>
            <Field label="Heure">
              <TimePicker value={time} onChange={setTime} />
            </Field>
          </div>
          <Field
            label="Prix (MGA)"
            hint={route ? `Prix de base: ${fmtMoney(route.basePrice)}` : "Laissez vide pour le prix de base de l'itinéraire"}
          >
            <div className="relative">
              <Wallet size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
              <Input
                inputMode="numeric"
                placeholder={route ? String(route.basePrice) : "0"}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-9"
              />
            </div>
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
            {saving ? "…" : "Créer le trajet"}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
