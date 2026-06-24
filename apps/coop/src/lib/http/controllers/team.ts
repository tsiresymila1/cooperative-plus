import { z } from "zod";
import { factory } from "../factory";
import { jsonBody } from "../validate";
import { createAssistant } from "../services/accounts";

const assistantSchema = z.object({
  coopId: z.string().min(1, "Coopérative manquante."),
  email: z.string().email("Email invalide."),
  name: z.string().optional(),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères."),
  permissions: z.array(z.string()).optional(),
});

/** POST /team/assistant — create an assistant account. */
export const createAssistantHandler = factory.createHandlers(
  jsonBody(assistantSchema),
  async (c) => c.json(await createAssistant(c.req.valid("json"))),
);
