"use client";
import { AdminShell } from "@/components/admin-shell";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  adminNav,
  db,
  id,
  tx,
  DataTable,
  FilterBar,
  Dialog,
  useConfirm,
  Button,
  Badge,
  Field,
  toast,
  toFloat,
  notDeleted,
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

type Destination = {
  id: string;
  name: string;
  region?: string;
  country: string;
  lat?: number;
  lng?: number;
  isPopular: boolean;
  isGlobal: boolean;
  createdAt: number | string;
  cooperative?: { id: string; displayName: string };
};

type FormState = {
  name: string;
  region: string;
  country: string;
  lat: string;
  lng: string;
  isPopular: boolean;
};

const emptyForm: FormState = {
  name: "",
  region: "",
  country: "Madagascar",
  lat: "",
  lng: "",
  isPopular: false,
};

const SCOPE_OPTIONS = [
  { value: "all", label: "Toutes" },
  { value: "global", label: "Globales" },
  { value: "private", label: "Privées (coop)" },
];

export default function DestinationsPage() {
  const { data, isLoading } = db.useQuery({
    destinations: { cooperative: {} },
  });
  const confirm = useConfirm();

  const [scope, setScope] = useState("all");
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const list = (data?.destinations ?? []).filter(notDeleted) as Destination[];
    const q = search.trim().toLowerCase();
    return list.filter((d) => {
      if (scope === "global" && !d.isGlobal) return false;
      if (scope === "private" && d.isGlobal) return false;
      if (q) {
        const hay = `${d.name} ${d.region ?? ""} ${d.country}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, scope, search]);

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(d: Destination) {
    setEditId(d.id);
    setForm({
      name: d.name,
      region: d.region ?? "",
      country: d.country,
      lat: d.lat != null ? String(d.lat) : "",
      lng: d.lng != null ? String(d.lng) : "",
      isPopular: d.isPopular,
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.country.trim()) {
      toast.error("Nom et pays sont requis.");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        region: form.region.trim() || undefined,
        country: form.country.trim(),
        lat: form.lat.trim() ? toFloat(form.lat) : undefined,
        lng: form.lng.trim() ? toFloat(form.lng) : undefined,
        isPopular: form.isPopular,
      };
      if (editId) {
        await db.transact(tx.destinations[editId].update(payload));
        toast.success("Destination mise à jour.");
      } else {
        await db.transact(
          tx.destinations[id()].update({
            ...payload,
            isGlobal: true,
            createdAt: Date.now(),
          }),
        );
        toast.success("Destination globale créée.");
      }
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePopular(d: Destination) {
    try {
      await db.transact(tx.destinations[d.id].update({ isPopular: !d.isPopular }));
      toast.success(d.isPopular ? "Retirée des populaires." : "Marquée populaire.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec.");
    }
  }

  async function handlePromote(target: Destination) {
    const ok = await confirm({
      title: "Promouvoir en destination globale ?",
      message: `${target.name} deviendra disponible pour toutes les coopératives.`,
      confirmLabel: "Promouvoir",
    });
    if (!ok) return;
    setSaving(true);
    try {
      let chunk = tx.destinations[target.id].update({ isGlobal: true });
      if (target.cooperative?.id) {
        chunk = chunk.unlink({ cooperative: target.cooperative.id });
      }
      await db.transact(chunk);
      toast.success("Destination promue en globale.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec.");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Destination>[] = [
    {
      key: "name",
      header: "Destination",
      render: (d) => (
        <div>
          <div className="font-medium text-ink">{d.name}</div>
          <div className="text-xs text-ink-soft/60">
            {[d.region, d.country].filter(Boolean).join(", ")}
          </div>
        </div>
      ),
    },
    {
      key: "scope",
      header: "Portée",
      render: (d) =>
        d.isGlobal ? (
          <Badge tone="success">globale</Badge>
        ) : (
          <Badge tone="neutral">{d.cooperative?.displayName ?? "privée"}</Badge>
        ),
    },
    {
      key: "popular",
      header: "Populaire",
      render: (d) =>
        d.isPopular ? <Badge tone="warning">populaire</Badge> : <span className="text-ink-soft/40">—</span>,
    },
    {
      key: "coords",
      header: "Coordonnées",
      render: (d) =>
        d.lat != null && d.lng != null ? (
          <span className="font-mono text-xs">
            {d.lat.toFixed(3)}, {d.lng.toFixed(3)}
          </span>
        ) : (
          <span className="text-ink-soft/40">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (d) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
            Modifier
          </Button>
          <Button variant="outline" size="sm" onClick={() => togglePopular(d)}>
            {d.isPopular ? "Retirer pop." : "Populaire"}
          </Button>
          {!d.isGlobal && (
            <Button variant="ink" size="sm" onClick={() => handlePromote(d)}>
              Promouvoir
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminShell
      nav={adminNav("destinations")}
      title="Destinations"
      tenant="Plateforme"
      breadcrumb={
        <>
          <span>Plateforme</span>
          <ChevronRight size={12} />
          <span className="text-ink">Destinations</span>
        </>
      }
      action={
        <Button size="sm" onClick={openCreate}>
          Nouvelle destination
        </Button>
      }
    >
      <FilterBar>
        <Input
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-xs"
        />
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCOPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable columns={columns} rows={rows} loading={isLoading} empty="Aucune destination." />

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "Modifier la destination" : "Nouvelle destination globale"}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "…" : "Enregistrer"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Nom">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Antananarivo"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Région">
              <Input
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              />
            </Field>
            <Field label="Pays">
              <Input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitude">
              <Input
                type="number"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
              />
            </Field>
            <Field label="Longitude">
              <Input
                type="number"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.isPopular}
              onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
              className="h-4 w-4 rounded border-ink/20 accent-laterite"
            />
            Marquer comme populaire
          </label>
        </div>
      </Dialog>
    </AdminShell>
  );
}
