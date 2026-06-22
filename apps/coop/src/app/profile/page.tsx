"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, User, Phone, Mail, Building2, Save } from "lucide-react";
import {
  db,
  Button,
  Card,
  Logo,
  Field,
  Badge,
  toast,
  memberRole,
} from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

export default function Page() {
  const { isLoading, user } = db.useAuth();

  const { data } = db.useQuery(
    user
      ? {
          $users: { $: { where: { id: user.id } } },
          memberships: {
            $: { where: { "user.id": user.id } },
            cooperative: {},
          },
        }
      : null,
  );

  const me = data?.$users?.[0];
  const memberships = data?.memberships ?? [];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) {
      setName((me.name as string) ?? "");
      setPhone((me.phone as string) ?? "");
    }
  }, [me?.id]);

  if (isLoading)
    return <div className="grid min-h-dvh place-items-center text-ink-soft">Chargement…</div>;
  if (!user)
    return <div className="grid min-h-dvh place-items-center text-ink-soft">Connexion requise.</div>;

  const save = async () => {
    setSaving(true);
    try {
      await db.transact(db.tx.$users[user.id].update({ name, phone }));
      toast.success("Compte mis à jour");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-sand">
      <header className="border-b border-ink/10 bg-paper px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Logo />
          <a href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={15} /> Retour
            </Button>
          </a>
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl gap-6 px-5 py-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Mon compte</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Gérez vos informations personnelles et consultez vos coopératives.
          </p>
        </div>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-ink">
            <User size={18} className="text-laterite" />
            <h2 className="font-display text-lg font-bold">Identité</h2>
          </div>
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-ink text-lg font-bold text-sand">
                {(name || user.email || "?").slice(0, 2).toUpperCase()}
              </span>
              <p className="text-sm text-ink-soft">{user.email}</p>
            </div>
            <Field label="Nom">
              <div className="relative">
                <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                <Input value={name} onChange={(e) => setName(e.target.value)} className="pl-9" placeholder="Votre nom" />
              </div>
            </Field>
            <Field label="Téléphone">
              <div className="relative">
                <Phone size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" placeholder="034 00 000 00" />
              </div>
            </Field>
            <Field label="Email">
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
                <Input value={user.email ?? ""} disabled className="pl-9 opacity-60" />
              </div>
            </Field>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>
                <Save size={15} /> {saving ? "…" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-ink">
            <Building2 size={18} className="text-laterite" />
            <h2 className="font-display text-lg font-bold">Mes coopératives ({memberships.length})</h2>
          </div>
          {memberships.length === 0 ? (
            <p className="text-sm text-ink-soft">Vous n'appartenez à aucune coopérative.</p>
          ) : (
            <div className="grid gap-2">
              {memberships.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-[--radius] border border-ink/8 px-4 py-3"
                >
                  <span className="inline-flex items-center gap-2 font-medium text-ink">
                    <Building2 size={15} className="text-ink-soft/60" />
                    {m.cooperative?.displayName ?? "—"}
                  </span>
                  <Badge tone="neutral">{memberRole[m.role] ?? m.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
