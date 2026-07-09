"use client";
import { db, id } from "./db";

export type ActivityInput = {
  coopId: string;
  actorId: string;
  action: "create" | "update" | "delete" | string;
  entityType: string; // "vehicle" | "route" | "trip" | "assistant" | ...
  entityId?: string;
  label?: string; // human name of the target, e.g. plate / route name
};

/**
 * Best-effort audit trail entry. Fire-and-forget: a logging failure must never
 * block the user's actual action (perms allow create for any authed member).
 */
export function logActivity(input: ActivityInput) {
  const { coopId, actorId, action, entityType, entityId, label } = input;
  db.transact(
    db.tx.auditLogs[id()]
      .update({
        action,
        entityType,
        ...(entityId ? { entityId } : {}),
        ...(label ? { after: { label } } : {}),
        createdAt: Date.now(),
      })
      .link({ cooperative: coopId, actor: actorId }),
  ).catch(() => {});
}
