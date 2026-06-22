import { Image, Text, View } from "react-native";
import { cn } from "@/lib/cn";

// Deterministic brand-ish color per cooperative (used when no logoUrl/brandColor).
const PALETTE = ["#16266b", "#f5821f", "#62b22e", "#2b6f8f", "#d96d0f"];

function colorFor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return PALETTE[sum % PALETTE.length]!;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0]![0]! + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Cooperative avatar: real logo when available, else a colored monogram tile. */
export function CoopLogo({
  url,
  name = "",
  size = 40,
  brandColor,
  className,
}: {
  url?: string | null;
  name?: string;
  size?: number;
  brandColor?: string | null;
  className?: string;
}) {
  const color = brandColor || colorFor(name);
  return (
    <View
      className={cn("items-center justify-center overflow-hidden rounded-[4px] border border-ink/10", className)}
      style={{ width: size, height: size, backgroundColor: url ? "#eef1f7" : `${color}1A` }}
    >
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text style={{ color, fontSize: size * 0.38 }} className="font-display">
          {initials(name)}
        </Text>
      )}
    </View>
  );
}
