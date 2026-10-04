import { adminDb, id } from "@cp/instant/admin";
import type { ProductFeedbackInput, TripReviewInput } from "@cp/validation";
import { HttpError } from "../errors";

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const SCREENSHOT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type FeedbackContext = {
  cooperativeId?: string;
  userId?: string;
  now?: number;
};

export async function submitProductFeedback(
  input: ProductFeedbackInput,
  context: FeedbackContext = {},
) {
  const feedbackId = id();
  const now = context.now ?? Date.now();
  const { cooperativeId: inputCooperativeId, ...feedback } = input;
  const links: Record<string, string> = {};
  const cooperativeId = context.cooperativeId ?? inputCooperativeId;
  if (cooperativeId) links.cooperative = cooperativeId;
  if (context.userId) links.user = context.userId;

  let transaction = adminDb.tx.productFeedbacks[feedbackId]!.update({
    ...feedback,
    status: "new",
    createdAt: now,
    updatedAt: now,
  });
  if (Object.keys(links).length > 0) transaction = transaction.link(links);

  await adminDb.transact(transaction);
  return { id: feedbackId };
}

export async function submitTripReview(
  input: TripReviewInput,
  context: Pick<FeedbackContext, "now"> = {},
) {
  const { bookings } = await adminDb.query({
    bookings: {
      $: { where: { reference: input.bookingReference } },
      cooperative: {},
      customer: {},
      tripInstance: {},
      review: {},
    },
  });
  const booking = bookings?.[0];
  const emailMatches = booking?.contactEmail?.trim().toLowerCase() === input.email;
  if (!booking || !emailMatches) {
    throw new HttpError(404, "Réservation introuvable ou email incorrect.");
  }
  if (["cancelled", "expired", "refunded", "no_show"].includes(booking.status)) {
    throw new HttpError(409, "Cette réservation ne peut pas être évaluée.");
  }
  if (booking.tripInstance?.status !== "arrived") {
    throw new HttpError(409, "Vous pourrez évaluer ce trajet après son arrivée.");
  }
  if (booking.review) {
    throw new HttpError(409, "Cette réservation a déjà été évaluée.");
  }
  if (!booking.cooperative?.id || !booking.tripInstance?.id) {
    throw new HttpError(409, "Cette réservation ne peut pas être évaluée.");
  }

  const reviewId = id();
  const now = context.now ?? Date.now();
  const links: Record<string, string> = {
    booking: booking.id,
    tripInstance: booking.tripInstance.id,
    cooperative: booking.cooperative.id,
  };
  if (booking.customer?.id) links.user = booking.customer.id;

  await adminDb.transact(
    adminDb.tx.tripReviews[reviewId]!
      .update({
        reviewKey: booking.id,
        name: input.name,
        email: input.email,
        rating: input.rating,
        comment: input.comment,
        screenshotUrl: input.screenshotUrl,
        status: "new",
        createdAt: now,
        updatedAt: now,
      })
      .link(links),
  );
  return { id: reviewId };
}

export async function uploadFeedbackScreenshot(input: {
  bytes: Uint8Array;
  contentType: string;
  fileName: string;
}) {
  if (!SCREENSHOT_TYPES.has(input.contentType)) {
    throw new HttpError(400, "Format d’image non pris en charge.");
  }
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_SCREENSHOT_BYTES) {
    throw new HttpError(400, "L’image doit peser au maximum 5 Mo.");
  }

  const safeName = input.fileName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(-100) || "capture";
  const path = `feedback/${new Date().toISOString().slice(0, 7)}/${id()}-${safeName}`;
  const uploaded = await adminDb.storage.uploadFile(path, input.bytes, {
    contentType: input.contentType,
  });
  const result = await adminDb.query({
    $files: { $: { where: { id: uploaded.data.id } } },
  });
  const url = result.$files?.[0]?.url;
  if (!url) throw new HttpError(500, "L’image n’a pas pu être enregistrée.");
  return { url };
}
