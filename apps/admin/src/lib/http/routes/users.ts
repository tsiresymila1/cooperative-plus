import { Hono } from "hono";
import { deleteUserHandler } from "../controllers/users";
import { platformAdminMiddleware } from "../services/authorization";

/** Users domain router (mounted at /users). */
export const userRoute = new Hono()
  .use("*", platformAdminMiddleware)
  .post("/delete", ...deleteUserHandler);
