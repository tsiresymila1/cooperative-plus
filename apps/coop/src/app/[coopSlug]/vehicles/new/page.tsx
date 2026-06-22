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
  const { coopId, slug, coop } = useCoop();
  const router = useRouter();

  const [name, setName] = useState("");
  const [reg, setReg] = useState("");
  const [type, setType] = useState("minibus_18");
  const [seatCount, setSeatCount] = useState("18");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name || !reg) {
      toast.error("Nom et immatriculation requis");
      return;
    }
    setSaving(true);
    try {
      await db.transact(
        db.tx.vehicles[id()]
          .update({
            name,
            registrationNo: reg,
            type,
            seatCount: toInt(seatCount),
            status,
            notes,
            createdAt: Date.now(),
          })
          .link({ cooperative: coopId }),
      );
      toast.success("Véhicule créé — configurez le plan de sièges");
      router.push(`/${slug}/vehicles`);
    } catch (e: any) {
      toast.error("Erreur: " + (e?.message ?? "inconnue"));
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={coopNav(slug, "vehicles")}
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
        </div>
        </FormSection>

        <FormSection index="02" title="Notes" description="Informations internes. Le plan de sièges se configure après création.">
          <Field label="Notes">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-soft">
            <Grid3x3 size={13} /> Le plan de sièges se configure depuis la page de modification après création.
          </p>
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
