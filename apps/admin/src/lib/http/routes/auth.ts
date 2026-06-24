import { Hono } from "hono";
import { signInWithPassword } from "../controllers/auth";

/** Auth domain router (mounted at /auth). */
export const authRoute = new Hono().post("/password", ...signInWithPassword);
