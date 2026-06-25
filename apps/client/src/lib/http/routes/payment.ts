import { Hono } from "hono";
import { initiateHandler, webhookHandler } from "../controllers/payment";

export const paymentRoute = new Hono()
  .post("/initiate", ...initiateHandler)
  .post("/webhook", ...webhookHandler);
