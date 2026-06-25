import { Hono } from "hono";
import { createCooperativeHandler, createCoopAccountHandler, purgeCooperativeHandler, deleteCooperativeHandler } from "../controllers/cooperatives";

/** Cooperatives domain router (mounted at /cooperatives). */
export const cooperativeRoute = new Hono()
  .post("/", ...createCooperativeHandler)
  .post("/account", ...createCoopAccountHandler)
  .post("/purge", ...purgeCooperativeHandler)
  .post("/delete", ...deleteCooperativeHandler);
