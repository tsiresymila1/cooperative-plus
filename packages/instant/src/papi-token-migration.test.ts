import { describe, expect, it } from "vitest";

import { migratePapiTokenMeta, selectPapiTokenMigrations } from "./papi-token-migration";

describe("PAPI notification-token metadata migration", () => {
  it("replaces a legacy raw token with its fingerprint and preserves metadata", () => {
    const migrated = migratePapiTokenMeta({
      notificationToken: "legacy-secret",
      kind: "subscription",
      planId: "plan-1",
    });

    expect(migrated).toEqual({
      notificationTokenHash:
        "fdcbc807d80f60c6f15ef644d5c372ac92760bd5f414cc3d48c3b320d9d1e689",
      kind: "subscription",
      planId: "plan-1",
    });
    expect(JSON.stringify(migrated)).not.toContain("legacy-secret");
  });

  it("removes a leftover raw token while preserving an existing fingerprint", () => {
    const notificationTokenHash = "ab".repeat(32);

    expect(
      migratePapiTokenMeta({
        notificationToken: "legacy-secret",
        notificationTokenHash,
        testMode: false,
      }),
    ).toEqual({ notificationTokenHash, testMode: false });
  });

  it.each([
    undefined,
    null,
    "not-json-metadata",
    {},
    { notificationTokenHash: "ab".repeat(32), testMode: false },
  ])("does not rewrite metadata without a legacy token", (meta) => {
    expect(migratePapiTokenMeta(meta)).toBeNull();
  });
});

describe("PAPI payment migration selection", () => {
  it("includes legacy tokens from pending and terminal PAPI payments", () => {
    const migrations = selectPapiTokenMigrations([
      { id: "pending", status: "pending", meta: { notificationToken: "token-1" } },
      { id: "paid", status: "paid", meta: { notificationToken: "token-2" } },
      {
        id: "already-migrated",
        status: "pending",
        meta: { notificationTokenHash: "ab".repeat(32) },
      },
    ]);

    expect(migrations.map(({ id }) => id)).toEqual(["pending", "paid"]);
  });
});
