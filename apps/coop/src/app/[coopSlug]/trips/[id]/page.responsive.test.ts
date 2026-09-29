import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("trip detail responsive actions", () => {
  it("allows the page actions to wrap on narrow screens", () => {
    const pagePath = fileURLToPath(new URL("./page.tsx", import.meta.url));
    const pageSource = readFileSync(pagePath, "utf8");

    expect(pageSource).toContain(
      'action={\n        <div className="flex flex-wrap items-center gap-2">',
    );
  });
});
