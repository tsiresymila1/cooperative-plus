"use client";
import { AdminShell } from "@/components/admin-shell";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  adminNav,
  db,
  id,
  tx,
  DataTable,
  Drawer,
  Button,
  Badge,
  Field,
  toast,
  toInt,
  toMoney,
  fmtMoney,
  type Column,
} from "@cp/ui";
import {
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@cp/ui/shadcn";

type Plan = {
  id: string;
  code: string;
  name: string;
  priceAmount: number;
  currency: string;
  interval: string;
  maxVehicles: number;
  maxRoutes: number;
  maxAssistants: number;
  maxTripsMonth: number;
  transactionFeeBps: number;
  isActive: boolean;
};

type FormState = {
  code: string;
  name: string;
  priceAmount: string;
  currency: string;
  interval: string;
  maxVehicles: string;
  maxRoutes: string;
  maxAssistants: string;
  maxTripsMonth: string;
  transactionFeeBps: string;
};

const emptyForm: FormState = {
  code: "",
  name: "",
  priceAmount: "0",
  currency: "MGA",
  interval: "month",
  maxVehicles: "0",
  maxRoutes: "0",
  maxAssistants: "0",
  maxTripsMonth: "0",
  transactionFeeBps: "0",
};

export default function PlansPage() {
  const { data, isLoading } = db.useQuery({ plans: {} });
  const rows = (data?.plans ?? []) as Plan[];

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(p: Plan) {
    setEditId(p.id);
    setForm({
      code: p.code,
      name: p.name,
      priceAmount: String(p.priceAmount),
      currency: p.currency,
      interval: p.interval,
      maxVehicles: String(p.maxVehicles),
      maxRoutes: String(p.maxRoutes),
      maxAssistants: String(p.maxAssistants),
      maxTripsMonth: String(p.maxTripsMonth),
      transactionFeeBps: String(p.transactionFeeBps),
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code et nom sont requis.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        priceAmount: toMoney(form.priceAmount),
        currency: form.currency.trim() || "MGA",
        interval: form.interval,
        maxVehicles: toInt(form.maxVehicles),
        maxRoutes: toInt(form.maxRoutes),
        maxAssistants: toInt(form.maxAssistants),
        maxTripsMonth: toInt(form.maxTripsMonth),
        transactionFeeBps: toInt(form.transactionFeeBps),
      };
      if (editId) {
        await db.transact(tx.plans[editId].update(payload));
        toast.success("Plan mis à jour.");
      } else {
        await db.transact(tx.plans[id()].update({ ...payload, isActive: true }));
        toast.success("Plan créé.");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Plan) {
    try {
      await db.transact(tx.plans[p.id].update({ isActive: !p.isActive }));
      toast.success(p.isActive ? "Plan désactivé." : "Plan activé.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec.");
    }
  }

  const columns: Column<Plan>[] = [
    {
      key: "name",
      header: "Plan",
      render: (p) => (
        <div>
          <div className="font-medium text-ink">{p.name}</div>
          <div className="text-xs text-ink-soft/60">{p.code}</div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Prix",
      render: (p) => (
        <span>
          {fmtMoney(p.priceAmount, p.currency)}
          <span className="text-ink-soft/60"> / {p.interval === "month" ? "mois" : p.interval === "year" ? "an" : p.interval}</span>
        </span>
      ),
    },
    { key: "veh", header: "Véhicules", render: (p) => p.maxVehicles },
    { key: "routes", header: "Itinéraires", render: (p) => p.maxRoutes },
    { key: "assist", header: "Assistants", render: (p) => p.maxAssistants },
    { key: "trips", header: "Trajets/mois", render: (p) => p.maxTripsMonth },
    { key: "fee", header: "Frais (bps)", render: (p) => p.transactionFeeBps },
    {
      key: "active",
      header: "Statut",
      render: (p) => (
        <Badge tone={p.isActive ? "success" : "neutral"}>
          {p.isActive ? "actif" : "inactif"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
            Modifier
          </Button>
          <Button
            variant={p.isActive ? "outline" : "ink"}
            size="sm"
            onClick={() => toggleActive(p)}
          >
            {p.isActive ? "Désactiver" : "Activer"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell
      nav={adminNav("plans")}
      title="Abonnements"
      tenant="Plateforme"
      breadcrumb={
        <>
          <span>Plateforme</span>
          <ChevronRight size={12} />
          <span className="text-ink">Abonnements</span>
        </>
      }
      action={
        <Button size="sm" onClick={openCreate}>
          Nouveau plan
        </Button>
      }
    >
      <DataTable columns={columns} rows={rows} loading={isLoading} empty="Aucun plan." />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "Modifier le plan" : "Nouveau plan"}
        width="max-w-lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "…" : "Enregistrer"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code">
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="growth"
            />
          </Field>
          <Field label="Nom">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Growth"
            />
          </Field>
          <Field label="Prix (minor units)">
            <Input
              type="number"
              value={form.priceAmount}
              onChange={(e) => setForm({ ...form, priceAmount: e.target.value })}
            />
          </Field>
          <Field label="Devise">
            <Input
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            />
          </Field>
          <Field label="Intervalle">
            <Select value={form.interval} onValueChange={(v) => setForm({ ...form, interval: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mensuel</SelectItem>
                <SelectItem value="year">Annuel</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Frais transaction (bps)">
            <Input
              type="number"
              value={form.transactionFeeBps}
              onChange={(e) => setForm({ ...form, transactionFeeBps: e.target.value })}
            />
          </Field>
          <Field label="Max véhicules">
            <Input
              type="number"
              value={form.maxVehicles}
              onChange={(e) => setForm({ ...form, maxVehicles: e.target.value })}
            />
          </Field>
          <Field label="Max itinéraires">
            <Input
              type="number"
              value={form.maxRoutes}
              onChange={(e) => setForm({ ...form, maxRoutes: e.target.value })}
            />
          </Field>
          <Field label="Max assistants">
            <Input
              type="number"
              value={form.maxAssistants}
              onChange={(e) => setForm({ ...form, maxAssistants: e.target.value })}
            />
          </Field>
          <Field label="Max trajets / mois">
            <Input
              type="number"
              value={form.maxTripsMonth}
              onChange={(e) => setForm({ ...form, maxTripsMonth: e.target.value })}
            />
          </Field>
        </div>
      </Drawer>
    </AdminShell>
  );
}
