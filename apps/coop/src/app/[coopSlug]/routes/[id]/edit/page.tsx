"use client";
import { PageSkeleton } from "@cp/ui";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, MapPin, Lock } from "lucide-react";
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
  routeStatus,
  notDeleted,
  toMoney,
  toInt,
} from "@cp/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
} from "@cp/ui/shadcn";

const STATUSES = ["active", "inactive"];

export default function EditRoutePage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const routeId = params.id;
  const currency = coop.currency ?? "MGA";

  const { data, isLoading } = db.useQuery({
    routes: {
      $: { where: { id: routeId, "cooperative.id": coopId } },
      origin: {},
      destination: {},
      tripInstances: {},
    },
    destinations: { $: { where: { "cooperative.id": coopId } } },
    cooperatives: { $: { where: { id: coopId } }, enabledDestinations: {} },
  });
  const route = data?.routes?.[0];
  const attachedTrips = (route?.tripInstances ?? []).filter(notDeleted);
  const hasTrips = attachedTrips.length > 0;
  const destinations = useMemo(() => {
    const priv = (data?.destinations ?? []).filter(notDeleted);
    const enabled = (data?.cooperatives?.[0]?.enabledDestinations ?? []).filter(notDeleted);
    const map = new Map<string, any>();
    for (const d of [...enabled, ...priv]) map.set(d.id, d);
    return Array.from(map.values()).sort((a: any, b: any) =>
      String(a.name).localeCompare(String(b.name)),
    );
  }, [data]);

  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [nameEdited, setNameEdited] = useState(false);
  const [originId, setOriginId] = useState("");
  const [destId, setDestId] = useState("");
  const [price, setPrice] = useState("");
  const [dist, setDist] = useState("");
  const [dur, setDur] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (route && !hydrated) {
      setName(route.name ?? "");
      setOriginId(route.origin?.id ?? "");
      setDestId(route.destination?.id ?? "");
      setPrice(String(route.basePrice ?? ""));
      setDist(route.distanceKm ? String(route.distanceKm) : "");
      setDur(route.durationMin ? String(route.durationMin) : "");
      setStatus(route.status ?? "active");
      setNameEdited(!!route.name); // keep existing name; auto only if empty
      setHydrated(true);
    }
  }, [route, hydrated]);

  // Auto-fill name "Origine → Destination" until the user types their own.
  useEffect(() => {
    if (!hydrated || nameEdited) return;
    const o = destinations.find((d: any) => d.id === originId)?.name;
    const d = destinations.find((x: any) => x.id === destId)?.name;
    setName(o && d ? `${o} → ${d}` : "");
  }, [originId, destId, nameEdited, hydrated, destinations]);

  const submit = async () => {
    if (!originId || !destId) {
      toast.error("Origine et destination requises");
      return;
    }
    const origin = destinations.find((d: any) => d.id === originId);
    const dest = destinations.find((d: any) => d.id === destId);
    const finalName = name || `${origin?.name ?? ""} → ${dest?.name ?? ""}`;

    setSaving(true);
    try {
      const payload: any = { name: finalName, basePrice: toMoney(price), currency, status };
      if (dist) payload.distanceKm = toInt(dist);
      if (dur) payload.durationMin = toInt(dur);

      await db.transact(
        db.tx.routes[routeId].update(payload).link({ origin: originId, destination: destId }),
      );
      toast.success("Itinéraire mis à jour");
      router.push(`/${slug}/routes`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "routes", { role, permissions, isPlatformAdmin })}
      title="Modifier l'itinéraire"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Itinéraires</span>
          <ChevronRight size={12} />
          <span className="text-ink">Modifier</span>
        </>
      }
      action={
        <Link href={`/${slug}/routes`}>
          <Button size="sm" variant="outline">
            <ArrowLeft size={16} /> Retour
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <PageSkeleton />
      ) : !route ? (
        <p className="text-ink-soft">Itinéraire introuvable.</p>
      ) : (
        <div className="mx-auto max-w-4xl">
          {hasTrips && (
            <Card className="mb-6 flex items-start gap-3 border-laterite/30 bg-laterite/5 p-4">
              <Lock size={18} className="mt-0.5 shrink-0 text-laterite" />
              <p className="text-sm text-ink-soft">
                Cet itinéraire a des trajets associés. L'origine et la destination sont
                verrouillées, mais vous pouvez modifier le nom, le tarif et le statut.
              </p>
            </Card>
          )}
          <FormSection index="01" title="Trajet" description="Origine, destination et nom affiché de l'itinéraire.">
          <div className="grid gap-4">
            <Field label="Nom" hint="Auto-rempli depuis Origine → Destination">
              <Input value={name} onChange={(e) => { setName(e.target.value); setNameEdited(true); }} placeholder="Origine → Destination" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Origine">
                <Select value={originId} onValueChange={setOriginId} disabled={hasTrips}>
                  <SelectTrigger>
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={15} className="text-ink-soft/60" />
                      <SelectValue placeholder="Sélectionner…" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Destination">
                <Select value={destId} onValueChange={setDestId} disabled={hasTrips}>
                  <SelectTrigger>
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={15} className="text-ink-soft/60" />
                      <SelectValue placeholder="Sélectionner…" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
          </FormSection>

          <FormSection index="02" title="Tarif & détails" description="Prix de base, distance, durée et statut de l'itinéraire.">
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Prix (MGA)">
                <Input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
              </Field>
              <Field label="Distance (km)">
                <Input inputMode="numeric" value={dist} onChange={(e) => setDist(e.target.value)} />
              </Field>
              <Field label="Durée (min)">
                <Input inputMode="numeric" value={dur} onChange={(e) => setDur(e.target.value)} />
              </Field>
            </div>
            <Field label="Statut">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {routeStatus[s]?.label ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          </FormSection>

          <div className="flex justify-end gap-2 pt-2">
            <Link href={`/${slug}/routes`}>
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
