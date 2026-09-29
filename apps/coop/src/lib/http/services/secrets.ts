import { encrypt } from "@cp/crypto";
import { adminDb } from "@cp/instant/admin";
import { HttpError } from "../errors";

export async function savePapiKey(coopId: string, plainKey: string, existingSecretId?: string): Promise<void> {
  const { cooperatives } = await adminDb.query({
    cooperatives: { $: { where: { id: coopId } }, secrets: {} },
  });
  const cooperative = cooperatives?.[0];
  if (!cooperative) throw new HttpError(404, "Coopérative introuvable.");

  const ownedSecret = cooperative.secrets;
  if (existingSecretId && ownedSecret?.id !== existingSecretId) {
    throw new HttpError(403, "Ce secret n'appartient pas à cette coopérative.");
  }

  const encrypted = encrypt(plainKey);
  const secretId = ownedSecret?.id ?? crypto.randomUUID();
  await adminDb.transact(
    adminDb.tx.coopSecrets[secretId]
      .update({ papiApiKey: encrypted, updatedAt: Date.now() })
      .link({ cooperative: coopId }),
  );
}
