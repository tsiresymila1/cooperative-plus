"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  toast,
  vehicleStatus,
  vehicleTypeLabel,
  toInt,
  SeatEditor,
  buildLayout,
  type Cell,
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

export default function NewVehiclePage() {
  const { coopId, slug, coop, role, permissions, isPlatformAdmin } = useCoop();
  const router = useRouter();

  const [name, setName] = useState("");
  const [reg, setReg] = useState("");
  const [type, setType] = useState("minibus_18");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // seat map
  const [layout, setLayout] = useState<Cell[]>(() => buildLayout(5, 4));
  const [rows, setRows] = useState("5");
  const [cols, setCols] = useState("4");
  const seats = layout.filter((c) => c.type === "seat").length;
  const regen = () => setLayout(buildLayout(toInt(rows, 5), toInt(cols, 4)));

  const submit = async () => {
    if (!name || !reg) {
      toast.error("Nom et immatriculation requis");
      return;
    }
    setSaving(true);
    try {
      const vehicleId = id();
      await db.transact([
        db.tx.vehicles[vehicleId]
          .update({
            name,
            registrationNo: reg,
            type,
            seatCount: seats,
            status,
            notes,
            createdAt: Date.now(),
          })
          .link({ cooperative: coopId }),
        db.tx.seatMaps[id()]
          .update({ version: 1, rows: toInt(rows, 5), cols: toInt(cols, 4), layout, isActive: true, createdAt: Date.now() })
          .link({ vehicle: vehicleId, cooperative: coopId }),
      ]);
      toast.success("Véhicule créé");
      router.push(`/${slug}/vehicles`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "vehicles", { role, permissions, isPlatformAdmin })}
      title="Nouveau véhicule"
      tenant={coop.displayName}
      logoUrl={coop.logoUrl}
      breadcrumb={
        <>
          <span>{coop.displayName}</span>
          <ChevronRight size={12} />
          <span>Véhicules</span>
          <ChevronRight size={12} />
          <span className="text-ink">Nouveau</span>
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
      <div className="mx-auto max-w-4xl">
        <FormSection index="01" title="Identité" description="Nom, immatriculation et type du véhicule.">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Immatriculation">
              <Input value={reg} onChange={(e) => setReg(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
        </div>
        </FormSection>

        <FormSection index="02" title="Plan de sièges" description="Définissez la grille puis cliquez les cases pour changer leur type.">
          <div className="grid gap-4">
            <div className="flex items-end gap-3">
              <Field label="Rangées">
                <Input inputMode="numeric" value={rows} onChange={(e) => setRows(e.target.value)} className="w-24" />
              </Field>
              <Field label="Colonnes">
                <Input inputMode="numeric" value={cols} onChange={(e) => setCols(e.target.value)} className="w-24" />
              </Field>
              <Button size="sm" variant="outline" type="button" onClick={regen}>
                <Grid3x3 size={15} /> Régénérer
              </Button>
            </div>
            {layout.length > 0 && <SeatEditor layout={layout} onChange={setLayout} />}
          </div>
        </FormSection>

        <FormSection index="03" title="Notes" description="Informations internes.">
          <Field label="Notes">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </FormSection>

        <div className="flex justify-end gap-2 pt-2">
          <Link href={`/${slug}/vehicles`}>
            <Button variant="outline" size="sm">
              Annuler
            </Button>
          </Link>
          <Button size="sm" onClick={submit} disabled={saving}>
            {saving ? "…" : "Créer"}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
