import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("stores a salt and scrypt hash without retaining the password", () => {
    const stored = hashPassword("correct horse battery staple");
    const [salt, hash] = stored.split(":");

    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(hash).toMatch(/^[0-9a-f]{128}$/);
    expect(stored).not.toContain("correct horse battery staple");
  });

  it("produces independent salted hashes for the same password", () => {
    const first = hashPassword("same password");
    const second = hashPassword("same password");

    expect(first).not.toBe(second);
    expect(verifyPassword("same password", first)).toBe(true);
    expect(verifyPassword("same password", second)).toBe(true);
  });

  it("rejects a different password and a same-length corrupted hash", () => {
    const stored = hashPassword("right password");
    const [salt, hash] = stored.split(":");
    const corruptedHash = `${hash!.slice(0, -2)}${hash!.endsWith("00") ? "01" : "00"}`;

    expect(verifyPassword("wrong password", stored)).toBe(false);
    expect(verifyPassword("right password", `${salt}:${corruptedHash}`)).toBe(false);
  });

  it.each(["", "salt-only", ":hash", "salt:", "00:ff", "zz:zz"])(
    "returns false for malformed stored value %j",
    (stored) => {
      expect(verifyPassword("password", stored)).toBe(false);
    },
  );

  it("supports an empty password as an explicit value", () => {
    const stored = hashPassword("");

    expect(verifyPassword("", stored)).toBe(true);
    expect(verifyPassword("not empty", stored)).toBe(false);
  });
});
