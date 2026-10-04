import { beforeEach, describe, expect, it, vi } from "vitest";

const instantAdmin = vi.hoisted(() => {
  const entity = (namespace: string) =>
    new Proxy({}, {
      get: (_target, id) => ({
        update: (data: unknown) => ({
          namespace,
          id: String(id),
          data,
          link: (links: unknown) => ({ namespace, id: String(id), data, links }),
        }),
      }),
    });

  return {
    query: vi.fn(),
    transact: vi.fn(),
    uploadFile: vi.fn(),
    newId: vi.fn(),
    tx: {
      productFeedbacks: entity("productFeedbacks"),
      tripReviews: entity("tripReviews"),
    },
  };
});

vi.mock("@cp/instant/admin", () => ({
  adminDb: {
    query: instantAdmin.query,
    transact: instantAdmin.transact,
    storage: { uploadFile: instantAdmin.uploadFile },
    tx: instantAdmin.tx,
  },
  id: instantAdmin.newId,
}));

import {
  submitProductFeedback,
  submitTripReview,
  uploadFeedbackScreenshot,
} from "./feedback";

const productInput = {
  source: "client_web" as const,
  category: "bug" as const,
  name: "Mialy",
  email: "mialy@example.test",
  message: "Le bouton de paiement ne répond pas.",
};

const reviewInput = {
  bookingReference: "CP-ABC123",
  name: "Mialy",
  email: "mialy@example.test",
  rating: 5,
  comment: "Voyage ponctuel et équipe accueillante.",
};

describe("feedback service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    instantAdmin.newId.mockReturnValue("feedback-1");
  });

  it("creates a new product feedback with optional context links", async () => {
    await submitProductFeedback(productInput, {
      cooperativeId: "coop-1",
      userId: "user-1",
      now: 1_700_000_000_000,
    });

    expect(instantAdmin.transact).toHaveBeenCalledWith({
      namespace: "productFeedbacks",
      id: "feedback-1",
      data: expect.objectContaining({
        ...productInput,
        status: "new",
        createdAt: 1_700_000_000_000,
        updatedAt: 1_700_000_000_000,
      }),
      links: { cooperative: "coop-1", user: "user-1" },
    });
  });

  it("does not reveal whether a booking reference or its email was wrong", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      bookings: [{ id: "booking-1", contactEmail: "other@example.test" }],
    });

    await expect(submitTripReview(reviewInput)).rejects.toMatchObject({
      status: 404,
      message: "Réservation introuvable ou email incorrect.",
    });
    expect(instantAdmin.transact).not.toHaveBeenCalled();
  });

  it("rejects a review until the trip is completed", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      bookings: [{
        id: "booking-1",
        contactEmail: reviewInput.email,
        status: "paid",
        tripInstance: { id: "trip-1", status: "departed" },
        cooperative: { id: "coop-1" },
      }],
    });

    await expect(submitTripReview(reviewInput)).rejects.toMatchObject({
      status: 409,
      message: "Vous pourrez évaluer ce trajet après son arrivée.",
    });
  });

  it("rejects a review for a cancelled booking", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      bookings: [{
        id: "booking-1",
        contactEmail: reviewInput.email,
        status: "cancelled",
        tripInstance: { id: "trip-1", status: "arrived" },
        cooperative: { id: "coop-1" },
      }],
    });

    await expect(submitTripReview(reviewInput)).rejects.toMatchObject({
      status: 409,
      message: "Cette réservation ne peut pas être évaluée.",
    });
  });

  it("prevents a second review for the same booking", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      bookings: [{
        id: "booking-1",
        contactEmail: reviewInput.email,
        status: "paid",
        review: { id: "review-1" },
        tripInstance: { id: "trip-1", status: "arrived" },
        cooperative: { id: "coop-1" },
      }],
    });

    await expect(submitTripReview(reviewInput)).rejects.toMatchObject({
      status: 409,
      message: "Cette réservation a déjà été évaluée.",
    });
  });

  it("creates a review linked to its verified booking, trip and cooperative", async () => {
    instantAdmin.query.mockResolvedValueOnce({
      bookings: [{
        id: "booking-1",
        contactEmail: reviewInput.email,
        status: "paid",
        customer: { id: "user-1" },
        tripInstance: { id: "trip-1", status: "arrived" },
        cooperative: { id: "coop-1" },
      }],
    });

    await submitTripReview(reviewInput, { now: 1_700_000_000_000 });

    expect(instantAdmin.transact).toHaveBeenCalledWith({
      namespace: "tripReviews",
      id: "feedback-1",
      data: expect.objectContaining({
        reviewKey: "booking-1",
        rating: 5,
        status: "new",
      }),
      links: {
        booking: "booking-1",
        tripInstance: "trip-1",
        cooperative: "coop-1",
        user: "user-1",
      },
    });
  });

  it("rejects unsupported or oversized screenshots before upload", async () => {
    await expect(
      uploadFeedbackScreenshot({
        bytes: new Uint8Array([1]),
        contentType: "application/pdf",
        fileName: "capture.pdf",
      }),
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      uploadFeedbackScreenshot({
        bytes: new Uint8Array(5 * 1024 * 1024 + 1),
        contentType: "image/png",
        fileName: "capture.png",
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(instantAdmin.uploadFile).not.toHaveBeenCalled();
  });
});
