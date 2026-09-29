import { hashSecret } from "@cp/crypto";

/**
 * Convert legacy PAPI metadata to the one-way token format.
 * Returns null when there is no raw token to migrate.
 */
export function migratePapiTokenMeta(meta: unknown): Record<string, unknown> | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;

  const record = meta as Record<string, unknown>;
  const legacyToken = record.notificationToken;
  if (typeof legacyToken !== "string" || !legacyToken) return null;

  const { notificationToken: _removed, notificationTokenHash, ...rest } = record;
  const validExistingHash =
    typeof notificationTokenHash === "string" && /^[0-9a-f]{64}$/i.test(notificationTokenHash)
      ? notificationTokenHash
      : hashSecret(legacyToken);

  return { ...rest, notificationTokenHash: validExistingHash };
}

export function selectPapiTokenMigrations(
  payments: Array<{ id: string; meta?: unknown }>,
): Array<{ id: string; meta: Record<string, unknown> }> {
  return payments.flatMap((payment) => {
    const meta = migratePapiTokenMeta(payment.meta);
    return meta ? [{ id: payment.id, meta }] : [];
  });
}
