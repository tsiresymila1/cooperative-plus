import { StyleSheet, Text } from "react-native";

/**
 * RN <Text> has no inherited body font. Patch its render so every Text defaults
 * to ABeeZee unless an explicit fontFamily (font-display / font-mono / a
 * `style`) overrides it — the instance style is applied AFTER, so it wins.
 *
 * Google Fonts ship one static file per weight (e.g. PlusJakartaSans_700Bold),
 * not a single variable font. iOS can't synthesize bold/semibold on a custom
 * font file, so `className="font-sans font-bold"` (fontFamily pinned to a
 * fixed file + fontWeight:700) silently falls back to the system font.
 * Resolve the actual weight requested to the matching font file instead.
 *
 * ABeeZee only ships a single weight (400 Regular, + italic) — there is no
 * bold/semibold file to resolve to, so every weight maps to the same file
 * and "bold" sans text just renders at regular weight (no true bold).
 */
const REGULAR = "ABeeZee_400Regular";
const BASE = { fontFamily: REGULAR } as const;

const WEIGHT_FILES: Record<string, Record<string, string>> = {
  ABeeZee: {
    "400": "ABeeZee_400Regular",
    "500": "ABeeZee_400Regular",
    "600": "ABeeZee_400Regular",
    "700": "ABeeZee_400Regular",
  },
  BarlowCondensed: {
    "400": "BarlowCondensed_400Regular",
    "500": "BarlowCondensed_500Medium",
    "600": "BarlowCondensed_600SemiBold",
    "700": "BarlowCondensed_700Bold",
  },
};
const WEIGHT_ALIASES: Record<string, string> = { normal: "400", bold: "700" };

function familyOf(fontFamily?: string): string | null {
  if (!fontFamily) return null;
  if (fontFamily.startsWith("ABeeZee")) return "ABeeZee";
  if (fontFamily.startsWith("BarlowCondensed")) return "BarlowCondensed";
  return null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const T = Text as any;
if (T.render && !T.__fontPatched) {
  const orig = T.render;
  T.render = function (props: any, ref: any) {
    const merged: any = StyleSheet.flatten([BASE, props?.style]) ?? {};
    const family = familyOf(merged.fontFamily);
    const weight = merged.fontWeight ? (WEIGHT_ALIASES[merged.fontWeight] ?? String(merged.fontWeight)) : null;
    const resolved = family && weight ? WEIGHT_FILES[family]?.[weight] : null;
    const style = resolved && resolved !== merged.fontFamily
      ? [BASE, props?.style, { fontFamily: resolved }]
      : [BASE, props?.style];
    return orig.call(this, { ...props, style }, ref);
  };
  T.__fontPatched = true;
}
