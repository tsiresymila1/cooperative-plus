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
    expect(rules.coopSecrets.allow.view).toContain("$user.memberships.access");
    expect(rules.coopSecrets.allow).toMatchObject({
      create: "false",
      update: "false",
      delete: "false",
    });
  });
});


describe("traveler write restrictions", () => {
  it("requires server writes for seat acquisition and extensions", () => {
    expect(rules.seatHolds.allow.create).toBe("false");
    expect(rules.seatHolds.allow.update).toBe("false");
    expect(rules.seatHolds.allow.delete).toContain("data.ref('user.id')");
  });
  it("does not authorize booking, payment or ticket creation just because a user is signed in", () => {
    for (const entity of [rules.bookings, rules.payments, rules.tickets]) {
      expect(entity.allow.create).toContain("m.status == 'active'");
      expect(entity.allow.create).toContain("m.cooperativeId in data.ref('cooperative.id')");
      expect(entity.allow.create).toContain("m.permissions");
    }
  });
  it("keeps billing fields outside self-service cooperative updates", () => {
    expect(rules.cooperatives.allow.update).toContain("request.modifiedFields.all");
    expect(rules.cooperatives.allow.update).not.toContain("'subscriptionStatus',");
  });
  it("keeps driver records private and storage mutations owner-scoped", () => {
    expect(rules.drivers.allow.view).not.toBe("true");
    expect(rules.$files.allow.delete).toContain("data.path.startsWith('users/' + auth.id + '/')");
  });
});
