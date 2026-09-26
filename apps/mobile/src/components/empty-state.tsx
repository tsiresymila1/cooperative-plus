import { Frown } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "./ui/text";
import { Button } from "@/components/ui";

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-10 pb-24">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-laterite/10">
        <Frown size={44} color="#D9A441" />
      </View>
      <Text className="mt-5 font-display text-xl text-ink">{title}</Text>
      <Text className="mt-1.5 text-center font-body text-sm text-ink-soft/70">
        {message}
      </Text>
      <Button size="md" className="mt-6 w-full" onPress={onAction}>
        <Text
          className="font-display font-medium text-paper uppercase"
        >
          {actionLabel}&nbsp;
        </Text>
      </Button>
    </View>
  );
}
