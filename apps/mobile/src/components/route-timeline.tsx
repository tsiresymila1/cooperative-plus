import { View } from "react-native";
import { Bus, ChevronRight } from "lucide-react-native";
import { cn } from "@/lib/cn";

/** Origin → destination timeline row: dashed line, bus icon in a navy circle. */
export function RouteTimeline({ className }: { className?: string }) {
  return (
    <View className={cn("flex-row items-center gap-1", className)}>
      <View className="h-2 w-2 rounded-full bg-navy" />
      <View
        className="h-px flex-1"
        style={{ borderTopWidth: 1, borderStyle: "dashed", borderColor: "#14314C40" }}
      />
      <View className="h-5 w-5 items-center justify-center rounded-full bg-navy">
        <Bus size={10} color="#ffffff" />
      </View>
      <View
        className="h-px flex-1"
        style={{ borderTopWidth: 1, borderStyle: "dashed", borderColor: "#14314C40" }}
      />
      <ChevronRight size={14} color="#D9A441" />
    </View>
  );
}
