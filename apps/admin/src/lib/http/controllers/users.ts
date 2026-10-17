import { z } from "zod";
import { factory } from "../factory";
import { jsonBody } from "../validate";
import { deleteUser } from "../services/users";

/** POST /users/delete — delete a user and revoke all access. */
export const deleteUserHandler = factory.createHandlers(
  jsonBody(z.object({ userId: z.string().min(1, "Utilisateur manquant.") })),
  async (c) => c.json(await deleteUser(c.req.valid("json").userId)),
);
