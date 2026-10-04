import { productFeedbackSchema, tripReviewSchema } from "@cp/validation";
import { factory } from "../factory";
import { HttpError } from "../errors";
import { jsonBody } from "../validate";
import {
  submitProductFeedback,
  submitTripReview,
  uploadFeedbackScreenshot,
} from "../services/feedback";

export const productFeedbackHandler = factory.createHandlers(
  jsonBody(productFeedbackSchema),
  async (c) => c.json(await submitProductFeedback(c.req.valid("json")), 201),
);

export const tripReviewHandler = factory.createHandlers(
  jsonBody(tripReviewSchema),
  async (c) => c.json(await submitTripReview(c.req.valid("json")), 201),
);

export const feedbackUploadHandler = factory.createHandlers(async (c) => {
  const form = await c.req.parseBody();
  const file = form.file;
  if (!(file instanceof File)) throw new HttpError(400, "Une image est requise.");
  const result = await uploadFeedbackScreenshot({
    bytes: new Uint8Array(await file.arrayBuffer()),
    contentType: file.type,
    fileName: file.name,
  });
  return c.json(result, 201);
});
