const API = process.env.EXPO_PUBLIC_API_URL ?? "";

export type MobileFeedbackImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
};

type ProductFeedback = {
  source: "mobile";
  category: "bug" | "suggestion" | "difficulty" | "other";
  name: string;
  email: string;
  message: string;
};

type TripReview = {
  bookingReference: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
};

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : "L’envoi a échoué. Réessayez.");
  }
  return body as T;
}

async function uploadImage(image?: MobileFeedbackImage | null) {
  if (!image) return undefined;
  if (image.fileSize && image.fileSize > 5 * 1024 * 1024) {
    throw new Error("L’image doit peser au maximum 5 Mo.");
  }
  const form = new FormData();
  form.append("file", {
    uri: image.uri,
    name: image.fileName ?? "capture.jpg",
    type: image.mimeType ?? "image/jpeg",
  } as unknown as Blob);
  return responseJson<{ url: string }>(
    await fetch(`${API}/api/feedback/upload`, { method: "POST", body: form }),
  );
}

export async function submitMobileProductFeedback(payload: ProductFeedback, image?: MobileFeedbackImage | null) {
  const uploaded = await uploadImage(image);
  return responseJson<{ id: string }>(await fetch(`${API}/api/feedback/product`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, screenshotUrl: uploaded?.url }),
  }));
}

export async function submitMobileTripReview(payload: TripReview, image?: MobileFeedbackImage | null) {
  const uploaded = await uploadImage(image);
  return responseJson<{ id: string }>(await fetch(`${API}/api/feedback/trip-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, screenshotUrl: uploaded?.url }),
  }));
}
