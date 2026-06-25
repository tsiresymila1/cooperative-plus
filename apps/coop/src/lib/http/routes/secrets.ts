import { Hono } from "hono";
import { savePapiKeyHandler } from "../controllers/secrets";

export const secretsRoute = new Hono().post("/papi-key", ...savePapiKeyHandler);
