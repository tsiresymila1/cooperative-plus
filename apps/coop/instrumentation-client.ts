import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./src/lib/sentry";

Sentry.init({
  ...sentryOptions,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  replaysOnErrorSampleRate: 1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
