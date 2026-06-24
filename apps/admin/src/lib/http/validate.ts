import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";

/** JSON body validator that fails with the unified `{ error: string }` shape. */
export const jsonBody = <T extends ZodType>(schema: T) =>
  zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: result.error.issues[0]?.message ?? "Données invalides." }, 400);
    }
  });
