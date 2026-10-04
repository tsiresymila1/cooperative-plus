import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  feedbackUploadHandler,
  productFeedbackHandler,
  tripReviewHandler,
} from "../controllers/feedback";

export const feedbackRoute = new Hono()
  .use("*", cors({ origin: "*" }))
  .post("/product", ...productFeedbackHandler)
  .post("/trip-review", ...tripReviewHandler)
  .post("/upload", ...feedbackUploadHandler);
