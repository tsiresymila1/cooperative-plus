import "../global.css";
import "@/lib/default-font";
import { useCallback, useEffect, useState } from "react";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { BarlowCondensed_400Regular, BarlowCondensed_500Medium, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from "@expo-google-fonts/barlow-condensed";
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useColorScheme } from "nativewind";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalHost } from "@rn-primitives/portal";
import { AuthProvider } from "@/lib/auth";
import { SelectionProvider } from "@/lib/selection";
import { setupNotifications } from "@/lib/notifications";
import { checkForAppUpdate } from "@/lib/in-app-updates";

const queryClient = new QueryClient();

// Keep the native splash up until fonts + onboarding check are ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  const [checked, setChecked] = useState(false);
  const segments = useSegments();
  const { colorScheme, setColorScheme } = useColorScheme();

  // Restore saved theme choice (default = system).
  useEffect(() => {
    AsyncStorage.getItem("cp-theme").then((t) => {
      if (t === "dark" || t === "light") setColorScheme(t);
    });
    // Notification channel + permission (local departure reminders).
    setupNotifications().catch(() => {});
    // Prompt an app-store update if one is available (store builds only).
    checkForAppUpdate();
  }, []);

  // First-launch onboarding gate.
  useEffect(() => {
    if (!fontsLoaded) return;
    let active = true;
    AsyncStorage.getItem("onboarded").then((v) => {
      if (!active) return;
      const inOnboarding = segments[0] === "onboarding";
      if (v !== "1" && !inOnboarding) router.replace("/onboarding");
      setChecked(true);
    });
    return () => {
      active = false;
    };
  }, [fontsLoaded, segments]);

  const ready = fontsLoaded && checked;
  // Hide the splash once the first frame of the real UI has laid out.
  const onLayoutRootView = useCallback(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  // Screens with a navy (bg-strong) header force white status-bar icons
  // regardless of theme; every other screen follows the theme as usual.
  // Keep this list in sync with any screen that renders a bg-strong header.
  // Centralized here (not a local <StatusBar> per screen) because
  // expo-router keeps prior stack screens mounted, so a locally-mounted
  // override on e.g. Home would keep winning even after navigating away.
  const seg = segments as string[];
  // The tabs group's index route collapses to just ["(tabs)"] (no "index"
  // segment) — treat a missing/undefined second segment as index too.
  const lightHeaderScreen =
    (seg[0] === "(tabs)" && (seg[1] === undefined || seg[1] === "index" || seg[1] === "bookings")) ||
    seg[0] === "results" ||
    seg[0] === "trip" ||
    seg[0] === "checkout";

  const dark = colorScheme === "dark";
  const bg = dark ? "#0a0a0b" : "#f8fafc";
  // React Navigation manages the navigator/transition surfaces — give it a
  // matching theme so expo-router screens don't stay light.
  const navTheme = dark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: bg, card: "#161719", text: "#ededf0", border: "#2a2a2f", primary: "#e6bd6e" } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: bg, card: "#ffffff", text: "#14314C", border: "#e2e8f0", primary: "#D9A441" } };

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider value={navTheme}>
            <BottomSheetModalProvider>
              <AuthProvider>
                <SelectionProvider>
                  <StatusBar style={lightHeaderScreen ? "light" : dark ? "light" : "dark"} />
                  <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: bg } }}>
                    <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="results" options={{ presentation: "card" }} />
                    <Stack.Screen name="trip/[id]" options={{ presentation: "card" }} />
                    <Stack.Screen name="checkout" options={{ presentation: "card" }} />
                    <Stack.Screen name="confirmation/[id]" options={{ presentation: "card", gestureEnabled: false }} />
                    <Stack.Screen name="sign-in" options={{ presentation: "modal" }} />
                  </Stack>
                  <PortalHost />
                </SelectionProvider>
              </AuthProvider>
            </BottomSheetModalProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
