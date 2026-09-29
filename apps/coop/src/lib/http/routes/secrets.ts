import { Hono } from "hono";
import { savePapiKeyHandler } from "../controllers/secrets";
import { coopAccessMiddleware } from "../services/authorization";

export const secretsRoute = new Hono()
  .use("/papi-key", coopAccessMiddleware({ permission: "settings" }))
  .post("/papi-key", ...savePapiKeyHandler);
