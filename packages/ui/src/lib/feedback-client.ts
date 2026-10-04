export type ProductFeedbackPayload = {
  source: "client_web" | "coop_web" | "mobile";
  category: "bug" | "suggestion" | "difficulty" | "other";
  name: string;
  email: string;
  message: string;
  cooperativeId?: string;
};

export type TripReviewPayload = {
  bookingReference: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
};

const endpoint = (base: string, path: string) => `${base.replace(/\/$/, "")}${path}`;

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : "L’envoi a échoué. Réessayez.");
  }
  return body as T;
}

async function uploadScreenshot(apiBase: string, file: File) {
  const form = new FormData();
  form.set("file", file);
  return readResponse<{ url: string }>(
    await fetch(endpoint(apiBase, "/api/feedback/upload"), { method: "POST", body: form }),
  );
}

export async function submitProductFeedbackForm(
  apiBase: string,
  payload: ProductFeedbackPayload,
  screenshot?: File | null,
) {
  const uploaded = screenshot ? await uploadScreenshot(apiBase, screenshot) : undefined;
  return readResponse<{ id: string }>(
    await fetch(endpoint(apiBase, "/api/feedback/product"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, screenshotUrl: uploaded?.url }),
    }),
  );
}

export async function submitTripReviewForm(
  apiBase: string,
  payload: TripReviewPayload,
  screenshot?: File | null,
) {
  const uploaded = screenshot ? await uploadScreenshot(apiBase, screenshot) : undefined;
  return readResponse<{ id: string }>(
    await fetch(endpoint(apiBase, "/api/feedback/trip-review"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, screenshotUrl: uploaded?.url }),
    }),
  );
}
