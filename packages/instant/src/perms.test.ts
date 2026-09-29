import { describe, expect, it } from "vitest";

import rules from "./perms";

describe("InstantDB privilege boundaries", () => {
  it("limits self-service user updates to profile fields while retaining platform-admin access", () => {
    const update = rules.$users.allow.update;

    expect(update).toContain("$user.isPlatformAdmin");
    expect(update).toContain("auth.id == data.id");
    expect(update).toContain("request.modifiedFields.all");
    expect(update).toContain("field in ['name', 'phone', 'locale']");
    expect(update).not.toMatch(/field in \[[^\]]*isPlatformAdmin/);
  });

  it("forbids all browser membership writes", () => {
    expect(rules.memberships.allow).toMatchObject({
      create: "false",
      update: "false",
      delete: "false",
    });
  });

  it("keeps cooperative secrets visible to authorized readers but server-only for writes", () => {
    expect(rules.coopSecrets.allow.view).toContain("cooperative.members.user.id");
    expect(rules.coopSecrets.allow).toMatchObject({
      create: "false",
      update: "false",
      delete: "false",
    });
  });
});
