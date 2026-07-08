import { Hono } from "hono";
import { authRoute } from "./routes/auth";
import { teamRoute } from "./routes/team";
import { secretsRoute } from "./routes/secrets";
import { subscriptionRoute } from "./routes/subscription";
import { HttpError } from "./errors";

/**
 * Coop server API. Layers:
 *   controllers (factory handlers: schema + validation + logic)
 *   → routes (one Hono router per domain)
 *   → router (basePath /api, assembles the domain routers).
 * Only server-side ops (admin token); realtime data stays on InstantDB.
 */
const app = new Hono()
  .basePath("/api")
  .onError((err, c) => {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status);
    if (err && typeof err === "object" && "getResponse" in err) return (err as { getResponse: () => Response }).getResponse();
    return c.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, 500);
  })
  .route("/auth", authRoute)
  .route("/team", teamRoute)
  .route("/secrets", secretsRoute)
  .route("/subscription", subscriptionRoute);

export { app };
export type AppType = typeof app;
