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
      include: ["packages/validation/src/index.ts"],
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage/unit",
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
