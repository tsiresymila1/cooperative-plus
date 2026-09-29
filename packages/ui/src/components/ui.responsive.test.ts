import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("ComponentCard responsive header", () => {
  it("wraps title actions instead of widening the page", () => {
    const componentPath = fileURLToPath(new URL("./ui.tsx", import.meta.url));
    const componentSource = readFileSync(componentPath, "utf8");

    expect(componentSource).toContain(
      'cn("min-w-0 rounded-2xl border border-line bg-paper", className)',
    );
    expect(componentSource).toContain(
      'className="flex flex-wrap items-start justify-between gap-3 px-6 py-5"',
    );
  });
});
