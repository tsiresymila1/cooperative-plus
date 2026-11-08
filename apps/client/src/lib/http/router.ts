import { bodyLimit } from "hono/body-limit";
import { consumeRateLimit } from "@cp/instant/rate-limit";
import { bookingRoute } from "./routes/booking";
import { Hono } from "hono";
import { paymentRoute } from "./routes/payment";
import { feedbackRoute } from "./routes/feedback";
import { trackRoute } from "./routes/track";
import { HttpError } from "./errors";

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
    console.error("Client API failed", err);
    return c.json({ error: "Erreur serveur" }, 500);
  })
  .route("/booking", bookingRoute)
  .route("/payment", paymentRoute)
  .route("/feedback", feedbackRoute)
  .route("/track", trackRoute);

export { app };
export type AppType = typeof app;
