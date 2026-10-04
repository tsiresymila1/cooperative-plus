// Canonical entry for instant-cli / MCP push. Source lives in @cp/instant.
// Use an explicit default export: instant-cli's TypeScript loader can expose a
// circular `module.exports` reference when the default is re-exported directly.
import schema from "./packages/instant/src/schema";

export type { AppSchema } from "./packages/instant/src/schema";
export default schema;
