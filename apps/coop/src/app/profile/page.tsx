"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Phone, Mail, Building2, Save, ArrowRight } from "lucide-react";
import { db, Button, Logo, FormSection, Field, Badge, FullSpinner, toast, memberRole } from "@cp/ui";
import { Input } from "@cp/ui/shadcn";

export default function Page() {
  const router = useRouter();
  const { isLoading, user } = db.useAuth();

  const { data } = db.useQuery(
    user
      ? {
          $users: { $: { where: { id: user.id } } },
          memberships: { $: { where: { "user.id": user.id } }, cooperative: {} },
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

  if (isLoading) return <FullSpinner />;
  if (!user) return <div className="grid min-h-dvh place-items-center text-ink-soft">Connexion requise.</div>;

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
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink/8 bg-paper/80 px-6 backdrop-blur-xl">
        <Logo />
        <a href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft size={15} /> Retour
          </Button>
        </a>
      </header>

      <main
        className="px-6 py-8 lg:px-8"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,45,92,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,45,92,.04) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-2">
            <h1 className="font-display text-[1.85rem] font-extrabold leading-none tracking-tight text-ink">Mon compte</h1>
            <p className="mt-2 text-sm text-ink-soft">Gérez vos informations personnelles et vos coopératives.</p>
          </div>

          <FormSection index="01" title="Identité" description="Vos informations personnelles affichées dans l'application.">
            <div className="grid gap-4">
              <div className="flex items-center gap-3.5">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-lg font-bold text-white">
                  {(name || user.email || "?").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold text-ink">{name || "—"}</p>
                  <p className="truncate text-sm text-ink-soft">{user.email}</p>
                </div>
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
              <Field label="Email" hint="Non modifiable">
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
          </FormSection>

          <FormSection index="02" title="Coopératives" description="Les espaces auxquels vous avez accès.">
            {memberships.length === 0 ? (
              <p className="text-sm text-ink-soft">Vous n'appartenez à aucune coopérative.</p>
            ) : (
              <div className="grid gap-2">
                {memberships.map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => m.cooperative?.slug && router.push(`/${m.cooperative.slug}/dashboard`)}
                    className="group flex items-center justify-between gap-3 rounded-[--radius] border border-ink/8 px-4 py-3 text-left transition-colors hover:border-laterite/40 hover:bg-laterite/[.03]"
                  >
                    <span className="inline-flex items-center gap-2.5 font-medium text-ink">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink/[.05] text-ink-soft"><Building2 size={15} /></span>
                      {m.cooperative?.displayName ?? "—"}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge tone="neutral">{memberRole[m.role] ?? m.role}</Badge>
                      <ArrowRight size={15} className="text-ink-soft/40 transition-colors group-hover:text-laterite" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </FormSection>
        </div>
      </main>
    </div>
  );
}
