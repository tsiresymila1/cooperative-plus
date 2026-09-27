import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    exclude: ["**/*.integration.test.ts", "**/node_modules/**"],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: [
        "packages/validation/src/index.ts",
        "packages/crypto/src/index.ts",
        "packages/instant/src/password.ts",
        "packages/instant/src/subscription.ts",
        "apps/mobile/src/lib/domain.ts",
      ],
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage/unit",
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
