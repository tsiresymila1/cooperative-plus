import { encrypt } from "@cp/crypto";
import { adminDb } from "@cp/instant/admin";

export async function savePapiKey(coopId: string, plainKey: string, existingSecretId?: string): Promise<void> {
  const encrypted = encrypt(plainKey);
  const secretId = existingSecretId ?? crypto.randomUUID();
  await adminDb.transact(
    adminDb.tx.coopSecrets[secretId]
      .update({ papiApiKey: encrypted, updatedAt: Date.now() })
      .link({ cooperative: coopId }),
  );
}
