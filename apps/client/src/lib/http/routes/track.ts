import { Hono } from "hono";
import { trackHandler } from "../controllers/track";

export const trackRoute = new Hono().post("/", ...trackHandler);
