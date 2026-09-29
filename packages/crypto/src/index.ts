import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "crypto";

const ALG = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.SECRETS_ENCRYPTION_KEY;
  if (!raw) throw new Error("SECRETS_ENCRYPTION_KEY env var not set");
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32) throw new Error("SECRETS_ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
  return buf;
}

/** Returns `iv:authTag:ciphertext` (all hex) */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), ct.toString("hex")].join(":");
}

/** Accepts `iv:authTag:ciphertext` format produced by encrypt() */
export function decrypt(encrypted: string): string {
  const key = getKey();
  const [ivHex, tagHex, ctHex] = encrypted.split(":");
  if (!ivHex || !tagHex || !ctHex) throw new Error("Invalid encrypted format");
  const decipher = createDecipheriv(ALG, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(ctHex, "hex")), decipher.final()]).toString("utf8");
}

/** Returns true if the string looks like an encrypted value (iv:tag:ct). */
export function isEncrypted(value: string): boolean {
  return value.split(":").length === 3;
}

/** One-way SHA-256 fingerprint for secrets that only need equality checks. */
export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

/** Constant-time comparison of a candidate secret with a SHA-256 fingerprint. */
export function verifySecret(secret: string, digest: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(digest)) return false;
  return timingSafeEqual(
    Buffer.from(hashSecret(secret), "hex"),
    Buffer.from(digest, "hex"),
  );
}
