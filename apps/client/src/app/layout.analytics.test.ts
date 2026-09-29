import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("client analytics", () => {
  it("mounts Vercel Analytics in the root layout", () => {
    const layoutPath = fileURLToPath(new URL("./layout.tsx", import.meta.url));
    const layoutSource = readFileSync(layoutPath, "utf8");

    expect(layoutSource).toContain('from "@vercel/analytics/next"');
    expect(layoutSource).toContain("<Analytics />");
  });
});
