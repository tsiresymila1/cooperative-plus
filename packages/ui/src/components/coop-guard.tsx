"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect } from "react";
import { LogOut, ShieldAlert } from "lucide-react";
import { db } from "../lib/db";
import { Button, Card, Logo, FullSpinner } from "./ui";
import { SignInScreen } from "./sign-in";

// Section (first path segment after the slug) → required membership permission.
const SECTION_PERM: Record<string, string | null> = {
  dashboard: null, profile: null,
  bookings: "bookings", customers: "bookings",
  trips: "trips",
  vehicles: "vehicles",
  routes: "routes", destinations: "routes",
  payments: "payments", reports: "payments",
  team: "team",
  settings: "settings",
};

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
/** Coop context if present, else null (safe outside CoopGuard — e.g. admin shell). */
export const useCoopOptional = () => useContext(Ctx);

function Denied({ title, message, kind = "coop" }: { title: string; message: string; kind?: "coop" | "admin" }) {
  const logout = async () => { await db.auth.signOut(); window.location.href = "/"; };
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
          {kind === "coop" && (
            <Link href="/">
              <Button variant="outline" size="sm">Mes coopératives</Button>
            </Link>
          )}
          <Button size="sm" variant={kind === "coop" ? "primary" : "outline"} onClick={logout}>
            <LogOut size={15} /> Déconnexion
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Loading() {
  return <FullSpinner className="bg-sand" />;
}

/** Gate a cooperative back-office page to active members (owner|assistant) or platform admins. */
export function CoopGuard({ slug, children }: { slug: string; children: React.ReactNode }) {
  const { isLoading: authLoading, user } = db.useAuth();
  const isGuest = (user as { isGuest?: boolean } | null)?.isGuest;
  const pathname = usePathname();

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

  // Per-section permission gate (assistants only). Owners + platform admins pass.
  const isAssistant = !isPlatformAdmin && myMembership?.role === "assistant";
  if (isAssistant) {
    const section = (pathname ?? "").split("/").filter(Boolean)[1];
    const needed = section ? SECTION_PERM[section] : null;
    if (needed && !((myMembership!.permissions as string[]) ?? []).includes(needed))
      return (
        <Denied
          title="Accès non autorisé"
          message="Vous n'avez pas la permission d'accéder à cette section. Contactez le propriétaire de la coopérative."
        />
      );
  }

  const ctx: CoopCtx = {
    coopId: coop.id,
    slug,
    coop,
    role: (myMembership?.role as "owner" | "assistant") ?? "owner",
    permissions: (myMembership?.permissions as string[]) ?? [],
    isPlatformAdmin,
    userId: user.id,
  };

  return (
    <Ctx.Provider value={ctx}>
      {/* Brand colour on <html> so the whole coop app — incl. the top progress
          bar rendered at <body> — follows this cooperative's accent. */}
      <BrandVars color={coop.brandColor as string | undefined} />
      {children}
    </Ctx.Provider>
  );
}

function BrandVars({ color }: { color?: string }) {
  useEffect(() => {
    if (!color) return;
    const el = document.documentElement;
    const prevL = el.style.getPropertyValue("--color-laterite");
    const prevD = el.style.getPropertyValue("--color-laterite-deep");
    el.style.setProperty("--color-laterite", color);
    el.style.setProperty("--color-laterite-deep", color);
    return () => {
      el.style.setProperty("--color-laterite", prevL);
      el.style.setProperty("--color-laterite-deep", prevD);
    };
  }, [color]);
  return null;
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
        kind="admin"
        title="Accès refusé"
        message="Cette zone est réservée aux administrateurs de la plateforme."
      />
    );

  return <AdminCtxObj.Provider value={{ userId: user.id, user: me }}>{children}</AdminCtxObj.Provider>;
}
