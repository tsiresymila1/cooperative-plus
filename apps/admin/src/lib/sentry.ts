const defaultDsn =
  "https://99f8191e7a4d6a0ca77a274481e5bd97@o4504649797271552.ingest.us.sentry.io/4512159877627904";

export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? defaultDsn,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  initialScope: { tags: { app: "admin" } },
};
