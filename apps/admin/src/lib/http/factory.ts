import { createFactory } from "hono/factory";

/** Shared Hono factory — controllers build their handlers (validation + logic)
 * with `factory.createHandlers(...)`. */
export const factory = createFactory();
