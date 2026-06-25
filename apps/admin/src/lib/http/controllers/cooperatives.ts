import { z } from "zod";
import { factory } from "../factory";
import { jsonBody } from "../validate";
import { createCooperative, createCoopAccount, purgeCooperative, deleteCooperative } from "../services/cooperatives";

const coopSchema = z.object({
  slug: z.string().min(1, "Slug requis."),
  displayName: z.string().min(1, "Nom commercial requis."),
  legalName: z.string().min(1, "Raison sociale requise."),
  region: z.string().optional(),
  planId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  ownerEmail: z.string().email().optional().or(z.literal("")),
  ownerName: z.string().optional(),
  ownerPassword: z.string().optional(),
});

const coopAccountSchema = z.object({
  coopId: z.string().min(1, "Coopérative manquante."),
  email: z.string().email("Email invalide."),
  name: z.string().optional(),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères."),
  role: z.enum(["owner", "assistant"]).optional(),
});

/** POST /cooperatives — create a cooperative (+ optional owner). */
export const createCooperativeHandler = factory.createHandlers(
  jsonBody(coopSchema),
  async (c) => c.json(await createCooperative(c.req.valid("json"))),
);

/** POST /cooperatives/account — attach an owner/assistant account. */
export const createCoopAccountHandler = factory.createHandlers(
  jsonBody(coopAccountSchema),
  async (c) => c.json(await createCoopAccount(c.req.valid("json"))),
);

const coopIdSchema = z.object({ coopId: z.string().min(1, "Coopérative manquante.") });

/** POST /cooperatives/purge — wipe a coop's operational data (fresh reset). */
export const purgeCooperativeHandler = factory.createHandlers(
  jsonBody(coopIdSchema),
  async (c) => c.json(await purgeCooperative(c.req.valid("json").coopId)),
);

/** POST /cooperatives/delete — permanently delete a coop + accounts + data. */
export const deleteCooperativeHandler = factory.createHandlers(
  jsonBody(coopIdSchema),
  async (c) => c.json(await deleteCooperative(c.req.valid("json").coopId)),
);
