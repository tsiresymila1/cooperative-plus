const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);
// monorepo: watch workspace + resolve hoisted node_modules
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// NativeWind v5 reads the CSS entry from the `import "./global.css"` in the app
// root; `withNativeWind` no longer needs an `input` argument.
module.exports = withNativeWind(config);
