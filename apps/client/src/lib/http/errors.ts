import type { ContentfulStatusCode } from "hono/utils/http-status";

export class HttpError extends Error {
  constructor(public status: ContentfulStatusCode, message: string) {
    super(message);
  }
}
