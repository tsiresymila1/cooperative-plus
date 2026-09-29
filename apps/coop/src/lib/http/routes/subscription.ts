import { Hono } from "hono";
import { initiateSubscriptionHandler, subscriptionWebhookHandler } from "../controllers/subscription";
import { coopAccessMiddleware } from "../services/authorization";

export const subscriptionRoute = new Hono()
  .use("/initiate", coopAccessMiddleware({ ownerOnly: true }))
  .post("/initiate", ...initiateSubscriptionHandler)
  .post("/webhook", ...subscriptionWebhookHandler);
