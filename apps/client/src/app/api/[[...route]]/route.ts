import { handle } from "hono/vercel";
import { app } from "@/lib/http/router";

export const runtime = "nodejs";

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
