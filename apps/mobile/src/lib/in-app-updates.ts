import * as ExpoInAppUpdates from "expo-in-app-updates";

// Fire-and-forget store update check on launch. Android uses Play in-app
// updates; iOS opens the App Store (needs `ios.infoPlist.AppStoreID` in
// app.json). ponytail: no-ops in Expo Go / dev — the native module throws
// when not installed from a store, so we just swallow it.
export async function checkForAppUpdate() {
  try {
    await ExpoInAppUpdates.checkAndStartUpdate();
  } catch {
    // update service unavailable (Expo Go, dev client, or no store listing)
  }
}
