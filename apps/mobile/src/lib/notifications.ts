import { Platform } from "react-native";
import Constants from "expo-constants";
import { fmtTime, toMs } from "./domain";

// In Expo Go (SDK 53+), expo-notifications throws — push was removed. Skip there;
// scheduled local notifications work in a dev/production build.
const IN_EXPO_GO = Constants.executionEnvironment === "storeClient";

const CHANNEL = "departures";
let handlerSet = false;

/** Create the Android channel + ask permission. Call once at startup. No-op in Expo Go. */
export async function setupNotifications(): Promise<void> {
  if (IN_EXPO_GO) return;
  try {
    const Notifications = await import("expo-notifications");
    if (!handlerSet) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      handlerSet = true;
    }
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: "Rappels de départ",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#ff7a00",
      });
    }
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") await Notifications.requestPermissionsAsync();
  } catch {
    // best-effort
  }
}

/** Fire a test notification in 5s. Returns false in Expo Go (needs a build). */
export async function sendTestNotification(): Promise<boolean> {
  if (IN_EXPO_GO) return false;
  try {
    await setupNotifications();
    const Notifications = await import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: { title: "Test 🚍", body: "Ceci est un rappel de départ de test." },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL },
    });
    return true;
  } catch {
    return false;
  }
}

type ReminderArgs = {
  route: string; // "Antananarivo → Antsirabe"
  departureAt: number | string | null;
  reference: string;
};

/** Schedule local "departure soon" reminders (24h and 1h before), future only. */
export async function scheduleDepartureReminders(a: ReminderArgs): Promise<void> {
  if (IN_EXPO_GO) return;
  const dep = toMs(a.departureAt);
  if (!dep) return;
  const now = Date.now();
  const heure = fmtTime(a.departureAt);

  const reminders = [
    { lead: 24 * 60 * 60 * 1000, title: "Départ demain 🚍", body: `${a.route} — départ à ${heure}. Réf. ${a.reference}` },
    { lead: 60 * 60 * 1000, title: "Départ dans 1h ⏰", body: `${a.route} — soyez à la gare. Réf. ${a.reference}` },
  ];

  try {
    const Notifications = await import("expo-notifications");
    for (const r of reminders) {
      const fireAt = dep - r.lead;
      if (fireAt <= now + 5000) continue; // already past / too close
      await Notifications.scheduleNotificationAsync({
        content: { title: r.title, body: r.body, data: { reference: a.reference } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(fireAt),
          channelId: CHANNEL,
        },
      });
    }
  } catch {
    // best-effort
  }
}
