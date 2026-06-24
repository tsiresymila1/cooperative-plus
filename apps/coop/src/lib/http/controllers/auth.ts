import { z } from "zod";
import { factory } from "../factory";
import { jsonBody } from "../validate";
import { passwordSignIn } from "../services/auth";

const passwordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** POST /auth/password — verify credentials, mint a token. */
export const signInWithPassword = factory.createHandlers(
  jsonBody(passwordSchema),
  async (c) => {
    const { email, password } = c.req.valid("json");
    return c.json(await passwordSignIn(email, password));
  },
);
