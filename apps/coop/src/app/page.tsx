"use client";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { db, Button, Card, Logo, SignInScreen, FullSpinner, notDeleted, UserMenu, ThemeToggle } from "@cp/ui";

export default function HomePage() {
  const { isLoading: authLoading, user } = db.useAuth();
  const isGuest = (user as { isGuest?: boolean } | null)?.isGuest;

  const { data, isLoading } = db.useQuery(
    user && !isGuest
      ? {
          $users: { $: { where: { id: user.id } } },
          memberships: {
            $: { where: { "user.id": user.id, status: "active" } },
            cooperative: {},
          },
        }
      : null,
  );

  if (authLoading || (user && !isGuest && isLoading)) {
    return <FullSpinner className="bg-sand" />;
  }

  if (!user || isGuest) {
    return (
      <SignInScreen
        title="Espace coopérative"
        subtitle="Connectez-vous pour gérer votre coopérative."
        allowPassword
      />
    );
  }

  const me = data?.$users?.[0];
  const isPlatformAdmin = !!me?.isPlatformAdmin;

  const memberships = (data?.memberships ?? []).filter((m: any) => m.cooperative);
  const myCoops = memberships
    .map((m: any) => ({ coop: m.cooperative, role: m.role }))
    .filter((x: any) => x.coop && notDeleted(x.coop));

  return (
    <div className="min-h-dvh bg-sand">
      <header className="flex items-center justify-between border-b border-ink/10 bg-paper px-6 py-4">
        <Logo />
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-2xl font-bold text-ink">Mes coopératives</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Choisissez une coopérative pour ouvrir son espace de gestion.
        </p>

        {isPlatformAdmin && <AdminCoopList />}

        <div className="mt-8 grid gap-3">
          {myCoops.length === 0 && !isPlatformAdmin ? (
            <Card className="p-8 text-center text-sm text-ink-soft">
              Vous n&apos;êtes membre actif d&apos;aucune coopérative pour le moment.
            </Card>
          ) : (
            myCoops.map(({ coop, role }: any) => (
              <CoopRow key={coop.id} coop={coop} role={role} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function AdminCoopList() {
  const { data } = db.useQuery({ cooperatives: {} });
  const coops = (data?.cooperatives ?? []).filter(notDeleted);
  return (
    <div className="mt-8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/60">
        Administrateur plateforme — toutes les coopératives
      </p>
      <div className="grid gap-3">
        {coops.map((coop: any) => (
          <CoopRow key={coop.id} coop={coop} role="admin" />
        ))}
      </div>
    </div>
  );
}

function CoopRow({ coop, role }: { coop: any; role: string }) {
  return (
    <Link href={`/${coop.slug}/dashboard`}>
      <Card className="flex items-center gap-4 p-5 transition-colors hover:border-laterite/40">
        <div className="grid h-12 w-12 place-items-center rounded-[--radius] bg-laterite/10 text-laterite">
          <Building2 size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-bold text-ink">{coop.displayName}</p>
          <p className="text-xs text-ink-soft/70">
            /{coop.slug} · {role === "admin" ? "Admin plateforme" : role === "owner" ? "Propriétaire" : "Assistant"}
          </p>
        </div>
        <Button size="sm" variant="outline">
          Ouvrir <ArrowRight size={16} />
        </Button>
      </Card>
    </Link>
  );
}
