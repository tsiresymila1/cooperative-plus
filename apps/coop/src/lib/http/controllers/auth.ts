import { z } from "zod";
import { factory } from "../factory";
import { jsonBody } from "../validate";
import { passwordSignIn, requestPasswordReset, resetPassword } from "../services/auth";

const passwordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide."),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Email invalide."),
  code: z.string().trim().min(1, "Code requis."),
  password: z
    .string()
    .min(6, "Le mot de passe doit faire au moins 6 caractères.")
    .max(128, "Le mot de passe est trop long."),
});

/** POST /auth/password — verify credentials, mint a token. */
export const signInWithPassword = factory.createHandlers(
  jsonBody(passwordSchema),
  async (c) => {
    const { email, password } = c.req.valid("json");
    return c.json(await passwordSignIn(email, password));
  },
);

/** POST /auth/password/forgot — send a reset code without exposing account existence. */
export const forgotPassword = factory.createHandlers(
  jsonBody(forgotPasswordSchema),
  async (c) => c.json(await requestPasswordReset(c.req.valid("json").email)),
);

/** POST /auth/password/reset — verify the code and save the new password. */
export const changeForgottenPassword = factory.createHandlers(
  jsonBody(resetPasswordSchema),
  async (c) => {
    const { email, code, password } = c.req.valid("json");
    return c.json(await resetPassword(email, code, password));
  },
);
