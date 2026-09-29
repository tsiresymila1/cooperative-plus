import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("trip detail responsive actions", () => {
  const pagePath = fileURLToPath(new URL("./page.tsx", import.meta.url));
  const pageSource = readFileSync(pagePath, "utf8");

  it("allows the page actions to wrap on narrow screens", () => {
    expect(pageSource).toContain(
      'action={\n        <div className="flex flex-wrap items-center gap-2">',
    );
  });

  it("keeps trip content within the mobile viewport", () => {
    expect(pageSource).toContain('<div className="grid min-w-0 gap-6">');
    expect(pageSource).toContain(
      '<h2 className="flex flex-wrap items-center gap-x-2 gap-y-1',
    );
    expect(pageSource).toContain('<div className="relative w-full sm:w-auto">');
    expect(pageSource).toContain('className="h-9 w-full pl-9 sm:w-72"');
  });
});
