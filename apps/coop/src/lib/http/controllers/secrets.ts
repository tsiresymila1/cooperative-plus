import { z } from "zod";
import { factory } from "../factory";
import { jsonBody } from "../validate";
import { savePapiKey } from "../services/secrets";

const schema = z.object({
  coopId: z.string().min(1),
  papiApiKey: z.string().min(1),
  existingSecretId: z.string().optional(),
});

export const savePapiKeyHandler = factory.createHandlers(
  jsonBody(schema),
  async (c) => {
    const { coopId, papiApiKey, existingSecretId } = c.req.valid("json");
    await savePapiKey(coopId, papiApiKey, existingSecretId);
    return c.json({ ok: true });
  },
);
