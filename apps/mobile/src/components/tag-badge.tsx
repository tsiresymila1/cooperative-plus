import { Text, View } from "react-native";

/** Trip tag badge — white text on the tag's colour. */
export function TagBadge({ name, color }: { name: string; color?: string | null }) {
  return (
    <View style={{ backgroundColor: color || "#14314C" }} className="self-start rounded-[4px] px-2 py-0.5">
      <Text className="font-sans text-[10px] font-bold uppercase text-white">{name}</Text>
    </View>
  );
}
