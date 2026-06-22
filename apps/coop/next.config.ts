import type { NextConfig } from "next";

const config: NextConfig = {
  // workspace packages ship raw TS — transpile them
  transpilePackages: ["@cp/ui", "@cp/instant", "@cp/validation"],
  experimental: { reactCompiler: false },
};

export default config;
