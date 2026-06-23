import "../global.css";
import "@/lib/default-font";
import { useCallback, useEffect, useState } from "react";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold } from "@expo-google-fonts/montserrat";
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { PortalHost } from "@rn-primitives/portal";
import { AuthProvider } from "@/lib/auth";
import { SelectionProvider } from "@/lib/selection";

const queryClient = new QueryClient();

// Keep the native splash up until fonts + onboarding check are ready.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  const [checked, setChecked] = useState(false);
  const segments = useSegments();

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <AuthProvider>
              <SelectionProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#eef1f7" } }}>
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
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
