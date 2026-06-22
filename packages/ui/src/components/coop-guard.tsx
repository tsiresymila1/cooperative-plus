"use client";
import Link from "next/link";
import { createContext, useContext } from "react";
import { ShieldAlert } from "lucide-react";
import { db } from "../lib/db";
import { Button, Card, Logo } from "./ui";
import { SignInScreen } from "./sign-in";

type CoopCtx = {
  coopId: string;
  slug: string;
  coop: any;
  role: "owner" | "assistant";
  permissions: string[];
  isPlatformAdmin: boolean;
  userId: string;
};

const Ctx = createContext<CoopCtx | null>(null);
export const useCoop = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCoop must be used within CoopGuard");
  return v;
};

function Denied({ title, message }: { title: string; message: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-sand px-5">
      <Card className="max-w-md p-8 text-center">
        <Logo className="justify-center" />
        <div className="mx-auto mt-6 grid h-12 w-12 place-items-center rounded-full bg-laterite/10 text-laterite">
          <ShieldAlert size={22} />
        </div>
        <h1 className="mt-4 font-display text-xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-soft">{message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/coop">
            <Button variant="outline" size="sm">Mes coopératives</Button>
          </Link>
          <Link href="/">
            <Button size="sm">Accueil</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-sand text-ink-soft">Chargement…</div>
  );
}

/** Gate a cooperative back-office page to active members (owner|assistant) or platform admins. */
export function CoopGuard({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { isLoading: authLoading, user } = db.useAuth();
  const isGuest = (user as { isGuest?: boolean } | null)?.isGuest;

  const { data, isLoading } = db.useQuery(
    user && !isGuest
      ? {
          $users: { $: { where: { id: user.id } } },
          cooperatives: {
            $: { where: { slug } },
            subscriptions: { plan: {} },
            members: { user: {} },
          },
        }
      : null,
  );

  if (authLoading || (user && !isGuest && isLoading)) return <Loading />;
  if (!user || isGuest)
    return <SignInScreen title="Espace coopérative" subtitle="Connectez-vous pour gérer votre coopérative." allowPassword />;

  const me = data?.$users?.[0];
  const coop = data?.cooperatives?.[0];
  if (!coop) return <Denied title="Coopérative introuvable" message="Cette coopérative n'existe pas ou a été supprimée." />;

  const isPlatformAdmin = !!me?.isPlatformAdmin;

  // Suspended coop: members are locked out; only platform admins keep access.
  if (coop.subscriptionStatus === "suspended" && !isPlatformAdmin)
    return (
      <Denied
        title="Coopérative suspendue"
        message="Cette coopérative est suspendue. Contactez l'administrateur de la plateforme pour la réactiver."
      />
    );

  const myMembership = (coop.members ?? []).find(
    (m: any) => m.user?.id === user.id && m.status === "active",
  );

  if (!myMembership && !isPlatformAdmin)
    return (
      <Denied
        title="Accès refusé"
        message="Vous n'êtes pas membre de cette coopérative. Demandez une invitation au propriétaire."
      />
    );

  const ctx: CoopCtx = {
    coopId: coop.id,
    slug,
    coop,
    role: (myMembership?.role as "owner" | "assistant") ?? "owner",
    permissions: (myMembership?.permissions as string[]) ?? [],
    isPlatformAdmin,
    userId: user.id,
  };

  // Brand color: override the accent CSS var so the whole coop app follows it.
  const brand = coop.brandColor as string | undefined;
  const style = brand ? ({ ["--color-laterite"]: brand, ["--color-laterite-deep"]: brand } as React.CSSProperties) : undefined;

  return (
    <Ctx.Provider value={ctx}>
      <div style={style}>{children}</div>
    </Ctx.Provider>
  );
}

type AdminCtx = { userId: string; user: any };
const AdminCtxObj = createContext<AdminCtx | null>(null);
export const useAdmin = () => {
  const v = useContext(AdminCtxObj);
  if (!v) throw new Error("useAdmin must be used within AdminGuard");
  return v;
};

/** Gate platform-admin pages to $users.isPlatformAdmin == true. */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, user } = db.useAuth();
  const isGuest = (user as { isGuest?: boolean } | null)?.isGuest;

  const { data, isLoading } = db.useQuery(
    user && !isGuest ? { $users: { $: { where: { id: user.id } } } } : null,
  );

  if (authLoading || (user && !isGuest && isLoading)) return <Loading />;
  if (!user || isGuest)
    return <SignInScreen title="Administration" subtitle="Connectez-vous pour accéder à la console." allowPassword />;

  const me = data?.$users?.[0];
  if (!me?.isPlatformAdmin)
    return (
      <Denied
        title="Accès refusé"
        message="Cette zone est réservée aux administrateurs de la plateforme."
      />
    );

  return <AdminCtxObj.Provider value={{ userId: user.id, user: me }}>{children}</AdminCtxObj.Provider>;
}
