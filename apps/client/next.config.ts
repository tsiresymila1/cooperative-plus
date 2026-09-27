import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const config: NextConfig = {
  // workspace packages ship raw TS — transpile them
  transpilePackages: ["@cp/ui", "@cp/instant", "@cp/validation"],
  experimental: { reactCompiler: false },
};

export default withSentryConfig(config, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
