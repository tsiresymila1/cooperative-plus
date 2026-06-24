import { useColorScheme } from "react-native";

/** Theme-aware brand colors for non-className consumers (e.g. lucide icons). */
export function useColors() {
  const colorScheme = useColorScheme();
  return colorScheme === "dark"
    ? { ink: "#ededf0", inkSoft: "#9a9aa3", laterite: "#ff8a33", paper: "#161719", sand: "#0a0a0b", border: "#2a2a2f" }
    : { ink: "#0f2d5c", inkSoft: "#475569", laterite: "#ff7a00", paper: "#ffffff", sand: "#f8fafc", border: "#e2e8f0" };
}
