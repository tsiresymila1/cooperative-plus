"use client";
import { PageSkeleton } from "@cp/ui";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Grid3x3 } from "lucide-react";
import {
  DashboardShell,
  coopNav,
  useCoop,
  db,
  id,
  Button,
  FormSection,
  Field,
  Textarea,
  SeatEditor,
  buildLayout,
  toast,
  type Cell,
  vehicleStatus,
  vehicleTypeLabel,
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

const TYPES = ["minibus_15", "minibus_18", "bus_30", "bus_50", "taxi_brousse"];
const STATUSES = ["active", "maintenance", "inactive"];

export default function EditVehiclePage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const vehicleId = params.id;

  const { data, isLoading } = db.useQuery({
    vehicles: { $: { where: { id: vehicleId, "cooperative.id": coopId } }, seatMaps: {} },
  });
  const vehicle = data?.vehicles?.[0];

  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [reg, setReg] = useState("");
  const [type, setType] = useState("minibus_18");
  const [seatCount, setSeatCount] = useState("18");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // seat map
  const [layout, setLayout] = useState<Cell[]>([]);
  const [rows, setRows] = useState("5");
  const [cols, setCols] = useState("4");
  const [savingMap, setSavingMap] = useState(false);

  useEffect(() => {
    if (vehicle && !hydrated) {
      setName(vehicle.name ?? "");
      setReg(vehicle.registrationNo ?? "");
      setType(vehicle.type ?? "minibus_18");
      setSeatCount(String(vehicle.seatCount ?? 0));
      setStatus(vehicle.status ?? "active");
      setNotes(vehicle.notes ?? "");
      const active =
        (vehicle.seatMaps ?? []).find((m: any) => m.isActive) ?? (vehicle.seatMaps ?? [])[0];
      if (active && Array.isArray(active.layout) && active.layout.length) {
        setLayout(active.layout as Cell[]);
        setRows(String(active.rows ?? 5));
        setCols(String(active.cols ?? 4));
      } else {
        setLayout(buildLayout(5, 4));
      }
      setHydrated(true);
    }
  }, [vehicle, hydrated]);

  const submit = async () => {
    if (!name || !reg) {
      toast.error("Nom et immatriculation requis");
      return;
    }
    setSaving(true);
    try {
      await db.transact(
        db.tx.vehicles[vehicleId].update({
          name,
          registrationNo: reg,
          type,
          seatCount: toInt(seatCount),
          status,
          notes,
        }),
      );
      toast.success("Véhicule mis à jour");
      router.push(`/${slug}/vehicles`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  const regen = () => setLayout(buildLayout(toInt(rows, 5), toInt(cols, 4)));

  const saveMap = async () => {
    if (!vehicle) return;
    const seats = layout.filter((c) => c.type === "seat").length;
    const r = toInt(rows, 5);
    const c = toInt(cols, 4);
    setSavingMap(true);
    try {
      const existing = vehicle.seatMaps ?? [];
      const txs: any[] = existing
        .filter((m: any) => m.isActive)
        .map((m: any) => db.tx.seatMaps[m.id].update({ isActive: false }));

      const version = existing.length + 1;
      txs.push(
        db.tx.seatMaps[id()]
          .update({ version, rows: r, cols: c, layout, isActive: true, createdAt: Date.now() })
          .link({ vehicle: vehicleId, cooperative: coopId }),
      );
      txs.push(db.tx.vehicles[vehicleId].update({ seatCount: seats }));

      await db.transact(txs);
      setSeatCount(String(seats));
      toast.success("Plan de sièges enregistré");
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
    } finally {
      setSavingMap(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "vehicles", { role, permissions, isPlatformAdmin })}
      title="Modifier le véhicule"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Véhicules</span>
          <ChevronRight size={12} />
          <span className="text-ink">Modifier</span>
        </>
      }
      action={
        <Link href={`/${slug}/vehicles`}>
          <Button size="sm" variant="outline">
            <ArrowLeft size={16} /> Retour
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <PageSkeleton />
      ) : !vehicle ? (
        <p className="text-ink-soft">Véhicule introuvable.</p>
      ) : (
        <div className="mx-auto max-w-5xl">
          <FormSection index="01" title="Identité" description="Nom, immatriculation, type et statut du véhicule.">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom">
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Immatriculation">
                  <Input value={reg} onChange={(e) => setReg(e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Type">
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {vehicleTypeLabel[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Sièges">
                  <Input inputMode="numeric" value={seatCount} onChange={(e) => setSeatCount(e.target.value)} />
                </Field>
                <Field label="Statut">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {vehicleStatus[s]?.label ?? s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Notes">
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Link href={`/${slug}/vehicles`}>
                <Button variant="outline" size="sm">
                  Annuler
                </Button>
              </Link>
              <Button size="sm" onClick={submit} disabled={saving}>
                {saving ? "…" : "Enregistrer"}
              </Button>
            </div>
          </FormSection>

          <FormSection index="02" title="Plan de sièges" description="Cliquez une case pour changer son type. Les sièges sont numérotés automatiquement.">
            <div className="mb-4 flex items-end gap-3">
              <Field label="Rangées" className="w-24">
                <Input inputMode="numeric" value={rows} onChange={(e) => setRows(e.target.value)} />
              </Field>
              <Field label="Colonnes" className="w-24">
                <Input inputMode="numeric" value={cols} onChange={(e) => setCols(e.target.value)} />
              </Field>
              <Button size="sm" variant="outline" onClick={regen}>
                <Grid3x3 size={14} /> Régénérer
              </Button>
            </div>
            {layout.length > 0 && <SeatEditor layout={layout} onChange={setLayout} />}
            <div className="mt-6 flex justify-end">
              <Button size="sm" onClick={saveMap} disabled={savingMap}>
                {savingMap ? "…" : "Enregistrer le plan"}
              </Button>
            </div>
          </FormSection>
        </div>
      )}
    </DashboardShell>
  );
}
