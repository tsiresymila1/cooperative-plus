import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Field, Input, Select, Textarea } from "./form";

describe("public site form controls", () => {
  it("uses the same public-site styling for labels and every control type", () => {
    const markup = renderToStaticMarkup(
      createElement(
        Field,
        {
          label: "Email",
          variant: "site",
          children: [
            createElement(Input, { key: "input", variant: "site", placeholder: "Email" }),
            createElement(Textarea, { key: "textarea", variant: "site", placeholder: "Message" }),
            createElement(Select, { key: "select", variant: "site" }, createElement("option", null, "Suggestion")),
          ],
        },
      ),
    );

    expect(markup).toContain("font-body text-[14px] text-navy");
    expect(markup.match(/h-\[60px\]/g)).toHaveLength(2);
    expect(markup).toContain("min-h-[120px]");
    expect(markup.match(/border-navy\/15/g)).toHaveLength(3);
    expect(markup.match(/focus:border-gold/g)).toHaveLength(3);
    expect(markup).not.toContain('variant="site"');
  });
});
