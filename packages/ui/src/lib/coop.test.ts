import { describe, expect, it } from "vitest";

import { canManageCoopTeam } from "./coop";

describe("cooperative team management access", () => {
  it.each([
    ["owner", false, true],
    ["assistant", true, true],
    ["assistant", false, false],
    [undefined, false, false],
  ])("role=%s platformAdmin=%s => %s", (role, isPlatformAdmin, expected) => {
    expect(canManageCoopTeam(role, isPlatformAdmin)).toBe(expected);
  });
});
