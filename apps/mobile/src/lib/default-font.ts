import { Text } from "react-native";

/**
 * RN <Text> has no inherited body font. Patch its render so every Text defaults
 * to Montserrat unless an explicit fontFamily (font-display / font-mono / a
 * `style`) overrides it — the instance style is applied AFTER, so it wins.
 */
const BASE = { fontFamily: "Montserrat_400Regular" } as const;

/* eslint-disable @typescript-eslint/no-explicit-any */
const T = Text as any;
if (T.render && !T.__fontPatched) {
  const orig = T.render;
  T.render = function (props: any, ref: any) {
    return orig.call(this, { ...props, style: [BASE, props?.style] }, ref);
  };
  T.__fontPatched = true;
}
