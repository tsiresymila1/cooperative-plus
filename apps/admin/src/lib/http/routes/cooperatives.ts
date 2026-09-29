import { Hono } from "hono";
import { createCooperativeHandler, createCoopAccountHandler, purgeCooperativeHandler, deleteCooperativeHandler } from "../controllers/cooperatives";
import { platformAdminMiddleware } from "../services/authorization";

/** Cooperatives domain router (mounted at /cooperatives). */
export const cooperativeRoute = new Hono()
  .use("*", platformAdminMiddleware)
  .post("/", ...createCooperativeHandler)
  .post("/account", ...createCoopAccountHandler)
  .post("/purge", ...purgeCooperativeHandler)
  .post("/delete", ...deleteCooperativeHandler);
