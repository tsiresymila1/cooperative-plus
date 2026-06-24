import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Typed error services throw; the router maps it to a JSON response. */
export class HttpError extends Error {
  constructor(public status: ContentfulStatusCode, message: string) {
    super(message);
  }
}
