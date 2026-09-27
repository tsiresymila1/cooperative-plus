import { Hono } from "hono";
import {
  changeForgottenPassword,
  forgotPassword,
  signInWithPassword,
} from "../controllers/auth";

/** Auth domain router (mounted at /auth). */
export const authRoute = new Hono()
  .post("/password", ...signInWithPassword)
  .post("/password/forgot", ...forgotPassword)
  .post("/password/reset", ...changeForgottenPassword);
