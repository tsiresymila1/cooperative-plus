import { z } from "zod";
import { factory } from "../factory";
import { jsonBody } from "../validate";
import { trackVisit } from "../services/track";

const trackSchema = z.object({
  visitorId: z.string().uuid("Identifiant invalide."),
  path: z.string().max(200).optional(),
});

export const trackHandler = factory.createHandlers(
  jsonBody(trackSchema),
  async (c) => c.json(await trackVisit(c.req.valid("json"))),
);
