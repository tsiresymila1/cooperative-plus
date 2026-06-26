#!/usr/bin/env node
// Usage: node scripts/encrypt-secret.js <plaintext>
// Requires SECRETS_ENCRYPTION_KEY in env (64 hex chars)

const { createCipheriv, randomBytes } = require("crypto");

const plaintext = process.argv[2];
if (!plaintext) {
  console.error("Usage: node scripts/encrypt-secret.js <plaintext>");
  process.exit(1);
}

const raw = process.env.SECRETS_ENCRYPTION_KEY;
if (!raw) {
  console.error("Error: SECRETS_ENCRYPTION_KEY env var not set");
  process.exit(1);
}

const key = Buffer.from(raw, "hex");
if (key.length !== 32) {
  console.error("Error: SECRETS_ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
  process.exit(1);
}

const iv = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, iv);
const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
const tag = cipher.getAuthTag();

console.log([iv.toString("hex"), tag.toString("hex"), ct.toString("hex")].join(":"));
