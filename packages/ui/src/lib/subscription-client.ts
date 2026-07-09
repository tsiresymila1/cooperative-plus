"use client";
import { db } from "./db";
import { atLimit } from "@cp/instant/subscription";

type Resource = "vehicles" | "routes" | "assistants" | "trips";

/**
 * Current coop's active subscription + plan + live usage counts, with a
 * limit check for create flows. Trials count against the plan too.
 */
export function useCoopPlan(coopId?: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data, isLoading } = db.useQuery(
    coopId
      ? {
          subscriptions: { $: { where: { "cooperative.id": coopId } }, plan: {} },
          vehicles: { $: { where: { "cooperative.id": coopId } } },
          routes: { $: { where: { "cooperative.id": coopId } } },
          memberships: { $: { where: { "cooperative.id": coopId, role: "assistant" } } },
          // createdAt is stored as epoch ms; the typed where wants Date, so cast.
          tripInstances: { $: { where: { "cooperative.id": coopId, createdAt: { $gte: monthStart.getTime() } } as any } },
        }
      : null,
  );

  const subs = data?.subscriptions ?? [];
  const sub = subs.find((s: any) => s.status !== "cancelled") ?? subs[0];
  const plan: any = sub?.plan;

  const usage: Record<Resource, number> = {
    vehicles: (data?.vehicles ?? []).filter((v: any) => !v.deletedAt).length,
    routes: (data?.routes ?? []).filter((r: any) => !r.deletedAt).length,
    assistants: (data?.memberships ?? []).filter((m: any) => m.status === "active").length,
    trips: (data?.tripInstances ?? []).length,
  };

  const max: Record<Resource, number | undefined> = {
    vehicles: plan?.maxVehicles,
    routes: plan?.maxRoutes,
    assistants: plan?.maxAssistants,
    trips: plan?.maxTripsMonth,
  };

  /** True when creating another `resource` would exceed the plan. */
  const overLimit = (resource: Resource) => atLimit(max[resource], usage[resource]);

  return { isLoading, sub, plan, status: sub?.status as string | undefined, usage, max, overLimit };
}
