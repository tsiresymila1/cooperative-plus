import { bodyLimit } from "hono/body-limit";
import { consumeRateLimit } from "@cp/instant/rate-limit";
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
  .use("*", bodyLimit({ maxSize: 6 * 1024 * 1024, onError: c => c.json({ error: "Requête trop volumineuse." }, 413) }))
  .use("*", async (c, next) => {
    const path = c.req.path;
    if (c.req.method === "POST" && !path.endsWith("/webhook")) {
      // Vercel overwrites this header; do not trust arbitrary X-Forwarded-For values.
      const identity = c.req.header("x-vercel-forwarded-for") ?? "local";
      if (!(await consumeRateLimit(identity, path, path.endsWith("/upload") ? 10 : 30)))
        return c.json({ error: "Trop de demandes. Réessayez dans une minute." }, 429);
    }
    await next();
  })
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
