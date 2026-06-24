// Patches the Expo-generated android/app/build.gradle to sign the `release`
// build type with the upload keystore (props come from android/gradle.properties).
// Run after `expo prebuild` (which regenerates build.gradle each time).
const fs = require("fs");

const p = "android/app/build.gradle";
let s = fs.readFileSync(p, "utf8");

// 1. Add a `release` signingConfig inside the existing `signingConfigs { ... }`.
if (!s.includes("MYAPP_UPLOAD_STORE_FILE")) {
  s = s.replace(
    /signingConfigs\s*\{/,
    `signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }`,
  );

  // 2. Make the `release` buildType use it (replace its debug signingConfig only).
  s = s.replace(
    /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
    "$1signingConfig signingConfigs.release",
  );

  fs.writeFileSync(p, s);
  console.log("[inject-signing] release signing wired into build.gradle");
} else {
  console.log("[inject-signing] already patched, skipping");
}
