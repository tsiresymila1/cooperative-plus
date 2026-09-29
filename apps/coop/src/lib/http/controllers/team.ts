import { z } from "zod";
import { factory } from "../factory";
import { jsonBody } from "../validate";
import { createAssistant, deleteAssistant, updateAssistant } from "../services/accounts";

const assistantSchema = z.object({
  coopId: z.string().min(1, "Coopérative manquante."),
  email: z.string().email("Email invalide."),
  name: z.string().optional(),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères."),
  permissions: z.array(z.string()).optional(),
});

const membershipSchema = z.object({
  coopId: z.string().min(1, "Coopérative manquante."),
  membershipId: z.string().min(1, "Membre manquant."),
});

const updateAssistantSchema = membershipSchema
  .extend({
    status: z.enum(["active", "disabled"]).optional(),
    permissions: z.array(z.string()).optional(),
  })
  .refine((input) => input.status !== undefined || input.permissions !== undefined, {
    message: "Aucune modification fournie.",
  });

/** POST /team/assistant — create an assistant account. */
export const createAssistantHandler = factory.createHandlers(
  jsonBody(assistantSchema),
  async (c) => {
    const input = c.req.valid("json");
    return c.json(await createAssistant(input));
  },
);

/** PATCH /team/assistant — update status and/or permissions of an assistant. */
export const updateAssistantHandler = factory.createHandlers(
  jsonBody(updateAssistantSchema),
  async (c) => {
    const input = c.req.valid("json");
    return c.json(await updateAssistant(input));
  },
);

/** DELETE /team/assistant — remove an assistant membership. */
export const deleteAssistantHandler = factory.createHandlers(
  jsonBody(membershipSchema),
  async (c) => {
    const input = c.req.valid("json");
    return c.json(await deleteAssistant(input));
  },
);
