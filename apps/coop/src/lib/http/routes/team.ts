import { Hono } from "hono";
import {
  createAssistantHandler,
  deleteAssistantHandler,
  updateAssistantHandler,
} from "../controllers/team";
import { coopAccessMiddleware } from "../services/authorization";

/** Team domain router (mounted at /team). */
export const teamRoute = new Hono()
  .use("/assistant", coopAccessMiddleware({ ownerOnly: true }))
  .post("/assistant", ...createAssistantHandler)
  .patch("/assistant", ...updateAssistantHandler)
  .delete("/assistant", ...deleteAssistantHandler);
