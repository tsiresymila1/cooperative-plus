import { Hono } from "hono";
import { initiateSubscriptionHandler, subscriptionWebhookHandler } from "../controllers/subscription";

export const subscriptionRoute = new Hono()
  .post("/initiate", ...initiateSubscriptionHandler)
  .post("/webhook", ...subscriptionWebhookHandler);
