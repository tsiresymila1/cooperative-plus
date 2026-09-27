import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { decrypt, encrypt, isEncrypted } from "./index";

const VALID_KEY = "01".repeat(32);

describe("encrypted secrets", () => {
  beforeEach(() => {
    vi.stubEnv("SECRETS_ENCRYPTION_KEY", VALID_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips UTF-8 plaintext in the documented wire format", () => {
    const encrypted = encrypt("Clé API — tsiresy 🔐");
    const [iv, tag, ciphertext] = encrypted.split(":");

    expect(iv).toMatch(/^[0-9a-f]{24}$/);
    expect(tag).toMatch(/^[0-9a-f]{32}$/);
    expect(ciphertext).toMatch(/^[0-9a-f]+$/);
    expect(decrypt(encrypted)).toBe("Clé API — tsiresy 🔐");
  });

  it("uses a fresh IV for each encryption", () => {
    const first = encrypt("same secret");
    const second = encrypt("same secret");

    expect(first.split(":")[0]).not.toBe(second.split(":")[0]);
    expect(first).not.toBe(second);
  });

  it.each([
    [undefined, "SECRETS_ENCRYPTION_KEY env var not set"],
    ["ab".repeat(31), "SECRETS_ENCRYPTION_KEY must be 64 hex chars (32 bytes)"],
    ["not-hex".repeat(10), "SECRETS_ENCRYPTION_KEY must be 64 hex chars (32 bytes)"],
  ])("rejects a missing or invalid encryption key", (key, message) => {
    if (key === undefined) vi.stubEnv("SECRETS_ENCRYPTION_KEY", "");
    else vi.stubEnv("SECRETS_ENCRYPTION_KEY", key);

    expect(() => encrypt("secret")).toThrow(message);
  });

  it("rejects payloads that do not contain all three parts", () => {
    expect(() => decrypt("missing-parts")).toThrow("Invalid encrypted format");
    expect(() => decrypt("aa:bb:")).toThrow("Invalid encrypted format");
  });

  it("rejects an authenticated payload after it is corrupted", () => {
    const [iv, tag, ciphertext] = encrypt("untampered").split(":");
    const corruptedTag = `${tag!.slice(0, -2)}${tag!.endsWith("00") ? "01" : "00"}`;

    expect(() => decrypt(`${iv}:${corruptedTag}:${ciphertext}`)).toThrow();
  });

  it("detects only the structural three-part encrypted format", () => {
    expect(isEncrypted(encrypt("secret"))).toBe(true);
    expect(isEncrypted("iv:tag:ciphertext")).toBe(true);
    expect(isEncrypted("plain text")).toBe(false);
    expect(isEncrypted("too:many:format:parts")).toBe(false);
  });
});
