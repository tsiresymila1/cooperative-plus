import { db } from "./db";

export async function bookingRequest<T>(path: string, input: unknown): Promise<T> {
  const token = (await db.getAuth())?.refresh_token;
  if (!token) throw new Error("Connectez-vous pour réserver.");
  const response = await fetch(`/api/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Opération impossible.");
  return data;
}
