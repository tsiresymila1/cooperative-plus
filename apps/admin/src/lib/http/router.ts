import { Hono } from "hono";
import { authRoute } from "./routes/auth";
import { cooperativeRoute } from "./routes/cooperatives";
import { userRoute } from "./routes/users";
import { HttpError } from "./errors";

/**
 * Admin server API. Layers:
 *   controllers (factory handlers: schema + validation + logic)
 *   → routes (one Hono router per domain)
 *   → router (basePath /api, assembles the domain routers).
 */
const app = new Hono()
  .basePath("/api")
  .onError((err, c) => {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status);
    if (err && typeof err === "object" && "getResponse" in err) return (err as { getResponse: () => Response }).getResponse();
    return c.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, 500);
  })
  .route("/auth", authRoute)
  .route("/cooperatives", cooperativeRoute)
  .route("/users", userRoute);

export { app };
export type AppType = typeof app;
