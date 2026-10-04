import { Hono } from "hono";
import { paymentRoute } from "./routes/payment";
import { feedbackRoute } from "./routes/feedback";
import { HttpError } from "./errors";

const app = new Hono()
  .basePath("/api")
  .onError((err, c) => {
    if (err instanceof HttpError) return c.json({ error: err.message }, err.status);
    return c.json({ error: err instanceof Error ? err.message : "Erreur serveur" }, 500);
  })
  .route("/payment", paymentRoute)
  .route("/feedback", feedbackRoute);

export { app };
export type AppType = typeof app;
