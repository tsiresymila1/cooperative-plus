import { Hono } from "hono";
import { createAssistantHandler } from "../controllers/team";

/** Team domain router (mounted at /team). */
export const teamRoute = new Hono().post("/assistant", ...createAssistantHandler);
